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
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Stack,
  CircularProgress
} from '@mui/material'
import { ArrowBack, Star, StarBorder, Info } from '@mui/icons-material'
import Cookies from 'js-cookie'
import { jwtDecode } from 'jwt-decode'
import PlatformDetailsModal from './PlatformDetailsModal'

interface DecodedToken {
  id: number
  email: string
  isAdmin: boolean
}

interface Platform {
  id: number
  name: string
  versionName?: string
  abbreviation?: string
  alternative_name?: string
  generation?: number
  familyName?: string
  typeName?: string
  imageUrl?: string
  description?: string
}

interface UserPlatform {
  id: number
  platform: Platform
  status: 'OWNED' | 'WISHLISTED'
}

interface FilterOptions {
  generations: { value: number; label: string }[]
  families: { value: number; label: string }[]
  types: { value: number; label: string }[]
}

export default function BrowsePlatformsPage() {  const [user, setUser] = useState<DecodedToken | null>(null)
  const [platforms, setPlatforms] = useState<Platform[]>([])
  const [userPlatforms, setUserPlatforms] = useState<UserPlatform[]>([])
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null)
  const [showModal, setShowModal] = useState(false)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFamily, setSelectedFamily] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [selectedGeneration, setSelectedGeneration] = useState('')
  
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
      fetchFilterOptions()
      fetchData()
    }
  }, [user])

  // Fetch data when filters change
  useEffect(() => {
    if (user) {
      fetchData()
    }
  }, [searchTerm, selectedFamily, selectedType, selectedGeneration])

  const fetchFilterOptions = async () => {
    try {
      const response = await fetch('/api/platforms/browse/filters')
      if (response.ok) {
        const options = await response.json()
        setFilterOptions(options)
      }
    } catch (error) {
      console.error('Error fetching filter options:', error)
    }
  }

  const fetchData = async () => {
    try {
      // Build query params for filtering
      const params = new URLSearchParams()
      if (searchTerm) params.append('search', searchTerm)
      if (selectedFamily) params.append('family', selectedFamily)
      if (selectedType) params.append('type', selectedType)
      if (selectedGeneration) params.append('generation', selectedGeneration)

      const [platformsRes, userPlatformsRes] = await Promise.all([
        fetch(`/api/platforms/browse?${params.toString()}`),
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
  const handlePlatformClick = (platformId: number) => {
    const platform = platforms.find(p => p.id === platformId)
    if (platform) {
      setSelectedPlatform(platform)
      setShowModal(true)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setSelectedPlatform(null)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedFamily('')
    setSelectedType('')
    setSelectedGeneration('')
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
      </AppBar>      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Typography variant="h4" sx={{ mb: 3 }}>
          Browse Gaming Platforms
        </Typography>

        {/* Filters */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Filter Platforms
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                label="Search platforms..."
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Generation</InputLabel>
                <Select
                  value={selectedGeneration}
                  label="Generation"
                  onChange={(e) => setSelectedGeneration(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  {filterOptions?.generations.map((gen) => (
                    <MenuItem key={gen.value} value={gen.value.toString()}>
                      {gen.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Family</InputLabel>
                <Select
                  value={selectedFamily}
                  label="Family"
                  onChange={(e) => setSelectedFamily(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  {filterOptions?.families.map((family) => (
                    <MenuItem key={family.value} value={family.value.toString()}>
                      {family.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  value={selectedType}
                  label="Type"
                  onChange={(e) => setSelectedType(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  {filterOptions?.types.map((type) => (
                    <MenuItem key={type.value} value={type.value.toString()}>
                      {type.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Button 
                variant="outlined" 
                onClick={clearFilters}
                sx={{ mr: 1 }}
              >
                Clear Filters
              </Button>
              <Chip 
                label={`${platforms.length} platforms`} 
                color="primary" 
                variant="outlined" 
              />
            </Grid>
          </Grid>
        </Paper>        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        ) : platforms.length === 0 ? (
          <Typography>No platforms found with the current filters.</Typography>
        ) : (
          <Grid container spacing={3}>
            {platforms.map((platform) => {
              const status = getPlatformStatus(platform.id)
              const displayName = platform.versionName || platform.name
              
              return (
                <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={platform.id}>
                  <Card 
                    sx={{ 
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: 4
                      }
                    }}
                    onClick={() => handlePlatformClick(platform.id)}
                  >
                    {platform.imageUrl && (
                      <CardMedia
                        component="img"
                        height="160"
                        image={platform.imageUrl}
                        alt={displayName}
                        sx={{ 
                          objectFit: 'contain', 
                          p: 2,
                          backgroundColor: 'grey.50'
                        }}
                      />
                    )}
                    {!platform.imageUrl && (
                      <Box sx={{ 
                        height: 160, 
                        backgroundColor: 'grey.100',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        m: 2,
                        borderRadius: 1
                      }}>
                        <Typography variant="body2" color="text.secondary">
                          No Image
                        </Typography>
                      </Box>
                    )}
                    
                    <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                      <Typography gutterBottom variant="h6" component="div" sx={{ fontSize: '1rem' }}>
                        {displayName}
                      </Typography>
                      
                      {platform.versionName && platform.versionName !== platform.name && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Platform: {platform.name}
                        </Typography>
                      )}
                      
                      <Stack direction="row" spacing={1} flexWrap="wrap" gap={0.5} sx={{ mb: 1 }}>
                        {platform.generation && (
                          <Chip 
                            label={`Gen ${platform.generation}`} 
                            size="small" 
                            variant="outlined"
                            color="primary"
                          />
                        )}
                        {platform.familyName && (
                          <Chip 
                            label={platform.familyName} 
                            size="small" 
                            variant="outlined"
                            color="secondary"
                          />
                        )}
                        {platform.typeName && (
                          <Chip 
                            label={platform.typeName} 
                            size="small" 
                            variant="outlined"
                          />
                        )}
                      </Stack>
                      
                      {status && (
                        <Chip 
                          label={status === 'OWNED' ? 'Owned' : 'Wishlisted'} 
                          color={status === 'OWNED' ? 'success' : 'warning'}
                          size="small"
                          sx={{ mt: 1 }}
                        />
                      )}
                    </CardContent>
                    
                    <CardActions sx={{ pt: 0 }}>
                      <Button 
                        size="small" 
                        startIcon={<Info />}
                        onClick={(e) => {
                          e.stopPropagation()
                          handlePlatformClick(platform.id)
                        }}
                      >
                        Details
                      </Button>
                      {!status && (
                        <>
                          <Button 
                            size="small" 
                            variant="contained"
                            onClick={(e) => {
                              e.stopPropagation()
                              addPlatform(platform.id, 'OWNED')
                            }}
                          >
                            Own
                          </Button>
                          <Button 
                            size="small" 
                            variant="outlined"
                            startIcon={<StarBorder />}
                            onClick={(e) => {
                              e.stopPropagation()
                              addPlatform(platform.id, 'WISHLISTED')
                            }}
                          >
                            Wish
                          </Button>
                        </>
                      )}
                      {status === 'WISHLISTED' && (
                        <Button 
                          size="small" 
                          variant="contained"
                          onClick={(e) => {
                            e.stopPropagation()
                            addPlatform(platform.id, 'OWNED')
                          }}
                        >
                          Move to Collection
                        </Button>
                      )}
                    </CardActions>
                  </Card>
                </Grid>
              )
            })}
          </Grid>
        )}        {/* Platform Details Modal */}
        <PlatformDetailsModal
          open={showModal}
          platform={selectedPlatform}
          onClose={handleCloseModal}
          onAddToCollection={addPlatform}
          userStatus={selectedPlatform ? getPlatformStatus(selectedPlatform.id) : null}
        />
      </Container>
    </Box>
  )
}
