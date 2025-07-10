/**
 * MingLog核心类
 * 整合所有核心功能，提供统一的API接口
 */

import { EventBus } from './event-system/EventBus.js'
import { ModuleManager } from './module-manager/ModuleManager.js'
import { DatabaseManager } from './database/DatabaseManager.js'
import type { DatabaseConnection } from './database/DatabaseManager.js'
import { SettingsManager } from './settings/SettingsManager.js'
import type { CoreAPI, ModuleConfig, ModuleFactory } from './types/index.js'

export interface MingLogCoreOptions {
  database: DatabaseConnection
  debugMode?: boolean
  maxEventHistory?: number
}

export class MingLogCore {
  private eventBus: EventBus
  private moduleManager: ModuleManager
  private databaseManager: DatabaseManager
  private settingsManager: SettingsManager
  private coreAPI: CoreAPI
  private initialized: boolean = false

  constructor(options: MingLogCoreOptions) {
    // 初始化事件总线
    this.eventBus = new EventBus({
      debugMode: options.debugMode,
      maxHistorySize: options.maxEventHistory
    })

    // 初始化数据库管理器
    this.databaseManager = new DatabaseManager(options.database)

    // 创建核心API
    this.coreAPI = this.createCoreAPI()

    // 初始化设置管理器
    this.settingsManager = new SettingsManager(this.coreAPI, this.eventBus)

    // 初始化模块管理器
    this.moduleManager = new ModuleManager(this.eventBus, this.coreAPI)
  }

  /**
   * 初始化核心系统
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    try {
      // 初始化数据库
      await this.databaseManager.initialize()

      // 监听模块设置注册事件
      this.eventBus.on('module:register-settings', (event) => {
        const { moduleId, settings } = event.data
        this.settingsManager.registerModuleSchema(moduleId, settings)
      })

      // 发送初始化完成事件
      this.eventBus.emit('core:initialized', {}, 'MingLogCore')

      this.initialized = true
    } catch (error) {
      this.eventBus.emit('core:error', { error }, 'MingLogCore')
      throw error
    }
  }

  /**
   * 注册模块
   */
  async registerModule(id: string, factory: ModuleFactory, config: ModuleConfig): Promise<void> {
    return this.moduleManager.registerModule(id, factory, config)
  }

  /**
   * 激活模块
   */
  async activateModule(moduleId: string): Promise<void> {
    return this.moduleManager.activateModule(moduleId)
  }

  /**
   * 停用模块
   */
  async deactivateModule(moduleId: string): Promise<void> {
    return this.moduleManager.deactivateModule(moduleId)
  }

  /**
   * 获取模块管理器
   */
  getModuleManager(): ModuleManager {
    return this.moduleManager
  }

  /**
   * 获取事件总线
   */
  getEventBus(): EventBus {
    return this.eventBus
  }

  /**
   * 获取数据库管理器
   */
  getDatabaseManager(): DatabaseManager {
    return this.databaseManager
  }

  /**
   * 获取设置管理器
   */
  getSettingsManager(): SettingsManager {
    return this.settingsManager
  }

  /**
   * 获取核心API
   */
  getCoreAPI(): CoreAPI {
    return this.coreAPI
  }

  /**
   * 销毁核心系统
   */
  async destroy(): Promise<void> {
    // 停用所有模块
    const activeModules = this.moduleManager.getActiveModules()
    for (const module of activeModules) {
      try {
        await this.moduleManager.deactivateModule(module.id)
      } catch (error) {
        console.error(`Error deactivating module ${module.id}:`, error)
      }
    }

    // 销毁事件总线
    this.eventBus.destroy()

    // 关闭数据库连接
    await this.databaseManager.getConnection().close()

    this.initialized = false
  }

  /**
   * 创建核心API
   */
  private createCoreAPI(): CoreAPI {
    return {
      // 事件系统
      events: {
        emit: (event: string, data?: any) => {
          this.eventBus.emit(event, data, 'CoreAPI')
        },
        on: (event: string, handler: Function) => {
          this.eventBus.on(event, handler as any)
        },
        off: (event: string, handler: Function) => {
          this.eventBus.off(event, handler as any)
        },
        once: (event: string, handler: Function) => {
          this.eventBus.once(event, handler as any)
        }
      },

      // 数据库访问
      database: {
        query: <T = any>(sql: string, params?: any[]) => {
          return this.databaseManager.query<T>(sql, params)
        },
        execute: (sql: string, params?: any[]) => {
          return this.databaseManager.execute(sql, params)
        },
        transaction: <T>(callback: () => Promise<T>) => {
          return this.databaseManager.transaction(callback)
        }
      },

      // 存储系统
      storage: {
        get: async <T = any>(key: string): Promise<T | null> => {
          const result = await this.databaseManager.query(
            'SELECT value FROM settings WHERE key = ?',
            [key]
          )
          return result[0] ? JSON.parse(result[0].value) : null
        },
        set: async (key: string, value: any): Promise<void> => {
          const now = new Date().toISOString()
          await this.databaseManager.execute(
            `INSERT OR REPLACE INTO settings (key, value, created_at, updated_at) 
             VALUES (?, ?, ?, ?)`,
            [key, JSON.stringify(value), now, now]
          )
        },
        remove: async (key: string): Promise<void> => {
          await this.databaseManager.execute(
            'DELETE FROM settings WHERE key = ?',
            [key]
          )
        },
        clear: async (): Promise<void> => {
          await this.databaseManager.execute('DELETE FROM settings')
        }
      },

      // 通知系统
      notifications: {
        success: (title: string, message?: string) => {
          this.eventBus.emit('notification:success', { title, message }, 'CoreAPI')
        },
        error: (title: string, message?: string) => {
          this.eventBus.emit('notification:error', { title, message }, 'CoreAPI')
        },
        warning: (title: string, message?: string) => {
          this.eventBus.emit('notification:warning', { title, message }, 'CoreAPI')
        },
        info: (title: string, message?: string) => {
          this.eventBus.emit('notification:info', { title, message }, 'CoreAPI')
        }
      },

      // 路由系统
      router: {
        navigate: (path: string) => {
          this.eventBus.emit('router:navigate', { path }, 'CoreAPI')
        },
        getCurrentPath: () => {
          // 这里需要与前端路由系统集成
          return window.location.pathname
        },
        addRoutes: (routes) => {
          this.eventBus.emit('router:add-routes', { routes }, 'CoreAPI')
        },
        removeRoutes: (moduleId: string) => {
          this.eventBus.emit('router:remove-routes', { moduleId }, 'CoreAPI')
        }
      },

      // 设置系统
      settings: {
        get: async <T = any>(key: string): Promise<T | null> => {
          const result = await this.databaseManager.query(
            'SELECT value FROM settings WHERE key = ?',
            [key]
          )
          return result[0] ? JSON.parse(result[0].value) : null
        },
        set: async (key: string, value: any): Promise<void> => {
          const now = new Date().toISOString()
          await this.databaseManager.execute(
            `INSERT OR REPLACE INTO settings (key, value, created_at, updated_at) 
             VALUES (?, ?, ?, ?)`,
            [key, JSON.stringify(value), now, now]
          )
        },
        getModuleSettings: async (moduleId: string): Promise<Record<string, any>> => {
          return this.settingsManager.getModuleSettings(moduleId)
        },
        setModuleSettings: async (moduleId: string, settings: Record<string, any>): Promise<void> => {
          return this.settingsManager.setModuleSettings(moduleId, settings)
        }
      }
    }
  }

  /**
   * 检查是否已初始化
   */
  isInitialized(): boolean {
    return this.initialized
  }

  /**
   * 关闭核心系统
   */
  async shutdown(): Promise<void> {
    if (!this.initialized) {
      return
    }

    try {
      // 停用所有模块
      await this.moduleManager.deactivateAllModules()

      // 关闭数据库连接
      await this.databaseManager.close()

      // 清理事件监听器
      this.eventBus.removeAllListeners()

      // 发送关闭完成事件
      this.eventBus.emit('core:shutdown', {}, 'MingLogCore')

      this.initialized = false
    } catch (error) {
      this.eventBus.emit('core:error', { error }, 'MingLogCore')
      throw error
    }
  }
}
