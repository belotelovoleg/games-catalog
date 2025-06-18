import { PrismaClient } from './src/generated/prisma/index.js';

const prisma = new PrismaClient();

async function checkPlatformData() {
  try {
    console.log('Checking platform-related tables...');
    
    // Check IgdbPlatform table
    const igdbPlatforms = await prisma.igdbPlatform.count();
    console.log(`IgdbPlatform count: ${igdbPlatforms}`);
    
    // Check Platform table (your main platforms)
    const platforms = await prisma.platform.count();
    console.log(`Platform count: ${platforms}`);
    
    // Check IgdbPlatformLogo table
    const logos = await prisma.igdbPlatformLogo.count();
    console.log(`IgdbPlatformLogo count: ${logos}`);
    
    // Check IgdbPlatformVersion table
    const versions = await prisma.igdbPlatformVersion.count();
    console.log(`IgdbPlatformVersion count: ${versions}`);
    
    // Show a sample of IgdbPlatform data if any exists
    if (igdbPlatforms > 0) {
      console.log('\nSample IgdbPlatform records:');
      const samplePlatforms = await prisma.igdbPlatform.findMany({
        take: 3,
        select: {
          igdbId: true,
          name: true,
          abbreviation: true,
          platform_logo: true
        }
      });
      console.table(samplePlatforms);
    }
    
  } catch (error) {
    console.error('Error checking platform data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPlatformData();
