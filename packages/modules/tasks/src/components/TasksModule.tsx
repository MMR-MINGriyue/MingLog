import React, { useState } from 'react'
import { GTDInbox } from './GTDInbox'
import { TaskKanban } from './TaskKanban'
import { GTDReview } from './GTDReview'
import { Task, GTDDecision, GTDReviewResult } from '../types'

interface TasksModuleProps {
  className?: string
}

type ViewMode = 'inbox' | 'kanban' | 'review' | 'projects'

/**
 * 任务管理模块主组件
 * 整合GTD工作流的所有功能
 */
export const TasksModule: React.FC<TasksModuleProps> = ({ className = '' }) => {
  const [currentView, setCurrentView] = useState<ViewMode>('inbox')
  const [notifications, setNotifications] = useState<string[]>([])

  // 处理任务处理完成
  const handleTaskProcessed = (taskId: string, decision: GTDDecision) => {
    const actionText = {
      'do': '立即执行',
      'defer': '延期处理',
      'delegate': '委派他人',
      'delete': '删除',
      'project': '创建项目'
    }[decision.action]

    setNotifications(prev => [
      `任务已处理: ${actionText}`,
      ...prev.slice(0, 4) // 保留最近5条通知
    ])

    // 3秒后自动清除通知
    setTimeout(() => {
      setNotifications(prev => prev.slice(0, -1))
    }, 3000)
  }

  // 处理快速收集
  const handleQuickCapture = (input: string) => {
    setNotifications(prev => [
      `已收集: ${input.length > 30 ? input.substring(0, 30) + '...' : input}`,
      ...prev.slice(0, 4)
    ])

    setTimeout(() => {
      setNotifications(prev => prev.slice(0, -1))
    }, 3000)
  }

  // 处理任务更新
  const handleTaskUpdate = (taskId: string, updates: Partial<Task>) => {
    console.log('Task updated:', taskId, updates)
    // 这里应该调用实际的任务服务
  }

  // 处理任务创建
  const handleTaskCreate = (task: Partial<Task>) => {
    console.log('Task created:', task)
    setNotifications(prev => [
      `新任务已创建: ${task.title}`,
      ...prev.slice(0, 4)
    ])

    setTimeout(() => {
      setNotifications(prev => prev.slice(0, -1))
    }, 3000)
  }

  // 处理回顾完成
  const handleReviewComplete = (result: GTDReviewResult) => {
    console.log('Review completed:', result)
    setNotifications(prev => [
      'GTD回顾已完成',
      ...prev.slice(0, 4)
    ])

    setTimeout(() => {
      setNotifications(prev => prev.slice(0, -1))
    }, 3000)
  }

  // 获取视图标题
  const getViewTitle = () => {
    switch (currentView) {
      case 'inbox':
        return 'GTD 收集箱'
      case 'kanban':
        return '任务看板'
      case 'review':
        return 'GTD 回顾'
      case 'projects':
        return '项目管理'
      default:
        return '任务管理'
    }
  }

  // 获取导航按钮样式
  const getNavButtonClass = (view: ViewMode) => {
    const baseClass = 'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors'
    return currentView === view
      ? `${baseClass} bg-blue-600 text-white`
      : `${baseClass} text-gray-600 hover:text-gray-900 hover:bg-gray-100`
  }

  return (
    <div className={`h-full flex flex-col bg-gray-50 ${className}`}>
      {/* 顶部导航栏 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          {/* 导航按钮 */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentView('inbox')}
              className={getNavButtonClass('inbox')}
            >
              <span>📥</span>
              收集箱
            </button>
            <button
              onClick={() => setCurrentView('kanban')}
              className={getNavButtonClass('kanban')}
            >
              <span>📋</span>
              看板
            </button>
            <button
              onClick={() => setCurrentView('review')}
              className={getNavButtonClass('review')}
            >
              <span>📊</span>
              回顾
            </button>
            <button
              onClick={() => setCurrentView('projects')}
              className={getNavButtonClass('projects')}
              disabled
            >
              <span>📁</span>
              项目
              <span className="text-xs bg-gray-200 text-gray-600 px-1 rounded">即将推出</span>
            </button>
          </div>

          {/* 右侧操作 */}
          <div className="flex items-center gap-4">
            {/* 快速统计 */}
            <div className="hidden md:flex items-center gap-4 text-sm text-gray-600">
              <span>今日任务: 5</span>
              <span>进行中: 3</span>
              <span>已完成: 12</span>
            </div>

            {/* 设置按钮 */}
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 通知栏 */}
      {notifications.length > 0 && (
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-2">
          <div className="flex items-center gap-2">
            <span className="text-blue-600">ℹ️</span>
            <span className="text-blue-800 text-sm">{notifications[0]}</span>
            {notifications.length > 1 && (
              <span className="text-blue-600 text-xs">+{notifications.length - 1} 更多</span>
            )}
          </div>
        </div>
      )}

      {/* 主内容区域 */}
      <div className="flex-1 overflow-hidden">
        {currentView === 'inbox' && (
          <GTDInbox
            onTaskProcessed={handleTaskProcessed}
            onQuickCapture={handleQuickCapture}
          />
        )}
        
        {currentView === 'kanban' && (
          <TaskKanban
            onTaskUpdate={handleTaskUpdate}
            onTaskCreate={handleTaskCreate}
          />
        )}
        
        {currentView === 'review' && (
          <GTDReview
            onReviewComplete={handleReviewComplete}
          />
        )}
        
        {currentView === 'projects' && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-6xl mb-4">🚧</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">项目管理</h2>
              <p className="text-gray-600">此功能正在开发中，敬请期待！</p>
            </div>
          </div>
        )}
      </div>

      {/* 底部状态栏 */}
      <div className="bg-white border-t border-gray-200 px-6 py-2">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-4">
            <span>当前视图: {getViewTitle()}</span>
            <span>•</span>
            <span>GTD工作流: 收集 → 处理 → 组织 → 回顾 → 执行</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            <span>系统正常</span>
          </div>
        </div>
      </div>
    </div>
  )
}
