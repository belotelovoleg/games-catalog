import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get all users
    const users = await prisma.user.findMany({
      select: { id: true, email: true }
    })    // Get all user platforms
    const userPlatforms = await prisma.userPlatform.findMany()

    // Get all platforms with associated user platforms
    const platformsWithUsers = await prisma.platform.findMany({
      select: {
        id: true,
        name: true,
        abbreviation: true,
        igdbPlatformId: true
      }
    })    // Get all platforms
    const platforms = await prisma.platform.findMany()

    return NextResponse.json({
      users,
      userPlatforms,
      platforms,
      platformsWithUsers,
      totalUsers: users.length,
      totalUserPlatforms: userPlatforms.length,
      totalPlatforms: platforms.length
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch debug data', details: error },
      { status: 500 }
    )
  }
}
