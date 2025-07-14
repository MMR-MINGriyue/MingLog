/**
 * 数据库模块类型定义统一导出
 */

// 数据库相关类型
export * from './database'

// 字段相关类型
export * from './field'

// 视图相关类型
export * from './view'

// 查询相关类型
export * from './query'

// 关联相关类型
export * from './relation'

// 模块相关类型（临时定义，直到核心模块可用）
export interface IModule {
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

export interface IModuleConfig {
  enabled: boolean
  settings: Record<string, any>
  preferences: Record<string, any>
}

export enum ModuleStatus {
  UNLOADED = 'unloaded',
  LOADING = 'loading',
  LOADED = 'loaded',
  ACTIVATING = 'activating',
  ACTIVE = 'active',
  DEACTIVATING = 'deactivating',
  ERROR = 'error'
}

export interface IRouteConfig {
  path: string
  component: any
  exact?: boolean
  title?: string
  icon?: string
  permissions?: string[]
}

export interface IMenuItem {
  id: string
  label: string
  icon?: string
  path?: string
  children?: IMenuItem[]
  permissions?: string[]
  order?: number
}

export interface IModuleEvent {
  type: string
  source: string
  target?: string
  data?: any
  timestamp: number
}

// 数据库模块特定的事件类型
export enum DatabaseModuleEventType {
  // 模块生命周期事件
  MODULE_INITIALIZED = 'database:module:initialized',
  MODULE_ACTIVATED = 'database:module:activated',
  MODULE_DEACTIVATED = 'database:module:deactivated',
  MODULE_ERROR = 'database:module:error',
  
  // 数据库事件
  DATABASE_CREATED = 'database:created',
  DATABASE_UPDATED = 'database:updated',
  DATABASE_DELETED = 'database:deleted',
  DATABASE_SHARED = 'database:shared',
  DATABASE_IMPORTED = 'database:imported',
  DATABASE_EXPORTED = 'database:exported',
  
  // 记录事件
  RECORD_CREATED = 'database:record:created',
  RECORD_UPDATED = 'database:record:updated',
  RECORD_DELETED = 'database:record:deleted',
  RECORD_RESTORED = 'database:record:restored',
  RECORD_BULK_CREATED = 'database:record:bulk_created',
  RECORD_BULK_UPDATED = 'database:record:bulk_updated',
  RECORD_BULK_DELETED = 'database:record:bulk_deleted',
  
  // 字段事件
  FIELD_CREATED = 'database:field:created',
  FIELD_UPDATED = 'database:field:updated',
  FIELD_DELETED = 'database:field:deleted',
  FIELD_REORDERED = 'database:field:reordered',
  
  // 视图事件
  VIEW_CREATED = 'database:view:created',
  VIEW_UPDATED = 'database:view:updated',
  VIEW_DELETED = 'database:view:deleted',
  VIEW_SWITCHED = 'database:view:switched',
  
  // 关联事件
  RELATION_CREATED = 'database:relation:created',
  RELATION_UPDATED = 'database:relation:updated',
  RELATION_DELETED = 'database:relation:deleted',
  RELATION_RECORD_CREATED = 'database:relation:record_created',
  RELATION_RECORD_DELETED = 'database:relation:record_deleted',
  
  // 查询事件
  QUERY_EXECUTED = 'database:query:executed',
  QUERY_CACHED = 'database:query:cached',
  QUERY_OPTIMIZED = 'database:query:optimized',
  
  // 权限事件
  PERMISSION_GRANTED = 'database:permission:granted',
  PERMISSION_REVOKED = 'database:permission:revoked',
  PERMISSION_UPDATED = 'database:permission:updated',
  
  // 同步事件
  SYNC_STARTED = 'database:sync:started',
  SYNC_COMPLETED = 'database:sync:completed',
  SYNC_FAILED = 'database:sync:failed',
  SYNC_CONFLICT = 'database:sync:conflict',
  
  // 性能事件
  PERFORMANCE_WARNING = 'database:performance:warning',
  CACHE_HIT = 'database:cache:hit',
  CACHE_MISS = 'database:cache:miss',
  INDEX_SUGGESTION = 'database:index:suggestion'
}

// 数据库模块配置
export interface DatabaseModuleConfig extends IModuleConfig {
  settings: {
    // 数据库设置
    maxDatabases: number
    maxRecordsPerDatabase: number
    maxFieldsPerDatabase: number
    maxViewsPerDatabase: number
    
    // 性能设置
    enableQueryCache: boolean
    queryCacheTtl: number
    enableQueryOptimization: boolean
    maxQueryExecutionTime: number
    
    // 存储设置
    enableCompression: boolean
    enableEncryption: boolean
    backupInterval: number
    maxBackupCount: number
    
    // 功能设置
    enableVersioning: boolean
    enableAuditLog: boolean
    enableRealTimeSync: boolean
    enableCollaboration: boolean
    
    // 安全设置
    enablePermissions: boolean
    defaultPermissionLevel: string
    enableDataMasking: boolean
    
    // 导入导出设置
    supportedImportFormats: string[]
    supportedExportFormats: string[]
    maxImportFileSize: number
    
    // UI设置
    defaultViewType: string
    enableAdvancedFilters: boolean
    enableCustomViews: boolean
    enableFormulas: boolean
  }
  
  preferences: {
    // 用户界面偏好
    theme: 'light' | 'dark' | 'auto'
    language: string
    timezone: string
    dateFormat: string
    timeFormat: string
    numberFormat: string
    
    // 编辑器偏好
    autoSave: boolean
    autoSaveInterval: number
    showLineNumbers: boolean
    enableSpellCheck: boolean
    
    // 视图偏好
    defaultPageSize: number
    enableInfiniteScroll: boolean
    showRecordCount: boolean
    enableQuickFilters: boolean
    
    // 通知偏好
    enableNotifications: boolean
    notificationTypes: string[]
    emailNotifications: boolean
    
    // 快捷键偏好
    keyboardShortcuts: Record<string, string>
    
    // 高级偏好
    enableExperimentalFeatures: boolean
    debugMode: boolean
    enablePerformanceMonitoring: boolean
  }
}

// 数据库模块元数据
export const DATABASE_MODULE_METADATA: IModuleMetadata = {
  id: 'database',
  name: '数据库管理',
  version: '1.0.0',
  description: '提供类似Notion的结构化数据管理功能，包括多视图支持、数据关联和强大的查询系统',
  author: 'MingLog Team',
  icon: '🗃️',
  tags: ['database', 'table', 'data', 'structure', 'query', 'relation'],
  dependencies: ['core'],
  optionalDependencies: ['notes', 'files', 'search']
}

// 错误类型定义
export class DatabaseError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message)
    this.name = 'DatabaseError'
  }
}

export class ValidationError extends DatabaseError {
  constructor(message: string, public field?: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details)
    this.name = 'ValidationError'
  }
}

export class PermissionError extends DatabaseError {
  constructor(message: string, public requiredPermission?: string, details?: any) {
    super(message, 'PERMISSION_ERROR', details)
    this.name = 'PermissionError'
  }
}

export class QueryError extends DatabaseError {
  constructor(message: string, public query?: any, details?: any) {
    super(message, 'QUERY_ERROR', details)
    this.name = 'QueryError'
  }
}

export class RelationError extends DatabaseError {
  constructor(message: string, public relationId?: string, details?: any) {
    super(message, 'RELATION_ERROR', details)
    this.name = 'RelationError'
  }
}

// 工具类型
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// 常量定义
export const DATABASE_CONSTANTS = {
  MAX_DATABASE_NAME_LENGTH: 100,
  MAX_FIELD_NAME_LENGTH: 50,
  MAX_VIEW_NAME_LENGTH: 50,
  MAX_RECORDS_PER_PAGE: 1000,
  DEFAULT_PAGE_SIZE: 50,
  MAX_QUERY_DEPTH: 10,
  MAX_RELATION_DEPTH: 5,
  CACHE_TTL_SECONDS: 300,
  QUERY_TIMEOUT_MS: 30000
} as const
