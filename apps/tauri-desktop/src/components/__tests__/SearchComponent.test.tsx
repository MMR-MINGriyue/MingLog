import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter } from 'react-router-dom'
import SearchComponent from '../SearchComponent'
import * as tauriUtils from '../../utils/tauri'

// Mock the tauri utils
vi.mock('../../utils/tauri', () => ({
  searchBlocks: vi.fn(),
  withErrorHandling: vi.fn((fn) => fn()),
}))

// Mock the notification system
vi.mock('../NotificationSystem', () => ({
  useNotifications: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}))

const mockSearchResults = {
  results: [
    {
      id: '1',
      result_type: 'page',
      title: 'Test Page',
      content: 'This is a test page content',
      excerpt: 'This is a test page...',
      score: 0.95,
      page_id: '1',
      page_name: 'Test Page',
      block_id: null,
      tags: ['test', 'page'],
      is_journal: false,
      created_at: 1640995200,
      updated_at: 1640995200,
    },
    {
      id: '2',
      result_type: 'block',
      title: 'Test Block',
      content: 'This is a test block content',
      excerpt: 'This is a test block...',
      score: 0.85,
      page_id: '1',
      page_name: 'Test Page',
      block_id: '2',
      tags: ['test', 'block'],
      is_journal: false,
      created_at: 1640995200,
      updated_at: 1640995200,
    },
  ],
  total_results: 2,
  query_time_ms: 5,
}

const renderSearchComponent = (props = {}) => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onNavigate: vi.fn(),
    ...props,
  }

  return render(
    <BrowserRouter>
      <SearchComponent {...defaultProps} />
    </BrowserRouter>
  )
}

describe('SearchComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders search input when open', () => {
    renderSearchComponent()
    
    expect(screen.getByPlaceholderText(/search pages and blocks/i)).toBeInTheDocument()
  })

  it('does not render when closed', () => {
    renderSearchComponent({ isOpen: false })
    
    expect(screen.queryByPlaceholderText(/search pages and blocks/i)).not.toBeInTheDocument()
  })

  it('calls onClose when escape key is pressed', async () => {
    const onClose = vi.fn()
    renderSearchComponent({ onClose })
    
    const input = screen.getByPlaceholderText(/search pages and blocks/i)
    await userEvent.type(input, '{Escape}')
    
    expect(onClose).toHaveBeenCalled()
  })

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn()
    renderSearchComponent({ onClose })
    
    const closeButton = screen.getByRole('button', { name: /close/i })
    await userEvent.click(closeButton)
    
    expect(onClose).toHaveBeenCalled()
  })

  it('performs search when typing in input', async () => {
    const mockSearchBlocks = vi.mocked(tauriUtils.searchBlocks)
    mockSearchBlocks.mockResolvedValue(mockSearchResults)
    
    renderSearchComponent()
    
    const input = screen.getByPlaceholderText(/search pages and blocks/i)
    await userEvent.type(input, 'test query')
    
    await waitFor(() => {
      expect(mockSearchBlocks).toHaveBeenCalledWith({
        query: 'test query',
        include_pages: true,
        include_blocks: true,
        limit: 20,
      })
    })
  })

  it('displays search results', async () => {
    const mockSearchBlocks = vi.mocked(tauriUtils.searchBlocks)
    mockSearchBlocks.mockResolvedValue(mockSearchResults)
    
    renderSearchComponent()
    
    const input = screen.getByPlaceholderText(/search pages and blocks/i)
    await userEvent.type(input, 'test')
    
    await waitFor(() => {
      expect(screen.getByText('Test Page')).toBeInTheDocument()
      expect(screen.getByText('Test Block')).toBeInTheDocument()
    })
  })

  it('highlights search terms in results', async () => {
    const mockSearchBlocks = vi.mocked(tauriUtils.searchBlocks)
    mockSearchBlocks.mockResolvedValue(mockSearchResults)
    
    renderSearchComponent()
    
    const input = screen.getByPlaceholderText(/search pages and blocks/i)
    await userEvent.type(input, 'test')
    
    await waitFor(() => {
      const highlights = screen.getAllByText('test')
      expect(highlights.length).toBeGreaterThan(0)
    })
  })

  it('navigates to selected result on enter', async () => {
    const mockSearchBlocks = vi.mocked(tauriUtils.searchBlocks)
    mockSearchBlocks.mockResolvedValue(mockSearchResults)
    const onNavigate = vi.fn()
    
    renderSearchComponent({ onNavigate })
    
    const input = screen.getByPlaceholderText(/search pages and blocks/i)
    await userEvent.type(input, 'test')
    
    await waitFor(() => {
      expect(screen.getByText('Test Page')).toBeInTheDocument()
    })
    
    await userEvent.type(input, '{Enter}')
    
    expect(onNavigate).toHaveBeenCalledWith('/page/1')
  })

  it('navigates through results with arrow keys', async () => {
    const mockSearchBlocks = vi.mocked(tauriUtils.searchBlocks)
    mockSearchBlocks.mockResolvedValue(mockSearchResults)
    
    renderSearchComponent()
    
    const input = screen.getByPlaceholderText(/search pages and blocks/i)
    await userEvent.type(input, 'test')
    
    await waitFor(() => {
      expect(screen.getByText('Test Page')).toBeInTheDocument()
    })
    
    // Navigate down
    await userEvent.type(input, '{ArrowDown}')
    
    // Check if second result is selected (visual indication)
    const secondResult = screen.getByText('Test Block').closest('div')
    expect(secondResult).toHaveClass('bg-blue-50')
  })

  it('shows loading state during search', async () => {
    const mockSearchBlocks = vi.mocked(tauriUtils.searchBlocks)
    mockSearchBlocks.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))
    
    renderSearchComponent()
    
    const input = screen.getByPlaceholderText(/search pages and blocks/i)
    await userEvent.type(input, 'test')
    
    expect(screen.getByText(/searching/i)).toBeInTheDocument()
  })

  it('shows no results message when search returns empty', async () => {
    const mockSearchBlocks = vi.mocked(tauriUtils.searchBlocks)
    mockSearchBlocks.mockResolvedValue({ results: [], total_results: 0, query_time_ms: 1 })
    
    renderSearchComponent()
    
    const input = screen.getByPlaceholderText(/search pages and blocks/i)
    await userEvent.type(input, 'nonexistent')
    
    await waitFor(() => {
      expect(screen.getByText(/no results found/i)).toBeInTheDocument()
    })
  })

  it('handles search errors gracefully', async () => {
    const mockSearchBlocks = vi.mocked(tauriUtils.searchBlocks)
    mockSearchBlocks.mockRejectedValue(new Error('Search failed'))
    
    renderSearchComponent()
    
    const input = screen.getByPlaceholderText(/search pages and blocks/i)
    await userEvent.type(input, 'test')
    
    await waitFor(() => {
      expect(screen.getByText(/search failed/i)).toBeInTheDocument()
    })
  })

  it('debounces search input', async () => {
    const mockSearchBlocks = vi.mocked(tauriUtils.searchBlocks)
    mockSearchBlocks.mockResolvedValue(mockSearchResults)
    
    renderSearchComponent()
    
    const input = screen.getByPlaceholderText(/search pages and blocks/i)
    
    // Type multiple characters quickly
    await userEvent.type(input, 'test')
    
    // Should only call search once after debounce
    await waitFor(() => {
      expect(mockSearchBlocks).toHaveBeenCalledTimes(1)
    })
  })
})
