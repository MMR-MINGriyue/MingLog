import { render, screen, waitFor } from '@testing-library/react'
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest'
import { PerformanceValidator, runPerformanceValidation, PERFORMANCE_TARGETS } from '../../utils/performanceValidator'
import React, { useState, useEffect } from 'react'
import VirtualizedPerformanceList from '../VirtualizedPerformanceList'
import OptimizedPerformanceChart from '../OptimizedPerformanceChart'

// Mock Chart.js
vi.mock('react-chartjs-2', () => ({
  Line: ({ data, options }: any) => (
    <div data-testid="mock-chart">
      Chart with {data.datasets.length} datasets
    </div>
  )
}))

vi.mock('chart.js', () => ({
  Chart: {
    register: vi.fn()
  },
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
    <div data-testid="virtualized-list" style={{ height: '400px' }}>
      {Array.from({ length: Math.min(itemCount, 10) }, (_, index) => (
        <div key={index} style={{ height: itemSize }}>
          {children({ index, style: { height: itemSize }, data: itemData })}
        </div>
      ))}
    </div>
  )
}))

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

// 测试组件 - 快速渲染
const FastRenderComponent: React.FC = () => {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    // 模拟快速数据加载
    setTimeout(() => {
      setData([
        {
          memoryUsage: { used: 30, total: 100, percentage: 30 },
          renderTime: 15,
          dbQueryTime: 5,
          componentCount: 25,
          lastUpdate: new Date()
        }
      ])
    }, 10)
  }, [])

  return (
    <div data-testid="fast-component">
      <VirtualizedPerformanceList data={data} height={200} />
    </div>
  )
}

// 测试组件 - 慢速渲染
const SlowRenderComponent: React.FC = () => {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    // 模拟慢速数据加载和处理
    setTimeout(() => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        memoryUsage: { used: 50 + i % 50, total: 100, percentage: 50 + i % 50 },
        renderTime: 20 + Math.random() * 30,
        dbQueryTime: 5 + Math.random() * 10,
        componentCount: 30 + i % 20,
        lastUpdate: new Date(Date.now() - i * 1000)
      }))
      setData(largeData)
    }, 150) // 故意延迟150ms
  }, [])

  return (
    <div data-testid="slow-component">
      <OptimizedPerformanceChart data={data} height={300} />
    </div>
  )
}

// 测试组件 - 大数据集
const LargeDatasetComponent: React.FC<{ size: number }> = ({ size }) => {
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    const largeData = Array.from({ length: size }, (_, i) => ({
      memoryUsage: { used: 40 + i % 60, total: 100, percentage: 40 + i % 60 },
      renderTime: 10 + Math.random() * 20,
      dbQueryTime: 3 + Math.random() * 7,
      componentCount: 20 + i % 30,
      lastUpdate: new Date(Date.now() - i * 2000)
    }))
    setData(largeData)
  }, [size])

  return (
    <div data-testid="large-dataset-component">
      <VirtualizedPerformanceList data={data} height={400} />
      <OptimizedPerformanceChart data={data} height={300} maxDataPoints={50} />
    </div>
  )
}

describe('Performance Validation', () => {
  let validator: PerformanceValidator

  beforeEach(() => {
    validator = new PerformanceValidator()
    vi.clearAllMocks()
    
    // 重置mock memory
    mockMemory.usedJSHeapSize = 50 * 1024 * 1024
  })

  afterEach(() => {
    validator.clearResults()
  })

  describe('PerformanceValidator Class', () => {
    it('should create validator instance', () => {
      expect(validator).toBeInstanceOf(PerformanceValidator)
    })

    it('should test component render performance', async () => {
      const result = await validator.testComponentRender('TestComponent', async () => {
        // 模拟快速渲染
        await new Promise(resolve => setTimeout(resolve, 50))
      })

      expect(result.testName).toBe('TestComponent 渲染性能')
      expect(result.renderTime).toBeGreaterThan(0)
      expect(result.renderTime).toBeLessThan(PERFORMANCE_TARGETS.MAX_RENDER_TIME)
      expect(result.passed).toBe(true)
    })

    it('should detect slow rendering', async () => {
      const result = await validator.testComponentRender('SlowComponent', async () => {
        // 模拟慢速渲染
        await new Promise(resolve => setTimeout(resolve, 150))
      })

      expect(result.testName).toBe('SlowComponent 渲染性能')
      expect(result.renderTime).toBeGreaterThan(PERFORMANCE_TARGETS.MAX_RENDER_TIME)
      expect(result.passed).toBe(false)
    })

    it('should test large dataset rendering', async () => {
      const result = await validator.testLargeDatasetRender(1000, async () => {
        await new Promise(resolve => setTimeout(resolve, 80))
      })

      expect(result.testName).toBe('大数据集渲染 (1000 条记录)')
      expect(result.renderTime).toBeGreaterThan(0)
      // 大数据集有调整的目标时间
      expect(result.details).toContain('大数据集渲染时间')
    })

    it('should test memory efficiency', () => {
      // 模拟内存增长
      mockMemory.usedJSHeapSize = 60 * 1024 * 1024 // 增长10MB

      const result = validator.testMemoryEfficiency()

      expect(result.testName).toBe('内存使用效率')
      expect(result.memoryUsage).toBe(60 * 1024 * 1024)
      expect(result.details).toContain('内存增长')
    })

    it('should test DOM node count', () => {
      const result = validator.testDOMNodeCount()

      expect(result.testName).toBe('DOM节点数量')
      expect(result.details).toContain('DOM节点数量')
      expect(typeof result.passed).toBe('boolean')
    })

    it('should test FPS performance', async () => {
      const result = await validator.testFPS(500) // 短时间测试

      expect(result.testName).toBe('FPS性能')
      expect(result.details).toContain('FPS')
      expect(typeof result.passed).toBe('boolean')
    })

    it('should generate comprehensive report', async () => {
      // 运行多个测试
      await validator.testComponentRender('Component1', async () => {
        await new Promise(resolve => setTimeout(resolve, 30))
      })

      await validator.testComponentRender('Component2', async () => {
        await new Promise(resolve => setTimeout(resolve, 60))
      })

      validator.testMemoryEfficiency()
      validator.testDOMNodeCount()

      const report = validator.generateReport()

      expect(report).toHaveProperty('overallPassed')
      expect(report).toHaveProperty('averageRenderTime')
      expect(report).toHaveProperty('maxRenderTime')
      expect(report).toHaveProperty('memoryEfficiency')
      expect(report).toHaveProperty('tests')
      expect(report).toHaveProperty('recommendations')

      expect(report.tests.length).toBe(4)
      expect(report.averageRenderTime).toBeGreaterThan(0)
      expect(Array.isArray(report.recommendations)).toBe(true)
    })
  })

  describe('Component Performance Tests', () => {
    it('should render FastRenderComponent within performance target', async () => {
      const startTime = performance.now()
      
      render(<FastRenderComponent />)
      
      await waitFor(() => {
        expect(screen.getByTestId('fast-component')).toBeInTheDocument()
      })

      const renderTime = performance.now() - startTime
      expect(renderTime).toBeLessThan(PERFORMANCE_TARGETS.MAX_RENDER_TIME)
    })

    it('should handle large dataset efficiently', async () => {
      const startTime = performance.now()
      
      render(<LargeDatasetComponent size={500} />)
      
      await waitFor(() => {
        expect(screen.getByTestId('large-dataset-component')).toBeInTheDocument()
      })

      const renderTime = performance.now() - startTime
      // 大数据集允许更长的渲染时间，但应该在合理范围内
      expect(renderTime).toBeLessThan(300) // 300ms for large dataset
    })

    it('should maintain performance with virtualized list', async () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        memoryUsage: { used: 40 + i % 60, total: 100, percentage: 40 + i % 60 },
        renderTime: 10 + Math.random() * 20,
        dbQueryTime: 3 + Math.random() * 7,
        componentCount: 20 + i % 30,
        lastUpdate: new Date(Date.now() - i * 2000)
      }))

      const startTime = performance.now()
      
      render(<VirtualizedPerformanceList data={largeData} height={400} />)
      
      const renderTime = performance.now() - startTime
      
      // 虚拟化列表应该能快速渲染大数据集
      expect(renderTime).toBeLessThan(PERFORMANCE_TARGETS.MAX_RENDER_TIME)
    })

    it('should optimize chart rendering with data sampling', async () => {
      const largeData = Array.from({ length: 200 }, (_, i) => ({
        memoryUsage: { used: 30 + i % 70, total: 100, percentage: 30 + i % 70 },
        renderTime: 15 + Math.random() * 25,
        dbQueryTime: 4 + Math.random() * 8,
        componentCount: 25 + i % 25,
        lastUpdate: new Date(Date.now() - i * 1500)
      }))

      const startTime = performance.now()
      
      render(<OptimizedPerformanceChart data={largeData} height={300} maxDataPoints={50} />)
      
      const renderTime = performance.now() - startTime
      
      // 优化的图表应该通过数据采样保持快速渲染
      expect(renderTime).toBeLessThan(PERFORMANCE_TARGETS.MAX_RENDER_TIME)
    })
  })

  describe('Integration Performance Tests', () => {
    it('should run full performance validation', async () => {
      const report = await runPerformanceValidation()

      expect(report).toHaveProperty('overallPassed')
      expect(report).toHaveProperty('tests')
      expect(report.tests.length).toBeGreaterThan(0)
      
      // 检查是否包含所有必要的测试
      const testNames = report.tests.map(t => t.testName)
      expect(testNames).toContain('PerformanceMonitor 渲染性能')
      expect(testNames).toContain('内存使用效率')
      expect(testNames).toContain('DOM节点数量')
      expect(testNames).toContain('FPS性能')
    })

    it('should provide performance recommendations', async () => {
      const report = await runPerformanceValidation()

      expect(Array.isArray(report.recommendations)).toBe(true)
      expect(report.recommendations.length).toBeGreaterThan(0)
      
      // 应该有具体的建议内容
      const hasValidRecommendations = report.recommendations.some(rec => 
        rec.includes('性能') || rec.includes('优化') || rec.includes('通过')
      )
      expect(hasValidRecommendations).toBe(true)
    })

    it('should track performance metrics over time', async () => {
      const validator = new PerformanceValidator()
      
      // 运行多次测试模拟时间序列
      for (let i = 0; i < 3; i++) {
        await validator.testComponentRender(`Test${i}`, async () => {
          await new Promise(resolve => setTimeout(resolve, 20 + i * 10))
        })
      }

      const results = validator.getResults()
      expect(results.length).toBe(3)
      
      // 验证渲染时间都在合理范围内（性能可能优化，不一定递增）
      expect(results[0].renderTime).toBeGreaterThan(0)
      expect(results[1].renderTime).toBeGreaterThan(0)
      expect(results[2].renderTime).toBeGreaterThan(0)

      // 验证所有渲染时间都在性能目标内
      results.forEach(result => {
        expect(result.renderTime).toBeLessThan(PERFORMANCE_TARGETS.MAX_RENDER_TIME)
      })
    })
  })

  describe('Performance Targets', () => {
    it('should have reasonable performance targets', () => {
      expect(PERFORMANCE_TARGETS.MAX_RENDER_TIME).toBe(100)
      expect(PERFORMANCE_TARGETS.MAX_MEMORY_INCREASE).toBe(50 * 1024 * 1024)
      expect(PERFORMANCE_TARGETS.MIN_FPS).toBe(30)
      expect(PERFORMANCE_TARGETS.MAX_DOM_NODES).toBe(5000)
    })

    it('should validate against performance targets', async () => {
      const result = await validator.testComponentRender('TargetTest', async () => {
        // 确保在目标范围内
        await new Promise(resolve => setTimeout(resolve, 50))
      })

      expect(result.renderTime).toBeLessThan(PERFORMANCE_TARGETS.MAX_RENDER_TIME)
      expect(result.passed).toBe(true)
    })
  })
})
