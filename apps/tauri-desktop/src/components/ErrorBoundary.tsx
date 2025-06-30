import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { invoke } from '@tauri-apps/api/tauri'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorType: ErrorType
  recoveryAttempts: number
}

enum ErrorType {
  NETWORK = 'network',
  DATABASE = 'database',
  RENDERING = 'rendering',
  STATE = 'state',
  UNKNOWN = 'unknown'
}

interface ErrorData {
  type: ErrorType
  message: string
  stack?: string
  componentStack?: string
  timestamp: string
  recoveryAttempts: number
}

class ErrorBoundary extends Component<Props, State> {
  private readonly MAX_RECOVERY_ATTEMPTS = 3
  private readonly AUTO_RECOVERY_TYPES = [ErrorType.NETWORK, ErrorType.STATE]

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorType: ErrorType.UNKNOWN,
      recoveryAttempts: 0
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    }
  }

  private classifyError(error: Error): ErrorType {
    if (error.message.includes('network') || error.message.includes('fetch')) {
      return ErrorType.NETWORK
    }
    if (error.message.includes('database') || error.message.includes('sql')) {
      return ErrorType.DATABASE
    }
    if (error.message.includes('render') || error.stack?.includes('render')) {
      return ErrorType.RENDERING
    }
    if (error.message.includes('state') || error.message.includes('props')) {
      return ErrorType.STATE
    }
    return ErrorType.UNKNOWN
  }

  private async persistError(errorData: ErrorData): Promise<void> {
    try {
      await invoke('log_error', { error: errorData })
      
      // 如果错误很严重，发送到错误跟踪服务
      if (errorData.type === ErrorType.DATABASE || 
          errorData.recoveryAttempts >= this.MAX_RECOVERY_ATTEMPTS) {
        await invoke('report_critical_error', { error: errorData })
      }
    } catch (e) {
      console.error('Failed to persist error:', e)
    }
  }

  private canAutoRecover(errorType: ErrorType): boolean {
    return this.AUTO_RECOVERY_TYPES.includes(errorType) && 
           this.state.recoveryAttempts < this.MAX_RECOVERY_ATTEMPTS
  }

  private async handleAutoRecovery(): Promise<void> {
    const { errorType } = this.state
    
    try {
      switch (errorType) {
        case ErrorType.NETWORK:
          await invoke('retry_network_requests')
          break
        case ErrorType.STATE:
          await invoke('reset_app_state')
          break
        default:
          return
      }

      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        recoveryAttempts: prevState.recoveryAttempts + 1
      }))
    } catch (e) {
      console.error('Auto recovery failed:', e)
    }
  }

  async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorType = this.classifyError(error)
    
    const errorData: ErrorData = {
      type: errorType,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      recoveryAttempts: this.state.recoveryAttempts
    }

    // 更新状态
    this.setState({
      error,
      errorInfo,
      errorType
    })

    // 持久化错误信息
    await this.persistError(errorData)

    // 尝试自动恢复
    if (this.canAutoRecover(errorType)) {
      await this.handleAutoRecovery()
    }
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      recoveryAttempts: 0
    })
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="h-full flex items-center justify-center bg-gray-50 p-6">
          <div className="max-w-lg w-full text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-error-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-error-600" />
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {this.state.errorType === ErrorType.NETWORK 
                ? '网络连接错误'
                : this.state.errorType === ErrorType.DATABASE
                ? '数据库操作错误'
                : '发生了意外错误'}
            </h1>
            
            <p className="text-gray-600 mb-6">
              {this.state.errorType === ErrorType.NETWORK
                ? '请检查您的网络连接并重试'
                : this.state.errorType === ErrorType.DATABASE
                ? '数据库操作失败，请联系技术支持'
                : '我们遇到了一个问题，但您的数据是安全的'}
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-gray-100 rounded-lg text-left">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  错误详情：
                </h3>
                <pre className="text-xs text-gray-700 overflow-auto max-h-32">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="btn-primary flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>重新加载</span>
              </button>
              <button
                onClick={this.handleGoHome}
                className="btn-secondary flex items-center justify-center space-x-2"
              >
                <Home className="w-4 h-4" />
                <span>返回首页</span>
              </button>
            </div>

            <div className="mt-8 text-sm text-gray-500">
              <p>
                如果问题持续存在，请{' '}
                <a
                  href="https://github.com/MMR-MINGriyue/MingLog/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700 underline"
                >
                  报告问题
                </a>
              </p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

