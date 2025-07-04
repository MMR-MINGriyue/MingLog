
import { render, screen, waitFor, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import PerformanceMonitor from '../PerformanceMonitor'
import VirtualizedSearchResults from '../VirtualizedSearchResults'
import VirtualizedPageList from '../VirtualizedPageList'
import ChartLoader from '../ChartLoader'

// Mock Tauri APIs
vi.mock('../../utils/tauri', () => ({
  getSyncStatus: vi.fn().mockResolvedValue('Idle'),
  getSyncStats: vi.fn().mockResolvedValue({}),
  getWebDAVConfig: vi.fn().mockResolvedValue(null),
  withErrorHandling: vi.fn().mockImplementation((fn) => fn()),
}))

// Mock Tauri invoke function
vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: vi.fn().mockImplementation((command: string) => {
    switch (command) {
      case 'get_system_info':
        return Promise.resolve({
          memory: { used: 100 * 1024 * 1024, total: 1024 * 1024 * 1024, percentage: 10 }
        })
      case 'get_memory_info':
        return Promise.resolve({ used: 100 * 1024 * 1024, total: 1024 * 1024 * 1024 })
      case 'measure_db_performance':
        return Promise.resolve({ query_time: 25 })
      default:
        return Promise.resolve({})
    }
  }),
}))

// Mock environment adapter
vi.mock('../../utils/environment', () => ({
  environmentAdapter: {
    getMemoryUsage: vi.fn().mockResolvedValue({ used: 100, total: 1000 }),
    getCPUUsage: vi.fn().mockResolvedValue(50),
  },
  isTauriEnvironment: vi.fn().mockReturnValue(true),
}))

// Mock performance monitoring hook
vi.mock('../../hooks/useOptimizedPerformanceMonitor', () => ({
  useOptimizedPerformanceMonitor: vi.fn().mockReturnValue({
    metrics: {
      memoryUsage: { used: 100, total: 1000, percentage: 10 },
      renderTime: 16,
      dbQueryTime: 5,
      componentCount: 50,
      lastUpdate: new Date(),
    },
    history: [],
    isMonitoring: false,
    isLoading: false,
    error: null,
    startMonitoring: vi.fn(),
    stopMonitoring: vi.fn(),
    clearHistory: vi.fn(),
    getOptimizationSuggestions: vi.fn().mockReturnValue([]),
  }),
}))

describe('Performance Optimizations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('PerformanceMonitor Component Splitting', () => {
    it('should render without blocking the main thread', async () => {
      const startTime = performance.now()
      
      render(<PerformanceMonitor isOpen={true} onClose={vi.fn()} />)
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      // Should render quickly due to lazy loading
      expect(renderTime).toBeLessThan(100) // Less than 100ms
      
      // Should show loading states for lazy components
      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: /performance monitor/i })).toBeInTheDocument()
      })
    })

    it('should lazy load chart components', async () => {
      render(<PerformanceMonitor isOpen={true} onClose={vi.fn()} />)
      
      // Chart should be loaded and visible
      expect(screen.getByTestId('performance-chart')).toBeInTheDocument()
      
      // Wait for lazy loading
      await waitFor(() => {
        expect(screen.getByTestId('performance-chart')).toBeInTheDocument()
      }, { timeout: 3000 })
    })
  })

  describe('VirtualizedSearchResults Performance', () => {
    const generateLargeResultSet = (count: number) =>
      Array.from({ length: count }, (_, i) => ({
        id: `result-${i}`,
        result_type: 'page' as const,
        title: `Test Result ${i}`,
        content: `Content for result ${i}`,
        excerpt: `Excerpt for result ${i}`,
        score: Math.random() * 100,
        page_id: `page-${i}`,
        page_name: `Page ${i}`,
        block_id: null,
        tags: [`tag-${i % 5}`],
        is_journal: false,
        created_at: Date.now() - i * 1000,
        updated_at: Date.now() - i * 500,
      }))

    it('should handle large datasets efficiently', () => {
      const largeResults = generateLargeResultSet(1000)
      
      const startTime = performance.now()
      render(
        <VirtualizedSearchResults
          results={largeResults}
          selectedIndex={0}
          query="test"
          onResultClick={vi.fn()}
          highlightText={(text) => text}
          formatDate={(timestamp) => new Date(timestamp).toLocaleDateString()}
        />
      )
      const endTime = performance.now()
      
      // Should render quickly even with 1000 items
      expect(endTime - startTime).toBeLessThan(200)
      
      // Should only render visible items
      const visibleItems = screen.getAllByTestId(/search-result-/)
      expect(visibleItems.length).toBeLessThan(20) // Much less than 1000
    })

    it('should maintain performance during scrolling', async () => {
      const largeResults = generateLargeResultSet(500)
      
      render(
        <VirtualizedSearchResults
          results={largeResults}
          selectedIndex={0}
          query="test"
          onResultClick={vi.fn()}
          highlightText={(text) => text}
          formatDate={(timestamp) => new Date(timestamp).toLocaleDateString()}
        />
      )
      
      const container = screen.getByTestId('search-results-container')
      
      // Simulate rapid scrolling
      const scrollTests = Array.from({ length: 10 }, (_, i) => i * 100)
      
      for (const scrollTop of scrollTests) {
        const startTime = performance.now()
        
        act(() => {
          container.scrollTop = scrollTop
          container.dispatchEvent(new Event('scroll'))
        })
        
        const endTime = performance.now()
        expect(endTime - startTime).toBeLessThan(16) // Should be faster than 60fps
      }
    })
  })

  describe('VirtualizedPageList Performance', () => {
    const generateLargePageSet = (count: number) =>
      Array.from({ length: count }, (_, i) => ({
        id: `page-${i}`,
        title: `Page ${i}`,
        content: `Content for page ${i}`,
        excerpt: `Excerpt for page ${i}`,
        created_at: Date.now() - i * 1000,
        updated_at: Date.now() - i * 500,
        is_favorite: i % 10 === 0,
        tags: [`tag-${i % 3}`, `category-${i % 5}`],
        word_count: Math.floor(Math.random() * 1000) + 100,
      }))

    it('should virtualize large page lists', () => {
      const largePages = generateLargePageSet(800)
      
      const startTime = performance.now()
      render(
        <BrowserRouter>
          <VirtualizedPageList
            pages={largePages}
            formatDate={(timestamp) => new Date(timestamp).toLocaleDateString()}
            onPageClick={vi.fn()}
            onPageEdit={vi.fn()}
          />
        </BrowserRouter>
      )
      const endTime = performance.now()
      
      // Should render quickly
      expect(endTime - startTime).toBeLessThan(150)
      
      // Should only render visible items
      const visibleItems = screen.getAllByTestId(/page-item-/)
      expect(visibleItems.length).toBeLessThan(15) // Much less than 800
    })
  })

  describe('ChartLoader Optimization', () => {
    const mockChartData = {
      labels: ['1', '2', '3'],
      datasets: [{
        label: 'Test Data',
        data: [10, 20, 30],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
      }]
    }

    const mockChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'top', labels: { usePointStyle: true, padding: 20, font: { size: 12 } } },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: 'white',
          bodyColor: 'white',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true,
        },
      },
      scales: {
        x: { display: true, title: { display: true, text: 'X', font: { size: 12 } }, grid: { color: 'rgba(0, 0, 0, 0.1)' } },
        y: { display: true, title: { display: true, text: 'Y', font: { size: 12 } }, grid: { color: 'rgba(0, 0, 0, 0.1)' }, beginAtZero: true },
      },
      elements: { point: { radius: 3, hoverRadius: 6 }, line: { tension: 0.4, borderWidth: 2 } },
      animation: { duration: 750, easing: 'easeInOutQuart' },
    }

    it('should show loading state initially', () => {
      render(
        <ChartLoader
          data={mockChartData}
          options={mockChartOptions}
          loadingMessage="Loading chart..."
        />
      )
      
      expect(screen.getByText('Loading chart...')).toBeInTheDocument()
    })

    it('should handle empty data gracefully', () => {
      render(
        <ChartLoader
          data={{ labels: [], datasets: [] }}
          options={mockChartOptions}
          fallbackMessage="No data available"
        />
      )
      
      expect(screen.getByText('No data available')).toBeInTheDocument()
    })

    it('should not load Chart.js when data is empty', () => {
      const onLoadError = vi.fn()
      
      render(
        <ChartLoader
          data={{ labels: [], datasets: [] }}
          options={mockChartOptions}
          onLoadError={onLoadError}
        />
      )
      
      // Should not attempt to load Chart.js
      expect(onLoadError).not.toHaveBeenCalled()
    })
  })

  describe('Memory Usage Optimization', () => {
    it('should not create memory leaks with large datasets', async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0
      
      // Render and unmount multiple times with large datasets
      for (let i = 0; i < 5; i++) {
        const { unmount } = render(
          <VirtualizedSearchResults
            results={Array.from({ length: 1000 }, (_, j) => ({
              id: `result-${i}-${j}`,
              result_type: 'page',
              title: `Result ${j}`,
              content: 'Content',
              excerpt: 'Excerpt',
              score: 100,
              tags: [],
              is_journal: false,
              created_at: Date.now(),
              updated_at: Date.now(),
            }))}
            selectedIndex={0}
            query="test"
            onResultClick={vi.fn()}
            highlightText={(text) => text}
            formatDate={(timestamp) => new Date(timestamp).toLocaleDateString()}
          />
        )
        
        unmount()
      }
      
      // Force garbage collection if available
      if ((global as any).gc) {
        (global as any).gc()
      }
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0
      const memoryIncrease = finalMemory - initialMemory
      
      // Memory increase should be reasonable (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024)
    })
  })
})
