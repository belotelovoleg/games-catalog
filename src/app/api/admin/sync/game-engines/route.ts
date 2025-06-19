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

    console.log('Starting game engines sync...')

    // Fetch all game engines from IGDB with pagination
    let allGameEngines = []
    let offset = 0
    const limit = 500 // IGDB max limit

    while (true) {      console.log(`Fetching game engines batch: offset ${offset}, limit ${limit}`)
      
      const requestBody = `fields name; limit ${limit}; offset ${offset}; sort id asc;`
      
      console.log('IGDB API Request:', {
        url: 'https://api.igdb.com/v4/game_engines',
        method: 'POST',
        headers: {
          'Client-ID': IGDB_CLIENT_ID,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'text/plain'
        },
        body: requestBody
      })
      
      const response = await fetch('https://api.igdb.com/v4/game_engines', {
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

      const gameEngines = await response.json()
      
      if (gameEngines.length === 0) {
        console.log('No more game engines to fetch')
        break
      }

      console.log(`Got ${gameEngines.length} game engines in this batch`)
      allGameEngines.push(...gameEngines)

      // If we got fewer game engines than the limit, we've reached the end
      if (gameEngines.length < limit) {
        console.log('Reached end of game engines data')
        break
      }

      offset += limit

      // Add a small delay to respect IGDB rate limits (4 requests per second)
      await new Promise(resolve => setTimeout(resolve, 250))
    }    console.log(`Total game engines fetched: ${allGameEngines.length}`)
    const gameEngines = allGameEngines
    
    let newCount = 0
    let updatedCount = 0
    let processedCount = 0

    // Process in batches to avoid overwhelming the database
    const BATCH_SIZE = 100
    const batches = []
    for (let i = 0; i < gameEngines.length; i += BATCH_SIZE) {
      batches.push(gameEngines.slice(i, i + BATCH_SIZE))
    }

    for (const batch of batches) {
      // Get existing game engines for this batch
      const existingEngines = await prisma.igdbGameEngines.findMany({
        where: {
          igdbId: {
            in: batch.map(e => e.id)
          }
        }
      })

      const existingIds = new Set(existingEngines.map(e => e.igdbId))

      // Prepare update and create operations
      const toUpdate = batch.filter(e => existingIds.has(e.id))
      const toCreate = batch.filter(e => !existingIds.has(e.id))

      // Batch updates
      for (const engine of toUpdate) {
        await prisma.igdbGameEngines.update({
          where: { igdbId: engine.id },
          data: {
            name: engine.name || ''
          }
        })
        updatedCount++
      }

      // Batch creates
      if (toCreate.length > 0) {
        await prisma.igdbGameEngines.createMany({
          data: toCreate.map(engine => ({
            igdbId: engine.id,
            name: engine.name || ''
          }))
        })
        newCount += toCreate.length
      }

      processedCount += batch.length
      console.log(`Processed batch: ${toUpdate.length} updated, ${toCreate.length} created (${processedCount} of ${gameEngines.length})`)
    }

    return NextResponse.json({
      success: true,
      totalSynced: gameEngines.length,
      new: newCount,
      updated: updatedCount,
      message: `Game engines sync completed`
    })

  } catch (error) {
    console.error('Error syncing game engines:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync game engines' },
      { status: 500 }
    )
  }
}
