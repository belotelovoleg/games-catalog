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

    const accessToken = await getIGDBAccessToken()    // Get all games we have that don't have screenshots synced yet
    const gamesNeedingScreenshots = await prisma.igdbGames.findMany({
      where: {
        screenshots: { not: null }, // Games that have screenshot IDs in IGDB
      },
      select: { screenshots: true }
    })

    // Extract all screenshot IDs from all games
    const allScreenshotIds = new Set<number>()
    for (const game of gamesNeedingScreenshots) {
      if (game.screenshots) {
        try {
          const screenshotIds = JSON.parse(game.screenshots)
          if (Array.isArray(screenshotIds)) {
            screenshotIds.forEach(id => allScreenshotIds.add(id))
          }
        } catch (error) {
          // Skip invalid JSON
        }
      }
    }

    // Filter out screenshots we already have
    const existingScreenshots = await prisma.igdbScreenshots.findMany({
      select: { igdbId: true }
    })
    const existingIds = new Set(existingScreenshots.map(s => s.igdbId))
    
    const screenshotIdsToFetch = Array.from(allScreenshotIds).filter(id => !existingIds.has(id))
    
    if (screenshotIdsToFetch.length === 0) {
      return NextResponse.json({
        success: true,
        totalSynced: 0,
        new: 0,
        updated: 0,
        message: 'No new screenshots to sync'
      })
    }    console.log(`Found ${screenshotIdsToFetch.length} screenshots to sync`)

    // Fetch and save screenshots in batches to avoid memory issues
    let totalNewCount = 0
    let totalUpdatedCount = 0
    let totalProcessed = 0
    const batchSize = 500 // IGDB max limit for where clause with IDs
    
    for (let i = 0; i < screenshotIdsToFetch.length; i += batchSize) {
      const batchIds = screenshotIdsToFetch.slice(i, i + batchSize)
      const screenshotIdsString = batchIds.join(',')
      console.log(`Fetching screenshots batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(screenshotIdsToFetch.length / batchSize)}: ${batchIds.length} screenshots`)
      
      const requestBody = `fields height, image_id, url, width, game; where id = (${screenshotIdsString}); limit 500;`
      
      console.log('IGDB API Request:', {
        url: 'https://api.igdb.com/v4/screenshots',
        method: 'POST',
        headers: {
          'Client-ID': IGDB_CLIENT_ID,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'text/plain'
        },
        body: requestBody
      })
      
      const response = await fetch('https://api.igdb.com/v4/screenshots', {
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

      const screenshots = await response.json()
      console.log(`Fetched ${screenshots.length} screenshots, now saving batch to database...`)

      // Process this batch immediately
      let newCount = 0
      let updatedCount = 0

      for (const screenshot of screenshots) {
        try {
          const existingScreenshot = await prisma.igdbScreenshots.findUnique({
            where: { igdbId: screenshot.id }
          })

          if (existingScreenshot) {
            await prisma.igdbScreenshots.update({
              where: { igdbId: screenshot.id },
              data: {
                height: screenshot.height || null,
                image_id: screenshot.image_id || null,
                url: screenshot.url || null,
                width: screenshot.width || null
              }
            })
            updatedCount++
          } else {
            await prisma.igdbScreenshots.create({
              data: {
                igdbId: screenshot.id,
                height: screenshot.height || null,
                image_id: screenshot.image_id || null,
                url: screenshot.url || null,
                width: screenshot.width || null
              }
            })
            newCount++
          }
        } catch (error) {
          console.error(`Error saving screenshot ${screenshot.id}:`, error)
        }
      }

      totalNewCount += newCount
      totalUpdatedCount += updatedCount
      totalProcessed += screenshots.length

      console.log(`Batch saved: ${newCount} new, ${updatedCount} updated (Total processed: ${totalProcessed})`)

      // Add a small delay to respect IGDB rate limits (4 requests per second)
      if (i + batchSize < screenshotIdsToFetch.length) {
        await new Promise(resolve => setTimeout(resolve, 250))
      }
    }

    console.log(`All screenshots processed: ${totalProcessed} total, ${totalNewCount} new, ${totalUpdatedCount} updated`)

    return NextResponse.json({
      success: true,
      totalSynced: totalProcessed,
      new: totalNewCount,
      updated: totalUpdatedCount,
      message: `Screenshots sync completed for ${screenshotIdsToFetch.length} screenshot IDs, processed ${totalProcessed} screenshots`
    })

  } catch (error) {
    console.error('Error syncing screenshots:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync screenshots' },
      { status: 500 }
    )
  }
}
