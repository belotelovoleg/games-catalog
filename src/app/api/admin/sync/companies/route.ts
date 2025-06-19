import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getIGDBAccessToken } from '@/lib/igdb-token';

const IGDB_CLIENT_ID = process.env.IGDB_CLIENT_ID

interface IgdbCompany {
  id: number;
  name: string;
}

async function fetchIgdbData(
  endpoint: string,
  fields: string,
  limit: number = 500,
  offset: number = 0
): Promise<any[]> {
  const accessToken = await getIGDBAccessToken()
  const body = `fields ${fields}; limit ${limit}; offset ${offset}; sort id asc;`;

  console.log(`Sending request to IGDB ${endpoint} API:`, {
    url: `https://api.igdb.com/v4/${endpoint}`,
    method: 'POST',
    headers: {
      'Client-ID': IGDB_CLIENT_ID!,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body
  });

  const response = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
    method: 'POST',
    headers: {
      'Client-ID': IGDB_CLIENT_ID!,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`IGDB API error: ${response.status} - ${errorText}`);
  }

  return response.json();
}

export async function POST(request: NextRequest) {
  try {
    console.log('Starting IGDB companies sync...');

    // Get only essential company fields - just ID and name
    const fields = 'id,name';

    let totalSynced = 0;
    let offset = 0;
    const limit = 500; // IGDB max limit

    while (true) {
      console.log(`Fetching companies batch: offset ${offset}, limit ${limit}`);
      
      const companies: IgdbCompany[] = await fetchIgdbData('companies', fields, limit, offset);
      
      if (companies.length === 0) {
        console.log('No more companies to fetch');
        break;
      }      console.log(`Processing ${companies.length} companies...`);

      // Process companies in batches to avoid overwhelming the database
      for (const company of companies) {
        try {
          await prisma.igdbCompany.upsert({
            where: { igdbId: company.id },
            update: {
              name: company.name,
            },
            create: {
              igdbId: company.id,
              name: company.name,
            },
          });
          totalSynced++;
        } catch (error) {
          console.error(`Error processing company ${company.id} (${company.name}):`, error);
        }
      }

      // If we got fewer companies than the limit, we've reached the end
      if (companies.length < limit) {
        console.log('Reached end of companies data');
        break;
      }

      offset += limit;

      // Add a small delay to respect IGDB rate limits (4 requests per second)
      await new Promise(resolve => setTimeout(resolve, 250));
    }

    console.log(`Companies sync completed. Total synced: ${totalSynced}`);

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${totalSynced} companies from IGDB`,
      totalSynced,
    });

  } catch (error) {
    console.error('Error syncing companies:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      },
      { status: 500 }
    );
  }
}
