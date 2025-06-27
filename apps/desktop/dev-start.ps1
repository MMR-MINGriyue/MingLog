# MingLog 桌面应用开发启动脚本
# 解决 Electron 开发环境依赖问题的临时方案

Write-Host "🚀 启动 MingLog 桌面应用开发环境..." -ForegroundColor Cyan

# 检查是否有构建版本
if (Test-Path "./build/win-unpacked/MingLog.exe") {
    Write-Host "✅ 找到构建版本，启动应用..." -ForegroundColor Green

    # 启动现有构建版本
    Write-Host "🎉 启动 MingLog 桌面应用..." -ForegroundColor Green
    Start-Process "./build/win-unpacked/MingLog.exe"

    Write-Host "💡 提示: 代码已更新，但需要重新构建才能看到效果" -ForegroundColor Cyan
    Write-Host "📝 新增功能:" -ForegroundColor Yellow
    Write-Host "  • 拖拽重排块 - 鼠标悬停显示拖拽手柄" -ForegroundColor White
    Write-Host "  • 键盘快捷键:" -ForegroundColor White
    Write-Host "    - Enter: 新建块" -ForegroundColor White
    Write-Host "    - Tab/Shift+Tab: 缩进/取消缩进" -ForegroundColor White
    Write-Host "    - Backspace: 删除空块或合并" -ForegroundColor White
    Write-Host "    - Ctrl+Alt+1/2/3: 切换标题级别" -ForegroundColor White
    Write-Host "    - Ctrl+Alt+0: 普通段落" -ForegroundColor White
    Write-Host "    - Ctrl+Alt+Q: 引用块" -ForegroundColor White
    Write-Host "    - Ctrl+Alt+C: 代码块" -ForegroundColor White
    Write-Host "    - Ctrl+Alt+L: 列表项" -ForegroundColor White
    Write-Host "  • 类型切换工具栏 - 聚焦块时显示" -ForegroundColor White
} else {
    Write-Host "❌ 未找到构建版本，请先运行 npm run dist" -ForegroundColor Red
    Write-Host "💡 或者尝试修复 Electron 依赖问题" -ForegroundColor Yellow
}

Write-Host "Development environment started!" -ForegroundColor Green
