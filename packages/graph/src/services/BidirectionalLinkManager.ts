/**
 * 双向链接管理器
 * 负责管理图谱中节点间的双向关联和链接创建
 */

// TODO: 修复@minglog/core导入
// import { EventBus } from '@minglog/core'

// 临时EventBus类型定义
interface EventBus {
  emit(event: string, data: any): void
  on(event: string, handler: (data: any) => void): void
  off(event: string, handler: (data: any) => void): void
}
import { GraphNode, GraphLink, GraphData } from '../types'

export interface LinkCreationRequest {
  /** 源节点ID */
  sourceId: string
  /** 目标节点ID */
  targetId: string
  /** 链接类型 */
  linkType: 'reference' | 'tag' | 'folder' | 'similarity' | 'custom'
  /** 链接强度 (0-1) */
  strength?: number
  /** 链接标签 */
  label?: string
  /** 是否双向 */
  bidirectional?: boolean
  /** 元数据 */
  metadata?: Record<string, any>
}

export interface LinkUpdateRequest {
  /** 链接ID */
  linkId: string
  /** 新的链接类型 */
  linkType?: 'reference' | 'tag' | 'folder' | 'similarity' | 'custom'
  /** 新的链接强度 */
  strength?: number
  /** 新的标签 */
  label?: string
  /** 新的元数据 */
  metadata?: Record<string, any>
}

export interface LinkAnalysis {
  /** 总链接数 */
  totalLinks: number
  /** 双向链接数 */
  bidirectionalLinks: number
  /** 最强连接 */
  strongestLinks: GraphLink[]
  /** 最弱连接 */
  weakestLinks: GraphLink[]
  /** 中心节点 */
  centralNodes: GraphNode[]
  /** 孤立节点 */
  isolatedNodes: GraphNode[]
}

export interface LinkSuggestion {
  /** 建议的目标节点 */
  targetNode: GraphNode
  /** 建议的链接类型 */
  suggestedType: 'reference' | 'tag' | 'folder' | 'similarity'
  /** 建议强度 */
  confidence: number
  /** 建议原因 */
  reason: string
}

/**
 * 双向链接管理器类
 */
export class BidirectionalLinkManager {
  private eventBus: EventBus
  private links: Map<string, GraphLink> = new Map()
  private nodeConnections: Map<string, Set<string>> = new Map()
  private linkIndex: Map<string, Set<string>> = new Map() // nodeId -> linkIds

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus
    this.setupEventListeners()
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    this.eventBus.on('graph:node-added', this.handleNodeAdded.bind(this))
    this.eventBus.on('graph:node-removed', this.handleNodeRemoved.bind(this))
    this.eventBus.on('graph:data-updated', this.handleDataUpdated.bind(this))
  }

  /**
   * 初始化链接数据
   */
  initializeLinks(graphData: GraphData): void {
    this.links.clear()
    this.nodeConnections.clear()
    this.linkIndex.clear()

    // 建立链接索引
    graphData.links.forEach(link => {
      this.links.set(link.id, link)
      this.addToIndex(link)
    })

    // 建立节点连接关系
    this.buildConnectionMap(graphData)
  }

  /**
   * 创建新链接
   */
  async createLink(request: LinkCreationRequest): Promise<GraphLink> {
    // 验证请求
    this.validateLinkRequest(request)

    // 检查是否已存在相同链接
    const existingLink = this.findExistingLink(request.sourceId, request.targetId, request.linkType)
    if (existingLink) {
      throw new Error('链接已存在')
    }

    // 创建链接
    const link: GraphLink = {
      id: this.generateLinkId(),
      source: request.sourceId,
      target: request.targetId,
      type: request.linkType,
      weight: request.strength || this.calculateDefaultStrength(request.linkType),
      label: request.label,
      color: this.getLinkColor(request.linkType),
      strength: request.strength || 0.5
    }

    // 添加到管理器
    this.links.set(link.id, link)
    this.addToIndex(link)
    this.updateConnections(request.sourceId, request.targetId)

    // 创建双向链接
    if (request.bidirectional) {
      const reverseLink = await this.createReverseLink(link)
      this.eventBus.emit('bidirectional-link:created', { 
        originalLink: link, 
        reverseLink,
        metadata: request.metadata 
      })
    } else {
      this.eventBus.emit('link:created', { link, metadata: request.metadata })
    }

    return link
  }

  /**
   * 更新链接
   */
  async updateLink(request: LinkUpdateRequest): Promise<GraphLink> {
    const link = this.links.get(request.linkId)
    if (!link) {
      throw new Error('链接不存在')
    }

    // 更新链接属性
    if (request.linkType) link.type = request.linkType
    if (request.strength !== undefined) {
      link.weight = request.strength
      link.strength = request.strength
    }
    if (request.label !== undefined) link.label = request.label

    // 更新颜色
    if (request.linkType) {
      link.color = this.getLinkColor(request.linkType)
    }

    this.eventBus.emit('link:updated', { link, metadata: request.metadata })
    return link
  }

  /**
   * 删除链接
   */
  async deleteLink(linkId: string): Promise<boolean> {
    const link = this.links.get(linkId)
    if (!link) {
      return false
    }

    // 从索引中移除
    this.removeFromIndex(link)
    this.links.delete(linkId)

    // 更新连接关系
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id
    const targetId = typeof link.target === 'string' ? link.target : link.target.id
    this.removeConnection(sourceId, targetId)

    this.eventBus.emit('link:deleted', { linkId, sourceId, targetId })
    return true
  }

  /**
   * 获取节点的所有链接
   */
  getNodeLinks(nodeId: string): GraphLink[] {
    const linkIds = this.linkIndex.get(nodeId) || new Set()
    return Array.from(linkIds).map(id => this.links.get(id)!).filter(Boolean)
  }

  /**
   * 获取两个节点间的链接
   */
  getLinksBetweenNodes(nodeId1: string, nodeId2: string): GraphLink[] {
    return Array.from(this.links.values()).filter(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id
      const targetId = typeof link.target === 'string' ? link.target : link.target.id
      
      return (sourceId === nodeId1 && targetId === nodeId2) ||
             (sourceId === nodeId2 && targetId === nodeId1)
    })
  }

  /**
   * 获取节点的连接节点
   */
  getConnectedNodes(nodeId: string): string[] {
    return Array.from(this.nodeConnections.get(nodeId) || new Set())
  }

  /**
   * 分析链接网络
   */
  analyzeLinkNetwork(graphData: GraphData): LinkAnalysis {
    const links = Array.from(this.links.values())
    const nodes = graphData.nodes

    // 计算双向链接
    const bidirectionalLinks = this.findBidirectionalLinks()

    // 找出最强和最弱的链接
    const sortedLinks = links.sort((a, b) => (b.weight || 0) - (a.weight || 0))
    const strongestLinks = sortedLinks.slice(0, 5)
    const weakestLinks = sortedLinks.slice(-5).reverse()

    // 计算节点中心性
    const nodeDegrees = new Map<string, number>()
    nodes.forEach(node => {
      const connections = this.getConnectedNodes(node.id)
      nodeDegrees.set(node.id, connections.length)
    })

    const sortedNodes = nodes.sort((a, b) => 
      (nodeDegrees.get(b.id) || 0) - (nodeDegrees.get(a.id) || 0)
    )
    const centralNodes = sortedNodes.slice(0, 5)
    const isolatedNodes = nodes.filter(node => (nodeDegrees.get(node.id) || 0) === 0)

    return {
      totalLinks: links.length,
      bidirectionalLinks: bidirectionalLinks.length,
      strongestLinks,
      weakestLinks,
      centralNodes,
      isolatedNodes
    }
  }

  /**
   * 获取链接建议
   */
  getLinkSuggestions(nodeId: string, graphData: GraphData): LinkSuggestion[] {
    const node = graphData.nodes.find(n => n.id === nodeId)
    if (!node) return []

    const suggestions: LinkSuggestion[] = []
    const connectedNodeIds = new Set(this.getConnectedNodes(nodeId))

    // 基于标签相似性的建议
    if (node.tags) {
      graphData.nodes.forEach(otherNode => {
        if (otherNode.id === nodeId || connectedNodeIds.has(otherNode.id)) return
        
        if (otherNode.tags) {
          const commonTags = node.tags!.filter(tag => otherNode.tags!.includes(tag))
          if (commonTags.length > 0) {
            suggestions.push({
              targetNode: otherNode,
              suggestedType: 'tag',
              confidence: commonTags.length / Math.max(node.tags!.length, otherNode.tags!.length),
              reason: `共同标签: ${commonTags.join(', ')}`
            })
          }
        }
      })
    }

    // 基于类型相似性的建议
    graphData.nodes.forEach(otherNode => {
      if (otherNode.id === nodeId || connectedNodeIds.has(otherNode.id)) return
      
      if (otherNode.type === node.type) {
        suggestions.push({
          targetNode: otherNode,
          suggestedType: 'similarity',
          confidence: 0.6,
          reason: `相同类型: ${node.type}`
        })
      }
    })

    // 按置信度排序并返回前10个
    return suggestions
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10)
  }

  /**
   * 获取所有链接
   */
  getAllLinks(): GraphLink[] {
    return Array.from(this.links.values())
  }

  // 私有方法

  private validateLinkRequest(request: LinkCreationRequest): void {
    if (!request.sourceId || !request.targetId) {
      throw new Error('源节点和目标节点ID不能为空')
    }
    
    if (request.sourceId === request.targetId) {
      throw new Error('不能创建自环链接')
    }

    if (request.strength !== undefined && (request.strength < 0 || request.strength > 1)) {
      throw new Error('链接强度必须在0-1之间')
    }
  }

  private findExistingLink(sourceId: string, targetId: string, linkType: string): GraphLink | null {
    return Array.from(this.links.values()).find(link => {
      const linkSourceId = typeof link.source === 'string' ? link.source : link.source.id
      const linkTargetId = typeof link.target === 'string' ? link.target : link.target.id
      
      return linkSourceId === sourceId && linkTargetId === targetId && link.type === linkType
    }) || null
  }

  private async createReverseLink(originalLink: GraphLink): Promise<GraphLink> {
    const reverseLink: GraphLink = {
      id: this.generateLinkId(),
      source: originalLink.target,
      target: originalLink.source,
      type: originalLink.type,
      weight: originalLink.weight,
      label: originalLink.label ? `反向: ${originalLink.label}` : undefined,
      color: originalLink.color,
      strength: originalLink.strength
    }

    this.links.set(reverseLink.id, reverseLink)
    this.addToIndex(reverseLink)

    return reverseLink
  }

  private generateLinkId(): string {
    return `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private calculateDefaultStrength(linkType: string): number {
    const strengthMap = {
      reference: 0.8,
      tag: 0.6,
      folder: 0.7,
      similarity: 0.4,
      custom: 0.5
    }
    return strengthMap[linkType as keyof typeof strengthMap] || 0.5
  }

  private getLinkColor(linkType: string): string {
    const colorMap = {
      reference: '#9B9B9B',
      tag: '#7ED321',
      folder: '#F5A623',
      similarity: '#50E3C2',
      custom: '#BD10E0'
    }
    return colorMap[linkType as keyof typeof colorMap] || '#999999'
  }

  private addToIndex(link: GraphLink): void {
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id
    const targetId = typeof link.target === 'string' ? link.target : link.target.id

    if (!this.linkIndex.has(sourceId)) {
      this.linkIndex.set(sourceId, new Set())
    }
    if (!this.linkIndex.has(targetId)) {
      this.linkIndex.set(targetId, new Set())
    }

    this.linkIndex.get(sourceId)!.add(link.id)
    this.linkIndex.get(targetId)!.add(link.id)
  }

  private removeFromIndex(link: GraphLink): void {
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id
    const targetId = typeof link.target === 'string' ? link.target : link.target.id

    this.linkIndex.get(sourceId)?.delete(link.id)
    this.linkIndex.get(targetId)?.delete(link.id)
  }

  private buildConnectionMap(graphData: GraphData): void {
    graphData.nodes.forEach(node => {
      this.nodeConnections.set(node.id, new Set())
    })

    graphData.links.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id
      const targetId = typeof link.target === 'string' ? link.target : link.target.id
      
      this.updateConnections(sourceId, targetId)
    })
  }

  private updateConnections(sourceId: string, targetId: string): void {
    if (!this.nodeConnections.has(sourceId)) {
      this.nodeConnections.set(sourceId, new Set())
    }
    if (!this.nodeConnections.has(targetId)) {
      this.nodeConnections.set(targetId, new Set())
    }

    this.nodeConnections.get(sourceId)!.add(targetId)
    this.nodeConnections.get(targetId)!.add(sourceId)
  }

  private removeConnection(sourceId: string, targetId: string): void {
    this.nodeConnections.get(sourceId)?.delete(targetId)
    this.nodeConnections.get(targetId)?.delete(sourceId)
  }

  private findBidirectionalLinks(): GraphLink[] {
    const bidirectionalLinks: GraphLink[] = []
    const processedPairs = new Set<string>()

    Array.from(this.links.values()).forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id
      const targetId = typeof link.target === 'string' ? link.target : link.target.id
      const pairKey = [sourceId, targetId].sort().join('-')

      if (processedPairs.has(pairKey)) return
      processedPairs.add(pairKey)

      const reverseLink = this.findExistingLink(targetId, sourceId, link.type)
      if (reverseLink) {
        bidirectionalLinks.push(link)
      }
    })

    return bidirectionalLinks
  }

  private handleNodeAdded(event: { node: GraphNode }): void {
    this.nodeConnections.set(event.node.id, new Set())
    this.linkIndex.set(event.node.id, new Set())
  }

  private handleNodeRemoved(event: { nodeId: string }): void {
    // 删除相关的所有链接
    const linkIds = Array.from(this.linkIndex.get(event.nodeId) || new Set())
    linkIds.forEach(linkId => {
      this.deleteLink(linkId)
    })

    this.nodeConnections.delete(event.nodeId)
    this.linkIndex.delete(event.nodeId)
  }

  private handleDataUpdated(event: { graphData: GraphData }): void {
    this.initializeLinks(event.graphData)
  }
}

export default BidirectionalLinkManager
