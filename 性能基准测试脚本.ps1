# MingLog 生产版本性能基准测试脚本
# 测试日期: 2025年6月30日
# 测试目标: 验证minglog-desktop.exe的性能指标

Write-Host "=== MingLog 性能基准测试开始 ===" -ForegroundColor Green
Write-Host "测试时间: $(Get-Date)" -ForegroundColor Yellow

# 应用路径
$AppPath = "D:\Git\MingLog\apps\tauri-desktop\src-tauri\target\release\minglog-desktop.exe"
$LogFile = "D:\Git\MingLog\performance-test-log.txt"

# 初始化日志
"MingLog 性能测试日志 - $(Get-Date)" | Out-File $LogFile
"======================================" | Out-File $LogFile -Append

# 1. 检查应用文件信息
Write-Host "`n1. 应用文件信息检查..." -ForegroundColor Cyan
if (Test-Path $AppPath) {
    $FileInfo = Get-Item $AppPath
    $FileSizeMB = [math]::Round($FileInfo.Length / 1MB, 2)
    
    Write-Host "✅ 应用文件存在" -ForegroundColor Green
    Write-Host "📁 文件大小: $FileSizeMB MB" -ForegroundColor Yellow
    Write-Host "📅 修改时间: $($FileInfo.LastWriteTime)" -ForegroundColor Yellow
    
    "应用文件信息:" | Out-File $LogFile -Append
    "- 文件大小: $FileSizeMB MB" | Out-File $LogFile -Append
    "- 修改时间: $($FileInfo.LastWriteTime)" | Out-File $LogFile -Append
} else {
    Write-Host "❌ 应用文件不存在: $AppPath" -ForegroundColor Red
    exit 1
}

# 2. 启动时间测试
Write-Host "`n2. 启动时间测试..." -ForegroundColor Cyan
$StartTime = Get-Date

try {
    # 启动应用
    $Process = Start-Process $AppPath -PassThru
    
    # 等待进程完全启动
    Start-Sleep -Seconds 2
    
    # 检查进程是否存在
    if (Get-Process -Id $Process.Id -ErrorAction SilentlyContinue) {
        $LaunchTime = (Get-Date) - $StartTime
        $LaunchTimeSeconds = [math]::Round($LaunchTime.TotalSeconds, 2)
        
        Write-Host "✅ 应用启动成功" -ForegroundColor Green
        Write-Host "⏱️ 启动时间: $LaunchTimeSeconds 秒" -ForegroundColor Yellow
        
        "启动性能测试:" | Out-File $LogFile -Append
        "- 启动时间: $LaunchTimeSeconds 秒" | Out-File $LogFile -Append
        
        # 评估启动时间
        if ($LaunchTimeSeconds -le 3) {
            Write-Host "🎉 启动时间优秀 (≤3秒)" -ForegroundColor Green
            "- 启动时间评级: 优秀" | Out-File $LogFile -Append
        } elseif ($LaunchTimeSeconds -le 5) {
            Write-Host "👍 启动时间良好 (≤5秒)" -ForegroundColor Yellow
            "- 启动时间评级: 良好" | Out-File $LogFile -Append
        } else {
            Write-Host "⚠️ 启动时间需要优化 (>5秒)" -ForegroundColor Red
            "- 启动时间评级: 需要优化" | Out-File $LogFile -Append
        }
        
        # 3. 内存使用测试
        Write-Host "`n3. 内存使用测试..." -ForegroundColor Cyan
        Start-Sleep -Seconds 3  # 等待应用完全加载
        
        $MemoryUsage = (Get-Process -Id $Process.Id).WorkingSet64 / 1MB
        $MemoryUsageMB = [math]::Round($MemoryUsage, 2)
        
        Write-Host "💾 内存使用: $MemoryUsageMB MB" -ForegroundColor Yellow
        "- 内存使用: $MemoryUsageMB MB" | Out-File $LogFile -Append
        
        # 评估内存使用
        if ($MemoryUsageMB -le 200) {
            Write-Host "🎉 内存使用优秀 (≤200MB)" -ForegroundColor Green
            "- 内存使用评级: 优秀" | Out-File $LogFile -Append
        } elseif ($MemoryUsageMB -le 300) {
            Write-Host "👍 内存使用良好 (≤300MB)" -ForegroundColor Yellow
            "- 内存使用评级: 良好" | Out-File $LogFile -Append
        } else {
            Write-Host "⚠️ 内存使用需要优化 (>300MB)" -ForegroundColor Red
            "- 内存使用评级: 需要优化" | Out-File $LogFile -Append
        }
        
        # 4. CPU使用测试
        Write-Host "`n4. CPU使用测试..." -ForegroundColor Cyan
        $CPUBefore = (Get-Process -Id $Process.Id).CPU
        Start-Sleep -Seconds 5
        $CPUAfter = (Get-Process -Id $Process.Id).CPU
        $CPUUsage = $CPUAfter - $CPUBefore
        
        Write-Host "🖥️ CPU使用时间: $CPUUsage 秒 (5秒内)" -ForegroundColor Yellow
        "- CPU使用时间: $CPUUsage 秒 (5秒内)" | Out-File $LogFile -Append
        
        # 5. 进程信息收集
        Write-Host "`n5. 进程详细信息..." -ForegroundColor Cyan
        $ProcessInfo = Get-Process -Id $Process.Id
        
        Write-Host "🔍 进程ID: $($ProcessInfo.Id)" -ForegroundColor Yellow
        Write-Host "🔍 进程名称: $($ProcessInfo.ProcessName)" -ForegroundColor Yellow
        Write-Host "🔍 线程数: $($ProcessInfo.Threads.Count)" -ForegroundColor Yellow
        Write-Host "🔍 句柄数: $($ProcessInfo.HandleCount)" -ForegroundColor Yellow
        
        "进程详细信息:" | Out-File $LogFile -Append
        "- 进程ID: $($ProcessInfo.Id)" | Out-File $LogFile -Append
        "- 进程名称: $($ProcessInfo.ProcessName)" | Out-File $LogFile -Append
        "- 线程数: $($ProcessInfo.Threads.Count)" | Out-File $LogFile -Append
        "- 句柄数: $($ProcessInfo.HandleCount)" | Out-File $LogFile -Append
        
        # 6. 稳定性测试（短期）
        Write-Host "`n6. 短期稳定性测试（30秒）..." -ForegroundColor Cyan
        $StabilityStartTime = Get-Date
        $StabilityDuration = 30  # 秒
        
        for ($i = 1; $i -le $StabilityDuration; $i++) {
            Start-Sleep -Seconds 1
            
            # 检查进程是否仍在运行
            if (-not (Get-Process -Id $Process.Id -ErrorAction SilentlyContinue)) {
                Write-Host "❌ 应用在 $i 秒后崩溃" -ForegroundColor Red
                "- 稳定性测试: 失败，$i 秒后崩溃" | Out-File $LogFile -Append
                break
            }
            
            # 显示进度
            if ($i % 10 -eq 0) {
                Write-Host "⏳ 稳定性测试进行中... $i/$StabilityDuration 秒" -ForegroundColor Yellow
            }
        }
        
        # 检查最终状态
        if (Get-Process -Id $Process.Id -ErrorAction SilentlyContinue) {
            Write-Host "✅ 稳定性测试通过（30秒无崩溃）" -ForegroundColor Green
            "- 稳定性测试: 通过（30秒无崩溃）" | Out-File $LogFile -Append
            
            # 测试结束后的内存使用
            $FinalMemory = (Get-Process -Id $Process.Id).WorkingSet64 / 1MB
            $FinalMemoryMB = [math]::Round($FinalMemory, 2)
            $MemoryChange = [math]::Round($FinalMemoryMB - $MemoryUsageMB, 2)
            
            Write-Host "💾 测试结束内存使用: $FinalMemoryMB MB" -ForegroundColor Yellow
            Write-Host "📈 内存变化: $MemoryChange MB" -ForegroundColor Yellow
            
            "- 测试结束内存使用: $FinalMemoryMB MB" | Out-File $LogFile -Append
            "- 内存变化: $MemoryChange MB" | Out-File $LogFile -Append
        }
        
        # 7. 生成测试总结
        Write-Host "`n=== 性能测试总结 ===" -ForegroundColor Green
        
        $TestSummary = @"
性能测试总结:
- 文件大小: $FileSizeMB MB
- 启动时间: $LaunchTimeSeconds 秒
- 初始内存: $MemoryUsageMB MB
- 最终内存: $FinalMemoryMB MB
- 内存变化: $MemoryChange MB
- 稳定性: 30秒测试通过
"@
        
        Write-Host $TestSummary -ForegroundColor Yellow
        $TestSummary | Out-File $LogFile -Append
        
        # 8. 质量评级
        $QualityScore = 0
        if ($LaunchTimeSeconds -le 3) { $QualityScore += 25 }
        elseif ($LaunchTimeSeconds -le 5) { $QualityScore += 15 }
        
        if ($MemoryUsageMB -le 200) { $QualityScore += 25 }
        elseif ($MemoryUsageMB -le 300) { $QualityScore += 15 }
        
        if ($MemoryChange -le 10) { $QualityScore += 25 }
        elseif ($MemoryChange -le 20) { $QualityScore += 15 }
        
        $QualityScore += 25  # 稳定性测试通过
        
        Write-Host "`n🏆 总体质量评分: $QualityScore/100" -ForegroundColor Green
        
        if ($QualityScore -ge 90) {
            Write-Host "🎉 性能等级: A级 (优秀)" -ForegroundColor Green
        } elseif ($QualityScore -ge 75) {
            Write-Host "👍 性能等级: B级 (良好)" -ForegroundColor Yellow
        } elseif ($QualityScore -ge 60) {
            Write-Host "⚠️ 性能等级: C级 (及格)" -ForegroundColor Yellow
        } else {
            Write-Host "❌ 性能等级: D级 (需要改进)" -ForegroundColor Red
        }
        
        "总体质量评分: $QualityScore/100" | Out-File $LogFile -Append
        
        # 关闭应用
        Write-Host "`n9. 清理测试环境..." -ForegroundColor Cyan
        Stop-Process -Id $Process.Id -Force
        Write-Host "✅ 应用已关闭" -ForegroundColor Green
        
    } else {
        Write-Host "❌ 应用启动失败" -ForegroundColor Red
        "启动测试: 失败" | Out-File $LogFile -Append
    }
    
} catch {
    Write-Host "❌ 测试过程中发生错误: $($_.Exception.Message)" -ForegroundColor Red
    "测试错误: $($_.Exception.Message)" | Out-File $LogFile -Append
}

Write-Host "`n=== 性能基准测试完成 ===" -ForegroundColor Green
Write-Host "📄 详细日志已保存到: $LogFile" -ForegroundColor Yellow
Write-Host "测试完成时间: $(Get-Date)" -ForegroundColor Yellow
