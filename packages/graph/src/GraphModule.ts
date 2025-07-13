/**
 * 图谱可视化模块
 * 提供知识图谱的数据关联、可视化展示和交互功能
 */

import { 
  GraphData, 
  GraphNode, 
  GraphLink, 
  GraphFilter, 
  LayoutConfig, 
  GraphStats,
  SearchResult,
  Cluster,
  Path,
  ExportOptions
} from './types'
import { 
  filterGraphData, 
  calculateGraphStats, 
  findShortestPath,
  clusterByConnectivity,
  clusterByTags,
  clusterByType
} from './utils'
import { applyLayout } from './layouts'

// 模块接口定义
interface IModuleMetadata {
  id: string
  name: string
  version: string
  description: string
  author: string
  icon: string
  tags: string[]
  dependencies: string[]
  optionalDependencies: string[]
}

interface IModuleConfig {
  enabled: boolean
  settings: Record<string, any>
  preferences: Record<string, any>
}

enum ModuleStatus {
  UNINITIALIZED = 'uninitialized',
  INITIALIZING = 'initializing',
  INITIALIZED = 'initialized',
  ACTIVATING = 'activating',
  ACTIVE = 'active',
  DEACTIVATING = 'deactivating',
  INACTIVE = 'inactive',
  ERROR = 'error'
}

interface IModule {
  readonly metadata: IModuleMetadata
  readonly status: ModuleStatus
  config: IModuleConfig
  
  initialize(coreAPI?: any): Promise<void>
  activate(): Promise<void>
  deactivate(): Promise<void>
  destroy(): Promise<void>
  
  getConfig(): IModuleConfig
  setConfig(config: Partial<IModuleConfig>): void
  onEvent(event: any): void
  getHealthStatus(): Promise<{
    status: 'healthy' | 'warning' | 'error'
    message?: string
    details?: Record<string, any>
  }>
}

// 基础模块抽象类
abstract class BaseModule implements IModule {
  protected _status: ModuleStatus = ModuleStatus.UNINITIALIZED
  protected _config: IModuleConfig
  protected coreAPI: any

  constructor(
    protected _metadata: IModuleMetadata,
    config?: Partial<IModuleConfig>
  ) {
    this._config = {
      enabled: true,
      settings: {},
      preferences: {},
      ...config
    }
  }

  get metadata(): IModuleMetadata {
    return { ...this._metadata }
  }

  get status(): ModuleStatus {
    return this._status
  }

  get config(): IModuleConfig {
    return { ...this._config }
  }

  set config(config: IModuleConfig) {
    this._config = { ...config }
  }

  async initialize(coreAPI?: any): Promise<void> {
    this._status = ModuleStatus.INITIALIZING
    this.coreAPI = coreAPI
    await this.onInitialize()
    this._status = ModuleStatus.INITIALIZED
  }

  async activate(): Promise<void> {
    if (this._status !== ModuleStatus.INITIALIZED) {
      throw new Error(`Cannot activate module in status: ${this._status}`)
    }
    this._status = ModuleStatus.ACTIVATING
    await this.onActivate()
    this._status = ModuleStatus.ACTIVE
  }

  async deactivate(): Promise<void> {
    if (this._status !== ModuleStatus.ACTIVE) {
      return
    }
    this._status = ModuleStatus.DEACTIVATING
    await this.onDeactivate()
    this._status = ModuleStatus.INACTIVE
  }

  async destroy(): Promise<void> {
    await this.onDestroy()
    this._status = ModuleStatus.UNINITIALIZED
  }

  getConfig(): IModuleConfig {
    return { ...this._config }
  }

  setConfig(config: Partial<IModuleConfig>): void {
    this._config = { ...this._config, ...config }
  }

  onEvent(event: any): void {
    // 默认实现，子类可以重写
  }

  async getHealthStatus(): Promise<{
    status: 'healthy' | 'warning' | 'error'
    message?: string
    details?: Record<string, any>
  }> {
    return {
      status: this._status === ModuleStatus.ACTIVE ? 'healthy' : 'warning',
      message: `Module status: ${this._status}`
    }
  }

  // 抽象方法，子类必须实现
  protected abstract onInitialize(): Promise<void>
  protected abstract onActivate(): Promise<void>
  protected abstract onDeactivate(): Promise<void>
  protected abstract onDestroy(): Promise<void>
}

/**
 * 图谱服务接口
 */
export interface IGraphService {
  // 数据管理
  createGraph(title: string, description?: string): Promise<GraphData>
  getGraph(id: string): Promise<GraphData | null>
  updateGraph(id: string, data: Partial<GraphData>): Promise<GraphData>
  deleteGraph(id: string): Promise<boolean>
  
  // 节点操作
  addNode(graphId: string, node: Omit<GraphNode, 'id'>): Promise<GraphNode>
  updateNode(graphId: string, nodeId: string, updates: Partial<GraphNode>): Promise<GraphNode>
  deleteNode(graphId: string, nodeId: string): Promise<boolean>
  
  // 链接操作
  addLink(graphId: string, link: Omit<GraphLink, 'id'>): Promise<GraphLink>
  updateLink(graphId: string, linkId: string, updates: Partial<GraphLink>): Promise<GraphLink>
  deleteLink(graphId: string, linkId: string): Promise<boolean>
  
  // 数据关联
  linkToNote(graphId: string, nodeId: string, noteId: string): Promise<boolean>
  linkToTask(graphId: string, nodeId: string, taskId: string): Promise<boolean>
  unlinkFromNote(graphId: string, nodeId: string, noteId: string): Promise<boolean>
  unlinkFromTask(graphId: string, nodeId: string, taskId: string): Promise<boolean>
  
  // 分析功能
  calculateStats(graphId: string): Promise<GraphStats>
  findClusters(graphId: string, algorithm: 'connectivity' | 'tags' | 'type'): Promise<Cluster[]>
  findShortestPath(graphId: string, sourceId: string, targetId: string): Promise<Path | null>
  
  // 搜索和过滤
  searchNodes(graphId: string, query: string): Promise<SearchResult>
  filterGraph(graphId: string, filter: GraphFilter): Promise<GraphData>
  
  // 布局计算
  calculateLayout(data: GraphData, config: LayoutConfig): Promise<GraphData>
  
  // 导入导出
  importFromNotes(noteIds: string[]): Promise<GraphData>
  exportGraph(data: GraphData, options: ExportOptions): Promise<Blob | string>
}

/**
 * 图谱服务实现
 */
export class GraphService implements IGraphService {
  private graphs: Map<string, GraphData> = new Map()
  private nodeLinks: Map<string, { notes: string[], tasks: string[] }> = new Map()

  constructor(private coreAPI?: any) {}

  async createGraph(title: string, description?: string): Promise<GraphData> {
    const id = this.generateId()
    
    const graphData: GraphData = {
      nodes: [],
      links: []
    }

    this.graphs.set(id, graphData)

    // 发送事件
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('graph:created', { id, data: graphData, title, description })
    }

    return graphData
  }

  async getGraph(id: string): Promise<GraphData | null> {
    return this.graphs.get(id) || null
  }

  async updateGraph(id: string, updates: Partial<GraphData>): Promise<GraphData> {
    const existing = this.graphs.get(id)
    if (!existing) {
      throw new Error(`Graph with id ${id} not found`)
    }

    const updated: GraphData = {
      ...existing,
      ...updates
    }

    this.graphs.set(id, updated)

    // 发送事件
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('graph:updated', { id, data: updated })
    }

    return updated
  }

  async deleteGraph(id: string): Promise<boolean> {
    const deleted = this.graphs.delete(id)
    
    if (deleted && this.coreAPI?.events) {
      this.coreAPI.events.emit('graph:deleted', { id })
    }

    return deleted
  }

  async addNode(graphId: string, nodeData: Omit<GraphNode, 'id'>): Promise<GraphNode> {
    const graph = this.graphs.get(graphId)
    if (!graph) {
      throw new Error(`Graph with id ${graphId} not found`)
    }

    const newNode: GraphNode = {
      id: this.generateId(),
      ...nodeData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    graph.nodes.push(newNode)
    this.graphs.set(graphId, graph)

    // 初始化节点链接
    this.nodeLinks.set(newNode.id, { notes: [], tasks: [] })

    // 发送事件
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('graph:node:added', { graphId, node: newNode })
    }

    return newNode
  }

  async updateNode(graphId: string, nodeId: string, updates: Partial<GraphNode>): Promise<GraphNode> {
    const graph = this.graphs.get(graphId)
    if (!graph) {
      throw new Error(`Graph with id ${graphId} not found`)
    }

    const nodeIndex = graph.nodes.findIndex(n => n.id === nodeId)
    if (nodeIndex === -1) {
      throw new Error(`Node with id ${nodeId} not found`)
    }

    const updatedNode: GraphNode = {
      ...graph.nodes[nodeIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    }

    graph.nodes[nodeIndex] = updatedNode
    this.graphs.set(graphId, graph)

    // 发送事件
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('graph:node:updated', { graphId, node: updatedNode })
    }

    return updatedNode
  }

  async deleteNode(graphId: string, nodeId: string): Promise<boolean> {
    const graph = this.graphs.get(graphId)
    if (!graph) {
      throw new Error(`Graph with id ${graphId} not found`)
    }

    // 删除节点
    const nodeIndex = graph.nodes.findIndex(n => n.id === nodeId)
    if (nodeIndex === -1) {
      return false
    }

    graph.nodes.splice(nodeIndex, 1)

    // 删除相关链接
    graph.links = graph.links.filter(link => 
      link.source !== nodeId && link.target !== nodeId
    )

    // 清理节点链接
    this.nodeLinks.delete(nodeId)

    this.graphs.set(graphId, graph)

    // 发送事件
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('graph:node:deleted', { graphId, nodeId })
    }

    return true
  }

  async addLink(graphId: string, linkData: Omit<GraphLink, 'id'>): Promise<GraphLink> {
    const graph = this.graphs.get(graphId)
    if (!graph) {
      throw new Error(`Graph with id ${graphId} not found`)
    }

    const newLink: GraphLink = {
      id: this.generateId(),
      ...linkData
    }

    graph.links.push(newLink)
    this.graphs.set(graphId, graph)

    // 发送事件
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('graph:link:added', { graphId, link: newLink })
    }

    return newLink
  }

  async updateLink(graphId: string, linkId: string, updates: Partial<GraphLink>): Promise<GraphLink> {
    const graph = this.graphs.get(graphId)
    if (!graph) {
      throw new Error(`Graph with id ${graphId} not found`)
    }

    const linkIndex = graph.links.findIndex(l => l.id === linkId)
    if (linkIndex === -1) {
      throw new Error(`Link with id ${linkId} not found`)
    }

    const updatedLink: GraphLink = {
      ...graph.links[linkIndex],
      ...updates
    }

    graph.links[linkIndex] = updatedLink
    this.graphs.set(graphId, graph)

    // 发送事件
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('graph:link:updated', { graphId, link: updatedLink })
    }

    return updatedLink
  }

  async deleteLink(graphId: string, linkId: string): Promise<boolean> {
    const graph = this.graphs.get(graphId)
    if (!graph) {
      throw new Error(`Graph with id ${graphId} not found`)
    }

    const linkIndex = graph.links.findIndex(l => l.id === linkId)
    if (linkIndex === -1) {
      return false
    }

    graph.links.splice(linkIndex, 1)
    this.graphs.set(graphId, graph)

    // 发送事件
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('graph:link:deleted', { graphId, linkId })
    }

    return true
  }

  async linkToNote(graphId: string, nodeId: string, noteId: string): Promise<boolean> {
    const nodeLinks = this.nodeLinks.get(nodeId)
    if (!nodeLinks) {
      return false
    }

    if (!nodeLinks.notes.includes(noteId)) {
      nodeLinks.notes.push(noteId)
      this.nodeLinks.set(nodeId, nodeLinks)

      // 发送事件
      if (this.coreAPI?.events) {
        this.coreAPI.events.emit('graph:node:linked:note', { graphId, nodeId, noteId })
      }
    }

    return true
  }

  async linkToTask(graphId: string, nodeId: string, taskId: string): Promise<boolean> {
    const nodeLinks = this.nodeLinks.get(nodeId)
    if (!nodeLinks) {
      return false
    }

    if (!nodeLinks.tasks.includes(taskId)) {
      nodeLinks.tasks.push(taskId)
      this.nodeLinks.set(nodeId, nodeLinks)

      // 发送事件
      if (this.coreAPI?.events) {
        this.coreAPI.events.emit('graph:node:linked:task', { graphId, nodeId, taskId })
      }
    }

    return true
  }

  async unlinkFromNote(graphId: string, nodeId: string, noteId: string): Promise<boolean> {
    const nodeLinks = this.nodeLinks.get(nodeId)
    if (!nodeLinks) {
      return false
    }

    const index = nodeLinks.notes.indexOf(noteId)
    if (index !== -1) {
      nodeLinks.notes.splice(index, 1)
      this.nodeLinks.set(nodeId, nodeLinks)

      // 发送事件
      if (this.coreAPI?.events) {
        this.coreAPI.events.emit('graph:node:unlinked:note', { graphId, nodeId, noteId })
      }
    }

    return true
  }

  async unlinkFromTask(graphId: string, nodeId: string, taskId: string): Promise<boolean> {
    const nodeLinks = this.nodeLinks.get(nodeId)
    if (!nodeLinks) {
      return false
    }

    const index = nodeLinks.tasks.indexOf(taskId)
    if (index !== -1) {
      nodeLinks.tasks.splice(index, 1)
      this.nodeLinks.set(nodeId, nodeLinks)

      // 发送事件
      if (this.coreAPI?.events) {
        this.coreAPI.events.emit('graph:node:unlinked:task', { graphId, nodeId, taskId })
      }
    }

    return true
  }

  async calculateStats(graphId: string): Promise<GraphStats> {
    const graph = this.graphs.get(graphId)
    if (!graph) {
      throw new Error(`Graph with id ${graphId} not found`)
    }

    return calculateGraphStats(graph)
  }

  async findClusters(graphId: string, algorithm: 'connectivity' | 'tags' | 'type'): Promise<Cluster[]> {
    const graph = this.graphs.get(graphId)
    if (!graph) {
      throw new Error(`Graph with id ${graphId} not found`)
    }

    switch (algorithm) {
      case 'connectivity':
        return clusterByConnectivity(graph.nodes, graph.links)
      case 'tags':
        return clusterByTags(graph.nodes, graph.links)
      case 'type':
        return clusterByType(graph.nodes, graph.links)
      default:
        return clusterByConnectivity(graph.nodes, graph.links)
    }
  }

  async findShortestPath(graphId: string, sourceId: string, targetId: string): Promise<Path | null> {
    const graph = this.graphs.get(graphId)
    if (!graph) {
      throw new Error(`Graph with id ${graphId} not found`)
    }

    return findShortestPath(graph.nodes, graph.links, sourceId, targetId)
  }

  async searchNodes(graphId: string, query: string): Promise<SearchResult> {
    const graph = this.graphs.get(graphId)
    if (!graph) {
      return { nodes: [], links: [], query, totalResults: 0 }
    }

    const lowerQuery = query.toLowerCase()
    const matchingNodes = graph.nodes.filter(node => 
      node.title.toLowerCase().includes(lowerQuery) ||
      node.content?.toLowerCase().includes(lowerQuery) ||
      node.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    )

    const matchingNodeIds = new Set(matchingNodes.map(n => n.id))
    const relatedLinks = graph.links.filter(link =>
      matchingNodeIds.has(link.source as string) || matchingNodeIds.has(link.target as string)
    )

    return {
      nodes: matchingNodes,
      links: relatedLinks,
      query,
      totalResults: matchingNodes.length
    }
  }

  async filterGraph(graphId: string, filter: GraphFilter): Promise<GraphData> {
    const graph = this.graphs.get(graphId)
    if (!graph) {
      throw new Error(`Graph with id ${graphId} not found`)
    }

    return filterGraphData(graph, filter)
  }

  async calculateLayout(data: GraphData, config: LayoutConfig): Promise<GraphData> {
    const startTime = performance.now()
    
    try {
      const layoutResult = applyLayout(data.nodes, data.links, config)
      
      const endTime = performance.now()
      const layoutTime = endTime - startTime
      
      // 性能监控：确保布局计算时间<100ms
      if (layoutTime > 100) {
        console.warn(`图谱布局计算时间过长: ${layoutTime.toFixed(2)}ms`)
      }

      return {
        nodes: layoutResult,
        links: data.links
      }
    } catch (error) {
      console.error('图谱布局计算失败:', error)
      return data // 回退到原始数据
    }
  }

  async importFromNotes(noteIds: string[]): Promise<GraphData> {
    // 模拟从笔记导入图谱数据
    const nodes: GraphNode[] = noteIds.map(noteId => ({
      id: noteId,
      title: `笔记 ${noteId}`,
      type: 'note' as const,
      content: `笔记内容 ${noteId}`,
      tags: [`tag-${noteId}`],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      size: 10,
      color: '#3B82F6'
    }))

    const links: GraphLink[] = []
    
    // 创建一些示例链接
    for (let i = 0; i < nodes.length - 1; i++) {
      links.push({
        id: this.generateId(),
        source: nodes[i].id,
        target: nodes[i + 1].id,
        type: 'reference',
        weight: 1
      })
    }

    return { nodes, links }
  }

  async exportGraph(data: GraphData, options: ExportOptions): Promise<Blob | string> {
    switch (options.format) {
      case 'json':
        return JSON.stringify(data, null, 2)
      case 'csv':
        return this.exportToCSV(data)
      case 'png':
      case 'svg':
        // 这里需要实现图像导出逻辑
        throw new Error(`Export format ${options.format} not yet implemented`)
      default:
        throw new Error(`Unsupported export format: ${options.format}`)
    }
  }

  private exportToCSV(data: GraphData): string {
    const nodesCsv = [
      'id,title,type,content,tags,createdAt,updatedAt',
      ...data.nodes.map(node => 
        `"${node.id}","${node.title}","${node.type}","${node.content || ''}","${node.tags?.join(';') || ''}","${node.createdAt || ''}","${node.updatedAt || ''}"`
      )
    ].join('\n')

    const linksCsv = [
      'id,source,target,type,weight,label',
      ...data.links.map(link =>
        `"${link.id}","${link.source}","${link.target}","${link.type}","${link.weight || ''}","${link.label || ''}"`
      )
    ].join('\n')

    return `# Nodes\n${nodesCsv}\n\n# Links\n${linksCsv}`
  }

  private generateId(): string {
    return `graph_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

/**
 * 图谱可视化模块主类
 */
export class GraphModule extends BaseModule {
  private graphService!: GraphService

  constructor(config?: Partial<IModuleConfig>) {
    const metadata: IModuleMetadata = {
      id: 'graph',
      name: '图谱可视化',
      version: '1.0.0',
      description: '提供知识图谱的数据关联、可视化展示和交互功能',
      author: 'MingLog Team',
      icon: '🕸️',
      tags: ['graph', 'visualization', 'network', 'knowledge'],
      dependencies: [],
      optionalDependencies: ['notes', 'tasks', 'mindmap']
    }

    super(metadata, config)
  }

  protected async onInitialize(): Promise<void> {
    console.log('图谱可视化模块初始化中...')
    
    // 初始化图谱服务
    this.graphService = new GraphService(this.coreAPI)
  }

  protected async onActivate(): Promise<void> {
    console.log('图谱可视化模块激活中...')
    
    // 注册事件监听器
    if (this.coreAPI?.events) {
      this.coreAPI.events.on('notes:page:created', this.handlePageCreated.bind(this))
      this.coreAPI.events.on('notes:page:updated', this.handlePageUpdated.bind(this))
      this.coreAPI.events.on('notes:page:deleted', this.handlePageDeleted.bind(this))
      this.coreAPI.events.on('tasks:task:created', this.handleTaskCreated.bind(this))
      this.coreAPI.events.on('tasks:task:updated', this.handleTaskUpdated.bind(this))
      this.coreAPI.events.on('tasks:task:deleted', this.handleTaskDeleted.bind(this))
    }
  }

  protected async onDeactivate(): Promise<void> {
    console.log('图谱可视化模块停用中...')
    
    // 移除事件监听器
    if (this.coreAPI?.events) {
      this.coreAPI.events.off('notes:page:created', this.handlePageCreated.bind(this))
      this.coreAPI.events.off('notes:page:updated', this.handlePageUpdated.bind(this))
      this.coreAPI.events.off('notes:page:deleted', this.handlePageDeleted.bind(this))
      this.coreAPI.events.off('tasks:task:created', this.handleTaskCreated.bind(this))
      this.coreAPI.events.off('tasks:task:updated', this.handleTaskUpdated.bind(this))
      this.coreAPI.events.off('tasks:task:deleted', this.handleTaskDeleted.bind(this))
    }
  }

  protected async onDestroy(): Promise<void> {
    console.log('图谱可视化模块销毁中...')
    // 清理资源
  }

  /**
   * 获取图谱服务
   */
  getGraphService(): GraphService {
    if (!this.graphService) {
      throw new Error('Graph service not initialized')
    }
    return this.graphService
  }

  /**
   * 处理页面创建事件
   */
  private handlePageCreated(event: any): void {
    console.log('处理页面创建事件:', event)
    // 自动创建图谱节点
  }

  /**
   * 处理页面更新事件
   */
  private handlePageUpdated(event: any): void {
    console.log('处理页面更新事件:', event)
    // 更新图谱节点信息
  }

  /**
   * 处理页面删除事件
   */
  private handlePageDeleted(event: any): void {
    console.log('处理页面删除事件:', event)
    // 删除图谱节点
  }

  /**
   * 处理任务创建事件
   */
  private handleTaskCreated(event: any): void {
    console.log('处理任务创建事件:', event)
    // 自动创建图谱节点
  }

  /**
   * 处理任务更新事件
   */
  private handleTaskUpdated(event: any): void {
    console.log('处理任务更新事件:', event)
    // 更新图谱节点信息
  }

  /**
   * 处理任务删除事件
   */
  private handleTaskDeleted(event: any): void {
    console.log('处理任务删除事件:', event)
    // 删除图谱节点
  }

  /**
   * 获取健康状态
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'warning' | 'error'
    message?: string
    details?: Record<string, any>
  }> {
    const baseStatus = await super.getHealthStatus()
    
    // 检查服务状态
    const serviceHealthy = this.graphService !== undefined
    
    return {
      status: serviceHealthy ? baseStatus.status : 'error',
      message: serviceHealthy ? baseStatus.message : '图谱服务未初始化',
      details: {
        ...baseStatus.details,
        serviceInitialized: serviceHealthy,
        moduleVersion: this.metadata.version
      }
    }
  }
}

export default GraphModule
