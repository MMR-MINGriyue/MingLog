/**
 * MingLog 错误边界组件
 * 提供错误捕获、错误报告和用户友好的错误界面
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';

export interface ErrorInfo {
  /** 错误对象 */
  error: Error;
  /** 错误信息 */
  errorInfo: ErrorInfo;
  /** 错误ID */
  errorId: string;
  /** 发生时间 */
  timestamp: Date;
  /** 用户代理 */
  userAgent: string;
  /** 页面URL */
  url: string;
  /** 用户ID（如果有） */
  userId?: string;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  /** 错误回调函数 */
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void;
  /** 自定义错误UI */
  fallback?: (error: Error, errorInfo: ErrorInfo, retry: () => void) => ReactNode;
  /** 是否启用错误报告 */
  enableReporting?: boolean;
  /** 最大重试次数 */
  maxRetries?: number;
  /** 组件名称（用于错误报告） */
  componentName?: string;
  /** 是否在开发模式下显示详细错误 */
  showDetailedError?: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: generateErrorId()
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, enableReporting = true, componentName } = this.props;
    const errorId = this.state.errorId || generateErrorId();

    this.setState({
      errorInfo,
      errorId
    });

    // 创建错误报告
    const errorReport: ErrorInfo = {
      error,
      errorInfo,
      errorId,
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: getCurrentUserId()
    };

    // 调用错误回调
    if (onError) {
      onError(error, errorInfo, errorId);
    }

    // 发送错误报告
    if (enableReporting) {
      this.reportError(errorReport, componentName);
    }

    // 记录到控制台
    console.group(`🚨 Error Boundary: ${componentName || 'Unknown Component'}`);
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Error ID:', errorId);
    console.groupEnd();
  }

  private async reportError(errorReport: ErrorInfo, componentName?: string) {
    try {
      // 发送到错误监控服务
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...errorReport,
          componentName,
          level: 'error',
          tags: {
            component: componentName,
            boundary: 'react-error-boundary'
          }
        })
      });
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }
  }

  private handleRetry = () => {
    const { maxRetries = 3 } = this.props;
    const { retryCount } = this.state;

    if (retryCount < maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null,
        retryCount: prevState.retryCount + 1
      }));

      // 延迟重试，避免立即重复错误
      this.retryTimeoutId = window.setTimeout(() => {
        // 强制重新渲染
        this.forceUpdate();
      }, 1000);
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  componentWillUnmount() {
    if (this.retryTimeoutId) {
      clearTimeout(this.retryTimeoutId);
    }
  }

  render() {
    const { hasError, error, errorInfo, retryCount } = this.state;
    const { children, fallback, maxRetries = 3, showDetailedError = false } = this.props;

    if (hasError && error) {
      // 使用自定义错误UI
      if (fallback) {
        return fallback(error, errorInfo!, this.handleRetry);
      }

      // 默认错误UI
      return (
        <ErrorFallback
          error={error}
          errorInfo={errorInfo!}
          onRetry={this.handleRetry}
          onReload={this.handleReload}
          retryCount={retryCount}
          maxRetries={maxRetries}
          showDetailedError={showDetailedError}
        />
      );
    }

    return children;
  }
}

// 默认错误回退组件
interface ErrorFallbackProps {
  error: Error;
  errorInfo: ErrorInfo;
  onRetry: () => void;
  onReload: () => void;
  retryCount: number;
  maxRetries: number;
  showDetailedError: boolean;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  onRetry,
  onReload,
  retryCount,
  maxRetries,
  showDetailedError
}) => {
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <div
      style={{
        padding: '40px 20px',
        textAlign: 'center',
        backgroundColor: '#fff5f5',
        border: '1px solid #fed7d7',
        borderRadius: '8px',
        margin: '20px',
        maxWidth: '600px',
        marginLeft: 'auto',
        marginRight: 'auto'
      }}
      role="alert"
      aria-labelledby="error-title"
    >
      <div style={{ fontSize: '48px', marginBottom: '16px' }}>😵</div>
      
      <h2
        id="error-title"
        style={{
          color: '#c53030',
          fontSize: '24px',
          marginBottom: '16px',
          fontWeight: '600'
        }}
      >
        哎呀，出现了一个错误
      </h2>

      <p
        style={{
          color: '#4a5568',
          fontSize: '16px',
          marginBottom: '24px',
          lineHeight: '1.5'
        }}
      >
        很抱歉，应用遇到了一个意外错误。我们已经记录了这个问题，正在努力修复。
      </p>

      <div style={{ marginBottom: '24px' }}>
        {retryCount < maxRetries ? (
          <button
            onClick={onRetry}
            style={{
              backgroundColor: '#3182ce',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '6px',
              fontSize: '16px',
              cursor: 'pointer',
              marginRight: '12px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#2c5aa0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#3182ce';
            }}
          >
            重试 {retryCount > 0 && `(${retryCount}/${maxRetries})`}
          </button>
        ) : (
          <p style={{ color: '#e53e3e', marginBottom: '16px' }}>
            已达到最大重试次数，请刷新页面。
          </p>
        )}

        <button
          onClick={onReload}
          style={{
            backgroundColor: '#38a169',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '6px',
            fontSize: '16px',
            cursor: 'pointer',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2f855a';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#38a169';
          }}
        >
          刷新页面
        </button>
      </div>

      {(showDetailedError || process.env.NODE_ENV === 'development') && (
        <div style={{ textAlign: 'left' }}>
          <button
            onClick={() => setShowDetails(!showDetails)}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid #cbd5e0',
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
              marginBottom: '16px',
              fontSize: '14px'
            }}
          >
            {showDetails ? '隐藏' : '显示'}错误详情
          </button>

          {showDetails && (
            <details
              style={{
                backgroundColor: '#f7fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                padding: '16px'
              }}
              open
            >
              <summary style={{ fontWeight: '600', marginBottom: '12px' }}>
                错误详情
              </summary>
              
              <div style={{ marginBottom: '16px' }}>
                <strong>错误消息:</strong>
                <pre
                  style={{
                    backgroundColor: '#fed7d7',
                    padding: '8px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    overflow: 'auto',
                    marginTop: '4px'
                  }}
                >
                  {error.message}
                </pre>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <strong>错误堆栈:</strong>
                <pre
                  style={{
                    backgroundColor: '#f7fafc',
                    padding: '8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    overflow: 'auto',
                    marginTop: '4px',
                    maxHeight: '200px'
                  }}
                >
                  {error.stack}
                </pre>
              </div>

              <div>
                <strong>组件堆栈:</strong>
                <pre
                  style={{
                    backgroundColor: '#f7fafc',
                    padding: '8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    overflow: 'auto',
                    marginTop: '4px',
                    maxHeight: '200px'
                  }}
                >
                  {errorInfo.componentStack}
                </pre>
              </div>
            </details>
          )}
        </div>
      )}

      <div
        style={{
          marginTop: '24px',
          padding: '16px',
          backgroundColor: '#edf2f7',
          borderRadius: '6px',
          fontSize: '14px',
          color: '#4a5568'
        }}
      >
        <p style={{ margin: 0 }}>
          如果问题持续存在，请联系技术支持并提供错误ID：
          <code
            style={{
              backgroundColor: '#e2e8f0',
              padding: '2px 6px',
              borderRadius: '3px',
              fontFamily: 'monospace',
              marginLeft: '8px'
            }}
          >
            {generateErrorId()}
          </code>
        </p>
      </div>
    </div>
  );
};

// 工具函数
function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getCurrentUserId(): string | undefined {
  // 从应用状态或localStorage获取用户ID
  try {
    const user = localStorage.getItem('minglog-user');
    return user ? JSON.parse(user).id : undefined;
  } catch {
    return undefined;
  }
}

// 高阶组件包装器
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

// 错误边界钩子
export function useErrorHandler() {
  return React.useCallback((error: Error, errorInfo?: any) => {
    // 手动触发错误边界
    throw error;
  }, []);
}

// 异步错误处理钩子
export function useAsyncError() {
  const [, setError] = React.useState();
  
  return React.useCallback((error: Error) => {
    setError(() => {
      throw error;
    });
  }, []);
}

export default ErrorBoundary;
