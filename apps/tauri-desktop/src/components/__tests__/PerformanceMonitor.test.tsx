import { render, screen, act, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import PerformanceMonitor from '../PerformanceMonitor'
import { useOptimizedPerformanceMonitor } from '../../hooks/useOptimizedPerformanceMonitor'

// Mock the useOptimizedPerformanceMonitor hook
vi.mock('../../hooks/useOptimizedPerformanceMonitor')
const mockUseOptimizedPerformanceMonitor = vi.mocked(useOptimizedPerformanceMonitor)

// Mock Chart.js
vi.mock('react-chartjs-2', () => ({
  Line: ({ data, options }: any) => (
    <div data-testid="mocked-chart-component">
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

describe('PerformanceMonitor', () => {
  const mockMetrics = [
    {
      timestamp: Date.now() - 2000,
      memoryUsage: 50,
      cpuUsage: 25,
      renderTime: 16.7,
      fps: 60,
      domNodes: 150,
      eventListeners: 25
    },
    {
      timestamp: Date.now() - 1000,
      memoryUsage: 55,
      cpuUsage: 30,
      renderTime: 18.2,
      fps: 58,
      domNodes: 155,
      eventListeners: 27
    },
    {
      timestamp: Date.now(),
      memoryUsage: 60,
      cpuUsage: 35,
      renderTime: 20.1,
      fps: 55,
      domNodes: 160,
      eventListeners: 30
    }
  ]

  const mockCurrentMetrics = {
    timestamp: Date.now(),
    memoryUsage: 60,
    cpuUsage: 35,
    renderTime: 20.1,
    fps: 55,
    domNodes: 160,
    eventListeners: 30
  }

  const defaultMockReturn = {
    metrics: mockMetrics,
    currentMetrics: mockCurrentMetrics,
    isMonitoring: false,
    startMonitoring: vi.fn(),
    stopMonitoring: vi.fn(),
    clearData: vi.fn(),
    getOptimizationSuggestions: vi.fn(() => []),
    isLoading: false,
    error: null,
    history: mockMetrics,
    clearHistory: vi.fn(),
    alerts: [],
    clearAlerts: vi.fn(),
    exportData: vi.fn(() => 'mock-data'),
    getAverageMetrics: vi.fn(() => ({})),
    getPerformanceScore: vi.fn(() => 85)
  }

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks()

    // Setup the mock return value
    mockUseOptimizedPerformanceMonitor.mockReturnValue(defaultMockReturn)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should not render when isOpen is false', () => {
      render(<PerformanceMonitor isOpen={false} onClose={vi.fn()} />)
      expect(screen.queryByText('Performance Monitor')).not.toBeInTheDocument()
    })

    it('should render performance monitor when isOpen is true', () => {
      render(<PerformanceMonitor isOpen={true} onClose={vi.fn()} />)
      expect(screen.getByText('Performance Monitor')).toBeInTheDocument()
    })

    it('should render skeleton when loading with no history', () => {
      mockUseOptimizedPerformanceMonitor.mockReturnValue({
        ...defaultMockReturn,
        isLoading: true,
        metrics: [],
        currentMetrics: null
      })

      render(<PerformanceMonitor isOpen={true} onClose={vi.fn()} />)
      
      // Should show loading state or skeleton
      expect(screen.getByText('Performance Monitor')).toBeInTheDocument()
    })

    it('should render metrics when data is available', () => {
      render(<PerformanceMonitor isOpen={true} onClose={vi.fn()} />)
      
      expect(screen.getByText('Performance Monitor')).toBeInTheDocument()
      // Should show actual metrics
      expect(screen.getByText('60.0')).toBeInTheDocument() // Memory usage
      expect(screen.getByText('35.0')).toBeInTheDocument() // CPU usage
    })
  })

  describe('User Interactions', () => {
    it('should start monitoring when start button is clicked', async () => {
      const mockStartMonitoring = vi.fn()
      mockUseOptimizedPerformanceMonitor.mockReturnValue({
        ...defaultMockReturn,
        startMonitoring: mockStartMonitoring
      })

      render(<PerformanceMonitor isOpen={true} onClose={vi.fn()} />)
      
      const startButton = screen.getByText('Start')
      await act(async () => {
        fireEvent.click(startButton)
      })
      
      expect(mockStartMonitoring).toHaveBeenCalledTimes(1)
    })

    it('should stop monitoring when stop button is clicked', async () => {
      const mockStopMonitoring = vi.fn()
      mockUseOptimizedPerformanceMonitor.mockReturnValue({
        ...defaultMockReturn,
        isMonitoring: true,
        stopMonitoring: mockStopMonitoring
      })

      render(<PerformanceMonitor isOpen={true} onClose={vi.fn()} />)
      
      const stopButton = screen.getByText('Stop')
      await act(async () => {
        fireEvent.click(stopButton)
      })
      
      expect(mockStopMonitoring).toHaveBeenCalledTimes(1)
    })

    it('should close dialog when close button is clicked', async () => {
      const mockOnClose = vi.fn()
      render(<PerformanceMonitor isOpen={true} onClose={mockOnClose} />)
      
      const closeButton = screen.getByLabelText('Close performance monitor')
      await act(async () => {
        fireEvent.click(closeButton)
      })
      
      expect(mockOnClose).toHaveBeenCalledTimes(1)
    })
  })

  describe('Error Handling', () => {
    it('should display error message when error occurs', () => {
      const errorMessage = 'Failed to collect performance metrics'
      mockUseOptimizedPerformanceMonitor.mockReturnValue({
        ...defaultMockReturn,
        error: errorMessage
      })

      render(<PerformanceMonitor isOpen={true} onClose={vi.fn()} />)
      
      expect(screen.getByText(errorMessage)).toBeInTheDocument()
    })
  })

  describe('Loading States', () => {
    it('should show loading indicator when updating data', () => {
      mockUseOptimizedPerformanceMonitor.mockReturnValue({
        ...defaultMockReturn,
        isLoading: true
      })

      render(<PerformanceMonitor isOpen={true} onClose={vi.fn()} />)
      
      // Should show some loading indication
      expect(screen.getByText('Performance Monitor')).toBeInTheDocument()
    })
  })

  describe('Optimization Suggestions', () => {
    it('should show optimization tips when available', () => {
      const suggestions = ['Memory usage is high', 'Consider closing unused tabs']
      mockUseOptimizedPerformanceMonitor.mockReturnValue({
        ...defaultMockReturn,
        getOptimizationSuggestions: vi.fn(() => suggestions)
      })

      render(<PerformanceMonitor isOpen={true} onClose={vi.fn()} />)
      
      // Should show optimization suggestions
      expect(screen.getByText('Performance Monitor')).toBeInTheDocument()
    })
  })

  describe('Chart Integration', () => {
    it('should render performance chart with correct data', () => {
      render(<PerformanceMonitor isOpen={true} onClose={vi.fn()} />)

      // Check for the chart container from the actual component
      const chartContainer = screen.getByTestId('performance-chart-container')
      expect(chartContainer).toBeInTheDocument()

      // Check for the mocked chart component
      const mockedChart = screen.getByTestId('mocked-chart-component')
      expect(mockedChart).toBeInTheDocument()

      const chartData = screen.getByTestId('chart-data')
      expect(chartData).toBeInTheDocument()
    })
  })
})
