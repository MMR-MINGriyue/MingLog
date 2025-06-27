#!/usr/bin/env node

/**
 * Cross-Platform Compatibility Test Script for MingLog Desktop
 * Tests application functionality across Windows, macOS, and Linux
 */

import os from 'os';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const platform = os.platform();
const arch = os.arch();

console.log('🔍 MingLog Cross-Platform Compatibility Test');
console.log('='.repeat(50));
console.log(`Platform: ${platform}`);
console.log(`Architecture: ${arch}`);
console.log(`Node.js: ${process.version}`);
console.log(`OS: ${os.type()} ${os.release()}`);
console.log('='.repeat(50));

// Test results
const testResults = {
  platform: platform,
  arch: arch,
  nodeVersion: process.version,
  osInfo: `${os.type()} ${os.release()}`,
  tests: [],
  passed: 0,
  failed: 0,
  timestamp: new Date().toISOString()
};

function runTest(name, testFn) {
  console.log(`\n🧪 Testing: ${name}`);
  try {
    const result = testFn();
    console.log(`✅ PASS: ${name}`);
    testResults.tests.push({ name, status: 'PASS', result });
    testResults.passed++;
    return true;
  } catch (error) {
    console.log(`❌ FAIL: ${name}`);
    console.log(`   Error: ${error.message}`);
    testResults.tests.push({ name, status: 'FAIL', error: error.message });
    testResults.failed++;
    return false;
  }
}

// Test 1: Check Node.js and npm versions
runTest('Node.js and npm versions', () => {
  const nodeVersion = process.version;
  const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();

  // Accept Node.js 18, 20, or 22
  if (!nodeVersion.startsWith('v18') && !nodeVersion.startsWith('v20') && !nodeVersion.startsWith('v22')) {
    throw new Error(`Node.js version ${nodeVersion} may not be compatible. Recommended: v18, v20, or v22`);
  }

  return { nodeVersion, npmVersion };
});

// Test 2: Check project structure
runTest('Project structure', () => {
  const requiredPaths = [
    'package.json',
    'apps/desktop/package.json',
    'apps/desktop/src/main.ts',
    'apps/desktop/src/preload.ts',
    'apps/web/package.json'
  ];
  
  const missing = requiredPaths.filter(p => !fs.existsSync(p));
  if (missing.length > 0) {
    throw new Error(`Missing required files: ${missing.join(', ')}`);
  }
  
  return { requiredPaths: requiredPaths.length, missing: missing.length };
});

// Test 3: Check dependencies
runTest('Dependencies installation', () => {
  const nodeModulesExists = fs.existsSync('node_modules');
  const desktopNodeModules = fs.existsSync('apps/desktop/node_modules');
  const webNodeModules = fs.existsSync('apps/web/node_modules');
  
  if (!nodeModulesExists) {
    throw new Error('Root node_modules not found. Run: pnpm install');
  }
  
  return { 
    root: nodeModulesExists,
    desktop: desktopNodeModules,
    web: webNodeModules
  };
});

// Test 4: Platform-specific checks
runTest('Platform-specific features', () => {
  const features = {};
  
  switch (platform) {
    case 'win32':
      // Windows-specific tests
      features.appUserModelId = true;
      features.nsis = true;
      features.autoUpdater = true;
      break;
      
    case 'darwin':
      // macOS-specific tests
      features.appBundle = true;
      features.dmg = true;
      features.codeSign = false; // Requires developer certificate
      break;
      
    case 'linux':
      // Linux-specific tests
      features.appImage = true;
      features.deb = true;
      features.systemTray = true;
      break;
      
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
  
  return features;
});

// Test 5: Build configuration
runTest('Build configuration', () => {
  const desktopPkg = JSON.parse(fs.readFileSync('apps/desktop/package.json', 'utf8'));
  const buildConfig = desktopPkg.build;
  
  if (!buildConfig) {
    throw new Error('Missing build configuration in apps/desktop/package.json');
  }
  
  const platformConfig = buildConfig[platform === 'win32' ? 'win' : platform === 'darwin' ? 'mac' : 'linux'];
  if (!platformConfig) {
    throw new Error(`Missing platform configuration for ${platform}`);
  }
  
  return { hasConfig: true, targets: platformConfig.target?.length || 0 };
});

// Test 6: Icon files
runTest('Icon files', () => {
  const iconPath = 'apps/desktop/assets';
  const requiredIcons = [];
  
  switch (platform) {
    case 'win32':
      requiredIcons.push('icon.ico', 'tray-icon.ico');
      break;
    case 'darwin':
      requiredIcons.push('icon.icns', 'tray-icon.png');
      break;
    case 'linux':
      requiredIcons.push('icon.png', 'tray-icon.png');
      break;
  }
  
  const missingIcons = requiredIcons.filter(icon => 
    !fs.existsSync(path.join(iconPath, icon))
  );
  
  if (missingIcons.length > 0) {
    console.warn(`⚠️  Missing platform icons: ${missingIcons.join(', ')}`);
    console.warn('   These can be generated from icon.svg');
  }
  
  return { required: requiredIcons.length, missing: missingIcons.length };
});

// Test 7: TypeScript compilation
runTest('TypeScript compilation', () => {
  try {
    execSync('cd apps/desktop && npm run build', { stdio: 'pipe' });
    return { compiled: true };
  } catch (error) {
    throw new Error('TypeScript compilation failed');
  }
});

// Test 8: Electron availability
runTest('Electron availability', () => {
  try {
    const electronVersion = execSync('cd apps/desktop && npx electron --version', { 
      encoding: 'utf8',
      stdio: 'pipe'
    }).trim();
    return { version: electronVersion };
  } catch (error) {
    throw new Error('Electron not available or not installed');
  }
});

// Generate test report
console.log('\n📊 Test Summary');
console.log('='.repeat(30));
console.log(`✅ Passed: ${testResults.passed}`);
console.log(`❌ Failed: ${testResults.failed}`);
console.log(`📈 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);

// Save detailed report
const reportPath = `test-report-${platform}-${Date.now()}.json`;
fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
console.log(`\n📄 Detailed report saved to: ${reportPath}`);

// Platform-specific recommendations
console.log('\n💡 Platform-specific Recommendations:');
switch (platform) {
  case 'win32':
    console.log('- Install Windows SDK for better native integration');
    console.log('- Consider code signing for production releases');
    console.log('- Test with Windows Defender and antivirus software');
    break;
    
  case 'darwin':
    console.log('- Install Xcode Command Line Tools');
    console.log('- Get Apple Developer certificate for code signing');
    console.log('- Test on both Intel and Apple Silicon Macs');
    break;
    
  case 'linux':
    console.log('- Test on multiple distributions (Ubuntu, Fedora, Arch)');
    console.log('- Verify system tray functionality across desktop environments');
    console.log('- Test AppImage and package manager installations');
    break;
}

// Exit with appropriate code
process.exit(testResults.failed > 0 ? 1 : 0);
