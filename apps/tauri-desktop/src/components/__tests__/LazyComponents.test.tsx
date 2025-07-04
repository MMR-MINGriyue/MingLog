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

// Mock lazy-loaded components
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
        User Guide for {componentName} ({steps.length} steps)
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
  Activity: () => <div data-testid="activity-icon">Activity</div>,
  Settings: () => <div data-testid="settings-icon">Settings</div>,
  HelpCircle: () => <div data-testid="help-circle-icon">HelpCircle</div>,
}))

describe('LazyComponents', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('LazyPerformanceMonitor', () => {
    it('should render skeleton when loading', () => {
      render(<LazyPerformanceMonitor isOpen={true} onClose={vi.fn()} />)
      
      // Should show skeleton initially
      expect(screen.getByTestId('performance-monitor-skeleton')).toBeInTheDocument()
      expect(screen.getByText('Loading Performance Monitor...')).toBeInTheDocument()
    })

    it('should render component after loading', async () => {
      const onClose = vi.fn()
      render(<LazyPerformanceMonitor isOpen={true} onClose={onClose} />)
      
      // Wait for lazy component to load
      await waitFor(() => {
        expect(screen.getByTestId('performance-monitor')).toBeInTheDocument()
      })
      
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

    it('should show skeleton with proper structure', () => {
      render(<LazyPerformanceMonitor isOpen={true} onClose={vi.fn()} />)
      
      const skeleton = screen.getByTestId('performance-monitor-skeleton')
      expect(skeleton).toHaveClass('fixed', 'inset-0', 'bg-black', 'bg-opacity-50')
      
      expect(screen.getByTestId('activity-icon')).toBeInTheDocument()
      expect(screen.getByText('Loading Performance Monitor...')).toBeInTheDocument()
    })
  })

  describe('LazyUserGuide', () => {
    const defaultProps = {
      isOpen: true,
      onClose: vi.fn(),
      steps: [{ title: 'Step 1' }, { title: 'Step 2' }],
      componentName: 'TestComponent'
    }

    it('should render skeleton when loading', () => {
      render(<LazyUserGuide {...defaultProps} />)
      
      expect(screen.getByTestId('user-guide-skeleton')).toBeInTheDocument()
      expect(screen.getByText('Loading User Guide...')).toBeInTheDocument()
    })

    it('should render component after loading', async () => {
      const onClose = vi.fn()
      render(<LazyUserGuide {...defaultProps} onClose={onClose} />)
      
      await waitFor(() => {
        expect(screen.getByTestId('user-guide')).toBeInTheDocument()
      })
      
      expect(screen.getByText('User Guide for TestComponent (2 steps)')).toBeInTheDocument()
      
      fireEvent.click(screen.getByTestId('user-guide'))
      expect(onClose).toHaveBeenCalled()
    })

    it('should not render when isOpen is false', () => {
      render(<LazyUserGuide {...defaultProps} isOpen={false} />)
      
      expect(screen.queryByTestId('user-guide')).not.toBeInTheDocument()
      expect(screen.queryByTestId('user-guide-skeleton')).not.toBeInTheDocument()
    })

    it('should show skeleton with help icon', () => {
      render(<LazyUserGuide {...defaultProps} />)
      
      expect(screen.getByTestId('help-circle-icon')).toBeInTheDocument()
      expect(screen.getByText('Loading User Guide...')).toBeInTheDocument()
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
      
      await waitFor(() => {
        expect(screen.getByTestId('user-preferences')).toBeInTheDocument()
      })
      
      expect(screen.getByText('User Preferences Component')).toBeInTheDocument()
      
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
      
      expect(screen.getByTestId('settings-icon')).toBeInTheDocument()
      expect(screen.getByText('Loading User Preferences...')).toBeInTheDocument()
    })

    it('should handle optional onPreferencesChange prop', async () => {
      render(<LazyUserPreferences isOpen={true} onClose={vi.fn()} />)
      
      await waitFor(() => {
        expect(screen.getByTestId('user-preferences')).toBeInTheDocument()
      })
      
      // Should not throw error when onPreferencesChange is not provided
      expect(screen.getByText('User Preferences Component')).toBeInTheDocument()
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
          <ThrowError shouldThrow={true} />
        </LazyComponentErrorBoundary>
      )
      
      expect(screen.getByText('Component Loading Error')).toBeInTheDocument()
      expect(screen.getByText('There was an error loading this component. Please try refreshing the page.')).toBeInTheDocument()
      expect(screen.getByText('Refresh Page')).toBeInTheDocument()
      
      consoleSpy.mockRestore()
    })

    it('should handle refresh button click', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      // Mock window.location.reload
      const reloadMock = vi.fn()
      Object.defineProperty(window, 'location', {
        value: { reload: reloadMock },
        writable: true
      })
      
      render(
        <LazyComponentErrorBoundary>
          <ThrowError shouldThrow={true} />
        </LazyComponentErrorBoundary>
      )
      
      const refreshButton = screen.getByText('Refresh Page')
      fireEvent.click(refreshButton)
      
      expect(reloadMock).toHaveBeenCalled()
      
      consoleSpy.mockRestore()
    })
  })

  describe('Safe Lazy Components', () => {
    it('should render SafeLazyPerformanceMonitor with error boundary', async () => {
      render(<SafeLazyPerformanceMonitor isOpen={true} onClose={vi.fn()} />)
      
      // Should show skeleton initially
      expect(screen.getByTestId('performance-monitor-skeleton')).toBeInTheDocument()
      
      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByTestId('performance-monitor')).toBeInTheDocument()
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
      
      expect(screen.getByTestId('user-guide-skeleton')).toBeInTheDocument()
      
      await waitFor(() => {
        expect(screen.getByTestId('user-guide')).toBeInTheDocument()
      })
    })

    it('should render SafeLazyUserPreferences with error boundary', async () => {
      render(<SafeLazyUserPreferences isOpen={true} onClose={vi.fn()} />)
      
      expect(screen.getByTestId('user-preferences-skeleton')).toBeInTheDocument()
      
      await waitFor(() => {
        expect(screen.getByTestId('user-preferences')).toBeInTheDocument()
      })
    })
  })

  describe('Skeleton Components', () => {
    it('should render performance monitor skeleton with correct structure', () => {
      render(<LazyPerformanceMonitor isOpen={true} onClose={vi.fn()} />)
      
      const skeleton = screen.getByTestId('performance-monitor-skeleton')
      expect(skeleton).toHaveClass('fixed', 'inset-0', 'z-50')
      
      // Check for loading animation elements
      const animatedElements = skeleton.querySelectorAll('.animate-pulse')
      expect(animatedElements.length).toBeGreaterThan(0)
    })

    it('should render user guide skeleton with correct structure', () => {
      render(<LazyUserGuide isOpen={true} onClose={vi.fn()} steps={[]} componentName="Test" />)
      
      const skeleton = screen.getByTestId('user-guide-skeleton')
      expect(skeleton).toHaveClass('fixed', 'inset-0', 'z-50')
      
      expect(screen.getByTestId('help-circle-icon')).toBeInTheDocument()
    })

    it('should render user preferences skeleton with correct structure', () => {
      render(<LazyUserPreferences isOpen={true} onClose={vi.fn()} />)
      
      const skeleton = screen.getByTestId('user-preferences-skeleton')
      expect(skeleton).toHaveClass('fixed', 'inset-0', 'z-50')
      
      expect(screen.getByTestId('settings-icon')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes on skeletons', () => {
      render(<LazyPerformanceMonitor isOpen={true} onClose={vi.fn()} />)
      
      const skeleton = screen.getByTestId('performance-monitor-skeleton')
      expect(skeleton).toHaveAttribute('role', 'dialog')
      expect(skeleton).toHaveAttribute('aria-label', 'Loading Performance Monitor')
    })

    it('should be keyboard accessible', () => {
      render(<LazyPerformanceMonitor isOpen={true} onClose={vi.fn()} />)
      
      const skeleton = screen.getByTestId('performance-monitor-skeleton')
      expect(skeleton).toHaveAttribute('tabIndex', '0')
    })
  })
})
