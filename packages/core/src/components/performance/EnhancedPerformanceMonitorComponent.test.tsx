/**
 * 增强性能监控组件测试
 * 测试性能监控界面的显示和交互功能
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { EnhancedPerformanceMonitorComponent } from './EnhancedPerformanceMonitorComponent'
import { EnhancedPerformanceMonitor } from '../../services/EnhancedPerformanceMonitor'
import { EventBus } from '../../event-system/EventBus'

// Mock services
const mockEventBus = new EventBus()
const mockMonitor = {
  start: vi.fn(),
  stop: vi.fn(),
  getMetrics: vi.fn(),
  getAlerts: vi.fn(),
  getSuggestions: vi.fn(),
  getBenchmarks: vi.fn(),
  getPerformanceSummary: vi.fn(),
  clearHistory: vi.fn(),
  recordMetric: vi.fn()
} as any

// Mock data
const mockMetrics = [
  {
    name: 'render-time',
    value: 15.5,
    unit: 'ms',
    timestamp: Date.now(),
    tags: { type: 'render' }
  },
  {
    name: 'memory-usage',
    value: 85.2,
    unit: 'MB',
    timestamp: Date.now(),
    tags: { type: 'memory' }
  }
]

const mockAlerts = [
  {
    id: 'alert-1',
    level: 'warning' as const,
    metric: 'render-time',
    value: 25,
    threshold: 16,
    message: '渲染时间超过警告阈值',
    timestamp: Date.now(),
    suggestions: ['使用React.memo优化组件', '检查不必要的重新渲染']
  },
  {
    id: 'alert-2',
    level: 'error' as const,
    metric: 'memory-usage',
    value: 150,
    threshold: 100,
    message: '内存使用超过错误阈值',
    timestamp: Date.now(),
    suggestions: ['检查内存泄漏', '优化数据结构']
  }
]

const mockSuggestions = [
  {
    id: 'suggestion-1',
    priority: 'high' as const,
    category: 'render' as const,
    title: '渲染性能优化',
    description: '当前渲染时间超过目标值，建议优化组件渲染',
    expectedImprovement: '提升50%渲染性能',
    difficulty: 'medium' as const,
    relatedMetrics: ['render-time', 'fps']
  },
  {
    id: 'suggestion-2',
    priority: 'medium' as const,
    category: 'memory' as const,
    title: '内存使用优化',
    description: '内存使用量较高，建议优化数据管理',
    expectedImprovement: '减少30%内存使用',
    difficulty: 'easy' as const,
    relatedMetrics: ['memory-usage']
  }
]

const mockBenchmarks = [
  {
    name: 'render-time',
    target: 16,
    current: 15.5,
    average: 18.2,
    trend: 'improving' as const,
    status: 'good' as const
  },
  {
    name: 'memory-usage',
    target: 100,
    current: 85.2,
    average: 92.1,
    trend: 'stable' as const,
    status: 'excellent' as const
  }
]

const mockSummary = {
  metrics: { total: 50, recent: 10 },
  alerts: { total: 5, active: 2 },
  suggestions: { total: 8, highPriority: 3 },
  benchmarks: { total: 4, meeting: 3 },
  status: 'good' as const
}

describe('EnhancedPerformanceMonitorComponent', () => {
  let mockOnClose: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockOnClose = vi.fn()
    
    // Setup mock returns
    mockMonitor.getMetrics.mockReturnValue(mockMetrics)
    mockMonitor.getAlerts.mockReturnValue(mockAlerts)
    mockMonitor.getSuggestions.mockReturnValue(mockSuggestions)
    mockMonitor.getBenchmarks.mockReturnValue(mockBenchmarks)
    mockMonitor.getPerformanceSummary.mockReturnValue(mockSummary)
    
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('基础渲染', () => {
    it('应该在打开时正确渲染', () => {
      render(
        <EnhancedPerformanceMonitorComponent
          monitor={mockMonitor}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('性能监控中心')).toBeInTheDocument()
      expect(screen.getByText('实时性能指标监控和优化建议')).toBeInTheDocument()
    })

    it('应该在关闭时不渲染', () => {
      render(
        <EnhancedPerformanceMonitorComponent
          monitor={mockMonitor}
          isOpen={false}
          onClose={mockOnClose}
        />
      )

      expect(screen.queryByText('性能监控中心')).not.toBeInTheDocument()
    })

    it('应该显示正确的状态概览', () => {
      render(
        <EnhancedPerformanceMonitorComponent
          monitor={mockMonitor}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('良好')).toBeInTheDocument() // status: 'good'
      expect(screen.getByText('10')).toBeInTheDocument() // recent metrics
      expect(screen.getByText('2')).toBeInTheDocument() // active alerts
      expect(screen.getByText('3')).toBeInTheDocument() // high priority suggestions
    })
  })

  describe('标签页导航', () => {
    it('应该默认显示概览标签页', () => {
      render(
        <EnhancedPerformanceMonitorComponent
          monitor={mockMonitor}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('关键性能指标')).toBeInTheDocument()
    })

    it('应该能够切换到指标标签页', async () => {
      const user = userEvent.setup()
      
      render(
        <EnhancedPerformanceMonitorComponent
          monitor={mockMonitor}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      const metricsTab = screen.getByRole('button', { name: /指标/ })
      await user.click(metricsTab)

      expect(screen.getByText('性能指标详情')).toBeInTheDocument()
    })

    it('应该能够切换到告警标签页', async () => {
      const user = userEvent.setup()
      
      render(
        <EnhancedPerformanceMonitorComponent
          monitor={mockMonitor}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      const alertsTab = screen.getByRole('button', { name: /告警/ })
      await user.click(alertsTab)

      expect(screen.getByText('性能告警')).toBeInTheDocument()
    })

    it('应该能够切换到建议标签页', async () => {
      const user = userEvent.setup()
      
      render(
        <EnhancedPerformanceMonitorComponent
          monitor={mockMonitor}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      const suggestionsTab = screen.getByRole('button', { name: /建议/ })
      await user.click(suggestionsTab)

      expect(screen.getByText('优化建议')).toBeInTheDocument()
    })
  })

  describe('监控控制', () => {
    it('应该能够启动监控', async () => {
      const user = userEvent.setup()
      
      render(
        <EnhancedPerformanceMonitorComponent
          monitor={mockMonitor}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      const startButton = screen.getByText('开始监控')
      await user.click(startButton)

      expect(mockMonitor.start).toHaveBeenCalled()
    })

    it('应该能够停止监控', async () => {
      const user = userEvent.setup()
      
      // 模拟监控已启动状态
      render(
        <EnhancedPerformanceMonitorComponent
          monitor={mockMonitor}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      // 先启动监控
      const startButton = screen.getByText('开始监控')
      await user.click(startButton)

      // 然后停止监控
      const stopButton = screen.getByText('停止监控')
      await user.click(stopButton)

      expect(mockMonitor.stop).toHaveBeenCalled()
    })

    it('应该能够清除历史数据', async () => {
      const user = userEvent.setup()
      
      render(
        <EnhancedPerformanceMonitorComponent
          monitor={mockMonitor}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      const clearButton = screen.getByTitle('清除历史数据')
      await user.click(clearButton)

      expect(mockMonitor.clearHistory).toHaveBeenCalled()
    })

    it('应该能够关闭组件', async () => {
      const user = userEvent.setup()
      
      render(
        <EnhancedPerformanceMonitorComponent
          monitor={mockMonitor}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      const closeButton = screen.getByTitle('关闭')
      await user.click(closeButton)

      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('概览标签页内容', () => {
    it('应该显示关键性能指标', () => {
      render(
        <EnhancedPerformanceMonitorComponent
          monitor={mockMonitor}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('渲染时间')).toBeInTheDocument()
      expect(screen.getByText('内存使用')).toBeInTheDocument()
      expect(screen.getByText('帧率')).toBeInTheDocument()
      expect(screen.getByText('DOM节点')).toBeInTheDocument()
    })

    it('应该显示最近告警', () => {
      render(
        <EnhancedPerformanceMonitorComponent
          monitor={mockMonitor}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('最近告警')).toBeInTheDocument()
      expect(screen.getByText('渲染时间超过警告阈值')).toBeInTheDocument()
    })

    it('应该显示优化建议', () => {
      render(
        <EnhancedPerformanceMonitorComponent
          monitor={mockMonitor}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('优化建议')).toBeInTheDocument()
      expect(screen.getByText('渲染性能优化')).toBeInTheDocument()
    })
  })

  describe('指标标签页内容', () => {
    it('应该显示性能基准详情', async () => {
      const user = userEvent.setup()
      
      render(
        <EnhancedPerformanceMonitorComponent
          monitor={mockMonitor}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      const metricsTab = screen.getByRole('button', { name: /指标/ })
      await user.click(metricsTab)

      expect(screen.getByText('render-time')).toBeInTheDocument()
      expect(screen.getByText('memory-usage')).toBeInTheDocument()
      expect(screen.getByText('↗ 改善')).toBeInTheDocument() // improving trend
      expect(screen.getByText('→ 稳定')).toBeInTheDocument() // stable trend
    })

    it('应该显示进度条', async () => {
      const user = userEvent.setup()
      
      render(
        <EnhancedPerformanceMonitorComponent
          monitor={mockMonitor}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      const metricsTab = screen.getByRole('button', { name: /指标/ })
      await user.click(metricsTab)

      // 检查进度条元素存在
      const progressBars = document.querySelectorAll('.h-2.rounded-full')
      expect(progressBars.length).toBeGreaterThan(0)
    })
  })

  describe('告警标签页内容', () => {
    it('应该显示告警详情', async () => {
      const user = userEvent.setup()
      
      render(
        <EnhancedPerformanceMonitorComponent
          monitor={mockMonitor}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      const alertsTab = screen.getByRole('button', { name: /告警/ })
      await user.click(alertsTab)

      expect(screen.getByText('渲染时间超过警告阈值')).toBeInTheDocument()
      expect(screen.getByText('内存使用超过错误阈值')).toBeInTheDocument()
      expect(screen.getByText('使用React.memo优化组件')).toBeInTheDocument()
    })

    it('应该显示告警级别标签', async () => {
      const user = userEvent.setup()
      
      render(
        <EnhancedPerformanceMonitorComponent
          monitor={mockMonitor}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      const alertsTab = screen.getByRole('button', { name: /告警/ })
      await user.click(alertsTab)

      expect(screen.getByText('warning')).toBeInTheDocument()
      expect(screen.getByText('error')).toBeInTheDocument()
    })
  })

  describe('建议标签页内容', () => {
    it('应该显示优化建议详情', async () => {
      const user = userEvent.setup()
      
      render(
        <EnhancedPerformanceMonitorComponent
          monitor={mockMonitor}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      const suggestionsTab = screen.getByRole('button', { name: /建议/ })
      await user.click(suggestionsTab)

      expect(screen.getByText('渲染性能优化')).toBeInTheDocument()
      expect(screen.getByText('内存使用优化')).toBeInTheDocument()
      expect(screen.getByText('提升50%渲染性能')).toBeInTheDocument()
      expect(screen.getByText('减少30%内存使用')).toBeInTheDocument()
    })

    it('应该显示优先级和难度标签', async () => {
      const user = userEvent.setup()
      
      render(
        <EnhancedPerformanceMonitorComponent
          monitor={mockMonitor}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      const suggestionsTab = screen.getByRole('button', { name: /建议/ })
      await user.click(suggestionsTab)

      expect(screen.getByText('high')).toBeInTheDocument()
      expect(screen.getByText('medium')).toBeInTheDocument()
      expect(screen.getByText('中等')).toBeInTheDocument()
      expect(screen.getByText('简单')).toBeInTheDocument()
    })

    it('应该显示相关指标', async () => {
      const user = userEvent.setup()
      
      render(
        <EnhancedPerformanceMonitorComponent
          monitor={mockMonitor}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      const suggestionsTab = screen.getByRole('button', { name: /建议/ })
      await user.click(suggestionsTab)

      expect(screen.getByText('render-time')).toBeInTheDocument()
      expect(screen.getByText('fps')).toBeInTheDocument()
      expect(screen.getByText('memory-usage')).toBeInTheDocument()
    })
  })

  describe('空状态处理', () => {
    it('应该显示无指标数据的空状态', async () => {
      const user = userEvent.setup()
      
      mockMonitor.getBenchmarks.mockReturnValue([])
      
      render(
        <EnhancedPerformanceMonitorComponent
          monitor={mockMonitor}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      const metricsTab = screen.getByRole('button', { name: /指标/ })
      await user.click(metricsTab)

      expect(screen.getByText('暂无性能指标数据')).toBeInTheDocument()
    })

    it('应该显示无告警的空状态', async () => {
      const user = userEvent.setup()
      
      mockMonitor.getAlerts.mockReturnValue([])
      
      render(
        <EnhancedPerformanceMonitorComponent
          monitor={mockMonitor}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      const alertsTab = screen.getByRole('button', { name: /告警/ })
      await user.click(alertsTab)

      expect(screen.getByText('暂无性能告警')).toBeInTheDocument()
    })

    it('应该显示无建议的空状态', async () => {
      const user = userEvent.setup()
      
      mockMonitor.getSuggestions.mockReturnValue([])
      
      render(
        <EnhancedPerformanceMonitorComponent
          monitor={mockMonitor}
          isOpen={true}
          onClose={mockOnClose}
        />
      )

      const suggestionsTab = screen.getByRole('button', { name: /建议/ })
      await user.click(suggestionsTab)

      expect(screen.getByText('暂无优化建议')).toBeInTheDocument()
    })
  })

  describe('数据更新', () => {
    it('应该定期更新数据', async () => {
      vi.useFakeTimers()
      
      render(
        <EnhancedPerformanceMonitorComponent
          monitor={mockMonitor}
          isOpen={true}
          onClose={mockOnClose}
          updateInterval={1000}
        />
      )

      // 初始调用
      expect(mockMonitor.getMetrics).toHaveBeenCalledTimes(1)
      expect(mockMonitor.getAlerts).toHaveBeenCalledTimes(1)

      // 等待更新间隔
      act(() => {
        vi.advanceTimersByTime(1000)
      })

      expect(mockMonitor.getMetrics).toHaveBeenCalledTimes(2)
      expect(mockMonitor.getAlerts).toHaveBeenCalledTimes(2)

      vi.useRealTimers()
    })

    it('应该在关闭时停止更新', () => {
      vi.useFakeTimers()
      
      const { rerender } = render(
        <EnhancedPerformanceMonitorComponent
          monitor={mockMonitor}
          isOpen={true}
          onClose={mockOnClose}
          updateInterval={1000}
        />
      )

      // 关闭组件
      rerender(
        <EnhancedPerformanceMonitorComponent
          monitor={mockMonitor}
          isOpen={false}
          onClose={mockOnClose}
          updateInterval={1000}
        />
      )

      const initialCalls = mockMonitor.getMetrics.mock.calls.length

      // 等待更新间隔
      act(() => {
        vi.advanceTimersByTime(1000)
      })

      // 应该没有新的调用
      expect(mockMonitor.getMetrics).toHaveBeenCalledTimes(initialCalls)

      vi.useRealTimers()
    })
  })

  describe('性能测试', () => {
    it('应该在100ms内完成渲染', () => {
      const startTime = performance.now()
      
      render(
        <EnhancedPerformanceMonitorComponent
          monitor={mockMonitor}
          isOpen={true}
          onClose={mockOnClose}
        />
      )
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      expect(duration).toBeLessThan(100)
    })
  })
})
