'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Cookies from 'js-cookie'
import { jwtDecode } from 'jwt-decode'
import { useTheme as useCustomTheme } from '../../contexts/ThemeContext'
import { useLanguage } from '../../contexts/LanguageContext'
import LanguageSwitcher from '../../components/LanguageSwitcher'
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
}from '@mui/material'
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
  Brightness7,
  Language
}from '@mui/icons-material'

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
  const { t } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['catalog'])
  const [user, setUser] = useState<DecodedToken | null>(null)
  const toggleButtonRef = useRef<HTMLButtonElement>(null)
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

  const handleDrawerClose = () => {
    setIsOpen(false)
    // Move focus back to the toggle button to prevent accessibility issues
    setTimeout(() => {
      if (toggleButtonRef.current) {
        toggleButtonRef.current.focus()
      }
    }, 100)
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
    }  }
  
  const menuGroups: MenuGroup[] = [
    {
      title: t('leftmenu_group_catalog'),
      icon: <Collections />,
      defaultOpen: true,
      items: [
        { label: t('leftmenu_item_gamecatalog'), icon: <VideogameAsset />, href: '/' },
      ]
    },
    {
      title: t('leftmenu_group_admin'),
      icon: <AdminPanelSettings />,
      defaultOpen: false,
      adminOnly: true,
      items: [
        { label: t('leftmenu_item_platforms'), icon: <Dashboard />, href: '/admin/platforms', adminOnly: true },
        { label: t('leftmenu_item_users'), icon: <People />, href: '/admin/users', adminOnly: true },
        { label: t('leftmenu_item_igdbsync'), icon: <Settings />, href: '/admin/igdb-sync', adminOnly: true },
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
    <>      {/* Toggle Button - Fixed position */}      <IconButton
        ref={toggleButtonRef}
        onClick={toggleMenu}
        aria-label={t('leftmenu_tooltip_menu')}
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
        onClose={handleDrawerClose}
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
      >        {/* Header */}
        <Box sx={{ p: 2, pt: 8, backgroundColor: 'primary.main', color: 'primary.contrastText' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
            <VideogameAsset />
            {t('leftmenu_app_title')}
          </Typography>
        </Box>{/* Menu Groups */}
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
        <Box sx={{ borderTop: 1, borderColor: 'divider' }}>          {/* Language Switcher */}
          <ListItem disablePadding>
            <ListItemButton sx={{ py: 1.5 }}>
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Language color="primary" />
                </Box>
              </ListItemIcon>              <ListItemText 
                primary={t('language_title')}
                primaryTypographyProps={{ 
                  variant: 'subtitle2',
                  color: 'text.primary'
                }}
              />
              <Box>
                <LanguageSwitcher compact />
              </Box>
            </ListItemButton>
          </ListItem>          <ListItem disablePadding>            <Tooltip title={t(mode === 'light' ? 'leftmenu_tooltip_theme_dark' : 'leftmenu_tooltip_theme_light')} placement="right">
              <ListItemButton onClick={toggleTheme} sx={{ py: 1.5 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  {mode === 'light' ? <Brightness4 /> : <Brightness7 />}
                </ListItemIcon>
                <ListItemText 
                  primary={t(mode === 'light' ? 'theme_dark' : 'theme_light')}
                  primaryTypographyProps={{ 
                    variant: 'subtitle2',
                    color: 'text.primary'
                  }}
                />
              </ListItemButton>
            </Tooltip>
          </ListItem>
            <ListItem disablePadding>
            <Tooltip title={t('leftmenu_tooltip_logout')} placement="right">
              <ListItemButton onClick={handleLogout} sx={{ py: 1.5 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Logout color="error" />
                </ListItemIcon>
                <ListItemText 
                  primary={t('leftmenu_action_logout')} 
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
