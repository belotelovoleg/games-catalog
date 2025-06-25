"use client"

import {
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Chip,
  Paper,
  Typography
} from '@mui/material'
import { useLanguage } from '../../contexts/LanguageContext'

interface FilterOptions {
  generations: { value: number; label: string }[]
  families: { value: number; label: string }[]
  types: { value: number; label: string }[]
}

interface PlatformListFiltersProps {
  searchTerm: string
  selectedGeneration: string
  selectedFamily: string
  selectedType: string
  filterOptions: FilterOptions | null
  resultCount: number
  onSearchChange: (value: string) => void
  onGenerationChange: (value: string) => void
  onFamilyChange: (value: string) => void
  onTypeChange: (value: string) => void
  onClearFilters: () => void
}

export default function PlatformListFilters({
  searchTerm,
  selectedGeneration,
  selectedFamily,
  selectedType,
  filterOptions,
  resultCount,
  onSearchChange,
  onGenerationChange,
  onFamilyChange,
  onTypeChange,
  onClearFilters
}: PlatformListFiltersProps) {
  const { t } = useLanguage()

  return (    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>
        {t('platformfilter_title')}
      </Typography>
      <Grid container spacing={2} alignItems="center">
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <TextField
            fullWidth
            label={t('platformfilter_search_placeholder')}
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>{t('platformfilter_generation_label')}</InputLabel>
            <Select
              value={selectedGeneration}
              label={t('platformfilter_generation_label')}
              onChange={(e) => onGenerationChange(e.target.value)}
            >
              <MenuItem value="">{t('platformfilter_generation_all')}</MenuItem>
              {filterOptions?.generations.map((gen) => (
                <MenuItem key={gen.value} value={gen.value.toString()}>
                  {gen.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>{t('platformfilter_family_label')}</InputLabel>
            <Select
              value={selectedFamily}
              label={t('platformfilter_family_label')}
              onChange={(e) => onFamilyChange(e.target.value)}
            >
              <MenuItem value="">{t('platformfilter_family_all')}</MenuItem>
              {filterOptions?.families.map((family) => (
                <MenuItem key={family.value} value={family.value.toString()}>
                  {family.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <FormControl fullWidth size="small">
            <InputLabel>{t('platformfilter_type_label')}</InputLabel>
            <Select
              value={selectedType}
              label={t('platformfilter_type_label')}
              onChange={(e) => onTypeChange(e.target.value)}
            >
              <MenuItem value="">{t('platformfilter_type_all')}</MenuItem>
              {filterOptions?.types.map((type) => (
                <MenuItem key={type.value} value={type.value.toString()}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <Button 
            variant="outlined" 
            onClick={onClearFilters}
            sx={{ mr: 1 }}
          >
            {t('platformfilter_clear_filters')}
          </Button>          <Chip 
            label={`${resultCount} ${t('platformfilter_platforms_count')}`}
            color="primary" 
            variant="outlined" 
          />
        </Grid>
      </Grid>
    </Paper>
  )
}
