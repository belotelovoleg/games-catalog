import { PrismaClient } from '@prisma/client'

async function debugAlternativeNames() {
  const prisma = new PrismaClient()
  
  try {
    console.log('=== Debug Alternative Names ===')
    
    // Check if we have any alternative names in the database
    const altNamesCount = await prisma.igdbAlternativeNames.count()
    console.log(`Total alternative names in DB: ${altNamesCount}`)
    
    if (altNamesCount > 0) {
      const someAltNames = await prisma.igdbAlternativeNames.findMany({ take: 5 })
      console.log('Sample alternative names:')
      someAltNames.forEach(alt => console.log(`  ${alt.igdbId}: ${alt.name}`))
    }
    
    // Check if we have any games with alternative_names field populated
    const gamesWithAltNames = await prisma.igdbGames.findMany({
      where: {
        alternative_names: { not: null }
      },
      take: 5
    })
    
    console.log(`\nGames with alternative_names field: ${gamesWithAltNames.length}`)
    
    if (gamesWithAltNames.length > 0) {
      gamesWithAltNames.forEach(game => {
        console.log(`Game ${game.igdbId} (${game.name}):`)
        console.log(`  alternative_names: ${game.alternative_names}`)
        
        // Try to parse the alternative_names
        try {
          const altNameIds = JSON.parse(game.alternative_names!)
          console.log(`  Parsed IDs: ${altNameIds}`)
        } catch (e) {
          console.log(`  Parse error: ${(e as Error).message}`)
        }
      })
    }
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugAlternativeNames()
