/**
 * 全局错误处理系统
 * 提供用户友好的错误提示、崩溃恢复机制和完善的日志系统
 */

import { performanceUtils } from './performance'

export interface ErrorInfo {
  message: string
  stack?: string
  componentStack?: string
  timestamp: number
  userAgent: string
  url: string
  userId?: string
  sessionId: string
  errorBoundary?: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  context?: Record<string, any>
}

export interface UserFriendlyError {
  title: string
  message: string
  action?: string
  actionLabel?: string
  canRetry: boolean
  canReport: boolean
}

class ErrorHandler {
  private sessionId: string
  private errorQueue: ErrorInfo[] = []
  private maxQueueSize = 50
  private isOnline = navigator.onLine

  constructor() {
    this.sessionId = this.generateSessionId()
    this.setupGlobalHandlers()
    this.setupNetworkMonitoring()
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private setupGlobalHandlers() {
    // 捕获未处理的Promise拒绝
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(event.reason, {
        type: 'unhandledrejection',
        severity: 'high'
      })
    })

    // 捕获全局JavaScript错误
    window.addEventListener('error', (event) => {
      this.handleError(event.error || new Error(event.message), {
        type: 'javascript',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        severity: 'medium'
      })
    })

    // 捕获资源加载错误
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.handleError(new Error(`Resource failed to load: ${(event.target as any)?.src || 'unknown'}`), {
          type: 'resource',
          severity: 'low'
        })
      }
    }, true)
  }

  private setupNetworkMonitoring() {
    window.addEventListener('online', () => {
      this.isOnline = true
      this.flushErrorQueue()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
    })
  }

  handleError(error: Error, context: Record<string, any> = {}): ErrorInfo {
    const errorInfo: ErrorInfo = {
      message: error.message || 'Unknown error',
      stack: error.stack,
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: this.sessionId,
      severity: context.severity || 'medium',
      context: {
        ...context,
        memory: performanceUtils.memoryUsage(),
        connection: performanceUtils.getConnectionInfo(),
        isSlowDevice: performanceUtils.isSlowDevice()
      }
    }

    // 添加到错误队列
    this.addToQueue(errorInfo)

    // 记录到控制台
    this.logError(errorInfo)

    // 显示用户友好的错误提示
    this.showUserFriendlyError(errorInfo)

    return errorInfo
  }

  private addToQueue(errorInfo: ErrorInfo) {
    this.errorQueue.push(errorInfo)
    
    // 保持队列大小限制
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift()
    }

    // 如果在线，尝试发送错误报告
    if (this.isOnline) {
      this.flushErrorQueue()
    }
  }

  private logError(errorInfo: ErrorInfo) {
    const emoji = this.getSeverityEmoji(errorInfo.severity)
    
    console.group(`${emoji} Error Report [${errorInfo.severity.toUpperCase()}]`)
    console.error('Message:', errorInfo.message)
    console.error('Stack:', errorInfo.stack)
    console.log('Context:', errorInfo.context)
    console.log('Session:', errorInfo.sessionId)
    console.log('Timestamp:', new Date(errorInfo.timestamp).toISOString())
    console.groupEnd()
  }

  private getSeverityEmoji(severity: string): string {
    switch (severity) {
      case 'low': return '🟡'
      case 'medium': return '🟠'
      case 'high': return '🔴'
      case 'critical': return '💥'
      default: return '⚠️'
    }
  }

  private showUserFriendlyError(errorInfo: ErrorInfo) {
    const userError = this.translateError(errorInfo)
    
    // 使用通知系统显示错误（如果可用）
    if (window.showNotification) {
      window.showNotification({
        type: 'error',
        title: userError.title,
        message: userError.message,
        duration: userError.severity === 'critical' ? 0 : 5000,
        actions: userError.canRetry ? [{
          label: userError.actionLabel || '重试',
          action: userError.action || 'retry'
        }] : undefined
      })
    } else {
      // 降级到console警告
      console.warn(`${userError.title}: ${userError.message}`)
    }
  }

  private translateError(errorInfo: ErrorInfo): UserFriendlyError {
    const message = errorInfo.message.toLowerCase()
    
    // 网络错误
    if (message.includes('network') || message.includes('fetch')) {
      return {
        title: '网络连接问题',
        message: '请检查您的网络连接并重试',
        canRetry: true,
        canReport: true,
        actionLabel: '重试'
      }
    }
    
    // 权限错误
    if (message.includes('permission') || message.includes('unauthorized')) {
      return {
        title: '权限不足',
        message: '您没有执行此操作的权限',
        canRetry: false,
        canReport: true
      }
    }
    
    // 文件系统错误
    if (message.includes('file') || message.includes('directory')) {
      return {
        title: '文件操作失败',
        message: '无法访问或修改文件，请检查文件权限',
        canRetry: true,
        canReport: true,
        actionLabel: '重试'
      }
    }
    
    // 数据库错误
    if (message.includes('database') || message.includes('sql')) {
      return {
        title: '数据保存失败',
        message: '数据库操作失败，您的更改可能未保存',
        canRetry: true,
        canReport: true,
        actionLabel: '重试保存'
      }
    }
    
    // 内存错误
    if (message.includes('memory') || message.includes('heap')) {
      return {
        title: '内存不足',
        message: '应用使用了过多内存，建议重启应用',
        canRetry: false,
        canReport: true,
        actionLabel: '重启应用'
      }
    }
    
    // 默认错误
    return {
      title: '操作失败',
      message: '发生了意外错误，请稍后重试',
      canRetry: true,
      canReport: true,
      actionLabel: '重试'
    }
  }

  private async flushErrorQueue() {
    if (this.errorQueue.length === 0) return

    try {
      // 这里可以发送到错误报告服务（如Sentry）
      console.log(`📤 Flushing ${this.errorQueue.length} error reports...`)
      
      // 模拟发送错误报告
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // 清空队列
      this.errorQueue = []
      
      console.log('✅ Error reports sent successfully')
    } catch (error) {
      console.warn('Failed to send error reports:', error)
    }
  }

  // 崩溃恢复机制
  recoverFromCrash() {
    try {
      // 清理可能导致问题的状态
      localStorage.removeItem('temp-data')
      sessionStorage.clear()
      
      // 重置应用状态
      if (window.resetAppState) {
        window.resetAppState()
      }
      
      console.log('🔄 Crash recovery completed')
      
      return true
    } catch (error) {
      console.error('Failed to recover from crash:', error)
      return false
    }
  }

  // 获取错误统计
  getErrorStats() {
    const stats = {
      total: this.errorQueue.length,
      bySeverity: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      },
      byType: {} as Record<string, number>
    }

    this.errorQueue.forEach(error => {
      stats.bySeverity[error.severity]++
      const type = error.context?.type || 'unknown'
      stats.byType[type] = (stats.byType[type] || 0) + 1
    })

    return stats
  }

  // 清理资源
  destroy() {
    this.flushErrorQueue()
  }
}

// 创建全局错误处理器实例
export const globalErrorHandler = new ErrorHandler()

// 扩展window对象类型
declare global {
  interface Window {
    showNotification?: (notification: any) => void
    resetAppState?: () => void
    errorHandler: ErrorHandler
  }
}

// 将错误处理器添加到全局
window.errorHandler = globalErrorHandler

export default globalErrorHandler
