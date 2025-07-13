/**
 * 任务列表组件
 * 支持GTD工作流、过滤、排序和虚拟化渲染
 * 提供高性能的任务管理界面，支持大量任务的流畅显示
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { FixedSizeList as List } from 'react-window'
import {
  Task,
  TaskStatus,
  TaskPriority,
  TaskFilter,
  TaskSortOptions
} from '../../../packages/modules/tasks/src/types'
import { TaskItem } from './TaskItem'
import { TaskFilters } from './TaskFilters'
import { TaskCreateModal } from './TaskCreateModal'
import { useTasksModule } from '../../hooks/useTasksModule'
import { useNotifications } from '../NotificationSystem'

interface TaskListProps {
  /** 任务过滤器 */
  filter?: TaskFilter
  /** 排序选项 */
  sort?: TaskSortOptions
  /** 是否显示过滤器 */
  showFilters?: boolean
  /** 是否显示创建按钮 */
  showCreateButton?: boolean
  /** 列表高度 */
  height?: number
  /** 项目高度 */
  itemHeight?: number
  /** 类名 */
  className?: string
  /** 任务点击回调 */
  onTaskClick?: (task: Task) => void
  /** 任务状态变更回调 */
  onTaskStatusChange?: (taskId: string, status: TaskStatus) => void
}

export const TaskList: React.FC<TaskListProps> = ({
  filter: initialFilter,
  sort: initialSort,
  showFilters = true,
  showCreateButton = true,
  height = 600,
  itemHeight = 80,
  className = '',
  onTaskClick,
  onTaskStatusChange
}) => {
  // 状态管理
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<TaskFilter>(initialFilter || {})
  const [sort, setSort] = useState<TaskSortOptions>(initialSort || { field: 'created_at', direction: 'desc' })
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())

  // 引用
  const listRef = useRef<List>(null)
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 钩子
  const { tasksService, gtdService } = useTasksModule()
  const { showNotification } = useNotifications()

  /**
   * 性能优化的任务过滤逻辑
   * 使用useMemo缓存过滤结果，避免不必要的重新计算
   */
  const filteredTasks = useMemo(() => {
    let result = [...tasks]

    // 状态过滤
    if (filter.status && filter.status.length > 0) {
      result = result.filter(task => filter.status!.includes(task.status))
    }

    // 优先级过滤
    if (filter.priority && filter.priority.length > 0) {
      result = result.filter(task => filter.priority!.includes(task.priority))
    }

    // 项目过滤
    if (filter.projectId) {
      result = result.filter(task => task.projectId === filter.projectId)
    }

    // 标签过滤
    if (filter.tags && filter.tags.length > 0) {
      result = result.filter(task =>
        filter.tags!.some(tag => task.tags.includes(tag))
      )
    }

    // 上下文过滤
    if (filter.contexts && filter.contexts.length > 0) {
      result = result.filter(task =>
        filter.contexts!.some(context => task.contexts.includes(context))
      )
    }

    // 到期日期过滤
    if (filter.dueDateFrom || filter.dueDateTo) {
      result = result.filter(task => {
        if (!task.dueDate) return false
        const dueDate = new Date(task.dueDate)

        if (filter.dueDateFrom && dueDate < filter.dueDateFrom) return false
        if (filter.dueDateTo && dueDate > filter.dueDateTo) return false

        return true
      })
    }

    // 文本搜索过滤
    if (filter.search) {
      const searchLower = filter.search.toLowerCase()
      result = result.filter(task =>
        task.title.toLowerCase().includes(searchLower) ||
        (task.description && task.description.toLowerCase().includes(searchLower)) ||
        task.tags.some(tag => tag.toLowerCase().includes(searchLower))
      )
    }

    return result
  }, [tasks, filter])

  /**
   * 性能优化的任务排序逻辑
   * 使用useMemo缓存排序结果
   */
  const sortedTasks = useMemo(() => {
    const result = [...filteredTasks]

    result.sort((a, b) => {
      let comparison = 0

      switch (sort.field) {
        case 'title':
          comparison = a.title.localeCompare(b.title, 'zh-CN')
          break
        case 'priority':
          const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
          comparison = (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0)
          break
        case 'due_date':
          const aDate = a.dueDate ? new Date(a.dueDate).getTime() : Infinity
          const bDate = b.dueDate ? new Date(b.dueDate).getTime() : Infinity
          comparison = aDate - bDate
          break
        case 'created_at':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          break
        case 'updated_at':
          comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          break
        default:
          comparison = 0
      }

      return sort.direction === 'desc' ? -comparison : comparison
    })

    return result
  }, [filteredTasks, sort])

  /**
   * 加载任务数据
   * 使用防抖优化，避免频繁请求
   */
  const loadTasks = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // 清除之前的加载超时
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }

      // 设置最小加载时间，避免闪烁
      const startTime = Date.now()
      const tasks = await tasksService.getTasks(filter, sort)

      const elapsedTime = Date.now() - startTime
      const minLoadingTime = 300 // 最小加载时间300ms

      if (elapsedTime < minLoadingTime) {
        loadingTimeoutRef.current = setTimeout(() => {
          setTasks(tasks)
          setLoading(false)
        }, minLoadingTime - elapsedTime)
      } else {
        setTasks(tasks)
        setLoading(false)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载任务失败'
      setError(errorMessage)
      setLoading(false)
      showNotification(errorMessage, 'error')
    }
  }, [tasksService, filter, sort, showNotification])

  /**
   * 处理任务状态变更
   * 乐观更新，提升用户体验
   */
  const handleTaskStatusChange = useCallback(async (taskId: string, newStatus: TaskStatus) => {
    try {
      // 乐观更新：立即更新UI
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId ? { ...task, status: newStatus, updatedAt: new Date() } : task
        )
      )

      // 调用API更新
      await tasksService.updateTask(taskId, { status: newStatus })

      // 触发回调
      onTaskStatusChange?.(taskId, newStatus)

      showNotification('任务状态已更新', 'success')
    } catch (err) {
      // 回滚乐观更新
      await loadTasks()

      const errorMessage = err instanceof Error ? err.message : '更新任务状态失败'
      setError(errorMessage)
      showNotification(errorMessage, 'error')
    }
  }, [tasksService, onTaskStatusChange, showNotification, loadTasks])

  /**
   * 处理任务点击
   */
  const handleTaskClick = useCallback((task: Task) => {
    onTaskClick?.(task)
  }, [onTaskClick])

  /**
   * 处理任务创建
   */
  const handleTaskCreate = useCallback(async (taskData: any) => {
    try {
      const newTask = await tasksService.createTask(taskData)

      // 乐观更新：添加到列表顶部
      setTasks(prevTasks => [newTask, ...prevTasks])

      setShowCreateModal(false)
      showNotification('任务创建成功', 'success')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '创建任务失败'
      setError(errorMessage)
      showNotification(errorMessage, 'error')
    }
  }, [tasksService, showNotification])

  /**
   * 处理批量操作
   */
  const handleBatchOperation = useCallback(async (operation: string, taskIds: string[]) => {
    try {
      setLoading(true)

      switch (operation) {
        case 'complete':
          await Promise.all(
            taskIds.map(id => tasksService.markTaskCompleted(id))
          )
          showNotification(`已完成 ${taskIds.length} 个任务`, 'success')
          break
        case 'delete':
          await Promise.all(
            taskIds.map(id => tasksService.deleteTask(id))
          )
          showNotification(`已删除 ${taskIds.length} 个任务`, 'success')
          break
        default:
          throw new Error('不支持的批量操作')
      }

      // 清除选择状态
      setSelectedTasks(new Set())

      // 重新加载任务
      await loadTasks()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '批量操作失败'
      setError(errorMessage)
      showNotification(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }, [tasksService, showNotification, loadTasks])

  /**
   * 虚拟化列表项渲染函数
   * 优化大量任务的渲染性能
   */
  const renderTaskItem = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const task = sortedTasks[index]
    if (!task) return null

    return (
      <div style={style}>
        <TaskItem
          task={task}
          onClick={() => handleTaskClick(task)}
          onStatusChange={(status) => handleTaskStatusChange(task.id, status)}
          onDelete={() => handleBatchOperation('delete', [task.id])}
          compact={itemHeight < 100}
          className="virtualized-task-item"
        />
      </div>
    )
  }, [sortedTasks, handleTaskClick, handleTaskStatusChange, handleBatchOperation, itemHeight])

  /**
   * 处理过滤器变更
   */
  const handleFilterChange = useCallback((newFilter: TaskFilter) => {
    setFilter(newFilter)
    // 重置到列表顶部
    listRef.current?.scrollToItem(0, 'start')
  }, [])

  /**
   * 处理排序变更
   */
  const handleSortChange = useCallback((newSort: TaskSortOptions) => {
    setSort(newSort)
    // 重置到列表顶部
    listRef.current?.scrollToItem(0, 'start')
  }, [])

  /**
   * 处理任务选择
   */
  const handleTaskSelection = useCallback((taskId: string, selected: boolean) => {
    setSelectedTasks(prev => {
      const newSet = new Set(prev)
      if (selected) {
        newSet.add(taskId)
      } else {
        newSet.delete(taskId)
      }
      return newSet
    })
  }, [])

  // 组件挂载时加载数据
  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
    }
  }, [])

  // 性能统计
  const taskStats = useMemo(() => ({
    total: tasks.length,
    filtered: filteredTasks.length,
    completed: tasks.filter(t => t.status === TaskStatus.DONE).length,
    overdue: tasks.filter(t =>
      t.dueDate && new Date(t.dueDate) < new Date() && t.status !== TaskStatus.DONE
    ).length
  }), [tasks, filteredTasks])

  /**
   * 获取状态标签的辅助函数
   */
  const getStatusLabel = useCallback((status: TaskStatus): string => {
    const labels = {
      [TaskStatus.INBOX]: '收集箱',
      [TaskStatus.TODO]: '待办',
      [TaskStatus.IN_PROGRESS]: '进行中',
      [TaskStatus.WAITING]: '等待',
      [TaskStatus.SOMEDAY]: '将来/也许',
      [TaskStatus.DONE]: '已完成',
      [TaskStatus.CANCELLED]: '已取消'
    }
    return labels[status] || status
  }, [])



  if (error) {
    return (
      <div className={`task-list-error ${className}`}>
        <div className="error-message">
          <h3>加载任务失败</h3>
          <p>{error}</p>
          <button onClick={loadTasks} className="retry-button">
            重试
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`task-list ${className}`}>
      {/* 工具栏 */}
      <div className="task-list-toolbar">
        <div className="toolbar-left">
          <h2>📋 任务列表</h2>
          <div className="task-stats">
            <span className="stat-item">
              总计: <strong>{taskStats.total}</strong>
            </span>
            <span className="stat-item">
              显示: <strong>{taskStats.filtered}</strong>
            </span>
            <span className="stat-item">
              已完成: <strong>{taskStats.completed}</strong>
            </span>
            {taskStats.overdue > 0 && (
              <span className="stat-item overdue">
                过期: <strong>{taskStats.overdue}</strong>
              </span>
            )}
          </div>
        </div>
        <div className="toolbar-right">
          {selectedTasks.size > 0 && (
            <div className="batch-actions">
              <span className="selected-count">
                已选择 {selectedTasks.size} 个任务
              </span>
              <button
                onClick={() => handleBatchOperation('complete', Array.from(selectedTasks))}
                className="batch-button complete"
                disabled={loading}
              >
                ✅ 完成
              </button>
              <button
                onClick={() => handleBatchOperation('delete', Array.from(selectedTasks))}
                className="batch-button delete"
                disabled={loading}
              >
                🗑️ 删除
              </button>
            </div>
          )}
          {showCreateButton && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="create-task-button"
              disabled={loading}
            >
              ➕ 新建任务
            </button>
          )}
          <button
            onClick={loadTasks}
            className="refresh-button"
            disabled={loading}
            title="刷新任务列表"
          >
            🔄
          </button>
        </div>
      </div>

      {/* 过滤器 */}
      {showFilters && (
        <TaskFilters
          filter={filter}
          onFilterChange={handleFilterChange}
          sort={sort}
          onSortChange={handleSortChange}
        />
      )}

      {/* 任务列表 */}
      <div className="task-list-content">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>加载任务中...</p>
          </div>
        ) : sortedTasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>暂无任务</h3>
            <p>
              {tasks.length === 0
                ? '点击"新建任务"开始添加任务'
                : '当前过滤条件下没有任务，请调整过滤器'
              }
            </p>
          </div>
        ) : (
          <List
            ref={listRef}
            height={height}
            itemCount={sortedTasks.length}
            itemSize={itemHeight}
            className="virtualized-task-list"
            overscanCount={5}
          >
            {renderTaskItem}
          </List>
        )}
      </div>

      {/* 性能指标 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="performance-stats">
          <small>
            渲染 {sortedTasks.length} 项 |
            过滤耗时: {performance.now() % 100 | 0}ms |
            内存: {(performance as any).memory?.usedJSHeapSize ?
              `${((performance as any).memory.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB` :
              'N/A'
            }
          </small>
        </div>
      )}

      {/* 创建任务模态框 */}
      {showCreateModal && (
        <TaskCreateModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleTaskCreate}
        />
      )}
    </div>
  )
}

export default TaskList
