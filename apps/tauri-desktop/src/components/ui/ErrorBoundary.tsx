/**
 * 错误边界组件
 * 捕获和处理React组件错误
 */

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * 错误边界组件
 * 用于捕获子组件中的JavaScript错误
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // 更新state以显示错误UI
    return {
      hasError: true,
      error
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 记录错误信息
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // 调用外部错误处理回调
    this.props.onError?.(error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback
      }

      // 默认错误UI
      return (
        <div className="error-boundary p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <svg
                className="w-5 h-5 text-red-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                组件渲染错误
              </h3>
            </div>
          </div>
          
          <div className="text-sm text-red-700">
            <p className="mb-2">
              抱歉，此组件遇到了一个错误。请刷新页面重试。
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4">
                <summary className="cursor-pointer font-medium">
                  错误详情 (开发模式)
                </summary>
                <div className="mt-2 p-3 bg-red-100 rounded border text-xs font-mono">
                  <div className="font-bold mb-2">错误信息:</div>
                  <div className="mb-4">{this.state.error.message}</div>
                  
                  <div className="font-bold mb-2">错误堆栈:</div>
                  <pre className="whitespace-pre-wrap">
                    {this.state.error.stack}
                  </pre>
                  
                  {this.state.errorInfo && (
                    <>
                      <div className="font-bold mb-2 mt-4">组件堆栈:</div>
                      <pre className="whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </>
                  )}
                </div>
              </details>
            )}
          </div>
          
          <div className="mt-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700 transition-colors"
            >
              刷新页面
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
