/**
 * 性能基准测试自动化系统
 * 目标：从A级(92分)提升到A+级(95+分)
 */

import React from 'react'

export interface PerformanceBenchmark {
  startupTime: number
  memoryUsage: number
  apiResponseTime: number
  dbQueryTime: number
  renderTime: number
  score: number
}

export interface PerformanceTargets {
  startupTime: number // 目标: 1.5秒
  memoryUsage: number // 目标: 50MB
  apiResponseTime: number // 目标: 200ms
  dbQueryTime: number // 目标: 100ms
  renderTime: number // 目标: 16ms (60fps)
}

const PERFORMANCE_TARGETS: PerformanceTargets = {
  startupTime: 1500, // 1.5秒
  memoryUsage: 50 * 1024 * 1024, // 50MB
  apiResponseTime: 200, // 200ms
  dbQueryTime: 100, // 100ms
  renderTime: 16 // 16ms
}

export class PerformanceBenchmarkRunner {
  private metrics: PerformanceBenchmark[] = []
  private startTime: number = 0

  constructor() {
    this.startTime = performance.now()
  }

  /**
   * 测量启动性能
   */
  async measureStartupPerformance(): Promise<number> {
    const startupTime = performance.now() - this.startTime
    console.log(`🚀 启动时间: ${startupTime.toFixed(1)}ms`)
    return startupTime
  }

  /**
   * 测量内存使用
   */
  measureMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      const memoryUsage = memory.usedJSHeapSize
      console.log(`💾 内存使用: ${(memoryUsage / 1024 / 1024).toFixed(1)}MB`)
      return memoryUsage
    }
    return 0
  }

  /**
   * 测量API响应时间
   */
  async measureApiResponseTime(apiCall: () => Promise<any>): Promise<number> {
    const start = performance.now()
    try {
      await apiCall()
      const responseTime = performance.now() - start
      console.log(`🌐 API响应时间: ${responseTime.toFixed(1)}ms`)
      return responseTime
    } catch (error) {
      console.error('API调用失败:', error)
      return 0
    }
  }

  /**
   * 测量数据库查询时间
   */
  async measureDbQueryTime(query: () => Promise<any>): Promise<number> {
    const start = performance.now()
    try {
      await query()
      const queryTime = performance.now() - start
      console.log(`🗄️ 数据库查询时间: ${queryTime.toFixed(1)}ms`)
      return queryTime
    } catch (error) {
      console.error('数据库查询失败:', error)
      return 0
    }
  }

  /**
   * 测量渲染性能
   */
  measureRenderTime(): number {
    const start = performance.now()
    
    // 强制重绘
    document.body.offsetHeight
    
    const renderTime = performance.now() - start
    console.log(`🎨 渲染时间: ${renderTime.toFixed(1)}ms`)
    return renderTime
  }

  /**
   * 计算性能评分
   */
  calculateScore(benchmark: PerformanceBenchmark): number {
    const scores = [
      this.calculateMetricScore(benchmark.startupTime, PERFORMANCE_TARGETS.startupTime, false),
      this.calculateMetricScore(benchmark.memoryUsage, PERFORMANCE_TARGETS.memoryUsage, false),
      this.calculateMetricScore(benchmark.apiResponseTime, PERFORMANCE_TARGETS.apiResponseTime, false),
      this.calculateMetricScore(benchmark.dbQueryTime, PERFORMANCE_TARGETS.dbQueryTime, false),
      this.calculateMetricScore(benchmark.renderTime, PERFORMANCE_TARGETS.renderTime, false)
    ]

    const totalScore = scores.reduce((sum, score) => sum + score, 0) / scores.length
    return Math.round(totalScore)
  }

  /**
   * 计算单个指标评分
   */
  private calculateMetricScore(actual: number, target: number, higherIsBetter: boolean = false): number {
    if (higherIsBetter) {
      return Math.min(100, (actual / target) * 100)
    } else {
      return Math.min(100, (target / actual) * 100)
    }
  }

  /**
   * 运行完整性能基准测试
   */
  async runFullBenchmark(): Promise<PerformanceBenchmark> {
    console.log('🎯 开始性能基准测试...')

    const benchmark: PerformanceBenchmark = {
      startupTime: await this.measureStartupPerformance(),
      memoryUsage: this.measureMemoryUsage(),
      apiResponseTime: 0, // 需要外部提供API调用
      dbQueryTime: 0, // 需要外部提供数据库查询
      renderTime: this.measureRenderTime(),
      score: 0
    }

    benchmark.score = this.calculateScore(benchmark)
    this.metrics.push(benchmark)

    console.log(`📊 性能评分: ${benchmark.score}/100`)
    this.logPerformanceReport(benchmark)

    return benchmark
  }

  /**
   * 生成性能报告
   */
  private logPerformanceReport(benchmark: PerformanceBenchmark): void {
    console.log('\n📈 性能基准测试报告')
    console.log('='.repeat(50))
    console.log(`🚀 启动时间: ${benchmark.startupTime.toFixed(1)}ms (目标: ${PERFORMANCE_TARGETS.startupTime}ms)`)
    console.log(`💾 内存使用: ${(benchmark.memoryUsage / 1024 / 1024).toFixed(1)}MB (目标: ${PERFORMANCE_TARGETS.memoryUsage / 1024 / 1024}MB)`)
    console.log(`🌐 API响应: ${benchmark.apiResponseTime.toFixed(1)}ms (目标: ${PERFORMANCE_TARGETS.apiResponseTime}ms)`)
    console.log(`🗄️ 数据库查询: ${benchmark.dbQueryTime.toFixed(1)}ms (目标: ${PERFORMANCE_TARGETS.dbQueryTime}ms)`)
    console.log(`🎨 渲染时间: ${benchmark.renderTime.toFixed(1)}ms (目标: ${PERFORMANCE_TARGETS.renderTime}ms)`)
    console.log(`📊 总体评分: ${benchmark.score}/100`)
    
    if (benchmark.score >= 95) {
      console.log('🎉 恭喜！达到A+级性能标准！')
    } else if (benchmark.score >= 90) {
      console.log('✅ 达到A级性能标准，继续优化可达到A+级')
    } else {
      console.log('⚠️ 性能需要进一步优化')
    }
  }

  /**
   * 获取性能历史
   */
  getMetricsHistory(): PerformanceBenchmark[] {
    return [...this.metrics]
  }

  /**
   * 获取性能趋势
   */
  getPerformanceTrend(): { improving: boolean; averageScore: number } {
    if (this.metrics.length < 2) {
      return { improving: false, averageScore: this.metrics[0]?.score || 0 }
    }

    const recent = this.metrics.slice(-5)
    const averageScore = recent.reduce((sum, m) => sum + m.score, 0) / recent.length
    const improving = recent[recent.length - 1].score > recent[0].score

    return { improving, averageScore }
  }
}

// 全局性能基准测试实例
export const performanceBenchmark = new PerformanceBenchmarkRunner()

/**
 * 自动性能监控Hook
 */
export const usePerformanceMonitoring = () => {
  const [currentBenchmark, setCurrentBenchmark] = React.useState<PerformanceBenchmark | null>(null)
  const [isMonitoring, setIsMonitoring] = React.useState(false)

  const startMonitoring = React.useCallback(async () => {
    setIsMonitoring(true)
    const benchmark = await performanceBenchmark.runFullBenchmark()
    setCurrentBenchmark(benchmark)
    setIsMonitoring(false)
  }, [])

  return {
    currentBenchmark,
    isMonitoring,
    startMonitoring,
    getHistory: () => performanceBenchmark.getMetricsHistory(),
    getTrend: () => performanceBenchmark.getPerformanceTrend()
  }
}
