"use client"

import { useState } from 'react'
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    InputAdornment,
    Typography,
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip
} from '@mui/material'
import { Search } from '@mui/icons-material'
import { IgdbPlatform } from './types'

interface AddPlatformDialogProps {
    open: boolean
    platforms: IgdbPlatform[]
    onClose: () => void
    onPlatformSelect: (platform: IgdbPlatform) => void
}

export default function AddPlatformDialog({ 
    open, 
    platforms, 
    onClose, 
    onPlatformSelect 
}: AddPlatformDialogProps) {
    const [searchTerm, setSearchTerm] = useState('')

    const filteredPlatforms = platforms.filter(platform =>
        platform.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        platform.alternative_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        platform.abbreviation?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleClose = () => {
        setSearchTerm('')
        onClose()
    }

    return (
        <Dialog 
            open={open} 
            onClose={handleClose}
            maxWidth="lg"
            fullWidth
        >
            <DialogTitle>Select Platform from IGDB Data</DialogTitle>
            <DialogContent>
                <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" color="text.secondary" paragraph>
                        Select a platform from your local IGDB database to add to the user-selectable platforms list.
                    </Typography>
                    
                    <TextField
                        fullWidth
                        variant="outlined"
                        placeholder="Search platforms by name, abbreviation, or alternative name..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ mb: 2 }}
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
                </Box>

                <TableContainer sx={{ maxHeight: 400 }}>
                    <Table stickyHeader>
                        <TableHead>
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell>Alternative Name</TableCell>
                                <TableCell>Abbreviation</TableCell>
                                <TableCell>Versions</TableCell>
                                <TableCell align="center">Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredPlatforms.slice(0, 100).map((platform) => (                                <TableRow 
                                    key={platform.igdbId}
                                    hover
                                    sx={{ cursor: 'pointer' }}
                                >
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
                                        <Chip
                                            label={platform.hasVersions ? 'Has Versions' : 'No Versions'}
                                            color={platform.hasVersions ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell align="center">
                                        <Button
                                            size="small"
                                            variant="contained"
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
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
            </DialogActions>
        </Dialog>
    )
}
