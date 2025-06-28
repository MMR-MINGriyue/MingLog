# MingLog Tauri应用打包脚本

param(
    [string]$Target = "all",
    [switch]$Debug = $false,
    [switch]$Clean = $false
)

Write-Host "🚀 Building MingLog Tauri Application..." -ForegroundColor Green
Write-Host "Target: $Target" -ForegroundColor Blue
Write-Host "Debug Mode: $Debug" -ForegroundColor Blue
Write-Host "Clean Build: $Clean" -ForegroundColor Blue
Write-Host ""

# 检查环境
Write-Host "📋 Checking build environment..." -ForegroundColor Blue

# 检查Rust
try {
    $rustVersion = rustc --version 2>$null
    Write-Host "✅ Rust: $rustVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Rust not found. Please install Rust first." -ForegroundColor Red
    Write-Host "Run: scripts/install-rust-simple.ps1" -ForegroundColor Yellow
    exit 1
}

# 检查Node.js
try {
    $nodeVersion = node --version 2>$null
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# 检查pnpm
try {
    $pnpmVersion = pnpm --version 2>$null
    Write-Host "✅ pnpm: $pnpmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ pnpm not found. Installing..." -ForegroundColor Yellow
    npm install -g pnpm
}

# 进入Tauri目录
$tauriDir = "apps/tauri-desktop"
if (!(Test-Path $tauriDir)) {
    Write-Host "❌ Tauri directory not found: $tauriDir" -ForegroundColor Red
    exit 1
}

Set-Location $tauriDir

# 清理构建
if ($Clean) {
    Write-Host "🧹 Cleaning previous builds..." -ForegroundColor Yellow
    
    if (Test-Path "dist") {
        Remove-Item -Recurse -Force "dist"
        Write-Host "✅ Cleaned frontend dist" -ForegroundColor Green
    }
    
    if (Test-Path "src-tauri/target") {
        Remove-Item -Recurse -Force "src-tauri/target"
        Write-Host "✅ Cleaned Rust target" -ForegroundColor Green
    }
}

# 安装依赖
Write-Host "📦 Installing dependencies..." -ForegroundColor Blue
try {
    pnpm install
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    Set-Location ".."
    exit 1
}

# 生成图标
Write-Host "🎨 Generating icons..." -ForegroundColor Blue
try {
    powershell -ExecutionPolicy Bypass -File "../../scripts/generate-icons.ps1"
    Write-Host "✅ Icons generated" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Icon generation failed, continuing with existing icons..." -ForegroundColor Yellow
}

# 构建前端
Write-Host "🔧 Building frontend..." -ForegroundColor Blue
try {
    pnpm build
    Write-Host "✅ Frontend built successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend build failed" -ForegroundColor Red
    Set-Location ".."
    exit 1
}

# 构建Tauri应用
Write-Host "🦀 Building Tauri application..." -ForegroundColor Blue

$buildArgs = @()
if ($Debug) {
    $buildArgs += "--debug"
}

if ($Target -ne "all") {
    $buildArgs += "--target", $Target
}

try {
    if ($buildArgs.Count -gt 0) {
        cargo tauri build @buildArgs
    } else {
        cargo tauri build
    }
    Write-Host "✅ Tauri application built successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Tauri build failed" -ForegroundColor Red
    Set-Location ".."
    exit 1
}

# 显示构建结果
Write-Host ""
Write-Host "🎉 Build completed successfully!" -ForegroundColor Green
Write-Host ""

$bundleDir = "src-tauri/target/release/bundle"
if ($Debug) {
    $bundleDir = "src-tauri/target/debug/bundle"
}

if (Test-Path $bundleDir) {
    Write-Host "📦 Build artifacts:" -ForegroundColor Blue
    Get-ChildItem -Path $bundleDir -Recurse -File | ForEach-Object {
        $size = [math]::Round($_.Length / 1MB, 2)
        Write-Host "  📄 $($_.Name) ($size MB)" -ForegroundColor White
        Write-Host "     $($_.FullName)" -ForegroundColor Gray
    }
} else {
    Write-Host "⚠️ Bundle directory not found: $bundleDir" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Blue
Write-Host "1. Test the built application on target platforms" -ForegroundColor White
Write-Host "2. Sign the application for distribution (if needed)" -ForegroundColor White
Write-Host "3. Create installation packages" -ForegroundColor White
Write-Host "4. Upload to distribution channels" -ForegroundColor White

Set-Location ".."
