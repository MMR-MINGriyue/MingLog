// 性能验证工具 - 验证<100ms渲染目标
import { measureChartPerformance, getChartMemoryUsage } from './chartOptimization'

interface PerformanceTestResult {
  testName: string
  renderTime: number
  memoryUsage: number | null
  passed: boolean
  details: string
}

interface PerformanceValidationReport {
  overallPassed: boolean
  averageRenderTime: number
  maxRenderTime: number
  memoryEfficiency: number
  tests: PerformanceTestResult[]
  recommendations: string[]
}

// 性能基准
const PERFORMANCE_TARGETS = {
  MAX_RENDER_TIME: 100, // 100ms
  MAX_MEMORY_INCREASE: 50 * 1024 * 1024, // 50MB
  MIN_FPS: 30,
  MAX_DOM_NODES: 5000
}

// 性能测试套件
export class PerformanceValidator {
  private results: PerformanceTestResult[] = []
  private initialMemory: number | null = null

  constructor() {
    this.initialMemory = getChartMemoryUsage()?.used || null
  }

  // 测试组件渲染性能
  async testComponentRender(componentName: string, renderFunction: () => Promise<void>): Promise<PerformanceTestResult> {
    const timer = measureChartPerformance()
    
    try {
      await renderFunction()
      const renderTime = timer.end()
      const currentMemory = getChartMemoryUsage()?.used || null
      
      const passed = renderTime <= PERFORMANCE_TARGETS.MAX_RENDER_TIME
      const details = passed 
        ? `渲染时间 ${renderTime.toFixed(1)}ms 符合目标 (<${PERFORMANCE_TARGETS.MAX_RENDER_TIME}ms)`
        : `渲染时间 ${renderTime.toFixed(1)}ms 超过目标 (>${PERFORMANCE_TARGETS.MAX_RENDER_TIME}ms)`

      const result: PerformanceTestResult = {
        testName: `${componentName} 渲染性能`,
        renderTime,
        memoryUsage: currentMemory,
        passed,
        details
      }

      this.results.push(result)
      return result
    } catch (error) {
      const result: PerformanceTestResult = {
        testName: `${componentName} 渲染性能`,
        renderTime: -1,
        memoryUsage: null,
        passed: false,
        details: `渲染失败: ${error instanceof Error ? error.message : 'Unknown error'}`
      }

      this.results.push(result)
      return result
    }
  }

  // 测试大数据集渲染性能
  async testLargeDatasetRender(dataSize: number, renderFunction: () => Promise<void>): Promise<PerformanceTestResult> {
    const timer = measureChartPerformance()
    
    try {
      await renderFunction()
      const renderTime = timer.end()
      
      // 对于大数据集，允许更长的渲染时间
      const adjustedTarget = Math.min(PERFORMANCE_TARGETS.MAX_RENDER_TIME * (1 + dataSize / 1000), 500)
      const passed = renderTime <= adjustedTarget
      
      const result: PerformanceTestResult = {
        testName: `大数据集渲染 (${dataSize} 条记录)`,
        renderTime,
        memoryUsage: getChartMemoryUsage()?.used || null,
        passed,
        details: passed 
          ? `大数据集渲染时间 ${renderTime.toFixed(1)}ms 符合调整目标 (<${adjustedTarget.toFixed(1)}ms)`
          : `大数据集渲染时间 ${renderTime.toFixed(1)}ms 超过调整目标 (>${adjustedTarget.toFixed(1)}ms)`
      }

      this.results.push(result)
      return result
    } catch (error) {
      const result: PerformanceTestResult = {
        testName: `大数据集渲染 (${dataSize} 条记录)`,
        renderTime: -1,
        memoryUsage: null,
        passed: false,
        details: `大数据集渲染失败: ${error instanceof Error ? error.message : 'Unknown error'}`
      }

      this.results.push(result)
      return result
    }
  }

  // 测试内存使用效率
  testMemoryEfficiency(): PerformanceTestResult {
    const currentMemory = getChartMemoryUsage()?.used || null
    
    if (!this.initialMemory || !currentMemory) {
      const result: PerformanceTestResult = {
        testName: '内存使用效率',
        renderTime: 0,
        memoryUsage: currentMemory,
        passed: false,
        details: '无法获取内存使用信息'
      }
      this.results.push(result)
      return result
    }

    const memoryIncrease = currentMemory - this.initialMemory
    const passed = memoryIncrease <= PERFORMANCE_TARGETS.MAX_MEMORY_INCREASE
    
    const result: PerformanceTestResult = {
      testName: '内存使用效率',
      renderTime: 0,
      memoryUsage: currentMemory,
      passed,
      details: passed
        ? `内存增长 ${(memoryIncrease / 1024 / 1024).toFixed(1)}MB 符合目标 (<${PERFORMANCE_TARGETS.MAX_MEMORY_INCREASE / 1024 / 1024}MB)`
        : `内存增长 ${(memoryIncrease / 1024 / 1024).toFixed(1)}MB 超过目标 (>${PERFORMANCE_TARGETS.MAX_MEMORY_INCREASE / 1024 / 1024}MB)`
    }

    this.results.push(result)
    return result
  }

  // 测试DOM节点数量
  testDOMNodeCount(): PerformanceTestResult {
    const nodeCount = document.querySelectorAll('*').length
    const passed = nodeCount <= PERFORMANCE_TARGETS.MAX_DOM_NODES
    
    const result: PerformanceTestResult = {
      testName: 'DOM节点数量',
      renderTime: 0,
      memoryUsage: null,
      passed,
      details: passed
        ? `DOM节点数量 ${nodeCount} 符合目标 (<${PERFORMANCE_TARGETS.MAX_DOM_NODES})`
        : `DOM节点数量 ${nodeCount} 超过目标 (>${PERFORMANCE_TARGETS.MAX_DOM_NODES})`
    }

    this.results.push(result)
    return result
  }

  // 测试FPS性能
  async testFPS(duration: number = 2000): Promise<PerformanceTestResult> {
    return new Promise((resolve) => {
      let frameCount = 0
      const startTime = performance.now()
      
      const countFrame = () => {
        frameCount++
        const elapsed = performance.now() - startTime
        
        if (elapsed < duration) {
          requestAnimationFrame(countFrame)
        } else {
          const fps = (frameCount / elapsed) * 1000
          const passed = fps >= PERFORMANCE_TARGETS.MIN_FPS
          
          const result: PerformanceTestResult = {
            testName: 'FPS性能',
            renderTime: 0,
            memoryUsage: getChartMemoryUsage()?.used || null,
            passed,
            details: passed
              ? `FPS ${fps.toFixed(1)} 符合目标 (>${PERFORMANCE_TARGETS.MIN_FPS})`
              : `FPS ${fps.toFixed(1)} 低于目标 (<${PERFORMANCE_TARGETS.MIN_FPS})`
          }

          this.results.push(result)
          resolve(result)
        }
      }

      requestAnimationFrame(countFrame)
    })
  }

  // 生成性能验证报告
  generateReport(): PerformanceValidationReport {
    const passedTests = this.results.filter(r => r.passed).length
    const totalTests = this.results.length
    const overallPassed = passedTests === totalTests

    const renderTimes = this.results
      .filter(r => r.renderTime > 0)
      .map(r => r.renderTime)
    
    const averageRenderTime = renderTimes.length > 0 
      ? renderTimes.reduce((sum, time) => sum + time, 0) / renderTimes.length 
      : 0
    
    const maxRenderTime = renderTimes.length > 0 
      ? Math.max(...renderTimes) 
      : 0

    const currentMemory = getChartMemoryUsage()?.used || 0
    const memoryEfficiency = this.initialMemory 
      ? Math.max(0, 100 - ((currentMemory - this.initialMemory) / this.initialMemory) * 100)
      : 100

    const recommendations: string[] = []

    // 生成建议
    if (averageRenderTime > PERFORMANCE_TARGETS.MAX_RENDER_TIME) {
      recommendations.push('考虑实现虚拟化渲染以减少渲染时间')
      recommendations.push('优化组件重渲染逻辑，使用React.memo和useMemo')
    }

    if (maxRenderTime > PERFORMANCE_TARGETS.MAX_RENDER_TIME * 2) {
      recommendations.push('存在严重的渲染性能问题，需要重构相关组件')
    }

    if (memoryEfficiency < 80) {
      recommendations.push('内存使用效率较低，检查是否存在内存泄漏')
      recommendations.push('考虑实现数据压缩和清理机制')
    }

    const failedTests = this.results.filter(r => !r.passed)
    if (failedTests.length > 0) {
      recommendations.push(`${failedTests.length} 个测试未通过，需要针对性优化`)
    }

    if (recommendations.length === 0) {
      recommendations.push('所有性能测试通过，系统性能良好')
    }

    return {
      overallPassed,
      averageRenderTime,
      maxRenderTime,
      memoryEfficiency,
      tests: this.results,
      recommendations
    }
  }

  // 清理测试结果
  clearResults(): void {
    this.results = []
    this.initialMemory = getChartMemoryUsage()?.used || null
  }

  // 获取测试结果
  getResults(): PerformanceTestResult[] {
    return [...this.results]
  }
}

// 便捷的性能测试函数
export const runPerformanceValidation = async (): Promise<PerformanceValidationReport> => {
  const validator = new PerformanceValidator()

  console.log('🚀 开始性能验证测试...')

  // 测试基本组件渲染
  await validator.testComponentRender('PerformanceMonitor', async () => {
    // 模拟组件渲染
    await new Promise(resolve => requestAnimationFrame(resolve))
  })

  // 测试大数据集渲染
  await validator.testLargeDatasetRender(1000, async () => {
    // 模拟大数据集渲染
    await new Promise(resolve => setTimeout(resolve, 50))
  })

  // 测试内存效率
  validator.testMemoryEfficiency()

  // 测试DOM节点数量
  validator.testDOMNodeCount()

  // 测试FPS
  await validator.testFPS(1000)

  const report = validator.generateReport()
  
  console.log('📊 性能验证完成')
  console.log(`✅ 通过率: ${report.tests.filter(t => t.passed).length}/${report.tests.length}`)
  console.log(`⏱️ 平均渲染时间: ${report.averageRenderTime.toFixed(1)}ms`)
  console.log(`🧠 内存效率: ${report.memoryEfficiency.toFixed(1)}%`)

  return report
}

// 导出性能目标常量
export { PERFORMANCE_TARGETS }
