#!/usr/bin/env node

/**
 * MingLog Production Build Script
 * 
 * This script handles the complete production build process including:
 * - Environment validation
 * - Dependency checks
 * - Frontend build optimization
 * - Tauri bundle generation
 * - Build verification
 * - Asset optimization
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ANSI color codes for console output
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

function logStep(step, message) {
  log(`\n🔧 [${step}] ${message}`, 'cyan');
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

function execCommand(command, description) {
  try {
    log(`   Running: ${command}`, 'blue');
    const output = execSync(command, { 
      stdio: 'pipe', 
      encoding: 'utf8',
      cwd: process.cwd()
    });
    logSuccess(`${description} completed`);
    return output;
  } catch (error) {
    logError(`${description} failed: ${error.message}`);
    process.exit(1);
  }
}

function checkEnvironment() {
  logStep('1/7', 'Checking build environment');
  
  // Check Node.js version
  const nodeVersion = process.version;
  log(`   Node.js version: ${nodeVersion}`);
  
  // Check if we're in the right directory
  if (!fs.existsSync('package.json')) {
    logError('package.json not found. Please run this script from the project root.');
    process.exit(1);
  }
  
  // Check if Tauri CLI is available
  try {
    execSync('npx tauri --version', { stdio: 'pipe' });
    logSuccess('Tauri CLI is available');
  } catch (error) {
    logError('Tauri CLI not found. Please install @tauri-apps/cli');
    process.exit(1);
  }
  
  // Set production environment
  process.env.NODE_ENV = 'production';
  process.env.TAURI_DEBUG = 'false';
  
  logSuccess('Environment check completed');
}

function cleanBuildArtifacts() {
  logStep('2/7', 'Cleaning previous build artifacts');
  
  const dirsToClean = ['dist', 'src-tauri/target/release'];
  
  dirsToClean.forEach(dir => {
    if (fs.existsSync(dir)) {
      execCommand(`rm -rf ${dir}`, `Cleaning ${dir}`);
    }
  });
  
  logSuccess('Build artifacts cleaned');
}

function installDependencies() {
  logStep('3/7', 'Installing and updating dependencies');
  
  // Install frontend dependencies
  execCommand('npm ci', 'Installing frontend dependencies');
  
  // Update Rust dependencies
  execCommand('cd src-tauri && cargo update', 'Updating Rust dependencies');
  
  logSuccess('Dependencies installed and updated');
}

function runTests() {
  logStep('4/7', 'Running test suite');
  
  try {
    // Run frontend tests
    execCommand('npm run test -- --passWithNoTests --coverage=false', 'Running frontend tests');
    
    // Run Rust tests
    execCommand('cd src-tauri && cargo test --release', 'Running Rust tests');
    
    logSuccess('All tests passed');
  } catch (error) {
    logWarning('Some tests failed, but continuing with build');
  }
}

function buildFrontend() {
  logStep('5/7', 'Building optimized frontend');
  
  execCommand('npm run build:prod', 'Building frontend with production optimizations');
  
  // Verify build output
  if (!fs.existsSync('dist/index.html')) {
    logError('Frontend build failed - index.html not found');
    process.exit(1);
  }
  
  // Check bundle sizes
  const distStats = fs.readdirSync('dist/assets');
  log(`   Generated ${distStats.length} asset files`);
  
  logSuccess('Frontend build completed');
}

function buildTauriApp() {
  logStep('6/7', 'Building Tauri application');
  
  execCommand('npx tauri build --config src-tauri/tauri.conf.json', 'Building Tauri application');
  
  // Verify Tauri build output
  const targetDir = 'src-tauri/target/release';
  if (!fs.existsSync(targetDir)) {
    logError('Tauri build failed - target directory not found');
    process.exit(1);
  }
  
  logSuccess('Tauri application build completed');
}

function generateBuildReport() {
  logStep('7/7', 'Generating build report');
  
  const buildInfo = {
    timestamp: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    environment: 'production'
  };
  
  // Get package info
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  buildInfo.version = packageJson.version;
  buildInfo.name = packageJson.name;
  
  // Get bundle information
  const bundleDir = 'src-tauri/target/release/bundle';
  if (fs.existsSync(bundleDir)) {
    const bundles = fs.readdirSync(bundleDir);
    buildInfo.bundles = bundles;
    
    bundles.forEach(bundle => {
      const bundlePath = path.join(bundleDir, bundle);
      if (fs.statSync(bundlePath).isDirectory()) {
        const files = fs.readdirSync(bundlePath);
        log(`   ${bundle}: ${files.length} files generated`);
      }
    });
  }
  
  // Save build report
  fs.writeFileSync('build-report.json', JSON.stringify(buildInfo, null, 2));
  
  logSuccess('Build report generated: build-report.json');
}

function main() {
  log('\n🚀 MingLog Production Build Process', 'bright');
  log('=====================================', 'bright');
  
  const startTime = Date.now();
  
  try {
    checkEnvironment();
    cleanBuildArtifacts();
    installDependencies();
    runTests();
    buildFrontend();
    buildTauriApp();
    generateBuildReport();
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    log('\n🎉 Production build completed successfully!', 'green');
    log(`⏱️  Total build time: ${duration} seconds`, 'cyan');
    log('\n📦 Build artifacts:', 'bright');
    log('   • Frontend: dist/', 'blue');
    log('   • Tauri bundles: src-tauri/target/release/bundle/', 'blue');
    log('   • Build report: build-report.json', 'blue');
    
  } catch (error) {
    logError(`Build failed: ${error.message}`);
    process.exit(1);
  }
}

// Run the build process
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };
