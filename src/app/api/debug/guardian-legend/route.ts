import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Find Guardian Legend game
    const game = await prisma.igdbGames.findFirst({
      where: {
        name: {
          contains: 'Guardian Legend',
          mode: 'insensitive'
        }
      }
    })

    if (!game) {
      return NextResponse.json({ error: 'Guardian Legend not found' })
    }

    // Parse alternative names if they exist
    let alternativeNameIds = []
    if (game.alternative_names) {
      try {
        alternativeNameIds = JSON.parse(game.alternative_names)
      } catch (e) {
        console.error('Error parsing alternative names:', e)
      }
    }    // Get the actual alternative name records
    let alternativeNames: any[] = []
    if (alternativeNameIds.length > 0) {
      alternativeNames = await prisma.igdbAlternativeNames.findMany({
        where: {
          igdbId: {
            in: alternativeNameIds
          }
        }
      })
    }

    return NextResponse.json({
      game: {
        igdbId: game.igdbId,
        name: game.name,
        alternative_names_raw: game.alternative_names
      },
      alternativeNameIds,
      alternativeNames
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Failed to query Guardian Legend' },
      { status: 500 }
    )
  }
}
