/**
 * 搜索查询构建器组件
 * 提供可视化的多条件搜索构建界面
 */

import React, { useState, useCallback, useMemo } from 'react'
import { 
  Plus, 
  Minus, 
  Search, 
  Filter, 
  Save, 
  Play, 
  Copy, 
  Settings,
  ChevronDown,
  ChevronRight,
  Calendar,
  Tag,
  Type,
  Hash,
  Link
} from 'lucide-react'
import { 
  SearchCondition, 
  SearchConditionGroup, 
  SearchConditionType, 
  SearchOperator,
  AdvancedSearchOptions 
} from '../../packages/core/src/services/AdvancedSearchService'
import { EntityType } from '../../packages/core/src/services/DataAssociationService'

interface SearchQueryBuilderProps {
  /** 初始查询条件组 */
  initialQuery?: SearchConditionGroup
  /** 搜索选项 */
  searchOptions?: AdvancedSearchOptions
  /** 执行搜索回调 */
  onSearch: (query: SearchConditionGroup, options: AdvancedSearchOptions) => void
  /** 保存查询回调 */
  onSave?: (query: SearchConditionGroup, options: AdvancedSearchOptions) => void
  /** 查询变更回调 */
  onChange?: (query: SearchConditionGroup) => void
  /** 是否只读模式 */
  readonly?: boolean
  /** 类名 */
  className?: string
}

export const SearchQueryBuilder: React.FC<SearchQueryBuilderProps> = ({
  initialQuery,
  searchOptions = {},
  onSearch,
  onSave,
  onChange,
  readonly = false,
  className = ''
}) => {
  // 状态管理
  const [query, setQuery] = useState<SearchConditionGroup>(
    initialQuery || createEmptyConditionGroup()
  )
  const [options, setOptions] = useState<AdvancedSearchOptions>(searchOptions)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set([query.id]))
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)

  // 创建空的条件组
  function createEmptyConditionGroup(): SearchConditionGroup {
    return {
      id: generateId(),
      name: '搜索条件',
      operator: SearchOperator.AND,
      conditions: [],
      enabled: true
    }
  }

  // 创建空的搜索条件
  function createEmptyCondition(): SearchCondition {
    return {
      id: generateId(),
      type: SearchConditionType.TEXT,
      operator: SearchOperator.AND,
      value: '',
      enabled: true
    }
  }

  // 生成ID
  function generateId(): string {
    return `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // 更新查询并触发回调
  const updateQuery = useCallback((newQuery: SearchConditionGroup) => {
    setQuery(newQuery)
    onChange?.(newQuery)
  }, [onChange])

  // 添加条件
  const addCondition = useCallback((groupId: string, type: 'condition' | 'group' = 'condition') => {
    const newQuery = { ...query }
    const group = findGroupById(newQuery, groupId)
    
    if (group) {
      if (type === 'condition') {
        group.conditions.push(createEmptyCondition())
      } else {
        const newGroup = createEmptyConditionGroup()
        newGroup.name = `条件组 ${group.conditions.length + 1}`
        group.conditions.push(newGroup)
        setExpandedGroups(prev => new Set([...prev, newGroup.id]))
      }
      updateQuery(newQuery)
    }
  }, [query, updateQuery])

  // 删除条件
  const removeCondition = useCallback((groupId: string, conditionIndex: number) => {
    const newQuery = { ...query }
    const group = findGroupById(newQuery, groupId)
    
    if (group && group.conditions.length > conditionIndex) {
      group.conditions.splice(conditionIndex, 1)
      updateQuery(newQuery)
    }
  }, [query, updateQuery])

  // 更新条件
  const updateCondition = useCallback((
    groupId: string, 
    conditionIndex: number, 
    updates: Partial<SearchCondition | SearchConditionGroup>
  ) => {
    const newQuery = { ...query }
    const group = findGroupById(newQuery, groupId)
    
    if (group && group.conditions.length > conditionIndex) {
      group.conditions[conditionIndex] = { ...group.conditions[conditionIndex], ...updates }
      updateQuery(newQuery)
    }
  }, [query, updateQuery])

  // 更新条件组
  const updateGroup = useCallback((groupId: string, updates: Partial<SearchConditionGroup>) => {
    const newQuery = { ...query }
    const group = findGroupById(newQuery, groupId)
    
    if (group) {
      Object.assign(group, updates)
      updateQuery(newQuery)
    }
  }, [query, updateQuery])

  // 查找条件组
  function findGroupById(root: SearchConditionGroup, id: string): SearchConditionGroup | null {
    if (root.id === id) return root
    
    for (const condition of root.conditions) {
      if (!isSearchCondition(condition)) {
        const found = findGroupById(condition, id)
        if (found) return found
      }
    }
    
    return null
  }

  // 判断是否为搜索条件
  function isSearchCondition(item: SearchCondition | SearchConditionGroup): item is SearchCondition {
    return 'type' in item
  }

  // 切换条件组展开状态
  const toggleGroupExpanded = useCallback((groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(groupId)) {
        newSet.delete(groupId)
      } else {
        newSet.add(groupId)
      }
      return newSet
    })
  }, [])

  // 执行搜索
  const handleSearch = useCallback(() => {
    onSearch(query, options)
  }, [query, options, onSearch])

  // 保存查询
  const handleSave = useCallback(() => {
    onSave?.(query, options)
  }, [query, options, onSave])

  // 条件类型选项
  const conditionTypeOptions = useMemo(() => [
    { value: SearchConditionType.TEXT, label: '文本搜索', icon: Type },
    { value: SearchConditionType.REGEX, label: '正则表达式', icon: Hash },
    { value: SearchConditionType.EXACT, label: '精确匹配', icon: Search },
    { value: SearchConditionType.FUZZY, label: '模糊匹配', icon: Filter },
    { value: SearchConditionType.DATE_RANGE, label: '日期范围', icon: Calendar },
    { value: SearchConditionType.ENTITY_TYPE, label: '实体类型', icon: Type },
    { value: SearchConditionType.TAG, label: '标签', icon: Tag },
    { value: SearchConditionType.ASSOCIATION, label: '关联', icon: Link }
  ], [])

  // 操作符选项
  const operatorOptions = useMemo(() => [
    { value: SearchOperator.AND, label: '并且 (AND)' },
    { value: SearchOperator.OR, label: '或者 (OR)' },
    { value: SearchOperator.NOT, label: '排除 (NOT)' }
  ], [])

  // 实体类型选项
  const entityTypeOptions = useMemo(() => [
    { value: EntityType.NOTE, label: '笔记' },
    { value: EntityType.TASK, label: '任务' },
    { value: EntityType.MINDMAP_NODE, label: '思维导图节点' },
    { value: EntityType.GRAPH_NODE, label: '图谱节点' },
    { value: EntityType.FILE, label: '文件' },
    { value: EntityType.TAG, label: '标签' },
    { value: EntityType.PROJECT, label: '项目' }
  ], [])

  // 渲染条件组
  const renderConditionGroup = (group: SearchConditionGroup, depth: number = 0) => {
    const isExpanded = expandedGroups.has(group.id)
    const indentClass = depth > 0 ? `ml-${depth * 4}` : ''

    return (
      <div key={group.id} className={`condition-group ${indentClass}`}>
        {/* 条件组头部 */}
        <div className="group-header">
          <button
            onClick={() => toggleGroupExpanded(group.id)}
            className="expand-button"
            disabled={readonly}
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          
          <input
            type="text"
            value={group.name}
            onChange={(e) => updateGroup(group.id, { name: e.target.value })}
            className="group-name-input"
            disabled={readonly}
          />
          
          <select
            value={group.operator}
            onChange={(e) => updateGroup(group.id, { operator: e.target.value as SearchOperator })}
            className="operator-select"
            disabled={readonly}
          >
            {operatorOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          <label className="enabled-checkbox">
            <input
              type="checkbox"
              checked={group.enabled}
              onChange={(e) => updateGroup(group.id, { enabled: e.target.checked })}
              disabled={readonly}
            />
            启用
          </label>
          
          {!readonly && (
            <div className="group-actions">
              <button
                onClick={() => addCondition(group.id, 'condition')}
                className="add-condition-button"
                title="添加条件"
              >
                <Plus size={14} />
              </button>
              <button
                onClick={() => addCondition(group.id, 'group')}
                className="add-group-button"
                title="添加条件组"
              >
                <Filter size={14} />
              </button>
            </div>
          )}
        </div>

        {/* 条件组内容 */}
        {isExpanded && (
          <div className="group-content">
            {group.conditions.map((condition, index) => (
              <div key={isSearchCondition(condition) ? condition.id : condition.id} className="condition-item">
                {isSearchCondition(condition) ? (
                  renderSearchCondition(condition, group.id, index)
                ) : (
                  renderConditionGroup(condition, depth + 1)
                )}
              </div>
            ))}
            
            {group.conditions.length === 0 && (
              <div className="empty-group">
                <p>暂无搜索条件</p>
                {!readonly && (
                  <button
                    onClick={() => addCondition(group.id, 'condition')}
                    className="add-first-condition"
                  >
                    <Plus size={16} />
                    添加第一个条件
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // 渲染搜索条件
  const renderSearchCondition = (condition: SearchCondition, groupId: string, index: number) => {
    const conditionType = conditionTypeOptions.find(opt => opt.value === condition.type)
    const IconComponent = conditionType?.icon || Search

    return (
      <div className="search-condition">
        <div className="condition-header">
          <IconComponent size={16} className="condition-icon" />
          
          <select
            value={condition.type}
            onChange={(e) => updateCondition(groupId, index, { 
              type: e.target.value as SearchConditionType,
              value: '' // 重置值
            })}
            className="condition-type-select"
            disabled={readonly}
          >
            {conditionTypeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          <select
            value={condition.operator}
            onChange={(e) => updateCondition(groupId, index, { operator: e.target.value as SearchOperator })}
            className="condition-operator-select"
            disabled={readonly}
          >
            {operatorOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          
          <label className="condition-enabled">
            <input
              type="checkbox"
              checked={condition.enabled}
              onChange={(e) => updateCondition(groupId, index, { enabled: e.target.checked })}
              disabled={readonly}
            />
            启用
          </label>
          
          {!readonly && (
            <button
              onClick={() => removeCondition(groupId, index)}
              className="remove-condition-button"
              title="删除条件"
            >
              <Minus size={14} />
            </button>
          )}
        </div>
        
        <div className="condition-content">
          {renderConditionInput(condition, groupId, index)}
        </div>
      </div>
    )
  }

  // 渲染条件输入
  const renderConditionInput = (condition: SearchCondition, groupId: string, index: number) => {
    switch (condition.type) {
      case SearchConditionType.TEXT:
      case SearchConditionType.REGEX:
      case SearchConditionType.EXACT:
      case SearchConditionType.FUZZY:
        return (
          <input
            type="text"
            value={condition.value || ''}
            onChange={(e) => updateCondition(groupId, index, { value: e.target.value })}
            placeholder={getConditionPlaceholder(condition.type)}
            className="condition-value-input"
            disabled={readonly}
          />
        )
      
      case SearchConditionType.ENTITY_TYPE:
        return (
          <select
            value={condition.value || ''}
            onChange={(e) => updateCondition(groupId, index, { value: e.target.value })}
            className="condition-value-select"
            disabled={readonly}
          >
            <option value="">选择实体类型</option>
            {entityTypeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )
      
      case SearchConditionType.DATE_RANGE:
        return (
          <div className="date-range-inputs">
            <input
              type="date"
              value={condition.value?.from?.toISOString().split('T')[0] || ''}
              onChange={(e) => updateCondition(groupId, index, { 
                value: { 
                  ...condition.value, 
                  from: e.target.value ? new Date(e.target.value) : undefined 
                }
              })}
              className="date-input"
              disabled={readonly}
            />
            <span>到</span>
            <input
              type="date"
              value={condition.value?.to?.toISOString().split('T')[0] || ''}
              onChange={(e) => updateCondition(groupId, index, { 
                value: { 
                  ...condition.value, 
                  to: e.target.value ? new Date(e.target.value) : undefined 
                }
              })}
              className="date-input"
              disabled={readonly}
            />
          </div>
        )
      
      case SearchConditionType.TAG:
        return (
          <input
            type="text"
            value={condition.value || ''}
            onChange={(e) => updateCondition(groupId, index, { value: e.target.value })}
            placeholder="输入标签名称"
            className="condition-value-input"
            disabled={readonly}
          />
        )
      
      default:
        return (
          <input
            type="text"
            value={condition.value || ''}
            onChange={(e) => updateCondition(groupId, index, { value: e.target.value })}
            placeholder="输入搜索值"
            className="condition-value-input"
            disabled={readonly}
          />
        )
    }
  }

  // 获取条件占位符
  function getConditionPlaceholder(type: SearchConditionType): string {
    switch (type) {
      case SearchConditionType.TEXT:
        return '输入搜索文本...'
      case SearchConditionType.REGEX:
        return '输入正则表达式...'
      case SearchConditionType.EXACT:
        return '输入精确匹配文本...'
      case SearchConditionType.FUZZY:
        return '输入模糊匹配文本...'
      default:
        return '输入搜索值...'
    }
  }

  return (
    <div className={`search-query-builder ${className}`}>
      {/* 工具栏 */}
      <div className="query-builder-toolbar">
        <div className="toolbar-left">
          <h3>搜索查询构建器</h3>
        </div>
        
        <div className="toolbar-right">
          <button
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className="toggle-options-button"
          >
            <Settings size={16} />
            高级选项
          </button>
          
          {onSave && (
            <button
              onClick={handleSave}
              className="save-button"
              disabled={readonly}
            >
              <Save size={16} />
              保存查询
            </button>
          )}
          
          <button
            onClick={handleSearch}
            className="search-button"
            disabled={query.conditions.length === 0}
          >
            <Play size={16} />
            执行搜索
          </button>
        </div>
      </div>

      {/* 高级选项 */}
      {showAdvancedOptions && (
        <div className="advanced-options">
          <div className="options-grid">
            <div className="option-group">
              <label>排序方式</label>
              <select
                value={options.sortBy || 'relevance'}
                onChange={(e) => setOptions(prev => ({ ...prev, sortBy: e.target.value as any }))}
                disabled={readonly}
              >
                <option value="relevance">相关性</option>
                <option value="date">日期</option>
                <option value="title">标题</option>
              </select>
            </div>
            
            <div className="option-group">
              <label>排序顺序</label>
              <select
                value={options.sortOrder || 'desc'}
                onChange={(e) => setOptions(prev => ({ ...prev, sortOrder: e.target.value as any }))}
                disabled={readonly}
              >
                <option value="desc">降序</option>
                <option value="asc">升序</option>
              </select>
            </div>
            
            <div className="option-group">
              <label>结果数量</label>
              <input
                type="number"
                value={options.limit || 20}
                onChange={(e) => setOptions(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
                min="1"
                max="1000"
                disabled={readonly}
              />
            </div>
            
            <div className="option-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={options.includeAssociations || false}
                  onChange={(e) => setOptions(prev => ({ ...prev, includeAssociations: e.target.checked }))}
                  disabled={readonly}
                />
                包含关联信息
              </label>
            </div>
          </div>
        </div>
      )}

      {/* 查询构建区域 */}
      <div className="query-builder-content">
        {renderConditionGroup(query)}
      </div>

      {/* 查询预览 */}
      <div className="query-preview">
        <h4>查询预览</h4>
        <pre className="query-text">
          {JSON.stringify(query, null, 2)}
        </pre>
      </div>
    </div>
  )
}

export default SearchQueryBuilder
