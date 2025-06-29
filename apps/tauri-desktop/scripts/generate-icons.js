#!/usr/bin/env node

/**
 * Icon Generation Script for MingLog Desktop
 * 
 * This script generates all required icon sizes for the Tauri application.
 * In a real project, you would use tools like sharp or imagemagick.
 */

const fs = require('fs');
const path = require('path');

const ICON_SIZES = [
  { size: 32, name: '32x32.png' },
  { size: 128, name: '128x128.png' },
  { size: 256, name: '128x128@2x.png' },
  { size: 512, name: 'icon.png' },
];

const ICON_DIR = path.join(__dirname, '../src-tauri/icons');

// Ensure icons directory exists
if (!fs.existsSync(ICON_DIR)) {
  fs.mkdirSync(ICON_DIR, { recursive: true });
}

// Generate placeholder icon files
ICON_SIZES.forEach(({ size, name }) => {
  const iconPath = path.join(ICON_DIR, name);
  
  // Create SVG content for each size
  const svgContent = `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size * 0.125}" fill="url(#gradient)"/>
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <!-- Book icon scaled to size -->
  <g transform="translate(${size * 0.25}, ${size * 0.25}) scale(${size / 512})">
    <path d="M48 64C48 28.7 76.7 0 112 0H336C371.3 0 400 28.7 400 64V320C400 355.3 371.3 384 336 384H112C76.7 384 48 355.3 48 320V64Z" fill="white" opacity="0.9"/>
    <path d="M80 96H368V128H80V96Z" fill="url(#gradient)" opacity="0.7"/>
    <path d="M80 160H368V192H80V160Z" fill="url(#gradient)" opacity="0.5"/>
    <path d="M80 224H320V256H80V224Z" fill="url(#gradient)" opacity="0.3"/>
    <path d="M80 288H288V320H80V288Z" fill="url(#gradient)" opacity="0.2"/>
  </g>
</svg>`;

  // Write SVG file (in a real project, you'd convert to PNG)
  const svgPath = iconPath.replace('.png', '.svg');
  fs.writeFileSync(svgPath, svgContent);
  
  console.log(`Generated icon: ${name} (${size}x${size})`);
});

// Create ICO file placeholder for Windows
const icoPath = path.join(ICON_DIR, 'icon.ico');
fs.writeFileSync(icoPath, '# Windows ICO file placeholder\n# In production, convert PNG to ICO format');

// Create ICNS file placeholder for macOS
const icnsPath = path.join(ICON_DIR, 'icon.icns');
fs.writeFileSync(icnsPath, '# macOS ICNS file placeholder\n# In production, convert PNG to ICNS format');

console.log('\n✅ Icon generation complete!');
console.log('📝 Note: In production, use proper image conversion tools to generate PNG/ICO/ICNS files from SVG.');
console.log('🛠️  Recommended tools: sharp, imagemagick, or @tauri-apps/cli icon command');

// Instructions for real icon generation
console.log('\n📋 To generate real icons:');
console.log('1. Create a high-resolution PNG (1024x1024)');
console.log('2. Run: npm run tauri icon path/to/icon.png');
console.log('3. Or use: npx @tauri-apps/cli icon path/to/icon.png');
