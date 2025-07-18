import { prisma } from '@/lib/prisma'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const s3 = new S3Client({
  region: process.env.S3_REGION!,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID!,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
  },
})

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key'

async function getUserFromToken(req: Request) {
  const authHeader = req.headers.get('authorization') || req.headers.get('cookie')
  let token = null

  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  } else if (authHeader?.includes('token=')) {
    token = authHeader.split('token=')[1].split(';')[0]
  }

  if (!token) return null

  try {
    return jwt.verify(token, JWT_SECRET) as { id: number }
  } catch {
    return null
  }
}

export async function POST(
  req: NextRequest,
  { params }: any
) {
  const user = await getUserFromToken(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const gameId = parseInt(params.id)

  // Try file upload
  const file = formData.get('file') as File | null
  if (file && file.type.startsWith('image/')) {
    const key = `usergames/${user.id}/${gameId}.jpg`
    const arrayBuffer = await file.arrayBuffer()

    await s3.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
      Body: Buffer.from(arrayBuffer),
      ContentType: file.type,
      CacheControl: 'no-cache',
    }))

    const url = `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.S3_REGION}.amazonaws.com/${key}?v=${Date.now()}`

    await prisma.userGame.update({
      where: { id: gameId },
      data: { photoUrl: url },
    })

    return NextResponse.json({ photoUrl: url })
  }

  // Try external URL
  const url = formData.get('url')?.toString()
  if (url?.startsWith('http')) {
    await prisma.userGame.update({
      where: { id: gameId },
      data: { photoUrl: url },
    })
    return NextResponse.json({ photoUrl: url })
  }

  return NextResponse.json({ error: 'No valid image or URL provided' }, { status: 400 })
}
