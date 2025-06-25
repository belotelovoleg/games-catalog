import { NextResponse } from 'next/server'
import { getTokenInfo } from '@/lib/igdb-token'

export async function GET() {
  try {
    const tokenInfo = getTokenInfo()
    
    if (!tokenInfo.hasToken) {
      return NextResponse.json({
        hasToken: false,
        message: 'No IGDB token cached'
      })
    }

    const now = Date.now()
    const expiresAt = new Date(tokenInfo.expiresAt!)
    const timeLeft = tokenInfo.expiresIn!
    const daysLeft = Math.floor(timeLeft / 86400)
    const hoursLeft = Math.floor((timeLeft % 86400) / 3600)
    const minutesLeft = Math.floor((timeLeft % 3600) / 60)

    return NextResponse.json({
      hasToken: true,
      expiresAt: tokenInfo.expiresAt,
      expiresIn: timeLeft,
      timeLeft: {
        days: daysLeft,
        hours: hoursLeft,
        minutes: minutesLeft,
        total: `${daysLeft}d ${hoursLeft}h ${minutesLeft}m`
      },
      isValid: timeLeft > 0,
      message: timeLeft > 0 
        ? `Token is valid for ${daysLeft} days, ${hoursLeft} hours, ${minutesLeft} minutes`
        : 'Token has expired'
    })

  } catch (error) {
    console.error('Error checking token status:', error)
    return NextResponse.json(
      { error: 'Failed to check token status' },
      { status: 500 }
    )
  }
}
