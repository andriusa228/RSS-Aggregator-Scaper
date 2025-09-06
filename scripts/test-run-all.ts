import 'dotenv/config';

async function testRunAll() {
  const adminToken = process.env.ADMIN_TOKEN || 'test-token';
  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

  console.log('🧪 Testing Run All Ingestion...');

  try {
    // Test 1: Start ingestion
    console.log('\n1. Starting ingestion...');
    const startResponse = await fetch(`${baseUrl}/api/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ strategy: 'AUTO' })
    });

    if (!startResponse.ok) {
      throw new Error(`Failed to start ingestion: ${startResponse.status} ${startResponse.statusText}`);
    }

    const startData = await startResponse.json();
    console.log('✅ Ingestion started:', startData);

    const jobId = startData.jobId;
    if (!jobId) {
      throw new Error('No jobId returned');
    }

    // Test 2: Poll status until completion
    console.log('\n2. Polling status...');
    let done = false;
    let attempts = 0;
    const maxAttempts = 60; // 1 minute max

    while (!done && attempts < maxAttempts) {
      const statusResponse = await fetch(`${baseUrl}/api/ingest/status?jobId=${jobId}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });

      if (!statusResponse.ok) {
        throw new Error(`Failed to get status: ${statusResponse.status} ${statusResponse.statusText}`);
      }

      const statusData = await statusResponse.json();
      console.log(`📊 Status: ${statusData.processed}/${statusData.total} (${statusData.successes} success, ${statusData.failures.length} failed)`);

      done = statusData.done;
      attempts++;

      if (!done) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      }
    }

    if (done) {
      console.log('✅ Ingestion completed successfully!');
    } else {
      console.log('⏰ Test timed out after 1 minute');
    }

    // Test 3: Try to start another ingestion (should fail)
    console.log('\n3. Testing duplicate prevention...');
    const duplicateResponse = await fetch(`${baseUrl}/api/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (duplicateResponse.status === 409) {
      console.log('✅ Duplicate prevention working correctly');
    } else {
      console.log('⚠️ Duplicate prevention not working as expected');
    }

    // Test 4: Test invalid jobId
    console.log('\n4. Testing invalid jobId...');
    const invalidResponse = await fetch(`${baseUrl}/api/ingest/status?jobId=invalid-id`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    if (invalidResponse.status === 404) {
      console.log('✅ Invalid jobId handling working correctly');
    } else {
      console.log('⚠️ Invalid jobId handling not working as expected');
    }

    console.log('\n🎉 All tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
testRunAll().catch(console.error);
