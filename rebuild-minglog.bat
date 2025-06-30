@echo off
chcp 65001 >nul
echo ========================================
echo MingLog Quick Rebuild Script
echo ========================================
echo.

echo [1/3] Entering application directory...
cd apps\tauri-desktop
echo Current directory: %cd%
echo.

echo [2/3] Cleaning and rebuilding frontend...
if exist dist rmdir /s /q dist
echo Old build artifacts cleaned
echo.

echo Starting frontend build...
call npm run build
if %errorlevel% neq 0 (
    echo Frontend build failed!
    pause
    exit /b 1
)
echo Frontend build completed successfully
echo.

echo [3/3] Rebuilding Tauri application...
call npm run tauri build
if %errorlevel% neq 0 (
    echo Tauri build failed!
    pause
    exit /b 1
)
echo Tauri build completed successfully
echo.

echo ========================================
echo Build completed!
echo ========================================
echo.

echo Checking build results...
if exist src-tauri\target\release\minglog-desktop.exe (
    echo New application built successfully!
    echo.
    echo Would you like to start the new version? (Y/N)
    set /p choice=
    if /i "%choice%"=="Y" (
        echo Starting new version...
        start src-tauri\target\release\minglog-desktop.exe
        echo New version started, please check if the error is fixed.
    )
) else (
    echo Build failed, executable not found.
)

echo.
pause
