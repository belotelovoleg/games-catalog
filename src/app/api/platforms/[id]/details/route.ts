import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '../../../../../generated/prisma'

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const platformId = parseInt(params.id)
    
    if (isNaN(platformId)) {
      return NextResponse.json({ error: 'Invalid platform ID' }, { status: 400 })
    }

    // Get the platform with basic info
    const platform = await prisma.platform.findUnique({
      where: { id: platformId }
    })

    if (!platform) {
      return NextResponse.json({ error: 'Platform not found' }, { status: 404 })
    }

    // Prepare the response object
    const detailedPlatform: any = {
      id: platform.id,
      name: platform.name,
      versionName: platform.versionName,
      abbreviation: platform.abbreviation,
      alternative_name: platform.alternative_name,
      generation: platform.generation,
      platform_logo_base64: platform.platform_logo_base64
    }    // If we have IGDB references, fetch the enriched data
    if (platform.igdbPlatformId) {
      try {
        const igdbPlatform = await prisma.igdbPlatform.findUnique({
          where: { igdbId: platform.igdbPlatformId }
        })

        if (igdbPlatform) {
          // Get platform family name if available
          let familyName = null
          if (igdbPlatform.platform_family) {
            const family = await prisma.igdbPlatformFamily.findUnique({
              where: { igdbId: igdbPlatform.platform_family }
            })
            familyName = family?.name
          }

          // Get platform type name if available
          let typeName = null
          if (igdbPlatform.platform_type) {
            const type = await prisma.igdbPlatformType.findUnique({
              where: { igdbId: igdbPlatform.platform_type }
            })
            typeName = type?.name
          }

          detailedPlatform.igdbPlatform = {
            name: igdbPlatform.name,
            summary: igdbPlatform.summary,
            slug: igdbPlatform.slug,
            url: igdbPlatform.url,
            familyName: familyName,
            typeName: typeName,
            category: igdbPlatform.category,
            created_at: igdbPlatform.created_at,
            updated_at: igdbPlatform.updated_at
          }

          // Try to get logo URL from IGDB if available
          if (!detailedPlatform.platform_logo_base64 && igdbPlatform.platform_logo) {
            const logo = await prisma.igdbPlatformLogo.findUnique({
              where: { igdbId: igdbPlatform.platform_logo }
            })
            if (logo?.computed_url) {
              detailedPlatform.imageUrl = logo.computed_url
            }
          }
        }
      } catch (error) {
        console.error('Error fetching IGDB platform:', error)
        // Continue without IGDB data
      }
    }    // If we have IGDB platform version reference, fetch that data too
    if (platform.igdbPlatformVersionId) {
      try {
        const igdbPlatformVersion = await prisma.igdbPlatformVersion.findUnique({
          where: { igdbId: platform.igdbPlatformVersionId }
        })

        if (igdbPlatformVersion) {
          // Parse company names from the companies field if available
          let companyNames: string[] = []
          if (igdbPlatformVersion.companies) {
            try {
              const companyIds = JSON.parse(igdbPlatformVersion.companies)
              if (Array.isArray(companyIds)) {
                // Fetch company names
                const companies = await prisma.igdbCompany.findMany({
                  where: { igdbId: { in: companyIds } }
                })
                companyNames = companies.map(c => c.name)
              }
            } catch (e) {
              // If parsing fails, ignore
            }
          }

          // Get main manufacturer name if available
          let mainManufacturerName = null
          if (igdbPlatformVersion.main_manufacturer) {
            const manufacturer = await prisma.igdbCompany.findUnique({
              where: { igdbId: igdbPlatformVersion.main_manufacturer }
            })
            mainManufacturerName = manufacturer?.name
          }

          detailedPlatform.igdbPlatformVersion = {
            name: igdbPlatformVersion.name,
            summary: igdbPlatformVersion.summary,
            cpu: igdbPlatformVersion.cpu,
            memory: igdbPlatformVersion.memory,
            graphics: igdbPlatformVersion.graphics,
            sound: igdbPlatformVersion.sound,
            storage: igdbPlatformVersion.storage,
            connectivity: igdbPlatformVersion.connectivity,
            os: igdbPlatformVersion.os,
            media: igdbPlatformVersion.media,
            resolutions: igdbPlatformVersion.resolutions,
            output: igdbPlatformVersion.output,
            url: igdbPlatformVersion.url,
            mainManufacturerName: mainManufacturerName,
            companyNames: companyNames
          }

          // Try to get logo URL from platform version if available
          if (!detailedPlatform.platform_logo_base64 && !detailedPlatform.imageUrl && igdbPlatformVersion.platform_logo) {
            const logo = await prisma.igdbPlatformLogo.findUnique({
              where: { igdbId: igdbPlatformVersion.platform_logo }
            })
            if (logo?.computed_url) {
              detailedPlatform.imageUrl = logo.computed_url
            }
          }
        }
      } catch (error) {
        console.error('Error fetching IGDB platform version:', error)
        // Continue without IGDB version data
      }
    }

    return NextResponse.json(detailedPlatform)
  } catch (error) {
    console.error('Error fetching platform details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch platform details' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
