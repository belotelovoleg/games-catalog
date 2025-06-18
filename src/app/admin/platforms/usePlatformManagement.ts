"use client"

import { useState, useCallback } from 'react'
import { IgdbPlatform, IgdbPlatformVersion } from './types'

export function usePlatformManagement() {
    const [platforms, setPlatforms] = useState<IgdbPlatform[]>([])
    const [platformVersions, setPlatformVersions] = useState<IgdbPlatformVersion[]>([])
    const [selectedPlatform, setSelectedPlatform] = useState<IgdbPlatform | null>(null)
    const [selectedVersion, setSelectedVersion] = useState<IgdbPlatformVersion | null>(null)
    const [platformImage, setPlatformImage] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [notification, setNotification] = useState<{
        open: boolean
        message: string
        severity: 'success' | 'error' | 'info' | 'warning'
    }>({
        open: false,
        message: '',
        severity: 'info'    })

    const showNotification = useCallback((message: string, severity: 'success' | 'error' | 'info' | 'warning') => {
        setNotification({ open: true, message, severity })
    }, [])

    const hideNotification = useCallback(() => {
        setNotification(prev => ({ ...prev, open: false }))
    }, [])

    const fetchPlatforms = useCallback(async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/admin/igdb-platforms')
            if (response.ok) {
                const data = await response.json()
                setPlatforms(data)
            }        } catch (error) {
            console.error('Error fetching platforms:', error)
        } finally {
            setLoading(false)
        }
    }, [])

    const fetchPlatformVersions = useCallback(async (platform: IgdbPlatform) => {
        try {
            if (!platform.versions) {
                return []
            }
            
            const versionIds = JSON.parse(platform.versions)
            if (!Array.isArray(versionIds) || versionIds.length === 0) {
                return []
            }
            
            const response = await fetch(`/api/admin/platform-versions?versionIds=${encodeURIComponent(JSON.stringify(versionIds))}`)
            if (response.ok) {
                const data = await response.json()
                setPlatformVersions(data)
                return data
            }
        } catch (error) {
            console.error('Error fetching platform versions:', error)
        }
        return []
    }, [])

    const fetchPlatformImage = useCallback(async (logoId: number) => {
        try {
            const response = await fetch(`/api/admin/igdb-images?logoId=${logoId}`)
            if (response.ok) {
                const data = await response.json()
                setPlatformImage(data.imageUrl)
                return data.imageUrl
            }
        } catch (error) {
            console.error('Error fetching platform image:', error)
            setPlatformImage(null)
        }        return null
    }, [])

    const selectPlatform = useCallback(async (platform: IgdbPlatform) => {
        setSelectedPlatform(platform)
        setSelectedVersion(null)
        setPlatformImage(null)

        if (platform.hasVersions) {
            await fetchPlatformVersions(platform)
            return { hasVersions: true }
        } else {
            if (platform.platform_logo) {
                await fetchPlatformImage(platform.platform_logo)
            }
            return { hasVersions: false }
        }
    }, [fetchPlatformVersions, fetchPlatformImage])

    const selectVersion = useCallback(async (version: IgdbPlatformVersion) => {
        setSelectedVersion(version)
        setPlatformImage(null)

        if (version.platform_logo) {
            await fetchPlatformImage(version.platform_logo)
        }
    }, [fetchPlatformImage])

    const clearSelection = useCallback(() => {
        setSelectedPlatform(null)
        setSelectedVersion(null)
        setPlatformImage(null)
        setPlatformVersions([])
    }, [])

    const addSelectedPlatform = useCallback(async () => {
        if (!selectedPlatform) {
            console.error('No platform selected')
            return
        }

        try {
            const payload = {
                igdbPlatformId: selectedPlatform.igdbId,
                igdbPlatformVersionId: selectedVersion?.igdbId,
                includeBase64Logo: true // Store logo as base64 to avoid API calls
            }

            const response = await fetch('/api/admin/platforms/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(payload)
            })

            const result = await response.json()

            if (response.ok) {
                console.log('Platform added successfully:', result.platform)
                clearSelection()
                showNotification(`Platform "${result.platform.name}" added successfully!`, 'success')
            } else {
                console.error('Failed to add platform:', result.error)
                showNotification(`Failed to add platform: ${result.error}`, 'error')
            }
        } catch (error) {
            console.error('Error adding platform:', error)
            showNotification('An error occurred while adding the platform', 'error')
        }
    }, [selectedVersion, selectedPlatform, clearSelection, showNotification])

    return {
        // State
        platforms,
        platformVersions,
        selectedPlatform,
        selectedVersion,
        platformImage,
        loading,
        notification,
        
        // Actions
        fetchPlatforms,
        selectPlatform,
        selectVersion,
        clearSelection,
        addSelectedPlatform,
        showNotification,
        hideNotification
    }
}
