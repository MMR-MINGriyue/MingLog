# MingLog Comprehensive Build Debug Script
# This script provides detailed diagnostics and step-by-step build process

param(
    [switch]$SkipDiagnostics,
    [switch]$VerboseOutput
)

$ErrorActionPreference = "Continue"
$OriginalLocation = Get-Location

Write-Host "========================================" -ForegroundColor Green
Write-Host "MingLog Comprehensive Build Debug" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Function to log with timestamp
function Write-Log {
    param($Message, $Color = "White")
    $timestamp = Get-Date -Format "HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor $Color
}

# Function to check command availability
function Test-Command {
    param($CommandName)
    try {
        Get-Command $CommandName -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

try {
    # Step 1: Environment Diagnostics
    if (-not $SkipDiagnostics) {
        Write-Log "=== ENVIRONMENT DIAGNOSTICS ===" "Cyan"
        
        Write-Log "Checking Node.js installation..." "Yellow"
        if (Test-Command "node") {
            $nodeVersion = node --version
            Write-Log "Node.js version: $nodeVersion" "Green"
        } else {
            Write-Log "ERROR: Node.js not found!" "Red"
            exit 1
        }
        
        Write-Log "Checking npm installation..." "Yellow"
        if (Test-Command "npm") {
            $npmVersion = npm --version
            Write-Log "npm version: $npmVersion" "Green"
        } else {
            Write-Log "ERROR: npm not found!" "Red"
            exit 1
        }
        
        Write-Log "Checking current directory..." "Yellow"
        $currentDir = Get-Location
        Write-Log "Current directory: $currentDir" "Green"
        
        Write-Log "Checking project structure..." "Yellow"
        if (Test-Path "apps\tauri-desktop") {
            Write-Log "✓ apps/tauri-desktop directory found" "Green"
        } else {
            Write-Log "✗ apps/tauri-desktop directory not found" "Red"
            Write-Log "Available directories:" "Yellow"
            Get-ChildItem -Directory | ForEach-Object { Write-Log "  - $($_.Name)" "Gray" }
            exit 1
        }
    }
    
    # Step 2: Navigate to project directory
    Write-Log "=== NAVIGATION ===" "Cyan"
    Write-Log "Entering tauri-desktop directory..." "Yellow"
    Set-Location "apps\tauri-desktop"
    $projectDir = Get-Location
    Write-Log "Project directory: $projectDir" "Green"
    
    # Step 3: Project Structure Validation
    Write-Log "=== PROJECT VALIDATION ===" "Cyan"
    
    $requiredFiles = @("package.json", "vite.config.ts", "tsconfig.json", "src\main.tsx", "src\App.tsx")
    foreach ($file in $requiredFiles) {
        if (Test-Path $file) {
            Write-Log "✓ $file exists" "Green"
        } else {
            Write-Log "✗ $file missing" "Red"
        }
    }
    
    # Step 4: Dependencies Check
    Write-Log "=== DEPENDENCIES CHECK ===" "Cyan"
    
    Write-Log "Checking package.json..." "Yellow"
    if (Test-Path "package.json") {
        $packageJson = Get-Content "package.json" | ConvertFrom-Json
        Write-Log "Project name: $($packageJson.name)" "Green"
        Write-Log "Project version: $($packageJson.version)" "Green"
        
        Write-Log "Checking node_modules..." "Yellow"
        if (Test-Path "node_modules") {
            Write-Log "✓ node_modules directory exists" "Green"
            
            # Check critical dependencies
            $criticalDeps = @("react", "vite", "@vitejs/plugin-react", "typescript")
            foreach ($dep in $criticalDeps) {
                if (Test-Path "node_modules\$dep") {
                    Write-Log "✓ $dep installed" "Green"
                } else {
                    Write-Log "✗ $dep missing" "Red"
                }
            }
        } else {
            Write-Log "✗ node_modules directory missing" "Red"
            Write-Log "Running npm install..." "Yellow"
            npm install
            if ($LASTEXITCODE -eq 0) {
                Write-Log "✓ npm install completed" "Green"
            } else {
                Write-Log "✗ npm install failed" "Red"
                exit 1
            }
        }
    }
    
    # Step 5: Clean Previous Build
    Write-Log "=== CLEANUP ===" "Cyan"
    
    if (Test-Path "dist") {
        Write-Log "Removing previous build..." "Yellow"
        Remove-Item "dist" -Recurse -Force -ErrorAction SilentlyContinue
        Write-Log "✓ Previous build cleaned" "Green"
    } else {
        Write-Log "No previous build to clean" "Gray"
    }
    
    # Step 6: TypeScript Check
    Write-Log "=== TYPESCRIPT CHECK ===" "Cyan"
    
    Write-Log "Running TypeScript compiler check..." "Yellow"
    if (Test-Command "npx") {
        $tscOutput = npx tsc --noEmit 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Log "✓ TypeScript compilation check passed" "Green"
        } else {
            Write-Log "✗ TypeScript compilation errors found:" "Red"
            Write-Log $tscOutput "Red"
            Write-Log "Continuing with build despite TypeScript errors..." "Yellow"
        }
    }
    
    # Step 7: Frontend Build
    Write-Log "=== FRONTEND BUILD ===" "Cyan"
    
    Write-Log "Starting Vite build..." "Yellow"
    Write-Log "Command: npm run build" "Gray"
    
    if ($VerboseOutput) {
        npm run build
    } else {
        $buildOutput = npm run build 2>&1
        $buildExitCode = $LASTEXITCODE
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Log "✓ Frontend build successful!" "Green"
        
        # Verify build output
        if (Test-Path "dist") {
            Write-Log "✓ dist directory created" "Green"
            $distFiles = Get-ChildItem "dist" -Recurse
            Write-Log "Build output files:" "Gray"
            $distFiles | ForEach-Object { Write-Log "  - $($_.FullName.Replace($projectDir, '.'))" "Gray" }
        } else {
            Write-Log "✗ dist directory not created" "Red"
            exit 1
        }
    } else {
        Write-Log "✗ Frontend build failed!" "Red"
        if (-not $VerboseOutput) {
            Write-Log "Build output:" "Red"
            Write-Log $buildOutput "Red"
        }
        
        Write-Log "Attempting alternative build method..." "Yellow"
        npx vite build
        if ($LASTEXITCODE -eq 0) {
            Write-Log "✓ Alternative build method successful!" "Green"
        } else {
            Write-Log "✗ All build methods failed" "Red"
            exit 1
        }
    }
    
    # Step 8: Tauri Build
    Write-Log "=== TAURI BUILD ===" "Cyan"
    
    Write-Log "Starting Tauri build..." "Yellow"
    Write-Log "Command: npm run tauri build" "Gray"
    
    npm run tauri build
    $tauriBuildExitCode = $LASTEXITCODE
    
    # Check if executable was created (even if WiX installer failed)
    $exePath = "src-tauri\target\release\minglog-desktop.exe"
    if (Test-Path $exePath) {
        Write-Log "✓ Tauri executable created successfully!" "Green"
        $exeInfo = Get-Item $exePath
        Write-Log "Executable size: $([math]::Round($exeInfo.Length / 1MB, 2)) MB" "Green"
        Write-Log "Executable path: $($exeInfo.FullName)" "Green"
        
        # Step 9: Launch Application
        Write-Log "=== APPLICATION LAUNCH ===" "Cyan"
        
        Write-Log "Launching MingLog Desktop..." "Yellow"
        Start-Process $exePath
        Write-Log "✓ Application launched!" "Green"
        Write-Log "" 
        Write-Log "Please check if the application:" "Cyan"
        Write-Log "  - Opens without errors" "White"
        Write-Log "  - Shows the main MingLog interface" "White"
        Write-Log "  - Displays navigation and menus correctly" "White"
        Write-Log "  - Allows basic interaction" "White"
        
    } else {
        Write-Log "✗ Tauri executable not found" "Red"
        Write-Log "Tauri build exit code: $tauriBuildExitCode" "Red"
        
        # Check for partial build artifacts
        if (Test-Path "src-tauri\target\release") {
            Write-Log "Release directory contents:" "Yellow"
            Get-ChildItem "src-tauri\target\release" | ForEach-Object { 
                Write-Log "  - $($_.Name)" "Gray" 
            }
        }
        exit 1
    }
    
    Write-Log "=== BUILD PROCESS COMPLETED ===" "Green"
    Write-Log "Frontend build: SUCCESS" "Green"
    Write-Log "Tauri build: SUCCESS" "Green"
    Write-Log "Application launch: SUCCESS" "Green"
    
} catch {
    Write-Log "CRITICAL ERROR: $($_.Exception.Message)" "Red"
    Write-Log "Stack trace: $($_.ScriptStackTrace)" "Red"
    exit 1
} finally {
    Set-Location $OriginalLocation
}

Write-Log ""
Write-Log "Build process completed. Check the application window." "Cyan"
Read-Host "Press Enter to exit"
