/**
 * MingLog 双向链接系统功能演示
 */

import { PageLinkParser } from './PageLinkParser';
import { BlockLinkParser } from './BlockLinkParser';
import { UnifiedLinkParser } from './UnifiedLinkParser';

// 演示页面链接解析
function demonstratePageLinkParsing() {
  console.log('=== 页面链接解析演示 ===');
  
  const parser = new PageLinkParser();
  
  const testContent = `
这是一个包含多种链接的测试文档：

1. 简单页面链接：[[首页]]
2. 带别名的链接：[[技术文档|文档]]
3. 多个链接：[[项目介绍]] 和 [[开发指南]]
4. 中文链接：[[用户手册]] 包含详细说明
  `;

  const links = parser.parsePageLinks(testContent);
  
  console.log(`找到 ${links.length} 个页面链接：`);
  links.forEach((link, index) => {
    console.log(`${index + 1}. 页面名称: "${link.pageName}"`);
    console.log(`   显示文本: "${link.displayText}"`);
    console.log(`   位置: ${link.position}, 长度: ${link.length}`);
    if (link.alias) {
      console.log(`   别名: "${link.alias}"`);
    }
    console.log(`   上下文: "${link.context}"`);
    console.log('');
  });
}

// 演示块引用解析
function demonstrateBlockLinkParsing() {
  console.log('=== 块引用解析演示 ===');
  
  const parser = new BlockLinkParser();
  
  const testContent = `
这是一个包含块引用的文档：

参考之前的讨论 ((block-abc123)) 中提到的要点。

另外，((block-def456)) 也很重要。

最后，请查看 ((block-xyz789)) 的详细分析。
  `;

  const links = parser.parseBlockLinks(testContent);
  
  console.log(`找到 ${links.length} 个块引用：`);
  links.forEach((link, index) => {
    console.log(`${index + 1}. 块ID: "${link.blockId}"`);
    console.log(`   位置: ${link.position}, 长度: ${link.length}`);
    console.log(`   上下文: "${link.context}"`);
    console.log('');
  });
}

// 演示统一解析器
function demonstrateUnifiedParsing() {
  console.log('=== 统一解析器演示 ===');
  
  const parser = new UnifiedLinkParser();
  
  const testContent = `
# 项目文档

这个项目包含多个模块：

1. [[核心模块]] - 主要功能实现
2. [[用户界面|UI模块]] - 用户交互界面
3. 参考设计文档 ((design-doc-001))
4. 实现细节见 ((implementation-notes))

更多信息请查看 [[开发指南]] 和 [[API文档]]。
  `;

  const allLinks = parser.parseAllLinks(testContent);
  
  console.log(`总共找到 ${allLinks.length} 个链接：`);
  allLinks.forEach((link, index) => {
    if (link.type === 'page-reference') {
      console.log(`${index + 1}. [页面链接] "${link.pageName}" -> "${link.displayText}"`);
    } else {
      console.log(`${index + 1}. [块引用] "${link.blockId}"`);
    }
    console.log(`   位置: ${link.position}`);
    console.log('');
  });

  // 演示链接统计
  const stats = parser.getLinkStatistics(testContent);
  console.log('=== 链接统计 ===');
  console.log(`页面链接: ${stats.pageLinks.total} 个 (唯一: ${stats.pageLinks.unique})`);
  console.log(`块引用: ${stats.blockLinks.total} 个 (唯一: ${stats.blockLinks.unique})`);
  console.log(`总计: ${stats.total} 个链接`);
}

// 演示链接验证
function demonstrateLinkValidation() {
  console.log('=== 链接验证演示 ===');
  
  const parser = new UnifiedLinkParser();
  
  const testContent = `
正确的链接：[[正常页面]]
错误的链接：[[未完成的链接
另一个错误：未完成的链接]]
嵌套错误：[[外层[[内层]]外层]]
  `;

  const validation = parser.validateLinkSyntax(testContent);
  
  console.log(`链接语法验证结果: ${validation.isValid ? '通过' : '失败'}`);
  
  if (!validation.isValid) {
    console.log(`发现 ${validation.errors.length} 个错误：`);
    validation.errors.forEach((error, index) => {
      console.log(`${index + 1}. 位置 ${error.position}: ${error.message}`);
    });
  }
}

// 运行所有演示
export function runLinkSystemDemo() {
  console.log('🔗 MingLog 双向链接系统功能演示\n');
  
  try {
    demonstratePageLinkParsing();
    demonstrateBlockLinkParsing();
    demonstrateUnifiedParsing();
    demonstrateLinkValidation();
    
    console.log('✅ 双向链接系统演示完成！');
    console.log('\n核心功能验证：');
    console.log('✅ 页面链接解析 [[页面名称]]');
    console.log('✅ 别名支持 [[页面名称|显示文本]]');
    console.log('✅ 块引用解析 ((块ID))');
    console.log('✅ 上下文提取');
    console.log('✅ 链接统计');
    console.log('✅ 语法验证');
    
  } catch (error) {
    console.error('❌ 演示过程中出现错误:', error);
  }
}

// 如果直接运行此文件，执行演示
if (require.main === module) {
  runLinkSystemDemo();
}
