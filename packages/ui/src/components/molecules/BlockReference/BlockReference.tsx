/**
 * 块引用组件
 * 
 * 功能：
 * - 可点击跳转的块引用显示
 * - 悬停预览功能
 * - 块引用状态指示（存在/不存在）
 * - 支持多种显示模式
 * - 主题适配和样式定制
 */

import React, { useState, useRef, useCallback } from 'react'
import { cn } from '../../../utils/classNames'
import { useTheme } from '../../../contexts/ThemeContext'

export interface BlockReferenceProps {
  /** 块ID */
  blockId: string
  /** 显示文本（可选，用于自定义显示） */
  displayText?: string
  /** 块是否存在 */
  exists?: boolean
  /** 点击回调 */
  onClick?: (blockId: string) => void
  /** 悬停预览回调 */
  onPreview?: (blockId: string) => Promise<string | null>
  /** 自定义样式类名 */
  className?: string
  /** 是否禁用 */
  disabled?: boolean
  /** 块引用类型 */
  variant?: 'default' | 'embed' | 'mention' | 'broken'
  /** 大小 */
  size?: 'sm' | 'md' | 'lg'
  /** 是否显示图标 */
  showIcon?: boolean
  /** 显示模式 */
  displayMode?: 'inline' | 'block' | 'card'
  /** 块类型 */
  blockType?: 'paragraph' | 'heading' | 'list' | 'code' | 'quote'
  /** 块内容预览 */
  blockContent?: string
}

export const BlockReference: React.FC<BlockReferenceProps> = ({
  blockId,
  displayText,
  exists = true,
  onClick,
  onPreview,
  className,
  disabled = false,
  variant = 'default',
  size = 'md',
  showIcon = true,
  displayMode = 'inline',
  blockType = 'paragraph',
  blockContent
}) => {
  const { theme } = useTheme()
  const [isHovered, setIsHovered] = useState(false)
  const [previewContent, setPreviewContent] = useState<string | null>(null)
  const [isLoadingPreview, setIsLoadingPreview] = useState(false)
  const hoverTimeoutRef = useRef<NodeJS.Timeout>()
  const previewTimeoutRef = useRef<NodeJS.Timeout>()

  // 显示的文本
  const displayedText = displayText || blockContent?.slice(0, 50) || `块 ${blockId.slice(0, 8)}...`

  // 处理点击事件
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    if (disabled || !onClick) return
    onClick(blockId)
  }, [disabled, onClick, blockId])

  // 处理鼠标进入
  const handleMouseEnter = useCallback(() => {
    if (disabled || !onPreview) return

    // 清除之前的定时器
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current)
    }

    // 设置悬停状态
    setIsHovered(true)

    // 延迟显示预览
    hoverTimeoutRef.current = setTimeout(async () => {
      if (!isLoadingPreview) {
        setIsLoadingPreview(true)
        try {
          const content = await onPreview(blockId)
          setPreviewContent(content)
        } catch (error) {
          console.error('Failed to load block preview:', error)
          setPreviewContent(null)
        } finally {
          setIsLoadingPreview(false)
        }
      }
    }, 500) // 500ms 延迟
  }, [disabled, onPreview, blockId, isLoadingPreview])

  // 处理鼠标离开
  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }

    // 延迟隐藏预览
    previewTimeoutRef.current = setTimeout(() => {
      setIsHovered(false)
      setPreviewContent(null)
    }, 200) // 200ms 延迟隐藏
  }, [])

  // 清理定时器
  React.useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
      if (previewTimeoutRef.current) {
        clearTimeout(previewTimeoutRef.current)
      }
    }
  }, [])

  // 基础样式类
  const baseClasses = cn(
    'inline-flex items-center gap-1 px-2 py-1 rounded-md border transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-1',
    {
      'cursor-pointer hover:shadow-sm': !disabled && onClick,
      'cursor-default': disabled || !onClick
    },
    
    // 大小变体
    {
      'text-xs px-1.5 py-0.5': size === 'sm',
      'text-sm px-2 py-1': size === 'md',
      'text-base px-3 py-1.5': size === 'lg'
    },
    
    // 状态变体
    {
      // 默认块引用
      'text-green-600 border-green-300 hover:text-green-700 hover:border-green-500 focus:ring-green-500 bg-green-50': 
        variant === 'default' && exists && !disabled,
      
      // 嵌入块引用
      'text-blue-600 border-blue-300 hover:text-blue-700 hover:border-blue-500 focus:ring-blue-500 bg-blue-50': 
        variant === 'embed' && exists && !disabled,
      
      // 提及块引用
      'text-purple-600 border-purple-300 hover:text-purple-700 hover:border-purple-500 focus:ring-purple-500 bg-purple-50': 
        variant === 'mention' && exists && !disabled,
      
      // 断开的块引用
      'text-red-600 border-red-300 hover:text-red-700 hover:border-red-500 focus:ring-red-500 bg-red-50': 
        (variant === 'broken' || !exists) && !disabled,
      
      // 禁用状态
      'text-gray-400 border-gray-200 cursor-not-allowed bg-gray-50': disabled
    },
    
    // 暗色主题适配
    theme === 'dark' && {
      'text-green-400 border-green-600 hover:text-green-300 hover:border-green-400 bg-green-900/20': 
        variant === 'default' && exists && !disabled,
      'text-blue-400 border-blue-600 hover:text-blue-300 hover:border-blue-400 bg-blue-900/20': 
        variant === 'embed' && exists && !disabled,
      'text-purple-400 border-purple-600 hover:text-purple-300 hover:border-purple-400 bg-purple-900/20': 
        variant === 'mention' && exists && !disabled,
      'text-red-400 border-red-600 hover:text-red-300 hover:border-red-400 bg-red-900/20': 
        (variant === 'broken' || !exists) && !disabled,
      'text-gray-600 border-gray-700 bg-gray-800': disabled
    },
    
    className
  )

  // 块模式样式
  const blockClasses = cn(
    'block w-full p-3 rounded-lg border-2 transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    {
      'cursor-pointer hover:shadow-md': !disabled && onClick,
      'cursor-default': disabled || !onClick
    },
    
    // 状态变体
    {
      'border-green-200 hover:border-green-400 focus:ring-green-500 bg-green-50': 
        variant === 'default' && exists && !disabled,
      'border-blue-200 hover:border-blue-400 focus:ring-blue-500 bg-blue-50': 
        variant === 'embed' && exists && !disabled,
      'border-purple-200 hover:border-purple-400 focus:ring-purple-500 bg-purple-50': 
        variant === 'mention' && exists && !disabled,
      'border-red-200 hover:border-red-400 focus:ring-red-500 bg-red-50': 
        (variant === 'broken' || !exists) && !disabled,
      'border-gray-200 bg-gray-50': disabled
    },
    
    // 暗色主题适配
    theme === 'dark' && {
      'border-green-700 hover:border-green-500 bg-green-900/20': 
        variant === 'default' && exists && !disabled,
      'border-blue-700 hover:border-blue-500 bg-blue-900/20': 
        variant === 'embed' && exists && !disabled,
      'border-purple-700 hover:border-purple-500 bg-purple-900/20': 
        variant === 'mention' && exists && !disabled,
      'border-red-700 hover:border-red-500 bg-red-900/20': 
        (variant === 'broken' || !exists) && !disabled,
      'border-gray-700 bg-gray-800': disabled
    },
    
    className
  )

  // 图标组件
  const BlockIcon = () => {
    if (!showIcon) return null
    
    const iconClasses = cn(
      'w-3 h-3 flex-shrink-0',
      {
        'text-green-500': variant === 'default' && exists,
        'text-blue-500': variant === 'embed' && exists,
        'text-purple-500': variant === 'mention' && exists,
        'text-red-500': variant === 'broken' || !exists,
        'text-gray-400': disabled
      }
    )
    
    // 根据块类型显示不同图标
    if (variant === 'broken' || !exists) {
      return (
        <svg className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      )
    }

    // 根据块类型显示图标
    switch (blockType) {
      case 'heading':
        return (
          <svg className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        )
      case 'list':
        return (
          <svg className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        )
      case 'code':
        return (
          <svg className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        )
      case 'quote':
        return (
          <svg className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
        )
      default:
        return (
          <svg className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
    }
  }

  // 预览提示组件
  const PreviewTooltip = () => {
    if (!isHovered || disabled) return null

    return (
      <div className={cn(
        'absolute z-50 p-3 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-w-sm',
        'transform -translate-x-1/2 left-1/2',
        theme === 'dark' && 'bg-gray-800 border-gray-700 text-white'
      )}>
        {isLoadingPreview ? (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
            <span>加载中...</span>
          </div>
        ) : previewContent ? (
          <div className="text-sm">
            <div className={cn(
              'font-medium mb-1',
              theme === 'dark' ? 'text-gray-100' : 'text-gray-900'
            )}>
              块 {blockId.slice(0, 8)}...
            </div>
            <div className={cn(
              'line-clamp-3',
              theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
            )}>
              {previewContent}
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-500">
            无法加载预览
          </div>
        )}
      </div>
    )
  }

  // 内联模式渲染
  if (displayMode === 'inline') {
    return (
      <span className="relative inline-block">
        <span
          className={baseClasses}
          onClick={handleClick}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          tabIndex={disabled ? -1 : 0}
          role="link"
          aria-label={`块引用 ${blockId}${displayText ? ` (显示为: ${displayText})` : ''}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              handleClick(e as any)
            }
          }}
        >
          <BlockIcon />
          <span className="truncate max-w-xs">{displayedText}</span>
        </span>
        <PreviewTooltip />
      </span>
    )
  }

  // 块模式和卡片模式渲染
  return (
    <div className="relative">
      <div
        className={blockClasses}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        tabIndex={disabled ? -1 : 0}
        role="link"
        aria-label={`块引用 ${blockId}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleClick(e as any)
          }
        }}
      >
        {displayMode === 'card' && (
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200">
            <BlockIcon />
            <span className="font-medium text-sm">
              块引用 {blockId.slice(0, 8)}...
            </span>
          </div>
        )}
        
        <div className={cn(
          'text-sm',
          displayMode === 'card' ? 'text-gray-600' : 'text-gray-700'
        )}>
          {displayedText}
        </div>
      </div>
      <PreviewTooltip />
    </div>
  )
}

export default BlockReference
