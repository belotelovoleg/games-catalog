import { NextRequest, NextResponse } from 'next/server';
import { getIGDBAccessToken } from '@/lib/igdb-token';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting platform families sync...');
      // Get IGDB token
    const token = await getIGDBAccessToken();
      // Fetch platform families from IGDB
    const requestBody = 'fields id,name,slug; limit 500;';
    console.log('Sending request to IGDB platform_families API:', {
      url: 'https://api.igdb.com/v4/platform_families',
      method: 'POST',
      headers: {
        'Client-ID': process.env.IGDB_CLIENT_ID!,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: requestBody
    });

    const response = await fetch('https://api.igdb.com/v4/platform_families', {
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

    const platformFamilies = await response.json();
    console.log(`Found ${platformFamilies.length} platform families from IGDB`);

    // Sync platform families to database
    let syncedCount = 0;
    let updatedCount = 0;

    for (const family of platformFamilies) {
      try {
        const existingFamily = await prisma.igdbPlatformFamily.findUnique({
          where: { igdbId: family.id }
        });

        if (existingFamily) {
          // Update existing family if name or slug changed
          if (existingFamily.name !== family.name || existingFamily.slug !== family.slug) {
            await prisma.igdbPlatformFamily.update({
              where: { igdbId: family.id },
              data: {
                name: family.name,
                slug: family.slug
              }
            });
            updatedCount++;
            console.log(`Updated platform family: ${family.name} (ID: ${family.id})`);
          }
        } else {
          // Create new platform family
          await prisma.igdbPlatformFamily.create({
            data: {
              igdbId: family.id,
              name: family.name,
              slug: family.slug
            }
          });
          syncedCount++;
          console.log(`Added platform family: ${family.name} (ID: ${family.id})`);
        }
      } catch (error) {
        console.error(`Error syncing platform family ${family.id}:`, error);      }
    }

    console.log(`Platform families sync completed: ${syncedCount} added, ${updatedCount} updated`);

    return NextResponse.json({
      success: true,
      message: `Platform families sync completed: ${syncedCount} added, ${updatedCount} updated`,
      totalSynced: syncedCount + updatedCount,
      new: syncedCount,
      updated: updatedCount,
      totalFetched: platformFamilies.length
    });

  } catch (error) {
    console.error('Platform families sync error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
