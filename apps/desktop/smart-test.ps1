# MingLog 智能测试和修复系统
# 自动检测窗口状态、错误弹窗、识别错误并修复

param(
    [switch]$AutoFix = $true,
    [int]$MaxRetries = 3,
    [int]$TestTimeout = 30
)

# 颜色输出函数
function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    $colors = @{
        "Red" = [ConsoleColor]::Red
        "Green" = [ConsoleColor]::Green
        "Yellow" = [ConsoleColor]::Yellow
        "Cyan" = [ConsoleColor]::Cyan
        "Blue" = [ConsoleColor]::Blue
        "Magenta" = [ConsoleColor]::Magenta
        "White" = [ConsoleColor]::White
    }
    Write-Host $Message -ForegroundColor $colors[$Color]
}

# 测试结果记录
$TestResults = @{
    StartTime = Get-Date
    Tests = @()
    Errors = @()
    Fixes = @()
    Success = $false
}

function Add-TestResult {
    param([string]$TestName, [bool]$Passed, [string]$Message = "", [string]$Details = "")
    $TestResults.Tests += @{
        Name = $TestName
        Passed = $Passed
        Message = $Message
        Details = $Details
        Timestamp = Get-Date
    }
}

function Add-Error {
    param([string]$ErrorType, [string]$Message, [string]$Details = "")
    $TestResults.Errors += @{
        Type = $ErrorType
        Message = $Message
        Details = $Details
        Timestamp = Get-Date
    }
}

function Add-Fix {
    param([string]$FixType, [string]$Action, [bool]$Success)
    $TestResults.Fixes += @{
        Type = $FixType
        Action = $Action
        Success = $Success
        Timestamp = Get-Date
    }
}

# 检测应用程序文件
function Test-ApplicationFiles {
    Write-ColorOutput "🔍 检测应用程序文件..." "Cyan"
    
    $requiredFiles = @(
        "build\win-unpacked\MingLog.exe",
        "build\win-unpacked\resources\app\dist\main.js",
        "build\win-unpacked\resources\app\dist\preload.js"
    )
    
    $allFilesExist = $true
    foreach ($file in $requiredFiles) {
        if (Test-Path $file) {
            Write-ColorOutput "  ✅ $file" "Green"
        } else {
            Write-ColorOutput "  ❌ $file 缺失" "Red"
            Add-Error "MissingFile" "Required file missing: $file"
            $allFilesExist = $false
        }
    }
    
    Add-TestResult "ApplicationFiles" $allFilesExist "Application files check"
    return $allFilesExist
}

# 检测进程状态
function Test-ProcessStatus {
    Write-ColorOutput "🔍 检测进程状态..." "Cyan"
    
    $processes = Get-Process -Name "MingLog" -ErrorAction SilentlyContinue
    if ($processes) {
        Write-ColorOutput "  ✅ 找到 $($processes.Count) 个 MingLog 进程" "Green"
        foreach ($proc in $processes) {
            Write-ColorOutput "    进程ID: $($proc.Id), 内存: $([math]::Round($proc.WorkingSet64/1MB, 2))MB" "White"
        }
        Add-TestResult "ProcessStatus" $true "MingLog processes found: $($processes.Count)"
        return $true
    } else {
        Write-ColorOutput "  ❌ 未找到 MingLog 进程" "Red"
        Add-Error "ProcessNotFound" "MingLog process not running"
        Add-TestResult "ProcessStatus" $false "No MingLog processes found"
        return $false
    }
}

# 检测窗口状态
function Test-WindowStatus {
    Write-ColorOutput "🔍 检测窗口状态..." "Cyan"
    
    # 使用 Windows API 检测窗口
    Add-Type -TypeDefinition @"
        using System;
        using System.Runtime.InteropServices;
        using System.Text;
        public class WindowAPI {
            [DllImport("user32.dll")]
            public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);
            
            [DllImport("user32.dll")]
            public static extern bool IsWindowVisible(IntPtr hWnd);
            
            [DllImport("user32.dll")]
            public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
            
            [DllImport("user32.dll")]
            public static extern bool EnumWindows(EnumWindowsProc enumProc, IntPtr lParam);
            
            public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
        }
"@
    
    $minglogWindows = @()
    $callback = {
        param($hWnd, $lParam)
        $title = New-Object System.Text.StringBuilder 256
        [WindowAPI]::GetWindowText($hWnd, $title, 256)
        if ($title.ToString() -like "*MingLog*") {
            $minglogWindows += @{
                Handle = $hWnd
                Title = $title.ToString()
                Visible = [WindowAPI]::IsWindowVisible($hWnd)
            }
        }
        return $true
    }
    
    [WindowAPI]::EnumWindows($callback, [IntPtr]::Zero)
    
    if ($minglogWindows.Count -gt 0) {
        Write-ColorOutput "  ✅ 找到 $($minglogWindows.Count) 个 MingLog 窗口" "Green"
        foreach ($window in $minglogWindows) {
            $status = if ($window.Visible) { "可见" } else { "隐藏" }
            Write-ColorOutput "    窗口: $($window.Title) - $status" "White"
        }
        Add-TestResult "WindowStatus" $true "MingLog windows found: $($minglogWindows.Count)"
        return $true
    } else {
        Write-ColorOutput "  ❌ 未找到 MingLog 窗口" "Red"
        Add-Error "WindowNotFound" "No MingLog windows detected"
        Add-TestResult "WindowStatus" $false "No MingLog windows found"
        return $false
    }
}

# 检测错误弹窗
function Test-ErrorDialogs {
    Write-ColorOutput "🔍 检测错误弹窗..." "Cyan"
    
    $errorDialogs = @()
    $errorKeywords = @("Error", "错误", "Exception", "Failed", "失败", "Cannot", "Unable")
    
    $callback = {
        param($hWnd, $lParam)
        $title = New-Object System.Text.StringBuilder 256
        [WindowAPI]::GetWindowText($hWnd, $title, 256)
        $titleText = $title.ToString()
        
        foreach ($keyword in $errorKeywords) {
            if ($titleText -like "*$keyword*") {
                $errorDialogs += @{
                    Handle = $hWnd
                    Title = $titleText
                    Visible = [WindowAPI]::IsWindowVisible($hWnd)
                }
                break
            }
        }
        return $true
    }
    
    [WindowAPI]::EnumWindows($callback, [IntPtr]::Zero)
    
    if ($errorDialogs.Count -gt 0) {
        Write-ColorOutput "  ⚠️ 发现 $($errorDialogs.Count) 个错误弹窗" "Yellow"
        foreach ($dialog in $errorDialogs) {
            Write-ColorOutput "    错误弹窗: $($dialog.Title)" "Red"
            Add-Error "ErrorDialog" "Error dialog detected: $($dialog.Title)"
        }
        Add-TestResult "ErrorDialogs" $false "Error dialogs found: $($errorDialogs.Count)"
        return $false
    } else {
        Write-ColorOutput "  ✅ 未发现错误弹窗" "Green"
        Add-TestResult "ErrorDialogs" $true "No error dialogs found"
        return $true
    }
}

Write-ColorOutput "🧪 MingLog 智能测试和修复系统" "Cyan"
Write-ColorOutput "=================================" "Cyan"
Write-ColorOutput "开始时间: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" "White"
Write-ColorOutput ""

# 第一阶段：基础检测
Write-ColorOutput "📋 第一阶段：基础文件和环境检测" "Yellow"
$filesOK = Test-ApplicationFiles

if (-not $filesOK) {
    Write-ColorOutput "❌ 基础文件检测失败，无法继续测试" "Red"
    exit 1
}

Write-ColorOutput ""
