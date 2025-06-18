'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  Settings
} from '@mui/icons-material'

interface MenuGroup {
  title: string
  icon: React.ReactNode
  items: MenuItem[]
  defaultOpen?: boolean
}

interface MenuItem {
  label: string
  icon: React.ReactNode
  href: string
}

export default function LeftMenu() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(true)
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['admin'])

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
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const menuGroups: MenuGroup[] = [
    {
      title: 'Catalog Management',
      icon: <Collections />,
      defaultOpen: false,
      items: [
        { label: 'Browse Platforms', icon: <Search />, href: '/platforms/browse' },
        { label: 'My Collection', icon: <VideogameAsset />, href: '/collection' },
        { label: 'Search Games', icon: <Search />, href: '/games/search' },
      ]
    },
    {
      title: 'Admin',
      icon: <AdminPanelSettings />,
      defaultOpen: true,
      items: [
        { label: 'Console Management', icon: <Computer />, href: '/admin/consoles' },
        { label: 'Platform Browser', icon: <Dashboard />, href: '/admin/platform-browser' },
        { label: 'User Management', icon: <People />, href: '/admin/users' },
        { label: 'IGDB Sync Manager', icon: <Settings />, href: '/admin/igdb-sync' },
      ]
    }
  ]

  return (
    <>
      {/* Toggle Button - Fixed position */}
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
      </IconButton>

      <Drawer
        variant="persistent"
        open={isOpen}
        sx={{
          width: isOpen ? 280 : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
            backgroundColor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider',
            transition: 'width 0.3s ease',
          },
        }}
      >
        {/* Header */}
        <Box sx={{ p: 2, pt: 8, backgroundColor: 'primary.main', color: 'primary.contrastText' }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
            <VideogameAsset />
            Gaming Catalog
          </Typography>
        </Box>

        {/* Menu Groups */}
        <Box sx={{ overflow: 'auto', flexGrow: 1 }}>
          <List disablePadding>
            {menuGroups.map((group) => {
              const isExpanded = expandedGroups.includes(group.title)
              
              return (
                <Box key={group.title}>
                  {/* Group Header */}
                  <ListItem disablePadding>
                    <ListItemButton onClick={() => toggleGroup(group.title)} sx={{ py: 1.5 }}>
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
        </Box>

        {/* Logout */}
        <Box sx={{ borderTop: 1, borderColor: 'divider' }}>
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
