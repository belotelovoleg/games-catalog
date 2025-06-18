// Test script to fetch and display IGDB platforms data
async function testPlatformsAPI() {
  try {
    console.log('Fetching platforms from /api/admin/igdb-platforms...')
    
    const response = await fetch('http://localhost:3000/api/admin/igdb-platforms')
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const platforms = await response.json()
    
    console.log(`\n📊 Found ${platforms.length} platforms in database:`)
    console.log('=' .repeat(80))
    
    // Show first 5 platforms as examples
    const samplePlatforms = platforms.slice(0, 5)
    
    samplePlatforms.forEach((platform, index) => {
      console.log(`\n${index + 1}. ${platform.name} (ID: ${platform.igdbId})`)
      console.log(`   Abbreviation: ${platform.abbreviation || 'N/A'}`)
      console.log(`   Generation: ${platform.generation || 'N/A'}`)
      console.log(`   Family: ${platform.familyName || 'N/A'}`)
      console.log(`   Type: ${platform.typeName || 'N/A'}`)
      console.log(`   Has Logo: ${platform.imageUrl ? 'Yes' : 'No'}`)
      console.log(`   Has Versions: ${platform.hasVersions ? 'Yes' : 'No'}`)
    })
    
    if (platforms.length > 5) {
      console.log(`\n... and ${platforms.length - 5} more platforms`)
    }
    
    // Show full JSON structure of first platform
    console.log('\n📋 Full JSON structure of first platform:')
    console.log('=' .repeat(80))
    console.log(JSON.stringify(platforms[0], null, 2))
    
  } catch (error) {
    console.error('❌ Error fetching platforms:', error)
  }
}

testPlatformsAPI()
