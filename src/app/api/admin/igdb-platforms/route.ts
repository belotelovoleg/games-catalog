import { NextResponse } from 'next/server'

const IGDB_CLIENT_ID = process.env.IGDB_CLIENT_ID
const IGDB_CLIENT_SECRET = process.env.IGDB_CLIENT_SECRET

async function getIGDBAccessToken() {
  const res = await fetch(`https://id.twitch.tv/oauth2/token?client_id=${IGDB_CLIENT_ID}&client_secret=${IGDB_CLIENT_SECRET}&grant_type=client_credentials`, {
    method: 'POST',
  })
  const data = await res.json()
  return data.access_token
}

export async function GET() {
  if (!IGDB_CLIENT_ID || !IGDB_CLIENT_SECRET) {
    return NextResponse.json({ error: 'IGDB credentials not set' }, { status: 500 })
  }

  try {
    const accessToken = await getIGDBAccessToken()
    
    // Fetch platforms with platform_logo field
    const res = await fetch('https://api.igdb.com/v4/platforms', {
      method: 'POST',
      headers: {
        'Client-ID': IGDB_CLIENT_ID,
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
      body: 'fields id,name,summary,platform_logo; where category = (1,5,6); limit 50; sort name asc;',
    })
    
    const platforms = await res.json()
    
    // Get all unique logo ids
    const logoIds = platforms
      .map((p: any) => p.platform_logo)
      .filter((id: any) => !!id)
    
    if (logoIds.length === 0) {
      return NextResponse.json(platforms.map((p: any) => ({ ...p, logoUrl: undefined })))
    }
    
    // Fetch logo urls
    const logoRes = await fetch('https://api.igdb.com/v4/platform_logos', {
      method: 'POST',
      headers: {
        'Client-ID': IGDB_CLIENT_ID,
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
      },
      body: `fields id,url; where id = (${logoIds.join(',')}); limit 100;`,
    })
    
    const logos = await logoRes.json()
    const logoMap = Object.fromEntries(logos.map((l: any) => [l.id, l.url]))
    
    // Attach logo url to each platform
    const withLogos = platforms.map((p: any) => ({
      ...p,
      logoUrl: p.platform_logo ? logoMap[p.platform_logo] : undefined
    }))
    
    return NextResponse.json(withLogos)
  } catch (error) {
    console.error('Error fetching IGDB platforms:', error)
    return NextResponse.json(
      { error: 'Failed to fetch IGDB platforms' },
      { status: 500 }
    )
  }
}
