# Fast Rust Installation with Mirror

Write-Host "Installing Rust with China Mirror..." -ForegroundColor Green

# Set mirror environment variables
$env:RUSTUP_DIST_SERVER = "https://mirrors.ustc.edu.cn/rust-static"
$env:RUSTUP_UPDATE_ROOT = "https://mirrors.ustc.edu.cn/rust-static/rustup"

Write-Host "Mirror configured:" -ForegroundColor Blue
Write-Host "  USTC Mirror for faster download" -ForegroundColor Gray

# Check if already installed
try {
    $rustVersion = rustc --version 2>$null
    if ($rustVersion) {
        Write-Host "Rust already installed: $rustVersion" -ForegroundColor Green
        exit 0
    }
} catch {
    Write-Host "Installing Rust..." -ForegroundColor Blue
}

# Download rustup-init
Write-Host "Downloading Rustup..." -ForegroundColor Blue
$rustupUrl = "https://win.rustup.rs/x86_64"
$rustupPath = "$env:TEMP\rustup-init.exe"

try {
    Invoke-WebRequest -Uri $rustupUrl -OutFile $rustupPath -UseBasicParsing
    Write-Host "Download completed" -ForegroundColor Green
} catch {
    Write-Host "Download failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Run installer
Write-Host "Running installer..." -ForegroundColor Blue
try {
    Start-Process -FilePath $rustupPath -ArgumentList "-y" -Wait
    Write-Host "Installation completed" -ForegroundColor Green
} catch {
    Write-Host "Installation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Update PATH
Write-Host "Updating PATH..." -ForegroundColor Blue
$cargoPath = "$env:USERPROFILE\.cargo\bin"
$env:PATH += ";$cargoPath"

# Verify installation
Write-Host "Verifying installation..." -ForegroundColor Blue
try {
    $rustVersion = & "$cargoPath\rustc.exe" --version
    $cargoVersion = & "$cargoPath\cargo.exe" --version
    
    Write-Host "Verification successful:" -ForegroundColor Green
    Write-Host "  Rust: $rustVersion" -ForegroundColor White
    Write-Host "  Cargo: $cargoVersion" -ForegroundColor White
} catch {
    Write-Host "Verification failed" -ForegroundColor Red
    Write-Host "Please restart terminal and try again" -ForegroundColor Yellow
    exit 1
}

# Configure Cargo mirror
Write-Host "Configuring Cargo mirror..." -ForegroundColor Blue
$cargoConfigDir = "$env:USERPROFILE\.cargo"
$cargoConfigFile = "$cargoConfigDir\config.toml"

if (!(Test-Path $cargoConfigDir)) {
    New-Item -ItemType Directory -Path $cargoConfigDir -Force | Out-Null
}

$cargoConfig = @'
[source.crates-io]
registry = "https://github.com/rust-lang/crates.io-index"
replace-with = 'ustc'

[source.ustc]
registry = "git://mirrors.ustc.edu.cn/crates.io-index"
'@

Set-Content -Path $cargoConfigFile -Value $cargoConfig -Encoding UTF8
Write-Host "Cargo mirror configured" -ForegroundColor Green

Write-Host ""
Write-Host "Rust installation completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Blue
Write-Host "1. Restart terminal: refreshenv" -ForegroundColor White
Write-Host "2. Install Tauri CLI: cargo install tauri-cli" -ForegroundColor White
Write-Host "3. Test: cargo tauri --version" -ForegroundColor White
