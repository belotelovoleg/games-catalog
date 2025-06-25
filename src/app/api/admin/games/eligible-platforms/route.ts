import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key'

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

export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request)
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin authentication required' },
        { status: 401 }
      )
    }    // Get platforms that have IGDB IDs (either platform ID or platform version ID)
    const platforms = await prisma.platform.findMany({
      where: {
        OR: [
          { igdbPlatformId: { not: null } },
          { igdbPlatformVersionId: { not: null } }
        ]
      },
      select: {
        id: true,
        name: true,
        versionName: true,
        igdbPlatformId: true,
        igdbPlatformVersionId: true,
        platform_family: true,
        platform_type: true,
        generation: true
      },
      orderBy: [
        { generation: 'asc' },
        { name: 'asc' }
      ]
    })

    // Get IGDB platform and version names for each platform
    const platformsWithIgdbNames = await Promise.all(
      platforms.map(async (platform) => {
        let igdbPlatformName = null
        let igdbPlatformVersionName = null

        // Get IGDB platform name if available
        if (platform.igdbPlatformId) {
          const igdbPlatform = await prisma.igdbPlatform.findUnique({
            where: { igdbId: platform.igdbPlatformId },
            select: { name: true }
          })
          igdbPlatformName = igdbPlatform?.name || null
        }

        // Get IGDB platform version name if available
        if (platform.igdbPlatformVersionId) {
          const igdbPlatformVersion = await prisma.igdbPlatformVersion.findUnique({
            where: { igdbId: platform.igdbPlatformVersionId },
            select: { name: true }
          })
          igdbPlatformVersionName = igdbPlatformVersion?.name || null
        }        return {
          ...platform,
          igdbPlatformName,
          igdbPlatformVersionName
        }
      })
    )

    return NextResponse.json({
      success: true,
      platforms: platformsWithIgdbNames,
      count: platformsWithIgdbNames.length
    })

  } catch (error) {
    console.error('Error fetching eligible platforms:', error)
    return NextResponse.json(
      { error: 'Failed to fetch eligible platforms' },
      { status: 500 }
    )
  }
}
