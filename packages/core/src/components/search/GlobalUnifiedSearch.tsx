/**
 * 全局统一搜索组件
 * 实现跨模块的统一搜索功能，支持语义搜索和AI增强
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { cn } from '../../utils'
import { SearchIcon, FilterIcon, XIcon } from '../icons'

// 临时的SparklesIcon组件
const SparklesIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3l1.5 1.5L5 6l1.5 1.5L5 9l1.5 1.5L5 12l1.5 1.5L5 15l1.5 1.5L5 18l1.5 1.5L5 21M19 3l-1.5 1.5L19 6l-1.5 1.5L19 9l-1.5 1.5L19 12l-1.5 1.5L19 15l-1.5 1.5L19 18l-1.5 1.5L19 21" />
  </svg>
)
import { UnifiedSearchService, UnifiedSearchResult, AdvancedSearchOptions } from '../../services/UnifiedSearchService'
import { EntityType } from '../../services/DataAssociationService'

export interface GlobalUnifiedSearchProps {
  isOpen: boolean
  onClose: () => void
  onResultSelect?: (result: UnifiedSearchResult) => void
  placeholder?: string
  showFilters?: boolean
  enableAISearch?: boolean
  maxResults?: number
  className?: string
}

export interface SearchFilters {
  entityTypes: EntityType[]
  moduleIds: string[]
  dateRange?: {
    from?: Date
    to?: Date
  }
  includeContent: boolean
  fuzzyMatch: boolean
}

/**
 * 全局统一搜索组件
 */
export const GlobalUnifiedSearch: React.FC<GlobalUnifiedSearchProps> = ({
  isOpen,
  onClose,
  onResultSelect,
  placeholder = "搜索笔记、任务、思维导图...",
  showFilters = true,
  enableAISearch = true,
  maxResults = 50,
  className = ''
}) => {
  // 状态管理
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UnifiedSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [searchMode, setSearchMode] = useState<'normal' | 'semantic' | 'ai'>('normal')
  
  // 搜索过滤器
  const [filters, setFilters] = useState<SearchFilters>({
    entityTypes: [],
    moduleIds: [],
    includeContent: true,
    fuzzyMatch: true
  })

  // 搜索服务实例
  const searchService = useMemo(() => {
    // 这里应该从依赖注入容器获取
    return new UnifiedSearchService(null as any, null as any)
  }, [])

  // 执行搜索
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setIsLoading(true)
    try {
      const searchOptions: AdvancedSearchOptions = {
        limit: maxResults,
        fuzzyMatch: filters.fuzzyMatch,
        includeContent: filters.includeContent,
        entityTypes: filters.entityTypes.length > 0 ? filters.entityTypes : undefined,
        moduleIds: filters.moduleIds.length > 0 ? filters.moduleIds : undefined,
        dateRange: filters.dateRange,
        sortBy: 'relevance',
        sortOrder: 'desc'
      }

      let searchResults: UnifiedSearchResult[] = []

      switch (searchMode) {
        case 'semantic':
          // 语义搜索实现
          searchResults = await searchService.semanticSearch(searchQuery, searchOptions)
          break
        case 'ai':
          // AI增强搜索实现
          searchResults = await searchService.aiEnhancedSearch(searchQuery, searchOptions)
          break
        default:
          // 普通搜索
          const aggregation = await searchService.search(searchQuery, searchOptions)
          searchResults = aggregation.results
      }

      setResults(searchResults)
      setSelectedIndex(0)
    } catch (error) {
      console.error('搜索失败:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [searchService, filters, searchMode, maxResults])

  // 防抖搜索
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      performSearch(query)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query, performSearch])

  // 键盘导航
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
        break
      case 'ArrowUp':
        event.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
        break
      case 'Enter':
        event.preventDefault()
        if (results[selectedIndex]) {
          onResultSelect?.(results[selectedIndex])
          onClose()
        }
        break
      case 'Escape':
        event.preventDefault()
        onClose()
        break
    }
  }, [results, selectedIndex, onResultSelect, onClose])

  // 获取实体类型图标
  const getEntityIcon = (type: EntityType) => {
    const iconMap = {
      [EntityType.NOTE]: '📝',
      [EntityType.TASK]: '✅',
      [EntityType.MINDMAP_NODE]: '🧠',
      [EntityType.GRAPH_NODE]: '🔗',
      [EntityType.FILE]: '📁',
      [EntityType.TAG]: '🏷️',
      [EntityType.PROJECT]: '📋'
    }
    return iconMap[type] || '📄'
  }

  // 高亮搜索关键词
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-yellow-900 px-1 rounded">
          {part}
        </mark>
      ) : part
    )
  }

  if (!isOpen) return null

  return (
    <div className={cn(
      'fixed inset-0 z-50 flex items-start justify-center pt-[10vh]',
      'bg-black bg-opacity-50 backdrop-blur-sm',
      className
    )}>
      <div className="w-full max-w-2xl mx-4 bg-white rounded-xl shadow-2xl overflow-hidden">
        {/* 搜索头部 */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-200">
          <SearchIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
          
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 text-lg outline-none"
            autoFocus
          />

          {/* 搜索模式切换 */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSearchMode('normal')}
              className={cn(
                'px-2 py-1 text-xs rounded',
                searchMode === 'normal' ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
              )}
            >
              普通
            </button>
            <button
              type="button"
              onClick={() => setSearchMode('semantic')}
              className={cn(
                'px-2 py-1 text-xs rounded',
                searchMode === 'semantic' ? 'bg-purple-100 text-purple-700' : 'text-gray-500 hover:bg-gray-100'
              )}
            >
              语义
            </button>
            {enableAISearch && (
              <button
                type="button"
                onClick={() => setSearchMode('ai')}
                className={cn(
                  'px-2 py-1 text-xs rounded flex items-center gap-1',
                  searchMode === 'ai' ? 'bg-green-100 text-green-700' : 'text-gray-500 hover:bg-gray-100'
                )}
              >
                <SparklesIcon className="w-3 h-3" />
                AI
              </button>
            )}
          </div>

          {/* 过滤器按钮 */}
          {showFilters && (
            <button
              type="button"
              title="切换高级过滤器"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={cn(
                'p-2 rounded-lg transition-colors',
                showAdvancedFilters ? 'bg-blue-100 text-blue-700' : 'text-gray-400 hover:bg-gray-100'
              )}
            >
              <FilterIcon className="w-4 h-4" />
            </button>
          )}

          {/* 关闭按钮 */}
          <button
            type="button"
            title="关闭搜索"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        {/* 高级过滤器 */}
        {showAdvancedFilters && (
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <div className="grid grid-cols-2 gap-4">
              {/* 实体类型过滤 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  内容类型
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.values(EntityType).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setFilters(prev => ({
                          ...prev,
                          entityTypes: prev.entityTypes.includes(type)
                            ? prev.entityTypes.filter(t => t !== type)
                            : [...prev.entityTypes, type]
                        }))
                      }}
                      className={cn(
                        'px-2 py-1 text-xs rounded border',
                        filters.entityTypes.includes(type)
                          ? 'bg-blue-100 border-blue-300 text-blue-700'
                          : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                      )}
                    >
                      {getEntityIcon(type)} {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* 搜索选项 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  搜索选项
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.includeContent}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        includeContent: e.target.checked
                      }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600">搜索内容</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.fuzzyMatch}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        fuzzyMatch: e.target.checked
                      }))}
                      className="mr-2"
                    />
                    <span className="text-sm text-gray-600">模糊匹配</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 搜索结果 */}
        <div className="max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">搜索中...</span>
            </div>
          ) : results.length > 0 ? (
            <div className="divide-y divide-gray-100">
              {results.map((result, index) => (
                <div
                  key={result.id}
                  onClick={() => {
                    onResultSelect?.(result)
                    onClose()
                  }}
                  className={cn(
                    'p-4 cursor-pointer transition-colors',
                    index === selectedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg flex-shrink-0 mt-1">
                      {getEntityIcon(result.type)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">
                        {highlightText(result.title, query)}
                      </h3>
                      {result.snippet && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                          {highlightText(result.snippet, query)}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-gray-500">
                          {result.type}
                        </span>
                        {result.moduleId && (
                          <span className="text-xs text-gray-500">
                            • {result.moduleId}
                          </span>
                        )}
                        <span className="text-xs text-blue-600">
                          {Math.round(result.score * 100)}% 匹配
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : query.trim() ? (
            <div className="text-center py-8 text-gray-500">
              <SearchIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>未找到相关结果</p>
              <p className="text-sm mt-1">尝试调整搜索关键词或过滤条件</p>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <SearchIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>开始输入以搜索内容</p>
              <p className="text-sm mt-1">支持跨模块搜索笔记、任务、思维导图等</p>
            </div>
          )}
        </div>

        {/* 搜索提示 */}
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <span>↑↓ 导航</span>
              <span>Enter 选择</span>
              <span>Esc 关闭</span>
            </div>
            {results.length > 0 && (
              <span>{results.length} 个结果</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default GlobalUnifiedSearch
