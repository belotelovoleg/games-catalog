'use client'

import { useState } from 'react'
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Card,
  CardContent,
  CardActions,
  Tooltip
} from '@mui/material'
import {
  Sync,
  Storage,
  Download,
  Business,
  Category,
  DeviceHub,
  Image,
  ExpandMore,
  CheckCircle,
  PlayArrow,
  SportsEsports
} from '@mui/icons-material'

interface SyncStats {
  title: string
  message: string
  severity: 'success' | 'error'
}

interface SyncGroup {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'info'
  items: SyncItem[]
  priority: 1 | 2 | 3
}

interface SyncItem {
  id: string
  label: string
  description: string
  endpoint: string
  estimated: string
  required?: boolean
}

export default function IGDBSyncManagerNew() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [completedSyncs, setCompletedSyncs] = useState<Set<string>>(new Set())
  const [notification, setNotification] = useState<SyncStats & { open: boolean }>({
    open: false,
    title: '',
    message: '',
    severity: 'success'
  })

  const syncGroups: SyncGroup[] = [
    {
      id: 'foundation',
      title: 'Foundation Data',
      description: 'Essential platform and company data - start here first',
      icon: <Storage />,
      color: 'primary',
      priority: 1,
      items: [
        {
          id: 'platforms',
          label: 'Platforms',
          description: 'Core gaming platforms (PlayStation, Xbox, etc.)',
          endpoint: 'platforms',
          estimated: '30-60s',
          required: true
        },
        {
          id: 'companies',
          label: 'Companies',
          description: 'Game developers and publishers',
          endpoint: 'companies',
          estimated: '2-5min',
          required: true
        },
        {
          id: 'platform-versions',
          label: 'Platform Versions',
          description: 'Specific platform variants (PS4 Pro, Xbox One S, etc.)',
          endpoint: 'platform-versions',
          estimated: '30-60s'
        }
      ]
    },
    {
      id: 'platform-metadata',
      title: 'Platform Metadata',
      description: 'Additional platform information and classifications',
      icon: <DeviceHub />,
      color: 'secondary',
      priority: 2,
      items: [
        {
          id: 'platform-families',
          label: 'Platform Families',
          description: 'Platform family groups (PlayStation family, etc.)',
          endpoint: 'platform-families',
          estimated: '10-20s'
        },
        {
          id: 'platform-types',
          label: 'Platform Types',
          description: 'Platform categories (Console, PC, Mobile, etc.)',
          endpoint: 'platform-types',
          estimated: '10-20s'
        },
        {
          id: 'platform-logos',
          label: 'Platform Logos',
          description: 'Official platform logos and branding',
          endpoint: 'platform-logos',
          estimated: '1-3min'
        }
      ]
    },
    {
      id: 'game-metadata',
      title: 'Game Metadata',
      description: 'Game classification and reference data',
      icon: <Category />,
      color: 'info',
      priority: 2,
      items: [
        {
          id: 'genres',
          label: 'Genres',
          description: 'Game genres (Action, RPG, Strategy, etc.)',
          endpoint: 'genres',
          estimated: '10-20s'
        },
        {
          id: 'franchises',
          label: 'Franchises',
          description: 'Game series and franchises (Mario, Call of Duty, etc.)',
          endpoint: 'franchises',
          estimated: '30-60s'
        },
        {
          id: 'game-engines',
          label: 'Game Engines',
          description: 'Game development engines (Unity, Unreal, etc.)',
          endpoint: 'game-engines',
          estimated: '30-60s'
        },
        {
          id: 'game-types',
          label: 'Game Types',
          description: 'Game categories (Main Game, DLC, Expansion, etc.)',
          endpoint: 'game-types',
          estimated: '10-20s'
        }
      ]
    },
    {
      id: 'game-content',
      title: 'Game Content & Media',
      description: 'Game-specific content - sync after you have games',
      icon: <Image />,
      color: 'warning',
      priority: 3,
      items: [
        {
          id: 'covers',
          label: 'Game Covers',
          description: 'Game cover artwork and thumbnails',
          endpoint: 'covers',
          estimated: '5-15min'
        },
        {
          id: 'screenshots',
          label: 'Screenshots',
          description: 'Game screenshots and media',
          endpoint: 'screenshots',
          estimated: '10-30min'
        },
        {
          id: 'alternative-names',
          label: 'Alternative Names',
          description: 'Regional and alternative game titles',
          endpoint: 'alternative-names',
          estimated: '2-5min'
        },
        {
          id: 'multiplayer-modes',
          label: 'Multiplayer Modes',
          description: 'Online/offline multiplayer information',
          endpoint: 'multiplayer-modes',
          estimated: '1-3min'
        },
        {
          id: 'age-ratings',
          label: 'Age Ratings',
          description: 'ESRB, PEGI, and other age rating data',
          endpoint: 'age-ratings',
          estimated: '2-5min'
        },
        {
          id: 'age-rating-categories',
          label: 'Age Rating Categories',
          description: 'Age rating classification categories',
          endpoint: 'age-rating-categories',
          estimated: '10-20s'
        }
      ]
    }
  ]

  const showNotification = (title: string, message: string, severity: 'success' | 'error') => {
    setNotification({ open: true, title, message, severity })
  }

  const handleSync = async (endpoint: string, label: string) => {
    const loadingKey = `sync-${endpoint}`
    setLoadingStates(prev => ({ ...prev, [loadingKey]: true }))
    setIsLoading(true)

    try {
      const response = await fetch(`/api/admin/sync/${endpoint}`, {
        method: 'POST',
      })

      if (response.ok) {
        const result = await response.json()
        
        const title = `✅ ${label} Sync Completed!`
        const message = `Successfully processed ${result.totalSynced || result.count || 0} items (${result.new || 0} new, ${result.updated || 0} updated)`
        
        showNotification(title, message, 'success')
        setCompletedSyncs(prev => new Set([...prev, endpoint]))
      } else {
        const error = await response.json()
        showNotification(
          `❌ ${label} Sync Failed`, 
          error.error || 'Unknown error occurred',
          'error'
        )
      }
    } catch (error) {
      console.error(`${endpoint} sync error:`, error)
      showNotification(
        `❌ ${label} Sync Failed`, 
        'Network error or server unavailable',
        'error'
      )
    } finally {
      setLoadingStates(prev => ({ ...prev, [loadingKey]: false }))
      setIsLoading(false)
    }
  }

  const handleBulkSync = async (groupId: string) => {
    const group = syncGroups.find(g => g.id === groupId)
    if (!group) return

    setIsLoading(true)
    const bulkKey = `bulk-${groupId}`
    setLoadingStates(prev => ({ ...prev, [bulkKey]: true }))

    try {
      for (const item of group.items) {
        if (!loadingStates[`sync-${item.endpoint}`]) {
          await handleSync(item.endpoint, item.label)
          // Small delay between syncs to avoid overwhelming the API
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, [bulkKey]: false }))
      setIsLoading(false)
    }
  }

  const getGroupProgress = (group: SyncGroup) => {
    const completed = group.items.filter(item => completedSyncs.has(item.endpoint)).length
    return { completed, total: group.items.length, percentage: (completed / group.items.length) * 100 }
  }

  const renderSyncItem = (item: SyncItem) => {
    const isLoading = loadingStates[`sync-${item.endpoint}`]
    const isCompleted = completedSyncs.has(item.endpoint)
    
    return (
      <Card key={item.id} variant="outlined" sx={{ mb: 1 }}>
        <CardContent sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
              {item.label}
            </Typography>
            {item.required && <Chip label="Required" size="small" color="error" />}
            {isCompleted && <CheckCircle color="success" fontSize="small" />}
            <Chip label={item.estimated} size="small" variant="outlined" />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {item.description}
          </Typography>
        </CardContent>
        <CardActions sx={{ pt: 0 }}>
          <Button
            size="small"
            variant={isCompleted ? "outlined" : "contained"}
            color={isCompleted ? "success" : "primary"}
            startIcon={isLoading ? <CircularProgress size={16} /> : (isCompleted ? <CheckCircle /> : <PlayArrow />)}
            onClick={() => handleSync(item.endpoint, item.label)}
            disabled={isLoading}
            sx={{ minWidth: 120 }}
          >
            {isLoading ? 'Syncing...' : (isCompleted ? 'Re-sync' : 'Sync')}
          </Button>
        </CardActions>
      </Card>
    )
  }

  return (
    <>
      <Paper sx={{ p: 3, mb: 3 }}>
        {isLoading && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress />
          </Box>
        )}
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Storage color="primary" />
          <Typography variant="h6">IGDB Data Synchronization</Typography>
        </Box>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          Organize your IGDB data sync with a clear workflow. Follow the priority order for best results.
        </Typography>

        {/* Quick Start Workflow */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
            🚀 Quick Start Workflow
          </Typography>
          <Typography variant="body2">
            1. Sync <strong>Foundation Data</strong> first (Platforms & Companies)<br/>
            2. Add games using the <strong>Games Sync Manager</strong> below<br/>
            3. Then sync <strong>Game Content & Media</strong> for enriched data
          </Typography>
        </Alert>

        {/* Sync Groups */}
        <Stack spacing={2}>
          {syncGroups
            .sort((a, b) => a.priority - b.priority)
            .map((group) => {
              const progress = getGroupProgress(group)
              const isBulkLoading = loadingStates[`bulk-${group.id}`]
              
              return (
                <Accordion key={group.id} defaultExpanded={group.priority === 1}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {group.icon}
                        <Typography variant="h6">{group.title}</Typography>
                        <Chip 
                          label={`Priority ${group.priority}`} 
                          size="small" 
                          color={group.priority === 1 ? 'error' : group.priority === 2 ? 'warning' : 'info'} 
                        />
                      </Box>
                      <Box sx={{ flex: 1, mx: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={progress.percentage} 
                            sx={{ flex: 1, height: 6, borderRadius: 3 }}
                          />
                          <Typography variant="caption">
                            {progress.completed}/{progress.total}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {group.description}
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Button
                        variant="contained"
                        color={group.color}
                        startIcon={isBulkLoading ? <CircularProgress size={16} /> : <Sync />}
                        onClick={() => handleBulkSync(group.id)}
                        disabled={isBulkLoading || isLoading}
                        sx={{ mb: 2 }}
                      >
                        {isBulkLoading ? 'Syncing All...' : `Sync All ${group.title}`}
                      </Button>
                    </Box>                    <Box sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: { xs: '1fr', md: '1fr 1fr', lg: '1fr 1fr 1fr' },
                      gap: 2 
                    }}>
                      {group.items.map((item) => renderSyncItem(item))}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              )
            })}
        </Stack>

        <Divider sx={{ my: 3 }} />
        
        <Alert severity="warning">
          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
            ⚠️ Important Notes
          </Typography>
          <Typography variant="body2">
            • Start with <strong>Foundation Data</strong> before syncing games<br/>
            • <strong>Game Content</strong> syncs are most useful after you have games in your database<br/>
            • Large syncs (covers, screenshots) can take significant time<br/>
            • All operations respect IGDB rate limits (4 requests/second)
          </Typography>
        </Alert>
      </Paper>

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
          </Box>
        </Alert>
      </Snackbar>
    </>
  )
}
