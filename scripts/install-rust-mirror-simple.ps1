# Simple Rust Mirror Installation

Write-Host "Installing Rust with USTC Mirror..." -ForegroundColor Green

# Set mirror environment variables
$env:RUSTUP_DIST_SERVER = "https://mirrors.ustc.edu.cn/rust-static"
$env:RUSTUP_UPDATE_ROOT = "https://mirrors.ustc.edu.cn/rust-static/rustup"

Write-Host "Mirror configured: USTC (University of Science and Technology of China)" -ForegroundColor Blue

# Check existing installation
$cargoPath = "$env:USERPROFILE\.cargo\bin"
$rustupPath = "$cargoPath\rustup.exe"

if (Test-Path $rustupPath) {
    Write-Host "Found existing Rust installation" -ForegroundColor Yellow
    $env:PATH += ";$cargoPath"
    
    # Install stable toolchain
    Write-Host "Installing stable toolchain..." -ForegroundColor Blue
    try {
        & $rustupPath toolchain install stable
        Write-Host "Stable toolchain installed" -ForegroundColor Green
    } catch {
        Write-Host "Toolchain installation failed: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    # Set default
    Write-Host "Setting default toolchain..." -ForegroundColor Blue
    try {
        & $rustupPath default stable
        Write-Host "Default toolchain set to stable" -ForegroundColor Green
    } catch {
        Write-Host "Failed to set default: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "No existing Rust installation found" -ForegroundColor Red
    Write-Host "Please run install-rust-fast.ps1 first" -ForegroundColor Yellow
    exit 1
}

# Update PATH
if ($env:PATH -notlike "*$cargoPath*") {
    $env:PATH += ";$cargoPath"
}

# Verify installation
Write-Host "Verifying installation..." -ForegroundColor Blue
try {
    $rustVersion = & "$cargoPath\rustc.exe" --version
    $cargoVersion = & "$cargoPath\cargo.exe" --version
    
    Write-Host "Verification successful:" -ForegroundColor Green
    Write-Host "  Rust: $rustVersion" -ForegroundColor White
    Write-Host "  Cargo: $cargoVersion" -ForegroundColor White
} catch {
    Write-Host "Verification failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Configure Cargo mirror
Write-Host "Configuring Cargo mirror..." -ForegroundColor Blue
$cargoConfigDir = "$env:USERPROFILE\.cargo"
$cargoConfigFile = "$cargoConfigDir\config.toml"

if (!(Test-Path $cargoConfigDir)) {
    New-Item -ItemType Directory -Path $cargoConfigDir -Force | Out-Null
}

$cargoConfig = '[source.crates-io]
registry = "https://github.com/rust-lang/crates.io-index"
replace-with = "ustc"

[source.ustc]
registry = "git://mirrors.ustc.edu.cn/crates.io-index"

[net]
git-fetch-with-cli = true'

Set-Content -Path $cargoConfigFile -Value $cargoConfig -Encoding UTF8
Write-Host "Cargo mirror configured" -ForegroundColor Green

# Install Tauri CLI
Write-Host "Installing Tauri CLI..." -ForegroundColor Blue
try {
    & "$cargoPath\cargo.exe" install tauri-cli --locked
    Write-Host "Tauri CLI installed successfully" -ForegroundColor Green
} catch {
    Write-Host "Tauri CLI installation failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "You can install it manually later: cargo install tauri-cli" -ForegroundColor Yellow
}

# Test Tauri CLI
try {
    $tauriVersion = & "$cargoPath\cargo.exe" tauri --version
    Write-Host "Tauri CLI verified: $tauriVersion" -ForegroundColor Green
} catch {
    Write-Host "Tauri CLI not available yet" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Installation completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Blue
Write-Host "1. Restart terminal: refreshenv" -ForegroundColor White
Write-Host "2. Test: rustc --version" -ForegroundColor White
Write-Host "3. Test Tauri: cargo tauri --version" -ForegroundColor White
Write-Host "4. Start development: cd apps/tauri-desktop && cargo tauri dev" -ForegroundColor White
