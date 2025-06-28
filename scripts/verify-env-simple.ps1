# Simple Tauri Environment Verification

Write-Host "Verifying Tauri Development Environment..." -ForegroundColor Green
Write-Host ""

$allGood = $true

# Check Rust
Write-Host "Checking Rust..." -ForegroundColor Blue
try {
    $rustVersion = rustc --version 2>$null
    if ($rustVersion) {
        Write-Host "OK Rust: $rustVersion" -ForegroundColor Green
    } else {
        Write-Host "MISSING Rust not found" -ForegroundColor Red
        $allGood = $false
    }
} catch {
    Write-Host "MISSING Rust not found" -ForegroundColor Red
    $allGood = $false
}

# Check Cargo
try {
    $cargoVersion = cargo --version 2>$null
    if ($cargoVersion) {
        Write-Host "OK Cargo: $cargoVersion" -ForegroundColor Green
    } else {
        Write-Host "MISSING Cargo not found" -ForegroundColor Red
        $allGood = $false
    }
} catch {
    Write-Host "MISSING Cargo not found" -ForegroundColor Red
    $allGood = $false
}

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Blue
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Host "OK Node.js: $nodeVersion" -ForegroundColor Green
    } else {
        Write-Host "MISSING Node.js not found" -ForegroundColor Red
        $allGood = $false
    }
} catch {
    Write-Host "MISSING Node.js not found" -ForegroundColor Red
    $allGood = $false
}

# Check pnpm
try {
    $pnpmVersion = pnpm --version 2>$null
    if ($pnpmVersion) {
        Write-Host "OK pnpm: v$pnpmVersion" -ForegroundColor Green
    } else {
        Write-Host "MISSING pnpm not found" -ForegroundColor Red
        $allGood = $false
    }
} catch {
    Write-Host "MISSING pnpm not found" -ForegroundColor Red
    $allGood = $false
}

# Check Tauri CLI
Write-Host "Checking Tauri CLI..." -ForegroundColor Blue
try {
    $tauriVersion = cargo tauri --version 2>$null
    if ($tauriVersion) {
        Write-Host "OK Tauri CLI: $tauriVersion" -ForegroundColor Green
    } else {
        Write-Host "MISSING Tauri CLI not found" -ForegroundColor Red
        $allGood = $false
    }
} catch {
    Write-Host "MISSING Tauri CLI not found" -ForegroundColor Red
    $allGood = $false
}

# Check project structure
Write-Host "Checking project structure..." -ForegroundColor Blue

$requiredPaths = @(
    "apps/tauri-desktop",
    "apps/tauri-desktop/src-tauri",
    "apps/tauri-desktop/src-tauri/Cargo.toml",
    "apps/tauri-desktop/src-tauri/tauri.conf.json",
    "apps/tauri-desktop/package.json"
)

foreach ($path in $requiredPaths) {
    if (Test-Path $path) {
        Write-Host "OK $path Found" -ForegroundColor Green
    } else {
        Write-Host "MISSING $path" -ForegroundColor Red
        $allGood = $false
    }
}

Write-Host ""
if ($allGood) {
    Write-Host "Environment is ready for Tauri development!" -ForegroundColor Green
    Write-Host "You can now run: scripts/test-tauri.ps1" -ForegroundColor Blue
} else {
    Write-Host "Environment setup incomplete. Please install missing components." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To install missing components:" -ForegroundColor Blue
    Write-Host "- Rust: Run scripts/install-rust-simple.ps1" -ForegroundColor White
    Write-Host "- Node.js: Download from https://nodejs.org/" -ForegroundColor White
    Write-Host "- pnpm: Run 'npm install -g pnpm'" -ForegroundColor White
    Write-Host "- Tauri CLI: Run 'cargo install tauri-cli'" -ForegroundColor White
}
