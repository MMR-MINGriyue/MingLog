/**
 * 高级布局算法管理器
 * 提供多种高级布局算法和智能布局切换功能
 */

import * as d3 from 'd3'
import { GraphData, GraphNode, GraphLink, LayoutConfig, LayoutType } from '../types'

export interface AdvancedLayoutConfig extends LayoutConfig {
  /** 布局动画时长 */
  animationDuration?: number
  /** 布局过渡缓动函数 */
  easing?: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce'
  /** 是否启用碰撞检测 */
  enableCollision?: boolean
  /** 节点分组策略 */
  groupingStrategy?: 'none' | 'by-type' | 'by-tags' | 'by-connections'
  /** 自适应参数 */
  adaptive?: boolean
}

export interface LayoutMetrics {
  /** 布局计算时间 */
  computationTime: number
  /** 节点重叠数量 */
  overlappingNodes: number
  /** 平均边长度 */
  averageEdgeLength: number
  /** 布局紧凑度 */
  compactness: number
  /** 视觉平衡度 */
  visualBalance: number
}

export interface LayoutTransition {
  /** 源布局 */
  fromLayout: LayoutType
  /** 目标布局 */
  toLayout: LayoutType
  /** 过渡进度 (0-1) */
  progress: number
  /** 插值节点位置 */
  interpolatedNodes: GraphNode[]
}

/**
 * 高级布局算法管理器
 */
export class AdvancedLayoutManager {
  private layoutCache: Map<string, GraphData> = new Map()
  private layoutMetrics: Map<LayoutType, LayoutMetrics> = new Map()
  private transitionInProgress: boolean = false

  /**
   * 层次布局算法（改进版）
   */
  hierarchicalLayout(
    nodes: GraphNode[],
    links: GraphLink[],
    config: AdvancedLayoutConfig & { 
      direction?: 'top-down' | 'bottom-up' | 'left-right' | 'right-left'
      layerSeparation?: number
      nodeSeparation?: number
      balanceSubtrees?: boolean
    }
  ): GraphNode[] {
    const {
      width,
      height,
      direction = 'top-down',
      layerSeparation = 100,
      nodeSeparation = 80,
      balanceSubtrees = true
    } = config

    // 构建层次结构
    const hierarchy = this.buildHierarchy(nodes, links)
    const layers = this.assignLayers(hierarchy)
    
    // 减少边交叉
    if (balanceSubtrees) {
      this.minimizeCrossings(layers, links)
    }

    // 计算节点位置
    const positionedNodes = this.positionHierarchicalNodes(
      layers,
      { width, height, direction, layerSeparation, nodeSeparation }
    )

    return positionedNodes
  }

  /**
   * 圆形布局算法（改进版）
   */
  circularLayout(
    nodes: GraphNode[],
    links: GraphLink[],
    config: AdvancedLayoutConfig & {
      radius?: number
      startAngle?: number
      clockwise?: boolean
      groupByConnections?: boolean
    }
  ): GraphNode[] {
    const {
      width,
      height,
      radius = Math.min(width, height) * 0.4,
      startAngle = 0,
      clockwise = true,
      groupByConnections = true
    } = config

    const centerX = width / 2
    const centerY = height / 2

    let orderedNodes = [...nodes]

    // 按连接数排序节点
    if (groupByConnections) {
      const connectionCounts = this.calculateConnectionCounts(nodes, links)
      orderedNodes.sort((a, b) => connectionCounts.get(b.id)! - connectionCounts.get(a.id)!)
    }

    // 计算角度步长
    const angleStep = (2 * Math.PI) / orderedNodes.length
    const direction = clockwise ? 1 : -1

    return orderedNodes.map((node, index) => {
      const angle = startAngle + (index * angleStep * direction)
      return {
        ...node,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      }
    })
  }

  /**
   * 网格布局算法（改进版）
   */
  gridLayout(
    nodes: GraphNode[],
    links: GraphLink[],
    config: AdvancedLayoutConfig & {
      columns?: number
      rows?: number
      cellPadding?: number
      alignToConnections?: boolean
    }
  ): GraphNode[] {
    const {
      width,
      height,
      columns = Math.ceil(Math.sqrt(nodes.length)),
      cellPadding = 20,
      alignToConnections = true
    } = config

    const rows = Math.ceil(nodes.length / columns)
    const cellWidth = (width - cellPadding * (columns + 1)) / columns
    const cellHeight = (height - cellPadding * (rows + 1)) / rows

    let orderedNodes = [...nodes]

    // 按连接关系排序，相关节点尽量相邻
    if (alignToConnections) {
      orderedNodes = this.sortNodesByConnections(nodes, links)
    }

    return orderedNodes.map((node, index) => {
      const col = index % columns
      const row = Math.floor(index / columns)
      
      const x = cellPadding + col * (cellWidth + cellPadding) + cellWidth / 2
      const y = cellPadding + row * (cellHeight + cellPadding) + cellHeight / 2

      return {
        ...node,
        x,
        y
      }
    })
  }

  /**
   * 径向布局算法（改进版）
   */
  radialLayout(
    nodes: GraphNode[],
    links: GraphLink[],
    config: AdvancedLayoutConfig & {
      centerNodeId?: string
      radiusStep?: number
      angleSpread?: number
    }
  ): GraphNode[] {
    const {
      width,
      height,
      centerNodeId,
      radiusStep = 80,
      angleSpread = 2 * Math.PI
    } = config

    const centerX = width / 2
    const centerY = height / 2

    // 确定中心节点
    const centerNode = centerNodeId 
      ? nodes.find(n => n.id === centerNodeId)
      : this.findMostConnectedNode(nodes, links)

    if (!centerNode) {
      return this.circularLayout(nodes, links, config)
    }

    // 计算每个节点到中心的距离（层级）
    const distances = this.calculateDistancesFromCenter(centerNode.id, nodes, links)
    const layers = this.groupNodesByDistance(nodes, distances)

    const positionedNodes: GraphNode[] = []

    // 放置中心节点
    positionedNodes.push({
      ...centerNode,
      x: centerX,
      y: centerY
    })

    // 放置其他层级的节点
    layers.forEach((layerNodes, distance) => {
      if (distance === 0) return // 跳过中心节点

      const radius = distance * radiusStep
      const angleStep = angleSpread / layerNodes.length
      
      layerNodes.forEach((node, index) => {
        const angle = (index * angleStep) - (angleSpread / 2)
        positionedNodes.push({
          ...node,
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle)
        })
      })
    })

    return positionedNodes
  }

  /**
   * 力导向布局算法（改进版）
   */
  enhancedForceLayout(
    nodes: GraphNode[],
    links: GraphLink[],
    config: AdvancedLayoutConfig & {
      linkDistance?: number
      linkStrength?: number
      chargeStrength?: number
      centerForce?: number
      collisionRadius?: number
      alphaDecay?: number
    }
  ): d3.Simulation<GraphNode, GraphLink> {
    const {
      width,
      height,
      linkDistance = 50,
      linkStrength = 0.1,
      chargeStrength = -300,
      centerForce = 0.1,
      collisionRadius = 12,
      alphaDecay = 0.02
    } = config

    // 创建力导向仿真
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links)
        .id((d: any) => d.id)
        .distance(linkDistance)
        .strength(linkStrength)
      )
      .force('charge', d3.forceManyBody().strength(chargeStrength))
      .force('center', d3.forceCenter(width / 2, height / 2).strength(centerForce))
      .force('collision', d3.forceCollide().radius(collisionRadius))
      .alphaDecay(alphaDecay)

    // 添加边界约束
    simulation.force('boundary', () => {
      nodes.forEach(node => {
        node.x = Math.max(collisionRadius, Math.min(width - collisionRadius, node.x || 0))
        node.y = Math.max(collisionRadius, Math.min(height - collisionRadius, node.y || 0))
      })
    })

    return simulation
  }

  /**
   * 智能布局选择
   */
  suggestOptimalLayout(nodes: GraphNode[], links: GraphLink[]): LayoutType {
    const nodeCount = nodes.length
    const linkCount = links.length
    const density = linkCount / (nodeCount * (nodeCount - 1) / 2)
    
    // 检查是否有明显的层次结构
    const hasHierarchy = this.detectHierarchy(nodes, links)
    
    // 检查是否有中心节点
    const hasCentralNode = this.detectCentralNode(nodes, links)

    if (nodeCount <= 10) {
      return 'circular'
    } else if (hasHierarchy) {
      return 'hierarchical'
    } else if (hasCentralNode) {
      return 'radial'
    } else if (density > 0.3) {
      return 'force'
    } else if (nodeCount > 50) {
      return 'grid'
    } else {
      return 'force'
    }
  }

  /**
   * 布局过渡动画
   */
  async transitionToLayout(
    currentNodes: GraphNode[],
    targetLayout: LayoutType,
    config: AdvancedLayoutConfig,
    onProgress?: (transition: LayoutTransition) => void
  ): Promise<GraphNode[]> {
    if (this.transitionInProgress) {
      throw new Error('布局过渡正在进行中')
    }

    this.transitionInProgress = true
    const duration = config.animationDuration || 1000
    const startTime = performance.now()

    try {
      // 计算目标位置
      const targetNodes = this.calculateLayout(currentNodes, [], targetLayout, config)
      
      // 执行过渡动画
      return new Promise((resolve) => {
        const animate = () => {
          const elapsed = performance.now() - startTime
          const progress = Math.min(elapsed / duration, 1)
          
          // 应用缓动函数
          const easedProgress = this.applyEasing(progress, config.easing || 'ease-out')
          
          // 插值计算当前位置
          const interpolatedNodes = currentNodes.map((node, index) => {
            const targetNode = targetNodes[index]
            return {
              ...node,
              x: node.x! + (targetNode.x! - node.x!) * easedProgress,
              y: node.y! + (targetNode.y! - node.y!) * easedProgress
            }
          })

          // 调用进度回调
          if (onProgress) {
            onProgress({
              fromLayout: 'force', // 假设当前是force布局
              toLayout: targetLayout,
              progress: easedProgress,
              interpolatedNodes
            })
          }

          if (progress < 1) {
            requestAnimationFrame(animate)
          } else {
            this.transitionInProgress = false
            resolve(targetNodes)
          }
        }

        animate()
      })
    } catch (error) {
      this.transitionInProgress = false
      throw error
    }
  }

  /**
   * 计算布局指标
   */
  calculateLayoutMetrics(nodes: GraphNode[], links: GraphLink[]): LayoutMetrics {
    const overlappingNodes = this.countOverlappingNodes(nodes)
    const averageEdgeLength = this.calculateAverageEdgeLength(nodes, links)
    const compactness = this.calculateCompactness(nodes)
    const visualBalance = this.calculateVisualBalance(nodes)

    return {
      computationTime: 0, // 将在实际计算时设置
      overlappingNodes,
      averageEdgeLength,
      compactness,
      visualBalance
    }
  }

  // 私有辅助方法

  private calculateLayout(
    nodes: GraphNode[],
    links: GraphLink[],
    layoutType: LayoutType,
    config: AdvancedLayoutConfig
  ): GraphNode[] {
    switch (layoutType) {
      case 'hierarchical':
        return this.hierarchicalLayout(nodes, links, config)
      case 'circular':
        return this.circularLayout(nodes, links, config)
      case 'grid':
        return this.gridLayout(nodes, links, config)
      case 'radial':
        return this.radialLayout(nodes, links, config)
      default:
        return nodes // 对于force布局，返回原始节点
    }
  }

  private buildHierarchy(nodes: GraphNode[], links: GraphLink[]): Map<string, string[]> {
    const hierarchy = new Map<string, string[]>()
    
    nodes.forEach(node => {
      hierarchy.set(node.id, [])
    })

    links.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id
      const targetId = typeof link.target === 'string' ? link.target : link.target.id
      
      hierarchy.get(sourceId)?.push(targetId)
    })

    return hierarchy
  }

  private assignLayers(hierarchy: Map<string, string[]>): Map<number, GraphNode[]> {
    // 实现层级分配算法
    return new Map()
  }

  private minimizeCrossings(layers: Map<number, GraphNode[]>, links: GraphLink[]): void {
    // 实现边交叉最小化算法
  }

  private positionHierarchicalNodes(
    layers: Map<number, GraphNode[]>,
    config: any
  ): GraphNode[] {
    // 实现层次节点定位算法
    return []
  }

  private calculateConnectionCounts(nodes: GraphNode[], links: GraphLink[]): Map<string, number> {
    const counts = new Map<string, number>()
    
    nodes.forEach(node => counts.set(node.id, 0))
    
    links.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id
      const targetId = typeof link.target === 'string' ? link.target : link.target.id
      
      counts.set(sourceId, (counts.get(sourceId) || 0) + 1)
      counts.set(targetId, (counts.get(targetId) || 0) + 1)
    })

    return counts
  }

  private sortNodesByConnections(nodes: GraphNode[], links: GraphLink[]): GraphNode[] {
    // 实现基于连接的节点排序算法
    return [...nodes]
  }

  private findMostConnectedNode(nodes: GraphNode[], links: GraphLink[]): GraphNode | null {
    const connectionCounts = this.calculateConnectionCounts(nodes, links)
    let maxConnections = 0
    let mostConnectedNode: GraphNode | null = null

    for (const [nodeId, count] of connectionCounts) {
      if (count > maxConnections) {
        maxConnections = count
        mostConnectedNode = nodes.find(n => n.id === nodeId) || null
      }
    }

    return mostConnectedNode
  }

  private calculateDistancesFromCenter(
    centerId: string,
    nodes: GraphNode[],
    links: GraphLink[]
  ): Map<string, number> {
    // 使用BFS计算距离
    const distances = new Map<string, number>()
    const queue: { nodeId: string; distance: number }[] = [{ nodeId: centerId, distance: 0 }]
    const visited = new Set<string>()

    while (queue.length > 0) {
      const { nodeId, distance } = queue.shift()!
      
      if (visited.has(nodeId)) continue
      visited.add(nodeId)
      distances.set(nodeId, distance)

      // 找到相邻节点
      const neighbors = links
        .filter(link => {
          const sourceId = typeof link.source === 'string' ? link.source : link.source.id
          const targetId = typeof link.target === 'string' ? link.target : link.target.id
          return sourceId === nodeId || targetId === nodeId
        })
        .map(link => {
          const sourceId = typeof link.source === 'string' ? link.source : link.source.id
          const targetId = typeof link.target === 'string' ? link.target : link.target.id
          return sourceId === nodeId ? targetId : sourceId
        })

      neighbors.forEach(neighborId => {
        if (!visited.has(neighborId)) {
          queue.push({ nodeId: neighborId, distance: distance + 1 })
        }
      })
    }

    return distances
  }

  private groupNodesByDistance(
    nodes: GraphNode[],
    distances: Map<string, number>
  ): Map<number, GraphNode[]> {
    const groups = new Map<number, GraphNode[]>()

    nodes.forEach(node => {
      const distance = distances.get(node.id) || 0
      if (!groups.has(distance)) {
        groups.set(distance, [])
      }
      groups.get(distance)!.push(node)
    })

    return groups
  }

  private detectHierarchy(nodes: GraphNode[], links: GraphLink[]): boolean {
    // 检测是否存在明显的层次结构
    const inDegree = new Map<string, number>()
    const outDegree = new Map<string, number>()

    nodes.forEach(node => {
      inDegree.set(node.id, 0)
      outDegree.set(node.id, 0)
    })

    links.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id
      const targetId = typeof link.target === 'string' ? link.target : link.target.id
      
      outDegree.set(sourceId, (outDegree.get(sourceId) || 0) + 1)
      inDegree.set(targetId, (inDegree.get(targetId) || 0) + 1)
    })

    // 如果有明显的根节点（入度为0）和叶节点（出度为0），则认为有层次结构
    const rootNodes = Array.from(inDegree.entries()).filter(([_, degree]) => degree === 0)
    const leafNodes = Array.from(outDegree.entries()).filter(([_, degree]) => degree === 0)

    return rootNodes.length > 0 && leafNodes.length > 0
  }

  private detectCentralNode(nodes: GraphNode[], links: GraphLink[]): boolean {
    const connectionCounts = this.calculateConnectionCounts(nodes, links)
    const maxConnections = Math.max(...connectionCounts.values())
    const avgConnections = Array.from(connectionCounts.values()).reduce((a, b) => a + b, 0) / nodes.length

    // 如果最大连接数明显高于平均值，则认为有中心节点
    return maxConnections > avgConnections * 2
  }

  private applyEasing(progress: number, easing: string): number {
    switch (easing) {
      case 'linear':
        return progress
      case 'ease-in':
        return progress * progress
      case 'ease-out':
        return 1 - (1 - progress) * (1 - progress)
      case 'ease-in-out':
        return progress < 0.5 
          ? 2 * progress * progress 
          : 1 - 2 * (1 - progress) * (1 - progress)
      case 'bounce':
        if (progress < 1 / 2.75) {
          return 7.5625 * progress * progress
        } else if (progress < 2 / 2.75) {
          return 7.5625 * (progress -= 1.5 / 2.75) * progress + 0.75
        } else if (progress < 2.5 / 2.75) {
          return 7.5625 * (progress -= 2.25 / 2.75) * progress + 0.9375
        } else {
          return 7.5625 * (progress -= 2.625 / 2.75) * progress + 0.984375
        }
      default:
        return progress
    }
  }

  private countOverlappingNodes(nodes: GraphNode[]): number {
    let count = 0
    const radius = 20 // 假设节点半径

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = (nodes[i].x || 0) - (nodes[j].x || 0)
        const dy = (nodes[i].y || 0) - (nodes[j].y || 0)
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < radius * 2) {
          count++
        }
      }
    }

    return count
  }

  private calculateAverageEdgeLength(nodes: GraphNode[], links: GraphLink[]): number {
    if (links.length === 0) return 0

    const totalLength = links.reduce((sum, link) => {
      const sourceNode = nodes.find(n => n.id === (typeof link.source === 'string' ? link.source : link.source.id))
      const targetNode = nodes.find(n => n.id === (typeof link.target === 'string' ? link.target : link.target.id))
      
      if (sourceNode && targetNode) {
        const dx = (sourceNode.x || 0) - (targetNode.x || 0)
        const dy = (sourceNode.y || 0) - (targetNode.y || 0)
        return sum + Math.sqrt(dx * dx + dy * dy)
      }
      
      return sum
    }, 0)

    return totalLength / links.length
  }

  private calculateCompactness(nodes: GraphNode[]): number {
    if (nodes.length === 0) return 0

    // 计算节点的边界框
    const xs = nodes.map(n => n.x || 0)
    const ys = nodes.map(n => n.y || 0)
    
    const minX = Math.min(...xs)
    const maxX = Math.max(...xs)
    const minY = Math.min(...ys)
    const maxY = Math.max(...ys)
    
    const area = (maxX - minX) * (maxY - minY)
    
    // 紧凑度 = 节点数量 / 占用面积
    return area > 0 ? nodes.length / area : 0
  }

  private calculateVisualBalance(nodes: GraphNode[]): number {
    if (nodes.length === 0) return 1

    // 计算重心
    const centerX = nodes.reduce((sum, n) => sum + (n.x || 0), 0) / nodes.length
    const centerY = nodes.reduce((sum, n) => sum + (n.y || 0), 0) / nodes.length

    // 计算各象限的节点数量
    const quadrants = [0, 0, 0, 0] // 右上、左上、左下、右下
    
    nodes.forEach(node => {
      const x = (node.x || 0) - centerX
      const y = (node.y || 0) - centerY
      
      if (x >= 0 && y >= 0) quadrants[0]++
      else if (x < 0 && y >= 0) quadrants[1]++
      else if (x < 0 && y < 0) quadrants[2]++
      else quadrants[3]++
    })

    // 计算平衡度（各象限节点数量的标准差越小，平衡度越高）
    const avg = nodes.length / 4
    const variance = quadrants.reduce((sum, count) => sum + Math.pow(count - avg, 2), 0) / 4
    const stdDev = Math.sqrt(variance)
    
    // 归一化到0-1范围
    return Math.max(0, 1 - stdDev / avg)
  }
}

export default AdvancedLayoutManager
