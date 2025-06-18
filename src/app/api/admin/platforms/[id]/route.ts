import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key'

async function verifyAdmin(req: Request) {
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
  { params }: { params: { id: string } }
) {
  const user = await verifyAdmin(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const platformId = parseInt(params.id)
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
  { params }: { params: { id: string } }
) {
  const user = await verifyAdmin(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const platformId = parseInt(params.id)
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
  { params }: { params: { id: string } }
) {
  const user = await verifyAdmin(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const platformId = parseInt(params.id)
    if (isNaN(platformId)) {
      return NextResponse.json({ error: 'Invalid platform ID' }, { status: 400 })
    }

    // Check if platform exists
    const existingPlatform = await prisma.platform.findUnique({
      where: { id: platformId },
      include: {
        userPlatforms: true,
        games: true
      }
    })

    if (!existingPlatform) {
      return NextResponse.json({ error: 'Platform not found' }, { status: 404 })
    }

    // Check if platform is being used by users
    if (existingPlatform.userPlatforms.length > 0 || existingPlatform.games.length > 0) {
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
