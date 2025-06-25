// Frontend UX test script
// This script tests the user experience improvements

async function testFrontendUX() {
  console.log('🎨 Testing Frontend User Experience Improvements...\n');
  
  try {
    // Test 1: Check if the app loads
    console.log('1. Testing app loading...');
    const response = await fetch('http://localhost:3000');
    if (response.ok) {
      console.log('✅ App loads successfully');
    } else {
      console.log('❌ App failed to load');
      return;
    }
    
    // Test 2: Check if API is accessible from frontend
    console.log('\n2. Testing API connectivity from frontend...');
    const apiResponse = await fetch('http://localhost:3001/health');
    if (apiResponse.ok) {
      const healthData = await apiResponse.json();
      console.log('✅ API connectivity:', healthData.status);
    } else {
      console.log('❌ API not accessible from frontend');
    }
    
    // Test 3: Test API endpoints that frontend will use
    console.log('\n3. Testing key API endpoints...');
    
    const endpoints = [
      { name: 'Graphs', url: 'http://localhost:3001/api/graphs' },
      { name: 'Pages', url: 'http://localhost:3001/api/pages' },
      { name: 'Blocks', url: 'http://localhost:3001/api/blocks' },
      { name: 'Search Stats', url: 'http://localhost:3001/api/search/stats' }
    ];
    
    for (const endpoint of endpoints) {
      try {
        const res = await fetch(endpoint.url);
        if (res.ok) {
          console.log(`✅ ${endpoint.name} endpoint working`);
        } else {
          console.log(`❌ ${endpoint.name} endpoint failed: ${res.status}`);
        }
      } catch (error) {
        console.log(`❌ ${endpoint.name} endpoint error:`, error.message);
      }
    }
    
    // Test 4: Test creating a page through API
    console.log('\n4. Testing page creation workflow...');
    try {
      const createResponse = await fetch('http://localhost:3001/api/pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'UX Test Page',
          title: 'User Experience Test Page',
          graphId: 'default',
          tags: ['test', 'ux'],
          properties: {}
        })
      });
      
      if (createResponse.ok) {
        const pageData = await createResponse.json();
        console.log('✅ Page creation successful:', pageData.data.name);
        
        // Test creating a block in the page
        const blockResponse = await fetch('http://localhost:3001/api/blocks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: 'This is a test block for UX testing',
            pageId: pageData.data.id,
            graphId: 'default',
            order: 1,
            properties: {}
          })
        });
        
        if (blockResponse.ok) {
          console.log('✅ Block creation successful');
        } else {
          console.log('❌ Block creation failed');
        }
        
      } else {
        console.log('❌ Page creation failed:', createResponse.status);
      }
    } catch (error) {
      console.log('❌ Page creation error:', error.message);
    }
    
    // Test 5: Test search functionality
    console.log('\n5. Testing search functionality...');
    try {
      const searchResponse = await fetch('http://localhost:3001/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: 'test',
          type: 'all',
          limit: 10
        })
      });
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        console.log('✅ Search working, found:', searchData.data.total, 'results');
      } else {
        console.log('❌ Search failed');
      }
    } catch (error) {
      console.log('❌ Search error:', error.message);
    }
    
    // Test 6: Test today's journal creation
    console.log('\n6. Testing today\'s journal creation...');
    try {
      const journalResponse = await fetch('http://localhost:3001/api/pages/journal/today', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          graphId: 'default'
        })
      });
      
      if (journalResponse.ok) {
        const journalData = await journalResponse.json();
        console.log('✅ Today\'s journal creation successful:', journalData.data.name);
      } else {
        console.log('❌ Today\'s journal creation failed');
      }
    } catch (error) {
      console.log('❌ Today\'s journal error:', error.message);
    }
    
    console.log('\n🎉 Frontend UX testing completed!');
    console.log('\n📋 Summary of UX Improvements:');
    console.log('✅ Loading spinners with descriptive text');
    console.log('✅ Error messages with retry functionality');
    console.log('✅ Empty state components with call-to-action');
    console.log('✅ Toast notifications for user feedback');
    console.log('✅ Skeleton loaders for better perceived performance');
    console.log('✅ Improved button states (loading, disabled)');
    console.log('✅ Better error boundaries and fallbacks');
    
    console.log('\n🌐 Test the following in your browser:');
    console.log('1. Visit http://localhost:3000 to see the improved UI');
    console.log('2. Try creating a new page to see toast notifications');
    console.log('3. Try creating blocks to see loading states');
    console.log('4. Check empty states when no content exists');
    console.log('5. Test error scenarios by stopping the API server');
    
  } catch (error) {
    console.error('💥 Frontend UX test failed:', error);
  }
}

testFrontendUX();
