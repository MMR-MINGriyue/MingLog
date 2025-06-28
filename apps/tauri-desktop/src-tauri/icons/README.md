# MingLog Application Icons

This directory contains the application icons for MingLog Tauri desktop application.

## Icon Requirements

### Windows
- `icon.ico` - Main application icon (16x16, 32x32, 48x48, 256x256)

### macOS
- `icon.icns` - macOS application bundle icon (multiple sizes)

### Linux
- `32x32.png` - Small icon for taskbar
- `128x128.png` - Medium icon for applications menu
- `128x128@2x.png` - High DPI version

## Icon Design

The MingLog icon features:
- **Primary Color**: Blue (#3B82F6)
- **Design**: Minimalist "M" letter with knowledge graph elements
- **Style**: Modern, clean, professional

## Generating Icons

To generate icons from a source SVG:

```bash
# Install icon generation tools
npm install -g icon-gen

# Generate all required formats
icon-gen -i source-icon.svg -o . --ico --icns --png
```

## Current Status

⚠️ **Placeholder Icons**: Currently using placeholder icons. 
Production deployment should include properly designed icons.

## TODO

- [ ] Design professional MingLog logo
- [ ] Generate high-quality icons in all required formats
- [ ] Test icons on all target platforms
- [ ] Ensure proper icon scaling and clarity
