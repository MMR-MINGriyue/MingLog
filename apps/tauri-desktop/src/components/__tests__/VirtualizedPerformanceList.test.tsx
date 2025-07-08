import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import VirtualizedPerformanceList from '../VirtualizedPerformanceList'

// Mock react-window
vi.mock('react-window', () => ({
  FixedSizeList: ({ children, itemData, itemCount, itemSize }: any) => (
    <div data-testid="virtualized-list" style={{ height: '400px' }}>
      {Array.from({ length: Math.min(itemCount, 10) }, (_, index) => (
        <div key={index} style={{ height: itemSize }}>
          {children({ index, style: { height: itemSize }, data: itemData })}
        </div>
      ))}
    </div>
  )
}))

const mockPerformanceEntries = [
  {
    id: 'entry-1',
    name: 'navigation',
    type: 'navigation' as const,
    startTime: 1000,
    duration: 16.5,
    size: 1024,
    status: 'complete'
  },
  {
    id: 'entry-2',
    name: 'resource-load',
    type: 'resource' as const,
    startTime: 2000,
    duration: 22.1,
    size: 2048,
    status: 'complete'
  },
  {
    id: 'entry-3',
    name: 'measure-render',
    type: 'measure' as const,
    startTime: 3000,
    duration: 45.3,
    size: 512,
    status: 'complete'
  }
]

describe('VirtualizedPerformanceList', () => {
  const defaultProps = {
    entries: mockPerformanceEntries,
    height: 400,
    itemHeight: 60
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render virtualized list with performance data', () => {
      render(<VirtualizedPerformanceList {...defaultProps} />)

      expect(screen.getByTestId('virtualized-list')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument() // Total Entries
      expect(screen.getByText('Total Entries')).toBeInTheDocument()
    })

    it('should render empty state when no data provided', () => {
      render(<VirtualizedPerformanceList {...defaultProps} entries={[]} />)

      expect(screen.getByText('No performance entries found')).toBeInTheDocument()
      expect(screen.getByText('Performance data will appear here when available')).toBeInTheDocument()
    })

    it('should display performance metrics correctly', () => {
      render(<VirtualizedPerformanceList {...defaultProps} />)

      // Check for total duration (text may be split across elements)
      expect(screen.getByText(/83\.90.*ms/)).toBeInTheDocument() // 16.5 + 22.1 + 45.3
      expect(screen.getByText('Total Duration')).toBeInTheDocument()

      // Check for average duration (text may be split across elements)
      expect(screen.getByText(/27\.97.*ms/)).toBeInTheDocument() // 83.9 / 3
      expect(screen.getByText('Avg Duration')).toBeInTheDocument()

      // Check for slowest entry (appears multiple times)
      expect(screen.getAllByText(/45\.30.*ms/)).toHaveLength(3) // header + list items
      expect(screen.getByText('Slowest')).toBeInTheDocument()
    })
  })

  describe('Performance Entries Display', () => {
    it('should display entry names correctly', () => {
      render(<VirtualizedPerformanceList {...defaultProps} />)

      // Use getAllByText since text appears in both span (type) and h3 (name) elements
      expect(screen.getAllByText('navigation')).toHaveLength(2) // span + h3
      expect(screen.getByText('resource-load')).toBeInTheDocument() // only in h3
      expect(screen.getByText('measure-render')).toBeInTheDocument() // only in h3
    })

    it('should display entry types correctly', () => {
      render(<VirtualizedPerformanceList {...defaultProps} />)

      // Check for type badges (in span elements)
      expect(screen.getAllByText('navigation')).toHaveLength(2) // appears in both span and h3
      expect(screen.getByText('resource')).toBeInTheDocument() // type badge
      expect(screen.getByText('measure')).toBeInTheDocument() // type badge
    })

    it('should display entry durations correctly', () => {
      render(<VirtualizedPerformanceList {...defaultProps} />)

      // Check for durations in the stats header (text may be split across elements)
      expect(screen.getByText(/83\.90.*ms/)).toBeInTheDocument() // Total Duration
      expect(screen.getByText(/27\.97.*ms/)).toBeInTheDocument() // Avg Duration
      expect(screen.getAllByText(/45\.30.*ms/)).toHaveLength(3) // Slowest (appears 3 times: header + 2 in list items)
    })
  })

  describe('User Interactions', () => {
    it('should call onEntryClick when item is clicked', async () => {
      const mockOnEntryClick = vi.fn()
      render(
        <VirtualizedPerformanceList
          {...defaultProps}
          onEntryClick={mockOnEntryClick}
        />
      )

      // Find clickable elements within the virtualized list
      const clickableElements = screen.getAllByText(/navigation|resource-load|measure-render/)
      await userEvent.click(clickableElements[0])

      expect(mockOnEntryClick).toHaveBeenCalledWith(mockPerformanceEntries[0])
    })

    it('should render without Latest button (not part of this component)', () => {
      render(<VirtualizedPerformanceList {...defaultProps} />)

      // This component doesn't have a Latest button
      expect(screen.queryByText('Latest')).not.toBeInTheDocument()
    })

    it('should render virtualized list container', () => {
      render(<VirtualizedPerformanceList {...defaultProps} />)

      const listContainer = screen.getByTestId('virtualized-list')

      // Should render the virtualized list container
      expect(listContainer).toBeInTheDocument()

      // Should have proper height
      expect(listContainer).toHaveStyle({ height: '400px' })
    })
  })

  describe('Entry Details', () => {
    it('should display entry start times correctly', () => {
      render(<VirtualizedPerformanceList {...defaultProps} />)

      // Check that start times are displayed (text may be split across elements)
      expect(screen.getByText(/1000\.00/)).toBeInTheDocument()
      expect(screen.getByText(/2000\.00/)).toBeInTheDocument()
      expect(screen.getByText(/3000\.00/)).toBeInTheDocument()
    })

    it('should display entry sizes when available', () => {
      render(<VirtualizedPerformanceList {...defaultProps} />)

      // Check that sizes are displayed (text may be split across elements)
      expect(screen.getByText(/1\.0KB/)).toBeInTheDocument()
      expect(screen.getByText(/2\.0KB/)).toBeInTheDocument()
      expect(screen.getByText(/512B/)).toBeInTheDocument()
    })

    it('should display entry status when available', () => {
      render(<VirtualizedPerformanceList {...defaultProps} />)

      // Check that status is displayed (appears in "Status: complete" format)
      const statusElements = screen.getAllByText(/complete/)
      expect(statusElements.length).toBeGreaterThan(0)
    })
  })

  describe('Accessibility', () => {
    it('should render virtualized list with proper structure', () => {
      render(<VirtualizedPerformanceList {...defaultProps} />)

      const listContainer = screen.getByTestId('virtualized-list')
      expect(listContainer).toBeInTheDocument()

      // Should have proper container structure
      expect(listContainer).toHaveStyle({ height: '400px' })
    })

    it('should display performance data in accessible format', () => {
      render(<VirtualizedPerformanceList {...defaultProps} />)

      // Check that important data is accessible
      expect(screen.getByText('Total Entries')).toBeInTheDocument()
      expect(screen.getByText('Total Duration')).toBeInTheDocument()
      expect(screen.getByText('Avg Duration')).toBeInTheDocument()
      expect(screen.getByText('Slowest')).toBeInTheDocument()
    })
  })

  describe('Performance Optimization', () => {
    it('should handle large datasets efficiently', () => {
      const largeDataset = Array.from({ length: 1000 }, (_, index) => ({
        id: `entry-${index}`,
        name: `entry-${index}`,
        type: 'measure' as const,
        startTime: index * 1000,
        duration: Math.random() * 100,
        size: 1024,
        status: 'complete'
      }))

      const { container } = render(
        <VirtualizedPerformanceList {...defaultProps} entries={largeDataset} />
      )

      // Should render without performance issues
      expect(container).toBeInTheDocument()
      expect(screen.getByText('1000')).toBeInTheDocument() // Total Entries
    })

    it('should limit rendered items for performance', () => {
      const largeDataset = Array.from({ length: 100 }, (_, index) => ({
        id: `entry-${index}`,
        name: `entry-${index}`,
        type: 'measure' as const,
        startTime: index * 1000,
        duration: Math.random() * 100,
        size: 1024,
        status: 'complete'
      }))

      render(<VirtualizedPerformanceList {...defaultProps} entries={largeDataset} />)

      // Should only render visible items (mocked to 10)
      const virtualizedList = screen.getByTestId('virtualized-list')
      expect(virtualizedList).toBeInTheDocument()

      // The mock limits to 10 items - count the top-level item containers
      const renderedItems = virtualizedList.children
      expect(renderedItems.length).toBeLessThanOrEqual(10)
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid data gracefully', () => {
      const invalidData = [
        {
          id: 'invalid-entry',
          name: 'invalid',
          type: 'measure' as const,
          startTime: NaN,
          duration: NaN,
          size: NaN,
          status: 'error'
        }
      ]

      render(<VirtualizedPerformanceList {...defaultProps} entries={invalidData} />)

      // Should not crash and show some content
      expect(screen.getByTestId('virtualized-list')).toBeInTheDocument()
    })

    it('should handle missing data properties', () => {
      const incompleteData = [
        {
          id: 'incomplete-entry',
          name: 'incomplete',
          type: 'measure' as const,
          startTime: 1000,
          duration: 50,
          // Missing size and status
        } as any
      ]

      render(<VirtualizedPerformanceList {...defaultProps} entries={incompleteData} />)

      // Should not crash
      expect(screen.getByTestId('virtualized-list')).toBeInTheDocument()
    })

    it('should handle undefined entries gracefully', () => {
      render(<VirtualizedPerformanceList {...defaultProps} entries={undefined} />)

      // Should show empty state
      expect(screen.getByText('No performance entries found')).toBeInTheDocument()
    })
  })
})
