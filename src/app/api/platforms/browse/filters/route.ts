import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Get all unique values for filters from the platforms
    const platforms = await prisma.platform.findMany({
      select: {
        generation: true,
        platform_family: true,
        platform_type: true
      }
    })

    // Get unique generations
    const generations = [...new Set(platforms
      .map(p => p.generation)
      .filter(g => g !== null)
    )].sort((a, b) => a! - b!)

    // Get unique platform family IDs
    const familyIds = [...new Set(platforms
      .map(p => p.platform_family)
      .filter(f => f !== null)
    )]

    // Get unique platform type IDs
    const typeIds = [...new Set(platforms
      .map(p => p.platform_type)
      .filter(t => t !== null)
    )]

    // Fetch family names
    const families = await prisma.igdbPlatformFamily.findMany({
      where: { igdbId: { in: familyIds } },
      select: { igdbId: true, name: true },
      orderBy: { name: 'asc' }
    })

    // Fetch type names
    const types = await prisma.igdbPlatformType.findMany({
      where: { igdbId: { in: typeIds } },
      select: { igdbId: true, name: true },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({
      generations: generations.map(g => ({ value: g, label: `Generation ${g}` })),
      families: families.map(f => ({ value: f.igdbId, label: f.name })),
      types: types.map(t => ({ value: t.igdbId, label: t.name }))
    })
  } catch (error) {
    console.error('Error fetching filter options:', error)
    return NextResponse.json(
      { error: 'Failed to fetch filter options' },
      { status: 500 }
    )
  }
}
