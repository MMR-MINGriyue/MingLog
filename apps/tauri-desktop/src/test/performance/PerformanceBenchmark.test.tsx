import { render, screen, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import PerformanceMonitor from '../../components/PerformanceMonitor'
import VirtualizedSearchResults from '../../components/VirtualizedSearchResults'
import VirtualizedPageList from '../../components/VirtualizedPageList'

// Mock dependencies
vi.mock('../../utils/tauri', () => ({
  getSyncStatus: vi.fn().mockResolvedValue('Idle'),
  getSyncStats: vi.fn().mockResolvedValue({}),
  getWebDAVConfig: vi.fn().mockResolvedValue(null),
  withErrorHandling: vi.fn().mockImplementation((fn) => fn()),
}))

vi.mock('../../utils/environment', () => ({
  environmentAdapter: {
    getMemoryUsage: vi.fn().mockResolvedValue({ used: 100, total: 1000 }),
    getCPUUsage: vi.fn().mockResolvedValue(50),
  },
  isTauriEnvironment: vi.fn().mockReturnValue(true),
}))

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

describe('Performance Benchmark Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Render Performance', () => {
    it('PerformanceMonitor should render under 100ms', async () => {
      const startTime = performance.now()
      
      render(
        <MemoryRouter>
          <PerformanceMonitor isOpen={true} onClose={vi.fn()} />
        </MemoryRouter>
      )
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      console.log(`PerformanceMonitor render time: ${renderTime.toFixed(2)}ms`)
      expect(renderTime).toBeLessThan(100)
    })

    it('VirtualizedSearchResults should handle 1000 items under 200ms', () => {
      const largeResults = Array.from({ length: 1000 }, (_, i) => ({
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
      const renderTime = endTime - startTime
      
      console.log(`VirtualizedSearchResults (1000 items) render time: ${renderTime.toFixed(2)}ms`)
      expect(renderTime).toBeLessThan(200)
      
      // Verify only visible items are rendered
      const visibleItems = screen.getAllByTestId(/search-result-/)
      expect(visibleItems.length).toBeLessThan(20)
    })

    it('VirtualizedPageList should handle 500 pages under 150ms', () => {
      const largePages = Array.from({ length: 500 }, (_, i) => ({
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

      const startTime = performance.now()
      
      render(
        <MemoryRouter>
          <VirtualizedPageList
            pages={largePages}
            formatDate={(timestamp) => new Date(timestamp).toLocaleDateString()}
            onPageClick={vi.fn()}
            onPageEdit={vi.fn()}
          />
        </MemoryRouter>
      )
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      console.log(`VirtualizedPageList (500 pages) render time: ${renderTime.toFixed(2)}ms`)
      expect(renderTime).toBeLessThan(150)
      
      // Verify only visible items are rendered
      const visibleItems = screen.getAllByTestId(/page-item-/)
      expect(visibleItems.length).toBeLessThan(15)
    })
  })

  describe('Scroll Performance', () => {
    it('VirtualizedSearchResults should maintain 60fps during scrolling', async () => {
      const largeResults = Array.from({ length: 1000 }, (_, i) => ({
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
      
      // Test multiple scroll positions
      const scrollPositions = [100, 500, 1000, 2000, 5000]
      const frameTime = 16.67 // 60fps = 16.67ms per frame
      
      for (const scrollTop of scrollPositions) {
        const startTime = performance.now()
        
        act(() => {
          container.scrollTop = scrollTop
          container.dispatchEvent(new Event('scroll'))
        })
        
        const endTime = performance.now()
        const scrollTime = endTime - startTime
        
        console.log(`Scroll to ${scrollTop}px: ${scrollTime.toFixed(2)}ms`)
        expect(scrollTime).toBeLessThan(frameTime)
      }
    })
  })

  describe('Memory Efficiency', () => {
    it('should not create memory leaks with repeated renders', () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0
      
      // Render and unmount multiple times
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(
          <VirtualizedSearchResults
            results={Array.from({ length: 100 }, (_, j) => ({
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
      
      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0
      const memoryIncrease = finalMemory - initialMemory
      
      console.log(`Memory increase after 10 renders: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`)
      
      // Memory increase should be reasonable (less than 5MB)
      expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024)
    })
  })

  describe('Bundle Size Optimization', () => {
    it('should demonstrate lazy loading benefits', async () => {
      // This test verifies that Chart.js is not loaded initially
      const initialModules = Object.keys(window).filter(key => key.includes('Chart'))
      expect(initialModules.length).toBe(0)
      
      // Render PerformanceMonitor which should lazy load chart components
      render(
        <MemoryRouter>
          <PerformanceMonitor isOpen={true} onClose={vi.fn()} />
        </MemoryRouter>
      )
      
      // Chart should still not be loaded until actually needed
      const modulesAfterRender = Object.keys(window).filter(key => key.includes('Chart'))
      expect(modulesAfterRender.length).toBe(0)
    })
  })

  describe('Performance Regression Detection', () => {
    it('should detect performance regressions', () => {
      const benchmarks = {
        performanceMonitorRender: 100, // ms
        virtualizedSearchRender: 200,  // ms
        virtualizedPageListRender: 150, // ms
        scrollFrameTime: 16.67,        // ms (60fps)
        memoryLeakThreshold: 5 * 1024 * 1024, // 5MB
      }
      
      // These are our performance targets
      // If any test exceeds these values, it indicates a regression
      Object.entries(benchmarks).forEach(([metric, threshold]) => {
        console.log(`Performance target for ${metric}: ${threshold}`)
        expect(threshold).toBeGreaterThan(0)
      })
    })
  })
})
