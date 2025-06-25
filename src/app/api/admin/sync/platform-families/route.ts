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
    const BATCH_DB_SIZE = 100;
    // Find all existing IDs
    const allIds = platformFamilies.map((f: any) => f.id);
    const existing = await prisma.igdbPlatformFamily.findMany({
      where: { igdbId: { in: allIds } },
      select: { igdbId: true, name: true, slug: true }
    });
    const existingMap = new Map(existing.map(f => [f.igdbId, f]));
    const toCreate = platformFamilies.filter((f: any) => !existingMap.has(f.id));
    const toUpdate = platformFamilies.filter((f: any) => {
      const ex = existingMap.get(f.id);
      return ex && (ex.name !== f.name || ex.slug !== f.slug);
    });
    // Batch create
    for (let i = 0; i < toCreate.length; i += BATCH_DB_SIZE) {
      const batch = toCreate.slice(i, i + BATCH_DB_SIZE);
      if (batch.length > 0) {
        await prisma.igdbPlatformFamily.createMany({
          data: batch.map((f: any) => ({
            igdbId: f.id,
            name: f.name,
            slug: f.slug
          })),
          skipDuplicates: true
        });
        syncedCount += batch.length;
      }
    }
    // Batch update
    for (let i = 0; i < toUpdate.length; i += BATCH_DB_SIZE) {
      const batch = toUpdate.slice(i, i + BATCH_DB_SIZE);
      await Promise.all(batch.map(async (f: any) => {
        try {
          await prisma.igdbPlatformFamily.update({
            where: { igdbId: f.id },
            data: { name: f.name, slug: f.slug }
          });
          updatedCount++;
        } catch (error) {
          console.error(`Error updating platform family ${f.id}:`, error);
        }
      }));
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
