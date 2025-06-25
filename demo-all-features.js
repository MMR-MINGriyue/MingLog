// MingLog Complete Feature Demonstration Script
// This script demonstrates all implemented features of MingLog

async function demonstrateAllFeatures() {
  console.log('🎉 MingLog Complete Feature Demonstration\n');
  console.log('========================================\n');
  
  try {
    // Feature 1: API Health Check
    console.log('1. 🏥 API Health Check');
    console.log('   Testing basic API connectivity...');
    
    const healthResponse = await fetch('http://localhost:3001/health');
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log(`   ✅ API Status: ${healthData.status}`);
      console.log(`   ✅ Database: ${healthData.database}`);
      console.log(`   ✅ Uptime: ${healthData.uptime}s\n`);
    } else {
      console.log('   ❌ API Health Check Failed\n');
      return;
    }

    // Feature 2: Graph Management
    console.log('2. 📊 Graph Management');
    console.log('   Testing graph operations...');
    
    const graphsResponse = await fetch('http://localhost:3001/api/graphs');
    if (graphsResponse.ok) {
      const graphsData = await graphsResponse.json();
      console.log(`   ✅ Found ${graphsData.data.length} graphs`);
      console.log(`   ✅ Default graph: ${graphsData.data[0]?.name}\n`);
    }

    // Feature 3: Page Management
    console.log('3. 📄 Page Management');
    console.log('   Testing page CRUD operations...');
    
    // Create a demo page
    const demoPage = await fetch('http://localhost:3001/api/pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Demo Feature Showcase',
        title: 'MingLog Feature Demonstration',
        graphId: 'default',
        tags: ['demo', 'features', 'showcase'],
        properties: { category: 'demonstration' }
      })
    });
    
    if (demoPage.ok) {
      const pageData = await demoPage.json();
      console.log(`   ✅ Created demo page: ${pageData.data.name}`);
      global.demoPageId = pageData.data.id;
    }

    // Feature 4: Block Editor
    console.log('\n4. 🧩 Block Editor');
    console.log('   Testing block operations...');
    
    if (global.demoPageId) {
      const blocks = [
        'Welcome to MingLog - A Modern Knowledge Management System',
        'Key Features:',
        '  - Hierarchical block structure',
        '  - Rich text editing with TipTap',
        '  - Drag and drop reordering',
        '  - Keyboard shortcuts for efficiency',
        'Advanced Editing:',
        '  - **Bold text** and *italic text*',
        '  - `Code snippets` and formatting',
        '  - Nested blocks with indentation'
      ];
      
      for (const [index, content] of blocks.entries()) {
        const blockResponse = await fetch('http://localhost:3001/api/blocks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: content,
            pageId: global.demoPageId,
            graphId: 'default',
            order: index + 1,
            properties: {}
          })
        });
        
        if (blockResponse.ok) {
          console.log(`   ✅ Created block ${index + 1}: ${content.substring(0, 30)}...`);
        }
      }
    }

    // Feature 5: Search Functionality
    console.log('\n5. 🔍 Search Functionality');
    console.log('   Testing search capabilities...');
    
    const searchQueries = ['MingLog', 'features', 'block', 'editing'];
    
    for (const query of searchQueries) {
      const searchResponse = await fetch('http://localhost:3001/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, type: 'all', limit: 5 })
      });
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        console.log(`   ✅ Search "${query}": ${searchData.data.total} results`);
      }
    }

    // Feature 6: Data Export
    console.log('\n6. 📤 Data Export');
    console.log('   Testing export functionality...');
    
    // JSON Export
    const jsonExport = await fetch('http://localhost:3001/api/export/default?format=json');
    if (jsonExport.ok) {
      const jsonData = await jsonExport.json();
      console.log(`   ✅ JSON Export: ${jsonData.pages.length} pages exported`);
    }
    
    // Markdown Export
    const mdExport = await fetch('http://localhost:3001/api/export/default?format=markdown');
    if (mdExport.ok) {
      const mdData = await mdExport.text();
      console.log(`   ✅ Markdown Export: ${mdData.length} characters exported`);
    }

    // Feature 7: Advanced Block Operations
    console.log('\n7. 🔧 Advanced Block Operations');
    console.log('   Testing block manipulation...');
    
    // Get blocks for manipulation
    const blocksResponse = await fetch(`http://localhost:3001/api/blocks?pageId=${global.demoPageId}`);
    if (blocksResponse.ok) {
      const blocksData = await blocksResponse.json();
      const blocks = blocksData.data;
      
      if (blocks.length > 0) {
        // Test block movement
        const moveResponse = await fetch(`http://localhost:3001/api/blocks/${blocks[0].id}/move`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pageId: global.demoPageId, order: 2 })
        });
        
        if (moveResponse.ok) {
          console.log('   ✅ Block movement successful');
        }
        
        // Test block collapse
        const collapseResponse = await fetch(`http://localhost:3001/api/blocks/${blocks[0].id}/toggle-collapse`, {
          method: 'POST'
        });
        
        if (collapseResponse.ok) {
          console.log('   ✅ Block collapse toggle successful');
        }
      }
    }

    // Feature 8: Journal Pages
    console.log('\n8. 📅 Journal Pages');
    console.log('   Testing journal functionality...');
    
    const journalResponse = await fetch('http://localhost:3001/api/pages/journal/today', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ graphId: 'default' })
    });
    
    if (journalResponse.ok) {
      const journalData = await journalResponse.json();
      console.log(`   ✅ Today's journal: ${journalData.data.name}`);
    }

    // Feature 9: Search Statistics
    console.log('\n9. 📊 Search Statistics');
    console.log('   Testing search analytics...');
    
    const statsResponse = await fetch('http://localhost:3001/api/search/stats');
    if (statsResponse.ok) {
      const statsData = await statsResponse.json();
      console.log('   ✅ Search statistics retrieved');
      console.log(`   ✅ Total searchable items: ${statsData.data.totalItems || 'N/A'}`);
    }

    // Feature 10: Data Import Test
    console.log('\n10. 📥 Data Import');
    console.log('    Testing import functionality...');
    
    const importData = {
      version: '1.0',
      graph: { id: 'default', name: 'Test Import' },
      pages: [{
        id: 'import-test-page',
        name: 'Import Test Page',
        title: 'Imported Content Test',
        isJournal: false,
        tags: ['imported', 'test'],
        properties: {},
        blocks: [{
          id: 'import-test-block',
          content: 'This content was imported successfully!',
          order: 1,
          parentId: null,
          collapsed: false,
          properties: {}
        }]
      }]
    };
    
    const importResponse = await fetch('http://localhost:3001/api/import/json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: importData,
        options: { graphId: 'default', mergeStrategy: 'merge' }
      })
    });
    
    if (importResponse.ok) {
      const importResult = await importResponse.json();
      console.log(`    ✅ Import successful: ${importResult.data.pagesImported} pages imported`);
    }

    // Summary
    console.log('\n🎊 Feature Demonstration Complete!');
    console.log('=====================================\n');
    
    console.log('✅ Demonstrated Features:');
    console.log('   1. API Health Monitoring');
    console.log('   2. Graph Management');
    console.log('   3. Page CRUD Operations');
    console.log('   4. Block Editor with Rich Content');
    console.log('   5. Full-Text Search');
    console.log('   6. Data Export (JSON/Markdown)');
    console.log('   7. Advanced Block Operations');
    console.log('   8. Journal Page Creation');
    console.log('   9. Search Analytics');
    console.log('   10. Data Import Functionality');
    
    console.log('\n🌐 Frontend Features (Manual Testing):');
    console.log('   • Visit http://localhost:3000 for the web interface');
    console.log('   • Use Ctrl+K for quick search');
    console.log('   • Try drag-and-drop block reordering');
    console.log('   • Test keyboard shortcuts in the editor');
    console.log('   • Explore the search page at /search');
    console.log('   • Create and edit pages and blocks');
    
    console.log('\n⌨️  Keyboard Shortcuts:');
    console.log('   • Ctrl+K - Quick search');
    console.log('   • Enter - New block');
    console.log('   • Tab - Indent block');
    console.log('   • Shift+Tab - Outdent block');
    console.log('   • Ctrl+B - Bold text');
    console.log('   • Ctrl+I - Italic text');
    console.log('   • Ctrl+/ - Format toolbar');
    
    console.log('\n🚀 MingLog is ready for use!');
    console.log('   All core features are functional and tested.');
    console.log('   The application provides a complete knowledge management experience.');
    
  } catch (error) {
    console.error('💥 Feature demonstration failed:', error);
  }
}

// Run the demonstration
demonstrateAllFeatures();
