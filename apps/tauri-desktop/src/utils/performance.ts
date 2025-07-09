/**
 * 性能监控工具
 * 用于测量应用启动时间和关键性能指标
 */

interface PerformanceMetrics {
  startTime: number
  domContentLoaded: number
  appInitialized: number
  firstPaint: number
  firstContentfulPaint: number
  largestContentfulPaint: number
}

class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {}
  private observers: PerformanceObserver[] = []

  constructor() {
    this.metrics.startTime = performance.now()
    this.setupObservers()
    this.trackDOMEvents()
  }

  private setupObservers() {
    // 监控Paint事件
    if ('PerformanceObserver' in window) {
      try {
        const paintObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === 'first-paint') {
              this.metrics.firstPaint = entry.startTime
            } else if (entry.name === 'first-contentful-paint') {
              this.metrics.firstContentfulPaint = entry.startTime
            }
          }
        })
        paintObserver.observe({ entryTypes: ['paint'] })
        this.observers.push(paintObserver)

        // 监控LCP
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          this.metrics.largestContentfulPaint = lastEntry.startTime
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
        this.observers.push(lcpObserver)
      } catch (error) {
        console.warn('Performance observers not supported:', error)
      }
    }
  }

  private trackDOMEvents() {
    // DOM Content Loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        this.metrics.domContentLoaded = performance.now()
      })
    } else {
      this.metrics.domContentLoaded = performance.now()
    }
  }

  markAppInitialized() {
    this.metrics.appInitialized = performance.now()
    this.logMetrics()
  }

  private logMetrics() {
    const startTime = this.metrics.startTime || 0
    
    console.group('🚀 MingLog Performance Metrics')
    console.log(`📊 DOM Content Loaded: ${((this.metrics.domContentLoaded || 0) - startTime).toFixed(2)}ms`)
    console.log(`🎨 First Paint: ${((this.metrics.firstPaint || 0) - startTime).toFixed(2)}ms`)
    console.log(`🖼️ First Contentful Paint: ${((this.metrics.firstContentfulPaint || 0) - startTime).toFixed(2)}ms`)
    console.log(`📱 App Initialized: ${((this.metrics.appInitialized || 0) - startTime).toFixed(2)}ms`)
    
    if (this.metrics.largestContentfulPaint) {
      console.log(`🏆 Largest Contentful Paint: ${((this.metrics.largestContentfulPaint || 0) - startTime).toFixed(2)}ms`)
    }
    
    // 性能评估
    const appInitTime = (this.metrics.appInitialized || 0) - startTime
    if (appInitTime < 1000) {
      console.log('✅ 启动性能: 优秀 (<1s)')
    } else if (appInitTime < 2000) {
      console.log('🟡 启动性能: 良好 (<2s)')
    } else if (appInitTime < 3000) {
      console.log('🟠 启动性能: 一般 (<3s)')
    } else {
      console.log('🔴 启动性能: 需要优化 (>3s)')
    }
    
    console.groupEnd()
  }

  getMetrics(): PerformanceMetrics {
    return this.metrics as PerformanceMetrics
  }

  destroy() {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }
}

// 创建全局性能监控实例
export const performanceMonitor = new PerformanceMonitor()

// 性能优化工具函数
export const performanceUtils = {
  // 延迟执行函数，避免阻塞主线程
  defer: (fn: () => void, delay = 0) => {
    setTimeout(fn, delay)
  },

  // 使用requestIdleCallback优化非关键任务
  idle: (fn: () => void, timeout = 5000) => {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(fn, { timeout })
    } else {
      setTimeout(fn, 0)
    }
  },

  // 预加载资源
  preload: (url: string, as: string = 'script') => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = url
    link.as = as
    document.head.appendChild(link)
  },

  // 测量函数执行时间
  measure: async <T>(name: string, fn: () => Promise<T> | T): Promise<T> => {
    const start = performance.now()
    const result = await fn()
    const end = performance.now()
    console.log(`⏱️ ${name}: ${(end - start).toFixed(2)}ms`)
    return result
  },

  // 内存使用情况监控
  memoryUsage: () => {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return {
        used: Math.round(memory.usedJSHeapSize / 1048576), // MB
        total: Math.round(memory.totalJSHeapSize / 1048576), // MB
        limit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
      }
    }
    return null
  },

  // 检查是否为慢设备
  isSlowDevice: () => {
    // 基于硬件并发数判断
    const cores = navigator.hardwareConcurrency || 1
    const memory = (navigator as any).deviceMemory || 1
    
    return cores <= 2 || memory <= 2
  },

  // 获取网络连接信息
  getConnectionInfo: () => {
    const connection = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection
    
    if (connection) {
      return {
        effectiveType: connection.effectiveType,
        downlink: connection.downlink,
        rtt: connection.rtt,
        saveData: connection.saveData,
      }
    }
    
    return null
  }
}

// 启动时自动记录基本信息
performanceUtils.idle(() => {
  const memory = performanceUtils.memoryUsage()
  const connection = performanceUtils.getConnectionInfo()
  const isSlowDevice = performanceUtils.isSlowDevice()
  
  console.group('📱 Device Information')
  console.log(`💾 Memory: ${memory ? `${memory.used}MB / ${memory.total}MB` : 'Unknown'}`)
  console.log(`🌐 Connection: ${connection ? connection.effectiveType : 'Unknown'}`)
  console.log(`⚡ Device Speed: ${isSlowDevice ? 'Slow' : 'Fast'}`)
  console.log(`🧮 CPU Cores: ${navigator.hardwareConcurrency || 'Unknown'}`)
  console.groupEnd()
})

export default performanceMonitor
