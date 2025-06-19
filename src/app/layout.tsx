"use client"

import { ReactNode } from 'react'
import { Box } from '@mui/material'
import { ThemeContextProvider } from '../contexts/ThemeContext'
import LeftMenu from './ui/LeftMenu'

export default function RootLayout({
  children,
}: {
  children: ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <ThemeContextProvider>
          <Box sx={{ position: 'relative' }}>
            <LeftMenu />
            <Box 
              component="main" 
              sx={{ 
                width: '100%',
                minHeight: '100vh',
                backgroundColor: 'background.default'
              }}
            >
              {children}
            </Box>
          </Box>
        </ThemeContextProvider>
      </body>
    </html>
  )
}