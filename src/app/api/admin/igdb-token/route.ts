import { NextResponse } from 'next/server'
import { getTokenInfo, clearToken, getIGDBAccessToken } from '@/lib/igdb-token'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'clear') {
      clearToken()
      return NextResponse.json({ message: 'Token cleared successfully' })
    }

    if (action === 'refresh') {
      clearToken()
      const newToken = await getIGDBAccessToken()
      const tokenInfo = getTokenInfo()
      return NextResponse.json({ 
        message: 'Token refreshed successfully',
        newToken: newToken.substring(0, 10) + '...',
        ...tokenInfo
      })
    }

    const tokenInfo = getTokenInfo()
    return NextResponse.json(tokenInfo)
  } catch (error) {
    console.error('Error in token status endpoint:', error)
    return NextResponse.json(
      { error: 'Failed to get token status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
