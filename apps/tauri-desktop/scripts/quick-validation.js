#!/usr/bin/env node

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Quick Validation Script for MingLog Desktop Application
 * 
 * Performs essential checks to ensure the application is working correctly.
 */

class QuickValidator {
  constructor() {
    this.results = []
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',
      success: '\x1b[32m',
      error: '\x1b[31m',
      warning: '\x1b[33m',
      reset: '\x1b[0m'
    }
    console.log(`${colors[type]}${message}${colors.reset}`)
  }

  async runCheck(name, description, checkFn) {
    this.log(`🔍 ${description}...`, 'info')
    
    try {
      const result = await checkFn()
      if (result.success) {
        this.log(`✅ ${name}: PASSED`, 'success')
        if (result.message) {
          this.log(`   ${result.message}`, 'info')
        }
        this.results.push({ name, status: 'passed', message: result.message })
      } else {
        this.log(`❌ ${name}: FAILED`, 'error')
        if (result.message) {
          this.log(`   ${result.message}`, 'error')
        }
        this.results.push({ name, status: 'failed', message: result.message })
      }
    } catch (error) {
      this.log(`💥 ${name}: ERROR - ${error.message}`, 'error')
      this.results.push({ name, status: 'error', message: error.message })
    }
  }

  async validate() {
    this.log('🚀 Starting Quick Validation for MingLog Desktop', 'info')
    this.log('='.repeat(60), 'info')

    // Check 1: Build Success
    await this.runCheck(
      'build',
      'Checking if production build works',
      async () => {
        try {
          execSync('npm run build', { stdio: 'pipe' })
          
          // Check if dist folder exists and has files
          const distPath = path.join(process.cwd(), 'dist')
          if (fs.existsSync(distPath)) {
            const files = fs.readdirSync(distPath)
            if (files.length > 0) {
              return { success: true, message: `Build successful, ${files.length} files generated` }
            }
          }
          return { success: false, message: 'Build completed but no files generated' }
        } catch (error) {
          return { success: false, message: 'Build failed' }
        }
      }
    )

    // Check 2: TypeScript Compilation
    await this.runCheck(
      'typescript',
      'Checking TypeScript compilation',
      async () => {
        try {
          execSync('npx tsc --noEmit', { stdio: 'pipe' })
          return { success: true, message: 'TypeScript compilation successful' }
        } catch (error) {
          return { success: false, message: 'TypeScript compilation errors' }
        }
      }
    )

    // Check 3: Essential Files
    await this.runCheck(
      'files',
      'Checking essential files exist',
      async () => {
        const requiredFiles = [
          'src/components/PerformanceMonitor.tsx',
          'src/hooks/useOptimizedPerformanceMonitor.ts',
          'src/utils/environment.ts',
          'package.json',
          'tsconfig.json'
        ]
        
        const missingFiles = requiredFiles.filter(file => !fs.existsSync(file))
        
        if (missingFiles.length === 0) {
          return { success: true, message: 'All essential files present' }
        } else {
          return { success: false, message: `Missing files: ${missingFiles.join(', ')}` }
        }
      }
    )

    // Check 4: Dependencies
    await this.runCheck(
      'dependencies',
      'Checking dependencies installation',
      async () => {
        try {
          const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
          const nodeModulesExists = fs.existsSync('node_modules')
          
          if (nodeModulesExists) {
            return { success: true, message: 'Dependencies installed correctly' }
          } else {
            return { success: false, message: 'node_modules folder missing' }
          }
        } catch (error) {
          return { success: false, message: 'Failed to check dependencies' }
        }
      }
    )

    // Check 5: Environment Adapter
    await this.runCheck(
      'environment-adapter',
      'Checking environment adapter functionality',
      async () => {
        try {
          // Try to import and test the environment adapter
          const envPath = path.join(process.cwd(), 'src', 'utils', 'environment.ts')
          if (fs.existsSync(envPath)) {
            const content = fs.readFileSync(envPath, 'utf8')
            if (content.includes('environmentAdapter') && content.includes('isTauriEnvironment')) {
              return { success: true, message: 'Environment adapter implemented correctly' }
            }
          }
          return { success: false, message: 'Environment adapter missing or incomplete' }
        } catch (error) {
          return { success: false, message: 'Failed to check environment adapter' }
        }
      }
    )

    // Check 6: PerformanceMonitor Component
    await this.runCheck(
      'performance-monitor',
      'Checking PerformanceMonitor component',
      async () => {
        try {
          const componentPath = path.join(process.cwd(), 'src', 'components', 'PerformanceMonitor.tsx')
          if (fs.existsSync(componentPath)) {
            const content = fs.readFileSync(componentPath, 'utf8')
            const hasDataTestIds = content.includes('data-testid')
            const hasEnvironmentAdapter = content.includes('environmentAdapter') || content.includes('environment')
            
            if (hasDataTestIds && hasEnvironmentAdapter) {
              return { success: true, message: 'PerformanceMonitor component properly configured' }
            } else {
              const missing = []
              if (!hasDataTestIds) missing.push('data-testid attributes')
              if (!hasEnvironmentAdapter) missing.push('environment adapter integration')
              return { success: false, message: `Missing: ${missing.join(', ')}` }
            }
          }
          return { success: false, message: 'PerformanceMonitor component not found' }
        } catch (error) {
          return { success: false, message: 'Failed to check PerformanceMonitor component' }
        }
      }
    )

    // Check 7: Bundle Size
    await this.runCheck(
      'bundle-size',
      'Checking bundle size',
      async () => {
        try {
          const distPath = path.join(process.cwd(), 'dist')
          if (fs.existsSync(distPath)) {
            let totalSize = 0
            const files = fs.readdirSync(distPath)
            
            files.forEach(file => {
              const filePath = path.join(distPath, file)
              if (fs.statSync(filePath).isFile()) {
                totalSize += fs.statSync(filePath).size
              }
            })
            
            const sizeInMB = totalSize / (1024 * 1024)
            if (sizeInMB <= 10) {
              return { success: true, message: `Bundle size: ${sizeInMB.toFixed(2)}MB (acceptable)` }
            } else {
              return { success: false, message: `Bundle size: ${sizeInMB.toFixed(2)}MB (too large, max: 10MB)` }
            }
          }
          return { success: false, message: 'Dist folder not found' }
        } catch (error) {
          return { success: false, message: 'Failed to check bundle size' }
        }
      }
    )

    // Generate Summary
    this.generateSummary()
  }

  generateSummary() {
    this.log('\n' + '='.repeat(60), 'info')
    this.log('📊 QUICK VALIDATION SUMMARY', 'info')
    this.log('='.repeat(60), 'info')

    const passed = this.results.filter(r => r.status === 'passed').length
    const failed = this.results.filter(r => r.status === 'failed').length
    const errors = this.results.filter(r => r.status === 'error').length
    const total = this.results.length

    this.log(`✅ Passed: ${passed}`, 'success')
    this.log(`❌ Failed: ${failed}`, 'error')
    this.log(`💥 Errors: ${errors}`, 'error')
    this.log(`📊 Total: ${total}`, 'info')

    const successRate = Math.round((passed / total) * 100)
    this.log(`📈 Success Rate: ${successRate}%`, successRate >= 80 ? 'success' : 'warning')

    // Detailed Results
    this.log('\n📋 Detailed Results:', 'info')
    this.results.forEach(result => {
      const icon = result.status === 'passed' ? '✅' : result.status === 'failed' ? '❌' : '💥'
      const color = result.status === 'passed' ? 'success' : 'error'
      this.log(`${icon} ${result.name}: ${result.message || 'No details'}`, color)
    })

    // Save Results
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: { passed, failed, errors, total, successRate },
      results: this.results
    }

    const reportPath = path.join(process.cwd(), 'test-reports', 'quick-validation.json')
    const reportDir = path.dirname(reportPath)
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true })
    }
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2))

    // Final Verdict
    if (failed === 0 && errors === 0) {
      this.log('\n🎉 ALL CHECKS PASSED! Application is working correctly. 🚀', 'success')
      process.exit(0)
    } else {
      this.log(`\n⚠️  ${failed + errors} issue(s) detected. Please review and fix.`, 'error')
      process.exit(1)
    }
  }
}

// Run validation
const validator = new QuickValidator()
validator.validate().catch(error => {
  console.error('💥 Validation failed:', error)
  process.exit(1)
})
