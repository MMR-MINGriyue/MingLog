# MingLog Tauri应用发布脚本

param(
    [string]$Version = "",
    [switch]$DryRun = $false,
    [switch]$SkipBuild = $false
)

Write-Host "🚀 MingLog Tauri Release Script" -ForegroundColor Green
Write-Host ""

# 检查版本参数
if ($Version -eq "") {
    Write-Host "❌ Version parameter is required" -ForegroundColor Red
    Write-Host "Usage: scripts/release-tauri.ps1 -Version '0.1.0'" -ForegroundColor Yellow
    exit 1
}

Write-Host "📋 Release Configuration:" -ForegroundColor Blue
Write-Host "  Version: $Version" -ForegroundColor White
Write-Host "  Dry Run: $DryRun" -ForegroundColor White
Write-Host "  Skip Build: $SkipBuild" -ForegroundColor White
Write-Host ""

# 验证版本格式
if ($Version -notmatch '^\d+\.\d+\.\d+$') {
    Write-Host "❌ Invalid version format. Use semantic versioning (e.g., 1.0.0)" -ForegroundColor Red
    exit 1
}

# 检查Git状态
Write-Host "📋 Checking Git status..." -ForegroundColor Blue
try {
    $gitStatus = git status --porcelain
    if ($gitStatus) {
        Write-Host "⚠️ Working directory has uncommitted changes:" -ForegroundColor Yellow
        Write-Host $gitStatus -ForegroundColor Gray
        
        if (!$DryRun) {
            $continue = Read-Host "Continue anyway? (y/N)"
            if ($continue -ne "y" -and $continue -ne "Y") {
                Write-Host "❌ Release cancelled" -ForegroundColor Red
                exit 1
            }
        }
    } else {
        Write-Host "✅ Working directory is clean" -ForegroundColor Green
    }
} catch {
    Write-Host "❌ Failed to check Git status" -ForegroundColor Red
    exit 1
}

# 更新版本号
Write-Host "📝 Updating version numbers..." -ForegroundColor Blue

$tauriConfigPath = "apps/tauri-desktop/src-tauri/tauri.conf.json"
$packageJsonPath = "apps/tauri-desktop/package.json"
$cargoTomlPath = "apps/tauri-desktop/src-tauri/Cargo.toml"

if (!$DryRun) {
    # 更新Tauri配置
    if (Test-Path $tauriConfigPath) {
        $tauriConfig = Get-Content $tauriConfigPath | ConvertFrom-Json
        $tauriConfig.package.version = $Version
        $tauriConfig | ConvertTo-Json -Depth 10 | Set-Content $tauriConfigPath
        Write-Host "✅ Updated $tauriConfigPath" -ForegroundColor Green
    }
    
    # 更新package.json
    if (Test-Path $packageJsonPath) {
        $packageJson = Get-Content $packageJsonPath | ConvertFrom-Json
        $packageJson.version = $Version
        $packageJson | ConvertTo-Json -Depth 10 | Set-Content $packageJsonPath
        Write-Host "✅ Updated $packageJsonPath" -ForegroundColor Green
    }
    
    # 更新Cargo.toml
    if (Test-Path $cargoTomlPath) {
        $cargoContent = Get-Content $cargoTomlPath
        $cargoContent = $cargoContent -replace 'version = "\d+\.\d+\.\d+"', "version = `"$Version`""
        Set-Content $cargoTomlPath $cargoContent
        Write-Host "✅ Updated $cargoTomlPath" -ForegroundColor Green
    }
} else {
    Write-Host "🔍 [DRY RUN] Would update version to $Version in:" -ForegroundColor Yellow
    Write-Host "  - $tauriConfigPath" -ForegroundColor Gray
    Write-Host "  - $packageJsonPath" -ForegroundColor Gray
    Write-Host "  - $cargoTomlPath" -ForegroundColor Gray
}

# 构建应用
if (!$SkipBuild) {
    Write-Host "🔧 Building release version..." -ForegroundColor Blue
    
    if (!$DryRun) {
        try {
            & "scripts/build-tauri.ps1" -Clean
            Write-Host "✅ Build completed successfully" -ForegroundColor Green
        } catch {
            Write-Host "❌ Build failed" -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "🔍 [DRY RUN] Would run: scripts/build-tauri.ps1 -Clean" -ForegroundColor Yellow
    }
} else {
    Write-Host "⏭️ Skipping build step" -ForegroundColor Yellow
}

# 创建Git标签
Write-Host "🏷️ Creating Git tag..." -ForegroundColor Blue

$tagName = "v$Version"
if (!$DryRun) {
    try {
        git add .
        git commit -m "🚀 Release version $Version

✅ Version Updates:
- Updated Tauri configuration to v$Version
- Updated package.json to v$Version  
- Updated Cargo.toml to v$Version

📦 Release Notes:
- Tauri desktop application
- Cross-platform support (Windows, macOS, Linux)
- Modern knowledge management features
- High performance Rust backend
- React frontend with Tailwind CSS

🎯 Installation:
- Download the appropriate installer for your platform
- Run the installer and follow the setup wizard
- Launch MingLog from your applications menu

🔗 Links:
- GitHub: https://github.com/MMR-MINGriyue/MingLog
- Documentation: See docs/ directory
- Issues: https://github.com/MMR-MINGriyue/MingLog/issues"

        git tag -a $tagName -m "Release version $Version"
        Write-Host "✅ Created tag: $tagName" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to create Git tag" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "🔍 [DRY RUN] Would create tag: $tagName" -ForegroundColor Yellow
}

# 显示发布信息
Write-Host ""
Write-Host "🎉 Release preparation completed!" -ForegroundColor Green
Write-Host ""

if (!$DryRun) {
    Write-Host "📋 Release Summary:" -ForegroundColor Blue
    Write-Host "  Version: $Version" -ForegroundColor White
    Write-Host "  Tag: $tagName" -ForegroundColor White
    Write-Host "  Build: Completed" -ForegroundColor White
    Write-Host ""
    
    Write-Host "📦 Next steps:" -ForegroundColor Blue
    Write-Host "1. Push the tag: git push origin $tagName" -ForegroundColor White
    Write-Host "2. Create GitHub release with build artifacts" -ForegroundColor White
    Write-Host "3. Upload installers to distribution channels" -ForegroundColor White
    Write-Host "4. Update documentation and changelog" -ForegroundColor White
    Write-Host "5. Announce the release" -ForegroundColor White
} else {
    Write-Host "🔍 This was a dry run. No changes were made." -ForegroundColor Yellow
    Write-Host "Run without -DryRun to execute the release." -ForegroundColor Yellow
}

Write-Host ""
