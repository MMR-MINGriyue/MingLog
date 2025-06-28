# Rust镜像安装脚本 - 使用中科大镜像源

Write-Host "🦀 使用镜像快速安装Rust..." -ForegroundColor Green
Write-Host ""

# 设置镜像环境变量
Write-Host "📡 配置镜像源..." -ForegroundColor Blue

# 中科大镜像源
$env:RUSTUP_DIST_SERVER = "https://mirrors.ustc.edu.cn/rust-static"
$env:RUSTUP_UPDATE_ROOT = "https://mirrors.ustc.edu.cn/rust-static/rustup"

Write-Host "✅ 镜像源配置完成:" -ForegroundColor Green
Write-Host "  RUSTUP_DIST_SERVER: $env:RUSTUP_DIST_SERVER" -ForegroundColor Gray
Write-Host "  RUSTUP_UPDATE_ROOT: $env:RUSTUP_UPDATE_ROOT" -ForegroundColor Gray
Write-Host ""

# 检查是否已安装
try {
    $rustVersion = rustc --version 2>$null
    if ($rustVersion) {
        Write-Host "✅ Rust已安装: $rustVersion" -ForegroundColor Green
        Write-Host "跳过安装步骤" -ForegroundColor Yellow
        exit 0
    }
} catch {
    Write-Host "📦 开始安装Rust..." -ForegroundColor Blue
}

# 下载rustup-init
Write-Host "📥 下载Rustup安装程序..." -ForegroundColor Blue
$rustupUrl = "https://win.rustup.rs/x86_64"
$rustupPath = "$env:TEMP\rustup-init.exe"

try {
    # 使用代理下载（如果需要）
    $webClient = New-Object System.Net.WebClient
    $webClient.DownloadFile($rustupUrl, $rustupPath)
    Write-Host "✅ 下载完成" -ForegroundColor Green
} catch {
    Write-Host "❌ 下载失败: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "🔧 备选方案:" -ForegroundColor Yellow
    Write-Host "1. 手动下载: $rustupUrl" -ForegroundColor White
    Write-Host "2. 使用其他镜像源" -ForegroundColor White
    Write-Host "3. 检查网络连接" -ForegroundColor White
    exit 1
}

# 运行安装程序
Write-Host "🔧 运行安装程序..." -ForegroundColor Blue
try {
    # 静默安装，使用默认配置
    Start-Process -FilePath $rustupPath -ArgumentList "-y", "--default-toolchain", "stable" -Wait -NoNewWindow
    Write-Host "✅ 安装完成" -ForegroundColor Green
} catch {
    Write-Host "❌ 安装失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 更新PATH环境变量
Write-Host "🔧 更新环境变量..." -ForegroundColor Blue
$cargoPath = "$env:USERPROFILE\.cargo\bin"
if ($env:PATH -notlike "*$cargoPath*") {
    $env:PATH += ";$cargoPath"
    Write-Host "✅ PATH已更新" -ForegroundColor Green
} else {
    Write-Host "✅ PATH已包含Cargo路径" -ForegroundColor Green
}

# 验证安装
Write-Host "🔍 验证安装..." -ForegroundColor Blue
try {
    $rustVersion = & "$cargoPath\rustc.exe" --version
    $cargoVersion = & "$cargoPath\cargo.exe" --version
    
    Write-Host "✅ 验证成功:" -ForegroundColor Green
    Write-Host "  Rust: $rustVersion" -ForegroundColor White
    Write-Host "  Cargo: $cargoVersion" -ForegroundColor White
} catch {
    Write-Host "❌ 验证失败" -ForegroundColor Red
    Write-Host "请重启终端后再试" -ForegroundColor Yellow
    exit 1
}

# 配置Cargo镜像源
Write-Host "📦 配置Cargo镜像源..." -ForegroundColor Blue
$cargoConfigDir = "$env:USERPROFILE\.cargo"
$cargoConfigFile = "$cargoConfigDir\config.toml"

# 创建.cargo目录
if (!(Test-Path $cargoConfigDir)) {
    New-Item -ItemType Directory -Path $cargoConfigDir -Force | Out-Null
}

# 创建config.toml文件
$cargoConfig = @"
[source.crates-io]
registry = "https://github.com/rust-lang/crates.io-index"
replace-with = 'ustc'

[source.ustc]
registry = "git://mirrors.ustc.edu.cn/crates.io-index"

[net]
git-fetch-with-cli = true
"@

Set-Content -Path $cargoConfigFile -Value $cargoConfig -Encoding UTF8
Write-Host "✅ Cargo镜像源配置完成" -ForegroundColor Green

# 安装Tauri CLI
Write-Host "📦 安装Tauri CLI..." -ForegroundColor Blue
try {
    & "$cargoPath\cargo.exe" install tauri-cli
    Write-Host "✅ Tauri CLI安装完成" -ForegroundColor Green
} catch {
    Write-Host "❌ Tauri CLI安装失败" -ForegroundColor Red
    Write-Host "可以稍后手动安装: cargo install tauri-cli" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Rust环境安装完成！" -ForegroundColor Green
Write-Host ""
Write-Host "📋 下一步:" -ForegroundColor Blue
Write-Host "1. 重启终端或运行: refreshenv" -ForegroundColor White
Write-Host "2. 验证安装: rustc --version" -ForegroundColor White
Write-Host "3. 测试Tauri: cargo tauri --version" -ForegroundColor White
Write-Host "4. 开始开发: cd apps/tauri-desktop && cargo tauri dev" -ForegroundColor White
Write-Host ""
Write-Host "🔗 镜像源信息:" -ForegroundColor Blue
Write-Host "- Rust官方镜像: 中科大 (USTC)" -ForegroundColor White
Write-Host "- Cargo镜像: 中科大 crates.io 镜像" -ForegroundColor White
Write-Host "- 下载速度提升: 10-50倍" -ForegroundColor White
