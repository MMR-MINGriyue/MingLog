@echo off
echo ========================================
echo MingLog Build Test (Debug Mode)
echo ========================================
echo.

echo Entering tauri-desktop directory...
cd apps\tauri-desktop
echo Current directory: %cd%
echo.

echo Cleaning previous build...
if exist dist rmdir /s /q dist
echo.

echo Testing frontend build with verbose output...
echo Running: npm run build
npm run build

echo.
echo Build exit code: %errorlevel%

if %errorlevel% neq 0 (
    echo.
    echo BUILD FAILED! Let's try to get more information...
    echo.
    echo Checking package.json scripts...
    type package.json | findstr "build"
    echo.
    echo Checking if vite is installed...
    npm list vite
    echo.
    echo Trying to run vite directly...
    npx vite build
) else (
    echo.
    echo BUILD SUCCESSFUL!
    echo Checking build output...
    if exist dist (
        echo dist directory created successfully
        dir dist
        echo.
        echo Proceeding with Tauri build...
        npm run tauri build
        
        if exist src-tauri\target\release\minglog-desktop.exe (
            echo.
            echo SUCCESS! Starting application...
            start src-tauri\target\release\minglog-desktop.exe
        )
    ) else (
        echo Warning: dist directory not found after build
    )
)

echo.
pause
