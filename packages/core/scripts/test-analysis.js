#!/usr/bin/env node

/**
 * 测试分析脚本
 * 分析当前测试状态并生成报告
 */

import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class TestAnalyzer {
  constructor() {
    this.srcDir = path.join(__dirname, '../src')
    this.testDir = path.join(__dirname, '../src/__tests__')
    this.results = {
      totalFiles: 0,
      testedFiles: 0,
      testFiles: 0,
      coverage: null,
      issues: [],
      recommendations: []
    }
  }

  /**
   * 分析源文件和测试文件
   */
  analyzeFiles() {
    console.log('🔍 分析源文件和测试文件...')
    
    const sourceFiles = this.getSourceFiles(this.srcDir)
    const testFiles = this.getTestFiles(this.srcDir)
    
    this.results.totalFiles = sourceFiles.length
    this.results.testFiles = testFiles.length
    
    // 检查哪些源文件有对应的测试文件
    const testedFiles = sourceFiles.filter(sourceFile => {
      const relativePath = path.relative(this.srcDir, sourceFile)
      const testPath1 = path.join(this.srcDir, '__tests__', relativePath.replace(/\.ts$/, '.test.ts'))
      const testPath2 = path.join(path.dirname(sourceFile), path.basename(sourceFile, '.ts') + '.test.ts')
      const testPath3 = path.join(path.dirname(sourceFile), path.basename(sourceFile, '.ts') + '.spec.ts')
      
      return fs.existsSync(testPath1) || fs.existsSync(testPath2) || fs.existsSync(testPath3)
    })
    
    this.results.testedFiles = testedFiles.length
    
    // 找出没有测试的文件
    const untestedFiles = sourceFiles.filter(sourceFile => {
      const relativePath = path.relative(this.srcDir, sourceFile)
      const testPath1 = path.join(this.srcDir, '__tests__', relativePath.replace(/\.ts$/, '.test.ts'))
      const testPath2 = path.join(path.dirname(sourceFile), path.basename(sourceFile, '.ts') + '.test.ts')
      const testPath3 = path.join(path.dirname(sourceFile), path.basename(sourceFile, '.ts') + '.spec.ts')
      
      return !fs.existsSync(testPath1) && !fs.existsSync(testPath2) && !fs.existsSync(testPath3)
    })
    
    if (untestedFiles.length > 0) {
      this.results.issues.push({
        type: 'missing_tests',
        message: `${untestedFiles.length} 个源文件缺少测试`,
        files: untestedFiles.map(f => path.relative(this.srcDir, f))
      })
    }
  }

  /**
   * 获取所有源文件
   */
  getSourceFiles(dir) {
    const files = []
    
    const scan = (currentDir) => {
      const items = fs.readdirSync(currentDir)
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item)
        const stat = fs.statSync(fullPath)
        
        if (stat.isDirectory()) {
          // 跳过特定目录
          if (!['__tests__', 'test', 'node_modules', 'dist', 'coverage'].includes(item)) {
            scan(fullPath)
          }
        } else if (stat.isFile()) {
          // 只包含 TypeScript 源文件，排除测试文件和类型定义文件
          if (fullPath.endsWith('.ts') && 
              !fullPath.endsWith('.test.ts') && 
              !fullPath.endsWith('.spec.ts') && 
              !fullPath.endsWith('.d.ts') &&
              !fullPath.includes('test-setup.ts')) {
            files.push(fullPath)
          }
        }
      }
    }
    
    scan(dir)
    return files
  }

  /**
   * 获取所有测试文件
   */
  getTestFiles(dir) {
    const files = []
    
    const scan = (currentDir) => {
      const items = fs.readdirSync(currentDir)
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item)
        const stat = fs.statSync(fullPath)
        
        if (stat.isDirectory()) {
          scan(fullPath)
        } else if (stat.isFile()) {
          if (fullPath.endsWith('.test.ts') || fullPath.endsWith('.spec.ts')) {
            files.push(fullPath)
          }
        }
      }
    }
    
    scan(dir)
    return files
  }

  /**
   * 运行测试覆盖率分析
   */
  async analyzeCoverage() {
    console.log('📊 运行测试覆盖率分析...')
    
    try {
      // 运行测试覆盖率
      const output = execSync('npm run test:coverage -- --reporter=json', {
        cwd: path.join(__dirname, '..'),
        encoding: 'utf8',
        stdio: 'pipe'
      })
      
      // 解析覆盖率报告
      const lines = output.split('\n')
      const jsonLine = lines.find(line => line.trim().startsWith('{') && line.includes('coverage'))
      
      if (jsonLine) {
        this.results.coverage = JSON.parse(jsonLine)
      }
    } catch (error) {
      console.warn('⚠️  无法获取覆盖率数据:', error.message)
      this.results.issues.push({
        type: 'coverage_error',
        message: '无法运行覆盖率分析',
        details: error.message
      })
    }
  }

  /**
   * 分析测试质量
   */
  analyzeTestQuality() {
    console.log('🔬 分析测试质量...')
    
    const testFiles = this.getTestFiles(this.srcDir)
    
    for (const testFile of testFiles) {
      try {
        const content = fs.readFileSync(testFile, 'utf8')
        
        // 检查测试文件是否有基本的测试结构
        if (!content.includes('describe') && !content.includes('it') && !content.includes('test')) {
          this.results.issues.push({
            type: 'empty_test',
            message: '测试文件缺少测试用例',
            file: path.relative(this.srcDir, testFile)
          })
        }
        
        // 检查是否有断言
        if (!content.includes('expect') && !content.includes('assert')) {
          this.results.issues.push({
            type: 'no_assertions',
            message: '测试文件缺少断言',
            file: path.relative(this.srcDir, testFile)
          })
        }
        
        // 检查是否有异步测试但没有正确处理
        if (content.includes('async') && !content.includes('await')) {
          this.results.issues.push({
            type: 'async_issue',
            message: '异步测试可能没有正确处理',
            file: path.relative(this.srcDir, testFile)
          })
        }
      } catch (error) {
        this.results.issues.push({
          type: 'file_read_error',
          message: '无法读取测试文件',
          file: path.relative(this.srcDir, testFile),
          details: error.message
        })
      }
    }
  }

  /**
   * 生成建议
   */
  generateRecommendations() {
    console.log('💡 生成改进建议...')
    
    const testCoverage = this.results.testedFiles / this.results.totalFiles
    
    if (testCoverage < 0.5) {
      this.results.recommendations.push({
        priority: 'high',
        message: '测试覆盖率过低，建议优先为核心服务模块添加测试'
      })
    } else if (testCoverage < 0.8) {
      this.results.recommendations.push({
        priority: 'medium',
        message: '测试覆盖率需要提升，建议为剩余模块添加测试'
      })
    }
    
    if (this.results.issues.length > 10) {
      this.results.recommendations.push({
        priority: 'high',
        message: '发现多个测试问题，建议系统性地改进测试基础设施'
      })
    }
    
    // 基于文件类型的建议
    const serviceFiles = this.getSourceFiles(this.srcDir).filter(f => f.includes('/services/'))
    const serviceTestFiles = this.getTestFiles(this.srcDir).filter(f => f.includes('/services/'))
    
    if (serviceFiles.length > serviceTestFiles.length) {
      this.results.recommendations.push({
        priority: 'high',
        message: '服务模块测试不足，这些是核心业务逻辑，应该优先测试'
      })
    }
  }

  /**
   * 生成报告
   */
  generateReport() {
    console.log('\n📋 测试分析报告')
    console.log('='.repeat(50))
    
    console.log(`\n📊 基本统计:`)
    console.log(`  总源文件数: ${this.results.totalFiles}`)
    console.log(`  已测试文件数: ${this.results.testedFiles}`)
    console.log(`  测试文件数: ${this.results.testFiles}`)
    console.log(`  测试覆盖率: ${((this.results.testedFiles / this.results.totalFiles) * 100).toFixed(1)}%`)
    
    if (this.results.coverage) {
      console.log(`\n📈 代码覆盖率:`)
      console.log(`  行覆盖率: ${this.results.coverage.lines?.pct || 'N/A'}%`)
      console.log(`  函数覆盖率: ${this.results.coverage.functions?.pct || 'N/A'}%`)
      console.log(`  分支覆盖率: ${this.results.coverage.branches?.pct || 'N/A'}%`)
      console.log(`  语句覆盖率: ${this.results.coverage.statements?.pct || 'N/A'}%`)
    }
    
    if (this.results.issues.length > 0) {
      console.log(`\n⚠️  发现的问题 (${this.results.issues.length}):`)
      this.results.issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue.message}`)
        if (issue.files && issue.files.length > 0) {
          console.log(`     文件: ${issue.files.slice(0, 5).join(', ')}${issue.files.length > 5 ? '...' : ''}`)
        }
        if (issue.file) {
          console.log(`     文件: ${issue.file}`)
        }
      })
    }
    
    if (this.results.recommendations.length > 0) {
      console.log(`\n💡 改进建议:`)
      this.results.recommendations.forEach((rec, index) => {
        const priority = rec.priority === 'high' ? '🔴' : rec.priority === 'medium' ? '🟡' : '🟢'
        console.log(`  ${index + 1}. ${priority} ${rec.message}`)
      })
    }
    
    console.log('\n' + '='.repeat(50))
  }

  /**
   * 运行完整分析
   */
  async run() {
    console.log('🚀 开始测试分析...\n')
    
    this.analyzeFiles()
    this.analyzeTestQuality()
    await this.analyzeCoverage()
    this.generateRecommendations()
    this.generateReport()
    
    console.log('\n✅ 测试分析完成!')
    
    // 返回结果供其他脚本使用
    return this.results
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  const analyzer = new TestAnalyzer()
  analyzer.run().catch(console.error)
}

export default TestAnalyzer
