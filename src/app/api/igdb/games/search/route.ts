import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const query = url.searchParams.get('q')
    const platformId = url.searchParams.get('platformId')

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
    }

    // Search in IGDB games by name
    const gamesByName = await prisma.igdbGames.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive'
        }
      },
      take: 20,
      orderBy: [
        { rating: 'desc' },
        { name: 'asc' }
      ]
    })

    // Search by alternative names
    // First, find alternative names that match the query
    const matchingAltNames = await prisma.igdbAlternativeNames.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive'
        }
      },
      take: 50 // Get more alternative names to check
    })

    // Get the alternative name IDs that match
    const matchingAltNameIds = matchingAltNames.map(alt => alt.igdbId)

    // Find games that have these alternative name IDs in their alternative_names JSON field
    let gamesByAltNames: any[] = []
    if (matchingAltNameIds.length > 0) {
      // Search for games where the alternative_names JSON array contains any of the matching IDs
      const gamesWithAltNames = await prisma.igdbGames.findMany({
        where: {
          alternative_names: {
            not: null
          }
        },
        take: 100 // Get more games to check their alternative names
      })      // Filter games that contain the matching alternative name IDs
      gamesByAltNames = gamesWithAltNames.filter(game => {
        if (!game.alternative_names) return false
        
        try {
          const altNameIds = JSON.parse(game.alternative_names)
          if (!Array.isArray(altNameIds)) return false
          
          // Convert both arrays to numbers for comparison to handle type mismatches
          const gameAltIds = altNameIds.map(id => typeof id === 'string' ? parseInt(id) : id)
          const searchIds = matchingAltNameIds.map(id => typeof id === 'string' ? parseInt(id) : id)
          
          return gameAltIds.some(id => searchIds.includes(id))
        } catch (e) {
          return false
        }
      })
    }

    // Combine and deduplicate results
    const allGames = [...gamesByName, ...gamesByAltNames]
    const uniqueGames = allGames.filter((game, index, self) => 
      index === self.findIndex(g => g.igdbId === game.igdbId)
    )

    // Sort by relevance (name matches first, then by rating)
    const sortedGames = uniqueGames.sort((a, b) => {
      const aNameMatch = a.name.toLowerCase().includes(query.toLowerCase())
      const bNameMatch = b.name.toLowerCase().includes(query.toLowerCase())
      
      if (aNameMatch && !bNameMatch) return -1
      if (!aNameMatch && bNameMatch) return 1
      
      // If both or neither match by name, sort by rating
      return (b.rating || 0) - (a.rating || 0)
    })

    return NextResponse.json(sortedGames.slice(0, 20))
  } catch (error) {
    console.error('Error searching games:', error)
    return NextResponse.json(
      { error: 'Failed to search games' },
      { status: 500 }
    )
  }
}
