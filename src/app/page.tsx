"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Container, 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box,  Tabs,
  Tab,
  Card,
  CardContent,
  CardMedia,  CardActions,
  Chip,
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material'
import { Add as AddIcon, Star } from '@mui/icons-material'
import Cookies from 'js-cookie'
import { jwtDecode } from 'jwt-decode'

interface DecodedToken {
  id: number
  email: string
  isAdmin: boolean
}

interface UserPlatform {
  id: number
  userId: number
  platformId: number
  status: 'OWNED' | 'WISHLISTED'
  createdAt: string
  updatedAt: string
  platform: {
    id: number
    name: string
    abbreviation?: string
    igdbPlatformId?: number
    igdbPlatformVersionId?: number
  }
}

export default function HomePage() {
  const [user, setUser] = useState<DecodedToken | null>(null)
  const [tabValue, setTabValue] = useState(0)
  const [userPlatforms, setUserPlatforms] = useState<UserPlatform[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
      fetchUserPlatforms()    } catch (error) {
      console.error('Invalid token:', error)
      Cookies.remove('token')
      router.push('/login')
    }
  }, [router])

  const fetchUserPlatforms = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('Fetching user platforms...')
      const response = await fetch('/api/user/platforms')
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const platforms = await response.json()
        console.log('Fetched platforms:', platforms)
        setUserPlatforms(platforms)
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('API error:', errorData)
        
        if (response.status === 401) {
          setError('You need to log in to view your platforms')
          // Redirect to login after a short delay
          setTimeout(() => router.push('/login'), 2000)
        } else {
          setError(errorData.error || `Error ${response.status}: Failed to fetch platforms`)
        }
      }
    } catch (err) {
      console.error('Fetch error:', err)
      setError('Network error: Failed to fetch platforms')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    Cookies.remove('token')
    router.push('/login')
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Game Collection Tracker
          </Typography>
          <Typography variant="body1" sx={{ mr: 2 }}>
            Welcome, {user.email}
          </Typography>
          {user.isAdmin && (
            <Button color="inherit" onClick={() => router.push('/admin')}>
              Admin Panel
            </Button>
          )}
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, newValue) => {
            setTabValue(newValue)
            if (newValue === 0) {
              fetchUserPlatforms() // Refresh platforms when switching to platforms tab
            }
          }}>
            <Tab label="My Platforms" />
            <Tab label="My Games" />
            <Tab label="Wishlists" />
          </Tabs>
        </Box><Box sx={{ mt: 3 }}>
          {tabValue === 0 && (
            <Box>              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">My Gaming Platforms</Typography>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button 
                    variant="outlined" 
                    onClick={fetchUserPlatforms}
                    disabled={loading}
                  >
                    Refresh
                  </Button>
                  <Button 
                    variant="contained" 
                    startIcon={<AddIcon />}
                    onClick={() => router.push('/platforms/browse')}
                  >
                    Add Platform
                  </Button>
                </Box>
              </Box>
              
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : error ? (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              ) : userPlatforms.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Typography variant="h6" gutterBottom>
                    No platforms in your collection yet
                  </Typography>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Start by adding gaming platforms to your collection! Each platform can hold your game library.
                  </Typography>
                  <Button 
                    variant="contained" 
                    startIcon={<AddIcon />}
                    onClick={() => router.push('/platforms/browse')}
                    size="large"
                  >
                    Browse Platforms
                  </Button>
                </Box>              ) : (
                <Box sx={{ 
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                  gap: 3
                }}>
                  {userPlatforms.map((userPlatform) => (
                    <Card 
                      key={userPlatform.id}
                      sx={{ 
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 3
                        }
                      }}
                      onClick={() => router.push(`/platforms/${userPlatform.platformId}`)}
                    >
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                          {userPlatform.platform.name}
                        </Typography>
                        {userPlatform.platform.abbreviation && (
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {userPlatform.platform.abbreviation}
                          </Typography>
                        )}
                        <Chip 
                          label={userPlatform.status}
                          color={userPlatform.status === 'OWNED' ? 'success' : 'primary'}
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      </CardContent>
                      <CardActions>
                        <Button 
                          size="small" 
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/platforms/${userPlatform.platformId}`)
                          }}
                        >
                          View Games
                        </Button>
                      </CardActions>
                    </Card>
                  ))}
                </Box>
              )}
            </Box>
          )}
          {tabValue === 1 && (
            <Box>
              <Typography variant="h4" sx={{ mb: 2 }}>My Game Collection</Typography>
              <Typography variant="body1" color="text.secondary">
                Add platforms first, then manage your game collection for each platform.
              </Typography>
            </Box>
          )}
          {tabValue === 2 && (
            <Box>
              <Typography variant="h4" sx={{ mb: 2 }}>My Wishlists</Typography>
              <Typography variant="body1" color="text.secondary">
                Keep track of platforms and games you want to add to your collection.
              </Typography>
            </Box>
          )}
        </Box>
      </Container>
    </Box>
  )
}
