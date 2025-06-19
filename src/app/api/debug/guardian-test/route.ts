import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    // Find The Guardian Legend specifically
    const guardianLegend = await prisma.igdbGames.findFirst({
      where: {
        name: 'The Guardian Legend'
      },
      select: {
        igdbId: true,
        name: true,
        alternative_names: true
      }
    })

    if (!guardianLegend) {
      return NextResponse.json({ error: 'The Guardian Legend not found' })
    }

    // Parse its alternative names
    let altNameIds = []
    try {
      altNameIds = JSON.parse(guardianLegend.alternative_names || '[]')
    } catch (e) {
      altNameIds = []
    }

    // Find the alternative name 43335
    const altName43335 = await prisma.igdbAlternativeNames.findFirst({
      where: { igdbId: 43335 }
    })

    // Test the comparison manually
    const matchingIds = [43335]
    const hasMatch = Array.isArray(altNameIds) && 
                     altNameIds.some(id => matchingIds.includes(id))
    
    // Also test with string conversion
    const hasMatchStr = Array.isArray(altNameIds) && 
                        altNameIds.some(id => matchingIds.includes(Number(id)))

    // Also test with both converted to strings
    const hasMatchStrBoth = Array.isArray(altNameIds) && 
                            altNameIds.some(id => matchingIds.map(String).includes(String(id)))

    return NextResponse.json({
      guardianLegend,
      altNameIds,
      altNameIdsTypes: altNameIds.map((id: any) => typeof id),
      altName43335,
      matchingIds,
      matchingIdsTypes: matchingIds.map(id => typeof id),
      hasMatch,
      hasMatchStr,
      hasMatchStrBoth,
      directComparison: altNameIds.includes(43335),
      directComparisonStr: altNameIds.includes('43335')
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: 'Failed to test comparison' }, { status: 500 })
  }
}
