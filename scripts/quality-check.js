#!/usr/bin/env node

/**
 * 代码质量检查脚本
 * Code Quality Check Script
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, description) {
  log(`\n🔍 ${description}...`, 'blue');
  try {
    const output = execSync(command, { 
      cwd: rootDir, 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    log(`✅ ${description} passed`, 'green');
    return { success: true, output };
  } catch (error) {
    log(`❌ ${description} failed`, 'red');
    if (error.stdout) log(error.stdout, 'yellow');
    if (error.stderr) log(error.stderr, 'red');
    return { success: false, error };
  }
}

function checkFileExists(filePath, description) {
  const fullPath = join(rootDir, filePath);
  if (existsSync(fullPath)) {
    log(`✅ ${description} exists`, 'green');
    return true;
  } else {
    log(`❌ ${description} missing`, 'red');
    return false;
  }
}

function checkPackageJson() {
  log('\n📦 Checking package.json files...', 'cyan');
  
  const packages = [
    'packages/core',
    'packages/ui',
    'packages/editor',
    'packages/database',
    'packages/search',
  ];

  let allValid = true;

  packages.forEach(pkg => {
    const packageJsonPath = join(rootDir, pkg, 'package.json');
    if (existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
        
        // Check required fields
        const requiredFields = ['name', 'version', 'scripts'];
        const missingFields = requiredFields.filter(field => !packageJson[field]);
        
        if (missingFields.length === 0) {
          log(`✅ ${pkg}/package.json is valid`, 'green');
        } else {
          log(`❌ ${pkg}/package.json missing fields: ${missingFields.join(', ')}`, 'red');
          allValid = false;
        }
      } catch (error) {
        log(`❌ ${pkg}/package.json is invalid JSON`, 'red');
        allValid = false;
      }
    } else {
      log(`❌ ${pkg}/package.json not found`, 'red');
      allValid = false;
    }
  });

  return allValid;
}

function checkTestCoverage() {
  log('\n🧪 Checking test coverage...', 'cyan');
  
  const result = runCommand('pnpm test:coverage', 'Test coverage check');
  
  if (result.success) {
    // Parse coverage output to check thresholds
    const output = result.output;
    
    // Look for coverage percentages
    const coverageRegex = /(\d+\.?\d*)%/g;
    const matches = output.match(coverageRegex);
    
    if (matches) {
      const coverages = matches.map(match => parseFloat(match));
      const minCoverage = Math.min(...coverages);
      
      if (minCoverage >= 80) {
        log(`✅ Test coverage is good (${minCoverage}%)`, 'green');
        return true;
      } else {
        log(`⚠️  Test coverage is below 80% (${minCoverage}%)`, 'yellow');
        return false;
      }
    }
  }
  
  return result.success;
}

function checkLinting() {
  log('\n🔍 Running linting checks...', 'cyan');
  return runCommand('pnpm lint', 'ESLint check').success;
}

function checkTypeScript() {
  log('\n🔧 Running TypeScript checks...', 'cyan');
  return runCommand('pnpm type-check', 'TypeScript check').success;
}

function checkBuild() {
  log('\n🏗️  Running build checks...', 'cyan');
  return runCommand('pnpm build:packages', 'Build check').success;
}

function checkDependencies() {
  log('\n📚 Checking dependencies...', 'cyan');
  
  // Check for security vulnerabilities
  const auditResult = runCommand('pnpm audit --audit-level moderate', 'Security audit');
  
  // Check for outdated dependencies
  const outdatedResult = runCommand('pnpm outdated', 'Outdated dependencies check');
  
  return auditResult.success;
}

function checkDocumentation() {
  log('\n📖 Checking documentation...', 'cyan');
  
  const requiredDocs = [
    'README.md',
    'CHANGELOG.md',
    'PROJECT_STATUS.md',
  ];

  let allDocsExist = true;
  
  requiredDocs.forEach(doc => {
    if (!checkFileExists(doc, doc)) {
      allDocsExist = false;
    }
  });

  return allDocsExist;
}

function checkGitHooks() {
  log('\n🪝 Checking Git hooks...', 'cyan');
  
  const hooks = [
    '.husky/pre-commit',
    '.husky/commit-msg',
  ];

  let allHooksExist = true;
  
  hooks.forEach(hook => {
    if (!checkFileExists(hook, hook)) {
      allHooksExist = false;
    }
  });

  return allHooksExist;
}

function generateReport(results) {
  log('\n📊 Quality Check Report', 'magenta');
  log('========================', 'magenta');
  
  const totalChecks = Object.keys(results).length;
  const passedChecks = Object.values(results).filter(Boolean).length;
  const score = Math.round((passedChecks / totalChecks) * 100);
  
  Object.entries(results).forEach(([check, passed]) => {
    const status = passed ? '✅' : '❌';
    const color = passed ? 'green' : 'red';
    log(`${status} ${check}`, color);
  });
  
  log(`\nOverall Score: ${score}% (${passedChecks}/${totalChecks})`, 
      score >= 80 ? 'green' : score >= 60 ? 'yellow' : 'red');
  
  if (score >= 80) {
    log('\n🎉 Excellent code quality!', 'green');
  } else if (score >= 60) {
    log('\n⚠️  Good code quality, but room for improvement', 'yellow');
  } else {
    log('\n🚨 Code quality needs attention', 'red');
  }
  
  return score;
}

async function main() {
  log('🚀 Starting code quality check...', 'cyan');
  
  const results = {
    'Package.json files': checkPackageJson(),
    'TypeScript compilation': checkTypeScript(),
    'ESLint rules': checkLinting(),
    'Build process': checkBuild(),
    'Test coverage': checkTestCoverage(),
    'Dependencies security': checkDependencies(),
    'Documentation': checkDocumentation(),
    'Git hooks': checkGitHooks(),
  };
  
  const score = generateReport(results);
  
  // Exit with error code if quality is poor
  if (score < 60) {
    process.exit(1);
  }
  
  log('\n✨ Quality check completed!', 'green');
}

main().catch(error => {
  log(`\n💥 Quality check failed: ${error.message}`, 'red');
  process.exit(1);
});
