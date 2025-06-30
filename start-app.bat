@echo off
echo ========================================
echo Starting MingLog Desktop Application
echo ========================================
echo.

echo Checking if application exists...
if exist "apps\tauri-desktop\src-tauri\target\release\minglog-desktop.exe" (
    echo Application found! Starting now...
    echo.
    start "MingLog Desktop" "apps\tauri-desktop\src-tauri\target\release\minglog-desktop.exe"
    echo Application started successfully!
    echo.
    echo Please check if you see:
    echo - Green success page with "MingLog Desktop" title
    echo - Text: "应用已成功启动！这是一个最小化测试版本。"
    echo.
    echo If you see the error page instead, we need to investigate further.
) else (
    echo Error: Application not found at expected location.
    echo Please check the build process.
)

echo.
pause
