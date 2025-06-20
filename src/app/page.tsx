"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Container, 
  Typography, 
  Box,
  Paper,
  Button,
  CircularProgress
} from '@mui/material'
import { Construction, VideogameAsset } from '@mui/icons-material'
import Cookies from 'js-cookie'
import { jwtDecode } from 'jwt-decode'

interface DecodedToken {
  id: number
  email: string
  isAdmin: boolean
}

export default function HomePage() {
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
      setUser(decoded)
    } catch (error) {
      console.error('Invalid token:', error)
      Cookies.remove('token')
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }, [router])

  if (loading) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    )
  }

  if (!user) {
    return null // Will redirect to login
  }

  return (
    <Container maxWidth="md" sx={{ mt: 8 }}>
      <Paper 
        sx={{ 
          p: 6, 
          textAlign: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: 3
        }}
      >
        <Construction sx={{ fontSize: 80, mb: 2, opacity: 0.8 }} />
        
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 700 }}>
          Under Construction
        </Typography>
        
        <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
          We're building something awesome for your gaming collection!
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 4, maxWidth: 600, mx: 'auto', opacity: 0.8 }}>
          This will be your central hub to view and manage your entire game collection across all platforms. 
          For now, you can browse and manage your platforms using the navigation menu.
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            size="large"
            startIcon={<VideogameAsset />}
            onClick={() => router.push('/platforms/browse')}
            sx={{
              bgcolor: 'white',
              color: 'primary.main',
              fontWeight: 600,
              '&:hover': {
                bgcolor: 'grey.100',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 16px rgba(0,0,0,0.15)'
              },
              transition: 'all 0.2s ease'
            }}
          >
            Browse Platforms
          </Button>
        </Box>
      </Paper>
    </Container>
  )
}
