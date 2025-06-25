import { NextRequest, NextResponse } from 'next/server';
import { getIGDBAccessToken } from '@/lib/igdb-token';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {    console.log('Starting platform types sync...');
    
    // Get IGDB token
    const token = await getIGDBAccessToken();
    
    const requestBody = 'fields id,name; limit 500;'
    
    console.log('IGDB API Request:', {
      url: 'https://api.igdb.com/v4/platform_types',
      method: 'POST',
      headers: {
        'Client-ID': process.env.IGDB_CLIENT_ID!,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: requestBody
    })
    
    // Fetch platform types from IGDB
    const response = await fetch('https://api.igdb.com/v4/platform_types', {
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

    const platformTypes = await response.json();
    console.log(`Found ${platformTypes.length} platform types from IGDB`);

    // Sync platform types to database
    let syncedCount = 0;
    let updatedCount = 0;
    const BATCH_DB_SIZE = 100;
    // Find all existing IDs
    const allIds = platformTypes.map((t: any) => t.id);
    const existing = await prisma.igdbPlatformType.findMany({
      where: { igdbId: { in: allIds } },
      select: { igdbId: true, name: true }
    });
    const existingMap = new Map(existing.map(t => [t.igdbId, t]));
    const toCreate = platformTypes.filter((t: any) => !existingMap.has(t.id));
    const toUpdate = platformTypes.filter((t: any) => {
      const ex = existingMap.get(t.id);
      return ex && ex.name !== t.name;
    });
    // Batch create
    for (let i = 0; i < toCreate.length; i += BATCH_DB_SIZE) {
      const batch = toCreate.slice(i, i + BATCH_DB_SIZE);
      if (batch.length > 0) {
        await prisma.igdbPlatformType.createMany({
          data: batch.map((t: any) => ({
            igdbId: t.id,
            name: t.name
          })),
          skipDuplicates: true
        });
        syncedCount += batch.length;
      }
    }
    // Batch update
    for (let i = 0; i < toUpdate.length; i += BATCH_DB_SIZE) {
      const batch = toUpdate.slice(i, i + BATCH_DB_SIZE);
      await Promise.all(batch.map(async (t: any) => {
        try {
          await prisma.igdbPlatformType.update({
            where: { igdbId: t.id },
            data: { name: t.name }
          });
          updatedCount++;
        } catch (error) {
          console.error(`Error updating platform type ${t.id}:`, error);
        }
      }));
    }
    console.log(`Platform types sync completed: ${syncedCount} added, ${updatedCount} updated`);

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
