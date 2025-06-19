'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Container,
  Typography,
  Box,
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
  Alert
} from '@mui/material'
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material'
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
}

export default function PlatformGamesPage() {
  const params = useParams()
  const router = useRouter()
  const platformId = parseInt(params.id as string)
  const [platform, setPlatform] = useState<Platform | null>(null)
  const [userGames, setUserGames] = useState<GameWithIgdbDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Dialog states
  const [gameDetailOpen, setGameDetailOpen] = useState(false)
  const [addGameOpen, setAddGameOpen] = useState(false)
  const [selectedGame, setSelectedGame] = useState<GameWithIgdbDetails | null>(null)

  useEffect(() => {
    fetchPlatformAndGames()
  }, [platformId])

  const fetchPlatformAndGames = async () => {
    try {
      setLoading(true)
        // Fetch platform info
      const platformResponse = await fetch(`/api/platforms/${platformId}/details`)
      if (!platformResponse.ok) {
        throw new Error('Platform not found')
      }
      const platformData = await platformResponse.json()
      setPlatform(platformData)

      // Fetch user's games for this platform
      const gamesResponse = await fetch(`/api/user/games?platformId=${platformId}`)
      if (gamesResponse.ok) {
        const gamesData = await gamesResponse.json()
        setUserGames(gamesData)
      } else {
        // If no games found, that's okay - start with empty list
        setUserGames([])
      }
    } catch (err) {
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

  if (loading) {
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
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            {platform.name} Games
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Your game collection for {platform.name}
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddGame}
          size="large"
        >
          Add Game
        </Button>
      </Box>

      {userGames.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No games in your collection yet
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Start building your {platform.name} game collection by adding some games!
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddGame}
          >
            Add Your First Game
          </Button>
        </Paper>
      ) : (        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Name</strong></TableCell>
                <TableCell><strong>Alternative Names</strong></TableCell>
                <TableCell><strong>Status</strong></TableCell>
                <TableCell><strong>Genres</strong></TableCell>
                <TableCell><strong>Franchise</strong></TableCell>
                <TableCell><strong>Companies</strong></TableCell>
                <TableCell><strong>Multiplayer</strong></TableCell>
                <TableCell><strong>Actions</strong></TableCell>              
                </TableRow>
            </TableHead>
            <TableBody>
              {userGames.map((game) => (
                <TableRow
                  key={game.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handleGameClick(game)}
                >
                  <TableCell>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      {game.name}
                    </Typography>
                    {game.condition && (
                      <Chip
                        label={game.condition.replace('_', ' ')}
                        size="small"
                        variant="outlined"
                        sx={{ mt: 0.5 }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {game.igdbDetails?.alternative_names ? 'Available' : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={game.status}
                      color={getStatusColor(game.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {game.igdbDetails?.genres ? 'Available' : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {game.igdbDetails?.franchise ? 'Available' : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {game.igdbDetails?.involved_companies ? 'Available' : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {game.igdbDetails?.multiplayer_modes ? 'Available' : '-'}
                    </Typography>
                  </TableCell>
                  <TableCell>
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
