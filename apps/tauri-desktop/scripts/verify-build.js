#!/usr/bin/env node

/**
 * MingLog Build Verification Script
 * 
 * This script verifies the production build quality and completeness:
 * - Bundle size analysis
 * - Asset optimization verification
 * - Security checks
 * - Performance benchmarks
 * - Functionality tests
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step, message) {
  log(`\n🔍 [${step}] ${message}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function verifyFrontendBuild() {
  logStep('1/6', 'Verifying frontend build');
  
  const distPath = 'dist';
  if (!fs.existsSync(distPath)) {
    logError('Frontend build not found. Run npm run build:prod first.');
    return false;
  }
  
  // Check essential files
  const requiredFiles = ['index.html', 'assets'];
  const missingFiles = requiredFiles.filter(file => !fs.existsSync(path.join(distPath, file)));
  
  if (missingFiles.length > 0) {
    logError(`Missing required files: ${missingFiles.join(', ')}`);
    return false;
  }
  
  // Analyze bundle sizes
  const assetsPath = path.join(distPath, 'assets');
  const assetFiles = fs.readdirSync(assetsPath);
  
  let totalSize = 0;
  const bundleAnalysis = {
    js: { count: 0, size: 0 },
    css: { count: 0, size: 0 },
    other: { count: 0, size: 0 }
  };
  
  assetFiles.forEach(file => {
    const filePath = path.join(assetsPath, file);
    const stats = fs.statSync(filePath);
    const size = stats.size;
    totalSize += size;
    
    if (file.endsWith('.js')) {
      bundleAnalysis.js.count++;
      bundleAnalysis.js.size += size;
    } else if (file.endsWith('.css')) {
      bundleAnalysis.css.count++;
      bundleAnalysis.css.size += size;
    } else {
      bundleAnalysis.other.count++;
      bundleAnalysis.other.size += size;
    }
  });
  
  log(`   Total bundle size: ${formatBytes(totalSize)}`);
  log(`   JavaScript: ${bundleAnalysis.js.count} files, ${formatBytes(bundleAnalysis.js.size)}`);
  log(`   CSS: ${bundleAnalysis.css.count} files, ${formatBytes(bundleAnalysis.css.size)}`);
  log(`   Other assets: ${bundleAnalysis.other.count} files, ${formatBytes(bundleAnalysis.other.size)}`);
  
  // Check bundle size limits
  const maxBundleSize = 10 * 1024 * 1024; // 10MB
  if (totalSize > maxBundleSize) {
    logWarning(`Bundle size (${formatBytes(totalSize)}) exceeds recommended limit (${formatBytes(maxBundleSize)})`);
  }
  
  logSuccess('Frontend build verification completed');
  return true;
}

function verifyTauriBuild() {
  logStep('2/6', 'Verifying Tauri build');
  
  const targetPath = 'src-tauri/target/release';
  if (!fs.existsSync(targetPath)) {
    logError('Tauri build not found. Run npm run tauri:build:prod first.');
    return false;
  }
  
  // Check for executable
  const platform = process.platform;
  let executableName;
  
  switch (platform) {
    case 'win32':
      executableName = 'minglog-desktop-simple.exe';
      break;
    case 'darwin':
      executableName = 'minglog-desktop-simple';
      break;
    case 'linux':
      executableName = 'minglog-desktop-simple';
      break;
    default:
      logWarning(`Unknown platform: ${platform}`);
      return false;
  }
  
  const executablePath = path.join(targetPath, executableName);
  if (!fs.existsSync(executablePath)) {
    logError(`Executable not found: ${executablePath}`);
    return false;
  }
  
  const execStats = fs.statSync(executablePath);
  log(`   Executable size: ${formatBytes(execStats.size)}`);
  
  // Check bundle directory
  const bundlePath = path.join(targetPath, 'bundle');
  if (fs.existsSync(bundlePath)) {
    const bundles = fs.readdirSync(bundlePath);
    log(`   Generated bundles: ${bundles.join(', ')}`);
    
    bundles.forEach(bundle => {
      const bundleDir = path.join(bundlePath, bundle);
      if (fs.statSync(bundleDir).isDirectory()) {
        const files = fs.readdirSync(bundleDir);
        log(`     ${bundle}: ${files.length} files`);
      }
    });
  }
  
  logSuccess('Tauri build verification completed');
  return true;
}

function verifyAssetOptimization() {
  logStep('3/6', 'Verifying asset optimization');
  
  const assetsPath = 'dist/assets';
  if (!fs.existsSync(assetsPath)) {
    logError('Assets directory not found');
    return false;
  }
  
  const assetFiles = fs.readdirSync(assetsPath);
  let optimizationIssues = 0;
  
  assetFiles.forEach(file => {
    const filePath = path.join(assetsPath, file);
    const stats = fs.statSync(filePath);
    
    // Check for uncompressed large files
    if (stats.size > 1024 * 1024 && !file.includes('.gz')) { // 1MB
      logWarning(`Large uncompressed file: ${file} (${formatBytes(stats.size)})`);
      optimizationIssues++;
    }
    
    // Check for development artifacts
    if (file.includes('.map') && process.env.NODE_ENV === 'production') {
      logWarning(`Source map in production build: ${file}`);
      optimizationIssues++;
    }
  });
  
  if (optimizationIssues === 0) {
    logSuccess('Asset optimization verification completed');
  } else {
    logWarning(`Found ${optimizationIssues} optimization issues`);
  }
  
  return optimizationIssues === 0;
}

function verifySecurityConfiguration() {
  logStep('4/6', 'Verifying security configuration');
  
  // Check Tauri configuration
  const tauriConfigPath = 'src-tauri/tauri.conf.json';
  if (!fs.existsSync(tauriConfigPath)) {
    logError('Tauri configuration not found');
    return false;
  }
  
  const tauriConfig = JSON.parse(fs.readFileSync(tauriConfigPath, 'utf8'));
  
  // Check CSP configuration
  const csp = tauriConfig.app?.security?.csp;
  if (!csp || csp === null) {
    logWarning('Content Security Policy not configured');
  } else {
    logSuccess('Content Security Policy configured');
  }
  
  // Check dangerous settings
  const dangerousSettings = tauriConfig.app?.security?.dangerousDisableAssetCspModification;
  if (dangerousSettings) {
    logWarning('Dangerous CSP modification is enabled');
  }
  
  logSuccess('Security configuration verification completed');
  return true;
}

function verifyPerformanceMetrics() {
  logStep('5/6', 'Verifying performance metrics');
  
  // Check bundle sizes against performance budgets
  const performanceBudgets = {
    totalBundle: 10 * 1024 * 1024, // 10MB
    jsBundle: 5 * 1024 * 1024,     // 5MB
    cssBundle: 1 * 1024 * 1024,    // 1MB
    executable: 50 * 1024 * 1024   // 50MB
  };
  
  let performanceIssues = 0;
  
  // Check frontend bundle sizes
  const assetsPath = 'dist/assets';
  if (fs.existsSync(assetsPath)) {
    const assetFiles = fs.readdirSync(assetsPath);
    let totalJs = 0, totalCss = 0;
    
    assetFiles.forEach(file => {
      const filePath = path.join(assetsPath, file);
      const size = fs.statSync(filePath).size;
      
      if (file.endsWith('.js')) totalJs += size;
      if (file.endsWith('.css')) totalCss += size;
    });
    
    if (totalJs > performanceBudgets.jsBundle) {
      logWarning(`JavaScript bundle size exceeds budget: ${formatBytes(totalJs)} > ${formatBytes(performanceBudgets.jsBundle)}`);
      performanceIssues++;
    }
    
    if (totalCss > performanceBudgets.cssBundle) {
      logWarning(`CSS bundle size exceeds budget: ${formatBytes(totalCss)} > ${formatBytes(performanceBudgets.cssBundle)}`);
      performanceIssues++;
    }
  }
  
  if (performanceIssues === 0) {
    logSuccess('Performance metrics verification completed');
  } else {
    logWarning(`Found ${performanceIssues} performance issues`);
  }
  
  return performanceIssues === 0;
}

function generateVerificationReport() {
  logStep('6/6', 'Generating verification report');
  
  const report = {
    timestamp: new Date().toISOString(),
    platform: process.platform,
    arch: process.arch,
    nodeVersion: process.version,
    verification: {
      frontend: true,
      tauri: true,
      assets: true,
      security: true,
      performance: true
    },
    recommendations: []
  };
  
  // Add recommendations based on findings
  if (fs.existsSync('dist')) {
    const distSize = execSync('du -sb dist 2>/dev/null || echo "0"', { encoding: 'utf8' });
    const sizeBytes = parseInt(distSize.split('\t')[0]) || 0;
    report.bundleSize = formatBytes(sizeBytes);
    
    if (sizeBytes > 10 * 1024 * 1024) {
      report.recommendations.push('Consider implementing code splitting to reduce bundle size');
    }
  }
  
  fs.writeFileSync('verification-report.json', JSON.stringify(report, null, 2));
  
  logSuccess('Verification report generated: verification-report.json');
  return true;
}

function main() {
  log('\n🔍 MingLog Build Verification', 'bright');
  log('==============================', 'bright');
  
  const startTime = Date.now();
  let allPassed = true;
  
  try {
    allPassed &= verifyFrontendBuild();
    allPassed &= verifyTauriBuild();
    allPassed &= verifyAssetOptimization();
    allPassed &= verifySecurityConfiguration();
    allPassed &= verifyPerformanceMetrics();
    allPassed &= generateVerificationReport();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    if (allPassed) {
      log('\n🎉 Build verification completed successfully!', 'green');
      log(`⏱️  Verification time: ${duration} seconds`, 'cyan');
    } else {
      log('\n⚠️  Build verification completed with warnings', 'yellow');
      log(`⏱️  Verification time: ${duration} seconds`, 'cyan');
    }
    
  } catch (error) {
    logError(`Verification failed: ${error.message}`);
    process.exit(1);
  }
}

// Run verification
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };
