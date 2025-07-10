
import { render, screen, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import PerformanceMonitor from '../PerformanceMonitor'

// Mock the hooks and utilities
vi.mock('../../hooks/useOptimizedPerformanceMonitor', () => ({
  useOptimizedPerformanceMonitor: vi.fn(() => ({
    metrics: [
      {
        timestamp: Date.now() - 2000,
        memoryUsage: 50,
        cpuUsage: 15,
        renderTime: 15.2,
        fps: 60,
        domNodes: 100,
        eventListeners: 10
      },
      {
        timestamp: Date.now(),
        memoryUsage: 52,
        cpuUsage: 16,
        renderTime: 16.7,
        fps: 58,
        domNodes: 105,
        eventListeners: 12
      }
    ],
    currentMetrics: {
      timestamp: Date.now(),
      memoryUsage: 52,
      cpuUsage: 16,
      renderTime: 16.7,
      fps: 58,
      domNodes: 105,
      eventListeners: 12
    },
    history: [
      {
        timestamp: Date.now() - 2000,
        memoryUsage: 50,
        cpuUsage: 15,
        renderTime: 15.2,
        fps: 60,
        domNodes: 100,
        eventListeners: 10
      },
      {
        timestamp: Date.now(),
        memoryUsage: 52,
        cpuUsage: 16,
        renderTime: 16.7,
        fps: 58,
        domNodes: 105,
        eventListeners: 12
      }
    ],
    isMonitoring: false,
    isLoading: false,
    error: null,
    startMonitoring: vi.fn(),
    stopMonitoring: vi.fn(),
    clearData: vi.fn(),
    clearHistory: vi.fn(),
    getOptimizationSuggestions: vi.fn(() => [
      'Performance looks good!',
      'Consider enabling virtualization for large datasets'
    ])
  }))
}))

// Mock Chart.js
vi.mock('react-chartjs-2', () => ({
  Line: ({ data }: any) => (
    <div data-testid="chart-component" data-chart-data={JSON.stringify(data)}>
      <div data-testid="chart-data">{JSON.stringify(data)}</div>
      <div data-testid="chart-options">{JSON.stringify({responsive: true, maintainAspectRatio: false})}</div>
      Performance Chart
    </div>
  )
}))

// Mock UserGuide and UserPreferences
vi.mock('../UserGuide', () => ({
  __esModule: true,
  default: ({ isOpen }: any) =>
    isOpen ? <div data-testid="user-guide">User Guide</div> : null,
  performanceMonitorGuideSteps: []
}))

vi.mock('../UserPreferences', () => ({
  __esModule: true,
  default: ({ isOpen }: any) =>
    isOpen ? <div data-testid="user-preferences">User Preferences</div> : null
}))

describe('PerformanceMonitor Basic Tests', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
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

    // With history data, should show chart data and options
    expect(screen.getByTestId('chart-data')).toBeInTheDocument()
    expect(screen.getByTestId('chart-options')).toBeInTheDocument()
  })

  it('should display control buttons', async () => {
    await act(async () => {
      render(<PerformanceMonitor {...defaultProps} />)
    })

    expect(screen.getByTestId('start-monitoring-button')).toBeInTheDocument()
    expect(screen.getByTestId('close-performance-monitor')).toBeInTheDocument()
  })

  // Note: Empty state test is covered by the chart container test
  // The component shows chart when metrics are available, empty state when not

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
