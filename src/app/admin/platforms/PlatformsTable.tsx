"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    Typography,
    Chip,
    TextField,
    InputAdornment,
    Alert,
    CircularProgress,
    Box
} from '@mui/material'
import { Search, Visibility } from '@mui/icons-material'
import { IgdbPlatform } from './types'

interface PlatformsTableProps {
    platforms: IgdbPlatform[]
    searchTerm: string
    onSearchChange: (term: string) => void
    onPlatformSelect: (platform: IgdbPlatform) => void
    loading?: boolean
}

export default function PlatformsTable({ 
    platforms, 
    searchTerm, 
    onSearchChange, 
    onPlatformSelect,
    loading = false
}: PlatformsTableProps) {    const filteredPlatforms = platforms.filter(platform =>
        platform.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        platform.alternative_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        platform.abbreviation?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        platform.familyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        platform.typeName?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Show loading spinner instead of empty table
    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
            </Box>
        )
    }

    if (platforms.length === 0) {
        return (
            <Alert severity="info">
                No IGDB platforms found in local database. Please sync IGDB data first.
            </Alert>
        )
    }

    return (
        <>
            <TextField
                fullWidth
                variant="outlined"
                placeholder="Search platforms by name, abbreviation, alternative name, family, or type..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                sx={{ mb: 3 }}
                InputProps={{
                    startAdornment: (
                        <InputAdornment position="start">
                            <Search />
                        </InputAdornment>
                    ),
                }}
            />

            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Showing {filteredPlatforms.length} of {platforms.length} platforms
            </Typography>

            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Name</TableCell>
                            <TableCell>Alternative Name</TableCell>
                            <TableCell>Abbreviation</TableCell>
                            <TableCell>Family</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Generation</TableCell>
                            <TableCell>Versions</TableCell>
                            <TableCell align="center">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>                        
                        {filteredPlatforms.slice(0, 50).map((platform) => (
                            <TableRow key={platform.igdbId} hover>
                                <TableCell>
                                    <Typography variant="body2" fontWeight="medium">
                                        {platform.name}
                                    </Typography>
                                </TableCell>
                                <TableCell>
                                    {platform.alternative_name || '-'}
                                </TableCell>
                                <TableCell>
                                    {platform.abbreviation || '-'}
                                </TableCell>
                                <TableCell>
                                    {platform.familyName ? (
                                        <Chip 
                                            label={platform.familyName} 
                                            size="small" 
                                            variant="outlined"
                                            color="primary"
                                            onClick={() => {}}
                                        />
                                    ) : '-'}
                                </TableCell>
                                <TableCell>
                                    {platform.typeName ? (
                                        <Chip 
                                            label={platform.typeName} 
                                            size="small" 
                                            variant="outlined"
                                            color="secondary"
                                            onClick={() => {}}
                                        />
                                    ) : '-'}
                                </TableCell>
                                <TableCell>
                                    {platform.generation ? `Gen ${platform.generation}` : '-'}
                                </TableCell>
                                <TableCell>
                                    <Chip
                                        label={platform.hasVersions ? 'Has Versions' : 'No Versions'}
                                        size="small"
                                        variant="filled"
                                        color={platform.hasVersions ? 'success' : 'default'}
                                        onClick={() => {}}
                                    />
                                </TableCell>
                                <TableCell align="center">
                                    <Button
                                        size="small"
                                        startIcon={<Visibility />}
                                        onClick={() => onPlatformSelect(platform)}
                                    >
                                        Select
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </>
    )
}
