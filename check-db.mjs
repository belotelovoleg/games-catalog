import { prisma } from './src/lib/prisma.ts'

async function checkDB() {
  try {
    console.log('=== Checking Database Contents ===\n')
    
    const platformTypes = await prisma.igdbPlatformType.findMany()
    console.log(`Platform Types: ${platformTypes.length}`)
    platformTypes.forEach(type => console.log(`  - ${type.igdbId}: ${type.name}`))
    
    const platformFamilies = await prisma.igdbPlatformFamily.findMany()
    console.log(`\nPlatform Families: ${platformFamilies.length}`)
    platformFamilies.forEach(family => console.log(`  - ${family.igdbId}: ${family.name}`))
    
    const platforms = await prisma.igdbPlatform.findMany()
    console.log(`\nIGDB Platforms: ${platforms.length}`)
    platforms.slice(0, 5).forEach(platform => console.log(`  - ${platform.igdbId}: ${platform.name}`))
    if (platforms.length > 5) console.log(`  ... and ${platforms.length - 5} more`)
    
    const platformVersions = await prisma.igdbPlatformVersion.findMany()
    console.log(`\nPlatform Versions: ${platformVersions.length}`)
    
    const platformLogos = await prisma.igdbPlatformLogo.findMany()
    console.log(`\nPlatform Logos: ${platformLogos.length}`)
    
    const companies = await prisma.igdbCompany.findMany()
    console.log(`\nCompanies: ${companies.length}`)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkDB()
