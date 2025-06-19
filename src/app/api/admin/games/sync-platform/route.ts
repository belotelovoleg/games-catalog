import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getIGDBAccessToken } from '@/lib/igdb-token'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key'
const IGDB_CLIENT_ID = process.env.IGDB_CLIENT_ID

interface IGDBGame {
  id: number
  name: string
  slug?: string
  summary?: string
  storyline?: string
  url?: string
  cover?: number
  platforms?: number[]
  screenshots?: number[]
  involved_companies?: number[]
  genres?: number[]
  age_ratings?: number[]
  alternative_names?: number[]
  franchise?: number
  franchises?: number[]
  game_engines?: number[]
  game_type?: number
  multiplayer_modes?: number[]
  release_dates?: number[]
  rating?: number
}

async function verifyAdmin(req: Request) {
  let token = null
  
  // Check Authorization header first (Bearer token)
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  }
  
  // If no Bearer token, check cookies
  if (!token) {
    const cookieHeader = req.headers.get('cookie')
    if (cookieHeader) {
      // Parse cookies properly: "token=abc123; other=value"
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
    return false
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    return decoded.isAdmin === true
  } catch (error) {
    console.error('JWT verification error:', error)
    return false
  }
}

async function fetchAndSaveGamesFromIGDB(platformId: number, platformInfo: { id: number, igdbPlatformId?: number | null, igdbPlatformVersionId?: number | null }) {
  console.log(`Starting to fetch and save games for IGDB platform ID: ${platformId}`)
  
  const token = await getIGDBAccessToken()
  
  let totalNewGames = 0
  let totalUpdatedGames = 0
  let totalProcessed = 0
  let offset = 0
  const limit = 500 // IGDB's maximum
  // Fields that exist in both IGDBGame interface and Prisma schema - ONLY REQUIRED FIELDS
  const fields = 'id,name,rating,storyline,url,cover,screenshots,age_ratings,alternative_names,franchise,game_engines,game_type,genres,involved_companies,multiplayer_modes'

  while (true) {
    console.log(`Fetching games batch: offset ${offset}, limit ${limit} for platform ${platformId}`)
    
    const body = `fields ${fields}; where platforms = (${platformId}); limit ${limit}; offset ${offset}; sort id asc;`
    
    console.log('IGDB API Request:', {
      url: 'https://api.igdb.com/v4/games',
      method: 'POST',
      headers: {
        'Client-ID': IGDB_CLIENT_ID!,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body
    });

    const response = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': IGDB_CLIENT_ID!,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body,
    })

    if (!response.ok) {
      throw new Error(`IGDB API error: ${response.status} ${response.statusText}`)
    }

    const games: IGDBGame[] = await response.json()
    
    if (games.length === 0) {
      break
    }

    console.log(`Fetched ${games.length} games, now saving batch to database...`)

    // Save this batch to database immediately
    const { newGames, updatedGames } = await saveGamesBatch(games, platformInfo)
    totalNewGames += newGames
    totalUpdatedGames += updatedGames
    totalProcessed += games.length

    console.log(`Batch saved: ${newGames} new, ${updatedGames} updated (Total processed: ${totalProcessed})`)

    if (games.length < limit) {
      break
    }

    offset += limit
    
    // Rate limiting: IGDB allows 4 requests per second
    await new Promise(resolve => setTimeout(resolve, 250))
  }

  console.log(`All games processed: ${totalProcessed} total, ${totalNewGames} new, ${totalUpdatedGames} updated`)
  return { totalGames: totalProcessed, newGames: totalNewGames, updatedGames: totalUpdatedGames }
}

async function saveGamesBatch(games: IGDBGame[], platformInfo: { id: number, igdbPlatformId?: number | null, igdbPlatformVersionId?: number | null }) {
  let newGames = 0
  let updatedGames = 0
  for (const game of games) {
    try {      const existingGame = await prisma.igdbGames.findUnique({
        where: { igdbId: game.id }
      })

      const gameData = {
        igdbId: game.id,
        name: game.name,
        rating: game.rating || null,
        storyline: game.storyline || null,
        url: game.url || null,
        cover: game.cover || null,
        screenshots: game.screenshots ? JSON.stringify(game.screenshots) : null,
        involved_companies: game.involved_companies ? JSON.stringify(game.involved_companies) : null,
        genres: game.genres ? JSON.stringify(game.genres) : null,
        age_ratings: game.age_ratings ? JSON.stringify(game.age_ratings) : null,
        alternative_names: game.alternative_names ? JSON.stringify(game.alternative_names) : null,
        franchise: game.franchise || null,
        game_engines: game.game_engines ? JSON.stringify(game.game_engines) : null,
        game_type: game.game_type || null,
        multiplayer_modes: game.multiplayer_modes ? JSON.stringify(game.multiplayer_modes) : null,
        platformId: platformInfo.igdbPlatformId,
        platformVersionId: platformInfo.igdbPlatformVersionId
      }

      if (existingGame) {
        await prisma.igdbGames.update({
          where: { igdbId: game.id },
          data: gameData
        })
        updatedGames++
      } else {
        await prisma.igdbGames.create({
          data: gameData
        })
        newGames++
      }
    } catch (error) {
      console.error(`Error saving game ${game.id}:`, error)
    }
  }

  return { newGames, updatedGames }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const isAdmin = await verifyAdmin(request)
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    const { platformId } = await request.json()

    if (!platformId) {
      return NextResponse.json(
        { error: 'Platform ID is required' },
        { status: 400 }
      )
    }

    // Get platform info from database
    const platform = await prisma.platform.findUnique({
      where: { id: platformId },
      select: {
        id: true,
        name: true,
        igdbPlatformId: true,
        igdbPlatformVersionId: true
      }
    })

    if (!platform) {
      return NextResponse.json(
        { error: 'Platform not found' },
        { status: 404 }
      )
    }

    // Check if platform has an IGDB Platform ID (not Platform Version)
    if (!platform.igdbPlatformId) {
      return NextResponse.json(
        { error: `Platform ${platform.name} does not have an IGDB Platform ID` },
        { status: 400 }
      )
    }

    // Use IGDB Platform ID specifically (not Platform Version)
    const igdbPlatformId = platform.igdbPlatformId
      console.log(`Fetching and saving games for platform ${platform.name} using IGDB Platform ID: ${igdbPlatformId}`)
    const { totalGames, newGames, updatedGames } = await fetchAndSaveGamesFromIGDB(igdbPlatformId, {
      id: platform.id,
      igdbPlatformId: platform.igdbPlatformId,
      igdbPlatformVersionId: platform.igdbPlatformVersionId
    })

    return NextResponse.json({
      success: true,
      message: `Games sync completed for platform ${platform.name}`,
      platformName: platform.name,
      totalGames,
      newGames,
      updatedGames,
      igdbPlatformId: igdbPlatformId,
      syncType: 'platform'
    })

  } catch (error) {
    console.error('Games sync error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    )
  }
}
