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
    const decoded = jwt.verify(token, JWT_SECRET) as any
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    })
    
    return user?.isAdmin ? user : null
  } catch (error) {
    return null
  }
}

interface AddPlatformRequest {
  igdbPlatformId: number
  igdbPlatformVersionId?: number
  customName?: string // Optional override for the platform name
  includeBase64Logo?: boolean // Whether to fetch and store the logo as base64
}

export async function POST(req: NextRequest) {
  const user = await verifyAdmin(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { 
      igdbPlatformId, 
      igdbPlatformVersionId, 
      customName,
      includeBase64Logo = false
    }: AddPlatformRequest = await req.json()

    if (!igdbPlatformId) {
      return NextResponse.json(
        { error: 'IGDB Platform ID is required' },
        { status: 400 }
      )
    }

    // Fetch platform data from our IGDB cache
    const igdbPlatform = await prisma.igdbPlatform.findUnique({
      where: { igdbId: igdbPlatformId }
    })

    if (!igdbPlatform) {
      return NextResponse.json(
        { error: 'Platform not found in IGDB cache. Please sync platforms first.' },
        { status: 404 }
      )
    }

    let igdbPlatformVersion = null
    if (igdbPlatformVersionId) {
      igdbPlatformVersion = await prisma.igdbPlatformVersion.findUnique({
        where: { igdbId: igdbPlatformVersionId }
      })

      if (!igdbPlatformVersion) {
        return NextResponse.json(
          { error: 'Platform version not found in IGDB cache. Please sync platform versions first.' },
          { status: 404 }
        )
      }
    }

    // Determine the platform name (version name takes precedence, then custom name, then platform name)
    const platformName = customName || 
                        (igdbPlatformVersion?.name) || 
                        igdbPlatform.name    // Handle base64 logo if requested
    let platform_logo_base64 = null
    if (includeBase64Logo) {
      const logoId = igdbPlatformVersion?.platform_logo || igdbPlatform.platform_logo
      if (logoId) {
        try {
          // Get the logo URL directly from our logo cache
          const logoData = await prisma.igdbPlatformLogo.findUnique({
            where: { igdbId: logoId },
            select: { computed_url: true }
          })
          
          if (logoData?.computed_url) {
            // Fetch the actual image and convert to base64
            const imageResponse = await fetch(logoData.computed_url)
            if (imageResponse.ok) {
              const imageBuffer = await imageResponse.arrayBuffer()
              const base64String = Buffer.from(imageBuffer).toString('base64')
              platform_logo_base64 = `data:image/png;base64,${base64String}`
            }
          }
        } catch (error) {
          console.warn('Failed to fetch logo for platform:', error)
          // Continue without logo
        }
      }
    }

    // Check if platform already exists
    const existingPlatform = await prisma.platform.findFirst({
      where: {
        AND: [
          { igdbPlatformId: igdbPlatformId },
          igdbPlatformVersionId ? { igdbPlatformVersionId: igdbPlatformVersionId } : {}
        ]
      }
    })

    if (existingPlatform) {
      return NextResponse.json(
        { error: 'This platform/version combination already exists in your platforms list' },
        { status: 409 }
      )
    }    // Create the platform
    const platform = await prisma.platform.create({
      data: {
        name: platformName,
        igdbPlatformId: igdbPlatformId,
        igdbPlatformVersionId: igdbPlatformVersionId,
        abbreviation: igdbPlatform.abbreviation,
        alternative_name: igdbPlatform.alternative_name,
        generation: igdbPlatform.generation,
        platform_family: igdbPlatform.platform_family,
        platform_type: igdbPlatform.platform_type,
        companies: igdbPlatformVersion?.companies,
        versionName: igdbPlatformVersion?.name,
        platform_logo_base64: platform_logo_base64
      }
    })

    return NextResponse.json({
      success: true,
      platform: platform,
      message: `Platform "${platformName}" added successfully`
    })

  } catch (error) {
    console.error('Error adding platform:', error)
    return NextResponse.json(
      { error: 'Failed to add platform' },
      { status: 500 }
    )
  }
}
