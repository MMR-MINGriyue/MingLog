/**
 * 高级搜索过滤器组件
 * 
 * 功能：
 * - 多维度搜索过滤
 * - 实时搜索和防抖
 * - 过滤器预设管理
 * - 搜索结果展示
 * - 搜索历史记录
 */

import React, { useState, useCallback, useEffect } from 'react'
import { cn } from '../../../utils/classNames'
import { useTheme } from '../../../contexts/ThemeContext'
import { 
  AdvancedSearchFilters, 
  SearchResult, 
  SearchStats,
  FilterPreset,
  DEFAULT_CONTENT_TYPES,
  SORT_OPTIONS
} from './types'

export interface AdvancedSearchFilterProps {
  /** 初始过滤器 */
  initialFilters?: Partial<AdvancedSearchFilters>
  /** 搜索执行回调 */
  onSearch: (filters: AdvancedSearchFilters) => Promise<{
    results: SearchResult[]
    stats: SearchStats
  }>
  /** 过滤器变化回调 */
  onFiltersChange?: (filters: AdvancedSearchFilters) => void
  /** 结果选择回调 */
  onResultSelect?: (result: SearchResult) => void
  /** 是否显示高级选项 */
  showAdvancedOptions?: boolean
  /** 是否启用实时搜索 */
  enableRealTimeSearch?: boolean
  /** 搜索防抖延迟 */
  debounceDelay?: number
  /** 自定义样式类名 */
  className?: string
  /** 是否禁用 */
  disabled?: boolean
}

export const AdvancedSearchFilter: React.FC<AdvancedSearchFilterProps> = ({
  initialFilters = {},
  onSearch,
  onFiltersChange,
  onResultSelect,
  showAdvancedOptions = true,
  enableRealTimeSearch = true,
  debounceDelay = 300,
  className,
  disabled = false
}) => {
  const { theme } = useTheme()
  
  // 默认过滤器
  const defaultFilters: AdvancedSearchFilters = {
    query: '',
    contentTypes: DEFAULT_CONTENT_TYPES,
    tags: [],
    authors: [],
    dateRange: {},
    sortBy: 'relevance',
    sortOrder: 'desc',
    includeDeleted: false,
    favoritesOnly: false,
    ...initialFilters
  }

  const [filters, setFilters] = useState<AdvancedSearchFilters>(defaultFilters)
  const [results, setResults] = useState<SearchResult[]>([])
  const [stats, setStats] = useState<SearchStats | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [presets, setPresets] = useState<FilterPreset[]>([])
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)

  // 防抖搜索
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)

  // 执行搜索
  const performSearch = useCallback(async () => {
    if (!filters.query.trim() && !hasActiveFilters()) {
      setResults([])
      setStats(null)
      return
    }

    setIsSearching(true)
    setError(null)

    try {
      const searchResult = await onSearch(filters)
      setResults(searchResult.results)
      setStats(searchResult.stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : '搜索失败')
      setResults([])
      setStats(null)
    } finally {
      setIsSearching(false)
    }
  }, [filters, onSearch])

  // 检查是否有活跃的过滤器
  const hasActiveFilters = useCallback(() => {
    return (
      filters.contentTypes.some(type => !type.selected) ||
      filters.tags.length > 0 ||
      filters.authors.length > 0 ||
      filters.dateRange.created ||
      filters.dateRange.modified ||
      filters.includeDeleted ||
      filters.favoritesOnly
    )
  }, [filters])

  // 更新过滤器
  const updateFilters = useCallback((newFilters: Partial<AdvancedSearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    onFiltersChange?.(updatedFilters)

    // 实时搜索
    if (enableRealTimeSearch && !disabled) {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
      
      const timeout = setTimeout(() => {
        performSearch()
      }, debounceDelay)
      
      setSearchTimeout(timeout)
    }
  }, [filters, onFiltersChange, enableRealTimeSearch, disabled, debounceDelay, performSearch, searchTimeout])

  // 清除过滤器
  const clearFilters = useCallback(() => {
    setFilters(defaultFilters)
    setResults([])
    setStats(null)
    setSelectedPreset(null)
  }, [defaultFilters])

  // 处理搜索输入
  const handleQueryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateFilters({ query: e.target.value })
  }, [updateFilters])

  // 处理键盘事件
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !enableRealTimeSearch) {
      performSearch()
    }
  }, [enableRealTimeSearch, performSearch])

  // 处理内容类型切换
  const handleContentTypeToggle = useCallback((typeIndex: number) => {
    const newContentTypes = [...filters.contentTypes]
    newContentTypes[typeIndex].selected = !newContentTypes[typeIndex].selected
    updateFilters({ contentTypes: newContentTypes })
  }, [filters.contentTypes, updateFilters])

  // 处理排序变化
  const handleSortChange = useCallback((sortBy: AdvancedSearchFilters['sortBy']) => {
    updateFilters({ sortBy })
  }, [updateFilters])

  // 处理排序方向变化
  const handleSortOrderToggle = useCallback(() => {
    updateFilters({ 
      sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' 
    })
  }, [filters.sortOrder, updateFilters])

  // 处理结果点击
  const handleResultClick = useCallback((result: SearchResult) => {
    onResultSelect?.(result)
  }, [onResultSelect])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
    }
  }, [searchTimeout])

  return (
    <div className={cn(
      'flex flex-col h-full bg-white border border-gray-200 rounded-lg shadow-sm',
      theme === 'dark' && 'bg-gray-800 border-gray-700',
      disabled && 'opacity-50 pointer-events-none',
      className
    )}>
      {/* 搜索头部 */}
      <div className={cn(
        'flex-shrink-0 p-4 border-b border-gray-200',
        theme === 'dark' && 'border-gray-700'
      )}>
        {/* 主搜索框 */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            value={filters.query}
            onChange={handleQueryChange}
            onKeyDown={handleKeyDown}
            placeholder="搜索笔记、块引用、标签..."
            className={cn(
              'block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg',
              'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
              'placeholder-gray-400 text-sm',
              theme === 'dark' && 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
            )}
            disabled={disabled}
          />
          {isSearching && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>

        {/* 快速过滤器 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {filters.contentTypes.map((type, index) => (
            <button
              key={type.type}
              onClick={() => handleContentTypeToggle(index)}
              className={cn(
                'inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                type.selected
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200',
                theme === 'dark' && {
                  'bg-blue-900/50 text-blue-300 border-blue-700': type.selected,
                  'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600': !type.selected
                }
              )}
              disabled={disabled}
            >
              <span className="mr-1">{type.label}</span>
              {type.count !== undefined && (
                <span className={cn(
                  'ml-1 px-1.5 py-0.5 text-xs rounded-full',
                  type.selected
                    ? 'bg-blue-200 text-blue-800'
                    : 'bg-gray-200 text-gray-600',
                  theme === 'dark' && {
                    'bg-blue-800 text-blue-200': type.selected,
                    'bg-gray-600 text-gray-300': !type.selected
                  }
                )}>
                  {type.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 高级选项切换 */}
        {showAdvancedOptions && (
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={cn(
                'inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-gray-900',
                'border border-gray-300 rounded-md hover:bg-gray-50 transition-colors',
                theme === 'dark' && 'text-gray-300 hover:text-gray-100 border-gray-600 hover:bg-gray-700'
              )}
              disabled={disabled}
            >
              <svg className={cn(
                'w-4 h-4 mr-2 transition-transform',
                showAdvanced && 'rotate-180'
              )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              高级选项
            </button>

            <div className="flex items-center gap-2">
              {/* 排序选择 */}
              <select
                value={filters.sortBy}
                onChange={(e) => handleSortChange(e.target.value as AdvancedSearchFilters['sortBy'])}
                className={cn(
                  'text-sm border border-gray-300 rounded-md px-2 py-1',
                  'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                  theme === 'dark' && 'bg-gray-700 border-gray-600 text-white'
                )}
                disabled={disabled}
              >
                {SORT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* 排序方向 */}
              <button
                onClick={handleSortOrderToggle}
                className={cn(
                  'p-1.5 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-md',
                  'hover:bg-gray-50 transition-colors',
                  theme === 'dark' && 'text-gray-400 hover:text-gray-200 border-gray-600 hover:bg-gray-700'
                )}
                title={filters.sortOrder === 'asc' ? '升序' : '降序'}
                disabled={disabled}
              >
                <svg className={cn(
                  'w-4 h-4 transition-transform',
                  filters.sortOrder === 'asc' && 'rotate-180'
                )} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
              </button>

              {/* 清除过滤器 */}
              {(filters.query || hasActiveFilters()) && (
                <button
                  onClick={clearFilters}
                  className={cn(
                    'p-1.5 text-gray-500 hover:text-red-600 border border-gray-300 rounded-md',
                    'hover:bg-red-50 transition-colors',
                    theme === 'dark' && 'text-gray-400 hover:text-red-400 border-gray-600 hover:bg-red-900/20'
                  )}
                  title="清除所有过滤器"
                  disabled={disabled}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 高级过滤器面板 */}
      {showAdvanced && showAdvancedOptions && (
        <div className={cn(
          'flex-shrink-0 p-4 border-b border-gray-200 bg-gray-50',
          theme === 'dark' && 'border-gray-700 bg-gray-900'
        )}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 日期范围过滤器 */}
            <div>
              <label className={cn(
                'block text-sm font-medium text-gray-700 mb-2',
                theme === 'dark' && 'text-gray-300'
              )}>
                创建日期
              </label>
              <div className="space-y-2">
                <input
                  type="date"
                  value={filters.dateRange.created?.start || ''}
                  onChange={(e) => updateFilters({
                    dateRange: {
                      ...filters.dateRange,
                      created: {
                        ...filters.dateRange.created,
                        start: e.target.value
                      }
                    }
                  })}
                  className={cn(
                    'block w-full text-sm border border-gray-300 rounded-md px-3 py-2',
                    'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                    theme === 'dark' && 'bg-gray-700 border-gray-600 text-white'
                  )}
                  disabled={disabled}
                />
                <input
                  type="date"
                  value={filters.dateRange.created?.end || ''}
                  onChange={(e) => updateFilters({
                    dateRange: {
                      ...filters.dateRange,
                      created: {
                        ...filters.dateRange.created,
                        end: e.target.value
                      }
                    }
                  })}
                  className={cn(
                    'block w-full text-sm border border-gray-300 rounded-md px-3 py-2',
                    'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                    theme === 'dark' && 'bg-gray-700 border-gray-600 text-white'
                  )}
                  disabled={disabled}
                />
              </div>
            </div>

            {/* 其他高级选项 */}
            <div>
              <label className={cn(
                'block text-sm font-medium text-gray-700 mb-2',
                theme === 'dark' && 'text-gray-300'
              )}>
                其他选项
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.includeDeleted}
                    onChange={(e) => updateFilters({ includeDeleted: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={disabled}
                  />
                  <span className={cn(
                    'ml-2 text-sm text-gray-700',
                    theme === 'dark' && 'text-gray-300'
                  )}>
                    包含已删除项目
                  </span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.favoritesOnly}
                    onChange={(e) => updateFilters({ favoritesOnly: e.target.checked })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={disabled}
                  />
                  <span className={cn(
                    'ml-2 text-sm text-gray-700',
                    theme === 'dark' && 'text-gray-300'
                  )}>
                    仅显示收藏项目
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 搜索统计 */}
      {stats && (
        <div className={cn(
          'flex-shrink-0 px-4 py-2 border-b border-gray-200 bg-gray-50',
          theme === 'dark' && 'border-gray-700 bg-gray-900'
        )}>
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              找到 {stats.totalCount} 个结果 ({stats.searchTime}ms)
            </span>
            {stats.suggestions.length > 0 && (
              <div className="flex items-center gap-2">
                <span>建议:</span>
                {stats.suggestions.slice(0, 3).map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => updateFilters({ query: suggestion })}
                    className="text-blue-600 hover:text-blue-800 underline"
                    disabled={disabled}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 错误显示 */}
      {error && (
        <div className="flex-shrink-0 p-4 bg-red-50 border-b border-red-200">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* 搜索结果 */}
      <div className="flex-1 overflow-y-auto">
        {results.length > 0 ? (
          <div className="p-4 space-y-3">
            {results.map((result) => (
              <div
                key={result.id}
                onClick={() => handleResultClick(result)}
                className={cn(
                  'p-4 border border-gray-200 rounded-lg cursor-pointer transition-colors',
                  'hover:bg-gray-50 hover:border-gray-300',
                  theme === 'dark' && 'border-gray-700 hover:bg-gray-800 hover:border-gray-600'
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className={cn(
                    'text-lg font-medium text-gray-900 truncate',
                    theme === 'dark' && 'text-gray-100'
                  )}>
                    {result.title}
                  </h3>
                  <span className={cn(
                    'text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600',
                    theme === 'dark' && 'bg-gray-700 text-gray-400'
                  )}>
                    {result.type}
                  </span>
                </div>
                <p className={cn(
                  'text-sm text-gray-600 mb-2 line-clamp-2',
                  theme === 'dark' && 'text-gray-400'
                )}>
                  {result.excerpt}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{new Date(result.modifiedAt).toLocaleDateString()}</span>
                  <span>相关性: {Math.round(result.score * 100)}%</span>
                </div>
              </div>
            ))}
          </div>
        ) : !isSearching && filters.query && (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <svg className="w-12 h-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium mb-2">未找到匹配结果</p>
            <p className="text-sm">尝试调整搜索条件或使用不同的关键词</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdvancedSearchFilter

// 导出类型
export type { AdvancedSearchFilterProps }
