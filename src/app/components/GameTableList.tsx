import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Box,
  Typography,
  Stack,
  useTheme,
  Button
} from '@mui/material'
import { Delete as DeleteIcon } from '@mui/icons-material'
import React, { useRef, useState } from 'react'

interface UserGame {
  id: number
  userId: number
  platformId: number
  igdbGameId: number | null
  name: string
  rating: number | null
  photoUrl?: string | null // S3 photo URL if exists
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

interface GameTableListProps {
  games: GameWithIgdbDetails[]
  onGameClick: (game: GameWithIgdbDetails) => void
  onDeleteGame: (gameId: number) => void
  showPlatform?: boolean
}

export default function GameTableList({
  games,
  onGameClick,
  onDeleteGame,
  showPlatform = false
}: GameTableListProps) {
  const theme = useTheme()

  // Track upload state per game
  const [uploadingId, setUploadingId] = useState<number | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [photoUrls, setPhotoUrls] = useState<Record<number, string>>({})
  const fileInputs = useRef<Record<number, HTMLInputElement | null>>({})

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OWNED': return 'success'
      case 'WISHLISTED': return 'primary'
      default: return 'default'
    }
  }

  // Handle file input click
  const handleAddPhotoClick = (gameId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setUploadError(null)
    fileInputs.current[gameId]?.click()
  }

  // Handle file selection and upload
  const handleFileChange = async (game: GameWithIgdbDetails, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingId(game.id)
    setUploadError(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch(`/api/user/games/${game.id}/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      })
      if (!res.ok) {
        const err = await res.text()
        throw new Error(err || 'Upload failed')
      }
      // Expecting the response to contain the new photo URL
      const data = await res.json()
      const url = data.photoUrl || data.url || null
      if (url) {
        setPhotoUrls(prev => ({ ...prev, [game.id]: url }))
      }
    } catch (err: any) {
      setUploadError(err.message || 'Upload failed')
    } finally {
      setUploadingId(null)
      // Clear the file input value so the same file can be re-selected
      if (fileInputs.current[game.id]) fileInputs.current[game.id]!.value = ''
    }
  }

  return (
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
            <TableCell sx={{ fontWeight: 600 }}>Photo</TableCell>
            {showPlatform && <TableCell sx={{ fontWeight: 600 }}>Platform</TableCell>}
            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Details</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Rating</TableCell>
            <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {games.map((game) => (
            <TableRow
              key={game.id}
              hover
              sx={{ 
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: 'action.hover'
                }
              }}
              onClick={() => onGameClick(game)}
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
                    )}
                    {game.condition && (
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
                  {game.photoUrl || photoUrls[game.id] ? (
                    <Box
                      component="img"
                      src={photoUrls[game.id] || game.photoUrl!}
                      alt={`${game.name} photo`}
                      sx={{
                        maxHeight: 100,
                        maxWidth: 120,
                        borderRadius: 2,
                        objectFit: 'cover',
                        boxShadow: 1,
                      }}
                      onClick={e => e.stopPropagation()}
                    />
                  ) : (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        ref={el => { fileInputs.current[game.id] = el; }}
                        onClick={e => e.stopPropagation()}
                        onChange={e => handleFileChange(game, e)}
                      />
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={e => handleAddPhotoClick(game.id, e)}
                        disabled={uploadingId === game.id}
                      >
                        {uploadingId === game.id ? 'Uploading...' : 'Add Photo'}
                      </Button>
                      {uploadError && uploadingId === null && (
                        <Typography variant="caption" color="error.main">{uploadError}</Typography>
                      )}
                    </>
                  )}
                </TableCell>
                {showPlatform && (
                  <TableCell>
                    {game.platform ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {game.platform.platform_logo_base64 && (
                          <Box
                            component="img"
                            src={game.platform.platform_logo_base64}
                            alt={`${game.platform.name} logo`}
                            sx={{
                              width: 32,
                              height: 32,
                              objectFit: 'contain'
                            }}
                          />
                        )}
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {game.platform.abbreviation || game.platform.name}
                          </Typography>
                          {game.platform.abbreviation && (
                            <Typography variant="caption" color="text.secondary">
                              {game.platform.name}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">-</Typography>
                    )}
                  </TableCell>
                )}
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
                            color="primary"                            onClick={(e) => {
                              e.stopPropagation()
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
                      color="secondary"                      onClick={(e) => {
                        e.stopPropagation()
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
                            color="info"                            onClick={(e) => {
                              e.stopPropagation()
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
                                color="success"                                onClick={(e) => {
                                  e.stopPropagation()
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
                                color="success"                                onClick={(e) => {
                                  e.stopPropagation()
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
                                color="success"                                onClick={(e) => {
                                  e.stopPropagation()
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
                                color="success"                                onClick={(e) => {
                                  e.stopPropagation()
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
                    onDeleteGame(game.id)
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
  )
}
