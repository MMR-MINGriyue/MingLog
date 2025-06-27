# MingLog Electron 依赖修复脚本
# 尝试修复 Electron 开发环境问题

Write-Host "🔧 修复 MingLog Electron 开发环境..." -ForegroundColor Cyan

# 方法1: 尝试重新安装 Electron
Write-Host "📦 方法1: 重新安装 Electron..." -ForegroundColor Yellow
try {
    # 删除现有的 Electron
    if (Test-Path "node_modules/electron") {
        Remove-Item -Recurse -Force "node_modules/electron"
        Write-Host "✅ 已删除现有 Electron" -ForegroundColor Green
    }
    
    # 设置环境变量跳过二进制下载
    $env:ELECTRON_SKIP_BINARY_DOWNLOAD = "1"
    
    # 重新安装
    npm install electron@28.0.0 --save-dev --legacy-peer-deps
    Write-Host "✅ Electron 重新安装完成" -ForegroundColor Green
    
} catch {
    Write-Host "❌ 方法1失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 方法2: 手动下载 Electron 二进制文件
Write-Host "📦 方法2: 手动配置 Electron..." -ForegroundColor Yellow
try {
    # 创建 Electron 目录结构
    $electronDir = "node_modules/electron"
    if (-not (Test-Path $electronDir)) {
        New-Item -ItemType Directory -Path $electronDir -Force
    }
    
    Write-Host "✅ 已创建 Electron 目录结构" -ForegroundColor Green
    
} catch {
    Write-Host "❌ 方法2失败: $($_.Exception.Message)" -ForegroundColor Red
}

# 方法3: 验证当前构建是否可用
Write-Host "📦 方法3: 验证构建版本..." -ForegroundColor Yellow
if (Test-Path "./build/win-unpacked/MingLog.exe") {
    Write-Host "✅ 构建版本可用，可以使用 npm run start:built 启动" -ForegroundColor Green
    Write-Host "💡 建议: 使用构建版本进行开发，避免 Electron 依赖问题" -ForegroundColor Cyan
} else {
    Write-Host "❌ 构建版本不可用，需要先运行 npm run dist" -ForegroundColor Red
}

Write-Host "🎯 修复建议:" -ForegroundColor Cyan
Write-Host "  1. 使用 npm run start:built 启动构建版本" -ForegroundColor White
Write-Host "  2. 使用 ./dev-start.ps1 进行开发" -ForegroundColor White
Write-Host "  3. 修改代码后运行 npm run dist 重新构建" -ForegroundColor White

Write-Host "✨ 修复脚本执行完成！" -ForegroundColor Green
