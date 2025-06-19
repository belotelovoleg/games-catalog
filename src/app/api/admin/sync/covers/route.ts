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

    const accessToken = await getIGDBAccessToken()    // Get all games we have that don't have covers synced yet
    const gamesNeedingCovers = await prisma.igdbGames.findMany({
      where: {
        cover: { not: null }, // Games that have a cover ID in IGDB
        NOT: {
          cover: {
            in: await prisma.igdbCovers.findMany({
              select: { igdbId: true }
            }).then(covers => covers.map(c => c.igdbId))
          }
        }
      },
      select: { cover: true },
      distinct: ['cover']
    })

    const coverIds = gamesNeedingCovers.map(g => g.cover).filter(Boolean)
    
    if (coverIds.length === 0) {
      return NextResponse.json({
        success: true,
        totalSynced: 0,
        new: 0,
        updated: 0,
        message: 'No new covers to sync'
      })
    }    console.log(`Found ${coverIds.length} covers to sync`)

    // Fetch and save covers in batches to avoid memory issues
    let totalNewCount = 0
    let totalUpdatedCount = 0
    let totalProcessed = 0
    const batchSize = 500 // IGDB max limit for where clause with IDs
    
    for (let i = 0; i < coverIds.length; i += batchSize) {
      const batchIds = coverIds.slice(i, i + batchSize)
      const coverIdsString = batchIds.join(',')
      console.log(`Fetching covers batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(coverIds.length / batchSize)}: ${batchIds.length} covers`)
      
      const requestBody = `fields game, height, image_id, url, width; where id = (${coverIdsString}); limit 500;`
      
      console.log('IGDB API Request:', {
        url: 'https://api.igdb.com/v4/covers',
        method: 'POST',
        headers: {
          'Client-ID': IGDB_CLIENT_ID,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'text/plain'
        },
        body: requestBody
      })
      
      const response = await fetch('https://api.igdb.com/v4/covers', {
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

      const covers = await response.json()
      console.log(`Fetched ${covers.length} covers, now saving batch to database...`)

      // Process this batch immediately
      let newCount = 0
      let updatedCount = 0

      for (const cover of covers) {
        try {
          const existingCover = await prisma.igdbCovers.findUnique({
            where: { igdbId: cover.id }
          })

          if (existingCover) {
            await prisma.igdbCovers.update({
              where: { igdbId: cover.id },
              data: {
                height: cover.height || null,
                image_id: cover.image_id || null,
                url: cover.url || null,
                width: cover.width || null
              }
            })
            updatedCount++
          } else {
            await prisma.igdbCovers.create({
              data: {
                igdbId: cover.id,
                height: cover.height || null,
                image_id: cover.image_id || null,
                url: cover.url || null,
                width: cover.width || null
              }
            })
            newCount++
          }
        } catch (error) {
          console.error(`Error saving cover ${cover.id}:`, error)
        }
      }

      totalNewCount += newCount
      totalUpdatedCount += updatedCount
      totalProcessed += covers.length

      console.log(`Batch saved: ${newCount} new, ${updatedCount} updated (Total processed: ${totalProcessed})`)

      // Add a small delay to respect IGDB rate limits (4 requests per second)
      if (i + batchSize < coverIds.length) {
        await new Promise(resolve => setTimeout(resolve, 250))
      }
    }    console.log(`All covers processed: ${totalProcessed} total, ${totalNewCount} new, ${totalUpdatedCount} updated`)

    return NextResponse.json({
      success: true,
      totalSynced: totalProcessed,
      new: totalNewCount,
      updated: totalUpdatedCount,
      message: `Covers sync completed for ${coverIds.length} cover IDs, processed ${totalProcessed} covers`
    })

  } catch (error) {
    console.error('Error syncing covers:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync covers' },
      { status: 500 }
    )
  }
}
