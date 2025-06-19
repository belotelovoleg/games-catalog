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
    }

    const accessToken = await getIGDBAccessToken()    // Get all games we have in our DB to limit the sync scope
    const ourGames = await prisma.igdbGames.findMany({
      select: { igdbId: true },
      distinct: ['igdbId']
    })

    const gameIds = ourGames.map(g => g.igdbId)
    
    if (gameIds.length === 0) {
      return NextResponse.json({
        success: true,
        totalSynced: 0,
        new: 0,
        updated: 0,
        message: 'No games in database to sync alternative names for'
      })
    }    console.log(`Found ${gameIds.length} games to sync alternative names for`)

    // Fetch and save alternative names in batches to avoid memory issues  
    let totalNewCount = 0
    let totalUpdatedCount = 0
    let totalProcessed = 0
    const batchSize = 500 // IGDB max limit for where clause with IDs
    
    for (let i = 0; i < gameIds.length; i += batchSize) {
      const batchIds = gameIds.slice(i, i + batchSize)
      const gameIdsString = batchIds.join(',')
      console.log(`Fetching alternative names batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(gameIds.length / batchSize)}: ${batchIds.length} games`)
      
      const requestBody = `fields name, game; where game = (${gameIdsString}); limit 500;`
      
      console.log('IGDB API Request:', {
        url: 'https://api.igdb.com/v4/alternative_names',
        method: 'POST',
        headers: {
          'Client-ID': IGDB_CLIENT_ID,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'text/plain'
        },
        body: requestBody
      })
      
      const response = await fetch('https://api.igdb.com/v4/alternative_names', {
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

      const alternativeNames = await response.json()
      console.log(`Fetched ${alternativeNames.length} alternative names, now saving batch to database...`)

      // Process this batch immediately
      let newCount = 0
      let updatedCount = 0

      for (const altName of alternativeNames) {
        try {          const existingAltName = await prisma.igdbAlternativeNames.findUnique({
            where: { igdbId: altName.id }
          })

          if (existingAltName) {
            await prisma.igdbAlternativeNames.update({
              where: { igdbId: altName.id },
              data: {
                name: altName.name || ''
              }
            })
            updatedCount++
          } else {
            await prisma.igdbAlternativeNames.create({
              data: {
                igdbId: altName.id,
                name: altName.name || ''
              }
            })
            newCount++
          }
        } catch (error) {
          console.error(`Error saving alternative name ${altName.id}:`, error)
        }
      }

      totalNewCount += newCount
      totalUpdatedCount += updatedCount
      totalProcessed += alternativeNames.length

      console.log(`Batch saved: ${newCount} new, ${updatedCount} updated (Total processed: ${totalProcessed})`)

      // Add a small delay to respect IGDB rate limits (4 requests per second)
      if (i + batchSize < gameIds.length) {
        await new Promise(resolve => setTimeout(resolve, 250))
      }
    }

    console.log(`All alternative names processed: ${totalProcessed} total, ${totalNewCount} new, ${totalUpdatedCount} updated`)

    return NextResponse.json({
      success: true,
      totalSynced: totalProcessed,
      new: totalNewCount,
      updated: totalUpdatedCount,
      message: `Alternative names sync completed for ${gameIds.length} games, processed ${totalProcessed} alternative names`
    })

  } catch (error) {
    console.error('Error syncing alternative names:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync alternative names' },
      { status: 500 }
    )
  }
}
