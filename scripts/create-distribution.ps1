# MingLog桌面应用分发包创建脚本
# 创建生产就绪的分发包

param(
    [string]$Version = "1.5.0",
    [string]$OutputDir = "dist-release"
)

Write-Host "🚀 创建MingLog桌面应用分发包" -ForegroundColor Green
Write-Host "版本: $Version" -ForegroundColor Cyan

# 创建分发目录
$DistPath = Join-Path $PSScriptRoot "..\$OutputDir"
if (Test-Path $DistPath) {
    Remove-Item $DistPath -Recurse -Force
}
New-Item -ItemType Directory -Path $DistPath -Force | Out-Null

# 复制可执行文件
$ExePath = Join-Path $PSScriptRoot "..\apps\tauri-desktop\src-tauri\target\release\minglog-desktop.exe"
if (Test-Path $ExePath) {
    Copy-Item $ExePath $DistPath
    Write-Host "✅ 复制可执行文件: minglog-desktop.exe" -ForegroundColor Green
} else {
    Write-Host "❌ 可执行文件不存在: $ExePath" -ForegroundColor Red
    exit 1
}

# 创建启动脚本
$LaunchScript = "@echo off`r`necho Starting MingLog Desktop...`r`nstart `"`" `"%~dp0minglog-desktop.exe`""
$LaunchScript | Out-File -FilePath (Join-Path $DistPath "Start-MingLog.bat") -Encoding ASCII

# 复制文档文件
$DocsToInclude = @(
    "README.md",
    "LICENSE",
    "CHANGELOG.md"
)

foreach ($doc in $DocsToInclude) {
    $SourcePath = Join-Path $PSScriptRoot "..\$doc"
    if (Test-Path $SourcePath) {
        Copy-Item $SourcePath $DistPath
        Write-Host "✅ 复制文档: $doc" -ForegroundColor Green
    }
}

# 创建安装说明
$InstallGuide = "# MingLog Desktop Application v$Version`r`n`r`n"
$InstallGuide += "## Installation Instructions`r`n`r`n"
$InstallGuide += "1. Extract this folder to your desired installation location`r`n"
$InstallGuide += "2. Double-click Start-MingLog.bat or run minglog-desktop.exe directly`r`n"
$InstallGuide += "3. On first run, the application will automatically create necessary database files`r`n`r`n"
$InstallGuide += "## System Requirements`r`n`r`n"
$InstallGuide += "- Windows 10 or higher`r`n"
$InstallGuide += "- At least 100MB available disk space`r`n"
$InstallGuide += "- Recommended memory: 4GB or more`r`n`r`n"
$InstallGuide += "## Features`r`n`r`n"
$InstallGuide += "- Modern knowledge management interface`r`n"
$InstallGuide += "- High-performance database storage`r`n"
$InstallGuide += "- Intelligent search functionality`r`n"
$InstallGuide += "- Performance monitoring and optimization`r`n"
$InstallGuide += "- Markdown format support`r`n`r`n"
$InstallGuide += "## Technical Support`r`n`r`n"
$InstallGuide += "For issues, please visit the project homepage or contact technical support.`r`n`r`n"
$InstallGuide += "---`r`n"
$InstallGuide += "Build Time: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`r`n"
$InstallGuide += "Build Version: $Version`r`n"

$InstallGuide | Out-File -FilePath (Join-Path $DistPath "README.txt") -Encoding UTF8

# 获取文件信息
$ExeInfo = Get-Item (Join-Path $DistPath "minglog-desktop.exe")
$SizeMB = [math]::Round($ExeInfo.Length / 1MB, 2)

# 创建版本信息文件
$VersionInfo = @{
    version = $Version
    buildDate = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    executableSize = "$SizeMB MB"
    platform = "Windows x64"
    architecture = "x86_64"
} | ConvertTo-Json -Depth 2

$VersionInfo | Out-File -FilePath (Join-Path $DistPath "version.json") -Encoding UTF8

# 创建压缩包
$ZipPath = Join-Path $PSScriptRoot "..\MingLog-Desktop-v$Version-Windows.zip"
if (Test-Path $ZipPath) {
    Remove-Item $ZipPath -Force
}

try {
    Compress-Archive -Path "$DistPath\*" -DestinationPath $ZipPath -CompressionLevel Optimal
    Write-Host "✅ 创建压缩包: MingLog-Desktop-v$Version-Windows.zip" -ForegroundColor Green
} catch {
    Write-Host "❌ 创建压缩包失败: $_" -ForegroundColor Red
}

# 显示分发包信息
Write-Host "`n📦 分发包创建完成!" -ForegroundColor Green
Write-Host "分发目录: $DistPath" -ForegroundColor Cyan
Write-Host "压缩包: $ZipPath" -ForegroundColor Cyan
Write-Host "可执行文件大小: $SizeMB MB" -ForegroundColor Cyan

# 列出分发包内容
Write-Host "`nDistribution Package Contents:" -ForegroundColor Yellow
Get-ChildItem $DistPath | ForEach-Object {
    $size = if ($_.PSIsContainer) { "Folder" } else { "$([math]::Round($_.Length / 1KB, 1)) KB" }
    Write-Host "  - $($_.Name) ($size)" -ForegroundColor White
}

Write-Host "`nMingLog Desktop Distribution Package Created Successfully!" -ForegroundColor Green
