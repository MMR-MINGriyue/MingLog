/**
 * MingLog核心类型定义
 */

import { ComponentType } from 'react'

// 基础类型
export interface BaseEntity {
  id: string
  created_at: string
  updated_at: string
}

// 模块事件类型
export enum ModuleEventType {
  MODULE_LOADED = 'module:loaded',
  MODULE_ACTIVATED = 'module:activated',
  MODULE_DEACTIVATED = 'module:deactivated',
  MODULE_UNLOADED = 'module:unloaded',
  DATA_CREATED = 'data:created',
  DATA_UPDATED = 'data:updated',
  DATA_DELETED = 'data:deleted',
  SEARCH_QUERY = 'search:query',
  NAVIGATION_REQUEST = 'navigation:request',
  SETTINGS_CHANGED = 'settings:changed'
}

// 模块事件接口
export interface ModuleEvent {
  type: ModuleEventType | string
  source: string
  target?: string
  data: any
  timestamp: number
  id: string
}

// 路由定义
export interface ModuleRoute {
  path: string
  component: ComponentType<any>
  title: string
  icon?: string
  requiresAuth?: boolean
  exact?: boolean
}

// 菜单项定义
export interface ModuleMenuItem {
  id: string
  label: string
  icon?: string
  path?: string
  children?: ModuleMenuItem[]
  order: number
  visible?: boolean
}

// 设置项定义
export interface SettingItem {
  key: string
  label: string
  type: 'boolean' | 'string' | 'number' | 'select' | 'multiselect' | 'color' | 'file'
  defaultValue: any
  options?: { label: string; value: any }[]
  description?: string
  validation?: (value: any) => boolean | string
  category?: string
  order?: number
}

// 版本约束
export interface VersionConstraint {
  module: string
  constraint: string // 如 "^1.0.0", ">=1.2.0 <2.0.0"
  optional?: boolean
}

// 模块配置
export interface ModuleConfig {
  id: string
  name: string
  description: string
  version: string
  author?: string
  homepage?: string
  repository?: string
  enabled: boolean
  dependencies: string[]
  dependencyConstraints?: VersionConstraint[]
  optionalDependencies?: string[]
  settings: Record<string, any>
  permissions?: string[]
  icon?: string
  category?: string
  minCoreVersion?: string
  maxCoreVersion?: string
}

// 模块状态
export enum ModuleStatus {
  UNLOADED = 'unloaded',
  LOADING = 'loading',
  LOADED = 'loaded',
  ACTIVATING = 'activating',
  ACTIVE = 'active',
  DEACTIVATING = 'deactivating',
  ERROR = 'error'
}

// 核心API接口
export interface CoreAPI {
  // 事件系统
  events: {
    emit(event: string, data?: any): void
    on(event: string, handler: Function): void
    off(event: string, handler: Function): void
    once(event: string, handler: Function): void
  }
  
  // 数据库访问
  database: {
    query<T = any>(sql: string, params?: any[]): Promise<T[]>
    execute(sql: string, params?: any[]): Promise<void>
    transaction<T>(callback: () => Promise<T>): Promise<T>
  }
  
  // 存储系统
  storage: {
    get<T = any>(key: string): Promise<T | null>
    set(key: string, value: any): Promise<void>
    remove(key: string): Promise<void>
    clear(): Promise<void>
  }
  
  // 通知系统
  notifications: {
    success(title: string, message?: string): void
    error(title: string, message?: string): void
    warning(title: string, message?: string): void
    info(title: string, message?: string): void
  }
  
  // 路由系统
  router: {
    navigate(path: string): void
    getCurrentPath(): string
    addRoutes(routes: ModuleRoute[]): void
    removeRoutes(moduleId: string): void
  }
  
  // 设置系统
  settings: {
    get<T = any>(key: string): Promise<T | null>
    set(key: string, value: any): Promise<void>
    getModuleSettings(moduleId: string): Promise<Record<string, any>>
    setModuleSettings(moduleId: string, settings: Record<string, any>): Promise<void>
  }
}

// 工具栏项定义
export interface ToolbarItem {
  id: string
  label: string
  icon?: string
  action: () => void | Promise<void>
  tooltip?: string
  position?: 'left' | 'center' | 'right'
  order?: number
  visible?: boolean
  disabled?: boolean
}

// 命令定义
export interface Command {
  id: string
  name: string
  description?: string
  shortcut?: string
  action: (...args: any[]) => void | Promise<void>
  category?: string
  when?: string // 条件表达式
}

// 健康状态
export interface HealthStatus {
  status: 'healthy' | 'warning' | 'error'
  message?: string
  details?: Record<string, any>
  timestamp: number
}

// 模块接口
export interface Module {
  // 基本信息
  readonly id: string
  readonly name: string
  readonly version: string
  readonly description: string
  readonly dependencies: string[]
  readonly optionalDependencies?: string[]

  // 生命周期方法
  initialize(core: CoreAPI): Promise<void>
  activate(): Promise<void>
  deactivate(): Promise<void>
  destroy?(): Promise<void>

  // 功能提供
  getRoutes?(): ModuleRoute[]
  getMenuItems?(): ModuleMenuItem[]
  getToolbarItems?(): ToolbarItem[]
  getCommands?(): Command[]
  getSettings?(): SettingItem[]

  // 事件处理
  onEvent?(event: ModuleEvent): void | Promise<void>

  // 状态查询
  getStatus?(): ModuleStatus
  getConfig?(): ModuleConfig
  healthCheck?(): Promise<HealthStatus>
}

// 模块工厂接口
export interface ModuleFactory {
  create(config: ModuleConfig): Promise<Module>
}

// 模块注册信息
export interface ModuleRegistration {
  id: string
  factory: ModuleFactory
  config: ModuleConfig
  instance?: Module
  status: ModuleStatus
  error?: Error
  loadTime?: number
  activationTime?: number
  errorCount?: number
  lastHealthCheck?: HealthStatus
  registeredAt: number
}

// 数据库模式定义
export interface DatabaseSchema {
  version: number
  tables: {
    [tableName: string]: {
      columns: {
        [columnName: string]: {
          type: 'TEXT' | 'INTEGER' | 'REAL' | 'BLOB' | 'BOOLEAN'
          primaryKey?: boolean
          notNull?: boolean
          unique?: boolean
          defaultValue?: any
          foreignKey?: {
            table: string
            column: string
            onDelete?: 'CASCADE' | 'SET NULL' | 'RESTRICT'
            onUpdate?: 'CASCADE' | 'SET NULL' | 'RESTRICT'
          }
        }
      }
      indexes?: {
        [indexName: string]: {
          columns: string[]
          unique?: boolean
        }
      }
    }
  }
}

// 搜索相关类型
export interface SearchQuery {
  query: string
  filters?: Record<string, any>
  limit?: number
  offset?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface SearchResult {
  id: string
  title: string
  content: string
  type: string
  moduleId: string
  score: number
  highlights?: string[]
  metadata?: Record<string, any>
}

export interface SearchResponse {
  results: SearchResult[]
  total: number
  query: SearchQuery
  took: number
}
