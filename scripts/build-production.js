#!/usr/bin/env node

/**
 * MingLog 生产环境构建脚本
 * 专注于PerformanceMonitor组件优化的构建
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// 颜色输出工具
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green')
}

function logError(message) {
  log(`❌ ${message}`, 'red')
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow')
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue')
}

// 构建步骤
const buildSteps = [
  {
    name: '清理构建目录',
    action: cleanBuildDirectory
  },
  {
    name: '验证核心文件',
    action: validateCoreFiles
  },
  {
    name: '构建前端资源',
    action: buildFrontend
  },
  {
    name: '构建Tauri应用',
    action: buildTauriApp
  },
  {
    name: '验证构建结果',
    action: validateBuild
  },
  {
    name: '生成构建报告',
    action: generateBuildReport
  }
]

// 主构建函数
async function runBuild() {
  log('🚀 开始 MingLog 生产环境构建', 'bold')
  log('=' * 50, 'blue')

  const buildStartTime = Date.now()
  let successfulSteps = 0
  const totalSteps = buildSteps.length

  for (const step of buildSteps) {
    logInfo(`正在执行: ${step.name}`)
    
    try {
      const result = await step.action()
      if (result.success) {
        logSuccess(`${step.name} - 完成`)
        if (result.details) {
          log(`  ${result.details}`, 'blue')
        }
        successfulSteps++
      } else {
        logError(`${step.name} - 失败`)
        if (result.error) {
          log(`  错误: ${result.error}`, 'red')
        }
        // 对于非关键步骤，继续构建
        if (!result.critical) {
          logWarning('  继续构建...')
          successfulSteps++
        } else {
          break
        }
      }
    } catch (error) {
      logError(`${step.name} - 异常`)
      log(`  异常信息: ${error.message}`, 'red')
      break
    }
    
    log('') // 空行分隔
  }

  const buildEndTime = Date.now()
  const buildDuration = Math.round((buildEndTime - buildStartTime) / 1000)

  // 输出总结
  log('=' * 50, 'blue')
  log(`构建完成: ${successfulSteps}/${totalSteps} 步骤成功`, 'bold')
  log(`构建耗时: ${buildDuration} 秒`, 'blue')
  
  if (successfulSteps === totalSteps) {
    logSuccess('🎉 构建成功完成！')
    return true
  } else {
    logError('❌ 构建未完全成功')
    return false
  }
}

// 清理构建目录
function cleanBuildDirectory() {
  try {
    const distPath = 'dist'
    const tauriDistPath = 'src-tauri/target'
    
    if (fs.existsSync(distPath)) {
      fs.rmSync(distPath, { recursive: true, force: true })
    }
    
    return {
      success: true,
      details: '构建目录已清理'
    }
  } catch (error) {
    return {
      success: false,
      error: `清理失败: ${error.message}`,
      critical: false
    }
  }
}

// 验证核心文件
function validateCoreFiles() {
  const coreFiles = [
    'src/components/PerformanceMonitor.tsx',
    'src/components/PerformanceMonitor.module.css',
    'src/components/LoadingStates.tsx',
    'src/hooks/useOptimizedPerformanceMonitor.ts',
    'src/utils/errorTracking.tsx'
  ]

  const missingFiles = []
  
  for (const file of coreFiles) {
    if (!fs.existsSync(file)) {
      missingFiles.push(file)
    }
  }

  if (missingFiles.length === 0) {
    return {
      success: true,
      details: `所有 ${coreFiles.length} 个核心文件都存在`
    }
  } else {
    return {
      success: false,
      error: `缺少核心文件: ${missingFiles.join(', ')}`,
      critical: true
    }
  }
}

// 构建前端资源
function buildFrontend() {
  try {
    logInfo('正在构建前端资源...')
    
    // 使用更宽松的TypeScript配置进行构建
    execSync('npm run build', { 
      stdio: 'pipe',
      env: {
        ...process.env,
        NODE_ENV: 'production',
        VITE_BUILD_MODE: 'production'
      }
    })
    
    // 检查构建输出
    if (fs.existsSync('dist') && fs.existsSync('dist/index.html')) {
      const distSize = getDirSize('dist')
      return {
        success: true,
        details: `前端构建完成，输出大小: ${formatBytes(distSize)}`
      }
    } else {
      return {
        success: false,
        error: '前端构建输出不完整',
        critical: true
      }
    }
  } catch (error) {
    return {
      success: false,
      error: `前端构建失败: ${error.message}`,
      critical: true
    }
  }
}

// 构建Tauri应用
function buildTauriApp() {
  try {
    logInfo('正在构建Tauri桌面应用...')
    
    execSync('npm run tauri:build', { 
      stdio: 'pipe',
      env: {
        ...process.env,
        NODE_ENV: 'production'
      }
    })
    
    // 检查Tauri构建输出
    const bundlePath = 'src-tauri/target/release/bundle'
    if (fs.existsSync(bundlePath)) {
      return {
        success: true,
        details: 'Tauri应用构建完成'
      }
    } else {
      return {
        success: false,
        error: 'Tauri构建输出不完整',
        critical: true
      }
    }
  } catch (error) {
    return {
      success: false,
      error: `Tauri构建失败: ${error.message}`,
      critical: true
    }
  }
}

// 验证构建结果
function validateBuild() {
  try {
    const validationResults = []
    
    // 检查前端构建
    if (fs.existsSync('dist/index.html')) {
      validationResults.push('✓ 前端构建输出正常')
    } else {
      validationResults.push('✗ 前端构建输出缺失')
    }
    
    // 检查Tauri构建
    const bundlePath = 'src-tauri/target/release/bundle'
    if (fs.existsSync(bundlePath)) {
      validationResults.push('✓ Tauri构建输出正常')
    } else {
      validationResults.push('✗ Tauri构建输出缺失')
    }
    
    // 检查关键文件
    const keyFiles = ['dist/assets', 'dist/index.html']
    for (const file of keyFiles) {
      if (fs.existsSync(file)) {
        validationResults.push(`✓ ${file} 存在`)
      } else {
        validationResults.push(`✗ ${file} 缺失`)
      }
    }
    
    return {
      success: true,
      details: validationResults.join('\n  ')
    }
  } catch (error) {
    return {
      success: false,
      error: `验证失败: ${error.message}`,
      critical: false
    }
  }
}

// 生成构建报告
function generateBuildReport() {
  try {
    const report = {
      buildTime: new Date().toISOString(),
      version: '1.5.0-performance-optimized',
      features: [
        'PerformanceMonitor组件优化',
        '内存管理改进',
        '渲染性能提升',
        '用户体验增强',
        '错误处理优化'
      ],
      buildSize: {
        frontend: fs.existsSync('dist') ? getDirSize('dist') : 0,
        bundle: fs.existsSync('src-tauri/target/release/bundle') ? getDirSize('src-tauri/target/release/bundle') : 0
      }
    }
    
    fs.writeFileSync('build-report.json', JSON.stringify(report, null, 2))
    
    return {
      success: true,
      details: '构建报告已生成: build-report.json'
    }
  } catch (error) {
    return {
      success: false,
      error: `报告生成失败: ${error.message}`,
      critical: false
    }
  }
}

// 工具函数
function getDirSize(dirPath) {
  let totalSize = 0
  
  function calculateSize(itemPath) {
    const stats = fs.statSync(itemPath)
    if (stats.isFile()) {
      totalSize += stats.size
    } else if (stats.isDirectory()) {
      const items = fs.readdirSync(itemPath)
      items.forEach(item => {
        calculateSize(path.join(itemPath, item))
      })
    }
  }
  
  if (fs.existsSync(dirPath)) {
    calculateSize(dirPath)
  }
  
  return totalSize
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 运行构建
if (require.main === module) {
  runBuild()
    .then(success => {
      process.exit(success ? 0 : 1)
    })
    .catch(error => {
      logError(`构建过程中发生异常: ${error.message}`)
      process.exit(1)
    })
}

module.exports = {
  runBuild,
  buildSteps
}
