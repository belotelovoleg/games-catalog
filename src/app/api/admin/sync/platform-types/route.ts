import { NextRequest, NextResponse } from 'next/server';
import { getIGDBAccessToken } from '@/lib/igdb-token';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting platform types sync...');
    
    // Get IGDB token
    const token = await getIGDBAccessToken();
    
    // Fetch platform types from IGDB
    const response = await fetch('https://api.igdb.com/v4/platform_types', {
      method: 'POST',
      headers: {
        'Client-ID': process.env.IGDB_CLIENT_ID!,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: 'fields id,name; limit 500;',
    });

    if (!response.ok) {
      throw new Error(`IGDB API error: ${response.status} ${response.statusText}`);
    }

    const platformTypes = await response.json();
    console.log(`Found ${platformTypes.length} platform types from IGDB`);

    // Sync platform types to database
    let syncedCount = 0;
    let updatedCount = 0;

    for (const type of platformTypes) {
      try {
        const existingType = await prisma.igdbPlatformType.findUnique({
          where: { igdbId: type.id }
        });

        if (existingType) {
          // Update existing type if name changed
          if (existingType.name !== type.name) {
            await prisma.igdbPlatformType.update({
              where: { igdbId: type.id },
              data: {
                name: type.name
              }
            });
            updatedCount++;
            console.log(`Updated platform type: ${type.name} (ID: ${type.id})`);
          }
        } else {
          // Create new platform type
          await prisma.igdbPlatformType.create({
            data: {
              igdbId: type.id,
              name: type.name
            }
          });
          syncedCount++;
          console.log(`Added platform type: ${type.name} (ID: ${type.id})`);
        }
      } catch (error) {
        console.error(`Error syncing platform type ${type.id}:`, error);
      }
    }    console.log(`Platform types sync completed: ${syncedCount} added, ${updatedCount} updated`);

    return NextResponse.json({
      success: true,
      message: `Platform types sync completed: ${syncedCount} added, ${updatedCount} updated`,
      totalSynced: syncedCount + updatedCount,
      new: syncedCount,
      updated: updatedCount,
      totalFetched: platformTypes.length
    });

  } catch (error) {
    console.error('Platform types sync error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
