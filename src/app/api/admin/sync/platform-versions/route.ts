import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getIGDBAccessToken } from '@/lib/igdb-token'

const IGDB_CLIENT_ID = process.env.IGDB_CLIENT_ID

async function fetchAllPlatformVersions(accessToken: string) {
  let allVersions: any[] = []
  let offset = 0
  const limit = 500
  
  console.log('Starting platform versions sync...')
    while (true) {
    console.log(`Fetching platform versions batch: offset ${offset}, limit ${limit}`)
    
    const requestBody = `fields *; limit ${limit}; offset ${offset}; sort id asc;`
    
    console.log('IGDB API Request:', {
      url: 'https://api.igdb.com/v4/platform_versions',
      method: 'POST',
      headers: {
        'Client-ID': IGDB_CLIENT_ID!,
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
      body: requestBody
    })
    
    const res = await fetch('https://api.igdb.com/v4/platform_versions', {
      method: 'POST',
      headers: {
        'Client-ID': IGDB_CLIENT_ID!,
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
      // Get ALL fields from IGDB platform_versions API
      body: requestBody,
    })
    
    if (!res.ok) {
      throw new Error(`IGDB API error: ${res.status} ${res.statusText}`)
    }
    
    const batch = await res.json()
    
    if (batch.length === 0) {
      break // No more data
    }
    
    allVersions.push(...batch)
    console.log(`Fetched ${batch.length} platform versions (total: ${allVersions.length})`)
    
    if (batch.length < limit) {
      break // Last batch
    }
    
    offset += limit
    
    // Rate limiting: IGDB allows 4 requests per second
    await new Promise(resolve => setTimeout(resolve, 250))
  }
  
  console.log(`Total platform versions fetched: ${allVersions.length}`)
  return allVersions
}

function extractPlatformIdFromUrl(url: string): number | null {
  if (!url) return null
  
  // Extract platform slug from URL like "/platforms/nes/version/..."
  const match = url.match(/\/platforms\/([^/]+)\/version\//)
  if (!match) return null
  
  const platformSlug = match[1]
  
  // We'll need to look up the platform by slug to get the IGDB ID
  // For now, return null and we'll handle this with a separate query
  return null
}

export async function POST() {
  try {
    const accessToken = await getIGDBAccessToken()
    const platformVersions = await fetchAllPlatformVersions(accessToken)
      // Get all existing platforms to create URL->ID mapping
    const existingPlatforms = await prisma.platform.findMany({
      select: { igdbPlatformId: true, id: true }
    })
    const platformMap = new Map(existingPlatforms.map(p => [p.igdbPlatformId, p.id]))
    
    console.log('Starting database sync...')
    let syncedCount = 0
    let updatedCount = 0
    const BATCH_DB_SIZE = 100
    // Find all existing IDs
    const allIds = platformVersions.map((v: any) => v.id)
    const existing = await prisma.igdbPlatformVersion.findMany({
      where: { igdbId: { in: allIds } },
      select: { igdbId: true, name: true }
    })
    const existingMap = new Map(existing.map(v => [v.igdbId, v]))
    const toCreate = platformVersions.filter((v: any) => !existingMap.has(v.id))
    const toUpdate = platformVersions.filter((v: any) => existingMap.has(v.id))
    // Batch create
    for (let i = 0; i < toCreate.length; i += BATCH_DB_SIZE) {
      const batch = toCreate.slice(i, i + BATCH_DB_SIZE)
      if (batch.length > 0) {
        await prisma.igdbPlatformVersion.createMany({
          data: batch.map((versionData: any) => ({
            igdbId: versionData.id,
            checksum: versionData.checksum || null,
            companies: versionData.companies ? JSON.stringify(versionData.companies) : null,
            connectivity: versionData.connectivity || null,
            cpu: versionData.cpu || null,
            graphics: versionData.graphics || null,
            main_manufacturer: versionData.main_manufacturer || null,
            media: versionData.media || null,
            memory: versionData.memory || null,
            name: versionData.name,
            os: versionData.os || null,
            output: versionData.output || null,
            platform_logo: versionData.platform_logo || null,
            platform_version_release_dates: versionData.platform_version_release_dates ? JSON.stringify(versionData.platform_version_release_dates) : null,
            resolutions: versionData.resolutions || null,
            slug: versionData.slug || null,
            sound: versionData.sound || null,
            storage: versionData.storage || null,
            summary: versionData.summary || null,
            url: versionData.url || null
          })),
          skipDuplicates: true
        })
        syncedCount += batch.length
      }
    }
    // Batch update
    for (let i = 0; i < toUpdate.length; i += BATCH_DB_SIZE) {
      const batch = toUpdate.slice(i, i + BATCH_DB_SIZE)
      await Promise.all(batch.map(async (versionData: any) => {
        try {
          await prisma.igdbPlatformVersion.update({
            where: { igdbId: versionData.id },
            data: {
              checksum: versionData.checksum || null,
              companies: versionData.companies ? JSON.stringify(versionData.companies) : null,
              connectivity: versionData.connectivity || null,
              cpu: versionData.cpu || null,
              graphics: versionData.graphics || null,
              main_manufacturer: versionData.main_manufacturer || null,
              media: versionData.media || null,
              memory: versionData.memory || null,
              name: versionData.name,
              os: versionData.os || null,
              output: versionData.output || null,
              platform_logo: versionData.platform_logo || null,
              platform_version_release_dates: versionData.platform_version_release_dates ? JSON.stringify(versionData.platform_version_release_dates) : null,
              resolutions: versionData.resolutions || null,
              slug: versionData.slug || null,
              sound: versionData.sound || null,
              storage: versionData.storage || null,
              summary: versionData.summary || null,
              url: versionData.url || null
            }
          })
          updatedCount++
        } catch (error) {
          console.error(`Error updating platform version ${versionData.id}:`, error)
        }
      }))
    }
    
    console.log(`Sync completed: ${syncedCount} new, ${updatedCount} updated`)
    
    return NextResponse.json({
      success: true,
      message: `Platform versions sync completed!\n✅ ${syncedCount} new versions added\n🔄 ${updatedCount} versions updated\n📊 Total processed: ${platformVersions.length}`,
      count: platformVersions.length,
      new: syncedCount,
      updated: updatedCount
    })
    
  } catch (error) {
    console.error('Platform versions sync error:', error)
    return NextResponse.json(
      { error: `Platform versions sync failed: ${error}` },
      { status: 500 }
    )
  }
}
