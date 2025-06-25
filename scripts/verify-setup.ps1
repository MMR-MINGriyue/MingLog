# MingLog 项目验证脚本
Write-Host "🔍 MingLog 项目验证开始..." -ForegroundColor Green

# 检查项目名称
Write-Host "📋 检查项目配置..." -ForegroundColor Yellow

# 检查根目录 package.json
$rootPackage = Get-Content "package.json" | ConvertFrom-Json
if ($rootPackage.name -eq "minglog") {
    Write-Host "✅ 根目录 package.json 名称正确: $($rootPackage.name)" -ForegroundColor Green
} else {
    Write-Host "❌ 根目录 package.json 名称错误: $($rootPackage.name)" -ForegroundColor Red
}

# 检查各个包的名称
$packages = @(
    @{Path="packages/core/package.json"; ExpectedName="@minglog/core"},
    @{Path="packages/database/package.json"; ExpectedName="@minglog/database"},
    @{Path="packages/ui/package.json"; ExpectedName="@minglog/ui"},
    @{Path="packages/editor/package.json"; ExpectedName="@minglog/editor"},
    @{Path="apps/web/package.json"; ExpectedName="minglog-web"}
)

foreach ($pkg in $packages) {
    if (Test-Path $pkg.Path) {
        $packageJson = Get-Content $pkg.Path | ConvertFrom-Json
        if ($packageJson.name -eq $pkg.ExpectedName) {
            Write-Host "✅ $($pkg.Path) 名称正确: $($packageJson.name)" -ForegroundColor Green
        } else {
            Write-Host "❌ $($pkg.Path) 名称错误: $($packageJson.name), 期望: $($pkg.ExpectedName)" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ 文件不存在: $($pkg.Path)" -ForegroundColor Red
    }
}

# 检查文档中的项目名称
Write-Host "`n📚 检查文档..." -ForegroundColor Yellow

$docs = @(
    "README.md",
    "docs/quick-start.md",
    "docs/roadmap.md",
    "docs/development.md",
    "SUMMARY.md"
)

foreach ($doc in $docs) {
    if (Test-Path $doc) {
        $content = Get-Content $doc -Raw
        if ($content -match "MingLog") {
            Write-Host "✅ $doc 包含 MingLog 引用" -ForegroundColor Green
        } else {
            Write-Host "⚠️  $doc 可能需要更新项目名称" -ForegroundColor Yellow
        }
    } else {
        Write-Host "❌ 文档不存在: $doc" -ForegroundColor Red
    }
}

# 检查环境依赖
Write-Host "`n🔧 检查环境依赖..." -ForegroundColor Yellow

# 检查 Node.js
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js 版本: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js 未安装或不在 PATH 中" -ForegroundColor Red
}

# 检查 pnpm
try {
    $pnpmVersion = pnpm --version
    Write-Host "✅ pnpm 版本: $pnpmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ pnpm 未安装或不在 PATH 中" -ForegroundColor Red
}

# 检查项目结构
Write-Host "`n📁 检查项目结构..." -ForegroundColor Yellow

$requiredDirs = @(
    "apps/web",
    "packages/core",
    "packages/database", 
    "packages/ui",
    "packages/editor",
    "docs",
    "scripts"
)

foreach ($dir in $requiredDirs) {
    if (Test-Path $dir) {
        Write-Host "✅ 目录存在: $dir" -ForegroundColor Green
    } else {
        Write-Host "❌ 目录缺失: $dir" -ForegroundColor Red
    }
}

# 检查关键文件
$requiredFiles = @(
    "package.json",
    "pnpm-workspace.yaml",
    "tsconfig.json",
    "turbo.json",
    ".gitignore",
    "README.md"
)

foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "✅ 文件存在: $file" -ForegroundColor Green
    } else {
        Write-Host "❌ 文件缺失: $file" -ForegroundColor Red
    }
}

# 检查是否有 node_modules
if (Test-Path "node_modules") {
    Write-Host "✅ 依赖已安装 (node_modules 存在)" -ForegroundColor Green
} else {
    Write-Host "⚠️  依赖未安装，请运行 'pnpm install'" -ForegroundColor Yellow
}

Write-Host "`n🎉 验证完成！" -ForegroundColor Green
Write-Host "`n📋 下一步操作:" -ForegroundColor Cyan
Write-Host "1. 如果依赖未安装，运行: pnpm install" -ForegroundColor White
Write-Host "2. 初始化数据库: pnpm db:generate" -ForegroundColor White
Write-Host "3. 构建项目: pnpm build" -ForegroundColor White
Write-Host "4. 启动开发服务器: pnpm dev" -ForegroundColor White
Write-Host "5. 访问 http://localhost:3000" -ForegroundColor White

Write-Host "`n📚 更多信息请查看:" -ForegroundColor Cyan
Write-Host "- 快速启动: docs/quick-start.md" -ForegroundColor White
Write-Host "- 开发指南: docs/development.md" -ForegroundColor White
Write-Host "- 项目概览: PROJECT_OVERVIEW.md" -ForegroundColor White
