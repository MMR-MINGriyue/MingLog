#!/usr/bin/env node

const { execSync, spawn } = require('child_process')
const fs = require('fs')
const path = require('path')

/**
 * MingLog PerformanceMonitor Comprehensive Testing Script
 * 
 * This script executes all testing phases for the PerformanceMonitor component:
 * 1. Unit Tests (Jest + React Testing Library)
 * 2. Integration Tests
 * 3. E2E Tests (Playwright)
 * 4. Accessibility Tests
 * 5. Performance Tests
 */

class TestRunner {
  constructor() {
    this.results = {
      unit: { passed: 0, failed: 0, total: 0 },
      integration: { passed: 0, failed: 0, total: 0 },
      e2e: { passed: 0, failed: 0, total: 0 },
      accessibility: { passed: 0, failed: 0, total: 0 },
      performance: { passed: 0, failed: 0, total: 0 }
    }
    this.startTime = Date.now()
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString()
    const colors = {
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m', // Green
      error: '\x1b[31m',   // Red
      warning: '\x1b[33m', // Yellow
      reset: '\x1b[0m'     // Reset
    }
    
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`)
  }

  async runCommand(command, description) {
    this.log(`Starting: ${description}`, 'info')
    
    try {
      const output = execSync(command, { 
        encoding: 'utf8', 
        stdio: 'pipe',
        cwd: process.cwd()
      })
      
      this.log(`✅ Completed: ${description}`, 'success')
      return { success: true, output }
    } catch (error) {
      this.log(`❌ Failed: ${description}`, 'error')
      this.log(`Error: ${error.message}`, 'error')
      return { success: false, error: error.message }
    }
  }

  async runUnitTests() {
    this.log('🧪 Running Unit Tests', 'info')
    
    const testCommands = [
      {
        cmd: 'npm test -- --testPathPattern=PerformanceMonitor.test.tsx --coverage --watchAll=false',
        desc: 'Basic PerformanceMonitor unit tests'
      },
      {
        cmd: 'npm test -- --testPathPattern=PerformanceMonitor.comprehensive.test.tsx --coverage --watchAll=false',
        desc: 'Comprehensive PerformanceMonitor tests'
      }
    ]

    for (const { cmd, desc } of testCommands) {
      const result = await this.runCommand(cmd, desc)
      
      if (result.success) {
        // Parse Jest output for test counts
        const output = result.output
        const passedMatch = output.match(/(\d+) passed/)
        const failedMatch = output.match(/(\d+) failed/)
        
        this.results.unit.passed += passedMatch ? parseInt(passedMatch[1]) : 0
        this.results.unit.failed += failedMatch ? parseInt(failedMatch[1]) : 0
      } else {
        this.results.unit.failed += 1
      }
    }

    this.results.unit.total = this.results.unit.passed + this.results.unit.failed
    
    this.log(`Unit Tests Summary: ${this.results.unit.passed}/${this.results.unit.total} passed`, 
             this.results.unit.failed === 0 ? 'success' : 'warning')
  }

  async runIntegrationTests() {
    this.log('🔗 Running Integration Tests', 'info')
    
    const result = await this.runCommand(
      'npm test -- --testPathPattern=integration --coverage --watchAll=false',
      'Integration tests for PerformanceMonitor hooks and utilities'
    )

    if (result.success) {
      this.results.integration.passed = 1
      this.results.integration.total = 1
    } else {
      this.results.integration.failed = 1
      this.results.integration.total = 1
    }

    this.log(`Integration Tests Summary: ${this.results.integration.passed}/${this.results.integration.total} passed`, 
             this.results.integration.failed === 0 ? 'success' : 'warning')
  }

  async runE2ETests() {
    this.log('🎭 Running E2E Tests', 'info')
    
    // First, build the application
    const buildResult = await this.runCommand(
      'npm run build',
      'Building application for E2E testing'
    )

    if (!buildResult.success) {
      this.log('❌ Build failed, skipping E2E tests', 'error')
      this.results.e2e.failed = 1
      this.results.e2e.total = 1
      return
    }

    // Run Playwright tests
    const e2eResult = await this.runCommand(
      'npx playwright test e2e/performance-monitor.spec.ts --reporter=json',
      'E2E tests for PerformanceMonitor component'
    )

    if (e2eResult.success) {
      try {
        // Parse Playwright JSON output
        const reportPath = path.join(process.cwd(), 'test-results', 'results.json')
        if (fs.existsSync(reportPath)) {
          const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'))
          this.results.e2e.passed = report.stats.passed || 0
          this.results.e2e.failed = report.stats.failed || 0
          this.results.e2e.total = report.stats.total || 0
        } else {
          this.results.e2e.passed = 1
          this.results.e2e.total = 1
        }
      } catch (error) {
        this.log(`Warning: Could not parse E2E test results: ${error.message}`, 'warning')
        this.results.e2e.passed = 1
        this.results.e2e.total = 1
      }
    } else {
      this.results.e2e.failed = 1
      this.results.e2e.total = 1
    }

    this.log(`E2E Tests Summary: ${this.results.e2e.passed}/${this.results.e2e.total} passed`, 
             this.results.e2e.failed === 0 ? 'success' : 'warning')
  }

  async runAccessibilityTests() {
    this.log('♿ Running Accessibility Tests', 'info')
    
    const a11yResult = await this.runCommand(
      'npm test -- --testPathPattern=accessibility --watchAll=false',
      'Accessibility tests for PerformanceMonitor'
    )

    if (a11yResult.success) {
      this.results.accessibility.passed = 1
      this.results.accessibility.total = 1
    } else {
      this.results.accessibility.failed = 1
      this.results.accessibility.total = 1
    }

    this.log(`Accessibility Tests Summary: ${this.results.accessibility.passed}/${this.results.accessibility.total} passed`, 
             this.results.accessibility.failed === 0 ? 'success' : 'warning')
  }

  async runPerformanceTests() {
    this.log('⚡ Running Performance Tests', 'info')
    
    const perfResult = await this.runCommand(
      'npm run test:performance',
      'Performance benchmarks for PerformanceMonitor'
    )

    if (perfResult.success) {
      this.results.performance.passed = 1
      this.results.performance.total = 1
    } else {
      this.results.performance.failed = 1
      this.results.performance.total = 1
    }

    this.log(`Performance Tests Summary: ${this.results.performance.passed}/${this.results.performance.total} passed`, 
             this.results.performance.failed === 0 ? 'success' : 'warning')
  }

  generateReport() {
    const endTime = Date.now()
    const duration = Math.round((endTime - this.startTime) / 1000)
    
    const totalPassed = Object.values(this.results).reduce((sum, result) => sum + result.passed, 0)
    const totalFailed = Object.values(this.results).reduce((sum, result) => sum + result.failed, 0)
    const totalTests = totalPassed + totalFailed

    this.log('\n' + '='.repeat(80), 'info')
    this.log('📊 COMPREHENSIVE TEST REPORT', 'info')
    this.log('='.repeat(80), 'info')
    
    this.log(`⏱️  Total Duration: ${duration}s`, 'info')
    this.log(`📈 Overall Results: ${totalPassed}/${totalTests} tests passed`, 
             totalFailed === 0 ? 'success' : 'warning')
    
    this.log('\n📋 Detailed Results:', 'info')
    
    Object.entries(this.results).forEach(([category, result]) => {
      const status = result.failed === 0 ? '✅' : '❌'
      const percentage = result.total > 0 ? Math.round((result.passed / result.total) * 100) : 0
      
      this.log(`${status} ${category.toUpperCase()}: ${result.passed}/${result.total} (${percentage}%)`, 
               result.failed === 0 ? 'success' : 'error')
    })

    // Generate detailed report file
    const reportData = {
      timestamp: new Date().toISOString(),
      duration: duration,
      summary: {
        total: totalTests,
        passed: totalPassed,
        failed: totalFailed,
        successRate: totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0
      },
      details: this.results
    }

    const reportPath = path.join(process.cwd(), 'test-reports', 'comprehensive-test-report.json')
    
    // Ensure directory exists
    const reportDir = path.dirname(reportPath)
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true })
    }

    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2))
    this.log(`📄 Detailed report saved to: ${reportPath}`, 'info')

    // Exit with appropriate code
    if (totalFailed === 0) {
      this.log('\n🎉 All tests passed! PerformanceMonitor is ready for production.', 'success')
      process.exit(0)
    } else {
      this.log(`\n⚠️  ${totalFailed} test(s) failed. Please review and fix issues.`, 'error')
      process.exit(1)
    }
  }

  async run() {
    this.log('🚀 Starting Comprehensive PerformanceMonitor Testing', 'info')
    this.log(`📁 Working directory: ${process.cwd()}`, 'info')
    
    try {
      await this.runUnitTests()
      await this.runIntegrationTests()
      await this.runE2ETests()
      await this.runAccessibilityTests()
      await this.runPerformanceTests()
    } catch (error) {
      this.log(`💥 Unexpected error during testing: ${error.message}`, 'error')
      process.exit(1)
    }

    this.generateReport()
  }
}

// Run the tests if this script is executed directly
if (require.main === module) {
  const runner = new TestRunner()
  runner.run().catch(error => {
    console.error('💥 Test runner failed:', error)
    process.exit(1)
  })
}

module.exports = TestRunner
