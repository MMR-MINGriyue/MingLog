import React from 'react';
import { clsx } from 'clsx';

export interface ErrorMessageProps {
  title?: string;
  message: string;
  type?: 'error' | 'warning' | 'info';
  showIcon?: boolean;
  className?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  fullPage?: boolean;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title,
  message,
  type = 'error',
  showIcon = true,
  className,
  onRetry,
  onDismiss,
  fullPage = false,
}) => {
  const typeStyles = {
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-400',
      title: 'text-red-800',
      message: 'text-red-700',
      button: 'bg-red-100 text-red-800 hover:bg-red-200',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: 'text-yellow-400',
      title: 'text-yellow-800',
      message: 'text-yellow-700',
      button: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-400',
      title: 'text-blue-800',
      message: 'text-blue-700',
      button: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
    },
  };

  const icons = {
    error: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    ),
    warning: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
  };

  const styles = typeStyles[type];

  const content = (
    <div className={clsx(
      'rounded-lg border p-4',
      styles.bg,
      styles.border,
      className
    )}>
      <div className="flex">
        {showIcon && (
          <div className={clsx('flex-shrink-0', styles.icon)}>
            {icons[type]}
          </div>
        )}
        <div className={clsx('flex-1', showIcon && 'ml-3')}>
          {title && (
            <h3 className={clsx('text-sm font-medium', styles.title)}>
              {title}
            </h3>
          )}
          <div className={clsx('text-sm', title ? 'mt-2' : '', styles.message)}>
            <p>{message}</p>
          </div>
          {(onRetry || onDismiss) && (
            <div className="mt-4 flex space-x-3">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className={clsx(
                    'text-sm font-medium px-3 py-1 rounded-md transition-colors',
                    styles.button
                  )}
                >
                  重试
                </button>
              )}
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="text-sm font-medium text-gray-600 hover:text-gray-800"
                >
                  忽略
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          {content}
        </div>
      </div>
    );
  }

  return content;
};

// Network error component
export const NetworkError: React.FC<{ onRetry?: () => void }> = ({ onRetry }) => {
  return (
    <ErrorMessage
      title="网络连接错误"
      message="无法连接到服务器，请检查您的网络连接。"
      type="error"
      onRetry={onRetry}
      fullPage
    />
  );
};

// Not found error component
export const NotFoundError: React.FC<{ 
  title?: string;
  message?: string;
  onGoBack?: () => void;
}> = ({ 
  title = "页面未找到",
  message = "抱歉，您访问的页面不存在。",
  onGoBack
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-300">404</h1>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">{title}</h2>
        <p className="text-gray-600 mb-8">{message}</p>
        {onGoBack && (
          <button
            onClick={onGoBack}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            返回首页
          </button>
        )}
      </div>
    </div>
  );
};

// Permission denied error component
export const PermissionDeniedError: React.FC<{ onLogin?: () => void }> = ({ onLogin }) => {
  return (
    <ErrorMessage
      title="权限不足"
      message="您没有权限访问此内容，请登录后重试。"
      type="warning"
      onRetry={onLogin}
      fullPage
    />
  );
};
