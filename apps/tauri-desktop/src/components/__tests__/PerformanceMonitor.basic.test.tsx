
import { render, screen, act } from '@testing-library/react'
import PerformanceMonitor from '../PerformanceMonitor'

// Mock the hooks and utilities
jest.mock('../../hooks/useOptimizedPerformanceMonitor', () => ({
  useOptimizedPerformanceMonitor: jest.fn(() => ({
    metrics: {
      memoryUsage: { used: 512, total: 8192, percentage: 6.25 },
      renderTime: 16.7,
      dbQueryTime: 2.3,
      componentCount: 45,
      lastUpdate: new Date(),
      cpuUsage: 15,
      diskRead: 1024,
      diskWrite: 512
    },
    history: [
      {
        memoryUsage: { used: 500, total: 8192, percentage: 6.1 },
        renderTime: 15.2,
        dbQueryTime: 2.1,
        componentCount: 43,
        lastUpdate: new Date(Date.now() - 2000)
      },
      {
        memoryUsage: { used: 512, total: 8192, percentage: 6.25 },
        renderTime: 16.7,
        dbQueryTime: 2.3,
        componentCount: 45,
        lastUpdate: new Date()
      }
    ],
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
  }))
}))

// Mock Chart.js
jest.mock('react-chartjs-2', () => ({
  Line: ({ data }: any) => (
    <div data-testid="chart-component" data-chart-data={JSON.stringify(data)}>
      Performance Chart
    </div>
  )
}))

// Mock UserGuide and UserPreferences
jest.mock('../UserGuide', () => ({
  __esModule: true,
  default: ({ isOpen }: any) =>
    isOpen ? <div data-testid="user-guide">User Guide</div> : null,
  performanceMonitorGuideSteps: []
}))

jest.mock('../UserPreferences', () => ({
  __esModule: true,
  default: ({ isOpen }: any) =>
    isOpen ? <div data-testid="user-preferences">User Preferences</div> : null
}))

describe('PerformanceMonitor Basic Tests', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render when open', async () => {
    await act(async () => {
      render(<PerformanceMonitor {...defaultProps} />)
    })

    expect(screen.getByTestId('performance-monitor')).toBeInTheDocument()
    expect(screen.getByText('Performance Monitor')).toBeInTheDocument()
  })

  it('should not render when closed', async () => {
    await act(async () => {
      render(<PerformanceMonitor {...defaultProps} isOpen={false} />)
    })

    expect(screen.queryByTestId('performance-monitor')).not.toBeInTheDocument()
  })

  it('should display monitoring status', async () => {
    await act(async () => {
      render(<PerformanceMonitor {...defaultProps} />)
    })

    expect(screen.getByTestId('monitoring-indicator')).toBeInTheDocument()
  })

  it('should display metric cards', async () => {
    await act(async () => {
      render(<PerformanceMonitor {...defaultProps} />)
    })

    expect(screen.getByTestId('memory-usage-card')).toBeInTheDocument()
    expect(screen.getByTestId('render-time-card')).toBeInTheDocument()
    expect(screen.getByTestId('db-query-card')).toBeInTheDocument()
    expect(screen.getByTestId('component-count-card')).toBeInTheDocument()
  })

  it('should display performance chart container', async () => {
    await act(async () => {
      render(<PerformanceMonitor {...defaultProps} />)
    })

    // Chart container should always be present
    expect(screen.getByTestId('performance-chart')).toBeInTheDocument()

    // With history data, should show actual chart
    expect(screen.getByTestId('chart-component')).toBeInTheDocument()
  })

  it('should display control buttons', async () => {
    await act(async () => {
      render(<PerformanceMonitor {...defaultProps} />)
    })

    expect(screen.getByTestId('start-monitoring-button')).toBeInTheDocument()
    expect(screen.getByTestId('close-performance-monitor')).toBeInTheDocument()
  })

  it('should display empty state when no history data', async () => {
    const mockHook = jest.mocked(require('../../hooks/useOptimizedPerformanceMonitor').useOptimizedPerformanceMonitor)
    mockHook.mockReturnValue({
      ...mockHook(),
      history: []
    })

    await act(async () => {
      render(<PerformanceMonitor {...defaultProps} />)
    })

    // Chart container should still be present
    expect(screen.getByTestId('performance-chart')).toBeInTheDocument()

    // Should show empty state message
    expect(screen.getByText('暂无性能数据')).toBeInTheDocument()
    expect(screen.getByText('开始监控以查看实时性能趋势图表')).toBeInTheDocument()
  })

  it('should have proper accessibility attributes', async () => {
    await act(async () => {
      render(<PerformanceMonitor {...defaultProps} />)
    })

    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby', 'performance-monitor-title')
    expect(dialog).toHaveAttribute('aria-describedby', 'performance-monitor-description')
  })
})
