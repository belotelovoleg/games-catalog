"use client"

import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Stack,
    Chip,
    Card,
    CardMedia,
    Grid,
    Divider,
    CircularProgress
} from '@mui/material'
import { useState, useEffect } from 'react'

interface BrowsePlatform {
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

interface PlatformDetailsModalProps {
    open: boolean
    platform: BrowsePlatform | null
    onClose: () => void
    onAddToCollection?: (platformId: number, status: 'OWNED' | 'WISHLISTED') => void
    userStatus?: 'OWNED' | 'WISHLISTED' | null
}

interface DetailedPlatform {
    id: number
    name: string
    versionName?: string
    abbreviation?: string
    alternative_name?: string
    generation?: number
    platform_logo_base64?: string
    imageUrl?: string
    
    // IGDB enriched data
    igdbPlatform?: {
        name?: string
        summary?: string
        slug?: string
        url?: string
        familyName?: string
        typeName?: string
        category?: number
        created_at?: number
        updated_at?: number
    }
    
    igdbPlatformVersion?: {
        name?: string
        summary?: string
        cpu?: string
        memory?: string
        graphics?: string
        sound?: string
        storage?: string
        connectivity?: string
        os?: string
        media?: string
        resolutions?: string
        output?: string
        url?: string
        mainManufacturerName?: string
        companyNames?: string[]
    }
}

export default function PlatformDetailsModal({ 
    open, 
    platform: initialPlatform, 
    onClose, 
    onAddToCollection, 
    userStatus 
}: PlatformDetailsModalProps) {
    const [platform, setPlatform] = useState<DetailedPlatform | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (open && initialPlatform) {
            // If we have basic platform data from parent, use it immediately for display
            setPlatform({
                id: initialPlatform.id,
                name: initialPlatform.name,
                versionName: initialPlatform.versionName,
                abbreviation: initialPlatform.abbreviation,
                alternative_name: initialPlatform.alternative_name,
                generation: initialPlatform.generation,
                imageUrl: initialPlatform.imageUrl,
                igdbPlatform: {
                    familyName: initialPlatform.familyName,
                    typeName: initialPlatform.typeName,
                    summary: initialPlatform.description
                }
            })
            
            // Then fetch detailed data for technical specs
            fetchPlatformDetails()
        }
    }, [open, initialPlatform])

    const fetchPlatformDetails = async () => {
        if (!initialPlatform) return
        
        setLoading(true)
        setError('')
        
        try {
            const response = await fetch(`/api/platforms/${initialPlatform.id}/details`)
            if (response.ok) {
                const detailedData = await response.json()
                
                // Merge the detailed data with what we already have, keeping images from parent
                setPlatform(prev => ({
                    ...detailedData,
                    imageUrl: initialPlatform.imageUrl || detailedData.imageUrl, // Prefer parent image
                    igdbPlatform: {
                        ...detailedData.igdbPlatform,
                        familyName: initialPlatform.familyName || detailedData.igdbPlatform?.familyName,
                        typeName: initialPlatform.typeName || detailedData.igdbPlatform?.typeName,
                        summary: initialPlatform.description || detailedData.igdbPlatform?.summary
                    }
                }))
            } else {
                setError('Failed to load detailed platform information')
            }        } catch (err) {
            setError('Failed to load detailed platform information')
        } finally {
            setLoading(false)
        }
    }

    const handleClose = () => {
        setPlatform(null)
        setError('')
        onClose()
    }

    const renderImage = () => {
        let imageUrl = platform?.imageUrl

        // Handle base64 data - check if it already has the data URL prefix
        if (platform?.platform_logo_base64) {
            imageUrl = platform.platform_logo_base64.startsWith('data:') 
                ? platform.platform_logo_base64 
                : `data:image/png;base64,${platform.platform_logo_base64}`
        }

        if (imageUrl) {
            return (
                <Card sx={{ maxWidth: 200, mx: 'auto' }}>
                    <CardMedia
                        component="img"
                        image={imageUrl}
                        alt={platform?.name}
                        sx={{ 
                            width: '100%',
                            height: 'auto',
                            maxHeight: 160,
                            objectFit: 'contain',
                            p: 2
                        }}
                    />
                </Card>
            )
        }

        return (
            <Box sx={{ 
                width: 200, 
                height: 160, 
                backgroundColor: 'grey.100',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'grey.300',
                mx: 'auto'
            }}>
                <Typography variant="body2" color="text.secondary">
                    No Image Available
                </Typography>
            </Box>
        )
    }

    const renderBasicInfo = () => (
        <Stack spacing={2}>
            <Typography variant="h5" component="h2">
                {platform?.name}
            </Typography>
            
            {platform?.versionName && platform.versionName !== platform.name && (
                <Box>
                    <Typography variant="subtitle2" color="primary">Version</Typography>
                    <Typography variant="body1">{platform.versionName}</Typography>
                </Box>
            )}
            
            {platform?.abbreviation && (
                <Box>
                    <Typography variant="subtitle2" color="primary">Abbreviation</Typography>
                    <Typography variant="body1">{platform.abbreviation}</Typography>
                </Box>
            )}
            
            {platform?.alternative_name && (
                <Box>
                    <Typography variant="subtitle2" color="primary">Alternative Name</Typography>
                    <Typography variant="body1">{platform.alternative_name}</Typography>
                </Box>
            )}
            
            {platform?.generation && (
                <Box>
                    <Typography variant="subtitle2" color="primary">Generation</Typography>
                    <Typography variant="body1">Generation {platform.generation}</Typography>
                </Box>
            )}
            
            {platform?.igdbPlatform?.familyName && (
                <Box>
                    <Typography variant="subtitle2" color="primary">Platform Family</Typography>
                    <Chip label={platform.igdbPlatform.familyName} variant="outlined" size="small" />
                </Box>
            )}
            
            {platform?.igdbPlatform?.typeName && (
                <Box>
                    <Typography variant="subtitle2" color="primary">Platform Type</Typography>
                    <Chip label={platform.igdbPlatform.typeName} variant="outlined" size="small" />
                </Box>
            )}
            
            {userStatus && (
                <Box>
                    <Chip 
                        label={userStatus === 'OWNED' ? 'In Your Collection' : 'In Your Wishlist'} 
                        color={userStatus === 'OWNED' ? 'success' : 'warning'}
                        variant="filled"
                    />
                </Box>
            )}
        </Stack>
    )

    const renderTechnicalSpecs = () => {
        const version = platform?.igdbPlatformVersion
        if (!version) return null

        return (
            <Stack spacing={2}>
                <Typography variant="h6" color="primary">Technical Specifications</Typography>
                
                {version.mainManufacturerName && (
                    <Box>
                        <Typography variant="subtitle2" color="primary">Manufacturer</Typography>
                        <Typography variant="body2">{version.mainManufacturerName}</Typography>
                    </Box>
                )}
                
                {version.cpu && (
                    <Box>
                        <Typography variant="subtitle2" color="primary">CPU</Typography>
                        <Typography variant="body2">{version.cpu}</Typography>
                    </Box>
                )}
                
                {version.memory && (
                    <Box>
                        <Typography variant="subtitle2" color="primary">Memory</Typography>
                        <Typography variant="body2">{version.memory}</Typography>
                    </Box>
                )}
                
                {version.graphics && (
                    <Box>
                        <Typography variant="subtitle2" color="primary">Graphics</Typography>
                        <Typography variant="body2">{version.graphics}</Typography>
                    </Box>
                )}
                
                {version.sound && (
                    <Box>
                        <Typography variant="subtitle2" color="primary">Sound</Typography>
                        <Typography variant="body2">{version.sound}</Typography>
                    </Box>
                )}
                
                {version.storage && (
                    <Box>
                        <Typography variant="subtitle2" color="primary">Storage</Typography>
                        <Typography variant="body2">{version.storage}</Typography>
                    </Box>
                )}
                
                {version.connectivity && (
                    <Box>
                        <Typography variant="subtitle2" color="primary">Connectivity</Typography>
                        <Typography variant="body2">{version.connectivity}</Typography>
                    </Box>
                )}
                
                {version.os && (
                    <Box>
                        <Typography variant="subtitle2" color="primary">Operating System</Typography>
                        <Typography variant="body2">{version.os}</Typography>
                    </Box>
                )}
                
                {version.media && (
                    <Box>
                        <Typography variant="subtitle2" color="primary">Media</Typography>
                        <Typography variant="body2">{version.media}</Typography>
                    </Box>
                )}
                
                {version.resolutions && (
                    <Box>
                        <Typography variant="subtitle2" color="primary">Resolutions</Typography>
                        <Typography variant="body2">{version.resolutions}</Typography>
                    </Box>
                )}
                
                {version.output && (
                    <Box>
                        <Typography variant="subtitle2" color="primary">Output</Typography>
                        <Typography variant="body2">{version.output}</Typography>
                    </Box>
                )}
                
                {version.companyNames && version.companyNames.length > 0 && (
                    <Box>
                        <Typography variant="subtitle2" color="primary">Other Companies</Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                            {version.companyNames.map((company, index) => (
                                <Chip
                                    key={index}
                                    label={company}
                                    variant="outlined"
                                    size="small"
                                />
                            ))}
                        </Box>
                    </Box>
                )}
            </Stack>
        )
    }

    const renderDescription = () => {
        const summary = platform?.igdbPlatformVersion?.summary || platform?.igdbPlatform?.summary
        
        if (!summary) return null

        return (
            <Stack spacing={2}>
                <Typography variant="h6" color="primary">Description</Typography>
                <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                    {summary}
                </Typography>
            </Stack>
        )
    }

    const renderLinks = () => {
        const platformUrl = platform?.igdbPlatform?.url
        const versionUrl = platform?.igdbPlatformVersion?.url
        
        if (!platformUrl && !versionUrl) return null

        return (
            <Stack spacing={2}>
                <Typography variant="h6" color="primary">External Links</Typography>
                {platformUrl && (
                    <Box>
                        <Typography variant="subtitle2" color="primary">Platform Information</Typography>
                        <Typography variant="body2">
                            <a href={platformUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
                                {platformUrl}
                            </a>
                        </Typography>
                    </Box>
                )}
                {versionUrl && versionUrl !== platformUrl && (
                    <Box>
                        <Typography variant="subtitle2" color="primary">Version Information</Typography>
                        <Typography variant="body2">
                            <a href={versionUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
                                {versionUrl}
                            </a>
                        </Typography>
                    </Box>
                )}
            </Stack>
        )
    }

    return (
        <Dialog 
            open={open} 
            onClose={handleClose}
            maxWidth="lg"
            fullWidth
            PaperProps={{
                sx: { minHeight: '60vh' }
            }}
        >
            <DialogTitle>
                Platform Details
            </DialogTitle>
            
            <DialogContent>
                {loading && (
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                        <CircularProgress />
                    </Box>
                )}
                
                {error && (
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                        <Typography color="error">{error}</Typography>
                    </Box>
                )}
                
                {platform && !loading && !error && (                    <Grid container spacing={3}>
                        {/* Left column - Image and basic info */}
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Stack spacing={3}>
                                {renderImage()}
                                {renderBasicInfo()}
                            </Stack>
                        </Grid>
                        
                        {/* Right column - Detailed information */}
                        <Grid size={{ xs: 12, md: 8 }}>
                            <Stack spacing={3}>
                                {renderDescription()}
                                {renderDescription() && renderTechnicalSpecs() && <Divider />}
                                {renderTechnicalSpecs()}
                                {(renderDescription() || renderTechnicalSpecs()) && renderLinks() && <Divider />}
                                {renderLinks()}
                            </Stack>
                        </Grid>
                    </Grid>
                )}
            </DialogContent>
            
            <DialogActions>
                <Button onClick={handleClose}>
                    Close
                </Button>
                
                {platform && onAddToCollection && !userStatus && (
                    <>
                        <Button 
                            variant="outlined"
                            onClick={() => onAddToCollection(platform.id, 'WISHLISTED')}
                        >
                            Add to Wishlist
                        </Button>
                        <Button 
                            variant="contained"
                            onClick={() => onAddToCollection(platform.id, 'OWNED')}
                        >
                            Add to Collection
                        </Button>
                    </>
                )}
                
                {platform && onAddToCollection && userStatus === 'WISHLISTED' && (
                    <Button 
                        variant="contained"
                        onClick={() => onAddToCollection(platform.id, 'OWNED')}
                    >
                        Move to Collection
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    )
}
