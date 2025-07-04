import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import SearchComponent from '../../components/SearchComponent'
import PerformanceMonitor from '../../components/PerformanceMonitor'
import * as tauriUtils from '../../utils/tauri'

// Mock the tauri utilities
vi.mock('../../utils/tauri', () => ({
  searchBlocks: vi.fn(),
  withErrorHandling: vi.fn(async (fn, errorMessage) => {
    try {
      return await fn()
    } catch (error) {
      console.error(errorMessage, error)
      return null
    }
  }),
}))

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}))

// Mock notification system
vi.mock('../../components/NotificationSystem', () => ({
  useNotifications: () => ({
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  }),
}))

// Mock Tauri API for performance monitoring
vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: vi.fn(),
}))

describe('Search and Performance Integration Tests', () => {
  const mockSearchBlocks = vi.mocked(tauriUtils.searchBlocks)
  let mockInvoke: any
  
  beforeEach(async () => {
    vi.clearAllMocks()

    // Get mock reference
    mockInvoke = vi.mocked((await import('@tauri-apps/api/tauri')).invoke)

    // Setup default mocks
    mockInvoke.mockImplementation((command: string) => {
      switch (command) {
        case 'get_memory_info':
          return Promise.resolve({ used: 100 * 1024 * 1024, total: 1024 * 1024 * 1024 })
        case 'measure_db_performance':
          return Promise.resolve({ query_time: 25 })
        case 'get_system_info':
          return Promise.resolve({
            memory: { used: 100, total: 1024, percentage: 10 },
            cpu: { usage: 15, cores: 8 },
            disk: { read_bytes: 1000, write_bytes: 500 }
          })
        default:
          return Promise.resolve({})
      }
    })
  })

  const renderSearchWithPerformanceMonitor = () => {
    const SearchWithMonitor = () => {
      const [searchOpen, setSearchOpen] = React.useState(true)
      const [monitorOpen, setMonitorOpen] = React.useState(false)
      
      return (
        <div>
          <SearchComponent
            isOpen={searchOpen}
            onClose={() => setSearchOpen(false)}
            initialQuery=""
          />
          <button
            type="button"
            onClick={() => setMonitorOpen(true)}
            data-testid="open-performance-monitor"
          >
            Open Performance Monitor
          </button>
          <PerformanceMonitor
            isOpen={monitorOpen}
            onClose={() => setMonitorOpen(false)}
          />
        </div>
      )
    }
    
    return render(<SearchWithMonitor />)
  }

  it('should integrate search functionality with performance monitoring', async () => {
    // Mock search results
    const searchResults = [
      {
        id: 'page-1',
        result_type: 'page' as const,
        title: 'Integration Test Page',
        content: 'This is a test page for integration testing',
        excerpt: 'Integration test content...',
        score: 95,
        tags: ['integration', 'test'],
        is_journal: false,
        created_at: Date.now(),
        updated_at: Date.now(),
        block_id: null,
      },
      {
        id: 'block-1',
        result_type: 'block' as const,
        title: 'Test Block',
        content: 'This is a test block',
        excerpt: 'Test block content...',
        score: 85,
        page_id: 'page-1',
        page_name: 'Integration Test Page',
        block_id: 'block-1',
        tags: ['block', 'test'],
        is_journal: false,
        created_at: Date.now(),
        updated_at: Date.now(),
      }
    ]

    mockSearchBlocks.mockResolvedValue({
      results: searchResults,
      total: 2,
      query: 'integration test',
    })

    renderSearchWithPerformanceMonitor()

    // Perform search
    const searchInput = screen.getByPlaceholderText(/search pages and blocks/i)
    await userEvent.type(searchInput, 'integration test')

    // Wait for search results
    await waitFor(() => {
      expect(screen.getByText('Integration Test Page')).toBeInTheDocument()
      expect(screen.getByText('Test Block')).toBeInTheDocument()
    })

    // Verify search performance metrics
    await waitFor(() => {
      expect(screen.getByText(/2 results found in \d+ms/)).toBeInTheDocument()
    })

    // Open performance monitor
    const monitorButton = screen.getByTestId('open-performance-monitor')
    await userEvent.click(monitorButton)

    // Wait for performance monitor to load
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /performance monitor/i })).toBeInTheDocument()
    })

    // Verify performance monitoring is working
    expect(mockInvoke).toHaveBeenCalledWith('get_system_info')
    expect(mockInvoke).toHaveBeenCalledWith('measure_db_performance')
  })

  it('should handle search performance under load with monitoring', async () => {
    // Mock multiple rapid searches
    let searchCount = 0
    mockSearchBlocks.mockImplementation(() => {
      searchCount++
      return Promise.resolve({
        results: [],
        total: 0,
        query: 'test',
      })
    })

    renderSearchWithPerformanceMonitor()

    const searchInput = screen.getByPlaceholderText(/search pages and blocks/i)

    // Perform rapid searches
    const searchQueries = ['a', 'ab', 'abc', 'abcd', 'abcde']
    
    for (const query of searchQueries) {
      await userEvent.clear(searchInput)
      await userEvent.type(searchInput, query)
      await new Promise(resolve => setTimeout(resolve, 100)) // Small delay between searches
    }

    // Wait for all searches to complete
    await new Promise(resolve => setTimeout(resolve, 500))

    // Should have debounced to fewer actual search calls
    expect(mockSearchBlocks).toHaveBeenCalledTimes(1) // Due to debouncing

    // Open performance monitor to check metrics
    const monitorButton = screen.getByTestId('open-performance-monitor')
    await userEvent.click(monitorButton)

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /performance monitor/i })).toBeInTheDocument()
    })

    // Performance monitor should be collecting metrics
    expect(mockInvoke).toHaveBeenCalledWith('get_system_info')
  })

  it('should maintain search responsiveness during performance monitoring', async () => {
    mockSearchBlocks.mockResolvedValue({
      results: [
        {
          id: 'responsive-test',
          result_type: 'page' as const,
          title: 'Responsive Test',
          content: 'Testing responsiveness',
          excerpt: 'Responsive test...',
          score: 90,
          tags: ['responsive'],
          is_journal: false,
          created_at: Date.now(),
          updated_at: Date.now(),
          block_id: null,
        }
      ],
      total: 1,
      query: 'responsive',
    })

    renderSearchWithPerformanceMonitor()

    // Start performance monitoring first
    const monitorButton = screen.getByTestId('open-performance-monitor')
    await userEvent.click(monitorButton)

    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /performance monitor/i })).toBeInTheDocument()
    })

    // Now perform search while monitoring is active
    const searchInput = screen.getByPlaceholderText(/search pages and blocks/i)
    const startTime = performance.now()
    
    await userEvent.type(searchInput, 'responsive')

    // Wait for search results
    await waitFor(() => {
      expect(screen.getByText('Responsive Test')).toBeInTheDocument()
    })

    const endTime = performance.now()
    const searchTime = endTime - startTime

    // Search should remain fast even with monitoring active
    expect(searchTime).toBeLessThan(1000) // Should complete within 1 second

    // Both search and monitoring should be functional
    expect(screen.getByText('Responsive Test')).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: /performance monitor/i })).toBeInTheDocument()
  })

  it('should handle error scenarios gracefully in integrated environment', async () => {
    // Mock search error
    mockSearchBlocks.mockRejectedValue(new Error('Search service unavailable'))

    // Mock performance monitoring error
    mockInvoke.mockImplementation((command: string) => {
      if (command === 'get_memory_info') {
        return Promise.reject(new Error('Memory info unavailable'))
      }
      return Promise.resolve({})
    })

    renderSearchWithPerformanceMonitor()

    // Attempt search that will fail
    const searchInput = screen.getByPlaceholderText(/search pages and blocks/i)
    await userEvent.type(searchInput, 'error test')

    // Search should handle error gracefully (no results shown)
    await new Promise(resolve => setTimeout(resolve, 500))

    // Wait for any pending promises to settle
    await new Promise(resolve => setTimeout(resolve, 100))
    
    // Should not crash the application
    expect(searchInput).toBeInTheDocument()

    // Open performance monitor
    const monitorButton = screen.getByTestId('open-performance-monitor')
    await userEvent.click(monitorButton)

    // Performance monitor should handle errors gracefully
    await waitFor(() => {
      expect(screen.getByRole('dialog', { name: /performance monitor/i })).toBeInTheDocument()
    })

    // Application should remain functional despite errors
    expect(screen.getByPlaceholderText(/search pages and blocks/i)).toBeInTheDocument()
  })
})
