/**
 * 任务管理模块主入口
 * 统一导出所有模块功能
 */

// 核心模块类
export { TasksModule } from './TasksModule'

// 类型定义
export * from './types'

// 服务层
export * from './services'

// 模块工厂函数
export const TasksModuleFactory = {
  async create(config: any) {
    const { TasksModule } = await import('./TasksModule')
    return new TasksModule(config)
  }
}

// 重新导出核心接口，方便使用
export type {
  IModule,
  IModuleConfig,
  IModuleMetadata,
  ModuleStatus,
  IRouteConfig,
  IMenuItem,
  IModuleEvent
} from './types'

// 重新导出任务相关类型
export type {
  Task,
  TaskStatus,
  TaskPriority,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskFilter,
  TaskSortOptions,
  TaskStats,
  Project,
  ProjectStatus,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectFilter,
  ProjectStats,
  TimeEntry,
  CreateTimeEntryRequest,
  UpdateTimeEntryRequest,
  GTDContext,
  CreateGTDContextRequest,
  TaskTemplate,
  CreateTaskTemplateRequest,
  ProjectMilestone,
  CreateProjectMilestoneRequest,
  UpdateProjectMilestoneRequest,
  ProjectTemplate,
  CreateProjectTemplateRequest,
  ProjectReport,
  GTDWorkflow,
  GTDProcessResult,
  GTDDecision,
  GTDReviewResult,
  KanbanBoard,
  KanbanColumn,
  KanbanCard,
  TimeTrackingSession,
  TimeTrackingStats,
  TaskSearchResult,
  TaskSearchQuery,
  TaskNotification,
  TaskExportOptions,
  TaskImportOptions,
  TaskImportResult
} from './types'

// 重新导出服务接口
export type {
  ITasksService,
  IProjectsService,
  IGTDService,
  ITimeTrackingService,
  IKanbanService,
  INotificationService,
  IImportExportService
} from './services'

// 模块元数据
export const TASKS_MODULE_METADATA = {
  id: 'tasks',
  name: '任务管理',
  version: '1.0.0',
  description: 'GTD任务管理、项目管理、时间跟踪和看板视图功能',
  author: 'MingLog Team',
  icon: '✅',
  tags: ['tasks', 'gtd', 'project-management', 'time-tracking', 'kanban'],
  dependencies: [],
  optionalDependencies: ['notes', 'files']
}

// 模块配置默认值
export const TASKS_MODULE_DEFAULT_CONFIG = {
  enabled: true,
  settings: {
    defaultTaskStatus: 'todo',
    defaultTaskPriority: 'medium',
    enableTimeTracking: true,
    enableNotifications: true,
    gtdEnabled: true,
    kanbanEnabled: true,
    autoArchiveCompletedTasks: false,
    autoArchiveDays: 30,
    reminderSettings: {
      dueSoonDays: 3,
      overdueNotifications: true,
      dailyReviewTime: '09:00',
      weeklyReviewDay: 'sunday'
    }
  },
  preferences: {
    defaultView: 'list', // 'list' | 'kanban' | 'calendar'
    taskSortBy: 'dueDate',
    taskSortDirection: 'asc',
    showCompletedTasks: false,
    compactView: false,
    enableKeyboardShortcuts: true
  }
}

// 工具函数
export const TasksModuleUtils = {
  /**
   * 验证任务数据
   */
  validateTask(task: any): boolean {
    return !!(task.title && task.title.trim().length > 0)
  },

  /**
   * 验证项目数据
   */
  validateProject(project: any): boolean {
    return !!(project.name && project.name.trim().length > 0)
  },

  /**
   * 格式化任务标题
   */
  formatTaskTitle(title: string): string {
    return title.trim().replace(/\s+/g, ' ')
  },

  /**
   * 计算任务优先级分数
   */
  getTaskPriorityScore(priority: string): number {
    const scores: Record<string, number> = {
      'low': 1,
      'medium': 2,
      'high': 3,
      'urgent': 4
    }
    return scores[priority] || 2
  },

  /**
   * 检查任务是否过期
   */
  isTaskOverdue(task: any): boolean {
    if (!task.dueDate || task.status === 'done' || task.status === 'cancelled') {
      return false
    }
    return new Date(task.dueDate) < new Date()
  },

  /**
   * 检查任务是否今日到期
   */
  isTaskDueToday(task: any): boolean {
    if (!task.dueDate || task.status === 'done' || task.status === 'cancelled') {
      return false
    }
    const today = new Date()
    const dueDate = new Date(task.dueDate)
    return today.toDateString() === dueDate.toDateString()
  },

  /**
   * 获取任务状态显示文本
   */
  getTaskStatusText(status: string): string {
    const statusTexts: Record<string, string> = {
      'inbox': '收集箱',
      'todo': '待办',
      'in-progress': '进行中',
      'waiting': '等待',
      'someday': '将来/也许',
      'done': '已完成',
      'cancelled': '已取消'
    }
    return statusTexts[status] || status
  },

  /**
   * 获取任务优先级显示文本
   */
  getTaskPriorityText(priority: string): string {
    const priorityTexts: Record<string, string> = {
      'low': '低',
      'medium': '中',
      'high': '高',
      'urgent': '紧急'
    }
    return priorityTexts[priority] || priority
  },

  /**
   * 获取项目状态显示文本
   */
  getProjectStatusText(status: string): string {
    const statusTexts: Record<string, string> = {
      'active': '进行中',
      'on-hold': '暂停',
      'completed': '已完成',
      'cancelled': '已取消'
    }
    return statusTexts[status] || status
  },

  /**
   * 生成任务ID
   */
  generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },

  /**
   * 生成项目ID
   */
  generateProjectId(): string {
    return `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
