'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { jwtDecode } from 'jwt-decode'
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  useTheme,
  useMediaQuery,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import { Add as AddIcon, Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material'
import GameDetailDialog from '../../ui/GameDetailDialog'
import AddGameDialog from '../../ui/AddGameDialog'
import GameTableList from '../../components/GameTableList'
import GameCardList from '../../components/GameCardList'

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
    // Resolved data from API
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

interface Platform {
  id: number
  name: string
  abbreviation?: string
  igdbPlatformId?: number
  igdbPlatformVersionId?: number
  platform_logo_base64?: string
}

interface DecodedToken {
  id: number
  email: string
  isAdmin: boolean
}

export default function PlatformGamesPage() {  const params = useParams()
  const router = useRouter()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('md'))
  const platformId = parseInt(params.id as string)
    const [platform, setPlatform] = useState<Platform | null>(null)
  const [userGames, setUserGames] = useState<GameWithIgdbDetails[]>([])
  const [filteredGames, setFilteredGames] = useState<GameWithIgdbDetails[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedGenre, setSelectedGenre] = useState<string>('')
  const [selectedFranchise, setSelectedFranchise] = useState<string>('')
  const [selectedCompany, setSelectedCompany] = useState<string>('')
  const [selectedMultiplayer, setSelectedMultiplayer] = useState<string>('')
  const [selectedStatus, setSelectedStatus] = useState<string>('') // '' = all, 'OWNED', 'WISHLISTED'
  const [availableGenres, setAvailableGenres] = useState<string[]>([])
  const [availableFranchises, setAvailableFranchises] = useState<string[]>([])
  const [availableCompanies, setAvailableCompanies] = useState<string[]>([])
  const [availableMultiplayerModes, setAvailableMultiplayerModes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<DecodedToken | null>(null)
    // Dialog states
  const [gameDetailOpen, setGameDetailOpen] = useState(false)
  const [addGameOpen, setAddGameOpen] = useState(false)
  const [selectedGame, setSelectedGame] = useState<GameWithIgdbDetails | null>(null)
  const [gameDetailLoading, setGameDetailLoading] = useState(false)

  // Authentication check
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
    }
  }, [router])
  useEffect(() => {
    if (user) {
      fetchPlatformAndGames()
    }
  }, [platformId, user])  // Extract available filters when userGames changes
  useEffect(() => {
    const genres = new Set<string>()
    const franchises = new Set<string>()
    const companies = new Set<string>()
    const multiplayerModes = new Set<string>()
    
    userGames.forEach(game => {
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
    })
    
    setAvailableGenres(Array.from(genres).sort())
    setAvailableFranchises(Array.from(franchises).sort())
    setAvailableCompanies(Array.from(companies).sort())
    setAvailableMultiplayerModes(Array.from(multiplayerModes).sort())
  }, [userGames])
  // Filter games based on search query and filters
  useEffect(() => {
    let filtered = userGames

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
    }    // Apply multiplayer filter
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

    setFilteredGames(filtered)
  }, [userGames, searchQuery, selectedGenre, selectedFranchise, selectedCompany, selectedMultiplayer, selectedStatus])
  
  const fetchPlatformAndGames = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch platform info
      const platformResponse = await fetch(`/api/platforms/${platformId}/details`)
      if (!platformResponse.ok) {
        if (platformResponse.status === 401) {
          throw new Error('You need to log in to view this platform')
        } else if (platformResponse.status === 404) {
          throw new Error('Platform not found')
        } else {
          const errorData = await platformResponse.json().catch(() => ({}))
          throw new Error(errorData.error || `Error ${platformResponse.status}: Failed to fetch platform info`)
        }
      }
      const platformData = await platformResponse.json()
      setPlatform(platformData)

      // Fetch user's games for this platform
      const gamesResponse = await fetch(`/api/user/games?platformId=${platformId}`)
      if (gamesResponse.ok) {
        const gamesData = await gamesResponse.json()
        
        // Fetch IGDB details for games that have igdbGameId
        const gamesWithDetails = await Promise.all(
          gamesData.map(async (game: UserGame) => {
            if (game.igdbGameId) {
              try {
                const igdbResponse = await fetch(`/api/igdb/games/${game.igdbGameId}`)
                if (igdbResponse.ok) {
                  const igdbDetails = await igdbResponse.json()
                  return { ...game, igdbDetails }
                }
              } catch (err) {
                console.error(`Failed to fetch IGDB details for game ${game.name}:`, err)
              }
            }
            return game
          })
        )
        
        setUserGames(gamesWithDetails)
      } else if (gamesResponse.status === 401) {
        throw new Error('You need to log in to view your games')
      } else {
        // If no games found or other error, that's okay - start with empty list
        console.warn('Failed to fetch games, starting with empty list')
        setUserGames([])
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load platform data')
    } finally {      setLoading(false)
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

  const handleAddGame = () => {
    setAddGameOpen(true)
  }
  const handleGameAdded = () => {
    setAddGameOpen(false)
    fetchPlatformAndGames() // Refresh the games list
  }

  const handleDeleteGame = async (gameId: number) => {
    try {
      const response = await fetch(`/api/user/games/${gameId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setUserGames(prev => prev.filter(game => game.id !== gameId))
      } else {
        console.error('Failed to delete game')
        // Handle error - maybe show a toast notification
      }
    } catch (error) {
      console.error('Error deleting game:', error)
    }  }

  if (!user || loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    )
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    )
  }

  if (!platform) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">Platform not found</Alert>
      </Container>
    )
  }
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>      <Paper 
        sx={{ 
          p: 4, 
          mb: 4, 
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(135deg, #2D4A5C 0%, #3E2B4F 100%)'
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: 3,
          backgroundImage: theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, rgba(45, 74, 92, 0.95) 0%, rgba(62, 43, 79, 0.95) 100%)'
            : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}
      ><Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            {/* Platform Logo */}
            {platform.platform_logo_base64 && (
              <Box sx={{ 
                width: { xs: 80, md: 120 }, 
                height: { xs: 80, md: 120 },
                borderRadius: 2,
                overflow: 'hidden',
                backgroundColor: 'rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <img
                  src={platform.platform_logo_base64}
                  alt={`${platform.name} logo`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.2))'
                  }}
                />
              </Box>
            )}
            
            {/* Platform Info */}
            <Box>
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 1 }}>
                {platform.name} Games
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
                Your game collection for {platform.name}
              </Typography>              <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                {userGames.length} {userGames.length === 1 ? 'game' : 'games'} in your collection
                {(searchQuery || selectedGenre || selectedFranchise || selectedCompany || selectedMultiplayer || selectedStatus) && (
                  <span> • {filteredGames.length} matching filters</span>
                )}
              </Typography>
            </Box>
          </Box>          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddGame}
            size="large"
            sx={{
              bgcolor: 'white',
              color: theme.palette.mode === 'dark' ? 'grey.900' : 'primary.main',
              fontWeight: 600,
              px: 3,
              py: 1.5,
              '&:hover': {
                bgcolor: theme.palette.mode === 'dark' ? 'grey.200' : 'grey.100',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 16px rgba(0,0,0,0.15)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            Add Game
          </Button>        </Box>
      </Paper>      {/* Search and Filter Bar */}
      {userGames.length > 0 && (        <Paper sx={{ p: 2, mb: 3, backgroundColor: theme.palette.mode === 'dark' ? 'grey.800' : 'background.paper' }}>
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' }, flexWrap: 'wrap' }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search games by name or alternative name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setSearchQuery('')}
                      edge="end"
                    >
                      <ClearIcon />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: theme.palette.mode === 'dark' ? 'grey.900' : 'background.default',
                },
                flex: { xs: '1', md: '2' }
              }}
            />
              {/* Filter Controls */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', flex: { xs: '1', md: '3' } }}>
              {/* Status Filter */}
              <FormControl sx={{ minWidth: 100, flex: 1 }}>
                <InputLabel size="small">Status</InputLabel>
                <Select
                  size="small"
                  value={selectedStatus}
                  label="Status"
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  sx={{
                    backgroundColor: theme.palette.mode === 'dark' ? 'grey.900' : 'background.default',
                  }}
                >
                  <MenuItem value="">
                    <em>All</em>
                  </MenuItem>
                  <MenuItem value="OWNED">Owned</MenuItem>
                  <MenuItem value="WISHLISTED">Wishlisted</MenuItem>
                </Select>
              </FormControl>

              {/* Genre Filter */}
              {availableGenres.length > 0 && (
                <FormControl sx={{ minWidth: 120, flex: 1 }}>
                  <InputLabel size="small">Genre</InputLabel>
                  <Select
                    size="small"
                    value={selectedGenre}
                    label="Genre"
                    onChange={(e) => setSelectedGenre(e.target.value)}
                    sx={{
                      backgroundColor: theme.palette.mode === 'dark' ? 'grey.900' : 'background.default',
                    }}
                  >
                    <MenuItem value="">
                      <em>All</em>
                    </MenuItem>
                    {availableGenres.map((genre) => (
                      <MenuItem key={genre} value={genre}>
                        {genre}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {/* Franchise Filter */}
              {availableFranchises.length > 0 && (
                <FormControl sx={{ minWidth: 120, flex: 1 }}>
                  <InputLabel size="small">Franchise</InputLabel>
                  <Select
                    size="small"
                    value={selectedFranchise}
                    label="Franchise"
                    onChange={(e) => setSelectedFranchise(e.target.value)}
                    sx={{
                      backgroundColor: theme.palette.mode === 'dark' ? 'grey.900' : 'background.default',
                    }}
                  >
                    <MenuItem value="">
                      <em>All</em>
                    </MenuItem>
                    {availableFranchises.map((franchise) => (
                      <MenuItem key={franchise} value={franchise}>
                        {franchise}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {/* Company Filter */}
              {availableCompanies.length > 0 && (
                <FormControl sx={{ minWidth: 120, flex: 1 }}>
                  <InputLabel size="small">Company</InputLabel>
                  <Select
                    size="small"
                    value={selectedCompany}
                    label="Company"
                    onChange={(e) => setSelectedCompany(e.target.value)}
                    sx={{
                      backgroundColor: theme.palette.mode === 'dark' ? 'grey.900' : 'background.default',
                    }}
                  >
                    <MenuItem value="">
                      <em>All</em>
                    </MenuItem>
                    {availableCompanies.map((company) => (
                      <MenuItem key={company} value={company}>
                        {company}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {/* Multiplayer Filter */}
              {availableMultiplayerModes.length > 0 && (
                <FormControl sx={{ minWidth: 120, flex: 1 }}>
                  <InputLabel size="small">Multiplayer</InputLabel>
                  <Select
                    size="small"
                    value={selectedMultiplayer}
                    label="Multiplayer"
                    onChange={(e) => setSelectedMultiplayer(e.target.value)}
                    sx={{
                      backgroundColor: theme.palette.mode === 'dark' ? 'grey.900' : 'background.default',
                    }}
                  >
                    <MenuItem value="">
                      <em>All</em>
                    </MenuItem>
                    {availableMultiplayerModes.map((mode) => (
                      <MenuItem key={mode} value={mode}>
                        {mode}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Box>
              {/* Clear All Filters Button */}
            {(searchQuery || selectedGenre || selectedFranchise || selectedCompany || selectedMultiplayer || selectedStatus) && (
              <Button
                variant="outlined"
                size="small"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedGenre('')
                  setSelectedFranchise('')
                  setSelectedCompany('')
                  setSelectedMultiplayer('')
                  setSelectedStatus('')
                }}
                sx={{ whiteSpace: 'nowrap' }}
              >
                Clear All
              </Button>
            )}
          </Box>
        </Paper>
      )}

      {userGames.length === 0 ? (<Paper sx={{ 
          p: 6, 
          textAlign: 'center',
          borderRadius: 3,
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, #2c2c2c 0%, #404040 100%)'
            : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
        }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            No games in your collection yet
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
            Start building your {platform.name} game collection by adding some games! 
            You can search from IGDB's extensive database or add custom games.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddGame}
            size="large"
            sx={{
              fontWeight: 600,
              px: 4,
              py: 1.5,
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 16px rgba(0,0,0,0.15)'
              },
              transition: 'all 0.2s ease'
            }}          >
            Add Your First Game
          </Button>
        </Paper>      ) : filteredGames.length === 0 ? (
        // No search/filter results
        <Paper sx={{ 
          p: 4, 
          textAlign: 'center',
          borderRadius: 3,
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, #2c2c2c 0%, #404040 100%)'
            : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
        }}>          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            No games found{searchQuery && ` matching "${searchQuery}"`}{selectedGenre && ` in genre "${selectedGenre}"`}{selectedFranchise && ` in franchise "${selectedFranchise}"`}{selectedCompany && ` by company "${selectedCompany}"`}{selectedMultiplayer && ` with "${selectedMultiplayer}"`}{selectedStatus && ` with status "${selectedStatus.toLowerCase()}"`}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {searchQuery || selectedGenre || selectedFranchise || selectedCompany || selectedMultiplayer || selectedStatus ? 
              'Try adjusting your search or filters, or add a new game to your collection.' :
              'Try searching with a different term or check the alternative names for your games.'
            }
          </Typography>
          <Button
            variant="outlined"
            onClick={() => {
              setSearchQuery('')
              setSelectedGenre('')
              setSelectedFranchise('')
              setSelectedCompany('')
              setSelectedMultiplayer('')
              setSelectedStatus('')
            }}
            sx={{ mr: 2 }}
          >
            Clear All Filters
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddGame}
          >
            Add New Game          </Button>
        </Paper>
      ) : isMobile ? (
        // Mobile Card Layout
        <GameCardList
          games={filteredGames}
          onGameClick={handleGameClick}
          onDeleteGame={handleDeleteGame}
          showPlatform={false}
        />
      ) : (
        // Desktop Table Layout
        <GameTableList
          games={filteredGames}
          onGameClick={handleGameClick}
          onDeleteGame={handleDeleteGame}
          showPlatform={false}
        />
      )}

      {/* Game Detail Dialog */}
      <GameDetailDialog        open={gameDetailOpen}
        onClose={() => {
          setGameDetailOpen(false)
          setGameDetailLoading(false) // Reset loading state when closing
        }}
        game={selectedGame}
        onGameUpdated={fetchPlatformAndGames}
        loadingDetails={gameDetailLoading}
      />

      {/* Add Game Dialog */}
      <AddGameDialog
        open={addGameOpen}
        onClose={() => setAddGameOpen(false)}
        platformId={platformId}
        platform={platform}
        onGameAdded={handleGameAdded}
      />
    </Container>
  )
}
