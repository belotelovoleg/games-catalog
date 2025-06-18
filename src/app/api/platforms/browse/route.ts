import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const family = searchParams.get('family') || ''
    const type = searchParams.get('type') || ''
    const generation = searchParams.get('generation') || ''

    // Build the where clause for filtering
    const whereClause: any = {}
    
    // Search by platform name or version name
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { versionName: { contains: search, mode: 'insensitive' } },
        { alternative_name: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Filter by generation
    if (generation) {
      whereClause.generation = parseInt(generation)
    }

    // Filter by platform family or type
    if (family) {
      whereClause.platform_family = parseInt(family)
    }
    
    if (type) {
      whereClause.platform_type = parseInt(type)
    }

    // Fetch platforms with filtering
    const platforms = await prisma.platform.findMany({
      where: whereClause,
      orderBy: [
        { generation: 'asc' },
        { name: 'asc' }
      ]
    })

    // Enrich platforms with family and type names
    const enrichedPlatforms = await Promise.all(
      platforms.map(async (platform) => {
        let familyName = null
        let typeName = null

        // Get family name if platform_family exists
        if (platform.platform_family) {
          const family = await prisma.igdbPlatformFamily.findUnique({
            where: { igdbId: platform.platform_family }
          })
          familyName = family?.name || null
        }

        // Get type name if platform_type exists
        if (platform.platform_type) {
          const type = await prisma.igdbPlatformType.findUnique({
            where: { igdbId: platform.platform_type }
          })
          typeName = type?.name || null
        }

        // Get platform version details if available
        let versionDetails = null
        if (platform.igdbPlatformVersionId) {
          versionDetails = await prisma.igdbPlatformVersion.findUnique({
            where: { igdbId: platform.igdbPlatformVersionId }
          })
        }

        // Get platform details
        let platformDetails = null
        if (platform.igdbPlatformId) {
          platformDetails = await prisma.igdbPlatform.findUnique({
            where: { igdbId: platform.igdbPlatformId }
          })
        }        // Get image URL if no base64 logo is stored
        let imageUrl = null
        if (platform.platform_logo_base64) {
          // If base64 is stored, use it directly
          imageUrl = platform.platform_logo_base64.startsWith('data:') 
            ? platform.platform_logo_base64 
            : `data:image/png;base64,${platform.platform_logo_base64}`
        } else {
          // Try to get from IGDB logos
          let logoId = null
          
          if (platform.igdbPlatformVersionId && versionDetails?.platform_logo) {
            logoId = versionDetails.platform_logo
          } else if (platform.igdbPlatformId && platformDetails?.platform_logo) {
            logoId = platformDetails.platform_logo
          }
          
          if (logoId) {
            try {
              const logo = await prisma.igdbPlatformLogo.findUnique({
                where: { igdbId: logoId }
              })
              imageUrl = logo?.computed_url || null
            } catch (error) {
              // Continue without image
            }
          }
        }

        return {
          ...platform,
          familyName,
          typeName,
          versionDetails,
          platformDetails,
          // Create imageUrl from base64 or IGDB logo
          imageUrl: imageUrl,
          // Use version summary if available, otherwise platform summary
          description: versionDetails?.summary || platformDetails?.summary || null
        }
      })
    )

    return NextResponse.json(enrichedPlatforms)
  } catch (error) {
    console.error('Error fetching platforms for browse:', error)
    return NextResponse.json(
      { error: 'Failed to fetch platforms' },
      { status: 500 }
    )
  }
}
