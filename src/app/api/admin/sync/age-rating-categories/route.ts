import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getIGDBAccessToken } from '@/lib/igdb-token'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key'
const IGDB_CLIENT_ID = process.env.IGDB_CLIENT_ID

async function verifyAdmin(req: Request) {
  let token = null
  
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7)
  }
  
  if (!token) {
    const cookieHeader = req.headers.get('cookie')
    if (cookieHeader) {
      const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=')
        if (key && value) {
          acc[key] = value
        }
        return acc
      }, {} as Record<string, string>)
      
      token = cookies.token
    }
  }
  
  if (!token) {
    return null
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: number; isAdmin: boolean }
    return decoded.isAdmin ? decoded : null
  } catch (error) {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request)
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin authentication required' },
        { status: 401 }
      )
    }

    if (!IGDB_CLIENT_ID) {
      return NextResponse.json(
        { error: 'IGDB client ID not configured' },
        { status: 500 }
      )    }
    
    const accessToken = await getIGDBAccessToken()

    console.log('Starting age rating categories sync...')

    // Fetch all age rating categories from IGDB with pagination
    let allCategories = []
    let offset = 0
    const limit = 500 // IGDB max limit
    
    while (true) {      console.log(`Fetching age rating categories batch: offset ${offset}, limit ${limit}`)
      
      const requestBody = `fields rating; limit ${limit}; offset ${offset}; sort id asc;`
      
      console.log('IGDB API Request:', {
        url: 'https://api.igdb.com/v4/age_rating_categories',
        method: 'POST',
        headers: {
          'Client-ID': IGDB_CLIENT_ID,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'text/plain'
        },
        body: requestBody
      })
      
      const response = await fetch('https://api.igdb.com/v4/age_rating_categories', {
        method: 'POST',
        headers: {
          'Client-ID': IGDB_CLIENT_ID,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'text/plain'
        },
        body: requestBody
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('IGDB API Error Details:', {
          status: response.status,
          statusText: response.statusText,
          response: errorText
        })
        throw new Error(`IGDB API error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const categories = await response.json()
      
      if (categories.length === 0) {
        console.log('No more age rating categories to fetch')
        break
      }

      console.log(`Got ${categories.length} age rating categories in this batch`)
      allCategories.push(...categories)

      // If we got fewer categories than the limit, we've reached the end
      if (categories.length < limit) {
        console.log('Reached end of age rating categories data')
        break
      }      offset += limit
      
      // Add a small delay to respect IGDB rate limits (4 requests per second)
      await new Promise(resolve => setTimeout(resolve, 250))
    }
    
    console.log(`Total age rating categories fetched: ${allCategories.length}`)
    const categories = allCategories
    
    let newCount = 0
    let updatedCount = 0
    let processedCount = 0

    // Process in batches to avoid overwhelming the database
    const BATCH_SIZE = 100
    const batches = []
    for (let i = 0; i < categories.length; i += BATCH_SIZE) {
      batches.push(categories.slice(i, i + BATCH_SIZE))
    }

    for (const batch of batches) {
      // Get existing categories for this batch
      const existingCategories = await prisma.igdbAgeRatingCategories.findMany({
        where: {
          igdbId: {
            in: batch.map(c => c.id)
          }
        }
      })

      const existingIds = new Set(existingCategories.map(c => c.igdbId))

      // Prepare update and create operations
      const toUpdate = batch.filter(c => existingIds.has(c.id))
      const toCreate = batch.filter(c => !existingIds.has(c.id))

      // Batch updates
      for (const category of toUpdate) {
        await prisma.igdbAgeRatingCategories.update({
          where: { igdbId: category.id },
          data: {
            rating: category.rating || ''
          }
        })
        updatedCount++
      }

      // Batch creates
      if (toCreate.length > 0) {
        await prisma.igdbAgeRatingCategories.createMany({
          data: toCreate.map(category => ({
            igdbId: category.id,
            rating: category.rating || ''
          }))
        })
        newCount += toCreate.length
      }

      processedCount += batch.length
      console.log(`Processed batch: ${toUpdate.length} updated, ${toCreate.length} created (${processedCount} of ${categories.length})`)
    }

    return NextResponse.json({
      success: true,
      totalSynced: categories.length,
      new: newCount,
      updated: updatedCount,
      message: `Age rating categories sync completed`
    })

  } catch (error) {
    console.error('Error syncing age rating categories:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to sync age rating categories' },
      { status: 500 }
    )
  }
}
