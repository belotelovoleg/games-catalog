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
  }

  try {
    const userGames = await prisma.userGame.findMany({
      where: { userId: user.id },
      include: {
        platform: true
      },
      orderBy: { title: 'asc' }
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
    const { title, description, imageUrl, platformId, status, condition, notes, igdbId } = await req.json()

    if (!title || !platformId || !status) {
      return NextResponse.json(
        { error: 'Title, platform ID and status are required' },
        { status: 400 }
      )
    }

    const userGame = await prisma.userGame.create({
      data: {
        userId: user.id,
        title,
        description,
        imageUrl,
        platformId: parseInt(platformId),
        status,
        condition,
        notes,
        igdbId
      },
      include: {
        platform: true
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
