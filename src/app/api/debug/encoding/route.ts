import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get the specific alternative name with encoding issues
    const altName = await prisma.igdbAlternativeNames.findUnique({
      where: { igdbId: 120485 }
    })

    if (!altName) {
      return NextResponse.json({ error: 'Alternative name not found' })
    }

    // Return raw data and some analysis
    return NextResponse.json({
      rawData: altName,
      nameLength: altName.name.length,
      nameBytes: Buffer.from(altName.name, 'utf8').toString('hex'),
      charCodes: altName.name.split('').map(char => char.charCodeAt(0)),
      encoding: 'Check if this looks like UTF-8 or corrupted data'
    })
  } catch (error) {
    console.error('Debug encoding error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
