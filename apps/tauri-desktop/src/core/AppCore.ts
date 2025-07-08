/**
 * 应用核心初始化
 * 集成模块化架构与Tauri桌面应用
 */

import { MingLogCore, DatabaseConnection } from '@minglog/core'
import { NotesModuleFactory } from '@minglog/notes'

// Tauri数据库连接适配器
class TauriDatabaseConnection implements DatabaseConnection {
  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      const result = await invoke('execute_sql', { sql, params: params || [] })
      return result || []
    } catch (error) {
      console.error('Database query error:', error)
      throw error
    }
  }

  async execute(sql: string, params?: any[]): Promise<void> {
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      await invoke('execute_sql', { sql, params: params || [] })
    } catch (error) {
      console.error('Database execute error:', error)
      throw error
    }
  }

  async transaction<T>(callback: () => Promise<T>): Promise<T> {
    // Tauri中的事务处理需要特殊实现
    // 这里简化处理，实际应该在Rust端实现事务
    try {
      const { invoke } = await import('@tauri-apps/api/core')
      await invoke('begin_transaction')
      
      try {
        const result = await callback()
        await invoke('commit_transaction')
        return result
      } catch (error) {
        await invoke('rollback_transaction')
        throw error
      }
    } catch (error) {
      console.error('Database transaction error:', error)
      throw error
    }
  }

  async close(): Promise<void> {
    // Tauri数据库连接由Rust端管理，这里不需要显式关闭
  }
}

export class AppCore {
  private static instance: AppCore | null = null
  private mingLogCore: MingLogCore | null = null
  private initialized: boolean = false

  private constructor() {}

  static getInstance(): AppCore {
    if (!AppCore.instance) {
      AppCore.instance = new AppCore()
    }
    return AppCore.instance
  }

  /**
   * 初始化应用核心
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    try {
      console.log('Initializing MingLog Core...')

      // 创建数据库连接
      const databaseConnection = new TauriDatabaseConnection()

      // 初始化核心系统
      this.mingLogCore = new MingLogCore({
        database: databaseConnection,
        debugMode: process.env.NODE_ENV === 'development'
      })

      await this.mingLogCore.initialize()

      // 注册模块
      await this.registerModules()

      this.initialized = true
      console.log('MingLog Core initialized successfully')

    } catch (error) {
      console.error('Failed to initialize MingLog Core:', error)
      throw error
    }
  }

  /**
   * 注册所有模块
   */
  private async registerModules(): Promise<void> {
    if (!this.mingLogCore) {
      throw new Error('Core not initialized')
    }

    try {
      // 注册笔记模块
      await this.mingLogCore.registerModule('notes', NotesModuleFactory, {
        id: 'notes',
        name: '笔记管理',
        version: '1.0.0',
        description: '提供笔记的创建、编辑、标签管理等功能',
        enabled: true,
        dependencies: [],
        settings: {},
        author: 'MingLog Team',
        category: '核心功能'
      })

      // 激活笔记模块
      await this.mingLogCore.activateModule('notes')

      console.log('All modules registered and activated')

    } catch (error) {
      console.error('Failed to register modules:', error)
      throw error
    }
  }

  /**
   * 获取核心实例
   */
  getCore(): MingLogCore {
    if (!this.mingLogCore) {
      throw new Error('Core not initialized. Call initialize() first.')
    }
    return this.mingLogCore
  }

  /**
   * 检查是否已初始化
   */
  isInitialized(): boolean {
    return this.initialized
  }

  /**
   * 销毁应用核心
   */
  async destroy(): Promise<void> {
    if (this.mingLogCore) {
      await this.mingLogCore.destroy()
      this.mingLogCore = null
    }
    this.initialized = false
  }

  /**
   * 获取模块管理器
   */
  getModuleManager() {
    return this.getCore().getModuleManager()
  }

  /**
   * 获取事件总线
   */
  getEventBus() {
    return this.getCore().getEventBus()
  }

  /**
   * 获取设置管理器
   */
  getSettingsManager() {
    return this.getCore().getSettingsManager()
  }
}

// 导出单例实例
export const appCore = AppCore.getInstance()
