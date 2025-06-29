# MingLog Desktop Production Build Script (PowerShell)
# This script builds the application for production with optimizations

param(
    [switch]$SkipTests = $false,
    [switch]$Verbose = $false
)

# Error handling
$ErrorActionPreference = "Stop"

# Colors for output
$Colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Blue"
    White = "White"
}

function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Colors.Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor $Colors.Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Colors.Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Colors.Red
}

Write-Host "🚀 Starting MingLog Desktop Production Build" -ForegroundColor $Colors.Green
Write-Host "==============================================" -ForegroundColor $Colors.Green

# Check prerequisites
Write-Status "Checking prerequisites..."

# Check Node.js
try {
    $nodeVersion = node --version
    $versionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($versionNumber -lt 18) {
        Write-Error "Node.js version 18+ is required. Current version: $nodeVersion"
        exit 1
    }
    Write-Status "Node.js version: $nodeVersion ✓"
} catch {
    Write-Error "Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
}

# Check pnpm
try {
    $pnpmVersion = pnpm --version
    Write-Status "pnpm version: $pnpmVersion ✓"
} catch {
    Write-Error "pnpm is not installed. Please install pnpm and try again."
    exit 1
}

# Check Rust
try {
    $rustVersion = cargo --version
    Write-Status "Rust version: $rustVersion ✓"
} catch {
    Write-Error "Rust is not installed. Please install Rust and try again."
    exit 1
}

Write-Success "All prerequisites satisfied"

# Clean previous builds
Write-Status "Cleaning previous builds..."
if (Test-Path "apps/tauri-desktop/dist") {
    Remove-Item -Recurse -Force "apps/tauri-desktop/dist"
}
if (Test-Path "apps/tauri-desktop/src-tauri/target/release") {
    Remove-Item -Recurse -Force "apps/tauri-desktop/src-tauri/target/release"
}
if (Test-Path "node_modules/.cache") {
    Remove-Item -Recurse -Force "node_modules/.cache"
}
Write-Success "Cleaned previous builds"

# Install dependencies
Write-Status "Installing dependencies..."
pnpm install --frozen-lockfile
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to install dependencies"
    exit 1
}
Write-Success "Dependencies installed"

# Build packages
Write-Status "Building packages..."
pnpm run build:packages
if ($LASTEXITCODE -ne 0) {
    Write-Error "Failed to build packages"
    exit 1
}
Write-Success "Packages built"

# Run tests (unless skipped)
if (-not $SkipTests) {
    Write-Status "Running tests..."
    pnpm run test
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Tests failed. Please fix failing tests before building for production."
        Write-Warning "Use -SkipTests parameter to skip tests (not recommended for production)"
        exit 1
    }
    Write-Success "All tests passed"
} else {
    Write-Warning "Skipping tests (not recommended for production builds)"
}

# Build frontend
Write-Status "Building frontend..."
Set-Location "apps/tauri-desktop"

npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Frontend build failed"
    exit 1
}

# Check if build was successful
if (-not (Test-Path "dist")) {
    Write-Error "Frontend build failed - dist directory not found"
    exit 1
}

Write-Success "Frontend built successfully"

# Optimize frontend build
Write-Status "Optimizing frontend build..."

# Get build statistics
$distSize = (Get-ChildItem -Recurse "dist" | Measure-Object -Property Length -Sum).Sum
$distSizeMB = [math]::Round($distSize / 1MB, 2)
Write-Status "Frontend bundle size: $distSizeMB MB"

# Compress assets (if available)
if (Get-Command "gzip" -ErrorAction SilentlyContinue) {
    Get-ChildItem -Recurse "dist" -Include "*.js", "*.css", "*.html" | ForEach-Object {
        gzip -k $_.FullName
    }
    Write-Success "Assets compressed with gzip"
}

Write-Success "Frontend optimization completed"

# Build Tauri application
Write-Status "Building Tauri application..."

# Set production environment
$env:NODE_ENV = "production"
$env:TAURI_ENV = "production"

# Build for current platform
npm run tauri:build
if ($LASTEXITCODE -ne 0) {
    Write-Error "Tauri build failed"
    exit 1
}

# Check if Tauri build was successful
if (-not (Test-Path "src-tauri/target/release")) {
    Write-Error "Tauri build failed - release directory not found"
    exit 1
}

Write-Success "Tauri application built successfully"

# Create release directory
Write-Status "Organizing release files..."
Set-Location "../.."
if (-not (Test-Path "release")) {
    New-Item -ItemType Directory -Path "release" | Out-Null
}

# Copy built files for Windows
$bundlePath = "apps/tauri-desktop/src-tauri/target/release/bundle"

# Copy MSI installer
if (Test-Path "$bundlePath/msi") {
    Copy-Item "$bundlePath/msi/*.msi" "release/" -ErrorAction SilentlyContinue
    Write-Status "MSI installer copied"
}

# Copy NSIS installer
if (Test-Path "$bundlePath/nsis") {
    Copy-Item "$bundlePath/nsis/*.exe" "release/" -ErrorAction SilentlyContinue
    Write-Status "NSIS installer copied"
}

Write-Success "Windows release files copied"

# Generate checksums
Write-Status "Generating checksums..."
Set-Location "release"

$checksumFile = "checksums.sha256"
if (Test-Path $checksumFile) {
    Remove-Item $checksumFile
}

Get-ChildItem -File | ForEach-Object {
    $hash = Get-FileHash $_.Name -Algorithm SHA256
    "$($hash.Hash.ToLower())  $($_.Name)" | Add-Content $checksumFile
}

Write-Success "Checksums generated"

# Display build summary
Write-Host ""
Write-Host "🎉 Build completed successfully!" -ForegroundColor $Colors.Green
Write-Host "=================================" -ForegroundColor $Colors.Green
Write-Host ""

Write-Status "Build artifacts:"
Get-ChildItem -File | ForEach-Object {
    $size = [math]::Round($_.Length / 1MB, 2)
    Write-Host "  $($_.Name) ($size MB)" -ForegroundColor $Colors.White
}

# Calculate total size
$totalSize = (Get-ChildItem -File | Measure-Object -Property Length -Sum).Sum
$totalSizeMB = [math]::Round($totalSize / 1MB, 2)
Write-Status "Total release size: $totalSizeMB MB"

# Display next steps
Write-Host ""
Write-Status "Next steps:"
Write-Host "  1. Test the built application thoroughly" -ForegroundColor $Colors.White
Write-Host "  2. Create release notes and changelog" -ForegroundColor $Colors.White
Write-Host "  3. Upload to distribution platforms" -ForegroundColor $Colors.White
Write-Host "  4. Update documentation and website" -ForegroundColor $Colors.White
Write-Host ""

# Performance summary
$buildEndTime = Get-Date
Write-Status "Build completed at: $buildEndTime"

Write-Success "Production build completed! 🚀"

# Return to original directory
Set-Location ".."
