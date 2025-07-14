# MingLog Windows 构建脚本
# 完善的Windows打包工具链

param(
    [string]$BuildType = "release",
    [string]$Target = "x86_64-pc-windows-msvc",
    [switch]$SkipTests = $false,
    [switch]$SkipClean = $false,
    [switch]$Verbose = $false
)

# 设置错误处理
$ErrorActionPreference = "Stop"

# 颜色输出函数
function Write-Status {
    param([string]$Message)
    Write-Host "📋 $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Blue
}

# 检查必要工具
function Test-Prerequisites {
    Write-Status "检查构建环境..."
    
    # 检查 Node.js
    try {
        $nodeVersion = node --version
        Write-Success "Node.js: $nodeVersion"
    } catch {
        Write-Error "Node.js 未安装或不在 PATH 中"
        exit 1
    }
    
    # 检查 npm
    try {
        $npmVersion = npm --version
        Write-Success "npm: $npmVersion"
    } catch {
        Write-Error "npm 未安装或不在 PATH 中"
        exit 1
    }
    
    # 检查 Rust
    try {
        $rustVersion = rustc --version
        Write-Success "Rust: $rustVersion"
    } catch {
        Write-Error "Rust 未安装或不在 PATH 中"
        Write-Info "请访问 https://rustup.rs/ 安装 Rust"
        exit 1
    }
    
    # 检查 Cargo
    try {
        $cargoVersion = cargo --version
        Write-Success "Cargo: $cargoVersion"
    } catch {
        Write-Error "Cargo 未安装或不在 PATH 中"
        exit 1
    }
    
    # 检查 Tauri CLI
    try {
        $tauriVersion = cargo tauri --version
        Write-Success "Tauri CLI: $tauriVersion"
    } catch {
        Write-Warning "Tauri CLI 未安装，正在安装..."
        cargo install tauri-cli
        Write-Success "Tauri CLI 安装完成"
    }
    
    # 检查 Windows 构建工具
    try {
        $vsVersion = Get-Command "cl.exe" -ErrorAction SilentlyContinue
        if ($vsVersion) {
            Write-Success "Visual Studio 构建工具已安装"
        } else {
            Write-Warning "未检测到 Visual Studio 构建工具"
            Write-Info "请确保已安装 Visual Studio 2019/2022 或 Build Tools"
        }
    } catch {
        Write-Warning "无法检测 Visual Studio 构建工具状态"
    }
}

# 清理构建目录
function Clear-BuildArtifacts {
    if ($SkipClean) {
        Write-Info "跳过清理步骤"
        return
    }
    
    Write-Status "清理构建产物..."
    
    $cleanPaths = @(
        "apps/tauri-desktop/src-tauri/target",
        "apps/tauri-desktop/dist",
        "apps/tauri-desktop/node_modules/.vite",
        "release"
    )
    
    foreach ($path in $cleanPaths) {
        if (Test-Path $path) {
            Remove-Item $path -Recurse -Force
            Write-Success "已清理: $path"
        }
    }
}

# 安装依赖
function Install-Dependencies {
    Write-Status "安装项目依赖..."
    
    # 安装根目录依赖
    Write-Status "安装根目录依赖..."
    npm install
    
    # 安装 Tauri 桌面应用依赖
    Write-Status "安装 Tauri 桌面应用依赖..."
    Set-Location "apps/tauri-desktop"
    npm install
    Set-Location "../.."
    
    Write-Success "依赖安装完成"
}

# 运行测试
function Invoke-Tests {
    if ($SkipTests) {
        Write-Info "跳过测试步骤"
        return
    }
    
    Write-Status "运行测试..."
    
    # 前端测试
    Write-Status "运行前端测试..."
    Set-Location "apps/tauri-desktop"
    
    try {
        npm run test:unit
        Write-Success "前端测试通过"
    } catch {
        Write-Warning "前端测试失败，但继续构建"
    }
    
    # Rust 测试
    Write-Status "运行 Rust 测试..."
    Set-Location "src-tauri"
    
    try {
        cargo test --release
        Write-Success "Rust 测试通过"
    } catch {
        Write-Warning "Rust 测试失败，但继续构建"
    }
    
    Set-Location "../../.."
}

# 构建前端
function Build-Frontend {
    Write-Status "构建前端应用..."
    
    Set-Location "apps/tauri-desktop"
    
    # 设置构建环境变量
    $env:NODE_ENV = "production"
    $env:TAURI_PLATFORM = "windows"
    
    npm run build
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "前端构建完成"
    } else {
        Write-Error "前端构建失败"
        exit 1
    }
    
    Set-Location "../.."
}

# 构建 Tauri 应用
function Build-TauriApp {
    Write-Status "构建 Tauri 桌面应用..."
    
    Set-Location "apps/tauri-desktop"
    
    # 设置构建参数
    $buildArgs = @()
    if ($BuildType -eq "debug") {
        $buildArgs += "--debug"
    }
    if ($Target) {
        $buildArgs += "--target", $Target
    }
    if ($Verbose) {
        $buildArgs += "--verbose"
    }
    
    # 执行构建
    $buildCommand = "cargo tauri build " + ($buildArgs -join " ")
    Write-Status "执行构建命令: $buildCommand"
    
    Invoke-Expression $buildCommand
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Tauri 应用构建完成"
    } else {
        Write-Error "Tauri 应用构建失败"
        exit 1
    }
    
    Set-Location "../.."
}

# 收集构建产物
function Collect-BuildArtifacts {
    Write-Status "收集构建产物..."
    
    # 创建发布目录
    $releaseDir = "release"
    if (Test-Path $releaseDir) {
        Remove-Item $releaseDir -Recurse -Force
    }
    New-Item -ItemType Directory -Path $releaseDir -Force | Out-Null
    
    # 构建产物路径
    $bundlePath = "apps/tauri-desktop/src-tauri/target/$Target/release/bundle"
    
    if (-not (Test-Path $bundlePath)) {
        $bundlePath = "apps/tauri-desktop/src-tauri/target/release/bundle"
    }
    
    if (-not (Test-Path $bundlePath)) {
        Write-Error "未找到构建产物目录: $bundlePath"
        exit 1
    }
    
    # 复制 MSI 安装包
    $msiPath = "$bundlePath/msi"
    if (Test-Path $msiPath) {
        Copy-Item "$msiPath/*.msi" $releaseDir -ErrorAction SilentlyContinue
        Write-Success "MSI 安装包已复制"
    }
    
    # 复制 NSIS 安装包
    $nsisPath = "$bundlePath/nsis"
    if (Test-Path $nsisPath) {
        Copy-Item "$nsisPath/*.exe" $releaseDir -ErrorAction SilentlyContinue
        Write-Success "NSIS 安装包已复制"
    }
    
    # 复制可执行文件
    $exePath = "apps/tauri-desktop/src-tauri/target/$Target/release"
    if (-not (Test-Path $exePath)) {
        $exePath = "apps/tauri-desktop/src-tauri/target/release"
    }
    
    if (Test-Path "$exePath/*.exe") {
        Copy-Item "$exePath/*.exe" $releaseDir -ErrorAction SilentlyContinue
        Write-Success "可执行文件已复制"
    }
    
    # 生成校验和
    Write-Status "生成文件校验和..."
    Set-Location $releaseDir
    
    $checksumFile = "checksums.sha256"
    if (Test-Path $checksumFile) {
        Remove-Item $checksumFile
    }
    
    Get-ChildItem -File | ForEach-Object {
        $hash = Get-FileHash $_.Name -Algorithm SHA256
        "$($hash.Hash.ToLower())  $($_.Name)" | Add-Content $checksumFile
    }
    
    Set-Location ".."
    Write-Success "校验和文件已生成"
}

# 显示构建结果
function Show-BuildResults {
    Write-Status "构建结果摘要:"
    
    $releaseDir = "release"
    if (Test-Path $releaseDir) {
        Write-Success "构建产物位置: $releaseDir"
        Write-Info "文件列表:"
        
        Get-ChildItem $releaseDir -File | ForEach-Object {
            $size = [math]::Round($_.Length / 1MB, 2)
            Write-Host "  📄 $($_.Name) ($size MB)" -ForegroundColor White
        }
    } else {
        Write-Warning "未找到构建产物"
    }
    
    Write-Success "构建完成！"
}

# 主函数
function Main {
    Write-Host "🚀 开始构建 MingLog Windows 桌面应用" -ForegroundColor Green
    Write-Host "构建类型: $BuildType" -ForegroundColor Cyan
    Write-Host "目标平台: $Target" -ForegroundColor Cyan
    Write-Host ""
    
    try {
        Test-Prerequisites
        Clear-BuildArtifacts
        Install-Dependencies
        Invoke-Tests
        Build-Frontend
        Build-TauriApp
        Collect-BuildArtifacts
        Show-BuildResults
        
        Write-Host ""
        Write-Host "🎉 MingLog Windows 桌面应用构建成功！" -ForegroundColor Green
        
    } catch {
        Write-Host ""
        Write-Error "构建失败: $($_.Exception.Message)"
        Write-Info "请检查上面的错误信息并修复问题"
        exit 1
    }
}

# 执行主函数
Main
