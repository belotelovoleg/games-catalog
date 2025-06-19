'use client'

import { useState } from 'react'
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
  Stack
} from '@mui/material'
import { Close as CloseIcon } from '@mui/icons-material'

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
  }
}

interface GameDetailDialogProps {
  open: boolean
  onClose: () => void
  game: GameWithIgdbDetails | null
  onGameUpdated: () => void
}

export default function GameDetailDialog({ 
  open, 
  onClose, 
  game,
  onGameUpdated
}: GameDetailDialogProps) {
  const [editing, setEditing] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [editedRating, setEditedRating] = useState<number | null>(null)
  const [editedStatus, setEditedStatus] = useState<'OWNED' | 'WISHLISTED'>('OWNED')
  const [editedCondition, setEditedCondition] = useState('')
  const [editedNotes, setEditedNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  if (!game) return null

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      PaperProps={{
        sx: { minHeight: '400px' }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">
            {editing ? editedName : game.name}
          </Typography>
          <Button onClick={onClose}>
            <CloseIcon />
          </Button>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Stack spacing={3}>
          {/* User Game Information */}
          <Box>
            <Typography variant="h6" gutterBottom>
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
              </Stack>
            ) : (
              <Box>
                <Typography variant="body1" gutterBottom>
                  <strong>Status:</strong> 
                  <Chip 
                    label={game.status} 
                    color={game.status === 'OWNED' ? 'success' : 'warning'} 
                    size="small" 
                    sx={{ ml: 1 }}
                  />
                </Typography>
                
                {game.status === 'OWNED' && (
                  <Typography variant="body1" gutterBottom>
                    <strong>Condition:</strong> {formatCondition(game.condition)}
                  </Typography>
                )}
                
                <Typography variant="body1" gutterBottom>
                  <strong>Your Rating:</strong> {game.rating ? `${Math.round(game.rating)}/100` : 'Not rated'}
                </Typography>
                
                {game.notes && (
                  <Typography variant="body1" gutterBottom>
                    <strong>Notes:</strong> {game.notes}
                  </Typography>
                )}
                
                <Typography variant="body2" color="text.secondary">
                  Added: {new Date(game.createdAt).toLocaleDateString()}
                </Typography>
              </Box>
            )}
          </Box>

          {/* IGDB Information */}
          {game.igdbDetails && (
            <>
              <Divider />
              <Box>
                <Typography variant="h6" gutterBottom>
                  Game Information (IGDB)
                </Typography>
                
                {game.igdbDetails.rating && (
                  <Typography variant="body1" gutterBottom>
                    <strong>IGDB Rating:</strong> {Math.round(game.igdbDetails.rating)}/100
                  </Typography>
                )}
                
                {game.igdbDetails.storyline && (
                  <Typography variant="body1" gutterBottom>
                    <strong>Description:</strong> {game.igdbDetails.storyline}
                  </Typography>
                )}

                {game.igdbDetails.genres && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" gutterBottom>
                      <strong>Genres:</strong>
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {parseJsonField(game.igdbDetails.genres).map((genre, index) => (
                        <Chip key={index} label={genre} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Box>
                )}

                {game.igdbDetails.alternative_names && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" gutterBottom>
                      <strong>Alternative Names:</strong>
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {parseJsonField(game.igdbDetails.alternative_names).map((name, index) => (
                        <Chip key={index} label={name} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Box>
                )}

                {game.igdbDetails.involved_companies && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" gutterBottom>
                      <strong>Companies:</strong>
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {parseJsonField(game.igdbDetails.involved_companies).map((company, index) => (
                        <Chip key={index} label={company} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Box>
                )}

                {game.igdbDetails.multiplayer_modes && (
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="body2" gutterBottom>
                      <strong>Multiplayer:</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Multiplayer modes available
                    </Typography>
                  </Box>
                )}
              </Box>
            </>
          )}

          {!game.igdbGameId && (
            <Alert severity="info">
              This is a custom game not from IGDB. Only your personal information is available.
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions>
        {editing ? (
          <>
            <Button onClick={handleCancel} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSave} variant="contained" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </>
        ) : (
          <>
            <Button onClick={onClose}>
              Close
            </Button>
            <Button onClick={handleEdit} variant="contained">
              Edit
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  )
}
