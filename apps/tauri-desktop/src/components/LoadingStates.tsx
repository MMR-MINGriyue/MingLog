import React from 'react'
import { Activity, BarChart3, Database, Clock } from 'lucide-react'

// 性能监控器骨架屏组件
export const PerformanceMonitorSkeleton: React.FC = () => {
  return (
    <div
      className="animate-pulse"
      data-testid="performance-monitor-skeleton"
      role="status"
      aria-live="polite"
      aria-label="Loading performance monitor"
    >
      {/* 头部骨架 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
          <div className="w-32 h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
        <div className="flex space-x-2">
          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
          <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
        </div>
      </div>

      {/* 指标卡片骨架 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                <div className="w-16 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </div>
              <div className="w-12 h-5 bg-gray-300 dark:bg-gray-600 rounded"></div>
            </div>
            <div className="w-20 h-6 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full">
              <div className="w-1/3 h-2 bg-gray-300 dark:bg-gray-500 rounded-full"></div>
            </div>
          </div>
        ))}
      </div>

      {/* 图表骨架 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
        <div className="w-32 h-6 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
        <div
          className="h-64 bg-gray-100 dark:bg-gray-700 rounded flex items-center justify-center"
          data-testid="chart-placeholder"
        >
          <BarChart3 className="w-12 h-12 text-gray-400 dark:text-gray-500" />
        </div>
      </div>
    </div>
  )
}

// 加载指示器组件
export const LoadingSpinner: React.FC<{
  size?: 'sm' | 'md' | 'lg'
  className?: string
}> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <div
      className={`${sizeClasses[size]} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <div className="animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 dark:border-gray-600 dark:border-t-blue-400"></div>
    </div>
  )
}

// 脉冲加载指示器
export const PulseLoader: React.FC<{
  className?: string
}> = ({ className = '' }) => {
  return (
    <div
      className={`flex space-x-1 ${className}`}
      data-testid="pulse-loader"
    >
      {[...Array(3)].map((_, index) => (
        <div
          key={index}
          className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse"
          data-testid="pulse-dot"
          style={{
            animationDelay: `${index * 0.2}s`,
            animationDuration: '1s'
          }}
        />
      ))}
    </div>
  )
}

// 数据加载状态组件
export const DataLoadingState: React.FC<{
  message?: string
  showSpinner?: boolean
}> = ({ message = '正在加载数据...', showSpinner = true }) => {
  return (
    <div
      className="flex flex-col items-center justify-center py-8 text-gray-500 dark:text-gray-400"
      role={showSpinner ? undefined : "status"}
      aria-live={showSpinner ? undefined : "polite"}
    >
      {showSpinner && (
        <div className="mb-4">
          <LoadingSpinner size="lg" />
        </div>
      )}
      <p className="text-sm">{message}</p>
    </div>
  )
}

// 错误状态组件
export const ErrorState: React.FC<{
  error: string
  onRetry?: () => void
  showRetryButton?: boolean
}> = ({ error, onRetry, showRetryButton = true }) => {
  return (
    <div
      className="flex flex-col items-center justify-center py-8 text-center"
      role="alert"
    >
      <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
        <Activity className="w-6 h-6 text-red-600 dark:text-red-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        加载失败
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-md">
        {error}
      </p>
      {showRetryButton && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
        >
          重试
        </button>
      )}
    </div>
  )
}

// 空状态组件
export const EmptyState: React.FC<{
  icon?: React.ReactNode
  title?: string
  description?: string
  action?: React.ReactNode
}> = ({ 
  icon = <Database className="w-12 h-12" />, 
  title = '暂无数据', 
  description = '开始使用以查看数据',
  action 
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 text-gray-400 dark:text-gray-500">
        {icon}
      </div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
        {title}
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-md">
        {description}
      </p>
      {action}
    </div>
  )
}

// 性能指标加载状态
export const MetricsLoadingState: React.FC = () => {
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      data-testid="metrics-loading-state"
    >
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        data-testid="metrics-grid"
      >
        {[
          { icon: Activity, label: '内存使用' },
          { icon: Clock, label: '渲染时间' },
          { icon: Database, label: '数据库查询' },
          { icon: BarChart3, label: '组件数量' }
        ].map((metric, index) => (
          <div
            key={index}
            className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 animate-pulse"
            data-testid="metric-loading-card"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <metric.icon className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                <span className="text-sm font-medium text-gray-400 dark:text-gray-500">
                  {metric.label}
                </span>
              </div>
              <div
                className="w-12 h-4 bg-gray-300 dark:bg-gray-600 rounded"
                data-testid="loading-shimmer"
              ></div>
            </div>
            <div
              className="w-16 h-6 bg-gray-300 dark:bg-gray-600 rounded mb-2"
              data-testid="loading-shimmer"
            ></div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full">
              <div
                className="w-1/3 h-2 bg-gray-300 dark:bg-gray-500 rounded-full"
                data-testid="loading-shimmer"
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// 图表加载状态
export const ChartLoadingState: React.FC = () => {
  return (
    <div
      className="h-64 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center"
      data-testid="chart-loading-container"
    >
      <div className="text-center">
        <div
          className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-600 dark:border-gray-600 dark:border-t-blue-400 mx-auto mb-4"
          role="status"
          aria-label="Loading chart"
        ></div>
        <p className="text-sm text-gray-500 dark:text-gray-400">正在生成图表...</p>
      </div>
    </div>
  )
}

// 渐进式加载组件
export const ProgressiveLoader: React.FC<{
  steps: string[]
  currentStep: number
  className?: string
}> = ({ steps, currentStep, className = '' }) => {
  return (
    <div
      className={`space-y-3 ${className}`}
      data-testid="progressive-loader"
    >
      {steps.map((step, index) => (
        <div key={index} className="flex items-center space-x-3">
          <div
            className={`w-4 h-4 rounded-full flex items-center justify-center ${
              index < currentStep
                ? 'bg-green-500 text-white'
                : index === currentStep
                  ? 'bg-blue-500 text-white animate-pulse'
                  : 'bg-gray-300 dark:bg-gray-600'
            }`}
            data-testid={
              index < currentStep
                ? 'step-completed'
                : index === currentStep
                  ? 'step-current'
                  : 'step-pending'
            }
          >
            {index < currentStep ? (
              <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : index === currentStep ? (
              <div className="w-1 h-1 bg-white rounded-full"></div>
            ) : null}
          </div>
          <span className={`text-sm ${
            index <= currentStep
              ? 'text-gray-900 dark:text-gray-100'
              : 'text-gray-500 dark:text-gray-400'
          }`}>
            {step}
          </span>
        </div>
      ))}
    </div>
  )
}
