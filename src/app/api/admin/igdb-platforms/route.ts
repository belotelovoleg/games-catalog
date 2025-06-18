import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const platformId = searchParams.get('id')

    if (platformId) {
      // Fetch single platform by IGDB ID
      const platform = await prisma.igdbPlatform.findUnique({
        where: { igdbId: parseInt(platformId) }
      })
      
      if (!platform) {
        return NextResponse.json(
          { error: 'Platform not found' },
          { status: 404 }
        )
      }
      
      return NextResponse.json(platform)
    }
    
    // Fetch all platforms from local database with version count
    const platforms = await prisma.igdbPlatform.findMany({
      select: {
        igdbId: true, // Primary key - no more local 'id'
        name: true,
        abbreviation: true,
        alternative_name: true,
        slug: true,
        generation: true,
        platform_logo: true,
        summary: true,
        versions: true,
        platform_family: true,
        category: true,
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Get all platform families and types for lookups
    const [platformFamilies, platformTypes] = await Promise.all([
      prisma.igdbPlatformFamily.findMany(),
      prisma.igdbPlatformType.findMany()
    ])

    // Create lookup maps
    const familyMap = new Map(platformFamilies.map(f => [f.igdbId, f.name]))
    const typeMap = new Map(platformTypes.map(t => [t.igdbId, t.name]))    // Add hasVersions flag and resolve family/type names
    const platformsWithVersionInfo = await Promise.all(
      platforms.map(async (platform) => {
        let imageUrl = null
        if (platform.platform_logo) {
          const image = await prisma.igdbImage.findUnique({
            where: { igdbId: platform.platform_logo }
          })
          imageUrl = image?.computed_url || null
        }
        
        return {
          ...platform,
          hasVersions: platform.versions ? JSON.parse(platform.versions).length > 0 : false,
          familyName: platform.platform_family ? familyMap.get(platform.platform_family) : undefined,
          typeName: platform.category ? typeMap.get(platform.category) : undefined,
          imageUrl
        }
      })
    )
    
    return NextResponse.json(platformsWithVersionInfo)
  } catch (error) {
    console.error('Error fetching platforms:', error)
    return NextResponse.json(
      { error: 'Failed to fetch platforms from local database' },
      { status: 500 }
    )
  }
}
