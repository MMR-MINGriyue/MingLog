/**
 * 思维导图核心服务
 * 提供思维导图数据管理和核心业务逻辑
 */

import { MindMapData, MindMapNode, MindMapLink, NodeStyle, LinkStyle } from '../types'
import { OutlineToMindMapConverter } from '../converters/OutlineToMindMap'

export interface IMindMapService {
  /** 创建新的思维导图 */
  createMindMap(blocks: any[]): Promise<MindMapData>
  
  /** 更新思维导图数据 */
  updateMindMap(data: MindMapData): Promise<MindMapData>
  
  /** 添加节点 */
  addNode(data: MindMapData, parentId: string, text: string): Promise<MindMapData>
  
  /** 删除节点 */
  deleteNode(data: MindMapData, nodeId: string): Promise<MindMapData>
  
  /** 更新节点 */
  updateNode(data: MindMapData, nodeId: string, updates: Partial<MindMapNode>): Promise<MindMapData>
  
  /** 更新节点样式 */
  updateNodeStyle(data: MindMapData, nodeId: string, style: Partial<NodeStyle>): Promise<MindMapData>
  
  /** 添加链接 */
  addLink(data: MindMapData, sourceId: string, targetId: string): Promise<MindMapData>
  
  /** 删除链接 */
  deleteLink(data: MindMapData, linkId: string): Promise<MindMapData>
  
  /** 验证思维导图数据 */
  validateData(data: MindMapData): boolean
  
  /** 获取节点路径 */
  getNodePath(data: MindMapData, nodeId: string): MindMapNode[]
  
  /** 搜索节点 */
  searchNodes(data: MindMapData, query: string): MindMapNode[]
}

/**
 * 思维导图服务实现
 */
export class MindMapService implements IMindMapService {
  private converter: OutlineToMindMapConverter

  constructor() {
    this.converter = new OutlineToMindMapConverter()
  }

  async createMindMap(blocks: any[]): Promise<MindMapData> {
    try {
      const data = this.converter.convert(blocks)
      return this.validateAndReturn(data)
    } catch (error) {
      throw new Error(`Failed to create mind map: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async updateMindMap(data: MindMapData): Promise<MindMapData> {
    return this.validateAndReturn(data)
  }

  async addNode(data: MindMapData, parentId: string, text: string): Promise<MindMapData> {
    const parentNode = data.nodes.find(node => node.id === parentId)
    if (!parentNode) {
      throw new Error(`Parent node with id ${parentId} not found`)
    }

    const newNode: MindMapNode = {
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      text,
      level: parentNode.level + 1,
      parentId,
      children: []
    }

    const newLink: MindMapLink = {
      id: `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: parentId,
      target: newNode.id,
      type: 'parent-child'
    }

    const updatedData = {
      ...data,
      nodes: [...data.nodes, newNode],
      links: [...data.links, newLink]
    }

    // 更新父节点的children
    parentNode.children.push(newNode)

    return this.validateAndReturn(updatedData)
  }

  async deleteNode(data: MindMapData, nodeId: string): Promise<MindMapData> {
    if (nodeId === data.rootId) {
      throw new Error('Cannot delete root node')
    }

    // 递归删除子节点
    const nodesToDelete = this.getNodeAndDescendants(data, nodeId)
    const nodeIdsToDelete = new Set(nodesToDelete.map(node => node.id))

    const updatedData = {
      ...data,
      nodes: data.nodes.filter(node => !nodeIdsToDelete.has(node.id)),
      links: data.links.filter(link => 
        !nodeIdsToDelete.has(link.source) && !nodeIdsToDelete.has(link.target)
      )
    }

    return this.validateAndReturn(updatedData)
  }

  async updateNode(data: MindMapData, nodeId: string, updates: Partial<MindMapNode>): Promise<MindMapData> {
    const nodeIndex = data.nodes.findIndex(node => node.id === nodeId)
    if (nodeIndex === -1) {
      throw new Error(`Node with id ${nodeId} not found`)
    }

    const updatedNodes = [...data.nodes]
    updatedNodes[nodeIndex] = { ...updatedNodes[nodeIndex], ...updates }

    const updatedData = {
      ...data,
      nodes: updatedNodes
    }

    return this.validateAndReturn(updatedData)
  }

  async updateNodeStyle(data: MindMapData, nodeId: string, style: Partial<NodeStyle>): Promise<MindMapData> {
    const nodeIndex = data.nodes.findIndex(node => node.id === nodeId)
    if (nodeIndex === -1) {
      throw new Error(`Node with id ${nodeId} not found`)
    }

    const updatedNodes = [...data.nodes]
    updatedNodes[nodeIndex] = {
      ...updatedNodes[nodeIndex],
      style: { ...updatedNodes[nodeIndex].style, ...style }
    }

    const updatedData = {
      ...data,
      nodes: updatedNodes
    }

    return this.validateAndReturn(updatedData)
  }

  async addLink(data: MindMapData, sourceId: string, targetId: string): Promise<MindMapData> {
    const sourceNode = data.nodes.find(node => node.id === sourceId)
    const targetNode = data.nodes.find(node => node.id === targetId)

    if (!sourceNode || !targetNode) {
      throw new Error('Source or target node not found')
    }

    const newLink: MindMapLink = {
      id: `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      source: sourceId,
      target: targetId,
      type: 'reference'
    }

    const updatedData = {
      ...data,
      links: [...data.links, newLink]
    }

    return this.validateAndReturn(updatedData)
  }

  async deleteLink(data: MindMapData, linkId: string): Promise<MindMapData> {
    const updatedData = {
      ...data,
      links: data.links.filter(link => link.id !== linkId)
    }

    return this.validateAndReturn(updatedData)
  }

  validateData(data: MindMapData): boolean {
    // 检查根节点是否存在
    if (!data.rootId || !data.nodes.find(node => node.id === data.rootId)) {
      return false
    }

    // 检查所有链接的节点是否存在
    const nodeIds = new Set(data.nodes.map(node => node.id))
    for (const link of data.links) {
      if (!nodeIds.has(link.source) || !nodeIds.has(link.target)) {
        return false
      }
    }

    return true
  }

  getNodePath(data: MindMapData, nodeId: string): MindMapNode[] {
    const path: MindMapNode[] = []
    let currentNode = data.nodes.find(node => node.id === nodeId)

    while (currentNode) {
      path.unshift(currentNode)
      if (currentNode.parentId) {
        currentNode = data.nodes.find(node => node.id === currentNode!.parentId)
      } else {
        break
      }
    }

    return path
  }

  searchNodes(data: MindMapData, query: string): MindMapNode[] {
    const lowerQuery = query.toLowerCase()
    return data.nodes.filter(node => 
      node.text.toLowerCase().includes(lowerQuery)
    )
  }

  private validateAndReturn(data: MindMapData): MindMapData {
    if (!this.validateData(data)) {
      throw new Error('Invalid mind map data')
    }
    return data
  }

  private getNodeAndDescendants(data: MindMapData, nodeId: string): MindMapNode[] {
    const result: MindMapNode[] = []
    const node = data.nodes.find(n => n.id === nodeId)
    
    if (node) {
      result.push(node)
      
      // 递归获取子节点
      const children = data.nodes.filter(n => n.parentId === nodeId)
      for (const child of children) {
        result.push(...this.getNodeAndDescendants(data, child.id))
      }
    }
    
    return result
  }
}
