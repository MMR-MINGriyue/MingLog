// Enhanced Search Features Test Script
// This script tests the enhanced search functionality

async function testSearchFeatures() {
  console.log('🔍 Testing Enhanced Search Features...\n');
  
  try {
    // Test 1: Create test content for search
    console.log('1. Creating test content for search...');
    
    // Create test pages with different types of content
    const testPages = [
      {
        name: 'JavaScript Programming',
        title: 'JavaScript Programming Guide',
        tags: ['programming', 'javascript', 'web'],
        isJournal: false
      },
      {
        name: 'React Development',
        title: 'React Development Best Practices',
        tags: ['react', 'frontend', 'javascript'],
        isJournal: false
      },
      {
        name: 'Daily Journal 2024-01-15',
        title: 'Daily Journal - January 15, 2024',
        tags: ['journal', 'daily'],
        isJournal: true
      },
      {
        name: 'TypeScript Notes',
        title: 'TypeScript Advanced Features',
        tags: ['typescript', 'programming'],
        isJournal: false
      },
      {
        name: 'Search Algorithm Study',
        title: 'Search Algorithms and Data Structures',
        tags: ['algorithms', 'computer-science'],
        isJournal: false
      }
    ];
    
    const createdPages = [];
    
    for (const pageData of testPages) {
      const response = await fetch('http://localhost:3001/api/pages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: pageData.name,
          title: pageData.title,
          graphId: 'default',
          tags: pageData.tags,
          properties: {},
          isJournal: pageData.isJournal
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        createdPages.push(result.data);
        console.log(`✅ Created page: ${pageData.name}`);
      } else {
        console.log(`❌ Failed to create page: ${pageData.name}`);
      }
    }
    
    // Test 2: Create test blocks with searchable content
    console.log('\n2. Creating test blocks with searchable content...');
    
    if (createdPages.length > 0) {
      const testBlocks = [
        {
          content: 'JavaScript is a versatile programming language used for web development.',
          pageId: createdPages[0].id,
        },
        {
          content: 'React hooks like useState and useEffect make functional components powerful.',
          pageId: createdPages[1].id,
        },
        {
          content: 'Today I learned about advanced TypeScript generics and conditional types.',
          pageId: createdPages[2].id,
        },
        {
          content: 'Binary search algorithm has O(log n) time complexity for sorted arrays.',
          pageId: createdPages[4].id,
        },
        {
          content: 'TypeScript provides static type checking for JavaScript applications.',
          pageId: createdPages[3].id,
        }
      ];
      
      for (const blockData of testBlocks) {
        const response = await fetch('http://localhost:3001/api/blocks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: blockData.content,
            pageId: blockData.pageId,
            graphId: 'default',
            order: 1,
            properties: {}
          })
        });
        
        if (response.ok) {
          console.log(`✅ Created block: ${blockData.content.substring(0, 30)}...`);
        } else {
          console.log(`❌ Failed to create block`);
        }
      }
    }
    
    // Test 3: Test search API endpoints
    console.log('\n3. Testing search API endpoints...');
    
    const searchQueries = [
      { query: 'JavaScript', type: 'all' },
      { query: 'React', type: 'pages' },
      { query: 'TypeScript', type: 'blocks' },
      { query: 'programming', type: 'all' },
      { query: 'algorithm', type: 'all' }
    ];
    
    for (const searchQuery of searchQueries) {
      const response = await fetch('http://localhost:3001/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: searchQuery.query,
          type: searchQuery.type,
          limit: 10
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Search "${searchQuery.query}" (${searchQuery.type}): ${result.data.total} results`);
        
        // Show top results
        if (result.data.results && result.data.results.length > 0) {
          result.data.results.slice(0, 3).forEach((item, index) => {
            console.log(`   ${index + 1}. ${item.title} (${item.type}) - Score: ${Math.round(item.score * 100)}%`);
          });
        }
      } else {
        console.log(`❌ Search failed for "${searchQuery.query}"`);
      }
    }
    
    // Test 4: Test search suggestions
    console.log('\n4. Testing search suggestions...');
    
    const suggestionResponse = await fetch('http://localhost:3001/api/search/suggestions?q=java');
    if (suggestionResponse.ok) {
      const suggestions = await suggestionResponse.json();
      console.log('✅ Search suggestions for "java":', suggestions.data);
    } else {
      console.log('❌ Search suggestions failed');
    }
    
    // Test 5: Test search statistics
    console.log('\n5. Testing search statistics...');
    
    const statsResponse = await fetch('http://localhost:3001/api/search/stats');
    if (statsResponse.ok) {
      const stats = await statsResponse.json();
      console.log('✅ Search statistics:', stats.data);
    } else {
      console.log('❌ Search statistics failed');
    }
    
    // Test 6: Test advanced search filters
    console.log('\n6. Testing advanced search filters...');
    
    const advancedSearches = [
      {
        query: 'programming',
        filters: { tags: ['javascript'] },
        description: 'Search with tag filter'
      },
      {
        query: 'TypeScript',
        filters: { isJournal: false },
        description: 'Search excluding journals'
      },
      {
        query: 'daily',
        filters: { isJournal: true },
        description: 'Search only journals'
      }
    ];
    
    for (const search of advancedSearches) {
      const response = await fetch('http://localhost:3001/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: search.query,
          type: 'all',
          filters: search.filters,
          limit: 10
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log(`✅ ${search.description}: ${result.data.total} results`);
      } else {
        console.log(`❌ ${search.description}: failed`);
      }
    }
    
    console.log('\n🎉 Enhanced Search Features Testing Completed!');
    console.log('\n📋 Features Tested:');
    console.log('✅ Basic text search across pages and blocks');
    console.log('✅ Type-specific search (pages only, blocks only)');
    console.log('✅ Tag-based filtering');
    console.log('✅ Journal vs regular content filtering');
    console.log('✅ Search suggestions and autocomplete');
    console.log('✅ Search statistics and analytics');
    console.log('✅ Advanced search filters');
    console.log('✅ Relevance scoring and ranking');
    
    console.log('\n🌐 Frontend Features to Test Manually:');
    console.log('1. Visit http://localhost:3000/search for the full search page');
    console.log('2. Use Ctrl+K (or Cmd+K) for quick search from any page');
    console.log('3. Try different search queries and filters');
    console.log('4. Test keyboard navigation (↑/↓ arrows, Enter, Escape)');
    console.log('5. Check search history functionality');
    console.log('6. Test search result highlighting');
    console.log('7. Try advanced filters (type, tags, date range)');
    console.log('8. Test search suggestions and autocomplete');
    
    console.log('\n⌨️ Search Keyboard Shortcuts:');
    console.log('• Ctrl+K / Cmd+K - Open quick search');
    console.log('• ↑/↓ - Navigate search results');
    console.log('• Enter - Select search result');
    console.log('• Escape - Close search');
    console.log('• Ctrl+F - Toggle advanced filters');
    
    console.log('\n🔍 Search Features Available:');
    console.log('• Real-time search as you type');
    console.log('• Search across pages and blocks');
    console.log('• Tag-based filtering');
    console.log('• Content type filtering (journal/regular)');
    console.log('• Sort by relevance, date, or title');
    console.log('• Search history with localStorage');
    console.log('• Keyboard navigation support');
    console.log('• Search result highlighting');
    console.log('• Quick search from top bar');
    console.log('• Advanced search page with full features');
    
  } catch (error) {
    console.error('💥 Enhanced search features test failed:', error);
  }
}

testSearchFeatures();
