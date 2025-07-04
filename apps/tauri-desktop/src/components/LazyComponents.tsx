import React, { Suspense, lazy } from 'react'
import { Activity, Settings, HelpCircle } from 'lucide-react'

// Lazy load heavy components
const PerformanceMonitor = lazy(() => import('./PerformanceMonitor'))
const UserGuide = lazy(() => import('./UserGuide'))
const UserPreferences = lazy(() => import('./UserPreferences'))

// Loading fallback components
const PerformanceMonitorSkeleton = () => (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-pulse" />
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 animate-pulse"></div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
      </div>
      
      {/* Content Skeleton */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24 mb-2 animate-pulse"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-16 mb-2 animate-pulse"></div>
              <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-full animate-pulse"></div>
            </div>
          ))}
        </div>
        
        {/* Chart Skeleton */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 h-64">
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-32 mb-4 animate-pulse"></div>
          <div className="h-48 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
        </div>
      </div>
      
      {/* Footer Skeleton */}
      <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-48 animate-pulse"></div>
        <div className="flex items-center space-x-3">
          <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-24 animate-pulse"></div>
          <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-16 animate-pulse"></div>
        </div>
      </div>
    </div>
  </div>
)

const UserGuideSkeleton = () => (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center">
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-pulse" />
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-24 animate-pulse"></div>
        </div>
        <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>
      
      <div className="mb-6">
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2 animate-pulse"></div>
        <div className="h-2 bg-blue-600 rounded animate-pulse" style={{ width: '60%' }}></div>
      </div>
      
      <div className="mb-6">
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2 animate-pulse"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-1 animate-pulse"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
        <div className="flex items-center space-x-2">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-12 animate-pulse"></div>
          <div className="h-8 bg-blue-600 rounded w-16 animate-pulse"></div>
        </div>
      </div>
    </div>
  </div>
)

const UserPreferencesSkeleton = () => (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <Settings className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-pulse" />
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
        </div>
        <div className="w-6 h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
      </div>
      
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex items-center space-x-2 px-4 py-3">
            <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16 animate-pulse"></div>
          </div>
        ))}
      </div>
      
      <div className="p-6">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-6 animate-pulse"></div>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 animate-pulse"></div>
              <div className="w-4 h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
)

// Lazy wrapper components with error boundaries
interface LazyPerformanceMonitorProps {
  isOpen: boolean
  onClose: () => void
}

export const LazyPerformanceMonitor: React.FC<LazyPerformanceMonitorProps> = (props) => (
  <Suspense fallback={<PerformanceMonitorSkeleton />}>
    <PerformanceMonitor {...props} />
  </Suspense>
)

interface LazyUserGuideProps {
  isOpen: boolean
  onClose: () => void
  steps: any[]
  componentName: string
}

export const LazyUserGuide: React.FC<LazyUserGuideProps> = (props) => (
  <Suspense fallback={<UserGuideSkeleton />}>
    <UserGuide {...props} />
  </Suspense>
)

interface LazyUserPreferencesProps {
  isOpen: boolean
  onClose: () => void
  onPreferencesChange?: (preferences: any) => void
}

export const LazyUserPreferences: React.FC<LazyUserPreferencesProps> = (props) => (
  <Suspense fallback={<UserPreferencesSkeleton />}>
    <UserPreferences {...props} />
  </Suspense>
)

// Error boundary for lazy components
interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

class LazyComponentErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy component failed to load:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="text-center">
              <div className="text-red-600 dark:text-red-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                Component Failed to Load
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                There was an error loading this component. Please try refreshing the page.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Wrapped lazy components with error boundaries
export const SafeLazyPerformanceMonitor: React.FC<LazyPerformanceMonitorProps> = (props) => (
  <LazyComponentErrorBoundary>
    <LazyPerformanceMonitor {...props} />
  </LazyComponentErrorBoundary>
)

export const SafeLazyUserGuide: React.FC<LazyUserGuideProps> = (props) => (
  <LazyComponentErrorBoundary>
    <LazyUserGuide {...props} />
  </LazyComponentErrorBoundary>
)

export const SafeLazyUserPreferences: React.FC<LazyUserPreferencesProps> = (props) => (
  <LazyComponentErrorBoundary>
    <LazyUserPreferences {...props} />
  </LazyComponentErrorBoundary>
)

export default {
  PerformanceMonitor: SafeLazyPerformanceMonitor,
  UserGuide: SafeLazyUserGuide,
  UserPreferences: SafeLazyUserPreferences,
}
