import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getIGDBAccessToken } from '@/lib/igdb-token'

const IGDB_CLIENT_ID = process.env.IGDB_CLIENT_ID

async function fetchAllPlatforms(accessToken: string) {
  let allPlatforms: any[] = []
  let offset = 0
  const limit = 500
  
  console.log('Starting platforms sync...')
    while (true) {
    console.log(`Fetching platforms batch: offset ${offset}, limit ${limit}`)
    
    const requestBody = `fields *; where category = (1,5); limit ${limit}; offset ${offset}; sort id asc;`
    
    console.log('IGDB API Request:', {
      url: 'https://api.igdb.com/v4/platforms',
      method: 'POST',
      headers: {
        'Client-ID': IGDB_CLIENT_ID!,
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
      body: requestBody
    })
    
    const res = await fetch('https://api.igdb.com/v4/platforms', {
      method: 'POST',
      headers: {
        'Client-ID': IGDB_CLIENT_ID!,
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
      // Get ALL fields from IGDB platforms API
      body: requestBody,
    })
    
    if (!res.ok) {
      throw new Error(`IGDB API error: ${res.status} ${res.statusText}`)
    }
    
    const batch = await res.json()
    
    if (batch.length === 0) {
      break // No more data
    }
    
    allPlatforms.push(...batch)
    console.log(`Fetched ${batch.length} platforms (total: ${allPlatforms.length})`)
    
    if (batch.length < limit) {
      break // Last batch
    }
    
    offset += limit
    
    // Rate limiting: IGDB allows 4 requests per second
    await new Promise(resolve => setTimeout(resolve, 250))
  }
  
  console.log(`Total platforms fetched: ${allPlatforms.length}`)
  return allPlatforms
}

export async function POST() {
  try {
    const accessToken = await getIGDBAccessToken()
    const platforms = await fetchAllPlatforms(accessToken)
    
    console.log('Starting database sync...')
    let syncedCount = 0
    let updatedCount = 0
    
    for (const platformData of platforms) {
      try {
        const existingPlatform = await prisma.igdbPlatform.findUnique({
          where: { igdbId: platformData.id }
        })
        
        // Store ALL IGDB fields exactly as they come from API
        const platformRecord = {
          igdbId: platformData.id,
          abbreviation: platformData.abbreviation || null,
          alternative_name: platformData.alternative_name || null,
          category: platformData.category || null,
          checksum: platformData.checksum || null,
          created_at: platformData.created_at ? new Date(platformData.created_at * 1000) : null,
          generation: platformData.generation || null,
          name: platformData.name,
          platform_family: platformData.platform_family || null,
          platform_logo: platformData.platform_logo || null,
          platform_type: platformData.platform_type || null,
          slug: platformData.slug || null,
          summary: platformData.summary || null,
          updated_at: platformData.updated_at ? new Date(platformData.updated_at * 1000) : null,
          url: platformData.url || null,
          versions: platformData.versions ? JSON.stringify(platformData.versions) : null,
          websites: platformData.websites ? JSON.stringify(platformData.websites) : null,
          lastSynced: new Date(),
        }
        
        if (existingPlatform) {
          await prisma.igdbPlatform.update({
            where: { igdbId: platformData.id },
            data: platformRecord
          })
          updatedCount++
        } else {
          await prisma.igdbPlatform.create({
            data: platformRecord
          })
          syncedCount++
        }
      } catch (error) {
        console.error(`Error syncing platform ${platformData.id}:`, error)
        // Continue with other platforms
      }
    }
    
    console.log(`Sync completed: ${syncedCount} new, ${updatedCount} updated`)
    
    return NextResponse.json({
      success: true,
      message: `Platforms sync completed!\n✅ ${syncedCount} new platforms added\n🔄 ${updatedCount} platforms updated\n📊 Total processed: ${platforms.length}`,
      count: platforms.length,
      new: syncedCount,
      updated: updatedCount
    })
    
  } catch (error) {
    console.error('Platforms sync error:', error)
    return NextResponse.json(
      { error: `Platforms sync failed: ${error}` },
      { status: 500 }
    )
  }
}
