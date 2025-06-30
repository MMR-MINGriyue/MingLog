# MingLog 桌面应用发布构建脚本
# PowerShell 脚本用于构建 Tauri 应用的发布版本

Write-Host "🚀 开始构建 MingLog 桌面应用发布版本..." -ForegroundColor Green

# 检查 Rust 环境
Write-Host "📋 检查 Rust 环境..." -ForegroundColor Yellow
if (!(Get-Command "cargo" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ 错误: 未找到 Cargo。请先安装 Rust。" -ForegroundColor Red
    Write-Host "安装命令: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh" -ForegroundColor Cyan
    exit 1
}

# 检查 Tauri CLI
Write-Host "📋 检查 Tauri CLI..." -ForegroundColor Yellow
if (!(Get-Command "cargo-tauri" -ErrorAction SilentlyContinue)) {
    Write-Host "⚠️  未找到 Tauri CLI，正在安装..." -ForegroundColor Yellow
    cargo install tauri-cli
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 错误: Tauri CLI 安装失败" -ForegroundColor Red
        exit 1
    }
}

# 进入 Tauri 目录
Set-Location "src-tauri"

# 清理之前的构建
Write-Host "🧹 清理之前的构建..." -ForegroundColor Yellow
cargo clean

# 更新依赖
Write-Host "📦 更新依赖..." -ForegroundColor Yellow
cargo update

# 运行代码检查
Write-Host "🔍 运行代码检查..." -ForegroundColor Yellow
cargo clippy --all-targets --all-features -- -D warnings
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  代码检查发现问题，但继续构建..." -ForegroundColor Yellow
}

# 运行测试
Write-Host "🧪 运行测试..." -ForegroundColor Yellow
cargo test
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  测试失败，但继续构建..." -ForegroundColor Yellow
}

# 构建发布版本
Write-Host "🔨 构建发布版本..." -ForegroundColor Green
cargo tauri build

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 构建成功！" -ForegroundColor Green
    Write-Host ""
    Write-Host "📦 构建产物位置:" -ForegroundColor Cyan
    Write-Host "Windows: target/release/bundle/msi/" -ForegroundColor White
    Write-Host "macOS: target/release/bundle/dmg/" -ForegroundColor White
    Write-Host "Linux: target/release/bundle/deb/ 或 target/release/bundle/appimage/" -ForegroundColor White
    Write-Host ""
    
    # 显示构建产物信息
    if (Test-Path "target/release/bundle") {
        Write-Host "🎯 发现的构建产物:" -ForegroundColor Cyan
        Get-ChildItem -Path "target/release/bundle" -Recurse -File | ForEach-Object {
            $size = [math]::Round($_.Length / 1MB, 2)
            Write-Host "  📄 $($_.Name) ($size MB)" -ForegroundColor White
        }
    }
} else {
    Write-Host "❌ 构建失败！" -ForegroundColor Red
    Write-Host "请检查上面的错误信息并修复问题。" -ForegroundColor Yellow
    exit 1
}

# 返回原目录
Set-Location ".."

Write-Host ""
Write-Host "🎉 MingLog 桌面应用构建完成！" -ForegroundColor Green
Write-Host "现在可以分发构建产物了。" -ForegroundColor Cyan
