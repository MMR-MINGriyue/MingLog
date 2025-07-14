# MingLog Windows Build Guide

This guide provides comprehensive instructions for building MingLog desktop application on Windows.

## Prerequisites

### Required Tools

1. **Node.js** (v16.0+, recommended v18.0+)
   - Download from: https://nodejs.org/
   - Verify: `node --version` and `npm --version`

2. **Rust Toolchain**
   - Install from: https://rustup.rs/
   - Verify: `rustc --version` and `cargo --version`
   - Required target: `rustup target add x86_64-pc-windows-msvc`

3. **Tauri CLI**
   - Install: `cargo install tauri-cli`
   - Verify: `cargo tauri --version`

4. **Visual Studio Build Tools** (Optional but recommended)
   - Install Visual Studio 2019/2022 with C++ build tools
   - Or install Build Tools for Visual Studio
   - Verify: Check if `cl.exe` is in PATH

### Optional Tools (for installers)

5. **WiX Toolset** (for MSI installers)
   - Download from: https://wixtoolset.org/releases/
   - Or install via: `winget install WiXToolset.WiX`

6. **NSIS** (for NSIS installers)
   - Download from: https://nsis.sourceforge.io/Download
   - Or install via: `winget install NSIS.NSIS`

## Quick Start

### 1. Environment Check

Run the environment check script to verify your setup:

```powershell
.\scripts\check-env.ps1
```

To auto-fix some issues:

```powershell
.\scripts\check-env.ps1 -Fix
```

### 2. Simple Build (Executable Only)

For a quick test build without installers:

```powershell
.\scripts\build-simple.ps1
```

This will:
- Build the frontend
- Compile the Rust application
- Generate `minglog-desktop.exe` in the `release/` folder

### 3. Full Build (with Installers)

For a complete build with MSI and NSIS installers:

```powershell
.\scripts\build-windows.ps1
```

## Build Scripts

### Environment Check Script

**File**: `scripts/check-env.ps1`

Checks your build environment and reports any issues:

```powershell
# Basic check
.\scripts\check-env.ps1

# Check and auto-fix issues
.\scripts\check-env.ps1 -Fix
```

### Simple Build Script

**File**: `scripts/build-simple.ps1`

Builds only the executable without installers:

```powershell
# Release build
.\scripts\build-simple.ps1

# Debug build
.\scripts\build-simple.ps1 -BuildType debug

# Skip tests
.\scripts\build-simple.ps1 -SkipTests
```

### Full Build Script

**File**: `scripts/build-windows.ps1`

Complete build with all installers:

```powershell
# Release build
.\scripts\build-windows.ps1

# Debug build
.\scripts\build-windows.ps1 -BuildType debug

# Skip tests and clean
.\scripts\build-windows.ps1 -SkipTests -SkipClean

# Verbose output
.\scripts\build-windows.ps1 -Verbose
```

### Diagnostics Script

**File**: `scripts/diagnose-build.ps1`

Diagnoses build issues and provides solutions:

```powershell
.\scripts\diagnose-build.ps1
```

## Manual Build Steps

If you prefer to build manually:

### 1. Install Dependencies

```bash
# Root dependencies
npm install

# Tauri desktop app dependencies
cd apps/tauri-desktop
npm install
cd ../..
```

### 2. Build Frontend

```bash
cd apps/tauri-desktop
npm run build
cd ../..
```

### 3. Build Rust Application

```bash
cd apps/tauri-desktop
cargo tauri build
cd ../..
```

## Build Outputs

### Executable Only Build

After running `build-simple.ps1`:

```
release/
├── minglog-desktop.exe    # Main executable (7+ MB)
└── checksums.sha256       # SHA256 checksums
```

### Full Build

After running `build-windows.ps1`:

```
release/
├── minglog-desktop.exe           # Main executable
├── MingLog Desktop_1.0.0_x64.msi # MSI installer
├── MingLog Desktop_1.0.0_x64.exe # NSIS installer
└── checksums.sha256              # SHA256 checksums
```

## Troubleshooting

### Common Issues

1. **"Schema is missing its top node type"**
   - This is a TipTap configuration issue
   - Already fixed in the current codebase

2. **"WiX Toolset not found"**
   - Install WiX Toolset from https://wixtoolset.org/
   - Or use simple build: `.\scripts\build-simple.ps1`

3. **"MSVC compiler not found"**
   - Install Visual Studio Build Tools
   - Or install Visual Studio 2019/2022 with C++ workload

4. **"Node.js version too old"**
   - Update to Node.js 18.0+ for best compatibility
   - Minimum supported: Node.js 16.0

5. **"Rust target not installed"**
   - Run: `rustup target add x86_64-pc-windows-msvc`

### Build Diagnostics

Run the diagnostics script for detailed analysis:

```powershell
.\scripts\diagnose-build.ps1
```

This will check:
- Windows SDK installation
- WiX Toolset availability
- NSIS installation
- PATH environment variables
- Tauri configuration
- Application icons
- Previous build outputs

### Performance Tips

1. **Faster Builds**
   - Use `--debug` flag for development
   - Skip tests with `-SkipTests` during development
   - Use incremental builds (don't clean every time)

2. **Smaller Executables**
   - Release builds are automatically optimized
   - Symbols are stripped for smaller size
   - Consider using UPX compression for distribution

## Development Workflow

### Recommended Development Process

1. **Initial Setup**
   ```powershell
   .\scripts\check-env.ps1 -Fix
   ```

2. **Development Builds**
   ```powershell
   .\scripts\build-simple.ps1 -BuildType debug -SkipTests
   ```

3. **Testing Builds**
   ```powershell
   .\scripts\build-simple.ps1
   ```

4. **Release Builds**
   ```powershell
   .\scripts\build-windows.ps1
   ```

### Continuous Integration

For CI/CD pipelines, use:

```powershell
# Check environment
.\scripts\check-env.ps1

# Build with full validation
.\scripts\build-windows.ps1 -Verbose
```

## Configuration

### Tauri Configuration

Main configuration file: `apps/tauri-desktop/src-tauri/tauri.conf.json`

Key settings:
- Product name: "MingLog Desktop"
- Version: "1.0.0"
- Bundle targets: MSI, NSIS
- Windows-specific settings

### Build Optimization

The build is configured for:
- **Size optimization**: `-C opt-level=z`
- **Symbol stripping**: `-C strip=symbols`
- **Single codegen unit**: `-C codegen-units=1`
- **Panic abort**: `-C panic=abort`

## Support

### Getting Help

1. **Check the diagnostics**: `.\scripts\diagnose-build.ps1`
2. **Review build logs**: Look for specific error messages
3. **Verify environment**: `.\scripts\check-env.ps1`
4. **Check dependencies**: Ensure all tools are installed

### Known Working Configurations

- **Windows 10/11** with Visual Studio 2019/2022
- **Node.js 18.0+** with npm 8.0+
- **Rust 1.70+** with Cargo
- **Tauri CLI 1.5+**

This build system has been tested and verified to work on Windows development environments.
