/**
 * 任务过滤器组件
 * 提供任务的过滤和排序功能
 */

import React, { useState, useCallback } from 'react'
import { 
  TaskFilter, 
  TaskSortOptions, 
  TaskStatus, 
  TaskPriority 
} from '../../../packages/modules/tasks/src/types'

interface TaskFiltersProps {
  /** 当前过滤器 */
  filter: TaskFilter
  /** 过滤器变更回调 */
  onFilterChange: (filter: TaskFilter) => void
  /** 当前排序 */
  sort: TaskSortOptions
  /** 排序变更回调 */
  onSortChange: (sort: TaskSortOptions) => void
  /** 是否紧凑模式 */
  compact?: boolean
  /** 类名 */
  className?: string
}

export const TaskFilters: React.FC<TaskFiltersProps> = ({
  filter,
  onFilterChange,
  sort,
  onSortChange,
  compact = false,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(!compact)
  const [searchValue, setSearchValue] = useState(filter.search || '')

  // 处理搜索输入
  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value)
    onFilterChange({ ...filter, search: value || undefined })
  }, [filter, onFilterChange])

  // 处理状态过滤
  const handleStatusFilter = useCallback((status: TaskStatus, checked: boolean) => {
    const currentStatuses = filter.status || []
    const newStatuses = checked 
      ? [...currentStatuses, status]
      : currentStatuses.filter(s => s !== status)
    
    onFilterChange({ 
      ...filter, 
      status: newStatuses.length > 0 ? newStatuses : undefined 
    })
  }, [filter, onFilterChange])

  // 处理优先级过滤
  const handlePriorityFilter = useCallback((priority: TaskPriority, checked: boolean) => {
    const currentPriorities = filter.priorities || []
    const newPriorities = checked
      ? [...currentPriorities, priority]
      : currentPriorities.filter(p => p !== priority)
    
    onFilterChange({
      ...filter,
      priorities: newPriorities.length > 0 ? newPriorities : undefined
    })
  }, [filter, onFilterChange])

  // 处理日期过滤
  const handleDateFilter = useCallback((type: 'dueDateFrom' | 'dueDateTo', value: string) => {
    onFilterChange({
      ...filter,
      [type]: value ? new Date(value) : undefined
    })
  }, [filter, onFilterChange])

  // 处理排序变更
  const handleSortChange = useCallback((field: string, direction: 'asc' | 'desc') => {
    onSortChange({ field, direction })
  }, [onSortChange])

  // 清除所有过滤器
  const clearFilters = useCallback(() => {
    setSearchValue('')
    onFilterChange({})
  }, [onFilterChange])

  // 状态选项
  const statusOptions = [
    { value: TaskStatus.INBOX, label: '收集箱', color: '#6b7280' },
    { value: TaskStatus.TODO, label: '待办', color: '#3b82f6' },
    { value: TaskStatus.IN_PROGRESS, label: '进行中', color: '#f59e0b' },
    { value: TaskStatus.WAITING, label: '等待', color: '#8b5cf6' },
    { value: TaskStatus.SOMEDAY, label: '将来/也许', color: '#6b7280' },
    { value: TaskStatus.DONE, label: '已完成', color: '#10b981' },
    { value: TaskStatus.CANCELLED, label: '已取消', color: '#ef4444' }
  ]

  // 优先级选项
  const priorityOptions = [
    { value: TaskPriority.LOW, label: '低', color: '#10b981' },
    { value: TaskPriority.MEDIUM, label: '中', color: '#f59e0b' },
    { value: TaskPriority.HIGH, label: '高', color: '#ef4444' },
    { value: TaskPriority.URGENT, label: '紧急', color: '#dc2626' }
  ]

  // 排序选项
  const sortOptions = [
    { value: 'created_at', label: '创建时间' },
    { value: 'updated_at', label: '更新时间' },
    { value: 'due_date', label: '到期时间' },
    { value: 'priority', label: '优先级' },
    { value: 'title', label: '标题' },
    { value: 'status', label: '状态' }
  ]

  return (
    <div className={`task-filters ${compact ? 'compact' : ''} ${className}`}>
      {/* 过滤器头部 */}
      <div className="filters-header">
        <div className="filters-title">
          <h3>过滤器</h3>
          {compact && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="expand-button"
            >
              {isExpanded ? '收起' : '展开'}
            </button>
          )}
        </div>
        
        <button onClick={clearFilters} className="clear-filters-button">
          清除过滤器
        </button>
      </div>

      {/* 过滤器内容 */}
      {isExpanded && (
        <div className="filters-content">
          {/* 搜索框 */}
          <div className="filter-group">
            <label className="filter-label">搜索</label>
            <input
              type="text"
              value={searchValue}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="搜索任务标题或描述..."
              className="search-input"
            />
          </div>

          {/* 状态过滤 */}
          <div className="filter-group">
            <label className="filter-label">状态</label>
            <div className="filter-options">
              {statusOptions.map(option => (
                <label key={option.value} className="filter-option">
                  <input
                    type="checkbox"
                    checked={filter.status?.includes(option.value) || false}
                    onChange={(e) => handleStatusFilter(option.value, e.target.checked)}
                  />
                  <span 
                    className="option-indicator"
                    style={{ backgroundColor: option.color }}
                  />
                  <span className="option-label">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 优先级过滤 */}
          <div className="filter-group">
            <label className="filter-label">优先级</label>
            <div className="filter-options">
              {priorityOptions.map(option => (
                <label key={option.value} className="filter-option">
                  <input
                    type="checkbox"
                    checked={filter.priorities?.includes(option.value) || false}
                    onChange={(e) => handlePriorityFilter(option.value, e.target.checked)}
                  />
                  <span 
                    className="option-indicator"
                    style={{ backgroundColor: option.color }}
                  />
                  <span className="option-label">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 日期过滤 */}
          <div className="filter-group">
            <label className="filter-label">到期时间</label>
            <div className="date-filters">
              <div className="date-filter">
                <label>从</label>
                <input
                  type="date"
                  value={filter.dueDateFrom?.toISOString().split('T')[0] || ''}
                  onChange={(e) => handleDateFilter('dueDateFrom', e.target.value)}
                  className="date-input"
                />
              </div>
              <div className="date-filter">
                <label>到</label>
                <input
                  type="date"
                  value={filter.dueDateTo?.toISOString().split('T')[0] || ''}
                  onChange={(e) => handleDateFilter('dueDateTo', e.target.value)}
                  className="date-input"
                />
              </div>
            </div>
          </div>

          {/* 其他过滤选项 */}
          <div className="filter-group">
            <label className="filter-label">其他选项</label>
            <div className="filter-options">
              <label className="filter-option">
                <input
                  type="checkbox"
                  checked={filter.hasLinkedNotes || false}
                  onChange={(e) => onFilterChange({ 
                    ...filter, 
                    hasLinkedNotes: e.target.checked || undefined 
                  })}
                />
                <span className="option-label">有关联笔记</span>
              </label>
              
              <label className="filter-option">
                <input
                  type="checkbox"
                  checked={filter.hasLinkedFiles || false}
                  onChange={(e) => onFilterChange({ 
                    ...filter, 
                    hasLinkedFiles: e.target.checked || undefined 
                  })}
                />
                <span className="option-label">有关联文件</span>
              </label>
              
              <label className="filter-option">
                <input
                  type="checkbox"
                  checked={filter.hasRecurrence || false}
                  onChange={(e) => onFilterChange({ 
                    ...filter, 
                    hasRecurrence: e.target.checked || undefined 
                  })}
                />
                <span className="option-label">重复任务</span>
              </label>
            </div>
          </div>

          {/* 排序选项 */}
          <div className="filter-group">
            <label className="filter-label">排序</label>
            <div className="sort-options">
              <select
                value={sort.field}
                onChange={(e) => handleSortChange(e.target.value, sort.direction)}
                className="sort-field-select"
              >
                {sortOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              
              <select
                value={sort.direction}
                onChange={(e) => handleSortChange(sort.field, e.target.value as 'asc' | 'desc')}
                className="sort-direction-select"
              >
                <option value="desc">降序</option>
                <option value="asc">升序</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TaskFilters
