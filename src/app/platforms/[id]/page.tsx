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
  InputAdornment
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
  }, [platformId, user])

  // Filter games based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredGames(userGames)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = userGames.filter(game => {
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
      setFilteredGames(filtered)
    }
  }, [userGames, searchQuery])
  
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
                {searchQuery && (
                  <span> • {filteredGames.length} matching search</span>
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
      </Paper>

      {/* Search Bar */}
      {userGames.length > 0 && (
        <Paper sx={{ p: 2, mb: 3, backgroundColor: theme.palette.mode === 'dark' ? 'grey.800' : 'background.paper' }}>
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
              }
            }}
          />
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
        </Paper>
      ) : filteredGames.length === 0 ? (
        // No search results
        <Paper sx={{ 
          p: 4, 
          textAlign: 'center',
          borderRadius: 3,
          background: theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, #2c2c2c 0%, #404040 100%)'
            : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
        }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            No games found matching "{searchQuery}"
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Try searching with a different term or check the alternative names for your games.
          </Typography>
          <Button
            variant="outlined"
            onClick={() => setSearchQuery('')}
            sx={{ mr: 2 }}
          >
            Clear Search
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
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, flex: 1 }}>
                    {game.name}
                  </Typography>
                  <Chip
                    label={game.status}
                    color={getStatusColor(game.status) as any}
                    size="small"
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
                      </Typography>
                      <Chip
                        label={game.condition.replace('_', ' ')}
                        size="small"
                        variant="outlined"
                        sx={{ ml: 1 }}
                      />
                    </Box>
                  )}
                  
                  {game.igdbDetails?.genres && (
                    <Typography variant="body2" color="text.secondary">
                      <strong>Genres:</strong> Available in details
                    </Typography>
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
                <TableCell sx={{ fontWeight: 600 }}>Details Available</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Rating</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>            <TableBody>
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
                >                  <TableCell>
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
                      )}
                      {game.condition && (
                        <Chip
                          label={game.condition.replace('_', ' ')}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={game.status}
                      color={getStatusColor(game.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                      {game.igdbDetails?.genres && (
                        <Chip label="Genres" size="small" variant="outlined" color="primary" />
                      )}
                      {game.igdbDetails?.franchise && (
                        <Chip label="Franchise" size="small" variant="outlined" color="secondary" />
                      )}
                      {game.igdbDetails?.involved_companies && (
                        <Chip label="Companies" size="small" variant="outlined" color="info" />
                      )}
                      {game.igdbDetails?.multiplayer_modes && (
                        <Chip label="Multiplayer" size="small" variant="outlined" color="success" />
                      )}
                      {!game.igdbGameId && (
                        <Chip label="Custom Game" size="small" variant="outlined" color="warning" />
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
