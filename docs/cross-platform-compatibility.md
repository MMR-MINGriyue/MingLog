# Cross-Platform Compatibility Guide

This document outlines the cross-platform compatibility considerations and testing procedures for MingLog desktop application.

## 🎯 Supported Platforms

### Windows
- **Versions**: Windows 10 (1903+), Windows 11
- **Architectures**: x64, ia32
- **Package Formats**: NSIS installer, Portable executable
- **Auto-updater**: Supported via GitHub releases

### macOS
- **Versions**: macOS 10.15 (Catalina) and later
- **Architectures**: x64 (Intel), arm64 (Apple Silicon)
- **Package Formats**: DMG, ZIP
- **Code Signing**: Required for distribution

### Linux
- **Distributions**: Ubuntu 18.04+, Fedora 32+, Debian 10+, Arch Linux
- **Architectures**: x64
- **Package Formats**: AppImage, DEB
- **Desktop Environments**: GNOME, KDE, XFCE, i3

## 🧪 Testing Checklist

### Core Functionality
- [ ] Application startup and initialization
- [ ] Window creation and management
- [ ] Menu bar functionality
- [ ] System tray integration
- [ ] File operations (open, save, import, export)
- [ ] Keyboard shortcuts
- [ ] Theme switching (light/dark)
- [ ] Settings persistence
- [ ] Auto-updater functionality

### Platform-Specific Features

#### Windows
- [ ] Windows notifications
- [ ] Jump lists
- [ ] File associations
- [ ] Windows Defender compatibility
- [ ] High DPI scaling
- [ ] Windows Store compatibility (future)

#### macOS
- [ ] macOS notifications
- [ ] Dock integration
- [ ] Touch Bar support (if applicable)
- [ ] Retina display support
- [ ] macOS security permissions
- [ ] App Store compatibility (future)

#### Linux
- [ ] Desktop file integration
- [ ] System tray across DEs
- [ ] Package manager integration
- [ ] Wayland compatibility
- [ ] Flatpak/Snap compatibility (future)

## 🔧 Development Environment Setup

### Windows
```powershell
# Install Node.js and pnpm
winget install OpenJS.NodeJS
npm install -g pnpm

# Install Windows Build Tools
npm install -g windows-build-tools

# Clone and setup project
git clone https://github.com/MMR-MINGriyue/MingLog.git
cd MingLog
pnpm install
```

### macOS
```bash
# Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js and pnpm
brew install node pnpm

# Install Xcode Command Line Tools
xcode-select --install

# Clone and setup project
git clone https://github.com/MMR-MINGriyue/MingLog.git
cd MingLog
pnpm install
```

### Linux (Ubuntu/Debian)
```bash
# Install Node.js and pnpm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
npm install -g pnpm

# Install build dependencies
sudo apt-get install -y build-essential libnss3-dev libatk-bridge2.0-dev libdrm2 libxcomposite1 libxdamage1 libxrandr2 libgbm1 libxss1 libasound2-dev

# Clone and setup project
git clone https://github.com/MMR-MINGriyue/MingLog.git
cd MingLog
pnpm install
```

## 🚀 Building and Testing

### Run Cross-Platform Tests
```bash
# Run compatibility test script
node scripts/test-cross-platform.js

# Build for current platform
cd apps/desktop
npm run build
npm run dist

# Test the built application
npm run start
```

### Platform-Specific Builds
```bash
# Windows (from any platform)
npm run dist:win

# macOS (requires macOS)
npm run dist:mac

# Linux (from Linux or macOS)
npm run dist:linux

# All platforms (requires appropriate environment)
npm run dist:all
```

## 🐛 Common Issues and Solutions

### Windows Issues

#### Issue: "electron-builder" fails on Windows
**Solution**: Install Visual Studio Build Tools
```powershell
npm install -g windows-build-tools
```

#### Issue: Antivirus false positives
**Solution**: 
- Code sign the application
- Submit to antivirus vendors for whitelisting
- Use trusted certificate authority

### macOS Issues

#### Issue: "App is damaged" error
**Solution**: Code sign the application
```bash
# Sign the app (requires Apple Developer certificate)
codesign --force --deep --sign "Developer ID Application: Your Name" MingLog.app
```

#### Issue: Gatekeeper blocking execution
**Solution**: Notarize the application with Apple

### Linux Issues

#### Issue: System tray not working
**Solution**: Install system tray support
```bash
# GNOME
sudo apt install gnome-shell-extension-appindicator

# KDE - usually works out of the box

# XFCE
sudo apt install xfce4-indicator-plugin
```

#### Issue: AppImage not executable
**Solution**: Make it executable
```bash
chmod +x MingLog-*.AppImage
```

## 📊 Performance Benchmarks

### Startup Time Targets
- **Windows**: < 3 seconds
- **macOS**: < 2 seconds  
- **Linux**: < 3 seconds

### Memory Usage Targets
- **Idle**: < 120 MB
- **Active**: < 200 MB
- **Heavy usage**: < 400 MB

### Package Size Targets
- **Windows**: < 150 MB
- **macOS**: < 120 MB
- **Linux**: < 100 MB

## 🔍 Testing Automation

### Continuous Integration
```yaml
# .github/workflows/test-cross-platform.yml
name: Cross-Platform Tests
on: [push, pull_request]

jobs:
  test:
    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install -g pnpm
      - run: pnpm install
      - run: node scripts/test-cross-platform.js
      - run: cd apps/desktop && npm run build
```

### Manual Testing Checklist

#### Pre-Release Testing
1. **Functionality Testing**
   - [ ] All core features work
   - [ ] No console errors
   - [ ] Performance is acceptable

2. **UI/UX Testing**
   - [ ] UI scales properly on different screen sizes
   - [ ] Themes work correctly
   - [ ] Keyboard navigation works

3. **Integration Testing**
   - [ ] File associations work
   - [ ] System notifications work
   - [ ] Auto-updater works

4. **Regression Testing**
   - [ ] Previous bugs are fixed
   - [ ] No new issues introduced

## 📋 Release Checklist

### Before Release
- [ ] Run cross-platform tests on all target platforms
- [ ] Verify code signing certificates
- [ ] Test auto-updater with staging releases
- [ ] Update version numbers
- [ ] Update changelog

### During Release
- [ ] Build for all platforms
- [ ] Upload to GitHub releases
- [ ] Test download and installation
- [ ] Monitor for issues

### After Release
- [ ] Monitor crash reports
- [ ] Collect user feedback
- [ ] Plan hotfixes if needed

## 🤝 Contributing

When contributing cross-platform code:

1. Test on multiple platforms when possible
2. Use platform-agnostic APIs when available
3. Document platform-specific behavior
4. Add appropriate feature detection
5. Update this compatibility guide

## 📞 Support

For platform-specific issues:
- **Windows**: Check Windows Event Viewer for errors
- **macOS**: Check Console.app for crash logs
- **Linux**: Check system logs and terminal output

Report issues with:
- Platform and version
- Architecture (x64, arm64, etc.)
- Steps to reproduce
- Error messages or logs
