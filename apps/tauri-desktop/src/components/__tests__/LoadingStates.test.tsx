import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  PerformanceMonitorSkeleton,
  LoadingSpinner,
  PulseLoader,
  DataLoadingState,
  ErrorState,
  EmptyState,
  MetricsLoadingState,
  ChartLoadingState,
  ProgressiveLoader
} from '../LoadingStates'

describe('LoadingStates Components', () => {
  describe('PerformanceMonitorSkeleton', () => {
    it('should render skeleton structure', () => {
      render(<PerformanceMonitorSkeleton />)
      
      // Should have animated skeleton elements
      const skeletonElements = screen.getAllByRole('generic')
      expect(skeletonElements.length).toBeGreaterThan(0)
      
      // Should have chart placeholder
      expect(screen.getByTestId('chart-placeholder')).toBeInTheDocument()
    })

    it('should have proper accessibility attributes', () => {
      render(<PerformanceMonitorSkeleton />)
      
      const skeleton = screen.getByRole('status', { name: /loading/i })
      expect(skeleton).toHaveAttribute('aria-live', 'polite')
    })
  })

  describe('LoadingSpinner', () => {
    it('should render with default size', () => {
      render(<LoadingSpinner />)
      
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('w-6', 'h-6')
    })

    it('should render with small size', () => {
      render(<LoadingSpinner size="sm" />)
      
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('w-4', 'h-4')
    })

    it('should render with large size', () => {
      render(<LoadingSpinner size="lg" />)
      
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('w-8', 'h-8')
    })

    it('should apply custom className', () => {
      render(<LoadingSpinner className="custom-class" />)
      
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveClass('custom-class')
    })

    it('should have proper accessibility attributes', () => {
      render(<LoadingSpinner />)
      
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveAttribute('aria-label', 'Loading')
    })
  })

  describe('PulseLoader', () => {
    it('should render three pulse dots', () => {
      render(<PulseLoader />)
      
      const dots = screen.getAllByTestId('pulse-dot')
      expect(dots).toHaveLength(3)
    })

    it('should apply custom className', () => {
      render(<PulseLoader className="custom-pulse" />)
      
      const container = screen.getByTestId('pulse-loader')
      expect(container).toHaveClass('custom-pulse')
    })

    it('should have staggered animation delays', () => {
      render(<PulseLoader />)
      
      const dots = screen.getAllByTestId('pulse-dot')
      expect(dots[0]).toHaveStyle('animation-delay: 0s')
      expect(dots[1]).toHaveStyle('animation-delay: 0.2s')
      expect(dots[2]).toHaveStyle('animation-delay: 0.4s')
    })
  })

  describe('DataLoadingState', () => {
    it('should render with default message', () => {
      render(<DataLoadingState />)

      expect(screen.getByText('正在加载数据...')).toBeInTheDocument()
      // Should have LoadingSpinner with role="status"
      const statusElements = screen.getAllByRole('status')
      expect(statusElements.length).toBeGreaterThan(0)
    })

    it('should render with custom message', () => {
      render(<DataLoadingState message="Custom loading message" />)

      expect(screen.getByText('Custom loading message')).toBeInTheDocument()
    })

    it('should hide spinner when showSpinner is false', () => {
      render(<DataLoadingState showSpinner={false} />)

      // Should have role="status" on the container when no spinner
      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.getByText('正在加载数据...')).toBeInTheDocument()
    })
  })

  describe('ErrorState', () => {
    const mockRetry = jest.fn()

    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should render error message', () => {
      render(<ErrorState error="Test error message" />)
      
      expect(screen.getByText('加载失败')).toBeInTheDocument()
      expect(screen.getByText('Test error message')).toBeInTheDocument()
    })

    it('should render retry button by default', () => {
      render(<ErrorState error="Test error" onRetry={mockRetry} />)
      
      const retryButton = screen.getByRole('button', { name: '重试' })
      expect(retryButton).toBeInTheDocument()
    })

    it('should hide retry button when showRetryButton is false', () => {
      render(
        <ErrorState 
          error="Test error" 
          onRetry={mockRetry} 
          showRetryButton={false} 
        />
      )
      
      expect(screen.queryByRole('button', { name: '重试' })).not.toBeInTheDocument()
    })

    it('should call onRetry when retry button is clicked', async () => {
      render(<ErrorState error="Test error" onRetry={mockRetry} />)
      
      const retryButton = screen.getByRole('button', { name: '重试' })
      await userEvent.click(retryButton)
      
      expect(mockRetry).toHaveBeenCalledTimes(1)
    })

    it('should have proper accessibility attributes', () => {
      render(<ErrorState error="Test error" />)
      
      const errorContainer = screen.getByRole('alert')
      expect(errorContainer).toBeInTheDocument()
    })
  })

  describe('EmptyState', () => {
    it('should render with default props', () => {
      render(<EmptyState />)
      
      expect(screen.getByText('暂无数据')).toBeInTheDocument()
      expect(screen.getByText('开始使用以查看数据')).toBeInTheDocument()
    })

    it('should render with custom props', () => {
      const customAction = <button>Custom Action</button>
      
      render(
        <EmptyState
          title="Custom Title"
          description="Custom Description"
          action={customAction}
        />
      )
      
      expect(screen.getByText('Custom Title')).toBeInTheDocument()
      expect(screen.getByText('Custom Description')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Custom Action' })).toBeInTheDocument()
    })

    it('should render custom icon', () => {
      const customIcon = <div data-testid="custom-icon">Custom Icon</div>
      
      render(<EmptyState icon={customIcon} />)
      
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
    })
  })

  describe('MetricsLoadingState', () => {
    it('should render four metric loading cards', () => {
      render(<MetricsLoadingState />)
      
      const metricCards = screen.getAllByTestId('metric-loading-card')
      expect(metricCards).toHaveLength(4)
    })

    it('should render metric labels', () => {
      render(<MetricsLoadingState />)
      
      expect(screen.getByText('内存使用')).toBeInTheDocument()
      expect(screen.getByText('渲染时间')).toBeInTheDocument()
      expect(screen.getByText('数据库查询')).toBeInTheDocument()
      expect(screen.getByText('组件数量')).toBeInTheDocument()
    })

    it('should have loading animation', () => {
      render(<MetricsLoadingState />)
      
      const loadingElements = screen.getAllByTestId('loading-shimmer')
      expect(loadingElements.length).toBeGreaterThan(0)
    })
  })

  describe('ChartLoadingState', () => {
    it('should render chart loading placeholder', () => {
      render(<ChartLoadingState />)
      
      expect(screen.getByText('正在生成图表...')).toBeInTheDocument()
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('should have proper dimensions', () => {
      render(<ChartLoadingState />)
      
      const container = screen.getByTestId('chart-loading-container')
      expect(container).toHaveClass('h-64')
    })
  })

  describe('ProgressiveLoader', () => {
    const steps = ['Step 1', 'Step 2', 'Step 3']

    it('should render all steps', () => {
      render(<ProgressiveLoader steps={steps} currentStep={1} />)
      
      steps.forEach(step => {
        expect(screen.getByText(step)).toBeInTheDocument()
      })
    })

    it('should show completed steps with checkmarks', () => {
      render(<ProgressiveLoader steps={steps} currentStep={2} />)
      
      const completedSteps = screen.getAllByTestId('step-completed')
      expect(completedSteps).toHaveLength(2) // Steps 0 and 1 should be completed
    })

    it('should show current step with pulse animation', () => {
      render(<ProgressiveLoader steps={steps} currentStep={1} />)
      
      const currentStep = screen.getByTestId('step-current')
      expect(currentStep).toHaveClass('animate-pulse')
    })

    it('should show pending steps in muted style', () => {
      render(<ProgressiveLoader steps={steps} currentStep={1} />)
      
      const pendingSteps = screen.getAllByTestId('step-pending')
      expect(pendingSteps.length).toBeGreaterThan(0)
    })

    it('should apply custom className', () => {
      render(
        <ProgressiveLoader 
          steps={steps} 
          currentStep={1} 
          className="custom-progressive" 
        />
      )
      
      const container = screen.getByTestId('progressive-loader')
      expect(container).toHaveClass('custom-progressive')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels for loading states', () => {
      render(<LoadingSpinner />)
      
      const spinner = screen.getByRole('status')
      expect(spinner).toHaveAttribute('aria-label', 'Loading')
    })

    it('should have proper ARIA live regions for dynamic content', () => {
      render(<DataLoadingState showSpinner={false} />)

      const liveRegion = screen.getByRole('status')
      expect(liveRegion).toHaveAttribute('aria-live', 'polite')
    })

    it('should have proper error announcements', () => {
      render(<ErrorState error="Test error" />)
      
      const errorAlert = screen.getByRole('alert')
      expect(errorAlert).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('should apply responsive classes', () => {
      render(<MetricsLoadingState />)
      
      const grid = screen.getByTestId('metrics-grid')
      expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-4')
    })
  })

  describe('Dark Mode Support', () => {
    it('should have dark mode classes', () => {
      render(<LoadingSpinner />)
      
      const spinner = screen.getByRole('status')
      const spinnerElement = spinner.querySelector('div')
      expect(spinnerElement).toHaveClass('dark:border-gray-600', 'dark:border-t-blue-400')
    })
  })
})
