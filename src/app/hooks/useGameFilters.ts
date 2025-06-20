import { useState, useEffect, useMemo } from 'react'

interface UserGame {
  id: number
  userId: number
  platformId: number
  igdbGameId: number | null
  name: string
  rating: number | null
  status: 'OWNED' | 'WISHLISTED'
  condition: 'MINT' | 'NEAR_MINT' | 'EXCELLENT' | 'VERY_GOOD' | 'GOOD' | 'FAIR' | 'POOR' | 'SEALED' | null
  notes: string | null
  createdAt: string
  updatedAt: string
  platform?: {
    id: number
    name: string
    abbreviation?: string
    platform_logo_base64?: string
  }
}

interface GameWithIgdbDetails extends UserGame {
  igdbDetails?: {
    name: string
    rating: number | null
    storyline: string | null
    cover: number | null
    screenshots: string | null
    alternative_names: string | null
    genres: string | null
    franchise: number | null
    involved_companies: string | null
    multiplayer_modes: string | null
    age_ratings: string | null
    game_engines: string | null
    game_type: number | null
    coverDetails?: {
      igdbId: number
      height?: number
      image_id?: string
      url?: string
      width?: number
    }
    screenshotDetails?: Array<{
      igdbId: number
      height?: number
      image_id?: string
      url?: string
      width?: number
    }>
    genreDetails?: Array<{
      igdbId: number
      name: string
    }>
    companyDetails?: Array<{
      igdbId: number
      name: string
    }>
    franchiseDetails?: {
      igdbId: number
      name: string
    }
    multiplayerModeDetails?: Array<{
      igdbId: number
      lancoop?: boolean
      offlinecoop?: boolean
      onlinecoop?: boolean
      splitscreen?: boolean
    }>
    ageRatingDetails?: Array<{
      igdbId: number
      rating_category?: number
      rating_cover_url?: string
      categoryName?: string
    }>
    alternativeNameDetails?: Array<{
      igdbId: number
      name: string
    }>
    gameEngineDetails?: Array<{
      igdbId: number
      name: string
    }>
    gameTypeDetails?: {
      igdbId: number
      type: string
    }
  }
}

export function useGameFilters(games: GameWithIgdbDetails[]) {
  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGenre, setSelectedGenre] = useState<string>('')
  const [selectedFranchise, setSelectedFranchise] = useState<string>('')
  const [selectedCompany, setSelectedCompany] = useState<string>('')
  const [selectedMultiplayer, setSelectedMultiplayer] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')
  const [selectedPlatform, setSelectedPlatform] = useState<string>('')

  // Available filter options (extracted from games)
  const filterOptions = useMemo(() => {
    const genres = new Set<string>()
    const franchises = new Set<string>()
    const companies = new Set<string>()
    const multiplayerModes = new Set<string>()
    const platforms = new Map<number, { id: number; name: string; abbreviation?: string }>()
    
    games.forEach(game => {
      // Extract genres
      if (game.igdbDetails?.genreDetails) {
        game.igdbDetails.genreDetails.forEach(genre => {
          if (genre.name) {
            genres.add(genre.name)
          }
        })
      }
      
      // Extract franchises
      if (game.igdbDetails?.franchiseDetails?.name) {
        franchises.add(game.igdbDetails.franchiseDetails.name)
      }
      
      // Extract companies
      if (game.igdbDetails?.companyDetails) {
        game.igdbDetails.companyDetails.forEach(company => {
          if (company.name) {
            companies.add(company.name)
          }
        })
      }
      
      // Extract multiplayer modes
      if (game.igdbDetails?.multiplayerModeDetails) {
        game.igdbDetails.multiplayerModeDetails.forEach(mode => {
          if (mode.lancoop) multiplayerModes.add('LAN Co-op')
          if (mode.offlinecoop) multiplayerModes.add('Offline Co-op')
          if (mode.onlinecoop) multiplayerModes.add('Online Co-op')
          if (mode.splitscreen) multiplayerModes.add('Split Screen')
        })
      }

      // Extract platforms
      if (game.platform) {
        platforms.set(game.platform.id, {
          id: game.platform.id,
          name: game.platform.name,
          abbreviation: game.platform.abbreviation
        })
      }
    })
    
    return {
      availableGenres: Array.from(genres).sort(),
      availableFranchises: Array.from(franchises).sort(),
      availableCompanies: Array.from(companies).sort(),
      availableMultiplayerModes: Array.from(multiplayerModes).sort(),
      availablePlatforms: Array.from(platforms.values()).sort((a, b) => a.name.localeCompare(b.name))
    }
  }, [games])

  // Filter games based on all active filters
  const filteredGames = useMemo(() => {
    let filtered = games

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(game => {
        // Search in main game name
        if (game.name.toLowerCase().includes(query)) {
          return true
        }
        
        // Search in alternative names if IGDB details are available
        if (game.igdbDetails?.alternativeNameDetails) {
          return game.igdbDetails.alternativeNameDetails.some(altName => 
            altName.name.toLowerCase().includes(query)
          )
        }
        
        return false
      })
    }

    // Apply genre filter
    if (selectedGenre) {
      filtered = filtered.filter(game => {
        if (game.igdbDetails?.genreDetails) {
          return game.igdbDetails.genreDetails.some(genre => genre.name === selectedGenre)
        }
        return false
      })
    }

    // Apply franchise filter
    if (selectedFranchise) {
      filtered = filtered.filter(game => {
        return game.igdbDetails?.franchiseDetails?.name === selectedFranchise
      })
    }

    // Apply company filter
    if (selectedCompany) {
      filtered = filtered.filter(game => {
        if (game.igdbDetails?.companyDetails) {
          return game.igdbDetails.companyDetails.some(company => company.name === selectedCompany)
        }
        return false
      })
    }

    // Apply multiplayer filter
    if (selectedMultiplayer) {
      filtered = filtered.filter(game => {
        if (game.igdbDetails?.multiplayerModeDetails) {
          return game.igdbDetails.multiplayerModeDetails.some(mode => {
            switch (selectedMultiplayer) {
              case 'LAN Co-op': return mode.lancoop
              case 'Offline Co-op': return mode.offlinecoop
              case 'Online Co-op': return mode.onlinecoop
              case 'Split Screen': return mode.splitscreen
              default: return false
            }
          })
        }
        return false
      })
    }

    // Apply status filter
    if (selectedStatus) {
      filtered = filtered.filter(game => {
        return game.status === selectedStatus
      })
    }

    // Apply platform filter
    if (selectedPlatform) {
      filtered = filtered.filter(game => {
        return game.platform?.id.toString() === selectedPlatform
      })
    }

    return filtered
  }, [games, searchQuery, selectedGenre, selectedFranchise, selectedCompany, selectedMultiplayer, selectedStatus, selectedPlatform])

  // Clear all filters
  const clearAllFilters = () => {
    setSearchQuery('')
    setSelectedGenre('')
    setSelectedFranchise('')
    setSelectedCompany('')
    setSelectedMultiplayer('')
    setSelectedStatus('')
    setSelectedPlatform('')
  }

  return {
    // Filter states
    searchQuery,
    setSearchQuery,
    selectedGenre,
    setSelectedGenre,
    selectedFranchise,
    setSelectedFranchise,
    selectedCompany,
    setSelectedCompany,
    selectedMultiplayer,
    setSelectedMultiplayer,
    selectedStatus,
    setSelectedStatus,
    selectedPlatform,
    setSelectedPlatform,

    // Filter options
    ...filterOptions,

    // Filtered results
    filteredGames,

    // Utility functions
    clearAllFilters
  }
}
