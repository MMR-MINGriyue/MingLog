/**
 * Performance Regression Testing Framework
 * 
 * This module provides tools for detecting performance regressions
 * in the MingLog application by comparing current performance metrics
 * against established baselines.
 */

export interface PerformanceMetric {
  name: string
  value: number
  unit: string
  timestamp: number
  context?: Record<string, any>
}

export interface PerformanceBenchmark {
  name: string
  baseline: number
  threshold: number // Percentage increase that triggers regression alert
  unit: string
  description: string
}

export interface RegressionTestResult {
  benchmark: PerformanceBenchmark
  currentValue: number
  baselineValue: number
  percentageChange: number
  isRegression: boolean
  severity: 'low' | 'medium' | 'high' | 'critical'
  recommendation?: string
}

export interface PerformanceTestSuite {
  name: string
  description: string
  tests: PerformanceTest[]
}

export interface PerformanceTest {
  name: string
  description: string
  setup?: () => Promise<void>
  execute: () => Promise<PerformanceMetric>
  cleanup?: () => Promise<void>
  benchmark: PerformanceBenchmark
}

// Performance benchmarks based on optimization targets
export const PERFORMANCE_BENCHMARKS: Record<string, PerformanceBenchmark> = {
  COMPONENT_RENDER_TIME: {
    name: 'Component Render Time',
    baseline: 100, // 100ms target
    threshold: 20, // 20% increase triggers alert
    unit: 'ms',
    description: 'Time taken to render React components'
  },
  
  MEMORY_USAGE: {
    name: 'Memory Usage',
    baseline: 50 * 1024 * 1024, // 50MB baseline
    threshold: 30, // 30% increase triggers alert
    unit: 'bytes',
    description: 'JavaScript heap memory usage'
  },
  
  DATABASE_QUERY_TIME: {
    name: 'Database Query Time',
    baseline: 10, // 10ms baseline
    threshold: 50, // 50% increase triggers alert
    unit: 'ms',
    description: 'Time taken for database operations'
  },
  
  SEARCH_RESPONSE_TIME: {
    name: 'Search Response Time',
    baseline: 50, // 50ms baseline
    threshold: 40, // 40% increase triggers alert
    unit: 'ms',
    description: 'Time taken for search operations'
  },
  
  VIRTUALIZATION_EFFICIENCY: {
    name: 'Virtualization Efficiency',
    baseline: 1000, // 1000 items baseline
    threshold: 15, // 15% decrease triggers alert
    unit: 'items',
    description: 'Number of items efficiently rendered in virtualized lists'
  },
  
  BUNDLE_SIZE: {
    name: 'Bundle Size',
    baseline: 2 * 1024 * 1024, // 2MB baseline
    threshold: 10, // 10% increase triggers alert
    unit: 'bytes',
    description: 'JavaScript bundle size'
  }
}

export class PerformanceRegressionDetector {
  private metrics: PerformanceMetric[] = []
  private baselines: Map<string, number> = new Map()

  constructor() {
    this.loadBaselines()
  }

  /**
   * Load performance baselines from storage
   */
  private loadBaselines(): void {
    try {
      const stored = localStorage.getItem('minglog_performance_baselines')
      if (stored) {
        const baselines = JSON.parse(stored)
        Object.entries(baselines).forEach(([key, value]) => {
          this.baselines.set(key, value as number)
        })
      } else {
        // Initialize with default baselines
        Object.entries(PERFORMANCE_BENCHMARKS).forEach(([key, benchmark]) => {
          this.baselines.set(key, benchmark.baseline)
        })
        this.saveBaselines()
      }
    } catch (error) {
      console.warn('Failed to load performance baselines:', error)
    }
  }

  /**
   * Save performance baselines to storage
   */
  private saveBaselines(): void {
    try {
      const baselines = Object.fromEntries(this.baselines)
      localStorage.setItem('minglog_performance_baselines', JSON.stringify(baselines))
    } catch (error) {
      console.warn('Failed to save performance baselines:', error)
    }
  }

  /**
   * Record a performance metric
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push({
      ...metric,
      timestamp: Date.now()
    })

    // Keep only last 100 metrics per type
    const metricsOfType = this.metrics.filter(m => m.name === metric.name)
    if (metricsOfType.length > 100) {
      const toRemove = metricsOfType.slice(0, metricsOfType.length - 100)
      this.metrics = this.metrics.filter(m => !toRemove.includes(m))
    }
  }

  /**
   * Update baseline for a metric
   */
  updateBaseline(metricName: string, value: number): void {
    this.baselines.set(metricName, value)
    this.saveBaselines()
  }

  /**
   * Get current baseline for a metric
   */
  getBaseline(metricName: string): number | undefined {
    return this.baselines.get(metricName)
  }

  /**
   * Analyze performance regression for a specific metric
   */
  analyzeRegression(metricName: string, currentValue: number): RegressionTestResult | null {
    const benchmark = PERFORMANCE_BENCHMARKS[metricName]
    if (!benchmark) {
      console.warn(`No benchmark found for metric: ${metricName}`)
      return null
    }

    const baselineValue = this.getBaseline(metricName) || benchmark.baseline
    const percentageChange = ((currentValue - baselineValue) / baselineValue) * 100

    const isRegression = percentageChange > benchmark.threshold
    
    let severity: RegressionTestResult['severity'] = 'low'
    if (percentageChange > benchmark.threshold * 3) {
      severity = 'critical'
    } else if (percentageChange > benchmark.threshold * 2) {
      severity = 'high'
    } else if (percentageChange > benchmark.threshold * 1.5) {
      severity = 'medium'
    }

    return {
      benchmark,
      currentValue,
      baselineValue,
      percentageChange,
      isRegression,
      severity,
      recommendation: this.generateRecommendation(metricName, percentageChange, severity)
    }
  }

  /**
   * Generate performance improvement recommendations
   */
  private generateRecommendation(metricName: string, percentageChange: number, severity: string): string {
    const recommendations: Record<string, Record<string, string>> = {
      COMPONENT_RENDER_TIME: {
        low: '考虑使用React.memo()优化组件渲染',
        medium: '检查是否有不必要的重新渲染，使用useMemo和useCallback',
        high: '考虑组件拆分和懒加载',
        critical: '立即检查渲染逻辑，可能存在性能瓶颈'
      },
      MEMORY_USAGE: {
        low: '检查是否有内存泄漏的迹象',
        medium: '优化数据结构，清理未使用的引用',
        high: '实施内存监控和垃圾回收优化',
        critical: '立即修复内存泄漏，可能影响应用稳定性'
      },
      DATABASE_QUERY_TIME: {
        low: '考虑添加数据库索引',
        medium: '优化查询语句，减少不必要的数据获取',
        high: '实施查询缓存和分页',
        critical: '立即优化数据库查询，可能影响用户体验'
      },
      SEARCH_RESPONSE_TIME: {
        low: '考虑实施搜索结果缓存',
        medium: '优化搜索算法和索引',
        high: '实施搜索防抖和结果预加载',
        critical: '立即优化搜索性能，严重影响用户体验'
      }
    }

    return recommendations[metricName]?.[severity] || '监控性能指标变化趋势'
  }

  /**
   * Get performance trend for a metric
   */
  getPerformanceTrend(metricName: string, timeWindow: number = 24 * 60 * 60 * 1000): PerformanceMetric[] {
    const cutoff = Date.now() - timeWindow
    return this.metrics
      .filter(m => m.name === metricName && m.timestamp > cutoff)
      .sort((a, b) => a.timestamp - b.timestamp)
  }

  /**
   * Generate performance report
   */
  generateReport(): {
    summary: {
      totalMetrics: number
      regressions: number
      improvements: number
    }
    regressions: RegressionTestResult[]
    trends: Record<string, PerformanceMetric[]>
  } {
    const recentMetrics = this.getRecentMetrics()
    const regressions: RegressionTestResult[] = []
    const trends: Record<string, PerformanceMetric[]> = {}

    Object.keys(PERFORMANCE_BENCHMARKS).forEach(metricName => {
      const recentMetric = recentMetrics.find(m => m.name === metricName)
      if (recentMetric) {
        const regression = this.analyzeRegression(metricName, recentMetric.value)
        if (regression?.isRegression) {
          regressions.push(regression)
        }
      }
      trends[metricName] = this.getPerformanceTrend(metricName)
    })

    const improvements = recentMetrics.filter(metric => {
      const baseline = this.getBaseline(metric.name)
      return baseline && metric.value < baseline * 0.9 // 10% improvement
    }).length

    return {
      summary: {
        totalMetrics: recentMetrics.length,
        regressions: regressions.length,
        improvements
      },
      regressions,
      trends
    }
  }

  /**
   * Get recent metrics (last hour)
   */
  private getRecentMetrics(): PerformanceMetric[] {
    const oneHourAgo = Date.now() - 60 * 60 * 1000
    const recentByType = new Map<string, PerformanceMetric>()

    this.metrics
      .filter(m => m.timestamp > oneHourAgo)
      .forEach(metric => {
        const existing = recentByType.get(metric.name)
        if (!existing || metric.timestamp > existing.timestamp) {
          recentByType.set(metric.name, metric)
        }
      })

    return Array.from(recentByType.values())
  }

  /**
   * Clear all metrics and reset baselines
   */
  reset(): void {
    this.metrics = []
    this.baselines.clear()
    localStorage.removeItem('minglog_performance_baselines')
    this.loadBaselines()
  }
}

// Global instance
export const performanceDetector = new PerformanceRegressionDetector()

/**
 * Utility function to measure and record performance
 */
export async function measurePerformance<T>(
  name: string,
  operation: () => Promise<T>,
  context?: Record<string, any>
): Promise<T> {
  const startTime = performance.now()
  const startMemory = (performance as any).memory?.usedJSHeapSize || 0

  try {
    const result = await operation()

    const endTime = performance.now()
    const endMemory = (performance as any).memory?.usedJSHeapSize || 0

    performanceDetector.recordMetric({
      name: `${name}_TIME`,
      value: endTime - startTime,
      unit: 'ms',
      timestamp: Date.now(),
      context
    })

    if (endMemory > startMemory) {
      performanceDetector.recordMetric({
        name: `${name}_MEMORY`,
        value: endMemory - startMemory,
        unit: 'bytes',
        timestamp: Date.now(),
        context
      })
    }

    return result
  } catch (error) {
    const endTime = performance.now()
    performanceDetector.recordMetric({
      name: `${name}_ERROR_TIME`,
      value: endTime - startTime,
      unit: 'ms',
      timestamp: Date.now(),
      context: { ...context, error: error instanceof Error ? error.message : 'Unknown error' }
    })
    throw error
  }
}

/**
 * Performance test suite runner
 */
export class PerformanceTestRunner {
  private results: Map<string, RegressionTestResult[]> = new Map()

  async runTestSuite(suite: PerformanceTestSuite): Promise<RegressionTestResult[]> {
    const results: RegressionTestResult[] = []

    for (const test of suite.tests) {
      try {
        // Setup
        if (test.setup) {
          await test.setup()
        }

        // Execute test and measure performance
        const metric = await test.execute()
        performanceDetector.recordMetric(metric)

        // Analyze regression
        const regression = performanceDetector.analyzeRegression(
          test.benchmark.name.toUpperCase().replace(/\s+/g, '_'),
          metric.value
        )

        if (regression) {
          results.push(regression)
        }

        // Cleanup
        if (test.cleanup) {
          await test.cleanup()
        }
      } catch (error) {
        console.error(`Performance test failed: ${test.name}`, error)
      }
    }

    this.results.set(suite.name, results)
    return results
  }

  getResults(suiteName?: string): RegressionTestResult[] {
    if (suiteName) {
      return this.results.get(suiteName) || []
    }

    const allResults: RegressionTestResult[] = []
    this.results.forEach(results => allResults.push(...results))
    return allResults
  }

  generateSummaryReport(): {
    totalTests: number
    regressions: number
    criticalRegressions: number
    averagePerformanceChange: number
  } {
    const allResults = this.getResults()
    const regressions = allResults.filter(r => r.isRegression)
    const criticalRegressions = regressions.filter(r => r.severity === 'critical')

    const averageChange = allResults.length > 0
      ? allResults.reduce((sum, r) => sum + r.percentageChange, 0) / allResults.length
      : 0

    return {
      totalTests: allResults.length,
      regressions: regressions.length,
      criticalRegressions: criticalRegressions.length,
      averagePerformanceChange: averageChange
    }
  }
}
