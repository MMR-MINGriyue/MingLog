@echo off
echo ========================================
echo Building MingLog Workspace Packages
echo ========================================
echo.

echo Current directory: %cd%
echo.

echo [1/6] Building @minglog/core package...
cd packages\core
if exist package.json (
    call npm run build
    if %errorlevel% neq 0 (
        echo ERROR: Failed to build @minglog/core
        pause
        exit /b 1
    )
    echo OK: @minglog/core built successfully
) else (
    echo WARNING: @minglog/core package.json not found
)
echo.

echo [2/6] Building @minglog/ui package...
cd ..\ui
if exist package.json (
    call npm run build
    if %errorlevel% neq 0 (
        echo ERROR: Failed to build @minglog/ui
        pause
        exit /b 1
    )
    echo OK: @minglog/ui built successfully
) else (
    echo WARNING: @minglog/ui package.json not found
)
echo.

echo [3/6] Building @minglog/editor package...
cd ..\editor
if exist package.json (
    call npm run build
    if %errorlevel% neq 0 (
        echo ERROR: Failed to build @minglog/editor
        pause
        exit /b 1
    )
    echo OK: @minglog/editor built successfully
) else (
    echo WARNING: @minglog/editor package.json not found
)
echo.

echo [4/6] Building @minglog/search package...
cd ..\search
if exist package.json (
    call npm run build
    if %errorlevel% neq 0 (
        echo ERROR: Failed to build @minglog/search
        pause
        exit /b 1
    )
    echo OK: @minglog/search built successfully
) else (
    echo WARNING: @minglog/search package.json not found
)
echo.

echo [5/6] Building @minglog/graph package...
cd ..\graph
if exist package.json (
    call npm run build
    if %errorlevel% neq 0 (
        echo ERROR: Failed to build @minglog/graph
        pause
        exit /b 1
    )
    echo OK: @minglog/graph built successfully
) else (
    echo WARNING: @minglog/graph package.json not found
)
echo.

echo [6/6] Returning to tauri-desktop and building application...
cd ..\..\apps\tauri-desktop
echo Current directory: %cd%
echo.

echo Building frontend...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Frontend build failed
    pause
    exit /b 1
)
echo OK: Frontend built successfully
echo.

echo Building Tauri application...
call npm run tauri build
if %errorlevel% neq 0 (
    echo WARNING: Tauri build may have failed (check for WiX installer errors)
    echo Checking if executable was created...
)

if exist src-tauri\target\release\minglog-desktop.exe (
    echo.
    echo ========================================
    echo SUCCESS: Build completed!
    echo ========================================
    echo.
    echo Starting MingLog Desktop...
    start src-tauri\target\release\minglog-desktop.exe
    echo Application launched!
) else (
    echo ERROR: Executable not found
    pause
    exit /b 1
)

echo.
pause
