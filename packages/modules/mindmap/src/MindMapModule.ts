/**
 * 思维导图模块主类
 * 实现IModule接口，提供思维导图的完整功能
 */

import {
  MindMapService,
  LayoutService,
  ExportService,
  type IMindMapService,
  type ILayoutService,
  type IExportService
} from './services'

// 核心模块接口定义 (基于现有核心系统)
interface IModuleMetadata {
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

interface IModuleConfig {
  enabled: boolean
  settings: Record<string, any>
  preferences: Record<string, any>
}

interface IModuleEvent {
  type: string
  data: any
  timestamp: Date
  source: string
}

interface IModule {
  readonly metadata: IModuleMetadata
  readonly config: IModuleConfig
  readonly isInitialized: boolean
  readonly isActivated: boolean

  initialize(coreAPI: any): Promise<void>
  activate(): Promise<void>
  deactivate(): Promise<void>
  destroy(): Promise<void>
  
  handleEvent(event: IModuleEvent): Promise<void>
  getStatus(): any
  updateConfig(config: Partial<IModuleConfig>): Promise<void>
}

// 基础模块类
abstract class BaseModule implements IModule {
  public readonly metadata: IModuleMetadata
  public readonly config: IModuleConfig
  public isInitialized = false
  public isActivated = false

  protected coreAPI: any

  constructor(metadata: IModuleMetadata, config?: Partial<IModuleConfig>) {
    this.metadata = metadata
    this.config = {
      enabled: true,
      settings: {},
      preferences: {},
      ...config
    }
  }

  async initialize(coreAPI: any): Promise<void> {
    if (this.isInitialized) {
      throw new Error(`Module ${this.metadata.id} is already initialized`)
    }

    this.coreAPI = coreAPI
    await this.onInitialize(coreAPI)
    this.isInitialized = true
  }

  async activate(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error(`Module ${this.metadata.id} must be initialized before activation`)
    }
    if (this.isActivated) {
      throw new Error(`Module ${this.metadata.id} is already activated`)
    }

    await this.onActivate()
    this.isActivated = true
  }

  async deactivate(): Promise<void> {
    if (!this.isActivated) {
      return
    }

    await this.onDeactivate()
    this.isActivated = false
  }

  async destroy(): Promise<void> {
    if (this.isActivated) {
      await this.deactivate()
    }

    await this.onDestroy()
    this.isInitialized = false
  }

  async handleEvent(event: IModuleEvent): Promise<void> {
    if (!this.isActivated) {
      return
    }

    await this.onHandleEvent(event)
  }

  getStatus(): any {
    return {
      id: this.metadata.id,
      name: this.metadata.name,
      version: this.metadata.version,
      isInitialized: this.isInitialized,
      isActivated: this.isActivated,
      config: this.config
    }
  }

  async updateConfig(config: Partial<IModuleConfig>): Promise<void> {
    Object.assign(this.config, config)
    await this.onConfigUpdate(config)
  }

  // 抽象方法，子类必须实现
  protected abstract onInitialize(coreAPI: any): Promise<void>
  protected abstract onActivate(): Promise<void>
  protected abstract onDeactivate(): Promise<void>
  protected abstract onDestroy(): Promise<void>
  protected abstract onHandleEvent(event: IModuleEvent): Promise<void>
  protected abstract onConfigUpdate(config: Partial<IModuleConfig>): Promise<void>
}

export class MindMapModule extends BaseModule {
  private mindMapService!: IMindMapService
  private layoutService!: ILayoutService
  private exportService!: IExportService
  private coreAPI: any

  constructor(config?: Partial<IModuleConfig>) {
    const metadata: IModuleMetadata = {
      id: 'mindmap',
      name: '思维导图',
      version: '1.0.0',
      description: '可视化思维导图编辑、多种布局算法、与笔记双向同步',
      author: 'MingLog Team',
      icon: '🧠',
      tags: ['mindmap', 'visualization', 'thinking', 'diagram'],
      dependencies: [],
      optionalDependencies: ['notes']
    }

    super(metadata, config)
  }

  protected async onInitialize(coreAPI: any): Promise<void> {
    console.log('MindMap module initializing...')
    this.coreAPI = coreAPI
    
    // 初始化服务层
    this.mindMapService = new MindMapService(coreAPI)
    this.layoutService = new LayoutService(coreAPI)
    this.exportService = new ExportService(coreAPI)

    // 创建数据库表
    await this.createDatabaseTables()
  }

  protected async onActivate(): Promise<void> {
    console.log('MindMap module activating...')
    
    // 注册事件监听器
    if (this.coreAPI?.events) {
      this.coreAPI.events.on('note:created', this.handleNoteCreated.bind(this))
      this.coreAPI.events.on('note:updated', this.handleNoteUpdated.bind(this))
      this.coreAPI.events.on('note:deleted', this.handleNoteDeleted.bind(this))
    }

    // 注册路由
    if (this.coreAPI?.router) {
      this.coreAPI.router.register('/mindmap/:id?', 'MindMapPage')
    }

    // 注册菜单项
    if (this.coreAPI?.menu) {
      this.coreAPI.menu.addItem({
        id: 'mindmap',
        label: '思维导图',
        icon: '🧠',
        path: '/mindmap',
        order: 30
      })
    }
  }

  protected async onDeactivate(): Promise<void> {
    console.log('MindMap module deactivating...')
    
    // 移除事件监听器
    if (this.coreAPI?.events) {
      this.coreAPI.events.off('note:created', this.handleNoteCreated.bind(this))
      this.coreAPI.events.off('note:updated', this.handleNoteUpdated.bind(this))
      this.coreAPI.events.off('note:deleted', this.handleNoteDeleted.bind(this))
    }

    // 移除路由
    if (this.coreAPI?.router) {
      this.coreAPI.router.unregister('/mindmap/:id?')
    }

    // 移除菜单项
    if (this.coreAPI?.menu) {
      this.coreAPI.menu.removeItem('mindmap')
    }
  }

  protected async onDestroy(): Promise<void> {
    console.log('MindMap module destroying...')
    // 清理资源
  }

  protected async onHandleEvent(event: IModuleEvent): Promise<void> {
    switch (event.type) {
      case 'note:created':
        await this.handleNoteCreated(event)
        break
      case 'note:updated':
        await this.handleNoteUpdated(event)
        break
      case 'note:deleted':
        await this.handleNoteDeleted(event)
        break
      default:
        // 忽略未知事件
        break
    }
  }

  protected async onConfigUpdate(config: Partial<IModuleConfig>): Promise<void> {
    console.log('MindMap module config updated:', config)
    // 处理配置更新
  }

  // 公共API方法
  public getMindMapService(): IMindMapService {
    return this.mindMapService
  }

  public getLayoutService(): ILayoutService {
    return this.layoutService
  }

  public getExportService(): IExportService {
    return this.exportService
  }

  // 数据库表创建
  private async createDatabaseTables(): Promise<void> {
    if (!this.coreAPI?.database) {
      console.warn('Database not available, skipping table creation')
      return
    }

    try {
      // 创建思维导图表
      await this.coreAPI.database.execute(`
        CREATE TABLE IF NOT EXISTS mindmaps (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT,
          data TEXT NOT NULL,
          layout_type TEXT NOT NULL DEFAULT 'tree',
          theme TEXT NOT NULL DEFAULT 'default',
          linked_note_id TEXT,
          settings TEXT DEFAULT '{}',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (linked_note_id) REFERENCES pages(id) ON DELETE SET NULL
        )
      `)

      // 创建思维导图节点表
      await this.coreAPI.database.execute(`
        CREATE TABLE IF NOT EXISTS mindmap_nodes (
          id TEXT PRIMARY KEY,
          mindmap_id TEXT NOT NULL,
          text TEXT NOT NULL,
          level INTEGER NOT NULL DEFAULT 0,
          parent_id TEXT,
          x REAL DEFAULT 0,
          y REAL DEFAULT 0,
          style TEXT DEFAULT '{}',
          metadata TEXT DEFAULT '{}',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (mindmap_id) REFERENCES mindmaps(id) ON DELETE CASCADE,
          FOREIGN KEY (parent_id) REFERENCES mindmap_nodes(id) ON DELETE CASCADE
        )
      `)

      // 创建思维导图链接表
      await this.coreAPI.database.execute(`
        CREATE TABLE IF NOT EXISTS mindmap_links (
          id TEXT PRIMARY KEY,
          mindmap_id TEXT NOT NULL,
          source_id TEXT NOT NULL,
          target_id TEXT NOT NULL,
          type TEXT NOT NULL DEFAULT 'parent-child',
          style TEXT DEFAULT '{}',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (mindmap_id) REFERENCES mindmaps(id) ON DELETE CASCADE,
          FOREIGN KEY (source_id) REFERENCES mindmap_nodes(id) ON DELETE CASCADE,
          FOREIGN KEY (target_id) REFERENCES mindmap_nodes(id) ON DELETE CASCADE
        )
      `)

      // 创建索引
      await this.coreAPI.database.execute('CREATE INDEX IF NOT EXISTS idx_mindmap_nodes_mindmap_id ON mindmap_nodes(mindmap_id)')
      await this.coreAPI.database.execute('CREATE INDEX IF NOT EXISTS idx_mindmap_nodes_parent_id ON mindmap_nodes(parent_id)')
      await this.coreAPI.database.execute('CREATE INDEX IF NOT EXISTS idx_mindmap_links_mindmap_id ON mindmap_links(mindmap_id)')
      await this.coreAPI.database.execute('CREATE INDEX IF NOT EXISTS idx_mindmaps_linked_note_id ON mindmaps(linked_note_id)')

      console.log('MindMap module database tables created successfully')
    } catch (error) {
      console.error('Failed to create mindmap module database tables:', error)
      throw error
    }
  }

  private async handleNoteCreated(event: IModuleEvent): Promise<void> {
    // 当笔记创建时，可以选择自动创建对应的思维导图
    console.log('Note created, considering mindmap creation:', event.data)
  }

  private async handleNoteUpdated(event: IModuleEvent): Promise<void> {
    // 当笔记更新时，同步更新相关的思维导图
    console.log('Note updated, syncing mindmap:', event.data)
  }

  private async handleNoteDeleted(event: IModuleEvent): Promise<void> {
    // 当笔记删除时，处理相关的思维导图
    console.log('Note deleted, handling mindmap:', event.data)
  }
}

// 模块工厂函数
export function createMindMapModule(config?: Partial<IModuleConfig>): MindMapModule {
  return new MindMapModule(config)
}

// 默认配置
export const MINDMAP_MODULE_DEFAULT_CONFIG = {
  enabled: true,
  settings: {
    defaultLayout: 'tree',
    defaultTheme: 'default',
    autoSave: true,
    autoSaveInterval: 5000,
    enableCollaboration: false,
    maxNodes: 1000,
    enableAnimation: true,
    enableMinimap: true
  },
  preferences: {
    showToolbar: true,
    showGrid: false,
    enableZoom: true,
    enableDrag: true,
    enableEdit: true,
    snapToGrid: false,
    gridSize: 20
  }
}
