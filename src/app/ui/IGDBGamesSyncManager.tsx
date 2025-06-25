'use client'

import { useState, useEffect } from 'react'
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Alert,
  Snackbar,
  CircularProgress,
  Paper,
  Stack,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material'
import {
  SportsEsports,
  Download,
  Refresh,
  Info
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

interface GamesSyncResult {
  success: boolean
  totalGames: number
  newGames: number
  updatedGames: number
  platformName: string
  igdbPlatformId?: number
  syncType?: string
  error?: string
}

export default function IGDBGamesSyncManager() {
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [loadingPlatforms, setLoadingPlatforms] = useState(true)
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})
  const [notification, setNotification] = useState<SyncStats & { open: boolean }>({
    open: false,
    title: '',
    message: '',
    severity: 'success'
  })
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)

  const showNotification = (title: string, message: string, severity: 'success' | 'error', details?: string) => {
    setNotification({ open: true, title, message, severity, details })
  }

  // Load eligible platforms for games sync
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
          '❌ Failed to Load Platforms',
          'Could not load eligible platforms for games sync',
          'error'
        )
      }
    } catch (error) {
      showNotification(
        '❌ Failed to Load Platforms',
        'Network error while loading platforms',
        'error'
      )
    } finally {
      setLoadingPlatforms(false)
    }
  }

  useEffect(() => {
    loadEligiblePlatforms()
  }, [])
  const handleGameSync = async (platform: Platform) => {
    const loadingKey = `variant-${platform.id}`
    setLoadingStates(prev => ({ ...prev, [loadingKey]: true }))

    try {
      const response = await fetch('/api/admin/games/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ platformId: platform.id })
      })

      if (response.ok) {
        const result: GamesSyncResult = await response.json()
        
        const title = `🎮 Games Sync Completed for ${result.platformName}!`
        const summary = `Successfully processed ${result.totalGames} games`
        const details = [
          `🎯 Platform: ${result.platformName}`,
          `📊 Total games processed: ${result.totalGames}`,
          `✨ New games added: ${result.newGames}`,
          `🔄 Existing games updated: ${result.updatedGames}`,
        ].join('\n')
        
        showNotification(title, summary, 'success', details)
      } else {
        const error = await response.json()
        showNotification(
          `❌ Games Sync Failed for ${platform.name}`,
          error.error || 'Unknown error occurred',
          'error'
        )
      }
    } catch (error) {
      console.error(`Games sync error for platform ${platform.id}:`, error)
      showNotification(
        `❌ Games Sync Failed for ${platform.name}`,
        'Network error or server unavailable',
        'error'
      )
    } finally {
      setLoadingStates(prev => ({ ...prev, [loadingKey]: false }))
    }
  }

  const handlePlatformGameSync = async (platform: Platform) => {
    const loadingKey = `platform-${platform.id}`
    setLoadingStates(prev => ({ ...prev, [loadingKey]: true }))

    try {
      const response = await fetch('/api/admin/games/sync-platform', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ platformId: platform.id })
      })

      if (response.ok) {
        const result: GamesSyncResult = await response.json()
        
        const title = `🎮 Platform Games Sync Completed for ${result.platformName}!`
        const summary = `Successfully processed ${result.totalGames} games using Platform ID`
        const details = [
          `🎯 Platform: ${result.platformName}`,
          `🆔 IGDB Platform ID: ${result.igdbPlatformId}`,
          `📊 Total games processed: ${result.totalGames}`,
          `✨ New games added: ${result.newGames}`,
          `🔄 Existing games updated: ${result.updatedGames}`,
        ].join('\n')
        
        showNotification(title, summary, 'success', details)
      } else {
        const error = await response.json()
        showNotification(
          `❌ Platform Games Sync Failed for ${platform.name}`,
          error.error || 'Unknown error occurred',
          'error'
        )
      }
    } catch (error) {
      console.error(`Platform games sync error for platform ${platform.id}:`, error)
      showNotification(
        `❌ Platform Games Sync Failed for ${platform.name}`,
        'Network error or server unavailable',
        'error'
      )
    } finally {
      setLoadingStates(prev => ({ ...prev, [loadingKey]: false }))
    }
  }
  const formatPlatformInfo = (platform: Platform) => {
    // Priority: Show IGDB platform name, then version name, then generation
    const parts = []
    
    if (platform.igdbPlatformName) {
      parts.push(platform.igdbPlatformName)
    } else if (platform.versionName && platform.versionName !== platform.name) {
      parts.push(platform.versionName)
    }
    
    if (platform.generation) {
      parts.push(`Gen ${platform.generation}`)
    }
    
    return parts.length > 0 ? ` (${parts.join(', ')})` : ''
  }

  return (
    <>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <SportsEsports color="primary" />
          <Typography variant="h6">IGDB Games Synchronization</Typography>
          <Tooltip title="Refresh platform list">
            <IconButton onClick={loadEligiblePlatforms} disabled={loadingPlatforms}>
              <Refresh />
            </IconButton>
          </Tooltip>
        </Box>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          Sync game data from IGDB for platforms that have IGDB platform IDs. 
          Games will be associated with the specific platform and stored for collection management.
        </Typography>

        {loadingPlatforms ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : platforms.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              No eligible platforms found. Make sure you have platforms with IGDB platform IDs or version IDs configured.
            </Typography>
          </Alert>
        ) : (
          <>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
              Eligible Platforms ({platforms.length})
            </Typography>
            
            <TableContainer>
              <Table size="small">
                <TableHead>                  <TableRow>
                    <TableCell>Platform</TableCell>
                    <TableCell>IGDB IDs</TableCell>
                    <TableCell>Type/Generation</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {platforms.map((platform) => (
                    <TableRow key={platform.id}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {platform.name}{formatPlatformInfo(platform)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          {platform.igdbPlatformVersionId && (
                            <Chip 
                              label={`Ver: ${platform.igdbPlatformVersionId}`} 
                              size="small" 
                              color="primary" 
                              variant="outlined" 
                            />
                          )}
                          {platform.igdbPlatformId && (
                            <Chip 
                              label={`Plat: ${platform.igdbPlatformId}`} 
                              size="small" 
                              color="secondary" 
                              variant="outlined" 
                            />
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          {platform.generation && (
                            <Chip 
                              label={`Gen ${platform.generation}`} 
                              size="small" 
                              variant="outlined" 
                            />
                          )}
                        </Stack>
                      </TableCell>                      <TableCell align="center">
                        <Stack direction="column" spacing={1}>
                          <Button
                            size="small"
                            variant="outlined"                            startIcon={loadingStates[`variant-${platform.id}`] ? <CircularProgress size={16} /> : <Download />}
                            onClick={() => handleGameSync(platform)}
                            disabled={loadingStates[`variant-${platform.id}`] || loadingStates[`platform-${platform.id}`]}
                          >
                            {loadingStates[`variant-${platform.id}`] ? 'Syncing...' : 'Sync Games (Variant)'}
                          </Button>
                          {platform.igdbPlatformId && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="secondary"
                              startIcon={loadingStates[`platform-${platform.id}`] ? <CircularProgress size={16} /> : <Download />}
                              onClick={() => handlePlatformGameSync(platform)}
                              disabled={loadingStates[`variant-${platform.id}`] || loadingStates[`platform-${platform.id}`]}
                            >
                              {loadingStates[`platform-${platform.id}`] ? 'Syncing...' : 'Sync Games (Platform)'}
                            </Button>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}        <Divider sx={{ my: 2 }} />
        <Typography variant="caption" color="text.secondary">
          💡 Tip: <strong>Sync Games (Variant)</strong> uses Platform Version ID for more specific matching. 
          <strong>Sync Games (Platform)</strong> uses Platform ID for broader matching. 
          This process may take a while for platforms with many games.
        </Typography>
      </Paper>

      {/* Notification Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={8000}
        onClose={() => setNotification(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setNotification(prev => ({ ...prev, open: false }))} 
          severity={notification.severity}
          variant="filled"
          action={
            notification.details ? (
              <Button 
                color="inherit" 
                size="small" 
                onClick={() => setShowDetailsDialog(true)}
                sx={{ ml: 1 }}
              >
                DETAILS
              </Button>
            ) : undefined
          }
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

      {/* Details Dialog */}
      <Dialog 
        open={showDetailsDialog} 
        onClose={() => setShowDetailsDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {notification.severity === 'success' ? '🎮' : '❌'}
            Games Sync Details
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="h6" gutterBottom>
            {notification.title}
          </Typography>
          <Typography variant="body1" paragraph>
            {notification.message}
          </Typography>
          {notification.details && (
            <Box sx={{ 
              backgroundColor: 'background.paper', 
              p: 2, 
              borderRadius: 1, 
              border: 1, 
              borderColor: 'divider',
              fontFamily: 'monospace',
              whiteSpace: 'pre-line'
            }}>
              {notification.details}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDetailsDialog(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
