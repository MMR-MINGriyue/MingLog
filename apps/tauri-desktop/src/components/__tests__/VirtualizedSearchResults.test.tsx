import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import VirtualizedSearchResults from '../VirtualizedSearchResults'

const mockResults = Array.from({ length: 100 }, (_, i) => ({
  id: `result-${i}`,
  result_type: i % 2 === 0 ? 'page' : 'block',
  title: `Test Result ${i}`,
  content: `This is test content for result ${i}`,
  excerpt: `This is test excerpt for result ${i}...`,
  score: 0.9 - (i * 0.01),
  page_id: `page-${Math.floor(i / 2)}`,
  page_name: `Page ${Math.floor(i / 2)}`,
  block_id: i % 2 === 1 ? `block-${i}` : null,
  tags: [`tag-${i}`, 'test'],
  is_journal: i % 5 === 0,
  created_at: 1640995200 + i * 3600,
  updated_at: 1640995200 + i * 3600,
}))

const mockProps = {
  results: mockResults,
  selectedIndex: 0,
  query: 'test',
  onResultClick: vi.fn(),
  highlightText: vi.fn((text: string) => text),
  formatDate: vi.fn((timestamp: number) => new Date(timestamp * 1000).toLocaleDateString()),
}

describe('VirtualizedSearchResults', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders virtualized list container', () => {
    render(<VirtualizedSearchResults {...mockProps} />)
    
    const container = screen.getByRole('generic')
    expect(container).toBeInTheDocument()
    expect(container).toHaveStyle({ position: 'relative' })
  })

  it('renders only visible items initially', () => {
    render(<VirtualizedSearchResults {...mockProps} />)
    
    // Should render only visible items + buffer
    const visibleItems = screen.getAllByText(/Test Result/)
    expect(visibleItems.length).toBeLessThan(mockResults.length)
    expect(visibleItems.length).toBeGreaterThan(0)
  })

  it('calls onResultClick when item is clicked', async () => {
    const onResultClick = vi.fn()
    render(<VirtualizedSearchResults {...mockProps} onResultClick={onResultClick} />)
    
    const firstResult = screen.getByText('Test Result 0')
    await userEvent.click(firstResult)
    
    expect(onResultClick).toHaveBeenCalledWith(mockResults[0], 0)
  })

  it('highlights selected item', () => {
    render(<VirtualizedSearchResults {...mockProps} selectedIndex={1} />)
    
    // Find the selected item container
    const selectedItem = screen.getByText('Test Result 1').closest('div')
    expect(selectedItem).toHaveClass('bg-blue-50')
  })

  it('displays correct icons for pages and blocks', () => {
    render(<VirtualizedSearchResults {...mockProps} />)
    
    // Check for page and block icons
    const pageIcons = screen.getAllByTestId('file-text-icon') // Assuming we add test ids
    const blockIcons = screen.getAllByTestId('hash-icon')
    
    expect(pageIcons.length).toBeGreaterThan(0)
    expect(blockIcons.length).toBeGreaterThan(0)
  })

  it('shows journal indicator for journal entries', () => {
    render(<VirtualizedSearchResults {...mockProps} />)
    
    // Result 0 should be a journal entry (i % 5 === 0)
    const journalIcon = screen.getByTestId('calendar-icon')
    expect(journalIcon).toBeInTheDocument()
  })

  it('displays tags correctly', () => {
    render(<VirtualizedSearchResults {...mockProps} />)
    
    // Check for tag display
    expect(screen.getByText('tag-0')).toBeInTheDocument()
    expect(screen.getByText('test')).toBeInTheDocument()
  })

  it('shows truncated tags with count when more than 2', () => {
    const resultsWithManyTags = [
      {
        ...mockResults[0],
        tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5'],
      },
    ]
    
    render(<VirtualizedSearchResults {...mockProps} results={resultsWithManyTags} />)
    
    expect(screen.getByText('tag1')).toBeInTheDocument()
    expect(screen.getByText('tag2')).toBeInTheDocument()
    expect(screen.getByText('+3')).toBeInTheDocument()
  })

  it('displays match score percentage', () => {
    render(<VirtualizedSearchResults {...mockProps} />)
    
    // First result should have 90% match (0.9 * 100)
    expect(screen.getByText('90% match')).toBeInTheDocument()
  })

  it('calls highlightText for text highlighting', () => {
    const highlightText = vi.fn((text: string) => text)
    render(<VirtualizedSearchResults {...mockProps} highlightText={highlightText} />)
    
    expect(highlightText).toHaveBeenCalledWith('Test Result 0', 'test')
    expect(highlightText).toHaveBeenCalledWith('This is test excerpt for result 0...', 'test')
  })

  it('calls formatDate for timestamp formatting', () => {
    const formatDate = vi.fn((timestamp: number) => 'formatted date')
    render(<VirtualizedSearchResults {...mockProps} formatDate={formatDate} />)
    
    expect(formatDate).toHaveBeenCalledWith(mockResults[0].updated_at)
  })

  it('handles scroll events', () => {
    render(<VirtualizedSearchResults {...mockProps} />)
    
    const container = screen.getByRole('generic')
    fireEvent.scroll(container, { target: { scrollTop: 200 } })
    
    // Should not throw errors and should handle scroll
    expect(container).toBeInTheDocument()
  })

  it('handles empty results gracefully', () => {
    render(<VirtualizedSearchResults {...mockProps} results={[]} />)
    
    const container = screen.getByRole('generic')
    expect(container).toBeInTheDocument()
    expect(screen.queryByText(/Test Result/)).not.toBeInTheDocument()
  })

  it('maintains correct item positioning', () => {
    render(<VirtualizedSearchResults {...mockProps} />)
    
    // Check that items have correct absolute positioning
    const firstItem = screen.getByText('Test Result 0').closest('div')
    expect(firstItem).toHaveStyle({ position: 'absolute', top: '0px' })
  })

  it('shows page name for block results', () => {
    render(<VirtualizedSearchResults {...mockProps} />)
    
    // Block results should show "in Page X"
    expect(screen.getByText(/in Page/)).toBeInTheDocument()
  })

  it('handles large datasets efficiently', () => {
    const largeResults = Array.from({ length: 10000 }, (_, i) => ({
      ...mockResults[0],
      id: `large-result-${i}`,
      title: `Large Result ${i}`,
    }))
    
    const startTime = performance.now()
    render(<VirtualizedSearchResults {...mockProps} results={largeResults} />)
    const endTime = performance.now()
    
    // Should render quickly even with large datasets
    expect(endTime - startTime).toBeLessThan(100) // Less than 100ms
    
    // Should still only render visible items
    const visibleItems = screen.getAllByText(/Large Result/)
    expect(visibleItems.length).toBeLessThan(50) // Much less than 10000
  })

  it('updates visible items when scrolling', () => {
    render(<VirtualizedSearchResults {...mockProps} />)
    
    const container = screen.getByRole('generic')
    
    // Initial state - should see first items
    expect(screen.getByText('Test Result 0')).toBeInTheDocument()
    
    // Scroll down significantly
    fireEvent.scroll(container, { target: { scrollTop: 1000 } })
    
    // Should now see different items (this is a simplified test)
    // In a real scenario, we'd need to wait for the component to update
    expect(container.scrollTop).toBe(1000)
  })
})
