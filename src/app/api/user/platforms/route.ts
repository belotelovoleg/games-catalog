import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key'

async function getUserFromToken(req: Request) {
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
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; isAdmin?: boolean }
    return decoded
  } catch (error) {
    return null
  }
}

export async function GET(req: Request) {
  const user = await getUserFromToken(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const userPlatforms = await prisma.userPlatform.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    })

    // Fetch platform details for each user platform
    const enrichedUserPlatforms = await Promise.all(
      userPlatforms.map(async (userPlatform) => {
        const platform = await prisma.platform.findUnique({
          where: { id: userPlatform.platformId }
        })
        
        return {
          ...userPlatform,
          platform: platform
        }
      })
    )

    return NextResponse.json(enrichedUserPlatforms)
  } catch (error) {
    console.error('Error fetching user platforms:', error)
    return NextResponse.json(
      { error: 'Failed to fetch platforms' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  const user = await getUserFromToken(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { platformId, status } = await req.json()

    if (!platformId || !status) {
      return NextResponse.json(
        { error: 'Platform ID and status are required' },
        { status: 400 }
      )
    }    // Check if already exists with the same status
    const existing = await prisma.userPlatform.findFirst({
      where: {
        userId: user.id,
        platformId: parseInt(platformId),
        status: status
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Platform already in collection with this status' },
        { status: 409 }
      )
    }

    // If user is adding to OWNED, remove from WISHLISTED (if exists)
    if (status === 'OWNED') {
      await prisma.userPlatform.deleteMany({
        where: {
          userId: user.id,
          platformId: parseInt(platformId),
          status: 'WISHLISTED'
        }
      })
    }const userPlatform = await prisma.userPlatform.create({
      data: {
        userId: user.id,
        platformId: parseInt(platformId),
        status: status
      }
    })

    // Fetch the platform details
    const platform = await prisma.platform.findUnique({
      where: { id: parseInt(platformId) }
    })

    return NextResponse.json({
      ...userPlatform,
      platform: platform
    })
  } catch (error) {
    console.error('Error adding platform:', error)
    return NextResponse.json(
      { error: 'Failed to add platform' },
      { status: 500 }
    )
  }
}
