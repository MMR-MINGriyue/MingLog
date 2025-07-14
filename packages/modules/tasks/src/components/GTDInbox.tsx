/**
 * GTD收集箱组件
 * 实现GTD工作流的收集阶段，支持快速捕获想法和任务
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Task, TaskStatus, CreateTaskRequest } from '../types'
import { IGTDService } from '../services'

interface GTDInboxProps {
  /** GTD服务实例 */
  gtdService: IGTDService
  /** 类名 */
  className?: string
  /** 收集箱任务变更回调 */
  onInboxChange?: (tasks: Task[]) => void
  /** 任务处理回调 */
  onTaskProcessed?: (task: Task) => void
}

interface QuickCaptureState {
  input: string
  isSubmitting: boolean
}

/**
 * GTD收集箱组件
 * 提供快速捕获、查看和处理收集箱任务的功能
 */
export const GTDInbox: React.FC<GTDInboxProps> = ({
  gtdService,
  className = '',
  onInboxChange,
  onTaskProcessed
}) => {
  // 状态管理
  const [inboxTasks, setInboxTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [quickCapture, setQuickCapture] = useState<QuickCaptureState>({
    input: '',
    isSubmitting: false
  })

  // 引用
  const inputRef = useRef<HTMLTextAreaElement>(null)

  /**
   * 加载收集箱任务
   */
  const loadInboxTasks = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const tasks = await gtdService.getInboxTasks()
      setInboxTasks(tasks)
      onInboxChange?.(tasks)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载收集箱失败'
      setError(errorMessage)
      console.error('Failed to load inbox tasks:', err)
    } finally {
      setLoading(false)
    }
  }, [gtdService, onInboxChange])

  /**
   * 快速捕获想法到收集箱
   */
  const handleQuickCapture = useCallback(async () => {
    const input = quickCapture.input.trim()
    if (!input || quickCapture.isSubmitting) return

    try {
      setQuickCapture(prev => ({ ...prev, isSubmitting: true }))
      setError(null)

      // 添加到收集箱
      const task = await gtdService.addToInbox(input)
      
      // 更新本地状态
      setInboxTasks(prev => [task, ...prev])
      setQuickCapture({ input: '', isSubmitting: false })
      
      // 聚焦输入框以便继续捕获
      inputRef.current?.focus()
      
      onInboxChange?.([task, ...inboxTasks])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '添加任务失败'
      setError(errorMessage)
      setQuickCapture(prev => ({ ...prev, isSubmitting: false }))
      console.error('Failed to add to inbox:', err)
    }
  }, [quickCapture.input, quickCapture.isSubmitting, gtdService, inboxTasks, onInboxChange])

  /**
   * 处理收集箱任务
   */
  const handleProcessTask = useCallback(async (task: Task) => {
    try {
      setError(null)
      
      // 获取处理建议
      const processResult = await gtdService.processInboxItem(task.id)
      
      // 这里可以打开处理对话框或直接应用建议
      // 暂时简单地移出收集箱状态
      if (processResult.isActionable) {
        // 如果是可执行的，移到待办
        await gtdService.organizeTask(task.id, {
          action: 'do',
          targetStatus: TaskStatus.TODO,
          context: processResult.suggestedContext,
          priority: processResult.suggestedPriority
        })
      } else {
        // 如果不可执行，移到将来/也许
        await gtdService.moveToSomeday(task.id)
      }

      // 从收集箱移除
      setInboxTasks(prev => prev.filter(t => t.id !== task.id))
      onTaskProcessed?.(task)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '处理任务失败'
      setError(errorMessage)
      console.error('Failed to process task:', err)
    }
  }, [gtdService, onTaskProcessed])

  /**
   * 删除收集箱任务
   */
  const handleDeleteTask = useCallback(async (taskId: string) => {
    try {
      setError(null)
      // 这里应该调用任务服务删除任务
      // await tasksService.deleteTask(taskId)
      
      setInboxTasks(prev => prev.filter(t => t.id !== taskId))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除任务失败'
      setError(errorMessage)
      console.error('Failed to delete task:', err)
    }
  }, [])

  /**
   * 处理键盘事件
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleQuickCapture()
    }
  }, [handleQuickCapture])

  // 组件挂载时加载数据
  useEffect(() => {
    loadInboxTasks()
  }, [loadInboxTasks])

  return (
    <div className={`gtd-inbox ${className}`}>
      {/* 标题栏 */}
      <div className="gtd-inbox-header">
        <h2 className="gtd-inbox-title">
          📥 收集箱
          {inboxTasks.length > 0 && (
            <span className="task-count">({inboxTasks.length})</span>
          )}
        </h2>
        <button 
          onClick={loadInboxTasks}
          disabled={loading}
          className="refresh-button"
          title="刷新收集箱"
        >
          🔄
        </button>
      </div>

      {/* 快速捕获区域 */}
      <div className="quick-capture-section">
        <div className="quick-capture-input">
          <textarea
            ref={inputRef}
            value={quickCapture.input}
            onChange={(e) => setQuickCapture(prev => ({ ...prev, input: e.target.value }))}
            onKeyDown={handleKeyDown}
            placeholder="快速捕获想法、任务或项目... (Ctrl+Enter 提交)"
            className="capture-textarea"
            rows={3}
            disabled={quickCapture.isSubmitting}
          />
          <button
            onClick={handleQuickCapture}
            disabled={!quickCapture.input.trim() || quickCapture.isSubmitting}
            className="capture-button"
          >
            {quickCapture.isSubmitting ? '添加中...' : '捕获'}
          </button>
        </div>
        <div className="capture-tips">
          💡 提示：快速记录任何想法，稍后再整理和处理
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="error-message">
          ⚠️ {error}
        </div>
      )}

      {/* 收集箱任务列表 */}
      <div className="inbox-tasks-section">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner" />
            <p>加载收集箱中...</p>
          </div>
        ) : inboxTasks.length === 0 ? (
          <div className="empty-inbox">
            <div className="empty-icon">📭</div>
            <h3>收集箱为空</h3>
            <p>太棒了！所有想法都已处理完毕</p>
          </div>
        ) : (
          <div className="inbox-tasks-list">
            {inboxTasks.map(task => (
              <div key={task.id} className="inbox-task-item">
                <div className="task-content">
                  <h4 className="task-title">{task.title}</h4>
                  {task.description && (
                    <p className="task-description">{task.description}</p>
                  )}
                  <div className="task-meta">
                    <span className="task-date">
                      {new Date(task.createdAt).toLocaleString('zh-CN')}
                    </span>
                  </div>
                </div>
                <div className="task-actions">
                  <button
                    onClick={() => handleProcessTask(task)}
                    className="process-button"
                    title="处理此任务"
                  >
                    ⚡ 处理
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="delete-button"
                    title="删除此任务"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 处理提示 */}
      {inboxTasks.length > 0 && (
        <div className="processing-tips">
          <h4>📋 处理指南</h4>
          <ul>
            <li>🎯 <strong>2分钟规则</strong>：能在2分钟内完成的立即执行</li>
            <li>📅 <strong>需要时间</strong>：安排到具体时间执行</li>
            <li>👥 <strong>等待他人</strong>：移到"等待"列表</li>
            <li>🔮 <strong>将来也许</strong>：不确定的想法移到"将来/也许"</li>
          </ul>
        </div>
      )}
    </div>
  )
}

export default GTDInbox
