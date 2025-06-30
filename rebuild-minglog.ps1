# MingLog Quick Rebuild PowerShell Script
Write-Host "========================================" -ForegroundColor Green
Write-Host "MingLog Quick Rebuild Script" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "[1/3] Entering application directory..." -ForegroundColor Cyan
Set-Location "apps\tauri-desktop"
Write-Host "Current directory: $(Get-Location)" -ForegroundColor Yellow
Write-Host ""

Write-Host "[2/3] Cleaning and rebuilding frontend..." -ForegroundColor Cyan
if (Test-Path "dist") {
    Remove-Item "dist" -Recurse -Force
    Write-Host "Old build artifacts cleaned" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "Starting frontend build..." -ForegroundColor Cyan
& npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Frontend build failed!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "Frontend build completed successfully" -ForegroundColor Green
Write-Host ""

Write-Host "[3/3] Rebuilding Tauri application..." -ForegroundColor Cyan
& npm run tauri build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Tauri build failed!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "Tauri build completed successfully" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "Build completed!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Checking build results..." -ForegroundColor Cyan
if (Test-Path "src-tauri\target\release\minglog-desktop.exe") {
    Write-Host "New application built successfully!" -ForegroundColor Green
    Write-Host ""
    $choice = Read-Host "Would you like to start the new version? (Y/N)"
    if ($choice -eq "Y" -or $choice -eq "y") {
        Write-Host "Starting new version..." -ForegroundColor Cyan
        Start-Process "src-tauri\target\release\minglog-desktop.exe"
        Write-Host "New version started, please check if the error is fixed." -ForegroundColor Green
    }
} else {
    Write-Host "Build failed, executable not found." -ForegroundColor Red
}

Write-Host ""
Read-Host "Press Enter to exit"
