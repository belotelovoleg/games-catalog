"use client"

import { useState, useEffect } from 'react'

interface FilterOptions {
  generations: { value: number; label: string }[]
  families: { value: number; label: string }[]
  types: { value: number; label: string }[]
}

export function usePlatformFilters() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFamily, setSelectedFamily] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [selectedGeneration, setSelectedGeneration] = useState('')
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null)

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedFamily('')
    setSelectedType('')
    setSelectedGeneration('')
  }

  const buildQueryParams = () => {
    const params = new URLSearchParams()
    if (searchTerm) params.append('search', searchTerm)
    if (selectedFamily) params.append('family', selectedFamily)
    if (selectedType) params.append('type', selectedType)
    if (selectedGeneration) params.append('generation', selectedGeneration)
    return params
  }

  const fetchFilterOptions = async () => {
    try {
      const response = await fetch('/api/platforms/browse/filters')
      if (response.ok) {
        const options = await response.json()
        setFilterOptions(options)
      }
    } catch (error) {
      console.error('Error fetching filter options:', error)
    }
  }

  return {
    // Filter state
    searchTerm,
    selectedFamily,
    selectedType,
    selectedGeneration,
    filterOptions,
    
    // Filter setters
    setSearchTerm,
    setSelectedFamily,
    setSelectedType,
    setSelectedGeneration,
    
    // Utility functions
    clearFilters,
    buildQueryParams,
    fetchFilterOptions
  }
}
