// Error tracking and monitoring system for MingLog
import React from 'react'

// Safe environment variable access for browser compatibility
const getEnvVar = (key: string, defaultValue: string = 'development'): string => {
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || defaultValue
  }
  // Fallback for browser environment
  return defaultValue
}

const isDevelopment = () => getEnvVar('NODE_ENV') === 'development'
const isProduction = () => getEnvVar('NODE_ENV') === 'production'

interface ErrorInfo {
  message: string
  stack?: string
  componentStack?: string
  timestamp: number
  userAgent: string
  url: string
  userId?: string
  sessionId: string
  buildVersion: string
  environment: 'development' | 'production' | 'staging'
}

interface PerformanceInfo {
  metric: string
  value: number
  timestamp: number
  context?: Record<string, any>
}

class ErrorTracker {
  private errors: ErrorInfo[] = []
  private performanceMetrics: PerformanceInfo[] = []
  private sessionId: string
  private maxErrors: number = 100
  private maxMetrics: number = 200
  private isEnabled: boolean

  constructor() {
    this.sessionId = this.generateSessionId()
    this.isEnabled = isProduction()
    this.setupGlobalErrorHandlers()
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private setupGlobalErrorHandlers(): void {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(new Error(event.reason), {
        type: 'unhandledrejection',
        promise: event.promise
      })
    })

    // Handle global errors
    window.addEventListener('error', (event) => {
      this.captureError(event.error || new Error(event.message), {
        type: 'global',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      })
    })

    // Handle React error boundaries (if needed)
    const originalConsoleError = console.error
    console.error = (...args) => {
      // Check if this looks like a React error
      if (args[0] && typeof args[0] === 'string' && args[0].includes('React')) {
        this.captureError(new Error(args.join(' ')), {
          type: 'react',
          args: args
        })
      }
      originalConsoleError.apply(console, args)
    }
  }

  captureError(error: Error, context?: Record<string, any>): void {
    if (!this.isEnabled && !isDevelopment()) {
      return
    }

    const errorInfo: ErrorInfo = {
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: this.sessionId,
      buildVersion: getEnvVar('REACT_APP_VERSION', 'unknown'),
      environment: getEnvVar('NODE_ENV', 'development') as any,
      ...context
    }

    this.errors.push(errorInfo)

    // Keep memory usage under control
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors)
    }

    // Log to console in development
    if (isDevelopment()) {
      console.error('Error captured:', errorInfo)
    }

    // Send to external service in production
    if (isProduction()) {
      this.sendToExternalService(errorInfo)
    }
  }

  capturePerformanceMetric(metric: string, value: number, context?: Record<string, any>): void {
    if (!this.isEnabled && !isDevelopment()) {
      return
    }

    const performanceInfo: PerformanceInfo = {
      metric,
      value,
      timestamp: Date.now(),
      context
    }

    this.performanceMetrics.push(performanceInfo)

    // Keep memory usage under control
    if (this.performanceMetrics.length > this.maxMetrics) {
      this.performanceMetrics = this.performanceMetrics.slice(-this.maxMetrics)
    }

    // Log slow operations
    if (metric.includes('time') && value > 1000) { // > 1 second
      console.warn(`Slow operation detected: ${metric} took ${value}ms`)
    }
  }

  private async sendToExternalService(errorInfo: ErrorInfo): Promise<void> {
    try {
      // In a real application, you would send to a service like Sentry, LogRocket, etc.
      // For now, we'll just store locally and could implement a batch upload later
      
      const storedErrors = JSON.parse(localStorage.getItem('minglog_errors') || '[]')
      storedErrors.push(errorInfo)
      
      // Keep only last 50 errors in localStorage
      if (storedErrors.length > 50) {
        storedErrors.splice(0, storedErrors.length - 50)
      }
      
      localStorage.setItem('minglog_errors', JSON.stringify(storedErrors))
      
      // TODO: Implement actual external service integration
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorInfo)
      // })
    } catch (error) {
      console.error('Failed to send error to external service:', error)
    }
  }

  getErrors(): ErrorInfo[] {
    return [...this.errors]
  }

  getPerformanceMetrics(): PerformanceInfo[] {
    return [...this.performanceMetrics]
  }

  clearErrors(): void {
    this.errors.length = 0
  }

  clearPerformanceMetrics(): void {
    this.performanceMetrics.length = 0
  }

  getSessionId(): string {
    return this.sessionId
  }

  // Get error statistics
  getErrorStats() {
    const errorsByType = this.errors.reduce((acc, error) => {
      const type = (error as any).type || 'unknown'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const recentErrors = this.errors.filter(
      error => Date.now() - error.timestamp < 60000 // Last minute
    )

    return {
      totalErrors: this.errors.length,
      recentErrors: recentErrors.length,
      errorsByType,
      sessionId: this.sessionId
    }
  }

  // Get performance statistics
  getPerformanceStats() {
    const metricsByType = this.performanceMetrics.reduce((acc, metric) => {
      if (!acc[metric.metric]) {
        acc[metric.metric] = []
      }
      acc[metric.metric].push(metric.value)
      return acc
    }, {} as Record<string, number[]>)

    const stats = Object.entries(metricsByType).reduce((acc, [metric, values]) => {
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length
      const max = Math.max(...values)
      const min = Math.min(...values)
      
      acc[metric] = { avg, max, min, count: values.length }
      return acc
    }, {} as Record<string, { avg: number; max: number; min: number; count: number }>)

    return stats
  }
}

// Global error tracker instance
export const errorTracker = new ErrorTracker()

// React Error Boundary component
interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{ fallback?: React.ComponentType<{ error: Error }> }>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{ fallback?: React.ComponentType<{ error: Error }> }>) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    errorTracker.captureError(error, {
      type: 'react-boundary',
      componentStack: errorInfo.componentStack
    })
    
    this.setState({ errorInfo })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return <FallbackComponent error={this.state.error!} />
    }

    return this.props.children
  }
}

// Default error fallback component
const DefaultErrorFallback: React.FC<{ error: Error }> = ({ error }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex items-center mb-4">
        <div className="flex-shrink-0">
          <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
            Something went wrong
          </h3>
        </div>
      </div>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          We're sorry, but something unexpected happened. The error has been logged and we'll look into it.
        </p>
      </div>
      
      {isDevelopment() && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
          <p className="text-xs text-red-700 dark:text-red-300 font-mono">
            {error.message}
          </p>
        </div>
      )}
      
      <div className="flex space-x-3">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          Reload Page
        </button>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="flex-1 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
        >
          Go Back
        </button>
      </div>
    </div>
  </div>
)

// Performance monitoring hooks
export const usePerformanceTracking = () => {
  const trackRender = React.useCallback((componentName: string) => {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      errorTracker.capturePerformanceMetric(`${componentName}_render_time`, renderTime, {
        component: componentName
      })
    }
  }, [])

  const trackAsyncOperation = React.useCallback(
    async (operationName: string, operation: () => Promise<any>) => {
      const startTime = performance.now()

      try {
        const result = await operation()
        const endTime = performance.now()
        const operationTime = endTime - startTime

        errorTracker.capturePerformanceMetric(`${operationName}_time`, operationTime, {
          operation: operationName,
          success: true
        })

        return result
      } catch (error) {
        const endTime = performance.now()
        const operationTime = endTime - startTime

        errorTracker.capturePerformanceMetric(`${operationName}_time`, operationTime, {
          operation: operationName,
          success: false
        })

        errorTracker.captureError(error as Error, {
          type: 'async-operation',
          operation: operationName
        })

        throw error
      }
    },
    []
  )

  return { trackRender, trackAsyncOperation }
}

export default errorTracker
