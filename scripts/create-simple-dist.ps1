# Simple MingLog Desktop Distribution Creator
param(
    [string]$Version = "1.5.0"
)

Write-Host "Creating MingLog Desktop Distribution Package v$Version" -ForegroundColor Green

# Create distribution directory
$DistPath = "dist-release"
if (Test-Path $DistPath) {
    Remove-Item $DistPath -Recurse -Force
}
New-Item -ItemType Directory -Path $DistPath -Force | Out-Null

# Copy executable
$ExePath = "apps\tauri-desktop\src-tauri\target\release\minglog-desktop.exe"
if (Test-Path $ExePath) {
    Copy-Item $ExePath $DistPath
    Write-Host "Copied executable: minglog-desktop.exe" -ForegroundColor Green
} else {
    Write-Host "Executable not found: $ExePath" -ForegroundColor Red
    exit 1
}

# Create launch script
$LaunchScript = "@echo off`r`necho Starting MingLog Desktop...`r`nstart `"`" `"%~dp0minglog-desktop.exe`""
$LaunchScript | Out-File -FilePath "$DistPath\Start-MingLog.bat" -Encoding ASCII

# Copy documentation
$DocsToInclude = @("README.md", "LICENSE", "CHANGELOG.md")
foreach ($doc in $DocsToInclude) {
    if (Test-Path $doc) {
        Copy-Item $doc $DistPath
        Write-Host "Copied documentation: $doc" -ForegroundColor Green
    }
}

# Create README
$ReadmeContent = "# MingLog Desktop Application v$Version`r`n`r`n"
$ReadmeContent += "## Installation`r`n"
$ReadmeContent += "1. Extract to desired location`r`n"
$ReadmeContent += "2. Run Start-MingLog.bat or minglog-desktop.exe`r`n`r`n"
$ReadmeContent += "## System Requirements`r`n"
$ReadmeContent += "- Windows 10 or higher`r`n"
$ReadmeContent += "- 100MB disk space`r`n"
$ReadmeContent += "- 4GB RAM recommended`r`n`r`n"
$ReadmeContent += "Build Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')`r`n"
$ReadmeContent | Out-File -FilePath "$DistPath\INSTALL.txt" -Encoding UTF8

# Get file info
$ExeInfo = Get-Item "$DistPath\minglog-desktop.exe"
$SizeMB = [math]::Round($ExeInfo.Length / 1MB, 2)

# Create version info
$VersionInfo = @{
    version = $Version
    buildDate = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    executableSize = "$SizeMB MB"
    platform = "Windows x64"
} | ConvertTo-Json -Depth 2
$VersionInfo | Out-File -FilePath "$DistPath\version.json" -Encoding UTF8

# Create ZIP package
$ZipPath = "MingLog-Desktop-v$Version-Windows.zip"
if (Test-Path $ZipPath) {
    Remove-Item $ZipPath -Force
}

try {
    Compress-Archive -Path "$DistPath\*" -DestinationPath $ZipPath -CompressionLevel Optimal
    Write-Host "Created ZIP package: $ZipPath" -ForegroundColor Green
} catch {
    Write-Host "Failed to create ZIP: $_" -ForegroundColor Red
}

# Display results
Write-Host "`nDistribution Package Created Successfully!" -ForegroundColor Green
Write-Host "Directory: $DistPath" -ForegroundColor Cyan
Write-Host "ZIP Package: $ZipPath" -ForegroundColor Cyan
Write-Host "Executable Size: $SizeMB MB" -ForegroundColor Cyan

Write-Host "`nPackage Contents:" -ForegroundColor Yellow
Get-ChildItem $DistPath | ForEach-Object {
    $size = if ($_.PSIsContainer) { "Folder" } else { "$([math]::Round($_.Length / 1KB, 1)) KB" }
    Write-Host "  - $($_.Name) ($size)" -ForegroundColor White
}
