import React, { useState, useEffect } from 'react'
import { Task, TaskStatus, TaskPriority } from '../types'

interface TaskKanbanProps {
  projectId?: string
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void
  onTaskCreate?: (task: Partial<Task>) => void
}

interface KanbanColumn {
  id: TaskStatus
  title: string
  color: string
  tasks: Task[]
}

/**
 * 任务看板组件
 * 提供可视化的任务流程管理
 */
export const TaskKanban: React.FC<TaskKanbanProps> = ({
  projectId,
  onTaskUpdate,
  onTaskCreate
}) => {
  const [columns, setColumns] = useState<KanbanColumn[]>([])
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [draggedOverColumn, setDraggedOverColumn] = useState<TaskStatus | null>(null)
  const [newTaskColumn, setNewTaskColumn] = useState<TaskStatus | null>(null)
  const [newTaskTitle, setNewTaskTitle] = useState('')

  // 初始化看板列
  useEffect(() => {
    const initialColumns: KanbanColumn[] = [
      {
        id: TaskStatus.TODO,
        title: '待办',
        color: 'bg-gray-100 border-gray-300',
        tasks: []
      },
      {
        id: TaskStatus.IN_PROGRESS,
        title: '进行中',
        color: 'bg-blue-100 border-blue-300',
        tasks: []
      },
      {
        id: TaskStatus.WAITING,
        title: '等待',
        color: 'bg-yellow-100 border-yellow-300',
        tasks: []
      },
      {
        id: TaskStatus.DONE,
        title: '已完成',
        color: 'bg-green-100 border-green-300',
        tasks: []
      }
    ]

    // 模拟任务数据
    const mockTasks: Task[] = [
      {
        id: 'task-1',
        title: '设计用户界面',
        description: '完成登录页面的UI设计',
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        dueDate: new Date('2025-01-20'),
        estimatedTime: 240,
        linkedNotes: [],
        linkedFiles: [],
        tags: ['设计', 'UI'],
        contexts: ['@电脑'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'task-2',
        title: '实现用户认证',
        description: '开发JWT认证系统',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.HIGH,
        estimatedTime: 480,
        actualTime: 120,
        linkedNotes: [],
        linkedFiles: [],
        tags: ['开发', '后端'],
        contexts: ['@电脑'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'task-3',
        title: '等待设计评审',
        description: '等待产品经理确认设计方案',
        status: TaskStatus.WAITING,
        priority: TaskPriority.MEDIUM,
        linkedNotes: [],
        linkedFiles: [],
        tags: ['评审'],
        contexts: ['@会议'],
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'task-4',
        title: '搭建开发环境',
        description: '配置项目的开发环境和工具链',
        status: TaskStatus.DONE,
        priority: TaskPriority.MEDIUM,
        completedAt: new Date(),
        actualTime: 180,
        linkedNotes: [],
        linkedFiles: [],
        tags: ['环境', '配置'],
        contexts: ['@电脑'],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]

    // 将任务分配到对应列
    const columnsWithTasks = initialColumns.map(column => ({
      ...column,
      tasks: mockTasks.filter(task => task.status === column.id)
    }))

    setColumns(columnsWithTasks)
  }, [projectId])

  // 拖拽开始
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = 'move'
  }

  // 拖拽结束
  const handleDragEnd = () => {
    setDraggedTask(null)
    setDraggedOverColumn(null)
  }

  // 拖拽悬停
  const handleDragOver = (e: React.DragEvent, columnId: TaskStatus) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDraggedOverColumn(columnId)
  }

  // 拖拽离开
  const handleDragLeave = () => {
    setDraggedOverColumn(null)
  }

  // 放置任务
  const handleDrop = (e: React.DragEvent, targetColumnId: TaskStatus) => {
    e.preventDefault()
    
    if (!draggedTask || draggedTask.status === targetColumnId) {
      return
    }

    // 更新任务状态
    const updatedTask = { ...draggedTask, status: targetColumnId }
    
    // 如果移动到已完成，设置完成时间
    if (targetColumnId === TaskStatus.DONE && !updatedTask.completedAt) {
      updatedTask.completedAt = new Date()
    }

    // 更新列数据
    setColumns(prev => prev.map(column => ({
      ...column,
      tasks: column.id === draggedTask.status
        ? column.tasks.filter(t => t.id !== draggedTask.id)
        : column.id === targetColumnId
        ? [...column.tasks, updatedTask]
        : column.tasks
    })))

    // 触发更新回调
    if (onTaskUpdate) {
      onTaskUpdate(draggedTask.id, { status: targetColumnId })
    }

    setDraggedTask(null)
    setDraggedOverColumn(null)
  }

  // 创建新任务
  const handleCreateTask = (columnId: TaskStatus) => {
    if (!newTaskTitle.trim()) return

    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: newTaskTitle.trim(),
      status: columnId,
      priority: TaskPriority.MEDIUM,
      linkedNotes: [],
      linkedFiles: [],
      tags: [],
      contexts: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // 添加到对应列
    setColumns(prev => prev.map(column => 
      column.id === columnId
        ? { ...column, tasks: [...column.tasks, newTask] }
        : column
    ))

    // 重置输入状态
    setNewTaskColumn(null)
    setNewTaskTitle('')

    // 触发创建回调
    if (onTaskCreate) {
      onTaskCreate(newTask)
    }
  }

  // 获取优先级颜色
  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.URGENT:
        return 'border-l-red-500'
      case TaskPriority.HIGH:
        return 'border-l-orange-500'
      case TaskPriority.MEDIUM:
        return 'border-l-blue-500'
      case TaskPriority.LOW:
        return 'border-l-gray-500'
      default:
        return 'border-l-gray-300'
    }
  }

  // 获取优先级标签
  const getPriorityLabel = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.URGENT:
        return { text: '紧急', color: 'bg-red-100 text-red-800' }
      case TaskPriority.HIGH:
        return { text: '高', color: 'bg-orange-100 text-orange-800' }
      case TaskPriority.MEDIUM:
        return { text: '中', color: 'bg-blue-100 text-blue-800' }
      case TaskPriority.LOW:
        return { text: '低', color: 'bg-gray-100 text-gray-800' }
      default:
        return { text: '中', color: 'bg-gray-100 text-gray-800' }
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* 标题栏 */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <h1 className="text-2xl font-bold text-gray-900">任务看板</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            总任务: {columns.reduce((sum, col) => sum + col.tasks.length, 0)}
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            筛选
          </button>
        </div>
      </div>

      {/* 看板列 */}
      <div className="flex-1 flex gap-6 p-6 overflow-x-auto">
        {columns.map((column) => (
          <div
            key={column.id}
            className={`flex-shrink-0 w-80 ${column.color} rounded-lg border-2 ${
              draggedOverColumn === column.id ? 'border-blue-500 bg-blue-50' : ''
            }`}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            {/* 列标题 */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{column.title}</h3>
                <div className="flex items-center gap-2">
                  <span className="bg-white px-2 py-1 rounded text-sm font-medium">
                    {column.tasks.length}
                  </span>
                  <button
                    onClick={() => setNewTaskColumn(column.id)}
                    className="p-1 hover:bg-white hover:bg-opacity-50 rounded transition-colors"
                    title="添加任务"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* 任务列表 */}
            <div className="p-4 space-y-3 min-h-[200px]">
              {/* 新任务输入 */}
              {newTaskColumn === column.id && (
                <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 p-3">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateTask(column.id)
                      } else if (e.key === 'Escape') {
                        setNewTaskColumn(null)
                        setNewTaskTitle('')
                      }
                    }}
                    placeholder="输入任务标题..."
                    className="w-full px-2 py-1 border-none outline-none text-sm"
                    autoFocus
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={() => {
                        setNewTaskColumn(null)
                        setNewTaskTitle('')
                      }}
                      className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800"
                    >
                      取消
                    </button>
                    <button
                      onClick={() => handleCreateTask(column.id)}
                      disabled={!newTaskTitle.trim()}
                      className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      添加
                    </button>
                  </div>
                </div>
              )}

              {/* 任务卡片 */}
              {column.tasks.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task)}
                  onDragEnd={handleDragEnd}
                  className={`bg-white rounded-lg shadow-sm border-l-4 ${getPriorityColor(task.priority)} p-3 cursor-move hover:shadow-md transition-shadow ${
                    draggedTask?.id === task.id ? 'opacity-50' : ''
                  }`}
                >
                  {/* 任务标题 */}
                  <h4 className="font-medium text-gray-900 mb-2">{task.title}</h4>
                  
                  {/* 任务描述 */}
                  {task.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
                  )}

                  {/* 任务元信息 */}
                  <div className="space-y-2">
                    {/* 优先级和标签 */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getPriorityLabel(task.priority).color}`}>
                        {getPriorityLabel(task.priority).text}
                      </span>
                      {task.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                        >
                          #{tag}
                        </span>
                      ))}
                      {task.tags.length > 2 && (
                        <span className="text-xs text-gray-500">+{task.tags.length - 2}</span>
                      )}
                    </div>

                    {/* 时间信息 */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        {task.estimatedTime && (
                          <span title="预估时间">⏱️ {task.estimatedTime}分</span>
                        )}
                        {task.actualTime && (
                          <span title="实际时间">⏰ {task.actualTime}分</span>
                        )}
                      </div>
                      {task.dueDate && (
                        <span className={`${
                          new Date(task.dueDate) < new Date() ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          📅 {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* 上下文 */}
                    {task.contexts.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        {task.contexts.map((context) => (
                          <span
                            key={context}
                            className="px-1 py-0.5 bg-purple-100 text-purple-700 text-xs rounded"
                          >
                            {context}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* 空状态 */}
              {column.tasks.length === 0 && newTaskColumn !== column.id && (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-2xl mb-2">📋</div>
                  <p className="text-sm">暂无任务</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
