'use client'

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  Button,
  Typography,
  Alert,
  Snackbar,
  CircularProgress,
  Paper,
  Stack,
  Divider,
  LinearProgress,
  Card,
  CardContent,
  CardActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton
} from '@mui/material'
import {
  Storage,
  DeviceHub,
  SportsEsports,
  Category,
  Image,
  CheckCircle,
  PlayArrow,
  Info,
  Refresh
} from '@mui/icons-material'

interface Platform {
  id: number
  name: string
  versionName?: string
  igdbPlatformId?: number
  igdbPlatformVersionId?: number
  platform_family?: number
  platform_type?: number
  generation?: number
  igdbPlatformName?: string
  igdbPlatformVersionName?: string
}

interface SyncStats {
  title: string
  message: string
  severity: 'success' | 'error'
  details?: string
}

interface SyncResult {
  success: boolean
  totalSynced?: number
  count?: number
  new?: number
  updated?: number
  error?: string
}

interface SyncBlockItem {
  id: string
  label: string
  labelKey: string
  description: string
  descriptionKey: string
  endpoint: string
  estimated: string
  estimatedKey: string
  required?: boolean
  disabled?: boolean
}

export default function IGDBComprehensiveSync() {
  const { t } = useTranslation()
    // States
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [completedSyncs, setCompletedSyncs] = useState<Set<string>>(new Set())
  const [completedPlatformSyncs, setCompletedPlatformSyncs] = useState<Map<string, Set<string>>>(new Map())
  const [notification, setNotification] = useState<SyncStats & { open: boolean }>({
    open: false,
    title: '',
    message: '',
    severity: 'success'
  })
  
  // Platform selection for Block 3
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [selectedPlatform, setSelectedPlatform] = useState<number | ''>('')
  const [loadingPlatforms, setLoadingPlatforms] = useState(true)
  
  // Block definitions
  const platformsSyncBlock: SyncBlockItem[] = [
    {
      id: 'platforms',
      label: 'Platforms',
      labelKey: 'igdbsync_platforms_label',
      description: 'Core gaming platforms (PlayStation, Xbox, etc.)',
      descriptionKey: 'igdbsync_platforms_desc',
      endpoint: 'platforms',
      estimated: '30-60s',
      estimatedKey: 'igdbsync_time_short',
      required: true
    },
    {
      id: 'platform-versions',
      label: 'Platform Versions',
      labelKey: 'igdbsync_platform_versions_label',
      description: 'Specific platform variants (PS4 Pro, Xbox One S, etc.)',
      descriptionKey: 'igdbsync_platform_versions_desc',
      endpoint: 'platform-versions',
      estimated: '30-60s',
      estimatedKey: 'igdbsync_time_short'
    }
  ]

  const supportiveDataBlock: SyncBlockItem[] = [
    {
      id: 'companies',
      label: 'Companies',
      labelKey: 'igdbsync_companies_label',
      description: 'Game developers and publishers',
      descriptionKey: 'igdbsync_companies_desc',
      endpoint: 'companies',
      estimated: '2-5min',
      estimatedKey: 'igdbsync_time_medium',
      required: true
    },
    {
      id: 'platform-families',
      label: 'Platform Families',
      labelKey: 'igdbsync_platform_families_label',
      description: 'Platform family groups (PlayStation family, etc.)',
      descriptionKey: 'igdbsync_platform_families_desc',
      endpoint: 'platform-families',
      estimated: '10-20s',
      estimatedKey: 'igdbsync_time_quick'
    },
    {
      id: 'platform-types',
      label: 'Platform Types',
      labelKey: 'igdbsync_platform_types_label',
      description: 'Platform categories (Console, PC, Mobile, etc.)',
      descriptionKey: 'igdbsync_platform_types_desc',
      endpoint: 'platform-types',
      estimated: '10-20s',
      estimatedKey: 'igdbsync_time_quick'
    },
    {
      id: 'platform-logos',
      label: 'Platform Logos',
      labelKey: 'igdbsync_platform_logos_label',
      description: 'Official platform logos and branding',
      descriptionKey: 'igdbsync_platform_logos_desc',
      endpoint: 'platform-logos',
      estimated: '1-3min',
      estimatedKey: 'igdbsync_time_short_medium'
    },
    {
      id: 'genres',
      label: 'Genres',
      labelKey: 'igdbsync_genres_label',
      description: 'Game genres (Action, RPG, Strategy, etc.)',
      descriptionKey: 'igdbsync_genres_desc',
      endpoint: 'genres',
      estimated: '10-20s',
      estimatedKey: 'igdbsync_time_quick'
    },
    {
      id: 'franchises',
      label: 'Franchises',
      labelKey: 'igdbsync_franchises_label',
      description: 'Game series and franchises (Mario, Call of Duty, etc.)',
      descriptionKey: 'igdbsync_franchises_desc',
      endpoint: 'franchises',
      estimated: '30-60s',
      estimatedKey: 'igdbsync_time_short'
    },
    {
      id: 'game-engines',
      label: 'Game Engines',
      labelKey: 'igdbsync_game_engines_label',
      description: 'Game development engines (Unity, Unreal, etc.)',
      descriptionKey: 'igdbsync_game_engines_desc',
      endpoint: 'game-engines',
      estimated: '30-60s',
      estimatedKey: 'igdbsync_time_short'
    },
    {
      id: 'game-types',
      label: 'Game Types',
      labelKey: 'igdbsync_game_types_label',
      description: 'Game categories (Main Game, DLC, Expansion, etc.)',
      descriptionKey: 'igdbsync_game_types_desc',
      endpoint: 'game-types',
      estimated: '10-20s',
      estimatedKey: 'igdbsync_time_quick'
    },
    {
      id: 'age-rating-categories',
      label: 'Age Rating Categories',
      labelKey: 'igdbsync_age_rating_categories_label',
      description: 'Age rating classification categories',
      descriptionKey: 'igdbsync_age_rating_categories_desc',
      endpoint: 'age-rating-categories',
      estimated: '10-20s',
      estimatedKey: 'igdbsync_time_quick'
    }
  ]

  const platformSpecificBlock: SyncBlockItem[] = [
    {
      id: 'games',
      label: 'Games',
      labelKey: 'igdbsync_games_label',
      description: 'Games for the selected platform',
      descriptionKey: 'igdbsync_games_desc',
      endpoint: 'games',
      estimated: '2-10min',
      estimatedKey: 'igdbsync_time_medium_long'
    },
    {
      id: 'covers',
      label: 'Game Covers',
      labelKey: 'igdbsync_covers_label',
      description: 'Game cover artwork and thumbnails',
      descriptionKey: 'igdbsync_covers_desc',
      endpoint: 'covers',
      estimated: '5-15min',
      estimatedKey: 'igdbsync_time_long'
    },
    {
      id: 'screenshots',
      label: 'Screenshots',
      labelKey: 'igdbsync_screenshots_label',
      description: 'Game screenshots and media',
      descriptionKey: 'igdbsync_screenshots_desc',
      endpoint: 'screenshots',
      estimated: '10-30min',
      estimatedKey: 'igdbsync_time_very_long'
    },
    {
      id: 'alternative-names',
      label: 'Alternative Names',
      labelKey: 'igdbsync_alternative_names_label',
      description: 'Regional and alternative game titles',
      descriptionKey: 'igdbsync_alternative_names_desc',
      endpoint: 'alternative-names',
      estimated: '2-5min',
      estimatedKey: 'igdbsync_time_medium'
    },
    {
      id: 'multiplayer-modes',
      label: 'Multiplayer Modes',
      labelKey: 'igdbsync_multiplayer_modes_label',
      description: 'Online/offline multiplayer information',
      descriptionKey: 'igdbsync_multiplayer_modes_desc',
      endpoint: 'multiplayer-modes',
      estimated: '1-3min',
      estimatedKey: 'igdbsync_time_short_medium'
    },
    {
      id: 'age-ratings',
      label: 'Age Ratings',
      labelKey: 'igdbsync_age_ratings_label',
      description: 'ESRB, PEGI, and other age rating data',
      descriptionKey: 'igdbsync_age_ratings_desc',
      endpoint: 'age-ratings',
      estimated: '2-5min',
      estimatedKey: 'igdbsync_time_medium'
    }
  ]

  // Load eligible platforms
  const loadEligiblePlatforms = async () => {
    try {
      setLoadingPlatforms(true)
      const response = await fetch('/api/admin/games/eligible-platforms', {
        credentials: 'include'
      })
      
      if (response.ok) {
        const data = await response.json()
        setPlatforms(data.platforms || [])
      } else {
        showNotification(
          t('igdbsync_error_load_platforms_title'),
          t('igdbsync_error_load_platforms_message'),
          'error'
        )
      }
    } catch (error) {
      showNotification(
        t('igdbsync_error_load_platforms_title'),
        t('igdbsync_error_network_message'),
        'error'
      )
    } finally {
      setLoadingPlatforms(false)
    }
  }
  useEffect(() => {
    loadEligiblePlatforms()
  }, [])

  // Reset platform-specific completed syncs when platform selection changes
  useEffect(() => {
    if (selectedPlatform) {
      // Create a key for the current platform's completed syncs
      const platformKey = selectedPlatform.toString()
      if (!completedPlatformSyncs.has(platformKey)) {
        setCompletedPlatformSyncs(prev => new Map(prev.set(platformKey, new Set())))
      }
    }
  }, [selectedPlatform])

  const showNotification = (title: string, message: string, severity: 'success' | 'error', details?: string) => {
    setNotification({ open: true, title, message, severity, details })
  }

  const handleSync = async (endpoint: string, label: string, platformId?: number) => {
    const loadingKey = `sync-${endpoint}`
    setLoadingStates(prev => ({ ...prev, [loadingKey]: true }))
    setIsLoading(true)

    try {
      let url = `/api/admin/sync/${endpoint}`
      let body: any = undefined
      
      // For platform-specific syncs, we use different API endpoints
      if (platformId && endpoint === 'games') {
        url = '/api/admin/games/sync'
        body = JSON.stringify({ platformId })
      } else if (platformId && platformSpecificBlock.some(item => item.endpoint === endpoint)) {
        // For other platform-specific data, pass platformId as query param or body
        body = JSON.stringify({ platformId })
      }      const response = await fetch(url, {
        method: 'POST',
        headers: body ? { 'Content-Type': 'application/json' } : {},
        credentials: 'include',
        body
      })

      if (response.ok) {
        const result: SyncResult = await response.json()
        
        const title = t('igdbsync_success_title', { label })
        const message = t('igdbsync_success_message', { 
          count: result.totalSynced || result.count || 0,
          new: result.new || 0,
          updated: result.updated || 0
        })

        showNotification(title, message, 'success')
        
        // Track completion differently for platform-specific vs general syncs
        if (platformId) {
          // Platform-specific sync
          const platformKey = platformId.toString()
          setCompletedPlatformSyncs(prev => {
            const newMap = new Map(prev)
            const platformSyncs = newMap.get(platformKey) || new Set()
            platformSyncs.add(endpoint)
            newMap.set(platformKey, platformSyncs)
            return newMap
          })
        } else {
          // General sync
          setCompletedSyncs(prev => new Set([...prev, endpoint]))
        }
      } else {
        const error = await response.json()
        showNotification(
          t('igdbsync_error_title', { label }),
          error.error || t('igdbsync_error_unknown'),
          'error'
        )
      }
    } catch (error) {
      console.error(`${endpoint} sync error:`, error)
      showNotification(
        t('igdbsync_error_title', { label }),
        t('igdbsync_error_network_message'),
        'error'
      )
    } finally {
      setLoadingStates(prev => ({ ...prev, [loadingKey]: false }))
      setIsLoading(false)
    }
  }

  const handleBulkSync = async (items: SyncBlockItem[], blockName: string, platformId?: number) => {
    const bulkKey = `bulk-${blockName}`
    setLoadingStates(prev => ({ ...prev, [bulkKey]: true }))
    setIsLoading(true)

    try {
      for (const item of items) {
        if (!item.disabled && !loadingStates[`sync-${item.endpoint}`]) {
          await handleSync(item.endpoint, t(item.labelKey), platformId)
          // Small delay between syncs to avoid overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, [bulkKey]: false }))
      setIsLoading(false)
    }
  }
  const getBlockProgress = (items: SyncBlockItem[], platformId?: number) => {
    const enabledItems = items.filter(item => !item.disabled)
    
    let completed = 0
    if (platformId) {
      // For platform-specific blocks, check platform-specific completions
      const platformKey = platformId.toString()
      const platformSyncs = completedPlatformSyncs.get(platformKey)
      completed = enabledItems.filter(item => platformSyncs ? platformSyncs.has(item.endpoint) : false).length
    } else {
      // For general blocks, check general completions
      completed = enabledItems.filter(item => completedSyncs.has(item.endpoint)).length
    }
    
    return { 
      completed, 
      total: enabledItems.length, 
      percentage: enabledItems.length > 0 ? (completed / enabledItems.length) * 100 : 0 
    }
  }
  const renderSyncItem = (item: SyncBlockItem, platformId?: number) => {
    const isLoading = loadingStates[`sync-${item.endpoint}`]
    
    // Check completion status - for platform-specific syncs, check platform-specific completion
    let isCompleted = false
    if (platformId) {
      const platformKey = platformId.toString()
      const platformSyncs = completedPlatformSyncs.get(platformKey)
      isCompleted = platformSyncs ? platformSyncs.has(item.endpoint) : false
    } else {
      isCompleted = completedSyncs.has(item.endpoint)
    }

    return (
      <Card key={item.id} variant="outlined" sx={{ mb: 1, opacity: item.disabled ? 0.5 : 1 }}>
        <CardContent sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              {t(item.labelKey)}
            </Typography>
            {item.required && <Chip label={t('igdbsync_required')} size="small" color="error" />}
            {isCompleted && <CheckCircle color="success" fontSize="small" />}
            <Chip label={t(item.estimatedKey)} size="small" variant="outlined" />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {t(item.descriptionKey)}
          </Typography>
        </CardContent>
        <CardActions sx={{ pt: 0 }}>
          <Button
            size="small"
            variant={isCompleted ? "outlined" : "contained"}
            color={isCompleted ? "success" : "primary"}
            startIcon={isLoading ? <CircularProgress size={16} /> : (isCompleted ? <CheckCircle /> : <PlayArrow />)}
            onClick={() => handleSync(item.endpoint, t(item.labelKey), platformId)}
            disabled={isLoading || item.disabled}
            sx={{ minWidth: 120 }}
          >
            {isLoading ? t('igdbsync_syncing') : (isCompleted ? t('igdbsync_resync') : t('igdbsync_sync'))}
          </Button>
        </CardActions>
      </Card>
    )
  }

  const renderSyncBlock = (
    title: string,
    titleKey: string,
    description: string,
    descriptionKey: string,
    icon: React.ReactNode,
    color: 'primary' | 'secondary' | 'success' | 'warning' | 'info',
    items: SyncBlockItem[],
    blockId: string,
    platformId?: number,
    additionalContent?: React.ReactNode
  ) => {
    const progress = getBlockProgress(items, platformId)
    const isBulkLoading = loadingStates[`bulk-${blockId}`]

    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          {icon}
          <Typography variant="h6">{t(titleKey)}</Typography>
          <Box sx={{ flex: 1, mx: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LinearProgress
                variant="determinate"
                value={progress.percentage}
                sx={{ flex: 1, height: 6, borderRadius: 3 }}
                color={color}
              />
              <Typography variant="caption">
                {progress.completed}/{progress.total}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" paragraph>
          {t(descriptionKey)}
        </Typography>

        {additionalContent}

        <Box sx={{ mb: 2 }}>
          <Button
            variant="contained"
            color={color}
            startIcon={isBulkLoading ? <CircularProgress size={16} /> : <PlayArrow />}
            onClick={() => handleBulkSync(items, blockId, platformId)}
            disabled={isBulkLoading || isLoading || items.every(item => item.disabled)}
            sx={{ mb: 2 }}
          >
            {isBulkLoading ? t('igdbsync_syncing_all') : t('igdbsync_sync_all_block', { title: t(titleKey) })}
          </Button>
        </Box>

        <Box sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' },
          gap: 2
        }}>
          {items.map((item) => renderSyncItem(item, platformId))}
        </Box>
      </Paper>
    )
  }

  return (
    <>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          {t('igdbsync_main_title')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('igdbsync_main_description')}
        </Typography>
      </Box>

      {isLoading && (
        <Box sx={{ mb: 2 }}>
          <LinearProgress />
        </Box>
      )}

      {/* Quick Start Workflow */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
          {t('igdbsync_workflow_title')}
        </Typography>
        <Typography variant="body2">
          {t('igdbsync_workflow_description')}
        </Typography>
      </Alert>

      {/* Block 1: Platforms Sync */}
      {renderSyncBlock(
        'Platforms Sync',
        'igdbsync_block1_title',
        'Essential platform data - fetch all platforms without filters',
        'igdbsync_block1_description',
        <Storage />,
        'primary',
        platformsSyncBlock,
        'platforms'
      )}

      {/* Block 2: Supportive Data Sync */}
      {renderSyncBlock(
        'Supportive Data Sync',
        'igdbsync_block2_title',
        'Reference and support data - fetch all without filters',
        'igdbsync_block2_description',
        <Category />,
        'secondary',
        supportiveDataBlock,
        'supportive'
      )}

      {/* Block 3: Platform-Specific Sync */}
      {renderSyncBlock(
        'Platform-Specific Sync',
        'igdbsync_block3_title',
        'Games and related data for a specific platform',
        'igdbsync_block3_description',
        <SportsEsports />,
        'success',
        platformSpecificBlock.map(item => ({
          ...item,
          disabled: !selectedPlatform
        })),
        'platform-specific',
        selectedPlatform || undefined,
        <Box sx={{ mb: 2 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>{t('igdbsync_select_platform')}</InputLabel>
            <Select
              value={selectedPlatform}
              label={t('igdbsync_select_platform')}
              onChange={(e) => setSelectedPlatform(e.target.value as number)}
              disabled={loadingPlatforms}
            >              {platforms.map((platform) => {
                // Build display name: Platform Name (IGDB Platform Name)
                let displayName = platform.name
                
                if (platform.igdbPlatformName) {
                  displayName += ` (${platform.igdbPlatformName})`
                } else if (platform.versionName) {
                  // Fallback to version name if no IGDB platform name available
                  displayName += ` (${platform.versionName})`
                }
                
                return (
                  <MenuItem key={platform.id} value={platform.id}>
                    {displayName}
                  </MenuItem>
                )
              })}
            </Select>
          </FormControl>
          {!selectedPlatform && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {t('igdbsync_select_platform_warning')}
            </Alert>
          )}
        </Box>
      )}

      <Divider sx={{ my: 3 }} />

      <Alert severity="warning">
        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
          {t('igdbsync_important_notes_title')}
        </Typography>
        <Typography variant="body2">
          {t('igdbsync_important_notes_description')}
        </Typography>
      </Alert>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setNotification(prev => ({ ...prev, open: false }))}
          severity={notification.severity}
          variant="filled"
        >
          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              {notification.title}
            </Typography>
            <Typography variant="body2">
              {notification.message}
            </Typography>
            {notification.details && (
              <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-line' }}>
                {notification.details}
              </Typography>
            )}
          </Box>
        </Alert>
      </Snackbar>
    </>
  )
}
