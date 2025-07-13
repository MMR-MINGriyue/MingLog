/**
 * 保存的搜索管理器组件
 * 管理用户保存的搜索查询和模板
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  Search, 
  Save, 
  Edit, 
  Trash2, 
  Play, 
  Copy, 
  Star, 
  Clock, 
  Tag, 
  Filter,
  Plus,
  MoreHorizontal,
  Eye,
  EyeOff
} from 'lucide-react'
import { 
  SavedSearchQuery, 
  SearchTemplate, 
  SearchConditionGroup,
  AdvancedSearchOptions 
} from '../../packages/core/src/services/AdvancedSearchService'

interface SavedSearchManagerProps {
  /** 保存的搜索查询列表 */
  savedQueries: SavedSearchQuery[]
  /** 搜索模板列表 */
  searchTemplates: SearchTemplate[]
  /** 执行搜索回调 */
  onExecuteSearch: (query: SearchConditionGroup, options: AdvancedSearchOptions) => void
  /** 编辑查询回调 */
  onEditQuery: (query: SavedSearchQuery) => void
  /** 删除查询回调 */
  onDeleteQuery: (queryId: string) => void
  /** 复制查询回调 */
  onDuplicateQuery: (query: SavedSearchQuery) => void
  /** 从模板创建查询回调 */
  onCreateFromTemplate: (template: SearchTemplate) => void
  /** 保存新查询回调 */
  onSaveQuery: (name: string, query: SearchConditionGroup, options: AdvancedSearchOptions, metadata?: any) => void
  /** 类名 */
  className?: string
}

type ViewMode = 'list' | 'grid' | 'compact'
type SortBy = 'name' | 'lastUsed' | 'useCount' | 'createdAt'
type FilterBy = 'all' | 'public' | 'private' | 'recent'

export const SavedSearchManager: React.FC<SavedSearchManagerProps> = ({
  savedQueries,
  searchTemplates,
  onExecuteSearch,
  onEditQuery,
  onDeleteQuery,
  onDuplicateQuery,
  onCreateFromTemplate,
  onSaveQuery,
  className = ''
}) => {
  // 状态管理
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [sortBy, setSortBy] = useState<SortBy>('lastUsed')
  const [filterBy, setFilterBy] = useState<FilterBy>('all')
  const [searchText, setSearchText] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showTemplates, setShowTemplates] = useState(true)
  const [expandedQuery, setExpandedQuery] = useState<string | null>(null)

  // 获取所有标签
  const allTags = useMemo(() => {
    const tags = new Set<string>()
    savedQueries.forEach(query => {
      query.tags.forEach(tag => tags.add(tag))
    })
    return Array.from(tags).sort()
  }, [savedQueries])

  // 过滤和排序查询
  const filteredAndSortedQueries = useMemo(() => {
    let filtered = savedQueries

    // 按文本搜索过滤
    if (searchText) {
      const lowerSearchText = searchText.toLowerCase()
      filtered = filtered.filter(query => 
        query.name.toLowerCase().includes(lowerSearchText) ||
        query.description?.toLowerCase().includes(lowerSearchText) ||
        query.tags.some(tag => tag.toLowerCase().includes(lowerSearchText))
      )
    }

    // 按标签过滤
    if (selectedTags.length > 0) {
      filtered = filtered.filter(query =>
        selectedTags.some(tag => query.tags.includes(tag))
      )
    }

    // 按类型过滤
    switch (filterBy) {
      case 'public':
        filtered = filtered.filter(query => query.isPublic)
        break
      case 'private':
        filtered = filtered.filter(query => !query.isPublic)
        break
      case 'recent':
        const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        filtered = filtered.filter(query => 
          query.lastUsed && query.lastUsed > oneWeekAgo
        )
        break
    }

    // 排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'lastUsed':
          const aLastUsed = a.lastUsed?.getTime() || 0
          const bLastUsed = b.lastUsed?.getTime() || 0
          return bLastUsed - aLastUsed
        case 'useCount':
          return b.useCount - a.useCount
        case 'createdAt':
          return b.createdAt.getTime() - a.createdAt.getTime()
        default:
          return 0
      }
    })

    return filtered
  }, [savedQueries, searchText, selectedTags, filterBy, sortBy])

  // 过滤模板
  const filteredTemplates = useMemo(() => {
    if (!searchText) return searchTemplates
    
    const lowerSearchText = searchText.toLowerCase()
    return searchTemplates.filter(template =>
      template.name.toLowerCase().includes(lowerSearchText) ||
      template.description.toLowerCase().includes(lowerSearchText) ||
      template.category.toLowerCase().includes(lowerSearchText)
    )
  }, [searchTemplates, searchText])

  // 执行查询
  const handleExecuteQuery = useCallback((query: SavedSearchQuery) => {
    onExecuteSearch(query.query, query.options)
  }, [onExecuteSearch])

  // 切换查询展开状态
  const toggleQueryExpanded = useCallback((queryId: string) => {
    setExpandedQuery(prev => prev === queryId ? null : queryId)
  }, [])

  // 切换标签选择
  const toggleTagSelection = useCallback((tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    )
  }, [])

  // 格式化日期
  const formatDate = useCallback((date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return '今天'
    } else if (diffDays === 1) {
      return '昨天'
    } else if (diffDays < 7) {
      return `${diffDays}天前`
    } else {
      return date.toLocaleDateString('zh-CN')
    }
  }, [])

  // 渲染查询项
  const renderQueryItem = (query: SavedSearchQuery) => {
    const isExpanded = expandedQuery === query.id

    return (
      <div key={query.id} className="saved-query-item">
        <div className="query-header">
          <div className="query-info">
            <h4 className="query-name">{query.name}</h4>
            {query.description && (
              <p className="query-description">{query.description}</p>
            )}
            <div className="query-meta">
              <span className="query-stats">
                <Clock size={12} />
                {query.lastUsed ? formatDate(query.lastUsed) : '从未使用'}
              </span>
              <span className="query-stats">
                <Play size={12} />
                使用 {query.useCount} 次
              </span>
              {query.isPublic && (
                <span className="query-public">
                  <Eye size={12} />
                  公开
                </span>
              )}
            </div>
            {query.tags.length > 0 && (
              <div className="query-tags">
                {query.tags.map(tag => (
                  <span key={tag} className="query-tag">
                    <Tag size={10} />
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          
          <div className="query-actions">
            <button
              onClick={() => handleExecuteQuery(query)}
              className="action-button execute-button"
              title="执行搜索"
            >
              <Play size={16} />
            </button>
            <button
              onClick={() => onEditQuery(query)}
              className="action-button edit-button"
              title="编辑查询"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={() => onDuplicateQuery(query)}
              className="action-button duplicate-button"
              title="复制查询"
            >
              <Copy size={16} />
            </button>
            <button
              onClick={() => toggleQueryExpanded(query.id)}
              className="action-button expand-button"
              title={isExpanded ? "收起详情" : "展开详情"}
            >
              <MoreHorizontal size={16} />
            </button>
            <button
              onClick={() => onDeleteQuery(query.id)}
              className="action-button delete-button"
              title="删除查询"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="query-details">
            <div className="query-conditions">
              <h5>搜索条件</h5>
              <pre className="conditions-preview">
                {JSON.stringify(query.query, null, 2)}
              </pre>
            </div>
            <div className="query-options">
              <h5>搜索选项</h5>
              <div className="options-grid">
                <div className="option-item">
                  <span className="option-label">排序方式:</span>
                  <span className="option-value">{query.options.sortBy || '相关性'}</span>
                </div>
                <div className="option-item">
                  <span className="option-label">结果数量:</span>
                  <span className="option-value">{query.options.limit || 20}</span>
                </div>
                <div className="option-item">
                  <span className="option-label">包含关联:</span>
                  <span className="option-value">{query.options.includeAssociations ? '是' : '否'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // 渲染模板项
  const renderTemplateItem = (template: SearchTemplate) => {
    return (
      <div key={template.id} className="search-template-item">
        <div className="template-info">
          <h4 className="template-name">{template.name}</h4>
          <p className="template-description">{template.description}</p>
          <div className="template-meta">
            <span className="template-category">{template.category}</span>
            {template.isBuiltIn && (
              <span className="template-builtin">内置模板</span>
            )}
          </div>
        </div>
        
        <div className="template-actions">
          <button
            onClick={() => onCreateFromTemplate(template)}
            className="action-button use-template-button"
            title="使用模板"
          >
            <Plus size={16} />
            使用模板
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`saved-search-manager ${className}`}>
      {/* 工具栏 */}
      <div className="manager-toolbar">
        <div className="toolbar-left">
          <div className="search-input-container">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="搜索保存的查询和模板..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
        
        <div className="toolbar-right">
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as FilterBy)}
            className="filter-select"
          >
            <option value="all">全部查询</option>
            <option value="recent">最近使用</option>
            <option value="public">公开查询</option>
            <option value="private">私有查询</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="sort-select"
          >
            <option value="lastUsed">最近使用</option>
            <option value="name">名称</option>
            <option value="useCount">使用次数</option>
            <option value="createdAt">创建时间</option>
          </select>
          
          <button
            onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
            className="view-mode-button"
            title="切换视图模式"
          >
            <Filter size={16} />
          </button>
        </div>
      </div>

      {/* 标签过滤器 */}
      {allTags.length > 0 && (
        <div className="tags-filter">
          <span className="filter-label">标签过滤:</span>
          <div className="tags-list">
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTagSelection(tag)}
                className={`tag-filter-button ${selectedTags.includes(tag) ? 'selected' : ''}`}
              >
                <Tag size={12} />
                {tag}
              </button>
            ))}
          </div>
          {selectedTags.length > 0 && (
            <button
              onClick={() => setSelectedTags([])}
              className="clear-tags-button"
            >
              清除标签过滤
            </button>
          )}
        </div>
      )}

      {/* 内容区域 */}
      <div className="manager-content">
        {/* 搜索模板 */}
        {showTemplates && filteredTemplates.length > 0 && (
          <div className="templates-section">
            <div className="section-header">
              <h3>搜索模板</h3>
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="toggle-section-button"
              >
                {showTemplates ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="templates-grid">
              {filteredTemplates.map(renderTemplateItem)}
            </div>
          </div>
        )}

        {/* 保存的查询 */}
        <div className="saved-queries-section">
          <div className="section-header">
            <h3>保存的搜索查询 ({filteredAndSortedQueries.length})</h3>
          </div>
          
          {filteredAndSortedQueries.length === 0 ? (
            <div className="empty-state">
              <Search size={48} className="empty-icon" />
              <h4>暂无保存的搜索查询</h4>
              <p>创建并保存您的第一个搜索查询，以便快速重复使用。</p>
            </div>
          ) : (
            <div className={`queries-list ${viewMode}`}>
              {filteredAndSortedQueries.map(renderQueryItem)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SavedSearchManager
