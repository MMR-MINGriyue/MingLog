/**
 * 任务项组件
 * 显示单个任务的详细信息和操作按钮
 */

import React, { useState, useCallback } from 'react'
import { Task, TaskStatus, TaskPriority } from '../../../packages/modules/tasks/src/types'
import { formatDate, formatDuration } from '../../utils/dateUtils'

interface TaskItemProps {
  /** 任务数据 */
  task: Task
  /** 点击回调 */
  onClick?: () => void
  /** 状态变更回调 */
  onStatusChange?: (status: TaskStatus) => void
  /** 删除回调 */
  onDelete?: () => void
  /** 编辑回调 */
  onEdit?: () => void
  /** 是否紧凑模式 */
  compact?: boolean
  /** 是否可拖拽 */
  draggable?: boolean
  /** 类名 */
  className?: string
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  onClick,
  onStatusChange,
  onDelete,
  onEdit,
  compact = false,
  draggable = false,
  className = ''
}) => {
  const [showActions, setShowActions] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  // 处理状态变更
  const handleStatusChange = useCallback(async (newStatus: TaskStatus) => {
    if (isUpdating) return
    
    setIsUpdating(true)
    try {
      await onStatusChange?.(newStatus)
    } finally {
      setIsUpdating(false)
    }
  }, [onStatusChange, isUpdating])

  // 获取优先级样式
  const getPriorityClass = (priority: TaskPriority): string => {
    const classes = {
      [TaskPriority.LOW]: 'priority-low',
      [TaskPriority.MEDIUM]: 'priority-medium', 
      [TaskPriority.HIGH]: 'priority-high',
      [TaskPriority.URGENT]: 'priority-urgent'
    }
    return classes[priority] || 'priority-medium'
  }

  // 获取状态样式
  const getStatusClass = (status: TaskStatus): string => {
    const classes = {
      [TaskStatus.INBOX]: 'status-inbox',
      [TaskStatus.TODO]: 'status-todo',
      [TaskStatus.IN_PROGRESS]: 'status-in-progress',
      [TaskStatus.WAITING]: 'status-waiting',
      [TaskStatus.SOMEDAY]: 'status-someday',
      [TaskStatus.DONE]: 'status-done',
      [TaskStatus.CANCELLED]: 'status-cancelled'
    }
    return classes[status] || 'status-todo'
  }

  // 获取状态标签
  const getStatusLabel = (status: TaskStatus): string => {
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
  }

  // 获取优先级标签
  const getPriorityLabel = (priority: TaskPriority): string => {
    const labels = {
      [TaskPriority.LOW]: '低',
      [TaskPriority.MEDIUM]: '中',
      [TaskPriority.HIGH]: '高',
      [TaskPriority.URGENT]: '紧急'
    }
    return labels[priority] || priority
  }

  // 检查是否过期
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== TaskStatus.DONE

  // 检查是否即将到期（24小时内）
  const isDueSoon = task.dueDate && 
    new Date(task.dueDate) > new Date() && 
    new Date(task.dueDate).getTime() - new Date().getTime() < 24 * 60 * 60 * 1000

  return (
    <div 
      className={`task-item ${getStatusClass(task.status)} ${getPriorityClass(task.priority)} ${compact ? 'compact' : ''} ${className}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      draggable={draggable}
    >
      {/* 任务主体 */}
      <div className="task-main" onClick={onClick}>
        {/* 状态指示器 */}
        <div className="task-status-indicator">
          <div className={`status-dot ${getStatusClass(task.status)}`} />
        </div>

        {/* 任务内容 */}
        <div className="task-content">
          {/* 标题行 */}
          <div className="task-header">
            <h3 className="task-title">{task.title}</h3>
            <div className="task-badges">
              {/* 优先级徽章 */}
              <span className={`priority-badge ${getPriorityClass(task.priority)}`}>
                {getPriorityLabel(task.priority)}
              </span>
              
              {/* 状态徽章 */}
              <span className={`status-badge ${getStatusClass(task.status)}`}>
                {getStatusLabel(task.status)}
              </span>

              {/* 过期标识 */}
              {isOverdue && (
                <span className="overdue-badge">已过期</span>
              )}
              
              {/* 即将到期标识 */}
              {isDueSoon && (
                <span className="due-soon-badge">即将到期</span>
              )}
            </div>
          </div>

          {/* 描述 */}
          {task.description && !compact && (
            <p className="task-description">{task.description}</p>
          )}

          {/* 元数据行 */}
          <div className="task-metadata">
            {/* 到期时间 */}
            {task.dueDate && (
              <span className="task-due-date">
                📅 {formatDate(task.dueDate)}
              </span>
            )}

            {/* 预估时间 */}
            {task.estimatedTime && (
              <span className="task-estimated-time">
                ⏱️ {formatDuration(task.estimatedTime)}
              </span>
            )}

            {/* 项目 */}
            {task.projectId && (
              <span className="task-project">
                📁 项目
              </span>
            )}

            {/* 子任务数量 */}
            {task.parentTaskId && (
              <span className="task-subtask">
                🔗 子任务
              </span>
            )}

            {/* 关联笔记 */}
            {task.linkedNotes.length > 0 && (
              <span className="task-linked-notes">
                📝 {task.linkedNotes.length} 个笔记
              </span>
            )}

            {/* 关联文件 */}
            {task.linkedFiles.length > 0 && (
              <span className="task-linked-files">
                📎 {task.linkedFiles.length} 个文件
              </span>
            )}
          </div>

          {/* 标签和上下文 */}
          {!compact && (task.tags.length > 0 || task.contexts.length > 0) && (
            <div className="task-tags-contexts">
              {/* 标签 */}
              {task.tags.map(tag => (
                <span key={tag} className="task-tag">
                  #{tag}
                </span>
              ))}
              
              {/* 上下文 */}
              {task.contexts.map(context => (
                <span key={context} className="task-context">
                  @{context}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 操作按钮 */}
      {showActions && (
        <div className="task-actions">
          {/* 状态切换按钮 */}
          {task.status !== TaskStatus.DONE && (
            <button
              onClick={() => handleStatusChange(TaskStatus.DONE)}
              disabled={isUpdating}
              className="action-button complete-button"
              title="标记为完成"
            >
              ✓
            </button>
          )}

          {task.status === TaskStatus.TODO && (
            <button
              onClick={() => handleStatusChange(TaskStatus.IN_PROGRESS)}
              disabled={isUpdating}
              className="action-button start-button"
              title="开始任务"
            >
              ▶️
            </button>
          )}

          {task.status === TaskStatus.IN_PROGRESS && (
            <button
              onClick={() => handleStatusChange(TaskStatus.TODO)}
              disabled={isUpdating}
              className="action-button pause-button"
              title="暂停任务"
            >
              ⏸️
            </button>
          )}

          {/* 编辑按钮 */}
          <button
            onClick={onEdit}
            className="action-button edit-button"
            title="编辑任务"
          >
            ✏️
          </button>

          {/* 删除按钮 */}
          <button
            onClick={onDelete}
            className="action-button delete-button"
            title="删除任务"
          >
            🗑️
          </button>
        </div>
      )}

      {/* 加载状态 */}
      {isUpdating && (
        <div className="task-updating-overlay">
          <div className="updating-spinner" />
        </div>
      )}
    </div>
  )
}

export default TaskItem
