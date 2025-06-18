"use client"

import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Stack
} from '@mui/material'
import { IgdbPlatform, IgdbPlatformVersion } from './types'

interface PlatformVersionsDialogProps {
    open: boolean
    platform: IgdbPlatform | null
    versions: IgdbPlatformVersion[]
    onClose: () => void
    onVersionSelect: (version: IgdbPlatformVersion) => void
}

export default function PlatformVersionsDialog({ 
    open, 
    platform, 
    versions, 
    onClose, 
    onVersionSelect 
}: PlatformVersionsDialogProps) {
    return (
        <Dialog 
            open={open} 
            onClose={onClose}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle>
                Select Version of {platform?.name}
            </DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary" paragraph>
                    This platform has multiple versions. Select one:
                </Typography>
                <Stack spacing={1}>
                    {versions.map((version) => (                        <Button
                            key={version.igdbId}
                            variant="outlined"
                            onClick={() => onVersionSelect(version)}
                            sx={{ justifyContent: 'flex-start' }}
                        >
                            {version.name}
                        </Button>
                    ))}
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
            </DialogActions>
        </Dialog>
    )
}
