import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function searchGuardianLegend() {
  try {
    console.log('Searching for Guardian Legend...')
    
    // Search by name
    const gamesByName = await prisma.igdbGames.findMany({
      where: {
        name: {
          contains: 'Guardian',
          mode: 'insensitive'
        }
      },
      select: {
        igdbId: true,
        name: true,
        alternative_names: true,
        rating: true
      }
    })
    
    console.log('Games found by name:')
    gamesByName.forEach(game => {
      console.log(`- ${game.name} (ID: ${game.igdbId}, Rating: ${game.rating})`)
      if (game.alternative_names) {
        console.log(`  Alternative names JSON: ${game.alternative_names}`)
      }
    })
    
    // Search alternative names table for Guardian
    const altNames = await prisma.igdbAlternativeNames.findMany({
      where: {
        name: {
          contains: 'Guardian',
          mode: 'insensitive'
        }
      },
      take: 10
    })
    
    console.log('\nAlternative names found:')
    altNames.forEach(alt => {
      console.log(`- "${alt.name}" (ID: ${alt.igdbId})`)
    })
    
    // Also search for "Legend"
    const legendNames = await prisma.igdbAlternativeNames.findMany({
      where: {
        name: {
          contains: 'Legend',
          mode: 'insensitive'
        }
      },
      take: 20
    })
    
    console.log('\nAlternative names containing "Legend":')
    legendNames.forEach(alt => {
      console.log(`- "${alt.name}" (ID: ${alt.igdbId})`)
    })
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

searchGuardianLegend()
