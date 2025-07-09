#!/usr/bin/env node

/**
 * MingLog 核心功能验证测试运行器
 * 执行完整的集成测试套件并生成详细报告
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`${title}`, 'cyan');
  log(`${'='.repeat(60)}`, 'cyan');
}

function logStep(step) {
  log(`\n${step}`, 'blue');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

// 测试套件配置
const testSuites = [
  {
    name: '核心系统集成测试',
    pattern: 'src/test/integration/CoreIntegration.test.ts',
    description: '验证核心系统的初始化、模块管理和API功能',
    timeout: 30000
  },
  {
    name: '双向链接系统集成测试',
    pattern: 'src/test/integration/LinkSystemIntegration.test.ts',
    description: '验证链接解析、管理和搜索的完整工作流程',
    timeout: 45000
  },
  {
    name: '编辑器集成测试',
    pattern: 'src/test/integration/EditorIntegration.test.ts',
    description: '验证富文本编辑器与双向链接系统的集成',
    timeout: 30000
  },
  {
    name: '搜索功能集成测试',
    pattern: 'src/test/integration/SearchIntegration.test.ts',
    description: '验证搜索引擎与链接系统、数据持久化的集成',
    timeout: 40000
  },
  {
    name: '数据持久化集成测试',
    pattern: 'src/test/integration/DataPersistenceIntegration.test.ts',
    description: '验证数据库操作、缓存系统和数据一致性',
    timeout: 35000
  },
  {
    name: '桌面环境集成测试',
    pattern: 'src/test/integration/DesktopEnvironment.test.ts',
    description: '验证在实际桌面应用环境中的功能集成',
    timeout: 50000
  }
];

// 测试结果收集
const testResults = {
  suites: [],
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    duration: 0
  },
  coverage: null,
  performance: null
};

async function runTestSuite(suite) {
  logStep(`运行 ${suite.name}`);
  log(`描述: ${suite.description}`, 'magenta');

  const startTime = Date.now();
  
  try {
    // 构建 vitest 命令
    const vitestCmd = [
      'npx', 'vitest', 'run',
      '--reporter=json',
      '--reporter=verbose',
      `--testTimeout=${suite.timeout}`,
      suite.pattern
    ];

    // 执行测试
    const result = execSync(vitestCmd.join(' '), {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const duration = Date.now() - startTime;
    
    // 解析测试结果
    const lines = result.split('\n');
    const jsonLine = lines.find(line => line.startsWith('{') && line.includes('"testResults"'));
    
    let testResult = {
      name: suite.name,
      status: 'passed',
      duration,
      tests: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };

    if (jsonLine) {
      try {
        const parsed = JSON.parse(jsonLine);
        if (parsed.testResults && parsed.testResults.length > 0) {
          const suiteResult = parsed.testResults[0];
          testResult.tests = suiteResult.assertionResults.length;
          testResult.passed = suiteResult.assertionResults.filter(t => t.status === 'passed').length;
          testResult.failed = suiteResult.assertionResults.filter(t => t.status === 'failed').length;
          testResult.skipped = suiteResult.assertionResults.filter(t => t.status === 'skipped').length;
          
          if (testResult.failed > 0) {
            testResult.status = 'failed';
            testResult.errors = suiteResult.assertionResults
              .filter(t => t.status === 'failed')
              .map(t => t.failureMessages || [])
              .flat();
          }
        }
      } catch (parseError) {
        logWarning(`解析测试结果失败: ${parseError.message}`);
      }
    }

    testResults.suites.push(testResult);
    
    if (testResult.status === 'passed') {
      logSuccess(`${suite.name} 通过 (${testResult.passed}/${testResult.tests} 测试, ${duration}ms)`);
    } else {
      logError(`${suite.name} 失败 (${testResult.failed}/${testResult.tests} 测试失败)`);
      testResult.errors.forEach(error => {
        log(`  ${error}`, 'red');
      });
    }

    return testResult;

  } catch (error) {
    const duration = Date.now() - startTime;
    
    const testResult = {
      name: suite.name,
      status: 'failed',
      duration,
      tests: 0,
      passed: 0,
      failed: 1,
      skipped: 0,
      errors: [error.message]
    };

    testResults.suites.push(testResult);
    logError(`${suite.name} 执行失败: ${error.message}`);
    
    return testResult;
  }
}

async function runCoverageReport() {
  logStep('生成测试覆盖率报告');
  
  try {
    const coverageCmd = [
      'npx', 'vitest', 'run',
      '--coverage',
      '--reporter=json',
      'src/test/integration/'
    ];

    const result = execSync(coverageCmd.join(' '), {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // 读取覆盖率报告
    const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
    
    if (fs.existsSync(coveragePath)) {
      const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
      testResults.coverage = coverage.total;
      
      logSuccess('覆盖率报告生成成功');
      log(`  行覆盖率: ${coverage.total.lines.pct}%`);
      log(`  函数覆盖率: ${coverage.total.functions.pct}%`);
      log(`  分支覆盖率: ${coverage.total.branches.pct}%`);
      log(`  语句覆盖率: ${coverage.total.statements.pct}%`);
      
      return true;
    } else {
      logWarning('覆盖率报告文件未找到');
      return false;
    }

  } catch (error) {
    logWarning(`生成覆盖率报告失败: ${error.message}`);
    return false;
  }
}

async function runPerformanceTests() {
  logStep('运行性能基准测试');
  
  try {
    // 运行性能测试
    const perfCmd = [
      'npx', 'vitest', 'run',
      '--reporter=json',
      'src/test/performance/'
    ];

    const result = execSync(perfCmd.join(' '), {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: 60000 // 性能测试可能需要更长时间
    });

    logSuccess('性能基准测试完成');
    return true;

  } catch (error) {
    logWarning(`性能测试失败: ${error.message}`);
    return false;
  }
}

function generateReport() {
  logSection('测试报告生成');

  // 计算总体统计
  testResults.summary.total = testResults.suites.reduce((sum, suite) => sum + suite.tests, 0);
  testResults.summary.passed = testResults.suites.reduce((sum, suite) => sum + suite.passed, 0);
  testResults.summary.failed = testResults.suites.reduce((sum, suite) => sum + suite.failed, 0);
  testResults.summary.skipped = testResults.suites.reduce((sum, suite) => sum + suite.skipped, 0);
  testResults.summary.duration = testResults.suites.reduce((sum, suite) => sum + suite.duration, 0);

  const passRate = testResults.summary.total > 0 
    ? Math.round((testResults.summary.passed / testResults.summary.total) * 100)
    : 0;

  // 显示总体结果
  log(`\n测试总结:`);
  log(`  总测试数: ${testResults.summary.total}`);
  log(`  通过: ${testResults.summary.passed}`, 'green');
  log(`  失败: ${testResults.summary.failed}`, testResults.summary.failed > 0 ? 'red' : 'reset');
  log(`  跳过: ${testResults.summary.skipped}`, 'yellow');
  log(`  通过率: ${passRate}%`, passRate >= 90 ? 'green' : passRate >= 70 ? 'yellow' : 'red');
  log(`  总耗时: ${testResults.summary.duration}ms`);

  // 显示各测试套件结果
  log(`\n测试套件详情:`);
  testResults.suites.forEach(suite => {
    const status = suite.status === 'passed' ? '✅' : '❌';
    const color = suite.status === 'passed' ? 'green' : 'red';
    log(`  ${status} ${suite.name} (${suite.passed}/${suite.tests}, ${suite.duration}ms)`, color);
  });

  // 显示覆盖率信息
  if (testResults.coverage) {
    log(`\n代码覆盖率:`);
    log(`  行覆盖率: ${testResults.coverage.lines.pct}%`);
    log(`  函数覆盖率: ${testResults.coverage.functions.pct}%`);
    log(`  分支覆盖率: ${testResults.coverage.branches.pct}%`);
    log(`  语句覆盖率: ${testResults.coverage.statements.pct}%`);
  }

  // 生成 JSON 报告
  const reportData = {
    timestamp: new Date().toISOString(),
    environment: {
      node: process.version,
      platform: process.platform,
      arch: process.arch
    },
    ...testResults
  };

  const reportPath = path.join(process.cwd(), 'integration-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
  
  logSuccess(`详细报告已保存到: ${reportPath}`);

  // 生成 HTML 报告
  generateHTMLReport(reportData);

  // 返回是否所有测试都通过
  return testResults.summary.failed === 0;
}

function generateHTMLReport(reportData) {
  const htmlTemplate = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MingLog 核心功能验证报告</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 20px; border-radius: 6px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .metric-label { color: #666; font-size: 0.9em; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .warning { color: #ffc107; }
        .suite { margin-bottom: 20px; border: 1px solid #e9ecef; border-radius: 6px; overflow: hidden; }
        .suite-header { background: #f8f9fa; padding: 15px; font-weight: bold; }
        .suite-content { padding: 15px; }
        .test-item { padding: 10px; border-bottom: 1px solid #e9ecef; display: flex; justify-content: space-between; align-items: center; }
        .test-item:last-child { border-bottom: none; }
        .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; }
        .status-passed { background: #d4edda; color: #155724; }
        .status-failed { background: #f8d7da; color: #721c24; }
        .coverage-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-top: 20px; }
        .coverage-item { background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>MingLog 核心功能验证报告</h1>
            <p>生成时间: ${new Date(reportData.timestamp).toLocaleString('zh-CN')}</p>
        </div>
        
        <div class="content">
            <div class="summary">
                <div class="metric">
                    <div class="metric-value">${reportData.summary.total}</div>
                    <div class="metric-label">总测试数</div>
                </div>
                <div class="metric">
                    <div class="metric-value passed">${reportData.summary.passed}</div>
                    <div class="metric-label">通过</div>
                </div>
                <div class="metric">
                    <div class="metric-value ${reportData.summary.failed > 0 ? 'failed' : ''}">${reportData.summary.failed}</div>
                    <div class="metric-label">失败</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${Math.round((reportData.summary.passed / reportData.summary.total) * 100)}%</div>
                    <div class="metric-label">通过率</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${Math.round(reportData.summary.duration / 1000)}s</div>
                    <div class="metric-label">总耗时</div>
                </div>
            </div>

            <h2>测试套件详情</h2>
            ${reportData.suites.map(suite => `
                <div class="suite">
                    <div class="suite-header">
                        <span class="status-badge ${suite.status === 'passed' ? 'status-passed' : 'status-failed'}">
                            ${suite.status === 'passed' ? '通过' : '失败'}
                        </span>
                        ${suite.name}
                    </div>
                    <div class="suite-content">
                        <div class="test-item">
                            <span>测试数量</span>
                            <span>${suite.tests}</span>
                        </div>
                        <div class="test-item">
                            <span>通过</span>
                            <span class="passed">${suite.passed}</span>
                        </div>
                        <div class="test-item">
                            <span>失败</span>
                            <span class="${suite.failed > 0 ? 'failed' : ''}">${suite.failed}</span>
                        </div>
                        <div class="test-item">
                            <span>耗时</span>
                            <span>${suite.duration}ms</span>
                        </div>
                        ${suite.errors.length > 0 ? `
                            <div style="margin-top: 10px; padding: 10px; background: #f8d7da; border-radius: 4px;">
                                <strong>错误信息:</strong>
                                <ul style="margin: 5px 0 0 0;">
                                    ${suite.errors.map(error => `<li style="color: #721c24; font-size: 0.9em;">${error}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `).join('')}

            ${reportData.coverage ? `
                <h2>代码覆盖率</h2>
                <div class="coverage-grid">
                    <div class="coverage-item">
                        <div class="metric-value">${reportData.coverage.lines.pct}%</div>
                        <div class="metric-label">行覆盖率</div>
                    </div>
                    <div class="coverage-item">
                        <div class="metric-value">${reportData.coverage.functions.pct}%</div>
                        <div class="metric-label">函数覆盖率</div>
                    </div>
                    <div class="coverage-item">
                        <div class="metric-value">${reportData.coverage.branches.pct}%</div>
                        <div class="metric-label">分支覆盖率</div>
                    </div>
                    <div class="coverage-item">
                        <div class="metric-value">${reportData.coverage.statements.pct}%</div>
                        <div class="metric-label">语句覆盖率</div>
                    </div>
                </div>
            ` : ''}
        </div>
    </div>
</body>
</html>`;

  const htmlPath = path.join(process.cwd(), 'integration-test-report.html');
  fs.writeFileSync(htmlPath, htmlTemplate);
  
  logSuccess(`HTML 报告已保存到: ${htmlPath}`);
}

async function main() {
  log('MingLog 核心功能验证测试', 'bright');
  log('开始执行完整的集成测试套件...\n', 'cyan');

  const startTime = Date.now();

  // 运行所有测试套件
  logSection('执行集成测试套件');
  
  for (const suite of testSuites) {
    await runTestSuite(suite);
  }

  // 生成覆盖率报告
  logSection('代码覆盖率分析');
  await runCoverageReport();

  // 运行性能测试
  logSection('性能基准测试');
  await runPerformanceTests();

  // 生成最终报告
  const allTestsPassed = generateReport();

  const totalTime = Date.now() - startTime;
  
  logSection('测试完成');
  log(`总耗时: ${Math.round(totalTime / 1000)}秒`);
  
  if (allTestsPassed) {
    log('🎉 所有核心功能验证测试通过！', 'green');
    process.exit(0);
  } else {
    log('🚨 部分测试失败，请检查报告详情', 'red');
    process.exit(1);
  }
}

// 处理未捕获的异常
process.on('uncaughtException', (error) => {
  logError(`未捕获的异常: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logError(`未处理的 Promise 拒绝: ${reason}`);
  process.exit(1);
});

// 运行主函数
main().catch((error) => {
  logError(`执行失败: ${error.message}`);
  process.exit(1);
});
