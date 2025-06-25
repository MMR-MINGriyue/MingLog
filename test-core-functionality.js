// 简单的核心功能测试脚本
// 这个脚本测试MingLog的核心服务功能

import { MingLogCore } from './packages/core/dist/index.js';

async function testCoreServices() {
  console.log('🚀 开始测试MingLog核心功能...\n');

  try {
    // 1. 初始化核心服务
    console.log('1. 初始化MingLogCore...');
    const core = new MingLogCore();
    await core.initialize();
    console.log('✅ 核心服务初始化成功\n');

    // 2. 测试图谱服务
    console.log('2. 测试图谱服务...');
    const currentGraph = core.getCurrentGraph();
    console.log(`✅ 当前图谱: ${currentGraph?.name || '未知'}\n`);

    // 3. 测试页面服务
    console.log('3. 测试页面服务...');
    
    // 创建测试页面
    const testPage = await core.pages.createPage('测试页面');
    console.log(`✅ 创建页面成功: ${testPage.name} (ID: ${testPage.id})`);
    
    // 获取所有页面
    const allPages = await core.pages.getAllPages();
    console.log(`✅ 获取所有页面: 共 ${allPages.length} 个页面`);
    
    // 创建今日日记
    const todayJournal = await core.pages.createTodayJournal();
    console.log(`✅ 创建今日日记: ${todayJournal.name}\n`);

    // 4. 测试块服务
    console.log('4. 测试块服务...');
    
    // 创建测试块
    const testBlock = await core.blocks.createBlock('这是一个测试块', testPage.id);
    console.log(`✅ 创建块成功: ${testBlock.content} (ID: ${testBlock.id})`);
    
    // 创建子块
    const childBlock = await core.blocks.createBlock('这是一个子块', testPage.id, testBlock.id);
    console.log(`✅ 创建子块成功: ${childBlock.content} (ID: ${childBlock.id})`);
    
    // 获取页面的所有块
    const pageBlocks = await core.blocks.getBlocksByPage(testPage.id);
    console.log(`✅ 获取页面块: 共 ${pageBlocks.length} 个块\n`);

    // 5. 测试搜索服务
    console.log('5. 测试搜索服务...');
    
    // 搜索页面
    const searchResults = core.search.search('测试');
    console.log(`✅ 搜索结果: 找到 ${searchResults.length} 个结果`);
    
    // 快速搜索
    const quickResults = core.search.quickSearch('测试');
    console.log(`✅ 快速搜索: 找到 ${quickResults.length} 个结果`);
    
    // 获取搜索统计
    const searchStats = core.search.getStats();
    console.log(`✅ 搜索统计: ${searchStats.pages} 个页面, ${searchStats.blocks} 个块\n`);

    // 6. 测试数据更新
    console.log('6. 测试数据更新...');
    
    // 更新页面
    const updatedPage = await core.pages.updatePage(testPage.id, {
      title: '更新后的测试页面',
      tags: ['测试', '更新']
    });
    console.log(`✅ 更新页面成功: ${updatedPage.title}`);
    
    // 更新块
    const updatedBlock = await core.blocks.updateBlock(testBlock.id, '这是更新后的测试块');
    console.log(`✅ 更新块成功: ${updatedBlock.content}\n`);

    // 7. 测试层级操作
    console.log('7. 测试块层级操作...');
    
    // 缩进块
    await core.blocks.indentBlock(childBlock.id);
    console.log('✅ 块缩进操作成功');
    
    // 取消缩进
    await core.blocks.outdentBlock(childBlock.id);
    console.log('✅ 块取消缩进操作成功');
    
    // 折叠/展开
    await core.blocks.toggleCollapse(testBlock.id);
    console.log('✅ 块折叠切换操作成功\n');

    // 8. 测试删除操作
    console.log('8. 测试删除操作...');
    
    // 删除块
    await core.blocks.deleteBlock(childBlock.id);
    console.log('✅ 删除子块成功');
    
    // 删除页面（会级联删除所有块）
    await core.pages.deletePage(testPage.id);
    console.log('✅ 删除页面成功\n');

    // 9. 最终统计
    console.log('9. 最终统计...');
    const finalPages = await core.pages.getAllPages();
    const finalBlocks = await core.blocks.getAllBlocks();
    console.log(`✅ 最终状态: ${finalPages.length} 个页面, ${finalBlocks.length} 个块\n`);

    console.log('🎉 所有核心功能测试通过！');
    return true;

  } catch (error) {
    console.error('❌ 测试失败:', error);
    return false;
  }
}

// 运行测试
testCoreServices()
  .then(success => {
    if (success) {
      console.log('\n✅ 测试完成 - 所有功能正常');
      process.exit(0);
    } else {
      console.log('\n❌ 测试失败 - 存在问题');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n💥 测试执行出错:', error);
    process.exit(1);
  });
