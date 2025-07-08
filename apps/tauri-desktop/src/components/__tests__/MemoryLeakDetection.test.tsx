import { render, screen, waitFor, act } from '@testing-library/react'
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest'
import { useMemoryLeakDetection, useSafeResource, ResourceTracker } from '../../utils/memoryLeakDetector'
import React, { useEffect } from 'react'

// Mock performance.memory
const mockMemory = {
  usedJSHeapSize: 50 * 1024 * 1024, // 50MB
  totalJSHeapSize: 100 * 1024 * 1024, // 100MB
  jsHeapSizeLimit: 2 * 1024 * 1024 * 1024 // 2GB
}

Object.defineProperty(performance, 'memory', {
  value: mockMemory,
  writable: true
})

// Test component that uses memory leak detection
const TestComponentWithDetection: React.FC<{ enabled?: boolean }> = ({ enabled = true }) => {
  const { getLeakReports, forceDetection, resourceStats } = useMemoryLeakDetection(enabled, 1000)

  return (
    <div data-testid="test-component">
      <button onClick={forceDetection} data-testid="force-detection">
        Force Detection
      </button>
      <div data-testid="leak-reports">{getLeakReports().length}</div>
      <div data-testid="resource-stats">{JSON.stringify(resourceStats)}</div>
    </div>
  )
}

// Test component that uses safe resources
const TestComponentWithSafeResources: React.FC = () => {
  const { safeSetInterval, safeSetTimeout, safeAddEventListener, safeClearInterval } = useSafeResource()

  useEffect(() => {
    // 创建一些资源
    const intervalId = safeSetInterval(() => {
      console.log('Safe interval')
    }, 1000)

    const timeoutId = safeSetTimeout(() => {
      console.log('Safe timeout')
    }, 2000)

    const removeListener = safeAddEventListener(window, 'resize', () => {
      console.log('Window resized')
    })

    return () => {
      safeClearInterval(intervalId)
      removeListener()
    }
  }, [safeSetInterval, safeSetTimeout, safeAddEventListener, safeClearInterval])

  return <div data-testid="safe-resource-component">Safe Resources</div>
}

// Test component that creates memory leaks
const LeakyComponent: React.FC = () => {
  useEffect(() => {
    const tracker = ResourceTracker.getInstance()

    // 创建未清理的定时器
    const interval1 = setInterval(() => {}, 100)
    const interval2 = setInterval(() => {}, 200)
    const interval3 = setInterval(() => {}, 300)
    const interval4 = setInterval(() => {}, 400)
    const interval5 = setInterval(() => {}, 500)
    const interval6 = setInterval(() => {}, 600) // 第6个，会触发检测

    // 注册到ResourceTracker
    tracker.registerInterval(interval1)
    tracker.registerInterval(interval2)
    tracker.registerInterval(interval3)
    tracker.registerInterval(interval4)
    tracker.registerInterval(interval5)
    tracker.registerInterval(interval6)

    // 创建未清理的事件监听器
    const handler = () => {}
    for (let i = 0; i < 60; i++) { // 创建60个监听器，会触发检测
      window.addEventListener('click', handler)
      tracker.registerEventListener(window, 'click', handler)
    }

    // 故意不清理资源来测试检测功能
  }, [])

  return <div data-testid="leaky-component">Leaky Component</div>
}

describe('Memory Leak Detection', () => {
  let tracker: ResourceTracker

  beforeEach(() => {
    tracker = ResourceTracker.getInstance()
    vi.clearAllMocks()
    
    // 重置mock memory
    mockMemory.usedJSHeapSize = 50 * 1024 * 1024
  })

  afterEach(() => {
    // 清理所有资源
    tracker.clearAllResources()
  })

  describe('ResourceTracker', () => {
    it('should track intervals correctly', () => {
      const id1 = setInterval(() => {}, 1000)
      const id2 = setInterval(() => {}, 2000)
      
      tracker.registerInterval(id1)
      tracker.registerInterval(id2)
      
      const stats = tracker.getResourceStats()
      expect(stats.intervals).toBe(2)
      
      tracker.clearInterval(id1)
      tracker.clearInterval(id2)
    })

    it('should track timeouts correctly', () => {
      const id1 = setTimeout(() => {}, 1000)
      const id2 = setTimeout(() => {}, 2000)
      
      tracker.registerTimeout(id1)
      tracker.registerTimeout(id2)
      
      const stats = tracker.getResourceStats()
      expect(stats.timeouts).toBe(2)
      
      tracker.clearTimeout(id1)
      tracker.clearTimeout(id2)
    })

    it('should track event listeners correctly', () => {
      const handler1 = () => {}
      const handler2 = () => {}
      
      tracker.registerEventListener(window, 'click', handler1)
      tracker.registerEventListener(window, 'resize', handler2)
      
      const stats = tracker.getResourceStats()
      expect(stats.eventListeners).toBe(2)
      
      tracker.removeEventListener(window, 'click', handler1)
      tracker.removeEventListener(window, 'resize', handler2)
    })

    it('should clear all resources', () => {
      // 创建各种资源
      const intervalId = setInterval(() => {}, 1000)
      const timeoutId = setTimeout(() => {}, 2000)
      const handler = () => {}
      
      tracker.registerInterval(intervalId)
      tracker.registerTimeout(timeoutId)
      tracker.registerEventListener(window, 'click', handler)
      
      let stats = tracker.getResourceStats()
      expect(stats.intervals).toBe(1)
      expect(stats.timeouts).toBe(1)
      expect(stats.eventListeners).toBe(1)
      
      // 清理所有资源
      tracker.clearAllResources()
      
      stats = tracker.getResourceStats()
      expect(stats.intervals).toBe(0)
      expect(stats.timeouts).toBe(0)
      expect(stats.eventListeners).toBe(0)
    })
  })

  describe('useMemoryLeakDetection Hook', () => {
    it('should render without errors', () => {
      render(<TestComponentWithDetection />)
      expect(screen.getByTestId('test-component')).toBeInTheDocument()
    })

    it('should detect memory leaks when forced', async () => {
      // 先创建一个泄漏组件
      const { unmount: unmountLeaky } = render(<LeakyComponent />)
      
      // 然后渲染检测组件
      render(<TestComponentWithDetection />)
      
      const forceButton = screen.getByTestId('force-detection')
      
      await act(async () => {
        forceButton.click()
      })
      
      // 等待检测完成
      await waitFor(() => {
        const leakReports = screen.getByTestId('leak-reports')
        expect(parseInt(leakReports.textContent || '0')).toBeGreaterThan(0)
      })
      
      unmountLeaky()
    })

    it('should not run detection when disabled', () => {
      render(<TestComponentWithDetection enabled={false} />)
      
      const leakReports = screen.getByTestId('leak-reports')
      expect(leakReports.textContent).toBe('0')
    })

    it('should provide resource statistics', () => {
      render(<TestComponentWithDetection />)
      
      const resourceStats = screen.getByTestId('resource-stats')
      const stats = JSON.parse(resourceStats.textContent || '{}')
      
      expect(stats).toHaveProperty('intervals')
      expect(stats).toHaveProperty('timeouts')
      expect(stats).toHaveProperty('eventListeners')
      expect(stats).toHaveProperty('performanceObservers')
      expect(stats).toHaveProperty('intersectionObservers')
    })
  })

  describe('useSafeResource Hook', () => {
    it('should create safe resources', () => {
      render(<TestComponentWithSafeResources />)
      expect(screen.getByTestId('safe-resource-component')).toBeInTheDocument()
    })

    it('should track safe resources in ResourceTracker', async () => {
      render(<TestComponentWithSafeResources />)
      
      // 等待useEffect执行
      await waitFor(() => {
        const stats = tracker.getResourceStats()
        expect(stats.intervals).toBeGreaterThan(0)
      })
    })

    it('should clean up resources on unmount', async () => {
      const { unmount } = render(<TestComponentWithSafeResources />)
      
      // 等待资源创建
      await waitFor(() => {
        const stats = tracker.getResourceStats()
        expect(stats.intervals).toBeGreaterThan(0)
      })
      
      // 卸载组件
      unmount()
      
      // 等待清理完成
      await waitFor(() => {
        const stats = tracker.getResourceStats()
        expect(stats.intervals).toBe(0)
      })
    })
  })

  describe('Memory Leak Detectors', () => {
    it('should detect excessive intervals', async () => {
      // 创建6个以上的interval来触发检测
      for (let i = 0; i < 7; i++) {
        const id = setInterval(() => {}, 1000)
        tracker.registerInterval(id)
      }

      render(<TestComponentWithDetection />)

      const forceButton = screen.getByTestId('force-detection')
      act(() => {
        forceButton.click()
      })

      // 应该检测到泄漏
      await waitFor(() => {
        const leakReports = screen.getByTestId('leak-reports')
        expect(parseInt(leakReports.textContent || '0')).toBeGreaterThan(0)
      })
    })

    it('should detect high memory usage', async () => {
      // 模拟高内存使用
      mockMemory.usedJSHeapSize = mockMemory.jsHeapSizeLimit * 0.85 // 85%使用率
      
      render(<TestComponentWithDetection />)
      
      const forceButton = screen.getByTestId('force-detection')
      
      await act(async () => {
        forceButton.click()
      })
      
      await waitFor(() => {
        const leakReports = screen.getByTestId('leak-reports')
        expect(parseInt(leakReports.textContent || '0')).toBeGreaterThan(0)
      })
    })

    it('should detect excessive DOM nodes', async () => {
      // 创建大量DOM节点
      const container = document.createElement('div')
      for (let i = 0; i < 5100; i++) { // 超过5000个节点
        const element = document.createElement('div')
        container.appendChild(element)
      }
      document.body.appendChild(container)
      
      render(<TestComponentWithDetection />)
      
      const forceButton = screen.getByTestId('force-detection')
      
      await act(async () => {
        forceButton.click()
      })
      
      await waitFor(() => {
        const leakReports = screen.getByTestId('leak-reports')
        expect(parseInt(leakReports.textContent || '0')).toBeGreaterThan(0)
      })
      
      // 清理
      document.body.removeChild(container)
    })
  })
})
