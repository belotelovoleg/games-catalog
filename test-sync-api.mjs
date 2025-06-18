import { readFileSync } from 'fs';

// Load environment variables from .env file
function loadEnv() {
  try {
    const envFile = readFileSync('.env', 'utf8');
    const lines = envFile.split('\n');
    lines.forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        // Remove quotes if present
        const cleanValue = value.trim().replace(/^"(.*)"$/, '$1');
        process.env[key.trim()] = cleanValue;
      }
    });
  } catch (error) {
    console.error('Could not load .env file:', error.message);
  }
}

loadEnv();

async function testSyncAPI() {
  try {
    console.log('Testing platform types sync API...');
    
    const response = await fetch('http://localhost:3002/api/admin/sync/platform-types', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      console.error('Error response:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('Error body:', errorText);
      return;
    }

    const result = await response.json();
    console.log('Platform types sync result:');
    console.log(JSON.stringify(result, null, 2));

  } catch (error) {
    console.error('Error testing sync API:', error);
  }
}

testSyncAPI();
