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
      // If no JSON body, that's fine - sync all age ratings
    }

    const accessToken = await getIGDBAccessToken()

    // Build query conditions based on platform selection
    let gameQuery: any = {
      age_ratings: { not: null }, // Games that have age rating IDs in IGDB
    }

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
        ...gameQuery,
        OR: [
          platform.igdbPlatformId ? { platformId: platform.igdbPlatformId } : {},
          platform.igdbPlatformVersionId ? { platformVersionId: platform.igdbPlatformVersionId } : {}
        ].filter(condition => Object.keys(condition).length > 0)
      }

      console.log(`Syncing age ratings for platform: ${platform.name} (IGDB Platform ID: ${platform.igdbPlatformId}, Version ID: ${platform.igdbPlatformVersionId})`)
    }

    const gamesNeedingAgeRatings = await prisma.igdbGames.findMany({
      where: gameQuery,
      select: { age_ratings: true }
    })

    // Extract all age rating IDs from all games
    const allAgeRatingIds = new Set<number>()
    for (const game of gamesNeedingAgeRatings) {
      if (game.age_ratings) {
        try {
          const ageRatingIds = JSON.parse(game.age_ratings)
          if (Array.isArray(ageRatingIds)) {
            ageRatingIds.forEach(id => allAgeRatingIds.add(id))
          }
        } catch (error) {
          // Skip invalid JSON
        }
      }
    }

    // Filter out age ratings we already have
    const existingAgeRatings = await prisma.igdbAgeRatings.findMany({
      select: { igdbId: true }
    })
    const existingIds = new Set(existingAgeRatings.map(r => r.igdbId))
    
    const ageRatingIdsToFetch = Array.from(allAgeRatingIds).filter(id => !existingIds.has(id))
    
    if (ageRatingIdsToFetch.length === 0) {
      return NextResponse.json({
        success: true,
        totalSynced: 0,
        new: 0,
        updated: 0,
        message: 'No new age ratings to sync'
      })
    }

    console.log(`Found ${ageRatingIdsToFetch.length} age ratings to sync`)

    // Fetch age ratings from IGDB with pagination
    const allAgeRatings = []
    const batchSize = 500 // IGDB max limit for where clause with IDs
    
    for (let i = 0; i < ageRatingIdsToFetch.length; i += batchSize) {
      const batchIds = ageRatingIdsToFetch.slice(i, i + batchSize)
      const ageRatingIdsString = batchIds.join(',')
      console.log(`Fetching age ratings batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(ageRatingIdsToFetch.length / batchSize)}: ${batchIds.length} age ratings`)
      
      const requestBody = `fields rating_category; where id = (${ageRatingIdsString}); limit 500;`
      
      console.log('IGDB API Request:', {
        url: 'https://api.igdb.com/v4/age_ratings',
        method: 'POST',
        headers: {
          'Client-ID': IGDB_CLIENT_ID,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'text/plain'
        },
        body: requestBody
      })
      
      const response = await fetch('https://api.igdb.com/v4/age_ratings', {
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
      }      const ageRatings = await response.json()
      console.log(`Got ${ageRatings.length} age ratings in this batch`)
      allAgeRatings.push(...ageRatings)      // Add a small delay to respect IGDB rate limits (4 requests per second)
      if (i + batchSize < ageRatingIdsToFetch.length) {
        await new Promise(resolve => setTimeout(resolve, 250))
      }
    }

    console.log(`Total age ratings fetched: ${allAgeRatings.length}`)
    const ageRatings = allAgeRatings
    
    let newCount = 0
    let updatedCount = 0

    for (const rating of ageRatings) {
      const existingRating = await prisma.igdbAgeRatings.findUnique({
        where: { igdbId: rating.id }
      })

      if (existingRating) {        await prisma.igdbAgeRatings.update({
          where: { igdbId: rating.id },
          data: {
            rating_category: rating.rating_category || null
          }
        })
        updatedCount++
      } else {        await prisma.igdbAgeRatings.create({
          data: {
            igdbId: rating.id,
            rating_category: rating.rating_category || null
          }
        })
        newCount++
      }
    }

    return NextResponse.json({
      success: true,
      totalSynced: ageRatings.length,
      new: newCount,
      updated: updatedCount,
      message: `Age ratings sync completed for ${ageRatingIdsToFetch.length} age rating IDs${platformId ? ` (platform ${platformId})` : ' (all platforms)'}, processed ${ageRatings.length} age ratings`
    })

  } catch (error) {
    console.error('Error syncing age ratings:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync age ratings' },
      { status: 500 }
    )
  }
}
