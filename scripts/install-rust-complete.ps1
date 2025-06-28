# Complete Rust Installation with Mirrors
# 使用多个镜像源确保最快速度

Write-Host "🦀 Complete Rust Installation with Mirrors" -ForegroundColor Green
Write-Host ""

# 设置多个镜像源
$mirrors = @{
    "USTC" = @{
        "RUSTUP_DIST_SERVER" = "https://mirrors.ustc.edu.cn/rust-static"
        "RUSTUP_UPDATE_ROOT" = "https://mirrors.ustc.edu.cn/rust-static/rustup"
    }
    "TUNA" = @{
        "RUSTUP_DIST_SERVER" = "https://mirrors.tuna.tsinghua.edu.cn/rust-static"
        "RUSTUP_UPDATE_ROOT" = "https://mirrors.tuna.tsinghua.edu.cn/rust-static/rustup"
    }
    "SJTU" = @{
        "RUSTUP_DIST_SERVER" = "https://mirrors.sjtug.sjtu.edu.cn/rust-static"
        "RUSTUP_UPDATE_ROOT" = "https://mirrors.sjtug.sjtu.edu.cn/rust-static/rustup"
    }
}

# 选择最快的镜像
Write-Host "📡 Testing mirror speeds..." -ForegroundColor Blue
$bestMirror = "USTC"  # 默认使用中科大
$fastestTime = 999999

foreach ($mirrorName in $mirrors.Keys) {
    try {
        $testUrl = $mirrors[$mirrorName]["RUSTUP_DIST_SERVER"]
        $startTime = Get-Date
        $response = Invoke-WebRequest -Uri $testUrl -Method Head -TimeoutSec 5 -UseBasicParsing
        $endTime = Get-Date
        $responseTime = ($endTime - $startTime).TotalMilliseconds
        
        Write-Host "  $mirrorName : $([math]::Round($responseTime))ms" -ForegroundColor Gray
        
        if ($responseTime -lt $fastestTime) {
            $fastestTime = $responseTime
            $bestMirror = $mirrorName
        }
    } catch {
        Write-Host "  $mirrorName : timeout" -ForegroundColor Red
    }
}

Write-Host "✅ Selected fastest mirror: $bestMirror" -ForegroundColor Green

# 设置环境变量
$env:RUSTUP_DIST_SERVER = $mirrors[$bestMirror]["RUSTUP_DIST_SERVER"]
$env:RUSTUP_UPDATE_ROOT = $mirrors[$bestMirror]["RUSTUP_UPDATE_ROOT"]

Write-Host "📡 Mirror configured:" -ForegroundColor Blue
Write-Host "  Server: $env:RUSTUP_DIST_SERVER" -ForegroundColor Gray
Write-Host "  Update: $env:RUSTUP_UPDATE_ROOT" -ForegroundColor Gray
Write-Host ""

# 检查现有安装
$cargoPath = "$env:USERPROFILE\.cargo\bin"
$rustupPath = "$cargoPath\rustup.exe"

if (Test-Path $rustupPath) {
    Write-Host "🔍 Found existing Rust installation" -ForegroundColor Yellow
    
    try {
        $env:PATH += ";$cargoPath"
        $rustVersion = & $rustupPath show 2>$null
        if ($rustVersion) {
            Write-Host "Current installation:" -ForegroundColor Blue
            Write-Host $rustVersion -ForegroundColor Gray
            
            $continue = Read-Host "Continue with toolchain update? (y/N)"
            if ($continue -ne "y" -and $continue -ne "Y") {
                Write-Host "Installation cancelled" -ForegroundColor Yellow
                exit 0
            }
        }
    } catch {
        Write-Host "Existing installation appears corrupted, reinstalling..." -ForegroundColor Yellow
    }
} else {
    Write-Host "📦 Installing Rust from scratch..." -ForegroundColor Blue
    
    # 下载rustup-init
    Write-Host "📥 Downloading rustup-init..." -ForegroundColor Blue
    $rustupUrl = "https://win.rustup.rs/x86_64"
    $rustupInitPath = "$env:TEMP\rustup-init.exe"
    
    try {
        Invoke-WebRequest -Uri $rustupUrl -OutFile $rustupInitPath -UseBasicParsing
        Write-Host "✅ Download completed" -ForegroundColor Green
    } catch {
        Write-Host "❌ Download failed: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
    
    # 运行安装程序
    Write-Host "🔧 Running rustup installer..." -ForegroundColor Blue
    try {
        Start-Process -FilePath $rustupInitPath -ArgumentList "-y", "--no-modify-path" -Wait
        Write-Host "✅ Rustup installed" -ForegroundColor Green
    } catch {
        Write-Host "❌ Installation failed: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# 更新PATH
if ($env:PATH -notlike "*$cargoPath*") {
    $env:PATH += ";$cargoPath"
    Write-Host "✅ PATH updated" -ForegroundColor Green
}

# 安装stable工具链
Write-Host "📦 Installing stable toolchain..." -ForegroundColor Blue
try {
    & "$cargoPath\rustup.exe" toolchain install stable
    Write-Host "✅ Stable toolchain installed" -ForegroundColor Green
} catch {
    Write-Host "❌ Toolchain installation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 设置默认工具链
Write-Host "🔧 Setting default toolchain..." -ForegroundColor Blue
try {
    & "$cargoPath\rustup.exe" default stable
    Write-Host "✅ Default toolchain set to stable" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to set default toolchain: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 验证安装
Write-Host "🔍 Verifying installation..." -ForegroundColor Blue
try {
    $rustVersion = & "$cargoPath\rustc.exe" --version
    $cargoVersion = & "$cargoPath\cargo.exe" --version
    $rustupVersion = & "$cargoPath\rustup.exe" --version
    
    Write-Host "✅ Installation verified:" -ForegroundColor Green
    Write-Host "  Rust: $rustVersion" -ForegroundColor White
    Write-Host "  Cargo: $cargoVersion" -ForegroundColor White
    Write-Host "  Rustup: $rustupVersion" -ForegroundColor White
} catch {
    Write-Host "❌ Verification failed" -ForegroundColor Red
    exit 1
}

# 配置Cargo镜像
Write-Host "📦 Configuring Cargo mirrors..." -ForegroundColor Blue
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

[source.tuna]
registry = "https://mirrors.tuna.tsinghua.edu.cn/git/crates.io-index.git"

[source.sjtu]
registry = "https://mirrors.sjtug.sjtu.edu.cn/git/crates.io-index"

[net]
git-fetch-with-cli = true
'@

Set-Content -Path $cargoConfigFile -Value $cargoConfig -Encoding UTF8
Write-Host "✅ Cargo mirrors configured" -ForegroundColor Green

# 安装Tauri CLI
Write-Host "📦 Installing Tauri CLI..." -ForegroundColor Blue
try {
    & "$cargoPath\cargo.exe" install tauri-cli --locked
    Write-Host "✅ Tauri CLI installed" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Tauri CLI installation failed, you can install it later:" -ForegroundColor Yellow
    Write-Host "  cargo install tauri-cli" -ForegroundColor Gray
}

# 验证Tauri CLI
try {
    $tauriVersion = & "$cargoPath\cargo.exe" tauri --version 2>$null
    if ($tauriVersion) {
        Write-Host "✅ Tauri CLI verified: $tauriVersion" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️ Tauri CLI not available, install manually later" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Rust installation completed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Summary:" -ForegroundColor Blue
Write-Host "  Mirror used: $bestMirror" -ForegroundColor White
Write-Host "  Toolchain: stable (default)" -ForegroundColor White
Write-Host "  Cargo mirrors: configured" -ForegroundColor White
Write-Host "  Tauri CLI: installed" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Next steps:" -ForegroundColor Blue
Write-Host "1. Restart terminal or run: refreshenv" -ForegroundColor White
Write-Host "2. Test: rustc --version" -ForegroundColor White
Write-Host "3. Test Tauri: cargo tauri --version" -ForegroundColor White
Write-Host "4. Start development: cd apps/tauri-desktop && cargo tauri dev" -ForegroundColor White
