# MingLog Build Environment Check Script
# Check Windows build environment integrity

param(
    [switch]$Fix = $false,
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

# 检查结果统计
$script:CheckResults = @{
    Passed = 0
    Failed = 0
    Warnings = 0
    Issues = @()
}

function Add-CheckResult {
    param(
        [string]$Name,
        [string]$Status,
        [string]$Message,
        [string]$FixCommand = ""
    )
    
    $result = @{
        Name = $Name
        Status = $Status
        Message = $Message
        FixCommand = $FixCommand
    }
    
    $script:CheckResults.Issues += $result
    
    switch ($Status) {
        "PASS" { $script:CheckResults.Passed++ }
        "FAIL" { $script:CheckResults.Failed++ }
        "WARN" { $script:CheckResults.Warnings++ }
    }
}

# 检查 PowerShell 版本
function Test-PowerShellVersion {
    Write-Status "检查 PowerShell 版本..."
    
    $version = $PSVersionTable.PSVersion
    if ($version.Major -ge 5) {
        Write-Success "PowerShell 版本: $version"
        Add-CheckResult "PowerShell" "PASS" "版本 $version 满足要求"
    } else {
        Write-Error "PowerShell 版本过低: $version (需要 5.0+)"
        Add-CheckResult "PowerShell" "FAIL" "版本 $version 过低，需要 5.0+" "升级到 PowerShell 5.0 或更高版本"
    }
}

# 检查 Node.js
function Test-NodeJS {
    Write-Status "检查 Node.js..."
    
    try {
        $nodeVersion = node --version 2>$null
        $npmVersion = npm --version 2>$null
        
        if ($nodeVersion -and $npmVersion) {
            Write-Success "Node.js: $nodeVersion"
            Write-Success "npm: $npmVersion"
            Add-CheckResult "Node.js" "PASS" "Node.js $nodeVersion, npm $npmVersion"
            
            # 检查 Node.js 版本是否满足要求
            $versionNumber = [version]($nodeVersion -replace 'v', '')
            if ($versionNumber -lt [version]"16.0.0") {
                Write-Warning "Node.js 版本较低，建议升级到 18.0+ 以获得更好的性能"
                Add-CheckResult "Node.js Version" "WARN" "版本 $nodeVersion 较低，建议升级到 18.0+"
            }
        } else {
            throw "Node.js 或 npm 未找到"
        }
    } catch {
        Write-Error "Node.js 未安装或不在 PATH 中"
        Add-CheckResult "Node.js" "FAIL" "未安装或不在 PATH 中" "从 https://nodejs.org/ 下载并安装 Node.js"
    }
}

# 检查 Rust 工具链
function Test-RustToolchain {
    Write-Status "检查 Rust 工具链..."
    
    try {
        $rustVersion = rustc --version 2>$null
        $cargoVersion = cargo --version 2>$null
        
        if ($rustVersion -and $cargoVersion) {
            Write-Success "Rust: $rustVersion"
            Write-Success "Cargo: $cargoVersion"
            Add-CheckResult "Rust" "PASS" "Rust 工具链已安装"
            
            # 检查 Windows 目标
            $targets = rustup target list --installed 2>$null
            if ($targets -match "x86_64-pc-windows-msvc") {
                Write-Success "Windows MSVC 目标已安装"
                Add-CheckResult "Rust Target" "PASS" "x86_64-pc-windows-msvc 目标已安装"
            } else {
                Write-Warning "Windows MSVC 目标未安装"
                Add-CheckResult "Rust Target" "WARN" "x86_64-pc-windows-msvc 目标未安装" "rustup target add x86_64-pc-windows-msvc"
                
                if ($Fix) {
                    Write-Status "正在安装 Windows MSVC 目标..."
                    rustup target add x86_64-pc-windows-msvc
                    Write-Success "Windows MSVC 目标安装完成"
                }
            }
        } else {
            throw "Rust 或 Cargo 未找到"
        }
    } catch {
        Write-Error "Rust 未安装或不在 PATH 中"
        Add-CheckResult "Rust" "FAIL" "未安装或不在 PATH 中" "从 https://rustup.rs/ 安装 Rust"
    }
}

# 检查 Tauri CLI
function Test-TauriCLI {
    Write-Status "检查 Tauri CLI..."
    
    try {
        $tauriVersion = cargo tauri --version 2>$null
        if ($tauriVersion) {
            Write-Success "Tauri CLI: $tauriVersion"
            Add-CheckResult "Tauri CLI" "PASS" "版本 $tauriVersion"
        } else {
            throw "Tauri CLI 未找到"
        }
    } catch {
        Write-Warning "Tauri CLI 未安装"
        Add-CheckResult "Tauri CLI" "WARN" "未安装" "cargo install tauri-cli"
        
        if ($Fix) {
            Write-Status "正在安装 Tauri CLI..."
            cargo install tauri-cli
            Write-Success "Tauri CLI 安装完成"
        }
    }
}

# 检查 Visual Studio 构建工具
function Test-VisualStudioBuildTools {
    Write-Status "检查 Visual Studio 构建工具..."
    
    # 检查 cl.exe (MSVC 编译器)
    try {
        $clPath = Get-Command "cl.exe" -ErrorAction SilentlyContinue
        if ($clPath) {
            Write-Success "MSVC 编译器已安装: $($clPath.Source)"
            Add-CheckResult "MSVC Compiler" "PASS" "已安装"
        } else {
            throw "cl.exe 未找到"
        }
    } catch {
        Write-Warning "MSVC 编译器未找到"
        Add-CheckResult "MSVC Compiler" "WARN" "未找到" "安装 Visual Studio 2019/2022 或 Build Tools"
    }
    
    # 检查 Windows SDK
    $sdkPaths = @(
        "${env:ProgramFiles(x86)}\Windows Kits\10",
        "${env:ProgramFiles}\Windows Kits\10"
    )
    
    $sdkFound = $false
    foreach ($path in $sdkPaths) {
        if (Test-Path $path) {
            $sdkVersions = Get-ChildItem "$path\bin" -Directory -ErrorAction SilentlyContinue | Sort-Object Name -Descending
            if ($sdkVersions) {
                $latestSdk = $sdkVersions[0].Name
                Write-Success "Windows SDK 已安装: $latestSdk"
                Add-CheckResult "Windows SDK" "PASS" "版本 $latestSdk"
                $sdkFound = $true
                break
            }
        }
    }
    
    if (-not $sdkFound) {
        Write-Warning "Windows SDK 未找到"
        Add-CheckResult "Windows SDK" "WARN" "未找到" "安装 Windows 10/11 SDK"
    }
}

# 检查项目依赖
function Test-ProjectDependencies {
    Write-Status "检查项目依赖..."
    
    # 检查 package.json
    $packageJsonPath = "package.json"
    if (Test-Path $packageJsonPath) {
        Write-Success "根目录 package.json 存在"
        Add-CheckResult "Root Package.json" "PASS" "存在"
    } else {
        Write-Error "根目录 package.json 不存在"
        Add-CheckResult "Root Package.json" "FAIL" "不存在"
    }
    
    # 检查 Tauri 应用配置
    $tauriConfigPath = "apps/tauri-desktop/src-tauri/tauri.conf.json"
    if (Test-Path $tauriConfigPath) {
        Write-Success "Tauri 配置文件存在"
        Add-CheckResult "Tauri Config" "PASS" "存在"
    } else {
        Write-Error "Tauri 配置文件不存在"
        Add-CheckResult "Tauri Config" "FAIL" "不存在"
    }
    
    # 检查 Cargo.toml
    $cargoTomlPath = "apps/tauri-desktop/src-tauri/Cargo.toml"
    if (Test-Path $cargoTomlPath) {
        Write-Success "Cargo.toml 存在"
        Add-CheckResult "Cargo.toml" "PASS" "存在"
    } else {
        Write-Error "Cargo.toml 不存在"
        Add-CheckResult "Cargo.toml" "FAIL" "不存在"
    }
}

# 检查磁盘空间
function Test-DiskSpace {
    Write-Status "检查磁盘空间..."
    
    $drive = (Get-Location).Drive
    $freeSpace = [math]::Round((Get-WmiObject -Class Win32_LogicalDisk -Filter "DeviceID='$($drive.Name)'").FreeSpace / 1GB, 2)
    
    if ($freeSpace -gt 5) {
        Write-Success "可用磁盘空间: $freeSpace GB"
        Add-CheckResult "Disk Space" "PASS" "$freeSpace GB 可用"
    } elseif ($freeSpace -gt 2) {
        Write-Warning "磁盘空间较少: $freeSpace GB"
        Add-CheckResult "Disk Space" "WARN" "仅 $freeSpace GB 可用，建议至少 5GB"
    } else {
        Write-Error "磁盘空间不足: $freeSpace GB"
        Add-CheckResult "Disk Space" "FAIL" "仅 $freeSpace GB 可用，需要至少 2GB"
    }
}

# 检查网络连接
function Test-NetworkConnectivity {
    Write-Status "检查网络连接..."
    
    $testUrls = @(
        "https://registry.npmjs.org",
        "https://crates.io",
        "https://github.com"
    )
    
    $allConnected = $true
    foreach ($url in $testUrls) {
        try {
            $response = Invoke-WebRequest -Uri $url -Method Head -TimeoutSec 10 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-Success "连接正常: $url"
            } else {
                Write-Warning "连接异常: $url (状态码: $($response.StatusCode))"
                $allConnected = $false
            }
        } catch {
            Write-Warning "无法连接: $url"
            $allConnected = $false
        }
    }
    
    if ($allConnected) {
        Add-CheckResult "Network" "PASS" "所有测试 URL 连接正常"
    } else {
        Add-CheckResult "Network" "WARN" "部分网络连接异常，可能影响依赖下载"
    }
}

# 显示检查结果摘要
function Show-Summary {
    Write-Host ""
    Write-Host "📊 构建环境检查摘要" -ForegroundColor Green
    Write-Host "===================" -ForegroundColor Green
    
    Write-Host "✅ 通过: $($script:CheckResults.Passed)" -ForegroundColor Green
    Write-Host "⚠️  警告: $($script:CheckResults.Warnings)" -ForegroundColor Yellow
    Write-Host "❌ 失败: $($script:CheckResults.Failed)" -ForegroundColor Red
    
    Write-Host ""
    
    if ($script:CheckResults.Failed -gt 0) {
        Write-Host "❌ 需要修复的问题:" -ForegroundColor Red
        $script:CheckResults.Issues | Where-Object { $_.Status -eq "FAIL" } | ForEach-Object {
            Write-Host "  • $($_.Name): $($_.Message)" -ForegroundColor Red
            if ($_.FixCommand) {
                Write-Host "    修复命令: $($_.FixCommand)" -ForegroundColor Gray
            }
        }
        Write-Host ""
    }
    
    if ($script:CheckResults.Warnings -gt 0) {
        Write-Host "⚠️  建议改进的项目:" -ForegroundColor Yellow
        $script:CheckResults.Issues | Where-Object { $_.Status -eq "WARN" } | ForEach-Object {
            Write-Host "  • $($_.Name): $($_.Message)" -ForegroundColor Yellow
            if ($_.FixCommand) {
                Write-Host "    建议命令: $($_.FixCommand)" -ForegroundColor Gray
            }
        }
        Write-Host ""
    }
    
    if ($script:CheckResults.Failed -eq 0) {
        Write-Host "🎉 构建环境检查完成！可以开始构建 MingLog。" -ForegroundColor Green
    } else {
        Write-Host "🔧 请修复上述问题后再进行构建。" -ForegroundColor Yellow
        Write-Host "💡 使用 -Fix 参数可以自动修复部分问题。" -ForegroundColor Blue
    }
}

# 主函数
function Main {
    Write-Host "🔍 MingLog Windows 构建环境检查" -ForegroundColor Green
    Write-Host ""
    
    Test-PowerShellVersion
    Test-NodeJS
    Test-RustToolchain
    Test-TauriCLI
    Test-VisualStudioBuildTools
    Test-ProjectDependencies
    Test-DiskSpace
    Test-NetworkConnectivity
    
    Show-Summary
}

# 执行主函数
Main
