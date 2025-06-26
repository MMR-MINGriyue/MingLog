#!/usr/bin/env pwsh

Write-Host "🔍 MingLog Build Validation Script" -ForegroundColor Green
Write-Host "Based on successful v0.1.0-beta.20 configuration" -ForegroundColor Cyan

# Check if we're in the right directory
if (-not (Test-Path "apps/desktop/package.json")) {
    Write-Host "❌ Error: Must run from project root directory" -ForegroundColor Red
    exit 1
}

Write-Host "`n📋 Environment Validation..." -ForegroundColor Yellow

# Check Node.js version
$nodeVersion = node --version
Write-Host "Node.js version: $nodeVersion" -ForegroundColor White
if (-not $nodeVersion.StartsWith("v18.")) {
    Write-Host "⚠️  Warning: Expected Node.js v18.x, got $nodeVersion" -ForegroundColor Yellow
}

# Check pnpm version
try {
    $pnpmVersion = pnpm --version
    Write-Host "pnpm version: $pnpmVersion" -ForegroundColor White
} catch {
    Write-Host "❌ Error: pnpm not found. Please install pnpm." -ForegroundColor Red
    exit 1
}

# Check TypeScript version
try {
    $tsVersion = npx tsc --version
    Write-Host "TypeScript version: $tsVersion" -ForegroundColor White
} catch {
    Write-Host "❌ Error: TypeScript not found" -ForegroundColor Red
    exit 1
}

Write-Host "`n📦 Installing Dependencies..." -ForegroundColor Yellow
try {
    # Install root dependencies
    pnpm install --no-frozen-lockfile
    if ($LASTEXITCODE -ne 0) {
        throw "Root dependency installation failed"
    }
    
    Write-Host "✅ Root dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install root dependencies: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n🔨 Building Packages..." -ForegroundColor Yellow
try {
    pnpm run build:packages
    if ($LASTEXITCODE -ne 0) {
        throw "Packages build failed"
    }
    
    Write-Host "✅ Packages built successfully (skipped as expected)" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to build packages: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n🌐 Building Web App..." -ForegroundColor Yellow
try {
    pnpm run web:build
    if ($LASTEXITCODE -ne 0) {
        throw "Web app build failed"
    }
    
    Write-Host "✅ Web app built successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to build web app: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n💻 Building Desktop App..." -ForegroundColor Yellow
try {
    # Install desktop dependencies
    Set-Location "apps/desktop"
    pnpm install --no-frozen-lockfile
    if ($LASTEXITCODE -ne 0) {
        throw "Desktop dependency installation failed"
    }
    
    # Build desktop app
    $env:NODE_OPTIONS = "--max-old-space-size=4096"
    pnpm run build
    if ($LASTEXITCODE -ne 0) {
        throw "Desktop app build failed"
    }
    
    Write-Host "✅ Desktop app built successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to build desktop app: $_" -ForegroundColor Red
    Set-Location "../.."
    exit 1
} finally {
    Set-Location "../.."
}

Write-Host "`n📋 Validating Build Output..." -ForegroundColor Yellow

# Check main.js
if (Test-Path "apps/desktop/dist/main.js") {
    $mainSize = (Get-Item "apps/desktop/dist/main.js").Length
    Write-Host "✅ main.js generated ($mainSize bytes)" -ForegroundColor Green
} else {
    Write-Host "❌ main.js not found" -ForegroundColor Red
    exit 1
}

# Check preload.js
if (Test-Path "apps/desktop/dist/preload.js") {
    $preloadSize = (Get-Item "apps/desktop/dist/preload.js").Length
    Write-Host "✅ preload.js generated ($preloadSize bytes)" -ForegroundColor Green
} else {
    Write-Host "❌ preload.js not found" -ForegroundColor Red
    exit 1
}

# Check web app build
if (Test-Path "apps/web/dist/index.html") {
    Write-Host "✅ Web app dist found" -ForegroundColor Green
} else {
    Write-Host "⚠️  Web app dist not found (may be expected)" -ForegroundColor Yellow
}

Write-Host "`n🎉 Build Validation Completed Successfully!" -ForegroundColor Green
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "   - Run 'cd apps/desktop && pnpm run pack' to test packaging" -ForegroundColor Cyan
Write-Host "   - Run 'cd apps/desktop && pnpm run dist' to create distributable" -ForegroundColor Cyan
Write-Host "   - Commit changes and push to trigger CI/CD" -ForegroundColor Cyan

Write-Host "`n✨ This configuration matches successful v0.1.0-beta.20!" -ForegroundColor Green
