/**
 * 数据库模块核心类型定义
 */

import { Field, FieldValue } from './field'
import { View } from './view'
import { Relation } from './relation'

/**
 * 数据库接口
 */
export interface Database {
  /** 数据库唯一标识 */
  id: string
  /** 数据库名称 */
  name: string
  /** 数据库描述 */
  description?: string
  /** 数据库图标 */
  icon?: string
  /** 数据库颜色 */
  color?: string
  /** 字段定义 */
  fields: Field[]
  /** 视图配置 */
  views: View[]
  /** 关联关系 */
  relations: Relation[]
  /** 权限设置 */
  permissions: DatabasePermission[]
  /** 配置选项 */
  config: DatabaseConfig
  /** 元数据 */
  metadata: DatabaseMetadata
  /** 创建时间 */
  createdAt: Date
  /** 更新时间 */
  updatedAt: Date
  /** 创建者 */
  createdBy: string
  /** 最后编辑者 */
  lastEditedBy: string
}

/**
 * 数据库记录
 */
export interface DatabaseRecord {
  /** 记录唯一标识 */
  id: string
  /** 数据库ID */
  databaseId: string
  /** 字段值映射 */
  values: Record<string, FieldValue>
  /** 记录属性 */
  properties: RecordProperties
  /** 创建时间 */
  createdAt: Date
  /** 更新时间 */
  updatedAt: Date
  /** 创建者 */
  createdBy: string
  /** 最后编辑者 */
  lastEditedBy: string
}

/**
 * 记录属性
 */
export interface RecordProperties {
  /** 是否已删除 */
  deleted?: boolean
  /** 是否已归档 */
  archived?: boolean
  /** 标签 */
  tags?: string[]
  /** 优先级 */
  priority?: number
  /** 自定义属性 */
  custom?: Record<string, any>
}

/**
 * 数据库配置
 */
export interface DatabaseConfig {
  /** 是否启用版本控制 */
  enableVersioning: boolean
  /** 是否启用审计日志 */
  enableAuditLog: boolean
  /** 是否启用自动备份 */
  enableAutoBackup: boolean
  /** 备份间隔（小时） */
  backupInterval: number
  /** 最大记录数 */
  maxRecords?: number
  /** 是否启用实时协作 */
  enableRealTimeCollaboration: boolean
  /** 缓存配置 */
  cache: CacheConfig
  /** 索引配置 */
  indexes: IndexConfig[]
}

/**
 * 缓存配置
 */
export interface CacheConfig {
  /** 是否启用缓存 */
  enabled: boolean
  /** 缓存大小（MB） */
  maxSize: number
  /** 缓存过期时间（秒） */
  ttl: number
  /** 缓存策略 */
  strategy: 'lru' | 'lfu' | 'fifo'
}

/**
 * 索引配置
 */
export interface IndexConfig {
  /** 索引名称 */
  name: string
  /** 索引字段 */
  fields: string[]
  /** 索引类型 */
  type: 'btree' | 'hash' | 'fulltext'
  /** 是否唯一索引 */
  unique: boolean
}

/**
 * 数据库元数据
 */
export interface DatabaseMetadata {
  /** 记录总数 */
  recordCount: number
  /** 字段总数 */
  fieldCount: number
  /** 视图总数 */
  viewCount: number
  /** 关联总数 */
  relationCount: number
  /** 数据库大小（字节） */
  size: number
  /** 最后访问时间 */
  lastAccessedAt: Date
  /** 访问次数 */
  accessCount: number
  /** 版本号 */
  version: string
  /** 模式版本 */
  schemaVersion: string
}

/**
 * 数据库权限
 */
export interface DatabasePermission {
  /** 用户/角色ID */
  principalId: string
  /** 权限类型 */
  type: 'user' | 'role' | 'group'
  /** 权限级别 */
  level: PermissionLevel
  /** 具体权限 */
  permissions: Permission[]
  /** 权限范围 */
  scope?: PermissionScope
}

/**
 * 权限级别
 */
export enum PermissionLevel {
  NONE = 'none',
  READ = 'read',
  WRITE = 'write',
  ADMIN = 'admin',
  OWNER = 'owner'
}

/**
 * 具体权限
 */
export enum Permission {
  // 数据库权限
  VIEW_DATABASE = 'view_database',
  EDIT_DATABASE = 'edit_database',
  DELETE_DATABASE = 'delete_database',
  SHARE_DATABASE = 'share_database',
  
  // 记录权限
  VIEW_RECORDS = 'view_records',
  CREATE_RECORDS = 'create_records',
  EDIT_RECORDS = 'edit_records',
  DELETE_RECORDS = 'delete_records',
  
  // 字段权限
  VIEW_FIELDS = 'view_fields',
  CREATE_FIELDS = 'create_fields',
  EDIT_FIELDS = 'edit_fields',
  DELETE_FIELDS = 'delete_fields',
  
  // 视图权限
  VIEW_VIEWS = 'view_views',
  CREATE_VIEWS = 'create_views',
  EDIT_VIEWS = 'edit_views',
  DELETE_VIEWS = 'delete_views',
  
  // 高级权限
  MANAGE_PERMISSIONS = 'manage_permissions',
  EXPORT_DATA = 'export_data',
  IMPORT_DATA = 'import_data'
}

/**
 * 权限范围
 */
export interface PermissionScope {
  /** 字段范围 */
  fields?: string[]
  /** 视图范围 */
  views?: string[]
  /** 记录过滤条件 */
  recordFilter?: any
}

/**
 * 数据库创建参数
 */
export interface CreateDatabaseParams {
  name: string
  description?: string
  icon?: string
  color?: string
  fields?: Partial<Field>[]
  config?: Partial<DatabaseConfig>
  permissions?: DatabasePermission[]
}

/**
 * 数据库更新参数
 */
export interface UpdateDatabaseParams {
  name?: string
  description?: string
  icon?: string
  color?: string
  config?: Partial<DatabaseConfig>
}

/**
 * 数据库查询参数
 */
export interface DatabaseQueryParams {
  /** 搜索关键词 */
  search?: string
  /** 标签过滤 */
  tags?: string[]
  /** 创建者过滤 */
  createdBy?: string
  /** 创建时间范围 */
  createdAfter?: Date
  createdBefore?: Date
  /** 排序 */
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'recordCount'
  sortOrder?: 'asc' | 'desc'
  /** 分页 */
  page?: number
  pageSize?: number
}

/**
 * 数据库统计信息
 */
export interface DatabaseStats {
  /** 总数据库数 */
  totalDatabases: number
  /** 总记录数 */
  totalRecords: number
  /** 总字段数 */
  totalFields: number
  /** 总视图数 */
  totalViews: number
  /** 存储使用量（字节） */
  storageUsed: number
  /** 最活跃的数据库 */
  mostActiveDatabase?: Database
  /** 最大的数据库 */
  largestDatabase?: Database
}

/**
 * 数据库事件类型
 */
export enum DatabaseEventType {
  // 数据库事件
  DATABASE_CREATED = 'database:created',
  DATABASE_UPDATED = 'database:updated',
  DATABASE_DELETED = 'database:deleted',
  DATABASE_SHARED = 'database:shared',
  
  // 记录事件
  RECORD_CREATED = 'record:created',
  RECORD_UPDATED = 'record:updated',
  RECORD_DELETED = 'record:deleted',
  RECORD_RESTORED = 'record:restored',
  
  // 字段事件
  FIELD_CREATED = 'field:created',
  FIELD_UPDATED = 'field:updated',
  FIELD_DELETED = 'field:deleted',
  
  // 视图事件
  VIEW_CREATED = 'view:created',
  VIEW_UPDATED = 'view:updated',
  VIEW_DELETED = 'view:deleted',
  
  // 权限事件
  PERMISSION_GRANTED = 'permission:granted',
  PERMISSION_REVOKED = 'permission:revoked',
  PERMISSION_UPDATED = 'permission:updated'
}

/**
 * 数据库事件数据
 */
export interface DatabaseEventData {
  databaseId: string
  recordId?: string
  fieldId?: string
  viewId?: string
  userId: string
  changes?: any
  metadata?: any
}
