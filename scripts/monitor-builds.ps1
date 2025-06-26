#!/usr/bin/env pwsh

Write-Host "📊 MingLog Build Status Monitor" -ForegroundColor Green

# Configuration
$REPO = "MMR-MINGriyue/MingLog"
$API_BASE = "https://api.github.com/repos/$REPO"

function Get-BuildStatus {
    param(
        [int]$Count = 10
    )
    
    try {
        Write-Host "`n🔍 Fetching latest $Count builds..." -ForegroundColor Yellow
        
        # Get latest workflow runs
        $response = Invoke-RestMethod -Uri "$API_BASE/actions/runs?per_page=$Count" -Headers @{
            "Accept" = "application/vnd.github.v3+json"
            "User-Agent" = "MingLog-Build-Monitor"
        }
        
        Write-Host "`n📈 Build Status Summary:" -ForegroundColor Cyan
        Write-Host "Total builds found: $($response.total_count)" -ForegroundColor White
        
        $successCount = 0
        $failureCount = 0
        $inProgressCount = 0
        
        foreach ($run in $response.workflow_runs) {
            $status = $run.conclusion
            $workflow = $run.name
            $branch = $run.head_branch
            $time = [DateTime]::Parse($run.created_at).ToString("MM-dd HH:mm")
            
            switch ($status) {
                "success" { 
                    Write-Host "✅ $workflow ($branch) - $time" -ForegroundColor Green
                    $successCount++
                }
                "failure" { 
                    Write-Host "❌ $workflow ($branch) - $time" -ForegroundColor Red
                    $failureCount++
                }
                "cancelled" { 
                    Write-Host "⏹️  $workflow ($branch) - $time" -ForegroundColor Yellow
                    $failureCount++
                }
                $null { 
                    Write-Host "🔄 $workflow ($branch) - $time (In Progress)" -ForegroundColor Blue
                    $inProgressCount++
                }
                default { 
                    Write-Host "❓ $workflow ($branch) - $time ($status)" -ForegroundColor Gray
                }
            }
        }
        
        Write-Host "`n📊 Statistics:" -ForegroundColor Cyan
        Write-Host "✅ Successful: $successCount" -ForegroundColor Green
        Write-Host "❌ Failed: $failureCount" -ForegroundColor Red
        Write-Host "🔄 In Progress: $inProgressCount" -ForegroundColor Blue
        
        $successRate = if (($successCount + $failureCount) -gt 0) { 
            [math]::Round(($successCount / ($successCount + $failureCount)) * 100, 1) 
        } else { 0 }
        
        Write-Host "📈 Success Rate: $successRate%" -ForegroundColor $(if ($successRate -gt 80) { "Green" } elseif ($successRate -gt 50) { "Yellow" } else { "Red" })
        
        # Find last successful build
        $lastSuccess = $response.workflow_runs | Where-Object { $_.conclusion -eq "success" } | Select-Object -First 1
        if ($lastSuccess) {
            $lastSuccessTime = [DateTime]::Parse($lastSuccess.created_at).ToString("MM-dd HH:mm")
            Write-Host "🏆 Last Success: $($lastSuccess.head_branch) at $lastSuccessTime" -ForegroundColor Green
        } else {
            Write-Host "⚠️  No successful builds found in recent history" -ForegroundColor Yellow
        }
        
    } catch {
        Write-Host "❌ Error fetching build status: $_" -ForegroundColor Red
    }
}

function Get-LatestRelease {
    try {
        Write-Host "`n🚀 Latest Release Information:" -ForegroundColor Cyan
        
        $release = Invoke-RestMethod -Uri "$API_BASE/releases/latest" -Headers @{
            "Accept" = "application/vnd.github.v3+json"
            "User-Agent" = "MingLog-Build-Monitor"
        }
        
        $releaseTime = [DateTime]::Parse($release.created_at).ToString("MM-dd HH:mm")
        Write-Host "📦 Version: $($release.tag_name)" -ForegroundColor White
        Write-Host "📅 Released: $releaseTime" -ForegroundColor White
        Write-Host "📝 Title: $($release.name)" -ForegroundColor White
        Write-Host "📊 Downloads: $($release.assets.Count) assets" -ForegroundColor White
        
        if ($release.assets.Count -gt 0) {
            Write-Host "`n📁 Assets:" -ForegroundColor Yellow
            foreach ($asset in $release.assets) {
                $size = [math]::Round($asset.size / 1MB, 1)
                Write-Host "   • $($asset.name) ($size MB, $($asset.download_count) downloads)" -ForegroundColor White
            }
        }
        
    } catch {
        Write-Host "❌ Error fetching release info: $_" -ForegroundColor Red
    }
}

function Show-BuildHealth {
    Write-Host "`n🏥 Build Health Assessment:" -ForegroundColor Cyan
    
    # Check if we're in project directory
    if (Test-Path "apps/desktop/package.json") {
        Write-Host "✅ Project structure: Valid" -ForegroundColor Green
    } else {
        Write-Host "❌ Project structure: Invalid (run from project root)" -ForegroundColor Red
        return
    }
    
    # Check critical files
    $criticalFiles = @(
        ".github/workflows/release-desktop.yml",
        "apps/desktop/src/main.ts",
        "apps/desktop/src/preload.ts",
        "apps/desktop/tsconfig.main.json",
        "apps/desktop/tsconfig.preload.json"
    )
    
    foreach ($file in $criticalFiles) {
        if (Test-Path $file) {
            Write-Host "✅ $file: Present" -ForegroundColor Green
        } else {
            Write-Host "❌ $file: Missing" -ForegroundColor Red
        }
    }
    
    # Check package.json versions
    try {
        $desktopPkg = Get-Content "apps/desktop/package.json" | ConvertFrom-Json
        Write-Host "📦 Desktop App Version: $($desktopPkg.version)" -ForegroundColor White
        Write-Host "⚡ Electron Version: $($desktopPkg.devDependencies.electron)" -ForegroundColor White
        Write-Host "📝 TypeScript Version: $($desktopPkg.devDependencies.typescript)" -ForegroundColor White
    } catch {
        Write-Host "❌ Error reading package.json: $_" -ForegroundColor Red
    }
}

# Main execution
Write-Host "Starting build monitoring..." -ForegroundColor White

Get-BuildStatus -Count 15
Get-LatestRelease
Show-BuildHealth

Write-Host "`n💡 Recommendations:" -ForegroundColor Cyan
Write-Host "   • Run './scripts/validate-build.ps1' before pushing changes" -ForegroundColor White
Write-Host "   • Monitor success rate - aim for >90%" -ForegroundColor White
Write-Host "   • If builds fail, check logs with GitHub Actions artifacts" -ForegroundColor White
Write-Host "   • Use 'git checkout v0.1.0-beta.20' as stable baseline" -ForegroundColor White

Write-Host "`n✨ Build monitoring completed!" -ForegroundColor Green
