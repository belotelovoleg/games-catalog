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
    return null
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; isAdmin: boolean }
    return decoded.isAdmin ? decoded : null
  } catch (error) {
    return null
  }
}

async function fetchGamesFromIGDB(platformId: number): Promise<IGDBGame[]> {
  if (!IGDB_CLIENT_ID) {
    throw new Error('IGDB client ID not configured')
  }
  // Get access token using the token management system
  const accessToken = await getIGDBAccessToken()
  
  const fields = [
    'id',
    'name',
    'rating',
    'storyline',
    'url',
    'cover',
    'screenshots',
    'artworks', // <-- Added artworks field
    'age_ratings',
    'alternative_names',
    'franchise',
    'game_engines',
    'game_type',
    'genres',
    'involved_companies',
    'multiplayer_modes'
  ].join(',')

  let allGames: IGDBGame[] = []
  let offset = 0
  const limit = 500 // IGDB max limit
  while (true) {
    console.log(`Fetching games batch: offset ${offset}, limit ${limit} for platform ${platformId}`)
    
    const body = `fields ${fields}; where platforms = (${platformId}); limit ${limit}; offset ${offset}; sort id asc;`
    
    console.log('IGDB API Request:', {
      url: 'https://api.igdb.com/v4/games',
      method: 'POST',
      headers: {
        'Client-ID': IGDB_CLIENT_ID,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'text/plain'
      },
      body: body
    })

    const response = await fetch('https://api.igdb.com/v4/games', {
      method: 'POST',
      headers: {
        'Client-ID': IGDB_CLIENT_ID,
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'text/plain'
      },
      body
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('IGDB API Error Details:', {
        status: response.status,
        statusText: response.statusText,
        query: body,
        response: errorText
      })
      throw new Error(`IGDB API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const games: IGDBGame[] = await response.json()
    
    if (games.length === 0) {
      console.log('No more games to fetch')
      break
    }

    console.log(`Got ${games.length} games in this batch`)
    allGames.push(...games)

    // If we got fewer games than the limit, we've reached the end
    if (games.length < limit) {
      console.log('Reached end of games data')
      break
    }

    offset += limit

    // Add a small delay to respect IGDB rate limits (4 requests per second)
    await new Promise(resolve => setTimeout(resolve, 250))
  }
  console.log(`Total games fetched: ${allGames.length}`)
  return allGames
}

async function saveGamesToDB(games: IGDBGame[], platformInfo: { id: number, igdbPlatformId?: number | null, igdbPlatformVersionId?: number | null }) {
  let newCount = 0
  let updatedCount = 0
  
  console.log(`Starting database sync for ${games.length} games...`)
  
  // Process games in batches of 100 for better performance
  const batchSize = 100
  for (let i = 0; i < games.length; i += batchSize) {
    const batch = games.slice(i, i + batchSize)
    console.log(`Processing DB batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(games.length / batchSize)}: ${batch.length} games`)
    
    for (const game of batch) {
      const gameData = {
        // Essential game data
        name: game.name,
        rating: game.rating || null,
        storyline: game.storyline || null,
        url: game.url || null,
        
        // Media and images
        cover: game.cover || null,
        screenshots: game.screenshots ? JSON.stringify(game.screenshots) : null,
        artworks: (game as any).artworks ? JSON.stringify((game as any).artworks) : null,
        
        // Game companies and credits
        involved_companies: game.involved_companies ? JSON.stringify(game.involved_companies) : null,
        
        // Game content categorization
        genres: game.genres ? JSON.stringify(game.genres) : null,
        age_ratings: game.age_ratings ? JSON.stringify(game.age_ratings) : null,
        alternative_names: game.alternative_names ? JSON.stringify(game.alternative_names) : null,
        franchise: game.franchise || null,
        game_engines: game.game_engines ? JSON.stringify(game.game_engines) : null,
        game_type: game.game_type || null,
        multiplayer_modes: game.multiplayer_modes ? JSON.stringify(game.multiplayer_modes) : null,
        
        // Sync metadata
        platformId: platformInfo.igdbPlatformId,
        platformVersionId: platformInfo.igdbPlatformVersionId
      }

      try {
        const existingGame = await prisma.igdbGames.findUnique({
          where: { igdbId: game.id }
        })

        if (existingGame) {
          await prisma.igdbGames.update({
            where: { igdbId: game.id },
            data: gameData
          })
          updatedCount++
        } else {
          await prisma.igdbGames.create({
            data: {
              igdbId: game.id,
              ...gameData
            }
          })
          newCount++
        }
      } catch (error) {
        console.error(`Error saving game ${game.id} (${game.name}):`, error)
        // Continue with other games even if one fails
      }
    }
    
    // Small delay between batches to avoid overwhelming the database
    if (i + batchSize < games.length) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
  
  console.log(`Database sync completed: ${newCount} new games, ${updatedCount} updated games`)
  return { newCount, updatedCount }
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

    const { platformId } = await request.json()

    if (!platformId) {
      return NextResponse.json(
        { error: 'Platform ID is required' },
        { status: 400 }
      )
    }

    // Get platform info
    const platform = await prisma.platform.findUnique({
      where: { id: platformId },
      select: {
        id: true,
        name: true,
        versionName: true,
        igdbPlatformId: true,
        igdbPlatformVersionId: true
      }
    })

    if (!platform) {
      return NextResponse.json(
        { error: 'Platform not found' },
        { status: 404 }
      )
    }    if (!platform.igdbPlatformId) {
      return NextResponse.json(
        { error: 'Platform has no IGDB platform ID' },
        { status: 400 }
      )
    }

    // Always use platform ID for games query (not platform version ID)
    // Games in IGDB are associated with platforms, not platform versions
    const igdbPlatformId = platform.igdbPlatformId

    // Fetch games from IGDB
    console.log(`Fetching games for platform ${platform.name} (IGDB ID: ${igdbPlatformId})`)
    const games = await fetchGamesFromIGDB(igdbPlatformId!)    // Save games to database
    const { newCount, updatedCount } = await saveGamesToDB(games, platform)

    const platformName = platform.versionName || platform.name

    return NextResponse.json({
      success: true,
      totalGames: games.length,
      newGames: newCount,
      updatedGames: updatedCount,
      platformName,
      igdbPlatformId,
      usedPlatformId: true
    })

  } catch (error) {
    console.error('Error syncing games:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync games' },
      { status: 500 }
    )
  }
}
