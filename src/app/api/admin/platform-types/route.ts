import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const platformTypes = await prisma.igdbPlatformType.findMany({
      orderBy: { name: 'asc' }
    });

    return NextResponse.json(platformTypes);
  } catch (error) {
    console.error('Error fetching platform types:', error);
    return NextResponse.json(
      { error: 'Failed to fetch platform types' },
      { status: 500 }
    );
  }
}
