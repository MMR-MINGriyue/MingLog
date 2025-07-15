/**
 * 增强性能监控服务
 * 提供实时性能指标监控、自动优化建议和性能回归检测
 * 确保<100ms响应时间目标
 */

import { EventBus } from '../event-system/EventBus'

// 性能指标接口
export interface PerformanceMetric {
  /** 指标名称 */
  name: string
  /** 指标值 */
  value: number
  /** 单位 */
  unit: string
  /** 时间戳 */
  timestamp: number
  /** 标签 */
  tags?: Record<string, string>
  /** 上下文信息 */
  context?: Record<string, any>
}

// 性能阈值配置
export interface PerformanceThreshold {
  /** 警告阈值 */
  warning: number
  /** 错误阈值 */
  error: number
  /** 是否启用 */
  enabled: boolean
}

// 性能告警
export interface PerformanceAlert {
  /** 告警ID */
  id: string
  /** 告警级别 */
  level: 'info' | 'warning' | 'error' | 'critical'
  /** 指标名称 */
  metric: string
  /** 当前值 */
  value: number
  /** 阈值 */
  threshold: number
  /** 告警消息 */
  message: string
  /** 时间戳 */
  timestamp: number
  /** 建议操作 */
  suggestions: string[]
}

// 性能优化建议
export interface OptimizationSuggestion {
  /** 建议ID */
  id: string
  /** 优先级 */
  priority: 'low' | 'medium' | 'high' | 'critical'
  /** 分类 */
  category: 'memory' | 'cpu' | 'render' | 'network' | 'storage'
  /** 标题 */
  title: string
  /** 描述 */
  description: string
  /** 预期收益 */
  expectedImprovement: string
  /** 实施难度 */
  difficulty: 'easy' | 'medium' | 'hard'
  /** 相关指标 */
  relatedMetrics: string[]
}

// 性能基准
export interface PerformanceBenchmark {
  /** 基准名称 */
  name: string
  /** 目标值 */
  target: number
  /** 当前值 */
  current: number
  /** 历史平均值 */
  average: number
  /** 趋势 */
  trend: 'improving' | 'stable' | 'degrading'
  /** 达标状态 */
  status: 'excellent' | 'good' | 'warning' | 'critical'
}

// 性能监控配置
export interface EnhancedPerformanceMonitorConfig {
  /** 是否启用监控 */
  enabled: boolean
  /** 采样间隔（毫秒） */
  sampleInterval: number
  /** 最大历史记录数 */
  maxHistorySize: number
  /** 是否启用自动优化建议 */
  enableAutoSuggestions: boolean
  /** 是否启用性能告警 */
  enableAlerts: boolean
  /** 性能阈值配置 */
  thresholds: Record<string, PerformanceThreshold>
  /** 基准目标 */
  benchmarks: Record<string, number>
}

// 默认配置
const DEFAULT_CONFIG: EnhancedPerformanceMonitorConfig = {
  enabled: true,
  sampleInterval: 1000,
  maxHistorySize: 1000,
  enableAutoSuggestions: true,
  enableAlerts: true,
  thresholds: {
    'render-time': { warning: 16, error: 100, enabled: true },
    'memory-usage': { warning: 100, error: 200, enabled: true },
    'cpu-usage': { warning: 70, error: 90, enabled: true },
    'fps': { warning: 30, error: 15, enabled: true },
    'dom-nodes': { warning: 1000, error: 2000, enabled: true },
    'bundle-size': { warning: 5, error: 10, enabled: true },
    'api-response': { warning: 500, error: 2000, enabled: true }
  },
  benchmarks: {
    'render-time': 16,
    'memory-usage': 50,
    'cpu-usage': 30,
    'fps': 60,
    'api-response': 100
  }
}

/**
 * 增强性能监控服务类
 */
export class EnhancedPerformanceMonitor {
  private eventBus: EventBus
  private config: EnhancedPerformanceMonitorConfig
  private metrics: PerformanceMetric[] = []
  private alerts: PerformanceAlert[] = []
  private suggestions: OptimizationSuggestion[] = []
  private benchmarks: Map<string, PerformanceBenchmark> = new Map()
  private observers: PerformanceObserver[] = []
  private timers: Map<string, number> = new Map()
  private isMonitoring = false
  private performanceEntries: PerformanceEntry[] = []

  constructor(eventBus: EventBus, config: Partial<EnhancedPerformanceMonitorConfig> = {}) {
    this.eventBus = eventBus
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.initializeBenchmarks()
  }

  /**
   * 启动性能监控
   */
  async start(): Promise<void> {
    if (this.isMonitoring) return

    this.isMonitoring = true
    this.setupPerformanceObservers()
    this.startMetricsCollection()
    this.startPeriodicAnalysis()

    this.eventBus.emit('performance-monitor:started', {
      config: this.config,
      timestamp: Date.now()
    }, 'EnhancedPerformanceMonitor')
  }

  /**
   * 停止性能监控
   */
  stop(): void {
    if (!this.isMonitoring) return

    this.isMonitoring = false
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []

    this.eventBus.emit('performance-monitor:stopped', {
      timestamp: Date.now()
    }, 'EnhancedPerformanceMonitor')
  }

  /**
   * 记录性能指标
   */
  recordMetric(
    name: string, 
    value: number, 
    unit = 'ms', 
    tags?: Record<string, string>,
    context?: Record<string, any>
  ): void {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
      tags,
      context
    }

    this.metrics.push(metric)
    this.limitHistorySize()
    this.checkThresholds(metric)
    this.updateBenchmarks(metric)

    this.eventBus.emit('performance-metric:recorded', metric, 'EnhancedPerformanceMonitor')
  }

  /**
   * 测量异步函数执行时间
   */
  async measureAsync<T>(
    name: string, 
    fn: () => Promise<T>, 
    tags?: Record<string, string>
  ): Promise<T> {
    const startTime = performance.now()
    const startMemory = this.getMemoryUsage()

    try {
      const result = await fn()
      const endTime = performance.now()
      const endMemory = this.getMemoryUsage()
      
      this.recordMetric(name, endTime - startTime, 'ms', {
        ...tags,
        status: 'success'
      }, {
        memoryDelta: endMemory - startMemory
      })

      return result
    } catch (error) {
      const endTime = performance.now()
      
      this.recordMetric(name, endTime - startTime, 'ms', {
        ...tags,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      throw error
    }
  }

  /**
   * 测量同步函数执行时间
   */
  measure<T>(
    name: string, 
    fn: () => T, 
    tags?: Record<string, string>
  ): T {
    const startTime = performance.now()
    const startMemory = this.getMemoryUsage()

    try {
      const result = fn()
      const endTime = performance.now()
      const endMemory = this.getMemoryUsage()
      
      this.recordMetric(name, endTime - startTime, 'ms', {
        ...tags,
        status: 'success'
      }, {
        memoryDelta: endMemory - startMemory
      })

      return result
    } catch (error) {
      const endTime = performance.now()
      
      this.recordMetric(name, endTime - startTime, 'ms', {
        ...tags,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      throw error
    }
  }

  /**
   * 开始计时
   */
  startTimer(name: string): void {
    this.timers.set(name, performance.now())
  }

  /**
   * 结束计时并记录
   */
  endTimer(name: string, tags?: Record<string, string>): number {
    const startTime = this.timers.get(name)
    if (!startTime) {
      console.warn(`Timer '${name}' not found`)
      return 0
    }

    const duration = performance.now() - startTime
    this.timers.delete(name)
    this.recordMetric(name, duration, 'ms', tags)
    
    return duration
  }

  /**
   * 获取性能指标历史
   */
  getMetrics(filter?: {
    name?: string
    timeRange?: { start: number; end: number }
    tags?: Record<string, string>
  }): PerformanceMetric[] {
    let filtered = this.metrics

    if (filter?.name) {
      filtered = filtered.filter(m => m.name === filter.name)
    }

    if (filter?.timeRange) {
      filtered = filtered.filter(m => 
        m.timestamp >= filter.timeRange!.start && 
        m.timestamp <= filter.timeRange!.end
      )
    }

    if (filter?.tags) {
      filtered = filtered.filter(m => {
        if (!m.tags) return false
        return Object.entries(filter.tags!).every(([key, value]) => 
          m.tags![key] === value
        )
      })
    }

    return filtered
  }

  /**
   * 获取性能告警
   */
  getAlerts(level?: PerformanceAlert['level']): PerformanceAlert[] {
    if (level) {
      return this.alerts.filter(a => a.level === level)
    }
    return [...this.alerts]
  }

  /**
   * 获取优化建议
   */
  getSuggestions(category?: OptimizationSuggestion['category']): OptimizationSuggestion[] {
    if (category) {
      return this.suggestions.filter(s => s.category === category)
    }
    return [...this.suggestions]
  }

  /**
   * 获取性能基准
   */
  getBenchmarks(): PerformanceBenchmark[] {
    return Array.from(this.benchmarks.values())
  }

  /**
   * 获取性能摘要
   */
  getPerformanceSummary(): {
    metrics: { total: number; recent: number }
    alerts: { total: number; active: number }
    suggestions: { total: number; highPriority: number }
    benchmarks: { total: number; meeting: number }
    status: 'excellent' | 'good' | 'warning' | 'critical'
  } {
    const now = Date.now()
    const recentThreshold = now - 5 * 60 * 1000 // 5分钟

    const recentMetrics = this.metrics.filter(m => m.timestamp > recentThreshold)
    const activeAlerts = this.alerts.filter(a => a.timestamp > recentThreshold)
    const highPriorityS = this.suggestions.filter(s => s.priority === 'high' || s.priority === 'critical')
    const meetingBenchmarks = Array.from(this.benchmarks.values()).filter(b => b.status === 'excellent' || b.status === 'good')

    // 计算整体状态
    let status: 'excellent' | 'good' | 'warning' | 'critical' = 'excellent'
    
    if (activeAlerts.some(a => a.level === 'critical')) {
      status = 'critical'
    } else if (activeAlerts.some(a => a.level === 'error') || highPriorityS.length > 3) {
      status = 'warning'
    } else if (activeAlerts.some(a => a.level === 'warning') || highPriorityS.length > 0) {
      status = 'good'
    }

    return {
      metrics: {
        total: this.metrics.length,
        recent: recentMetrics.length
      },
      alerts: {
        total: this.alerts.length,
        active: activeAlerts.length
      },
      suggestions: {
        total: this.suggestions.length,
        highPriority: highPriorityS.length
      },
      benchmarks: {
        total: this.benchmarks.size,
        meeting: meetingBenchmarks.length
      },
      status
    }
  }

  /**
   * 清除历史数据
   */
  clearHistory(): void {
    this.metrics = []
    this.alerts = []
    this.suggestions = []

    this.eventBus.emit('performance-monitor:history-cleared', {
      timestamp: Date.now()
    }, 'EnhancedPerformanceMonitor')
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<EnhancedPerformanceMonitorConfig>): void {
    this.config = { ...this.config, ...newConfig }

    this.eventBus.emit('performance-monitor:config-updated', {
      config: this.config,
      timestamp: Date.now()
    }, 'EnhancedPerformanceMonitor')
  }

  // 私有方法

  /**
   * 初始化性能基准
   */
  private initializeBenchmarks(): void {
    Object.entries(this.config.benchmarks).forEach(([name, target]) => {
      this.benchmarks.set(name, {
        name,
        target,
        current: 0,
        average: 0,
        trend: 'stable',
        status: 'good'
      })
    })
  }

  /**
   * 设置性能观察器
   */
  private setupPerformanceObservers(): void {
    if (!('PerformanceObserver' in window)) {
      console.warn('PerformanceObserver not supported')
      return
    }

    // 观察导航性能
    try {
      const navigationObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach(entry => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming
            this.recordMetric('page-load-time', navEntry.loadEventEnd - navEntry.startTime, 'ms', {
              type: 'navigation'
            })
            this.recordMetric('dom-content-loaded', navEntry.domContentLoadedEventEnd - navEntry.startTime, 'ms', {
              type: 'navigation'
            })
          }
        })
      })
      navigationObserver.observe({ entryTypes: ['navigation'] })
      this.observers.push(navigationObserver)
    } catch (error) {
      console.warn('Failed to setup navigation observer:', error)
    }

    // 观察资源加载性能
    try {
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach(entry => {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming
            this.recordMetric('resource-load-time', resourceEntry.responseEnd - resourceEntry.requestStart, 'ms', {
              type: 'resource',
              name: resourceEntry.name,
              initiatorType: resourceEntry.initiatorType
            })
          }
        })
      })
      resourceObserver.observe({ entryTypes: ['resource'] })
      this.observers.push(resourceObserver)
    } catch (error) {
      console.warn('Failed to setup resource observer:', error)
    }

    // 观察用户交互性能
    try {
      const measureObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach(entry => {
          if (entry.entryType === 'measure') {
            this.recordMetric(entry.name, entry.duration, 'ms', {
              type: 'measure'
            })
          }
        })
      })
      measureObserver.observe({ entryTypes: ['measure'] })
      this.observers.push(measureObserver)
    } catch (error) {
      console.warn('Failed to setup measure observer:', error)
    }

    // 观察长任务
    try {
      const longTaskObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach(entry => {
          if (entry.entryType === 'longtask') {
            this.recordMetric('long-task', entry.duration, 'ms', {
              type: 'longtask'
            })

            // 长任务告警
            this.createAlert('warning', 'long-task', entry.duration, 50,
              `检测到长任务: ${entry.duration.toFixed(2)}ms`,
              ['考虑将长任务分解为更小的任务', '使用Web Worker处理计算密集型操作']
            )
          }
        })
      })
      longTaskObserver.observe({ entryTypes: ['longtask'] })
      this.observers.push(longTaskObserver)
    } catch (error) {
      console.warn('Failed to setup longtask observer:', error)
    }
  }

  /**
   * 开始指标收集
   */
  private startMetricsCollection(): void {
    const collectMetrics = () => {
      if (!this.isMonitoring) return

      // 收集内存使用情况
      const memoryUsage = this.getMemoryUsage()
      this.recordMetric('memory-usage', memoryUsage, 'MB', { type: 'system' })

      // 收集DOM节点数量
      const domNodes = document.querySelectorAll('*').length
      this.recordMetric('dom-nodes', domNodes, 'count', { type: 'dom' })

      // 收集事件监听器数量
      const eventListeners = this.getEventListenerCount()
      this.recordMetric('event-listeners', eventListeners, 'count', { type: 'dom' })

      // 收集FPS
      this.measureFPS()

      // 收集Bundle大小（如果可用）
      this.measureBundleSize()

      // 继续下一次收集
      setTimeout(collectMetrics, this.config.sampleInterval)
    }

    collectMetrics()
  }

  /**
   * 开始周期性分析
   */
  private startPeriodicAnalysis(): void {
    const analyze = () => {
      if (!this.isMonitoring) return

      this.generateOptimizationSuggestions()
      this.updateBenchmarkTrends()
      this.cleanupOldData()

      // 每30秒分析一次
      setTimeout(analyze, 30000)
    }

    analyze()
  }

  /**
   * 检查性能阈值
   */
  private checkThresholds(metric: PerformanceMetric): void {
    const threshold = this.config.thresholds[metric.name]
    if (!threshold || !threshold.enabled) return

    let level: PerformanceAlert['level'] = 'info'
    let suggestions: string[] = []

    if (metric.value >= threshold.error) {
      level = 'error'
      suggestions = this.getErrorSuggestions(metric.name, metric.value)
    } else if (metric.value >= threshold.warning) {
      level = 'warning'
      suggestions = this.getWarningSuggestions(metric.name, metric.value)
    } else {
      return // 没有超过阈值
    }

    this.createAlert(level, metric.name, metric.value,
      level === 'error' ? threshold.error : threshold.warning,
      `${metric.name} 超过${level === 'error' ? '错误' : '警告'}阈值: ${metric.value}${metric.unit}`,
      suggestions
    )
  }

  /**
   * 创建性能告警
   */
  private createAlert(
    level: PerformanceAlert['level'],
    metric: string,
    value: number,
    threshold: number,
    message: string,
    suggestions: string[]
  ): void {
    const alert: PerformanceAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      level,
      metric,
      value,
      threshold,
      message,
      timestamp: Date.now(),
      suggestions
    }

    this.alerts.push(alert)
    this.limitAlertsSize()

    this.eventBus.emit('performance-alert:created', alert, 'EnhancedPerformanceMonitor')
  }

  /**
   * 更新性能基准
   */
  private updateBenchmarks(metric: PerformanceMetric): void {
    const benchmark = this.benchmarks.get(metric.name)
    if (!benchmark) return

    // 更新当前值
    benchmark.current = metric.value

    // 计算平均值（使用最近100个数据点）
    const recentMetrics = this.metrics
      .filter(m => m.name === metric.name)
      .slice(-100)

    if (recentMetrics.length > 0) {
      benchmark.average = recentMetrics.reduce((sum, m) => sum + m.value, 0) / recentMetrics.length
    }

    // 更新状态
    const targetRatio = metric.value / benchmark.target
    if (targetRatio <= 0.8) {
      benchmark.status = 'excellent'
    } else if (targetRatio <= 1.0) {
      benchmark.status = 'good'
    } else if (targetRatio <= 1.5) {
      benchmark.status = 'warning'
    } else {
      benchmark.status = 'critical'
    }

    this.benchmarks.set(metric.name, benchmark)
  }

  /**
   * 更新基准趋势
   */
  private updateBenchmarkTrends(): void {
    this.benchmarks.forEach((benchmark, name) => {
      const recentMetrics = this.metrics
        .filter(m => m.name === name)
        .slice(-20) // 最近20个数据点

      if (recentMetrics.length < 10) return

      const firstHalf = recentMetrics.slice(0, 10)
      const secondHalf = recentMetrics.slice(10)

      const firstAvg = firstHalf.reduce((sum, m) => sum + m.value, 0) / firstHalf.length
      const secondAvg = secondHalf.reduce((sum, m) => sum + m.value, 0) / secondHalf.length

      const changePercent = ((secondAvg - firstAvg) / firstAvg) * 100

      if (changePercent < -5) {
        benchmark.trend = 'improving'
      } else if (changePercent > 5) {
        benchmark.trend = 'degrading'
      } else {
        benchmark.trend = 'stable'
      }

      this.benchmarks.set(name, benchmark)
    })
  }

  /**
   * 生成优化建议
   */
  private generateOptimizationSuggestions(): void {
    const newSuggestions: OptimizationSuggestion[] = []

    // 分析内存使用
    const memoryMetrics = this.metrics.filter(m => m.name === 'memory-usage').slice(-10)
    if (memoryMetrics.length > 0) {
      const avgMemory = memoryMetrics.reduce((sum, m) => sum + m.value, 0) / memoryMetrics.length

      if (avgMemory > 150) {
        newSuggestions.push({
          id: `memory-${Date.now()}`,
          priority: 'high',
          category: 'memory',
          title: '内存使用过高',
          description: `当前内存使用平均值为 ${avgMemory.toFixed(1)}MB，建议优化内存使用`,
          expectedImprovement: '减少30-50%内存使用',
          difficulty: 'medium',
          relatedMetrics: ['memory-usage']
        })
      }
    }

    // 分析渲染性能
    const renderMetrics = this.metrics.filter(m => m.name === 'render-time').slice(-10)
    if (renderMetrics.length > 0) {
      const avgRender = renderMetrics.reduce((sum, m) => sum + m.value, 0) / renderMetrics.length

      if (avgRender > 16) {
        newSuggestions.push({
          id: `render-${Date.now()}`,
          priority: avgRender > 50 ? 'critical' : 'high',
          category: 'render',
          title: '渲染性能需要优化',
          description: `平均渲染时间为 ${avgRender.toFixed(1)}ms，超过16ms目标`,
          expectedImprovement: '提升渲染性能至<16ms',
          difficulty: 'medium',
          relatedMetrics: ['render-time', 'fps']
        })
      }
    }

    // 分析DOM节点数量
    const domMetrics = this.metrics.filter(m => m.name === 'dom-nodes').slice(-5)
    if (domMetrics.length > 0) {
      const avgDomNodes = domMetrics.reduce((sum, m) => sum + m.value, 0) / domMetrics.length

      if (avgDomNodes > 1500) {
        newSuggestions.push({
          id: `dom-${Date.now()}`,
          priority: 'medium',
          category: 'render',
          title: 'DOM节点数量过多',
          description: `当前DOM节点数量为 ${Math.round(avgDomNodes)}，建议优化组件结构`,
          expectedImprovement: '减少DOM复杂度，提升渲染性能',
          difficulty: 'easy',
          relatedMetrics: ['dom-nodes', 'render-time']
        })
      }
    }

    // 分析长任务
    const longTasks = this.metrics.filter(m => m.name === 'long-task').slice(-5)
    if (longTasks.length > 2) {
      newSuggestions.push({
        id: `longtask-${Date.now()}`,
        priority: 'high',
        category: 'cpu',
        title: '检测到频繁的长任务',
        description: `最近检测到 ${longTasks.length} 个长任务，影响用户体验`,
        expectedImprovement: '减少主线程阻塞，提升响应性',
        difficulty: 'hard',
        relatedMetrics: ['long-task', 'fps']
      })
    }

    // 更新建议列表（去重）
    const existingIds = new Set(this.suggestions.map(s => s.id))
    const filteredSuggestions = newSuggestions.filter(s => !existingIds.has(s.id))

    this.suggestions.push(...filteredSuggestions)
    this.limitSuggestionsSize()

    if (filteredSuggestions.length > 0) {
      this.eventBus.emit('performance-suggestions:updated', {
        newSuggestions: filteredSuggestions,
        totalSuggestions: this.suggestions.length,
        timestamp: Date.now()
      }, 'EnhancedPerformanceMonitor')
    }
  }

  /**
   * 获取内存使用情况
   */
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return memory.usedJSHeapSize / 1024 / 1024 // 转换为MB
    }
    return 0
  }

  /**
   * 获取事件监听器数量（估算）
   */
  private getEventListenerCount(): number {
    // 这是一个估算值，实际实现可能需要更复杂的逻辑
    const elements = document.querySelectorAll('*')
    let count = 0

    // 检查常见的事件监听器
    const commonEvents = ['click', 'mousedown', 'mouseup', 'keydown', 'keyup', 'scroll', 'resize']

    elements.forEach(element => {
      commonEvents.forEach(eventType => {
        if ((element as any)[`on${eventType}`]) {
          count++
        }
      })
    })

    return count
  }

  /**
   * 测量FPS
   */
  private measureFPS(): void {
    let frames = 0
    let lastTime = performance.now()

    const measureFrame = (currentTime: number) => {
      frames++

      if (currentTime - lastTime >= 1000) {
        const fps = Math.round((frames * 1000) / (currentTime - lastTime))
        this.recordMetric('fps', fps, 'fps', { type: 'performance' })

        frames = 0
        lastTime = currentTime
      }

      if (this.isMonitoring) {
        requestAnimationFrame(measureFrame)
      }
    }

    requestAnimationFrame(measureFrame)
  }

  /**
   * 测量Bundle大小
   */
  private measureBundleSize(): void {
    if ('getEntriesByType' in performance) {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
      const jsResources = resources.filter(r => r.name.endsWith('.js'))

      let totalSize = 0
      jsResources.forEach(resource => {
        if (resource.transferSize) {
          totalSize += resource.transferSize
        }
      })

      if (totalSize > 0) {
        this.recordMetric('bundle-size', totalSize / 1024 / 1024, 'MB', { type: 'resource' })
      }
    }
  }

  /**
   * 获取错误级别建议
   */
  private getErrorSuggestions(metricName: string, value: number): string[] {
    const suggestions: string[] = []

    switch (metricName) {
      case 'render-time':
        suggestions.push('立即优化渲染性能：使用React.memo包装组件')
        suggestions.push('实现虚拟滚动以减少DOM节点数量')
        suggestions.push('使用Web Worker处理计算密集型任务')
        break
      case 'memory-usage':
        suggestions.push('检查内存泄漏：清理事件监听器和定时器')
        suggestions.push('优化数据结构，避免保存大量不必要的数据')
        suggestions.push('考虑实现数据分页或懒加载')
        break
      case 'cpu-usage':
        suggestions.push('优化算法复杂度，减少计算量')
        suggestions.push('使用防抖和节流优化频繁操作')
        suggestions.push('将CPU密集型任务移至Web Worker')
        break
      case 'fps':
        suggestions.push('减少DOM操作频率')
        suggestions.push('使用CSS transform代替改变布局属性')
        suggestions.push('优化动画性能，使用will-change属性')
        break
      default:
        suggestions.push(`${metricName} 性能严重超标，需要立即优化`)
    }

    return suggestions
  }

  /**
   * 获取警告级别建议
   */
  private getWarningSuggestions(metricName: string, value: number): string[] {
    const suggestions: string[] = []

    switch (metricName) {
      case 'render-time':
        suggestions.push('考虑使用useMemo和useCallback优化组件')
        suggestions.push('检查是否有不必要的重新渲染')
        break
      case 'memory-usage':
        suggestions.push('监控内存使用趋势')
        suggestions.push('清理不再使用的变量和对象引用')
        break
      case 'cpu-usage':
        suggestions.push('检查是否有可以优化的循环或递归')
        suggestions.push('考虑使用更高效的数据结构')
        break
      case 'fps':
        suggestions.push('检查动画和过渡效果的性能影响')
        suggestions.push('优化滚动事件处理')
        break
      default:
        suggestions.push(`监控 ${metricName} 性能指标`)
    }

    return suggestions
  }

  /**
   * 限制历史记录大小
   */
  private limitHistorySize(): void {
    if (this.metrics.length > this.config.maxHistorySize) {
      this.metrics = this.metrics.slice(-this.config.maxHistorySize)
    }
  }

  /**
   * 限制告警数量
   */
  private limitAlertsSize(): void {
    const maxAlerts = 100
    if (this.alerts.length > maxAlerts) {
      this.alerts = this.alerts.slice(-maxAlerts)
    }
  }

  /**
   * 限制建议数量
   */
  private limitSuggestionsSize(): void {
    const maxSuggestions = 50
    if (this.suggestions.length > maxSuggestions) {
      this.suggestions = this.suggestions.slice(-maxSuggestions)
    }
  }

  /**
   * 清理旧数据
   */
  private cleanupOldData(): void {
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24小时

    // 清理旧指标
    this.metrics = this.metrics.filter(m => now - m.timestamp < maxAge)

    // 清理旧告警
    this.alerts = this.alerts.filter(a => now - a.timestamp < maxAge)

    // 清理旧建议（保留更长时间）
    const suggestionMaxAge = 7 * 24 * 60 * 60 * 1000 // 7天
    this.suggestions = this.suggestions.filter(s => {
      // 假设建议有创建时间戳，这里使用ID中的时间戳
      const match = s.id.match(/-(\d+)$/)
      if (match) {
        const timestamp = parseInt(match[1])
        return now - timestamp < suggestionMaxAge
      }
      return true
    })
  }
}

// 导出类型和服务
export default EnhancedPerformanceMonitor

// 工具函数：创建性能监控实例
export function createEnhancedPerformanceMonitor(
  eventBus: EventBus,
  config?: Partial<EnhancedPerformanceMonitorConfig>
): EnhancedPerformanceMonitor {
  return new EnhancedPerformanceMonitor(eventBus, config)
}

// 工具函数：性能装饰器
export function performanceTrack(metricName: string, monitor: EnhancedPerformanceMonitor) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = function (...args: any[]) {
      return monitor.measure(
        `${target.constructor.name}.${propertyKey}`,
        () => originalMethod.apply(this, args),
        { class: target.constructor.name, method: propertyKey }
      )
    }

    return descriptor
  }
}

// 工具函数：异步性能装饰器
export function performanceTrackAsync(metricName: string, monitor: EnhancedPerformanceMonitor) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      return monitor.measureAsync(
        `${target.constructor.name}.${propertyKey}`,
        () => originalMethod.apply(this, args),
        { class: target.constructor.name, method: propertyKey }
      )
    }

    return descriptor
  }
}
