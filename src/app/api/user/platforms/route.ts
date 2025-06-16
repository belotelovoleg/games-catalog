import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key'

async function getUserFromToken(req: Request) {
  const authHeader = req.headers.get('authorization') || req.headers.get('cookie')
  let token = null
  
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  } else if (authHeader?.includes('token=')) {
    token = authHeader.split('token=')[1].split(';')[0]
  }

  if (!token) {
    return null
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number }
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
      include: {
        platform: true
      },
      orderBy: { platform: { name: 'asc' } }
    })

    return NextResponse.json(userPlatforms)
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
    }

    // Check if already exists
    const existing = await prisma.userPlatform.findUnique({
      where: {
        userId_platformId_status: {
          userId: user.id,
          platformId: parseInt(platformId),
          status: status
        }
      }
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Platform already in collection' },
        { status: 400 }
      )
    }

    const userPlatform = await prisma.userPlatform.create({
      data: {
        userId: user.id,
        platformId: parseInt(platformId),
        status: status
      },
      include: {
        platform: true
      }
    })

    return NextResponse.json(userPlatform)
  } catch (error) {
    console.error('Error adding platform:', error)
    return NextResponse.json(
      { error: 'Failed to add platform' },
      { status: 500 }
    )
  }
}
