import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const versionIds = searchParams.get('versionIds')

    if (!versionIds) {
      return NextResponse.json([])
    }

    // Parse the version IDs array
    const parsedVersionIds = JSON.parse(versionIds)
    
    if (!Array.isArray(parsedVersionIds) || parsedVersionIds.length === 0) {
      return NextResponse.json([])
    }    // Get platform versions from local database using the provided igdbIds
    const versions = await prisma.igdbPlatformVersion.findMany({
      where: {
        igdbId: {
          in: parsedVersionIds
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Add image URLs to each version
    const versionsWithImages = await Promise.all(
      versions.map(async (version) => {
        let imageUrl = null
        if (version.platform_logo) {
          const image = await prisma.igdbImage.findUnique({
            where: { igdbId: version.platform_logo }
          })
          imageUrl = image?.computed_url || null
        }
        return {
          ...version,
          imageUrl
        }
      })
    )

    return NextResponse.json(versionsWithImages)
  } catch (error) {
    console.error('Error fetching platform versions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch platform versions' },
      { status: 500 }
    )
  }
}
