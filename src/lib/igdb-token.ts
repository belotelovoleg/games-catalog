interface IGDBTokenData {
  access_token: string
  expires_in: number
  token_type: string
  expires_at: number // We'll calculate this
}

// In-memory token storage (could be moved to Redis/DB in production)
let cachedToken: IGDBTokenData | null = null

const IGDB_CLIENT_ID = process.env.IGDB_CLIENT_ID
const IGDB_CLIENT_SECRET = process.env.IGDB_CLIENT_SECRET

export async function getIGDBAccessToken(): Promise<string> {
  if (!IGDB_CLIENT_ID || !IGDB_CLIENT_SECRET) {
    throw new Error('IGDB credentials not configured')
  }

  // Check if we have a valid cached token
  if (cachedToken && Date.now() < cachedToken.expires_at) {
    const timeLeft = Math.floor((cachedToken.expires_at - Date.now()) / 1000 / 60); // minutes
    console.log(`Using cached IGDB token (expires in ${timeLeft} minutes)`)
    return cachedToken.access_token
  }

  if (cachedToken) {
    console.log('Cached IGDB token expired, fetching new token...')
  } else {
    console.log('No cached IGDB token found, fetching new token...')
  }
  
  try {
    const res = await fetch(
      `https://id.twitch.tv/oauth2/token?client_id=${IGDB_CLIENT_ID}&client_secret=${IGDB_CLIENT_SECRET}&grant_type=client_credentials`,
      { method: 'POST' }
    )

    if (!res.ok) {
      throw new Error(`Failed to get IGDB token: ${res.status} ${res.statusText}`)
    }    const data = await res.json()
    
    // Calculate expiration time (subtract 10 minutes for safety buffer)
    // Use the actual expires_in value from IGDB response
    const expiresAt = Date.now() + (data.expires_in * 1000) - (10 * 60 * 1000)
    
    cachedToken = {
      ...data,
      expires_at: expiresAt
    }

    const expirationDate = new Date(expiresAt).toISOString()
    const daysUntilExpiry = Math.floor((data.expires_in - 600) / 86400) // subtract 10 min buffer, convert to days
    console.log(`New IGDB token acquired, expires in ${data.expires_in} seconds (${daysUntilExpiry} days) at: ${expirationDate}`)
    
    if (!cachedToken) {
      throw new Error('Failed to cache IGDB token')
    }
    
    return cachedToken.access_token
  } catch (error) {
    console.error('Error fetching IGDB token:', error)
    throw error
  }
}

export function getTokenInfo(): { hasToken: boolean; expiresAt?: string; expiresIn?: number } {
  if (!cachedToken) {
    return { hasToken: false }
  }

  const now = Date.now()
  const expiresIn = Math.max(0, Math.floor((cachedToken.expires_at - now) / 1000))
  
  return {
    hasToken: true,
    expiresAt: new Date(cachedToken.expires_at).toISOString(),
    expiresIn
  }
}

export function clearToken(): void {
  cachedToken = null
  console.log('IGDB token cleared')
}
