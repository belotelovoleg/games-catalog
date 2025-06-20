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
  LinearProgress
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
}

export default function IGDBSyncManager() {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [notification, setNotification] = useState<SyncStats & { open: boolean }>({
    open: false,
    title: '',
    message: '',
    severity: 'success'
  })
    
  const showNotification = (title: string, message: string, severity: 'success' | 'error') => {
    setNotification({ open: true, title, message, severity })
  }
  const handleSync = async (type: 'platforms' | 'platform-versions' | 'companies' | 'platform-families' | 'platform-types' | 'platform-logos' | 'age-rating-categories' | 'age-ratings' | 'alternative-names' | 'covers' | 'franchises' | 'game-engines' | 'game-types' | 'genres' | 'multiplayer-modes' | 'screenshots') => {
    const loadingKey = `sync-${type}`
    console.log(`Starting sync for ${type}`)
    setLoadingStates(prev => ({ ...prev, [loadingKey]: true }))
    setIsLoading(true)
    console.log('isLoading set to true')

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
                     type === 'screenshots' ? 'Screenshots' : type

    try {
      const response = await fetch(`/api/admin/sync/${type}`, {
        method: 'POST',
      })

      if (response.ok) {
        const result = await response.json()
        
        // Create success message
        const title = `✅ ${typeLabel} Sync Completed!`
        const message = `Successfully processed ${result.totalSynced || result.count || 0} items (${result.new || 0} new, ${result.updated || 0} updated)`
        
        showNotification(title, message, 'success')      } else {
        const error = await response.json()
        showNotification(
          `❌ ${typeLabel} Sync Failed`, 
          error.error || 'Unknown error occurred',
          'error'
        )
      }
    } catch (error) {
      console.error(`${type} sync error:`, error)
      showNotification(
        `❌ ${typeLabel} Sync Failed`, 
        'Network error or server unavailable',
        'error'
      )    } finally {
      // Always reset loading state, regardless of success or failure
      console.log(`Sync ${type} finished, resetting loading states`)
      setLoadingStates(prev => ({ ...prev, [loadingKey]: false }))
      setIsLoading(false)
      console.log('isLoading set to false')
    }
  }
  return (
    <>
      <Paper sx={{ p: 3, mb: 3 }}>
        {/* Progress Bar - shows when any sync is running */}
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
          Sync data from the Internet Game Database (IGDB) to your local database. 
          This allows for fast browsing without hitting external APIs repeatedly.
        </Typography>

        <Stack spacing={2}>
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
            </Button>

            <Button
              variant="outlined"
              color="secondary"
              startIcon={loadingStates['sync-platform-types'] ? <CircularProgress size={20} /> : <DeviceHub />}
              onClick={() => handleSync('platform-types')}
              disabled={loadingStates['sync-platform-types']}
              sx={{ minWidth: 200 }}
            >
              {loadingStates['sync-platform-types'] ? 'Syncing Types...' : 'Sync Platform Types'}
            </Button>

            <Button
              variant="outlined"
              color="secondary"
              startIcon={loadingStates['sync-platform-logos'] ? <CircularProgress size={20} /> : <Image />}
              onClick={() => handleSync('platform-logos')}
              disabled={loadingStates['sync-platform-logos']}
              sx={{ minWidth: 200 }}
            >
              {loadingStates['sync-platform-logos'] ? 'Syncing Logos...' : 'Sync Platform Logos'}
            </Button>
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
              {loadingStates['sync-alternative-names'] ? 'Syncing...' : 'Sync Alternative Names'}
            </Button>

            <Button
              variant="outlined"
              color="warning"
              startIcon={loadingStates['sync-multiplayer-modes'] ? <CircularProgress size={20} /> : <DeviceHub />}
              onClick={() => handleSync('multiplayer-modes')}
              disabled={loadingStates['sync-multiplayer-modes']}
              sx={{ minWidth: 200 }}
            >
              {loadingStates['sync-multiplayer-modes'] ? 'Syncing...' : 'Sync Multiplayer Modes'}
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
              {loadingStates['sync-age-rating-categories'] ? 'Syncing...' : 'Sync Age Rating Categories'}
            </Button>
          </Stack>

          <Divider sx={{ my: 2 }} />
          
          <Typography variant="body2" color="text.secondary">
            💡 <strong>Tip:</strong> Start with "Sync All Platforms" and "Sync Companies" first. 
            Then sync games for specific platforms, followed by game-specific data like covers and screenshots.
          </Typography>
        </Stack>
      </Paper>      {/* Notification Snackbar */}
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
