/**
 * 任务管理模块类型定义
 * 定义任务、项目、时间跟踪等核心数据类型
 */

// 任务状态枚举
export enum TaskStatus {
  INBOX = 'inbox',           // 收集箱
  TODO = 'todo',             // 待办
  IN_PROGRESS = 'in-progress', // 进行中
  WAITING = 'waiting',       // 等待
  SOMEDAY = 'someday',       // 将来/也许
  DONE = 'done',             // 已完成
  CANCELLED = 'cancelled'    // 已取消
}

// 任务优先级枚举
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

// 重复任务类型
export interface TaskRecurrence {
  type: 'daily' | 'weekly' | 'monthly' | 'yearly'
  interval: number // 间隔
  daysOfWeek?: number[] // 周几 (0=周日)
  dayOfMonth?: number   // 月的第几天
  endDate?: Date        // 结束日期
  maxOccurrences?: number // 最大重复次数
}

// 任务实体
export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  dueDate?: Date
  completedAt?: Date
  estimatedTime?: number // 预估时间(分钟)
  actualTime?: number    // 实际时间(分钟)
  
  // 关联关系
  projectId?: string
  parentTaskId?: string  // 子任务
  linkedNotes: string[]  // 关联笔记
  linkedFiles: string[]  // 关联文件
  
  // 标签和分类
  tags: string[]
  contexts: string[]     // GTD上下文 (@home, @office, @calls)
  
  // 重复任务
  recurrence?: TaskRecurrence
  
  // 元数据
  createdAt: Date
  updatedAt: Date
  createdBy?: string
}

// 创建任务请求
export interface CreateTaskRequest {
  title: string
  description?: string
  priority?: TaskPriority
  dueDate?: Date
  estimatedTime?: number
  projectId?: string
  parentTaskId?: string
  linkedNotes?: string[]
  linkedFiles?: string[]
  tags?: string[]
  contexts?: string[]
  recurrence?: TaskRecurrence
}

// 更新任务请求
export interface UpdateTaskRequest {
  title?: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  dueDate?: Date
  completedAt?: Date
  estimatedTime?: number
  actualTime?: number
  projectId?: string
  parentTaskId?: string
  linkedNotes?: string[]
  linkedFiles?: string[]
  tags?: string[]
  contexts?: string[]
  recurrence?: TaskRecurrence
}

// 任务过滤器
export interface TaskFilter {
  status?: TaskStatus[]
  priority?: TaskPriority[]
  priorities?: TaskPriority[]  // 支持多个优先级
  projectId?: string
  tags?: string[]
  contexts?: string[]
  dueDateFrom?: Date
  dueDateTo?: Date
  dueAfter?: Date      // 新增：截止日期之后
  dueBefore?: Date     // 新增：截止日期之前
  hasLinkedNotes?: boolean
  hasLinkedFiles?: boolean
  search?: string
  parentTaskId?: string // 新增：父任务ID过滤
  hasRecurrence?: boolean // 新增：是否有重复设置
}

// 任务排序选项
export interface TaskSortOptions {
  field: 'title' | 'priority' | 'dueDate' | 'createdAt' | 'updatedAt'
  direction: 'asc' | 'desc'
}

// 任务统计信息
export interface TaskStats {
  total: number
  byStatus: Record<TaskStatus, number>
  byPriority: Record<TaskPriority, number>
  overdue: number
  dueToday: number
  dueThisWeek: number
  completed: number
  completionRate: number
}

// 时间记录实体
export interface TimeEntry {
  id: string
  taskId: string
  startTime: Date
  endTime?: Date
  duration?: number // 秒
  description?: string
  createdAt: Date
}

// 创建时间记录请求
export interface CreateTimeEntryRequest {
  taskId: string
  startTime: Date
  endTime?: Date
  description?: string
}

// 更新时间记录请求
export interface UpdateTimeEntryRequest {
  endTime?: Date
  description?: string
}

// GTD上下文
export interface GTDContext {
  id: string
  name: string
  description?: string
  icon?: string
  color?: string
  createdAt: Date
  updatedAt: Date
}

// 创建GTD上下文请求
export interface CreateGTDContextRequest {
  name: string
  description?: string
  icon?: string
  color?: string
}

// 任务模板
export interface TaskTemplate {
  id: string
  name: string
  description?: string
  defaultTitle: string
  defaultDescription?: string
  defaultPriority: TaskPriority
  defaultEstimatedTime?: number
  defaultTags: string[]
  defaultContexts: string[]
  checklist?: string[] // 检查清单项目
  createdAt: Date
  updatedAt: Date
}

// 创建任务模板请求
export interface CreateTaskTemplateRequest {
  name: string
  description?: string
  defaultTitle: string
  defaultDescription?: string
  defaultPriority?: TaskPriority
  defaultEstimatedTime?: number
  defaultTags?: string[]
  defaultContexts?: string[]
  checklist?: string[]
}
