import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import PerformanceMonitor from '../PerformanceMonitor'
import { useVirtualizedPerformanceMonitor } from '../../hooks/useVirtualizedPerformanceMonitor'

// Mock the hook
vi.mock('../../hooks/useVirtualizedPerformanceMonitor')
const mockUseVirtualizedPerformanceMonitor = useVirtualizedPerformanceMonitor as any

// Mock Chart.js
vi.mock('react-chartjs-2', () => ({
  Line: ({ data, options }: any) => (
    <div data-testid="performance-chart">
      <div data-testid="chart-data">{JSON.stringify(data)}</div>
      <div data-testid="chart-options">{JSON.stringify(options)}</div>
    </div>
  )
}))

// Mock Chart.js core
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

// Mock virtualized components
vi.mock('../VirtualizedPerformanceList', () => ({
  default: ({ data, onItemClick }: any) => (
    <div data-testid="virtualized-performance-list">
      {data.map((item: any, index: number) => (
        <div
          key={index}
          data-testid={`performance-item-${index}`}
          onClick={() => onItemClick?.(item, index)}
        >
          Memory: {item.memoryUsage?.percentage || 0}%
        </div>
      ))}
    </div>
  )
}))

vi.mock('../OptimizedPerformanceChart', () => ({
  default: ({ data, height }: any) => (
    <div data-testid="optimized-performance-chart" style={{ height }}>
      Chart with {data.length} data points
    </div>
  )
}))

vi.mock('../MetricsGrid', () => {
  return {
    __esModule: true,
    default: ({ metrics, isLoading }: any) => {
      const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + sizes[i]
      }

      return (
        <div data-testid="metrics-grid">
          {isLoading ? (
            <div data-testid="metrics-loading-state">Loading...</div>
          ) : (
            <div>
              <div>{metrics.memoryUsage.percentage.toFixed(1)}%</div>
              <div>{formatBytes(metrics.memoryUsage.used)}</div>
              <div>{metrics.renderTime.toFixed(1)}ms</div>
              <div>{metrics.dbQueryTime.toFixed(1)}ms</div>
              <div>{metrics.componentCount}</div>
            </div>
          )}
        </div>
      )
    }
  }
})

vi.mock('../SyncMetrics', () => ({
  default: () => <div data-testid="sync-metrics">Sync Metrics</div>
}))

// Mock Tauri API
vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: vi.fn()
}))

// Mock UserGuide and UserPreferences
vi.mock('../UserGuide', () => ({
  default: ({ isOpen, onClose }: any) =>
    isOpen ? <div data-testid="user-guide" onClick={onClose}>User Guide</div> : null,
  performanceMonitorGuideSteps: []
}))

vi.mock('../UserPreferences', () => ({
  default: ({ isOpen, onClose }: any) =>
    isOpen ? <div data-testid="user-preferences" onClick={onClose}>User Preferences</div> : null,
  useUserPreferences: () => ({
    performanceMonitor: {
      updateInterval: 2000,
      autoStart: false
    }
  })
}))

describe('PerformanceMonitor', () => {
  const mockMetrics = {
    memoryUsage: { used: 512, total: 1024, percentage: 50 },
    renderTime: 16.7,
    dbQueryTime: 5.2,
    componentCount: 25,
    lastUpdate: new Date('2024-01-01T12:00:00Z'),
    cpuCores: 4,
    cpuUsage: 25,
    diskRead: 50,
    diskWrite: 25,
    pageLoadTime: 1500,
    domNodes: 150,
    jsHeapSize: 10485760,
    networkRequests: 5
  }

  const mockHistory = [
    { ...mockMetrics, lastUpdate: new Date('2024-01-01T11:58:00Z') },
    { ...mockMetrics, lastUpdate: new Date('2024-01-01T11:59:00Z') },
    { ...mockMetrics, lastUpdate: new Date('2024-01-01T12:00:00Z') }
  ]

  const defaultMockReturn = {
    metrics: mockMetrics,
    history: mockHistory,
    virtualizedHistory: mockHistory,
    isMonitoring: false,
    isLoading: false,
    error: null,
    performanceStats: {
      totalEntries: 3,
      virtualizedEntries: 3,
      compressionRatio: 1,
      memoryUsage: 0.1,
      renderTime: 16.7
    },
    startMonitoring: vi.fn(),
    stopMonitoring: vi.fn(),
    clearHistory: vi.fn(),
    optimizeData: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockUseVirtualizedPerformanceMonitor.mockReturnValue(defaultMockReturn)
  })

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(<PerformanceMonitor isOpen={false} onClose={vi.fn()} />)
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should render performance monitor when isOpen is true', async () => {
      await act(async () => {
        render(<PerformanceMonitor isOpen={true} onClose={vi.fn()} />)
      })
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Performance Monitor')).toBeInTheDocument()
    })

    it('should render skeleton when loading with no history', async () => {
      mockUseVirtualizedPerformanceMonitor.mockReturnValue({
        ...defaultMockReturn,
        isLoading: true,
        history: []
      })

      await act(async () => {
        render(<PerformanceMonitor isOpen={true} onClose={vi.fn()} />)
      })
      expect(screen.getByTestId('performance-monitor-skeleton')).toBeInTheDocument()
    })

    it('should render metrics when data is available', async () => {
      await act(async () => {
        render(<PerformanceMonitor isOpen={true} onClose={vi.fn()} />)
      })

      expect(screen.getByText('50.0%')).toBeInTheDocument()
      expect(screen.getByText('16.7ms')).toBeInTheDocument()
      expect(screen.getByText('5.2ms')).toBeInTheDocument()
      expect(screen.getByText('25')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should display error message when error occurs', async () => {
      const errorMessage = 'Failed to collect performance metrics'
      mockUseOptimizedPerformanceMonitor.mockReturnValue({
        ...defaultMockReturn,
        error: errorMessage
      })

      await act(async () => {
        render(<PerformanceMonitor isOpen={true} onClose={jest.fn()} />)
      })
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })

    it('should show retry button when error occurs', async () => {
      const mockStartMonitoring = jest.fn()
      mockUseOptimizedPerformanceMonitor.mockReturnValue({
        ...defaultMockReturn,
        error: 'Test error',
        startMonitoring: mockStartMonitoring
      })

      await act(async () => {
        render(<PerformanceMonitor isOpen={true} onClose={jest.fn()} />)
      })

      const retryButton = screen.getByLabelText('Retry performance monitoring')
      await act(async () => {
        await userEvent.click(retryButton)
      })

      expect(mockStartMonitoring).toHaveBeenCalled()
    })
  })

  describe('Loading States', () => {
    it('should show loading indicator when updating data', async () => {
      mockUseOptimizedPerformanceMonitor.mockReturnValue({
        ...defaultMockReturn,
        isLoading: true
      })

      await act(async () => {
        render(<PerformanceMonitor isOpen={true} onClose={jest.fn()} />)
      })
      expect(screen.getByText('正在更新性能数据...')).toBeInTheDocument()
    })

    it('should show metrics loading state when no history', async () => {
      mockUseOptimizedPerformanceMonitor.mockReturnValue({
        ...defaultMockReturn,
        isLoading: true,
        history: []
      })

      await act(async () => {
        render(<PerformanceMonitor isOpen={true} onClose={jest.fn()} />)
      })
      expect(screen.getByTestId('performance-monitor-skeleton')).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('should start monitoring when start button is clicked', async () => {
      const mockStartMonitoring = jest.fn()
      mockUseOptimizedPerformanceMonitor.mockReturnValue({
        ...defaultMockReturn,
        startMonitoring: mockStartMonitoring
      })

      await act(async () => {
        render(<PerformanceMonitor isOpen={true} onClose={jest.fn()} />)
      })

      const startButton = screen.getByLabelText(/Start performance monitoring/)
      await act(async () => {
        await userEvent.click(startButton)
      })

      expect(mockStartMonitoring).toHaveBeenCalled()
    })

    it('should stop monitoring when stop button is clicked', async () => {
      const mockStopMonitoring = jest.fn()
      mockUseOptimizedPerformanceMonitor.mockReturnValue({
        ...defaultMockReturn,
        isMonitoring: true,
        stopMonitoring: mockStopMonitoring
      })

      await act(async () => {
        render(<PerformanceMonitor isOpen={true} onClose={jest.fn()} />)
      })

      const stopButton = screen.getByLabelText(/Stop performance monitoring/)
      await act(async () => {
        await userEvent.click(stopButton)
      })

      expect(mockStopMonitoring).toHaveBeenCalled()
    })

    it('should close dialog when close button is clicked', async () => {
      const mockOnClose = jest.fn()
      await act(async () => {
        render(<PerformanceMonitor isOpen={true} onClose={mockOnClose} />)
      })

      const closeButton = screen.getByLabelText('Close performance monitor')
      await act(async () => {
        await userEvent.click(closeButton)
      })

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should close dialog when Escape key is pressed', async () => {
      const mockOnClose = jest.fn()
      await act(async () => {
        render(<PerformanceMonitor isOpen={true} onClose={mockOnClose} />)
      })

      await act(async () => {
        await userEvent.keyboard('{Escape}')
      })
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('Optimization Suggestions', () => {
    it('should show optimization tips when button is clicked', async () => {
      const suggestions = ['Memory usage is high', 'Consider closing unused tabs']
      mockUseOptimizedPerformanceMonitor.mockReturnValue({
        ...defaultMockReturn,
        getOptimizationSuggestions: jest.fn(() => suggestions)
      })

      await act(async () => {
        render(<PerformanceMonitor isOpen={true} onClose={jest.fn()} />)
      })

      const tipsButton = screen.getByLabelText('Show optimization suggestions')
      await act(async () => {
        await userEvent.click(tipsButton)
      })

      expect(screen.getByText('智能优化建议')).toBeInTheDocument()
      expect(screen.getByText(suggestions[0])).toBeInTheDocument()
      expect(screen.getByText(suggestions[1])).toBeInTheDocument()
    })

    it('should clear history when clear button is clicked', async () => {
      const mockClearHistory = jest.fn()
      const suggestions = ['Test suggestion']
      mockUseOptimizedPerformanceMonitor.mockReturnValue({
        ...defaultMockReturn,
        clearHistory: mockClearHistory,
        getOptimizationSuggestions: jest.fn(() => suggestions)
      })

      await act(async () => {
        render(<PerformanceMonitor isOpen={true} onClose={jest.fn()} />)
      })

      // First show optimization tips
      const tipsButton = screen.getByLabelText('Show optimization suggestions')
      await act(async () => {
        await userEvent.click(tipsButton)
      })

      // Then click clear history
      const clearButton = screen.getByText('清除历史数据以重置建议')
      await act(async () => {
        await userEvent.click(clearButton)
      })

      expect(mockClearHistory).toHaveBeenCalled()
    })
  })

  describe('User Guide and Preferences', () => {
    it('should open user guide when help button is clicked', async () => {
      await act(async () => {
        render(<PerformanceMonitor isOpen={true} onClose={jest.fn()} />)
      })

      const helpButton = screen.getByLabelText('Show help guide')
      await act(async () => {
        await userEvent.click(helpButton)
      })

      expect(screen.getByTestId('user-guide')).toBeInTheDocument()
    })

    it('should open preferences when settings button is clicked', async () => {
      await act(async () => {
        render(<PerformanceMonitor isOpen={true} onClose={jest.fn()} />)
      })

      const settingsButton = screen.getByLabelText('Open preferences')
      await act(async () => {
        await userEvent.click(settingsButton)
      })

      expect(screen.getByTestId('user-preferences')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', async () => {
      await act(async () => {
        render(<PerformanceMonitor isOpen={true} onClose={jest.fn()} />)
      })

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
      expect(dialog).toHaveAttribute('aria-labelledby')
      expect(dialog).toHaveAttribute('aria-describedby')
    })

    it('should have proper button states', async () => {
      await act(async () => {
        render(<PerformanceMonitor isOpen={true} onClose={jest.fn()} />)
      })

      const startButton = screen.getByLabelText(/Start performance monitoring/)
      expect(startButton).toHaveAttribute('aria-pressed', 'false')
    })

    it('should update button state when monitoring', async () => {
      mockUseOptimizedPerformanceMonitor.mockReturnValue({
        ...defaultMockReturn,
        isMonitoring: true
      })

      await act(async () => {
        render(<PerformanceMonitor isOpen={true} onClose={jest.fn()} />)
      })

      const stopButton = screen.getByLabelText(/Stop performance monitoring/)
      expect(stopButton).toHaveAttribute('aria-pressed', 'true')
    })
  })

  describe('Performance Status', () => {
    it('should show correct status colors for different performance levels', async () => {
      const highMemoryMetrics = {
        ...mockMetrics,
        memoryUsage: { used: 900, total: 1024, percentage: 88 }
      }

      mockUseOptimizedPerformanceMonitor.mockReturnValue({
        ...defaultMockReturn,
        metrics: highMemoryMetrics
      })

      await act(async () => {
        render(<PerformanceMonitor isOpen={true} onClose={jest.fn()} />)
      })

      // Should show warning/poor status for high memory usage
      expect(screen.getByText(/88\.0%/)).toBeInTheDocument()
    })
  })

  describe('Chart Integration', () => {
    it('should render performance chart with correct data', async () => {
      await act(async () => {
        render(<PerformanceMonitor isOpen={true} onClose={jest.fn()} />)
      })

      const chart = screen.getByTestId('performance-chart')
      expect(chart).toBeInTheDocument()

      const chartData = screen.getByTestId('chart-data')
      expect(chartData).toBeInTheDocument()
    })

    it('should show empty state when no history data', async () => {
      mockUseOptimizedPerformanceMonitor.mockReturnValue({
        ...defaultMockReturn,
        history: []
      })

      await act(async () => {
        render(<PerformanceMonitor isOpen={true} onClose={jest.fn()} />)
      })

      expect(screen.getByText('暂无性能数据，开始监控以查看实时性能趋势图表')).toBeInTheDocument()
    })
  })
})
