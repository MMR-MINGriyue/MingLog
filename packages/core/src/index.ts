/**
 * MingLog Core - 模块化知识管理系统核心
 */

// 导出类型定义
export * from './types/index.js'

// 导出事件系统
export { EventBus, CORE_EVENTS } from './event-system/EventBus.js'

// 导出模块管理器
export { ModuleManager } from './module-manager/ModuleManager.js'

// 导出数据库管理器
export { DatabaseManager } from './database/DatabaseManager.js'
export type { DatabaseConnection, DatabaseMigration } from './database/DatabaseManager.js'

// 导出设置管理器
export { SettingsManager } from './settings/SettingsManager.js'
export type { SettingsValidationResult, SettingsSchema } from './settings/SettingsManager.js'

// 导出核心类
export { MingLogCore } from './MingLogCore.js'

// 导出工具函数
export * from './utils/index.js'
