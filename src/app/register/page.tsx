"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Card,
  CardContent,
  Divider,
  Stack
} from '@mui/material'
import { 
  VideogameAsset, 
  PersonAdd,
  LibraryBooks,
  Timeline
} from '@mui/icons-material'
import { useLanguage } from '../../contexts/LanguageContext'
import { useTheme } from '../../contexts/ThemeContext'
import LanguageSwitcher from '../../components/LanguageSwitcher'
import ThemeToggle from '../../components/ThemeToggle'

export default function RegisterPage() {
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { t } = useLanguage()
  const { mode } = useTheme()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError(t('register_error_passwords_match'))
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password
        })
      })

      const data = await response.json()

      if (response.ok) {
        router.push('/login')
      } else {
        setError(data.error || t('register_error_general'))
      }
    } catch (err) {
      setError(t('register_error_network'))
    } finally {
      setLoading(false)
    }
  }
  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: 'background.default',
      py: { xs: 2, md: 4 }
    }}>
      <Container maxWidth="xl">        {/* Header with Language Switcher */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mb: 4 }}>
          <ThemeToggle />
          <LanguageSwitcher />
        </Box><Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          gap: { xs: 6, md: 8 },
          minHeight: { xs: 'auto', md: '70vh' },
          px: { xs: 2, sm: 0 }
        }}>{/* Left side - Welcome content */}
          <Box sx={{ 
            flex: 1, 
            maxWidth: { md: '50%' },
            order: { xs: 1, md: 1 },
            textAlign: { xs: 'center', md: 'left' }
          }}><Box sx={{ display: 'flex', alignItems: 'center', mb: 3, justifyContent: { xs: 'center', md: 'flex-start' } }}>
              <VideogameAsset sx={{ fontSize: { xs: 40, md: 48 }, color: 'primary.main', mr: 2 }} />
              <Typography variant="h3" component="h1" fontWeight="bold" sx={{ fontSize: { xs: '2rem', md: '3rem' } }}>
                {t('register_title')}
              </Typography>
            </Box>
              <Typography variant="h5" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
              {t('register_subtitle')}
            </Typography>
            
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.6, fontSize: { xs: '0.875rem', md: '1rem' } }}>
              {t('register_description')}
            </Typography>            {/* Feature highlights */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mb: { xs: 4, md: 0 } }}>              <Card elevation={0} sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider', flex: 1, minHeight: { xs: 'auto', md: '100%' } }}><CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <LibraryBooks sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h6" gutterBottom>
                    {t('register_feature_library')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('register_feature_library_desc')}
                  </Typography>
                </CardContent>
              </Card>
                <Card elevation={0} sx={{ bgcolor: 'background.paper', border: 1, borderColor: 'divider', flex: 1, minHeight: { xs: 'auto', md: '100%' } }}>                <CardContent sx={{ textAlign: 'center', py: 3 }}>
                  <Timeline sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h6" gutterBottom>
                    {t('register_feature_organize')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {t('register_feature_organize_desc')}
                  </Typography>
                </CardContent>
              </Card>
            </Stack>
          </Box>          {/* Right side - Register form */}
          <Box sx={{ 
            flex: 1, 
            maxWidth: { md: '40%', xs: '100%' }, 
            width: '100%',
            order: { xs: 2, md: 2 }
          }}>
            <Paper elevation={8} sx={{ 
              p: { xs: 4, md: 6 }, 
              borderRadius: 2, 
              maxWidth: 500, 
              mx: 'auto',
              bgcolor: 'background.paper'
            }}>              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <PersonAdd sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                <Typography variant="h4" component="h2" gutterBottom>
                  {t('register_create_account')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('register_join_community')}
                </Typography>
              </Box>
              
              <Box component="form" onSubmit={handleSubmit}>
                {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
                
                <TextField
                  fullWidth
                  label={t('register_name_label')}
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  margin="normal"
                  required
                  placeholder={t('register_name_placeholder')}
                />
                
                <TextField
                  fullWidth
                  label={t('register_email_label')}
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  margin="normal"
                  required
                  placeholder={t('register_email_placeholder')}
                />
                
                <TextField
                  fullWidth
                  label={t('register_password_label')}
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  margin="normal"
                  required
                  placeholder={t('register_password_placeholder')}
                />
                
                <TextField
                  fullWidth
                  label={t('register_confirm_password_label')}
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  margin="normal"
                  required
                  placeholder={t('register_confirm_password_placeholder')}
                />
                
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading}
                  size="large"
                  sx={{ mt: 3, mb: 3, py: 1.5 }}
                >
                  {loading ? t('register_button_loading') : t('register_button')}
                </Button>
                
                <Divider sx={{ my: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    {t('register_have_account')}
                  </Typography>
                </Divider>
                
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  onClick={() => router.push('/login')}
                  sx={{ py: 1.5 }}
                >
                  {t('register_login_link')}
                </Button>
              </Box>
            </Paper>
          </Box>
        </Box>
      </Container>
    </Box>
  )
}