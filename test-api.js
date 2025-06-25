// Simple API test script
async function testAPI() {
  const baseUrl = 'http://localhost:3001/api';
  
  try {
    console.log('🧪 Testing API endpoints...\n');
    
    // Test 1: Health check
    console.log('1. Testing health check...');
    const healthResponse = await fetch('http://localhost:3001/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
    
    // Test 2: Get graphs
    console.log('\n2. Testing get graphs...');
    const graphsResponse = await fetch(`${baseUrl}/graphs`);
    const graphsData = await graphsResponse.json();
    console.log('✅ Graphs:', graphsData);
    
    // Test 3: Create today's journal
    console.log('\n3. Testing create today journal...');
    const journalResponse = await fetch(`${baseUrl}/pages/journal/today`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ graphId: 'default' })
    });
    
    if (journalResponse.ok) {
      const journalData = await journalResponse.json();
      console.log('✅ Today journal created:', journalData);
    } else {
      const errorData = await journalResponse.json();
      console.log('❌ Journal creation failed:', errorData);
    }
    
    // Test 4: Get pages
    console.log('\n4. Testing get pages...');
    const pagesResponse = await fetch(`${baseUrl}/pages?graphId=default`);
    const pagesData = await pagesResponse.json();
    console.log('✅ Pages:', pagesData);
    
    // Test 5: Create a test page
    console.log('\n5. Testing create page...');
    const createPageResponse = await fetch(`${baseUrl}/pages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Test Page',
        title: 'Test Page',
        graphId: 'default',
        tags: ['test'],
        properties: {}
      })
    });
    
    if (createPageResponse.ok) {
      const pageData = await createPageResponse.json();
      console.log('✅ Test page created:', pageData);
      
      // Test 6: Create a block in the test page
      console.log('\n6. Testing create block...');
      const createBlockResponse = await fetch(`${baseUrl}/blocks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: 'This is a test block',
          pageId: pageData.data.id,
          graphId: 'default',
          order: 1,
          properties: {}
        })
      });
      
      if (createBlockResponse.ok) {
        const blockData = await createBlockResponse.json();
        console.log('✅ Test block created:', blockData);
      } else {
        const errorData = await createBlockResponse.json();
        console.log('❌ Block creation failed:', errorData);
      }
    } else {
      const errorData = await createPageResponse.json();
      console.log('❌ Page creation failed:', errorData);
    }
    
    console.log('\n🎉 API test completed!');
    
  } catch (error) {
    console.error('💥 API test failed:', error);
  }
}

testAPI();
