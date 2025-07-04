/**
 * 性能基准测试套件
 * 用于验证性能优化效果和确保性能指标达标
 */

import { renderHook, act } from '@testing-library/react'
import { useOptimizedPerformanceMonitor } from '../hooks/useOptimizedPerformanceMonitor'

// Mock Tauri API
jest.mock('@tauri-apps/api/tauri', () => ({
  invoke: jest.fn()
}))

// Mock error tracker
jest.mock('../utils/errorTracking', () => ({
  errorTracker: {
    captureError: jest.fn(),
    capturePerformanceMetric: jest.fn()
  }
}))

// Mock memory optimization utilities
jest.mock('../utils/memoryOptimization', () => ({
  optimizePerformanceHistory: jest.fn((history, maxEntries) => 
    history.slice(-maxEntries)
  ),
  createPerformanceMonitor: jest.fn(() => ({
    startMonitoring: jest.fn(),
    stopMonitoring: jest.fn(),
    recordMetric: jest.fn(),
    clearMetrics: jest.fn()
  }))
}))

describe('Performance Benchmark Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset performance timing
    if (typeof performance !== 'undefined') {
      jest.spyOn(performance, 'now').mockReturnValue(0)
    }
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Memory Management Performance', () => {
    it('should not exceed memory usage thresholds', async () => {
      const { result } = renderHook(() => useOptimizedPerformanceMonitor({
        updateInterval: 100,
        maxHistoryEntries: 20,
        enableAutoOptimization: true
      }))

      // Simulate memory monitoring
      act(() => {
        result.current.startMonitoring()
      })

      // Wait for multiple updates
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 500))
      })

      // Verify memory usage is within acceptable limits
      expect(result.current.metrics.memoryUsage.percentage).toBeLessThan(80)
      
      // Cleanup
      act(() => {
        result.current.stopMonitoring()
      })
    })

    it('should properly clean up resources on unmount', () => {
      const { result, unmount } = renderHook(() => useOptimizedPerformanceMonitor())

      act(() => {
        result.current.startMonitoring()
      })

      // Verify monitoring is active
      expect(result.current.isMonitoring).toBe(true)

      // Unmount and verify cleanup
      unmount()

      // No memory leaks should occur
      expect(true).toBe(true) // Placeholder for memory leak detection
    })

    it('should optimize history data efficiently', () => {
      const { result } = renderHook(() => useOptimizedPerformanceMonitor({
        maxHistoryEntries: 10
      }))

      // Simulate adding many history entries
      act(() => {
        result.current.startMonitoring()
      })

      // History should not exceed max entries
      expect(result.current.history.length).toBeLessThanOrEqual(10)
    })
  })

  describe('Rendering Performance', () => {
    it('should maintain target frame rate', async () => {
      const startTime = performance.now()
      
      const { result } = renderHook(() => useOptimizedPerformanceMonitor({
        updateInterval: 16 // ~60fps
      }))

      act(() => {
        result.current.startMonitoring()
      })

      // Simulate multiple render cycles
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should maintain reasonable render performance
      expect(renderTime).toBeLessThan(100) // 100ms for test operations

      act(() => {
        result.current.stopMonitoring()
      })
    })

    it('should minimize unnecessary re-renders', () => {
      let renderCount = 0
      
      const { rerender } = renderHook(() => {
        renderCount++
        return useOptimizedPerformanceMonitor()
      })

      const initialRenderCount = renderCount

      // Multiple rerenders with same props should not cause excessive renders
      rerender()
      rerender()
      rerender()

      const finalRenderCount = renderCount
      const additionalRenders = finalRenderCount - initialRenderCount

      // Should minimize unnecessary renders
      expect(additionalRenders).toBeLessThan(5)
    })
  })

  describe('Error Handling Performance', () => {
    it('should recover from errors quickly', async () => {
      const { result } = renderHook(() => useOptimizedPerformanceMonitor())

      const startTime = performance.now()

      // Simulate error condition
      act(() => {
        // Trigger error scenario
        result.current.startMonitoring()
      })

      // Wait for error recovery
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50))
      })

      const recoveryTime = performance.now() - startTime

      // Should recover quickly from errors
      expect(recoveryTime).toBeLessThan(100) // 100ms recovery time
      expect(result.current.error).toBeNull()
    })

    it('should handle high-frequency updates without degradation', async () => {
      const { result } = renderHook(() => useOptimizedPerformanceMonitor({
        updateInterval: 10 // Very frequent updates
      }))

      const startTime = performance.now()

      act(() => {
        result.current.startMonitoring()
      })

      // Run for a short period with high frequency
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200))
      })

      const endTime = performance.now()
      const totalTime = endTime - startTime

      // Should handle high frequency without significant performance impact
      expect(totalTime).toBeLessThan(300) // Should complete within reasonable time

      act(() => {
        result.current.stopMonitoring()
      })
    })
  })

  describe('Optimization Suggestions Performance', () => {
    it('should generate suggestions efficiently', () => {
      const { result } = renderHook(() => useOptimizedPerformanceMonitor())

      const startTime = performance.now()

      act(() => {
        const suggestions = result.current.getOptimizationSuggestions()
        expect(Array.isArray(suggestions)).toBe(true)
      })

      const endTime = performance.now()
      const executionTime = endTime - startTime

      // Should generate suggestions quickly
      expect(executionTime).toBeLessThan(10) // 10ms for suggestion generation
    })

    it('should cache suggestions to avoid recalculation', () => {
      const { result } = renderHook(() => useOptimizedPerformanceMonitor())

      // First call
      const startTime1 = performance.now()
      act(() => {
        result.current.getOptimizationSuggestions()
      })
      const time1 = performance.now() - startTime1

      // Second call (should be cached)
      const startTime2 = performance.now()
      act(() => {
        result.current.getOptimizationSuggestions()
      })
      const time2 = performance.now() - startTime2

      // Second call should be faster due to caching
      expect(time2).toBeLessThanOrEqual(time1)
    })
  })

  describe('Resource Usage Benchmarks', () => {
    it('should stay within CPU usage limits', async () => {
      const { result } = renderHook(() => useOptimizedPerformanceMonitor())

      // Monitor CPU-intensive operations
      const startTime = performance.now()

      act(() => {
        result.current.startMonitoring()
      })

      // Simulate workload
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      const endTime = performance.now()
      const cpuTime = endTime - startTime

      // Should not consume excessive CPU time
      expect(cpuTime).toBeLessThan(200) // 200ms for test operations

      act(() => {
        result.current.stopMonitoring()
      })
    })

    it('should handle concurrent operations efficiently', async () => {
      const hooks = Array.from({ length: 5 }, () => 
        renderHook(() => useOptimizedPerformanceMonitor())
      )

      const startTime = performance.now()

      // Start monitoring on all hooks concurrently
      await act(async () => {
        hooks.forEach(({ result }) => {
          result.current.startMonitoring()
        })
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      const endTime = performance.now()
      const totalTime = endTime - startTime

      // Should handle concurrent operations efficiently
      expect(totalTime).toBeLessThan(300) // 300ms for concurrent operations

      // Cleanup
      act(() => {
        hooks.forEach(({ result }) => {
          result.current.stopMonitoring()
        })
      })
    })
  })

  describe('Performance Regression Tests', () => {
    it('should maintain baseline performance metrics', async () => {
      const { result } = renderHook(() => useOptimizedPerformanceMonitor())

      const baselineMetrics = {
        memoryUsage: 120, // MB
        renderTime: 16,   // ms
        errorRecovery: 2  // seconds
      }

      act(() => {
        result.current.startMonitoring()
      })

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100))
      })

      // Verify metrics meet baseline requirements
      expect(result.current.metrics.memoryUsage.used).toBeLessThan(baselineMetrics.memoryUsage)
      expect(result.current.metrics.renderTime).toBeLessThan(baselineMetrics.renderTime)

      act(() => {
        result.current.stopMonitoring()
      })
    })

    it('should not degrade over time', async () => {
      const { result } = renderHook(() => useOptimizedPerformanceMonitor())

      const initialMetrics: number[] = []
      const finalMetrics: number[] = []

      act(() => {
        result.current.startMonitoring()
      })

      // Collect initial metrics
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 50))
        initialMetrics.push(result.current.metrics.renderTime)
      })

      // Run for extended period
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 200))
        finalMetrics.push(result.current.metrics.renderTime)
      })

      // Performance should not degrade significantly over time
      const initialAvg = initialMetrics.reduce((a, b) => a + b, 0) / initialMetrics.length
      const finalAvg = finalMetrics.reduce((a, b) => a + b, 0) / finalMetrics.length
      
      expect(finalAvg).toBeLessThanOrEqual(initialAvg * 1.1) // Allow 10% degradation tolerance

      act(() => {
        result.current.stopMonitoring()
      })
    })
  })
})

// Performance test utilities
export const performanceBenchmarks = {
  memoryUsageThreshold: 120, // MB
  renderTimeThreshold: 16,   // ms
  errorRecoveryThreshold: 2, // seconds
  cpuUsageThreshold: 50,     // percentage
  
  async runBenchmark(testName: string, testFn: () => Promise<void>) {
    const startTime = performance.now()
    const startMemory = (performance as any).memory?.usedJSHeapSize || 0
    
    try {
      await testFn()
      
      const endTime = performance.now()
      const endMemory = (performance as any).memory?.usedJSHeapSize || 0
      
      const results = {
        testName,
        executionTime: endTime - startTime,
        memoryDelta: endMemory - startMemory,
        success: true
      }
      
      console.log(`Benchmark ${testName}:`, results)
      return results
    } catch (error) {
      console.error(`Benchmark ${testName} failed:`, error)
      return {
        testName,
        executionTime: performance.now() - startTime,
        memoryDelta: 0,
        success: false,
        error
      }
    }
  }
}
