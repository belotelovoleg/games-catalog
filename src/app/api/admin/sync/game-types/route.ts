import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getIGDBAccessToken } from '@/lib/igdb-token'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key'
const IGDB_CLIENT_ID = process.env.IGDB_CLIENT_ID

async function verifyAdmin(req: Request) {
  let token = null
  
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  }
  
  if (!token) {
    const cookieHeader = req.headers.get('cookie')
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=')
        if (key && value) {
          acc[key] = value
        }
        return acc
      }, {} as Record<string, string>)
      
      token = cookies.token
    }
  }
  
  if (!token) {
    return null
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; isAdmin: boolean }
    return decoded.isAdmin ? decoded : null
  } catch (error) {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request)
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin authentication required' },
        { status: 401 }
      )
    }

    if (!IGDB_CLIENT_ID) {
      return NextResponse.json(
        { error: 'IGDB client ID not configured' },
        { status: 500 }
      )
    }    const accessToken = await getIGDBAccessToken()

    console.log('Starting game types sync...')

    // Fetch all game types from IGDB with pagination
    let allGameTypes = []
    let offset = 0
    const limit = 500 // IGDB max limit

    while (true) {      console.log(`Fetching game types batch: offset ${offset}, limit ${limit}`)
      
      const requestBody = `fields type; limit ${limit}; offset ${offset}; sort id asc;`
      
      console.log('IGDB API Request:', {
        url: 'https://api.igdb.com/v4/game_types',
        method: 'POST',
        headers: {
          'Client-ID': IGDB_CLIENT_ID,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'text/plain'
        },
        body: requestBody
      })
      
      const response = await fetch('https://api.igdb.com/v4/game_types', {
        method: 'POST',
        headers: {
          'Client-ID': IGDB_CLIENT_ID,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'text/plain'
        },
        body: requestBody
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('IGDB API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          response: errorText
        })
        throw new Error(`IGDB API error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const gameTypes = await response.json()
      
      if (gameTypes.length === 0) {
        console.log('No more game types to fetch')
        break
      }

      console.log(`Got ${gameTypes.length} game types in this batch`)
      allGameTypes.push(...gameTypes)

      // If we got fewer game types than the limit, we've reached the end
      if (gameTypes.length < limit) {
        console.log('Reached end of game types data')
        break
      }

      offset += limit

      // Add a small delay to respect IGDB rate limits (4 requests per second)
      await new Promise(resolve => setTimeout(resolve, 250))
    }    console.log(`Total game types fetched: ${allGameTypes.length}`)
    const gameTypes = allGameTypes
    
    let newCount = 0
    let updatedCount = 0
    let processedCount = 0

    // Process in batches to avoid overwhelming the database
    const BATCH_SIZE = 100
    const batches = []
    for (let i = 0; i < gameTypes.length; i += BATCH_SIZE) {
      batches.push(gameTypes.slice(i, i + BATCH_SIZE))
    }

    for (const batch of batches) {
      // Get existing game types for this batch
      const existingTypes = await prisma.igdbGameTypes.findMany({
        where: {
          igdbId: {
            in: batch.map(t => t.id)
          }
        }
      })

      const existingIds = new Set(existingTypes.map(t => t.igdbId))

      // Prepare update and create operations
      const toUpdate = batch.filter(t => existingIds.has(t.id))
      const toCreate = batch.filter(t => !existingIds.has(t.id))

      // Batch updates
      for (const gameType of toUpdate) {
        await prisma.igdbGameTypes.update({
          where: { igdbId: gameType.id },
          data: {
            type: gameType.type || ''
          }
        })
        updatedCount++
      }

      // Batch creates
      if (toCreate.length > 0) {
        await prisma.igdbGameTypes.createMany({
          data: toCreate.map(gameType => ({
            igdbId: gameType.id,
            type: gameType.type || ''
          }))
        })
        newCount += toCreate.length
      }

      processedCount += batch.length
      console.log(`Processed batch: ${toUpdate.length} updated, ${toCreate.length} created (${processedCount} of ${gameTypes.length})`)
    }

    return NextResponse.json({
      success: true,
      totalSynced: gameTypes.length,
      new: newCount,
      updated: updatedCount,
      message: `Game types sync completed`
    })

  } catch (error) {
    console.error('Error syncing game types:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync game types' },
      { status: 500 }
    )
  }
}
