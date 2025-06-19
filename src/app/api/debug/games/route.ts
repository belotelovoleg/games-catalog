import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get first 10 games with alternative_names
    const gamesWithAltNames = await prisma.igdbGames.findMany({
      where: {
        alternative_names: { not: null }
      },
      take: 10,
      select: {
        igdbId: true,
        name: true,
        alternative_names: true
      }
    })

    // Also get count of total alternative names
    const altNamesCount = await prisma.igdbAlternativeNames.count()

    return NextResponse.json({
      gamesWithAltNames,
      altNamesCount,
      message: `Found ${gamesWithAltNames.length} games with alternative names out of ${altNamesCount} total alternative names in DB`
    })
  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
