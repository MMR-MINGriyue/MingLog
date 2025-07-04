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

const mockPerformanceData = [
  {
    memoryUsage: { used: 50, total: 100, percentage: 50 },
    renderTime: 16.5,
    dbQueryTime: 5.2,
    componentCount: 45,
    lastUpdate: new Date('2024-01-01T10:00:00Z')
  },
  {
    memoryUsage: { used: 60, total: 100, percentage: 60 },
    renderTime: 22.1,
    dbQueryTime: 8.7,
    componentCount: 52,
    lastUpdate: new Date('2024-01-01T10:00:02Z')
  },
  {
    memoryUsage: { used: 75, total: 100, percentage: 75 },
    renderTime: 45.3,
    dbQueryTime: 12.1,
    componentCount: 68,
    lastUpdate: new Date('2024-01-01T10:00:04Z')
  }
]

describe('VirtualizedPerformanceList', () => {
  const defaultProps = {
    data: mockPerformanceData,
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
      expect(screen.getByText('Performance History (3 entries)')).toBeInTheDocument()
    })

    it('should render empty state when no data provided', () => {
      render(<VirtualizedPerformanceList {...defaultProps} data={[]} />)
      
      expect(screen.getByText('No performance data available')).toBeInTheDocument()
      expect(screen.getByText('Start monitoring to see real-time metrics')).toBeInTheDocument()
    })

    it('should display performance metrics correctly', () => {
      render(<VirtualizedPerformanceList {...defaultProps} />)
      
      // Check for memory usage
      expect(screen.getByText('50.0%')).toBeInTheDocument()
      expect(screen.getByText('(50.0MB)')).toBeInTheDocument()
      
      // Check for render time
      expect(screen.getByText('16.5ms')).toBeInTheDocument()
      
      // Check for database query time
      expect(screen.getByText('5.2ms')).toBeInTheDocument()
      
      // Check for component count
      expect(screen.getByText('45')).toBeInTheDocument()
    })
  })

  describe('Performance Status', () => {
    it('should show good status for normal metrics', () => {
      const goodData = [{
        ...mockPerformanceData[0],
        memoryUsage: { used: 30, total: 100, percentage: 30 },
        renderTime: 10
      }]
      
      render(<VirtualizedPerformanceList {...defaultProps} data={goodData} />)
      expect(screen.getByText('Good')).toBeInTheDocument()
    })

    it('should show warning status for elevated metrics', () => {
      const warningData = [{
        ...mockPerformanceData[0],
        memoryUsage: { used: 70, total: 100, percentage: 70 },
        renderTime: 60
      }]
      
      render(<VirtualizedPerformanceList {...defaultProps} data={warningData} />)
      expect(screen.getByText('Warning')).toBeInTheDocument()
    })

    it('should show critical status for high metrics', () => {
      const criticalData = [{
        ...mockPerformanceData[0],
        memoryUsage: { used: 90, total: 100, percentage: 90 },
        renderTime: 120
      }]
      
      render(<VirtualizedPerformanceList {...defaultProps} data={criticalData} />)
      expect(screen.getByText('Critical')).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('should call onItemClick when item is clicked', async () => {
      const mockOnItemClick = vi.fn()
      render(
        <VirtualizedPerformanceList
          {...defaultProps}
          onItemClick={mockOnItemClick}
        />
      )
      
      const firstItem = screen.getAllByRole('listitem')[0]
      await userEvent.click(firstItem)
      
      expect(mockOnItemClick).toHaveBeenCalledWith(mockPerformanceData[0], 0)
    })

    it('should scroll to latest when Latest button is clicked', async () => {
      render(<VirtualizedPerformanceList {...defaultProps} />)
      
      const latestButton = screen.getByText('Latest')
      await userEvent.click(latestButton)
      
      // Button should be clickable without errors
      expect(latestButton).toBeInTheDocument()
    })

    it('should support keyboard navigation', async () => {
      render(<VirtualizedPerformanceList {...defaultProps} />)
      
      const listContainer = screen.getByRole('list')
      
      // Test Home key
      fireEvent.keyDown(listContainer, { key: 'Home' })
      
      // Test End key
      fireEvent.keyDown(listContainer, { key: 'End' })
      
      // Test PageUp key
      fireEvent.keyDown(listContainer, { key: 'PageUp' })
      
      // Test PageDown key
      fireEvent.keyDown(listContainer, { key: 'PageDown' })
      
      // Should not throw errors
      expect(listContainer).toBeInTheDocument()
    })
  })

  describe('Time Display', () => {
    it('should format recent timestamps correctly', () => {
      const recentData = [{
        ...mockPerformanceData[0],
        lastUpdate: new Date(Date.now() - 30000) // 30 seconds ago
      }]
      
      render(<VirtualizedPerformanceList {...defaultProps} data={recentData} />)
      expect(screen.getByText('30s ago')).toBeInTheDocument()
    })

    it('should format minute timestamps correctly', () => {
      const minuteData = [{
        ...mockPerformanceData[0],
        lastUpdate: new Date(Date.now() - 120000) // 2 minutes ago
      }]
      
      render(<VirtualizedPerformanceList {...defaultProps} data={minuteData} />)
      expect(screen.getByText('2m ago')).toBeInTheDocument()
    })

    it('should format hour timestamps as time', () => {
      const hourData = [{
        ...mockPerformanceData[0],
        lastUpdate: new Date(Date.now() - 7200000) // 2 hours ago
      }]
      
      render(<VirtualizedPerformanceList {...defaultProps} data={hourData} />)
      
      // Should show actual time instead of relative time
      const timeElements = screen.getAllByText(/\d{1,2}:\d{2}:\d{2}/)
      expect(timeElements.length).toBeGreaterThan(0)
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<VirtualizedPerformanceList {...defaultProps} />)
      
      const list = screen.getByRole('list')
      expect(list).toHaveAttribute('aria-label', 'Performance metrics history')
      
      const listItems = screen.getAllByRole('listitem')
      listItems.forEach(item => {
        expect(item).toHaveAttribute('aria-label')
        expect(item).toHaveAttribute('tabIndex', '0')
      })
    })

    it('should be keyboard accessible', () => {
      render(<VirtualizedPerformanceList {...defaultProps} />)
      
      const listItems = screen.getAllByRole('listitem')
      listItems.forEach(item => {
        expect(item).toHaveAttribute('tabIndex', '0')
      })
    })
  })

  describe('Performance Optimization', () => {
    it('should handle large datasets efficiently', () => {
      const largeDataset = Array.from({ length: 1000 }, (_, index) => ({
        ...mockPerformanceData[0],
        lastUpdate: new Date(Date.now() - index * 1000)
      }))
      
      const { container } = render(
        <VirtualizedPerformanceList {...defaultProps} data={largeDataset} />
      )
      
      // Should render without performance issues
      expect(container).toBeInTheDocument()
      expect(screen.getByText('Performance History (1000 entries)')).toBeInTheDocument()
    })

    it('should limit rendered items for performance', () => {
      const largeDataset = Array.from({ length: 100 }, (_, index) => ({
        ...mockPerformanceData[0],
        lastUpdate: new Date(Date.now() - index * 1000)
      }))
      
      render(<VirtualizedPerformanceList {...defaultProps} data={largeDataset} />)
      
      // Should only render visible items (mocked to 10)
      const listItems = screen.getAllByRole('listitem')
      expect(listItems.length).toBeLessThanOrEqual(10)
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid data gracefully', () => {
      const invalidData = [
        {
          memoryUsage: { used: NaN, total: 0, percentage: NaN },
          renderTime: NaN,
          dbQueryTime: NaN,
          componentCount: NaN,
          lastUpdate: new Date('invalid')
        }
      ]
      
      render(<VirtualizedPerformanceList {...defaultProps} data={invalidData} />)
      
      // Should not crash and show some content
      expect(screen.getByTestId('virtualized-list')).toBeInTheDocument()
    })

    it('should handle missing data properties', () => {
      const incompleteData = [
        {
          memoryUsage: { used: 50, total: 100, percentage: 50 },
          renderTime: 16.5,
          // Missing dbQueryTime, componentCount, lastUpdate
        } as any
      ]
      
      render(<VirtualizedPerformanceList {...defaultProps} data={incompleteData} />)
      
      // Should not crash
      expect(screen.getByTestId('virtualized-list')).toBeInTheDocument()
    })
  })
})
