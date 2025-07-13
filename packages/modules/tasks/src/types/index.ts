/**
 * 任务管理模块类型定义统一导出
 */

// 任务相关类型
export * from './task'

// 项目相关类型
export * from './project'

// GTD工作流相关类型
export * from './gtd'

// 模块相关类型 (临时定义，直到核心模块可用)
export interface IModule {
  readonly metadata: any
  readonly status: string
  config: any
  initialize(coreAPI: any): Promise<void>
  activate(): Promise<void>
  deactivate(): Promise<void>
  destroy(): Promise<void>
  getConfig(): any
  setConfig(config: any): void
  getRoutes(): any[]
  getMenuItems(): any[]
  onEvent(event: any): void
  getHealthStatus(): Promise<any>
}

export interface IModuleConfig {
  enabled: boolean
  settings: Record<string, any>
  preferences: Record<string, any>
}

// 模块状态枚举 (临时定义，直到核心模块可用)
export enum ModuleStatus {
  UNLOADED = 'unloaded',
  LOADING = 'loading',
  LOADED = 'loaded',
  ACTIVATING = 'activating',
  ACTIVE = 'active',
  DEACTIVATING = 'deactivating',
  ERROR = 'error'
}

export interface IModuleMetadata {
  id: string
  name: string
  version: string
  description: string
  author: string
  icon?: string
  tags: string[]
  dependencies: string[]
  optionalDependencies?: string[]
}

export interface IRouteConfig {
  path: string
  component: any
  name: string
  meta?: Record<string, any>
}

export interface IMenuItem {
  id: string
  title: string
  icon?: string
  path?: string
  order: number
  children?: IMenuItem[]
}

export interface IModuleEvent {
  id: string
  type: string
  source: string
  target?: string
  data?: any
  timestamp: number
}



// 看板相关类型
export interface KanbanBoard {
  id: string
  name: string
  columns: KanbanColumn[]
  projectId?: string
  createdAt: Date
  updatedAt: Date
}

export interface KanbanColumn {
  id: string
  name: string
  status: string // 临时使用string，直到TaskStatus可用
  order: number
  limit?: number // WIP限制
  color?: string
}

export interface KanbanCard {
  taskId: string
  columnId: string
  order: number
}

// 时间跟踪相关类型
export interface TimeTrackingSession {
  id: string
  taskId: string
  startTime: Date
  endTime?: Date
  isActive: boolean
  description?: string
}

export interface TimeTrackingStats {
  totalTime: number // 总时间(分钟)
  todayTime: number
  weekTime: number
  monthTime: number
  byTask: Record<string, number>
  byProject: Record<string, number>
  byContext: Record<string, number>
}

// 搜索相关类型
export interface TaskSearchResult {
  tasks: any[] // 临时使用any[]，直到Task类型可用
  projects: any[] // 临时使用any[]，直到Project类型可用
  totalCount: number
  facets: {
    statuses: Record<string, number> // 临时使用string
    priorities: Record<string, number> // 临时使用string
    tags: Record<string, number>
    contexts: Record<string, number>
  }
}

export interface TaskSearchQuery {
  query?: string
  filters?: any // 临时使用any，直到TaskFilter可用
  projectFilters?: any // 临时使用any，直到ProjectFilter可用
  sortBy?: any // 临时使用any，直到TaskSortOptions可用
  limit?: number
  offset?: number
}

// 通知相关类型
export interface TaskNotification {
  id: string
  type: 'due_soon' | 'overdue' | 'completed' | 'assigned' | 'reminder'
  taskId: string
  title: string
  message: string
  isRead: boolean
  createdAt: Date
}

// 导入导出相关类型
export interface TaskExportOptions {
  format: 'json' | 'csv' | 'markdown' | 'pdf'
  includeProjects: boolean
  includeTimeEntries: boolean
  dateRange?: {
    startDate: Date
    endDate: Date
  }
  filters?: any // 临时使用any，直到TaskFilter可用
}

export interface TaskImportOptions {
  format: 'json' | 'csv' | 'todoist' | 'asana' | 'trello'
  mergeStrategy: 'replace' | 'merge' | 'append'
  defaultProject?: string
  defaultStatus?: string // 临时使用string
  defaultPriority?: string // 临时使用string
}

export interface TaskImportResult {
  imported: number
  skipped: number
  errors: string[]
  warnings: string[]
}

// 重新导出核心类型 - 修正导出方式
export {
  TaskStatus,
  TaskPriority
} from './task'

export type {
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskFilter,
  TaskSortOptions,
  TaskStats,
  TimeEntry,
  CreateTimeEntryRequest,
  UpdateTimeEntryRequest,

  TaskTemplate,
  CreateTaskTemplateRequest
} from './task'

export {
  ProjectStatus
} from './project'

export type {
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectFilter,
  ProjectStats,
  ProjectMilestone,
  CreateProjectMilestoneRequest,
  UpdateProjectMilestoneRequest,
  ProjectTemplate,
  CreateProjectTemplateRequest,
  ProjectReport,
  ProjectTimelineEvent
} from './project'

export type {
  GTDDecision,
  GTDProcessResult,
  GTDReviewResult,
  GTDContext,
  CreateGTDContextRequest
} from './gtd'
