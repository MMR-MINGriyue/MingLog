@echo off
echo 🧪 MingLog 测试启动器
echo ========================

echo 检查应用程序文件...
if exist "build\win-unpacked\MingLog.exe" (
    echo ✅ 找到 MingLog.exe
    echo.
    echo 🚀 启动 MingLog 应用程序...
    start "" "build\win-unpacked\MingLog.exe"
    
    echo.
    echo 📋 测试指南:
    echo   1. 应用程序应该已经打开
    echo   2. 按 Ctrl+Shift+T 打开测试面板
    echo   3. 按 F12 打开开发者工具
    echo   4. 测试拖拽、快捷键等功能
    echo.
    echo 🔍 主要测试项目:
    echo   • 鼠标悬停显示拖拽手柄
    echo   • Enter 键创建新块
    echo   • Tab 键缩进块
    echo   • Ctrl+Alt+1 切换为H1标题
    echo   • 点击块显示类型工具栏
    echo.
    echo ⚠️  如果应用程序没有启动，请检查:
    echo   1. Windows 安全设置
    echo   2. 防病毒软件拦截
    echo   3. 文件权限问题
    echo.
) else (
    echo ❌ 未找到 MingLog.exe
    echo 请先构建应用程序: npm run dist
)

echo 按任意键退出...
pause >nul
