import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const gameId = parseInt(id)
    
    if (isNaN(gameId)) {
      return NextResponse.json({ error: 'Invalid game ID' }, { status: 400 })
    }

    const game = await prisma.igdbGames.findUnique({
      where: { igdbId: gameId }
    })

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }    // Fetch related data if needed
    const enrichedGame = {
      ...game,
      // Parse JSON fields if they exist
      screenshots: game.screenshots ? JSON.parse(game.screenshots) : null,
      alternative_names: game.alternative_names ? JSON.parse(game.alternative_names) : null,
      genres: game.genres ? JSON.parse(game.genres) : null,
      involved_companies: game.involved_companies ? JSON.parse(game.involved_companies) : null,
      multiplayer_modes: game.multiplayer_modes ? JSON.parse(game.multiplayer_modes) : null,
      age_ratings: game.age_ratings ? JSON.parse(game.age_ratings) : null,
      game_engines: game.game_engines ? JSON.parse(game.game_engines) : null
    }

    // Fetch cover details if cover ID exists
    let coverDetails = null
    if (game.cover) {
      coverDetails = await prisma.igdbCovers.findUnique({
        where: { igdbId: game.cover }
      })
    }    // Fetch screenshot details if screenshot IDs exist
    let screenshotDetails: any[] = []
    if (enrichedGame.screenshots && Array.isArray(enrichedGame.screenshots)) {
      screenshotDetails = await prisma.igdbScreenshots.findMany({
        where: { igdbId: { in: enrichedGame.screenshots } }
      })
    }

    // Fetch genre details if genre IDs exist
    let genreDetails: any[] = []
    if (enrichedGame.genres && Array.isArray(enrichedGame.genres)) {
      genreDetails = await prisma.igdbGenres.findMany({
        where: { igdbId: { in: enrichedGame.genres } }
      })
    }

    // Fetch company details if company IDs exist
    let companyDetails: any[] = []
    if (enrichedGame.involved_companies && Array.isArray(enrichedGame.involved_companies)) {
      companyDetails = await prisma.igdbCompany.findMany({
        where: { igdbId: { in: enrichedGame.involved_companies } }
      })
    }

    // Fetch franchise details if franchise ID exists
    let franchiseDetails = null
    if (game.franchise) {
      franchiseDetails = await prisma.igdbFranchises.findUnique({
        where: { igdbId: game.franchise }
      })
    }    // Fetch multiplayer mode details if multiplayer mode IDs exist
    let multiplayerModeDetails: any[] = []
    if (enrichedGame.multiplayer_modes && Array.isArray(enrichedGame.multiplayer_modes)) {
      multiplayerModeDetails = await prisma.igdbMultiplayerModes.findMany({
        where: { igdbId: { in: enrichedGame.multiplayer_modes } }
      })
    }

    // Fetch age rating details if age rating IDs exist
    let ageRatingDetails: any[] = []
    if (enrichedGame.age_ratings && Array.isArray(enrichedGame.age_ratings)) {
      const ageRatings = await prisma.igdbAgeRatings.findMany({
        where: { igdbId: { in: enrichedGame.age_ratings } }
      })
      
      // For each age rating, also fetch the category name
      for (const ageRating of ageRatings) {
        let categoryName = null
        if (ageRating.rating_category) {
          const category = await prisma.igdbAgeRatingCategories.findUnique({
            where: { igdbId: ageRating.rating_category }
          })
          categoryName = category?.rating || null
        }
        ageRatingDetails.push({
          ...ageRating,
          categoryName
        })
      }
    }

    // Fetch alternative name details if alternative name IDs exist
    let alternativeNameDetails: any[] = []
    if (enrichedGame.alternative_names && Array.isArray(enrichedGame.alternative_names)) {
      alternativeNameDetails = await prisma.igdbAlternativeNames.findMany({
        where: { igdbId: { in: enrichedGame.alternative_names } }
      })
    }

    // Fetch game engine details if game engine IDs exist
    let gameEngineDetails: any[] = []
    if (enrichedGame.game_engines && Array.isArray(enrichedGame.game_engines)) {
      gameEngineDetails = await prisma.igdbGameEngines.findMany({
        where: { igdbId: { in: enrichedGame.game_engines } }
      })
    }

    // Fetch game type details if game type ID exists
    let gameTypeDetails = null
    if (game.game_type) {
      gameTypeDetails = await prisma.igdbGameTypes.findUnique({
        where: { igdbId: game.game_type }
      })
    }

    // Return enriched game data with resolved references
    const finalGame = {
      ...enrichedGame,
      coverDetails,
      screenshotDetails,
      genreDetails,
      companyDetails,
      franchiseDetails,
      multiplayerModeDetails,
      ageRatingDetails,
      alternativeNameDetails,
      gameEngineDetails,
      gameTypeDetails
    }

    return NextResponse.json(finalGame)
  } catch (error) {
    console.error('Error fetching game details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch game details' },
      { status: 500 }
    )
  }
}
