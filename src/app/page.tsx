"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Container, 
  Typography, 
  Box,
  Tabs,
  Tab,
  CircularProgress,
  Alert
} from '@mui/material'
import { VideogameAsset, GamepadOutlined } from '@mui/icons-material'
import Cookies from 'js-cookie'
import { jwtDecode } from 'jwt-decode'
import GameCardList from './components/GameCardList'
import GameTableList from './components/GameTableList'
import GameListFilters from './components/GameListFilters'
import PlatformListFilters from './components/PlatformListFilters'
import PlatformCardGrid from './components/PlatformCardGrid'
import GameDetailDialog from './ui/GameDetailDialog'
import { useLanguage } from '../contexts/LanguageContext'
import { useGameFilters } from './hooks/useGameFilters'
import { usePlatformFilters } from './hooks/usePlatformFilters'

interface DecodedToken {
  id: number
  email: string
  isAdmin: boolean
}

interface Platform {
  id: number
  name: string
  versionName?: string
  abbreviation?: string
  alternative_name?: string
  generation?: number
  familyName?: string
  typeName?: string
  imageUrl?: string
  description?: string
}

interface UserPlatform {
  id: number
  platform: Platform
  status: 'OWNED' | 'WISHLISTED'
}

interface GameWithIgdbDetails {
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
  igdbDetails?: any
}

export default function HomePage() {
  const [user, setUser] = useState<DecodedToken | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tabValue, setTabValue] = useState(0)
  const [isMobile, setIsMobile] = useState(false)
    // Game detail dialog state
  const [gameDetailOpen, setGameDetailOpen] = useState(false)
  const [selectedGame, setSelectedGame] = useState<GameWithIgdbDetails | null>(null)
  const [gameDetailLoading, setGameDetailLoading] = useState(false)
  
  // Games data and state
  const [allUserGames, setAllUserGames] = useState<GameWithIgdbDetails[]>([])
  const [gamesLoading, setGamesLoading] = useState(false)
  
  // Platform data and state
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [userPlatforms, setUserPlatforms] = useState<UserPlatform[]>([])
  const [platformLoading, setPlatformLoading] = useState<Record<number, 'adding' | 'removing' | null>>({})
  
  const router = useRouter()
  const { t } = useLanguage()

  // Game filters hook
  const gameFilters = useGameFilters(allUserGames)

  // Platform filters hook
  const platformFilters = usePlatformFilters()

  // Check if mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Auth check
  useEffect(() => {
    const token = Cookies.get('token')
    if (!token) {
      router.push('/login')
      return
    }
    
    try {
      const decoded = jwtDecode<DecodedToken>(token)
      setUser(decoded)
    } catch (error) {
      console.error('Invalid token:', error)
      Cookies.remove('token')
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }, [router])

  // Fetch user games when user is loaded or tab changes to games
  useEffect(() => {
    if (user && tabValue === 0) {
      fetchUserGames()
    }
  }, [user, tabValue])

  // Fetch platforms when user is loaded or tab changes to platforms
  useEffect(() => {
    if (user && tabValue === 1) {
      platformFilters.fetchFilterOptions()
      fetchPlatformData()
    }
  }, [user, tabValue, platformFilters.searchTerm, platformFilters.selectedFamily, platformFilters.selectedType, platformFilters.selectedGeneration])
  const fetchUserGames = async () => {
    setGamesLoading(true)
    try {
      const [gamesRes, platformsRes] = await Promise.all([
        fetch('/api/user/games', { credentials: 'include' }),
        fetch('/api/platforms/browse', { credentials: 'include' })
      ])
      
      if (gamesRes.ok && platformsRes.ok) {
        const games = await gamesRes.json()
        const platforms = await platformsRes.json()
        
        // Map platform data to games
        const gamesWithPlatforms = games.map((game: any) => ({
          ...game,
          platform: platforms.find((p: any) => p.id === game.platformId)
        }))
        
        setAllUserGames(gamesWithPlatforms)
      } else {
        setError(t('homepage_error_fetch_games'))
      }
    } catch (error) {
      setError(t('homepage_error_fetch_games'))
    } finally {
      setGamesLoading(false)
    }
  }
  const fetchPlatformData = async () => {
    try {
      const params = platformFilters.buildQueryParams()
      const [platformsRes, userPlatformsRes] = await Promise.all([
        fetch(`/api/platforms/browse?${params.toString()}`),
        fetch('/api/user/platforms', { credentials: 'include' })
      ])

      if (platformsRes.ok) {
        const platforms = await platformsRes.json()
        setPlatforms(platforms)
      }

      if (userPlatformsRes.ok) {
        const userPlatforms = await userPlatformsRes.json()
        setUserPlatforms(userPlatforms)
      }
    } catch (error) {
      setError(t('homepage_error_fetch_platforms'))
    }
  }
  const handleGameClick = async (game: GameWithIgdbDetails) => {
    // Prevent multiple clicks while loading
    if (gameDetailLoading) return
    
    // Open modal immediately with basic game data
    setSelectedGame(game)
    setGameDetailOpen(true)
    
    // If the game has IGDB ID, fetch additional details
    if (game.igdbGameId) {
      setGameDetailLoading(true)
      try {
        const response = await fetch(`/api/igdb/games/${game.igdbGameId}`)
        if (response.ok) {
          const igdbDetails = await response.json()
          const gameWithDetails = { ...game, igdbDetails }
          setSelectedGame(gameWithDetails)
        }
      } catch (err) {
        console.error('Failed to fetch IGDB details:', err)
      } finally {
        setGameDetailLoading(false)
      }
    }
  }
  const handleDeleteGame = async (gameId: number) => {
    try {
      const response = await fetch(`/api/user/games/${gameId}`, {
        method: 'DELETE',
        credentials: 'include'
      })
      if (response.ok) {
        fetchUserGames() // Refresh games
      } else {
        setError(t('homepage_error_delete_game'))
      }
    } catch (error) {
      setError(t('homepage_error_delete_game'))
    }
  }

  const handlePlatformClick = (platformId: number) => {
    router.push(`/platforms/${platformId}`)
  }

  const handleShowPlatformDetails = (platformId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    // You can implement platform details modal here
    console.log('Platform details:', platformId)
  }
  const handleAddPlatform = async (platformId: number, status: 'OWNED' | 'WISHLISTED') => {
    setPlatformLoading(prev => ({ ...prev, [platformId]: 'adding' }))
    try {
      const response = await fetch('/api/user/platforms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ platformId, status })
      })

      if (response.ok) {
        fetchPlatformData() // Refresh data
      } else {
        setError(t('homepage_error_add_platform'))
      }
    } catch (error) {
      setError(t('homepage_error_add_platform'))
    } finally {
      setPlatformLoading(prev => ({ ...prev, [platformId]: null }))
    }
  }
  const handleRemovePlatform = async (platformId: number) => {
    setPlatformLoading(prev => ({ ...prev, [platformId]: 'removing' }))
    try {
      const response = await fetch('/api/user/platforms', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ platformId })
      })

      if (response.ok) {
        fetchPlatformData() // Refresh data
      } else {
        setError(t('homepage_error_remove_platform'))
      }
    } catch (error) {
      setError(t('homepage_error_remove_platform'))
    } finally {
      setPlatformLoading(prev => ({ ...prev, [platformId]: null }))
    }
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Typography variant="h4" gutterBottom sx={{ mb: 3, textAlign: 'center' }}>
        {t('homepage_title')}
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="collection tabs">
          <Tab 
            icon={<VideogameAsset />} 
            label={t('homepage_tab_games')}
            iconPosition="start"
            sx={{ minHeight: 64 }}
          />
          <Tab 
            icon={<GamepadOutlined />} 
            label={t('homepage_tab_platforms')} 
            iconPosition="start"
            sx={{ minHeight: 64 }}
          />
        </Tabs>
      </Box>

      {/* Games Tab */}
      {tabValue === 0 && (
        <Box>
          {gamesLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
              <CircularProgress />
            </Box>
          ) : (
            <>
              <GameListFilters
                searchQuery={gameFilters.searchQuery}
                onSearchChange={gameFilters.setSearchQuery}
                selectedStatus={gameFilters.selectedStatus}
                onStatusChange={gameFilters.setSelectedStatus}
                selectedGenre={gameFilters.selectedGenre}
                onGenreChange={gameFilters.setSelectedGenre}
                selectedFranchise={gameFilters.selectedFranchise}
                onFranchiseChange={gameFilters.setSelectedFranchise}
                selectedCompany={gameFilters.selectedCompany}
                onCompanyChange={gameFilters.setSelectedCompany}
                selectedMultiplayer={gameFilters.selectedMultiplayer}
                onMultiplayerChange={gameFilters.setSelectedMultiplayer}
                selectedPlatform={gameFilters.selectedPlatform}
                onPlatformChange={gameFilters.setSelectedPlatform}
                availableGenres={gameFilters.availableGenres}
                availableFranchises={gameFilters.availableFranchises}
                availableCompanies={gameFilters.availableCompanies}
                availableMultiplayerModes={gameFilters.availableMultiplayerModes}
                availablePlatforms={gameFilters.availablePlatforms}
                onClearAll={gameFilters.clearAllFilters}
                showPlatformFilter={true}
              />              {gameFilters.filteredGames.length === 0 ? (
                <Typography variant="h6" textAlign="center" sx={{ mt: 4, opacity: 0.7 }}>
                  {allUserGames.length === 0 ? t('homepage_no_games') : t('homepage_no_filtered_games')}
                </Typography>
              ) : (
                <>
                  {isMobile ? (
                    <GameCardList
                      games={gameFilters.filteredGames}
                      onGameClick={handleGameClick}
                      onDeleteGame={handleDeleteGame}
                      showPlatform={true}
                    />
                  ) : (
                    <GameTableList
                      games={gameFilters.filteredGames}
                      onGameClick={handleGameClick}
                      onDeleteGame={handleDeleteGame}
                      showPlatform={true}
                    />
                  )}
                </>
              )}
            </>
          )}
        </Box>
      )}

      {/* Platforms Tab */}
      {tabValue === 1 && (
        <Box>
          <PlatformListFilters
            searchTerm={platformFilters.searchTerm}
            selectedGeneration={platformFilters.selectedGeneration}
            selectedFamily={platformFilters.selectedFamily}
            selectedType={platformFilters.selectedType}
            filterOptions={platformFilters.filterOptions}
            resultCount={platforms.length}
            onSearchChange={platformFilters.setSearchTerm}
            onGenerationChange={platformFilters.setSelectedGeneration}
            onFamilyChange={platformFilters.setSelectedFamily}
            onTypeChange={platformFilters.setSelectedType}
            onClearFilters={platformFilters.clearFilters}
          />          {platforms.length === 0 ? (
            <Typography variant="h6" textAlign="center" sx={{ mt: 4, opacity: 0.7 }}>
              {t('homepage_no_platforms')}
            </Typography>
          ) : (
            <PlatformCardGrid
              platforms={platforms}
              userPlatforms={userPlatforms}
              platformLoading={platformLoading}
              onPlatformClick={handlePlatformClick}
              onShowDetails={handleShowPlatformDetails}
              onAddPlatform={handleAddPlatform}
              onRemovePlatform={handleRemovePlatform}
            />          )}
        </Box>
      )}
      
      {/* Game Detail Dialog */}      <GameDetailDialog
        open={gameDetailOpen}
        onClose={() => {
          setGameDetailOpen(false)
          setGameDetailLoading(false) // Reset loading state when closing
        }}
        game={selectedGame}
        onGameUpdated={fetchUserGames}
        loadingDetails={gameDetailLoading}
      />
    </Container>
  )
}
