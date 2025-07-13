/**
 * MingLog数据库模块主导出文件
 */

// 导出模块主类
export { DatabaseModule, DatabaseModuleFactory, DATABASE_MODULE_METADATA } from './DatabaseModule'

// 导出类型定义
export * from './types'

// 导出服务接口
export { IDatabaseService } from './services/DatabaseService'

// 导出工具函数
export * from './utils'

// 模块元数据
export const MODULE_INFO = {
  id: 'database',
  name: '数据库管理',
  version: '1.0.0',
  description: '提供类似Notion的结构化数据管理功能，包括多视图支持、数据关联和强大的查询系统',
  author: 'MingLog Team',
  icon: '🗃️',
  tags: ['database', 'table', 'data', 'structure', 'query', 'relation'],
  dependencies: ['core'],
  optionalDependencies: ['notes', 'files', 'search']
} as const

// 默认导出模块工厂
export default DatabaseModuleFactory
