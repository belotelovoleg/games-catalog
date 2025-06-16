"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Container, 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Chip,
  IconButton
} from '@mui/material'
import { Add as AddIcon, Star } from '@mui/icons-material'
import Cookies from 'js-cookie'
import { jwtDecode } from 'jwt-decode'

interface DecodedToken {
  id: number
  email: string
  isAdmin: boolean
}

export default function HomePage() {
  const [user, setUser] = useState<DecodedToken | null>(null)
  const [tabValue, setTabValue] = useState(0)
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

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="My Platforms" />
            <Tab label="My Games" />
            <Tab label="Wishlists" />
          </Tabs>
        </Box>        <Box sx={{ mt: 3 }}>
          {tabValue === 0 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4">My Gaming Platforms</Typography>
                <Button 
                  variant="contained" 
                  startIcon={<AddIcon />}
                  onClick={() => router.push('/platforms/browse')}
                >
                  Add Platform
                </Button>
              </Box>
              
              <Typography variant="body1" color="text.secondary">
                Start by adding gaming platforms to your collection! Each platform can hold your game library.
              </Typography>
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
