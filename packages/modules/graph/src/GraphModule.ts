/**
 * 知识图谱模块主类
 * 实现IModule接口，提供知识图谱的完整功能
 */

import {
  GraphService,
  AnalysisService,
  VisualizationService,
  type IGraphService,
  type IAnalysisService,
  type IVisualizationService
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

export class GraphModule extends BaseModule {
  private graphService!: IGraphService
  private analysisService!: IAnalysisService
  private visualizationService!: IVisualizationService
  private coreAPI: any

  constructor(config?: Partial<IModuleConfig>) {
    const metadata: IModuleMetadata = {
      id: 'graph',
      name: '知识图谱',
      version: '1.0.0',
      description: '知识图谱可视化、关系分析、路径发现、社区检测',
      author: 'MingLog Team',
      icon: '🕸️',
      tags: ['graph', 'visualization', 'analysis', 'network'],
      dependencies: [],
      optionalDependencies: ['notes', 'mindmap']
    }

    super(metadata, config)
  }

  protected async onInitialize(coreAPI: any): Promise<void> {
    console.log('Graph module initializing...')
    this.coreAPI = coreAPI
    
    // 初始化服务层
    this.graphService = new GraphService(coreAPI)
    this.analysisService = new AnalysisService(coreAPI)
    this.visualizationService = new VisualizationService(coreAPI)

    // 创建数据库表
    await this.createDatabaseTables()
  }

  protected async onActivate(): Promise<void> {
    console.log('Graph module activating...')
    
    // 注册事件监听器
    if (this.coreAPI?.events) {
      this.coreAPI.events.on('note:created', this.handleNoteCreated.bind(this))
      this.coreAPI.events.on('note:updated', this.handleNoteUpdated.bind(this))
      this.coreAPI.events.on('note:deleted', this.handleNoteDeleted.bind(this))
      this.coreAPI.events.on('link:created', this.handleLinkCreated.bind(this))
      this.coreAPI.events.on('link:deleted', this.handleLinkDeleted.bind(this))
    }

    // 注册路由
    if (this.coreAPI?.router) {
      this.coreAPI.router.register('/graph/:id?', 'GraphPage')
    }

    // 注册菜单项
    if (this.coreAPI?.menu) {
      this.coreAPI.menu.addItem({
        id: 'graph',
        label: '知识图谱',
        icon: '🕸️',
        path: '/graph',
        order: 40
      })
    }

    // 启动图谱分析任务
    await this.startAnalysisTasks()
  }

  protected async onDeactivate(): Promise<void> {
    console.log('Graph module deactivating...')
    
    // 移除事件监听器
    if (this.coreAPI?.events) {
      this.coreAPI.events.off('note:created', this.handleNoteCreated.bind(this))
      this.coreAPI.events.off('note:updated', this.handleNoteUpdated.bind(this))
      this.coreAPI.events.off('note:deleted', this.handleNoteDeleted.bind(this))
      this.coreAPI.events.off('link:created', this.handleLinkCreated.bind(this))
      this.coreAPI.events.off('link:deleted', this.handleLinkDeleted.bind(this))
    }

    // 移除路由
    if (this.coreAPI?.router) {
      this.coreAPI.router.unregister('/graph/:id?')
    }

    // 移除菜单项
    if (this.coreAPI?.menu) {
      this.coreAPI.menu.removeItem('graph')
    }

    // 停止分析任务
    await this.stopAnalysisTasks()
  }

  protected async onDestroy(): Promise<void> {
    console.log('Graph module destroying...')
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
      case 'link:created':
        await this.handleLinkCreated(event)
        break
      case 'link:deleted':
        await this.handleLinkDeleted(event)
        break
      default:
        // 忽略未知事件
        break
    }
  }

  protected async onConfigUpdate(config: Partial<IModuleConfig>): Promise<void> {
    console.log('Graph module config updated:', config)
    // 处理配置更新
  }

  // 公共API方法
  public getGraphService(): IGraphService {
    return this.graphService
  }

  public getAnalysisService(): IAnalysisService {
    return this.analysisService
  }

  public getVisualizationService(): IVisualizationService {
    return this.visualizationService
  }

  // 数据库表创建
  private async createDatabaseTables(): Promise<void> {
    if (!this.coreAPI?.database) {
      console.warn('Database not available, skipping table creation')
      return
    }

    try {
      // 创建图谱节点表
      await this.coreAPI.database.execute(`
        CREATE TABLE IF NOT EXISTS graph_nodes (
          id TEXT PRIMARY KEY,
          graph_id TEXT NOT NULL,
          node_type TEXT NOT NULL,
          title TEXT NOT NULL,
          content TEXT,
          tags TEXT DEFAULT '[]',
          properties TEXT DEFAULT '{}',
          x REAL DEFAULT 0,
          y REAL DEFAULT 0,
          size REAL DEFAULT 1,
          color TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (graph_id) REFERENCES graphs(id) ON DELETE CASCADE
        )
      `)

      // 创建图谱边表
      await this.coreAPI.database.execute(`
        CREATE TABLE IF NOT EXISTS graph_edges (
          id TEXT PRIMARY KEY,
          graph_id TEXT NOT NULL,
          source_id TEXT NOT NULL,
          target_id TEXT NOT NULL,
          edge_type TEXT NOT NULL,
          weight REAL DEFAULT 1.0,
          label TEXT,
          properties TEXT DEFAULT '{}',
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          FOREIGN KEY (graph_id) REFERENCES graphs(id) ON DELETE CASCADE,
          FOREIGN KEY (source_id) REFERENCES graph_nodes(id) ON DELETE CASCADE,
          FOREIGN KEY (target_id) REFERENCES graph_nodes(id) ON DELETE CASCADE
        )
      `)

      // 创建图谱分析结果表
      await this.coreAPI.database.execute(`
        CREATE TABLE IF NOT EXISTS graph_analysis (
          id TEXT PRIMARY KEY,
          graph_id TEXT NOT NULL,
          analysis_type TEXT NOT NULL,
          result TEXT NOT NULL,
          parameters TEXT DEFAULT '{}',
          created_at TEXT NOT NULL,
          FOREIGN KEY (graph_id) REFERENCES graphs(id) ON DELETE CASCADE
        )
      `)

      // 创建图谱快照表
      await this.coreAPI.database.execute(`
        CREATE TABLE IF NOT EXISTS graph_snapshots (
          id TEXT PRIMARY KEY,
          graph_id TEXT NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          data TEXT NOT NULL,
          created_at TEXT NOT NULL,
          FOREIGN KEY (graph_id) REFERENCES graphs(id) ON DELETE CASCADE
        )
      `)

      // 创建索引
      await this.coreAPI.database.execute('CREATE INDEX IF NOT EXISTS idx_graph_nodes_graph_id ON graph_nodes(graph_id)')
      await this.coreAPI.database.execute('CREATE INDEX IF NOT EXISTS idx_graph_nodes_type ON graph_nodes(node_type)')
      await this.coreAPI.database.execute('CREATE INDEX IF NOT EXISTS idx_graph_edges_graph_id ON graph_edges(graph_id)')
      await this.coreAPI.database.execute('CREATE INDEX IF NOT EXISTS idx_graph_edges_source ON graph_edges(source_id)')
      await this.coreAPI.database.execute('CREATE INDEX IF NOT EXISTS idx_graph_edges_target ON graph_edges(target_id)')
      await this.coreAPI.database.execute('CREATE INDEX IF NOT EXISTS idx_graph_analysis_graph_id ON graph_analysis(graph_id)')
      await this.coreAPI.database.execute('CREATE INDEX IF NOT EXISTS idx_graph_analysis_type ON graph_analysis(analysis_type)')

      console.log('Graph module database tables created successfully')
    } catch (error) {
      console.error('Failed to create graph module database tables:', error)
      throw error
    }
  }

  private async startAnalysisTasks(): Promise<void> {
    // 启动定期分析任务
    console.log('Starting graph analysis tasks...')
  }

  private async stopAnalysisTasks(): Promise<void> {
    // 停止分析任务
    console.log('Stopping graph analysis tasks...')
  }

  private async handleNoteCreated(event: IModuleEvent): Promise<void> {
    // 当笔记创建时，添加到图谱中
    console.log('Note created, adding to graph:', event.data)
    await this.graphService.addNodeFromNote(event.data)
  }

  private async handleNoteUpdated(event: IModuleEvent): Promise<void> {
    // 当笔记更新时，更新图谱节点
    console.log('Note updated, updating graph node:', event.data)
    await this.graphService.updateNodeFromNote(event.data)
  }

  private async handleNoteDeleted(event: IModuleEvent): Promise<void> {
    // 当笔记删除时，从图谱中移除
    console.log('Note deleted, removing from graph:', event.data)
    await this.graphService.removeNodeFromNote(event.data)
  }

  private async handleLinkCreated(event: IModuleEvent): Promise<void> {
    // 当链接创建时，添加到图谱中
    console.log('Link created, adding to graph:', event.data)
    await this.graphService.addEdgeFromLink(event.data)
  }

  private async handleLinkDeleted(event: IModuleEvent): Promise<void> {
    // 当链接删除时，从图谱中移除
    console.log('Link deleted, removing from graph:', event.data)
    await this.graphService.removeEdgeFromLink(event.data)
  }
}

// 模块工厂函数
export function createGraphModule(config?: Partial<IModuleConfig>): GraphModule {
  return new GraphModule(config)
}

// 默认配置
export const GRAPH_MODULE_DEFAULT_CONFIG = {
  enabled: true,
  settings: {
    autoAnalysis: true,
    analysisInterval: 300000, // 5分钟
    maxNodes: 5000,
    maxEdges: 10000,
    enableClustering: true,
    enablePathFinding: true,
    enableCentralityAnalysis: true,
    cacheAnalysisResults: true,
    cacheExpiration: 3600000 // 1小时
  },
  preferences: {
    defaultLayout: 'force',
    showLabels: true,
    showTooltips: true,
    enableZoom: true,
    enableDrag: true,
    enablePan: true,
    highlightConnected: true,
    nodeRadius: 8,
    linkDistance: 50,
    chargeStrength: -300,
    backgroundColor: '#ffffff'
  }
}
