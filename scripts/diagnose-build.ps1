# MingLog Build Diagnostics Script
# Diagnose build issues and provide solutions

$ErrorActionPreference = "Continue"

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

function Test-WindowsSDK {
    Write-Status "Checking Windows SDK..."
    
    $sdkPaths = @(
        "${env:ProgramFiles(x86)}\Windows Kits\10\bin",
        "${env:ProgramFiles}\Windows Kits\10\bin"
    )
    
    $sdkFound = $false
    foreach ($path in $sdkPaths) {
        if (Test-Path $path) {
            $versions = Get-ChildItem $path -Directory | Sort-Object Name -Descending
            if ($versions) {
                $latestVersion = $versions[0].Name
                Write-Success "Windows SDK found: $latestVersion"
                
                # Check for specific tools
                $toolsPath = "$path\$latestVersion\x64"
                if (Test-Path "$toolsPath\signtool.exe") {
                    Write-Success "SignTool found: $toolsPath\signtool.exe"
                } else {
                    Write-Warning "SignTool not found in $toolsPath"
                }
                
                $sdkFound = $true
                break
            }
        }
    }
    
    if (-not $sdkFound) {
        Write-Error "Windows SDK not found"
        Write-Host "  Install Windows 10/11 SDK from Visual Studio Installer" -ForegroundColor Gray
    }
}

function Test-WiXToolset {
    Write-Status "Checking WiX Toolset..."
    
    $wixPaths = @(
        "${env:ProgramFiles(x86)}\WiX Toolset v3.11\bin",
        "${env:ProgramFiles}\WiX Toolset v3.11\bin",
        "${env:ProgramFiles(x86)}\WiX Toolset v4.0\bin",
        "${env:ProgramFiles}\WiX Toolset v4.0\bin"
    )
    
    $wixFound = $false
    foreach ($path in $wixPaths) {
        if (Test-Path "$path\candle.exe") {
            Write-Success "WiX Toolset found: $path"
            $wixFound = $true
            break
        }
    }
    
    if (-not $wixFound) {
        Write-Warning "WiX Toolset not found"
        Write-Host "  Download from: https://wixtoolset.org/releases/" -ForegroundColor Gray
        Write-Host "  Or install via: winget install WiXToolset.WiX" -ForegroundColor Gray
    }
}

function Test-NSIS {
    Write-Status "Checking NSIS..."
    
    $nsisPath = "${env:ProgramFiles(x86)}\NSIS\makensis.exe"
    if (Test-Path $nsisPath) {
        Write-Success "NSIS found: $nsisPath"
    } else {
        $nsisPath = "${env:ProgramFiles}\NSIS\makensis.exe"
        if (Test-Path $nsisPath) {
            Write-Success "NSIS found: $nsisPath"
        } else {
            Write-Warning "NSIS not found"
            Write-Host "  Download from: https://nsis.sourceforge.io/Download" -ForegroundColor Gray
            Write-Host "  Or install via: winget install NSIS.NSIS" -ForegroundColor Gray
        }
    }
}

function Test-PathEnvironment {
    Write-Status "Checking PATH environment..."
    
    $pathItems = $env:PATH -split ';'
    
    # Check for common build tools in PATH
    $tools = @(
        @{ Name = "signtool.exe"; Description = "Windows SDK SignTool" },
        @{ Name = "candle.exe"; Description = "WiX Toolset" },
        @{ Name = "makensis.exe"; Description = "NSIS" }
    )
    
    foreach ($tool in $tools) {
        try {
            $found = Get-Command $tool.Name -ErrorAction SilentlyContinue
            if ($found) {
                Write-Success "$($tool.Description) in PATH: $($found.Source)"
            } else {
                Write-Warning "$($tool.Description) not in PATH"
            }
        } catch {
            Write-Warning "$($tool.Description) not in PATH"
        }
    }
}

function Test-TauriConfig {
    Write-Status "Checking Tauri configuration..."
    
    $configPath = "apps/tauri-desktop/src-tauri/tauri.conf.json"
    if (Test-Path $configPath) {
        Write-Success "Tauri config found"
        
        try {
            $config = Get-Content $configPath | ConvertFrom-Json
            
            # Check bundle configuration
            if ($config.tauri.bundle.active) {
                Write-Success "Bundle is active"
                Write-Status "Bundle targets: $($config.tauri.bundle.targets)"
                
                # Check Windows-specific config
                if ($config.tauri.bundle.windows) {
                    Write-Success "Windows bundle config found"
                    
                    if ($config.tauri.bundle.windows.wix) {
                        Write-Success "WiX config found"
                    } else {
                        Write-Warning "WiX config not found"
                    }
                    
                    if ($config.tauri.bundle.windows.nsis) {
                        Write-Success "NSIS config found"
                    } else {
                        Write-Warning "NSIS config not found"
                    }
                } else {
                    Write-Warning "Windows bundle config not found"
                }
            } else {
                Write-Error "Bundle is not active"
            }
        } catch {
            Write-Error "Failed to parse Tauri config: $($_.Exception.Message)"
        }
    } else {
        Write-Error "Tauri config not found"
    }
}

function Test-Icons {
    Write-Status "Checking application icons..."
    
    $iconPath = "apps/tauri-desktop/src-tauri/icons"
    if (Test-Path $iconPath) {
        Write-Success "Icons directory found"
        
        $requiredIcons = @(
            "32x32.png",
            "128x128.png",
            "icon.ico"
        )
        
        foreach ($icon in $requiredIcons) {
            if (Test-Path "$iconPath\$icon") {
                Write-Success "Icon found: $icon"
            } else {
                Write-Warning "Icon missing: $icon"
            }
        }
    } else {
        Write-Error "Icons directory not found"
    }
}

function Test-BuildOutput {
    Write-Status "Checking previous build output..."
    
    $targetPath = "apps/tauri-desktop/src-tauri/target"
    if (Test-Path $targetPath) {
        Write-Success "Target directory exists"
        
        # Check for debug build
        $debugPath = "$targetPath/debug"
        if (Test-Path $debugPath) {
            Write-Success "Debug build directory exists"
            
            $exePath = "$debugPath/minglog-desktop.exe"
            if (Test-Path $exePath) {
                $size = [math]::Round((Get-Item $exePath).Length / 1MB, 2)
                Write-Success "Debug executable found: $size MB"
            } else {
                Write-Warning "Debug executable not found"
            }
        }
        
        # Check for bundle output
        $bundlePath = "$targetPath/debug/bundle"
        if (Test-Path $bundlePath) {
            Write-Success "Bundle directory exists"
            
            Get-ChildItem $bundlePath -Directory | ForEach-Object {
                Write-Status "Bundle type: $($_.Name)"
                $files = Get-ChildItem $_.FullName -File
                if ($files) {
                    foreach ($file in $files) {
                        $size = [math]::Round($file.Length / 1MB, 2)
                        Write-Success "  $($file.Name): $size MB"
                    }
                } else {
                    Write-Warning "  No files in $($_.Name) bundle"
                }
            }
        } else {
            Write-Warning "Bundle directory not found"
        }
    } else {
        Write-Warning "Target directory not found (no previous builds)"
    }
}

function Show-Recommendations {
    Write-Host ""
    Write-Host "=== Build Environment Recommendations ===" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "To fix common build issues:" -ForegroundColor Cyan
    Write-Host "1. Install Visual Studio 2019/2022 with C++ build tools" -ForegroundColor White
    Write-Host "2. Install Windows 10/11 SDK" -ForegroundColor White
    Write-Host "3. Install WiX Toolset v3.11 or v4.0" -ForegroundColor White
    Write-Host "4. Install NSIS (optional, for NSIS installer)" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Quick install commands:" -ForegroundColor Cyan
    Write-Host "winget install Microsoft.VisualStudio.2022.BuildTools" -ForegroundColor Gray
    Write-Host "winget install WiXToolset.WiX" -ForegroundColor Gray
    Write-Host "winget install NSIS.NSIS" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "Alternative: Use MSI-only build:" -ForegroundColor Cyan
    Write-Host "cargo tauri build --target x86_64-pc-windows-msvc --bundles msi" -ForegroundColor Gray
}

function Main {
    Write-Host "MingLog Build Diagnostics" -ForegroundColor Green
    Write-Host "Analyzing build environment and configuration..." -ForegroundColor Cyan
    Write-Host ""
    
    Test-WindowsSDK
    Test-WiXToolset
    Test-NSIS
    Test-PathEnvironment
    Test-TauriConfig
    Test-Icons
    Test-BuildOutput
    
    Show-Recommendations
}

Main
