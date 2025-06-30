@echo off
echo Testing basic functionality...
echo Current directory: %cd%
echo.
echo Checking if apps directory exists...
if exist apps echo YES - apps directory found
if not exist apps echo NO - apps directory not found
echo.
echo Checking if tauri-desktop exists...
if exist apps\tauri-desktop echo YES - tauri-desktop found
if not exist apps\tauri-desktop echo NO - tauri-desktop not found
echo.
echo Press any key to continue...
pause
