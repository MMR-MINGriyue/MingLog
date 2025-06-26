# MingLog Beta Release Script
param(
    [Parameter(Mandatory=$false)]
    [string]$Version = "",
    
    [Parameter(Mandatory=$false)]
    [switch]$DryRun = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipBuild = $false
)

Write-Host "🚀 MingLog Beta Release Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Check if we're in the right directory
if (!(Test-Path "package.json")) {
    Write-Host "❌ Error: package.json not found. Please run this script from the project root." -ForegroundColor Red
    exit 1
}

# Get current version from package.json
$currentVersion = (Get-Content "package.json" | ConvertFrom-Json).version
Write-Host "📦 Current version: $currentVersion" -ForegroundColor Yellow

# Generate beta version if not provided
if ([string]::IsNullOrEmpty($Version)) {
    $baseVersion = $currentVersion -replace '-beta.*', ''
    $timestamp = Get-Date -Format "yyyyMMddHHmm"
    $Version = "$baseVersion-beta.$timestamp"
}

Write-Host "🎯 Target version: $Version" -ForegroundColor Green

if ($DryRun) {
    Write-Host "🔍 DRY RUN MODE - No changes will be made" -ForegroundColor Yellow
}

# Confirm release
if (!$DryRun) {
    $confirm = Read-Host "Do you want to create a beta release for version $Version? (y/N)"
    if ($confirm -ne "y" -and $confirm -ne "Y") {
        Write-Host "❌ Release cancelled." -ForegroundColor Red
        exit 0
    }
}

try {
    # Check git status
    $gitStatus = git status --porcelain
    if ($gitStatus -and !$DryRun) {
        Write-Host "⚠️  Warning: You have uncommitted changes:" -ForegroundColor Yellow
        Write-Host $gitStatus -ForegroundColor Yellow
        $confirm = Read-Host "Continue anyway? (y/N)"
        if ($confirm -ne "y" -and $confirm -ne "Y") {
            Write-Host "❌ Release cancelled." -ForegroundColor Red
            exit 0
        }
    }

    # Install dependencies
    if (!$SkipBuild) {
        Write-Host "📦 Installing dependencies..." -ForegroundColor Blue
        if (!$DryRun) {
            pnpm install --frozen-lockfile
            if ($LASTEXITCODE -ne 0) {
                throw "Failed to install dependencies"
            }
        }

        # Build web app
        Write-Host "🔨 Building web app..." -ForegroundColor Blue
        if (!$DryRun) {
            pnpm run web:build
            if ($LASTEXITCODE -ne 0) {
                throw "Failed to build web app"
            }
        }

        # Build desktop app
        Write-Host "🔨 Building desktop app..." -ForegroundColor Blue
        if (!$DryRun) {
            pnpm run desktop:build
            if ($LASTEXITCODE -ne 0) {
                throw "Failed to build desktop app"
            }
        }
    }

    # Update version in package.json files
    Write-Host "📝 Updating version numbers..." -ForegroundColor Blue
    if (!$DryRun) {
        # Update root package.json
        npm version $Version --no-git-tag-version
        
        # Update desktop package.json
        Set-Location "apps/desktop"
        npm version $Version --no-git-tag-version
        Set-Location "../.."
    }

    # Create git tag
    $tag = "v$Version"
    Write-Host "🏷️  Creating git tag: $tag" -ForegroundColor Blue
    if (!$DryRun) {
        git add package.json apps/desktop/package.json
        git commit -m "chore: bump version to $Version"
        git tag $tag
        git push origin $tag
        git push origin HEAD
    }

    # Trigger GitHub Actions
    Write-Host "🚀 GitHub Actions will automatically build and release the desktop app" -ForegroundColor Green
    Write-Host "📊 Monitor progress at: https://github.com/MMR-MINGriyue/MingLog/actions" -ForegroundColor Cyan
    
    if (!$DryRun) {
        Write-Host "✅ Beta release $Version initiated successfully!" -ForegroundColor Green
        Write-Host "🔗 Release will be available at: https://github.com/MMR-MINGriyue/MingLog/releases/tag/$tag" -ForegroundColor Cyan
    } else {
        Write-Host "✅ Dry run completed successfully!" -ForegroundColor Green
    }

} catch {
    Write-Host "❌ Error during release: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🎉 Release process completed!" -ForegroundColor Green
