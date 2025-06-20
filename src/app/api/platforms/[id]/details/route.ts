import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '../../../../../generated/prisma'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const platformId = parseInt(id)
    
    if (isNaN(platformId)) {
      return NextResponse.json({ error: 'Invalid platform ID' }, { status: 400 })
    }

    // Get the platform with basic info
    const platform = await prisma.platform.findUnique({
      where: { id: platformId }
    })

    if (!platform) {
      return NextResponse.json({ error: 'Platform not found' }, { status: 404 })
    }

    return NextResponse.json(platform)
  } catch (error) {
    console.error('Error fetching platform details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch platform details' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
