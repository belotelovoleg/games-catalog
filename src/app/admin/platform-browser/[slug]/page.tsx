"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
    Container,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Box,
    Alert,
    CircularProgress,
    Button,
    Chip,
    Card,
    CardContent,
    Stack,
    Divider
} from '@mui/material'
import Cookies from 'js-cookie'
import { jwtDecode } from 'jwt-decode'

interface DecodedToken {
    id: number
    email: string
    isAdmin: boolean
}

interface PlatformVersion {
    id: number
    name: string
    slug: string
    summary?: string
    platform_logo?: number
    cpu?: string
    memory?: string
    media?: string
    connectivity?: string
    graphics?: string
    resolutions?: string
    sound?: string
    storage?: string
    companies?: number[]
    platform_version_release_dates?: number[]
    url: string
}

export default function PlatformVersionsPage() {
    const [user, setUser] = useState<DecodedToken | null>(null)
    const [platformVersions, setPlatformVersions] = useState<PlatformVersion[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [platformName, setPlatformName] = useState('')
    const router = useRouter()
    const params = useParams()
    const platformSlug = params.slug as string

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
            Cookies.remove('token')
            router.push('/login')
        }
    }, [router])

    useEffect(() => {
        if (user && platformSlug) {
            fetchPlatformVersions()
        }
    }, [user, platformSlug])

    const fetchPlatformVersions = async () => {
        setLoading(true)
        setError('')
        try {
            const response = await fetch(`/api/admin/platform-versions?platform=${platformSlug}`)
            const data = await response.json()

            if (response.ok && Array.isArray(data)) {
                setPlatformVersions(data)
                // Set platform name from the first version's URL
                if (data.length > 0) {
                    const name = platformSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                    setPlatformName(name)
                }
            } else {
                console.error('Invalid platform versions data:', data)
                setError(data.error || 'Failed to fetch platform versions')
                setPlatformVersions([])
            }
        } catch (err) {
            console.error('Fetch platform versions error:', err)
            setError('Failed to fetch platform versions')
            setPlatformVersions([])
        } finally {
            setLoading(false)
        }
    }

    const handleAddPlatformVersion = async (version: PlatformVersion) => {
        try {
            const token = Cookies.get('token')
            const response = await fetch('/api/admin/platforms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Cookie': `token=${token}`
                },
                body: JSON.stringify({
                    name: version.name,
                    description: version.summary,
                    igdbId: version.id,
                    // Technical specifications
                    cpu: version.cpu,
                    memory: version.memory,
                    media: version.media,
                    connectivity: version.connectivity,
                    graphics: version.graphics,
                    resolutions: version.resolutions,
                    sound: version.sound,
                    storage: version.storage
                })
            })

            if (response.ok) {
                alert(`${version.name} added successfully!`)
            } else {
                const data = await response.json()
                setError(data.error || 'Failed to add platform version')
            }        } catch (err) {
            setError('Failed to add platform version')
        }
    }

    if (!user) {
        return <CircularProgress />
    }

    return (
        <Container maxWidth="xl" sx={{ mt: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">{platformName} Versions</Typography>
                <Button variant="outlined" onClick={() => router.push('/admin/platform-browser')}>
                    Back to Platform Browser
                        </Button>
                    </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        Platform Versions ({platformVersions.length} found)
                    </Typography>                    <Stack spacing={3}>
                        {platformVersions.map((version) => (
                            <Card key={version.id} sx={{ display: 'flex', flexDirection: 'column' }}>
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Typography variant="h6" gutterBottom>
                                        {version.name}
                                    </Typography>
                                    
                                    {version.summary && (
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                            {version.summary.length > 200 
                                                ? `${version.summary.substring(0, 200)}...` 
                                                : version.summary}
                                        </Typography>
                                    )}

                                    <Divider sx={{ my: 2 }} />

                                    {/* Technical Specifications */}
                                    <Box sx={{ mb: 2 }}>
                                        {version.cpu && (
                                            <Chip label={`CPU: ${version.cpu}`} size="small" sx={{ m: 0.5 }} />
                                        )}
                                        {version.memory && (
                                            <Chip label={`Memory: ${version.memory}`} size="small" sx={{ m: 0.5 }} />
                                        )}
                                        {version.media && (
                                            <Chip label={`Media: ${version.media}`} size="small" sx={{ m: 0.5 }} />
                                        )}
                                        {version.storage && (
                                            <Chip label={`Storage: ${version.storage}`} size="small" sx={{ m: 0.5 }} />
                                        )}
                                    </Box>

                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography variant="caption" color="text.secondary">
                                            IGDB ID: {version.id}
                                        </Typography>
                                        
                                        <Button
                                            variant="contained"
                                            onClick={() => handleAddPlatformVersion(version)}
                                        >
                                            Add to Database
                                        </Button>
                                    </Box>
                                </CardContent>
                            </Card>
                        ))}
                    </Stack>

                    {platformVersions.length === 0 && !loading && (
                        <Box sx={{ textAlign: 'center', mt: 4 }}>
                            <Typography variant="h6" color="text.secondary">
                                No platform versions found for {platformName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                This platform might not have specific versions in IGDB.
                            </Typography>                        </Box>
                    )}
                </>
            )}
        </Container>
    )
}
