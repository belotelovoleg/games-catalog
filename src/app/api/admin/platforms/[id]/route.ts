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
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; isAdmin: boolean }
    if (!decoded.isAdmin) {
      return null
    }
    return decoded
  } catch (error) {
    return null
  }
}

// GET /api/admin/platforms/[id] - Get specific platform
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAdmin(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const platformId = parseInt(id)
    if (isNaN(platformId)) {
      return NextResponse.json({ error: 'Invalid platform ID' }, { status: 400 })
    }

    const platform = await prisma.platform.findUnique({
      where: { id: platformId }
    })

    if (!platform) {
      return NextResponse.json({ error: 'Platform not found' }, { status: 404 })
    }

    return NextResponse.json(platform)
  } catch (error) {
    console.error('Error fetching platform:', error)
    return NextResponse.json(
      { error: 'Failed to fetch platform' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/platforms/[id] - Update platform
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAdmin(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const platformId = parseInt(id)
    if (isNaN(platformId)) {
      return NextResponse.json({ error: 'Invalid platform ID' }, { status: 400 })
    }

    const { name } = await req.json()

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Platform name is required' }, { status: 400 })
    }

    // Check if platform exists
    const existingPlatform = await prisma.platform.findUnique({
      where: { id: platformId }
    })

    if (!existingPlatform) {
      return NextResponse.json({ error: 'Platform not found' }, { status: 404 })
    }

    // Update the platform
    const updatedPlatform = await prisma.platform.update({
      where: { id: platformId },
      data: {
        name: name.trim(),
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      platform: updatedPlatform
    })
  } catch (error) {
    console.error('Error updating platform:', error)
    return NextResponse.json(
      { error: 'Failed to update platform' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/platforms/[id] - Delete platform
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyAdmin(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const platformId = parseInt(id)
    if (isNaN(platformId)) {
      return NextResponse.json({ error: 'Invalid platform ID' }, { status: 400 })
    }    // Check if platform exists
    const existingPlatform = await prisma.platform.findUnique({
      where: { id: platformId }
    })

    if (!existingPlatform) {
      return NextResponse.json({ error: 'Platform not found' }, { status: 404 })
    }

    // Check if platform is being used by users
    const userPlatforms = await prisma.userPlatform.findMany({
      where: { platformId: platformId }
    })

    const userGames = await prisma.userGame.findMany({
      where: { platformId: platformId }
    })

    if (userPlatforms.length > 0 || userGames.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete platform that is being used by users or has associated games' 
        },
        { status: 409 }
      )
    }

    // Delete the platform
    await prisma.platform.delete({
      where: { id: platformId }
    })

    return NextResponse.json({
      success: true,
      message: 'Platform deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting platform:', error)
    return NextResponse.json(
      { error: 'Failed to delete platform' },
      { status: 500 }
    )
  }
}
