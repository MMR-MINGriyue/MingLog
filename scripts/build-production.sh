#!/bin/bash

# MingLog Desktop Production Build Script
# This script builds the application for production with optimizations

set -e  # Exit on any error

echo "🚀 Starting MingLog Desktop Production Build"
echo "=============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
print_status "Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18+ is required. Current version: $(node --version)"
    exit 1
fi

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    print_error "pnpm is not installed. Please install pnpm and try again."
    exit 1
fi

# Check Rust
if ! command -v cargo &> /dev/null; then
    print_error "Rust is not installed. Please install Rust and try again."
    exit 1
fi

print_success "All prerequisites satisfied"

# Clean previous builds
print_status "Cleaning previous builds..."
rm -rf apps/tauri-desktop/dist
rm -rf apps/tauri-desktop/src-tauri/target/release
rm -rf node_modules/.cache
print_success "Cleaned previous builds"

# Install dependencies
print_status "Installing dependencies..."
pnpm install --frozen-lockfile
print_success "Dependencies installed"

# Build packages
print_status "Building packages..."
pnpm run build:packages
print_success "Packages built"

# Run tests
print_status "Running tests..."
if ! pnpm run test; then
    print_error "Tests failed. Please fix failing tests before building for production."
    exit 1
fi
print_success "All tests passed"

# Build frontend
print_status "Building frontend..."
cd apps/tauri-desktop
npm run build

# Check if build was successful
if [ ! -d "dist" ]; then
    print_error "Frontend build failed - dist directory not found"
    exit 1
fi

print_success "Frontend built successfully"

# Optimize frontend build
print_status "Optimizing frontend build..."

# Compress assets
if command -v gzip &> /dev/null; then
    find dist -type f \( -name "*.js" -o -name "*.css" -o -name "*.html" \) -exec gzip -k {} \;
    print_success "Assets compressed with gzip"
fi

# Build Tauri application
print_status "Building Tauri application..."

# Set production environment
export NODE_ENV=production
export TAURI_ENV=production

# Build for current platform
npm run tauri:build

# Check if Tauri build was successful
if [ ! -d "src-tauri/target/release" ]; then
    print_error "Tauri build failed - release directory not found"
    exit 1
fi

print_success "Tauri application built successfully"

# Create release directory
print_status "Organizing release files..."
mkdir -p ../../release

# Copy built files based on platform
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    cp -r src-tauri/target/release/bundle/dmg/*.dmg ../../release/ 2>/dev/null || true
    cp -r src-tauri/target/release/bundle/macos/*.app ../../release/ 2>/dev/null || true
    print_success "macOS release files copied"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    cp -r src-tauri/target/release/bundle/deb/*.deb ../../release/ 2>/dev/null || true
    cp -r src-tauri/target/release/bundle/appimage/*.AppImage ../../release/ 2>/dev/null || true
    cp -r src-tauri/target/release/bundle/rpm/*.rpm ../../release/ 2>/dev/null || true
    print_success "Linux release files copied"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    # Windows
    cp -r src-tauri/target/release/bundle/msi/*.msi ../../release/ 2>/dev/null || true
    cp -r src-tauri/target/release/bundle/nsis/*.exe ../../release/ 2>/dev/null || true
    print_success "Windows release files copied"
fi

# Generate checksums
print_status "Generating checksums..."
cd ../../release
if command -v sha256sum &> /dev/null; then
    sha256sum * > checksums.sha256
elif command -v shasum &> /dev/null; then
    shasum -a 256 * > checksums.sha256
fi
print_success "Checksums generated"

# Display build summary
echo ""
echo "🎉 Build completed successfully!"
echo "================================="
echo ""
print_status "Build artifacts:"
ls -la
echo ""

# Calculate total size
TOTAL_SIZE=$(du -sh . | cut -f1)
print_status "Total release size: $TOTAL_SIZE"

# Display next steps
echo ""
print_status "Next steps:"
echo "  1. Test the built application thoroughly"
echo "  2. Create release notes and changelog"
echo "  3. Upload to distribution platforms"
echo "  4. Update documentation and website"
echo ""

print_success "Production build completed! 🚀"
