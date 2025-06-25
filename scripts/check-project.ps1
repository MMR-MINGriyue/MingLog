Write-Host "🔍 MingLog 项目检查..." -ForegroundColor Green

# 检查项目名称
Write-Host "📋 检查项目名称..." -ForegroundColor Yellow

$rootPackage = Get-Content "package.json" | ConvertFrom-Json
Write-Host "根目录项目名: $($rootPackage.name)" -ForegroundColor Cyan

# 检查README
if (Test-Path "README.md") {
    $readme = Get-Content "README.md" -Raw
    if ($readme -match "MingLog") {
        Write-Host "✅ README.md 包含 MingLog" -ForegroundColor Green
    } else {
        Write-Host "❌ README.md 未包含 MingLog" -ForegroundColor Red
    }
}

# 检查项目结构
Write-Host "📁 检查项目结构..." -ForegroundColor Yellow

$dirs = @("apps", "packages", "docs", "scripts")
foreach ($dir in $dirs) {
    if (Test-Path $dir) {
        Write-Host "✅ $dir 目录存在" -ForegroundColor Green
    } else {
        Write-Host "❌ $dir 目录缺失" -ForegroundColor Red
    }
}

# 检查环境
Write-Host "🔧 检查环境..." -ForegroundColor Yellow

try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js 未安装" -ForegroundColor Red
}

try {
    $pnpmVersion = pnpm --version  
    Write-Host "✅ pnpm: $pnpmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ pnpm 未安装" -ForegroundColor Red
}

Write-Host "🎉 检查完成！" -ForegroundColor Green
Write-Host "📚 查看 PROJECT_OVERVIEW.md 了解更多信息" -ForegroundColor Cyan
