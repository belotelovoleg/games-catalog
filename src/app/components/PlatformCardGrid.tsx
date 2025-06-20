"use client"

import {
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Typography,
  Box,
  Stack,
  Chip,
  Tooltip,
  IconButton,
  CircularProgress
} from '@mui/material'
import { Info, Add, StarBorder, ShoppingCart, Delete } from '@mui/icons-material'

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

interface PlatformCardGridProps {
  platforms: Platform[]
  userPlatforms: { id: number; platform: Platform; status: 'OWNED' | 'WISHLISTED' }[]
  platformLoading: Record<number, 'adding' | 'removing' | null>
  onPlatformClick: (platformId: number) => void
  onShowDetails: (platformId: number, e: React.MouseEvent) => void
  onAddPlatform: (platformId: number, status: 'OWNED' | 'WISHLISTED') => void
  onRemovePlatform: (platformId: number) => void
}

export default function PlatformCardGrid({
  platforms,
  userPlatforms,
  platformLoading,
  onPlatformClick,
  onShowDetails,
  onAddPlatform,
  onRemovePlatform
}: PlatformCardGridProps) {
  const getPlatformStatus = (platformId: number) => {
    return userPlatforms.find(up => up.platform.id === platformId)?.status
  }

  return (
    <Grid container spacing={3}>
      {platforms.map((platform) => {
        const status = getPlatformStatus(platform.id)
        const displayName = platform.versionName || platform.name
        
        return (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={platform.id}>
            <Card 
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                  borderColor: 'primary.main'
                }
              }}
              onClick={() => onPlatformClick(platform.id)}
            >
              {platform.imageUrl && (
                <CardMedia
                  component="img"
                  height="160"
                  image={platform.imageUrl}
                  alt={displayName}
                  sx={{ 
                    objectFit: 'contain', 
                    p: 2,
                    backgroundColor: 'background.default'
                  }}
                />
              )}
              {!platform.imageUrl && (
                <Box sx={{ 
                  height: 160, 
                  backgroundColor: 'action.hover',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  m: 2,
                  borderRadius: 1
                }}>
                  <Typography variant="body2" color="text.secondary">
                    No Image
                  </Typography>
                </Box>
              )}
              
              <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                <Typography gutterBottom variant="h6" component="div" sx={{ fontSize: '1rem' }}>
                  {displayName}
                </Typography>
                
                {platform.versionName && platform.versionName !== platform.name && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Platform: {platform.name}
                  </Typography>
                )}
                
                <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5} sx={{ mb: 1 }}>
                  {platform.generation && (
                    <Chip 
                      label={`Gen ${platform.generation}`} 
                      size="small" 
                      variant="outlined"
                      color="primary"
                    />
                  )}
                  {platform.familyName && (
                    <Chip 
                      label={platform.familyName} 
                      size="small" 
                      variant="outlined"
                      color="secondary"
                    />
                  )}
                  {platform.typeName && (
                    <Chip 
                      label={platform.typeName} 
                      size="small" 
                      variant="outlined"
                    />
                  )}
                </Stack>
                
                {status && (
                  <Chip 
                    label={status === 'OWNED' ? 'Owned' : 'Wishlisted'} 
                    color={status === 'OWNED' ? 'success' : 'warning'}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                )}
              </CardContent>

              <CardActions sx={{ pt: 0, justifyContent: 'space-between' }}>
                <Tooltip title="Platform Details">
                  <IconButton 
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation()
                      onShowDetails(platform.id, e)
                    }}
                  >
                    <Info />
                  </IconButton>
                </Tooltip>

                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  {!status && (
                    <>
                      <Tooltip title="Add to Collection">
                        <IconButton 
                          size="small"
                          color="primary"
                          disabled={platformLoading[platform.id] === 'adding'}
                          onClick={(e) => {
                            e.stopPropagation()
                            onAddPlatform(platform.id, 'OWNED')
                          }}
                        >
                          {platformLoading[platform.id] === 'adding' ? 
                            <CircularProgress size={16} /> : <Add />
                          }
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Add to Wishlist">
                        <IconButton 
                          size="small"
                          color="warning"
                          disabled={platformLoading[platform.id] === 'adding'}
                          onClick={(e) => {
                            e.stopPropagation()
                            onAddPlatform(platform.id, 'WISHLISTED')
                          }}
                        >
                          {platformLoading[platform.id] === 'adding' ? 
                            <CircularProgress size={16} /> : <StarBorder />
                          }
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                  {status === 'WISHLISTED' && (
                    <>
                      <Tooltip title="Move to Collection">
                        <IconButton 
                          size="small"
                          color="primary"
                          disabled={platformLoading[platform.id] === 'adding'}
                          onClick={(e) => {
                            e.stopPropagation()
                            onAddPlatform(platform.id, 'OWNED')
                          }}
                        >
                          {platformLoading[platform.id] === 'adding' ? 
                            <CircularProgress size={16} /> : <ShoppingCart />
                          }
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Remove from Wishlist">
                        <IconButton 
                          size="small"
                          color="error"
                          disabled={platformLoading[platform.id] === 'removing'}
                          onClick={(e) => {
                            e.stopPropagation()
                            onRemovePlatform(platform.id)
                          }}
                        >
                          {platformLoading[platform.id] === 'removing' ? 
                            <CircularProgress size={16} /> : <Delete />
                          }
                        </IconButton>
                      </Tooltip>
                    </>
                  )}
                  {status === 'OWNED' && (
                    <Tooltip title="Remove from Collection">
                      <IconButton 
                        size="small"
                        color="error"
                        disabled={platformLoading[platform.id] === 'removing'}
                        onClick={(e) => {
                          e.stopPropagation()
                          onRemovePlatform(platform.id)
                        }}
                      >
                        {platformLoading[platform.id] === 'removing' ? 
                          <CircularProgress size={16} /> : <Delete />
                        }
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </CardActions>
            </Card>
          </Grid>
        )
      })}
    </Grid>
  )
}
