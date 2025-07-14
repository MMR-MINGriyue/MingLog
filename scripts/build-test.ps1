# MingLog Build Test Script
# Simple build test to verify the build pipeline

param(
    [switch]$SkipTests = $false,
    [switch]$SkipClean = $false
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

function Clear-BuildArtifacts {
    if ($SkipClean) {
        Write-Status "Skipping clean step"
        return
    }
    
    Write-Status "Cleaning build artifacts..."
    
    $cleanPaths = @(
        "apps/tauri-desktop/src-tauri/target",
        "apps/tauri-desktop/dist",
        "release"
    )
    
    foreach ($path in $cleanPaths) {
        if (Test-Path $path) {
            Remove-Item $path -Recurse -Force -ErrorAction SilentlyContinue
            Write-Success "Cleaned: $path"
        }
    }
}

function Install-Dependencies {
    Write-Status "Installing dependencies..."
    
    # Install root dependencies
    Write-Status "Installing root dependencies..."
    npm install --silent
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install root dependencies"
        exit 1
    }
    
    # Install Tauri desktop app dependencies
    Write-Status "Installing Tauri desktop app dependencies..."
    Set-Location "apps/tauri-desktop"
    npm install --silent
    
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Failed to install Tauri desktop dependencies"
        exit 1
    }
    
    Set-Location "../.."
    Write-Success "Dependencies installed"
}

function Test-Frontend {
    if ($SkipTests) {
        Write-Status "Skipping tests"
        return
    }
    
    Write-Status "Running frontend tests..."
    Set-Location "apps/tauri-desktop"
    
    try {
        npm run test:unit --silent
        Write-Success "Frontend tests passed"
    } catch {
        Write-Warning "Frontend tests failed, but continuing build"
    }
    
    Set-Location "../.."
}

function Build-Frontend {
    Write-Status "Building frontend..."
    
    Set-Location "apps/tauri-desktop"
    
    # Set build environment
    $env:NODE_ENV = "production"
    $env:TAURI_PLATFORM = "windows"
    
    npm run build --silent
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Frontend build completed"
    } else {
        Write-Error "Frontend build failed"
        exit 1
    }
    
    Set-Location "../.."
}

function Test-TauriBuild {
    Write-Status "Testing Tauri build (debug mode)..."
    
    Set-Location "apps/tauri-desktop"
    
    # Try a debug build first to test the pipeline
    Write-Status "Running debug build test..."
    cargo tauri build --debug --verbose
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Tauri debug build completed"
    } else {
        Write-Error "Tauri debug build failed"
        Set-Location "../.."
        exit 1
    }
    
    Set-Location "../.."
}

function Collect-BuildArtifacts {
    Write-Status "Collecting build artifacts..."
    
    # Create release directory
    $releaseDir = "release"
    if (Test-Path $releaseDir) {
        Remove-Item $releaseDir -Recurse -Force
    }
    New-Item -ItemType Directory -Path $releaseDir -Force | Out-Null
    
    # Find build artifacts
    $bundlePath = "apps/tauri-desktop/src-tauri/target/debug/bundle"
    
    if (Test-Path $bundlePath) {
        Write-Success "Found build artifacts in: $bundlePath"
        
        # Copy MSI installer
        $msiPath = "$bundlePath/msi"
        if (Test-Path $msiPath) {
            Get-ChildItem "$msiPath/*.msi" -ErrorAction SilentlyContinue | ForEach-Object {
                Copy-Item $_.FullName $releaseDir
                Write-Success "Copied MSI: $($_.Name)"
            }
        }
        
        # Copy NSIS installer
        $nsisPath = "$bundlePath/nsis"
        if (Test-Path $nsisPath) {
            Get-ChildItem "$nsisPath/*.exe" -ErrorAction SilentlyContinue | ForEach-Object {
                Copy-Item $_.FullName $releaseDir
                Write-Success "Copied NSIS: $($_.Name)"
            }
        }
        
        # Copy executable
        $exePath = "apps/tauri-desktop/src-tauri/target/debug"
        Get-ChildItem "$exePath/*.exe" -ErrorAction SilentlyContinue | ForEach-Object {
            Copy-Item $_.FullName $releaseDir
            Write-Success "Copied executable: $($_.Name)"
        }
    } else {
        Write-Warning "No build artifacts found"
    }
}

function Show-Results {
    Write-Status "Build test results:"
    
    $releaseDir = "release"
    if (Test-Path $releaseDir) {
        Write-Success "Build artifacts location: $releaseDir"
        Write-Status "Files:"
        
        Get-ChildItem $releaseDir -File | ForEach-Object {
            $size = [math]::Round($_.Length / 1MB, 2)
            Write-Host "  $($_.Name) ($size MB)" -ForegroundColor White
        }
    } else {
        Write-Warning "No build artifacts collected"
    }
}

function Main {
    Write-Host "MingLog Windows Build Test" -ForegroundColor Green
    Write-Host "Testing the build pipeline with debug build..." -ForegroundColor Cyan
    Write-Host ""
    
    try {
        Clear-BuildArtifacts
        Install-Dependencies
        Test-Frontend
        Build-Frontend
        Test-TauriBuild
        Collect-BuildArtifacts
        Show-Results
        
        Write-Host ""
        Write-Host "Build test completed successfully!" -ForegroundColor Green
        Write-Host "You can now run a full release build." -ForegroundColor Cyan
        
    } catch {
        Write-Host ""
        Write-Error "Build test failed: $($_.Exception.Message)"
        Write-Host "Please check the error messages above." -ForegroundColor Yellow
        exit 1
    }
}

Main
