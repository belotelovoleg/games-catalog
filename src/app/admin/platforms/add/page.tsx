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
    ArrowBack
} from '@mui/icons-material'
import Cookies from 'js-cookie'
import { jwtDecode } from 'jwt-decode'

// Components
import PlatformsTable from '../PlatformsTable'
import PlatformVersionsDialog from '../PlatformVersionsDialog'
import PlatformDetailsDialog from '../PlatformDetailsDialog'

// Types and hooks
import { DecodedToken } from '../types'
import { usePlatformManagement } from '../usePlatformManagement'

export default function AddPlatformPage() {    const [user, setUser] = useState<DecodedToken | null>(null)
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [showVersionsDialog, setShowVersionsDialog] = useState(false)
    const [showDetailsDialog, setShowDetailsDialog] = useState(false)
    const router = useRouter()    // Use our custom hook for platform management
    const {
        platforms,
        platformVersions,
        selectedPlatform,
        selectedVersion,
        loading: platformsLoading,
        notification,
        fetchPlatforms,
        selectPlatform,
        selectVersion,
        clearSelection,
        addSelectedPlatform,
        hideNotification
    } = usePlatformManagement()

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

    // Fetch platforms when user is authenticated
    useEffect(() => {
        if (user) {
            fetchPlatforms()
            setLoading(false)
        }
    }, [user, fetchPlatforms])    // Handle platform selection from table
    const handlePlatformSelectFromTable = async (platform: any) => {
        const result = await selectPlatform(platform)
        if (result?.hasVersions) {
            setShowVersionsDialog(true)
        } else {
            setShowDetailsDialog(true)
        }
    }

    // Handle version selection
    const handleVersionSelect = async (version: any) => {
        await selectVersion(version)
        setShowVersionsDialog(false)
        setShowDetailsDialog(true)
    }

    // Handle adding selected platform
    const handleAddSelectedPlatform = async () => {
        await addSelectedPlatform()
        setShowDetailsDialog(false)
    }    // Dialog close handlers
    const handleCloseVersions = () => {
        setShowVersionsDialog(false)
        clearSelection()
    }

    const handleCloseDetails = () => {
        setShowDetailsDialog(false)
        clearSelection()
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
        <Container maxWidth="lg" sx={{ py: 4 }}>            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Box display="flex" alignItems="center" gap={2}>
                    <Button
                        variant="outlined"
                        startIcon={<ArrowBack />}
                        onClick={() => router.push('/admin/platforms')}
                    >
                        Back to Platform List
                    </Button>
                    <Typography variant="h4" component="h1">
                        Add Platform
                    </Typography>
                </Box>
            </Box>

            {/* Instruction */}
            <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.default' }}>
                <Typography variant="body1" color="text.secondary">
                    Browse and select platforms from the IGDB database to add to your collection. 
                    Click on any platform below to view details and add it to your platform list.
                </Typography>
            </Paper>

            {/* IGDB Platforms Table */}
            <Paper sx={{ mb: 3 }}>
                {!platformsLoading ? (
                    <PlatformsTable
                        platforms={platforms}
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        onPlatformSelect={handlePlatformSelectFromTable}
                    />
                ) : (
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                        <CircularProgress />
                    </Box>
                )}
            </Paper>            {/* Platform Versions Dialog */}
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
