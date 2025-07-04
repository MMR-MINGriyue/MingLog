import { useState, useEffect, useCallback, useRef, useMemo } from 'react'

// 性能监控常量
const PERFORMANCE_THRESHOLDS = {
  RENDER_TIME_WARNING: 16, // 60fps = 16ms per frame
  RENDER_TIME_CRITICAL: 33, // 30fps = 33ms per frame
  MEMORY_WARNING: 100 * 1024 * 1024, // 100MB
  MEMORY_CRITICAL: 200 * 1024 * 1024, // 200MB
  DB_QUERY_WARNING: 100, // 100ms
  DB_QUERY_CRITICAL: 300, // 300ms
}

interface PerformanceMetrics {
  memoryUsage: {
    used: number
    total: number
    percentage: number
  }
  renderTime: number
  dbQueryTime: number
  componentCount: number
  lastUpdate: Date
  cpuCores?: number
  cpuUsage?: number
  diskRead?: number
  diskWrite?: number
  pageLoadTime?: number
  domNodes?: number
  jsHeapSize?: number
  networkRequests?: number
  fps?: number
  bundleSize?: number
}

interface VirtualizedPerformanceMonitorOptions {
  updateInterval?: number
  maxHistoryEntries?: number
  enableSmartSampling?: boolean
  enablePerformanceOptimization?: boolean
  samplingThreshold?: number
  compressionRatio?: number
}

interface VirtualizedPerformanceMonitorReturn {
  metrics: PerformanceMetrics
  history: PerformanceMetrics[]
  virtualizedHistory: PerformanceMetrics[]
  isMonitoring: boolean
  isLoading: boolean
  error: string | null
  performanceStats: {
    totalEntries: number
    virtualizedEntries: number
    compressionRatio: number
    memoryUsage: number
    renderTime: number
  }
  startMonitoring: () => void
  stopMonitoring: () => void
  clearHistory: () => void
  optimizeData: () => void
}

// 性能阈值检查
const checkPerformanceThresholds = (metrics: PerformanceMetrics) => {
  const warnings: string[] = []

  if (metrics.renderTime > 16) {
    warnings.push(`渲染时间过长: ${metrics.renderTime.toFixed(1)}ms`)
  }

  if (metrics.memoryUsage.used > 100 * 1024 * 1024) {
    warnings.push(`内存使用过高: ${(metrics.memoryUsage.used / 1024 / 1024).toFixed(1)}MB`)
  }

  if (metrics.dbQueryTime > 100) {
    warnings.push(`数据库查询缓慢: ${metrics.dbQueryTime.toFixed(1)}ms`)
  }

  return warnings
}

// 智能数据压缩算法 - 优化版本
const compressPerformanceData = (
  data: PerformanceMetrics[],
  maxEntries: number,
  compressionRatio: number = 0.7
): PerformanceMetrics[] => {
  if (data.length <= maxEntries) return data

  const targetSize = Math.floor(maxEntries * compressionRatio)
  const step = Math.ceil(data.length / targetSize)
  const compressed: PerformanceMetrics[] = []

  // 保留最新的数据点 (30%)
  const recentData = data.slice(-Math.floor(maxEntries * 0.3))

  // 对历史数据进行智能采样 (70%)
  const historicalData = data.slice(0, -recentData.length)
  for (let i = 0; i < historicalData.length; i += step) {
    compressed.push(historicalData[i])
  }

  // 合并压缩的历史数据和最新数据
  return [...compressed, ...recentData]
}

// 性能数据去重
const deduplicateData = (data: PerformanceMetrics[]): PerformanceMetrics[] => {
  const seen = new Set<string>()
  return data.filter(item => {
    const key = `${item.memoryUsage.percentage}-${item.renderTime}-${item.dbQueryTime}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// 计算数据变化率
const calculateChangeRate = (current: PerformanceMetrics, previous: PerformanceMetrics): number => {
  const memoryChange = Math.abs(current.memoryUsage.percentage - previous.memoryUsage.percentage)
  const renderChange = Math.abs(current.renderTime - previous.renderTime)
  const dbChange = Math.abs(current.dbQueryTime - previous.dbQueryTime)
  
  return (memoryChange + renderChange + dbChange) / 3
}

export const useVirtualizedPerformanceMonitor = (
  options: VirtualizedPerformanceMonitorOptions = {}
): VirtualizedPerformanceMonitorReturn => {
  const {
    updateInterval = 2000,
    maxHistoryEntries = 1000,
    enableSmartSampling = true,
    enablePerformanceOptimization = true,
    samplingThreshold = 5, // 变化率阈值
    compressionRatio = 0.7
  } = options

  // 状态管理
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    memoryUsage: { used: 0, total: 0, percentage: 0 },
    renderTime: 0,
    dbQueryTime: 0,
    componentCount: 0,
    lastUpdate: new Date()
  })

  const [history, setHistory] = useState<PerformanceMetrics[]>([])
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 引用管理
  const intervalRef = useRef<NodeJS.Timeout>()
  const lastMetricsRef = useRef<PerformanceMetrics | null>(null)
  const performanceObserverRef = useRef<PerformanceObserver>()
  const compressionWorkerRef = useRef<Worker>()

  // 虚拟化历史数据 - 智能采样和压缩
  const virtualizedHistory = useMemo(() => {
    if (!enableSmartSampling) return history

    let processedData = [...history]

    // 1. 去重
    processedData = deduplicateData(processedData)

    // 2. 智能采样 - 保留重要的数据点
    if (enableSmartSampling && processedData.length > 2) {
      const sampledData: PerformanceMetrics[] = [processedData[0]] // 保留第一个点

      for (let i = 1; i < processedData.length - 1; i++) {
        const current = processedData[i]
        const previous = processedData[i - 1]
        const changeRate = calculateChangeRate(current, previous)

        // 如果变化率超过阈值，保留这个数据点
        if (changeRate > samplingThreshold) {
          sampledData.push(current)
        }
      }

      // 保留最后一个点
      if (processedData.length > 1) {
        sampledData.push(processedData[processedData.length - 1])
      }

      processedData = sampledData
    }

    // 3. 数据压缩
    if (processedData.length > maxHistoryEntries) {
      processedData = compressPerformanceData(processedData, maxHistoryEntries, compressionRatio)
    }

    return processedData
  }, [history, enableSmartSampling, maxHistoryEntries, samplingThreshold, compressionRatio])

  // 性能统计
  const performanceStats = useMemo(() => {
    const memoryUsage = history.length * 0.1 // 估算内存使用 (KB)
    const avgRenderTime = virtualizedHistory.length > 0 
      ? virtualizedHistory.reduce((sum, item) => sum + item.renderTime, 0) / virtualizedHistory.length 
      : 0

    return {
      totalEntries: history.length,
      virtualizedEntries: virtualizedHistory.length,
      compressionRatio: history.length > 0 ? virtualizedHistory.length / history.length : 1,
      memoryUsage,
      renderTime: avgRenderTime
    }
  }, [history.length, virtualizedHistory])

  // 优化的内存使用监控
  const getMemoryUsage = useCallback(async () => {
    try {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        return {
          used: memory.usedJSHeapSize || 0,
          total: memory.totalJSHeapSize || 0,
          percentage: memory.totalJSHeapSize > 0
            ? (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
            : 0
        }
      }

      // 模拟数据作为后备
      const used = Math.random() * 50 + 20
      return {
        used: used * 1024 * 1024,
        total: 100 * 1024 * 1024,
        percentage: used
      }
    } catch (error) {
      console.error('Failed to get memory usage:', error)
      return { used: 0, total: 0, percentage: 0 }
    }
  }, [])

  // 优化的渲染时间测量
  const measureRenderTime = useCallback(async () => {
    return new Promise<number>((resolve) => {
      const startTime = performance.now()
      
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const endTime = performance.now()
          resolve(endTime - startTime)
        })
      })
    })
  }, [])

  // 数据库查询时间模拟
  const measureDbQueryTime = useCallback(async () => {
    const baseTime = Math.random() * 10 + 2
    const variation = (Math.random() - 0.5) * 4
    return Math.max(0, baseTime + variation)
  }, [])

  // 组件计数
  const countComponents = useCallback(() => {
    try {
      const rootElement = document.querySelector('#root')
      if (!rootElement) return 0
      
      const allElements = rootElement.querySelectorAll('*')
      return allElements.length
    } catch (error) {
      console.error('Failed to count components:', error)
      return 0
    }
  }, [])

  // 收集性能指标
  const collectMetrics = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [memUsage, renderTime, dbTime, compCount] = await Promise.all([
        getMemoryUsage(),
        measureRenderTime(),
        measureDbQueryTime(),
        Promise.resolve(countComponents())
      ])

      const newMetrics: PerformanceMetrics = {
        memoryUsage: memUsage,
        renderTime,
        dbQueryTime: dbTime,
        componentCount: compCount,
        lastUpdate: new Date()
      }

      setMetrics(newMetrics)
      
      // 智能历史记录管理
      setHistory(prev => {
        const updated = [...prev, newMetrics]
        
        // 如果启用性能优化，限制内存中的历史记录数量
        if (enablePerformanceOptimization && updated.length > maxHistoryEntries * 1.2) {
          return updated.slice(-maxHistoryEntries)
        }
        
        return updated
      })

      lastMetricsRef.current = newMetrics
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('Failed to collect metrics:', err)
    } finally {
      setIsLoading(false)
    }
  }, [getMemoryUsage, measureRenderTime, measureDbQueryTime, countComponents, enablePerformanceOptimization, maxHistoryEntries])

  // 开始监控
  const startMonitoring = useCallback(() => {
    if (isMonitoring) return

    setIsMonitoring(true)
    setError(null)

    // 立即收集一次数据
    collectMetrics()

    // 设置定时器
    intervalRef.current = setInterval(collectMetrics, updateInterval)

    // 设置性能观察器
    if ('PerformanceObserver' in window) {
      try {
        performanceObserverRef.current = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          // 处理性能条目
          console.debug('Performance entries:', entries.length)
        })
        
        performanceObserverRef.current.observe({ 
          entryTypes: ['measure', 'navigation', 'resource'] 
        })
      } catch (err) {
        console.warn('Failed to setup PerformanceObserver:', err)
      }
    }
  }, [isMonitoring, collectMetrics, updateInterval])

  // 停止监控
  const stopMonitoring = useCallback(() => {
    setIsMonitoring(false)
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = undefined
    }

    if (performanceObserverRef.current) {
      performanceObserverRef.current.disconnect()
      performanceObserverRef.current = undefined
    }
  }, [])

  // 清理历史记录
  const clearHistory = useCallback(() => {
    setHistory([])
    lastMetricsRef.current = null
  }, [])

  // 手动优化数据
  const optimizeData = useCallback(() => {
    setHistory(prev => {
      const optimized = compressPerformanceData(prev, maxHistoryEntries, compressionRatio)
      console.log(`Data optimized: ${prev.length} -> ${optimized.length} entries`)
      return optimized
    })
  }, [maxHistoryEntries, compressionRatio])

  // 清理副作用
  useEffect(() => {
    return () => {
      stopMonitoring()
      
      if (compressionWorkerRef.current) {
        compressionWorkerRef.current.terminate()
      }
    }
  }, [stopMonitoring])

  return {
    metrics,
    history,
    virtualizedHistory,
    isMonitoring,
    isLoading,
    error,
    performanceStats,
    startMonitoring,
    stopMonitoring,
    clearHistory,
    optimizeData
  }
}
