/**
 * 性能监控基线建立系统
 * 建立性能基准数据，为后续优化提供依据
 */

import { performanceUtils } from './performance'

export interface PerformanceBaseline {
  timestamp: number
  version: string
  device: {
    cores: number
    memory: number
    isSlowDevice: boolean
    userAgent: string
  }
  metrics: {
    appStartTime: number
    firstPaint: number
    firstContentfulPaint: number
    largestContentfulPaint: number
    timeToInteractive: number
    memoryUsage: {
      used: number
      total: number
      limit: number
    }
    bundleSize: number
    networkLatency: number
  }
  operations: {
    noteCreate: number
    noteLoad: number
    search: number
    themeSwitch: number
    pageNavigation: number
  }
  thresholds: {
    excellent: PerformanceThresholds
    good: PerformanceThresholds
    needsImprovement: PerformanceThresholds
  }
}

export interface PerformanceThresholds {
  appStartTime: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  timeToInteractive: number
  memoryUsage: number
  operationTime: number
}

class PerformanceBaselineManager {
  private baseline: PerformanceBaseline | null = null
  private measurements: Map<string, number[]> = new Map()

  constructor() {
    this.loadBaseline()
    this.setupPerformanceObserver()
  }

  private loadBaseline() {
    try {
      const stored = localStorage.getItem('minglog-performance-baseline')
      if (stored) {
        this.baseline = JSON.parse(stored)
        console.log('📊 Performance baseline loaded:', this.baseline?.version)
      }
    } catch (error) {
      console.warn('Failed to load performance baseline:', error)
    }
  }

  private saveBaseline() {
    try {
      if (this.baseline) {
        localStorage.setItem('minglog-performance-baseline', JSON.stringify(this.baseline))
        console.log('💾 Performance baseline saved')
      }
    } catch (error) {
      console.warn('Failed to save performance baseline:', error)
    }
  }

  private setupPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      // 监控导航时间
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming
            this.recordMeasurement('domContentLoaded', navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart)
            this.recordMeasurement('loadComplete', navEntry.loadEventEnd - navEntry.loadEventStart)
          }
        }
      })

      try {
        navObserver.observe({ entryTypes: ['navigation'] })
      } catch (error) {
        console.warn('Navigation observer not supported:', error)
      }

      // 监控资源加载时间
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming
            this.recordMeasurement('resourceLoad', resourceEntry.responseEnd - resourceEntry.requestStart)
          }
        }
      })

      try {
        resourceObserver.observe({ entryTypes: ['resource'] })
      } catch (error) {
        console.warn('Resource observer not supported:', error)
      }
    }
  }

  recordMeasurement(operation: string, duration: number) {
    if (!this.measurements.has(operation)) {
      this.measurements.set(operation, [])
    }
    
    const measurements = this.measurements.get(operation)!
    measurements.push(duration)
    
    // 保持最近100次测量
    if (measurements.length > 100) {
      measurements.shift()
    }
  }

  async measureOperation<T>(operation: string, fn: () => Promise<T> | T): Promise<T> {
    const start = performance.now()
    const result = await fn()
    const duration = performance.now() - start
    
    this.recordMeasurement(operation, duration)
    
    return result
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = [...values].sort((a, b) => a - b)
    const index = Math.ceil((percentile / 100) * sorted.length) - 1
    return sorted[Math.max(0, index)]
  }

  private getAverageMeasurement(operation: string): number {
    const measurements = this.measurements.get(operation) || []
    if (measurements.length === 0) return 0
    
    return measurements.reduce((sum, val) => sum + val, 0) / measurements.length
  }

  private getMedianMeasurement(operation: string): number {
    const measurements = this.measurements.get(operation) || []
    if (measurements.length === 0) return 0
    
    return this.calculatePercentile(measurements, 50)
  }

  async establishBaseline(): Promise<PerformanceBaseline> {
    console.log('📊 Establishing performance baseline...')

    const memory = performanceUtils.memoryUsage()
    const _connection = performanceUtils.getConnectionInfo()
    
    // 测试网络延迟
    const networkLatency = await this.measureNetworkLatency()
    
    // 获取当前性能指标
    const paintEntries = performance.getEntriesByType('paint')
    const firstPaint = paintEntries.find(entry => entry.name === 'first-paint')?.startTime || 0
    const firstContentfulPaint = paintEntries.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0
    
    const baseline: PerformanceBaseline = {
      timestamp: Date.now(),
      version: '1.0.0', // TODO: 从package.json获取
      device: {
        cores: navigator.hardwareConcurrency || 1,
        memory: (navigator as any).deviceMemory || 1,
        isSlowDevice: performanceUtils.isSlowDevice(),
        userAgent: navigator.userAgent
      },
      metrics: {
        appStartTime: this.getAverageMeasurement('appStart') || 0,
        firstPaint,
        firstContentfulPaint,
        largestContentfulPaint: this.getAverageMeasurement('lcp') || 0,
        timeToInteractive: this.getAverageMeasurement('tti') || 0,
        memoryUsage: memory || { used: 0, total: 0, limit: 0 },
        bundleSize: this.estimateBundleSize(),
        networkLatency
      },
      operations: {
        noteCreate: this.getMedianMeasurement('noteCreate'),
        noteLoad: this.getMedianMeasurement('noteLoad'),
        search: this.getMedianMeasurement('search'),
        themeSwitch: this.getMedianMeasurement('themeSwitch'),
        pageNavigation: this.getMedianMeasurement('pageNavigation')
      },
      thresholds: this.calculateThresholds()
    }

    this.baseline = baseline
    this.saveBaseline()
    
    console.log('✅ Performance baseline established:', baseline)
    return baseline
  }

  private async measureNetworkLatency(): Promise<number> {
    try {
      const start = performance.now()
      await fetch('/favicon.ico', { method: 'HEAD', cache: 'no-cache' })
      return performance.now() - start
    } catch {
      return 0
    }
  }

  private estimateBundleSize(): number {
    // 估算bundle大小（基于已加载的脚本）
    const scripts = Array.from(document.scripts)
    let totalSize = 0
    
    scripts.forEach(script => {
      if (script.src) {
        // 这是一个粗略估算
        totalSize += script.src.length * 10 // 假设平均压缩比
      }
    })
    
    return totalSize
  }

  private calculateThresholds(): PerformanceBaseline['thresholds'] {
    const device = this.baseline?.device || {
      cores: navigator.hardwareConcurrency || 1,
      memory: (navigator as any).deviceMemory || 1,
      isSlowDevice: performanceUtils.isSlowDevice()
    }

    // 根据设备性能调整阈值
    const multiplier = device.isSlowDevice ? 2 : 1

    return {
      excellent: {
        appStartTime: 1000 * multiplier,
        firstContentfulPaint: 1500 * multiplier,
        largestContentfulPaint: 2500 * multiplier,
        timeToInteractive: 3000 * multiplier,
        memoryUsage: 50 * multiplier,
        operationTime: 100 * multiplier
      },
      good: {
        appStartTime: 2000 * multiplier,
        firstContentfulPaint: 2500 * multiplier,
        largestContentfulPaint: 4000 * multiplier,
        timeToInteractive: 5000 * multiplier,
        memoryUsage: 100 * multiplier,
        operationTime: 300 * multiplier
      },
      needsImprovement: {
        appStartTime: 3000 * multiplier,
        firstContentfulPaint: 4000 * multiplier,
        largestContentfulPaint: 6000 * multiplier,
        timeToInteractive: 8000 * multiplier,
        memoryUsage: 200 * multiplier,
        operationTime: 500 * multiplier
      }
    }
  }

  evaluatePerformance(metric: string, value: number): 'excellent' | 'good' | 'needsImprovement' | 'poor' {
    if (!this.baseline) return 'poor'

    const thresholds = this.baseline.thresholds
    const metricKey = metric as keyof PerformanceThresholds

    if (value <= thresholds.excellent[metricKey]) return 'excellent'
    if (value <= thresholds.good[metricKey]) return 'good'
    if (value <= thresholds.needsImprovement[metricKey]) return 'needsImprovement'
    return 'poor'
  }

  getBaseline(): PerformanceBaseline | null {
    return this.baseline
  }

  generateReport(): string {
    if (!this.baseline) {
      return '❌ No performance baseline available'
    }

    const baseline = this.baseline
    const report = `
📊 MingLog Performance Baseline Report

🖥️ Device Information:
- CPU Cores: ${baseline.device.cores}
- Memory: ${baseline.device.memory}GB
- Device Type: ${baseline.device.isSlowDevice ? 'Slow' : 'Fast'}

⚡ Core Metrics:
- App Start Time: ${baseline.metrics.appStartTime.toFixed(2)}ms
- First Paint: ${baseline.metrics.firstPaint.toFixed(2)}ms
- First Contentful Paint: ${baseline.metrics.firstContentfulPaint.toFixed(2)}ms
- Memory Usage: ${baseline.metrics.memoryUsage.used}MB / ${baseline.metrics.memoryUsage.total}MB

🔧 Operations Performance:
- Note Create: ${baseline.operations.noteCreate.toFixed(2)}ms
- Note Load: ${baseline.operations.noteLoad.toFixed(2)}ms
- Search: ${baseline.operations.search.toFixed(2)}ms
- Theme Switch: ${baseline.operations.themeSwitch.toFixed(2)}ms
- Page Navigation: ${baseline.operations.pageNavigation.toFixed(2)}ms

🎯 Performance Thresholds:
- Excellent: < ${baseline.thresholds.excellent.appStartTime}ms start time
- Good: < ${baseline.thresholds.good.appStartTime}ms start time
- Needs Improvement: < ${baseline.thresholds.needsImprovement.appStartTime}ms start time

📅 Baseline established: ${new Date(baseline.timestamp).toLocaleString()}
🏷️ Version: ${baseline.version}
    `.trim()

    return report
  }
}

// 创建全局性能基线管理器
export const performanceBaseline = new PerformanceBaselineManager()

export default performanceBaseline
