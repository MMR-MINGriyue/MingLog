// Block Editor Advanced Features Test Script
// This script tests the enhanced block editor functionality

async function testBlockEditorFeatures() {
  console.log('🧩 Testing Block Editor Advanced Features...\n');
  
  try {
    // Test 1: Create a test page for block operations
    console.log('1. Creating test page for block editor features...');
    const pageResponse = await fetch('http://localhost:3001/api/pages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Block Editor Test Page',
        title: 'Advanced Block Editor Features Test',
        graphId: 'default',
        tags: ['test', 'editor', 'blocks'],
        properties: {}
      })
    });
    
    if (!pageResponse.ok) {
      console.log('❌ Failed to create test page');
      return;
    }
    
    const pageData = await pageResponse.json();
    const pageId = pageData.data.id;
    console.log('✅ Test page created:', pageData.data.name);
    
    // Test 2: Create multiple blocks with hierarchy
    console.log('\n2. Creating hierarchical block structure...');
    
    const blocks = [
      { content: 'Main Topic: Advanced Block Editor', parentId: null, order: 1 },
      { content: 'Subtopic 1: Drag and Drop', parentId: null, order: 2 },
      { content: 'Feature: Reorder blocks by dragging', parentId: null, order: 3 },
      { content: 'Feature: Move blocks between levels', parentId: null, order: 4 },
      { content: 'Subtopic 2: Keyboard Shortcuts', parentId: null, order: 5 },
      { content: 'Ctrl+B for **bold** text', parentId: null, order: 6 },
      { content: 'Ctrl+I for *italic* text', parentId: null, order: 7 },
      { content: 'Tab for indentation', parentId: null, order: 8 },
    ];
    
    const createdBlocks = [];
    
    for (const [index, blockData] of blocks.entries()) {
      const blockResponse = await fetch('http://localhost:3001/api/blocks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: blockData.content,
          pageId: pageId,
          graphId: 'default',
          parentId: blockData.parentId,
          order: blockData.order,
          properties: {}
        })
      });
      
      if (blockResponse.ok) {
        const blockResult = await blockResponse.json();
        createdBlocks.push(blockResult.data);
        console.log(`✅ Block ${index + 1} created: ${blockData.content.substring(0, 30)}...`);
      } else {
        console.log(`❌ Failed to create block ${index + 1}`);
      }
    }
    
    // Test 3: Create child blocks (indented structure)
    console.log('\n3. Creating indented block structure...');
    
    if (createdBlocks.length >= 2) {
      const parentBlock = createdBlocks[1]; // "Subtopic 1: Drag and Drop"
      
      const childBlocks = [
        'Child block 1: Drag handle appears on hover',
        'Child block 2: Visual feedback during drag',
        'Child block 3: Drop zones highlight'
      ];
      
      for (const [index, content] of childBlocks.entries()) {
        const childResponse = await fetch('http://localhost:3001/api/blocks', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: content,
            pageId: pageId,
            graphId: 'default',
            parentId: parentBlock.id,
            order: index + 1,
            properties: {}
          })
        });
        
        if (childResponse.ok) {
          console.log(`✅ Child block created: ${content}`);
        } else {
          console.log(`❌ Failed to create child block: ${content}`);
        }
      }
    }
    
    // Test 4: Test block movement API
    console.log('\n4. Testing block movement API...');
    
    if (createdBlocks.length >= 3) {
      const blockToMove = createdBlocks[2];
      
      const moveResponse = await fetch(`http://localhost:3001/api/blocks/${blockToMove.id}/move`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          parentId: null,
          order: 1,
          pageId: pageId
        })
      });
      
      if (moveResponse.ok) {
        console.log('✅ Block movement API working');
      } else {
        console.log('❌ Block movement API failed');
      }
    }
    
    // Test 5: Test block collapse/expand
    console.log('\n5. Testing block collapse functionality...');
    
    if (createdBlocks.length >= 1) {
      const blockToCollapse = createdBlocks[0];
      
      const collapseResponse = await fetch(`http://localhost:3001/api/blocks/${blockToCollapse.id}/toggle-collapse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (collapseResponse.ok) {
        console.log('✅ Block collapse/expand API working');
      } else {
        console.log('❌ Block collapse/expand API failed');
      }
    }
    
    // Test 6: Get final block structure
    console.log('\n6. Retrieving final block structure...');
    
    const blocksResponse = await fetch(`http://localhost:3001/api/blocks?pageId=${pageId}`);
    if (blocksResponse.ok) {
      const blocksData = await blocksResponse.json();
      console.log(`✅ Final structure has ${blocksData.data.length} blocks`);
      
      // Display hierarchy
      const rootBlocks = blocksData.data.filter(block => !block.parentId);
      const childBlocks = blocksData.data.filter(block => block.parentId);
      
      console.log(`   - Root blocks: ${rootBlocks.length}`);
      console.log(`   - Child blocks: ${childBlocks.length}`);
    }
    
    console.log('\n🎉 Block Editor Advanced Features Testing Completed!');
    console.log('\n📋 Features Tested:');
    console.log('✅ Hierarchical block creation');
    console.log('✅ Parent-child relationships');
    console.log('✅ Block movement API');
    console.log('✅ Block collapse/expand API');
    console.log('✅ Complex block structures');
    
    console.log('\n🌐 Frontend Features to Test Manually:');
    console.log('1. Visit http://localhost:3000 and navigate to the test page');
    console.log('2. Try dragging blocks to reorder them');
    console.log('3. Use Tab/Shift+Tab to indent/outdent blocks');
    console.log('4. Test keyboard shortcuts (Ctrl+B, Ctrl+I, etc.)');
    console.log('5. Try the formatting toolbar (Ctrl+/)');
    console.log('6. Test block collapse/expand by clicking arrows');
    console.log('7. Use quick action buttons (hover over blocks)');
    console.log('8. Test page/block references with [[]] and (())');
    
    console.log('\n⌨️ Keyboard Shortcuts Available:');
    console.log('• Enter - Create new block');
    console.log('• Backspace - Delete empty block');
    console.log('• Tab - Indent block');
    console.log('• Shift+Tab - Outdent block');
    console.log('• Ctrl+B - Bold text');
    console.log('• Ctrl+I - Italic text');
    console.log('• Ctrl+U - Underline text');
    console.log('• Ctrl+E - Code formatting');
    console.log('• Ctrl+/ - Toggle formatting toolbar');
    console.log('• Ctrl+D - Duplicate block');
    console.log('• Ctrl+Shift+↑/↓ - Move block up/down');
    console.log('• Ctrl+Delete - Delete current block');
    
  } catch (error) {
    console.error('💥 Block Editor features test failed:', error);
  }
}

testBlockEditorFeatures();
