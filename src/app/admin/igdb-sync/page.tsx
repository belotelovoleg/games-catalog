import { Container, Typography, Box } from '@mui/material'
import IGDBSyncManager from '@/app/ui/IGDBSyncManager'

export default function IGDBSyncPage() {
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          IGDB Data Synchronization
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage synchronization with the Internet Game Database (IGDB) to keep your local catalog up to date.
        </Typography>
      </Box>
      
      <IGDBSyncManager />
    </Container>
  )
}
