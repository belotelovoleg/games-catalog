const { PrismaClient } = require('./src/generated/prisma');

async function checkDB() {
  const prisma = new PrismaClient();
  
  try {
    console.log('=== Database Contents Check ===\n');
    
    const platformTypes = await prisma.igdbPlatformType.count();
    console.log(`Platform Types: ${platformTypes}`);
    
    const platformFamilies = await prisma.igdbPlatformFamily.count();
    console.log(`Platform Families: ${platformFamilies}`);
    
    const platforms = await prisma.igdbPlatform.count();
    console.log(`IGDB Platforms: ${platforms}`);
    
    const platformVersions = await prisma.igdbPlatformVersion.count();
    console.log(`Platform Versions: ${platformVersions}`);
    
    const platformLogos = await prisma.igdbPlatformLogo.count();
    console.log(`Platform Logos: ${platformLogos}`);
    
    const companies = await prisma.igdbCompany.count();
    console.log(`Companies: ${companies}`);
    
    const localPlatforms = await prisma.platform.count();
    console.log(`Local Platforms: ${localPlatforms}`);
    
    console.log('\n=== Summary ===');
    const total = platformTypes + platformFamilies + platforms + platformVersions + platformLogos + companies;
    console.log(`Total IGDB records: ${total}`);
    
    if (total === 0) {
      console.log('\n❌ NO IGDB DATA FOUND - Database appears to be empty');
      console.log('You need to run the sync operations to populate IGDB data');
    } else {
      console.log('\n✅ Database has IGDB data');
    }
    
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDB();
