/**
 * 加载动画组件
 * 提供统一的加载状态指示器
 */

import React from 'react'

interface LoadingSpinnerProps {
  /** 尺寸 */
  size?: 'small' | 'medium' | 'large'
  /** 颜色 */
  color?: 'primary' | 'secondary' | 'white' | 'gray'
  /** 自定义类名 */
  className?: string
  /** 显示文本 */
  text?: string
}

/**
 * 加载动画组件
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = 'primary',
  className = '',
  text
}) => {
  // 尺寸映射
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
    large: 'w-8 h-8'
  }

  // 颜色映射
  const colorClasses = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    white: 'text-white',
    gray: 'text-gray-400'
  }

  return (
    <div className={`flex items-center ${className}`}>
      <svg
        className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      {text && (
        <span className={`ml-2 text-sm ${colorClasses[color]}`}>
          {text}
        </span>
      )}
    </div>
  )
}

export default LoadingSpinner
