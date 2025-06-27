#!/usr/bin/env node

/**
 * 发布脚本
 * Release Script
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
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

function runCommand(command, description) {
  log(`\n🔧 ${description}...`, 'blue');
  try {
    const output = execSync(command, { 
      cwd: rootDir, 
      encoding: 'utf8',
      stdio: 'inherit'
    });
    log(`✅ ${description} completed`, 'green');
    return { success: true, output };
  } catch (error) {
    log(`❌ ${description} failed`, 'red');
    return { success: false, error };
  }
}

function getCurrentVersion() {
  const packageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf8'));
  return packageJson.version;
}

function validateVersion(version) {
  const versionRegex = /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?$/;
  return versionRegex.test(version);
}

function checkWorkingDirectory() {
  log('\n📋 Checking working directory...', 'cyan');
  
  try {
    const status = execSync('git status --porcelain', { 
      cwd: rootDir, 
      encoding: 'utf8' 
    });
    
    if (status.trim()) {
      log('❌ Working directory is not clean. Please commit or stash changes.', 'red');
      log('Uncommitted changes:', 'yellow');
      log(status, 'yellow');
      return false;
    }
    
    log('✅ Working directory is clean', 'green');
    return true;
  } catch (error) {
    log(`❌ Error checking git status: ${error.message}`, 'red');
    return false;
  }
}

function runTests() {
  log('\n🧪 Running tests...', 'cyan');
  
  const testResult = runCommand('pnpm test:run', 'Test execution');
  if (!testResult.success) {
    log('❌ Tests failed. Please fix tests before releasing.', 'red');
    return false;
  }
  
  return true;
}

function runQualityCheck() {
  log('\n🔍 Running quality check...', 'cyan');
  
  const qualityResult = runCommand('node scripts/quality-check.js', 'Quality check');
  if (!qualityResult.success) {
    log('❌ Quality check failed. Please fix issues before releasing.', 'red');
    return false;
  }
  
  return true;
}

function buildProject() {
  log('\n🏗️  Building project...', 'cyan');
  
  const buildResult = runCommand('pnpm build', 'Project build');
  if (!buildResult.success) {
    log('❌ Build failed. Please fix build issues before releasing.', 'red');
    return false;
  }
  
  return true;
}

function createGitTag(version) {
  log(`\n🏷️  Creating git tag v${version}...`, 'cyan');
  
  const tagResult = runCommand(
    `git tag -a v${version} -m "Release v${version}"`,
    'Git tag creation'
  );
  
  if (!tagResult.success) {
    log('❌ Failed to create git tag', 'red');
    return false;
  }
  
  return true;
}

function pushToRemote(version) {
  log('\n📤 Pushing to remote repository...', 'cyan');
  
  // Push commits
  const pushResult = runCommand('git push origin HEAD', 'Push commits');
  if (!pushResult.success) {
    log('❌ Failed to push commits', 'red');
    return false;
  }
  
  // Push tag
  const pushTagResult = runCommand(`git push origin v${version}`, 'Push tag');
  if (!pushTagResult.success) {
    log('❌ Failed to push tag', 'red');
    return false;
  }
  
  return true;
}

function generateReleaseNotes(version) {
  log('\n📝 Generating release notes...', 'cyan');
  
  try {
    const changelog = readFileSync(join(rootDir, 'CHANGELOG.md'), 'utf8');
    const lines = changelog.split('\n');
    
    let releaseNotes = [];
    let inCurrentVersion = false;
    let foundVersion = false;
    
    for (const line of lines) {
      if (line.startsWith(`## [v${version}]`)) {
        inCurrentVersion = true;
        foundVersion = true;
        continue;
      }
      
      if (inCurrentVersion && line.startsWith('## [')) {
        break;
      }
      
      if (inCurrentVersion) {
        releaseNotes.push(line);
      }
    }
    
    if (!foundVersion) {
      log(`⚠️  Version v${version} not found in CHANGELOG.md`, 'yellow');
      return `Release v${version}\n\nPlease check CHANGELOG.md for details.`;
    }
    
    const notes = releaseNotes.join('\n').trim();
    log('✅ Release notes generated', 'green');
    return notes;
    
  } catch (error) {
    log(`⚠️  Error reading CHANGELOG.md: ${error.message}`, 'yellow');
    return `Release v${version}\n\nPlease check CHANGELOG.md for details.`;
  }
}

function displayPreReleaseInfo(version) {
  log('\n📊 Pre-release Information', 'magenta');
  log('==========================', 'magenta');
  log(`Version: v${version}`, 'blue');
  log(`Branch: ${execSync('git branch --show-current', { cwd: rootDir, encoding: 'utf8' }).trim()}`, 'blue');
  log(`Commit: ${execSync('git rev-parse --short HEAD', { cwd: rootDir, encoding: 'utf8' }).trim()}`, 'blue');
  log(`Date: ${new Date().toISOString()}`, 'blue');
  
  const releaseNotes = generateReleaseNotes(version);
  log('\nRelease Notes Preview:', 'cyan');
  log('---------------------', 'cyan');
  log(releaseNotes, 'white');
}

function confirmRelease(version) {
  log(`\n❓ Are you sure you want to release v${version}?`, 'yellow');
  log('This will:', 'yellow');
  log('  • Create a git tag', 'yellow');
  log('  • Push to remote repository', 'yellow');
  log('  • Trigger GitHub Actions build', 'yellow');
  log('  • Create a GitHub release', 'yellow');
  
  // In a real scenario, you'd want to prompt for user input
  // For automation, we'll assume confirmation
  return true;
}

async function main() {
  const version = process.argv[2] || getCurrentVersion();
  
  log('🚀 Starting release process...', 'cyan');
  log(`📦 Version: v${version}`, 'blue');
  
  // Validate version format
  if (!validateVersion(version)) {
    log(`❌ Invalid version format: ${version}`, 'red');
    log('Version should follow semantic versioning (e.g., 1.0.0, 1.0.0-beta.1)', 'yellow');
    process.exit(1);
  }
  
  // Pre-release checks
  if (!checkWorkingDirectory()) {
    process.exit(1);
  }
  
  if (!runTests()) {
    process.exit(1);
  }
  
  if (!runQualityCheck()) {
    process.exit(1);
  }
  
  if (!buildProject()) {
    process.exit(1);
  }
  
  // Display pre-release information
  displayPreReleaseInfo(version);
  
  // Confirm release
  if (!confirmRelease(version)) {
    log('❌ Release cancelled by user', 'yellow');
    process.exit(0);
  }
  
  // Create and push release
  if (!createGitTag(version)) {
    process.exit(1);
  }
  
  if (!pushToRemote(version)) {
    process.exit(1);
  }
  
  // Success
  log('\n🎉 Release process completed successfully!', 'green');
  log(`✨ Version v${version} has been released`, 'green');
  log('\n📋 Next steps:', 'cyan');
  log('  • Check GitHub Actions for build status', 'blue');
  log('  • Monitor the release process', 'blue');
  log('  • Update documentation if needed', 'blue');
  log('  • Announce the release', 'blue');
  
  log(`\n🔗 GitHub Release: https://github.com/MMR-MINGriyue/MingLog/releases/tag/v${version}`, 'cyan');
}

main().catch(error => {
  log(`\n💥 Release failed: ${error.message}`, 'red');
  process.exit(1);
});
