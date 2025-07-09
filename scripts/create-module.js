#!/usr/bin/env node

/**
 * 模块创建脚手架工具
 * 用于快速创建新的 MingLog 模块
 */

const fs = require('fs')
const path = require('path')
const readline = require('readline')

// 创建命令行接口
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

// 提示用户输入
function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim())
    })
  })
}

// 验证模块名称
function validateModuleName(name) {
  const regex = /^[a-z][a-z0-9-]*$/
  if (!regex.test(name)) {
    throw new Error('模块名称只能包含小写字母、数字和连字符，且必须以字母开头')
  }
  return true
}

// 转换为 PascalCase
function toPascalCase(str) {
  return str
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
}

// 转换为 camelCase
function toCamelCase(str) {
  const pascal = toPascalCase(str)
  return pascal.charAt(0).toLowerCase() + pascal.slice(1)
}

// 复制文件并替换模板变量
function copyAndReplace(srcPath, destPath, replacements) {
  const content = fs.readFileSync(srcPath, 'utf8')
  let newContent = content

  // 替换模板变量
  Object.entries(replacements).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g')
    newContent = newContent.replace(regex, value)
  })

  // 确保目标目录存在
  const destDir = path.dirname(destPath)
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true })
  }

  fs.writeFileSync(destPath, newContent)
}

// 复制目录
function copyDirectory(srcDir, destDir, replacements, skipFiles = []) {
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true })
  }

  const files = fs.readdirSync(srcDir)

  files.forEach(file => {
    if (skipFiles.includes(file)) {
      return
    }

    const srcPath = path.join(srcDir, file)
    const destPath = path.join(destDir, file)
    const stat = fs.statSync(srcPath)

    if (stat.isDirectory()) {
      copyDirectory(srcPath, destPath, replacements, skipFiles)
    } else {
      copyAndReplace(srcPath, destPath, replacements)
    }
  })
}

// 创建模块文件
async function createModule() {
  console.log('🚀 MingLog 模块创建工具\n')

  try {
    // 获取用户输入
    const moduleName = await prompt('模块名称 (例如: task-manager): ')
    validateModuleName(moduleName)

    const displayName = await prompt('显示名称 (例如: Task Manager): ')
    const description = await prompt('模块描述: ')
    const author = await prompt('作者 (默认: MingLog Team): ') || 'MingLog Team'
    const version = await prompt('版本 (默认: 1.0.0): ') || '1.0.0'

    // 生成替换变量
    const replacements = {
      MODULE_NAME: moduleName,
      MODULE_DISPLAY_NAME: displayName,
      MODULE_DESCRIPTION: description,
      MODULE_AUTHOR: author,
      MODULE_VERSION: version,
      MODULE_PASCAL_CASE: toPascalCase(moduleName),
      MODULE_CAMEL_CASE: toCamelCase(moduleName),
      MODULE_UPPER_CASE: moduleName.toUpperCase().replace(/-/g, '_'),
      CURRENT_YEAR: new Date().getFullYear().toString(),
      CURRENT_DATE: new Date().toISOString().split('T')[0]
    }

    // 确定路径
    const templateDir = path.join(__dirname, '../packages/modules/module-template')
    const targetDir = path.join(__dirname, `../packages/modules/${moduleName}`)

    // 检查目标目录是否已存在
    if (fs.existsSync(targetDir)) {
      const overwrite = await prompt(`模块 "${moduleName}" 已存在，是否覆盖？ (y/N): `)
      if (overwrite.toLowerCase() !== 'y') {
        console.log('❌ 操作已取消')
        rl.close()
        return
      }
      // 删除现有目录
      fs.rmSync(targetDir, { recursive: true, force: true })
    }

    console.log('\n📁 创建模块文件...')

    // 复制模板文件
    const skipFiles = ['node_modules', 'dist', '.git']
    copyDirectory(templateDir, targetDir, replacements, skipFiles)

    // 创建特定的模块文件
    const moduleContent = `/**
 * ${displayName} 模块
 * ${description}
 */

import { BaseModule, IModuleConfig, IModuleMetadata, IRouteConfig, IMenuItem, IModuleEvent } from '@minglog/module-template'

export class ${toPascalCase(moduleName)}Module extends BaseModule {
  constructor(config?: Partial<IModuleConfig>) {
    const metadata: IModuleMetadata = {
      id: '${moduleName}',
      name: '${displayName}',
      version: '${version}',
      description: '${description}',
      author: '${author}',
      icon: '📋', // 可以自定义图标
      tags: ['${moduleName}'],
      dependencies: [],
      optionalDependencies: []
    }

    super(metadata, config)
  }

  protected async onInitialize(): Promise<void> {
    console.log('${displayName} module initializing...')
    // 在这里添加初始化逻辑
  }

  protected async onActivate(): Promise<void> {
    console.log('${displayName} module activating...')
    // 在这里添加激活逻辑
  }

  protected async onDeactivate(): Promise<void> {
    console.log('${displayName} module deactivating...')
    // 在这里添加停用逻辑
  }

  protected async onDestroy(): Promise<void> {
    console.log('${displayName} module destroying...')
    // 在这里添加销毁逻辑
  }

  getRoutes(): IRouteConfig[] {
    return [
      {
        path: '/${moduleName}',
        component: () => import('./components/pages/${toPascalCase(moduleName)}Page') as any,
        name: '${displayName} Page'
      }
    ]
  }

  getMenuItems(): IMenuItem[] {
    return [
      {
        id: '${moduleName}',
        title: '${displayName}',
        icon: '📋',
        path: '/${moduleName}',
        order: 100
      }
    ]
  }

  onEvent(event: IModuleEvent): void {
    console.log('${displayName} module received event:', event)
    // 在这里处理模块事件
  }
}

export default ${toPascalCase(moduleName)}Module
`

    // 写入模块主文件
    fs.writeFileSync(
      path.join(targetDir, `src/${toPascalCase(moduleName)}Module.ts`),
      moduleContent
    )

    // 更新 package.json
    const packageJsonPath = path.join(targetDir, 'package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    packageJson.name = `@minglog/${moduleName}`
    packageJson.description = description
    packageJson.version = version
    packageJson.author = author
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))

    // 更新主入口文件
    const indexPath = path.join(targetDir, 'src/index.ts')
    const indexContent = `/**
 * ${displayName} 模块主入口
 */

export { default as ${toPascalCase(moduleName)}Module } from './${toPascalCase(moduleName)}Module'
export * from './${toPascalCase(moduleName)}Module'

// 重新导出模板功能
export * from '@minglog/module-template'
`
    fs.writeFileSync(indexPath, indexContent)

    console.log('✅ 模块创建成功！')
    console.log(`\n📦 模块信息:`)
    console.log(`   名称: ${moduleName}`)
    console.log(`   显示名称: ${displayName}`)
    console.log(`   描述: ${description}`)
    console.log(`   路径: packages/modules/${moduleName}`)

    console.log(`\n🛠️  下一步:`)
    console.log(`   1. cd packages/modules/${moduleName}`)
    console.log(`   2. npm install`)
    console.log(`   3. npm run dev`)
    console.log(`   4. 开始开发你的模块！`)

    console.log(`\n📚 开发指南:`)
    console.log(`   - 编辑 src/${toPascalCase(moduleName)}Module.ts 实现模块逻辑`)
    console.log(`   - 在 src/components/ 中添加 React 组件`)
    console.log(`   - 在 src/services/ 中添加业务逻辑`)
    console.log(`   - 在 src/hooks/ 中添加自定义 Hooks`)
    console.log(`   - 参考 README.md 了解更多开发规范`)

  } catch (error) {
    console.error('❌ 创建模块失败:', error.message)
  } finally {
    rl.close()
  }
}

// 运行脚本
if (require.main === module) {
  createModule()
}

module.exports = { createModule }
