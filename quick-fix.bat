@echo off
echo ========================================
echo MingLog Quick Fix - Frontend Only
echo ========================================
echo.

echo Entering application directory...
cd apps\tauri-desktop
echo.

echo Cleaning old frontend build...
if exist dist rmdir /s /q dist
echo.

echo Building frontend (fixed version)...
call npm run build
if %errorlevel% neq 0 (
    echo Frontend build failed again!
    pause
    exit /b 1
)
echo Frontend build successful!
echo.

echo Building Tauri application...
call npm run tauri build
if %errorlevel% neq 0 (
    echo Tauri build failed!
    pause
    exit /b 1
)
echo Tauri build successful!
echo.

echo ========================================
echo Fix completed successfully!
echo ========================================
echo.

if exist src-tauri\target\release\minglog-desktop.exe (
    echo Application ready! Starting now...
    start src-tauri\target\release\minglog-desktop.exe
    echo Application started. Check if you see the green success page!
) else (
    echo Error: Application file not found.
)

pause
