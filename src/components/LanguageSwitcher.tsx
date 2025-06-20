"use client"

import React from 'react'
import { 
  FormControl, 
  Select, 
  MenuItem, 
  SelectChangeEvent,
  Box,
  Typography
} from '@mui/material'
import { Language } from '@mui/icons-material'
import { useLanguage } from '../contexts/LanguageContext'

interface LanguageSwitcherProps {
  compact?: boolean;
}

const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ compact = false }) => {
  const { language, setLanguage } = useLanguage()
  const handleChange = (event: SelectChangeEvent) => {
    setLanguage(event.target.value)  }

  const getDisplayValue = () => {
    return language === 'en' ? 'English' : 'Українська'
  }
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      {!compact && <Language fontSize="small" />}
      <FormControl size="small" variant="outlined">
        <Select
          value={language}
          onChange={handleChange}
          renderValue={() => (
            <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
              {compact ? (language === 'en' ? 'EN' : 'UK') : (language === 'en' ? 'English' : 'Українська')}
            </Typography>
          )}          sx={{
            minWidth: compact ? 70 : 140,
            '& .MuiOutlinedInput-notchedOutline': {
              border: '1px solid',
              borderColor: 'divider'
            },
            '& .MuiSelect-select': {
              padding: compact ? '4px 8px' : '6px 12px'
            }
          }}        >          <MenuItem value="en">
            <Typography variant="body2">{compact ? 'EN' : 'English'}</Typography>
          </MenuItem>
          <MenuItem value="uk">
            <Typography variant="body2">{compact ? 'UK' : 'Українська'}</Typography>
          </MenuItem>
        </Select>
      </FormControl>
    </Box>
  )
}

export default LanguageSwitcher
