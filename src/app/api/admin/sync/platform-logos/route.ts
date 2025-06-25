import { NextRequest, NextResponse } from 'next/server';
import { getIGDBAccessToken } from '@/lib/igdb-token';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting IGDB platform logos sync...');
    
    // Get IGDB token
    const token = await getIGDBAccessToken();    // Fetch and save platform logos in batches
    let totalNewCount = 0;
    let totalUpdatedCount = 0;
    let totalProcessed = 0;
    let offset = 0;
    const limit = 500;
    
    while (true) {
      console.log(`Fetching platform logos batch: offset ${offset}, limit ${limit}`);
      
      const requestBody = `fields alpha_channel,animated,checksum,height,image_id,url,width; limit ${limit}; offset ${offset}; sort id asc;`;
      console.log('Sending request to IGDB platform_logos API:', {
        url: 'https://api.igdb.com/v4/platform_logos',
        method: 'POST',
        headers: {
          'Client-ID': process.env.IGDB_CLIENT_ID!,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: requestBody
      });
      
      const response = await fetch('https://api.igdb.com/v4/platform_logos', {
        method: 'POST',
        headers: {
          'Client-ID': process.env.IGDB_CLIENT_ID!,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: requestBody,
      });

      if (!response.ok) {
        throw new Error(`IGDB API error: ${response.status} ${response.statusText}`);
      }

      const batch = await response.json();
      
      if (batch.length === 0) {
        break; // No more data
      }
      
      console.log(`Fetched ${batch.length} platform logos, now saving batch to database...`);

      // Process this batch immediately
      let newCount = 0;
      let updatedCount = 0;
      const BATCH_DB_SIZE = 100;
      // Find all existing IDs in this batch
      const logoIds = batch.map((logo: any) => logo.id);
      const existingLogos = await prisma.igdbPlatformLogo.findMany({
        where: { igdbId: { in: logoIds } },
        select: { igdbId: true }
      });
      const existingIds = new Set(existingLogos.map(l => l.igdbId));
      const toCreate = batch.filter((logo: any) => !existingIds.has(logo.id));
      const toUpdate = batch.filter((logo: any) => existingIds.has(logo.id));
      // Batch create
      for (let j = 0; j < toCreate.length; j += BATCH_DB_SIZE) {
        const createBatch = toCreate.slice(j, j + BATCH_DB_SIZE);
        if (createBatch.length > 0) {
          await prisma.igdbPlatformLogo.createMany({
            data: createBatch.map((logo: any) => ({
              igdbId: logo.id,
              alpha_channel: logo.alpha_channel,
              animated: logo.animated,
              checksum: logo.checksum,
              height: logo.height,
              image_id: logo.image_id,
              url: logo.url,
              width: logo.width,
              computed_url: logo.image_id ? `https://images.igdb.com/igdb/image/upload/t_logo_med/${logo.image_id}.png` : null
            })),
            skipDuplicates: true
          });
          newCount += createBatch.length;
        }
      }
      // Batch update
      for (let j = 0; j < toUpdate.length; j += BATCH_DB_SIZE) {
        const updateBatch = toUpdate.slice(j, j + BATCH_DB_SIZE);
        await Promise.all(updateBatch.map(async (logo: any) => {
          try {
            await prisma.igdbPlatformLogo.update({
              where: { igdbId: logo.id },
              data: {
                alpha_channel: logo.alpha_channel,
                animated: logo.animated,
                checksum: logo.checksum,
                height: logo.height,
                image_id: logo.image_id,
                url: logo.url,
                width: logo.width,
                computed_url: logo.image_id ? `https://images.igdb.com/igdb/image/upload/t_logo_med/${logo.image_id}.png` : null
              }
            });
            updatedCount++;
          } catch (error) {
            console.error(`Error updating logo ${logo.id}:`, error);
          }
        }));
      }

      totalNewCount += newCount;
      totalUpdatedCount += updatedCount;
      totalProcessed += batch.length;

      console.log(`Batch saved: ${newCount} new, ${updatedCount} updated (Total processed: ${totalProcessed})`);
      
      if (batch.length < limit) {
        break; // Last batch
      }
      
      offset += limit;
      
      // Rate limiting: IGDB allows 4 requests per second
      await new Promise(resolve => setTimeout(resolve, 250));
    }

    if (totalProcessed === 0) {
      return NextResponse.json({
        success: true,
        message: 'No platform logos found in IGDB',
        totalSynced: 0,
        new: 0,
        updated: 0
      });
    }    return NextResponse.json({
      success: true,
      message: `Platform logos sync completed!\n✅ ${totalNewCount} new logos added\n🔄 ${totalUpdatedCount} logos updated\n📊 Total processed: ${totalProcessed}`,
      totalSynced: totalProcessed,
      new: totalNewCount,
      updated: totalUpdatedCount
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
