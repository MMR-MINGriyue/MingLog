/**
 * 数据库模块主类
 * 提供类似Notion的结构化数据管理功能
 */

import {
  IModule,
  IModuleMetadata,
  IModuleConfig,
  IRouteConfig,
  IMenuItem,
  IModuleEvent,
  ModuleStatus,
  DatabaseModuleConfig,
  DATABASE_MODULE_METADATA,
  DatabaseModuleEventType
} from './types'

// 服务导入将在服务实现完成后添加
// import { DatabaseService } from './services/DatabaseService'
// import { FieldService } from './services/FieldService'
// import { ViewService } from './services/ViewService'
// import { QueryEngine } from './services/QueryEngine'
// import { RelationService } from './services/RelationService'
// import { FormulaEngine } from './services/FormulaEngine'

/**
 * 数据库模块类
 */
export class DatabaseModule implements IModule {
  readonly metadata: IModuleMetadata = DATABASE_MODULE_METADATA
  private _status: ModuleStatus = ModuleStatus.UNLOADED
  private _config: DatabaseModuleConfig
  private _coreAPI: any
  
  // 服务实例（临时注释，等服务实现完成后启用）
  private databaseService?: any // DatabaseService
  private fieldService?: any // FieldService
  private viewService?: any // ViewService
  private queryEngine?: any // QueryEngine
  private relationService?: any // RelationService
  private formulaEngine?: any // FormulaEngine
  
  // 事件监听器
  private eventListeners: Map<string, Function[]> = new Map()

  constructor(config?: Partial<DatabaseModuleConfig>) {
    this._config = this.createDefaultConfig(config)
  }

  get status(): ModuleStatus {
    return this._status
  }

  get config(): DatabaseModuleConfig {
    return this._config
  }

  /**
   * 初始化模块
   */
  async initialize(coreAPI: any): Promise<void> {
    try {
      this._status = ModuleStatus.LOADING
      this._coreAPI = coreAPI

      // 初始化服务
      await this.initializeServices()

      // 注册事件监听器
      this.registerEventListeners()

      // 初始化数据库表结构
      await this.initializeDatabaseSchema()

      this._status = ModuleStatus.LOADED
      
      // 发送初始化完成事件
      this.emitEvent(DatabaseModuleEventType.MODULE_INITIALIZED, {
        moduleId: this.metadata.id,
        timestamp: Date.now()
      })

    } catch (error) {
      this._status = ModuleStatus.ERROR
      this.emitEvent(DatabaseModuleEventType.MODULE_ERROR, {
        moduleId: this.metadata.id,
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now()
      })
      throw error
    }
  }

  /**
   * 激活模块
   */
  async activate(): Promise<void> {
    try {
      if (this._status !== ModuleStatus.LOADED) {
        throw new Error('Module must be loaded before activation')
      }

      this._status = ModuleStatus.ACTIVATING

      // 启动服务
      await this.startServices()

      // 注册模块路由
      this.registerRoutes()

      // 注册菜单项
      this.registerMenuItems()

      this._status = ModuleStatus.ACTIVE
      this._config.enabled = true

      // 发送激活完成事件
      this.emitEvent(DatabaseModuleEventType.MODULE_ACTIVATED, {
        moduleId: this.metadata.id,
        timestamp: Date.now()
      })

    } catch (error) {
      this._status = ModuleStatus.ERROR
      this.emitEvent(DatabaseModuleEventType.MODULE_ERROR, {
        moduleId: this.metadata.id,
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now()
      })
      throw error
    }
  }

  /**
   * 停用模块
   */
  async deactivate(): Promise<void> {
    try {
      this._status = ModuleStatus.DEACTIVATING

      // 停止服务
      await this.stopServices()

      // 清理事件监听器
      this.clearEventListeners()

      this._status = ModuleStatus.LOADED
      this._config.enabled = false

      // 发送停用完成事件
      this.emitEvent(DatabaseModuleEventType.MODULE_DEACTIVATED, {
        moduleId: this.metadata.id,
        timestamp: Date.now()
      })

    } catch (error) {
      this._status = ModuleStatus.ERROR
      throw error
    }
  }

  /**
   * 销毁模块
   */
  async destroy(): Promise<void> {
    try {
      if (this._status === ModuleStatus.ACTIVE) {
        await this.deactivate()
      }

      // 销毁服务
      await this.destroyServices()

      // 清理资源
      this.eventListeners.clear()

      this._status = ModuleStatus.UNLOADED

    } catch (error) {
      this._status = ModuleStatus.ERROR
      throw error
    }
  }

  /**
   * 获取模块配置
   */
  getConfig(): DatabaseModuleConfig {
    return { ...this._config }
  }

  /**
   * 设置模块配置
   */
  setConfig(config: Partial<DatabaseModuleConfig>): void {
    this._config = {
      ...this._config,
      ...config,
      settings: {
        ...this._config.settings,
        ...config.settings
      },
      preferences: {
        ...this._config.preferences,
        ...config.preferences
      }
    }

    // 应用配置更改
    this.applyConfigChanges()
  }

  /**
   * 获取路由配置
   */
  getRoutes(): IRouteConfig[] {
    return [
      {
        path: '/database',
        component: 'DatabaseView',
        exact: true,
        title: '数据库',
        icon: '🗃️',
        permissions: ['database:view']
      },
      {
        path: '/database/:id',
        component: 'DatabaseDetailView',
        exact: true,
        title: '数据库详情',
        permissions: ['database:view']
      },
      {
        path: '/database/:id/view/:viewId',
        component: 'DatabaseViewDetail',
        exact: true,
        title: '数据库视图',
        permissions: ['database:view']
      }
    ]
  }

  /**
   * 获取菜单项
   */
  getMenuItems(): IMenuItem[] {
    return [
      {
        id: 'database',
        label: '数据库',
        icon: '🗃️',
        path: '/database',
        permissions: ['database:view'],
        order: 30
      }
    ]
  }

  /**
   * 处理模块事件
   */
  onEvent(event: IModuleEvent): void {
    const listeners = this.eventListeners.get(event.type) || []
    listeners.forEach(listener => {
      try {
        listener(event)
      } catch (error) {
        console.error(`Error handling event ${event.type}:`, error)
      }
    })
  }

  /**
   * 获取模块健康状态
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'warning' | 'error'
    message?: string
    details?: Record<string, any>
  }> {
    try {
      const details: Record<string, any> = {}

      // 检查服务状态
      if (this.databaseService) {
        details.databaseService = await this.databaseService.getHealthStatus()
      }
      if (this.queryEngine) {
        details.queryEngine = await this.queryEngine.getHealthStatus()
      }

      // 检查数据库连接
      if (this._coreAPI?.database) {
        details.databaseConnection = await this._coreAPI.database.ping()
      }

      // 计算整体状态
      const hasErrors = Object.values(details).some(
        (status: any) => status?.status === 'error'
      )
      const hasWarnings = Object.values(details).some(
        (status: any) => status?.status === 'warning'
      )

      return {
        status: hasErrors ? 'error' : hasWarnings ? 'warning' : 'healthy',
        message: hasErrors 
          ? '数据库模块存在错误' 
          : hasWarnings 
          ? '数据库模块存在警告' 
          : '数据库模块运行正常',
        details
      }

    } catch (error) {
      return {
        status: 'error',
        message: '健康检查失败',
        details: {
          error: error instanceof Error ? error.message : String(error)
        }
      }
    }
  }

  /**
   * 获取服务实例
   */
  getServices() {
    return {
      database: this.databaseService,
      field: this.fieldService,
      view: this.viewService,
      query: this.queryEngine,
      relation: this.relationService,
      formula: this.formulaEngine
    }
  }

  /**
   * 初始化服务
   */
  private async initializeServices(): Promise<void> {
    // 创建服务实例
    this.databaseService = new DatabaseService(this._coreAPI, this._config)
    this.fieldService = new FieldService(this._coreAPI, this._config)
    this.viewService = new ViewService(this._coreAPI, this._config)
    this.queryEngine = new QueryEngine(this._coreAPI, this._config)
    this.relationService = new RelationService(this._coreAPI, this._config)
    this.formulaEngine = new FormulaEngine(this._coreAPI, this._config)

    // 初始化服务
    await Promise.all([
      this.databaseService.initialize(),
      this.fieldService.initialize(),
      this.viewService.initialize(),
      this.queryEngine.initialize(),
      this.relationService.initialize(),
      this.formulaEngine.initialize()
    ])
  }

  /**
   * 启动服务
   */
  private async startServices(): Promise<void> {
    const services = [
      this.databaseService,
      this.fieldService,
      this.viewService,
      this.queryEngine,
      this.relationService,
      this.formulaEngine
    ]

    await Promise.all(
      services.map(service => service?.start?.())
    )
  }

  /**
   * 停止服务
   */
  private async stopServices(): Promise<void> {
    const services = [
      this.databaseService,
      this.fieldService,
      this.viewService,
      this.queryEngine,
      this.relationService,
      this.formulaEngine
    ]

    await Promise.all(
      services.map(service => service?.stop?.())
    )
  }

  /**
   * 销毁服务
   */
  private async destroyServices(): Promise<void> {
    const services = [
      this.databaseService,
      this.fieldService,
      this.viewService,
      this.queryEngine,
      this.relationService,
      this.formulaEngine
    ]

    await Promise.all(
      services.map(service => service?.destroy?.())
    )

    // 清空服务引用
    this.databaseService = undefined
    this.fieldService = undefined
    this.viewService = undefined
    this.queryEngine = undefined
    this.relationService = undefined
    this.formulaEngine = undefined
  }

  /**
   * 注册事件监听器
   */
  private registerEventListeners(): void {
    // 监听核心事件
    this.addEventListener('core:shutdown', () => {
      this.deactivate()
    })

    // 监听其他模块事件
    this.addEventListener('notes:created', (event) => {
      // 处理笔记创建事件，可能需要创建关联
    })
  }

  /**
   * 清理事件监听器
   */
  private clearEventListeners(): void {
    this.eventListeners.clear()
  }

  /**
   * 添加事件监听器
   */
  private addEventListener(eventType: string, listener: Function): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, [])
    }
    this.eventListeners.get(eventType)!.push(listener)
  }

  /**
   * 发送事件
   */
  private emitEvent(type: string, data: any): void {
    if (this._coreAPI?.events) {
      this._coreAPI.events.emit(type, data, this.metadata.id)
    }
  }

  /**
   * 初始化数据库表结构
   */
  private async initializeDatabaseSchema(): Promise<void> {
    // 这里会创建数据库模块需要的表结构
    // 具体实现将在DatabaseService中完成
    if (this.databaseService) {
      await this.databaseService.initializeSchema()
    }
  }

  /**
   * 注册路由
   */
  private registerRoutes(): void {
    if (this._coreAPI?.router) {
      const routes = this.getRoutes()
      routes.forEach(route => {
        this._coreAPI.router.register(route)
      })
    }
  }

  /**
   * 注册菜单项
   */
  private registerMenuItems(): void {
    if (this._coreAPI?.menu) {
      const menuItems = this.getMenuItems()
      menuItems.forEach(item => {
        this._coreAPI.menu.register(item)
      })
    }
  }

  /**
   * 应用配置更改
   */
  private applyConfigChanges(): void {
    // 将配置更改应用到各个服务
    const services = this.getServices()
    Object.values(services).forEach(service => {
      if (service && typeof service.updateConfig === 'function') {
        service.updateConfig(this._config)
      }
    })
  }

  /**
   * 创建默认配置
   */
  private createDefaultConfig(config?: Partial<DatabaseModuleConfig>): DatabaseModuleConfig {
    const defaultConfig: DatabaseModuleConfig = {
      enabled: true,
      settings: {
        maxDatabases: 100,
        maxRecordsPerDatabase: 10000,
        maxFieldsPerDatabase: 100,
        maxViewsPerDatabase: 20,
        enableQueryCache: true,
        queryCacheTtl: 300,
        enableQueryOptimization: true,
        maxQueryExecutionTime: 30000,
        enableCompression: false,
        enableEncryption: false,
        backupInterval: 24,
        maxBackupCount: 7,
        enableVersioning: true,
        enableAuditLog: true,
        enableRealTimeSync: false,
        enableCollaboration: false,
        enablePermissions: true,
        defaultPermissionLevel: 'read',
        enableDataMasking: false,
        supportedImportFormats: ['csv', 'json', 'xlsx'],
        supportedExportFormats: ['csv', 'json', 'xlsx', 'pdf'],
        maxImportFileSize: 10 * 1024 * 1024, // 10MB
        defaultViewType: 'table',
        enableAdvancedFilters: true,
        enableCustomViews: true,
        enableFormulas: true
      },
      preferences: {
        theme: 'auto',
        language: 'zh-CN',
        timezone: 'Asia/Shanghai',
        dateFormat: 'YYYY-MM-DD',
        timeFormat: 'HH:mm:ss',
        numberFormat: 'en-US',
        autoSave: true,
        autoSaveInterval: 30,
        showLineNumbers: false,
        enableSpellCheck: true,
        defaultPageSize: 50,
        enableInfiniteScroll: false,
        showRecordCount: true,
        enableQuickFilters: true,
        enableNotifications: true,
        notificationTypes: ['create', 'update', 'delete'],
        emailNotifications: false,
        keyboardShortcuts: {
          'new_database': 'Ctrl+Shift+D',
          'new_record': 'Ctrl+N',
          'search': 'Ctrl+F',
          'save': 'Ctrl+S'
        },
        enableExperimentalFeatures: false,
        debugMode: false,
        enablePerformanceMonitoring: true
      }
    }

    return {
      ...defaultConfig,
      ...config,
      settings: {
        ...defaultConfig.settings,
        ...config?.settings
      },
      preferences: {
        ...defaultConfig.preferences,
        ...config?.preferences
      }
    }
  }
}

/**
 * 数据库模块工厂
 */
export class DatabaseModuleFactory {
  static async create(config: DatabaseModuleConfig): Promise<DatabaseModule> {
    return new DatabaseModule(config)
  }
}

// 导出模块元数据
export { DATABASE_MODULE_METADATA }
