/**
 * 链接自动补全组件
 * 
 * 功能：
 * - 智能提示页面名称
 * - 键盘导航支持
 * - 模糊搜索匹配
 * - 创建新页面选项
 * - 历史记录显示
 * - 防抖优化
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { cn } from '../../../utils/classNames'
import { useTheme } from '../../../contexts/ThemeContext'

export interface LinkSuggestion {
  /** 唯一标识 */
  id: string
  /** 页面名称 */
  title: string
  /** 页面类型 */
  type: 'page' | 'block' | 'create'
  /** 预览内容 */
  preview?: string
  /** 匹配分数 */
  score: number
  /** 匹配类型 */
  matchType: 'exact' | 'prefix' | 'contains' | 'fuzzy' | 'create'
  /** 最后修改时间 */
  lastModified?: string
  /** 引用次数 */
  referenceCount?: number
}

export interface LinkAutoCompleteProps {
  /** 搜索查询 */
  query: string
  /** 显示位置 */
  position: { x: number; y: number }
  /** 是否显示 */
  visible: boolean
  /** 建议列表 */
  suggestions?: LinkSuggestion[]
  /** 加载状态 */
  loading?: boolean
  /** 选择回调 */
  onSelect: (suggestion: LinkSuggestion) => void
  /** 关闭回调 */
  onClose: () => void
  /** 查询变化回调 */
  onQueryChange?: (query: string) => void
  /** 最大显示数量 */
  maxItems?: number
  /** 最大宽度 */
  maxWidth?: number
  /** 最大高度 */
  maxHeight?: number
  /** 是否显示创建新项选项 */
  showCreateOption?: boolean
  /** 是否显示历史记录 */
  showHistory?: boolean
  /** 历史记录 */
  history?: LinkSuggestion[]
  /** 自定义样式类名 */
  className?: string
  /** 是否启用虚拟滚动 */
  enableVirtualScroll?: boolean
}

export const LinkAutoComplete: React.FC<LinkAutoCompleteProps> = ({
  query,
  position,
  visible,
  suggestions = [],
  loading = false,
  onSelect,
  onClose,
  onQueryChange,
  maxItems = 10,
  maxWidth = 400,
  maxHeight = 300,
  showCreateOption = true,
  showHistory = true,
  history = [],
  className,
  enableVirtualScroll = false
}) => {
  const { theme } = useTheme()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])

  // 合并所有建议项
  const allSuggestions = useMemo(() => {
    const items: LinkSuggestion[] = []
    
    // 添加搜索建议
    items.push(...suggestions.slice(0, maxItems))
    
    // 添加历史记录（如果查询为空且启用历史记录）
    if (showHistory && !query.trim() && history.length > 0) {
      const historyItems = history
        .filter(h => !items.some(s => s.id === h.id))
        .slice(0, Math.max(0, maxItems - items.length))
      items.push(...historyItems)
    }
    
    // 添加创建新项选项
    if (showCreateOption && query.trim()) {
      const hasExactMatch = items.some(s => s.title.toLowerCase() === query.toLowerCase())
      if (!hasExactMatch) {
        items.push({
          id: `create-${query}`,
          title: query,
          type: 'create',
          preview: `创建新页面 "${query}"`,
          score: 0,
          matchType: 'create'
        })
      }
    }
    
    return items
  }, [suggestions, history, query, maxItems, showHistory, showCreateOption])

  // 重置选中索引当建议变化时
  useEffect(() => {
    setSelectedIndex(0)
    setHighlightedIndex(-1)
  }, [allSuggestions])

  // 键盘事件处理
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!visible || allSuggestions.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < allSuggestions.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : allSuggestions.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (allSuggestions[selectedIndex]) {
          onSelect(allSuggestions[selectedIndex])
        }
        break
      case 'Escape':
        e.preventDefault()
        onClose()
        break
      case 'Tab':
        e.preventDefault()
        if (allSuggestions[selectedIndex]) {
          onSelect(allSuggestions[selectedIndex])
        }
        break
    }
  }, [visible, allSuggestions, selectedIndex, onSelect, onClose])

  // 绑定键盘事件
  useEffect(() => {
    if (visible) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [visible, handleKeyDown])

  // 滚动到选中项
  useEffect(() => {
    const selectedItem = itemRefs.current[selectedIndex]
    if (selectedItem && containerRef.current) {
      const container = containerRef.current
      const itemTop = selectedItem.offsetTop
      const itemBottom = itemTop + selectedItem.offsetHeight
      const containerTop = container.scrollTop
      const containerBottom = containerTop + container.offsetHeight

      if (itemTop < containerTop) {
        container.scrollTop = itemTop
      } else if (itemBottom > containerBottom) {
        container.scrollTop = itemBottom - container.offsetHeight
      }
    }
  }, [selectedIndex])

  // 处理鼠标悬停
  const handleMouseEnter = useCallback((index: number) => {
    setHighlightedIndex(index)
    setSelectedIndex(index)
  }, [])

  // 处理鼠标离开
  const handleMouseLeave = useCallback(() => {
    setHighlightedIndex(-1)
  }, [])

  // 处理点击选择
  const handleClick = useCallback((suggestion: LinkSuggestion) => {
    onSelect(suggestion)
  }, [onSelect])

  // 获取建议项图标
  const getSuggestionIcon = (suggestion: LinkSuggestion) => {
    switch (suggestion.type) {
      case 'page':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      case 'block':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
          </svg>
        )
      case 'create':
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        )
      default:
        return null
    }
  }

  // 获取匹配类型标识
  const getMatchTypeBadge = (matchType: LinkSuggestion['matchType']) => {
    switch (matchType) {
      case 'exact':
        return <span className="text-xs text-green-600 font-medium">精确</span>
      case 'prefix':
        return <span className="text-xs text-blue-600 font-medium">前缀</span>
      case 'contains':
        return <span className="text-xs text-yellow-600 font-medium">包含</span>
      case 'fuzzy':
        return <span className="text-xs text-purple-600 font-medium">模糊</span>
      case 'create':
        return <span className="text-xs text-green-600 font-medium">新建</span>
      default:
        return null
    }
  }

  if (!visible) return null

  return (
    <div
      className={cn(
        'absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg',
        'overflow-hidden',
        theme === 'dark' && 'bg-gray-800 border-gray-700',
        className
      )}
      style={{
        top: position.y,
        left: position.x,
        maxWidth,
        maxHeight
      }}
    >
      {/* 加载状态 */}
      {loading && (
        <div className="flex items-center gap-2 p-3 text-sm text-gray-600">
          <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          <span>搜索中...</span>
        </div>
      )}

      {/* 建议列表 */}
      {!loading && allSuggestions.length > 0 && (
        <div
          ref={containerRef}
          className="max-h-64 overflow-y-auto"
          style={{ maxHeight }}
        >
          {allSuggestions.map((suggestion, index) => (
            <div
              key={suggestion.id}
              ref={el => itemRefs.current[index] = el}
              className={cn(
                'flex items-center gap-3 p-3 cursor-pointer transition-colors',
                'hover:bg-gray-50 border-b border-gray-100 last:border-b-0',
                selectedIndex === index && 'bg-blue-50 text-blue-700',
                theme === 'dark' && [
                  'hover:bg-gray-700 border-gray-600',
                  selectedIndex === index && 'bg-blue-900 text-blue-300'
                ]
              )}
              onMouseEnter={() => handleMouseEnter(index)}
              onMouseLeave={handleMouseLeave}
              onClick={() => handleClick(suggestion)}
            >
              {/* 图标 */}
              <div className={cn(
                'flex-shrink-0',
                selectedIndex === index ? 'text-blue-500' : 'text-gray-400'
              )}>
                {getSuggestionIcon(suggestion)}
              </div>

              {/* 内容 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium truncate">{suggestion.title}</span>
                  {getMatchTypeBadge(suggestion.matchType)}
                </div>
                {suggestion.preview && (
                  <div className="text-xs text-gray-500 truncate mt-1">
                    {suggestion.preview}
                  </div>
                )}
                {suggestion.referenceCount !== undefined && (
                  <div className="text-xs text-gray-400 mt-1">
                    {suggestion.referenceCount} 个引用
                  </div>
                )}
              </div>

              {/* 快捷键提示 */}
              {selectedIndex === index && (
                <div className="flex-shrink-0 text-xs text-gray-400">
                  ↵
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 空状态 */}
      {!loading && allSuggestions.length === 0 && (
        <div className="p-6 text-center text-gray-500">
          <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p className="text-sm">未找到匹配的页面</p>
          {showCreateOption && query.trim() && (
            <p className="text-xs text-gray-400 mt-1">
              按 Enter 创建新页面 "{query}"
            </p>
          )}
        </div>
      )}

      {/* 底部提示 */}
      {!loading && allSuggestions.length > 0 && (
        <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
          <div className="flex items-center justify-between">
            <span>↑↓ 选择 • ↵ 确认 • Esc 取消</span>
            <span>{allSuggestions.length} 项</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default LinkAutoComplete
