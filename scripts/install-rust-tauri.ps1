# Rust和Tauri开发环境安装脚本
# 适用于Windows系统

Write-Host "🚀 开始安装Rust和Tauri开发环境..." -ForegroundColor Green

# 检查是否已安装Rust
try {
    $rustVersion = rustc --version 2>$null
    if ($rustVersion) {
        Write-Host "✅ Rust已安装: $rustVersion" -ForegroundColor Green
    }
} catch {
    Write-Host "📦 正在安装Rust..." -ForegroundColor Yellow
    
    # 下载并安装Rustup
    Write-Host "下载Rustup安装程序..." -ForegroundColor Blue
    $rustupUrl = "https://win.rustup.rs/x86_64"
    $rustupPath = "$env:TEMP\rustup-init.exe"
    
    try {
        Invoke-WebRequest -Uri $rustupUrl -OutFile $rustupPath -UseBasicParsing
        Write-Host "✅ Rustup下载完成" -ForegroundColor Green
        
        # 运行安装程序
        Write-Host "运行Rustup安装程序..." -ForegroundColor Blue
        Start-Process -FilePath $rustupPath -ArgumentList "-y" -Wait
        
        # 更新环境变量
        $env:PATH += ";$env:USERPROFILE\.cargo\bin"
        
        Write-Host "✅ Rust安装完成" -ForegroundColor Green
    } catch {
        Write-Host "❌ Rust安装失败: $($_.Exception.Message)" -ForegroundColor Red
        exit 1
    }
}

# 验证Rust安装
Write-Host "🔍 验证Rust安装..." -ForegroundColor Blue
try {
    $rustVersion = & "$env:USERPROFILE\.cargo\bin\rustc.exe" --version
    $cargoVersion = & "$env:USERPROFILE\.cargo\bin\cargo.exe" --version
    Write-Host "✅ Rust版本: $rustVersion" -ForegroundColor Green
    Write-Host "✅ Cargo版本: $cargoVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Rust验证失败，请手动安装" -ForegroundColor Red
    Write-Host "请访问: https://rustup.rs/" -ForegroundColor Yellow
    exit 1
}

# 安装Tauri CLI
Write-Host "📦 正在安装Tauri CLI..." -ForegroundColor Yellow
try {
    & "$env:USERPROFILE\.cargo\bin\cargo.exe" install tauri-cli
    Write-Host "✅ Tauri CLI安装完成" -ForegroundColor Green
} catch {
    Write-Host "❌ Tauri CLI安装失败: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 验证Tauri CLI安装
Write-Host "🔍 验证Tauri CLI安装..." -ForegroundColor Blue
try {
    $tauriVersion = & "$env:USERPROFILE\.cargo\bin\cargo.exe" tauri --version
    Write-Host "✅ Tauri CLI版本: $tauriVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Tauri CLI验证失败" -ForegroundColor Red
    exit 1
}

# 安装必要的系统依赖
Write-Host "📦 检查系统依赖..." -ForegroundColor Yellow

# 检查Visual Studio Build Tools
try {
    $vsWhere = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
    if (Test-Path $vsWhere) {
        $buildTools = & $vsWhere -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath
        if ($buildTools) {
            Write-Host "✅ Visual Studio Build Tools已安装" -ForegroundColor Green
        } else {
            Write-Host "⚠️  需要安装Visual Studio Build Tools" -ForegroundColor Yellow
            Write-Host "请安装: https://visualstudio.microsoft.com/visual-cpp-build-tools/" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️  需要安装Visual Studio Build Tools" -ForegroundColor Yellow
        Write-Host "请安装: https://visualstudio.microsoft.com/visual-cpp-build-tools/" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️  无法检查Visual Studio Build Tools" -ForegroundColor Yellow
}

# 检查WebView2
Write-Host "🔍 检查WebView2..." -ForegroundColor Blue
$webview2Path = "${env:ProgramFiles(x86)}\Microsoft\EdgeWebView\Application"
if (Test-Path $webview2Path) {
    Write-Host "✅ WebView2已安装" -ForegroundColor Green
} else {
    Write-Host "⚠️  需要安装WebView2" -ForegroundColor Yellow
    Write-Host "请安装: https://developer.microsoft.com/en-us/microsoft-edge/webview2/" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Rust和Tauri开发环境安装完成！" -ForegroundColor Green
Write-Host ""
Write-Host "📋 下一步:" -ForegroundColor Blue
Write-Host "1. 重启终端或重新加载环境变量" -ForegroundColor White
Write-Host "2. 运行 'cargo tauri --version' 验证安装" -ForegroundColor White
Write-Host "3. 开始创建Tauri项目" -ForegroundColor White
Write-Host ""
Write-Host "🔗 有用的链接:" -ForegroundColor Blue
Write-Host "- Tauri文档: https://tauri.app/" -ForegroundColor White
Write-Host "- Rust文档: https://doc.rust-lang.org/" -ForegroundColor White
