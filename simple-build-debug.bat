@echo off
setlocal enabledelayedexpansion

echo ========================================
echo MingLog Simple Build Debug
echo ========================================
echo.

:: Check if we're in the right directory
echo [1/8] Checking project structure...
if not exist "apps\tauri-desktop" (
    echo ERROR: apps\tauri-desktop directory not found
    echo Current directory: %cd%
    echo Please run this script from the MingLog project root
    pause
    exit /b 1
)
echo OK: Project structure found

:: Navigate to tauri-desktop
echo.
echo [2/8] Entering tauri-desktop directory...
pushd "apps\tauri-desktop"
echo Current directory: %cd%

:: Check required files
echo.
echo [3/8] Checking required files...
set "missing_files="
if not exist "package.json" set "missing_files=!missing_files! package.json"
if not exist "vite.config.ts" set "missing_files=!missing_files! vite.config.ts"
if not exist "src\main.tsx" set "missing_files=!missing_files! src\main.tsx"
if not exist "src\App.tsx" set "missing_files=!missing_files! src\App.tsx"

if not "!missing_files!"=="" (
    echo ERROR: Missing required files:!missing_files!
    pause
    popd
    exit /b 1
)
echo OK: All required files present

:: Check Node.js and npm
echo.
echo [4/8] Checking Node.js and npm...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found or not working
    pause
    popd
    exit /b 1
)

npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: npm not found or not working
    pause
    popd
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set "node_version=%%i"
for /f "tokens=*" %%i in ('npm --version') do set "npm_version=%%i"
echo OK: Node.js %node_version%, npm %npm_version%

:: Check dependencies
echo.
echo [5/8] Checking dependencies...
if not exist "node_modules" (
    echo WARNING: node_modules not found, running npm install...
    call npm install
    if !errorlevel! neq 0 (
        echo ERROR: npm install failed
        pause
        popd
        exit /b 1
    )
    echo OK: Dependencies installed
) else (
    echo OK: node_modules directory exists
)

:: Clean previous build
echo.
echo [6/8] Cleaning previous build...
if exist "dist" (
    rmdir /s /q "dist"
    echo OK: Previous build cleaned
) else (
    echo OK: No previous build to clean
)

:: Build frontend
echo.
echo [7/8] Building frontend...
echo Running: npm run build
echo ----------------------------------------
call npm run build
set "build_result=!errorlevel!"
echo ----------------------------------------
echo Build exit code: !build_result!

if !build_result! neq 0 (
    echo.
    echo ERROR: Frontend build failed!
    echo.
    echo Trying alternative build method...
    echo Running: npx vite build
    echo ----------------------------------------
    call npx vite build
    set "alt_build_result=!errorlevel!"
    echo ----------------------------------------
    echo Alternative build exit code: !alt_build_result!
    
    if !alt_build_result! neq 0 (
        echo.
        echo ERROR: All build methods failed!
        echo.
        echo Debugging information:
        echo - Check if all dependencies are installed correctly
        echo - Look for TypeScript compilation errors above
        echo - Verify that all imported files exist
        echo.
        pause
        popd
        exit /b 1
    )
)

:: Verify build output
if exist "dist" (
    echo OK: dist directory created
    if exist "dist\index.html" (
        echo OK: index.html found in dist
    ) else (
        echo WARNING: index.html not found in dist
    )
) else (
    echo ERROR: dist directory not created despite successful build
    pause
    popd
    exit /b 1
)

:: Build Tauri application
echo.
echo [8/8] Building Tauri application...
echo Running: npm run tauri build
echo ----------------------------------------
call npm run tauri build
set "tauri_result=!errorlevel!"
echo ----------------------------------------
echo Tauri build exit code: !tauri_result!

:: Check if executable was created
if exist "src-tauri\target\release\minglog-desktop.exe" (
    echo.
    echo ========================================
    echo SUCCESS: Build completed successfully!
    echo ========================================
    echo.
    echo Application location: %cd%\src-tauri\target\release\minglog-desktop.exe
    echo.
    echo Starting application...
    start "MingLog Desktop" "src-tauri\target\release\minglog-desktop.exe"
    echo.
    echo Please check if the application:
    echo - Opens without errors
    echo - Shows the main MingLog interface (not the green test page)
    echo - Displays navigation and menus correctly
    echo - Allows basic interaction
    echo.
    echo If you see any issues, please report them for further diagnosis.
) else (
    echo.
    echo ERROR: Tauri executable not found!
    echo.
    echo The frontend build succeeded, but Tauri build may have failed.
    echo Check the Tauri build output above for specific errors.
    echo.
    echo Note: WiX installer errors are not critical if the .exe file exists.
)

echo.
popd
pause
