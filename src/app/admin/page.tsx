"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Container,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Box,
  Alert,
  CircularProgress
} from '@mui/material'
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
  imageUrl?: string
  description?: string
  igdbId?: number
}

interface IGDBPlatform {
  id: number
  name: string
  summary?: string
  logoUrl?: string
}

export default function AdminPage() {
  const [user, setUser] = useState<DecodedToken | null>(null)
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [igdbPlatforms, setIgdbPlatforms] = useState<IGDBPlatform[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showIgdb, setShowIgdb] = useState(false)
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
      fetchPlatforms()
    }
  }, [user])

  const fetchPlatforms = async () => {
    try {
      const token = Cookies.get('token')
      const response = await fetch('/api/admin/platforms', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cookie': `token=${token}`
        }
      })
      const data = await response.json()
      
      if (response.ok && Array.isArray(data)) {
        setPlatforms(data)
      } else {
        console.error('Invalid platforms data:', data)
        setError(data.error || 'Failed to fetch platforms')
        setPlatforms([]) // Ensure it's always an array
      }
    } catch (err) {
      console.error('Fetch platforms error:', err)
      setError('Failed to fetch platforms')
      setPlatforms([]) // Ensure it's always an array
    }
  }
  const fetchIGDBPlatforms = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch('/api/admin/igdb-platforms')
      const data = await response.json()
      
      if (response.ok && Array.isArray(data)) {
        setIgdbPlatforms(data)
        setShowIgdb(true)
      } else {
        console.error('Invalid IGDB platforms data:', data)
        setError(data.error || 'Failed to fetch IGDB platforms')
        setIgdbPlatforms([]) // Ensure it's always an array
      }
    } catch (err) {
      console.error('Fetch IGDB platforms error:', err)
      setError('Failed to fetch IGDB platforms')
      setIgdbPlatforms([]) // Ensure it's always an array
    } finally {
      setLoading(false)
    }
  }
  const addPlatformFromIGDB = async (igdbPlatform: IGDBPlatform) => {
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
          name: igdbPlatform.name,
          description: igdbPlatform.summary,
          imageUrl: igdbPlatform.logoUrl ? `https:${igdbPlatform.logoUrl}` : undefined,
          igdbId: igdbPlatform.id
        })
      })

      if (response.ok) {
        fetchPlatforms()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to add platform')
      }
    } catch (err) {
      setError('Failed to add platform')
    }
  }

  if (!user) {
    return <CircularProgress />
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Admin Panel - Platform Management</Typography>
        <Button variant="outlined" onClick={() => router.push('/')}>
          Back to Home
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ mb: 3 }}>
        <Button 
          variant="contained" 
          onClick={fetchIGDBPlatforms}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Import from IGDB'}
        </Button>
      </Box>

      {showIgdb && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Available IGDB Platforms</Typography>
          <TableContainer component={Paper} sx={{ mb: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Logo</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>              <TableBody>
                {Array.isArray(igdbPlatforms) && igdbPlatforms.map((platform) => {
                  const alreadyExists = Array.isArray(platforms) && platforms.some(p => p.igdbId === platform.id)
                  return (
                    <TableRow key={platform.id}>
                      <TableCell>{platform.id}</TableCell>
                      <TableCell>{platform.name}</TableCell>
                      <TableCell>{platform.summary || 'N/A'}</TableCell>
                      <TableCell>
                        {platform.logoUrl && (
                          <img 
                            src={`https:${platform.logoUrl}`} 
                            alt={platform.name}
                            style={{ maxHeight: 32, maxWidth: 64 }}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        {alreadyExists ? (
                          <Typography color="success.main" variant="body2">Added</Typography>
                        ) : (
                          <Button 
                            size="small" 
                            variant="contained"
                            onClick={() => addPlatformFromIGDB(platform)}
                          >
                            Add
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      <Typography variant="h6" sx={{ mb: 2 }}>Current Platforms in Database</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Image</TableCell>
              <TableCell>IGDB ID</TableCell>
            </TableRow>
          </TableHead>          <TableBody>
            {Array.isArray(platforms) && platforms.map((platform) => (
              <TableRow key={platform.id}>
                <TableCell>{platform.id}</TableCell>
                <TableCell>{platform.name}</TableCell>
                <TableCell>{platform.description || 'N/A'}</TableCell>
                <TableCell>
                  {platform.imageUrl && (
                    <img 
                      src={platform.imageUrl} 
                      alt={platform.name}
                      style={{ maxHeight: 32, maxWidth: 64 }}
                    />
                  )}
                </TableCell>
                <TableCell>{platform.igdbId || 'N/A'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  )
}
