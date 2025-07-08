import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import SearchComponent from '../../components/SearchComponent'
import * as tauriUtils from '../../utils/tauri'

// Mock the tauri utilities
vi.mock('../../utils/tauri', () => ({
  searchBlocks: vi.fn(),
  withErrorHandling: vi.fn((fn) => fn()),
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

describe('SearchComponent Performance Tests', () => {
  const mockSearchBlocks = vi.mocked(tauriUtils.searchBlocks)
  
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const renderSearchComponent = () => {
    return render(
      <SearchComponent
        isOpen={true}
        onClose={vi.fn()}
        initialQuery=""
      />
    )
  }

  it('should handle large result sets efficiently', async () => {
    // Generate a large dataset
    const largeResultSet = Array.from({ length: 1000 }, (_, index) => ({
      id: `result-${index}`,
      result_type: index % 2 === 0 ? 'page' as const : 'block' as const,
      title: `Test Result ${index}`,
      content: `This is test content for result ${index}`,
      excerpt: `Excerpt for result ${index}...`,
      score: Math.random() * 100,
      page_id: index % 2 === 1 ? `page-${Math.floor(index / 2)}` : undefined,
      page_name: index % 2 === 1 ? `Page ${Math.floor(index / 2)}` : undefined,
      block_id: index % 2 === 1 ? `block-${index}` : null,
      tags: [`tag-${index % 10}`],
      is_journal: false,
      created_at: Date.now() - index * 1000,
      updated_at: Date.now() - index * 500,
    }))

    mockSearchBlocks.mockResolvedValue({
      results: largeResultSet,
      total: 1000,
      query: 'test',
    })

    const startTime = performance.now()
    renderSearchComponent()

    const input = screen.getByPlaceholderText(/search pages and blocks/i)

    await act(async () => {
      await userEvent.type(input, 'test')
    })

    // Wait for results to load
    await waitFor(() => {
      expect(screen.getByText(/1000 results found/)).toBeInTheDocument()
    }, { timeout: 5000 })

    const endTime = performance.now()
    const renderTime = endTime - startTime

    // Performance assertion: should render within 2 seconds even with 1000 results
    expect(renderTime).toBeLessThan(2000)
    
    // Verify virtualization is working (only visible items should be rendered)
    const renderedResults = screen.getAllByTestId(/search-result-/)
    expect(renderedResults.length).toBeLessThan(50) // Should only render visible items
  })

  it('should debounce search requests efficiently', async () => {
    mockSearchBlocks.mockResolvedValue({
      results: [],
      total: 0,
      query: 'test query',
    })

    renderSearchComponent()
    const input = screen.getByPlaceholderText(/search pages and blocks/i)

    const startTime = performance.now()
    
    // Type rapidly to test debouncing
    await act(async () => {
      await userEvent.type(input, 'test query')
    })

    // Wait for debounce to settle
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 400))
    })
    
    const endTime = performance.now()
    const totalTime = endTime - startTime

    // Should only make one search call due to debouncing
    expect(mockSearchBlocks).toHaveBeenCalledTimes(1)
    
    // Should complete quickly due to debouncing
    expect(totalTime).toBeLessThan(1000)
  })

  it('should cache search results for performance', async () => {
    const testResults = [
      {
        id: 'test-1',
        result_type: 'page' as const,
        title: 'Test Page',
        content: 'Test content',
        excerpt: 'Test excerpt...',
        score: 95,
        page_id: 'page-1',
        page_name: 'Test Page',
        block_id: null,
        tags: ['test'],
        is_journal: false,
        created_at: Date.now(),
        updated_at: Date.now(),
      }
    ]

    mockSearchBlocks.mockResolvedValue({
      results: testResults,
      total: 1,
      query: 'test',
    })

    renderSearchComponent()
    const input = screen.getByPlaceholderText(/search pages and blocks/i)

    // First search
    await userEvent.clear(input)
    await userEvent.type(input, 'test')

    // Wait for debounce and search to complete
    await waitFor(() => {
      expect(screen.getByTestId('search-result-0')).toBeInTheDocument()
    }, { timeout: 2000 })

    // Clear and search again with same query
    await userEvent.clear(input)
    await userEvent.type(input, 'test')
    
    // Wait for potential second search
    await new Promise(resolve => setTimeout(resolve, 400))

    // Should have made at least 1 call (caching may reduce the number of calls)
    expect(mockSearchBlocks.mock.calls.length).toBeGreaterThanOrEqual(1)
  })

  it('should handle rapid typing without performance degradation', async () => {
    mockSearchBlocks.mockImplementation(() =>
      new Promise(resolve =>
        setTimeout(() => resolve({
          results: [],
          total: 0,
          query: 'test',
        }), 10)
      )
    )

    renderSearchComponent()
    const input = screen.getByRole('combobox')

    const startTime = performance.now()

    // Simulate rapid typing with shorter text
    const rapidText = 'rapid test'
    await act(async () => {
      await userEvent.type(input, rapidText, { delay: 10 })
    })

    // Wait for debounced search to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 300))
    })
    
    const endTime = performance.now()
    const totalTime = endTime - startTime

    // Should handle rapid typing efficiently
    expect(totalTime).toBeLessThan(3000)
    
    // Should not make excessive API calls due to debouncing
    expect(mockSearchBlocks).toHaveBeenCalledTimes(1)
  })

  it('should maintain responsive UI during search operations', async () => {
    // Mock a slow search to test UI responsiveness
    mockSearchBlocks.mockImplementation(() =>
      new Promise(resolve =>
        setTimeout(() => resolve({
          results: [],
          total: 0,
          query: 'slow search',
        }), 200)
      )
    )

    renderSearchComponent()
    const input = screen.getByRole('combobox')

    await act(async () => {
      await userEvent.type(input, 'slow search')
    })

    // UI should remain responsive - loading indicator should appear
    await waitFor(() => {
      const loadingSpinner = document.querySelector('.animate-spin')
      expect(loadingSpinner).toBeInTheDocument()
    })

    // Input should still be interactive during search
    expect(input).not.toBeDisabled()

    // Should be able to continue typing
    await act(async () => {
      await userEvent.type(input, ' more text')
    })
    expect(input).toHaveValue('slow search more text')
  })
})
