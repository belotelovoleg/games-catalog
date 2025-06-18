"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    Container,
    Typography,
    Box,
    Paper,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Chip,
    CircularProgress,
    Snackbar,
    Alert,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField
} from '@mui/material'
import { 
    Add, 
    Edit,
    Delete,
    ArrowBack
} from '@mui/icons-material'
import Cookies from 'js-cookie'
import { jwtDecode } from 'jwt-decode'

interface Platform {
    id: number
    name: string
    igdbPlatformId: number
    igdbPlatformVersionId?: number
    abbreviation?: string
    alternative_name?: string
    generation?: number
    companies?: string
    versionName?: string
    platform_family?: number
    platform_type?: number
    createdAt: string
    updatedAt: string
}

interface DecodedToken {
    id: number
    email: string
    isAdmin: boolean
}

interface Notification {
    open: boolean
    message: string
    severity: 'success' | 'error' | 'info' | 'warning'
}

export default function PlatformListPage() {
    const [user, setUser] = useState<DecodedToken | null>(null)
    const [platforms, setPlatforms] = useState<Platform[]>([])
    const [loading, setLoading] = useState(true)
    const [notification, setNotification] = useState<Notification>({
        open: false,
        message: '',
        severity: 'info'
    })
    const [editDialog, setEditDialog] = useState<{
        open: boolean
        platform: Platform | null
        name: string
    }>({
        open: false,
        platform: null,
        name: ''
    })
    const [deleteDialog, setDeleteDialog] = useState<{
        open: boolean
        platform: Platform | null
    }>({
        open: false,
        platform: null
    })
    const router = useRouter()

    // Check authentication
    useEffect(() => {
        const token = Cookies.get('token')
        if (!token) {
            router.push('/login')
            return
        }

        try {
            const decoded = jwtDecode<DecodedToken>(token)
            if (!decoded.isAdmin) {
                router.push('/')
                return
            }
            setUser(decoded)
        } catch (error) {
            console.error('Invalid token:', error)
            router.push('/login')
        }
    }, [router])

    // Fetch platforms
    const fetchPlatforms = async () => {
        try {
            const response = await fetch('/api/admin/platforms', {
                credentials: 'include'
            })
            if (response.ok) {
                const data = await response.json()
                setPlatforms(data)
            } else {
                showNotification('Failed to fetch platforms', 'error')
            }
        } catch (error) {
            console.error('Error fetching platforms:', error)
            showNotification('Error fetching platforms', 'error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (user) {
            fetchPlatforms()
        }
    }, [user])

    const showNotification = (message: string, severity: Notification['severity']) => {
        setNotification({ open: true, message, severity })
    }

    const hideNotification = () => {
        setNotification(prev => ({ ...prev, open: false }))
    }

    const handleEdit = (platform: Platform) => {
        setEditDialog({
            open: true,
            platform,
            name: platform.name
        })
    }

    const handleEditSave = async () => {
        if (!editDialog.platform) return

        try {
            const response = await fetch(`/api/admin/platforms/${editDialog.platform.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    name: editDialog.name
                })
            })

            if (response.ok) {
                showNotification('Platform updated successfully', 'success')
                await fetchPlatforms()
                setEditDialog({ open: false, platform: null, name: '' })
            } else {
                const result = await response.json()
                showNotification(`Failed to update platform: ${result.error}`, 'error')
            }
        } catch (error) {
            console.error('Error updating platform:', error)
            showNotification('Error updating platform', 'error')
        }
    }

    const handleDelete = (platform: Platform) => {
        setDeleteDialog({
            open: true,
            platform
        })
    }

    const handleDeleteConfirm = async () => {
        if (!deleteDialog.platform) return

        try {
            const response = await fetch(`/api/admin/platforms/${deleteDialog.platform.id}`, {
                method: 'DELETE',
                credentials: 'include'
            })

            if (response.ok) {
                showNotification('Platform deleted successfully', 'success')
                await fetchPlatforms()
                setDeleteDialog({ open: false, platform: null })
            } else {
                const result = await response.json()
                showNotification(`Failed to delete platform: ${result.error}`, 'error')
            }
        } catch (error) {
            console.error('Error deleting platform:', error)
            showNotification('Error deleting platform', 'error')
        }
    }

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ py: 4 }}>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                    <CircularProgress />
                </Box>
            </Container>
        )
    }

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box display="flex" alignItems="center" gap={2}>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBack />}
                        onClick={() => router.push('/admin')}
                    >
                        Back to Admin
                    </Button>
                    <Typography variant="h4" component="h1">
                        Platform Management
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    startIcon={<Add />}
                    onClick={() => router.push('/admin/platforms/add')}
                >
                    Add Platform
                </Button>
            </Box>

            {/* Platforms Table */}
            <Paper sx={{ mb: 3 }}>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell>Version</TableCell>
                                <TableCell>Abbreviation</TableCell>
                                <TableCell>Generation</TableCell>
                                <TableCell>Family</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Created</TableCell>
                                <TableCell align="right">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {platforms.map((platform) => (
                                <TableRow key={platform.id}>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight="medium">
                                            {platform.name}
                                        </Typography>
                                        {platform.alternative_name && (
                                            <Typography variant="caption" color="text.secondary">
                                                {platform.alternative_name}
                                            </Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {platform.versionName && (
                                            <Chip
                                                label={platform.versionName}
                                                size="small"
                                                color="primary"
                                                variant="outlined"
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {platform.abbreviation && (
                                            <Chip
                                                label={platform.abbreviation}
                                                size="small"
                                                variant="outlined"
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {platform.generation && (
                                            <Chip
                                                label={`Gen ${platform.generation}`}
                                                size="small"
                                                color="secondary"
                                                variant="outlined"
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {platform.platform_family && (
                                            <Chip
                                                label={`Family ${platform.platform_family}`}
                                                size="small"
                                                color="info"
                                                variant="outlined"
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {platform.platform_type && (
                                            <Chip
                                                label={`Type ${platform.platform_type}`}
                                                size="small"
                                                color="warning"
                                                variant="outlined"
                                            />
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="caption">
                                            {new Date(platform.createdAt).toLocaleDateString()}
                                        </Typography>
                                    </TableCell>
                                    <TableCell align="right">
                                        <IconButton
                                            size="small"
                                            onClick={() => handleEdit(platform)}
                                            color="primary"
                                        >
                                            <Edit />
                                        </IconButton>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleDelete(platform)}
                                            color="error"
                                        >
                                            <Delete />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {platforms.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} align="center">
                                        <Typography variant="body2" color="text.secondary" py={4}>
                                            No platforms found. Click "Add Platform" to get started.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>

            {/* Edit Dialog */}
            <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, platform: null, name: '' })}>
                <DialogTitle>Edit Platform</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Platform Name"
                        fullWidth
                        variant="outlined"
                        value={editDialog.name}
                        onChange={(e) => setEditDialog(prev => ({ ...prev, name: e.target.value }))}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialog({ open: false, platform: null, name: '' })}>
                        Cancel
                    </Button>
                    <Button onClick={handleEditSave} variant="contained">
                        Save
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, platform: null })}>
                <DialogTitle>Delete Platform</DialogTitle>
                <DialogContent>
                    <Typography>
                        Are you sure you want to delete "{deleteDialog.platform?.name}"? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteDialog({ open: false, platform: null })}>
                        Cancel
                    </Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained">
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Notification */}
            <Snackbar
                open={notification.open}
                autoHideDuration={6000}
                onClose={hideNotification}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert 
                    onClose={hideNotification} 
                    severity={notification.severity}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </Container>
    )
}
