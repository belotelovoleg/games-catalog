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

    // Parse request body to get optional platformId
    let platformId: number | undefined
    try {
      const body = await request.json()
      platformId = body.platformId
    } catch (error) {
      // If no JSON body, that's fine - sync all multiplayer modes
    }

    const accessToken = await getIGDBAccessToken()
    
    // Build query conditions based on platform selection
    let gameQuery: any = {}

    // If platformId is provided, filter games by platform
    if (platformId) {
      const platform = await prisma.platform.findUnique({ 
        where: { id: platformId },
        select: { igdbPlatformId: true, igdbPlatformVersionId: true, name: true }
      })
      
      if (!platform) {
        return NextResponse.json(
          { error: 'Platform not found' },
          { status: 404 }
        )
      }

      // Filter games by platform
      gameQuery = {
        OR: [
          platform.igdbPlatformId ? { platformId: platform.igdbPlatformId } : {},
          platform.igdbPlatformVersionId ? { platformVersionId: platform.igdbPlatformVersionId } : {}
        ].filter(condition => Object.keys(condition).length > 0)
      }

      console.log(`Syncing multiplayer modes for platform: ${platform.name} (IGDB Platform ID: ${platform.igdbPlatformId}, Version ID: ${platform.igdbPlatformVersionId})`)
    }

    // Get all games we have in our DB to limit the sync scope
    const ourGames = await prisma.igdbGames.findMany({
      where: gameQuery,
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
        message: 'No games in database to sync multiplayer modes for'
      })
    }

    console.log(`Found ${gameIds.length} games to sync multiplayer modes for`)

    // Fetch multiplayer modes for our games from IGDB with pagination
    const allMultiplayerModes = []
    const batchSize = 500 // IGDB max limit for where clause with IDs
    
    for (let i = 0; i < gameIds.length; i += batchSize) {
      const batchIds = gameIds.slice(i, i + batchSize)
      const gameIdsString = batchIds.join(',')
        console.log(`Fetching multiplayer modes batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(gameIds.length / batchSize)}: ${batchIds.length} games`)
      
      const requestBody = `fields lancoop, offlinecoop, offlinecoopmax, offlinemax, onlinecoop, onlinecoopmax, onlinemax, splitscreen, splitscreenonline, game; where game = (${gameIdsString}); limit 500;`
      
      console.log('IGDB API Request:', {
        url: 'https://api.igdb.com/v4/multiplayer_modes',
        method: 'POST',
        headers: {
          'Client-ID': IGDB_CLIENT_ID,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'text/plain'
        },
        body: requestBody
      })
      
      const response = await fetch('https://api.igdb.com/v4/multiplayer_modes', {
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

      const multiplayerModes = await response.json()
      console.log(`Got ${multiplayerModes.length} multiplayer modes in this batch`)
      allMultiplayerModes.push(...multiplayerModes)

      // Add a small delay to respect IGDB rate limits (4 requests per second)
      if (i + batchSize < gameIds.length) {
        await new Promise(resolve => setTimeout(resolve, 250))
      }
    }

    console.log(`Total multiplayer modes fetched: ${allMultiplayerModes.length}`)
    const multiplayerModes = allMultiplayerModes
    
    let newCount = 0
    let updatedCount = 0
    const BATCH_DB_SIZE = 100
    // Find all existing IDs
    const allIds = multiplayerModes.map((m: any) => m.id)
    const existing = await prisma.igdbMultiplayerModes.findMany({
      where: { igdbId: { in: allIds } },
      select: { igdbId: true }
    })
    const existingIds = new Set(existing.map(m => m.igdbId))
    const toCreate = multiplayerModes.filter((m: any) => !existingIds.has(m.id))
    const toUpdate = multiplayerModes.filter((m: any) => existingIds.has(m.id))
    // Batch create
    for (let i = 0; i < toCreate.length; i += BATCH_DB_SIZE) {
      const batch = toCreate.slice(i, i + BATCH_DB_SIZE)
      if (batch.length > 0) {
        await prisma.igdbMultiplayerModes.createMany({
          data: batch.map((mode: any) => ({
            igdbId: mode.id,
            lancoop: mode.lancoop || null,
            offlinecoop: mode.offlinecoop || null,
            offlinecoopmax: mode.offlinecoopmax || null,
            offlinemax: mode.offlinemax || null,
            onlinecoop: mode.onlinecoop || null,
            onlinecoopmax: mode.onlinecoopmax || null,
            onlinemax: mode.onlinemax || null,
            splitscreen: mode.splitscreen || null,
            splitscreenonline: mode.splitscreenonline || null
          })),
          skipDuplicates: true
        })
        newCount += batch.length
      }
    }
    // Batch update
    for (let i = 0; i < toUpdate.length; i += BATCH_DB_SIZE) {
      const batch = toUpdate.slice(i, i + BATCH_DB_SIZE)
      await Promise.all(batch.map(async (mode: any) => {
        try {
          await prisma.igdbMultiplayerModes.update({
            where: { igdbId: mode.id },
            data: {
              lancoop: mode.lancoop || null,
              offlinecoop: mode.offlinecoop || null,
              offlinecoopmax: mode.offlinecoopmax || null,
              offlinemax: mode.offlinemax || null,
              onlinecoop: mode.onlinecoop || null,
              onlinecoopmax: mode.onlinecoopmax || null,
              onlinemax: mode.onlinemax || null,
              splitscreen: mode.splitscreen || null,
              splitscreenonline: mode.splitscreenonline || null
            }
          })
          updatedCount++
        } catch (error) {
          console.error(`Error updating multiplayer mode ${mode.id}:`, error)
        }
      }))
    }

    return NextResponse.json({
      success: true,
      totalSynced: multiplayerModes.length,
      new: newCount,
      updated: updatedCount,
      message: `Multiplayer modes sync completed for ${gameIds.length} games`
    })

  } catch (error) {
    console.error('Error syncing multiplayer modes:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync multiplayer modes' },
      { status: 500 }
    )
  }
}
