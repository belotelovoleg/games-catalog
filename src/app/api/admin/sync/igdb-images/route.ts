import { NextRequest, NextResponse } from 'next/server';
import { getIGDBAccessToken } from '@/lib/igdb-token';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting IGDB images sync...');
    
    // Get IGDB token
    const token = await getIGDBAccessToken();
    
    // First, get all platform logo IDs from our local platforms
    const platforms = await prisma.igdbPlatform.findMany({
      select: {
        platform_logo: true,
        name: true
      },
      where: {
        platform_logo: {
          not: null
        }
      }
    });

    const logoIds = [...new Set(platforms.map(p => p.platform_logo).filter(Boolean))];
    console.log(`Found ${logoIds.length} unique platform logo IDs to sync`);

    if (logoIds.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No platform logos to sync',
        totalSynced: 0,
        new: 0,
        updated: 0
      });
    }

    // Fetch platform logos from IGDB in batches
    let totalSynced = 0;
    let newCount = 0;
    let updatedCount = 0;

    const batchSize = 50; // IGDB limit
    for (let i = 0; i < logoIds.length; i += batchSize) {
      const batch = logoIds.slice(i, i + batchSize);
      const idsQuery = batch.join(',');
      
      console.log(`Fetching batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(logoIds.length/batchSize)}`);

      const response = await fetch('https://api.igdb.com/v4/platform_logos', {
        method: 'POST',
        headers: {
          'Client-ID': process.env.IGDB_CLIENT_ID!,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: `fields alpha_channel,animated,checksum,height,image_id,url,width; where id = (${idsQuery}); limit ${batchSize};`,
      });

      if (!response.ok) {
        console.error(`IGDB API error for batch: ${response.status} ${response.statusText}`);
        continue;
      }

      const images = await response.json();
      console.log(`Received ${images.length} images from IGDB`);

      // Process each image
      for (const image of images) {
        try {
          // Compute the standard image URL if image_id exists
          const computedUrl = image.image_id ? 
            `https://images.igdb.com/igdb/image/upload/t_logo_med/${image.image_id}.png` : 
            null;

          const existingImage = await prisma.igdbImage.findUnique({
            where: { igdbId: image.id }
          });

          if (existingImage) {
            // Update existing image
            await prisma.igdbImage.update({
              where: { igdbId: image.id },
              data: {
                alpha_channel: image.alpha_channel,
                animated: image.animated,
                checksum: image.checksum,
                height: image.height,
                image_id: image.image_id,
                url: image.url,
                width: image.width,
                computed_url: computedUrl
              }
            });
            updatedCount++;
          } else {
            // Create new image
            await prisma.igdbImage.create({
              data: {
                igdbId: image.id,
                alpha_channel: image.alpha_channel,
                animated: image.animated,
                checksum: image.checksum,
                height: image.height,
                image_id: image.image_id,
                url: image.url,
                width: image.width,
                computed_url: computedUrl
              }
            });
            newCount++;
          }
          totalSynced++;
        } catch (error) {
          console.error(`Error syncing image ${image.id}:`, error);
        }
      }
    }

    console.log(`IGDB images sync completed: ${newCount} new, ${updatedCount} updated`);

    return NextResponse.json({
      success: true,
      message: `IGDB images sync completed: ${newCount} new, ${updatedCount} updated`,
      totalSynced,
      new: newCount,
      updated: updatedCount,
      totalRequested: logoIds.length
    });

  } catch (error) {
    console.error('IGDB images sync error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
