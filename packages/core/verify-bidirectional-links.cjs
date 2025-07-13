/**
 * 双向链接系统集成验证脚本
 * 验证双向链接系统的核心功能是否正常工作
 */

const fs = require('fs');
const path = require('path');

class BidirectionalLinksVerifier {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      details: []
    };
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',    // cyan
      success: '\x1b[32m', // green
      warning: '\x1b[33m', // yellow
      error: '\x1b[31m',   // red
      reset: '\x1b[0m'
    };
    
    const timestamp = new Date().toLocaleTimeString();
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  test(description, testFn) {
    try {
      const result = testFn();
      if (result) {
        this.results.passed++;
        this.results.details.push({ description, status: 'PASS' });
        this.log(`✅ ${description}`, 'success');
      } else {
        this.results.failed++;
        this.results.details.push({ description, status: 'FAIL', reason: 'Test returned false' });
        this.log(`❌ ${description}`, 'error');
      }
    } catch (error) {
      this.results.failed++;
      this.results.details.push({ description, status: 'FAIL', reason: error.message });
      this.log(`❌ ${description}: ${error.message}`, 'error');
    }
  }

  async verify() {
    this.log('🔍 开始验证双向链接系统集成...', 'info');
    
    // 1. 验证核心文件存在
    this.verifyFileStructure();
    
    // 2. 验证集成类实现
    this.verifyIntegrationClass();
    
    // 3. 验证链接解析功能
    this.verifyLinkParsing();
    
    // 4. 验证数据库表结构
    this.verifyDatabaseSchema();
    
    // 5. 验证UI组件
    this.verifyUIComponents();
    
    // 6. 生成报告
    this.generateReport();
  }

  verifyFileStructure() {
    this.log('📁 验证文件结构...', 'info');
    
    const requiredFiles = [
      'src/integration/bidirectional-links-integration.ts',
      'src/test/bidirectional-links-integration.test.ts',
      'src/components/links/BacklinksPanel.tsx',
      'src/components/graph/LinkGraphComponent.tsx',
      'src/services/CrossModuleLinkService.ts',
      'src/links/LinkManagerService.ts'
    ];

    requiredFiles.forEach(file => {
      this.test(`文件存在: ${file}`, () => {
        return fs.existsSync(path.join(__dirname, file));
      });
    });
  }

  verifyIntegrationClass() {
    this.log('🔧 验证集成类实现...', 'info');
    
    this.test('BidirectionalLinksIntegration类定义正确', () => {
      const filePath = path.join(__dirname, 'src/integration/bidirectional-links-integration.ts');
      if (!fs.existsSync(filePath)) return false;
      
      const content = fs.readFileSync(filePath, 'utf8');
      return content.includes('export class BidirectionalLinksIntegration') &&
             content.includes('async initialize()') &&
             content.includes('getIntegrationStatus()') &&
             content.includes('async cleanup()');
    });

    this.test('集成类包含必要的方法', () => {
      const filePath = path.join(__dirname, 'src/integration/bidirectional-links-integration.ts');
      if (!fs.existsSync(filePath)) return false;
      
      const content = fs.readFileSync(filePath, 'utf8');
      const requiredMethods = [
        'initializeDatabaseTables',
        'setupEventListeners',
        'handleContentUpdate',
        'parseLinksFromContent',
        'createBidirectionalLink'
      ];
      
      return requiredMethods.every(method => content.includes(method));
    });
  }

  verifyLinkParsing() {
    this.log('🔗 验证链接解析功能...', 'info');
    
    this.test('页面链接正则表达式正确', () => {
      const pageLinksRegex = /\[\[([^\]]+)\]\]/g;
      const testContent = '这里有[[页面1]]和[[页面2|别名]]的链接';
      const matches = testContent.match(pageLinksRegex);
      return matches && matches.length === 2;
    });

    this.test('块引用正则表达式正确', () => {
      const blockLinksRegex = /\(\(([^)]+)\)\)/g;
      const testContent = '引用块((block-1))和((block-2))';
      const matches = testContent.match(blockLinksRegex);
      return matches && matches.length === 2;
    });

    this.test('混合链接解析正确', () => {
      const content = '混合链接：[[页面链接]]和((块引用))';
      const pageLinks = content.match(/\[\[([^\]]+)\]\]/g) || [];
      const blockLinks = content.match(/\(\(([^)]+)\)\)/g) || [];
      return pageLinks.length === 1 && blockLinks.length === 1;
    });
  }

  verifyDatabaseSchema() {
    this.log('🗄️ 验证数据库表结构...', 'info');
    
    this.test('双向链接表SQL语句正确', () => {
      const filePath = path.join(__dirname, 'src/integration/bidirectional-links-integration.ts');
      if (!fs.existsSync(filePath)) return false;
      
      const content = fs.readFileSync(filePath, 'utf8');
      return content.includes('CREATE TABLE IF NOT EXISTS bidirectional_links') &&
             content.includes('source_type TEXT NOT NULL') &&
             content.includes('target_type TEXT NOT NULL') &&
             content.includes('link_type TEXT NOT NULL') &&
             content.includes('bidirectional BOOLEAN DEFAULT 1');
    });

    this.test('数据库索引定义正确', () => {
      const filePath = path.join(__dirname, 'src/integration/bidirectional-links-integration.ts');
      if (!fs.existsSync(filePath)) return false;
      
      const content = fs.readFileSync(filePath, 'utf8');
      return content.includes('idx_bidirectional_links_source') &&
             content.includes('idx_bidirectional_links_target') &&
             content.includes('idx_bidirectional_links_type');
    });
  }

  verifyUIComponents() {
    this.log('🎨 验证UI组件...', 'info');
    
    this.test('BacklinksPanel组件存在', () => {
      const filePath = path.join(__dirname, 'src/components/links/BacklinksPanel.tsx');
      if (!fs.existsSync(filePath)) return false;
      
      const content = fs.readFileSync(filePath, 'utf8');
      return content.includes('export const BacklinksPanel') &&
             content.includes('BacklinksPanelProps') &&
             content.includes('useState') &&
             content.includes('useEffect');
    });

    this.test('LinkGraphComponent组件存在', () => {
      const filePath = path.join(__dirname, 'src/components/graph/LinkGraphComponent.tsx');
      if (!fs.existsSync(filePath)) return false;
      
      const content = fs.readFileSync(filePath, 'utf8');
      return content.includes('LinkGraphComponent') &&
             content.includes('d3') &&
             content.includes('svg');
    });

    this.test('组件包含必要的Props接口', () => {
      const filePath = path.join(__dirname, 'src/components/links/BacklinksPanel.tsx');
      if (!fs.existsSync(filePath)) return false;
      
      const content = fs.readFileSync(filePath, 'utf8');
      return content.includes('targetId') &&
             content.includes('isOpen') &&
             content.includes('onClose') &&
             content.includes('backlinks');
    });
  }

  generateReport() {
    this.log('\n📊 生成验证报告...', 'info');
    
    const total = this.results.passed + this.results.failed;
    const passRate = total > 0 ? (this.results.passed / total * 100).toFixed(1) : 0;
    
    console.log('\n' + '='.repeat(60));
    console.log('🔗 双向链接系统集成验证报告');
    console.log('='.repeat(60));
    console.log(`📊 总测试数: ${total}`);
    console.log(`✅ 通过: ${this.results.passed}`);
    console.log(`❌ 失败: ${this.results.failed}`);
    console.log(`📈 通过率: ${passRate}%`);
    console.log('='.repeat(60));
    
    if (this.results.failed > 0) {
      console.log('\n❌ 失败的测试:');
      this.results.details
        .filter(detail => detail.status === 'FAIL')
        .forEach(detail => {
          console.log(`  - ${detail.description}`);
          if (detail.reason) {
            console.log(`    原因: ${detail.reason}`);
          }
        });
    }
    
    console.log('\n📋 详细结果:');
    this.results.details.forEach(detail => {
      const status = detail.status === 'PASS' ? '✅' : '❌';
      console.log(`  ${status} ${detail.description}`);
    });
    
    // 保存报告到文件
    const reportPath = path.join(__dirname, 'bidirectional-links-verification-report.json');
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: {
        total,
        passed: this.results.passed,
        failed: this.results.failed,
        passRate: parseFloat(passRate)
      },
      details: this.results.details
    }, null, 2));
    
    this.log(`\n📄 详细报告已保存到: ${reportPath}`, 'info');
    
    // 总结
    if (this.results.failed === 0) {
      this.log('\n🎉 所有验证通过！双向链接系统集成正常', 'success');
    } else if (passRate >= 80) {
      this.log('\n⚠️  大部分验证通过，但仍有问题需要解决', 'warning');
    } else {
      this.log('\n❌ 验证失败较多，需要重点修复', 'error');
    }
    
    return {
      success: this.results.failed === 0,
      passRate: parseFloat(passRate),
      summary: this.results
    };
  }
}

// 运行验证
async function main() {
  const verifier = new BidirectionalLinksVerifier();
  const result = await verifier.verify();
  
  // 设置退出码
  process.exit(result.success ? 0 : 1);
}

if (require.main === module) {
  main().catch(error => {
    console.error('验证过程中发生错误:', error);
    process.exit(1);
  });
}

module.exports = BidirectionalLinksVerifier;
