import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key'

async function getUserFromToken(req: Request) {
  const authHeader = req.headers.get('authorization') || req.headers.get('cookie')
  let token = null
  
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  } else if (authHeader?.includes('token=')) {
    token = authHeader.split('token=')[1].split(';')[0]
  }

  if (!token) {
    return null
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number }
    return decoded
  } catch (error) {
    return null
  }
}

export async function GET(req: Request) {
  const user = await getUserFromToken(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }  try {
    const url = new URL(req.url)
    const platformId = url.searchParams.get('platformId')
    
    const whereClause: any = { userId: user.id }
    if (platformId) {
      whereClause.platformId = parseInt(platformId)
    }

    const userGames = await prisma.userGame.findMany({
      where: whereClause,
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(userGames)
  } catch (error) {
    console.error('Error fetching user games:', error)
    return NextResponse.json(
      { error: 'Failed to fetch games' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  const user = await getUserFromToken(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name, rating, platformId, status, condition, notes, igdbGameId } = await req.json()

    if (!name || !platformId || !status) {
      return NextResponse.json(
        { error: 'Name, platform ID and status are required' },
        { status: 400 }
      )
    }

    const userGame = await prisma.userGame.create({
      data: {
        userId: user.id,
        name,
        rating,
        platformId: parseInt(platformId),
        status,
        condition,
        notes,
        igdbGameId
      }
    })

    return NextResponse.json(userGame)
  } catch (error) {
    console.error('Error adding game:', error)
    return NextResponse.json(
      { error: 'Failed to add game' },
      { status: 500 }
    )
  }
}
