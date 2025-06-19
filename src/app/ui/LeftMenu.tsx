'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { jwtDecode } from 'jwt-decode'
import { useTheme as useCustomTheme } from '../../contexts/ThemeContext'
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Collapse,
  Typography,
  Box,
  Divider,
  IconButton,
  Tooltip
} from '@mui/material'
import {
  Dashboard,
  VideogameAsset,
  AdminPanelSettings,
  ExpandLess,
  ExpandMore,
  Logout,
  People,
  Search,
  Collections,
  Computer,
  Menu,
  MenuOpen,
  Settings,
  Brightness4,
  Brightness7
} from '@mui/icons-material'

interface DecodedToken {
  id: number
  email: string
  isAdmin: boolean
}

interface MenuGroup {
  title: string
  icon: React.ReactNode
  items: MenuItem[]
  defaultOpen?: boolean
  adminOnly?: boolean
}

interface MenuItem {
  label: string
  icon: React.ReactNode
  href: string
  adminOnly?: boolean
}

export default function LeftMenu() {
  const router = useRouter()
  const { mode, toggleTheme } = useCustomTheme()
  const [isOpen, setIsOpen] = useState(true)
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['catalog'])
  const [user, setUser] = useState<DecodedToken | null>(null)
  useEffect(() => {
    const token = Cookies.get('token')
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token)
        setUser(decoded)
        // Expand admin section if user is admin
        if (decoded.isAdmin && !expandedGroups.includes('admin')) {
          setExpandedGroups(prev => [...prev, 'admin'])
        }
      } catch (error) {
        console.error('Token validation error:', error)
        setUser(null)
      }
    } else {
      setUser(null)
    }
  }, [])

  // Add an interval to periodically check for token changes
  useEffect(() => {
    const checkTokenPeriodically = setInterval(() => {
      const currentToken = Cookies.get('token')
      const hasToken = !!currentToken
      const hasUser = !!user
      
      // If token state changed (logged in/out), update user state
      if (hasToken && !hasUser) {
        try {
          const decoded = jwtDecode<DecodedToken>(currentToken)
          setUser(decoded)
        } catch (error) {
          console.error('Token decode error:', error)
          setUser(null)
        }
      } else if (!hasToken && hasUser) {
        setUser(null)
      }
    }, 1000) // Check every second

    return () => clearInterval(checkTokenPeriodically)
  }, [user])

  const toggleMenu = () => {
    setIsOpen(!isOpen)
  }

  const toggleGroup = (groupTitle: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupTitle)
        ? prev.filter(g => g !== groupTitle)
        : [...prev, groupTitle]
    )
  }
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      Cookies.remove('token')
      setUser(null)
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const menuGroups: MenuGroup[] = [
    {
      title: 'Catalog',
      icon: <Collections />,
      defaultOpen: true,
      items: [
        { label: 'Browse Platforms', icon: <Search />, href: '/platforms/browse' },
        { label: 'My Collection', icon: <VideogameAsset />, href: '/collection' },
        { label: 'Search Games', icon: <Search />, href: '/games/search' },
      ]
    },
    {
      title: 'Admin',
      icon: <AdminPanelSettings />,
      defaultOpen: false,
      adminOnly: true,
      items: [
        { label: 'Platform Management', icon: <Dashboard />, href: '/admin/platforms', adminOnly: true },
        { label: 'User Management', icon: <People />, href: '/admin/users', adminOnly: true },
        { label: 'IGDB Sync Manager', icon: <Settings />, href: '/admin/igdb-sync', adminOnly: true },
      ]
    }
  ]

  // Filter menu groups and items based on user permissions
  const visibleMenuGroups = menuGroups.filter(group => {
    if (group.adminOnly && (!user || !user.isAdmin)) return false
    return true
  }).map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (item.adminOnly && (!user || !user.isAdmin)) return false
      return true
    })
  }))  // Don't show menu if not logged in
  if (!user) {
    return null
  }

  return (
    <>      {/* Toggle Button - Fixed position */}
      <IconButton
        onClick={toggleMenu}
        sx={{
          position: 'fixed',
          top: 16,
          left: isOpen ? 264 : 16,
          zIndex: 1300,
          backgroundColor: 'primary.main',
          color: 'primary.contrastText',
          '&:hover': {
            backgroundColor: 'primary.dark',
          },
          transition: 'left 0.3s ease',
          boxShadow: 2,
        }}
      >
        {isOpen ? <MenuOpen /> : <Menu />}
      </IconButton>      <Drawer
        variant="temporary"
        open={isOpen}
        onClose={() => setIsOpen(false)}
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
            backgroundColor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, pt: 8, backgroundColor: 'primary.main', color: 'primary.contrastText' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
            <VideogameAsset />
            Gaming Catalog
          </Typography>
        </Box>        {/* Menu Groups */}
        <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
          <List disablePadding>
            {visibleMenuGroups.map((group) => {
              const isExpanded = expandedGroups.includes(group.title.toLowerCase())
              
              return (
                <Box key={group.title}>
                  {/* Group Header */}
                  <ListItem disablePadding>
                    <ListItemButton onClick={() => toggleGroup(group.title.toLowerCase())} sx={{ py: 1.5 }}>
                      <ListItemIcon sx={{ minWidth: 40 }}>
                        {group.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={group.title} 
                        primaryTypographyProps={{ 
                          variant: 'subtitle2', 
                          fontWeight: 'medium',
                          color: 'text.secondary'
                        }} 
                      />
                      {isExpanded ? <ExpandLess /> : <ExpandMore />}
                    </ListItemButton>
                  </ListItem>

                  {/* Group Items */}
                  <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                    <List component="div" disablePadding>
                      {group.items.map((item, index) => (
                        <ListItem key={index} disablePadding>
                          <Tooltip title={item.label} placement="right">
                            <ListItemButton 
                              component={Link} 
                              href={item.href} 
                              sx={{ pl: 4, py: 1 }}
                            >
                              <ListItemIcon sx={{ minWidth: 36 }}>
                                {item.icon}
                              </ListItemIcon>
                              <ListItemText 
                                primary={item.label}
                                primaryTypographyProps={{ variant: 'body2' }}
                              />
                            </ListItemButton>
                          </Tooltip>
                        </ListItem>
                      ))}
                    </List>
                  </Collapse>
                  <Divider />
                </Box>
              )
            })}
          </List>
        </Box>        {/* Theme Switcher & Logout */}
        <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
          <ListItem disablePadding>
            <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`} placement="right">
              <ListItemButton onClick={toggleTheme} sx={{ py: 1.5 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {mode === 'light' ? <Brightness4 /> : <Brightness7 />}
                </ListItemIcon>
                <ListItemText 
                  primary={`${mode === 'light' ? 'Dark' : 'Light'} Mode`}
                  primaryTypographyProps={{ 
                    variant: 'subtitle2',
                    color: 'text.primary'
                  }}
                />
              </ListItemButton>
            </Tooltip>
          </ListItem>
          
          <ListItem disablePadding>
            <Tooltip title="Logout" placement="right">
              <ListItemButton onClick={handleLogout} sx={{ py: 1.5 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Logout color="error" />
                </ListItemIcon>
                <ListItemText 
                  primary="Logout" 
                  primaryTypographyProps={{ 
                    variant: 'subtitle2',
                    color: 'error.main'
                  }}
                />
              </ListItemButton>
            </Tooltip>
          </ListItem>
        </Box>
      </Drawer>
    </>
  )
}
