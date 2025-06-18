export interface DecodedToken {
    id: number
    email: string
    isAdmin: boolean
}

export interface IgdbPlatform {
    igdbId: number // Primary key - IGDB ID
    name: string
    abbreviation?: string
    alternative_name?: string
    slug?: string
    generation?: number
    platform_logo?: number
    summary?: string
    versions?: string
    hasVersions?: boolean
    platform_family?: number
    category?: number
    // Resolved data from relationships
    familyName?: string
    typeName?: string
}

export interface IgdbPlatformVersion {
    igdbId: number // Primary key - IGDB ID  
    name: string
    platform_logo?: number
    main_manufacturer?: number
    connectivity?: string
    cpu?: string
    memory?: string
    graphics?: string
    sound?: string
    storage?: string
    summary?: string
    url?: string
    slug?: string
    os?: string
    media?: string
    resolutions?: string
    output?: string
    companies?: string
}

export interface IgdbPlatformFamily {
    igdbId: number
    name: string
    slug: string
}

export interface IgdbPlatformType {
    igdbId: number
    name: string
}
