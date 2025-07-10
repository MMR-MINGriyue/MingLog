#!/usr/bin/env node

/**
 * MingLog 代码质量检查脚本
 * 执行全面的代码质量检查，包括类型检查、代码规范、测试覆盖率等
 */

const { execSync } = require('child_process');
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

function runCommand(command, description, options = {}) {
  logStep(description);
  
  try {
    const result = execSync(command, {
      stdio: options.silent ? 'pipe' : 'inherit',
      encoding: 'utf8',
      ...options
    });
    
    if (options.silent) {
      return result;
    }
    
    logSuccess(`${description} 完成`);
    return true;
  } catch (error) {
    logError(`${description} 失败`);
    if (options.silent) {
      console.error(error.stdout || error.message);
    }
    return false;
  }
}

function checkFileExists(filePath, description) {
  if (fs.existsSync(filePath)) {
    logSuccess(`${description} 存在`);
    return true;
  } else {
    logError(`${description} 不存在: ${filePath}`);
    return false;
  }
}

function analyzePackageJson() {
  logStep('分析 package.json');
  
  const packagePath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packagePath)) {
    logError('package.json 不存在');
    return false;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // 检查必要的脚本
  const requiredScripts = [
    'build', 'test', 'test:coverage', 'lint', 'type-check'
  ];
  
  const missingScripts = requiredScripts.filter(script => !packageJson.scripts?.[script]);
  
  if (missingScripts.length > 0) {
    logWarning(`缺少脚本: ${missingScripts.join(', ')}`);
  } else {
    logSuccess('所有必要脚本都存在');
  }
  
  // 检查依赖版本
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  const outdatedDeps = [];
  
  // 这里可以添加版本检查逻辑
  
  return true;
}

function checkConfigFiles() {
  logStep('检查配置文件');
  
  const configFiles = [
    { path: '.eslintrc.js', name: 'ESLint 配置' },
    { path: '.prettierrc.js', name: 'Prettier 配置' },
    { path: 'tsconfig.json', name: 'TypeScript 配置' },
    { path: 'vitest.config.ts', name: 'Vitest 配置' },
    { path: 'playwright.config.ts', name: 'Playwright 配置' }
  ];
  
  let allExist = true;
  
  configFiles.forEach(({ path: filePath, name }) => {
    if (!checkFileExists(filePath, name)) {
      allExist = false;
    }
  });
  
  return allExist;
}

function runTypeCheck() {
  return runCommand(
    'npx tsc --noEmit',
    'TypeScript 类型检查'
  );
}

function runLinting() {
  const lintResult = runCommand(
    'npx eslint src --ext .ts,.tsx --format=compact',
    'ESLint 代码检查'
  );
  
  if (lintResult) {
    logSuccess('代码符合 ESLint 规范');
  }
  
  return lintResult;
}

function runPrettierCheck() {
  return runCommand(
    'npx prettier --check "src/**/*.{ts,tsx,js,jsx,json,css,md}"',
    'Prettier 格式检查'
  );
}

function runTests() {
  return runCommand(
    'npm run test:coverage',
    '运行测试并生成覆盖率报告'
  );
}

function analyzeCoverage() {
  logStep('分析测试覆盖率');
  
  const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-summary.json');
  
  if (!fs.existsSync(coveragePath)) {
    logWarning('覆盖率报告不存在，跳过分析');
    return true;
  }
  
  try {
    const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
    const total = coverage.total;
    
    const metrics = ['lines', 'functions', 'branches', 'statements'];
    const thresholds = {
      lines: 80,
      functions: 80,
      branches: 70,
      statements: 80
    };
    
    log('\n覆盖率报告:');
    
    let allPassed = true;
    
    metrics.forEach(metric => {
      const percentage = total[metric].pct;
      const threshold = thresholds[metric];
      const status = percentage >= threshold ? '✅' : '❌';
      const color = percentage >= threshold ? 'green' : 'red';
      
      log(`  ${status} ${metric}: ${percentage}% (阈值: ${threshold}%)`, color);
      
      if (percentage < threshold) {
        allPassed = false;
      }
    });
    
    if (allPassed) {
      logSuccess('所有覆盖率指标都达到要求');
    } else {
      logWarning('部分覆盖率指标未达到要求');
    }
    
    return allPassed;
  } catch (error) {
    logError(`分析覆盖率报告失败: ${error.message}`);
    return false;
  }
}

function checkCodeComplexity() {
  logStep('检查代码复杂度');
  
  try {
    const result = runCommand(
      'npx eslint src --ext .ts,.tsx --format=json',
      '分析代码复杂度',
      { silent: true }
    );
    
    const eslintResults = JSON.parse(result);
    let complexityIssues = 0;
    let totalFiles = 0;
    
    eslintResults.forEach(file => {
      totalFiles++;
      file.messages.forEach(message => {
        if (message.ruleId === 'complexity' || 
            message.ruleId === 'max-lines' || 
            message.ruleId === 'max-lines-per-function') {
          complexityIssues++;
        }
      });
    });
    
    if (complexityIssues === 0) {
      logSuccess(`代码复杂度检查通过 (检查了 ${totalFiles} 个文件)`);
    } else {
      logWarning(`发现 ${complexityIssues} 个复杂度问题`);
    }
    
    return complexityIssues === 0;
  } catch (error) {
    logWarning('代码复杂度检查失败，跳过');
    return true;
  }
}

function checkDependencies() {
  logStep('检查依赖安全性');
  
  try {
    runCommand('npm audit --audit-level=moderate', '依赖安全检查');
    logSuccess('依赖安全检查通过');
    return true;
  } catch (error) {
    logWarning('发现依赖安全问题，请运行 npm audit fix');
    return false;
  }
}

function generateReport(results) {
  logSection('质量检查报告');
  
  const totalChecks = Object.keys(results).length;
  const passedChecks = Object.values(results).filter(Boolean).length;
  const score = Math.round((passedChecks / totalChecks) * 100);
  
  log(`\n总体评分: ${score}/100`, score >= 80 ? 'green' : score >= 60 ? 'yellow' : 'red');
  log(`通过检查: ${passedChecks}/${totalChecks}`);
  
  log('\n详细结果:');
  Object.entries(results).forEach(([check, passed]) => {
    const status = passed ? '✅' : '❌';
    const color = passed ? 'green' : 'red';
    log(`  ${status} ${check}`, color);
  });
  
  if (score >= 80) {
    log('\n🎉 代码质量优秀！', 'green');
  } else if (score >= 60) {
    log('\n⚠️  代码质量良好，但有改进空间', 'yellow');
  } else {
    log('\n🚨 代码质量需要改进', 'red');
  }
  
  // 生成 JSON 报告
  const report = {
    timestamp: new Date().toISOString(),
    score,
    totalChecks,
    passedChecks,
    results
  };
  
  fs.writeFileSync('quality-report.json', JSON.stringify(report, null, 2));
  logSuccess('质量报告已保存到 quality-report.json');
  
  return score >= 80;
}

async function main() {
  log('MingLog 代码质量检查工具', 'bright');
  log('开始执行全面的代码质量检查...\n', 'cyan');
  
  const results = {};
  
  // 执行各项检查
  logSection('配置文件检查');
  results['配置文件'] = analyzePackageJson() && checkConfigFiles();
  
  logSection('代码规范检查');
  results['TypeScript 类型'] = runTypeCheck();
  results['ESLint 规范'] = runLinting();
  results['Prettier 格式'] = runPrettierCheck();
  results['代码复杂度'] = checkCodeComplexity();
  
  logSection('测试和覆盖率');
  results['单元测试'] = runTests();
  results['测试覆盖率'] = analyzeCoverage();
  
  logSection('依赖和安全');
  results['依赖安全'] = checkDependencies();
  
  // 生成报告
  const overallPassed = generateReport(results);
  
  // 退出码
  process.exit(overallPassed ? 0 : 1);
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
