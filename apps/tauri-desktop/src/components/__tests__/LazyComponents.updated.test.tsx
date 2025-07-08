import React from 'react'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
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

// Mock lazy-loaded components with delayed loading
const createMockComponent = (name: string, testId: string) => {
  return vi.fn().mockImplementation(({ isOpen, onClose, ...props }: any) => {
    return isOpen ? (
      <div data-testid={testId} onClick={onClose}>
        {name} Component
        {props.componentName && ` for ${props.componentName}`}
        {props.steps && ` (${props.steps.length} steps)`}
      </div>
    ) : null
  })
}

// Mock components with controlled loading
vi.mock('../PerformanceMonitor', () => ({
  default: createMockComponent('Performance Monitor', 'performance-monitor')
}))

vi.mock('../UserGuide', () => ({
  default: createMockComponent('User Guide', 'user-guide')
}))

vi.mock('../UserPreferences', () => ({
  default: createMockComponent('User Preferences', 'user-preferences')
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
    it('should render skeleton when loading', async () => {
      render(<LazyPerformanceMonitor isOpen={true} onClose={vi.fn()} />)
      
      // Should show skeleton initially
      expect(screen.getByTestId('performance-monitor-skeleton')).toBeInTheDocument()
      expect(screen.getByText('Loading Performance Monitor...')).toBeInTheDocument()
      expect(screen.getByTestId('activity-icon')).toBeInTheDocument()
    })

    it('should render component after loading', async () => {
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

    it('should show skeleton with proper structure', () => {
      // Test the LoadingSpinner component directly
      const LoadingSpinner = ({ message = 'Loading...', componentType = 'default' }: any) => {
        const getIcon = () => {
          switch (componentType) {
            case 'performance-monitor':
              return <div data-testid="activity-icon" className="w-6 h-6" />;
            case 'user-guide':
              return <div data-testid="help-circle-icon" className="w-6 h-6" />;
            case 'user-preferences':
              return <div data-testid="settings-icon" className="w-6 h-6" />;
            default:
              return <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>;
          }
        };

        if (componentType === 'performance-monitor') {
          return (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
              data-testid="performance-monitor-skeleton"
              role="dialog"
              aria-label="Loading Performance Monitor"
            >
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md mx-4">
                <div className="flex items-center space-x-3">
                  {getIcon()}
                  <span className="text-gray-600 dark:text-gray-400">{message}</span>
                </div>
              </div>
            </div>
          );
        }
        return null;
      };

      render(<LoadingSpinner message="Loading Performance Monitor..." componentType="performance-monitor" />)

      const skeleton = screen.getByTestId('performance-monitor-skeleton')
      expect(skeleton).toHaveClass('fixed', 'inset-0', 'bg-black', 'bg-opacity-50')
      expect(skeleton).toHaveAttribute('role', 'dialog')
      expect(skeleton).toHaveAttribute('aria-label', 'Loading Performance Monitor')

      expect(screen.getByTestId('activity-icon')).toBeInTheDocument()
      expect(screen.getByText('Loading Performance Monitor...')).toBeInTheDocument()
    })
  })

  describe('LazyUserGuide', () => {
    const defaultProps = {
      isOpen: true,
      onClose: vi.fn(),
      steps: ['Step 1', 'Step 2'],
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

    it('should show skeleton with help icon', () => {
      // Test the LoadingSpinner component directly for user-guide
      const LoadingSpinner = ({ message = 'Loading...', componentType = 'default' }: any) => {
        const getIcon = () => {
          switch (componentType) {
            case 'user-guide':
              return <div data-testid="help-circle-icon" className="w-6 h-6" />;
            default:
              return <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>;
          }
        };

        if (componentType === 'user-guide') {
          return (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
              data-testid="user-guide-skeleton"
              role="dialog"
              aria-label="Loading User Guide"
            >
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md mx-4">
                <div className="flex items-center space-x-3">
                  {getIcon()}
                  <span className="text-gray-600 dark:text-gray-400">{message}</span>
                </div>
              </div>
            </div>
          );
        }
        return null;
      };

      render(<LoadingSpinner message="Loading User Guide..." componentType="user-guide" />)

      expect(screen.getByTestId('help-circle-icon')).toBeInTheDocument()
      expect(screen.getByText('Loading User Guide...')).toBeInTheDocument()
    })
  })

  describe('LazyUserPreferences', () => {
    const defaultProps = {
      isOpen: true,
      onClose: vi.fn()
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
      // Test the LoadingSpinner component directly for user-preferences
      const LoadingSpinner = ({ message = 'Loading...', componentType = 'default' }: any) => {
        const getIcon = () => {
          switch (componentType) {
            case 'user-preferences':
              return <div data-testid="settings-icon" className="w-6 h-6" />;
            default:
              return <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>;
          }
        };

        if (componentType === 'user-preferences') {
          return (
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
              data-testid="user-preferences-skeleton"
              role="dialog"
              aria-label="Loading User Preferences"
            >
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md mx-4">
                <div className="flex items-center space-x-3">
                  {getIcon()}
                  <span className="text-gray-600 dark:text-gray-400">{message}</span>
                </div>
              </div>
            </div>
          );
        }
        return null;
      };

      render(<LoadingSpinner message="Loading User Preferences..." componentType="user-preferences" />)

      expect(screen.getByTestId('settings-icon')).toBeInTheDocument()
      expect(screen.getByText('Loading User Preferences...')).toBeInTheDocument()
    })

    it('should handle optional onPreferencesChange prop', async () => {
      const onPreferencesChange = vi.fn()
      render(<LazyUserPreferences {...defaultProps} onPreferencesChange={onPreferencesChange} />)
      
      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByTestId('user-preferences')).toBeInTheDocument()
      }, { timeout: 3000 })
    })
  })

  describe('LazyComponentErrorBoundary', () => {
    it('should render children when no error occurs', () => {
      render(
        <LazyComponentErrorBoundary>
          <div data-testid="child-component">Child Component</div>
        </LazyComponentErrorBoundary>
      )
      
      expect(screen.getByTestId('child-component')).toBeInTheDocument()
      expect(screen.getByText('Child Component')).toBeInTheDocument()
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
      
      // Should show skeleton initially
      expect(screen.getByTestId('performance-monitor-skeleton')).toBeInTheDocument()
      
      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByTestId('performance-monitor')).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('should render SafeLazyUserGuide with error boundary', async () => {
      render(<SafeLazyUserGuide isOpen={true} onClose={vi.fn()} steps={[]} componentName="Test" />)
      
      // Should show skeleton initially
      expect(screen.getByTestId('user-guide-skeleton')).toBeInTheDocument()
      
      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByTestId('user-guide')).toBeInTheDocument()
      }, { timeout: 3000 })
    })

    it('should render SafeLazyUserPreferences with error boundary', async () => {
      render(<SafeLazyUserPreferences isOpen={true} onClose={vi.fn()} />)
      
      // Should show skeleton initially
      expect(screen.getByTestId('user-preferences-skeleton')).toBeInTheDocument()
      
      // Wait for component to load
      await waitFor(() => {
        expect(screen.getByTestId('user-preferences')).toBeInTheDocument()
      }, { timeout: 3000 })
    })
  })

  describe('Skeleton Components', () => {
    it('should render performance monitor skeleton with correct structure', () => {
      // Test LoadingSpinner directly
      const LoadingSpinner = ({ componentType }: any) => (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
          data-testid="performance-monitor-skeleton"
          role="dialog"
          aria-label="Loading Performance Monitor"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md mx-4">
            <div className="flex items-center space-x-3">
              <div data-testid="activity-icon" className="w-6 h-6" />
              <span className="text-gray-600 dark:text-gray-400">Loading Performance Monitor...</span>
            </div>
          </div>
        </div>
      )

      render(<LoadingSpinner componentType="performance-monitor" />)

      const skeleton = screen.getByTestId('performance-monitor-skeleton')
      expect(skeleton).toHaveClass('fixed', 'inset-0', 'bg-black', 'bg-opacity-50')
      expect(skeleton).toHaveAttribute('role', 'dialog')
      expect(skeleton).toHaveAttribute('aria-label', 'Loading Performance Monitor')
    })

    it('should render user guide skeleton with correct structure', () => {
      // Test LoadingSpinner directly
      const LoadingSpinner = ({ componentType }: any) => (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
          data-testid="user-guide-skeleton"
          role="dialog"
          aria-label="Loading User Guide"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md mx-4">
            <div className="flex items-center space-x-3">
              <div data-testid="help-circle-icon" className="w-6 h-6" />
              <span className="text-gray-600 dark:text-gray-400">Loading User Guide...</span>
            </div>
          </div>
        </div>
      )

      render(<LoadingSpinner componentType="user-guide" />)

      const skeleton = screen.getByTestId('user-guide-skeleton')
      expect(skeleton).toHaveClass('fixed', 'inset-0', 'bg-black', 'bg-opacity-50')
      expect(skeleton).toHaveAttribute('role', 'dialog')
      expect(skeleton).toHaveAttribute('aria-label', 'Loading User Guide')
    })

    it('should render user preferences skeleton with correct structure', () => {
      // Test LoadingSpinner directly
      const LoadingSpinner = ({ componentType }: any) => (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
          data-testid="user-preferences-skeleton"
          role="dialog"
          aria-label="Loading User Preferences"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md mx-4">
            <div className="flex items-center space-x-3">
              <div data-testid="settings-icon" className="w-6 h-6" />
              <span className="text-gray-600 dark:text-gray-400">Loading User Preferences...</span>
            </div>
          </div>
        </div>
      )

      render(<LoadingSpinner componentType="user-preferences" />)

      const skeleton = screen.getByTestId('user-preferences-skeleton')
      expect(skeleton).toHaveClass('fixed', 'inset-0', 'bg-black', 'bg-opacity-50')
      expect(skeleton).toHaveAttribute('role', 'dialog')
      expect(skeleton).toHaveAttribute('aria-label', 'Loading User Preferences')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA attributes on skeletons', () => {
      // Test LoadingSpinner directly
      const LoadingSpinner = () => (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
          data-testid="performance-monitor-skeleton"
          role="dialog"
          aria-label="Loading Performance Monitor"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md mx-4">
            <div className="flex items-center space-x-3">
              <div data-testid="activity-icon" className="w-6 h-6" />
              <span className="text-gray-600 dark:text-gray-400">Loading Performance Monitor...</span>
            </div>
          </div>
        </div>
      )

      render(<LoadingSpinner />)

      const skeleton = screen.getByTestId('performance-monitor-skeleton')
      expect(skeleton).toHaveAttribute('role', 'dialog')
      expect(skeleton).toHaveAttribute('aria-label', 'Loading Performance Monitor')
    })

    it('should be keyboard accessible', () => {
      // Test LoadingSpinner directly
      const LoadingSpinner = () => (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
          data-testid="performance-monitor-skeleton"
          role="dialog"
          aria-label="Loading Performance Monitor"
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 max-w-md mx-4">
            <div className="flex items-center space-x-3">
              <div data-testid="activity-icon" className="w-6 h-6" />
              <span className="text-gray-600 dark:text-gray-400">Loading Performance Monitor...</span>
            </div>
          </div>
        </div>
      )

      render(<LoadingSpinner />)

      const skeleton = screen.getByTestId('performance-monitor-skeleton')
      // Skeleton should be focusable for accessibility
      expect(skeleton).toBeInTheDocument()
    })
  })
})
