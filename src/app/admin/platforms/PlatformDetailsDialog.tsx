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
    Chip
} from '@mui/material'
import { IgdbPlatform, IgdbPlatformVersion } from './types'
import { useState } from 'react'

interface PlatformDetailsDialogProps {
    open: boolean
    platform: IgdbPlatform | null
    version: IgdbPlatformVersion | null
    onClose: () => void
    onAddPlatform: () => void
}

export default function PlatformDetailsDialog({ 
    open, 
    platform, 
    version, 
    onClose, 
    onAddPlatform 
}: PlatformDetailsDialogProps) {
    const displayName = version?.name || platform?.name
    
    // Use image from version first, then platform
    const imageUrl = version?.imageUrl || platform?.imageUrl

    // Function to render companies (excluding main manufacturer)
    const renderCompanies = () => {
        if (!version?.companyNames || version.companyNames.length === 0) return null

        return (
            <Box>
                <Typography variant="subtitle2" color="primary">Other Companies</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {version.companyNames.map((companyName, index) => (
                        <Chip
                            key={index}
                            label={companyName}
                            variant="filled"
                            size="small"
                        />
                    ))}
                </Box>
            </Box>
        )
    }

    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>
                Platform Details: {displayName}
            </DialogTitle>
            <DialogContent>
                <Box sx={{ display: 'flex', gap: 3 }}>
                    {/* Platform Image */}
                    <Box sx={{ minWidth: 200 }}>
                        {imageUrl ? (
                            <img 
                                src={imageUrl} 
                                alt={displayName}
                                style={{ 
                                    width: '100%', 
                                    maxWidth: 200, 
                                    height: 'auto',
                                    borderRadius: 8,
                                    border: '1px solid #e0e0e0'
                                }}
                            />
                        ) : (
                            <Box sx={{ 
                                width: 200, 
                                height: 150, 
                                backgroundColor: 'grey.100',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: 'grey.300'
                            }}>
                                <Typography variant="body2" color="text.secondary">
                                    No Image Available
                                </Typography>
                            </Box>
                        )}
                    </Box>

                    {/* Platform Details */}
                    <Box sx={{ flex: 1 }}>
                        {version ? (
                            // Show Platform Version details
                            <Stack spacing={2}>
                                <Typography variant="h6">Platform Version Information</Typography>
                                
                                {version.name && (
                                    <Box>
                                        <Typography variant="subtitle2" color="primary">Name</Typography>
                                        <Typography variant="body2">{version.name}</Typography>
                                    </Box>
                                )}
                                  {version.summary && (
                                    <Box>
                                        <Typography variant="subtitle2" color="primary">Summary</Typography>
                                        <Typography variant="body2">{version.summary}</Typography>
                                    </Box>
                                )}                                {version.main_manufacturer && (
                                    <Box>
                                        <Typography variant="subtitle2" color="primary">Main Manufacturer</Typography>
                                        <Chip
                                            label={version.mainManufacturerName || `Company ID: ${version.main_manufacturer}`}
                                            variant="filled"
                                            size="small"
                                            color="primary"
                                        />
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
                                )}                                {version.connectivity && (
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
                                )}                                {version.resolutions && (
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
                                  {version.url && (
                                    <Box>
                                        <Typography variant="subtitle2" color="primary">URL</Typography>
                                        <Typography variant="body2">
                                            <a href={version.url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>
                                                {version.url}
                                            </a>
                                        </Typography>
                                    </Box>
                                )}
                                
                                {renderCompanies()}
                            </Stack>
                        ) : platform ? (
                            // Show Platform details (no version)
                            <Stack spacing={2}>
                                <Typography variant="h6">Platform Information</Typography>
                                
                                {platform.name && (
                                    <Box>
                                        <Typography variant="subtitle2" color="primary">Name</Typography>
                                        <Typography variant="body2">{platform.name}</Typography>
                                    </Box>
                                )}
                                
                                {platform.alternative_name && (
                                    <Box>
                                        <Typography variant="subtitle2" color="primary">Alternative Name</Typography>
                                        <Typography variant="body2">{platform.alternative_name}</Typography>
                                    </Box>
                                )}
                                
                                {platform.abbreviation && (
                                    <Box>
                                        <Typography variant="subtitle2" color="primary">Abbreviation</Typography>
                                        <Typography variant="body2">{platform.abbreviation}</Typography>
                                    </Box>
                                )}
                                
                                {platform.generation && (
                                    <Box>
                                        <Typography variant="subtitle2" color="primary">Generation</Typography>
                                        <Typography variant="body2">Generation {platform.generation}</Typography>
                                    </Box>
                                )}
                                
                                {platform.summary && (
                                    <Box>
                                        <Typography variant="subtitle2" color="primary">Summary</Typography>
                                        <Typography variant="body2">{platform.summary}</Typography>
                                    </Box>
                                )}
                                
                                {platform.slug && (
                                    <Box>
                                        <Typography variant="subtitle2" color="primary">Slug</Typography>
                                        <Typography variant="body2">{platform.slug}</Typography>
                                    </Box>
                                )}
                            </Stack>
                        ) : null}
                    </Box>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button 
                    variant="contained" 
                    color="primary"
                    onClick={onAddPlatform}
                >
                    Add Platform
                </Button>
            </DialogActions>
        </Dialog>
    )
}
