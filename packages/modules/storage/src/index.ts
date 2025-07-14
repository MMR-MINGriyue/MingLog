/**
 * MingLog数据存储模块入口文件
 * 导出存储模块的所有公共接口和组件
 */

// 核心模块类
export { StorageModule } from './StorageModule';
export type { StorageModuleConfig } from './StorageModule';

// 模块工厂
export { StorageModuleFactory, StorageConfigBuilder, storageModuleFactory } from './StorageModuleFactory';

// 服务类
export { DocumentService } from './services/DocumentService';
export { BlockService } from './services/BlockService';
export { VersionManager } from './services/VersionManager';
export { SyncManager } from './services/SyncManager';
export { BaseService, ServiceStatus } from './services/BaseService';
export { DataAccessLayerImpl, DatabaseConnectionImpl, TransactionImpl } from './services/DataAccessLayer';

// 类型定义
export type {
  // 基础类型
  BaseEntity,
  
  // 实体类型
  DocumentEntity,
  BlockEntity,
  VersionEntity,
  
  // 枚举类型
  DocumentStatus,
  BlockType,
  SyncStatus,
  
  // 权限和配置
  DocumentPermissions,
  StorageConfig,
  
  // 查询相关
  QueryOptions,
  QueryResult,
  SearchResult,
  
  // 数据库相关
  DatabaseConnection,
  Transaction,
  DataAccessLayer,
  DatabaseStats,
  
  // 同步相关
  SyncResult,
  ImportExportOptions
} from './types';

// 重新导出枚举
export { DocumentStatus, BlockType, SyncStatus } from './types';

// 常量
export const STORAGE_MODULE_NAME = 'storage';
export const STORAGE_MODULE_VERSION = '1.0.0';

// 默认配置
export const DEFAULT_STORAGE_CONFIG = {
  database_path: './data/minglog.db',
  enable_wal: true,
  pool_size: 10,
  query_timeout: 30000,
  enable_foreign_keys: true,
  enable_sync: true,
  backup: {
    enabled: true,
    interval: 24,
    retention_days: 30,
    backup_dir: './data/backups'
  }
};

// 工具函数
export const createStorageModule = (config?: Partial<StorageModuleConfig>) => {
  return storageModuleFactory.create(config);
};

export const createDevelopmentStorageModule = (config?: Partial<StorageModuleConfig>) => {
  return storageModuleFactory.createDevelopmentConfig(config);
};

export const createTestStorageModule = (config?: Partial<StorageModuleConfig>) => {
  return storageModuleFactory.createTestConfig(config);
};

export const createProductionStorageModule = (config?: Partial<StorageModuleConfig>) => {
  return storageModuleFactory.createProductionConfig(config);
};

// 版本信息
export const VERSION_INFO = {
  name: STORAGE_MODULE_NAME,
  version: STORAGE_MODULE_VERSION,
  description: 'MingLog数据存储与管理模块',
  author: 'MingLog Team',
  license: 'MIT'
};

// 模块能力
export const MODULE_CAPABILITIES = [
  'document-storage',
  'block-storage',
  'version-control',
  'data-sync',
  'backup-restore',
  'search-index',
  'data-export',
  'data-import'
];

// 模块权限
export const MODULE_PERMISSIONS = [
  'database-read',
  'database-write',
  'file-system-read',
  'file-system-write'
];

// 错误类型
export class StorageError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'StorageError';
  }
}

export class DatabaseError extends StorageError {
  constructor(message: string, public originalError?: Error) {
    super(message, 'DATABASE_ERROR');
    this.name = 'DatabaseError';
  }
}

export class ValidationError extends StorageError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class SyncError extends StorageError {
  constructor(message: string, public syncResult?: SyncResult) {
    super(message, 'SYNC_ERROR');
    this.name = 'SyncError';
  }
}

// 事件类型
export const STORAGE_EVENTS = {
  // 模块事件
  MODULE_STARTED: 'storage:module:started',
  MODULE_STOPPED: 'storage:module:stopped',
  CONFIG_UPDATED: 'storage:config:updated',
  
  // 文档事件
  DOCUMENT_CREATED: 'storage:document:created',
  DOCUMENT_UPDATED: 'storage:document:updated',
  DOCUMENT_DELETED: 'storage:document:deleted',
  
  // 块事件
  BLOCK_CREATED: 'storage:block:created',
  BLOCK_UPDATED: 'storage:block:updated',
  BLOCK_DELETED: 'storage:block:deleted',
  BLOCK_MOVED: 'storage:block:moved',
  
  // 版本事件
  VERSION_CREATED: 'storage:version:created',
  VERSION_RESTORED: 'storage:version:restored',
  
  // 同步事件
  SYNC_STARTED: 'storage:sync:started',
  SYNC_COMPLETED: 'storage:sync:completed',
  SYNC_FAILED: 'storage:sync:failed',
  
  // 备份事件
  BACKUP_CREATED: 'storage:backup:created',
  BACKUP_RESTORED: 'storage:backup:restored',
  BACKUP_CLEANUP: 'storage:backup:cleanup'
} as const;

// 性能监控
export const PERFORMANCE_METRICS = {
  // 数据库操作目标时间（毫秒）
  DATABASE_QUERY_TARGET: 100,
  DATABASE_WRITE_TARGET: 200,
  DATABASE_TRANSACTION_TARGET: 500,
  
  // 同步操作目标时间（毫秒）
  SYNC_TARGET: 5000,
  BACKUP_TARGET: 10000,
  
  // 批量操作目标时间（毫秒）
  BULK_INSERT_TARGET: 1000,
  BULK_UPDATE_TARGET: 1500,
  BULK_DELETE_TARGET: 800
} as const;

// 限制常量
export const LIMITS = {
  // 查询限制
  MAX_QUERY_LIMIT: 1000,
  DEFAULT_QUERY_LIMIT: 50,
  
  // 内容限制
  MAX_DOCUMENT_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_BLOCK_SIZE: 1024 * 1024, // 1MB
  MAX_VERSION_HISTORY: 100,
  
  // 备份限制
  MAX_BACKUP_FILES: 100,
  MIN_BACKUP_INTERVAL: 1, // 1小时
  MAX_BACKUP_RETENTION: 365 // 365天
} as const;
