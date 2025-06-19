'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Alert,
  Divider,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,  Stack,
  Grid,
  IconButton,
  Modal,
  Backdrop,
  CircularProgress
} from '@mui/material'
import { Close as CloseIcon, ChevronLeft, ChevronRight } from '@mui/icons-material'

interface UserGame {
  id: number
  userId: number
  platformId: number
  igdbGameId: number | null
  name: string
  rating: number | null
  status: 'OWNED' | 'WISHLISTED'
  condition: string | null
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

interface GameDetailDialogProps {
  open: boolean
  onClose: () => void
  game: GameWithIgdbDetails | null
  onGameUpdated: () => void
  onGameAdded?: () => void // For preview mode
  platformId?: number // For adding games from preview
}

export default function GameDetailDialog({ 
  open, 
  onClose, 
  game,
  onGameUpdated,
  onGameAdded,
  platformId
}: GameDetailDialogProps) {
  const [editing, setEditing] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [editedRating, setEditedRating] = useState<number | null>(null)
  const [editedStatus, setEditedStatus] = useState<'OWNED' | 'WISHLISTED'>('OWNED')
  const [editedCondition, setEditedCondition] = useState('')
  const [editedNotes, setEditedNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Gallery state
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)

  // Add game from preview state
  const [addingGame, setAddingGame] = useState(false)
  const [addGameStatus, setAddGameStatus] = useState<'OWNED' | 'WISHLISTED'>('OWNED')
  const [addGameCondition, setAddGameCondition] = useState<string>('EXCELLENT')

  // Check if this is preview mode (temporary game with id -1)
  const isPreviewMode = game?.id === -1

  const handleEdit = () => {
    if (game) {
      setEditedName(game.name)
      setEditedRating(game.rating)
      setEditedStatus(game.status)
      setEditedCondition(game.condition || '')
      setEditedNotes(game.notes || '')
      setEditing(true)
    }
  }

  const handleSave = async () => {
    if (!game) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/user/games/${game.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editedName,
          rating: editedRating,
          status: editedStatus,
          condition: editedCondition || null,
          notes: editedNotes || null
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update game')
      }

      setEditing(false)
      onGameUpdated()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update game')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setEditing(false)
    setError(null)
  }

  const formatCondition = (condition: string | null) => {
    if (!condition) return 'N/A'
    return condition.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())
  }
  const parseJsonField = (field: string | null): string[] => {
    if (!field) return []
    try {
      const parsed = JSON.parse(field)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  // Gallery functions
  const openGallery = (imageIndex: number = 0) => {
    setSelectedImageIndex(imageIndex)
    setGalleryOpen(true)
  }

  const closeGallery = () => {
    setGalleryOpen(false)
  }
  const nextImage = () => {
    if (!game) return
    const screenshots = (game.igdbDetails as any)?.screenshotDetails || []
    setSelectedImageIndex((prev) => (prev + 1) % screenshots.length)
  }
  const prevImage = () => {
    if (!game) return
    const screenshots = (game.igdbDetails as any)?.screenshotDetails || []
    setSelectedImageIndex((prev) => (prev - 1 + screenshots.length) % screenshots.length)
  }

  // Add game from preview functionality
  const handleAddGameFromPreview = async () => {
    if (!game || !isPreviewMode || !platformId || !onGameAdded) return

    setAddingGame(true)
    setError(null)

    try {
      const response = await fetch('/api/user/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          platformId,
          igdbGameId: game.igdbGameId,
          name: game.name,
          rating: game.rating,
          status: addGameStatus,
          condition: addGameStatus === 'OWNED' ? addGameCondition : null,
          notes: ''
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add game')
      }

      onGameAdded()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add game')
    } finally {
      setAddingGame(false)
    }
  }

  if (!game) return null
  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { minHeight: '400px' }
        }}
      ><DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">
            {isPreviewMode ? `Preview: ${game.name}` : (editing ? editedName : game.name)}
          </Typography>
          <Button onClick={onClose}>
            <CloseIcon />
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}        <Stack spacing={3}>
          {/* User Game Information - only show if not preview mode */}
          {!isPreviewMode && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Your Collection Info
              </Typography>
            
            {editing ? (
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Game Name"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                />
                
                <TextField
                  fullWidth
                  label="Rating (0-100)"
                  type="number"
                  value={editedRating || ''}
                  onChange={(e) => setEditedRating(e.target.value ? parseFloat(e.target.value) : null)}
                  inputProps={{ min: 0, max: 100 }}
                />

                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={editedStatus}
                    label="Status"
                    onChange={(e) => setEditedStatus(e.target.value as 'OWNED' | 'WISHLISTED')}
                  >
                    <MenuItem value="OWNED">Owned</MenuItem>
                    <MenuItem value="WISHLISTED">Wishlisted</MenuItem>
                  </Select>
                </FormControl>

                {editedStatus === 'OWNED' && (
                  <FormControl fullWidth>
                    <InputLabel>Condition</InputLabel>
                    <Select
                      value={editedCondition}
                      label="Condition"
                      onChange={(e) => setEditedCondition(e.target.value)}
                    >
                      <MenuItem value="">Not specified</MenuItem>
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

                <TextField
                  fullWidth
                  label="Notes"
                  multiline
                  rows={3}
                  value={editedNotes}
                  onChange={(e) => setEditedNotes(e.target.value)}
                />
              </Stack>
            ) : (
              <Box>
                <Typography variant="body1" gutterBottom>
                  <strong>Status:</strong> 
                  <Chip 
                    label={game.status} 
                    color={game.status === 'OWNED' ? 'success' : 'warning'} 
                    size="small" 
                    sx={{ ml: 1 }}
                  />
                </Typography>
                
                {game.status === 'OWNED' && (
                  <Typography variant="body1" gutterBottom>
                    <strong>Condition:</strong> {formatCondition(game.condition)}
                  </Typography>
                )}
                
                <Typography variant="body1" gutterBottom>
                  <strong>Your Rating:</strong> {game.rating ? `${Math.round(game.rating)}/100` : 'Not rated'}
                </Typography>
                
                {game.notes && (
                  <Typography variant="body1" gutterBottom>
                    <strong>Notes:</strong> {game.notes}
                  </Typography>
                )}
                  <Typography variant="body2" color="text.secondary">
                  Added: {new Date(game.createdAt).toLocaleDateString()}
                </Typography>
              </Box>
            )}
            </Box>
          )}

          {/* Add Game Form for Preview Mode */}
          {isPreviewMode && onGameAdded && platformId && (
            <>
              <Divider />
              <Box>
                <Typography variant="h6" gutterBottom>
                  Add to Your Collection
                </Typography>
                
                <Stack spacing={2}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={addGameStatus}
                      label="Status"
                      onChange={(e) => setAddGameStatus(e.target.value as 'OWNED' | 'WISHLISTED')}
                    >
                      <MenuItem value="OWNED">Owned</MenuItem>
                      <MenuItem value="WISHLISTED">Wishlisted</MenuItem>
                    </Select>
                  </FormControl>

                  {addGameStatus === 'OWNED' && (
                    <FormControl fullWidth>
                      <InputLabel>Condition</InputLabel>
                      <Select
                        value={addGameCondition}
                        label="Condition"
                        onChange={(e) => setAddGameCondition(e.target.value)}
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
                </Stack>
              </Box>
            </>
          )}

          {/* IGDB Information */}
          {game.igdbDetails && (
            <>
              <Divider />
              <Box>
                <Typography variant="h6" gutterBottom>
                  Game Information (IGDB)
                </Typography>
                  {/* Cover Image */}
                {(game.igdbDetails as any).coverDetails && (game.igdbDetails as any).coverDetails.image_id && (
                  <Box sx={{ mb: 3, textAlign: 'center' }}>
                    <img
                      src={`https://images.igdb.com/igdb/image/upload/t_cover_big/${(game.igdbDetails as any).coverDetails.image_id}.jpg`}
                      alt={`${game.name} cover`}
                      style={{ 
                        maxWidth: '200px', 
                        maxHeight: '300px', 
                        borderRadius: '8px',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.1)'
                      }}
                    />
                  </Box>
                )}
                
                {game.igdbDetails.rating && (
                  <Typography variant="body1" gutterBottom>
                    <strong>IGDB Rating:</strong> {Math.round(game.igdbDetails.rating)}/100
                  </Typography>
                )}
                  {game.igdbDetails.storyline && game.igdbDetails.storyline.trim() && (
                  <Typography variant="body1" gutterBottom sx={{ mb: 2 }}>
                    <strong>Description:</strong> {game.igdbDetails.storyline}
                  </Typography>
                )}{/* Genres */}
                {(game.igdbDetails as any).genreDetails && (game.igdbDetails as any).genreDetails.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      <strong>Genres:</strong>
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(game.igdbDetails as any).genreDetails.map((genre: any) => (
                        <Chip key={genre.igdbId} label={genre.name} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Companies */}
                {(game.igdbDetails as any).companyDetails && (game.igdbDetails as any).companyDetails.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      <strong>Companies:</strong>
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(game.igdbDetails as any).companyDetails.map((company: any) => (
                        <Chip key={company.igdbId} label={company.name} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Franchise */}
                {(game.igdbDetails as any).franchiseDetails && (
                  <Typography variant="body2" gutterBottom>
                    <strong>Franchise:</strong> {(game.igdbDetails as any).franchiseDetails.name}
                  </Typography>
                )}

                {/* Multiplayer Modes */}
                {(game.igdbDetails as any).multiplayerModeDetails && (game.igdbDetails as any).multiplayerModeDetails.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      <strong>Multiplayer:</strong>
                    </Typography>
                    <Box sx={{ pl: 2 }}>
                      {(game.igdbDetails as any).multiplayerModeDetails.map((mode: any) => (
                        <Typography key={mode.igdbId} variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                          • {mode.lancoop && 'LAN Co-op'} {mode.offlinecoop && 'Offline Co-op'} {mode.onlinecoop && 'Online Co-op'} {mode.splitscreen && 'Split Screen'}
                        </Typography>
                      ))}
                    </Box>
                  </Box>
                )}                {/* Screenshots */}
                {(game.igdbDetails as any).screenshotDetails && (game.igdbDetails as any).screenshotDetails.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      <strong>Screenshots:</strong>
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 1 }}>
                      {(game.igdbDetails as any).screenshotDetails.slice(0, 4).map((screenshot: any, index: number) => (
                        <img
                          key={screenshot.igdbId}
                          src={`https://images.igdb.com/igdb/image/upload/t_thumb/${screenshot.image_id}.jpg`}
                          alt="Game screenshot"
                          style={{ 
                            width: '100px', 
                            height: '60px', 
                            objectFit: 'cover',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            border: '1px solid #e0e0e0',
                            transition: 'transform 0.2s',
                          }}
                          onClick={() => openGallery(index)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'scale(1.05)'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)'
                          }}
                        />
                      ))}
                    </Box>
                    {(game.igdbDetails as any).screenshotDetails.length > 4 && (
                      <Typography 
                        variant="caption" 
                        color="primary" 
                        sx={{ 
                          mt: 1, 
                          display: 'block', 
                          cursor: 'pointer',
                          '&:hover': { textDecoration: 'underline' }
                        }}
                        onClick={() => openGallery(0)}
                      >
                        +{(game.igdbDetails as any).screenshotDetails.length - 4} more screenshots (click to view all)
                      </Typography>                    )}
                  </Box>
                )}

                {/* Game Type */}
                {(game.igdbDetails as any).gameTypeDetails && (
                  <Typography variant="body2" gutterBottom>
                    <strong>Game Type:</strong> {(game.igdbDetails as any).gameTypeDetails.type}
                  </Typography>
                )}

                {/* Age Ratings */}
                {(game.igdbDetails as any).ageRatingDetails && (game.igdbDetails as any).ageRatingDetails.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      <strong>Age Ratings:</strong>
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(game.igdbDetails as any).ageRatingDetails.map((rating: any) => (
                        <Chip 
                          key={rating.igdbId} 
                          label={rating.categoryName || `Rating ${rating.igdbId}`} 
                          size="small" 
                          variant="outlined" 
                          color="primary"
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Alternative Names */}
                {(game.igdbDetails as any).alternativeNameDetails && (game.igdbDetails as any).alternativeNameDetails.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      <strong>Alternative Names:</strong>
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(game.igdbDetails as any).alternativeNameDetails.map((altName: any) => (
                        <Chip 
                          key={altName.igdbId} 
                          label={altName.name} 
                          size="small" 
                          variant="outlined" 
                        />
                      ))}
                    </Box>
                  </Box>
                )}

                {/* Game Engines */}
                {(game.igdbDetails as any).gameEngineDetails && (game.igdbDetails as any).gameEngineDetails.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      <strong>Game Engines:</strong>
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {(game.igdbDetails as any).gameEngineDetails.map((engine: any) => (
                        <Chip 
                          key={engine.igdbId} 
                          label={engine.name} 
                          size="small" 
                          variant="outlined" 
                          color="secondary"
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </>
          )}

          {!game.igdbGameId && (
            <Alert severity="info">
              This is a custom game not from IGDB. Only your personal information is available.
            </Alert>
          )}
        </Stack>
      </DialogContent>      <DialogActions>
        {isPreviewMode ? (
          <>
            <Button onClick={onClose} disabled={addingGame}>
              Close Preview
            </Button>
            {onGameAdded && platformId && (
              <Button 
                onClick={handleAddGameFromPreview} 
                variant="contained" 
                disabled={addingGame}
                sx={{ ml: 1 }}
              >
                {addingGame ? <CircularProgress size={20} /> : 'Add Game to Collection'}
              </Button>
            )}
          </>
        ) : editing ? (
          <>
            <Button onClick={handleCancel} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSave} variant="contained" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </>
        ) : (
          <>
            <Button onClick={onClose}>
              Close
            </Button>
            <Button onClick={handleEdit} variant="contained">
              Edit            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>

    {/* Screenshot Gallery Modal */}
    {game && (
      <Modal
        open={galleryOpen}
        onClose={closeGallery}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
          sx: { backgroundColor: 'rgba(0, 0, 0, 0.9)' }
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '90vw',
            height: '90vh',
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 24,
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {/* Gallery Header */}
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 2,
            borderBottom: 1,
            borderColor: 'divider',
            pb: 2
          }}>            <Typography variant="h6">
              Screenshots ({selectedImageIndex + 1}/{(game!.igdbDetails as any)?.screenshotDetails?.length || 0})
            </Typography>
            <IconButton onClick={closeGallery}>
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Main Image Area */}
          <Box sx={{ 
            flex: 1, 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            position: 'relative',
            mb: 2
          }}>
            {(game!.igdbDetails as any)?.screenshotDetails && (game!.igdbDetails as any).screenshotDetails.length > 0 && (
              <>
                {/* Previous Button */}
                <IconButton
                  onClick={prevImage}
                  sx={{
                    position: 'absolute',
                    left: 10,
                    zIndex: 1,
                    bgcolor: 'rgba(0, 0, 0, 0.5)',
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' }
                  }}
                >
                  <ChevronLeft />
                </IconButton>

                {/* Main Image */}
                <img
                  src={`https://images.igdb.com/igdb/image/upload/t_original/${(game!.igdbDetails as any).screenshotDetails[selectedImageIndex]?.image_id}.jpg`}
                  alt={`Screenshot ${selectedImageIndex + 1}`}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                    borderRadius: '8px'
                  }}
                />

                {/* Next Button */}
                <IconButton
                  onClick={nextImage}
                  sx={{
                    position: 'absolute',
                    right: 10,
                    zIndex: 1,
                    bgcolor: 'rgba(0, 0, 0, 0.5)',
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.7)' }
                  }}
                >
                  <ChevronRight />
                </IconButton>
              </>
            )}
          </Box>

          {/* Thumbnail Strip */}
          <Box sx={{ 
            display: 'flex', 
            gap: 1, 
            overflowX: 'auto', 
            py: 1,
            borderTop: 1,
            borderColor: 'divider',
            pt: 2
          }}>
            {(game!.igdbDetails as any)?.screenshotDetails?.map((screenshot: any, index: number) => (
              <img
                key={screenshot.igdbId}
                src={`https://images.igdb.com/igdb/image/upload/t_thumb/${screenshot.image_id}.jpg`}
                alt={`Thumbnail ${index + 1}`}
                style={{
                  width: '80px',
                  height: '50px',
                  objectFit: 'cover',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  border: selectedImageIndex === index ? '3px solid #1976d2' : '1px solid #e0e0e0',
                  flexShrink: 0
                }}
                onClick={() => setSelectedImageIndex(index)}
              />
            ))}
          </Box>        </Box>
      </Modal>
    )}
    </>
  )
}
