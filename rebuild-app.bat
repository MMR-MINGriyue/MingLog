@echo off
echo ========================================
echo MingLog 应用重新构建脚本
echo ========================================
echo.

echo [1/4] 清理旧的构建产物...
cd apps\tauri-desktop
if exist dist rmdir /s /q dist
if exist src-tauri\target\release\minglog-desktop.exe del src-tauri\target\release\minglog-desktop.exe
echo 清理完成。
echo.

echo [2/4] 重新构建前端...
call npm run build
if %errorlevel% neq 0 (
    echo 前端构建失败！
    pause
    exit /b 1
)
echo 前端构建完成。
echo.

echo [3/4] 重新构建Tauri应用...
call npm run tauri build
if %errorlevel% neq 0 (
    echo Tauri构建失败！
    pause
    exit /b 1
)
echo Tauri构建完成。
echo.

echo [4/4] 验证构建结果...
if exist src-tauri\target\release\minglog-desktop.exe (
    echo ✅ 应用构建成功！
    echo 可执行文件位置: src-tauri\target\release\minglog-desktop.exe
) else (
    echo ❌ 应用构建失败，未找到可执行文件。
    pause
    exit /b 1
)
echo.

echo ========================================
echo 构建完成！准备启动应用进行测试...
echo ========================================
echo.

echo 是否立即启动应用进行测试？(Y/N)
set /p choice=
if /i "%choice%"=="Y" (
    echo 启动应用...
    start src-tauri\target\release\minglog-desktop.exe
    echo 应用已启动，请检查是否正常运行。
) else (
    echo 跳过启动测试。
)

echo.
echo 构建脚本执行完成。
pause
