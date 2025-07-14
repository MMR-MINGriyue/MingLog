/**
 * 搜索结果展示组件
 * 
 * 功能：
 * - 搜索结果列表展示
 * - 分组和排序显示
 * - 结果选择和操作
 * - 分页和虚拟滚动
 * - 结果预览和快速操作
 */

import React, { useState, useCallback, useMemo } from 'react'
import { cn } from '../../../utils/classNames'
import { useTheme } from '../../../contexts/ThemeContext'
import { SearchResult, SearchResultGroup, ContentTypeFilter } from './types'

export interface SearchResultsViewProps {
  /** 搜索结果 */
  results: SearchResult[]
  /** 分组结果 */
  groupedResults?: SearchResultGroup[]
  /** 是否显示分组 */
  showGrouped?: boolean
  /** 是否显示选择框 */
  showSelection?: boolean
  /** 选中的结果ID */
  selectedResults?: string[]
  /** 结果点击回调 */
  onResultClick?: (result: SearchResult) => void
  /** 结果选择回调 */
  onResultSelect?: (resultId: string) => void
  /** 全选回调 */
  onSelectAll?: () => void
  /** 清除选择回调 */
  onClearSelection?: () => void
  /** 是否加载中 */
  loading?: boolean
  /** 空状态文本 */
  emptyText?: string
  /** 自定义样式类名 */
  className?: string
}

export const SearchResultsView: React.FC<SearchResultsViewProps> = ({
  results,
  groupedResults,
  showGrouped = false,
  showSelection = false,
  selectedResults = [],
  onResultClick,
  onResultSelect,
  onSelectAll,
  onClearSelection,
  loading = false,
  emptyText = '未找到匹配结果',
  className
}) => {
  const { theme } = useTheme()
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  // 切换分组展开状态
  const toggleGroupExpanded = useCallback((groupName: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(groupName)) {
        newSet.delete(groupName)
      } else {
        newSet.add(groupName)
      }
      return newSet
    })
  }, [])

  // 获取内容类型图标
  const getContentTypeIcon = useCallback((type: ContentTypeFilter['type']) => {
    const iconClasses = "w-4 h-4 flex-shrink-0"
    
    switch (type) {
      case 'note':
        return (
          <svg className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      case 'block':
        return (
          <svg className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        )
      case 'link':
        return (
          <svg className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        )
      case 'tag':
        return (
          <svg className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
          </svg>
        )
      case 'attachment':
        return (
          <svg className={iconClasses} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
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
  }, [])

  // 渲染单个搜索结果
  const renderResult = useCallback((result: SearchResult, index: number) => {
    const isSelected = selectedResults.includes(result.id)
    
    return (
      <div
        key={result.id}
        className={cn(
          'group relative p-4 border border-gray-200 rounded-lg transition-all duration-200',
          'hover:border-gray-300 hover:shadow-sm cursor-pointer',
          isSelected && 'ring-2 ring-blue-500 border-blue-500',
          theme === 'dark' && {
            'border-gray-700 hover:border-gray-600': !isSelected,
            'ring-blue-400 border-blue-400': isSelected
          }
        )}
        onClick={() => onResultClick?.(result)}
      >
        {/* 选择框 */}
        {showSelection && (
          <div className="absolute top-4 left-4">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation()
                onResultSelect?.(result.id)
              }}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
          </div>
        )}

        <div className={cn('flex items-start gap-3', showSelection && 'ml-8')}>
          {/* 内容类型图标 */}
          <div className={cn(
            'mt-1 text-gray-500',
            theme === 'dark' && 'text-gray-400'
          )}>
            {getContentTypeIcon(result.type)}
          </div>

          {/* 主要内容 */}
          <div className="flex-1 min-w-0">
            {/* 标题和类型 */}
            <div className="flex items-start justify-between mb-2">
              <h3 className={cn(
                'text-lg font-medium text-gray-900 truncate',
                theme === 'dark' && 'text-gray-100'
              )}>
                {result.title}
              </h3>
              <div className="flex items-center gap-2 ml-4">
                <span className={cn(
                  'text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 whitespace-nowrap',
                  theme === 'dark' && 'bg-gray-700 text-gray-400'
                )}>
                  {result.type}
                </span>
                {result.isFavorite && (
                  <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                )}
              </div>
            </div>

            {/* 摘要 */}
            <p className={cn(
              'text-sm text-gray-600 mb-3 line-clamp-2',
              theme === 'dark' && 'text-gray-400'
            )}>
              {result.excerpt}
            </p>

            {/* 高亮片段 */}
            {result.highlights.length > 0 && (
              <div className="mb-3">
                <div className="text-xs font-medium text-gray-500 mb-1">匹配片段:</div>
                <div className="space-y-1">
                  {result.highlights.slice(0, 2).map((highlight, idx) => (
                    <div
                      key={idx}
                      className={cn(
                        'text-sm p-2 bg-yellow-50 border-l-2 border-yellow-400 rounded-r',
                        theme === 'dark' && 'bg-yellow-900/20 border-yellow-500'
                      )}
                      dangerouslySetInnerHTML={{ __html: highlight }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 标签 */}
            {result.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {result.tags.slice(0, 5).map((tag) => (
                  <span
                    key={tag.id}
                    className={cn(
                      'inline-flex items-center px-2 py-1 text-xs rounded-full',
                      'bg-blue-100 text-blue-800',
                      theme === 'dark' && 'bg-blue-900/50 text-blue-300'
                    )}
                    style={{ backgroundColor: tag.color ? `${tag.color}20` : undefined }}
                  >
                    {tag.name}
                  </span>
                ))}
                {result.tags.length > 5 && (
                  <span className={cn(
                    'inline-flex items-center px-2 py-1 text-xs rounded-full',
                    'bg-gray-100 text-gray-600',
                    theme === 'dark' && 'bg-gray-700 text-gray-400'
                  )}>
                    +{result.tags.length - 5}
                  </span>
                )}
              </div>
            )}

            {/* 元数据 */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center gap-4">
                {result.author && (
                  <span>作者: {result.author.name}</span>
                )}
                <span>修改: {new Date(result.modifiedAt).toLocaleDateString()}</span>
                {result.size && (
                  <span>大小: {(result.size / 1024).toFixed(1)}KB</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span>相关性: {Math.round(result.score * 100)}%</span>
                {result.path && (
                  <span className="truncate max-w-32" title={result.path}>
                    {result.path}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 快速操作按钮 */}
        <div className={cn(
          'absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity',
          'flex items-center gap-1'
        )}>
          <button
            onClick={(e) => {
              e.stopPropagation()
              // 预览功能
            }}
            className={cn(
              'p-1.5 text-gray-400 hover:text-gray-600 rounded',
              'hover:bg-gray-100 transition-colors',
              theme === 'dark' && 'hover:text-gray-300 hover:bg-gray-700'
            )}
            title="预览"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              // 分享功能
            }}
            className={cn(
              'p-1.5 text-gray-400 hover:text-gray-600 rounded',
              'hover:bg-gray-100 transition-colors',
              theme === 'dark' && 'hover:text-gray-300 hover:bg-gray-700'
            )}
            title="分享"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        </div>
      </div>
    )
  }, [selectedResults, showSelection, onResultClick, onResultSelect, getContentTypeIcon, theme])

  // 渲染分组结果
  const renderGroupedResults = useCallback(() => {
    if (!groupedResults || groupedResults.length === 0) {
      return null
    }

    return (
      <div className="space-y-6">
        {groupedResults.map((group) => {
          const isExpanded = expandedGroups.has(group.name)
          
          return (
            <div key={group.name} className="space-y-3">
              {/* 分组标题 */}
              <div
                onClick={() => toggleGroupExpanded(group.name)}
                className={cn(
                  'flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer',
                  'hover:bg-gray-100 transition-colors',
                  theme === 'dark' && 'bg-gray-800 hover:bg-gray-700'
                )}
              >
                <div className="flex items-center gap-2">
                  <svg className={cn(
                    'w-4 h-4 transition-transform',
                    isExpanded && 'rotate-90'
                  )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <h3 className={cn(
                    'text-lg font-medium text-gray-900',
                    theme === 'dark' && 'text-gray-100'
                  )}>
                    {group.name}
                  </h3>
                  <span className={cn(
                    'px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded-full',
                    theme === 'dark' && 'bg-gray-700 text-gray-400'
                  )}>
                    {group.count}
                  </span>
                </div>
              </div>

              {/* 分组内容 */}
              {isExpanded && (
                <div className="space-y-3 ml-4">
                  {group.results.map((result, index) => renderResult(result, index))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }, [groupedResults, expandedGroups, toggleGroupExpanded, renderResult, theme])

  // 渲染普通结果列表
  const renderResultsList = useCallback(() => {
    return (
      <div className="space-y-3">
        {results.map((result, index) => renderResult(result, index))}
      </div>
    )
  }, [results, renderResult])

  // 加载状态
  if (loading) {
    return (
      <div className={cn(
        'flex flex-col items-center justify-center h-64 text-gray-500',
        className
      )}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-sm">搜索中...</p>
      </div>
    )
  }

  // 空状态
  if (results.length === 0) {
    return (
      <div className={cn(
        'flex flex-col items-center justify-center h-64 text-gray-500',
        className
      )}>
        <svg className="w-12 h-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-lg font-medium mb-2">{emptyText}</p>
        <p className="text-sm">尝试调整搜索条件或使用不同的关键词</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* 选择操作栏 */}
      {showSelection && results.length > 0 && (
        <div className={cn(
          'flex items-center justify-between p-3 bg-gray-50 rounded-lg',
          theme === 'dark' && 'bg-gray-800'
        )}>
          <div className="flex items-center gap-4">
            <span className={cn(
              'text-sm text-gray-600',
              theme === 'dark' && 'text-gray-400'
            )}>
              已选择 {selectedResults.length} / {results.length} 项
            </span>
            {selectedResults.length > 0 && (
              <button
                onClick={onClearSelection}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                清除选择
              </button>
            )}
          </div>
          <button
            onClick={onSelectAll}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {selectedResults.length === results.length ? '取消全选' : '全选'}
          </button>
        </div>
      )}

      {/* 结果展示 */}
      {showGrouped ? renderGroupedResults() : renderResultsList()}
    </div>
  )
}

export default SearchResultsView
