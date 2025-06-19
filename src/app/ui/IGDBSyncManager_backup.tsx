'use client'

import { useState } from 'react'
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
  Divider
} from '@mui/material'
import {
  Sync,
  Storage,
  Download,
  Business,
  Category,
  DeviceHub,
  Image
} from '@mui/icons-material'

interface SyncStats {
  title: string
  message: string
  severity: 'success' | 'error'
  details?: string
}

interface SyncProgress {
  isOpen: boolean
  type: string
  title: string
  currentStep: string
  progress: number
  totalSteps: number
  details: string[]
}

export default function IGDBSyncManager() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})
  const [notification, setNotification] = useState<SyncStats & { open: boolean }>({
    open: false,
    title: '',
    message: '',
    severity: 'success'
  })
  const [showDetailsDialog, setShowDetailsDialog] = useState(false)
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({
    isOpen: false,
    type: '',
    title: '',
    currentStep: '',
    progress: 0,
    totalSteps: 0,
    details: []
  })
  
  const showNotification = (title: string, message: string, severity: 'success' | 'error', details?: string) => {
    setNotification({ open: true, title, message, severity, details })
  }

  const updateProgress = (step: string, progress: number, totalSteps: number, details: string[]) => {
    setSyncProgress(prev => ({
      ...prev,
      currentStep: step,
      progress,
      totalSteps,
      details
    }))
  }

  const closeProgress = () => {
    setSyncProgress(prev => ({ ...prev, isOpen: false }))
  }
  
  const handleSync = async (type: 'platforms' | 'platform-versions' | 'companies' | 'platform-families' | 'platform-types' | 'platform-logos' | 'age-rating-categories' | 'age-ratings' | 'alternative-names' | 'covers' | 'franchises' | 'game-engines' | 'game-types' | 'genres' | 'multiplayer-modes' | 'screenshots') => {
    const loadingKey = `sync-${type}`
    setLoadingStates(prev => ({ ...prev, [loadingKey]: true }))

    const typeLabel = type === 'platforms' ? 'Platforms' : 
                     type === 'platform-versions' ? 'Platform Versions' : 
                     type === 'companies' ? 'Companies' :
                     type === 'platform-families' ? 'Platform Families' :
                     type === 'platform-types' ? 'Platform Types' :
                     type === 'platform-logos' ? 'Platform Logos' :
                     type === 'age-rating-categories' ? 'Age Rating Categories' :
                     type === 'age-ratings' ? 'Age Ratings' :
                     type === 'alternative-names' ? 'Alternative Names' :
                     type === 'covers' ? 'Game Covers' :
                     type === 'franchises' ? 'Franchises' :
                     type === 'game-engines' ? 'Game Engines' :
                     type === 'game-types' ? 'Game Types' :
                     type === 'genres' ? 'Genres' :
                     type === 'multiplayer-modes' ? 'Multiplayer Modes' :
                     type === 'screenshots' ? 'Screenshots' : type    // Show progress dialog
    setSyncProgress({
      isOpen: true,
      type,
      title: `Syncing ${typeLabel}`,
      currentStep: 'Starting sync...',
      progress: 1,
      totalSteps: 3,
      details: ['� Connecting to server...']
    })

    try {
      updateProgress('Authenticating...', 2, 5, [
        '� Establishing connection to IGDB API...',
        '🔐 Authenticating with IGDB...'
      ])

      const response = await fetch(`/api/admin/sync/${type}`, {
        method: 'POST',
      })

      updateProgress('Processing data...', 3, 5, [
        '🔌 Establishing connection to IGDB API...',
        '🔐 Authenticating with IGDB...',
        '📊 Fetching and processing data from IGDB...'
      ])

      if (response.ok) {
        updateProgress('Saving to database...', 4, 5, [
          '🔌 Establishing connection to IGDB API...',
          '🔐 Authenticating with IGDB...',
          '📊 Fetching and processing data from IGDB...',
          '💾 Saving data to local database...'
        ])

        const result = await response.json()
        
        updateProgress('Complete!', 5, 5, [
          '🔌 Establishing connection to IGDB API...',
          '🔐 Authenticating with IGDB...',
          '📊 Fetching and processing data from IGDB...',
          '💾 Saving data to local database...',
          `✅ Sync completed! Processed ${result.totalSynced || result.count || 0} items`
        ])

        // Wait a moment to show completion, then close progress and show notification
        setTimeout(() => {
          closeProgress()
          
          // Create detailed success message
          const title = `✅ ${typeLabel} Sync Completed!`
          const summary = `Successfully processed ${result.totalSynced || result.count || 0} items`
          const details = [
            `📊 Total processed: ${result.totalSynced || result.count || 0}`,
            `✨ New items added: ${result.new || 0}`,
            `🔄 Existing items updated: ${result.updated || 0}`,
            result.message ? `📝 ${result.message}` : ''
          ].filter(Boolean).join('\n')
          
          showNotification(title, summary, 'success', details)
        }, 1500)
      } else {
        const error = await response.json()
        closeProgress()
        showNotification(
          `❌ ${typeLabel} Sync Failed`, 
          error.error || 'Unknown error occurred',
          'error'
        )
      }    } catch (error) {
      closeProgress()
      console.error(`${type} sync error:`, error)
      showNotification(
        `❌ ${typeLabel} Sync Failed`, 
        'Network error or server unavailable',
        'error',
        `Details: ${error}`
      )    } finally {
      // Always reset loading state, regardless of success or failure
      setLoadingStates(prev => ({ ...prev, [loadingKey]: false }))
    }
  }

  return (
    <>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Storage color="primary" />
          <Typography variant="h6">IGDB Data Synchronization</Typography>
        </Box>
        
        <Typography variant="body2" color="text.secondary" paragraph>
          Sync data from the Internet Game Database (IGDB) to your local database. 
          This allows for fast browsing without hitting external APIs repeatedly.
        </Typography>        <Stack spacing={2}>
          {/* Primary sync buttons */}
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Button
              variant="contained"
              startIcon={loadingStates['sync-platforms'] ? <CircularProgress size={20} /> : <Sync />}
              onClick={() => handleSync('platforms')}
              disabled={loadingStates['sync-platforms']}
              sx={{ minWidth: 200 }}
            >
              {loadingStates['sync-platforms'] ? 'Syncing Platforms...' : 'Sync All Platforms'}
            </Button>
            
            <Button
              variant="outlined"
              startIcon={loadingStates['sync-platform-versions'] ? <CircularProgress size={20} /> : <Download />}
              onClick={() => handleSync('platform-versions')}
              disabled={loadingStates['sync-platform-versions']}
              sx={{ minWidth: 200 }}
            >
              {loadingStates['sync-platform-versions'] ? 'Syncing Versions...' : 'Sync Platform Versions'}
            </Button>

            <Button
              variant="outlined"
              startIcon={loadingStates['sync-companies'] ? <CircularProgress size={20} /> : <Business />}
              onClick={() => handleSync('companies')}
              disabled={loadingStates['sync-companies']}
              sx={{ minWidth: 200 }}
            >
              {loadingStates['sync-companies'] ? 'Syncing Companies...' : 'Sync Companies'}
            </Button>
          </Stack>

          {/* Reference data sync buttons */}
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Button
              variant="outlined"
              color="secondary"
              startIcon={loadingStates['sync-platform-families'] ? <CircularProgress size={20} /> : <Category />}
              onClick={() => handleSync('platform-families')}
              disabled={loadingStates['sync-platform-families']}
              sx={{ minWidth: 200 }}
            >
              {loadingStates['sync-platform-families'] ? 'Syncing Families...' : 'Sync Platform Families'}
            </Button>            <Button
              variant="outlined"
              color="secondary"
              startIcon={loadingStates['sync-platform-types'] ? <CircularProgress size={20} /> : <DeviceHub />}
              onClick={() => handleSync('platform-types')}
              disabled={loadingStates['sync-platform-types']}
              sx={{ minWidth: 200 }}
            >
              {loadingStates['sync-platform-types'] ? 'Syncing Types...' : 'Sync Platform Types'}
            </Button>            <Button
              variant="outlined"
              color="secondary"
              startIcon={loadingStates['sync-platform-logos'] ? <CircularProgress size={20} /> : <Image />}
              onClick={() => handleSync('platform-logos')}
              disabled={loadingStates['sync-platform-logos']}
              sx={{ minWidth: 200 }}
            >
              {loadingStates['sync-platform-logos'] ? 'Syncing Logos...' : 'Sync Platform Logos'}            </Button>
          </Stack>

          {/* Game data sync buttons */}
          <Typography variant="subtitle2" sx={{ mt: 3, mb: 2, fontWeight: 'bold' }}>
            Game Data Synchronization
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Button
              variant="outlined"
              color="info"
              startIcon={loadingStates['sync-franchises'] ? <CircularProgress size={20} /> : <Business />}
              onClick={() => handleSync('franchises')}
              disabled={loadingStates['sync-franchises']}
              sx={{ minWidth: 200 }}
            >
              {loadingStates['sync-franchises'] ? 'Syncing...' : 'Sync Franchises'}
            </Button>

            <Button
              variant="outlined"
              color="info"
              startIcon={loadingStates['sync-genres'] ? <CircularProgress size={20} /> : <Category />}
              onClick={() => handleSync('genres')}
              disabled={loadingStates['sync-genres']}
              sx={{ minWidth: 200 }}
            >
              {loadingStates['sync-genres'] ? 'Syncing...' : 'Sync Genres'}
            </Button>

            <Button
              variant="outlined"
              color="info"
              startIcon={loadingStates['sync-game-engines'] ? <CircularProgress size={20} /> : <DeviceHub />}
              onClick={() => handleSync('game-engines')}
              disabled={loadingStates['sync-game-engines']}
              sx={{ minWidth: 200 }}
            >
              {loadingStates['sync-game-engines'] ? 'Syncing...' : 'Sync Game Engines'}
            </Button>

            <Button
              variant="outlined"
              color="info"
              startIcon={loadingStates['sync-game-types'] ? <CircularProgress size={20} /> : <Category />}
              onClick={() => handleSync('game-types')}
              disabled={loadingStates['sync-game-types']}
              sx={{ minWidth: 200 }}
            >
              {loadingStates['sync-game-types'] ? 'Syncing...' : 'Sync Game Types'}
            </Button>
          </Stack>

          {/* Game-specific data sync buttons */}
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
            Game-Specific Data (for games in your database)
          </Typography>
          <Stack direction="row" spacing={2} flexWrap="wrap">
            <Button
              variant="outlined"
              color="warning"
              startIcon={loadingStates['sync-covers'] ? <CircularProgress size={20} /> : <Image />}
              onClick={() => handleSync('covers')}
              disabled={loadingStates['sync-covers']}
              sx={{ minWidth: 200 }}
            >
              {loadingStates['sync-covers'] ? 'Syncing...' : 'Sync Game Covers'}
            </Button>

            <Button
              variant="outlined"
              color="warning"
              startIcon={loadingStates['sync-screenshots'] ? <CircularProgress size={20} /> : <Image />}
              onClick={() => handleSync('screenshots')}
              disabled={loadingStates['sync-screenshots']}
              sx={{ minWidth: 200 }}
            >
              {loadingStates['sync-screenshots'] ? 'Syncing...' : 'Sync Screenshots'}
            </Button>

            <Button
              variant="outlined"
              color="warning"
              startIcon={loadingStates['sync-alternative-names'] ? <CircularProgress size={20} /> : <Category />}
              onClick={() => handleSync('alternative-names')}
              disabled={loadingStates['sync-alternative-names']}
              sx={{ minWidth: 200 }}
            >
              {loadingStates['sync-alternative-names'] ? 'Syncing...' : 'Sync Alt Names'}
            </Button>

            <Button
              variant="outlined"
              color="warning"
              startIcon={loadingStates['sync-multiplayer-modes'] ? <CircularProgress size={20} /> : <DeviceHub />}
              onClick={() => handleSync('multiplayer-modes')}
              disabled={loadingStates['sync-multiplayer-modes']}
              sx={{ minWidth: 200 }}
            >
              {loadingStates['sync-multiplayer-modes'] ? 'Syncing...' : 'Sync Multiplayer'}
            </Button>

            <Button
              variant="outlined"
              color="warning"
              startIcon={loadingStates['sync-age-ratings'] ? <CircularProgress size={20} /> : <Category />}
              onClick={() => handleSync('age-ratings')}
              disabled={loadingStates['sync-age-ratings']}
              sx={{ minWidth: 200 }}
            >
              {loadingStates['sync-age-ratings'] ? 'Syncing...' : 'Sync Age Ratings'}
            </Button>

            <Button
              variant="outlined"
              color="warning"
              startIcon={loadingStates['sync-age-rating-categories'] ? <CircularProgress size={20} /> : <Category />}
              onClick={() => handleSync('age-rating-categories')}
              disabled={loadingStates['sync-age-rating-categories']}
              sx={{ minWidth: 200 }}
            >
              {loadingStates['sync-age-rating-categories'] ? 'Syncing...' : 'Sync Age Categories'}
            </Button>
          </Stack>
        </Stack>        <Divider sx={{ my: 2 }} />
        <Typography variant="caption" color="text.secondary">
          💡 Tip: Sync in order: Platform data → Games → Game-specific data (covers, screenshots, etc.) for optimal results. 
          Game-specific data only syncs for games you already have in your database.
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
            {notification.severity === 'success' ? '✅' : '❌'}
            Sync Details
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
        </DialogContent>        <DialogActions>
          <Button onClick={() => setShowDetailsDialog(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Progress Dialog */}
      <Dialog 
        open={syncProgress.isOpen} 
        onClose={() => {}} // Prevent closing during sync
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown
      >        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CircularProgress size={20} />
            {syncProgress.title}
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Typography variant="body1" gutterBottom>
              {syncProgress.currentStep}
            </Typography>
            
            {/* Progress bar */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box sx={{ width: '100%' }}>
                <Box sx={{ 
                  width: '100%', 
                  height: 8, 
                  backgroundColor: 'grey.300', 
                  borderRadius: 1,
                  overflow: 'hidden'
                }}>
                  <Box
                    sx={{
                      width: `${(syncProgress.progress / syncProgress.totalSteps) * 100}%`,
                      height: '100%',
                      backgroundColor: 'primary.main',
                      transition: 'width 0.3s ease'
                    }}
                  />
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {syncProgress.progress}/{syncProgress.totalSteps}
              </Typography>
            </Box>

            {/* Step details */}
            <Box sx={{ 
              backgroundColor: 'background.paper', 
              p: 2, 
              borderRadius: 1, 
              border: 1, 
              borderColor: 'divider',
              maxHeight: 200,
              overflow: 'auto'
            }}>
              {syncProgress.details.map((detail, index) => (
                <Typography 
                  key={index} 
                  variant="body2" 
                  sx={{ 
                    mb: 0.5,
                    color: index < syncProgress.progress ? 'success.main' : 'text.secondary',
                    fontFamily: 'monospace'
                  }}
                >
                  {detail}
                </Typography>
              ))}
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  )
}
