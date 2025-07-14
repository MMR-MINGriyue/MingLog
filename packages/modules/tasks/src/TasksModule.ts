/**
 * 任务管理模块主类
 * 实现IModule接口，提供任务管理的完整功能
 */

import {
  TasksService,
  ProjectsService,
  GTDService,
  TimeTrackingService,
  KanbanService,
  NotificationService,
  ImportExportService,
  type ITasksService,
  type IProjectsService,
  type IGTDService
} from './services'

// 核心模块接口定义 (基于现有核心系统)
interface IModuleMetadata {
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

interface IModuleConfig {
  enabled: boolean
  settings: Record<string, any>
  preferences: Record<string, any>
}

enum ModuleStatus {
  UNINITIALIZED = 'uninitialized',
  INITIALIZING = 'initializing',
  INITIALIZED = 'initialized',
  ACTIVATING = 'activating',
  ACTIVE = 'active',
  DEACTIVATING = 'deactivating',
  UNLOADED = 'unloaded',
  ERROR = 'error'
}

interface IRouteConfig {
  path: string
  component: any
  name: string
  meta?: Record<string, any>
}

interface IMenuItem {
  id: string
  title: string
  icon?: string
  path?: string
  order: number
  children?: IMenuItem[]
}

interface IModuleEvent {
  id: string
  type: string
  source: string
  target?: string
  data?: any
  timestamp: number
}

interface IModule {
  readonly metadata: IModuleMetadata
  readonly status: ModuleStatus
  config: IModuleConfig

  initialize(coreAPI: any): Promise<void>
  activate(): Promise<void>
  deactivate(): Promise<void>
  destroy(): Promise<void>

  getConfig(): IModuleConfig
  setConfig(config: Partial<IModuleConfig>): void
  getRoutes(): IRouteConfig[]
  getMenuItems(): IMenuItem[]
  onEvent(event: IModuleEvent): void
  getHealthStatus(): Promise<{
    status: 'healthy' | 'warning' | 'error'
    message?: string
    details?: Record<string, any>
  }>
}

// 临时类型定义，直到核心模块可用
type ReactComponent = () => any

// 简化的BaseModule实现
abstract class BaseModule implements IModule {
  protected _status: ModuleStatus = ModuleStatus.UNINITIALIZED
  protected _config: IModuleConfig

  constructor(
    protected _metadata: IModuleMetadata,
    config?: Partial<IModuleConfig>
  ) {
    this._config = {
      enabled: true,
      settings: {},
      preferences: {},
      ...config
    }
  }

  get metadata(): IModuleMetadata {
    return { ...this._metadata }
  }

  get status(): ModuleStatus {
    return this._status
  }

  get config(): IModuleConfig {
    return { ...this._config }
  }

  set config(config: IModuleConfig) {
    this._config = { ...config }
  }

  async initialize(coreAPI: any): Promise<void> {
    this._status = ModuleStatus.INITIALIZING
    await this.onInitialize(coreAPI)
    this._status = ModuleStatus.INITIALIZED
  }

  async activate(): Promise<void> {
    this._status = ModuleStatus.ACTIVATING
    await this.onActivate()
    this._status = ModuleStatus.ACTIVE
  }

  async deactivate(): Promise<void> {
    this._status = ModuleStatus.DEACTIVATING
    await this.onDeactivate()
    this._status = ModuleStatus.UNLOADED
  }

  async destroy(): Promise<void> {
    await this.onDestroy()
    this._status = ModuleStatus.UNLOADED
  }

  getConfig(): IModuleConfig {
    return { ...this._config }
  }

  setConfig(config: Partial<IModuleConfig>): void {
    this._config = { ...this._config, ...config }
  }

  async getHealthStatus() {
    return {
      status: 'healthy' as const,
      message: 'Module is healthy'
    }
  }

  protected abstract onInitialize(coreAPI: any): Promise<void>
  protected abstract onActivate(): Promise<void>
  protected abstract onDeactivate(): Promise<void>
  protected abstract onDestroy(): Promise<void>
  abstract getRoutes(): IRouteConfig[]
  abstract getMenuItems(): IMenuItem[]
  abstract onEvent(event: IModuleEvent): void
}

export class TasksModule extends BaseModule {
  private tasksService!: ITasksService
  private projectsService!: IProjectsService
  private gtdService!: IGTDService
  private timeTrackingService!: TimeTrackingService
  private kanbanService!: KanbanService
  private notificationService!: NotificationService
  private importExportService!: ImportExportService
  private coreAPI: any

  constructor(config?: Partial<IModuleConfig>) {
    const metadata: IModuleMetadata = {
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

    super(metadata, config)
  }

  protected async onInitialize(coreAPI: any): Promise<void> {
    console.log('Tasks module initializing...')
    this.coreAPI = coreAPI
    
    // 初始化服务层
    this.tasksService = new TasksService(coreAPI)
    this.projectsService = new ProjectsService(coreAPI)
    this.gtdService = new GTDService(this.tasksService, this.projectsService, coreAPI)
    this.timeTrackingService = new TimeTrackingService(coreAPI)
    this.kanbanService = new KanbanService(coreAPI)
    this.notificationService = new NotificationService(coreAPI)
    this.importExportService = new ImportExportService(coreAPI)

    // 创建数据库表
    await this.createDatabaseTables()
  }

  protected async onActivate(): Promise<void> {
    console.log('Tasks module activating...')
    
    // 注册事件监听器
    if (this.coreAPI?.events) {
      this.coreAPI.events.on('note:created', this.handleNoteCreated.bind(this))
      this.coreAPI.events.on('note:updated', this.handleNoteUpdated.bind(this))
      this.coreAPI.events.on('search:query', this.handleSearchQuery.bind(this))
    }

    // 启动定时任务
    this.startScheduledTasks()
  }

  protected async onDeactivate(): Promise<void> {
    console.log('Tasks module deactivating...')
    
    // 取消事件监听器
    if (this.coreAPI?.events) {
      this.coreAPI.events.off('note:created', this.handleNoteCreated.bind(this))
      this.coreAPI.events.off('note:updated', this.handleNoteUpdated.bind(this))
      this.coreAPI.events.off('search:query', this.handleSearchQuery.bind(this))
    }

    // 停止定时任务
    this.stopScheduledTasks()
  }

  protected async onDestroy(): Promise<void> {
    console.log('Tasks module destroying...')
    // 清理资源
  }

  getRoutes(): IRouteConfig[] {
    // 占位符组件，后续实现真实组件
    const TasksPlaceholder = () => 'Tasks Module - Coming Soon'
    const ProjectsPlaceholder = () => 'Projects Module - Coming Soon'
    const KanbanPlaceholder = () => 'Kanban Board - Coming Soon'
    const GTDPlaceholder = () => 'GTD Workflow - Coming Soon'

    return [
      {
        path: '/tasks',
        component: TasksPlaceholder,
        name: 'Tasks List'
      },
      {
        path: '/tasks/new',
        component: TasksPlaceholder,
        name: 'New Task'
      },
      {
        path: '/tasks/:id',
        component: TasksPlaceholder,
        name: 'View Task'
      },
      {
        path: '/tasks/:id/edit',
        component: TasksPlaceholder,
        name: 'Edit Task'
      },
      {
        path: '/projects',
        component: ProjectsPlaceholder,
        name: 'Projects List'
      },
      {
        path: '/projects/new',
        component: ProjectsPlaceholder,
        name: 'New Project'
      },
      {
        path: '/projects/:id',
        component: ProjectsPlaceholder,
        name: 'View Project'
      },
      {
        path: '/kanban',
        component: KanbanPlaceholder,
        name: 'Kanban Board'
      },
      {
        path: '/gtd',
        component: GTDPlaceholder,
        name: 'GTD Workflow'
      },
      {
        path: '/gtd/inbox',
        component: GTDPlaceholder,
        name: 'GTD Inbox'
      },
      {
        path: '/gtd/review',
        component: GTDPlaceholder,
        name: 'GTD Review'
      }
    ]
  }

  getMenuItems(): IMenuItem[] {
    return [
      {
        id: 'tasks',
        title: '任务管理',
        icon: '✅',
        path: '/tasks',
        order: 10,
        children: [
          {
            id: 'tasks-list',
            title: '所有任务',
            icon: '📋',
            path: '/tasks',
            order: 1
          },
          {
            id: 'tasks-new',
            title: '新建任务',
            icon: '➕',
            path: '/tasks/new',
            order: 2
          },
          {
            id: 'tasks-today',
            title: '今日任务',
            icon: '📅',
            path: '/tasks?filter=today',
            order: 3
          },
          {
            id: 'tasks-overdue',
            title: '过期任务',
            icon: '⚠️',
            path: '/tasks?filter=overdue',
            order: 4
          }
        ]
      },
      {
        id: 'projects',
        title: '项目管理',
        icon: '📁',
        path: '/projects',
        order: 11,
        children: [
          {
            id: 'projects-list',
            title: '所有项目',
            icon: '📂',
            path: '/projects',
            order: 1
          },
          {
            id: 'projects-new',
            title: '新建项目',
            icon: '➕',
            path: '/projects/new',
            order: 2
          },
          {
            id: 'projects-active',
            title: '进行中项目',
            icon: '🚀',
            path: '/projects?filter=active',
            order: 3
          }
        ]
      },
      {
        id: 'kanban',
        title: '看板视图',
        icon: '📊',
        path: '/kanban',
        order: 12
      },
      {
        id: 'gtd',
        title: 'GTD工作流',
        icon: '🔄',
        path: '/gtd',
        order: 13,
        children: [
          {
            id: 'gtd-inbox',
            title: '收集箱',
            icon: '📥',
            path: '/gtd/inbox',
            order: 1
          },
          {
            id: 'gtd-next-actions',
            title: '下一步行动',
            icon: '⚡',
            path: '/gtd/next-actions',
            order: 2
          },
          {
            id: 'gtd-waiting',
            title: '等待清单',
            icon: '⏳',
            path: '/gtd/waiting',
            order: 3
          },
          {
            id: 'gtd-someday',
            title: '将来/也许',
            icon: '💭',
            path: '/gtd/someday',
            order: 4
          },
          {
            id: 'gtd-review',
            title: '回顾',
            icon: '🔍',
            path: '/gtd/review',
            order: 5
          }
        ]
      }
    ]
  }

  onEvent(event: IModuleEvent): void {
    console.log('Tasks module received event:', event)
    
    switch (event.type) {
      case 'task:created':
        this.handleTaskCreated(event)
        break
      case 'task:updated':
        this.handleTaskUpdated(event)
        break
      case 'task:completed':
        this.handleTaskCompleted(event)
        break
      case 'project:created':
        this.handleProjectCreated(event)
        break
      case 'search:query':
        this.handleSearchQuery(event)
        break
      default:
        // 处理其他事件
        break
    }
  }

  // 公共API方法
  getTasksService(): ITasksService {
    return this.tasksService
  }

  getProjectsService(): IProjectsService {
    return this.projectsService
  }

  getGTDService(): IGTDService {
    return this.gtdService
  }

  // 私有方法
  private async createDatabaseTables(): Promise<void> {
    if (!this.coreAPI?.database) {
      console.warn('Database not available, skipping table creation')
      return
    }

    try {
      // 创建项目表（必须先创建，因为tasks表有外键引用）
      await this.coreAPI.database.execute(`
        CREATE TABLE IF NOT EXISTS projects (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          status TEXT NOT NULL DEFAULT 'active',
          color TEXT,
          start_date TEXT,
          due_date TEXT,
          completed_at TEXT,
          linked_notes TEXT DEFAULT '[]',
          linked_files TEXT DEFAULT '[]',
          progress INTEGER DEFAULT 0,
          total_tasks INTEGER DEFAULT 0,
          completed_tasks INTEGER DEFAULT 0,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          created_by TEXT
        )
      `)

      // 创建任务表（在projects表之后创建，因为有外键引用）
      await this.coreAPI.database.execute(`
        CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          status TEXT NOT NULL DEFAULT 'todo',
          priority TEXT NOT NULL DEFAULT 'medium',
          due_date TEXT,
          completed_at TEXT,
          estimated_time INTEGER,
          actual_time INTEGER,
          project_id TEXT,
          parent_task_id TEXT,
          linked_notes TEXT DEFAULT '[]',
          linked_files TEXT DEFAULT '[]',
          tags TEXT DEFAULT '[]',
          contexts TEXT DEFAULT '[]',
          recurrence TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          created_by TEXT,
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
          FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE CASCADE
        )
      `)

      // 创建时间记录表
      await this.coreAPI.database.execute(`
        CREATE TABLE IF NOT EXISTS task_time_entries (
          id TEXT PRIMARY KEY,
          task_id TEXT NOT NULL,
          start_time TEXT NOT NULL,
          end_time TEXT,
          duration INTEGER DEFAULT 0,
          status TEXT NOT NULL DEFAULT 'active',
          description TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
        )
      `)

      // 创建看板表
      await this.coreAPI.database.execute(`
        CREATE TABLE IF NOT EXISTS kanban_boards (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          project_id TEXT,
          settings TEXT DEFAULT '{}',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
        )
      `)

      // 创建看板列表
      await this.coreAPI.database.execute(`
        CREATE TABLE IF NOT EXISTS kanban_columns (
          id TEXT PRIMARY KEY,
          board_id TEXT NOT NULL,
          name TEXT NOT NULL,
          status TEXT NOT NULL,
          column_order INTEGER DEFAULT 0,
          color TEXT DEFAULT '#f5f5f5',
          task_limit INTEGER,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (board_id) REFERENCES kanban_boards(id) ON DELETE CASCADE
        )
      `)

      // 创建通知表
      await this.coreAPI.database.execute(`
        CREATE TABLE IF NOT EXISTS task_notifications (
          id TEXT PRIMARY KEY,
          task_id TEXT,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          message TEXT,
          scheduled_time TEXT NOT NULL,
          is_read INTEGER DEFAULT 0,
          is_sent INTEGER DEFAULT 0,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
        )
      `)

      // 创建索引
      await this.coreAPI.database.execute('CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)')
      await this.coreAPI.database.execute('CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority)')
      await this.coreAPI.database.execute('CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date)')
      await this.coreAPI.database.execute('CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id)')
      await this.coreAPI.database.execute('CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status)')

      console.log('Tasks module database tables created successfully')

      // 验证外键约束是否正确设置
      await this.verifyForeignKeyConstraints()
    } catch (error) {
      console.error('Failed to create tasks module database tables:', error)
      throw error
    }
  }

  /**
   * 验证外键约束设置
   */
  private async verifyForeignKeyConstraints(): Promise<void> {
    if (!this.coreAPI?.database) {
      return
    }

    try {
      // 检查外键约束是否启用
      const result = await this.coreAPI.database.query('PRAGMA foreign_keys')
      console.log('外键约束状态:', result)

      // 验证表结构
      const projectsSchema = await this.coreAPI.database.query('PRAGMA table_info(projects)')
      const tasksSchema = await this.coreAPI.database.query('PRAGMA table_info(tasks)')

      console.log('Projects表结构验证完成，字段数:', projectsSchema.length)
      console.log('Tasks表结构验证完成，字段数:', tasksSchema.length)

      // 验证外键约束
      const foreignKeys = await this.coreAPI.database.query('PRAGMA foreign_key_list(tasks)')
      console.log('Tasks表外键约束:', foreignKeys.length, '个')

    } catch (error) {
      console.warn('外键约束验证失败:', error)
      // 不抛出错误，因为这只是验证步骤
    }
  }

  private handleTaskCreated(event: IModuleEvent): void {
    // 处理任务创建事件
    console.log('Task created:', event.data)
  }

  private handleTaskUpdated(event: IModuleEvent): void {
    // 处理任务更新事件
    console.log('Task updated:', event.data)
  }

  private handleTaskCompleted(event: IModuleEvent): void {
    // 处理任务完成事件
    console.log('Task completed:', event.data)
    
    // 可以触发通知、更新统计等
    if (this.notificationService) {
      this.notificationService.sendNotification('task_completed', `任务 "${event.data?.task?.title}" 已完成`)
    }
  }

  private handleProjectCreated(event: IModuleEvent): void {
    // 处理项目创建事件
    console.log('Project created:', event.data)
  }

  private handleNoteCreated(event: IModuleEvent): void {
    // 处理笔记创建事件，可能需要从笔记中提取任务
    console.log('Note created, checking for tasks:', event.data)
  }

  private handleNoteUpdated(event: IModuleEvent): void {
    // 处理笔记更新事件
    console.log('Note updated:', event.data)
  }

  private handleSearchQuery(event: IModuleEvent): void {
    // 处理搜索查询事件
    console.log('Search query received:', event.data)
    
    // 可以在这里实现任务搜索逻辑
    if (event.data?.query && this.tasksService) {
      this.tasksService.searchTasks(event.data.query).then(results => {
        // 发送搜索结果事件
        if (this.coreAPI?.events) {
          this.coreAPI.events.emit('search:results', {
            module: 'tasks',
            query: event.data.query,
            results: results
          })
        }
      })
    }
  }

  private startScheduledTasks(): void {
    // 启动定时任务，如定期回顾提醒等
    console.log('Starting scheduled tasks for Tasks module')
  }

  private stopScheduledTasks(): void {
    // 停止定时任务
    console.log('Stopping scheduled tasks for Tasks module')
  }
}
