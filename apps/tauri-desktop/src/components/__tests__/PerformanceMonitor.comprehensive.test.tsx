import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import PerformanceMonitor from '../PerformanceMonitor'
import { useOptimizedPerformanceMonitor } from '../../hooks/useOptimizedPerformanceMonitor'

// Mock dependencies
jest.mock('../../hooks/useOptimizedPerformanceMonitor')
jest.mock('react-chartjs-2', () => ({
  Line: ({ data }: any) => (
    <div data-testid="performance-chart" data-chart-data={JSON.stringify(data)}>
      Performance Chart
    </div>
  )
}))

jest.mock('../../utils/tauri', () => ({
  getSyncStatus: jest.fn(() => Promise.resolve('Idle')),
  getSyncStats: jest.fn(() => Promise.resolve({ total_files: 10 })),
  getWebDAVConfig: jest.fn(() => Promise.resolve({ enabled: true })),
  withErrorHandling: jest.fn((fn) => fn())
}))

const mockUseOptimizedPerformanceMonitor = useOptimizedPerformanceMonitor as jest.MockedFunction<typeof useOptimizedPerformanceMonitor>

describe('PerformanceMonitor - Comprehensive Testing', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn()
  }

  const mockMetrics = {
    memoryUsage: { used: 512, total: 8192, percentage: 6.25 },
    renderTime: 16.7,
    dbQueryTime: 2.3,
    componentCount: 45,
    lastUpdate: new Date(),
    cpuUsage: 15,
    diskRead: 1024,
    diskWrite: 512
  }

  const mockHistory = [
    {
      memoryUsage: { used: 500, total: 8192, percentage: 6.1 },
      renderTime: 15.2,
      dbQueryTime: 2.1,
      componentCount: 43,
      lastUpdate: new Date(Date.now() - 2000)
    },
    mockMetrics
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseOptimizedPerformanceMonitor.mockReturnValue({
      metrics: mockMetrics,
      history: mockHistory,
      isMonitoring: false,
      isLoading: false,
      error: null,
      startMonitoring: jest.fn(),
      stopMonitoring: jest.fn(),
      clearHistory: jest.fn(),
      getOptimizationSuggestions: jest.fn(() => [
        '考虑关闭未使用的标签页以释放内存',
        '数据库查询性能良好，无需优化'
      ])
    })
  })

  describe('🎨 UI Completeness Testing', () => {
    describe('PM-UI-001: Core UI Elements Rendering', () => {
      it('should render all essential UI elements', () => {
        render(<PerformanceMonitor {...defaultProps} />)
        
        // Header elements
        expect(screen.getByText('Performance Monitor')).toBeInTheDocument()
        expect(screen.getByLabelText(/Monitoring status/)).toBeInTheDocument()
        
        // Metric cards
        expect(screen.getByText('内存使用')).toBeInTheDocument()
        expect(screen.getByText('渲染时间')).toBeInTheDocument()
        expect(screen.getByText('数据库查询')).toBeInTheDocument()
        expect(screen.getByText('组件数量')).toBeInTheDocument()
        
        // Control buttons
        expect(screen.getByLabelText(/Show help guide/)).toBeInTheDocument()
        expect(screen.getByLabelText(/Show optimization suggestions/)).toBeInTheDocument()
        expect(screen.getByLabelText(/Close performance monitor/)).toBeInTheDocument()
      })

      it('should not render when closed', () => {
        render(<PerformanceMonitor {...defaultProps} isOpen={false} />)
        expect(screen.queryByText('Performance Monitor')).not.toBeInTheDocument()
      })
    })

    describe('PM-UI-002: Metric Cards Content Validation', () => {
      it('should display metrics in correct format', () => {
        render(<PerformanceMonitor {...defaultProps} />)
        
        // Memory usage format
        expect(screen.getByText('512.0 MB')).toBeInTheDocument()
        
        // Render time format
        expect(screen.getByText('16.7ms')).toBeInTheDocument()
        
        // Database query format
        expect(screen.getByText('2.3ms')).toBeInTheDocument()
        
        // Component count format
        expect(screen.getByText('45')).toBeInTheDocument()
      })

      it('should show percentage indicators', () => {
        render(<PerformanceMonitor {...defaultProps} />)
        
        // Memory usage percentage
        expect(screen.getByText('6%')).toBeInTheDocument()
      })
    })

    describe('PM-UI-003: Chart Component Rendering', () => {
      it('should render performance chart', () => {
        render(<PerformanceMonitor {...defaultProps} />)
        
        const chart = screen.getByTestId('performance-chart')
        expect(chart).toBeInTheDocument()
        
        // Verify chart data is passed
        const chartData = JSON.parse(chart.getAttribute('data-chart-data') || '{}')
        expect(chartData.datasets).toBeDefined()
        expect(chartData.labels).toBeDefined()
      })

      it('should show empty state when no history', () => {
        mockUseOptimizedPerformanceMonitor.mockReturnValue({
          ...mockUseOptimizedPerformanceMonitor(),
          history: []
        })

        render(<PerformanceMonitor {...defaultProps} />)
        
        expect(screen.getByText('暂无性能数据')).toBeInTheDocument()
        expect(screen.getByText('开始监控以查看实时性能趋势图表')).toBeInTheDocument()
      })
    })

    describe('PM-UI-006: Theme Consistency', () => {
      it('should apply dark theme classes correctly', () => {
        render(<PerformanceMonitor {...defaultProps} />)
        
        const dialog = screen.getByRole('dialog')
        expect(dialog).toHaveClass('dark:bg-gray-800')
      })
    })

    describe('PM-UI-007: ARIA Labels Validation', () => {
      it('should have proper accessibility attributes', () => {
        render(<PerformanceMonitor {...defaultProps} />)
        
        const dialog = screen.getByRole('dialog')
        expect(dialog).toHaveAttribute('aria-modal', 'true')
        expect(dialog).toHaveAttribute('aria-labelledby', 'performance-monitor-title')
        expect(dialog).toHaveAttribute('aria-describedby', 'performance-monitor-description')
      })

      it('should have descriptive button labels', () => {
        render(<PerformanceMonitor {...defaultProps} />)
        
        expect(screen.getByLabelText(/Show help guide/)).toBeInTheDocument()
        expect(screen.getByLabelText(/Show optimization suggestions/)).toBeInTheDocument()
        expect(screen.getByLabelText(/Close performance monitor/)).toBeInTheDocument()
      })
    })
  })

  describe('⚙️ Functional Completeness Testing', () => {
    describe('PM-FUNC-001: Start Monitoring Function', () => {
      it('should start monitoring when button clicked', async () => {
        const startMonitoring = jest.fn()
        mockUseOptimizedPerformanceMonitor.mockReturnValue({
          ...mockUseOptimizedPerformanceMonitor(),
          startMonitoring
        })

        render(<PerformanceMonitor {...defaultProps} />)
        
        const startButton = screen.getByLabelText(/Start performance monitoring/)
        await userEvent.click(startButton)
        
        expect(startMonitoring).toHaveBeenCalled()
      })
    })

    describe('PM-FUNC-002: Stop Monitoring Function', () => {
      it('should stop monitoring when button clicked', async () => {
        const stopMonitoring = jest.fn()
        mockUseOptimizedPerformanceMonitor.mockReturnValue({
          ...mockUseOptimizedPerformanceMonitor(),
          isMonitoring: true,
          stopMonitoring
        })

        render(<PerformanceMonitor {...defaultProps} />)
        
        const stopButton = screen.getByLabelText(/Stop performance monitoring/)
        await userEvent.click(stopButton)
        
        expect(stopMonitoring).toHaveBeenCalled()
      })
    })

    describe('PM-FUNC-006: Optimization Suggestions', () => {
      it('should show optimization suggestions when enabled', async () => {
        render(<PerformanceMonitor {...defaultProps} />)
        
        const optimizationButton = screen.getByLabelText(/Show optimization suggestions/)
        await userEvent.click(optimizationButton)
        
        await waitFor(() => {
          expect(screen.getByText('智能优化建议')).toBeInTheDocument()
          expect(screen.getByText('考虑关闭未使用的标签页以释放内存')).toBeInTheDocument()
        })
      })

      it('should clear history when clear button clicked', async () => {
        const clearHistory = jest.fn()
        mockUseOptimizedPerformanceMonitor.mockReturnValue({
          ...mockUseOptimizedPerformanceMonitor(),
          clearHistory
        })

        render(<PerformanceMonitor {...defaultProps} />)
        
        // Open optimization suggestions
        const optimizationButton = screen.getByLabelText(/Show optimization suggestions/)
        await userEvent.click(optimizationButton)
        
        // Click clear history
        const clearButton = screen.getByText('清除历史数据以重置建议')
        await userEvent.click(clearButton)
        
        expect(clearHistory).toHaveBeenCalled()
      })
    })
  })

  describe('🔗 Integration Testing', () => {
    describe('PM-INT-001: Hook Integration', () => {
      it('should call hook with correct parameters', () => {
        render(<PerformanceMonitor {...defaultProps} />)
        
        expect(mockUseOptimizedPerformanceMonitor).toHaveBeenCalledWith({
          updateInterval: 2000,
          maxHistoryEntries: 20,
          enableAutoOptimization: true,
          enableErrorTracking: true
        })
      })
    })

    describe('PM-INT-002: Component Lifecycle', () => {
      it('should cleanup properly on unmount', () => {
        const { unmount } = render(<PerformanceMonitor {...defaultProps} />)
        
        expect(() => unmount()).not.toThrow()
      })

      it('should handle prop changes correctly', () => {
        const { rerender } = render(<PerformanceMonitor {...defaultProps} />)
        
        rerender(<PerformanceMonitor {...defaultProps} isOpen={false} />)
        
        expect(screen.queryByText('Performance Monitor')).not.toBeInTheDocument()
      })
    })
  })

  describe('🚨 Error Handling Testing', () => {
    it('should handle loading state', () => {
      mockUseOptimizedPerformanceMonitor.mockReturnValue({
        ...mockUseOptimizedPerformanceMonitor(),
        isLoading: true,
        history: []
      })

      render(<PerformanceMonitor {...defaultProps} />)
      
      expect(screen.getByText(/正在更新性能数据/)).toBeInTheDocument()
    })

    it('should handle error state', () => {
      mockUseOptimizedPerformanceMonitor.mockReturnValue({
        ...mockUseOptimizedPerformanceMonitor(),
        error: 'Failed to load performance data'
      })

      render(<PerformanceMonitor {...defaultProps} />)
      
      expect(screen.getByText('Failed to load performance data')).toBeInTheDocument()
    })

    it('should handle missing metrics gracefully', () => {
      mockUseOptimizedPerformanceMonitor.mockReturnValue({
        ...mockUseOptimizedPerformanceMonitor(),
        metrics: {
          memoryUsage: { used: 0, total: 0, percentage: 0 },
          renderTime: 0,
          dbQueryTime: 0,
          componentCount: 0,
          lastUpdate: new Date()
        }
      })

      render(<PerformanceMonitor {...defaultProps} />)
      
      expect(screen.getByText('0.0 MB')).toBeInTheDocument()
      expect(screen.getByText('0.0ms')).toBeInTheDocument()
    })
  })

  describe('⌨️ Keyboard Navigation Testing', () => {
    it('should handle Escape key to close', () => {
      render(<PerformanceMonitor {...defaultProps} />)
      
      fireEvent.keyDown(document, { key: 'Escape' })
      
      expect(defaultProps.onClose).toHaveBeenCalled()
    })

    it('should handle Enter key on buttons', async () => {
      const startMonitoring = jest.fn()
      mockUseOptimizedPerformanceMonitor.mockReturnValue({
        ...mockUseOptimizedPerformanceMonitor(),
        startMonitoring
      })

      render(<PerformanceMonitor {...defaultProps} />)
      
      const startButton = screen.getByLabelText(/Start performance monitoring/)
      startButton.focus()
      
      fireEvent.keyDown(startButton, { key: 'Enter' })
      
      expect(startMonitoring).toHaveBeenCalled()
    })
  })

  describe('📱 Responsive Design Testing', () => {
    it('should adapt to small screens', () => {
      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(<PerformanceMonitor {...defaultProps} />)
      
      // Should still render all essential elements
      expect(screen.getByText('Performance Monitor')).toBeInTheDocument()
      expect(screen.getByText('内存使用')).toBeInTheDocument()
    })
  })
})
