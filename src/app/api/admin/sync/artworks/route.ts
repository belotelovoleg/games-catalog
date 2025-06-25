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
        if (key && value) acc[key] = value
        return acc
      }, {} as Record<string, string>)
      token = cookies.token
    }
  }
  if (!token) return null
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
      return NextResponse.json({ error: 'Admin authentication required' }, { status: 401 })
    }
    if (!IGDB_CLIENT_ID) {
      return NextResponse.json({ error: 'IGDB client ID not configured' }, { status: 500 })
    }
    // Parse request body to get optional platformId
    let platformId: number | undefined
    try {
      const body = await request.json()
      platformId = body.platformId
    } catch (error) {}
    const accessToken = await getIGDBAccessToken()
    // Build query conditions based on platform selection
    let gameQuery: any = { artworks: { not: null } }
    if (platformId) {
      const platform = await prisma.platform.findUnique({
        where: { id: platformId },
        select: { igdbPlatformId: true, igdbPlatformVersionId: true, name: true }
      })
      if (!platform) {
        return NextResponse.json({ error: 'Platform not found' }, { status: 404 })
      }
      gameQuery = {
        ...gameQuery,
        OR: [
          platform.igdbPlatformId ? { platformId: platform.igdbPlatformId } : {},
          platform.igdbPlatformVersionId ? { platformVersionId: platform.igdbPlatformVersionId } : {}
        ].filter(condition => Object.keys(condition).length > 0)
      }
      console.log(`Syncing artworks for platform: ${platform.name} (IGDB Platform ID: ${platform.igdbPlatformId}, Version ID: ${platform.igdbPlatformVersionId})`)
    }
    // Get all games we have that have artworks
    const gamesWithArtworks = await prisma.igdbGames.findMany({
      where: gameQuery,
      select: { artworks: true }
    })
    // Extract all artwork IDs from all games
    const allArtworkIds = new Set<number>()
    for (const game of gamesWithArtworks) {
      if (game.artworks) {
        try {
          const artworkIds = JSON.parse(game.artworks as string)
          if (Array.isArray(artworkIds)) {
            artworkIds.forEach((id: number) => allArtworkIds.add(id))
          }
        } catch (error) {}
      }
    }
    const artworkIds = Array.from(allArtworkIds)
    if (artworkIds.length === 0) {
      return NextResponse.json({ success: true, totalSynced: 0, new: 0, updated: 0, message: 'No artworks to sync' })
    }
    // Exclude already synced artworks
    const existing = await prisma.igdbArtworks.findMany({ select: { igdbId: true } })
    const existingIds = new Set(existing.map((a: { igdbId: number }) => a.igdbId))
    const toFetch = artworkIds.filter(id => !existingIds.has(id))
    if (toFetch.length === 0) {
      return NextResponse.json({ success: true, totalSynced: 0, new: 0, updated: 0, message: 'All artworks already synced' })
    }
    console.log(`Found ${toFetch.length} artworks to sync`)
    // Fetch and save artworks in batches
    let totalNewCount = 0
    let totalProcessed = 0
    const BATCH_SIZE = 100
    for (let i = 0; i < toFetch.length; i += BATCH_SIZE) {
      const batchIds = toFetch.slice(i, i + BATCH_SIZE)
      console.log(`Fetching artworks batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(toFetch.length / BATCH_SIZE)}: ${batchIds.length} artworks`)
      const requestBody = `fields id,artwork_type,height,image_id,url,width; where id = (${batchIds.join(',')}); limit ${BATCH_SIZE};`
      console.log('IGDB API Request:', {
        url: 'https://api.igdb.com/v4/artworks',
        method: 'POST',
        headers: {
          'Client-ID': IGDB_CLIENT_ID,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'text/plain'
        },
        body: requestBody
      })
      const response = await fetch('https://api.igdb.com/v4/artworks', {
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
        throw new Error(`IGDB API error: ${response.status} ${response.statusText} - ${errorText}`)
      }
      const artworks = await response.json()
      console.log(`Fetched ${artworks.length} artworks, now saving batch to database...`)
      console.log(`Processing ${artworks.length} artworks in database batches...`)
      // Process artworks in DB batches of 100
      const dbBatchSize = 100
      for (let j = 0; j < artworks.length; j += dbBatchSize) {
        const batch = artworks.slice(j, j + dbBatchSize)
        console.log(`Processing DB batch ${Math.floor(j / dbBatchSize) + 1}/${Math.ceil(artworks.length / dbBatchSize)}: ${batch.length} artworks`)
        await prisma.igdbArtworks.createMany({
          data: batch.map((a: any) => ({
            igdbId: a.id,
            artwork_type: a.artwork_type ?? null,
            height: a.height ?? null,
            image_id: a.image_id ?? null,
            url: a.url ?? null,
            width: a.width ?? null
          })),
          skipDuplicates: true
        })
      }
      totalNewCount += artworks.length
      totalProcessed += artworks.length
      console.log(`Batch saved: ${artworks.length} new (Total processed: ${totalProcessed})`)
      // Rate limit
      if (i + BATCH_SIZE < toFetch.length) {
        await new Promise(resolve => setTimeout(resolve, 250))
      }
    }
    console.log(`All artworks processed: ${totalProcessed} total, ${totalNewCount} new, 0 updated`)
    return NextResponse.json({
      success: true,
      totalSynced: totalProcessed,
      new: totalNewCount,
      updated: 0,
      message: `Artworks sync completed. Processed: ${totalProcessed}`
    })
  } catch (error) {
    console.error('Error syncing artworks:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to sync artworks' }, { status: 500 })
  }
}
