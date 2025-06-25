import {
  Box,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Paper,
  useTheme
} from '@mui/material'
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material'
import { useLanguage } from '../../contexts/LanguageContext'

interface GameListFiltersProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  selectedStatus: string
  onStatusChange: (status: string) => void
  selectedGenre: string
  onGenreChange: (genre: string) => void
  selectedFranchise: string
  onFranchiseChange: (franchise: string) => void
  selectedCompany: string
  onCompanyChange: (company: string) => void
  selectedMultiplayer: string
  onMultiplayerChange: (mode: string) => void
  selectedPlatform?: string
  onPlatformChange?: (platform: string) => void
  availableGenres: string[]
  availableFranchises: string[]
  availableCompanies: string[]
  availableMultiplayerModes: string[]
  availablePlatforms?: Array<{ id: number; name: string; abbreviation?: string }>
  onClearAll: () => void
  showPlatformFilter?: boolean
}

export default function GameListFilters({
  searchQuery,
  onSearchChange,
  selectedStatus,
  onStatusChange,
  selectedGenre,
  onGenreChange,
  selectedFranchise,
  onFranchiseChange,
  selectedCompany,
  onCompanyChange,
  selectedMultiplayer,
  onMultiplayerChange,
  selectedPlatform = '',
  onPlatformChange,
  availableGenres,
  availableFranchises,
  availableCompanies,
  availableMultiplayerModes,
  availablePlatforms = [],
  onClearAll,
  showPlatformFilter = false
}: GameListFiltersProps) {
  const theme = useTheme()
  const { t } = useLanguage()

  const hasActiveFilters = Boolean(
    searchQuery ||
    selectedStatus ||
    selectedGenre ||
    selectedFranchise ||
    selectedCompany ||
    selectedMultiplayer ||
    selectedPlatform
  )

  return (
    <Paper sx={{ p: 2, mb: 3, backgroundColor: theme.palette.mode === 'dark' ? 'grey.800' : 'background.paper' }}>
      <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' }, flexWrap: 'wrap' }}>        {/* Search Field */}
        <TextField
          fullWidth
          variant="outlined"
          placeholder={t('gamefilter_search_placeholder')}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            endAdornment: searchQuery && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => onSearchChange('')}
                  edge="end"
                >
                  <ClearIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              backgroundColor: theme.palette.mode === 'dark' ? 'grey.900' : 'background.default',
            },
            flex: { xs: '1', md: '2' }
          }}
        />

        {/* Filter Controls */}
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', flex: { xs: '1', md: '3' } }}>          {/* Status Filter */}
          <FormControl sx={{ minWidth: 100, flex: 1 }}>
            <InputLabel size="small">{t('gamefilter_status_label')}</InputLabel>
            <Select
              size="small"
              value={selectedStatus}
              label={t('gamefilter_status_label')}
              onChange={(e) => onStatusChange(e.target.value)}
              sx={{
                backgroundColor: theme.palette.mode === 'dark' ? 'grey.900' : 'background.default',
              }}
            >
              <MenuItem value="">
                <em>{t('gamefilter_status_all')}</em>
              </MenuItem>
              <MenuItem value="OWNED">{t('gamefilter_status_owned')}</MenuItem>
              <MenuItem value="WISHLISTED">{t('gamefilter_status_wishlisted')}</MenuItem>
            </Select>
          </FormControl>          {/* Platform Filter (only shown when showPlatformFilter is true) */}
          {showPlatformFilter && availablePlatforms.length > 0 && (
            <FormControl sx={{ minWidth: 120, flex: 1 }}>
              <InputLabel size="small">{t('gamefilter_platform_label')}</InputLabel>
              <Select
                size="small"
                value={selectedPlatform}
                label={t('gamefilter_platform_label')}
                onChange={(e) => onPlatformChange?.(e.target.value)}
                sx={{
                  backgroundColor: theme.palette.mode === 'dark' ? 'grey.900' : 'background.default',
                }}
              >
                <MenuItem value="">
                  <em>{t('gamefilter_platform_all')}</em>
                </MenuItem>
                {availablePlatforms.map((platform) => (
                  <MenuItem key={platform.id} value={platform.id.toString()}>
                    {platform.abbreviation || platform.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}          {/* Genre Filter */}
          {availableGenres.length > 0 && (
            <FormControl sx={{ minWidth: 120, flex: 1 }}>
              <InputLabel size="small">{t('gamefilter_genre_label')}</InputLabel>
              <Select
                size="small"
                value={selectedGenre}
                label={t('gamefilter_genre_label')}
                onChange={(e) => onGenreChange(e.target.value)}
                sx={{
                  backgroundColor: theme.palette.mode === 'dark' ? 'grey.900' : 'background.default',
                }}
              >
                <MenuItem value="">
                  <em>{t('gamefilter_genre_all')}</em>
                </MenuItem>
                {availableGenres.map((genre) => (
                  <MenuItem key={genre} value={genre}>
                    {genre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}          {/* Franchise Filter */}
          {availableFranchises.length > 0 && (
            <FormControl sx={{ minWidth: 120, flex: 1 }}>
              <InputLabel size="small">{t('gamefilter_franchise_label')}</InputLabel>
              <Select
                size="small"
                value={selectedFranchise}
                label={t('gamefilter_franchise_label')}
                onChange={(e) => onFranchiseChange(e.target.value)}
                sx={{
                  backgroundColor: theme.palette.mode === 'dark' ? 'grey.900' : 'background.default',
                }}
              >
                <MenuItem value="">
                  <em>{t('gamefilter_franchise_all')}</em>
                </MenuItem>
                {availableFranchises.map((franchise) => (
                  <MenuItem key={franchise} value={franchise}>
                    {franchise}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}          {/* Company Filter */}
          {availableCompanies.length > 0 && (
            <FormControl sx={{ minWidth: 120, flex: 1 }}>
              <InputLabel size="small">{t('gamefilter_company_label')}</InputLabel>
              <Select
                size="small"
                value={selectedCompany}
                label={t('gamefilter_company_label')}
                onChange={(e) => onCompanyChange(e.target.value)}
                sx={{
                  backgroundColor: theme.palette.mode === 'dark' ? 'grey.900' : 'background.default',
                }}
              >
                <MenuItem value="">
                  <em>{t('gamefilter_company_all')}</em>
                </MenuItem>
                {availableCompanies.map((company) => (
                  <MenuItem key={company} value={company}>
                    {company}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}          {/* Multiplayer Filter */}
          {availableMultiplayerModes.length > 0 && (
            <FormControl sx={{ minWidth: 120, flex: 1 }}>
              <InputLabel size="small">{t('gamefilter_multiplayer_label')}</InputLabel>
              <Select
                size="small"
                value={selectedMultiplayer}
                label={t('gamefilter_multiplayer_label')}
                onChange={(e) => onMultiplayerChange(e.target.value)}
                sx={{
                  backgroundColor: theme.palette.mode === 'dark' ? 'grey.900' : 'background.default',
                }}
              >
                <MenuItem value="">
                  <em>{t('gamefilter_multiplayer_all')}</em>
                </MenuItem>
                {availableMultiplayerModes.map((mode) => (
                  <MenuItem key={mode} value={mode}>
                    {mode}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>        {/* Clear All Filters Button */}
        {hasActiveFilters && (
          <Button
            variant="outlined"
            size="small"
            onClick={onClearAll}
            sx={{ whiteSpace: 'nowrap' }}
          >
            {t('gamefilter_clear_all')}
          </Button>
        )}
      </Box>
    </Paper>
  )
}
