# Game List Components Usage Examples

## Components Created
- `GameCardList.tsx` - Mobile/responsive card layout
- `GameTableList.tsx` - Desktop table layout
- `GameListFilters.tsx` - Reusable search and filter UI
- `useGameFilters.ts` - Custom hook for filter logic

## Game List Components Props
Both `GameCardList` and `GameTableList` accept:
- `games: GameWithIgdbDetails[]` - Array of games to display
- `onGameClick: (game) => void` - Callback when a game is clicked
- `onDeleteGame: (gameId) => void` - Callback when delete button is clicked  
- `showPlatform?: boolean` - Whether to show platform information (default: false)

## GameListFilters Component Props
- `searchQuery: string` - Current search query
- `onSearchChange: (query: string) => void` - Search input change handler
- `selectedStatus: string` - Currently selected status filter
- `onStatusChange: (status: string) => void` - Status filter change handler
- `selectedGenre: string` - Currently selected genre filter
- `onGenreChange: (genre: string) => void` - Genre filter change handler
- `selectedFranchise: string` - Currently selected franchise filter
- `onFranchiseChange: (franchise: string) => void` - Franchise filter change handler
- `selectedCompany: string` - Currently selected company filter
- `onCompanyChange: (company: string) => void` - Company filter change handler
- `selectedMultiplayer: string` - Currently selected multiplayer filter
- `onMultiplayerChange: (mode: string) => void` - Multiplayer filter change handler
- `selectedPlatform?: string` - Currently selected platform filter (optional)
- `onPlatformChange?: (platform: string) => void` - Platform filter change handler (optional)
- `availableGenres: string[]` - Available genre options
- `availableFranchises: string[]` - Available franchise options
- `availableCompanies: string[]` - Available company options
- `availableMultiplayerModes: string[]` - Available multiplayer mode options
- `availablePlatforms?: Array<{ id: number; name: string; abbreviation?: string }>` - Available platform options (optional)
- `onClearAll: () => void` - Clear all filters handler
- `showPlatformFilter?: boolean` - Whether to show platform filter (default: false)

## useGameFilters Hook
Returns:
- All filter states and setters
- `filteredGames` - Games after applying all filters
- Filter options extracted from games data
- `clearAllFilters()` - Function to reset all filters

## Usage Examples

### 1. Platform-specific page (current usage)
```tsx
// Show games for a specific platform - no need to show platform column/filter
<GameTableList
  games={filteredGames}
  onGameClick={handleGameClick}
  onDeleteGame={handleDeleteGame}
  showPlatform={false}  // Platform is known from context
/>
```

### 2. Homepage - All user games with filters
```tsx
import { useGameFilters } from '../hooks/useGameFilters'
import GameListFilters from '../components/GameListFilters'
import GameTableList from '../components/GameTableList'

function HomePage() {
  const [allUserGames, setAllUserGames] = useState([])
  
  const {
    searchQuery,
    setSearchQuery,
    selectedStatus,
    setSelectedStatus,
    selectedGenre,
    setSelectedGenre,
    selectedFranchise,
    setSelectedFranchise,
    selectedCompany,
    setSelectedCompany,
    selectedMultiplayer,
    setSelectedMultiplayer,
    selectedPlatform,
    setSelectedPlatform,
    availableGenres,
    availableFranchises,
    availableCompanies,
    availableMultiplayerModes,
    availablePlatforms,
    filteredGames,
    clearAllFilters
  } = useGameFilters(allUserGames)

  return (
    <Container>
      <GameListFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedStatus={selectedStatus}
        onStatusChange={setSelectedStatus}
        selectedGenre={selectedGenre}
        onGenreChange={setSelectedGenre}
        selectedFranchise={selectedFranchise}
        onFranchiseChange={setSelectedFranchise}
        selectedCompany={selectedCompany}
        onCompanyChange={setSelectedCompany}
        selectedMultiplayer={selectedMultiplayer}
        onMultiplayerChange={setSelectedMultiplayer}
        selectedPlatform={selectedPlatform}
        onPlatformChange={setSelectedPlatform}
        availableGenres={availableGenres}
        availableFranchises={availableFranchises}
        availableCompanies={availableCompanies}
        availableMultiplayerModes={availableMultiplayerModes}
        availablePlatforms={availablePlatforms}
        onClearAll={clearAllFilters}
        showPlatformFilter={true}  // Show platform filter on homepage
      />
      
      <GameTableList
        games={filteredGames}
        onGameClick={handleGameClick}
        onDeleteGame={handleDeleteGame}
        showPlatform={true}   // Show platform column on homepage
      />
    </Container>
  )
}
```

### 3. Search results across platforms
```tsx
// Search results might contain games from different platforms
<GameCardList
  games={searchResults}
  onGameClick={handleGameClick}
  onDeleteGame={handleDeleteGame}
  showPlatform={true}   // User needs to see which platform
/>
```

## Data Structure Requirements

When `showPlatform={true}`, games need to include platform data:

```tsx
interface UserGame {
  // ... existing fields ...
  platform?: {
    id: number
    name: string
    abbreviation?: string
    platform_logo_base64?: string
  }
}
```

# Reusable Components Usage Examples

This document outlines the usage of extracted reusable components for both game lists and platform browsing.

## Game List Components

### Components Created
- `GameCardList.tsx` - Mobile/responsive card layout
- `GameTableList.tsx` - Desktop table layout
- `GameListFilters.tsx` - Reusable search and filter UI
- `useGameFilters.ts` - Custom hook for filter logic

## Platform List Components

### Components Created
- `PlatformCardGrid.tsx` - Grid layout for platform cards
- `PlatformListFilters.tsx` - Reusable platform search and filter UI
- `usePlatformFilters.ts` - Custom hook for platform filter logic

### PlatformCardGrid Props
- `platforms: Platform[]` - Array of platforms to display
- `userPlatforms: UserPlatform[]` - User's owned/wishlisted platforms
- `platformLoading: Record<number, 'adding' | 'removing' | null>` - Loading states
- `onPlatformClick: (platformId: number) => void` - Callback when platform card is clicked
- `onShowDetails: (platformId: number, e: React.MouseEvent) => void` - Callback for details button
- `onAddPlatform: (platformId: number, status: 'OWNED' | 'WISHLISTED') => void` - Add platform callback
- `onRemovePlatform: (platformId: number) => void` - Remove platform callback

### PlatformListFilters Props
- `searchTerm: string` - Current search term
- `selectedGeneration: string` - Selected generation filter
- `selectedFamily: string` - Selected family filter
- `selectedType: string` - Selected type filter
- `filterOptions: FilterOptions | null` - Available filter options
- `resultCount: number` - Number of results
- `onSearchChange: (value: string) => void` - Search change handler
- `onGenerationChange: (value: string) => void` - Generation filter change handler
- `onFamilyChange: (value: string) => void` - Family filter change handler
- `onTypeChange: (value: string) => void` - Type filter change handler
- `onClearFilters: () => void` - Clear all filters handler

### usePlatformFilters Hook
Returns:
- All filter states and setters (`searchTerm`, `selectedFamily`, etc.)
- `filterOptions` - Available filter options from API
- `clearFilters()` - Function to reset all filters
- `buildQueryParams()` - Function to build URL params from filters
- `fetchFilterOptions()` - Function to load filter options from API

## Platform Data Types

```tsx
interface Platform {
  id: number
  name: string
  versionName?: string
  abbreviation?: string
  alternative_name?: string
  generation?: number
  familyName?: string
  typeName?: string
  imageUrl?: string
  description?: string
}

interface UserPlatform {
  id: number
  platform: Platform
  status: 'OWNED' | 'WISHLISTED'
}

interface FilterOptions {
  generations: { value: number; label: string }[]
  families: { value: number; label: string }[]
  types: { value: number; label: string }[]
}
```

## Platform Browse Usage Example

```tsx
import { useState, useEffect } from 'react'
import PlatformListFilters from '../components/PlatformListFilters'
import PlatformCardGrid from '../components/PlatformCardGrid'
import { usePlatformFilters } from '../hooks/usePlatformFilters'

function PlatformBrowse() {
  const [platforms, setPlatforms] = useState([])
  const [userPlatforms, setUserPlatforms] = useState([])
  const [platformLoading, setPlatformLoading] = useState({})
  
  const {
    searchTerm,
    selectedFamily,
    selectedType,
    selectedGeneration,
    filterOptions,
    setSearchTerm,
    setSelectedFamily,
    setSelectedType,
    setSelectedGeneration,
    clearFilters,
    buildQueryParams,
    fetchFilterOptions
  } = usePlatformFilters()

  const fetchPlatforms = async () => {
    const params = buildQueryParams()
    const response = await fetch(`/api/platforms/browse?${params.toString()}`)
    // Handle response...
  }

  const handleAddPlatform = async (platformId, status) => {
    // Add platform logic...
  }

  const handleRemovePlatform = async (platformId) => {
    // Remove platform logic...
  }

  return (
    <Container>
      <PlatformListFilters
        searchTerm={searchTerm}
        selectedGeneration={selectedGeneration}
        selectedFamily={selectedFamily}
        selectedType={selectedType}
        filterOptions={filterOptions}
        resultCount={platforms.length}
        onSearchChange={setSearchTerm}
        onGenerationChange={setSelectedGeneration}
        onFamilyChange={setSelectedFamily}
        onTypeChange={setSelectedType}
        onClearFilters={clearFilters}
      />
      
      <PlatformCardGrid
        platforms={platforms}
        userPlatforms={userPlatforms}
        platformLoading={platformLoading}
        onPlatformClick={(id) => router.push(`/platforms/${id}`)}
        onShowDetails={handleShowDetails}
        onAddPlatform={handleAddPlatform}
        onRemovePlatform={handleRemovePlatform}
      />
    </Container>
  )
}
```

## Summary

This refactoring successfully extracted reusable components for both game lists and platform browsing:

### Benefits Achieved

1. **Reusable Components**: All UI components are now render-only and can be reused across different pages
2. **Separation of Concerns**: Interactive logic is separated from presentation logic
3. **Consistent UX**: Same filter behavior and styling across the app
4. **Type Safety**: Full TypeScript interfaces ensure consistent prop usage
5. **Easy Maintenance**: Changes to UI or logic happen in one place

### Files Created/Modified

#### Game List Components
- `src/app/components/GameCardList.tsx` - Render-only card layout
- `src/app/components/GameTableList.tsx` - Render-only table layout  
- `src/app/components/GameListFilters.tsx` - Render-only filter UI
- `src/app/hooks/useGameFilters.ts` - Reusable filter logic
- `src/app/platforms/[id]/page.tsx` - Refactored to use new components

#### Platform Browse Components  
- `src/app/components/PlatformCardGrid.tsx` - Render-only platform grid
- `src/app/components/PlatformListFilters.tsx` - Render-only platform filters
- `src/app/hooks/usePlatformFilters.ts` - Reusable platform filter logic
- `src/app/platforms/browse/page.tsx` - Refactored to use new components

All components compile successfully and maintain full functionality while being completely reusable across the application.
