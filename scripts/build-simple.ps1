# MingLog Simple Build Script
# Build executable without installers to test the core build pipeline

param(
    [string]$BuildType = "release",
    [switch]$SkipTests = $false
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

function Build-Frontend {
    Write-Status "Building frontend..."
    
    Set-Location "apps/tauri-desktop"
    
    $env:NODE_ENV = "production"
    $env:TAURI_PLATFORM = "windows"
    
    npm run build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Frontend build completed"
    } else {
        Write-Error "Frontend build failed"
        exit 1
    }
    
    Set-Location "../.."
}

function Build-RustApp {
    Write-Status "Building Rust application..."
    
    Set-Location "apps/tauri-desktop/src-tauri"
    
    if ($BuildType -eq "debug") {
        cargo build --verbose
    } else {
        cargo build --release --verbose
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Rust application build completed"
    } else {
        Write-Error "Rust application build failed"
        exit 1
    }
    
    Set-Location "../../.."
}

function Collect-Executable {
    Write-Status "Collecting executable..."
    
    # Create release directory
    $releaseDir = "release"
    if (Test-Path $releaseDir) {
        Remove-Item $releaseDir -Recurse -Force
    }
    New-Item -ItemType Directory -Path $releaseDir -Force | Out-Null
    
    # Find executable
    if ($BuildType -eq "debug") {
        $exePath = "apps/tauri-desktop/src-tauri/target/debug/minglog-desktop.exe"
    } else {
        $exePath = "apps/tauri-desktop/src-tauri/target/release/minglog-desktop.exe"
    }
    
    if (Test-Path $exePath) {
        Copy-Item $exePath $releaseDir
        $size = [math]::Round((Get-Item $exePath).Length / 1MB, 2)
        Write-Success "Executable copied: minglog-desktop.exe ($size MB)"
        
        # Generate checksum
        Set-Location $releaseDir
        $hash = Get-FileHash "minglog-desktop.exe" -Algorithm SHA256
        "$($hash.Hash.ToLower())  minglog-desktop.exe" | Out-File "checksums.sha256" -Encoding ASCII
        Set-Location ".."
        
        Write-Success "Checksum generated"
    } else {
        Write-Error "Executable not found: $exePath"
        exit 1
    }
}

function Test-Executable {
    Write-Status "Testing executable..."
    
    $exePath = "release/minglog-desktop.exe"
    if (Test-Path $exePath) {
        Write-Status "Checking executable properties..."
        
        # Get file version info
        try {
            $versionInfo = [System.Diagnostics.FileVersionInfo]::GetVersionInfo($exePath)
            Write-Success "Product Name: $($versionInfo.ProductName)"
            Write-Success "File Version: $($versionInfo.FileVersion)"
            Write-Success "Company Name: $($versionInfo.CompanyName)"
        } catch {
            Write-Warning "Could not read version info"
        }
        
        # Check if it's a valid PE file
        try {
            $bytes = [System.IO.File]::ReadAllBytes($exePath)
            if ($bytes[0] -eq 0x4D -and $bytes[1] -eq 0x5A) {
                Write-Success "Valid PE executable"
            } else {
                Write-Error "Invalid PE executable"
            }
        } catch {
            Write-Warning "Could not validate PE format"
        }
        
        Write-Status "Executable is ready for testing"
        Write-Host "  Run: .\release\minglog-desktop.exe" -ForegroundColor Gray
    } else {
        Write-Error "Executable not found for testing"
    }
}

function Show-Results {
    Write-Host ""
    Write-Host "=== Build Results ===" -ForegroundColor Green
    
    $releaseDir = "release"
    if (Test-Path $releaseDir) {
        Write-Success "Build artifacts location: $releaseDir"
        
        Get-ChildItem $releaseDir -File | ForEach-Object {
            $size = [math]::Round($_.Length / 1MB, 2)
            Write-Host "  $($_.Name) ($size MB)" -ForegroundColor White
        }
        
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Cyan
        Write-Host "1. Test the executable: .\release\minglog-desktop.exe" -ForegroundColor White
        Write-Host "2. If working, install WiX/NSIS for installer generation" -ForegroundColor White
        Write-Host "3. Run full build: .\scripts\build-windows.ps1" -ForegroundColor White
    } else {
        Write-Error "No build artifacts found"
    }
}

function Main {
    Write-Host "MingLog Simple Build (Executable Only)" -ForegroundColor Green
    Write-Host "Build Type: $BuildType" -ForegroundColor Cyan
    Write-Host ""
    
    try {
        Build-Frontend
        Build-RustApp
        Collect-Executable
        Test-Executable
        Show-Results
        
        Write-Host ""
        Write-Host "Simple build completed successfully!" -ForegroundColor Green
        
    } catch {
        Write-Host ""
        Write-Error "Build failed: $($_.Exception.Message)"
        exit 1
    }
}

Main
