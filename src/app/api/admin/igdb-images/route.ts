import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const logoId = searchParams.get('logoId');

    if (!logoId) {
      return NextResponse.json(
        { error: 'Logo ID is required' },
        { status: 400 }
      );
    }

    // Get image from local database
    const image = await prisma.igdbImage.findUnique({
      where: { igdbId: parseInt(logoId) }
    });

    if (!image) {
      return NextResponse.json(
        { error: 'Image not found in local database. Please sync IGDB images first.' },
        { status: 404 }
      );
    }

    // Return the pre-computed image URL and metadata
    return NextResponse.json({
      imageUrl: image.computed_url,
      image_id: image.image_id,
      width: image.width,
      height: image.height,
      animated: image.animated,
      alpha_channel: image.alpha_channel
    });

  } catch (error) {
    console.error('Error fetching image:', error);
    return NextResponse.json(
      { error: 'Failed to fetch image' },
      { status: 500 }
    );
  }
}
