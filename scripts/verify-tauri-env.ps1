# Tauri开发环境验证脚本

Write-Host "🔍 Verifying Tauri Development Environment..." -ForegroundColor Green
Write-Host ""

$allChecks = @()

# 检查Rust
Write-Host "📋 Checking Rust environment..." -ForegroundColor Blue
try {
    $rustVersion = rustc --version 2>$null
    if ($rustVersion) {
        Write-Host "✅ Rust: $rustVersion" -ForegroundColor Green
        $allChecks += @{Name="Rust"; Status="OK"; Details=$rustVersion}
    } else {
        Write-Host "❌ Rust not found" -ForegroundColor Red
        $allChecks += @{Name="Rust"; Status="MISSING"; Details="Not installed"}
    }
} catch {
    Write-Host "❌ Rust not found" -ForegroundColor Red
    $allChecks += @{Name="Rust"; Status="MISSING"; Details="Not installed"}
}

# 检查Cargo
try {
    $cargoVersion = cargo --version 2>$null
    if ($cargoVersion) {
        Write-Host "✅ Cargo: $cargoVersion" -ForegroundColor Green
        $allChecks += @{Name="Cargo"; Status="OK"; Details=$cargoVersion}
    } else {
        Write-Host "❌ Cargo not found" -ForegroundColor Red
        $allChecks += @{Name="Cargo"; Status="MISSING"; Details="Not installed"}
    }
} catch {
    Write-Host "❌ Cargo not found" -ForegroundColor Red
    $allChecks += @{Name="Cargo"; Status="MISSING"; Details="Not installed"}
}

# 检查Node.js
Write-Host "📋 Checking Node.js environment..." -ForegroundColor Blue
try {
    $nodeVersion = node --version 2>$null
    if ($nodeVersion) {
        Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
        $allChecks += @{Name="Node.js"; Status="OK"; Details=$nodeVersion}
    } else {
        Write-Host "❌ Node.js not found" -ForegroundColor Red
        $allChecks += @{Name="Node.js"; Status="MISSING"; Details="Not installed"}
    }
} catch {
    Write-Host "❌ Node.js not found" -ForegroundColor Red
    $allChecks += @{Name="Node.js"; Status="MISSING"; Details="Not installed"}
}

# 检查pnpm
try {
    $pnpmVersion = pnpm --version 2>$null
    if ($pnpmVersion) {
        Write-Host "✅ pnpm: v$pnpmVersion" -ForegroundColor Green
        $allChecks += @{Name="pnpm"; Status="OK"; Details="v$pnpmVersion"}
    } else {
        Write-Host "❌ pnpm not found" -ForegroundColor Red
        $allChecks += @{Name="pnpm"; Status="MISSING"; Details="Not installed"}
    }
} catch {
    Write-Host "❌ pnpm not found" -ForegroundColor Red
    $allChecks += @{Name="pnpm"; Status="MISSING"; Details="Not installed"}
}

# 检查Tauri CLI
Write-Host "📋 Checking Tauri CLI..." -ForegroundColor Blue
try {
    $tauriVersion = cargo tauri --version 2>$null
    if ($tauriVersion) {
        Write-Host "✅ Tauri CLI: $tauriVersion" -ForegroundColor Green
        $allChecks += @{Name="Tauri CLI"; Status="OK"; Details=$tauriVersion}
    } else {
        Write-Host "❌ Tauri CLI not found" -ForegroundColor Red
        $allChecks += @{Name="Tauri CLI"; Status="MISSING"; Details="Not installed"}
    }
} catch {
    Write-Host "❌ Tauri CLI not found" -ForegroundColor Red
    $allChecks += @{Name="Tauri CLI"; Status="MISSING"; Details="Not installed"}
}

# 检查系统依赖
Write-Host "📋 Checking system dependencies..." -ForegroundColor Blue

# Windows特定检查
if ($IsWindows -or $env:OS -eq "Windows_NT") {
    # 检查Visual Studio Build Tools
    try {
        $vsWhere = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
        if (Test-Path $vsWhere) {
            $buildTools = & $vsWhere -products * -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property installationPath 2>$null
            if ($buildTools) {
                Write-Host "✅ Visual Studio Build Tools: Found" -ForegroundColor Green
                $allChecks += @{Name="VS Build Tools"; Status="OK"; Details="Installed"}
            } else {
                Write-Host "❌ Visual Studio Build Tools: Not found" -ForegroundColor Red
                $allChecks += @{Name="VS Build Tools"; Status="MISSING"; Details="Required for Windows"}
            }
        } else {
            Write-Host "❌ Visual Studio Build Tools: Not found" -ForegroundColor Red
            $allChecks += @{Name="VS Build Tools"; Status="MISSING"; Details="Required for Windows"}
        }
    } catch {
        Write-Host "❌ Visual Studio Build Tools: Check failed" -ForegroundColor Red
        $allChecks += @{Name="VS Build Tools"; Status="ERROR"; Details="Check failed"}
    }
    
    # 检查WebView2
    $webview2Path = "${env:ProgramFiles(x86)}\Microsoft\EdgeWebView\Application"
    if (Test-Path $webview2Path) {
        Write-Host "✅ WebView2: Installed" -ForegroundColor Green
        $allChecks += @{Name="WebView2"; Status="OK"; Details="Installed"}
    } else {
        Write-Host "❌ WebView2: Not found" -ForegroundColor Red
        $allChecks += @{Name="WebView2"; Status="MISSING"; Details="Required for Windows"}
    }
}

# 检查项目结构
Write-Host "📋 Checking project structure..." -ForegroundColor Blue

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
        $allChecks += @{Name="Project: $path"; Status="OK"; Details="Found"}
    } else {
        Write-Host "MISSING $path" -ForegroundColor Red
        $allChecks += @{Name="Project: $path"; Status="MISSING"; Details="Required file/directory"}
    }
}

# 生成报告
Write-Host ""
Write-Host "📊 Environment Verification Report" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

$okCount = ($allChecks | Where-Object { $_.Status -eq "OK" }).Count
$missingCount = ($allChecks | Where-Object { $_.Status -eq "MISSING" }).Count
$errorCount = ($allChecks | Where-Object { $_.Status -eq "ERROR" }).Count
$totalCount = $allChecks.Count

Write-Host "Total Checks: $totalCount" -ForegroundColor Blue
Write-Host "✅ Passed: $okCount" -ForegroundColor Green
Write-Host "❌ Missing: $missingCount" -ForegroundColor Red
Write-Host "⚠️ Errors: $errorCount" -ForegroundColor Yellow

Write-Host ""
Write-Host "📋 Detailed Results:" -ForegroundColor Blue
foreach ($check in $allChecks) {
    $status = switch ($check.Status) {
        "OK" { "OK" }
        "MISSING" { "MISSING" }
        "ERROR" { "ERROR" }
    }
    Write-Host "$status $($check.Name): $($check.Details)" -ForegroundColor White
}

# 提供修复建议
if ($missingCount -gt 0 -or $errorCount -gt 0) {
    Write-Host ""
    Write-Host "🔧 Recommended Actions:" -ForegroundColor Yellow
    
    $missingItems = $allChecks | Where-Object { $_.Status -eq "MISSING" }
    foreach ($item in $missingItems) {
        switch ($item.Name) {
            "Rust" { 
                Write-Host "• Install Rust: Run scripts/install-rust-simple.ps1" -ForegroundColor White 
            }
            "Node.js" { 
                Write-Host "• Install Node.js: https://nodejs.org/" -ForegroundColor White 
            }
            "pnpm" { 
                Write-Host "• Install pnpm: npm install -g pnpm" -ForegroundColor White 
            }
            "Tauri CLI" { 
                Write-Host "• Install Tauri CLI: cargo install tauri-cli" -ForegroundColor White 
            }
            "VS Build Tools" { 
                Write-Host "• Install Visual Studio Build Tools: https://visualstudio.microsoft.com/visual-cpp-build-tools/" -ForegroundColor White 
            }
            "WebView2" { 
                Write-Host "• Install WebView2: https://developer.microsoft.com/en-us/microsoft-edge/webview2/" -ForegroundColor White 
            }
        }
    }
}

Write-Host ""
if ($missingCount -eq 0 -and $errorCount -eq 0) {
    Write-Host "🎉 Environment is ready for Tauri development!" -ForegroundColor Green
    Write-Host "You can now run: scripts/test-tauri.ps1" -ForegroundColor Blue
} else {
    Write-Host "⚠️ Environment setup incomplete. Please address the missing items above." -ForegroundColor Yellow
}
