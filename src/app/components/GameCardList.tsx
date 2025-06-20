import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Box,
  Stack,
  IconButton,
  useTheme,
  Divider
} from '@mui/material'
import { Delete as DeleteIcon } from '@mui/icons-material'

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

interface GameCardListProps {
  games: GameWithIgdbDetails[]
  onGameClick: (game: GameWithIgdbDetails) => void
  onDeleteGame: (gameId: number) => void
  showPlatform?: boolean
}

export default function GameCardList({
  games,
  onGameClick,
  onDeleteGame,
  showPlatform = false
}: GameCardListProps) {
  const theme = useTheme()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OWNED': return 'success'
      case 'WISHLISTED': return 'primary'
      default: return 'default'
    }
  }

  return (
    <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
      {games.map((game) => (
        <Card
          key={game.id}
          sx={{
            cursor: 'pointer',
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: theme.shadows[4],
              backgroundColor: 'action.hover'
            },
            backgroundColor: theme.palette.mode === 'dark' ? 'grey.900' : 'background.paper',
            border: 1,
            borderColor: 'divider'
          }}
          onClick={() => onGameClick(game)}
        >
          <CardContent sx={{ pb: 1 }}>
            {/* Game Title and Status */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Typography variant="h6" component="h3" sx={{ fontWeight: 600, flex: 1, mr: 1 }}>
                {game.name}
              </Typography>
              <Chip
                label={game.status}
                color={getStatusColor(game.status) as any}
                size="small"
                onClick={(e) => {
                  e.stopPropagation()
                }}
              />
            </Box>

            {/* Alternative Names */}
            {game.igdbDetails?.alternativeNameDetails && game.igdbDetails.alternativeNameDetails.length > 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mb: 1 }}>
                Also: {game.igdbDetails.alternativeNameDetails.slice(0, 2).map(altName => altName.name).join(', ')}
                {game.igdbDetails.alternativeNameDetails.length > 2 && '...'}
              </Typography>
            )}            {/* Condition and Rating */}
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              {game.condition && (
                <Chip
                  label={game.condition.replace('_', ' ')}
                  size="small"
                  variant="outlined"
                  onClick={(e) => {
                    e.stopPropagation()
                  }}
                />
              )}
              {game.rating && (
                <Chip 
                  label={`${Math.round(game.rating)}/100`} 
                  size="small" 
                  color="primary"
                  variant="outlined"
                  onClick={(e) => {
                    e.stopPropagation()
                  }}
                />
              )}
              {!game.igdbGameId && (
                <Chip label="📝 Custom" size="small" variant="outlined" color="warning" onClick={(e) => {e.stopPropagation()}} />
              )}
            </Box>

            {/* Platform Information */}
            {showPlatform && game.platform && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Platform</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {game.platform.platform_logo_base64 && (
                    <Box
                      component="img"
                      src={game.platform.platform_logo_base64}
                      alt={`${game.platform.name} logo`}
                      sx={{
                        width: 24,
                        height: 24,
                        objectFit: 'contain'
                      }}
                    />
                  )}
                  <Chip
                    label={game.platform.abbreviation || game.platform.name}
                    size="small"
                    variant="outlined"
                    color="default"
                    onClick={(e) => {
                      e.stopPropagation()
                    }}
                  />
                </Box>
              </Box>
            )}

            <Divider sx={{ mb: 2 }} />

            {/* Genres */}
            {game.igdbDetails?.genreDetails && game.igdbDetails.genreDetails.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Genres</Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                  {game.igdbDetails.genreDetails.slice(0, 4).map((genre) => (
                    <Chip 
                      key={genre.igdbId}
                      label={genre.name} 
                      size="small" 
                      variant="outlined" 
                      color="primary"                      onClick={(e) => {
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
                  {game.igdbDetails.genreDetails.length > 4 && (
                    <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                      +{game.igdbDetails.genreDetails.length - 4}
                    </Typography>
                  )}
                </Stack>
              </Box>
            )}

            {/* Franchise */}
            {game.igdbDetails?.franchiseDetails && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Franchise</Typography>
                <Chip 
                  label={`📚 ${game.igdbDetails.franchiseDetails.name}`} 
                  size="small" 
                  variant="outlined" 
                  color="secondary"                  onClick={(e) => {
                    e.stopPropagation()
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
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Companies</Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                  {game.igdbDetails.companyDetails.slice(0, 3).map((company) => (
                    <Chip 
                      key={company.igdbId}
                      label={`🏢 ${company.name}`} 
                      size="small" 
                      variant="outlined" 
                      color="info"                      onClick={(e) => {
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
                  {game.igdbDetails.companyDetails.length > 3 && (
                    <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                      +{game.igdbDetails.companyDetails.length - 3}
                    </Typography>
                  )}
                </Stack>
              </Box>
            )}

            {/* Multiplayer Modes */}
            {game.igdbDetails?.multiplayerModeDetails && game.igdbDetails.multiplayerModeDetails.length > 0 && (
              <Box sx={{ mb: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>Multiplayer</Typography>
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                  {game.igdbDetails.multiplayerModeDetails.map((mode, index) => (
                    <Box key={index}>
                      {mode.lancoop && (
                        <Chip 
                          label="🔗 LAN Co-op" 
                          size="small" 
                          variant="outlined" 
                          color="success"                          onClick={(e) => {
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
                          color="success"                          onClick={(e) => {
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
                          color="success"                          onClick={(e) => {
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
                          color="success"                          onClick={(e) => {
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
          </CardContent>

          <CardActions sx={{ pt: 0, justifyContent: 'flex-end' }}>
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
          </CardActions>
        </Card>
      ))}
    </Box>
  )
}
