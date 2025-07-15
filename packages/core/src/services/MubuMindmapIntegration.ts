/**
 * 幕布-思维导图集成服务
 * 实现幕布编辑器与思维导图模块的深度集成
 */

import { EventEmitter } from 'events'
// import { CustomElement, BlockMetadata } from '@minglog/editor' // 模块不存在，暂时注释

// 临时类型定义
interface CustomElement {
  id: string
  type: string
  content?: string
  children?: CustomElement[]
  metadata?: BlockMetadata
  [key: string]: any
}

interface BlockMetadata {
  tags?: string[]
  status?: string
  priority?: number
  [key: string]: any
}
import { CrossModuleEventBus, EventType } from './CrossModuleEventBus'
import { EnhancedCrossModuleLinkService, LinkType } from './EnhancedCrossModuleLinkService'
import { EntityType } from './DataAssociationService'

// 思维导图节点接口
export interface MindmapNode {
  id: string
  title: string
  content?: string
  level: number
  parentId?: string
  children: MindmapNode[]
  position?: { x: number; y: number }
  style?: {
    color?: string
    backgroundColor?: string
    fontSize?: number
    fontWeight?: string
  }
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

// 幕布块到思维导图节点的转换配置
export interface ConversionConfig {
  preserveHierarchy: boolean      // 保持层级结构
  includeContent: boolean         // 包含内容
  autoLayout: boolean            // 自动布局
  styleMapping: {                // 样式映射
    [level: number]: {
      color?: string
      backgroundColor?: string
      fontSize?: number
      fontWeight?: string
    }
  }
  maxDepth?: number              // 最大深度
  filterEmptyBlocks: boolean     // 过滤空块
}

// 转换结果
export interface ConversionResult {
  mindmapNodes: MindmapNode[]
  rootNode: MindmapNode
  totalNodes: number
  maxDepth: number
  conversionTime: number
  warnings: string[]
}

// 同步状态
export interface SyncStatus {
  isEnabled: boolean
  lastSyncTime: Date
  syncDirection: 'mubu-to-mindmap' | 'mindmap-to-mubu' | 'bidirectional'
  conflictResolution: 'mubu-wins' | 'mindmap-wins' | 'manual'
}

/**
 * 幕布-思维导图集成服务
 */
export class MubuMindmapIntegration extends EventEmitter {
  private syncStatus: Map<string, SyncStatus> = new Map()
  private conversionCache: Map<string, ConversionResult> = new Map()
  private defaultConfig: ConversionConfig

  constructor(
    private eventBus: CrossModuleEventBus,
    private linkService: EnhancedCrossModuleLinkService
  ) {
    super()
    
    this.defaultConfig = {
      preserveHierarchy: true,
      includeContent: true,
      autoLayout: true,
      styleMapping: {
        0: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
        1: { fontSize: 16, fontWeight: '600', color: '#374151' },
        2: { fontSize: 14, fontWeight: '500', color: '#4b5563' },
        3: { fontSize: 12, fontWeight: 'normal', color: '#6b7280' }
      },
      maxDepth: 6,
      filterEmptyBlocks: true
    }

    this.setupEventListeners()
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听幕布编辑器变更
    this.eventBus.on(EventType.NOTE_UPDATED, this.handleMubuChange.bind(this))
    
    // 监听思维导图变更
    this.eventBus.on(EventType.MINDMAP_NODE_UPDATED, this.handleMindmapChange.bind(this))
    this.eventBus.on(EventType.MINDMAP_NODE_ADDED, this.handleMindmapChange.bind(this))
    this.eventBus.on(EventType.MINDMAP_NODE_REMOVED, this.handleMindmapChange.bind(this))
  }

  /**
   * 将幕布块结构转换为思维导图
   */
  async convertMubuToMindmap(
    mubuBlocks: CustomElement[],
    config: Partial<ConversionConfig> = {}
  ): Promise<ConversionResult> {
    const startTime = Date.now()
    const finalConfig = { ...this.defaultConfig, ...config }
    const warnings: string[] = []

    try {
      // 1. 预处理幕布块
      const processedBlocks = this.preprocessMubuBlocks(mubuBlocks, finalConfig, warnings)

      // 2. 构建层级结构
      const hierarchyTree = this.buildHierarchyTree(processedBlocks)

      // 3. 转换为思维导图节点
      const mindmapNodes = this.convertToMindmapNodes(hierarchyTree, finalConfig)

      // 4. 应用布局算法
      if (finalConfig.autoLayout) {
        this.applyAutoLayout(mindmapNodes)
      }

      // 5. 创建根节点
      const rootNode = this.createRootNode(mindmapNodes)

      const result: ConversionResult = {
        mindmapNodes,
        rootNode,
        totalNodes: mindmapNodes.length,
        maxDepth: this.calculateMaxDepth(mindmapNodes),
        conversionTime: Date.now() - startTime,
        warnings
      }

      // 缓存结果
      const cacheKey = this.generateCacheKey(mubuBlocks, finalConfig)
      this.conversionCache.set(cacheKey, result)

      // 发送事件
      this.emit('conversion:completed', {
        type: 'mubu-to-mindmap',
        result
      })

      return result

    } catch (error) {
      this.emit('conversion:error', {
        type: 'mubu-to-mindmap',
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * 将思维导图转换为幕布块结构
   */
  async convertMindmapToMubu(
    mindmapNodes: MindmapNode[],
    config: Partial<ConversionConfig> = {}
  ): Promise<CustomElement[]> {
    const finalConfig = { ...this.defaultConfig, ...config }

    try {
      // 1. 排序节点（按层级和位置）
      const sortedNodes = this.sortMindmapNodes(mindmapNodes)

      // 2. 转换为幕布块
      const mubuBlocks = this.convertToMubuBlocks(sortedNodes, finalConfig)

      // 3. 应用幕布特定的元数据
      this.applyMubuMetadata(mubuBlocks)

      // 发送事件
      this.emit('conversion:completed', {
        type: 'mindmap-to-mubu',
        result: mubuBlocks
      })

      return mubuBlocks

    } catch (error) {
      this.emit('conversion:error', {
        type: 'mindmap-to-mubu',
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * 启用双向同步
   */
  async enableBidirectionalSync(
    mubuDocumentId: string,
    mindmapId: string,
    options: {
      syncDirection?: SyncStatus['syncDirection']
      conflictResolution?: SyncStatus['conflictResolution']
      autoSync?: boolean
    } = {}
  ): Promise<void> {
    const syncStatus: SyncStatus = {
      isEnabled: true,
      lastSyncTime: new Date(),
      syncDirection: options.syncDirection || 'bidirectional',
      conflictResolution: options.conflictResolution || 'manual'
    }

    const syncKey = `${mubuDocumentId}:${mindmapId}`
    this.syncStatus.set(syncKey, syncStatus)

    // 创建跨模块链接
    await this.linkService.createEnhancedLink(
      mubuDocumentId,
      mindmapId,
      LinkType.BIDIRECTIONAL,
      {
        context: 'mubu-mindmap-sync',
        tags: ['sync', 'bidirectional']
      }
    )

    // 如果启用自动同步，执行初始同步
    if (options.autoSync) {
      await this.performSync(mubuDocumentId, mindmapId)
    }

    this.emit('sync:enabled', { mubuDocumentId, mindmapId, syncStatus })
  }

  /**
   * 执行同步
   */
  async performSync(mubuDocumentId: string, mindmapId: string): Promise<void> {
    const syncKey = `${mubuDocumentId}:${mindmapId}`
    const syncStatus = this.syncStatus.get(syncKey)

    if (!syncStatus?.isEnabled) {
      throw new Error('Sync is not enabled for this pair')
    }

    try {
      // 获取最新数据
      const mubuData = await this.getMubuData(mubuDocumentId)
      const mindmapData = await this.getMindmapData(mindmapId)

      // 检测冲突
      const conflicts = await this.detectConflicts(mubuData, mindmapData, syncStatus.lastSyncTime)

      if (conflicts.length > 0) {
        await this.resolveConflicts(conflicts, syncStatus.conflictResolution)
      }

      // 执行同步
      switch (syncStatus.syncDirection) {
        case 'mubu-to-mindmap':
          await this.syncMubuToMindmap(mubuDocumentId, mindmapId)
          break
        case 'mindmap-to-mubu':
          await this.syncMindmapToMubu(mubuDocumentId, mindmapId)
          break
        case 'bidirectional':
          await this.syncBidirectional(mubuDocumentId, mindmapId)
          break
      }

      // 更新同步状态
      syncStatus.lastSyncTime = new Date()
      this.syncStatus.set(syncKey, syncStatus)

      this.emit('sync:completed', { mubuDocumentId, mindmapId })

    } catch (error) {
      this.emit('sync:error', {
        mubuDocumentId,
        mindmapId,
        error: error instanceof Error ? error.message : String(error)
      })
      throw error
    }
  }

  /**
   * 智能布局建议
   */
  async suggestOptimalLayout(mindmapNodes: MindmapNode[]): Promise<{
    layoutType: 'radial' | 'tree' | 'force' | 'hierarchical'
    reasoning: string
    estimatedPerformance: number
  }> {
    const nodeCount = mindmapNodes.length
    const maxDepth = this.calculateMaxDepth(mindmapNodes)
    const avgBranching = this.calculateAverageBranching(mindmapNodes)

    // 基于节点特征推荐布局
    if (nodeCount < 20 && maxDepth <= 3) {
      return {
        layoutType: 'radial',
        reasoning: '节点数量较少且层级简单，径向布局最适合',
        estimatedPerformance: 0.9
      }
    } else if (maxDepth > 5 && avgBranching < 3) {
      return {
        layoutType: 'tree',
        reasoning: '深层级且分支较少，树形布局更清晰',
        estimatedPerformance: 0.85
      }
    } else if (nodeCount > 50) {
      return {
        layoutType: 'force',
        reasoning: '节点数量较多，力导向布局能更好地处理复杂关系',
        estimatedPerformance: 0.75
      }
    } else {
      return {
        layoutType: 'hierarchical',
        reasoning: '中等复杂度，层级布局提供最佳平衡',
        estimatedPerformance: 0.8
      }
    }
  }

  // 私有辅助方法
  private preprocessMubuBlocks(
    blocks: CustomElement[],
    config: ConversionConfig,
    warnings: string[]
  ): CustomElement[] {
    let processed = [...blocks]

    // 过滤空块
    if (config.filterEmptyBlocks) {
      processed = processed.filter(block => {
        const hasContent = block.children.some(child => 
          'text' in child && child.text.trim().length > 0
        )
        if (!hasContent) {
          warnings.push(`过滤了空块: ${block.id}`)
        }
        return hasContent
      })
    }

    // 限制深度
    if (config.maxDepth) {
      processed = processed.filter(block => {
        const level = block.level || 0
        if (level > config.maxDepth!) {
          warnings.push(`块 ${block.id} 超过最大深度 ${config.maxDepth}`)
          return false
        }
        return true
      })
    }

    return processed
  }

  private buildHierarchyTree(blocks: CustomElement[]): CustomElement[] {
    // 构建层级树结构
    const rootBlocks: CustomElement[] = []
    const blockMap = new Map(blocks.map(block => [block.id, block]))

    for (const block of blocks) {
      if (!block.parentId || !blockMap.has(block.parentId)) {
        rootBlocks.push(block)
      }
    }

    return rootBlocks
  }

  private convertToMindmapNodes(
    blocks: CustomElement[],
    config: ConversionConfig
  ): MindmapNode[] {
    return blocks.map(block => this.blockToMindmapNode(block, config))
  }

  private blockToMindmapNode(block: CustomElement, config: ConversionConfig): MindmapNode {
    const level = block.level || 0
    const style = config.styleMapping[level] || config.styleMapping[0]

    return {
      id: block.id,
      title: this.extractBlockTitle(block),
      content: config.includeContent ? this.extractBlockContent(block) : undefined,
      level,
      parentId: block.parentId,
      children: [],
      style,
      metadata: block.metadata,
      createdAt: new Date(block.createdAt || Date.now()),
      updatedAt: new Date(block.updatedAt || Date.now())
    }
  }

  private extractBlockTitle(block: CustomElement): string {
    // 从块中提取标题
    const textContent = block.children
      .filter(child => 'text' in child)
      .map(child => (child as any).text)
      .join('')
    
    return textContent.split('\n')[0] || '未命名块'
  }

  private extractBlockContent(block: CustomElement): string {
    // 从块中提取完整内容
    return block.children
      .filter(child => 'text' in child)
      .map(child => (child as any).text)
      .join('')
  }

  private applyAutoLayout(nodes: MindmapNode[]): void {
    // 应用自动布局算法
    // 这里实现简单的树形布局
    const rootNodes = nodes.filter(node => !node.parentId)
    
    rootNodes.forEach((root, index) => {
      root.position = { x: index * 200, y: 0 }
      this.layoutChildren(root, nodes, 1)
    })
  }

  private layoutChildren(parent: MindmapNode, allNodes: MindmapNode[], level: number): void {
    const children = allNodes.filter(node => node.parentId === parent.id)
    const angleStep = children.length > 1 ? (2 * Math.PI) / children.length : 0
    const radius = level * 100

    children.forEach((child, index) => {
      const angle = index * angleStep
      child.position = {
        x: parent.position!.x + Math.cos(angle) * radius,
        y: parent.position!.y + Math.sin(angle) * radius
      }
      
      this.layoutChildren(child, allNodes, level + 1)
    })
  }

  private createRootNode(nodes: MindmapNode[]): MindmapNode {
    return {
      id: 'root',
      title: '根节点',
      level: -1,
      children: nodes.filter(node => !node.parentId),
      position: { x: 0, y: 0 },
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }

  private calculateMaxDepth(nodes: MindmapNode[]): number {
    return Math.max(...nodes.map(node => node.level), 0)
  }

  private calculateAverageBranching(nodes: MindmapNode[]): number {
    const parentCounts = new Map<string, number>()
    
    nodes.forEach(node => {
      if (node.parentId) {
        parentCounts.set(node.parentId, (parentCounts.get(node.parentId) || 0) + 1)
      }
    })

    const counts = Array.from(parentCounts.values())
    return counts.length > 0 ? counts.reduce((a, b) => a + b, 0) / counts.length : 0
  }

  private sortMindmapNodes(nodes: MindmapNode[]): MindmapNode[] {
    // 按层级和位置排序
    return nodes.sort((a, b) => {
      if (a.level !== b.level) return a.level - b.level
      if (a.position && b.position) {
        return a.position.y - b.position.y || a.position.x - b.position.x
      }
      return 0
    })
  }

  private convertToMubuBlocks(nodes: MindmapNode[], config: ConversionConfig): CustomElement[] {
    return nodes.map(node => this.mindmapNodeToBlock(node, config))
  }

  private mindmapNodeToBlock(node: MindmapNode, config: ConversionConfig): CustomElement {
    return {
      id: node.id,
      type: 'paragraph',
      level: node.level,
      parentId: node.parentId,
      children: [{ text: node.content || node.title }],
      metadata: node.metadata,
      createdAt: node.createdAt.toISOString(),
      updatedAt: node.updatedAt.toISOString()
    }
  }

  private applyMubuMetadata(blocks: CustomElement[]): void {
    // 应用幕布特定的元数据
    blocks.forEach(block => {
      if (!block.metadata) block.metadata = {}
      
      block.metadata.isMubuBlock = true
      block.metadata.hasChildren = blocks.some(b => b.parentId === block.id)
      block.metadata.siblingIndex = this.calculateSiblingIndex(block, blocks)
    })
  }

  private calculateSiblingIndex(block: CustomElement, allBlocks: CustomElement[]): number {
    const siblings = allBlocks.filter(b => b.parentId === block.parentId)
    return siblings.findIndex(b => b.id === block.id)
  }

  private generateCacheKey(blocks: CustomElement[], config: ConversionConfig): string {
    const blockHash = blocks.map(b => `${b.id}:${b.updatedAt}`).join('|')
    const configHash = JSON.stringify(config)
    return `${blockHash}:${configHash}`
  }

  private async handleMubuChange(event: any): Promise<void> {
    // 处理幕布变更事件
    // 实现自动同步逻辑
  }

  private async handleMindmapChange(event: any): Promise<void> {
    // 处理思维导图变更事件
    // 实现自动同步逻辑
  }

  private async getMubuData(documentId: string): Promise<CustomElement[]> {
    // 获取幕布数据
    return []
  }

  private async getMindmapData(mindmapId: string): Promise<MindmapNode[]> {
    // 获取思维导图数据
    return []
  }

  private async detectConflicts(mubuData: any, mindmapData: any, lastSyncTime: Date): Promise<any[]> {
    // 检测冲突
    return []
  }

  private async resolveConflicts(conflicts: any[], resolution: SyncStatus['conflictResolution']): Promise<void> {
    // 解决冲突
  }

  private async syncMubuToMindmap(mubuDocumentId: string, mindmapId: string): Promise<void> {
    // 单向同步：幕布到思维导图
  }

  private async syncMindmapToMubu(mubuDocumentId: string, mindmapId: string): Promise<void> {
    // 单向同步：思维导图到幕布
  }

  private async syncBidirectional(mubuDocumentId: string, mindmapId: string): Promise<void> {
    // 双向同步
  }
}

export default MubuMindmapIntegration
