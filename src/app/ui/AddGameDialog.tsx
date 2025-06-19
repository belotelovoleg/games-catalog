'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Alert,
  CircularProgress,
  Tab,
  Tabs,
  Rating
} from '@mui/material'
import { Search as SearchIcon } from '@mui/icons-material'
import GameDetailDialog from './GameDetailDialog'

interface IgdbGame {
  igdbId: number
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
}

interface GameDetailDialogProps {
  open: boolean
  onClose: () => void
  platformId: number
  platform: any
  onGameAdded: () => void
}

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`add-game-tabpanel-${index}`}
      aria-labelledby={`add-game-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  )
}

export default function AddGameDialog({ open, onClose, platformId, platform, onGameAdded }: GameDetailDialogProps) {
  const [tabValue, setTabValue] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<IgdbGame[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedGame, setSelectedGame] = useState<IgdbGame | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Preview using existing GameDetailDialog
  const [previewGame, setPreviewGame] = useState<any | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  // Custom game form
  const [customName, setCustomName] = useState('')
  const [customRating, setCustomRating] = useState<number | null>(null)
  const [customNotes, setCustomNotes] = useState('')

  // Shared form fields
  const [status, setStatus] = useState<'OWNED' | 'WISHLISTED'>('OWNED')
  const [condition, setCondition] = useState<string>('EXCELLENT')

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue)
    setError(null)
    setSelectedGame(null)
    setSearchResults([])
    setSearchQuery('')
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setSearching(true)
    setError(null)

    try {
      const response = await fetch(`/api/igdb/games/search?q=${encodeURIComponent(searchQuery)}&platformId=${platform.igdbPlatformId}`)
      
      if (!response.ok) {
        throw new Error('Failed to search games')
      }

      const games = await response.json()
      setSearchResults(games)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search games')
    } finally {
      setSearching(false)
    }
  }
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch()
    }
  }
  
  const handleSelectGame = (game: IgdbGame) => {
    setSelectedGame(game)
  }
  
  const handlePreviewGame = async (game: IgdbGame) => {
    // Fetch enriched IGDB details for preview
    try {
      const response = await fetch(`/api/igdb/games/${game.igdbId}`)
      let enrichedGameDetails = game
      
      if (response.ok) {
        enrichedGameDetails = await response.json()
      }
      
      // Convert IGDB game to format expected by GameDetailDialog
      const mockUserGame = {
        id: -1, // Temporary ID for preview
        userId: -1,
        platformId: platformId,
        igdbGameId: game.igdbId,
        name: game.name,
        rating: game.rating,
        status: 'OWNED' as const,
        condition: null,
        notes: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        igdbDetails: enrichedGameDetails
      }
      setPreviewGame(mockUserGame)
      setPreviewOpen(true)
    } catch (error) {
      console.error('Failed to fetch enriched game details:', error)
      // Fallback to basic game data
      const mockUserGame = {
        id: -1,
        userId: -1,
        platformId: platformId,
        igdbGameId: game.igdbId,
        name: game.name,
        rating: game.rating,
        status: 'OWNED' as const,
        condition: null,
        notes: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        igdbDetails: game
      }
      setPreviewGame(mockUserGame)
      setPreviewOpen(true)
    }
  }
  const handlePreviewClose = () => {
    setPreviewOpen(false)
    setPreviewGame(null)
  }

  const handleAddIgdbGame = async () => {
    if (!selectedGame) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/user/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          platformId,
          igdbGameId: selectedGame.igdbId,
          name: selectedGame.name,
          rating: selectedGame.rating,
          status,
          condition: status === 'OWNED' ? condition : null,
          notes: ''
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add game')
      }

      onGameAdded()
      onClose()
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add game')
    } finally {
      setLoading(false)
    }
  }

  const handleAddCustomGame = async () => {
    if (!customName.trim()) {
      setError('Game name is required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/user/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          platformId,
          igdbGameId: null,
          name: customName,
          rating: customRating,
          status,
          condition: status === 'OWNED' ? condition : null,
          notes: customNotes
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add game')
      }

      onGameAdded()
      onClose()
      resetForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add game')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setTabValue(0)
    setSearchQuery('')
    setSearchResults([])
    setSelectedGame(null)
    setCustomName('')
    setCustomRating(null)
    setCustomNotes('')
    setStatus('OWNED')
    setCondition('EXCELLENT')
    setError(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }
  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { 
          borderRadius: 2,
          minHeight: 500
        }
      }}
    >      <DialogTitle sx={{ 
        bgcolor: 'primary.main', 
        color: 'primary.contrastText',
        p: 3
      }}>
        <Typography component="span" variant="h5" sx={{ fontWeight: 600 }}>
          Add Game to {platform?.name}
        </Typography>
      </DialogTitle>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="add game tabs">
          <Tab label="From IGDB" />
          <Tab label="Custom Game" />
        </Tabs>
      </Box>      <DialogContent sx={{ p: 3, minHeight: 400 }}>
        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 2,
              borderRadius: 2
            }}
          >
            {error}
          </Alert>
        )}

        <TabPanel value={tabValue} index={0}>
          {/* IGDB Game Search */}
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Search for games"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter game name or alternative name..."
              InputProps={{
                endAdornment: (
                  <Button
                    onClick={handleSearch}
                    disabled={searching || !searchQuery.trim()}
                    sx={{ ml: 1 }}
                  >
                    {searching ? <CircularProgress size={20} /> : <SearchIcon />}
                  </Button>
                )
              }}
            />
          </Box>

          {searchResults.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Search Results
              </Typography>              <List sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                {searchResults.map((game) => (
                  <ListItem 
                    key={game.igdbId} 
                    disablePadding                    sx={{
                      '&:hover': {
                        bgcolor: 'action.hover'
                      }
                    }}
                    secondaryAction={
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={(e) => {
                            e.stopPropagation()
                            handlePreviewGame(game)
                          }}
                        >
                          Preview
                        </Button>
                        <Button
                          size="small"
                          variant={selectedGame?.igdbId === game.igdbId ? "contained" : "text"}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSelectGame(game)
                          }}
                        >
                          {selectedGame?.igdbId === game.igdbId ? "Selected" : "Select"}
                        </Button>
                      </Box>
                    }
                  >                    <ListItemText
                      primary={game.name}
                      secondary={
                        <span>
                          {game.rating && `Rating: ${Math.round(game.rating)}/100`}
                          {game.rating && game.storyline && ' • '}
                          {game.storyline && game.storyline.substring(0, 80) + '...'}
                        </span>
                      }
                      sx={{ pr: 20 }} // Add padding to avoid overlap with buttons
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          {selectedGame && (
            <Box sx={{ p: 2, bgcolor: 'action.selected', borderRadius: 1, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Selected: {selectedGame.name}
              </Typography>
              {selectedGame.rating && (
                <Typography variant="body2" color="text.secondary">
                  Rating: {Math.round(selectedGame.rating)}/100
                </Typography>
              )}
              {selectedGame.storyline && (
                <Typography variant="body2" sx={{ mt: 1 }}>
                  {selectedGame.storyline}
                </Typography>
              )}
            </Box>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {/* Custom Game Form */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <TextField
              fullWidth
              label="Game Name"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              required
            />

            <Box>
              <Typography component="legend" gutterBottom>
                Your Rating (optional)
              </Typography>
              <Rating
                value={customRating ? customRating / 20 : null}
                onChange={(event, newValue) => {
                  setCustomRating(newValue ? newValue * 20 : null)
                }}
                precision={0.5}
                size="large"
              />
              {customRating && (
                <Typography variant="body2" color="text.secondary">
                  {Math.round(customRating)}/100
                </Typography>
              )}
            </Box>

            <TextField
              fullWidth
              label="Notes"
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              multiline
              rows={3}
              placeholder="Any additional notes about this game..."
            />
          </Box>
        </TabPanel>

        <Divider sx={{ my: 3 }} />

        {/* Shared form fields */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={status}
              label="Status"
              onChange={(e) => setStatus(e.target.value as 'OWNED' | 'WISHLISTED')}
            >
              <MenuItem value="OWNED">Owned</MenuItem>
              <MenuItem value="WISHLISTED">Wishlisted</MenuItem>
            </Select>
          </FormControl>

          {status === 'OWNED' && (
            <FormControl fullWidth>
              <InputLabel>Condition</InputLabel>
              <Select
                value={condition}
                label="Condition"
                onChange={(e) => setCondition(e.target.value)}
              >
                <MenuItem value="SEALED">Sealed</MenuItem>
                <MenuItem value="MINT">Mint</MenuItem>
                <MenuItem value="NEAR_MINT">Near Mint</MenuItem>
                <MenuItem value="EXCELLENT">Excellent</MenuItem>
                <MenuItem value="VERY_GOOD">Very Good</MenuItem>
                <MenuItem value="GOOD">Good</MenuItem>
                <MenuItem value="FAIR">Fair</MenuItem>
                <MenuItem value="POOR">Poor</MenuItem>
              </Select>
            </FormControl>
          )}
        </Box>
      </DialogContent>      <DialogActions sx={{ 
        p: 3,
        bgcolor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider',
        gap: 1
      }}>
        <Button 
          onClick={handleClose} 
          disabled={loading}
          variant="outlined"
          sx={{ minWidth: 100 }}
        >
          Cancel
        </Button>
        <Button
          onClick={tabValue === 0 ? handleAddIgdbGame : handleAddCustomGame}
          variant="contained"
          disabled={loading || (tabValue === 0 ? !selectedGame : !customName.trim())}
          sx={{ minWidth: 120 }}
          startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {loading ? 'Adding...' : 'Add Game'}
        </Button>
      </DialogActions>{/* Use existing GameDetailDialog for preview */}
      <GameDetailDialog
        open={previewOpen}
        onClose={handlePreviewClose}
        game={previewGame}
        onGameUpdated={() => {}} // No update needed for preview
        onGameAdded={onGameAdded} // Pass through the onGameAdded callback
        platformId={platformId} // Pass the platform ID for adding games
      />
    </Dialog>
  )
}
