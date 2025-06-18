"use client"

import { createTheme, ThemeProvider } from '@mui/material/styles'
import { CssBaseline, Box } from '@mui/material'
import { ReactNode } from 'react'
import LeftMenu from './ui/LeftMenu'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
})

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <Box sx={{ display: 'flex' }}>
            <LeftMenu />
            <Box 
              component="main" 
              sx={{ 
                flexGrow: 1,
                transition: 'margin 0.3s ease',
                minHeight: '100vh',
                backgroundColor: 'background.default'
              }}
            >
              {children}
            </Box>
          </Box>
        </ThemeProvider>
      </body>
    </html>
  )
}