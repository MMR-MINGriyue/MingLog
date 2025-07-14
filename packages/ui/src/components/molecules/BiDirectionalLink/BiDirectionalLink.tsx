/**
 * 双向链接组件
 * 
 * 功能：
 * - 可点击跳转的链接显示
 * - 悬停预览功能
 * - 链接状态指示（存在/不存在）
 * - 支持别名显示
 * - 主题适配和样式定制
 */

import React, { useState, useRef, useCallback } from 'react'
import { cn } from '../../../utils/classNames'
import { useTheme } from '../../../contexts/ThemeContext'

export interface BiDirectionalLinkProps {
  /** 页面名称 */
  pageName: string
  /** 显示文本（可选，用于别名） */
  displayText?: string
  /** 链接是否存在 */
  exists?: boolean
  /** 点击回调 */
  onClick?: (pageName: string) => void
  /** 悬停预览回调 */
  onPreview?: (pageName: string) => Promise<string | null>
  /** 自定义样式类名 */
  className?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 链接类型 */
  variant?: 'default' | 'alias' | 'broken'
  /** 大小 */
  size?: 'sm' | 'md' | 'lg'
  /** 是否显示图标 */
  showIcon?: boolean
}

export interface PreviewContent {
  title: string
  content: string
  lastModified?: string
}

export const BiDirectionalLink: React.FC<BiDirectionalLinkProps> = ({
  pageName,
  displayText,
  exists = true,
  onClick,
  onPreview,
  className,
  disabled = false,
  variant = 'default',
  size = 'md',
  showIcon = true
}) => {
  const { theme } = useTheme()
  const [isHovered, setIsHovered] = useState(false)
  const [previewContent, setPreviewContent] = useState<string | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const hoverTimeoutRef = useRef<NodeJS.Timeout>()
  const previewTimeoutRef = useRef<NodeJS.Timeout>()

  // 显示的文本
  const displayedText = displayText || pageName

  // 处理点击事件
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    if (disabled || !onClick) return
    onClick(pageName)
  }, [disabled, onClick, pageName])

  // 处理鼠标进入
  const handleMouseEnter = useCallback(() => {
    if (disabled || !onPreview) return
    
    setIsHovered(true)
    
    // 延迟显示预览
    hoverTimeoutRef.current = setTimeout(async () => {
      setIsLoadingPreview(true)
      try {
        const content = await onPreview(pageName)
        setPreviewContent(content)
      } catch (error) {
        console.error('Failed to load preview:', error)
        setPreviewContent(null)
      } finally {
        setIsLoadingPreview(false)
      }
    }, 500) // 500ms延迟
  }, [disabled, onPreview, pageName])

  // 处理鼠标离开
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false)
    
    // 清除悬停定时器
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    
    // 延迟隐藏预览
    previewTimeoutRef.current = setTimeout(() => {
      setPreviewContent(null)
      setIsLoadingPreview(false)
    }, 200) // 200ms延迟隐藏
  }, [])

  // 处理预览区域鼠标进入（保持预览显示）
  const handlePreviewMouseEnter = useCallback(() => {
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current)
    }
  }, [])

  // 处理预览区域鼠标离开
  const handlePreviewMouseLeave = useCallback(() => {
    setPreviewContent(null)
    setIsLoadingPreview(false)
  }, [])

  // 样式类名
  const linkClasses = cn(
    // 基础样式
    'inline-flex items-center gap-1 relative cursor-pointer transition-all duration-200',
    'border-b border-dashed hover:border-solid',
    'focus:outline-none focus:ring-2 focus:ring-offset-1',
    
    // 大小变体
    {
      'text-sm': size === 'sm',
      'text-base': size === 'md',
      'text-lg': size === 'lg'
    },
    
    // 状态变体
    {
      // 默认链接
      'text-blue-600 border-blue-300 hover:text-blue-700 hover:border-blue-500 focus:ring-blue-500': 
        variant === 'default' && exists && !disabled,
      
      // 别名链接
      'text-purple-600 border-purple-300 hover:text-purple-700 hover:border-purple-500 focus:ring-purple-500': 
        variant === 'alias' && exists && !disabled,
      
      // 断开的链接
      'text-red-600 border-red-300 hover:text-red-700 hover:border-red-500 focus:ring-red-500': 
        (variant === 'broken' || !exists) && !disabled,
      
      // 禁用状态
      'text-gray-400 border-gray-200 cursor-not-allowed': disabled
    },
    
    // 暗色主题适配
    theme === 'dark' && {
      'text-blue-400 border-blue-600 hover:text-blue-300 hover:border-blue-400': 
        variant === 'default' && exists && !disabled,
      'text-purple-400 border-purple-600 hover:text-purple-300 hover:border-purple-400': 
        variant === 'alias' && exists && !disabled,
      'text-red-400 border-red-600 hover:text-red-300 hover:border-red-400': 
        (variant === 'broken' || !exists) && !disabled,
      'text-gray-600 border-gray-700': disabled
    },
    
    className
  )

  // 图标组件
  const LinkIcon = () => {
    if (!showIcon) return null
    
    const iconClasses = cn(
      'w-3 h-3 flex-shrink-0',
      {
        'text-blue-500': variant === 'default' && exists,
        'text-purple-500': variant === 'alias' && exists,
        'text-red-500': variant === 'broken' || !exists,
        'text-gray-400': disabled
      }
    )
    
    if (variant === 'broken' || !exists) {
      return (
        <svg className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      )
    }
    
    return (
      <svg className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    )
  }

  return (
    <span className="relative inline-block">
      <span
        className={linkClasses}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        tabIndex={disabled ? -1 : 0}
        role="link"
        aria-label={`链接到 ${pageName}${displayText ? ` (显示为: ${displayText})` : ''}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleClick(e as any)
          }
        }}
      >
        <LinkIcon />
        <span>{displayedText}</span>
      </span>

      {/* 预览弹窗 */}
      {(isHovered && (previewContent || isLoadingPreview)) && (
        <div
          className={cn(
            'absolute z-50 mt-2 p-3 bg-white border border-gray-200 rounded-lg shadow-lg',
            'min-w-64 max-w-80 text-sm',
            theme === 'dark' && 'bg-gray-800 border-gray-700 text-gray-200'
          )}
          style={{
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)'
          }}
          onMouseEnter={handlePreviewMouseEnter}
          onMouseLeave={handlePreviewMouseLeave}
        >
          {isLoadingPreview ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
              <span className="text-gray-600">加载预览...</span>
            </div>
          ) : previewContent ? (
            <div>
              <div className="font-medium text-gray-900 mb-1">
                {pageName}
              </div>
              <div className="text-gray-600 line-clamp-3">
                {previewContent}
              </div>
            </div>
          ) : (
            <div className="text-gray-500">
              无法加载预览
            </div>
          )}
        </div>
      )}
    </span>
  )
}

export default BiDirectionalLink
