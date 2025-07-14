/**
 * 布局服务
 * 提供多种思维导图布局算法
 */

import { MindMapData, MindMapNode, LayoutConfig, LayoutType } from '../types'

export interface ILayoutService {
  // 布局计算
  calculateLayout(data: MindMapData, config: LayoutConfig): Promise<MindMapData>
  getAvailableLayouts(): LayoutType[]
  getLayoutConfig(layoutType: LayoutType): LayoutConfig
  
  // 布局优化
  optimizeLayout(data: MindMapData, config: LayoutConfig): Promise<MindMapData>
  autoLayout(data: MindMapData): Promise<MindMapData>
  
  // 布局验证
  validateLayout(data: MindMapData): boolean
  fixOverlaps(data: MindMapData): Promise<MindMapData>
}

export class LayoutService implements ILayoutService {
  private coreAPI: any

  constructor(coreAPI?: any) {
    this.coreAPI = coreAPI
  }

  async calculateLayout(data: MindMapData, config: LayoutConfig): Promise<MindMapData> {
    const layoutData = { ...data }

    switch (config.type) {
      case 'tree':
        return this.calculateTreeLayout(layoutData, config)
      case 'radial':
        return this.calculateRadialLayout(layoutData, config)
      case 'force':
        return this.calculateForceLayout(layoutData, config)
      case 'hierarchical':
        return this.calculateHierarchicalLayout(layoutData, config)
      case 'circular':
        return this.calculateCircularLayout(layoutData, config)
      default:
        return this.calculateTreeLayout(layoutData, config)
    }
  }

  getAvailableLayouts(): LayoutType[] {
    return ['tree', 'radial', 'force', 'hierarchical', 'circular']
  }

  getLayoutConfig(layoutType: LayoutType): LayoutConfig {
    const baseConfig = {
      type: layoutType,
      spacing: { x: 150, y: 100 },
      padding: { top: 50, right: 50, bottom: 50, left: 50 },
      nodeSize: { width: 120, height: 40 },
      animation: { enabled: true, duration: 500, easing: 'ease-in-out' }
    }

    switch (layoutType) {
      case 'tree':
        return {
          ...baseConfig,
          direction: 'horizontal',
          alignment: 'center'
        }
      case 'radial':
        return {
          ...baseConfig,
          radius: 200,
          startAngle: 0,
          endAngle: 360
        }
      case 'force':
        return {
          ...baseConfig,
          strength: 0.5,
          distance: 100,
          iterations: 100
        }
      case 'hierarchical':
        return {
          ...baseConfig,
          direction: 'vertical',
          levelSeparation: 150,
          nodeSeparation: 100
        }
      case 'circular':
        return {
          ...baseConfig,
          radius: 300,
          startAngle: 0
        }
      default:
        return baseConfig
    }
  }

  async optimizeLayout(data: MindMapData, config: LayoutConfig): Promise<MindMapData> {
    let optimizedData = await this.calculateLayout(data, config)
    
    // 检查并修复重叠
    optimizedData = await this.fixOverlaps(optimizedData)
    
    // 优化节点间距
    optimizedData = this.optimizeSpacing(optimizedData, config)
    
    // 居中布局
    optimizedData = this.centerLayout(optimizedData)
    
    return optimizedData
  }

  async autoLayout(data: MindMapData): Promise<MindMapData> {
    // 根据节点数量和结构自动选择最佳布局
    const nodeCount = data.nodes.length
    const maxDepth = this.calculateMaxDepth(data)
    
    let layoutType: LayoutType
    
    if (nodeCount <= 10) {
      layoutType = 'radial'
    } else if (maxDepth <= 3) {
      layoutType = 'tree'
    } else if (nodeCount > 50) {
      layoutType = 'force'
    } else {
      layoutType = 'hierarchical'
    }
    
    const config = this.getLayoutConfig(layoutType)
    return this.calculateLayout(data, config)
  }

  validateLayout(data: MindMapData): boolean {
    // 检查所有节点是否有有效的位置
    for (const node of data.nodes) {
      if (node.x === undefined || node.y === undefined || 
          isNaN(node.x) || isNaN(node.y)) {
        return false
      }
    }
    
    // 检查是否有严重重叠
    const overlaps = this.detectOverlaps(data)
    return overlaps.length < data.nodes.length * 0.1 // 允许少量重叠
  }

  async fixOverlaps(data: MindMapData): Promise<MindMapData> {
    const fixedData = { ...data }
    const overlaps = this.detectOverlaps(fixedData)
    
    for (const overlap of overlaps) {
      const node1 = fixedData.nodes.find(n => n.id === overlap.node1Id)!
      const node2 = fixedData.nodes.find(n => n.id === overlap.node2Id)!
      
      // 计算分离向量
      const dx = node2.x! - node1.x!
      const dy = node2.y! - node1.y!
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      if (distance < overlap.minDistance) {
        const separationDistance = overlap.minDistance - distance + 10
        const separationX = (dx / distance) * separationDistance / 2
        const separationY = (dy / distance) * separationDistance / 2
        
        node1.x! -= separationX
        node1.y! -= separationY
        node2.x! += separationX
        node2.y! += separationY
      }
    }
    
    return fixedData
  }

  private async calculateTreeLayout(data: MindMapData, config: LayoutConfig): Promise<MindMapData> {
    const layoutData = { ...data }
    const nodeMap = new Map<string, MindMapNode>()
    
    // 构建节点映射
    layoutData.nodes.forEach(node => {
      nodeMap.set(node.id, { ...node })
    })
    
    // 找到根节点
    const rootNode = nodeMap.get(layoutData.rootId)
    if (!rootNode) {
      throw new Error('Root node not found')
    }
    
    // 构建树结构
    this.buildTree(layoutData.nodes, nodeMap)
    
    // 计算树布局
    const spacing = config.spacing || { x: 150, y: 100 }
    const direction = config.direction || 'horizontal'
    
    if (direction === 'horizontal') {
      this.calculateHorizontalTreeLayout(rootNode, nodeMap, spacing, 0, 0)
    } else {
      this.calculateVerticalTreeLayout(rootNode, nodeMap, spacing, 0, 0)
    }
    
    // 更新节点位置
    layoutData.nodes = Array.from(nodeMap.values())
    
    return layoutData
  }

  private async calculateRadialLayout(data: MindMapData, config: LayoutConfig): Promise<MindMapData> {
    const layoutData = { ...data }
    const nodeMap = new Map<string, MindMapNode>()
    
    layoutData.nodes.forEach(node => {
      nodeMap.set(node.id, { ...node })
    })
    
    const rootNode = nodeMap.get(layoutData.rootId)
    if (!rootNode) {
      throw new Error('Root node not found')
    }
    
    // 根节点位于中心
    rootNode.x = 0
    rootNode.y = 0
    
    // 构建层级
    const levels = this.buildLevels(layoutData.nodes, layoutData.rootId)
    const radius = config.radius || 200
    
    // 为每一层计算径向位置
    for (let level = 1; level < levels.length; level++) {
      const levelNodes = levels[level]
      const levelRadius = radius * level
      const angleStep = (2 * Math.PI) / levelNodes.length
      
      levelNodes.forEach((node, index) => {
        const angle = index * angleStep
        node.x = Math.cos(angle) * levelRadius
        node.y = Math.sin(angle) * levelRadius
      })
    }
    
    layoutData.nodes = Array.from(nodeMap.values())
    return layoutData
  }

  private async calculateForceLayout(data: MindMapData, config: LayoutConfig): Promise<MindMapData> {
    const layoutData = { ...data }
    const nodes = layoutData.nodes.map(node => ({ ...node }))
    
    const strength = config.strength || 0.5
    const distance = config.distance || 100
    const iterations = config.iterations || 100
    
    // 初始化随机位置
    nodes.forEach(node => {
      if (node.x === undefined) node.x = Math.random() * 400 - 200
      if (node.y === undefined) node.y = Math.random() * 400 - 200
    })
    
    // 力导向算法迭代
    for (let i = 0; i < iterations; i++) {
      // 计算排斥力
      for (let j = 0; j < nodes.length; j++) {
        for (let k = j + 1; k < nodes.length; k++) {
          const node1 = nodes[j]
          const node2 = nodes[k]
          
          const dx = node2.x! - node1.x!
          const dy = node2.y! - node1.y!
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          
          const force = strength * distance * distance / (dist * dist)
          const fx = (dx / dist) * force
          const fy = (dy / dist) * force
          
          node1.x! -= fx
          node1.y! -= fy
          node2.x! += fx
          node2.y! += fy
        }
      }
      
      // 计算吸引力（基于链接）
      for (const link of layoutData.links) {
        const source = nodes.find(n => n.id === link.source)!
        const target = nodes.find(n => n.id === link.target)!
        
        const dx = target.x! - source.x!
        const dy = target.y! - source.y!
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        
        const force = (dist - distance) * strength
        const fx = (dx / dist) * force * 0.5
        const fy = (dy / dist) * force * 0.5
        
        source.x! += fx
        source.y! += fy
        target.x! -= fx
        target.y! -= fy
      }
    }
    
    layoutData.nodes = nodes
    return layoutData
  }

  private async calculateHierarchicalLayout(data: MindMapData, config: LayoutConfig): Promise<MindMapData> {
    const layoutData = { ...data }
    const levels = this.buildLevels(layoutData.nodes, layoutData.rootId)
    
    const levelSeparation = config.levelSeparation || 150
    const nodeSeparation = config.nodeSeparation || 100
    const direction = config.direction || 'vertical'
    
    for (let level = 0; level < levels.length; level++) {
      const levelNodes = levels[level]
      const totalWidth = (levelNodes.length - 1) * nodeSeparation
      const startX = -totalWidth / 2
      
      levelNodes.forEach((node, index) => {
        if (direction === 'vertical') {
          node.x = startX + index * nodeSeparation
          node.y = level * levelSeparation
        } else {
          node.x = level * levelSeparation
          node.y = startX + index * nodeSeparation
        }
      })
    }
    
    return layoutData
  }

  private async calculateCircularLayout(data: MindMapData, config: LayoutConfig): Promise<MindMapData> {
    const layoutData = { ...data }
    const nodes = layoutData.nodes.filter(node => node.id !== layoutData.rootId)
    const rootNode = layoutData.nodes.find(node => node.id === layoutData.rootId)!
    
    const radius = config.radius || 300
    const startAngle = config.startAngle || 0
    const angleStep = (2 * Math.PI) / nodes.length
    
    // 根节点位于中心
    rootNode.x = 0
    rootNode.y = 0
    
    // 其他节点围成圆形
    nodes.forEach((node, index) => {
      const angle = startAngle + index * angleStep
      node.x = Math.cos(angle) * radius
      node.y = Math.sin(angle) * radius
    })
    
    return layoutData
  }

  private buildTree(nodes: MindMapNode[], nodeMap: Map<string, MindMapNode>): void {
    // 清空所有children数组
    nodes.forEach(node => {
      node.children = []
    })
    
    // 重新构建父子关系
    nodes.forEach(node => {
      if (node.parentId && nodeMap.has(node.parentId)) {
        const parent = nodeMap.get(node.parentId)!
        parent.children.push(node)
      }
    })
  }

  private buildLevels(nodes: MindMapNode[], rootId: string): MindMapNode[][] {
    const levels: MindMapNode[][] = []
    const visited = new Set<string>()
    const queue: { node: MindMapNode; level: number }[] = []
    
    const rootNode = nodes.find(n => n.id === rootId)!
    queue.push({ node: rootNode, level: 0 })
    visited.add(rootId)
    
    while (queue.length > 0) {
      const { node, level } = queue.shift()!
      
      if (!levels[level]) {
        levels[level] = []
      }
      levels[level].push(node)
      
      // 添加子节点
      nodes.forEach(child => {
        if (child.parentId === node.id && !visited.has(child.id)) {
          queue.push({ node: child, level: level + 1 })
          visited.add(child.id)
        }
      })
    }
    
    return levels
  }

  private calculateHorizontalTreeLayout(
    node: MindMapNode, 
    nodeMap: Map<string, MindMapNode>, 
    spacing: { x: number; y: number }, 
    x: number, 
    y: number
  ): number {
    node.x = x
    node.y = y
    
    if (node.children.length === 0) {
      return y
    }
    
    let currentY = y - ((node.children.length - 1) * spacing.y) / 2
    
    for (const child of node.children) {
      const childNode = nodeMap.get(child.id)!
      currentY = this.calculateHorizontalTreeLayout(
        childNode, 
        nodeMap, 
        spacing, 
        x + spacing.x, 
        currentY
      )
      currentY += spacing.y
    }
    
    return y
  }

  private calculateVerticalTreeLayout(
    node: MindMapNode, 
    nodeMap: Map<string, MindMapNode>, 
    spacing: { x: number; y: number }, 
    x: number, 
    y: number
  ): number {
    node.x = x
    node.y = y
    
    if (node.children.length === 0) {
      return x
    }
    
    let currentX = x - ((node.children.length - 1) * spacing.x) / 2
    
    for (const child of node.children) {
      const childNode = nodeMap.get(child.id)!
      currentX = this.calculateVerticalTreeLayout(
        childNode, 
        nodeMap, 
        spacing, 
        currentX, 
        y + spacing.y
      )
      currentX += spacing.x
    }
    
    return x
  }

  private calculateMaxDepth(data: MindMapData): number {
    const levels = this.buildLevels(data.nodes, data.rootId)
    return levels.length
  }

  private detectOverlaps(data: MindMapData): Array<{
    node1Id: string
    node2Id: string
    minDistance: number
  }> {
    const overlaps: Array<{
      node1Id: string
      node2Id: string
      minDistance: number
    }> = []
    
    const minDistance = 80 // 最小节点间距
    
    for (let i = 0; i < data.nodes.length; i++) {
      for (let j = i + 1; j < data.nodes.length; j++) {
        const node1 = data.nodes[i]
        const node2 = data.nodes[j]
        
        if (node1.x !== undefined && node1.y !== undefined &&
            node2.x !== undefined && node2.y !== undefined) {
          const dx = node2.x - node1.x
          const dy = node2.y - node1.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance < minDistance) {
            overlaps.push({
              node1Id: node1.id,
              node2Id: node2.id,
              minDistance
            })
          }
        }
      }
    }
    
    return overlaps
  }

  private optimizeSpacing(data: MindMapData, config: LayoutConfig): MindMapData {
    // 优化节点间距的算法
    // 这里可以实现更复杂的间距优化逻辑
    return data
  }

  private centerLayout(data: MindMapData): MindMapData {
    if (data.nodes.length === 0) return data
    
    // 计算边界框
    let minX = Infinity, maxX = -Infinity
    let minY = Infinity, maxY = -Infinity
    
    data.nodes.forEach(node => {
      if (node.x !== undefined && node.y !== undefined) {
        minX = Math.min(minX, node.x)
        maxX = Math.max(maxX, node.x)
        minY = Math.min(minY, node.y)
        maxY = Math.max(maxY, node.y)
      }
    })
    
    // 计算中心偏移
    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2
    
    // 将所有节点移动到中心
    data.nodes.forEach(node => {
      if (node.x !== undefined && node.y !== undefined) {
        node.x -= centerX
        node.y -= centerY
      }
    })
    
    return data
  }
}
