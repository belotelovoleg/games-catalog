'use client'

import { useState, useEffect } from 'react'
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
  MenuItem,
  Stack,
  Grid,
  IconButton,
  Modal,
  Backdrop,
  CircularProgress,
  Card,
  CardContent,
  useTheme
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
  const theme = useTheme()
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
  
  // Mobile detection
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (!galleryOpen) return
      
      if (event.key === 'ArrowLeft') {
        prevImage()
      } else if (event.key === 'ArrowRight') {
        nextImage()
      } else if (event.key === 'Escape') {
        closeGallery()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [galleryOpen, selectedImageIndex])

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
    <>      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="lg" 
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: { 
            minHeight: { xs: '100vh', md: '600px' },
            maxHeight: { xs: '100vh', md: '90vh' },
            m: { xs: 0, md: 2 },
            borderRadius: { xs: 0, md: 2 },
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: 'primary.main', 
          color: 'primary.contrastText',
          p: { xs: 2, md: 3 }
        }}>          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography component="span" variant="h5" sx={{ 
              fontSize: { xs: '1.25rem', md: '1.5rem' },
              fontWeight: 600 
            }}>
              {isPreviewMode ? `Preview: ${game.name}` : (editing ? editedName : game.name)}
            </Typography>
            <IconButton 
              onClick={onClose}
              sx={{ color: 'primary.contrastText' }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>      <DialogContent sx={{ 
        p: { xs: 2, md: 3 },
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', lg: 'row' },
          gap: { xs: 2, md: 3 }
        }}>
          {/* Left Column - Cover and Quick Info */}
          <Box sx={{ 
            flex: { xs: '1', lg: '0 0 280px' },
            order: { xs: 2, lg: 1 }
          }}>
            {/* Cover Image */}
            {(game.igdbDetails as any)?.coverDetails && (
              <Box sx={{ mb: 2, position: 'sticky', top: 0 }}>
                <img
                  src={(game.igdbDetails as any).coverDetails.url?.replace('t_thumb', 't_cover_big') || ''}
                  alt={`${game.name} cover`}
                  style={{
                    width: '100%',
                    maxWidth: '280px',
                    height: 'auto',
                    borderRadius: '12px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                    display: 'block',
                    margin: '0 auto',
                    transition: 'transform 0.2s ease-in-out'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.02)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                />
              </Box>
            )}

            {/* Quick Info Card */}            <Card sx={{ 
              mb: 2, 
              background: (theme) => theme.palette.mode === 'dark' 
                ? 'linear-gradient(135deg, rgba(66, 165, 245, 0.1) 0%, rgba(100, 181, 246, 0.05) 100%)'
                : 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
              position: 'sticky',
              top: (game.igdbDetails as any)?.coverDetails ? '420px' : '0'
            }}>
              <CardContent sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom color="primary" sx={{ 
                  fontWeight: 600,
                  mb: 2
                }}>
                  Quick Info
                </Typography>
                
                {game.rating && (
                  <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>                    <Chip 
                      label={`${Math.round(game.rating)}/100`} 
                      color="primary" 
                      size="small"
                      onClick={() => {}}
                      sx={{ fontWeight: 600 }}
                    />
                    <Typography variant="body2" color="text.secondary">
                      IGDB Rating
                    </Typography>
                  </Box>
                )}

                {(game.igdbDetails as any)?.franchiseDetails && (
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      <strong>Franchise</strong>
                    </Typography>                    <Chip 
                      label={(game.igdbDetails as any).franchiseDetails.name} 
                      variant="outlined" 
                      size="small" 
                      color="secondary"
                      onClick={() => {}}
                    />
                  </Box>
                )}

                {(game.igdbDetails as any)?.gameTypeDetails && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                      <strong>Game Type</strong>
                    </Typography>                    <Chip 
                      label={(game.igdbDetails as any).gameTypeDetails.type} 
                      variant="outlined" 
                      size="small" 
                      color="info"
                      onClick={() => {}}
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>

          {/* Right Column - Detailed Information */}
          <Box sx={{ 
            flex: 1,
            order: { xs: 1, lg: 2 }
          }}>
            <Stack spacing={2.5}>          {/* User Game Information - only show if not preview mode */}
          {!isPreviewMode && (            <Card sx={{ 
              background: (theme) => theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(103, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%)'
                : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              '& .MuiCardContent-root': { p: 3 }
            }}>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ 
                  color: 'white',
                  fontWeight: 600,
                  mb: 2
                }}>
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
              </Stack>            ) : (
              <Stack spacing={2}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="body1" sx={{ color: 'white', fontWeight: 500 }}>
                    Status:
                  </Typography>                  <Chip 
                    label={game.status} 
                    color={game.status === 'OWNED' ? 'success' : 'warning'} 
                    size="small" 
                    onClick={() => {}}
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
                
                {game.status === 'OWNED' && game.condition && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="body1" sx={{ color: 'white', fontWeight: 500 }}>
                      Condition:
                    </Typography>                    <Chip 
                      label={formatCondition(game.condition)} 
                      variant="outlined" 
                      size="small"
                      onClick={() => {}}
                      sx={{ 
                        borderColor: 'rgba(255,255,255,0.5)', 
                        color: 'white',
                        fontWeight: 500
                      }}
                    />
                  </Box>
                )}

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="body1" sx={{ color: 'white', fontWeight: 500 }}>
                    Your Rating:
                  </Typography>                  <Chip 
                    label={game.rating ? `${Math.round(game.rating)}/100` : 'Not rated'} 
                    variant="outlined" 
                    size="small"
                    onClick={() => {}}
                    sx={{ 
                      borderColor: 'rgba(255,255,255,0.5)', 
                      color: 'white',
                      fontWeight: 500
                    }}
                  />
                </Box>
                
                {game.notes && (
                  <Box>
                    <Typography variant="body1" sx={{ color: 'white', fontWeight: 500, mb: 1 }}>
                      Notes:
                    </Typography>
                    <Typography variant="body2" sx={{ 
                      color: 'rgba(255,255,255,0.9)', 
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      p: 1.5,
                      borderRadius: 1,
                      fontStyle: 'italic'
                    }}>
                      {game.notes}
                    </Typography>
                  </Box>
                )}

                <Typography variant="body2" sx={{ 
                  color: 'rgba(255,255,255,0.7)', 
                  fontSize: '0.8rem',
                  mt: 1
                }}>
                  Added: {new Date(game.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Typography>
              </Stack>
            )}
              </CardContent>
            </Card>
          )}          {/* Add Game Form for Preview Mode */}
          {isPreviewMode && onGameAdded && platformId && (            <Card sx={{ 
              background: (theme) => theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(17, 153, 142, 0.3) 0%, rgba(56, 239, 125, 0.3) 100%)'
                : 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
              color: 'white'
            }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ 
                  color: 'white',
                  fontWeight: 600,
                  mb: 2
                }}>
                  Add to Your Collection
                </Typography>
                
                <Stack spacing={2.5}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: 'rgba(255,255,255,0.8)' }}>Status</InputLabel>
                    <Select
                      value={addGameStatus}
                      label="Status"
                      onChange={(e) => setAddGameStatus(e.target.value as 'OWNED' | 'WISHLISTED')}
                      sx={{
                        color: 'white',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255,255,255,0.5)',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255,255,255,0.8)',
                        },
                        '& .MuiSvgIcon-root': {
                          color: 'white',
                        },
                      }}
                    >
                      <MenuItem value="OWNED">Owned</MenuItem>
                      <MenuItem value="WISHLISTED">Wishlisted</MenuItem>
                    </Select>
                  </FormControl>

                  {addGameStatus === 'OWNED' && (
                    <FormControl fullWidth>
                      <InputLabel sx={{ color: 'rgba(255,255,255,0.8)' }}>Condition</InputLabel>
                      <Select
                        value={addGameCondition}
                        label="Condition"
                        onChange={(e) => setAddGameCondition(e.target.value)}
                        sx={{
                          color: 'white',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255,255,255,0.5)',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: 'rgba(255,255,255,0.8)',
                          },
                          '& .MuiSvgIcon-root': {
                            color: 'white',
                          },
                        }}
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
              </CardContent>
            </Card>
          )}          {/* IGDB Information */}
          {game.igdbDetails && (
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom color="primary" sx={{ 
                  fontWeight: 600,
                  mb: 2
                }}>
                  Game Information (IGDB)
                </Typography>
                
                {game.igdbDetails.rating && (
                  <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      <strong>IGDB Rating:</strong>
                    </Typography>                    <Chip 
                      label={`${Math.round(game.igdbDetails.rating)}/100`} 
                      color="primary" 
                      size="small"
                      onClick={() => {}}
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                )}

                {game.igdbDetails.storyline && game.igdbDetails.storyline.trim() && (                  <Box sx={{ 
                    mb: 3, 
                    p: 2, 
                    bgcolor: 'action.hover', 
                    borderRadius: 2,
                    borderLeft: 4,
                    borderColor: 'primary.main'
                  }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1, fontWeight: 600 }}>
                      Description
                    </Typography>
                    <Typography variant="body1" sx={{ 
                      lineHeight: 1.6,
                      fontStyle: 'italic'
                    }}>
                      {game.igdbDetails.storyline}
                    </Typography>
                  </Box>
                )}{/* Genres */}
                {(game.igdbDetails as any).genreDetails && (game.igdbDetails as any).genreDetails.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom>
                      <strong>Genres:</strong>
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>                      {(game.igdbDetails as any).genreDetails.map((genre: any) => (
                        <Chip 
                          key={genre.igdbId} 
                          label={genre.name} 
                          size="small" 
                          variant="outlined" 
                          color="primary"
                          onClick={() => {}}
                        />
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
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>                      {(game.igdbDetails as any).companyDetails.map((company: any) => (
                        <Chip 
                          key={company.igdbId} 
                          label={company.name} 
                          size="small" 
                          variant="outlined" 
                          color="secondary"
                          onClick={() => {}}
                        />
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
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
                      Screenshots ({(game.igdbDetails as any).screenshotDetails.length})
                    </Typography>
                    <Box sx={{ 
                      display: 'grid',
                      gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)', md: 'repeat(4, 1fr)' },
                      gap: 1.5,
                      mb: 2
                    }}>
                      {(game.igdbDetails as any).screenshotDetails.slice(0, 8).map((screenshot: any, index: number) => (                        <Box
                          key={screenshot.igdbId}
                          sx={{
                            aspectRatio: '16/9',
                            cursor: 'pointer',
                            borderRadius: 2,
                            overflow: 'hidden',
                            border: '2px solid transparent',
                            transition: 'all 0.3s ease',
                            '&:hover': {
                              border: '2px solid',
                              borderColor: 'primary.main',
                              transform: 'scale(1.05)',
                              boxShadow: '0 8px 16px rgba(0,0,0,0.15)'
                            },
                            '&:focus': {
                              outline: '2px solid',
                              outlineColor: 'primary.main',
                              outlineOffset: '2px'
                            }
                          }}
                          onClick={() => openGallery(index)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault()
                              openGallery(index)
                            }
                          }}
                          tabIndex={0}
                          role="button"
                          aria-label={`View screenshot ${index + 1} in gallery`}
                        >
                          <img
                            src={`https://images.igdb.com/igdb/image/upload/t_thumb/${screenshot.image_id}.jpg`}
                            alt={`Screenshot ${index + 1}`}
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'cover',
                            }}
                            loading="lazy"
                          />
                        </Box>
                      ))}
                    </Box>
                    <Typography 
                      variant="caption" 
                      color="primary" 
                      sx={{ 
                        display: 'block',
                        textAlign: 'center',
                        cursor: 'pointer',
                        p: 1,
                        borderRadius: 1,
                        backgroundColor: 'primary.main',
                        color: 'white',
                        fontWeight: 600,
                        transition: 'background-color 0.2s',
                        '&:hover': { 
                          backgroundColor: 'primary.dark'
                        }
                      }}
                      onClick={() => openGallery(0)}
                    >
                      View Full Gallery ({(game.igdbDetails as any).screenshotDetails.length} images)
                    </Typography>
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
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>                      {(game.igdbDetails as any).ageRatingDetails.map((rating: any) => (
                        <Chip 
                          key={rating.igdbId} 
                          label={rating.categoryName || `Rating ${rating.igdbId}`} 
                          size="small" 
                          variant="outlined" 
                          color="warning"
                          onClick={() => {}}
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
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>                      {(game.igdbDetails as any).alternativeNameDetails.map((altName: any) => (
                        <Chip 
                          key={altName.igdbId} 
                          label={altName.name} 
                          size="small" 
                          variant="outlined" 
                          color="info"
                          onClick={() => {}}
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
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>                      {(game.igdbDetails as any).gameEngineDetails.map((engine: any) => (
                        <Chip 
                          key={engine.igdbId} 
                          label={engine.name} 
                          size="small" 
                          variant="outlined"
                          color="success"
                          onClick={() => {}}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}          {!game.igdbGameId && (
            <Alert 
              severity="info" 
              sx={{ 
                borderRadius: 2,
                '& .MuiAlert-message': {
                  fontWeight: 500
                }
              }}
            >
              This is a custom game not from IGDB. Only your personal information is available.
            </Alert>
          )}
            </Stack>
          </Box>
        </Box>
      </DialogContent>      <DialogActions sx={{ 
        p: { xs: 2, md: 3 },
        bgcolor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider',
        gap: 1
      }}>
        {isPreviewMode ? (
          <>
            <Button 
              onClick={onClose} 
              disabled={addingGame}
              variant="outlined"
              sx={{ minWidth: 120 }}
            >
              Close Preview
            </Button>
            {onGameAdded && platformId && (
              <Button 
                onClick={handleAddGameFromPreview} 
                variant="contained" 
                disabled={addingGame}                sx={{ 
                  minWidth: 160,
                  background: (theme) => theme.palette.mode === 'dark'
                    ? 'linear-gradient(45deg, rgba(254, 107, 139, 0.4) 30%, rgba(255, 142, 83, 0.4) 90%)'
                    : 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
                  '&:hover': {
                    background: (theme) => theme.palette.mode === 'dark'
                      ? 'linear-gradient(45deg, rgba(254, 107, 139, 0.6) 60%, rgba(255, 142, 83, 0.6) 100%)'
                      : 'linear-gradient(45deg, #FE6B8B 60%, #FF8E53 100%)',
                  }
                }}
                startIcon={addingGame ? <CircularProgress size={16} color="inherit" /> : null}
              >
                {addingGame ? 'Adding...' : 'Add to Collection'}
              </Button>
            )}
          </>
        ) : editing ? (
          <>
            <Button 
              onClick={handleCancel} 
              disabled={loading}
              variant="outlined"
              sx={{ minWidth: 100 }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave} 
              variant="contained" 
              disabled={loading}
              sx={{ minWidth: 120 }}
              startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </>
        ) : (
          <>
            <Button 
              onClick={onClose}
              variant="outlined"
              sx={{ minWidth: 100 }}
            >
              Close
            </Button>
            <Button 
              onClick={handleEdit} 
              variant="contained"
              sx={{ minWidth: 100 }}
            >
              Edit
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>    {/* Screenshot Gallery Modal */}
    {game && (
      <Modal
        open={galleryOpen}
        onClose={closeGallery}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{
          timeout: 500,
          sx: { backgroundColor: 'rgba(0, 0, 0, 0.95)' }
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: { xs: '100vw', md: '90vw' },
            height: { xs: '100vh', md: '90vh' },
            bgcolor: { xs: 'black', md: 'background.paper' },
            borderRadius: { xs: 0, md: 2 },
            boxShadow: 24,
            p: { xs: 0, md: 2 },
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
            mb: { xs: 1, md: 2 },
            borderBottom: { xs: 0, md: 1 },
            borderColor: 'divider',
            pb: { xs: 1, md: 2 },
            px: { xs: 2, md: 0 },
            bgcolor: { xs: 'rgba(0,0,0,0.8)', md: 'transparent' },
            color: { xs: 'white', md: 'inherit' }
          }}>
            <Typography variant="h6" sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>
              Screenshots ({selectedImageIndex + 1}/{(game!.igdbDetails as any)?.screenshotDetails?.length || 0})
            </Typography>
            <IconButton 
              onClick={closeGallery}
              sx={{ color: { xs: 'white', md: 'inherit' } }}
            >
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
            mb: { xs: 1, md: 2 },
            px: { xs: 1, md: 0 }
          }}>
            {(game!.igdbDetails as any)?.screenshotDetails && (game!.igdbDetails as any).screenshotDetails.length > 0 && (
              <>
                {/* Previous Button */}
                <IconButton
                  onClick={prevImage}
                  sx={{
                    position: 'absolute',
                    left: { xs: 5, md: 10 },
                    zIndex: 1,
                    bgcolor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    width: { xs: 40, md: 48 },
                    height: { xs: 40, md: 48 },
                    '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.8)' }
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
                    borderRadius: isMobile ? '0' : '8px'
                  }}
                />

                {/* Next Button */}
                <IconButton
                  onClick={nextImage}
                  sx={{
                    position: 'absolute',
                    right: { xs: 5, md: 10 },
                    zIndex: 1,
                    bgcolor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    width: { xs: 40, md: 48 },
                    height: { xs: 40, md: 48 },
                    '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.8)' }
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
            borderTop: { xs: 0, md: 1 },
            borderColor: 'divider',
            pt: { xs: 1, md: 2 },
            px: { xs: 2, md: 0 },
            bgcolor: { xs: 'rgba(0,0,0,0.8)', md: 'transparent' },
            '&::-webkit-scrollbar': {
              height: 6,
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'rgba(255,255,255,0.1)',
              borderRadius: 3,
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(255,255,255,0.3)',
              borderRadius: 3,
            },
          }}>
            {(game!.igdbDetails as any)?.screenshotDetails?.map((screenshot: any, index: number) => (              <img
                key={screenshot.igdbId}
                src={`https://images.igdb.com/igdb/image/upload/t_thumb/${screenshot.image_id}.jpg`}
                alt={`Thumbnail ${index + 1}`}
                style={{
                  width: isMobile ? '60px' : '80px',
                  height: isMobile ? '35px' : '50px',
                  objectFit: 'cover',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  border: selectedImageIndex === index 
                    ? `3px solid ${theme.palette.primary.main}` 
                    : `1px solid ${theme.palette.divider}`,
                  flexShrink: 0,
                  transition: 'all 0.2s ease'
                }}
                onClick={() => setSelectedImageIndex(index)}
              />
            ))}
          </Box>
        </Box>
      </Modal>
    )}
    </>
  )
}
