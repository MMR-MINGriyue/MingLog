/**
 * 增强版高级搜索组件
 * 完善跨模块搜索、智能过滤器、保存搜索和搜索分析功能
 */

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { cn } from '../../utils'
import { UnifiedSearchService, SearchResultAggregation, AdvancedSearchOptions } from '../../services/UnifiedSearchService'
import { AdvancedSearchService, SearchConditionGroup, SearchCondition, SearchConditionType } from '../../services/AdvancedSearchService'
import { SearchAnalyticsService } from '../../services/SearchAnalyticsService'

// 增强的搜索过滤器
export interface EnhancedSearchFilter {
  entityTypes?: string[]
  moduleIds?: string[]
  tags?: string[]
  authors?: string[]
  dateRange?: {
    from?: Date
    to?: Date
    field?: 'created' | 'modified' | 'accessed'
  }
  fileTypes?: string[]
  sizeRange?: {
    min?: number
    max?: number
  }
  priority?: ('low' | 'medium' | 'high')[]
  status?: string[]
  customFields?: Record<string, any>
}

// 保存的搜索
export interface SavedSearch {
  id: string
  name: string
  description?: string
  query: string
  filters: EnhancedSearchFilter
  options: AdvancedSearchOptions
  createdAt: Date
  lastUsed?: Date
  useCount: number
  isPublic?: boolean
  tags?: string[]
}

// 搜索模板
export interface SearchTemplate {
  id: string
  name: string
  description: string
  category: 'common' | 'advanced' | 'custom'
  conditionGroup: SearchConditionGroup
  variables?: Array<{
    name: string
    label: string
    type: 'text' | 'date' | 'select' | 'multiselect'
    required?: boolean
    options?: string[]
    defaultValue?: any
  }>
}

// 增强版高级搜索组件属性
export interface EnhancedAdvancedSearchComponentProps {
  /** 统一搜索服务 */
  unifiedSearchService: UnifiedSearchService
  /** 高级搜索服务 */
  advancedSearchService: AdvancedSearchService
  /** 搜索分析服务 */
  searchAnalyticsService?: SearchAnalyticsService
  /** 是否显示保存搜索功能 */
  enableSavedSearches?: boolean
  /** 是否显示搜索模板 */
  enableSearchTemplates?: boolean
  /** 是否显示搜索分析 */
  enableSearchAnalytics?: boolean
  /** 是否启用智能建议 */
  enableSmartSuggestions?: boolean
  /** 是否启用实时搜索 */
  enableLiveSearch?: boolean
  /** 搜索防抖延迟 */
  searchDebounceMs?: number
  /** 最大搜索历史数量 */
  maxSearchHistory?: number
  /** 自定义样式类名 */
  className?: string
  /** 搜索结果回调 */
  onSearchResults?: (results: SearchResultAggregation) => void
  /** 搜索状态变更回调 */
  onSearchStateChange?: (isSearching: boolean) => void
  /** 错误回调 */
  onError?: (error: string) => void
}

/**
 * 增强版高级搜索组件
 */
export const EnhancedAdvancedSearchComponent: React.FC<EnhancedAdvancedSearchComponentProps> = ({
  unifiedSearchService,
  advancedSearchService,
  searchAnalyticsService,
  enableSavedSearches = true,
  enableSearchTemplates = true,
  enableSearchAnalytics = true,
  enableSmartSuggestions = true,
  enableLiveSearch = true,
  searchDebounceMs = 300,
  maxSearchHistory = 50,
  className,
  onSearchResults,
  onSearchStateChange,
  onError
}) => {
  // 搜索状态
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResultAggregation | null>(null)
  const [searchError, setSearchError] = useState<string>('')

  // 过滤器状态
  const [filters, setFilters] = useState<EnhancedSearchFilter>({})
  const [activeFilterCount, setActiveFilterCount] = useState(0)

  // 高级搜索状态
  const [searchMode, setSearchMode] = useState<'simple' | 'advanced' | 'template'>('simple')
  const [conditionGroup, setConditionGroup] = useState<SearchConditionGroup>({
    operator: 'AND',
    conditions: []
  })

  // UI状态
  const [showFilters, setShowFilters] = useState(false)
  const [showSavedSearches, setShowSavedSearches] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [selectedView, setSelectedView] = useState<'list' | 'grid' | 'timeline'>('list')

  // 保存搜索状态
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([])
  const [searchTemplates, setSearchTemplates] = useState<SearchTemplate[]>([])
  const [searchHistory, setSearchHistory] = useState<string[]>([])

  // 建议和自动补全
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [smartSuggestions, setSmartSuggestions] = useState<any[]>([])

  // 引用
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()

  // 计算活跃过滤器数量
  useEffect(() => {
    const count = Object.values(filters).filter(value => {
      if (Array.isArray(value)) return value.length > 0
      if (typeof value === 'object' && value !== null) {
        return Object.values(value).some(v => v !== undefined && v !== null && v !== '')
      }
      return value !== undefined && value !== null && value !== ''
    }).length
    setActiveFilterCount(count)
  }, [filters])

  // 防抖搜索
  const debouncedSearch = useCallback((searchQuery: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch(searchQuery)
      } else {
        setSearchResults(null)
      }
    }, searchDebounceMs)
  }, [searchDebounceMs])

  // 处理搜索输入变化
  const handleQueryChange = useCallback((value: string) => {
    setQuery(value)
    setSearchError('')

    // 获取搜索建议
    if (enableSmartSuggestions && value.trim()) {
      unifiedSearchService.getSearchSuggestions(value, 8).then(suggestions => {
        setSuggestions(suggestions)
        setShowSuggestions(suggestions.length > 0)
      })
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }

    // 实时搜索
    if (enableLiveSearch) {
      debouncedSearch(value)
    }
  }, [enableSmartSuggestions, enableLiveSearch, unifiedSearchService, debouncedSearch])

  // 执行搜索
  const performSearch = useCallback(async (searchQuery?: string) => {
    const queryToSearch = searchQuery || query
    if (!queryToSearch.trim()) return

    setIsSearching(true)
    setSearchError('')
    onSearchStateChange?.(true)

    try {
      let results: SearchResultAggregation

      if (searchMode === 'advanced' && conditionGroup.conditions.length > 0) {
        // 高级搜索
        results = await advancedSearchService.advancedSearch(conditionGroup, {
          entityTypes: filters.entityTypes,
          moduleIds: filters.moduleIds,
          dateRange: filters.dateRange,
          sortBy: 'relevance',
          sortOrder: 'desc',
          limit: 50
        })
      } else {
        // 简单搜索或智能搜索
        const searchOptions: AdvancedSearchOptions = {
          entityTypes: filters.entityTypes,
          moduleIds: filters.moduleIds,
          dateRange: filters.dateRange,
          sortBy: 'relevance',
          sortOrder: 'desc',
          limit: 50
        }

        if (enableSmartSuggestions) {
          results = await unifiedSearchService.smartSearch(queryToSearch, searchOptions)
        } else {
          results = await unifiedSearchService.search(queryToSearch, searchOptions)
        }
      }

      setSearchResults(results)
      onSearchResults?.(results)

      // 记录搜索分析
      if (enableSearchAnalytics && searchAnalyticsService) {
        searchAnalyticsService.recordSearch({
          query: queryToSearch,
          filters,
          resultCount: results.totalResults,
          searchTime: results.searchTime,
          timestamp: new Date()
        })
      }

      // 更新搜索历史
      if (queryToSearch && !searchHistory.includes(queryToSearch)) {
        const newHistory = [queryToSearch, ...searchHistory.slice(0, maxSearchHistory - 1)]
        setSearchHistory(newHistory)
        localStorage.setItem('minglog-search-history', JSON.stringify(newHistory))
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '搜索失败'
      setSearchError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsSearching(false)
      onSearchStateChange?.(false)
    }
  }, [
    query,
    searchMode,
    conditionGroup,
    filters,
    enableSmartSuggestions,
    enableSearchAnalytics,
    unifiedSearchService,
    advancedSearchService,
    searchAnalyticsService,
    searchHistory,
    maxSearchHistory,
    onSearchResults,
    onSearchStateChange,
    onError
  ])

  // 处理建议选择
  const handleSuggestionSelect = useCallback((suggestion: string) => {
    setQuery(suggestion)
    setShowSuggestions(false)
    performSearch(suggestion)
  }, [performSearch])

  // 处理过滤器变更
  const handleFilterChange = useCallback((newFilters: Partial<EnhancedSearchFilter>) => {
    const updatedFilters = { ...filters, ...newFilters }
    setFilters(updatedFilters)
    
    // 如果有查询，重新搜索
    if (query.trim()) {
      performSearch()
    }
  }, [filters, query, performSearch])

  // 保存搜索
  const handleSaveSearch = useCallback(async (name: string, description?: string) => {
    const savedSearch: SavedSearch = {
      id: `search-${Date.now()}`,
      name,
      description,
      query,
      filters,
      options: {
        entityTypes: filters.entityTypes,
        moduleIds: filters.moduleIds,
        dateRange: filters.dateRange
      },
      createdAt: new Date(),
      useCount: 0
    }

    const newSavedSearches = [...savedSearches, savedSearch]
    setSavedSearches(newSavedSearches)
    localStorage.setItem('minglog-saved-searches', JSON.stringify(newSavedSearches))
  }, [query, filters, savedSearches])

  // 加载保存的搜索
  const handleLoadSavedSearch = useCallback((savedSearch: SavedSearch) => {
    setQuery(savedSearch.query)
    setFilters(savedSearch.filters)
    performSearch(savedSearch.query)

    // 更新使用次数
    const updatedSavedSearches = savedSearches.map(s => 
      s.id === savedSearch.id 
        ? { ...s, useCount: s.useCount + 1, lastUsed: new Date() }
        : s
    )
    setSavedSearches(updatedSavedSearches)
    localStorage.setItem('minglog-saved-searches', JSON.stringify(updatedSavedSearches))
  }, [savedSearches, performSearch])

  // 清除搜索
  const handleClearSearch = useCallback(() => {
    setQuery('')
    setFilters({})
    setSearchResults(null)
    setSearchError('')
    setConditionGroup({ operator: 'AND', conditions: [] })
    setShowSuggestions(false)
  }, [])

  // 初始化加载
  useEffect(() => {
    // 加载保存的搜索
    const savedSearchesData = localStorage.getItem('minglog-saved-searches')
    if (savedSearchesData) {
      try {
        setSavedSearches(JSON.parse(savedSearchesData))
      } catch (error) {
        console.warn('Failed to load saved searches:', error)
      }
    }

    // 加载搜索历史
    const searchHistoryData = localStorage.getItem('minglog-search-history')
    if (searchHistoryData) {
      try {
        setSearchHistory(JSON.parse(searchHistoryData))
      } catch (error) {
        console.warn('Failed to load search history:', error)
      }
    }

    // 加载搜索模板
    const defaultTemplates: SearchTemplate[] = [
      {
        id: 'recent-notes',
        name: '最近的笔记',
        description: '查找最近创建或修改的笔记',
        category: 'common',
        conditionGroup: {
          operator: 'AND',
          conditions: [
            {
              type: SearchConditionType.ENTITY_TYPE,
              field: 'type',
              operator: 'equals',
              value: 'note'
            },
            {
              type: SearchConditionType.DATE,
              field: 'modified',
              operator: 'gte',
              value: '{{days_ago}}'
            }
          ]
        },
        variables: [
          {
            name: 'days_ago',
            label: '天数',
            type: 'select',
            options: ['1', '3', '7', '30'],
            defaultValue: '7'
          }
        ]
      },
      {
        id: 'important-tasks',
        name: '重要任务',
        description: '查找高优先级的未完成任务',
        category: 'common',
        conditionGroup: {
          operator: 'AND',
          conditions: [
            {
              type: SearchConditionType.ENTITY_TYPE,
              field: 'type',
              operator: 'equals',
              value: 'task'
            },
            {
              type: SearchConditionType.TAG,
              field: 'priority',
              operator: 'equals',
              value: 'high'
            },
            {
              type: SearchConditionType.TEXT,
              field: 'status',
              operator: 'not_equals',
              value: 'completed'
            }
          ]
        }
      }
    ]
    setSearchTemplates(defaultTemplates)
  }, [])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div className={cn('enhanced-advanced-search', className)}>
      {/* 搜索头部 */}
      <div className="search-header">
        <div className="search-title-section">
          <h2 className="search-title">🔍 高级搜索</h2>
          <div className="search-mode-tabs">
            <button
              className={cn('mode-tab', searchMode === 'simple' && 'active')}
              onClick={() => setSearchMode('simple')}
            >
              简单搜索
            </button>
            <button
              className={cn('mode-tab', searchMode === 'advanced' && 'active')}
              onClick={() => setSearchMode('advanced')}
            >
              高级搜索
            </button>
            {enableSearchTemplates && (
              <button
                className={cn('mode-tab', searchMode === 'template' && 'active')}
                onClick={() => setSearchMode('template')}
              >
                搜索模板
              </button>
            )}
          </div>
        </div>

        <div className="search-actions">
          <button
            className={cn('action-btn', showFilters && 'active')}
            onClick={() => setShowFilters(!showFilters)}
            title="过滤器"
          >
            🔧 过滤器 {activeFilterCount > 0 && `(${activeFilterCount})`}
          </button>

          {enableSavedSearches && (
            <button
              className={cn('action-btn', showSavedSearches && 'active')}
              onClick={() => setShowSavedSearches(!showSavedSearches)}
              title="保存的搜索"
            >
              💾 保存的搜索
            </button>
          )}

          {enableSearchAnalytics && (
            <button
              className={cn('action-btn', showAnalytics && 'active')}
              onClick={() => setShowAnalytics(!showAnalytics)}
              title="搜索分析"
            >
              📊 分析
            </button>
          )}
        </div>
      </div>

      {/* 主搜索区域 */}
      <div className="search-main">
        {searchMode === 'simple' && (
          <div className="simple-search">
            <div className="search-input-container">
              <input
                ref={searchInputRef}
                type="text"
                className="search-input"
                placeholder="输入搜索查询... (支持 AND、OR、NOT、引号、通配符)"
                value={query}
                onChange={(e) => handleQueryChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    performSearch()
                    setShowSuggestions(false)
                  } else if (e.key === 'Escape') {
                    setShowSuggestions(false)
                  }
                }}
              />

              <div className="search-input-actions">
                <button
                  className="search-btn search-btn--primary"
                  onClick={() => performSearch()}
                  disabled={isSearching}
                >
                  {isSearching ? '搜索中...' : '搜索'}
                </button>

                <button
                  className="search-btn search-btn--secondary"
                  onClick={handleClearSearch}
                >
                  清除
                </button>
              </div>

              {/* 搜索建议 */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="search-suggestions">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      className="search-suggestion"
                      onClick={() => handleSuggestionSelect(suggestion)}
                    >
                      🔍 {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {searchMode === 'advanced' && (
          <div className="advanced-search">
            {/* 高级搜索条件构建器 */}
            <div className="condition-builder">
              <h3>搜索条件</h3>
              {/* 这里可以实现条件构建器UI */}
              <div className="condition-placeholder">
                <p>高级搜索条件构建器</p>
                <p className="text-sm text-gray-500">支持复杂的搜索条件组合</p>
              </div>
            </div>
          </div>
        )}

        {searchMode === 'template' && enableSearchTemplates && (
          <div className="template-search">
            <h3>搜索模板</h3>
            <div className="template-grid">
              {searchTemplates.map(template => (
                <div key={template.id} className="template-card">
                  <h4>{template.name}</h4>
                  <p>{template.description}</p>
                  <button
                    className="template-use-btn"
                    onClick={() => {
                      // 使用模板逻辑
                      setConditionGroup(template.conditionGroup)
                      setSearchMode('advanced')
                    }}
                  >
                    使用模板
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 错误显示 */}
      {searchError && (
        <div className="search-error">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <span className="error-message">{searchError}</span>
            <button
              className="error-dismiss"
              onClick={() => setSearchError('')}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 搜索结果统计 */}
      {searchResults && (
        <div className="search-stats">
          <div className="stats-summary">
            <span>找到 {searchResults.totalResults} 个结果</span>
            <span>•</span>
            <span>用时 {searchResults.searchTime.toFixed(2)}ms</span>
          </div>

          <div className="view-controls">
            <button
              className={cn('view-btn', selectedView === 'list' && 'active')}
              onClick={() => setSelectedView('list')}
            >
              📋 列表
            </button>
            <button
              className={cn('view-btn', selectedView === 'grid' && 'active')}
              onClick={() => setSelectedView('grid')}
            >
              ⊞ 网格
            </button>
            <button
              className={cn('view-btn', selectedView === 'timeline' && 'active')}
              onClick={() => setSelectedView('timeline')}
            >
              📅 时间线
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default EnhancedAdvancedSearchComponent
