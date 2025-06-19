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
      for (const versionData of platformVersions) {
      try {        const existingVersion = await prisma.igdbPlatformVersion.findUnique({
          where: { igdbId: versionData.id }
        })
        
        // Store ALL IGDB platform_version fields exactly as they come from API
        const versionRecord = {
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
          url: versionData.url || null,
          lastSynced: new Date(),
        }
          if (existingVersion) {
          await prisma.igdbPlatformVersion.update({
            where: { igdbId: versionData.id },
            data: versionRecord
          })
          updatedCount++
        } else {
          await prisma.igdbPlatformVersion.create({
            data: versionRecord
          })
          syncedCount++
        }
      } catch (error) {
        console.error(`Error syncing platform version ${versionData.id}:`, error)
        // Continue with other versions
      }
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
