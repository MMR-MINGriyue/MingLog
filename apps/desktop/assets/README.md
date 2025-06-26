# MingLog Brand Assets

This directory contains the brand assets and design resources for MingLog.

## 📁 Files Overview

### Icons
- `icon.svg` - Master SVG icon (512x512)
- `icon.png` - PNG icon for Linux (512x512) 
- `icon.ico` - Windows icon (multiple sizes)
- `icon.icns` - macOS icon (multiple sizes)
- `tray-icon.png` - System tray icon (16x16, 32x32)

### Brand Resources
- `brand-colors.css` - Complete color palette and design system
- `splash.html` - Application splash screen
- `generate-icons.js` - Icon generation utility script

## 🎨 Brand Colors

### Primary Colors
- **Primary**: #667eea (Purple-blue gradient start)
- **Secondary**: #764ba2 (Purple gradient end)

### Accent Colors
- **Pink**: #f093fb
- **Coral**: #f5576c
- **Blue**: #4facfe

### Gradients
- **Primary**: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`
- **Secondary**: `linear-gradient(135deg, #f093fb 0%, #f5576c 100%)`

## 🖼️ Icon Design

The MingLog icon features:
- Modern gradient background (primary brand colors)
- Clean "M" letterform in white
- Decorative nodes and connections representing knowledge links
- Subtle shadow and depth effects
- Scalable vector format for all sizes

## 🚀 Splash Screen

The splash screen includes:
- Animated brand logo
- Loading spinner
- Floating particle effects
- Gradient background matching brand colors
- Version information

## 📋 Usage Guidelines

### Icon Usage
1. Use the SVG version as the master file
2. Generate platform-specific formats as needed
3. Maintain aspect ratio when scaling
4. Don't modify colors or proportions

### Color Usage
1. Use CSS custom properties from `brand-colors.css`
2. Maintain contrast ratios for accessibility
3. Use gradients sparingly for accent elements
4. Support both light and dark themes

### Typography
- Primary font: System fonts (-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto)
- Monospace: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono'

## 🛠️ Generating Icons

To generate icons from the SVG source:

### Using ImageMagick
```bash
# Generate PNG icons
magick icon.svg -resize 512x512 icon.png
magick icon.svg -resize 256x256 icon-256.png
magick icon.svg -resize 128x128 icon-128.png
magick icon.svg -resize 64x64 icon-64.png
magick icon.svg -resize 32x32 icon-32.png
magick icon.svg -resize 16x16 icon-16.png

# Generate ICO for Windows
magick icon.svg -define icon:auto-resize=256,128,64,48,32,16 icon.ico
```

### Using Inkscape
```bash
# Generate PNG
inkscape icon.svg --export-type=png --export-filename=icon.png --export-width=512 --export-height=512
```

### Online Tools
- [Convertio](https://convertio.co/svg-png/)
- [CloudConvert](https://cloudconvert.com/svg-to-png)
- [RealFaviconGenerator](https://realfavicongenerator.net/)

## 📱 Platform Requirements

### Windows
- `icon.ico` - Multiple sizes (16, 32, 48, 64, 128, 256)
- `tray-icon.ico` - 16x16 for system tray

### macOS
- `icon.icns` - Multiple sizes (16, 32, 64, 128, 256, 512, 1024)
- `tray-icon.png` - 16x16 and 32x32 for retina displays

### Linux
- `icon.png` - 512x512 recommended
- `tray-icon.png` - 16x16 for system tray

## 🎯 Design Principles

1. **Simplicity**: Clean, minimal design that scales well
2. **Recognition**: Distinctive "M" shape for brand recognition
3. **Modernity**: Contemporary gradient and styling
4. **Scalability**: Works from 16x16 to 1024x1024
5. **Consistency**: Unified color palette across all assets

## 📄 License

These brand assets are part of the MingLog project and follow the same MIT license terms.
