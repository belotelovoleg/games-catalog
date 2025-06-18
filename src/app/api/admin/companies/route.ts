import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');

    if (!idsParam) {
      return NextResponse.json({ error: 'No company IDs provided' }, { status: 400 });
    }

    // Parse the comma-separated IDs
    const ids = idsParam.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));

    if (ids.length === 0) {
      return NextResponse.json({ error: 'No valid company IDs provided' }, { status: 400 });
    }    // Fetch companies from the database
    const companies = await prisma.igdbCompany.findMany({
      where: {
        igdbId: {
          in: ids
        }
      },
      select: {
        igdbId: true,
        name: true
      }
    });

    // Create a map for easy lookup
    const companyMap = companies.reduce((acc, company) => {
      acc[company.igdbId] = company;
      return acc;
    }, {} as Record<number, typeof companies[0]>);

    return NextResponse.json({ 
      success: true, 
      companies: companyMap 
    });

  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
}
