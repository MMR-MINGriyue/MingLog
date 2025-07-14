import React from 'react'

// 模拟任务管理模块的类型和组件
interface Task {
  id: string
  title: string
  description?: string
  status: 'inbox' | 'todo' | 'in-progress' | 'waiting' | 'someday' | 'done' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  dueDate?: Date
  completedAt?: Date
  estimatedTime?: number
  actualTime?: number
  linkedNotes: string[]
  linkedFiles: string[]
  tags: string[]
  contexts: string[]
  createdAt: Date
  updatedAt: Date
}

// GTD决策接口（暂时保留，后续会使用）
// interface GTDDecision {
//   action: 'do' | 'defer' | 'delegate' | 'delete' | 'project'
//   context?: string
//   dueDate?: Date
//   delegateTo?: string
//   projectName?: string
// }

/**
 * GTD工作流测试组件
 * 展示任务管理模块的核心功能
 */
export const GTDTest: React.FC = () => {
  const [currentView, setCurrentView] = React.useState<'inbox' | 'kanban' | 'review'>('inbox')
  const [inboxTasks, setInboxTasks] = React.useState<Task[]>([])
  const [quickInput, setQuickInput] = React.useState('')

  // 初始化示例数据
  React.useEffect(() => {
    const sampleTasks: Task[] = [
      {
        id: 'task-1',
        title: '准备下周的会议材料',
        description: '需要整理项目进度报告和下一步计划',
        status: 'inbox',
        priority: 'medium',
        linkedNotes: [],
        linkedFiles: [],
        tags: ['工作'],
        contexts: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'task-2',
        title: '购买生日礼物',
        status: 'inbox',
        priority: 'low',
        linkedNotes: [],
        linkedFiles: [],
        tags: ['个人'],
        contexts: [],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'task-3',
        title: '学习React新特性',
        description: '研究React 19的新功能和最佳实践',
        status: 'inbox',
        priority: 'high',
        linkedNotes: [],
        linkedFiles: [],
        tags: ['学习', '技术'],
        contexts: [],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]
    setInboxTasks(sampleTasks)
  }, [])

  // 快速收集
  const handleQuickCapture = () => {
    if (!quickInput.trim()) return

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: quickInput.trim(),
      status: 'inbox',
      priority: 'medium',
      linkedNotes: [],
      linkedFiles: [],
      tags: [],
      contexts: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    setInboxTasks(prev => [newTask, ...prev])
    setQuickInput('')
  }

  // 处理任务
  const handleProcessTask = (taskId: string) => {
    alert(`开始处理任务: ${taskId}`)
    // 这里应该打开GTD处理对话框
  }

  // 获取导航按钮样式
  const getNavButtonClass = (view: string) => {
    const baseClass = 'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors'
    return currentView === view
      ? `${baseClass} bg-blue-600 text-white`
      : `${baseClass} text-gray-600 hover:text-gray-900 hover:bg-gray-100`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">GTD工作流测试</h1>
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
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="max-w-6xl mx-auto p-6">
        {currentView === 'inbox' && (
          <div className="space-y-6">
            {/* 快速收集 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <span className="mr-2">📥</span>
                快速收集
              </h2>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={quickInput}
                  onChange={(e) => setQuickInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleQuickCapture()}
                  placeholder="输入任何想法、任务或提醒..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={handleQuickCapture}
                  disabled={!quickInput.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  收集
                </button>
              </div>
            </div>

            {/* 收集箱任务列表 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center justify-between">
                <span className="flex items-center">
                  <span className="mr-2">📋</span>
                  待处理项目
                </span>
                <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {inboxTasks.length} 项
                </span>
              </h2>

              {inboxTasks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🎉</div>
                  <p>收集箱为空！所有项目都已处理完成。</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {inboxTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{task.title}</h3>
                        {task.description && (
                          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          {task.tags.map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                            >
                              #{tag}
                            </span>
                          ))}
                          <span className="text-xs text-gray-500">
                            {task.createdAt.toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleProcessTask(task.id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        处理
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {currentView === 'kanban' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">任务看板</h2>
            <div className="grid grid-cols-4 gap-4">
              {['待办', '进行中', '等待', '已完成'].map((column) => (
                <div key={column} className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">{column}</h3>
                  <div className="space-y-2">
                    <div className="bg-white p-3 rounded border-l-4 border-blue-500">
                      <h4 className="font-medium">示例任务</h4>
                      <p className="text-sm text-gray-600 mt-1">任务描述...</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {currentView === 'review' && (
          <div className="space-y-6">
            {/* 系统状态概览 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <span className="mr-2">📊</span>
                系统状态概览
              </h2>
              <div className="grid grid-cols-5 gap-4">
                {[
                  { label: '收集箱', count: 3, color: 'bg-blue-100 text-blue-800' },
                  { label: '过期任务', count: 0, color: 'bg-green-100 text-green-800' },
                  { label: '今日任务', count: 5, color: 'bg-blue-100 text-blue-800' },
                  { label: '本周任务', count: 12, color: 'bg-blue-100 text-blue-800' },
                  { label: '将来/也许', count: 8, color: 'bg-gray-100 text-gray-800' }
                ].map((item) => (
                  <div key={item.label} className={`p-4 rounded-lg border ${item.color}`}>
                    <div className="text-2xl font-bold">{item.count}</div>
                    <div className="text-sm">{item.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* 系统建议 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <span className="mr-2">💡</span>
                系统建议
              </h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <span className="text-amber-600 mt-0.5">⚠️</span>
                  <p className="text-amber-800">收集箱有 3 个未处理项目，建议及时处理</p>
                </div>
                <div className="flex items-start gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <span className="text-blue-600 mt-0.5">ℹ️</span>
                  <p className="text-blue-800">本周任务较多，建议合理安排优先级</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 底部状态栏 */}
      <div className="bg-white border-t border-gray-200 px-6 py-2">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center gap-4">
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
