import { Container, Typography, Box } from '@mui/material'
import IGDBComprehensiveSync from '@/app/ui/IGDBComprehensiveSync'

export default function IGDBSyncPage() {
  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <IGDBComprehensiveSync />
    </Container>
  )
}
