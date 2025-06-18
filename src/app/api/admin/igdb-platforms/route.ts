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
    
    // Fetch all platforms and related data in parallel for efficiency
    const [platforms, allLogos, allFamilies, allTypes] = await Promise.all([
      prisma.igdbPlatform.findMany({
        orderBy: { name: 'asc' }
      }),
      prisma.igdbPlatformLogo.findMany({
        select: { igdbId: true, computed_url: true }
      }),
      prisma.igdbPlatformFamily.findMany({
        select: { igdbId: true, name: true }
      }),
      prisma.igdbPlatformType.findMany({
        select: { igdbId: true, name: true }
      })
    ])

    // Create lookup maps for O(1) access
    const logoMap = new Map(allLogos.map(logo => [logo.igdbId, logo.computed_url]))
    const familyMap = new Map(allFamilies.map(family => [family.igdbId, family.name]))
    const typeMap = new Map(allTypes.map(type => [type.igdbId, type.name]))

    // Transform platforms with all joined data
    const platformsWithAllData = platforms.map(platform => ({
      ...platform,
      hasVersions: platform.versions ? JSON.parse(platform.versions).length > 0 : false,
      imageUrl: platform.platform_logo ? logoMap.get(platform.platform_logo) || null : null,
      familyName: platform.platform_family ? familyMap.get(platform.platform_family) || null : null,
      typeName: platform.category ? typeMap.get(platform.category) || null : null
    }))
    
    return NextResponse.json(platformsWithAllData)
  } catch (error) {
    console.error('Error fetching platforms:', error)
    return NextResponse.json(
      { error: 'Failed to fetch platforms from local database' },
      { status: 500 }
    )
  }
}
