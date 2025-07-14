/**
 * 数据存储模块类型定义
 * 定义数据存储相关的所有类型、接口和枚举
 */

import type { CustomElement } from '@minglog/editor';

/**
 * 文档状态枚举
 */
export enum DocumentStatus {
  DRAFT = 'draft',           // 草稿
  PUBLISHED = 'published',   // 已发布
  ARCHIVED = 'archived',     // 已归档
  DELETED = 'deleted'        // 已删除
}

/**
 * 块类型枚举
 */
export enum BlockType {
  PARAGRAPH = 'paragraph',
  HEADING_1 = 'heading-1',
  HEADING_2 = 'heading-2',
  HEADING_3 = 'heading-3',
  HEADING_4 = 'heading-4',
  HEADING_5 = 'heading-5',
  HEADING_6 = 'heading-6',
  BULLETED_LIST = 'bulleted-list',
  NUMBERED_LIST = 'numbered-list',
  TODO_LIST = 'todo-list',
  QUOTE = 'quote',
  CODE = 'code',
  DIVIDER = 'divider',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  FILE = 'file',
  TABLE = 'table',
  EMBED = 'embed'
}

/**
 * 数据库实体基础接口
 */
export interface BaseEntity {
  /** 唯一标识符 */
  id: string;
  /** 创建时间 */
  created_at: Date;
  /** 更新时间 */
  updated_at: Date;
  /** 创建者ID */
  created_by?: string;
  /** 更新者ID */
  updated_by?: string;
}

/**
 * 文档实体接口
 */
export interface DocumentEntity extends BaseEntity {
  /** 文档标题 */
  title: string;
  /** 文档内容（JSON格式的Slate.js数据） */
  content: CustomElement[];
  /** 文档状态 */
  status: DocumentStatus;
  /** 父文档ID */
  parent_id?: string;
  /** 文档路径 */
  path: string;
  /** 文档图标 */
  icon?: string;
  /** 文档封面 */
  cover?: string;
  /** 文档标签 */
  tags: string[];
  /** 文档元数据 */
  metadata: Record<string, any>;
  /** 是否为模板 */
  is_template: boolean;
  /** 模板ID */
  template_id?: string;
  /** 排序权重 */
  sort_order: number;
  /** 访问权限 */
  permissions: DocumentPermissions;
}

/**
 * 块实体接口
 */
export interface BlockEntity extends BaseEntity {
  /** 所属文档ID */
  document_id: string;
  /** 父块ID */
  parent_id?: string;
  /** 块类型 */
  type: BlockType;
  /** 块内容 */
  content: any;
  /** 块属性 */
  properties: Record<string, any>;
  /** 排序权重 */
  sort_order: number;
  /** 块路径（用于快速查找） */
  path: string;
  /** 是否已删除 */
  is_deleted: boolean;
}

/**
 * 文档权限接口
 */
export interface DocumentPermissions {
  /** 是否公开 */
  is_public: boolean;
  /** 允许评论 */
  allow_comments: boolean;
  /** 允许复制 */
  allow_copy: boolean;
  /** 允许导出 */
  allow_export: boolean;
  /** 共享用户列表 */
  shared_users: string[];
  /** 编辑权限用户列表 */
  editors: string[];
  /** 查看权限用户列表 */
  viewers: string[];
}

/**
 * 版本记录接口
 */
export interface VersionEntity extends BaseEntity {
  /** 关联的文档或块ID */
  entity_id: string;
  /** 实体类型 */
  entity_type: 'document' | 'block';
  /** 版本号 */
  version: number;
  /** 版本内容 */
  content: any;
  /** 变更描述 */
  change_description?: string;
  /** 变更类型 */
  change_type: 'create' | 'update' | 'delete' | 'restore';
  /** 变更大小（字节） */
  change_size: number;
  /** 是否为自动保存 */
  is_auto_save: boolean;
}

/**
 * 数据库查询选项
 */
export interface QueryOptions {
  /** 分页偏移量 */
  offset?: number;
  /** 分页大小 */
  limit?: number;
  /** 排序字段 */
  sort_by?: string;
  /** 排序方向 */
  sort_order?: 'asc' | 'desc';
  /** 过滤条件 */
  filters?: Record<string, any>;
  /** 包含关联数据 */
  include?: string[];
  /** 搜索关键词 */
  search?: string;
}

/**
 * 查询结果接口
 */
export interface QueryResult<T> {
  /** 数据列表 */
  data: T[];
  /** 总数量 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页大小 */
  page_size: number;
  /** 总页数 */
  total_pages: number;
  /** 是否有下一页 */
  has_next: boolean;
  /** 是否有上一页 */
  has_prev: boolean;
}

/**
 * 数据存储配置接口
 */
export interface StorageConfig {
  /** 数据库文件路径 */
  database_path: string;
  /** 是否启用WAL模式 */
  enable_wal: boolean;
  /** 连接池大小 */
  pool_size: number;
  /** 查询超时时间（毫秒） */
  query_timeout: number;
  /** 是否启用外键约束 */
  enable_foreign_keys: boolean;
  /** 是否启用同步模式 */
  enable_sync: boolean;
  /** 备份配置 */
  backup: {
    /** 是否启用自动备份 */
    enabled: boolean;
    /** 备份间隔（小时） */
    interval: number;
    /** 备份保留天数 */
    retention_days: number;
    /** 备份目录 */
    backup_dir: string;
  };
}

/**
 * 数据库事务接口
 */
export interface Transaction {
  /** 事务ID */
  id: string;
  /** 提交事务 */
  commit(): Promise<void>;
  /** 回滚事务 */
  rollback(): Promise<void>;
  /** 是否已完成 */
  isCompleted(): boolean;
}

/**
 * 数据库连接接口
 */
export interface DatabaseConnection {
  /** 执行查询 */
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  /** 执行单个查询 */
  get<T = any>(sql: string, params?: any[]): Promise<T | undefined>;
  /** 执行更新 */
  run(sql: string, params?: any[]): Promise<{ changes: number; lastInsertRowid: number }>;
  /** 开始事务 */
  beginTransaction(): Promise<Transaction>;
  /** 关闭连接 */
  close(): Promise<void>;
  /** 是否已连接 */
  isConnected(): boolean;
}

/**
 * 数据访问层接口
 */
export interface DataAccessLayer {
  /** 获取数据库连接 */
  getConnection(): Promise<DatabaseConnection>;
  /** 执行迁移 */
  migrate(): Promise<void>;
  /** 检查数据库健康状态 */
  healthCheck(): Promise<boolean>;
  /** 获取数据库统计信息 */
  getStats(): Promise<DatabaseStats>;
}

/**
 * 数据库统计信息
 */
export interface DatabaseStats {
  /** 数据库大小（字节） */
  size: number;
  /** 表数量 */
  table_count: number;
  /** 文档数量 */
  document_count: number;
  /** 块数量 */
  block_count: number;
  /** 版本数量 */
  version_count: number;
  /** 最后更新时间 */
  last_updated: Date;
}

/**
 * 搜索结果接口
 */
export interface SearchResult {
  /** 文档ID */
  document_id: string;
  /** 块ID */
  block_id?: string;
  /** 匹配的内容 */
  content: string;
  /** 匹配的标题 */
  title: string;
  /** 匹配分数 */
  score: number;
  /** 高亮的内容片段 */
  highlights: string[];
  /** 匹配类型 */
  match_type: 'title' | 'content' | 'tag' | 'metadata';
}

/**
 * 导入导出选项
 */
export interface ImportExportOptions {
  /** 格式类型 */
  format: 'json' | 'markdown' | 'html' | 'pdf';
  /** 是否包含元数据 */
  include_metadata: boolean;
  /** 是否包含版本历史 */
  include_versions: boolean;
  /** 是否包含已删除的内容 */
  include_deleted: boolean;
  /** 压缩选项 */
  compression?: 'gzip' | 'zip';
}

/**
 * 同步状态枚举
 */
export enum SyncStatus {
  IDLE = 'idle',
  SYNCING = 'syncing',
  SUCCESS = 'success',
  ERROR = 'error',
  CONFLICT = 'conflict'
}

/**
 * 同步结果接口
 */
export interface SyncResult {
  /** 同步状态 */
  status: SyncStatus;
  /** 同步的文档数量 */
  synced_documents: number;
  /** 同步的块数量 */
  synced_blocks: number;
  /** 冲突数量 */
  conflicts: number;
  /** 错误信息 */
  errors: string[];
  /** 同步开始时间 */
  started_at: Date;
  /** 同步完成时间 */
  completed_at?: Date;
  /** 同步耗时（毫秒） */
  duration?: number;
}
