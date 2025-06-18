"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    Container,
    Typography,
    Box,
    Paper,
    Button,
    CircularProgress,
    Snackbar,
    Alert
} from '@mui/material'
import { 
    Add, 
    Dashboard,
    ArrowBack
} from '@mui/icons-material'
import Cookies from 'js-cookie'
import { jwtDecode } from 'jwt-decode'

// Components
import PlatformsTable from './PlatformsTable'
import AddPlatformDialog from './AddPlatformDialog'
import PlatformVersionsDialog from './PlatformVersionsDialog'
import PlatformDetailsDialog from './PlatformDetailsDialog'

// Types and hooks
import { DecodedToken } from './types'
import { usePlatformManagement } from './usePlatformManagement'

export default function PlatformManagementPage() {
    const [user, setUser] = useState<DecodedToken | null>(null)
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [showAddDialog, setShowAddDialog] = useState(false)
    const [showVersionsDialog, setShowVersionsDialog] = useState(false)
    const [showDetailsDialog, setShowDetailsDialog] = useState(false)
    const router = useRouter()    // Use our custom hook for platform management
    const {
        platforms,
        platformVersions,
        selectedPlatform,
        selectedVersion,
        platformImage,
        loading: platformsLoading,
        notification,
        fetchPlatforms,
        selectPlatform,
        selectVersion,
        clearSelection,
        addSelectedPlatform,
        hideNotification
    } = usePlatformManagement()

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
            fetchPlatforms()
        } catch (error) {
            console.error('Token validation error:', error)
            router.push('/login')
        } finally {
            setLoading(false)
        }
    }, [router, fetchPlatforms])

    const handleAddPlatform = () => {
        setShowAddDialog(true)
    }

    const handlePlatformSelectFromDialog = async (platform: any) => {
        const result = await selectPlatform(platform)
        setShowAddDialog(false)
        
        if (result.hasVersions) {
            setShowVersionsDialog(true)
        } else {
            setShowDetailsDialog(true)
        }
    }

    const handlePlatformSelect = async (platform: any) => {
        const result = await selectPlatform(platform)
        
        if (result.hasVersions) {
            setShowVersionsDialog(true)
        } else {
            setShowDetailsDialog(true)
        }
    }

    const handleVersionSelect = async (version: any) => {
        await selectVersion(version)
        setShowVersionsDialog(false)
        setShowDetailsDialog(true)
    }

    const handleAddSelectedPlatform = () => {
        addSelectedPlatform()
        setShowDetailsDialog(false)
    }

    const handleCloseDetails = () => {
        setShowDetailsDialog(false)
        clearSelection()
    }

    const handleCloseVersions = () => {
        setShowVersionsDialog(false)
        clearSelection()
    }

    const handleCloseAdd = () => {
        setShowAddDialog(false)
    }

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
                <CircularProgress />
            </Box>
        )
    }

    if (!user) {
        return <CircularProgress />
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Dashboard color="primary" />
                    <Typography variant="h4">Platform Management</Typography>
                </Box>
                <Button 
                    variant="outlined" 
                    startIcon={<ArrowBack />}
                    onClick={() => router.push('/admin')}
                >
                    Back to Admin
                </Button>
            </Box>

            <Paper sx={{ p: 3, mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h6">Available Platforms</Typography>
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={handleAddPlatform}
                    >
                        Add Platform
                    </Button>
                </Box>

                <Typography variant="body2" color="text.secondary" paragraph>
                    Manage platforms that users can select for their collections. Data is sourced from your local IGDB cache.
                </Typography>                <PlatformsTable
                    platforms={platforms}
                    searchTerm={searchTerm}
                    onSearchChange={setSearchTerm}
                    onPlatformSelect={handlePlatformSelect}
                    loading={platformsLoading}
                />
            </Paper>

            {/* Add Platform Dialog */}
            <AddPlatformDialog
                open={showAddDialog}
                platforms={platforms}
                onClose={handleCloseAdd}
                onPlatformSelect={handlePlatformSelectFromDialog}
            />

            {/* Platform Versions Dialog */}
            <PlatformVersionsDialog
                open={showVersionsDialog}
                platform={selectedPlatform}
                versions={platformVersions}
                onClose={handleCloseVersions}
                onVersionSelect={handleVersionSelect}
            />            {/* Platform Details Dialog */}
            <PlatformDetailsDialog
                open={showDetailsDialog}
                platform={selectedPlatform}
                version={selectedVersion}
                platformImage={platformImage}
                onClose={handleCloseDetails}
                onAddPlatform={handleAddSelectedPlatform}
            />

            {/* Notification Snackbar */}
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
