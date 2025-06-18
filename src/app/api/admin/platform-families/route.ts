import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const platformFamilies = await prisma.igdbPlatformFamily.findMany({
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(platformFamilies);
  } catch (error) {
    console.error('Error fetching platform families:', error);
    return NextResponse.json(
      { error: 'Failed to fetch platform families' },
      { status: 500 }
    );
  }
}
