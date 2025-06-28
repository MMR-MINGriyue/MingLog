# Tauri应用测试脚本

Write-Host "🦀 Testing MingLog Tauri Application..." -ForegroundColor Green

# 检查Rust环境
Write-Host "📋 Checking Rust environment..." -ForegroundColor Blue
try {
    $rustVersion = rustc --version 2>$null
    if ($rustVersion) {
        Write-Host "✅ Rust: $rustVersion" -ForegroundColor Green
    } else {
        Write-Host "❌ Rust not found. Please install Rust first." -ForegroundColor Red
        Write-Host "Run: scripts/install-rust-simple.ps1" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ Rust not found. Please install Rust first." -ForegroundColor Red
    Write-Host "Run: scripts/install-rust-simple.ps1" -ForegroundColor Yellow
    exit 1
}

# 检查Cargo
try {
    $cargoVersion = cargo --version 2>$null
    Write-Host "✅ Cargo: $cargoVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Cargo not found." -ForegroundColor Red
    exit 1
}

# 检查Node.js
Write-Host "📋 Checking Node.js environment..." -ForegroundColor Blue
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
    Write-Host "❌ pnpm not found. Please install pnpm first." -ForegroundColor Red
    Write-Host "Run: npm install -g pnpm" -ForegroundColor Yellow
    exit 1
}

# 进入Tauri应用目录
$tauriDir = "apps/tauri-desktop"
if (!(Test-Path $tauriDir)) {
    Write-Host "❌ Tauri directory not found: $tauriDir" -ForegroundColor Red
    exit 1
}

Set-Location $tauriDir

# 安装依赖
Write-Host "📦 Installing dependencies..." -ForegroundColor Blue
try {
    pnpm install
    Write-Host "✅ Dependencies installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# 检查Tauri CLI
Write-Host "📋 Checking Tauri CLI..." -ForegroundColor Blue
try {
    $tauriVersion = cargo tauri --version 2>$null
    if ($tauriVersion) {
        Write-Host "✅ Tauri CLI: $tauriVersion" -ForegroundColor Green
    } else {
        Write-Host "📦 Installing Tauri CLI..." -ForegroundColor Yellow
        cargo install tauri-cli
        Write-Host "✅ Tauri CLI installed" -ForegroundColor Green
    }
} catch {
    Write-Host "📦 Installing Tauri CLI..." -ForegroundColor Yellow
    try {
        cargo install tauri-cli
        Write-Host "✅ Tauri CLI installed" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to install Tauri CLI" -ForegroundColor Red
        exit 1
    }
}

# 编译检查
Write-Host "🔧 Checking Rust compilation..." -ForegroundColor Blue
Set-Location "src-tauri"
try {
    cargo check
    Write-Host "✅ Rust code compiles successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Rust compilation failed" -ForegroundColor Red
    Set-Location ".."
    Set-Location ".."
    exit 1
}

Set-Location ".."

# 前端构建检查
Write-Host "🔧 Checking frontend build..." -ForegroundColor Blue
try {
    pnpm build
    Write-Host "✅ Frontend builds successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend build failed" -ForegroundColor Red
    Set-Location ".."
    exit 1
}

Write-Host ""
Write-Host "🎉 All checks passed! Tauri application is ready." -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Blue
Write-Host "1. Run 'pnpm tauri:dev' to start development mode" -ForegroundColor White
Write-Host "2. Run 'pnpm tauri:build' to build for production" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Starting development mode..." -ForegroundColor Green

# 启动开发模式
try {
    pnpm tauri:dev
} catch {
    Write-Host "❌ Failed to start development mode" -ForegroundColor Red
    Write-Host "You can manually run: pnpm tauri:dev" -ForegroundColor Yellow
}

Set-Location ".."
