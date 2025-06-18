"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    Container,
    Typography,
    Box,
    Paper,
    Alert,
    CircularProgress,
    Button
} from '@mui/material'
import { Computer, ArrowBack } from '@mui/icons-material'
import Cookies from 'js-cookie'
import { jwtDecode } from 'jwt-decode'

interface DecodedToken {
    id: number
    email: string
    isAdmin: boolean
}

export default function ConsolesPage() {
    const [user, setUser] = useState<DecodedToken | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()

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
            console.error('Token validation error:', error)
            router.push('/login')
        } finally {
            setLoading(false)
        }
    }, [router])

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
                    <Computer color="primary" />
                    <Typography variant="h4">Console Management</Typography>
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
                <Alert severity="info" sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                        🚧 Console Management - Coming Soon!
                    </Typography>
                    <Typography variant="body2">
                        This section will allow you to manage gaming consoles and their specifications. 
                        Features will include:
                    </Typography>
                </Alert>

                <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Planned Features:
                    </Typography>
                    <Box component="ul" sx={{ pl: 2 }}>
                        <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                            📱 Add/Edit gaming consoles and handhelds
                        </Typography>
                        <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                            🎮 Manage console specifications (CPU, GPU, RAM, storage)
                        </Typography>
                        <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                            🎯 Link consoles to IGDB platform data
                        </Typography>
                        <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                            📊 Console generation management
                        </Typography>
                        <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                            🖼️ Console images and logos
                        </Typography>
                        <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                            📅 Release dates and regional availability
                        </Typography>
                    </Box>
                </Box>

                <Box sx={{ mt: 4, p: 2, backgroundColor: 'background.default', borderRadius: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                        💡 <strong>Current Status:</strong> You can use the Platform Browser to view and manage 
                        IGDB platform data. Console-specific management features will be added in future updates.
                    </Typography>
                    
                    <Box sx={{ mt: 2 }}>
                        <Button 
                            variant="contained" 
                            onClick={() => router.push('/admin/platform-browser')}
                            sx={{ mr: 2 }}
                        >
                            Browse Platforms
                        </Button>
                        <Button 
                            variant="outlined" 
                            onClick={() => router.push('/admin/igdb-sync')}
                        >
                            Sync IGDB Data
                        </Button>
                    </Box>
                </Box>
            </Paper>
        </Container>
    )
}
