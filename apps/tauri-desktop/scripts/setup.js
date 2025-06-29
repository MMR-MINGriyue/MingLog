#!/usr/bin/env node

/**
 * MingLog Desktop Setup Script
 * 
 * This script handles the setup and dependency installation for the Tauri desktop app.
 * It resolves workspace-related issues and ensures all dependencies are properly installed.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = path.join(__dirname, '..');
const PACKAGE_JSON_PATH = path.join(PROJECT_ROOT, 'package.json');

console.log('🚀 MingLog Desktop Setup Script');
console.log('================================\n');

// Check if we're in the correct directory
if (!fs.existsSync(PACKAGE_JSON_PATH)) {
  console.error('❌ Error: package.json not found. Please run this script from the tauri-desktop directory.');
  process.exit(1);
}

// Function to run commands safely
function runCommand(command, description) {
  console.log(`📦 ${description}...`);
  try {
    execSync(command, { 
      cwd: PROJECT_ROOT, 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'development' }
    });
    console.log(`✅ ${description} completed successfully\n`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    return false;
  }
}

// Function to check if a command exists
function commandExists(command) {
  try {
    execSync(`${command} --version`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Check prerequisites
console.log('🔍 Checking prerequisites...');

const prerequisites = [
  { command: 'node', name: 'Node.js', required: true },
  { command: 'npm', name: 'npm', required: true },
  { command: 'cargo', name: 'Rust/Cargo', required: true },
  { command: 'yarn', name: 'Yarn', required: false },
  { command: 'pnpm', name: 'pnpm', required: false }
];

let hasAllRequired = true;
let packageManager = 'npm';

prerequisites.forEach(({ command, name, required }) => {
  if (commandExists(command)) {
    console.log(`✅ ${name} is installed`);
    if (command === 'yarn' || command === 'pnpm') {
      packageManager = command; // Prefer yarn/pnpm over npm
    }
  } else if (required) {
    console.error(`❌ ${name} is required but not installed`);
    hasAllRequired = false;
  } else {
    console.log(`⚠️  ${name} is not installed (optional)`);
  }
});

if (!hasAllRequired) {
  console.error('\n❌ Missing required prerequisites. Please install them and try again.');
  process.exit(1);
}

console.log(`\n📦 Using package manager: ${packageManager}\n`);

// Clean previous installations
console.log('🧹 Cleaning previous installations...');
const cleanPaths = [
  'node_modules',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'dist',
  'src-tauri/target'
];

cleanPaths.forEach(cleanPath => {
  const fullPath = path.join(PROJECT_ROOT, cleanPath);
  if (fs.existsSync(fullPath)) {
    try {
      if (fs.statSync(fullPath).isDirectory()) {
        fs.rmSync(fullPath, { recursive: true, force: true });
      } else {
        fs.unlinkSync(fullPath);
      }
      console.log(`✅ Removed ${cleanPath}`);
    } catch (error) {
      console.log(`⚠️  Could not remove ${cleanPath}: ${error.message}`);
    }
  }
});

console.log('');

// Install dependencies
const installCommands = {
  npm: 'npm install --no-package-lock --legacy-peer-deps',
  yarn: 'yarn install --ignore-engines',
  pnpm: 'pnpm install --shamefully-hoist'
};

const installCommand = installCommands[packageManager];
if (!runCommand(installCommand, 'Installing dependencies')) {
  console.error('❌ Dependency installation failed. Trying alternative methods...\n');
  
  // Try with different flags
  const alternativeCommands = [
    'npm install --force --no-package-lock',
    'npm install --legacy-peer-deps --no-optional',
    'npm install --ignore-scripts --no-package-lock'
  ];
  
  let success = false;
  for (const altCommand of alternativeCommands) {
    console.log(`🔄 Trying: ${altCommand}`);
    if (runCommand(altCommand, 'Installing with alternative method')) {
      success = true;
      break;
    }
  }
  
  if (!success) {
    console.error('❌ All installation methods failed. Please check the error messages above.');
    console.log('\n💡 Troubleshooting tips:');
    console.log('1. Clear npm cache: npm cache clean --force');
    console.log('2. Delete node_modules and try again');
    console.log('3. Check your internet connection');
    console.log('4. Try using a different package manager (yarn/pnpm)');
    process.exit(1);
  }
}

// Verify installation
console.log('🔍 Verifying installation...');
const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };

let missingDeps = [];
Object.keys(dependencies).forEach(dep => {
  const depPath = path.join(PROJECT_ROOT, 'node_modules', dep);
  if (!fs.existsSync(depPath)) {
    missingDeps.push(dep);
  }
});

if (missingDeps.length > 0) {
  console.log(`⚠️  Some dependencies might be missing: ${missingDeps.join(', ')}`);
  console.log('This might be normal for workspace dependencies or optional packages.');
} else {
  console.log('✅ All dependencies appear to be installed correctly');
}

// Check Tauri CLI
console.log('\n🦀 Checking Tauri CLI...');
if (!commandExists('cargo tauri')) {
  console.log('📦 Installing Tauri CLI...');
  if (runCommand('cargo install tauri-cli', 'Installing Tauri CLI')) {
    console.log('✅ Tauri CLI installed successfully');
  } else {
    console.log('⚠️  Tauri CLI installation failed. You can install it manually with: cargo install tauri-cli');
  }
} else {
  console.log('✅ Tauri CLI is already installed');
}

// Generate icons if needed
console.log('\n🎨 Setting up icons...');
if (runCommand('node scripts/generate-icons.js', 'Generating application icons')) {
  console.log('✅ Icons generated successfully');
}

// Final setup
console.log('\n🎉 Setup completed successfully!');
console.log('\n📋 Next steps:');
console.log('1. Start development server: npm run dev');
console.log('2. Build for production: npm run build');
console.log('3. Run Tauri dev: npm run tauri:dev');
console.log('4. Build Tauri app: npm run tauri:build');
console.log('\n📖 For more information, see the README.md file.');
console.log('\n🚀 Happy coding with MingLog Desktop!');
