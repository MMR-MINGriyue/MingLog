#!/usr/bin/env node

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Production Readiness Check for MingLog Desktop Application
 * 
 * This script performs comprehensive checks to ensure the application
 * is ready for production deployment.
 */

class ProductionReadinessChecker {
  constructor() {
    this.checks = []
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      total: 0
    }
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

  addCheck(name, description, checkFn, critical = true) {
    this.checks.push({
      name,
      description,
      checkFn,
      critical,
      result: null,
      error: null
    })
  }

  async runCheck(check) {
    try {
      this.log(`🔍 Checking: ${check.description}`, 'info')
      const result = await check.checkFn()
      
      if (result.passed) {
        check.result = 'passed'
        this.results.passed++
        this.log(`✅ ${check.name}: PASSED`, 'success')
        if (result.message) {
          this.log(`   ${result.message}`, 'info')
        }
      } else {
        if (check.critical) {
          check.result = 'failed'
          this.results.failed++
          this.log(`❌ ${check.name}: FAILED`, 'error')
        } else {
          check.result = 'warning'
          this.results.warnings++
          this.log(`⚠️  ${check.name}: WARNING`, 'warning')
        }
        
        if (result.message) {
          this.log(`   ${result.message}`, check.critical ? 'error' : 'warning')
        }
      }
    } catch (error) {
      check.result = 'failed'
      check.error = error.message
      this.results.failed++
      this.log(`💥 ${check.name}: ERROR - ${error.message}`, 'error')
    }
  }

  async runAllChecks() {
    this.log('🚀 Starting Production Readiness Check', 'info')
    this.log('='.repeat(60), 'info')
    
    this.results.total = this.checks.length
    
    for (const check of this.checks) {
      await this.runCheck(check)
    }
    
    this.generateReport()
  }

  generateReport() {
    this.log('\n' + '='.repeat(60), 'info')
    this.log('📊 PRODUCTION READINESS REPORT', 'info')
    this.log('='.repeat(60), 'info')
    
    this.log(`✅ Passed: ${this.results.passed}`, 'success')
    this.log(`❌ Failed: ${this.results.failed}`, 'error')
    this.log(`⚠️  Warnings: ${this.results.warnings}`, 'warning')
    this.log(`📊 Total: ${this.results.total}`, 'info')
    
    const successRate = Math.round((this.results.passed / this.results.total) * 100)
    this.log(`📈 Success Rate: ${successRate}%`, successRate >= 90 ? 'success' : 'warning')
    
    // Detailed results
    this.log('\n📋 Detailed Results:', 'info')
    this.checks.forEach(check => {
      const icon = check.result === 'passed' ? '✅' : check.result === 'warning' ? '⚠️' : '❌'
      this.log(`${icon} ${check.name}`, check.result === 'passed' ? 'success' : check.result === 'warning' ? 'warning' : 'error')
    })
    
    // Save report
    const reportData = {
      timestamp: new Date().toISOString(),
      results: this.results,
      checks: this.checks.map(check => ({
        name: check.name,
        description: check.description,
        result: check.result,
        critical: check.critical,
        error: check.error
      })),
      productionReady: this.results.failed === 0
    }
    
    const reportPath = path.join(process.cwd(), 'test-reports', 'production-readiness.json')
    const reportDir = path.dirname(reportPath)
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true })
    }
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2))
    
    // Final verdict
    if (this.results.failed === 0) {
      this.log('\n🎉 APPLICATION IS PRODUCTION READY! 🚀', 'success')
      process.exit(0)
    } else {
      this.log(`\n❌ ${this.results.failed} critical issue(s) must be fixed before production deployment.`, 'error')
      process.exit(1)
    }
  }
}

// Initialize checker and add all checks
const checker = new ProductionReadinessChecker()

// Build and Dependencies Checks
checker.addCheck(
  'build-success',
  'Production build completes successfully',
  async () => {
    try {
      execSync('npm run build', { stdio: 'pipe' })
      return { passed: true, message: 'Production build completed successfully' }
    } catch (error) {
      return { passed: false, message: 'Production build failed' }
    }
  }
)

checker.addCheck(
  'dependencies-audit',
  'No high-severity security vulnerabilities',
  async () => {
    try {
      const output = execSync('npm audit --audit-level=high', { encoding: 'utf8', stdio: 'pipe' })
      return { passed: true, message: 'No high-severity vulnerabilities found' }
    } catch (error) {
      return { passed: false, message: 'High-severity vulnerabilities detected' }
    }
  }
)

// Test Coverage Checks
checker.addCheck(
  'test-coverage',
  'Test coverage meets minimum threshold (80%)',
  async () => {
    try {
      const output = execSync('npm test -- --coverage --watchAll=false --passWithNoTests', { encoding: 'utf8', stdio: 'pipe' })
      const coverageMatch = output.match(/All files\s+\|\s+(\d+\.?\d*)/m)
      const coverage = coverageMatch ? parseFloat(coverageMatch[1]) : 0
      
      if (coverage >= 80) {
        return { passed: true, message: `Test coverage: ${coverage}%` }
      } else {
        return { passed: false, message: `Test coverage too low: ${coverage}% (minimum: 80%)` }
      }
    } catch (error) {
      return { passed: false, message: 'Failed to run tests or calculate coverage' }
    }
  }
)

// Performance Checks
checker.addCheck(
  'bundle-size',
  'Bundle size is within acceptable limits',
  async () => {
    const distPath = path.join(process.cwd(), 'dist')
    if (!fs.existsSync(distPath)) {
      return { passed: false, message: 'Dist folder not found - run build first' }
    }
    
    let totalSize = 0
    const files = fs.readdirSync(distPath)
    files.forEach(file => {
      const filePath = path.join(distPath, file)
      if (fs.statSync(filePath).isFile()) {
        totalSize += fs.statSync(filePath).size
      }
    })
    
    const sizeInMB = totalSize / (1024 * 1024)
    const maxSizeMB = 10 // 10MB limit
    
    if (sizeInMB <= maxSizeMB) {
      return { passed: true, message: `Bundle size: ${sizeInMB.toFixed(2)}MB` }
    } else {
      return { passed: false, message: `Bundle too large: ${sizeInMB.toFixed(2)}MB (max: ${maxSizeMB}MB)` }
    }
  }
)

// Code Quality Checks
checker.addCheck(
  'typescript-check',
  'TypeScript compilation without errors',
  async () => {
    try {
      execSync('npx tsc --noEmit', { stdio: 'pipe' })
      return { passed: true, message: 'TypeScript compilation successful' }
    } catch (error) {
      return { passed: false, message: 'TypeScript compilation errors detected' }
    }
  }
)

checker.addCheck(
  'linting-check',
  'ESLint passes without errors',
  async () => {
    try {
      execSync('npx eslint src --ext .ts,.tsx --max-warnings 0', { stdio: 'pipe' })
      return { passed: true, message: 'ESLint passed without errors' }
    } catch (error) {
      return { passed: false, message: 'ESLint errors or warnings detected' }
    }
  },
  false // Non-critical
)

// Configuration Checks
checker.addCheck(
  'environment-config',
  'Environment configuration is valid',
  async () => {
    const requiredFiles = [
      'package.json',
      'tsconfig.json',
      'vite.config.ts',
      'src-tauri/tauri.conf.json'
    ]
    
    const missingFiles = requiredFiles.filter(file => !fs.existsSync(file))
    
    if (missingFiles.length === 0) {
      return { passed: true, message: 'All required configuration files present' }
    } else {
      return { passed: false, message: `Missing files: ${missingFiles.join(', ')}` }
    }
  }
)

// Tauri-specific Checks
checker.addCheck(
  'tauri-config',
  'Tauri configuration is valid',
  async () => {
    try {
      const configPath = path.join(process.cwd(), 'src-tauri', 'tauri.conf.json')
      if (!fs.existsSync(configPath)) {
        return { passed: false, message: 'Tauri config file not found' }
      }
      
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
      
      // Check required fields
      const requiredFields = ['package', 'tauri', 'build']
      const missingFields = requiredFields.filter(field => !config[field])
      
      if (missingFields.length === 0) {
        return { passed: true, message: 'Tauri configuration is valid' }
      } else {
        return { passed: false, message: `Missing config fields: ${missingFields.join(', ')}` }
      }
    } catch (error) {
      return { passed: false, message: 'Invalid Tauri configuration' }
    }
  }
)

// Asset Checks
checker.addCheck(
  'assets-check',
  'Required assets are present',
  async () => {
    const requiredAssets = [
      'src-tauri/icons/icon.png',
      'public/favicon.ico'
    ]
    
    const missingAssets = requiredAssets.filter(asset => !fs.existsSync(asset))
    
    if (missingAssets.length === 0) {
      return { passed: true, message: 'All required assets present' }
    } else {
      return { passed: false, message: `Missing assets: ${missingAssets.join(', ')}` }
    }
  },
  false // Non-critical
)

// Performance Monitor Specific Checks
checker.addCheck(
  'performance-monitor-component',
  'PerformanceMonitor component tests pass',
  async () => {
    try {
      execSync('npm test -- --testPathPatterns=PerformanceMonitor --watchAll=false', { stdio: 'pipe' })
      return { passed: true, message: 'PerformanceMonitor tests passed' }
    } catch (error) {
      return { passed: false, message: 'PerformanceMonitor tests failed' }
    }
  }
)

// Run all checks
checker.runAllChecks().catch(error => {
  console.error('💥 Production readiness check failed:', error)
  process.exit(1)
})
