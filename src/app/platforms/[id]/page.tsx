'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { jwtDecode } from 'jwt-decode'
import {
  Container,
  Typography,  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  CircularProgress,
  Alert,  Card,
  CardContent,
  CardActions,
  Stack,
  useTheme,
  useMediaQuery,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material'
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material'
import GameDetailDialog from '../../ui/GameDetailDialog'
import AddGameDialog from '../../ui/AddGameDialog'

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
    } finally {
      setLoading(false)
    }
  }
  const handleGameClick = async (game: GameWithIgdbDetails) => {
    let gameWithDetails = game
    
    // If the game has IGDB ID, fetch additional details
    if (game.igdbGameId) {
      try {
        const response = await fetch(`/api/igdb/games/${game.igdbGameId}`)
        if (response.ok) {
          const igdbDetails = await response.json()
          gameWithDetails = { ...game, igdbDetails }
        }
      } catch (err) {
        console.error('Failed to fetch IGDB details:', err)
      }
    }
    
    setSelectedGame(gameWithDetails)
    setGameDetailOpen(true)
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
        fetchPlatformAndGames() // Refresh the games list
      } else {
        setError('Failed to delete game')
      }
    } catch (err) {
      setError('Failed to delete game')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OWNED': return 'success'
      case 'WISHLISTED': return 'primary'
      default: return 'default'
    }
  }

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'NEW': return 'success'
      case 'USED': return 'warning'
      case 'DAMAGED': return 'error'
      case 'BROKEN': return 'error'
      default: return 'default'
    }
  }
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
            Add New Game
          </Button>
        </Paper>
      ) : isMobile ? (
        // Mobile Card Layout
        <Stack spacing={2}>
          {filteredGames.map((game) => (<Card 
              key={game.id}
              sx={{ 
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: theme.palette.mode === 'dark' ? 'grey.800' : 'background.paper',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: theme.palette.mode === 'dark' ? 
                    '0 4px 20px rgba(255, 255, 255, 0.1)' : 
                    '0 4px 20px rgba(0, 0, 0, 0.1)',
                }
              }}
              onClick={() => handleGameClick(game)}
            >
              <CardContent>                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
                    {game.name}
                  </Typography>
                  <Chip
                    label={game.status}
                    color={getStatusColor(game.status) as any}
                    size="small"
                    onClick={() => {}}
                  />
                </Box>
                  <Stack spacing={1}>
                  {/* Alternative Names */}
                  {game.igdbDetails?.alternativeNameDetails && game.igdbDetails.alternativeNameDetails.length > 0 && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" component="span">
                        Also known as: 
                      </Typography>
                      <Typography variant="body2" component="span" sx={{ ml: 1, fontStyle: 'italic' }}>
                        {game.igdbDetails.alternativeNameDetails.slice(0, 3).map(altName => altName.name).join(', ')}
                        {game.igdbDetails.alternativeNameDetails.length > 3 && '...'}
                      </Typography>
                    </Box>
                  )}
                  
                  {game.condition && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" component="span">
                        Condition: 
                      </Typography>                      <Chip
                        label={game.condition.replace('_', ' ')}
                        size="small"
                        variant="outlined"
                        onClick={() => {}}
                        sx={{ ml: 1 }}
                      />
                    </Box>                  )}
                    {/* Genres */}
                  {game.igdbDetails?.genreDetails && game.igdbDetails.genreDetails.length > 0 && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" component="span">
                        Genres: 
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                        {game.igdbDetails.genreDetails.slice(0, 4).map((genre) => (
                          <Chip 
                            key={genre.igdbId}
                            label={genre.name} 
                            size="small" 
                            variant="outlined" 
                            color="primary"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedGenre(genre.name)
                            }}
                            sx={{ 
                              cursor: 'pointer',
                              '&:hover': {
                                backgroundColor: 'primary.light',
                                color: 'primary.contrastText'
                              }
                            }}
                          />
                        ))}
                        {game.igdbDetails.genreDetails.length > 4 && (
                          <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center', ml: 1 }}>
                            +{game.igdbDetails.genreDetails.length - 4} more
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  )}
                  
                  {/* Franchise */}
                  {game.igdbDetails?.franchiseDetails && (
                    <Box>
                      <Chip 
                        label={`📚 ${game.igdbDetails.franchiseDetails.name}`} 
                        size="small" 
                        variant="outlined" 
                        color="secondary"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (game.igdbDetails?.franchiseDetails?.name) {
                            setSelectedFranchise(game.igdbDetails.franchiseDetails.name)
                          }
                        }}
                        sx={{ 
                          cursor: 'pointer',
                          '&:hover': {
                            backgroundColor: 'secondary.light',
                            color: 'secondary.contrastText'
                          }
                        }}
                      />
                    </Box>
                  )}
                  
                  {/* Companies */}
                  {game.igdbDetails?.companyDetails && game.igdbDetails.companyDetails.length > 0 && (
                    <Box>
                      <Typography variant="body2" color="text.secondary" component="span">
                        Companies: 
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                        {game.igdbDetails.companyDetails.slice(0, 3).map((company) => (
                          <Chip 
                            key={company.igdbId}
                            label={company.name} 
                            size="small" 
                            variant="outlined" 
                            color="info"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedCompany(company.name)
                            }}
                            sx={{ 
                              cursor: 'pointer',
                              '&:hover': {
                                backgroundColor: 'info.light',
                                color: 'info.contrastText'
                              }
                            }}
                          />
                        ))}
                        {game.igdbDetails.companyDetails.length > 3 && (
                          <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center', ml: 1 }}>
                            +{game.igdbDetails.companyDetails.length - 3} more
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  )}

                  {game.igdbDetails?.franchise && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>Franchise:</strong> Available in details
                    </Typography>
                  )}
                  
                  {game.rating && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>Rating:</strong> {Math.round(game.rating)}/100
                    </Typography>
                  )}
                </Stack>
              </CardContent>
              
              <CardActions sx={{ justifyContent: 'flex-end', pt: 0 }}>
                <IconButton
                  size="small"
                  color="error"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteGame(game.id)
                  }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </CardActions>
            </Card>
          ))}
        </Stack>
      ) : (
        // Desktop Table Layout
        <TableContainer 
          component={Paper} 
          sx={{ 
            borderRadius: 2, 
            overflow: 'hidden',
            backgroundColor: theme.palette.mode === 'dark' ? 'grey.900' : 'background.paper'
          }}
        >
          <Table>
            <TableHead sx={{ 
              bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100'
            }}>
                <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Details</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Rating</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredGames.map((game) => (
                <TableRow
                  key={game.id}
                  hover
                  sx={{ 
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: 'action.hover'
                    }
                  }}
                  onClick={() => handleGameClick(game)}
                >
                <TableCell>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
                        {game.name}
                      </Typography>
                      {/* Alternative Names */}
                      {game.igdbDetails?.alternativeNameDetails && game.igdbDetails.alternativeNameDetails.length > 0 && (
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mb: 0.5 }}>
                          Also: {game.igdbDetails.alternativeNameDetails.slice(0, 2).map(altName => altName.name).join(', ')}
                          {game.igdbDetails.alternativeNameDetails.length > 2 && '...'}
                        </Typography>
                      )}                      {game.condition && (
                        <Chip
                          label={game.condition.replace('_', ' ')}
                          size="small"
                          variant="outlined"
                          onClick={() => {}}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={game.status}
                      color={getStatusColor(game.status) as any}
                      size="small"
                      onClick={() => {}}
                    />
                  </TableCell>
                  <TableCell>
                    <Stack spacing={1}>
                      {/* Genres */}
                      {game.igdbDetails?.genreDetails && game.igdbDetails.genreDetails.length > 0 && (
                        <Box>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap">
                            {game.igdbDetails.genreDetails.slice(0, 3).map((genre) => (
                              <Chip 
                                key={genre.igdbId}
                                label={genre.name} 
                                size="small" 
                                variant="outlined" 
                                color="primary"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedGenre(genre.name)
                                }}
                                sx={{ 
                                  cursor: 'pointer',
                                  '&:hover': {
                                    backgroundColor: 'primary.light',
                                    color: 'primary.contrastText'
                                  }
                                }}
                              />
                            ))}
                            {game.igdbDetails.genreDetails.length > 3 && (
                              <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                                +{game.igdbDetails.genreDetails.length - 3}
                              </Typography>
                            )}
                          </Stack>
                        </Box>
                      )}
                        {/* Franchise */}
                      {game.igdbDetails?.franchiseDetails && (
                        <Chip 
                          label={`📚 ${game.igdbDetails.franchiseDetails.name}`} 
                          size="small" 
                          variant="outlined" 
                          color="secondary"
                          onClick={(e) => {
                            e.stopPropagation()
                            if (game.igdbDetails?.franchiseDetails?.name) {
                              setSelectedFranchise(game.igdbDetails.franchiseDetails.name)
                            }
                          }}
                          sx={{ 
                            cursor: 'pointer',
                            maxWidth: 'fit-content',
                            '&:hover': {
                              backgroundColor: 'secondary.light',
                              color: 'secondary.contrastText'
                            }
                          }}
                        />
                      )}
                      
                      {/* Companies */}
                      {game.igdbDetails?.companyDetails && game.igdbDetails.companyDetails.length > 0 && (
                        <Box>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap">
                            {game.igdbDetails.companyDetails.slice(0, 2).map((company) => (
                              <Chip 
                                key={company.igdbId}
                                label={`🏢 ${company.name}`} 
                                size="small" 
                                variant="outlined" 
                                color="info"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedCompany(company.name)
                                }}
                                sx={{ 
                                  cursor: 'pointer',
                                  '&:hover': {
                                    backgroundColor: 'info.light',
                                    color: 'info.contrastText'
                                  }
                                }}
                              />
                            ))}
                            {game.igdbDetails.companyDetails.length > 2 && (
                              <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                                +{game.igdbDetails.companyDetails.length - 2}
                              </Typography>
                            )}
                          </Stack>
                        </Box>
                      )}
                      
                      {/* Multiplayer Modes */}
                      {game.igdbDetails?.multiplayerModeDetails && game.igdbDetails.multiplayerModeDetails.length > 0 && (
                        <Box>
                          <Stack direction="row" spacing={0.5} flexWrap="wrap">
                            {game.igdbDetails.multiplayerModeDetails.map((mode, index) => (
                              <Box key={index}>
                                {mode.lancoop && (
                                  <Chip 
                                    label="🔗 LAN Co-op" 
                                    size="small" 
                                    variant="outlined" 
                                    color="success"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedMultiplayer('LAN Co-op')
                                    }}
                                    sx={{ 
                                      cursor: 'pointer',
                                      mr: 0.5,
                                      mb: 0.5,
                                      '&:hover': {
                                        backgroundColor: 'success.light',
                                        color: 'success.contrastText'
                                      }
                                    }}
                                  />
                                )}
                                {mode.offlinecoop && (
                                  <Chip 
                                    label="👥 Offline Co-op" 
                                    size="small" 
                                    variant="outlined" 
                                    color="success"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedMultiplayer('Offline Co-op')
                                    }}
                                    sx={{ 
                                      cursor: 'pointer',
                                      mr: 0.5,
                                      mb: 0.5,
                                      '&:hover': {
                                        backgroundColor: 'success.light',
                                        color: 'success.contrastText'
                                      }
                                    }}
                                  />
                                )}
                                {mode.onlinecoop && (
                                  <Chip 
                                    label="🌐 Online Co-op" 
                                    size="small" 
                                    variant="outlined" 
                                    color="success"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedMultiplayer('Online Co-op')
                                    }}
                                    sx={{ 
                                      cursor: 'pointer',
                                      mr: 0.5,
                                      mb: 0.5,
                                      '&:hover': {
                                        backgroundColor: 'success.light',
                                        color: 'success.contrastText'
                                      }
                                    }}
                                  />
                                )}
                                {mode.splitscreen && (
                                  <Chip 
                                    label="📺 Split Screen" 
                                    size="small" 
                                    variant="outlined" 
                                    color="success"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedMultiplayer('Split Screen')
                                    }}
                                    sx={{ 
                                      cursor: 'pointer',
                                      mr: 0.5,
                                      mb: 0.5,
                                      '&:hover': {
                                        backgroundColor: 'success.light',
                                        color: 'success.contrastText'
                                      }
                                    }}
                                  />
                                )}
                              </Box>
                            ))}
                          </Stack>
                        </Box>
                      )}
                        {/* Custom Game indicator */}
                      {!game.igdbGameId && (
                        <Chip label="📝 Custom Game" size="small" variant="outlined" color="warning" onClick={() => {}} />
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    {game.rating ? (
                      <Chip 
                        label={`${Math.round(game.rating)}/100`} 
                        size="small" 
                        color="primary"
                        variant="outlined"
                        onClick={() => {}}
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteGame(game.id)
                      }}
                      sx={{
                        '&:hover': {
                          backgroundColor: 'error.light',
                          color: 'error.contrastText'
                        }
                      }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Game Detail Dialog */}
      <GameDetailDialog
        open={gameDetailOpen}
        onClose={() => setGameDetailOpen(false)}
        game={selectedGame}
        onGameUpdated={fetchPlatformAndGames}
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
