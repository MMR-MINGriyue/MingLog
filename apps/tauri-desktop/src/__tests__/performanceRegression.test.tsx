import { render, screen, waitFor, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  PerformanceRegressionDetector,
  performanceDetector,
  measurePerformance,
  PERFORMANCE_BENCHMARKS
} from '../utils/performanceRegression'
import React from 'react'
import VirtualizedPerformanceList from '../components/VirtualizedPerformanceList'
import OptimizedPerformanceChart from '../components/OptimizedPerformanceChart'
import PerformanceMonitor from '../components/PerformanceMonitor'

// Mock Chart.js
vi.mock('react-chartjs-2', () => ({
  Line: ({ data }: any) => (
    <div data-testid="mock-chart">Chart with {data.datasets.length} datasets</div>
  )
}))

vi.mock('chart.js', () => ({
  Chart: { register: vi.fn() },
  CategoryScale: {},
  LinearScale: {},
  PointElement: {},
  LineElement: {},
  Title: {},
  Tooltip: {},
  Legend: {}
}))

// Mock react-window
vi.mock('react-window', () => ({
  FixedSizeList: ({ children, itemData, itemCount, itemSize }: any) => (
    <div data-testid="virtualized-list">
      {Array.from({ length: Math.min(itemCount, 10) }, (_, index) => {
        if (typeof children === 'function') {
          return (
            <div key={index} style={{ height: itemSize }}>
              {children({ index, style: { height: itemSize }, data: itemData })}
            </div>
          )
        }
        return <div key={index} style={{ height: itemSize }}>Item {index}</div>
      })}
    </div>
  )
}))

// Mock performance.memory
const mockMemory = {
  usedJSHeapSize: 50 * 1024 * 1024,
  totalJSHeapSize: 100 * 1024 * 1024,
  jsHeapSizeLimit: 2 * 1024 * 1024 * 1024
}

Object.defineProperty(performance, 'memory', {
  value: mockMemory,
  writable: true
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

describe('Performance Regression Testing', () => {
  let detector: PerformanceRegressionDetector

  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    detector = new PerformanceRegressionDetector()
  })

  afterEach(() => {
    detector.reset()
  })

  describe('PerformanceRegressionDetector', () => {
    it('should initialize with default baselines', () => {
      expect(detector.getBaseline('COMPONENT_RENDER_TIME')).toBe(100)
      expect(detector.getBaseline('MEMORY_USAGE')).toBe(50 * 1024 * 1024)
      expect(detector.getBaseline('DATABASE_QUERY_TIME')).toBe(10)
    })

    it('should record performance metrics', () => {
      const metric = {
        name: 'TEST_METRIC',
        value: 150,
        unit: 'ms',
        timestamp: Date.now()
      }

      detector.recordMetric(metric)
      const trends = detector.getPerformanceTrend('TEST_METRIC')
      expect(trends).toHaveLength(1)
      expect(trends[0].value).toBe(150)
    })

    it('should detect performance regression', () => {
      const result = detector.analyzeRegression('COMPONENT_RENDER_TIME', 150)
      
      expect(result).toBeDefined()
      expect(result!.isRegression).toBe(true)
      expect(result!.percentageChange).toBe(50) // 50% increase from 100ms baseline
      expect(result!.severity).toBe('high') // > 1.5 * threshold (20%)
    })

    it('should not detect regression for acceptable performance', () => {
      const result = detector.analyzeRegression('COMPONENT_RENDER_TIME', 110)
      
      expect(result).toBeDefined()
      expect(result!.isRegression).toBe(false)
      expect(result!.percentageChange).toBe(10) // 10% increase, below 20% threshold
    })

    it('should classify regression severity correctly', () => {
      // Low severity (just above threshold)
      const lowResult = detector.analyzeRegression('COMPONENT_RENDER_TIME', 125)
      expect(lowResult!.severity).toBe('low')

      // Medium severity
      const mediumResult = detector.analyzeRegression('COMPONENT_RENDER_TIME', 135)
      expect(mediumResult!.severity).toBe('medium')

      // High severity
      const highResult = detector.analyzeRegression('COMPONENT_RENDER_TIME', 145)
      expect(highResult!.severity).toBe('high')

      // Critical severity
      const criticalResult = detector.analyzeRegression('COMPONENT_RENDER_TIME', 170)
      expect(criticalResult!.severity).toBe('critical')
    })

    it('should update baselines', () => {
      detector.updateBaseline('COMPONENT_RENDER_TIME', 80)
      expect(detector.getBaseline('COMPONENT_RENDER_TIME')).toBe(80)
      expect(localStorageMock.setItem).toHaveBeenCalled()
    })

    it('should generate performance recommendations', () => {
      const result = detector.analyzeRegression('MEMORY_USAGE', 80 * 1024 * 1024)
      expect(result!.recommendation).toContain('内存')
    })

    it('should generate comprehensive performance report', () => {
      // Record some metrics
      detector.recordMetric({
        name: 'COMPONENT_RENDER_TIME',
        value: 150,
        unit: 'ms',
        timestamp: Date.now()
      })

      detector.recordMetric({
        name: 'MEMORY_USAGE',
        value: 80 * 1024 * 1024,
        unit: 'bytes',
        timestamp: Date.now()
      })

      const report = detector.generateReport()
      
      expect(report.summary.totalMetrics).toBeGreaterThan(0)
      expect(report.summary.regressions).toBeGreaterThan(0)
      expect(report.regressions).toHaveLength(report.summary.regressions)
      expect(report.trends).toBeDefined()
    })

    it('should limit metrics storage', () => {
      // Record 150 metrics of the same type
      for (let i = 0; i < 150; i++) {
        detector.recordMetric({
          name: 'TEST_METRIC',
          value: i,
          unit: 'ms',
          timestamp: Date.now() + i
        })
      }

      const trends = detector.getPerformanceTrend('TEST_METRIC')
      expect(trends.length).toBeLessThanOrEqual(100)
    })
  })

  describe('measurePerformance utility', () => {
    it('should measure execution time', async () => {
      const slowOperation = () => new Promise(resolve => setTimeout(resolve, 100))
      
      const result = await measurePerformance('SLOW_OP', slowOperation)
      
      expect(result).toBeUndefined()
      const trends = performanceDetector.getPerformanceTrend('SLOW_OP_TIME')
      expect(trends).toHaveLength(1)
      expect(trends[0].value).toBeGreaterThan(90) // Should be around 100ms
    })

    it('should measure memory usage', async () => {
      const memoryOperation = async () => {
        // Simulate memory increase
        mockMemory.usedJSHeapSize += 1024 * 1024 // 1MB increase
        return 'result'
      }
      
      const result = await measurePerformance('MEMORY_OP', memoryOperation)
      
      expect(result).toBe('result')
      const trends = performanceDetector.getPerformanceTrend('MEMORY_OP_MEMORY')
      expect(trends).toHaveLength(1)
      expect(trends[0].value).toBe(1024 * 1024)
    })

    it('should handle errors and still measure time', async () => {
      const errorOperation = () => Promise.reject(new Error('Test error'))
      
      await expect(measurePerformance('ERROR_OP', errorOperation)).rejects.toThrow('Test error')
      
      const trends = performanceDetector.getPerformanceTrend('ERROR_OP_ERROR_TIME')
      expect(trends).toHaveLength(1)
      expect(trends[0].value).toBeGreaterThan(0)
    })
  })

  describe('Component Performance Regression Tests', () => {
    const generateLargeDataset = (size: number) => 
      Array.from({ length: size }, (_, i) => ({
        memoryUsage: { used: 40 + i % 60, total: 100, percentage: 40 + i % 60 },
        renderTime: 10 + Math.random() * 20,
        dbQueryTime: 3 + Math.random() * 7,
        componentCount: 20 + i % 30,
        lastUpdate: new Date(Date.now() - i * 2000)
      }))

    it('should detect VirtualizedPerformanceList regression', async () => {
      const largeData = generateLargeDataset(1000)
      
      const renderTime = await measurePerformance('VIRTUALIZED_LIST_RENDER', async () => {
        render(<VirtualizedPerformanceList data={largeData} height={400} />)
        await waitFor(() => {
          expect(screen.getByTestId('virtualized-list')).toBeInTheDocument()
        })
      })

      const trends = performanceDetector.getPerformanceTrend('VIRTUALIZED_LIST_RENDER_TIME')
      expect(trends).toHaveLength(1)
      
      const regression = performanceDetector.analyzeRegression(
        'COMPONENT_RENDER_TIME', 
        trends[0].value
      )
      
      // Should not regress with virtualization
      expect(regression!.isRegression).toBe(false)
    })

    it('should detect OptimizedPerformanceChart regression', async () => {
      const chartData = generateLargeDataset(200)
      
      await measurePerformance('OPTIMIZED_CHART_RENDER', async () => {
        render(<OptimizedPerformanceChart data={chartData} height={300} maxDataPoints={50} />)
        await waitFor(() => {
          expect(screen.getByTestId('mock-chart')).toBeInTheDocument()
        })
      })

      const trends = performanceDetector.getPerformanceTrend('OPTIMIZED_CHART_RENDER_TIME')
      expect(trends).toHaveLength(1)
      
      const regression = performanceDetector.analyzeRegression(
        'COMPONENT_RENDER_TIME', 
        trends[0].value
      )
      
      // Chart should render quickly with data sampling
      expect(regression!.isRegression).toBe(false)
    })

    it('should detect PerformanceMonitor memory regression', async () => {
      const initialMemory = mockMemory.usedJSHeapSize
      
      await measurePerformance('PERFORMANCE_MONITOR_RENDER', async () => {
        render(<PerformanceMonitor isOpen={true} onClose={vi.fn()} />)
        await waitFor(() => {
          expect(screen.getByRole('dialog')).toBeInTheDocument()
        })
        
        // Simulate memory increase
        mockMemory.usedJSHeapSize += 5 * 1024 * 1024 // 5MB increase
      })

      const memoryTrends = performanceDetector.getPerformanceTrend('PERFORMANCE_MONITOR_RENDER_MEMORY')
      if (memoryTrends.length > 0) {
        const regression = performanceDetector.analyzeRegression(
          'MEMORY_USAGE', 
          memoryTrends[0].value
        )
        
        // Should not have significant memory regression
        expect(regression!.percentageChange).toBeLessThan(50)
      }
    })

    it('should benchmark search performance', async () => {
      const searchOperation = async () => {
        // Simulate search delay
        await new Promise(resolve => setTimeout(resolve, 30))
        return ['result1', 'result2', 'result3']
      }
      
      const results = await measurePerformance('SEARCH_OPERATION', searchOperation)
      
      expect(results).toHaveLength(3)
      
      const trends = performanceDetector.getPerformanceTrend('SEARCH_OPERATION_TIME')
      const regression = performanceDetector.analyzeRegression(
        'SEARCH_RESPONSE_TIME', 
        trends[0].value
      )
      
      // Search should be within acceptable range
      expect(regression!.isRegression).toBe(false)
    })

    it('should benchmark database operations', async () => {
      const dbOperation = async () => {
        // Simulate database query
        await new Promise(resolve => setTimeout(resolve, 8))
        return { id: '1', data: 'test' }
      }
      
      const result = await measurePerformance('DATABASE_QUERY', dbOperation)
      
      expect(result.id).toBe('1')
      
      const trends = performanceDetector.getPerformanceTrend('DATABASE_QUERY_TIME')
      const regression = performanceDetector.analyzeRegression(
        'DATABASE_QUERY_TIME', 
        trends[0].value
      )
      
      // Database should be fast
      expect(regression!.isRegression).toBe(false)
    })
  })

  describe('Performance Benchmarks', () => {
    it('should have all required benchmarks defined', () => {
      const requiredBenchmarks = [
        'COMPONENT_RENDER_TIME',
        'MEMORY_USAGE',
        'DATABASE_QUERY_TIME',
        'SEARCH_RESPONSE_TIME',
        'VIRTUALIZATION_EFFICIENCY',
        'BUNDLE_SIZE'
      ]

      requiredBenchmarks.forEach(benchmark => {
        expect(PERFORMANCE_BENCHMARKS[benchmark]).toBeDefined()
        expect(PERFORMANCE_BENCHMARKS[benchmark].baseline).toBeGreaterThan(0)
        expect(PERFORMANCE_BENCHMARKS[benchmark].threshold).toBeGreaterThan(0)
      })
    })

    it('should have reasonable benchmark values', () => {
      expect(PERFORMANCE_BENCHMARKS.COMPONENT_RENDER_TIME.baseline).toBe(100)
      expect(PERFORMANCE_BENCHMARKS.COMPONENT_RENDER_TIME.threshold).toBe(20)
      
      expect(PERFORMANCE_BENCHMARKS.MEMORY_USAGE.baseline).toBe(50 * 1024 * 1024)
      expect(PERFORMANCE_BENCHMARKS.MEMORY_USAGE.threshold).toBe(30)
      
      expect(PERFORMANCE_BENCHMARKS.DATABASE_QUERY_TIME.baseline).toBe(10)
      expect(PERFORMANCE_BENCHMARKS.DATABASE_QUERY_TIME.threshold).toBe(50)
    })
  })

  describe('Integration with existing performance tools', () => {
    it('should work with PerformanceValidator', async () => {
      // This test ensures compatibility with existing performance validation
      const testComponent = () => new Promise(resolve => setTimeout(resolve, 50))
      
      await measurePerformance('INTEGRATION_TEST', testComponent)
      
      const trends = performanceDetector.getPerformanceTrend('INTEGRATION_TEST_TIME')
      expect(trends).toHaveLength(1)
      expect(trends[0].value).toBeGreaterThan(40)
      expect(trends[0].value).toBeLessThan(100)
    })

    it('should persist baselines across sessions', () => {
      const testBaselines = {
        COMPONENT_RENDER_TIME: 90,
        MEMORY_USAGE: 45 * 1024 * 1024
      }
      
      localStorageMock.getItem.mockReturnValue(JSON.stringify(testBaselines))
      
      const newDetector = new PerformanceRegressionDetector()
      expect(newDetector.getBaseline('COMPONENT_RENDER_TIME')).toBe(90)
      expect(newDetector.getBaseline('MEMORY_USAGE')).toBe(45 * 1024 * 1024)
    })
  })
})
