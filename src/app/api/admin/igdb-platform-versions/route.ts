import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const versionIds = searchParams.get('versionIds')

    if (!versionIds) {
      return NextResponse.json([])
    }

    // Parse the version IDs array
    const parsedVersionIds = JSON.parse(versionIds)
    
    if (!Array.isArray(parsedVersionIds) || parsedVersionIds.length === 0) {
      return NextResponse.json([])
    }

    // Fetch platform versions and related data in parallel for efficiency
    const [versions, allLogos, allCompanies] = await Promise.all([
      prisma.igdbPlatformVersion.findMany({
        where: {
          igdbId: {
            in: parsedVersionIds
          }
        },
        orderBy: {
          name: 'asc'
        }
      }),
      prisma.igdbPlatformLogo.findMany({
        select: { igdbId: true, computed_url: true }
      }),
      prisma.igdbCompany.findMany({
        select: { igdbId: true, name: true }
      })
    ])

    // Create lookup maps for O(1) access
    const logoMap = new Map(allLogos.map(logo => [logo.igdbId, logo.computed_url]))
    const companyMap = new Map(allCompanies.map(company => [company.igdbId, company.name]))    // Transform versions with all joined data
    const versionsWithAllData = versions.map(version => {
      // Parse company IDs if available
      let companyNames: string[] = []
      if (version.companies) {
        try {
          const companyIds = JSON.parse(version.companies)
          if (Array.isArray(companyIds)) {
            companyNames = companyIds
              .map(id => companyMap.get(id))
              .filter(name => name !== undefined) as string[]
          }
        } catch (e) {
          // Ignore JSON parse errors
        }
      }

      // Get main manufacturer company name
      const mainManufacturerName = version.main_manufacturer 
        ? companyMap.get(version.main_manufacturer) || null 
        : null

      return {
        ...version,
        imageUrl: version.platform_logo ? logoMap.get(version.platform_logo) || null : null,
        companyNames,
        mainManufacturerName
      }
    })

    return NextResponse.json(versionsWithAllData)
  } catch (error) {
    console.error('Error fetching platform versions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch platform versions' },
      { status: 500 }
    )
  }
}
