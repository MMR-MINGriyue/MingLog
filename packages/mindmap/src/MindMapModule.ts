/**
 * 思维导图模块
 * 提供思维导图的创建、编辑、布局和可视化功能
 */

import { 
  MindMapData, 
  MindMapNode, 
  MindMapLink, 
  LayoutConfig, 
  ExportConfig,
  MindMapTheme 
} from './types'
import { OutlineToMindMapConverter } from './converters/OutlineToMindMap'
import { TreeLayout } from './algorithms/TreeLayout'
import { RadialLayout } from './algorithms/RadialLayout'
import { PngExporter } from './exporters/PngExporter'

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
 * 思维导图服务接口
 */
export interface IMindMapService {
  // 数据管理
  createMindMap(title: string, description?: string): Promise<MindMapData>
  getMindMap(id: string): Promise<MindMapData | null>
  updateMindMap(id: string, data: Partial<MindMapData>): Promise<MindMapData>
  deleteMindMap(id: string): Promise<boolean>
  
  // 节点操作
  addNode(mapId: string, parentId: string, text: string): Promise<MindMapNode>
  updateNode(mapId: string, nodeId: string, updates: Partial<MindMapNode>): Promise<MindMapNode>
  deleteNode(mapId: string, nodeId: string): Promise<boolean>
  moveNode(mapId: string, nodeId: string, newParentId: string): Promise<boolean>
  
  // 布局计算
  calculateLayout(data: MindMapData, config: LayoutConfig): Promise<MindMapData>
  
  // 导入导出
  importFromOutline(blocks: any[]): Promise<MindMapData>
  exportMindMap(data: MindMapData, config: ExportConfig): Promise<Blob | string>
  
  // 搜索和过滤
  searchNodes(mapId: string, query: string): Promise<MindMapNode[]>
  filterNodes(mapId: string, filter: (node: MindMapNode) => boolean): Promise<MindMapNode[]>
}

/**
 * 思维导图服务实现
 */
export class MindMapService implements IMindMapService {
  private converter: OutlineToMindMapConverter
  private treeLayout: TreeLayout
  private radialLayout: RadialLayout
  private pngExporter: PngExporter
  private mindMaps: Map<string, MindMapData> = new Map()

  constructor(private coreAPI?: any) {
    this.converter = new OutlineToMindMapConverter()
    this.treeLayout = new TreeLayout()
    this.radialLayout = new RadialLayout()
    this.pngExporter = new PngExporter()
  }

  async createMindMap(title: string, description?: string): Promise<MindMapData> {
    const id = this.generateId()
    const rootNodeId = this.generateId()
    
    const rootNode: MindMapNode = {
      id: rootNodeId,
      text: title,
      level: 0,
      children: [],
      x: 0,
      y: 0,
      style: {
        backgroundColor: '#3B82F6',
        textColor: '#FFFFFF',
        borderColor: '#1E40AF',
        borderWidth: 2,
        borderRadius: 8,
        fontSize: 16,
        fontWeight: 'bold',
        padding: 12,
        minWidth: 120,
        minHeight: 40
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }

    const mindMapData: MindMapData = {
      nodes: [rootNode],
      links: [],
      rootId: rootNodeId,
      metadata: {
        title,
        description,
        createdAt: new Date(),
        updatedAt: new Date(),
        version: '1.0.0'
      }
    }

    this.mindMaps.set(id, mindMapData)

    // 发送事件
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('mindmap:created', { id, data: mindMapData })
    }

    return mindMapData
  }

  async getMindMap(id: string): Promise<MindMapData | null> {
    return this.mindMaps.get(id) || null
  }

  async updateMindMap(id: string, updates: Partial<MindMapData>): Promise<MindMapData> {
    const existing = this.mindMaps.get(id)
    if (!existing) {
      throw new Error(`MindMap with id ${id} not found`)
    }

    const updated: MindMapData = {
      ...existing,
      ...updates,
      metadata: {
        ...existing.metadata,
        ...updates.metadata,
        updatedAt: new Date()
      }
    }

    this.mindMaps.set(id, updated)

    // 发送事件
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('mindmap:updated', { id, data: updated })
    }

    return updated
  }

  async deleteMindMap(id: string): Promise<boolean> {
    const deleted = this.mindMaps.delete(id)
    
    if (deleted && this.coreAPI?.events) {
      this.coreAPI.events.emit('mindmap:deleted', { id })
    }

    return deleted
  }

  async addNode(mapId: string, parentId: string, text: string): Promise<MindMapNode> {
    const mindMap = this.mindMaps.get(mapId)
    if (!mindMap) {
      throw new Error(`MindMap with id ${mapId} not found`)
    }

    const parentNode = mindMap.nodes.find(n => n.id === parentId)
    if (!parentNode) {
      throw new Error(`Parent node with id ${parentId} not found`)
    }

    const newNode: MindMapNode = {
      id: this.generateId(),
      text,
      level: parentNode.level + 1,
      parentId,
      children: [],
      x: parentNode.x || 0,
      y: (parentNode.y || 0) + 100,
      style: {
        backgroundColor: '#F3F4F6',
        textColor: '#1F2937',
        borderColor: '#D1D5DB',
        borderWidth: 1,
        borderRadius: 6,
        fontSize: 14,
        fontWeight: 'normal',
        padding: 8,
        minWidth: 100,
        minHeight: 32
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }

    // 更新父节点的children数组
    parentNode.children.push(newNode)
    
    // 添加新节点到nodes数组
    mindMap.nodes.push(newNode)

    // 创建链接
    const link: MindMapLink = {
      id: this.generateId(),
      source: parentId,
      target: newNode.id,
      type: 'parent-child',
      style: {
        strokeColor: '#6B7280',
        strokeWidth: 2,
        strokeDasharray: undefined
      }
    }
    mindMap.links.push(link)

    // 更新元数据
    mindMap.metadata = {
      ...mindMap.metadata,
      updatedAt: new Date()
    }

    this.mindMaps.set(mapId, mindMap)

    // 发送事件
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('mindmap:node:added', { 
        mapId, 
        node: newNode, 
        parentId 
      })
    }

    return newNode
  }

  async updateNode(mapId: string, nodeId: string, updates: Partial<MindMapNode>): Promise<MindMapNode> {
    const mindMap = this.mindMaps.get(mapId)
    if (!mindMap) {
      throw new Error(`MindMap with id ${mapId} not found`)
    }

    const nodeIndex = mindMap.nodes.findIndex(n => n.id === nodeId)
    if (nodeIndex === -1) {
      throw new Error(`Node with id ${nodeId} not found`)
    }

    const updatedNode: MindMapNode = {
      ...mindMap.nodes[nodeIndex],
      ...updates,
      metadata: {
        ...mindMap.nodes[nodeIndex].metadata,
        ...updates.metadata,
        updatedAt: new Date()
      }
    }

    mindMap.nodes[nodeIndex] = updatedNode
    mindMap.metadata = {
      ...mindMap.metadata,
      updatedAt: new Date()
    }

    this.mindMaps.set(mapId, mindMap)

    // 发送事件
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('mindmap:node:updated', { 
        mapId, 
        node: updatedNode 
      })
    }

    return updatedNode
  }

  async deleteNode(mapId: string, nodeId: string): Promise<boolean> {
    const mindMap = this.mindMaps.get(mapId)
    if (!mindMap) {
      throw new Error(`MindMap with id ${mapId} not found`)
    }

    // 不能删除根节点
    if (nodeId === mindMap.rootId) {
      throw new Error('Cannot delete root node')
    }

    const nodeToDelete = mindMap.nodes.find(n => n.id === nodeId)
    if (!nodeToDelete) {
      return false
    }

    // 递归删除子节点
    const deleteNodeAndChildren = (node: MindMapNode) => {
      // 删除子节点
      node.children.forEach(child => {
        deleteNodeAndChildren(child)
      })
      
      // 从nodes数组中移除
      const index = mindMap.nodes.findIndex(n => n.id === node.id)
      if (index !== -1) {
        mindMap.nodes.splice(index, 1)
      }
      
      // 删除相关链接
      mindMap.links = mindMap.links.filter(link => 
        link.source !== node.id && link.target !== node.id
      )
    }

    // 从父节点的children中移除
    if (nodeToDelete.parentId) {
      const parentNode = mindMap.nodes.find(n => n.id === nodeToDelete.parentId)
      if (parentNode) {
        const childIndex = parentNode.children.findIndex(child => child.id === nodeId)
        if (childIndex !== -1) {
          parentNode.children.splice(childIndex, 1)
        }
      }
    }

    deleteNodeAndChildren(nodeToDelete)

    mindMap.metadata = {
      ...mindMap.metadata,
      updatedAt: new Date()
    }

    this.mindMaps.set(mapId, mindMap)

    // 发送事件
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('mindmap:node:deleted', { 
        mapId, 
        nodeId 
      })
    }

    return true
  }

  async moveNode(mapId: string, nodeId: string, newParentId: string): Promise<boolean> {
    const mindMap = this.mindMaps.get(mapId)
    if (!mindMap) {
      throw new Error(`MindMap with id ${mapId} not found`)
    }

    const node = mindMap.nodes.find(n => n.id === nodeId)
    const newParent = mindMap.nodes.find(n => n.id === newParentId)
    
    if (!node || !newParent) {
      return false
    }

    // 不能移动根节点
    if (nodeId === mindMap.rootId) {
      throw new Error('Cannot move root node')
    }

    // 不能移动到自己的子节点
    const isDescendant = (parentNode: MindMapNode, targetId: string): boolean => {
      return parentNode.children.some(child => 
        child.id === targetId || isDescendant(child, targetId)
      )
    }

    if (isDescendant(node, newParentId)) {
      throw new Error('Cannot move node to its descendant')
    }

    // 从原父节点移除
    if (node.parentId) {
      const oldParent = mindMap.nodes.find(n => n.id === node.parentId)
      if (oldParent) {
        const childIndex = oldParent.children.findIndex(child => child.id === nodeId)
        if (childIndex !== -1) {
          oldParent.children.splice(childIndex, 1)
        }
      }
    }

    // 添加到新父节点
    newParent.children.push(node)
    node.parentId = newParentId
    node.level = newParent.level + 1

    // 更新链接
    mindMap.links = mindMap.links.filter(link => link.target !== nodeId)
    mindMap.links.push({
      id: this.generateId(),
      source: newParentId,
      target: nodeId,
      type: 'parent-child',
      style: {
        strokeColor: '#6B7280',
        strokeWidth: 2
      }
    })

    mindMap.metadata = {
      ...mindMap.metadata,
      updatedAt: new Date()
    }

    this.mindMaps.set(mapId, mindMap)

    // 发送事件
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('mindmap:node:moved', { 
        mapId, 
        nodeId, 
        oldParentId: node.parentId, 
        newParentId 
      })
    }

    return true
  }

  async calculateLayout(data: MindMapData, config: LayoutConfig): Promise<MindMapData> {
    let layoutAlgorithm

    switch (config.type) {
      case 'tree':
        layoutAlgorithm = this.treeLayout
        break
      case 'radial':
        layoutAlgorithm = this.radialLayout
        break
      default:
        layoutAlgorithm = this.treeLayout
    }

    return layoutAlgorithm.calculate(data, config)
  }

  async importFromOutline(blocks: any[]): Promise<MindMapData> {
    return this.converter.convert(blocks)
  }

  async exportMindMap(data: MindMapData, config: ExportConfig): Promise<Blob | string> {
    switch (config.format) {
      case 'png':
        return this.pngExporter.export(data, config)
      case 'json':
        return JSON.stringify(data, null, 2)
      default:
        throw new Error(`Unsupported export format: ${config.format}`)
    }
  }

  async searchNodes(mapId: string, query: string): Promise<MindMapNode[]> {
    const mindMap = this.mindMaps.get(mapId)
    if (!mindMap) {
      return []
    }

    const lowerQuery = query.toLowerCase()
    return mindMap.nodes.filter(node => 
      node.text.toLowerCase().includes(lowerQuery) ||
      node.metadata?.tags?.some(tag => tag.toLowerCase().includes(lowerQuery))
    )
  }

  async filterNodes(mapId: string, filter: (node: MindMapNode) => boolean): Promise<MindMapNode[]> {
    const mindMap = this.mindMaps.get(mapId)
    if (!mindMap) {
      return []
    }

    return mindMap.nodes.filter(filter)
  }

  private generateId(): string {
    return `mindmap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

/**
 * 思维导图模块主类
 */
export class MindMapModule extends BaseModule {
  private mindMapService!: MindMapService

  constructor(config?: Partial<IModuleConfig>) {
    const metadata: IModuleMetadata = {
      id: 'mindmap',
      name: '思维导图',
      version: '1.0.0',
      description: '提供思维导图的创建、编辑、布局和可视化功能',
      author: 'MingLog Team',
      icon: '🧠',
      tags: ['mindmap', 'visualization', 'thinking'],
      dependencies: [],
      optionalDependencies: ['notes', 'graph']
    }

    super(metadata, config)
  }

  protected async onInitialize(): Promise<void> {
    console.log('思维导图模块初始化中...')
    
    // 初始化思维导图服务
    this.mindMapService = new MindMapService(this.coreAPI)
  }

  protected async onActivate(): Promise<void> {
    console.log('思维导图模块激活中...')
    
    // 注册事件监听器
    if (this.coreAPI?.events) {
      this.coreAPI.events.on('notes:block:created', this.handleBlockCreated.bind(this))
      this.coreAPI.events.on('notes:block:updated', this.handleBlockUpdated.bind(this))
    }
  }

  protected async onDeactivate(): Promise<void> {
    console.log('思维导图模块停用中...')
    
    // 移除事件监听器
    if (this.coreAPI?.events) {
      this.coreAPI.events.off('notes:block:created', this.handleBlockCreated.bind(this))
      this.coreAPI.events.off('notes:block:updated', this.handleBlockUpdated.bind(this))
    }
  }

  protected async onDestroy(): Promise<void> {
    console.log('思维导图模块销毁中...')
    // 清理资源
  }

  /**
   * 获取思维导图服务
   */
  getMindMapService(): MindMapService {
    if (!this.mindMapService) {
      throw new Error('MindMap service not initialized')
    }
    return this.mindMapService
  }

  /**
   * 处理笔记块创建事件
   */
  private handleBlockCreated(event: any): void {
    // 当创建新的笔记块时，可以自动更新相关的思维导图
    console.log('处理笔记块创建事件:', event)
  }

  /**
   * 处理笔记块更新事件
   */
  private handleBlockUpdated(event: any): void {
    // 当更新笔记块时，可以自动更新相关的思维导图
    console.log('处理笔记块更新事件:', event)
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
    const serviceHealthy = this.mindMapService !== undefined
    
    return {
      status: serviceHealthy ? baseStatus.status : 'error',
      message: serviceHealthy ? baseStatus.message : '思维导图服务未初始化',
      details: {
        ...baseStatus.details,
        serviceInitialized: serviceHealthy,
        moduleVersion: this.metadata.version
      }
    }
  }
}

export default MindMapModule
