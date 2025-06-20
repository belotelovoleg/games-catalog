import { NextRequest, NextResponse } from 'next/server'
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromToken(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const gameId = parseInt(id)
    
    if (isNaN(gameId)) {
      return NextResponse.json({ error: 'Invalid game ID' }, { status: 400 })
    }

    // Check if the game belongs to the user
    const userGame = await prisma.userGame.findFirst({
      where: {
        id: gameId,
        userId: user.id
      }
    })

    if (!userGame) {
      return NextResponse.json({ error: 'Game not found or unauthorized' }, { status: 404 })
    }

    // Delete the game
    await prisma.userGame.delete({
      where: { id: gameId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting game:', error)
    return NextResponse.json(
      { error: 'Failed to delete game' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUserFromToken(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { id } = await params
    const gameId = parseInt(id)
    
    if (isNaN(gameId)) {
      return NextResponse.json({ error: 'Invalid game ID' }, { status: 400 })
    }

    const { name, rating, status, condition, notes } = await req.json()

    // Check if the game belongs to the user
    const userGame = await prisma.userGame.findFirst({
      where: {
        id: gameId,
        userId: user.id
      }
    })

    if (!userGame) {
      return NextResponse.json({ error: 'Game not found or unauthorized' }, { status: 404 })
    }

    // Update the game
    const updatedGame = await prisma.userGame.update({
      where: { id: gameId },
      data: {
        name: name || userGame.name,
        rating: rating !== undefined ? rating : userGame.rating,
        status: status || userGame.status,
        condition: condition !== undefined ? condition : userGame.condition,
        notes: notes !== undefined ? notes : userGame.notes
      }
    })

    return NextResponse.json(updatedGame)
  } catch (error) {
    console.error('Error updating game:', error)
    return NextResponse.json(
      { error: 'Failed to update game' },
      { status: 500 }
    )
  }
}
