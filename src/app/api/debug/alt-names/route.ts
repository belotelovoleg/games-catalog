import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const query = url.searchParams.get('q') || 'Guardic'

    console.log('Searching for alternative names containing:', query)

    // Step 1: Find alternative names that match
    const matchingAltNames = await prisma.igdbAlternativeNames.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive'
        }
      },
      take: 50
    })

    console.log('Found alternative names:', matchingAltNames)

    // Step 2: Get their IDs
    const matchingAltNameIds = matchingAltNames.map(alt => alt.igdbId)
    console.log('Alternative name IDs:', matchingAltNameIds)

    // Step 3: Find games with these IDs in their alternative_names field
    const gamesWithAltNames = await prisma.igdbGames.findMany({
      where: {
        alternative_names: {
          not: null
        }
      },
      select: {
        igdbId: true,
        name: true,
        alternative_names: true
      },
      take: 100
    })

    console.log('Games with alternative names (first 5):', gamesWithAltNames.slice(0, 5))    // Step 4: Filter games that contain our matching IDs
    const filteredGames = gamesWithAltNames.filter(game => {
      if (!game.alternative_names) return false
      
      try {
        const altNameIds = JSON.parse(game.alternative_names)
        const hasMatch = Array.isArray(altNameIds) && 
               altNameIds.some(id => matchingAltNameIds.includes(id))
        
        // Debug specific game
        if (game.name === 'The Guardian Legend' || game.igdbId === 48058) {
          console.log('=== THE GUARDIAN LEGEND DEBUG ===')
          console.log('Game:', game.name, 'ID:', game.igdbId)
          console.log('Raw alternative_names:', game.alternative_names)
          console.log('Parsed altNameIds:', altNameIds)
          console.log('altNameIds types:', altNameIds.map((id: any) => typeof id))
          console.log('matchingAltNameIds:', matchingAltNameIds)
          console.log('matchingAltNameIds types:', matchingAltNameIds.map((id: any) => typeof id))
          console.log('Has match:', hasMatch)
          console.log('Individual checks:')
          altNameIds.forEach((id: any) => {
            console.log(`  ${id} (${typeof id}) in [${matchingAltNameIds}]? ${matchingAltNameIds.includes(id)}`)
          })
          console.log('=== END DEBUG ===')
        }
        
        if (hasMatch) {
          console.log(`Game "${game.name}" has matching alt name IDs:`, altNameIds, 'matches:', matchingAltNameIds)
        }
        
        return hasMatch
      } catch (e) {
        console.log('JSON parse error for game:', game.name, game.alternative_names)
        return false
      }
    })

    return NextResponse.json({
      query,
      matchingAltNames,
      matchingAltNameIds,
      totalGamesWithAltNames: gamesWithAltNames.length,
      filteredGames
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to debug alternative names' }, { status: 500 })
  }
}
