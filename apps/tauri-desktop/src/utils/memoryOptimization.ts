// Memory optimization utilities for MingLog

interface MemoryUsage {
  used: number
  total: number
  percentage: number
}

interface PerformanceMetrics {
  memoryUsage: MemoryUsage
  renderTime: number
  dbQueryTime: number
  componentCount: number
  lastUpdate: Date
}

// Memory optimization for search results
export const optimizeSearchResults = <T extends { content: string; excerpt: string }>(
  results: T[], 
  maxResults: number = 100,
  maxContentLength: number = 500,
  maxExcerptLength: number = 200
): T[] => {
  // Limit results for performance
  const limitedResults = results.slice(0, maxResults)
  
  // Truncate long content to reduce memory usage
  return limitedResults.map(result => ({
    ...result,
    content: result.content.length > maxContentLength 
      ? result.content.substring(0, maxContentLength) + '...' 
      : result.content,
    excerpt: result.excerpt.length > maxExcerptLength 
      ? result.excerpt.substring(0, maxExcerptLength) + '...' 
      : result.excerpt
  }))
}

// Performance history optimization
export const optimizePerformanceHistory = (
  history: PerformanceMetrics[], 
  maxEntries: number = 20
): PerformanceMetrics[] => {
  if (history.length <= maxEntries) return history
  
  // Keep recent entries and some historical samples
  const recentEntries = history.slice(-Math.floor(maxEntries * 0.7)) // 70% recent
  const historicalSamples = history
    .slice(0, -Math.floor(maxEntries * 0.7))
    .filter((_, index) => index % 3 === 0) // Sample every 3rd entry
    .slice(-Math.floor(maxEntries * 0.3)) // 30% historical
  
  return [...historicalSamples, ...recentEntries]
}

// Cache management with memory limits
class MemoryAwareCache<K, V> {
  private cache = new Map<K, V>()
  private accessTimes = new Map<K, number>()
  private maxSize: number
  private maxMemoryMB: number

  constructor(maxSize: number = 100, maxMemoryMB: number = 10) {
    this.maxSize = maxSize
    this.maxMemoryMB = maxMemoryMB
  }

  set(key: K, value: V): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictOldest()
    }

    // Check memory usage (rough estimation)
    const estimatedSize = this.estimateSize(value)
    if (estimatedSize > this.maxMemoryMB * 1024 * 1024) {
      console.warn('Cache value too large, skipping cache')
      return
    }

    this.cache.set(key, value)
    this.accessTimes.set(key, Date.now())
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key)
    if (value !== undefined) {
      this.accessTimes.set(key, Date.now()) // Update access time
    }
    return value
  }

  has(key: K): boolean {
    return this.cache.has(key)
  }

  delete(key: K): boolean {
    this.accessTimes.delete(key)
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
    this.accessTimes.clear()
  }

  size(): number {
    return this.cache.size
  }

  // Evict least recently used entries
  private evictOldest(): void {
    let oldestKey: K | undefined
    let oldestTime = Infinity

    for (const [key, time] of this.accessTimes) {
      if (time < oldestTime) {
        oldestTime = time
        oldestKey = key
      }
    }

    if (oldestKey !== undefined) {
      this.delete(oldestKey)
    }
  }

  // Rough memory size estimation
  private estimateSize(value: V): number {
    try {
      return JSON.stringify(value).length * 2 // Rough estimate: 2 bytes per character
    } catch {
      return 1024 // Default estimate for non-serializable objects
    }
  }

  // Get cache statistics
  getStats() {
    const totalEstimatedSize = Array.from(this.cache.values())
      .reduce((total, value) => total + this.estimateSize(value), 0)

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      estimatedMemoryMB: totalEstimatedSize / (1024 * 1024),
      maxMemoryMB: this.maxMemoryMB,
      hitRate: this.calculateHitRate()
    }
  }

  private calculateHitRate(): number {
    // This would need to be implemented with hit/miss tracking
    return 0 // Placeholder
  }
}

// Global cache instances
export const searchResultsCache = new MemoryAwareCache<string, any[]>(50, 5) // 5MB max
export const performanceMetricsCache = new MemoryAwareCache<string, PerformanceMetrics>(20, 1) // 1MB max

// Memory monitoring utilities
export const getMemoryUsage = (): MemoryUsage => {
  if ('memory' in performance) {
    const memory = (performance as any).memory
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100
    }
  }
  
  // Fallback for browsers without memory API
  return {
    used: 0,
    total: 0,
    percentage: 0
  }
}

// Debounced function creator with memory optimization
export const createOptimizedDebounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number,
  maxPendingCalls: number = 10
): T => {
  let timeoutId: NodeJS.Timeout | null = null
  let pendingCalls = 0

  return ((...args: Parameters<T>) => {
    // Prevent memory leaks from too many pending calls
    if (pendingCalls >= maxPendingCalls) {
      console.warn('Too many pending debounced calls, skipping')
      return
    }

    if (timeoutId) {
      clearTimeout(timeoutId)
      pendingCalls--
    }

    pendingCalls++
    timeoutId = setTimeout(() => {
      pendingCalls--
      func(...args)
    }, delay)
  }) as T
}

// Component cleanup utilities
export const createCleanupManager = () => {
  const cleanupFunctions: (() => void)[] = []

  const addCleanup = (cleanup: () => void) => {
    cleanupFunctions.push(cleanup)
  }

  const cleanup = () => {
    cleanupFunctions.forEach(fn => {
      try {
        fn()
      } catch (error) {
        console.error('Cleanup function failed:', error)
      }
    })
    cleanupFunctions.length = 0
  }

  return { addCleanup, cleanup }
}

// Performance monitoring with memory awareness
export const createPerformanceMonitor = () => {
  let isMonitoring = false
  let metrics: PerformanceMetrics[] = []
  const maxMetrics = 50

  const startMonitoring = () => {
    isMonitoring = true
  }

  const stopMonitoring = () => {
    isMonitoring = false
  }

  const recordMetric = (metric: PerformanceMetrics) => {
    if (!isMonitoring) return

    metrics.push(metric)
    
    // Keep memory usage under control
    if (metrics.length > maxMetrics) {
      metrics = optimizePerformanceHistory(metrics, maxMetrics)
    }
  }

  const getMetrics = () => [...metrics] // Return copy to prevent mutations

  const clearMetrics = () => {
    metrics.length = 0
  }

  return {
    startMonitoring,
    stopMonitoring,
    recordMetric,
    getMetrics,
    clearMetrics,
    isMonitoring: () => isMonitoring
  }
}

// Memory leak detection
export const detectMemoryLeaks = () => {
  const initialMemory = getMemoryUsage()
  
  return {
    check: () => {
      const currentMemory = getMemoryUsage()
      const memoryIncrease = currentMemory.used - initialMemory.used
      const percentageIncrease = (memoryIncrease / initialMemory.used) * 100
      
      if (percentageIncrease > 50) { // 50% increase threshold
        console.warn(`Potential memory leak detected: ${percentageIncrease.toFixed(1)}% increase`)
        return {
          hasLeak: true,
          increase: memoryIncrease,
          percentageIncrease
        }
      }
      
      return {
        hasLeak: false,
        increase: memoryIncrease,
        percentageIncrease
      }
    }
  }
}

// Export default optimization configuration
export const defaultOptimizationConfig = {
  maxSearchResults: 100,
  maxContentLength: 500,
  maxExcerptLength: 200,
  maxPerformanceHistory: 20,
  cacheMaxSize: 50,
  cacheMaxMemoryMB: 5,
  debounceDelay: 300,
  maxPendingCalls: 10
}

export default {
  optimizeSearchResults,
  optimizePerformanceHistory,
  MemoryAwareCache,
  searchResultsCache,
  performanceMetricsCache,
  getMemoryUsage,
  createOptimizedDebounce,
  createCleanupManager,
  createPerformanceMonitor,
  detectMemoryLeaks,
  defaultOptimizationConfig
}
