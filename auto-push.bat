@echo off
echo ========================================
echo MingLog Auto Push to GitHub
echo ========================================
echo.

echo Current directory: %cd%
echo.

echo [1/4] Checking git status...
git status
echo.

echo [2/4] Adding all changes...
git add .
echo.

echo [3/4] Committing changes...
git commit -m "🔧 Fix workspace package build issues and batch script problems

- Fix @minglog/editor package export/import issues
- Add named export for BlockEditor component while keeping default export
- Update tsup config to use correct tsconfig.build.json
- Create comprehensive build debug scripts (PowerShell and batch)
- Add emergency manual build guides
- Simplify App.tsx initialization to avoid Tauri import issues
- Create workspace package build automation scripts

Fixes:
- BlockEditor import/export mismatch
- TypeScript compilation errors in editor package
- Batch script crashes due to encoding issues
- Frontend build failures due to missing workspace packages

Ready for testing complete application build and launch."
echo.

echo [4/4] Pushing to GitHub...
git push origin main
echo.

if %errorlevel% eq 0 (
    echo ========================================
    echo SUCCESS: Changes pushed to GitHub!
    echo ========================================
    echo.
    echo All fixes and improvements have been saved to the repository.
    echo Ready to proceed with application build testing.
) else (
    echo ========================================
    echo ERROR: Push failed
    echo ========================================
    echo.
    echo Please check your internet connection and GitHub credentials.
)

echo.
pause
