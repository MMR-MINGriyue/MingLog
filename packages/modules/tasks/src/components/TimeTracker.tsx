/**
 * 时间跟踪器组件
 * 提供任务时间记录、统计分析和效率评估功能
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { Task, Project } from '../types'

interface TimeEntry {
  id: string
  taskId: string
  projectId?: string
  startTime: Date
  endTime?: Date
  duration: number // 分钟
  description?: string
  tags: string[]
  createdAt: Date
}

interface TimeTrackingSession {
  taskId: string
  startTime: Date
  isActive: boolean
  elapsedTime: number // 秒
}

interface TimeTrackerProps {
  /** 当前任务 */
  currentTask?: Task
  /** 项目列表 */
  projects: Project[]
  /** 时间记录变更回调 */
  onTimeEntryChange?: (entry: TimeEntry) => void
  /** 类名 */
  className?: string
}

interface TrackerState {
  /** 当前会话 */
  currentSession: TimeTrackingSession | null
  /** 时间记录列表 */
  timeEntries: TimeEntry[]
  /** 选中的任务ID */
  selectedTaskId: string
  /** 是否显示统计面板 */
  showStats: boolean
  /** 统计时间范围 */
  statsRange: 'today' | 'week' | 'month' | 'all'
  /** 手动时间输入 */
  manualEntry: {
    taskId: string
    duration: number
    description: string
    date: Date
  }
  /** 是否显示手动输入对话框 */
  showManualEntry: boolean
}

/**
 * 时间跟踪器组件
 */
export const TimeTracker: React.FC<TimeTrackerProps> = ({
  currentTask,
  projects,
  onTimeEntryChange,
  className = ''
}) => {
  // 状态管理
  const [trackerState, setTrackerState] = useState<TrackerState>({
    currentSession: null,
    timeEntries: [],
    selectedTaskId: currentTask?.id || '',
    showStats: false,
    statsRange: 'today',
    manualEntry: {
      taskId: '',
      duration: 0,
      description: '',
      date: new Date()
    },
    showManualEntry: false
  })

  // 定时器引用
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * 开始时间跟踪
   */
  const startTracking = useCallback((taskId: string) => {
    if (trackerState.currentSession) {
      stopTracking()
    }

    const session: TimeTrackingSession = {
      taskId,
      startTime: new Date(),
      isActive: true,
      elapsedTime: 0
    }

    setTrackerState(prev => ({
      ...prev,
      currentSession: session,
      selectedTaskId: taskId
    }))

    // 启动定时器
    timerRef.current = setInterval(() => {
      setTrackerState(prev => {
        if (!prev.currentSession) return prev
        
        const elapsed = Math.floor((Date.now() - prev.currentSession.startTime.getTime()) / 1000)
        return {
          ...prev,
          currentSession: {
            ...prev.currentSession,
            elapsedTime: elapsed
          }
        }
      })
    }, 1000)
  }, [trackerState.currentSession])

  /**
   * 停止时间跟踪
   */
  const stopTracking = useCallback(() => {
    if (!trackerState.currentSession) return

    const endTime = new Date()
    const duration = Math.floor((endTime.getTime() - trackerState.currentSession.startTime.getTime()) / 60000)

    if (duration > 0) {
      const timeEntry: TimeEntry = {
        id: generateId(),
        taskId: trackerState.currentSession.taskId,
        projectId: getProjectIdByTaskId(trackerState.currentSession.taskId),
        startTime: trackerState.currentSession.startTime,
        endTime,
        duration,
        description: '',
        tags: [],
        createdAt: new Date()
      }

      setTrackerState(prev => ({
        ...prev,
        timeEntries: [timeEntry, ...prev.timeEntries],
        currentSession: null
      }))

      onTimeEntryChange?.(timeEntry)
    } else {
      setTrackerState(prev => ({
        ...prev,
        currentSession: null
      }))
    }

    // 清除定时器
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [trackerState.currentSession, onTimeEntryChange])

  /**
   * 暂停/恢复跟踪
   */
  const toggleTracking = useCallback(() => {
    if (!trackerState.currentSession) return

    if (trackerState.currentSession.isActive) {
      // 暂停
      setTrackerState(prev => ({
        ...prev,
        currentSession: prev.currentSession ? {
          ...prev.currentSession,
          isActive: false
        } : null
      }))

      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    } else {
      // 恢复
      setTrackerState(prev => ({
        ...prev,
        currentSession: prev.currentSession ? {
          ...prev.currentSession,
          isActive: true,
          startTime: new Date(Date.now() - prev.currentSession.elapsedTime * 1000)
        } : null
      }))

      // 重新启动定时器
      timerRef.current = setInterval(() => {
        setTrackerState(prev => {
          if (!prev.currentSession) return prev
          
          const elapsed = Math.floor((Date.now() - prev.currentSession.startTime.getTime()) / 1000)
          return {
            ...prev,
            currentSession: {
              ...prev.currentSession,
              elapsedTime: elapsed
            }
          }
        })
      }, 1000)
    }
  }, [trackerState.currentSession])

  /**
   * 添加手动时间记录
   */
  const addManualEntry = useCallback(() => {
    const { taskId, duration, description, date } = trackerState.manualEntry

    if (!taskId || duration <= 0) return

    const timeEntry: TimeEntry = {
      id: generateId(),
      taskId,
      projectId: getProjectIdByTaskId(taskId),
      startTime: date,
      endTime: new Date(date.getTime() + duration * 60000),
      duration,
      description,
      tags: [],
      createdAt: new Date()
    }

    setTrackerState(prev => ({
      ...prev,
      timeEntries: [timeEntry, ...prev.timeEntries],
      showManualEntry: false,
      manualEntry: {
        taskId: '',
        duration: 0,
        description: '',
        date: new Date()
      }
    }))

    onTimeEntryChange?.(timeEntry)
  }, [trackerState.manualEntry, onTimeEntryChange])

  /**
   * 删除时间记录
   */
  const deleteTimeEntry = useCallback((entryId: string) => {
    setTrackerState(prev => ({
      ...prev,
      timeEntries: prev.timeEntries.filter(entry => entry.id !== entryId)
    }))
  }, [])

  // 格式化时间显示
  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }, [])

  // 格式化持续时间
  const formatDuration = useCallback((minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60

    if (hours > 0) {
      return `${hours}小时${mins}分钟`
    }
    return `${mins}分钟`
  }, [])

  // 计算统计数据
  const statistics = useMemo(() => {
    const now = new Date()
    let filteredEntries = trackerState.timeEntries

    // 按时间范围过滤
    switch (trackerState.statsRange) {
      case 'today':
        filteredEntries = trackerState.timeEntries.filter(entry => 
          entry.startTime.toDateString() === now.toDateString()
        )
        break
      case 'week':
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        filteredEntries = trackerState.timeEntries.filter(entry => 
          entry.startTime >= weekStart
        )
        break
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        filteredEntries = trackerState.timeEntries.filter(entry => 
          entry.startTime >= monthStart
        )
        break
    }

    const totalTime = filteredEntries.reduce((sum, entry) => sum + entry.duration, 0)
    const totalEntries = filteredEntries.length
    const averageSession = totalEntries > 0 ? Math.round(totalTime / totalEntries) : 0

    // 按任务分组
    const byTask = filteredEntries.reduce((acc, entry) => {
      if (!acc[entry.taskId]) {
        acc[entry.taskId] = { duration: 0, entries: 0 }
      }
      acc[entry.taskId].duration += entry.duration
      acc[entry.taskId].entries += 1
      return acc
    }, {} as Record<string, { duration: number; entries: number }>)

    // 按项目分组
    const byProject = filteredEntries.reduce((acc, entry) => {
      const projectId = entry.projectId || 'no-project'
      if (!acc[projectId]) {
        acc[projectId] = { duration: 0, entries: 0 }
      }
      acc[projectId].duration += entry.duration
      acc[projectId].entries += 1
      return acc
    }, {} as Record<string, { duration: number; entries: number }>)

    return {
      totalTime,
      totalEntries,
      averageSession,
      byTask,
      byProject
    }
  }, [trackerState.timeEntries, trackerState.statsRange])

  // 辅助函数
  const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  const getProjectIdByTaskId = (taskId: string): string | undefined => {
    // 这里应该从任务服务获取任务信息
    return undefined
  }

  const getTaskName = (taskId: string): string => {
    // 这里应该从任务服务获取任务名称
    return `任务 ${taskId.slice(0, 8)}`
  }

  const getProjectName = (projectId: string): string => {
    const project = projects.find(p => p.id === projectId)
    return project?.name || '未分类项目'
  }

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  // 当前任务变更时更新选中任务
  useEffect(() => {
    if (currentTask && !trackerState.currentSession) {
      setTrackerState(prev => ({
        ...prev,
        selectedTaskId: currentTask.id
      }))
    }
  }, [currentTask, trackerState.currentSession])

  return (
    <div className={`time-tracker ${className}`}>
      {/* 主控制面板 */}
      <div className="tracker-main">
        <div className="tracker-header">
          <h3>⏱️ 时间跟踪</h3>
          <div className="tracker-actions">
            <button
              onClick={() => setTrackerState(prev => ({ ...prev, showManualEntry: true }))}
              className="manual-entry-button"
              title="手动添加时间记录"
            >
              ➕ 手动记录
            </button>
            <button
              onClick={() => setTrackerState(prev => ({ ...prev, showStats: !prev.showStats }))}
              className="stats-toggle-button"
              title="显示/隐藏统计"
            >
              📊 统计
            </button>
          </div>
        </div>

        {/* 当前会话 */}
        {trackerState.currentSession ? (
          <div className="current-session">
            <div className="session-info">
              <div className="session-task">
                正在跟踪: {getTaskName(trackerState.currentSession.taskId)}
              </div>
              <div className="session-time">
                {formatTime(trackerState.currentSession.elapsedTime)}
              </div>
            </div>
            <div className="session-controls">
              <button
                onClick={toggleTracking}
                className={`control-button ${trackerState.currentSession.isActive ? 'pause' : 'resume'}`}
              >
                {trackerState.currentSession.isActive ? '⏸️ 暂停' : '▶️ 继续'}
              </button>
              <button
                onClick={stopTracking}
                className="control-button stop"
              >
                ⏹️ 停止
              </button>
            </div>
          </div>
        ) : (
          <div className="start-tracking">
            <div className="task-selector">
              <label htmlFor="task-select">选择任务:</label>
              <select
                id="task-select"
                value={trackerState.selectedTaskId}
                onChange={(e) => setTrackerState(prev => ({ ...prev, selectedTaskId: e.target.value }))}
                className="task-select"
              >
                <option value="">请选择任务</option>
                {currentTask && (
                  <option value={currentTask.id}>{currentTask.title}</option>
                )}
              </select>
            </div>
            <button
              onClick={() => startTracking(trackerState.selectedTaskId)}
              disabled={!trackerState.selectedTaskId}
              className="start-button"
            >
              ▶️ 开始跟踪
            </button>
          </div>
        )}
      </div>

      {/* 统计面板 */}
      {trackerState.showStats && (
        <div className="stats-panel">
          <div className="stats-header">
            <h4>📈 时间统计</h4>
            <select
              value={trackerState.statsRange}
              onChange={(e) => setTrackerState(prev => ({ ...prev, statsRange: e.target.value as any }))}
              className="range-select"
            >
              <option value="today">今天</option>
              <option value="week">本周</option>
              <option value="month">本月</option>
              <option value="all">全部</option>
            </select>
          </div>

          <div className="stats-summary">
            <div className="stat-item">
              <div className="stat-label">总时间</div>
              <div className="stat-value">{formatDuration(statistics.totalTime)}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">记录数</div>
              <div className="stat-value">{statistics.totalEntries}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">平均时长</div>
              <div className="stat-value">{formatDuration(statistics.averageSession)}</div>
            </div>
          </div>

          {/* 按任务统计 */}
          {Object.keys(statistics.byTask).length > 0 && (
            <div className="stats-breakdown">
              <h5>按任务统计</h5>
              <div className="breakdown-list">
                {Object.entries(statistics.byTask)
                  .sort(([,a], [,b]) => b.duration - a.duration)
                  .slice(0, 5)
                  .map(([taskId, stats]) => (
                    <div key={taskId} className="breakdown-item">
                      <div className="breakdown-name">{getTaskName(taskId)}</div>
                      <div className="breakdown-time">{formatDuration(stats.duration)}</div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 时间记录列表 */}
      <div className="time-entries">
        <h4>📝 时间记录</h4>
        {trackerState.timeEntries.length === 0 ? (
          <div className="empty-entries">
            <div className="empty-icon">⏱️</div>
            <div className="empty-text">暂无时间记录</div>
            <div className="empty-description">开始跟踪任务时间或手动添加记录</div>
          </div>
        ) : (
          <div className="entries-list">
            {trackerState.timeEntries.slice(0, 10).map(entry => (
              <div key={entry.id} className="entry-item">
                <div className="entry-info">
                  <div className="entry-task">{getTaskName(entry.taskId)}</div>
                  <div className="entry-time">
                    {formatDuration(entry.duration)} • {entry.startTime.toLocaleString('zh-CN')}
                  </div>
                  {entry.description && (
                    <div className="entry-description">{entry.description}</div>
                  )}
                </div>
                <button
                  onClick={() => deleteTimeEntry(entry.id)}
                  className="delete-entry-button"
                  title="删除记录"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 手动添加对话框 */}
      {trackerState.showManualEntry && (
        <div className="manual-entry-overlay">
          <div className="manual-entry-dialog">
            <div className="dialog-header">
              <h3>手动添加时间记录</h3>
              <button
                onClick={() => setTrackerState(prev => ({ ...prev, showManualEntry: false }))}
                className="close-button"
              >
                ✕
              </button>
            </div>

            <div className="manual-entry-form">
              <div className="form-group">
                <label>任务</label>
                <select
                  value={trackerState.manualEntry.taskId}
                  onChange={(e) => setTrackerState(prev => ({
                    ...prev,
                    manualEntry: { ...prev.manualEntry, taskId: e.target.value }
                  }))}
                  className="form-select"
                >
                  <option value="">选择任务</option>
                  {currentTask && (
                    <option value={currentTask.id}>{currentTask.title}</option>
                  )}
                </select>
              </div>

              <div className="form-group">
                <label>时长 (分钟)</label>
                <input
                  type="number"
                  min="1"
                  value={trackerState.manualEntry.duration}
                  onChange={(e) => setTrackerState(prev => ({
                    ...prev,
                    manualEntry: { ...prev.manualEntry, duration: parseInt(e.target.value) || 0 }
                  }))}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>日期</label>
                <input
                  type="date"
                  value={trackerState.manualEntry.date.toISOString().split('T')[0]}
                  onChange={(e) => setTrackerState(prev => ({
                    ...prev,
                    manualEntry: { ...prev.manualEntry, date: new Date(e.target.value) }
                  }))}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>描述 (可选)</label>
                <textarea
                  value={trackerState.manualEntry.description}
                  onChange={(e) => setTrackerState(prev => ({
                    ...prev,
                    manualEntry: { ...prev.manualEntry, description: e.target.value }
                  }))}
                  className="form-textarea"
                  rows={3}
                />
              </div>

              <div className="form-actions">
                <button
                  onClick={() => setTrackerState(prev => ({ ...prev, showManualEntry: false }))}
                  className="cancel-button"
                >
                  取消
                </button>
                <button
                  onClick={addManualEntry}
                  disabled={!trackerState.manualEntry.taskId || trackerState.manualEntry.duration <= 0}
                  className="submit-button"
                >
                  添加记录
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TimeTracker
