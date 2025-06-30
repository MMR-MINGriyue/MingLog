@echo off
echo ========================================
echo Testing @minglog/editor Build Fix
echo ========================================
echo.

echo Current directory: %cd%
echo.

echo Attempting to build @minglog/editor package...
cd packages\editor
echo.

echo Running: npm run build
call npm run build

if %errorlevel% eq 0 (
    echo.
    echo ========================================
    echo SUCCESS: @minglog/editor built successfully!
    echo ========================================
    echo.
    echo Checking build output...
    if exist dist\index.js (
        echo ✓ dist/index.js created
    ) else (
        echo ✗ dist/index.js not found
    )
    
    if exist dist\index.d.ts (
        echo ✓ dist/index.d.ts created
    ) else (
        echo ✗ dist/index.d.ts not found
    )
    
    echo.
    echo Now proceeding to build the main application...
    cd ..\..\apps\tauri-desktop
    echo.
    echo Running: npm run build
    call npm run build
    
    if %errorlevel% eq 0 (
        echo.
        echo ========================================
        echo SUCCESS: Frontend build completed!
        echo ========================================
        echo.
        echo Building Tauri application...
        call npm run tauri build
        
        if exist src-tauri\target\release\minglog-desktop.exe (
            echo.
            echo ========================================
            echo COMPLETE SUCCESS: Application ready!
            echo ========================================
            echo.
            echo Starting MingLog Desktop...
            start src-tauri\target\release\minglog-desktop.exe
        ) else (
            echo.
            echo Tauri build completed but executable not found
            echo Check for WiX installer errors above
        )
    ) else (
        echo.
        echo Frontend build still failed
        echo Please check the error messages above
    )
) else (
    echo.
    echo ========================================
    echo ERROR: @minglog/editor build failed
    echo ========================================
    echo.
    echo Please check the error messages above
    echo The build errors need to be fixed before proceeding
)

echo.
pause
