"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
    Container,
    Typography,
    TextField,
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
    InputAdornment
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import Cookies from 'js-cookie'
import { jwtDecode } from 'jwt-decode'

interface DecodedToken {
    id: number
    email: string
    isAdmin: boolean
}

interface Platform {
    id: number
    name: string
    slug: string
    summary?: string
    platform_logo?: number
    category: number
}

export default function PlatformBrowserPage() {
    const [user, setUser] = useState<DecodedToken | null>(null)
    const [platforms, setPlatforms] = useState<Platform[]>([])
    const [filteredPlatforms, setFilteredPlatforms] = useState<Platform[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [searchTerm, setSearchTerm] = useState('')
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
            console.error('Invalid token:', error)
            Cookies.remove('token')
            router.push('/login')
        }
    }, [router])

    useEffect(() => {
        if (user) {
            fetchAllPlatforms()
        }
    }, [user])

    useEffect(() => {
        // Filter platforms based on search term
        if (searchTerm.trim() === '') {
            setFilteredPlatforms(platforms)
        } else {
            const filtered = platforms.filter(platform =>
                platform.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
            setFilteredPlatforms(filtered)
        }
    }, [searchTerm, platforms])

    const fetchAllPlatforms = async () => {
        setLoading(true)
        setError('')
        try {
            const response = await fetch('/api/admin/igdb-platforms')
            const data = await response.json()

            if (response.ok && Array.isArray(data)) {
                setPlatforms(data)
                setFilteredPlatforms(data)
            } else {
                console.error('Invalid platforms data:', data)
                setError(data.error || 'Failed to fetch platforms')
                setPlatforms([])
                setFilteredPlatforms([])
            }
        } catch (err) {
            console.error('Fetch platforms error:', err)
            setError('Failed to fetch platforms')
            setPlatforms([])
            setFilteredPlatforms([])        } finally {
            setLoading(false)
        }
    }

    const handleViewVersions = (platform: Platform) => {
        // Navigate to platform versions page
        router.push(`/admin/platform-browser/${platform.slug}`)
    }

    if (!user) {
        return <CircularProgress />
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">Platform Browser</Typography>
                <Button variant="outlined" onClick={() => router.push('/admin')}>
                    Back to Admin
                        </Button>
                    </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            <Box sx={{ mb: 3 }}>
                <TextField
                    fullWidth
                    variant="outlined"
                    placeholder="Search platforms... (e.g., Nintendo, Sega, PlayStation)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                />
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                        All Gaming Platforms ({filteredPlatforms.length} found)
                    </Typography>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Name</TableCell>
                                    <TableCell>Category</TableCell>
                                    <TableCell>Has Description</TableCell>
                                    <TableCell>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredPlatforms.map((platform) => (
                                    <TableRow 
                                        key={platform.id}
                                        sx={{ 
                                            '&:hover': { 
                                                backgroundColor: 'action.hover',
                                                cursor: 'pointer'
                                            } 
                                        }}
                                        onClick={() => handleViewVersions(platform)}
                                    >
                                        <TableCell>
                                            <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                                                {platform.name}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            {platform.category === 1 ? 'Console' : platform.category === 5 ? 'Platform' : platform.category}
                                        </TableCell>
                                        <TableCell>
                                            {platform.summary ? 'Yes' : 'No'}
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleViewVersions(platform)
                                                }}
                                            >
                                                View Versions
                                            </Button>
                                        </TableCell>
                                    </TableRow>                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </>
            )}
        </Container>
    )
}
