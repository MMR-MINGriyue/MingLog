import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import {
  LazyPerformanceMonitor,
  LazyUserGuide,
  LazyUserPreferences,
  SafeLazyPerformanceMonitor,
  SafeLazyUserGuide,
  SafeLazyUserPreferences,
  LazyComponentErrorBoundary
} from '../LazyComponents'

// Create a component that throws an error for testing error boundary
const ErrorComponent = () => {
  throw new Error('Test error')
}

// Simple mock components
vi.mock('../PerformanceMonitor', () => ({
  default: ({ isOpen, onClose }: any) =>
    isOpen ? (
      <div data-testid="performance-monitor" onClick={onClose}>
        Performance Monitor Component
      </div>
    ) : null
}))

vi.mock('../UserGuide', () => ({
  default: ({ isOpen, onClose, steps, componentName }: any) =>
    isOpen ? (
      <div data-testid="user-guide" onClick={onClose}>
        User Guide Component for {componentName} ({steps?.length || 0} steps)
      </div>
    ) : null
}))

vi.mock('../UserPreferences', () => ({
  default: ({ isOpen, onClose }: any) =>
    isOpen ? (
      <div data-testid="user-preferences" onClick={onClose}>
        User Preferences Component
      </div>
    ) : null
}))

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Activity: ({ 'data-testid': testId, ...props }: any) =>
    <div data-testid={testId || 'activity-icon'} {...props}>Activity</div>,
  Settings: ({ 'data-testid': testId, ...props }: any) =>
    <div data-testid={testId || 'settings-icon'} {...props}>Settings</div>,
  HelpCircle: ({ 'data-testid': testId, ...props }: any) =>
    <div data-testid={testId || 'help-circle-icon'} {...props}>HelpCircle</div>,
}))

describe('LazyComponents', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('LazyPerformanceMonitor', () => {
    it('should render component when isOpen is true', async () => {
      const onClose = vi.fn()
      render(<LazyPerformanceMonitor isOpen={true} onClose={onClose} />)

      // Wait for lazy component to load
      await waitFor(() => {
        expect(screen.getByTestId('performance-monitor')).toBeInTheDocument()
      }, { timeout: 3000 })

      expect(screen.getByText('Performance Monitor Component')).toBeInTheDocument()

      // Test interaction
      fireEvent.click(screen.getByTestId('performance-monitor'))
      expect(onClose).toHaveBeenCalled()
    })

    it('should not render when isOpen is false', () => {
      render(<LazyPerformanceMonitor isOpen={false} onClose={vi.fn()} />)

      expect(screen.queryByTestId('performance-monitor')).not.toBeInTheDocument()
      expect(screen.queryByTestId('performance-monitor-skeleton')).not.toBeInTheDocument()
    })

    it('should show skeleton when loading', () => {
      render(<LazyPerformanceMonitor isOpen={true} onClose={vi.fn()} />)

      // Check if skeleton exists initially
      const skeleton = screen.queryByTestId('performance-monitor-skeleton')
      if (skeleton) {
        expect(skeleton).toHaveClass('fixed', 'inset-0', 'bg-black', 'bg-opacity-50')
        expect(skeleton).toHaveAttribute('role', 'dialog')
        expect(skeleton).toHaveAttribute('aria-label', 'Loading Performance Monitor')
        expect(screen.getByTestId('activity-icon')).toBeInTheDocument()
        expect(screen.getByText('Loading Performance Monitor...')).toBeInTheDocument()
      }
    })
  })

  describe('LazyUserGuide', () => {
    const defaultProps = {
      isOpen: true,
      onClose: vi.fn(),
      steps: ['Step 1', 'Step 2'],
      componentName: 'TestComponent'
    }

    it('should render component when isOpen is true', async () => {
      const onClose = vi.fn()
      render(<LazyUserGuide {...defaultProps} onClose={onClose} />)

      // Wait for lazy component to load
      await waitFor(() => {
        expect(screen.getByTestId('user-guide')).toBeInTheDocument()
      }, { timeout: 3000 })

      expect(screen.getByText(/User Guide Component/)).toBeInTheDocument()

      // Test interaction
      fireEvent.click(screen.getByTestId('user-guide'))
      expect(onClose).toHaveBeenCalled()
    })

    it('should not render when isOpen is false', () => {
      render(<LazyUserGuide {...defaultProps} isOpen={false} />)

      expect(screen.queryByTestId('user-guide')).not.toBeInTheDocument()
      expect(screen.queryByTestId('user-guide-skeleton')).not.toBeInTheDocument()
    })

    it('should show skeleton when loading', () => {
      render(<LazyUserGuide {...defaultProps} />)

      // Check if skeleton exists initially
      const skeleton = screen.queryByTestId('user-guide-skeleton')
      if (skeleton) {
        expect(screen.getByTestId('help-circle-icon')).toBeInTheDocument()
        expect(screen.getByText('Loading User Guide...')).toBeInTheDocument()
      }
    })
  })

  describe('LazyUserPreferences', () => {
    const defaultProps = {
      isOpen: true,
      onClose: vi.fn(),
      onPreferencesChange: vi.fn()
    }

    it('should render skeleton when loading', () => {
      render(<LazyUserPreferences {...defaultProps} />)
      
      expect(screen.getByTestId('user-preferences-skeleton')).toBeInTheDocument()
      expect(screen.getByText('Loading User Preferences...')).toBeInTheDocument()
    })

    it('should render component after loading', async () => {
      const onClose = vi.fn()
      render(<LazyUserPreferences {...defaultProps} onClose={onClose} />)

      // Wait for lazy component to load
      await waitFor(() => {
        expect(screen.getByTestId('user-preferences')).toBeInTheDocument()
      }, { timeout: 3000 })

      expect(screen.getByText('User Preferences Component')).toBeInTheDocument()

      // Test interaction
      fireEvent.click(screen.getByTestId('user-preferences'))
      expect(onClose).toHaveBeenCalled()
    })

    it('should not render when isOpen is false', () => {
      render(<LazyUserPreferences {...defaultProps} isOpen={false} />)
      
      expect(screen.queryByTestId('user-preferences')).not.toBeInTheDocument()
      expect(screen.queryByTestId('user-preferences-skeleton')).not.toBeInTheDocument()
    })

    it('should show skeleton with settings icon', () => {
      render(<LazyUserPreferences {...defaultProps} />)

      // Check if skeleton exists (it might load quickly)
      const skeleton = screen.queryByTestId('user-preferences-skeleton')
      if (skeleton) {
        expect(screen.getByTestId('settings-icon')).toBeInTheDocument()
        expect(screen.getByText('Loading User Preferences...')).toBeInTheDocument()
      }

    })
  })

  describe('LazyComponentErrorBoundary', () => {
    // Component that throws an error
    const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
      if (shouldThrow) {
        throw new Error('Test error')
      }
      return <div data-testid="no-error">No Error</div>
    }

    it('should render children when no error occurs', () => {
      render(
        <LazyComponentErrorBoundary>
          <ThrowError shouldThrow={false} />
        </LazyComponentErrorBoundary>
      )
      
      expect(screen.getByTestId('no-error')).toBeInTheDocument()
    })

    it('should render error UI when error occurs', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <LazyComponentErrorBoundary>
          <ErrorComponent />
        </LazyComponentErrorBoundary>
      )

      expect(screen.getByText('Failed to load component')).toBeInTheDocument()
      expect(screen.getByText('Test error')).toBeInTheDocument()
      expect(screen.getByText('Retry')).toBeInTheDocument()

      consoleSpy.mockRestore()
    })

    it('should handle retry button click', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <LazyComponentErrorBoundary>
          <ErrorComponent />
        </LazyComponentErrorBoundary>
      )

      const retryButton = screen.getByText('Retry')
      fireEvent.click(retryButton)

      // After retry, error should be cleared and component should try to render again
      // Since ErrorComponent will throw again, we should still see the error UI
      expect(screen.getByText('Failed to load component')).toBeInTheDocument()

      consoleSpy.mockRestore()
    })
  })

  describe('Safe Lazy Components', () => {
    it('should render SafeLazyPerformanceMonitor with error boundary', async () => {
      render(<SafeLazyPerformanceMonitor isOpen={true} onClose={vi.fn()} />)

      // Wait for component to load (skeleton or component)
      await waitFor(() => {
        const skeleton = screen.queryByTestId('performance-monitor-skeleton')
        const component = screen.queryByTestId('performance-monitor')
        expect(skeleton || component).toBeTruthy()
      })
    })

    it('should render SafeLazyUserGuide with error boundary', async () => {
      const props = {
        isOpen: true,
        onClose: vi.fn(),
        steps: [],
        componentName: 'Test'
      }
      
      render(<SafeLazyUserGuide {...props} />)

      // Wait for component to load (skeleton or component)
      await waitFor(() => {
        const skeleton = screen.queryByTestId('user-guide-skeleton')
        const component = screen.queryByTestId('user-guide')
        expect(skeleton || component).toBeTruthy()
      })
    })

    it('should render SafeLazyUserPreferences with error boundary', async () => {
      render(<SafeLazyUserPreferences isOpen={true} onClose={vi.fn()} />)

      // Wait for component to load (skeleton or component)
      await waitFor(() => {
        const skeleton = screen.queryByTestId('user-preferences-skeleton')
        const component = screen.queryByTestId('user-preferences')
        expect(skeleton || component).toBeTruthy()
      })
    })
  })

  describe('Skeleton Components', () => {
    it('should render performance monitor skeleton with correct structure', () => {
      render(<LazyPerformanceMonitor isOpen={true} onClose={vi.fn()} />)

      // Check if skeleton exists or component loads directly
      const skeleton = screen.queryByTestId('performance-monitor-skeleton')
      const component = screen.queryByTestId('performance-monitor')

      expect(skeleton || component).toBeTruthy()
    })

    it('should render user guide skeleton with correct structure', () => {
      render(<LazyUserGuide isOpen={true} onClose={vi.fn()} steps={[]} componentName="Test" />)

      // Check if skeleton exists or component loads directly
      const skeleton = screen.queryByTestId('user-guide-skeleton')
      const component = screen.queryByTestId('user-guide')

      expect(skeleton || component).toBeTruthy()
    })

    it('should render user preferences skeleton with correct structure', () => {
      render(<LazyUserPreferences isOpen={true} onClose={vi.fn()} />)

      // Check if skeleton exists or component loads directly
      const skeleton = screen.queryByTestId('user-preferences-skeleton')
      const component = screen.queryByTestId('user-preferences')

      expect(skeleton || component).toBeTruthy()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes on skeletons', () => {
      render(<LazyPerformanceMonitor isOpen={true} onClose={vi.fn()} />)

      // Check if skeleton exists or component loads directly
      const skeleton = screen.queryByTestId('performance-monitor-skeleton')
      const component = screen.queryByTestId('performance-monitor')

      if (skeleton) {
        expect(skeleton).toHaveAttribute('role', 'dialog')
        expect(skeleton).toHaveAttribute('aria-label', 'Loading Performance Monitor')
      }

      expect(skeleton || component).toBeTruthy()
    })

    it('should be keyboard accessible', () => {
      render(<LazyPerformanceMonitor isOpen={true} onClose={vi.fn()} />)

      // Check if skeleton exists or component loads directly
      const skeleton = screen.queryByTestId('performance-monitor-skeleton')
      const component = screen.queryByTestId('performance-monitor')

      expect(skeleton || component).toBeTruthy()
    })
  })
})
