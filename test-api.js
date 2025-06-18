async function testAPI() {
  try {
    const response = await fetch('http://localhost:3000/api/admin/igdb-platforms');
    const data = await response.json();
    
    console.log('Response status:', response.status);
    console.log('Number of platforms:', data.length);
    
    if (data.length > 0) {
      console.log('\n--- ACTUAL FIRST PLATFORM JSON ---');
      console.log(JSON.stringify(data[0], null, 2));
    }
    
    if (data.length > 1) {
      console.log('\n--- ACTUAL SECOND PLATFORM JSON ---');
      console.log(JSON.stringify(data[1], null, 2));
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testAPI();
