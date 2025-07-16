/**
 * 增强性能监控服务测试
 * 测试性能指标收集、告警、优化建议等功能
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { EnhancedPerformanceMonitor, createEnhancedPerformanceMonitor } from './EnhancedPerformanceMonitor'
import { EventBus } from '../event-system/EventBus'

// Mock PerformanceObserver
class MockPerformanceObserver {
  private callback: (list: any) => void
  
  constructor(callback: (list: any) => void) {
    this.callback = callback
  }
  
  observe() {
    // Mock implementation
  }
  
  disconnect() {
    // Mock implementation
  }
}

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  memory: {
    usedJSHeapSize: 50 * 1024 * 1024, // 50MB
    totalJSHeapSize: 100 * 1024 * 1024 // 100MB
  },
  getEntriesByType: vi.fn(() => [])
}

// Setup global mocks
beforeEach(() => {
  global.PerformanceObserver = MockPerformanceObserver as any
  global.performance = mockPerformance as any
  global.requestAnimationFrame = vi.fn((callback) => {
    setTimeout(callback, 16)
    return 1
  })
  global.document = {
    querySelectorAll: vi.fn(() => Array.from({ length: 100 }, () => ({})))
  } as any
})

describe('EnhancedPerformanceMonitor', () => {
  let eventBus: EventBus
  let monitor: EnhancedPerformanceMonitor

  beforeEach(() => {
    eventBus = new EventBus()
    monitor = new EnhancedPerformanceMonitor(eventBus)
    vi.clearAllMocks()
  })

  afterEach(() => {
    monitor.stop()
  })

  describe('基础功能', () => {
    it('应该正确初始化', () => {
      expect(monitor).toBeInstanceOf(EnhancedPerformanceMonitor)
    })

    it('应该能够启动和停止监控', async () => {
      const startSpy = vi.spyOn(eventBus, 'emit')
      
      await monitor.start()
      expect(startSpy).toHaveBeenCalledWith(
        'performance-monitor:started',
        expect.any(Object),
        'EnhancedPerformanceMonitor'
      )

      monitor.stop()
      expect(startSpy).toHaveBeenCalledWith(
        'performance-monitor:stopped',
        expect.any(Object),
        'EnhancedPerformanceMonitor'
      )
    })

    it('应该能够记录性能指标', () => {
      const emitSpy = vi.spyOn(eventBus, 'emit')
      
      monitor.recordMetric('test-metric', 100, 'ms', { type: 'test' })
      
      expect(emitSpy).toHaveBeenCalledWith(
        'performance-metric:recorded',
        expect.objectContaining({
          name: 'test-metric',
          value: 100,
          unit: 'ms',
          tags: { type: 'test' }
        }),
        'EnhancedPerformanceMonitor'
      )
    })

    it('应该能够获取性能指标', () => {
      monitor.recordMetric('test-metric', 100, 'ms')
      monitor.recordMetric('test-metric', 200, 'ms')
      
      const metrics = monitor.getMetrics({ name: 'test-metric' })
      expect(metrics).toHaveLength(2)
      expect(metrics[0].value).toBe(100)
      expect(metrics[1].value).toBe(200)
    })
  })

  describe('性能测量', () => {
    it('应该能够测量同步函数执行时间', () => {
      const testFunction = () => {
        // 模拟一些工作
        let sum = 0
        for (let i = 0; i < 1000; i++) {
          sum += i
        }
        return sum
      }

      const result = monitor.measure('sync-test', testFunction, { type: 'sync' })
      
      expect(result).toBe(499500) // 0+1+...+999的和
      
      const metrics = monitor.getMetrics({ name: 'sync-test' })
      expect(metrics).toHaveLength(1)
      expect(metrics[0].tags?.type).toBe('sync')
      expect(metrics[0].tags?.status).toBe('success')
    })

    it('应该能够测量异步函数执行时间', async () => {
      const testAsyncFunction = async () => {
        await new Promise(resolve => setTimeout(resolve, 10))
        return 'async-result'
      }

      const result = await monitor.measureAsync('async-test', testAsyncFunction, { type: 'async' })
      
      expect(result).toBe('async-result')
      
      const metrics = monitor.getMetrics({ name: 'async-test' })
      expect(metrics).toHaveLength(1)
      expect(metrics[0].tags?.type).toBe('async')
      expect(metrics[0].tags?.status).toBe('success')
    })

    it('应该能够处理函数执行错误', () => {
      const errorFunction = () => {
        throw new Error('Test error')
      }

      expect(() => {
        monitor.measure('error-test', errorFunction)
      }).toThrow('Test error')
      
      const metrics = monitor.getMetrics({ name: 'error-test' })
      expect(metrics).toHaveLength(1)
      expect(metrics[0].tags?.status).toBe('error')
      expect(metrics[0].tags?.error).toBe('Test error')
    })

    it('应该能够使用计时器', () => {
      // Mock performance.now to return increasing values
      let mockTime = 1000
      mockPerformance.now.mockImplementation(() => mockTime++)

      monitor.startTimer('timer-test')

      // 模拟一些工作
      let sum = 0
      for (let i = 0; i < 100; i++) {
        sum += i
      }

      const duration = monitor.endTimer('timer-test', { type: 'timer' })

      expect(duration).toBeGreaterThan(0)

      const metrics = monitor.getMetrics({ name: 'timer-test' })
      expect(metrics).toHaveLength(1)
      expect(metrics[0].tags?.type).toBe('timer')
    })
  })

  describe('性能阈值和告警', () => {
    it('应该在超过警告阈值时创建告警', () => {
      const emitSpy = vi.spyOn(eventBus, 'emit')
      
      // 记录超过警告阈值的渲染时间
      monitor.recordMetric('render-time', 50, 'ms') // 警告阈值是16ms
      
      expect(emitSpy).toHaveBeenCalledWith(
        'performance-alert:created',
        expect.objectContaining({
          level: 'warning',
          metric: 'render-time',
          value: 50
        }),
        'EnhancedPerformanceMonitor'
      )
      
      const alerts = monitor.getAlerts('warning')
      expect(alerts).toHaveLength(1)
      expect(alerts[0].metric).toBe('render-time')
    })

    it('应该在超过错误阈值时创建错误告警', () => {
      const emitSpy = vi.spyOn(eventBus, 'emit')
      
      // 记录超过错误阈值的渲染时间
      monitor.recordMetric('render-time', 150, 'ms') // 错误阈值是100ms
      
      expect(emitSpy).toHaveBeenCalledWith(
        'performance-alert:created',
        expect.objectContaining({
          level: 'error',
          metric: 'render-time',
          value: 150
        }),
        'EnhancedPerformanceMonitor'
      )
      
      const alerts = monitor.getAlerts('error')
      expect(alerts).toHaveLength(1)
      expect(alerts[0].suggestions).toContain('立即优化渲染性能：使用React.memo包装组件')
    })

    it('应该能够过滤告警', () => {
      monitor.recordMetric('render-time', 50, 'ms') // 警告
      monitor.recordMetric('memory-usage', 250, 'MB') // 错误
      
      const warningAlerts = monitor.getAlerts('warning')
      const errorAlerts = monitor.getAlerts('error')
      
      expect(warningAlerts).toHaveLength(1)
      expect(errorAlerts).toHaveLength(1)
      expect(warningAlerts[0].metric).toBe('render-time')
      expect(errorAlerts[0].metric).toBe('memory-usage')
    })
  })

  describe('性能基准', () => {
    it('应该更新性能基准', () => {
      monitor.recordMetric('render-time', 10, 'ms') // 优秀
      monitor.recordMetric('render-time', 15, 'ms') // 良好
      monitor.recordMetric('render-time', 20, 'ms') // 警告
      
      const benchmarks = monitor.getBenchmarks()
      const renderBenchmark = benchmarks.find(b => b.name === 'render-time')
      
      expect(renderBenchmark).toBeDefined()
      expect(renderBenchmark!.current).toBe(20)
      expect(renderBenchmark!.status).toBe('warning')
    })

    it('应该计算基准趋势', () => {
      // 模拟性能恶化趋势
      for (let i = 0; i < 15; i++) {
        monitor.recordMetric('render-time', 10 + i, 'ms')
      }
      
      // 手动触发趋势更新
      monitor['updateBenchmarkTrends']()
      
      const benchmarks = monitor.getBenchmarks()
      const renderBenchmark = benchmarks.find(b => b.name === 'render-time')
      
      expect(renderBenchmark?.trend).toBe('degrading')
    })
  })

  describe('优化建议', () => {
    it('应该生成内存优化建议', () => {
      // 记录高内存使用
      for (let i = 0; i < 10; i++) {
        monitor.recordMetric('memory-usage', 180, 'MB')
      }
      
      // 手动触发建议生成
      monitor['generateOptimizationSuggestions']()
      
      const suggestions = monitor.getSuggestions('memory')
      expect(suggestions.length).toBeGreaterThan(0)
      expect(suggestions[0].title).toContain('内存使用过高')
    })

    it('应该生成渲染优化建议', () => {
      // 记录慢渲染
      for (let i = 0; i < 10; i++) {
        monitor.recordMetric('render-time', 30, 'ms')
      }
      
      // 手动触发建议生成
      monitor['generateOptimizationSuggestions']()
      
      const suggestions = monitor.getSuggestions('render')
      expect(suggestions.length).toBeGreaterThan(0)
      expect(suggestions[0].title).toContain('渲染性能需要优化')
    })

    it('应该生成长任务优化建议', () => {
      // 记录多个长任务
      for (let i = 0; i < 5; i++) {
        monitor.recordMetric('long-task', 100, 'ms')
      }
      
      // 手动触发建议生成
      monitor['generateOptimizationSuggestions']()
      
      const suggestions = monitor.getSuggestions('cpu')
      expect(suggestions.length).toBeGreaterThan(0)
      expect(suggestions[0].title).toContain('检测到频繁的长任务')
    })
  })

  describe('性能摘要', () => {
    it('应该生成正确的性能摘要', () => {
      monitor.recordMetric('render-time', 10, 'ms')
      monitor.recordMetric('memory-usage', 50, 'MB')
      monitor.recordMetric('render-time', 150, 'ms') // 触发错误告警
      
      const summary = monitor.getPerformanceSummary()
      
      expect(summary.metrics.total).toBe(3)
      expect(summary.alerts.total).toBeGreaterThan(0)
      expect(summary.status).toBe('warning') // 因为有错误告警
    })

    it('应该正确计算状态', () => {
      // 记录正常性能
      monitor.recordMetric('render-time', 10, 'ms')
      monitor.recordMetric('memory-usage', 30, 'MB')
      
      let summary = monitor.getPerformanceSummary()
      expect(summary.status).toBe('excellent')
      
      // 记录警告级别性能
      monitor.recordMetric('render-time', 50, 'ms')
      
      summary = monitor.getPerformanceSummary()
      expect(summary.status).toBe('good')
    })
  })

  describe('配置管理', () => {
    it('应该能够更新配置', () => {
      const emitSpy = vi.spyOn(eventBus, 'emit')
      
      monitor.updateConfig({
        sampleInterval: 5000,
        enableAlerts: false
      })
      
      expect(emitSpy).toHaveBeenCalledWith(
        'performance-monitor:config-updated',
        expect.objectContaining({
          config: expect.objectContaining({
            sampleInterval: 5000,
            enableAlerts: false
          })
        }),
        'EnhancedPerformanceMonitor'
      )
    })

    it('应该能够清除历史数据', () => {
      const emitSpy = vi.spyOn(eventBus, 'emit')
      
      monitor.recordMetric('test', 100, 'ms')
      monitor.clearHistory()
      
      expect(monitor.getMetrics()).toHaveLength(0)
      expect(monitor.getAlerts()).toHaveLength(0)
      expect(monitor.getSuggestions()).toHaveLength(0)
      
      expect(emitSpy).toHaveBeenCalledWith(
        'performance-monitor:history-cleared',
        expect.any(Object),
        'EnhancedPerformanceMonitor'
      )
    })
  })

  describe('工具函数', () => {
    it('应该能够创建监控实例', () => {
      const customMonitor = createEnhancedPerformanceMonitor(eventBus, {
        sampleInterval: 5000
      })
      
      expect(customMonitor).toBeInstanceOf(EnhancedPerformanceMonitor)
    })

    it('应该正确格式化内存使用', () => {
      const memoryUsage = monitor['getMemoryUsage']()
      expect(typeof memoryUsage).toBe('number')
      expect(memoryUsage).toBeGreaterThanOrEqual(0)
    })

    it('应该正确估算事件监听器数量', () => {
      const listenerCount = monitor['getEventListenerCount']()
      expect(typeof listenerCount).toBe('number')
      expect(listenerCount).toBeGreaterThanOrEqual(0)
    })
  })

  describe('性能测试', () => {
    it('应该在100ms内完成基本操作', () => {
      const startTime = performance.now()
      
      // 执行一系列操作
      monitor.recordMetric('test1', 10, 'ms')
      monitor.recordMetric('test2', 20, 'ms')
      monitor.getMetrics()
      monitor.getAlerts()
      monitor.getSuggestions()
      monitor.getBenchmarks()
      monitor.getPerformanceSummary()
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      expect(duration).toBeLessThan(100)
    })

    it('应该能够处理大量指标', () => {
      const startTime = performance.now()
      
      // 记录1000个指标
      for (let i = 0; i < 1000; i++) {
        monitor.recordMetric(`metric-${i}`, Math.random() * 100, 'ms')
      }
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      expect(duration).toBeLessThan(1500) // 应该在1.5秒内完成（调整阈值以适应测试环境差异）
      expect(monitor.getMetrics()).toHaveLength(1000)
    })
  })

  describe('错误处理', () => {
    it('应该优雅处理PerformanceObserver不支持的情况', () => {
      // 临时移除PerformanceObserver
      const originalPO = global.PerformanceObserver
      delete (global as any).PerformanceObserver
      
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      expect(async () => {
        await monitor.start()
      }).not.toThrow()
      
      expect(consoleSpy).toHaveBeenCalledWith('PerformanceObserver not supported')
      
      // 恢复PerformanceObserver
      global.PerformanceObserver = originalPO
      consoleSpy.mockRestore()
    })

    it('应该处理计时器不存在的情况', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      const duration = monitor.endTimer('non-existent-timer')
      
      expect(duration).toBe(0)
      expect(consoleSpy).toHaveBeenCalledWith("Timer 'non-existent-timer' not found")
      
      consoleSpy.mockRestore()
    })
  })
})
