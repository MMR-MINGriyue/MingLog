#!/usr/bin/env node

/**
 * 发布监控脚本
 * Release Monitoring Script
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

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

function getCurrentVersion() {
  const packageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8'));
  return packageJson.version;
}

async function checkGitHubActions() {
  log('\n🔍 Checking GitHub Actions status...', 'cyan');
  
  try {
    // 获取最新的工作流运行状态
    const output = execSync('gh run list --limit 5 --json status,conclusion,workflowName,createdAt,url', {
      cwd: rootDir,
      encoding: 'utf8'
    });
    
    const runs = JSON.parse(output);
    
    if (runs.length === 0) {
      log('❌ No recent workflow runs found', 'red');
      return false;
    }
    
    log('\n📊 Recent workflow runs:', 'blue');
    runs.forEach((run, index) => {
      const status = run.status === 'completed' 
        ? (run.conclusion === 'success' ? '✅' : '❌')
        : '🔄';
      
      const time = new Date(run.createdAt).toLocaleString();
      log(`  ${status} ${run.workflowName} - ${run.status} (${time})`, 'white');
      
      if (index === 0) {
        log(`     URL: ${run.url}`, 'blue');
      }
    });
    
    return true;
    
  } catch (error) {
    log(`⚠️  Could not check GitHub Actions: ${error.message}`, 'yellow');
    log('💡 Make sure GitHub CLI is installed and authenticated', 'blue');
    return false;
  }
}

async function checkRelease(version) {
  log(`\n🏷️  Checking release v${version}...`, 'cyan');
  
  try {
    const output = execSync(`gh release view v${version} --json tagName,name,publishedAt,assets`, {
      cwd: rootDir,
      encoding: 'utf8'
    });
    
    const release = JSON.parse(output);
    
    log(`✅ Release found: ${release.name}`, 'green');
    log(`   Published: ${new Date(release.publishedAt).toLocaleString()}`, 'blue');
    
    if (release.assets && release.assets.length > 0) {
      log(`\n📦 Assets (${release.assets.length}):`, 'blue');
      release.assets.forEach(asset => {
        const size = (asset.size / 1024 / 1024).toFixed(2);
        log(`   • ${asset.name} (${size} MB)`, 'white');
      });
    } else {
      log('\n⏳ No assets uploaded yet (build may still be in progress)', 'yellow');
    }
    
    return true;
    
  } catch (error) {
    log(`❌ Release v${version} not found or error: ${error.message}`, 'red');
    return false;
  }
}

async function checkBuildArtifacts() {
  log('\n🏗️  Checking build artifacts...', 'cyan');
  
  try {
    // 检查本地构建目录
    const distDirs = [
      'apps/desktop/dist',
      'apps/desktop/release',
      'packages/ui/dist',
      'packages/editor/dist',
      'packages/core/dist'
    ];
    
    let foundArtifacts = false;
    
    distDirs.forEach(dir => {
      try {
        const fullPath = join(rootDir, dir);
        const stats = execSync(`ls -la "${fullPath}"`, { 
          cwd: rootDir, 
          encoding: 'utf8' 
        });
        
        if (stats.trim()) {
          log(`✅ Found artifacts in ${dir}`, 'green');
          foundArtifacts = true;
        }
      } catch (error) {
        // Directory doesn't exist or is empty
      }
    });
    
    if (!foundArtifacts) {
      log('⚠️  No local build artifacts found', 'yellow');
      log('💡 Run "pnpm build" to create local builds', 'blue');
    }
    
    return foundArtifacts;
    
  } catch (error) {
    log(`⚠️  Error checking build artifacts: ${error.message}`, 'yellow');
    return false;
  }
}

function displayReleaseInfo(version) {
  log('\n📋 Release Information', 'magenta');
  log('=====================', 'magenta');
  log(`Version: v${version}`, 'blue');
  log(`Release URL: https://github.com/MMR-MINGriyue/MingLog/releases/tag/v${version}`, 'blue');
  log(`Repository: https://github.com/MMR-MINGriyue/MingLog`, 'blue');
  log(`Actions: https://github.com/MMR-MINGriyue/MingLog/actions`, 'blue');
}

function displayNextSteps() {
  log('\n📝 Next Steps', 'cyan');
  log('=============', 'cyan');
  log('1. 📊 Monitor GitHub Actions for build completion', 'blue');
  log('2. 🧪 Test the release builds on different platforms', 'blue');
  log('3. 📢 Announce the release to users', 'blue');
  log('4. 📚 Update documentation if needed', 'blue');
  log('5. 🐛 Monitor for bug reports and feedback', 'blue');
  
  log('\n💡 Useful commands:', 'cyan');
  log('   gh run list                    # Check workflow runs', 'blue');
  log('   gh release view v0.1.0        # View release details', 'blue');
  log('   gh run watch                  # Watch current run', 'blue');
  log('   pnpm desktop:build            # Build desktop app locally', 'blue');
}

async function main() {
  const version = process.argv[2] || getCurrentVersion();
  
  log('🚀 MingLog Release Monitor', 'cyan');
  log('==========================', 'cyan');
  
  displayReleaseInfo(version);
  
  // 检查各个组件的状态
  const checks = await Promise.all([
    checkGitHubActions(),
    checkRelease(version),
    checkBuildArtifacts()
  ]);
  
  const [actionsOk, releaseOk, artifactsOk] = checks;
  
  // 生成状态报告
  log('\n📊 Status Summary', 'magenta');
  log('==================', 'magenta');
  log(`GitHub Actions: ${actionsOk ? '✅ Running' : '❌ Issues'}`, actionsOk ? 'green' : 'red');
  log(`Release Created: ${releaseOk ? '✅ Yes' : '❌ No'}`, releaseOk ? 'green' : 'red');
  log(`Build Artifacts: ${artifactsOk ? '✅ Found' : '⚠️  Not found'}`, artifactsOk ? 'green' : 'yellow');
  
  if (actionsOk && releaseOk) {
    log('\n🎉 Release is in progress!', 'green');
    log('Monitor the GitHub Actions page for build completion.', 'green');
  } else {
    log('\n⚠️  Some issues detected', 'yellow');
    log('Please check the GitHub repository for more details.', 'yellow');
  }
  
  displayNextSteps();
  
  log('\n✨ Release monitoring completed!', 'green');
}

main().catch(error => {
  log(`\n💥 Monitoring failed: ${error.message}`, 'red');
  process.exit(1);
});
