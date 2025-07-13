/**
 * 增强版搜索结果组件
 * 支持多种视图模式、结果聚合、智能排序和交互功能
 */

import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { cn } from '../../utils'
import { SearchResultAggregation, UnifiedSearchResult } from '../../services/UnifiedSearchService'
import { SearchAnalyticsService } from '../../services/SearchAnalyticsService'

// 视图模式
export type SearchResultViewMode = 'list' | 'grid' | 'timeline' | 'table' | 'map'

// 排序选项
export interface SearchResultSortOption {
  field: 'relevance' | 'date' | 'title' | 'type' | 'size'
  order: 'asc' | 'desc'
  label: string
}

// 分组选项
export interface SearchResultGroupOption {
  field: 'type' | 'module' | 'date' | 'author' | 'tag'
  label: string
}

// 增强版搜索结果组件属性
export interface EnhancedSearchResultsComponentProps {
  /** 搜索结果聚合数据 */
  results: SearchResultAggregation
  /** 搜索分析服务 */
  searchAnalyticsService?: SearchAnalyticsService
  /** 当前搜索查询 */
  query: string
  /** 视图模式 */
  viewMode?: SearchResultViewMode
  /** 是否显示统计信息 */
  showStatistics?: boolean
  /** 是否显示过滤器 */
  showFilters?: boolean
  /** 是否启用虚拟化 */
  enableVirtualization?: boolean
  /** 是否启用无限滚动 */
  enableInfiniteScroll?: boolean
  /** 每页显示数量 */
  pageSize?: number
  /** 是否显示预览 */
  showPreview?: boolean
  /** 是否启用拖拽 */
  enableDragDrop?: boolean
  /** 自定义样式类名 */
  className?: string
  /** 结果点击回调 */
  onResultClick?: (result: UnifiedSearchResult, index: number) => void
  /** 结果选择回调 */
  onResultSelect?: (results: UnifiedSearchResult[]) => void
  /** 视图模式变更回调 */
  onViewModeChange?: (mode: SearchResultViewMode) => void
  /** 排序变更回调 */
  onSortChange?: (sort: SearchResultSortOption) => void
  /** 加载更多回调 */
  onLoadMore?: () => Promise<void>
}

/**
 * 增强版搜索结果组件
 */
export const EnhancedSearchResultsComponent: React.FC<EnhancedSearchResultsComponentProps> = ({
  results,
  searchAnalyticsService,
  query,
  viewMode = 'list',
  showStatistics = true,
  showFilters = true,
  enableVirtualization = true,
  enableInfiniteScroll = false,
  pageSize = 20,
  showPreview = true,
  enableDragDrop = false,
  className,
  onResultClick,
  onResultSelect,
  onViewModeChange,
  onSortChange,
  onLoadMore
}) => {
  // 状态管理
  const [selectedResults, setSelectedResults] = useState<Set<string>>(new Set())
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set())
  const [currentSort, setCurrentSort] = useState<SearchResultSortOption>({
    field: 'relevance',
    order: 'desc',
    label: '相关性'
  })
  const [currentGroup, setCurrentGroup] = useState<SearchResultGroupOption | null>(null)
  const [showGrouping, setShowGrouping] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [visibleResults, setVisibleResults] = useState<UnifiedSearchResult[]>([])
  const [currentPage, setCurrentPage] = useState(1)

  // 引用
  const containerRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver>()

  // 排序选项
  const sortOptions: SearchResultSortOption[] = [
    { field: 'relevance', order: 'desc', label: '相关性' },
    { field: 'date', order: 'desc', label: '最新' },
    { field: 'date', order: 'asc', label: '最旧' },
    { field: 'title', order: 'asc', label: '标题 A-Z' },
    { field: 'title', order: 'desc', label: '标题 Z-A' },
    { field: 'type', order: 'asc', label: '类型' }
  ]

  // 分组选项
  const groupOptions: SearchResultGroupOption[] = [
    { field: 'type', label: '按类型' },
    { field: 'module', label: '按模块' },
    { field: 'date', label: '按日期' },
    { field: 'author', label: '按作者' },
    { field: 'tag', label: '按标签' }
  ]

  // 处理结果排序
  const sortedResults = useMemo(() => {
    const sorted = [...results.results]

    switch (currentSort.field) {
      case 'relevance':
        return sorted.sort((a, b) => 
          currentSort.order === 'desc' ? b.score - a.score : a.score - b.score
        )
      case 'date':
        return sorted.sort((a, b) => {
          const dateA = new Date(a.lastModified || a.createdAt || 0)
          const dateB = new Date(b.lastModified || b.createdAt || 0)
          return currentSort.order === 'desc' 
            ? dateB.getTime() - dateA.getTime()
            : dateA.getTime() - dateB.getTime()
        })
      case 'title':
        return sorted.sort((a, b) => {
          const comparison = a.title.localeCompare(b.title)
          return currentSort.order === 'desc' ? -comparison : comparison
        })
      case 'type':
        return sorted.sort((a, b) => {
          const comparison = a.entityType.localeCompare(b.entityType)
          return currentSort.order === 'desc' ? -comparison : comparison
        })
      default:
        return sorted
    }
  }, [results.results, currentSort])

  // 处理结果分组
  const groupedResults = useMemo(() => {
    if (!currentGroup) return { '全部结果': sortedResults }

    const groups: Record<string, UnifiedSearchResult[]> = {}

    sortedResults.forEach(result => {
      let groupKey: string

      switch (currentGroup.field) {
        case 'type':
          groupKey = result.entityType
          break
        case 'module':
          groupKey = result.moduleId || '未知模块'
          break
        case 'date':
          const date = new Date(result.lastModified || result.createdAt || 0)
          groupKey = date.toLocaleDateString()
          break
        case 'author':
          groupKey = result.metadata?.author || '未知作者'
          break
        case 'tag':
          const tags = result.metadata?.tags || []
          groupKey = tags.length > 0 ? tags[0] : '无标签'
          break
        default:
          groupKey = '其他'
      }

      if (!groups[groupKey]) {
        groups[groupKey] = []
      }
      groups[groupKey].push(result)
    })

    return groups
  }, [sortedResults, currentGroup])

  // 处理分页和虚拟化
  useEffect(() => {
    const totalResults = sortedResults.length
    const endIndex = currentPage * pageSize
    setVisibleResults(sortedResults.slice(0, Math.min(endIndex, totalResults)))
  }, [sortedResults, currentPage, pageSize])

  // 处理结果点击
  const handleResultClick = useCallback((result: UnifiedSearchResult, index: number) => {
    // 记录点击分析
    if (searchAnalyticsService) {
      searchAnalyticsService.recordResultClick(
        `search_${Date.now()}`, // 这里应该使用实际的搜索ID
        result.id
      )
    }

    onResultClick?.(result, index)
  }, [searchAnalyticsService, onResultClick])

  // 处理结果选择
  const handleResultSelect = useCallback((resultId: string, selected: boolean) => {
    const newSelected = new Set(selectedResults)
    if (selected) {
      newSelected.add(resultId)
    } else {
      newSelected.delete(resultId)
    }
    setSelectedResults(newSelected)

    // 调用选择回调
    const selectedResultObjects = sortedResults.filter(r => newSelected.has(r.id))
    onResultSelect?.(selectedResultObjects)
  }, [selectedResults, sortedResults, onResultSelect])

  // 处理全选
  const handleSelectAll = useCallback((selected: boolean) => {
    if (selected) {
      const allIds = new Set(visibleResults.map(r => r.id))
      setSelectedResults(allIds)
      onResultSelect?.(visibleResults)
    } else {
      setSelectedResults(new Set())
      onResultSelect?.([])
    }
  }, [visibleResults, onResultSelect])

  // 处理排序变更
  const handleSortChange = useCallback((sort: SearchResultSortOption) => {
    setCurrentSort(sort)
    setCurrentPage(1) // 重置到第一页
    onSortChange?.(sort)
  }, [onSortChange])

  // 处理视图模式变更
  const handleViewModeChange = useCallback((mode: SearchResultViewMode) => {
    onViewModeChange?.(mode)
  }, [onViewModeChange])

  // 处理加载更多
  const handleLoadMore = useCallback(async () => {
    if (isLoading || !enableInfiniteScroll) return

    setIsLoading(true)
    try {
      if (onLoadMore) {
        await onLoadMore()
      } else {
        // 默认分页逻辑
        setCurrentPage(prev => prev + 1)
      }
    } catch (error) {
      console.error('加载更多结果失败:', error)
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, enableInfiniteScroll, onLoadMore])

  // 设置无限滚动观察器
  useEffect(() => {
    if (!enableInfiniteScroll) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading) {
          handleLoadMore()
        }
      },
      { threshold: 0.1 }
    )

    observerRef.current = observer

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [enableInfiniteScroll, isLoading, handleLoadMore])

  // 渲染统计信息
  const renderStatistics = () => {
    if (!showStatistics) return null

    return (
      <div className="search-statistics">
        <div className="stats-summary">
          <span className="total-results">
            找到 <strong>{results.totalResults}</strong> 个结果
          </span>
          <span className="search-time">
            用时 <strong>{results.searchTime.toFixed(2)}ms</strong>
          </span>
          {selectedResults.size > 0 && (
            <span className="selected-count">
              已选择 <strong>{selectedResults.size}</strong> 个
            </span>
          )}
        </div>

        <div className="stats-breakdown">
          {Object.entries(results.resultsByType).map(([type, count]) => (
            <span key={type} className="type-stat">
              {type}: {count}
            </span>
          ))}
        </div>
      </div>
    )
  }

  // 渲染工具栏
  const renderToolbar = () => (
    <div className="search-toolbar">
      <div className="toolbar-left">
        {/* 视图模式切换 */}
        <div className="view-mode-selector">
          {(['list', 'grid', 'timeline', 'table'] as SearchResultViewMode[]).map(mode => (
            <button
              key={mode}
              className={cn('view-mode-btn', viewMode === mode && 'active')}
              onClick={() => handleViewModeChange(mode)}
              title={`${mode}视图`}
            >
              {mode === 'list' && '📋'}
              {mode === 'grid' && '⊞'}
              {mode === 'timeline' && '📅'}
              {mode === 'table' && '📊'}
            </button>
          ))}
        </div>

        {/* 排序选择器 */}
        <div className="sort-selector">
          <select
            value={`${currentSort.field}-${currentSort.order}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-')
              const sortOption = sortOptions.find(
                s => s.field === field && s.order === order
              )
              if (sortOption) handleSortChange(sortOption)
            }}
            className="sort-select"
          >
            {sortOptions.map(option => (
              <option
                key={`${option.field}-${option.order}`}
                value={`${option.field}-${option.order}`}
              >
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* 分组选择器 */}
        <div className="group-selector">
          <button
            className={cn('group-toggle', showGrouping && 'active')}
            onClick={() => setShowGrouping(!showGrouping)}
          >
            🗂️ 分组
          </button>
          {showGrouping && (
            <div className="group-options">
              <button
                className={cn('group-option', !currentGroup && 'active')}
                onClick={() => setCurrentGroup(null)}
              >
                不分组
              </button>
              {groupOptions.map(option => (
                <button
                  key={option.field}
                  className={cn('group-option', currentGroup?.field === option.field && 'active')}
                  onClick={() => setCurrentGroup(option)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="toolbar-right">
        {/* 全选控制 */}
        {visibleResults.length > 0 && (
          <div className="select-all-control">
            <label className="select-all-label">
              <input
                type="checkbox"
                checked={selectedResults.size === visibleResults.length && visibleResults.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
              <span>全选</span>
            </label>
          </div>
        )}

        {/* 批量操作 */}
        {selectedResults.size > 0 && (
          <div className="batch-actions">
            <button className="batch-action-btn">
              导出 ({selectedResults.size})
            </button>
            <button className="batch-action-btn">
              添加标签
            </button>
          </div>
        )}
      </div>
    </div>
  )

  // 渲染结果项
  const renderResultItem = (result: UnifiedSearchResult, index: number) => {
    const isSelected = selectedResults.has(result.id)
    const isExpanded = expandedResults.has(result.id)

    return (
      <div
        key={result.id}
        className={cn(
          'search-result-item',
          `view-${viewMode}`,
          isSelected && 'selected',
          isExpanded && 'expanded'
        )}
        onClick={() => handleResultClick(result, index)}
      >
        {/* 选择框 */}
        <div className="result-select">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation()
              handleResultSelect(result.id, e.target.checked)
            }}
          />
        </div>

        {/* 结果内容 */}
        <div className="result-content">
          <div className="result-header">
            <h3 className="result-title">{result.title}</h3>
            <div className="result-meta">
              <span className="result-type">{result.entityType}</span>
              <span className="result-score">相关性: {(result.score * 100).toFixed(1)}%</span>
              {result.lastModified && (
                <span className="result-date">
                  {new Date(result.lastModified).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          {result.snippet && (
            <div className="result-snippet">
              <p dangerouslySetInnerHTML={{ __html: result.snippet }} />
            </div>
          )}

          {result.metadata?.tags && result.metadata.tags.length > 0 && (
            <div className="result-tags">
              {result.metadata.tags.map((tag: string) => (
                <span key={tag} className="result-tag">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="result-actions">
          <button
            className="action-btn"
            onClick={(e) => {
              e.stopPropagation()
              const newExpanded = new Set(expandedResults)
              if (isExpanded) {
                newExpanded.delete(result.id)
              } else {
                newExpanded.add(result.id)
              }
              setExpandedResults(newExpanded)
            }}
          >
            {isExpanded ? '收起' : '展开'}
          </button>
          <button className="action-btn">
            打开
          </button>
        </div>
      </div>
    )
  }

  // 渲染结果列表
  const renderResults = () => {
    if (results.results.length === 0) {
      return (
        <div className="empty-results">
          <div className="empty-icon">🔍</div>
          <h3>未找到相关结果</h3>
          <p>尝试使用不同的关键词或调整搜索条件</p>
          {results.suggestions && results.suggestions.length > 0 && (
            <div className="search-suggestions">
              <p>建议搜索：</p>
              <div className="suggestion-list">
                {results.suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="suggestion-btn"
                    onClick={() => {
                      // 这里应该触发新的搜索
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )
    }

    if (currentGroup) {
      // 分组显示
      return (
        <div className="grouped-results">
          {Object.entries(groupedResults).map(([groupName, groupResults]) => (
            <div key={groupName} className="result-group">
              <h3 className="group-title">
                {groupName} ({groupResults.length})
              </h3>
              <div className="group-results">
                {groupResults.map((result, index) => renderResultItem(result, index))}
              </div>
            </div>
          ))}
        </div>
      )
    } else {
      // 普通显示
      return (
        <div className="result-list">
          {visibleResults.map((result, index) => renderResultItem(result, index))}
        </div>
      )
    }
  }

  return (
    <div className={cn('enhanced-search-results', className)} ref={containerRef}>
      {/* 统计信息 */}
      {renderStatistics()}

      {/* 工具栏 */}
      {renderToolbar()}

      {/* 结果列表 */}
      <div className="results-container">
        {renderResults()}

        {/* 加载更多 */}
        {enableInfiniteScroll && visibleResults.length < sortedResults.length && (
          <div
            className="load-more-trigger"
            ref={(el) => {
              if (el && observerRef.current) {
                observerRef.current.observe(el)
              }
            }}
          >
            {isLoading ? (
              <div className="loading-indicator">
                <div className="spinner" />
                <span>加载中...</span>
              </div>
            ) : (
              <button className="load-more-btn" onClick={handleLoadMore}>
                加载更多
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default EnhancedSearchResultsComponent
