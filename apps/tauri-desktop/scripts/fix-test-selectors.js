#!/usr/bin/env node

/**
 * 修复测试中的选择器问题
 * 将 getByText 替换为更具体的选择器，避免多元素匹配问题
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 需要修复的文件模式
const testFilePatterns = [
  'src/components/**/*.test.tsx',
  'src/components/**/*.test.ts'
]

// 常见的需要修复的选择器模式
const selectorFixes = [
  // 按钮选择器
  {
    pattern: /screen\.getByText\(['"`]([^'"`]*?)['"`]\)/g,
    replacement: (match, text) => {
      // 如果是常见的按钮文本，使用 getByRole
      const buttonTexts = ['导出', '取消', '确定', '保存', '删除', '编辑', '添加', '项目', '全部', '最近使用', '收藏', '商业', '教育', '个人', '创意', '分析', '规划', '其他']
      if (buttonTexts.includes(text)) {
        return `screen.getByRole('button', { name: /${text}/ })`
      }
      return match
    }
  },
  // 输入框选择器
  {
    pattern: /screen\.getByText\(['"`]([^'"`]*?)['"`]\)/g,
    replacement: (match, text) => {
      // 如果是标签文本，可能需要使用 getByLabelText
      const labelTexts = ['宽度', '高度', '名称', '描述', '标题']
      if (labelTexts.some(label => text.includes(label))) {
        return `screen.getByLabelText(/${text}/)`
      }
      return match
    }
  }
]

// 获取所有测试文件
function getTestFiles() {
  const testFiles = []
  
  function scanDirectory(dir) {
    const files = fs.readdirSync(dir)
    
    for (const file of files) {
      const filePath = path.join(dir, file)
      const stat = fs.statSync(filePath)
      
      if (stat.isDirectory()) {
        scanDirectory(filePath)
      } else if (file.endsWith('.test.tsx') || file.endsWith('.test.ts')) {
        testFiles.push(filePath)
      }
    }
  }
  
  const srcDir = path.join(__dirname, '..', 'src')
  scanDirectory(srcDir)
  
  return testFiles
}

// 修复单个文件
function fixTestFile(filePath) {
  console.log(`修复文件: ${filePath}`)
  
  let content = fs.readFileSync(filePath, 'utf8')
  let modified = false
  
  // 修复常见的选择器问题
  const commonFixes = [
    // 导出按钮
    {
      from: /screen\.getByText\(['"`]导出['"`]\)/g,
      to: "screen.getByRole('button', { name: /导出/ })"
    },
    // 取消按钮
    {
      from: /screen\.getByText\(['"`]取消['"`]\)/g,
      to: "screen.getByRole('button', { name: /取消/ })"
    },
    // 项目分类
    {
      from: /screen\.getByText\(['"`]项目['"`]\)/g,
      to: "screen.getByRole('button', { name: /项目/ })"
    },
    // 全部分类
    {
      from: /screen\.getByText\(['"`]全部['"`]\)/g,
      to: "screen.getByRole('button', { name: /全部/ })"
    },
    // 最近使用
    {
      from: /screen\.getByText\(['"`]最近使用['"`]\)/g,
      to: "screen.getByRole('button', { name: /最近使用/ })"
    },
    // 收藏
    {
      from: /screen\.getByText\(['"`]收藏['"`]\)/g,
      to: "screen.getByRole('button', { name: /收藏/ })"
    },
    // 商业
    {
      from: /screen\.getByText\(['"`]商业['"`]\)/g,
      to: "screen.getByRole('button', { name: /商业/ })"
    },
    // 教育
    {
      from: /screen\.getByText\(['"`]教育['"`]\)/g,
      to: "screen.getByRole('button', { name: /教育/ })"
    },
    // 个人
    {
      from: /screen\.getByText\(['"`]个人['"`]\)/g,
      to: "screen.getByRole('button', { name: /个人/ })"
    },
    // 创意
    {
      from: /screen\.getByText\(['"`]创意['"`]\)/g,
      to: "screen.getByRole('button', { name: /创意/ })"
    },
    // 分析
    {
      from: /screen\.getByText\(['"`]分析['"`]\)/g,
      to: "screen.getByRole('button', { name: /分析/ })"
    },
    // 规划
    {
      from: /screen\.getByText\(['"`]规划['"`]\)/g,
      to: "screen.getByRole('button', { name: /规划/ })"
    },
    // 其他
    {
      from: /screen\.getByText\(['"`]其他['"`]\)/g,
      to: "screen.getByRole('button', { name: /其他/ })"
    }
  ]
  
  for (const fix of commonFixes) {
    if (fix.from.test(content)) {
      content = content.replace(fix.from, fix.to)
      modified = true
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8')
    console.log(`✅ 已修复: ${filePath}`)
  } else {
    console.log(`⏭️  无需修复: ${filePath}`)
  }
  
  return modified
}

// 主函数
function main() {
  console.log('🔧 开始修复测试选择器问题...')
  
  const testFiles = getTestFiles()
  console.log(`📁 找到 ${testFiles.length} 个测试文件`)
  
  let fixedCount = 0
  
  for (const filePath of testFiles) {
    if (fixTestFile(filePath)) {
      fixedCount++
    }
  }
  
  console.log(`\n✨ 修复完成！`)
  console.log(`📊 总计修复 ${fixedCount} 个文件`)
  console.log(`📊 总计检查 ${testFiles.length} 个文件`)
}

// 运行脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}
