/**
 * 块引用自动补全组件
 * 
 * 功能：
 * - 智能块引用建议
 * - 键盘导航支持
 * - 块类型分类显示
 * - 块内容预览
 * - 创建新块选项
 */

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { cn } from '../../../utils/classNames'
import { useTheme } from '../../../contexts/ThemeContext'

export interface BlockSuggestion {
  /** 块ID */
  blockId: string
  /** 块内容预览 */
  preview: string
  /** 块类型 */
  blockType: 'paragraph' | 'heading' | 'list' | 'code' | 'quote' | 'image' | 'table'
  /** 所属页面 */
  pageName: string
  /** 匹配分数 */
  score: number
  /** 匹配类型 */
  matchType: 'exact' | 'prefix' | 'contains' | 'fuzzy' | 'create'
  /** 引用计数 */
  referenceCount?: number
  /** 创建时间 */
  createdAt?: string
  /** 最后修改时间 */
  updatedAt?: string
}

export interface BlockReferenceAutoCompleteProps {
  /** 搜索查询 */
  query: string
  /** 建议列表 */
  suggestions: BlockSuggestion[]
  /** 是否显示 */
  visible: boolean
  /** 位置信息 */
  position: { x: number; y: number }
  /** 选择回调 */
  onSelect: (suggestion: BlockSuggestion) => void
  /** 关闭回调 */
  onClose: () => void
  /** 是否显示创建选项 */
  showCreateOption?: boolean
  /** 最大显示项目数 */
  maxItems?: number
  /** 是否显示历史记录 */
  showHistory?: boolean
  /** 历史记录 */
  history?: BlockSuggestion[]
  /** 自定义样式类名 */
  className?: string
  /** 是否加载中 */
  loading?: boolean
}

export const BlockReferenceAutoComplete: React.FC<BlockReferenceAutoCompleteProps> = ({
  query,
  suggestions,
  visible,
  position,
  onSelect,
  onClose,
  showCreateOption = true,
  maxItems = 10,
  showHistory = false,
  history = [],
  className,
  loading = false
}) => {
  const { theme } = useTheme()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])

  // 处理的建议列表
  const processedSuggestions = React.useMemo(() => {
    let items: BlockSuggestion[] = []

    // 添加搜索结果
    if (suggestions.length > 0) {
      items = [...suggestions.slice(0, maxItems)]
    }

    // 添加历史记录（如果没有搜索结果且启用历史记录）
    if (items.length === 0 && showHistory && history.length > 0) {
      items = [...history.slice(0, maxItems)]
    }

    // 添加创建选项
    if (showCreateOption && query.trim() && !suggestions.some(s => s.matchType === 'exact')) {
      const createSuggestion: BlockSuggestion = {
        blockId: `create-${query}`,
        preview: `创建新块 "${query}"`,
        blockType: 'paragraph',
        pageName: '当前页面',
        score: 0,
        matchType: 'create'
      }
      items.push(createSuggestion)
    }

    return items
  }, [suggestions, query, maxItems, showCreateOption, showHistory, history])

  // 重置选中索引
  useEffect(() => {
    setSelectedIndex(0)
  }, [processedSuggestions])

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!visible) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => 
            prev < processedSuggestions.length - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : processedSuggestions.length - 1
          )
          break
        case 'Enter':
          e.preventDefault()
          if (processedSuggestions[selectedIndex]) {
            onSelect(processedSuggestions[selectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [visible, selectedIndex, processedSuggestions, onSelect, onClose])

  // 滚动到选中项
  useEffect(() => {
    const selectedItem = itemRefs.current[selectedIndex]
    if (selectedItem && containerRef.current && selectedItem.scrollIntoView) {
      selectedItem.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      })
    }
  }, [selectedIndex])

  // 处理点击选择
  const handleSelect = useCallback((suggestion: BlockSuggestion) => {
    onSelect(suggestion)
  }, [onSelect])

  // 获取块类型图标
  const getBlockTypeIcon = (blockType: string) => {
    const iconClasses = "w-4 h-4 flex-shrink-0"
    
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
      case 'image':
        return (
          <svg className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )
      case 'table':
        return (
          <svg className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M3 10h18M3 14h18m-9-4v8m-7 0V4a1 1 0 011-1h16a1 1 0 011 1v16a1 1 0 01-1 1H5a1 1 0 01-1-1z" />
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

  // 获取匹配类型标识
  const getMatchTypeBadge = (matchType: string) => {
    switch (matchType) {
      case 'exact':
        return <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">精确</span>
      case 'prefix':
        return <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded">前缀</span>
      case 'contains':
        return <span className="text-xs px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded">包含</span>
      case 'fuzzy':
        return <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">模糊</span>
      case 'create':
        return <span className={cn(
          "text-xs px-1.5 py-0.5 rounded",
          theme === 'dark'
            ? 'bg-orange-900/50 text-orange-300'
            : 'bg-orange-100 text-orange-700'
        )}>新建</span>
      default:
        return null
    }
  }

  if (!visible || processedSuggestions.length === 0) {
    return null
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg max-w-md w-80',
        'max-h-80 overflow-y-auto',
        theme === 'dark' && 'bg-gray-800 border-gray-700',
        className
      )}
      style={{
        left: position.x,
        top: position.y + 20
      }}
    >
      {/* 标题栏 */}
      <div className={cn(
        'px-3 py-2 border-b border-gray-200 bg-gray-50',
        theme === 'dark' && 'border-gray-700 bg-gray-900'
      )}>
        <div className="flex items-center justify-between">
          <span className={cn(
            'text-sm font-medium text-gray-700',
            theme === 'dark' && 'text-gray-300'
          )}>
            {loading ? '搜索中...' : `块引用建议 (${processedSuggestions.length})`}
          </span>
          <button
            type="button"
            onClick={onClose}
            title="关闭建议"
            aria-label="关闭建议"
            className={cn(
              'text-gray-400 hover:text-gray-600 transition-colors',
              theme === 'dark' && 'hover:text-gray-300'
            )}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* 建议列表 */}
      <div className="py-1">
        {loading ? (
          <div className="px-3 py-4 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-gray-500">
              <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
              <span>搜索块引用...</span>
            </div>
          </div>
        ) : (
          processedSuggestions.map((suggestion, index) => (
            <div
              key={suggestion.blockId}
              ref={el => itemRefs.current[index] = el}
              className={cn(
                'px-3 py-2 cursor-pointer transition-colors',
                'hover:bg-gray-100 focus:bg-gray-100 focus:outline-none',
                selectedIndex === index && 'bg-blue-50 border-l-2 border-blue-500',
                theme === 'dark' && {
                  'hover:bg-gray-700 focus:bg-gray-700': true,
                  'bg-blue-900/50 border-blue-400': selectedIndex === index
                }
              )}
              onClick={() => handleSelect(suggestion)}
              tabIndex={-1}
            >
              <div className="flex items-start gap-3">
                {/* 块类型图标 */}
                <div className={cn(
                  'mt-0.5 text-gray-500',
                  theme === 'dark' && 'text-gray-400'
                )}>
                  {getBlockTypeIcon(suggestion.blockType)}
                </div>

                {/* 主要内容 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      'text-sm font-medium text-gray-900 truncate',
                      theme === 'dark' && 'text-gray-100'
                    )}>
                      {suggestion.matchType === 'create' ? '创建新块' : `块 ${suggestion.blockId.slice(0, 8)}...`}
                    </span>
                    {getMatchTypeBadge(suggestion.matchType)}
                  </div>

                  <div className={cn(
                    'text-sm text-gray-600 line-clamp-2 mb-1',
                    theme === 'dark' && 'text-gray-300'
                  )}>
                    {suggestion.preview}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>{suggestion.pageName}</span>
                    {suggestion.referenceCount !== undefined && (
                      <>
                        <span>•</span>
                        <span>{suggestion.referenceCount} 引用</span>
                      </>
                    )}
                    {suggestion.createdAt && (
                      <>
                        <span>•</span>
                        <span>{new Date(suggestion.createdAt).toLocaleDateString()}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* 分数指示器 */}
                {suggestion.score > 0 && (
                  <div className={cn(
                    'text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded',
                    theme === 'dark' && 'bg-gray-700 text-gray-400'
                  )}>
                    {suggestion.score}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* 底部提示 */}
      <div className={cn(
        'px-3 py-2 border-t border-gray-200 bg-gray-50',
        theme === 'dark' && 'border-gray-700 bg-gray-900'
      )}>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>↑↓ 选择 • Enter 确认 • Esc 取消</span>
          {processedSuggestions.length >= maxItems && (
            <span>显示前 {maxItems} 项</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default BlockReferenceAutoComplete
