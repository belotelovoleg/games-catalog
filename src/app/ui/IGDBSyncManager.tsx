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

export default function IGDBSyncManager() {
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
  
  const handleSync = async (type: 'platforms' | 'platform-versions' | 'companies' | 'platform-families' | 'platform-types' | 'platform-logos') => {
    const loadingKey = `sync-${type}`
    setLoadingStates(prev => ({ ...prev, [loadingKey]: true }))

    try {
      const response = await fetch(`/api/admin/sync/${type}`, {
        method: 'POST',
      })

      if (response.ok) {
        const result = await response.json()
        const typeLabel = type === 'platforms' ? 'Platforms' : 
                         type === 'platform-versions' ? 'Platform Versions' : 
                         type === 'companies' ? 'Companies' :
                         type === 'platform-families' ? 'Platform Families' :
                         type === 'platform-types' ? 'Platform Types' :
                         type === 'platform-logos' ? 'Platform Logos' : type
        
        // Create detailed success message
        const title = `✅ ${typeLabel} Sync Completed!`
        const summary = `Successfully processed ${result.totalSynced || result.count || 0} items`
        const details = [
          `📊 Total processed: ${result.totalSynced || result.count || 0}`,
          `✨ New items added: ${result.new || 0}`,
          `🔄 Existing items updated: ${result.updated || 0}`,
          result.message ? `📝 ${result.message}` : ''
        ].filter(Boolean).join('\n')
        
        showNotification(title, summary, 'success', details)      } else {
        const error = await response.json()
        const typeLabel = type === 'platforms' ? 'Platforms' : 
                         type === 'platform-versions' ? 'Platform Versions' : 
                         type === 'companies' ? 'Companies' :
                         type === 'platform-families' ? 'Platform Families' :
                         type === 'platform-types' ? 'Platform Types' :
                         type === 'platform-logos' ? 'Platform Logos' : type
        showNotification(
          `❌ ${typeLabel} Sync Failed`, 
          error.error || 'Unknown error occurred',
          'error'
        )
      }    } catch (error) {
      const typeLabel = type === 'platforms' ? 'Platforms' : 
                       type === 'platform-versions' ? 'Platform Versions' : 
                       type === 'companies' ? 'Companies' :
                       type === 'platform-families' ? 'Platform Families' :
                       type === 'platform-types' ? 'Platform Types' :
                       type === 'platform-logos' ? 'Platform Logos' : type
      console.error(`${type} sync error:`, error)
      showNotification(
        `❌ ${typeLabel} Sync Failed`, 
        'Network error or server unavailable',
        'error',
        `Details: ${error}`
      )
    } finally {
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
              {loadingStates['sync-platform-logos'] ? 'Syncing Logos...' : 'Sync Platform Logos'}
            </Button>
          </Stack>
        </Stack>        <Divider sx={{ my: 2 }} />
          <Typography variant="caption" color="text.secondary">
          💡 Tip: Sync reference data (families, types & images) first, then main data (platforms → versions → companies) for optimal results.
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
