# MingLog 功能测试启动脚本
# 启动应用程序并显示测试指南

Write-Host "🧪 MingLog 编辑器功能测试" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# 检查应用程序是否存在
if (Test-Path "./build/win-unpacked/MingLog.exe") {
    Write-Host "✅ 找到 MingLog 应用程序" -ForegroundColor Green
    
    # 启动应用程序
    Write-Host "🚀 启动 MingLog..." -ForegroundColor Yellow
    Start-Process "./build/win-unpacked/MingLog.exe"
    
    # 等待应用程序启动
    Start-Sleep -Seconds 3
    
    Write-Host ""
    Write-Host "🎯 测试系统已集成到应用程序中！" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 快速测试指南:" -ForegroundColor Yellow
    Write-Host "  1. 应用程序启动后，会自动运行功能检测" -ForegroundColor White
    Write-Host "  2. 按 Ctrl+Shift+T 打开测试面板" -ForegroundColor White
    Write-Host "  3. 按 Ctrl+Shift+R 重新运行测试" -ForegroundColor White
    Write-Host "  4. 按 F12 打开开发者工具查看详细日志" -ForegroundColor White
    Write-Host ""
    Write-Host "🔍 主要测试项目:" -ForegroundColor Yellow
    Write-Host "  • 拖拽重排: 鼠标悬停显示拖拽手柄" -ForegroundColor White
    Write-Host "  • 键盘快捷键: Enter, Tab, Ctrl+Alt+数字/字母" -ForegroundColor White
    Write-Host "  • 类型切换: 聚焦块时显示工具栏" -ForegroundColor White
    Write-Host "  • 缩进层级: Tab/Shift+Tab 调整缩进" -ForegroundColor White
    Write-Host "  • 视觉效果: 悬停、聚焦、动画效果" -ForegroundColor White
    Write-Host ""
    Write-Host "⚠️  如果功能不工作:" -ForegroundColor Red
    Write-Host "  1. 检查右上角是否有错误通知" -ForegroundColor White
    Write-Host "  2. 打开测试面板查看测试结果" -ForegroundColor White
    Write-Host "  3. 查看开发者工具控制台" -ForegroundColor White
    Write-Host ""
    Write-Host "📖 详细测试指南: ./TESTING_GUIDE.md" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "🎉 开始测试吧！" -ForegroundColor Green
    
} else {
    Write-Host "❌ 未找到 MingLog 应用程序" -ForegroundColor Red
    Write-Host "请确保应用程序已构建: npm run dist" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "按任意键退出..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
