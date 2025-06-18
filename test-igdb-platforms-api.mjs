async function testIgdbPlatformsAPI() {
  try {
    console.log('Testing /api/admin/igdb-platforms endpoint...');
    
    const response = await fetch('http://localhost:3000/api/admin/igdb-platforms');
    
    if (!response.ok) {
      console.error(`HTTP Error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Error response:', errorText);
      return;
    }
    
    const data = await response.json();
    
    console.log(`Response received: ${Array.isArray(data) ? data.length : 'not an array'} items`);
    
    if (Array.isArray(data) && data.length > 0) {
      console.log('First few platforms:');
      console.table(data.slice(0, 3).map(p => ({
        igdbId: p.igdbId,
        name: p.name,
        abbreviation: p.abbreviation,
        hasLogo: !!p.imageUrl,
        familyName: p.familyName,
        typeName: p.typeName
      })));
    } else {
      console.log('No platforms returned or empty array');
    }
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testIgdbPlatformsAPI();
