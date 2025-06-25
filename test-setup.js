// Simple test script to verify project setup
import fs from 'fs';
import path from 'path';

console.log('🚀 Testing MingLog setup...');

// Test Node.js version
console.log('Node.js version:', process.version);

// Test if we can import basic modules
try {
  
  // Check if key directories exist
  const dirs = ['apps', 'packages', 'docs', 'scripts'];
  dirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      console.log(`✅ ${dir} directory exists`);
    } else {
      console.log(`❌ ${dir} directory missing`);
    }
  });
  
  // Check if package.json exists and is valid
  if (fs.existsSync('package.json')) {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    console.log(`✅ Root package.json: ${pkg.name} v${pkg.version}`);
  }
  
  // Check if node_modules exists
  if (fs.existsSync('node_modules')) {
    console.log('✅ node_modules directory exists');
  } else {
    console.log('❌ node_modules directory missing - run pnpm install');
  }
  
  console.log('🎉 Basic setup verification complete!');
  
} catch (error) {
  console.error('❌ Setup test failed:', error.message);
}
