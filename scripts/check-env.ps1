# MingLog Build Environment Check Script
# Simple version to avoid encoding issues

param(
    [switch]$Fix = $false
)

$ErrorActionPreference = "Stop"

function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[PASS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARN] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[FAIL] $Message" -ForegroundColor Red
}

$script:PassCount = 0
$script:FailCount = 0
$script:WarnCount = 0

function Test-NodeJS {
    Write-Status "Checking Node.js..."
    
    try {
        $nodeVersion = node --version 2>$null
        $npmVersion = npm --version 2>$null
        
        if ($nodeVersion -and $npmVersion) {
            Write-Success "Node.js: $nodeVersion, npm: $npmVersion"
            $script:PassCount++
        } else {
            throw "Node.js or npm not found"
        }
    } catch {
        Write-Error "Node.js not installed or not in PATH"
        Write-Host "  Fix: Download and install from https://nodejs.org/" -ForegroundColor Gray
        $script:FailCount++
    }
}

function Test-RustToolchain {
    Write-Status "Checking Rust toolchain..."
    
    try {
        $rustVersion = rustc --version 2>$null
        $cargoVersion = cargo --version 2>$null
        
        if ($rustVersion -and $cargoVersion) {
            Write-Success "Rust: $rustVersion"
            Write-Success "Cargo: $cargoVersion"
            $script:PassCount++
            
            # Check Windows target
            $targets = rustup target list --installed 2>$null
            if ($targets -match "x86_64-pc-windows-msvc") {
                Write-Success "Windows MSVC target installed"
                $script:PassCount++
            } else {
                Write-Warning "Windows MSVC target not installed"
                Write-Host "  Fix: rustup target add x86_64-pc-windows-msvc" -ForegroundColor Gray
                $script:WarnCount++
                
                if ($Fix) {
                    Write-Status "Installing Windows MSVC target..."
                    rustup target add x86_64-pc-windows-msvc
                    Write-Success "Windows MSVC target installed"
                }
            }
        } else {
            throw "Rust or Cargo not found"
        }
    } catch {
        Write-Error "Rust not installed or not in PATH"
        Write-Host "  Fix: Install from https://rustup.rs/" -ForegroundColor Gray
        $script:FailCount++
    }
}

function Test-TauriCLI {
    Write-Status "Checking Tauri CLI..."
    
    try {
        $tauriVersion = cargo tauri --version 2>$null
        if ($tauriVersion) {
            Write-Success "Tauri CLI: $tauriVersion"
            $script:PassCount++
        } else {
            throw "Tauri CLI not found"
        }
    } catch {
        Write-Warning "Tauri CLI not installed"
        Write-Host "  Fix: cargo install tauri-cli" -ForegroundColor Gray
        $script:WarnCount++
        
        if ($Fix) {
            Write-Status "Installing Tauri CLI..."
            cargo install tauri-cli
            Write-Success "Tauri CLI installed"
        }
    }
}

function Test-VisualStudioBuildTools {
    Write-Status "Checking Visual Studio Build Tools..."
    
    try {
        $clPath = Get-Command "cl.exe" -ErrorAction SilentlyContinue
        if ($clPath) {
            Write-Success "MSVC compiler found: $($clPath.Source)"
            $script:PassCount++
        } else {
            throw "cl.exe not found"
        }
    } catch {
        Write-Warning "MSVC compiler not found"
        Write-Host "  Fix: Install Visual Studio 2019/2022 or Build Tools" -ForegroundColor Gray
        $script:WarnCount++
    }
}

function Test-ProjectFiles {
    Write-Status "Checking project files..."
    
    $files = @(
        "package.json",
        "apps/tauri-desktop/src-tauri/tauri.conf.json",
        "apps/tauri-desktop/src-tauri/Cargo.toml"
    )
    
    foreach ($file in $files) {
        if (Test-Path $file) {
            Write-Success "$file exists"
            $script:PassCount++
        } else {
            Write-Error "$file not found"
            $script:FailCount++
        }
    }
}

function Test-DiskSpace {
    Write-Status "Checking disk space..."
    
    $drive = (Get-Location).Drive
    $freeSpace = [math]::Round((Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='$($drive.Name)'").FreeSpace / 1GB, 2)
    
    if ($freeSpace -gt 5) {
        Write-Success "Available disk space: $freeSpace GB"
        $script:PassCount++
    } elseif ($freeSpace -gt 2) {
        Write-Warning "Low disk space: $freeSpace GB (recommend 5GB+)"
        $script:WarnCount++
    } else {
        Write-Error "Insufficient disk space: $freeSpace GB (need 2GB+)"
        $script:FailCount++
    }
}

function Show-Summary {
    Write-Host ""
    Write-Host "=== Build Environment Check Summary ===" -ForegroundColor Green
    Write-Host "PASS: $script:PassCount" -ForegroundColor Green
    Write-Host "WARN: $script:WarnCount" -ForegroundColor Yellow
    Write-Host "FAIL: $script:FailCount" -ForegroundColor Red
    Write-Host ""
    
    if ($script:FailCount -eq 0) {
        Write-Host "Build environment is ready!" -ForegroundColor Green
        Write-Host "You can now run: .\scripts\build-windows.ps1" -ForegroundColor Cyan
    } else {
        Write-Host "Please fix the failed checks before building." -ForegroundColor Yellow
        Write-Host "Use -Fix parameter to auto-fix some issues." -ForegroundColor Blue
    }
}

function Main {
    Write-Host "MingLog Windows Build Environment Check" -ForegroundColor Green
    Write-Host ""
    
    Test-NodeJS
    Test-RustToolchain
    Test-TauriCLI
    Test-VisualStudioBuildTools
    Test-ProjectFiles
    Test-DiskSpace
    
    Show-Summary
}

Main
