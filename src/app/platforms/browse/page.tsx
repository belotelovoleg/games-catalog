"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Box,
  AppBar,
  Toolbar,
  Chip,
  Alert
} from '@mui/material'
import { ArrowBack, Star, StarBorder } from '@mui/icons-material'
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
}

interface UserPlatform {
  id: number
  platform: Platform
  status: 'OWNED' | 'WISHLISTED'
}

export default function BrowsePlatformsPage() {
  const [user, setUser] = useState<DecodedToken | null>(null)
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [userPlatforms, setUserPlatforms] = useState<UserPlatform[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    const token = Cookies.get('token')
    if (!token) {
      router.push('/login')
      return
    }
    
    try {
      const decoded = jwtDecode<DecodedToken>(token)
      setUser(decoded)
    } catch (error) {
      console.error('Invalid token:', error)
      Cookies.remove('token')
      router.push('/login')
    }
  }, [router])

  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [user])

  const fetchData = async () => {
    try {
      const [platformsRes, userPlatformsRes] = await Promise.all([
        fetch('/api/admin/platforms'),
        fetch('/api/user/platforms', {
          headers: { Cookie: `token=${Cookies.get('token')}` }
        })
      ])

      if (platformsRes.ok) {
        const platforms = await platformsRes.json()
        setPlatforms(platforms)
      }

      if (userPlatformsRes.ok) {
        const userPlatforms = await userPlatformsRes.json()
        setUserPlatforms(userPlatforms)
      }
    } catch (error) {
      setError('Failed to fetch data')
    } finally {
      setLoading(false)
    }
  }

  const addPlatform = async (platformId: number, status: 'OWNED' | 'WISHLISTED') => {
    try {
      const response = await fetch('/api/user/platforms', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Cookie: `token=${Cookies.get('token')}`
        },
        body: JSON.stringify({ platformId, status })
      })

      if (response.ok) {
        fetchData() // Refresh data
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to add platform')
      }
    } catch (error) {
      setError('Failed to add platform')
    }
  }

  const getPlatformStatus = (platformId: number) => {
    return userPlatforms.find(up => up.platform.id === platformId)?.status
  }

  if (!user) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>Loading...</Box>
  }

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Button color="inherit" startIcon={<ArrowBack />} onClick={() => router.push('/')}>
            Back
          </Button>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, ml: 2 }}>
            Browse Gaming Platforms
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Typography variant="h4" sx={{ mb: 3 }}>
          Available Gaming Platforms
        </Typography>

        {loading ? (
          <Typography>Loading platforms...</Typography>
        ) : platforms.length === 0 ? (
          <Typography>No platforms available. Contact an admin to import platforms from IGDB.</Typography>
        ) : (          <Grid container spacing={3}>
            {platforms.map((platform) => {
              const status = getPlatformStatus(platform.id)
              return (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={platform.id}>
                  <Card>
                    {platform.imageUrl && (
                      <CardMedia
                        component="img"
                        height="140"
                        image={platform.imageUrl}
                        alt={platform.name}
                        sx={{ objectFit: 'contain', p: 1 }}
                      />
                    )}
                    <CardContent>
                      <Typography gutterBottom variant="h6" component="div">
                        {platform.name}
                      </Typography>
                      {status && (
                        <Chip 
                          label={status === 'OWNED' ? 'Owned' : 'Wishlisted'} 
                          color={status === 'OWNED' ? 'success' : 'warning'}
                          size="small"
                          sx={{ mb: 1 }}
                        />
                      )}
                      <Typography variant="body2" color="text.secondary">
                        {platform.description || 'No description available'}
                      </Typography>
                    </CardContent>
                    <CardActions>
                      {!status && (
                        <>
                          <Button 
                            size="small" 
                            variant="contained"
                            onClick={() => addPlatform(platform.id, 'OWNED')}
                          >
                            Add to Collection
                          </Button>
                          <Button 
                            size="small" 
                            variant="outlined"
                            startIcon={<StarBorder />}
                            onClick={() => addPlatform(platform.id, 'WISHLISTED')}
                          >
                            Wishlist
                          </Button>
                        </>
                      )}
                      {status === 'WISHLISTED' && (
                        <Button 
                          size="small" 
                          variant="contained"
                          onClick={() => addPlatform(platform.id, 'OWNED')}
                        >
                          Move to Collection
                        </Button>
                      )}
                      {status && (
                        <Typography variant="body2" color="success.main">
                          ✓ {status === 'OWNED' ? 'In Collection' : 'In Wishlist'}
                        </Typography>
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              )
            })}
          </Grid>
        )}
      </Container>
    </Box>
  )
}
