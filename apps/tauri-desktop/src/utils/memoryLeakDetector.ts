// 内存泄漏检测和修复工具
import { useEffect, useRef, useCallback } from 'react'

// 内存泄漏检测器接口
interface MemoryLeakDetector {
  id: string
  name: string
  check: () => boolean
  fix?: () => void
  description: string
}

// 全局资源跟踪器
class ResourceTracker {
  private static instance: ResourceTracker
  private intervals: Set<NodeJS.Timeout> = new Set()
  private timeouts: Set<NodeJS.Timeout> = new Set()
  private eventListeners: Map<EventTarget, Map<string, EventListener[]>> = new Map()
  private performanceObservers: Set<PerformanceObserver> = new Set()
  private intersectionObservers: Set<IntersectionObserver> = new Set()
  private animationFrames: Set<number> = new Set()
  private webSockets: Set<WebSocket> = new Set()
  private workers: Set<Worker> = new Set()

  static getInstance(): ResourceTracker {
    if (!ResourceTracker.instance) {
      ResourceTracker.instance = new ResourceTracker()
    }
    return ResourceTracker.instance
  }

  // 注册资源
  registerInterval(id: NodeJS.Timeout): void {
    this.intervals.add(id)
  }

  registerTimeout(id: NodeJS.Timeout): void {
    this.timeouts.add(id)
  }

  registerEventListener(target: EventTarget, type: string, listener: EventListener): void {
    if (!this.eventListeners.has(target)) {
      this.eventListeners.set(target, new Map())
    }
    const targetListeners = this.eventListeners.get(target)!
    if (!targetListeners.has(type)) {
      targetListeners.set(type, [])
    }
    targetListeners.get(type)!.push(listener)
  }

  registerPerformanceObserver(observer: PerformanceObserver): void {
    this.performanceObservers.add(observer)
  }

  registerIntersectionObserver(observer: IntersectionObserver): void {
    this.intersectionObservers.add(observer)
  }

  registerAnimationFrame(id: number): void {
    this.animationFrames.add(id)
  }

  registerWebSocket(ws: WebSocket): void {
    this.webSockets.add(ws)
  }

  registerWorker(worker: Worker): void {
    this.workers.add(worker)
  }

  // 清理资源
  clearInterval(id: NodeJS.Timeout): void {
    clearInterval(id)
    this.intervals.delete(id)
  }

  clearTimeout(id: NodeJS.Timeout): void {
    clearTimeout(id)
    this.timeouts.delete(id)
  }

  removeEventListener(target: EventTarget, type: string, listener: EventListener): void {
    target.removeEventListener(type, listener)
    const targetListeners = this.eventListeners.get(target)
    if (targetListeners) {
      const listeners = targetListeners.get(type)
      if (listeners) {
        const index = listeners.indexOf(listener)
        if (index > -1) {
          listeners.splice(index, 1)
        }
      }
    }
  }

  disconnectPerformanceObserver(observer: PerformanceObserver): void {
    observer.disconnect()
    this.performanceObservers.delete(observer)
  }

  disconnectIntersectionObserver(observer: IntersectionObserver): void {
    observer.disconnect()
    this.intersectionObservers.delete(observer)
  }

  cancelAnimationFrame(id: number): void {
    cancelAnimationFrame(id)
    this.animationFrames.delete(id)
  }

  closeWebSocket(ws: WebSocket): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.close()
    }
    this.webSockets.delete(ws)
  }

  terminateWorker(worker: Worker): void {
    worker.terminate()
    this.workers.delete(worker)
  }

  // 清理所有资源
  clearAllResources(): void {
    // 清理定时器
    this.intervals.forEach(id => clearInterval(id))
    this.timeouts.forEach(id => clearTimeout(id))
    
    // 清理事件监听器
    this.eventListeners.forEach((targetListeners, target) => {
      targetListeners.forEach((listeners, type) => {
        listeners.forEach(listener => {
          target.removeEventListener(type, listener)
        })
      })
    })
    
    // 清理观察器
    this.performanceObservers.forEach(observer => observer.disconnect())
    this.intersectionObservers.forEach(observer => observer.disconnect())
    
    // 清理动画帧
    this.animationFrames.forEach(id => cancelAnimationFrame(id))
    
    // 清理WebSocket
    this.webSockets.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close()
      }
    })
    
    // 清理Worker
    this.workers.forEach(worker => worker.terminate())
    
    // 清空所有集合
    this.intervals.clear()
    this.timeouts.clear()
    this.eventListeners.clear()
    this.performanceObservers.clear()
    this.intersectionObservers.clear()
    this.animationFrames.clear()
    this.webSockets.clear()
    this.workers.clear()
  }

  // 获取资源统计
  getResourceStats() {
    return {
      intervals: this.intervals.size,
      timeouts: this.timeouts.size,
      eventListeners: Array.from(this.eventListeners.values()).reduce(
        (total, targetListeners) => total + Array.from(targetListeners.values()).reduce(
          (sum, listeners) => sum + listeners.length, 0
        ), 0
      ),
      performanceObservers: this.performanceObservers.size,
      intersectionObservers: this.intersectionObservers.size,
      animationFrames: this.animationFrames.size,
      webSockets: this.webSockets.size,
      workers: this.workers.size
    }
  }
}

// 内存泄漏检测器集合
const memoryLeakDetectors: MemoryLeakDetector[] = [
  {
    id: 'uncleaned-intervals',
    name: '未清理的定时器',
    description: '检测未清理的setInterval和setTimeout',
    check: () => {
      const tracker = ResourceTracker.getInstance()
      const stats = tracker.getResourceStats()
      return stats.intervals > 5 || stats.timeouts > 10
    },
    fix: () => {
      const tracker = ResourceTracker.getInstance()
      tracker.clearAllResources()
    }
  },
  {
    id: 'uncleaned-event-listeners',
    name: '未清理的事件监听器',
    description: '检测未清理的事件监听器',
    check: () => {
      const tracker = ResourceTracker.getInstance()
      const stats = tracker.getResourceStats()
      return stats.eventListeners > 50
    }
  },
  {
    id: 'uncleaned-observers',
    name: '未清理的观察器',
    description: '检测未清理的PerformanceObserver和IntersectionObserver',
    check: () => {
      const tracker = ResourceTracker.getInstance()
      const stats = tracker.getResourceStats()
      return stats.performanceObservers > 3 || stats.intersectionObservers > 5
    }
  },
  {
    id: 'memory-growth',
    name: '内存持续增长',
    description: '检测内存使用量是否持续增长',
    check: () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        const usagePercentage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
        return usagePercentage > 80
      }
      return false
    }
  },
  {
    id: 'dom-nodes-growth',
    name: 'DOM节点过多',
    description: '检测DOM节点数量是否过多',
    check: () => {
      const nodeCount = document.querySelectorAll('*').length
      return nodeCount > 5000
    }
  }
]

// React Hook for memory leak detection
export const useMemoryLeakDetection = (
  enabled: boolean = true,
  checkInterval: number = 30000 // 30秒检查一次
) => {
  const detectionIntervalRef = useRef<NodeJS.Timeout>()
  const leakReportsRef = useRef<Array<{ detector: MemoryLeakDetector; timestamp: Date }>>([])

  const runDetection = useCallback(() => {
    if (!enabled) return

    const detectedLeaks: Array<{ detector: MemoryLeakDetector; timestamp: Date }> = []

    memoryLeakDetectors.forEach(detector => {
      try {
        if (detector.check()) {
          detectedLeaks.push({
            detector,
            timestamp: new Date()
          })
          
          console.warn(`🚨 Memory leak detected: ${detector.name}`, {
            description: detector.description,
            timestamp: new Date().toISOString()
          })

          // 尝试自动修复
          if (detector.fix) {
            try {
              detector.fix()
              console.info(`✅ Auto-fixed memory leak: ${detector.name}`)
            } catch (error) {
              console.error(`❌ Failed to auto-fix memory leak: ${detector.name}`, error)
            }
          }
        }
      } catch (error) {
        console.error(`Error running detector ${detector.name}:`, error)
      }
    })

    leakReportsRef.current = [...leakReportsRef.current, ...detectedLeaks].slice(-50) // 保留最近50个报告
  }, [enabled])

  useEffect(() => {
    if (!enabled) return

    // 立即运行一次检测
    runDetection()

    // 设置定期检测
    detectionIntervalRef.current = setInterval(runDetection, checkInterval)

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current)
      }
    }
  }, [enabled, checkInterval, runDetection])

  const getLeakReports = useCallback(() => {
    return leakReportsRef.current
  }, [])

  const clearLeakReports = useCallback(() => {
    leakReportsRef.current = []
  }, [])

  const forceDetection = useCallback(() => {
    runDetection()
  }, [runDetection])

  return {
    getLeakReports,
    clearLeakReports,
    forceDetection,
    resourceStats: ResourceTracker.getInstance().getResourceStats()
  }
}

// 安全的资源管理Hook
export const useSafeResource = () => {
  const tracker = ResourceTracker.getInstance()
  const mountedRef = useRef(true)

  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  const safeSetInterval = useCallback((callback: () => void, delay: number) => {
    const id = setInterval(() => {
      if (mountedRef.current) {
        callback()
      }
    }, delay)
    tracker.registerInterval(id)
    return id
  }, [tracker])

  const safeSetTimeout = useCallback((callback: () => void, delay: number) => {
    const id = setTimeout(() => {
      if (mountedRef.current) {
        callback()
      }
    }, delay)
    tracker.registerTimeout(id)
    return id
  }, [tracker])

  const safeAddEventListener = useCallback((
    target: EventTarget,
    type: string,
    listener: EventListener,
    options?: boolean | AddEventListenerOptions
  ) => {
    const safeListener = (event: Event) => {
      if (mountedRef.current) {
        listener(event)
      }
    }
    target.addEventListener(type, safeListener, options)
    tracker.registerEventListener(target, type, safeListener)
    return () => tracker.removeEventListener(target, type, safeListener)
  }, [tracker])

  const safeClearInterval = useCallback((id: NodeJS.Timeout) => {
    tracker.clearInterval(id)
  }, [tracker])

  const safeClearTimeout = useCallback((id: NodeJS.Timeout) => {
    tracker.clearTimeout(id)
  }, [tracker])

  return {
    safeSetInterval,
    safeSetTimeout,
    safeAddEventListener,
    safeClearInterval,
    safeClearTimeout,
    isMounted: () => mountedRef.current
  }
}

export { ResourceTracker }
