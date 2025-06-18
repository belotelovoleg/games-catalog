import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key'

async function verifyAdmin(req: Request) {
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
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; isAdmin: boolean }
    if (!decoded.isAdmin) {
      return null
    }
    return decoded
  } catch (error) {
    return null
  }
}

export async function GET(req: Request) {
  const user = await verifyAdmin(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const platforms = await prisma.platform.findMany({
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(platforms)
  } catch (error) {
    console.error('Error fetching platforms:', error)
    return NextResponse.json(
      { error: 'Failed to fetch platforms' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  const user = await verifyAdmin(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }  try {
    const { 
      name, 
      igdbPlatformId,
      igdbPlatformVersionId,
      abbreviation,
      alternative_name,
      generation,
      companies,
      versionName,
      platform_logo_base64
    } = await req.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Platform name is required' },
        { status: 400 }
      )
    }

    const platform = await prisma.platform.create({
      data: {
        name,
        igdbPlatformId,
        igdbPlatformVersionId,
        abbreviation,
        alternative_name,
        generation,
        companies,
        versionName,
        platform_logo_base64
      }
    })

    return NextResponse.json(platform)
  } catch (error) {
    console.error('Error creating platform:', error)
    return NextResponse.json(
      { error: 'Failed to create platform' },
      { status: 500 }
    )
  }
}
