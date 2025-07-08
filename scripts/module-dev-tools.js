#!/usr/bin/env node

/**
 * 模块开发工具集
 * 提供模块开发、构建、测试等功能
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// 工具函数
function log(message, type = 'info') {
  const colors = {
    info: '\x1b[36m',    // 青色
    success: '\x1b[32m', // 绿色
    warning: '\x1b[33m', // 黄色
    error: '\x1b[31m',   // 红色
    reset: '\x1b[0m'     // 重置
  }
  
  const icons = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌'
  }

  console.log(`${colors[type]}${icons[type]} ${message}${colors.reset}`)
}

function execCommand(command, cwd = process.cwd()) {
  try {
    return execSync(command, { cwd, encoding: 'utf8', stdio: 'pipe' })
  } catch (error) {
    throw new Error(`Command failed: ${command}\n${error.message}`)
  }
}

// 获取所有模块
function getAllModules() {
  const modulesDir = path.join(__dirname, '../packages/modules')
  if (!fs.existsSync(modulesDir)) {
    return []
  }

  return fs.readdirSync(modulesDir)
    .filter(name => {
      const modulePath = path.join(modulesDir, name)
      return fs.statSync(modulePath).isDirectory() && 
             fs.existsSync(path.join(modulePath, 'package.json'))
    })
    .map(name => {
      const packageJsonPath = path.join(modulesDir, name, 'package.json')
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
      return {
        name,
        displayName: packageJson.description || name,
        version: packageJson.version || '1.0.0',
        path: path.join(modulesDir, name)
      }
    })
}

// 验证模块结构
function validateModuleStructure(modulePath) {
  const requiredFiles = [
    'package.json',
    'tsconfig.json',
    'src/index.ts'
  ]

  const requiredDirs = [
    'src',
    'src/types',
    'src/services',
    'src/hooks'
  ]

  const issues = []

  // 检查必需文件
  requiredFiles.forEach(file => {
    if (!fs.existsSync(path.join(modulePath, file))) {
      issues.push(`Missing required file: ${file}`)
    }
  })

  // 检查必需目录
  requiredDirs.forEach(dir => {
    if (!fs.existsSync(path.join(modulePath, dir))) {
      issues.push(`Missing required directory: ${dir}`)
    }
  })

  // 检查 package.json 结构
  const packageJsonPath = path.join(modulePath, 'package.json')
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    
    const requiredFields = ['name', 'version', 'description', 'main', 'types']
    requiredFields.forEach(field => {
      if (!packageJson[field]) {
        issues.push(`Missing required field in package.json: ${field}`)
      }
    })

    // 检查依赖
    if (!packageJson.dependencies || !packageJson.dependencies['@minglog/core']) {
      issues.push('Missing dependency: @minglog/core')
    }
  }

  return issues
}

// 构建模块
function buildModule(moduleName) {
  const modules = getAllModules()
  const module = modules.find(m => m.name === moduleName)
  
  if (!module) {
    throw new Error(`Module "${moduleName}" not found`)
  }

  log(`Building module: ${module.displayName}`)
  
  // 验证模块结构
  const issues = validateModuleStructure(module.path)
  if (issues.length > 0) {
    log('Module structure issues found:', 'warning')
    issues.forEach(issue => log(`  - ${issue}`, 'warning'))
  }

  try {
    // 清理旧的构建文件
    const distPath = path.join(module.path, 'dist')
    if (fs.existsSync(distPath)) {
      fs.rmSync(distPath, { recursive: true, force: true })
    }

    // 运行构建命令
    execCommand('npm run build', module.path)
    log(`Module "${moduleName}" built successfully`, 'success')
    
    return true
  } catch (error) {
    log(`Failed to build module "${moduleName}": ${error.message}`, 'error')
    return false
  }
}

// 测试模块
function testModule(moduleName) {
  const modules = getAllModules()
  const module = modules.find(m => m.name === moduleName)
  
  if (!module) {
    throw new Error(`Module "${moduleName}" not found`)
  }

  log(`Testing module: ${module.displayName}`)
  
  try {
    // 检查是否有测试脚本
    const packageJsonPath = path.join(module.path, 'package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    
    if (!packageJson.scripts || !packageJson.scripts.test) {
      log('No test script found in package.json', 'warning')
      return false
    }

    // 运行测试
    execCommand('npm test', module.path)
    log(`Module "${moduleName}" tests passed`, 'success')
    
    return true
  } catch (error) {
    log(`Tests failed for module "${moduleName}": ${error.message}`, 'error')
    return false
  }
}

// 启动开发服务器
function devModule(moduleName) {
  const modules = getAllModules()
  const module = modules.find(m => m.name === moduleName)
  
  if (!module) {
    throw new Error(`Module "${moduleName}" not found`)
  }

  log(`Starting development server for: ${module.displayName}`)
  
  try {
    // 检查是否有开发脚本
    const packageJsonPath = path.join(module.path, 'package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    
    if (!packageJson.scripts || !packageJson.scripts.dev) {
      log('No dev script found in package.json', 'warning')
      return false
    }

    // 启动开发服务器
    log('Starting development server... (Press Ctrl+C to stop)')
    execCommand('npm run dev', module.path)
    
    return true
  } catch (error) {
    log(`Failed to start dev server for module "${moduleName}": ${error.message}`, 'error')
    return false
  }
}

// 列出所有模块
function listModules() {
  const modules = getAllModules()
  
  if (modules.length === 0) {
    log('No modules found', 'warning')
    return
  }

  log('Available modules:')
  modules.forEach(module => {
    console.log(`  📦 ${module.name} (${module.version})`)
    console.log(`     ${module.displayName}`)
    console.log(`     Path: ${module.path}`)
    console.log()
  })
}

// 检查模块健康状态
function checkModuleHealth(moduleName) {
  const modules = getAllModules()
  const module = modules.find(m => m.name === moduleName)
  
  if (!module) {
    throw new Error(`Module "${moduleName}" not found`)
  }

  log(`Checking health of module: ${module.displayName}`)
  
  const issues = validateModuleStructure(module.path)
  
  if (issues.length === 0) {
    log('Module structure is healthy', 'success')
  } else {
    log('Module structure issues found:', 'warning')
    issues.forEach(issue => log(`  - ${issue}`, 'warning'))
  }

  // 检查依赖
  try {
    execCommand('npm ls', module.path)
    log('Dependencies are properly installed', 'success')
  } catch (error) {
    log('Dependency issues found', 'warning')
  }

  // 检查 TypeScript 编译
  try {
    execCommand('npx tsc --noEmit', module.path)
    log('TypeScript compilation is clean', 'success')
  } catch (error) {
    log('TypeScript compilation issues found', 'warning')
  }

  return issues.length === 0
}

// 主函数
function main() {
  const args = process.argv.slice(2)
  const command = args[0]
  const moduleName = args[1]

  switch (command) {
    case 'list':
      listModules()
      break
      
    case 'build':
      if (!moduleName) {
        log('Please specify a module name', 'error')
        process.exit(1)
      }
      buildModule(moduleName)
      break
      
    case 'test':
      if (!moduleName) {
        log('Please specify a module name', 'error')
        process.exit(1)
      }
      testModule(moduleName)
      break
      
    case 'dev':
      if (!moduleName) {
        log('Please specify a module name', 'error')
        process.exit(1)
      }
      devModule(moduleName)
      break
      
    case 'health':
      if (!moduleName) {
        log('Please specify a module name', 'error')
        process.exit(1)
      }
      checkModuleHealth(moduleName)
      break
      
    case 'build-all':
      const modules = getAllModules()
      let successCount = 0
      modules.forEach(module => {
        if (buildModule(module.name)) {
          successCount++
        }
      })
      log(`Built ${successCount}/${modules.length} modules successfully`, 'info')
      break
      
    default:
      console.log(`
🛠️  MingLog 模块开发工具

用法:
  node scripts/module-dev-tools.js <command> [module-name]

命令:
  list                    列出所有模块
  build <module-name>     构建指定模块
  test <module-name>      测试指定模块
  dev <module-name>       启动模块开发服务器
  health <module-name>    检查模块健康状态
  build-all              构建所有模块

示例:
  node scripts/module-dev-tools.js list
  node scripts/module-dev-tools.js build notes
  node scripts/module-dev-tools.js dev task-manager
      `)
      break
  }
}

// 运行脚本
if (require.main === module) {
  try {
    main()
  } catch (error) {
    log(error.message, 'error')
    process.exit(1)
  }
}

module.exports = {
  getAllModules,
  validateModuleStructure,
  buildModule,
  testModule,
  devModule,
  listModules,
  checkModuleHealth
}
