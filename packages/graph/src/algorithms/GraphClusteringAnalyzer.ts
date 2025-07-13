/**
 * 图形聚类分析器
 * 实现多种社区检测算法，包括Louvain算法、模块度优化等
 */

import { GraphNode, GraphLink, Cluster } from '../types'

export interface ClusteringConfig {
  /** 聚类算法类型 */
  algorithm: 'louvain' | 'modularity' | 'connectivity' | 'tags' | 'type' | 'kmeans'
  /** 最小聚类大小 */
  minClusterSize?: number
  /** 最大聚类数量 */
  maxClusters?: number
  /** 分辨率参数（用于Louvain算法） */
  resolution?: number
  /** 迭代次数限制 */
  maxIterations?: number
  /** 收敛阈值 */
  convergenceThreshold?: number
  /** 是否启用层次聚类 */
  hierarchical?: boolean
}

export interface ClusteringResult {
  /** 聚类列表 */
  clusters: Cluster[]
  /** 模块度分数 */
  modularity: number
  /** 聚类质量指标 */
  quality: ClusterQuality
  /** 算法执行时间 */
  executionTime: number
  /** 层次结构（如果启用） */
  hierarchy?: ClusterHierarchy
}

export interface ClusterQuality {
  /** 内部连接密度 */
  internalDensity: number
  /** 外部连接密度 */
  externalDensity: number
  /** 轮廓系数 */
  silhouetteScore: number
  /** 聚类间分离度 */
  separation: number
  /** 聚类内紧密度 */
  cohesion: number
}

export interface ClusterHierarchy {
  /** 层级数 */
  levels: number
  /** 每层的聚类 */
  levelClusters: Cluster[][]
  /** 层级关系 */
  parentChildMap: Map<string, string[]>
}

export interface CommunityEdge {
  source: string
  target: string
  weight: number
}

/**
 * 图形聚类分析器类
 */
export class GraphClusteringAnalyzer {
  private nodeIndex: Map<string, number> = new Map()
  private adjacencyMatrix: number[][] = []
  private edgeWeights: Map<string, number> = new Map()

  /**
   * 执行图形聚类分析
   */
  async performClustering(
    nodes: GraphNode[],
    links: GraphLink[],
    config: ClusteringConfig
  ): Promise<ClusteringResult> {
    const startTime = performance.now()

    // 预处理数据
    this.preprocessData(nodes, links)

    let clusters: Cluster[]
    let modularity: number

    // 根据算法类型执行聚类
    switch (config.algorithm) {
      case 'louvain':
        const louvainResult = this.louvainClustering(nodes, links, config)
        clusters = louvainResult.clusters
        modularity = louvainResult.modularity
        break

      case 'modularity':
        const modularityResult = this.modularityOptimization(nodes, links, config)
        clusters = modularityResult.clusters
        modularity = modularityResult.modularity
        break

      case 'connectivity':
        clusters = this.connectivityClustering(nodes, links, config)
        modularity = this.calculateModularity(clusters, links)
        break

      case 'tags':
        clusters = this.tagBasedClustering(nodes, config)
        modularity = this.calculateModularity(clusters, links)
        break

      case 'type':
        clusters = this.typeBasedClustering(nodes, config)
        modularity = this.calculateModularity(clusters, links)
        break

      case 'kmeans':
        clusters = this.kMeansClustering(nodes, links, config)
        modularity = this.calculateModularity(clusters, links)
        break

      default:
        throw new Error(`不支持的聚类算法: ${config.algorithm}`)
    }

    // 计算聚类质量
    const quality = this.calculateClusterQuality(clusters, nodes, links)

    // 构建层次结构（如果启用）
    const hierarchy = config.hierarchical 
      ? this.buildClusterHierarchy(clusters, nodes, links)
      : undefined

    const executionTime = performance.now() - startTime

    return {
      clusters,
      modularity,
      quality,
      executionTime,
      hierarchy
    }
  }

  /**
   * Louvain社区检测算法
   */
  private louvainClustering(
    nodes: GraphNode[],
    links: GraphLink[],
    config: ClusteringConfig
  ): { clusters: Cluster[]; modularity: number } {
    const resolution = config.resolution || 1.0
    const maxIterations = config.maxIterations || 100
    const threshold = config.convergenceThreshold || 1e-6

    // 初始化：每个节点为一个社区
    const communities = new Map<string, string>()
    nodes.forEach(node => communities.set(node.id, node.id))

    let currentModularity = this.calculateModularityFromCommunities(communities, links)
    let improved = true
    let iteration = 0

    while (improved && iteration < maxIterations) {
      improved = false
      iteration++

      // 第一阶段：局部优化
      for (const node of nodes) {
        const bestCommunity = this.findBestCommunity(
          node,
          communities,
          links,
          resolution
        )

        if (bestCommunity !== communities.get(node.id)) {
          communities.set(node.id, bestCommunity)
          improved = true
        }
      }

      // 计算新的模块度
      const newModularity = this.calculateModularityFromCommunities(communities, links)
      
      if (newModularity - currentModularity < threshold) {
        break
      }
      
      currentModularity = newModularity
    }

    // 第二阶段：构建新的图（社区聚合）
    const clusters = this.buildClustersFromCommunities(communities, nodes, links)
    
    return {
      clusters,
      modularity: currentModularity
    }
  }

  /**
   * 模块度优化算法
   */
  private modularityOptimization(
    nodes: GraphNode[],
    links: GraphLink[],
    config: ClusteringConfig
  ): { clusters: Cluster[]; modularity: number } {
    const maxIterations = config.maxIterations || 50
    
    // 使用贪心算法优化模块度
    let bestClusters = this.initializeRandomClusters(nodes, config.maxClusters || 10)
    let bestModularity = this.calculateModularity(bestClusters, links)

    for (let i = 0; i < maxIterations; i++) {
      const newClusters = this.optimizeClusterAssignment(bestClusters, nodes, links)
      const newModularity = this.calculateModularity(newClusters, links)

      if (newModularity > bestModularity) {
        bestClusters = newClusters
        bestModularity = newModularity
      }
    }

    return {
      clusters: bestClusters,
      modularity: bestModularity
    }
  }

  /**
   * 基于连通性的聚类
   */
  private connectivityClustering(
    nodes: GraphNode[],
    links: GraphLink[],
    config: ClusteringConfig
  ): Cluster[] {
    const visited = new Set<string>()
    const clusters: Cluster[] = []
    let clusterId = 0

    // 深度优先搜索找连通分量
    for (const node of nodes) {
      if (!visited.has(node.id)) {
        const clusterNodes = this.dfsConnectedComponent(node.id, links, visited)
        
        if (clusterNodes.length >= (config.minClusterSize || 1)) {
          clusters.push(this.createCluster(
            `cluster_${clusterId++}`,
            clusterNodes,
            nodes
          ))
        }
      }
    }

    return clusters
  }

  /**
   * 基于标签的聚类
   */
  private tagBasedClustering(nodes: GraphNode[], config: ClusteringConfig): Cluster[] {
    const tagGroups = new Map<string, string[]>()

    // 按标签分组
    nodes.forEach(node => {
      if (node.tags && node.tags.length > 0) {
        node.tags.forEach(tag => {
          if (!tagGroups.has(tag)) {
            tagGroups.set(tag, [])
          }
          tagGroups.get(tag)!.push(node.id)
        })
      }
    })

    const clusters: Cluster[] = []
    let clusterId = 0

    // 为每个标签组创建聚类
    for (const [tag, nodeIds] of tagGroups) {
      if (nodeIds.length >= (config.minClusterSize || 2)) {
        clusters.push(this.createCluster(
          `tag_${clusterId++}`,
          nodeIds,
          nodes,
          tag
        ))
      }
    }

    return clusters
  }

  /**
   * 基于类型的聚类
   */
  private typeBasedClustering(nodes: GraphNode[], config: ClusteringConfig): Cluster[] {
    const typeGroups = new Map<string, string[]>()

    // 按类型分组
    nodes.forEach(node => {
      if (!typeGroups.has(node.type)) {
        typeGroups.set(node.type, [])
      }
      typeGroups.get(node.type)!.push(node.id)
    })

    const clusters: Cluster[] = []
    let clusterId = 0

    // 为每个类型创建聚类
    for (const [type, nodeIds] of typeGroups) {
      if (nodeIds.length >= (config.minClusterSize || 1)) {
        clusters.push(this.createCluster(
          `type_${clusterId++}`,
          nodeIds,
          nodes,
          type
        ))
      }
    }

    return clusters
  }

  /**
   * K-means聚类算法
   */
  private kMeansClustering(
    nodes: GraphNode[],
    links: GraphLink[],
    config: ClusteringConfig
  ): Cluster[] {
    const k = config.maxClusters || Math.min(10, Math.ceil(Math.sqrt(nodes.length)))
    const maxIterations = config.maxIterations || 100

    // 初始化聚类中心
    let centroids = this.initializeKMeansCentroids(nodes, k)
    let assignments = new Map<string, number>()

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      const newAssignments = new Map<string, number>()

      // 分配节点到最近的聚类中心
      nodes.forEach(node => {
        const closestCentroid = this.findClosestCentroid(node, centroids)
        newAssignments.set(node.id, closestCentroid)
      })

      // 检查收敛
      if (this.assignmentsEqual(assignments, newAssignments)) {
        break
      }

      assignments = newAssignments

      // 更新聚类中心
      centroids = this.updateKMeansCentroids(nodes, assignments, k)
    }

    // 构建聚类结果
    const clusterGroups = new Map<number, string[]>()
    for (const [nodeId, clusterId] of assignments) {
      if (!clusterGroups.has(clusterId)) {
        clusterGroups.set(clusterId, [])
      }
      clusterGroups.get(clusterId)!.push(nodeId)
    }

    const clusters: Cluster[] = []
    for (const [clusterId, nodeIds] of clusterGroups) {
      if (nodeIds.length >= (config.minClusterSize || 1)) {
        clusters.push(this.createCluster(
          `kmeans_${clusterId}`,
          nodeIds,
          nodes
        ))
      }
    }

    return clusters
  }

  /**
   * 计算模块度
   */
  private calculateModularity(clusters: Cluster[], links: GraphLink[]): number {
    const totalEdges = links.length
    if (totalEdges === 0) return 0

    let modularity = 0
    const clusterNodeSets = new Map<string, Set<string>>()

    // 构建聚类节点集合
    clusters.forEach(cluster => {
      clusterNodeSets.set(cluster.id, new Set(cluster.nodes))
    })

    // 计算每个聚类的模块度贡献
    clusters.forEach(cluster => {
      const nodeSet = clusterNodeSets.get(cluster.id)!
      let internalEdges = 0
      let totalDegree = 0

      // 计算内部边数
      links.forEach(link => {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id
        const targetId = typeof link.target === 'string' ? link.target : link.target.id

        if (nodeSet.has(sourceId) && nodeSet.has(targetId)) {
          internalEdges++
        }

        if (nodeSet.has(sourceId) || nodeSet.has(targetId)) {
          totalDegree++
        }
      })

      // 模块度公式：Q = (内部边数 / 总边数) - (总度数 / 2 * 总边数)^2
      const expectedEdges = (totalDegree / (2 * totalEdges)) ** 2
      modularity += (internalEdges / totalEdges) - expectedEdges
    })

    return modularity
  }

  /**
   * 计算聚类质量指标
   */
  private calculateClusterQuality(
    clusters: Cluster[],
    nodes: GraphNode[],
    links: GraphLink[]
  ): ClusterQuality {
    let totalInternalDensity = 0
    let totalExternalDensity = 0
    let totalSilhouette = 0

    clusters.forEach(cluster => {
      const nodeSet = new Set(cluster.nodes)
      let internalEdges = 0
      let externalEdges = 0
      let possibleInternalEdges = cluster.nodes.length * (cluster.nodes.length - 1) / 2

      links.forEach(link => {
        const sourceId = typeof link.source === 'string' ? link.source : link.source.id
        const targetId = typeof link.target === 'string' ? link.target : link.target.id

        if (nodeSet.has(sourceId) && nodeSet.has(targetId)) {
          internalEdges++
        } else if (nodeSet.has(sourceId) || nodeSet.has(targetId)) {
          externalEdges++
        }
      })

      const internalDensity = possibleInternalEdges > 0 ? internalEdges / possibleInternalEdges : 0
      totalInternalDensity += internalDensity

      // 简化的外部密度计算
      const externalDensity = externalEdges / Math.max(1, cluster.nodes.length)
      totalExternalDensity += externalDensity
    })

    const avgInternalDensity = clusters.length > 0 ? totalInternalDensity / clusters.length : 0
    const avgExternalDensity = clusters.length > 0 ? totalExternalDensity / clusters.length : 0

    // 简化的轮廓系数计算
    const silhouetteScore = avgInternalDensity > 0 
      ? (avgInternalDensity - avgExternalDensity) / Math.max(avgInternalDensity, avgExternalDensity)
      : 0

    return {
      internalDensity: avgInternalDensity,
      externalDensity: avgExternalDensity,
      silhouetteScore,
      separation: 1 - avgExternalDensity,
      cohesion: avgInternalDensity
    }
  }

  // 私有辅助方法

  private preprocessData(nodes: GraphNode[], links: GraphLink[]): void {
    // 构建节点索引
    this.nodeIndex.clear()
    nodes.forEach((node, index) => {
      this.nodeIndex.set(node.id, index)
    })

    // 构建邻接矩阵
    const n = nodes.length
    this.adjacencyMatrix = Array(n).fill(null).map(() => Array(n).fill(0))

    links.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id
      const targetId = typeof link.target === 'string' ? link.target : link.target.id
      const sourceIndex = this.nodeIndex.get(sourceId)
      const targetIndex = this.nodeIndex.get(targetId)

      if (sourceIndex !== undefined && targetIndex !== undefined) {
        const weight = link.weight || 1
        this.adjacencyMatrix[sourceIndex][targetIndex] = weight
        this.adjacencyMatrix[targetIndex][sourceIndex] = weight
        this.edgeWeights.set(`${sourceId}-${targetId}`, weight)
      }
    })
  }

  private findBestCommunity(
    node: GraphNode,
    communities: Map<string, string>,
    links: GraphLink[],
    resolution: number
  ): string {
    const neighborCommunities = new Map<string, number>()
    const currentCommunity = communities.get(node.id)!

    // 计算邻居社区的权重
    links.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id
      const targetId = typeof link.target === 'string' ? link.target : link.target.id

      if (sourceId === node.id) {
        const neighborCommunity = communities.get(targetId)!
        const weight = link.weight || 1
        neighborCommunities.set(
          neighborCommunity,
          (neighborCommunities.get(neighborCommunity) || 0) + weight
        )
      } else if (targetId === node.id) {
        const neighborCommunity = communities.get(sourceId)!
        const weight = link.weight || 1
        neighborCommunities.set(
          neighborCommunity,
          (neighborCommunities.get(neighborCommunity) || 0) + weight
        )
      }
    })

    // 找到最佳社区
    let bestCommunity = currentCommunity
    let bestGain = 0

    for (const [community, weight] of neighborCommunities) {
      if (community !== currentCommunity) {
        const gain = weight * resolution
        if (gain > bestGain) {
          bestGain = gain
          bestCommunity = community
        }
      }
    }

    return bestCommunity
  }

  private calculateModularityFromCommunities(
    communities: Map<string, string>,
    links: GraphLink[]
  ): number {
    const communityGroups = new Map<string, string[]>()
    
    for (const [nodeId, communityId] of communities) {
      if (!communityGroups.has(communityId)) {
        communityGroups.set(communityId, [])
      }
      communityGroups.get(communityId)!.push(nodeId)
    }

    const clusters: Cluster[] = []
    let clusterId = 0
    
    for (const [_, nodeIds] of communityGroups) {
      clusters.push({
        id: `temp_${clusterId++}`,
        nodes: nodeIds,
        center: { x: 0, y: 0 },
        radius: 0,
        color: '#000000'
      })
    }

    return this.calculateModularity(clusters, links)
  }

  private buildClustersFromCommunities(
    communities: Map<string, string>,
    nodes: GraphNode[],
    links: GraphLink[]
  ): Cluster[] {
    const communityGroups = new Map<string, string[]>()
    
    for (const [nodeId, communityId] of communities) {
      if (!communityGroups.has(communityId)) {
        communityGroups.set(communityId, [])
      }
      communityGroups.get(communityId)!.push(nodeId)
    }

    const clusters: Cluster[] = []
    let clusterId = 0

    for (const [_, nodeIds] of communityGroups) {
      clusters.push(this.createCluster(`louvain_${clusterId++}`, nodeIds, nodes))
    }

    return clusters
  }

  private dfsConnectedComponent(
    startNodeId: string,
    links: GraphLink[],
    visited: Set<string>
  ): string[] {
    const component: string[] = []
    const stack: string[] = [startNodeId]

    while (stack.length > 0) {
      const nodeId = stack.pop()!
      
      if (!visited.has(nodeId)) {
        visited.add(nodeId)
        component.push(nodeId)

        // 找到所有邻居
        links.forEach(link => {
          const sourceId = typeof link.source === 'string' ? link.source : link.source.id
          const targetId = typeof link.target === 'string' ? link.target : link.target.id

          if (sourceId === nodeId && !visited.has(targetId)) {
            stack.push(targetId)
          } else if (targetId === nodeId && !visited.has(sourceId)) {
            stack.push(sourceId)
          }
        })
      }
    }

    return component
  }

  private createCluster(
    id: string,
    nodeIds: string[],
    nodes: GraphNode[],
    label?: string
  ): Cluster {
    const clusterNodes = nodes.filter(node => nodeIds.includes(node.id))
    
    // 计算聚类中心
    const centerX = clusterNodes.reduce((sum, node) => sum + (node.x || 0), 0) / clusterNodes.length
    const centerY = clusterNodes.reduce((sum, node) => sum + (node.y || 0), 0) / clusterNodes.length

    // 计算聚类半径
    const radius = Math.max(
      ...clusterNodes.map(node => 
        Math.sqrt(Math.pow((node.x || 0) - centerX, 2) + Math.pow((node.y || 0) - centerY, 2))
      )
    ) || 50

    // 生成聚类颜色
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8']
    const color = colors[Math.abs(id.split('_')[1] ? parseInt(id.split('_')[1]) : 0) % colors.length]

    return {
      id,
      nodes: nodeIds,
      center: { x: centerX, y: centerY },
      radius,
      color,
      label
    }
  }

  private initializeRandomClusters(nodes: GraphNode[], maxClusters: number): Cluster[] {
    const clusters: Cluster[] = []
    const clusterSize = Math.ceil(nodes.length / maxClusters)

    for (let i = 0; i < maxClusters && i * clusterSize < nodes.length; i++) {
      const startIndex = i * clusterSize
      const endIndex = Math.min(startIndex + clusterSize, nodes.length)
      const clusterNodes = nodes.slice(startIndex, endIndex)
      
      clusters.push(this.createCluster(
        `random_${i}`,
        clusterNodes.map(n => n.id),
        nodes
      ))
    }

    return clusters
  }

  private optimizeClusterAssignment(
    clusters: Cluster[],
    nodes: GraphNode[],
    links: GraphLink[]
  ): Cluster[] {
    // 简化的聚类优化：随机重新分配一些节点
    const newClusters = clusters.map(cluster => ({ ...cluster, nodes: [...cluster.nodes] }))
    
    // 随机选择一些节点重新分配
    const nodesToReassign = Math.floor(nodes.length * 0.1)
    
    for (let i = 0; i < nodesToReassign; i++) {
      const randomNode = nodes[Math.floor(Math.random() * nodes.length)]
      const randomCluster = newClusters[Math.floor(Math.random() * newClusters.length)]
      
      // 从当前聚类中移除
      newClusters.forEach(cluster => {
        cluster.nodes = cluster.nodes.filter(id => id !== randomNode.id)
      })
      
      // 添加到新聚类
      randomCluster.nodes.push(randomNode.id)
    }

    return newClusters
  }

  private initializeKMeansCentroids(nodes: GraphNode[], k: number): Array<{ x: number; y: number }> {
    const centroids: Array<{ x: number; y: number }> = []
    
    for (let i = 0; i < k; i++) {
      const randomNode = nodes[Math.floor(Math.random() * nodes.length)]
      centroids.push({
        x: randomNode.x || Math.random() * 800,
        y: randomNode.y || Math.random() * 600
      })
    }

    return centroids
  }

  private findClosestCentroid(node: GraphNode, centroids: Array<{ x: number; y: number }>): number {
    let closestIndex = 0
    let minDistance = Infinity

    centroids.forEach((centroid, index) => {
      const distance = Math.sqrt(
        Math.pow((node.x || 0) - centroid.x, 2) + 
        Math.pow((node.y || 0) - centroid.y, 2)
      )
      
      if (distance < minDistance) {
        minDistance = distance
        closestIndex = index
      }
    })

    return closestIndex
  }

  private updateKMeansCentroids(
    nodes: GraphNode[],
    assignments: Map<string, number>,
    k: number
  ): Array<{ x: number; y: number }> {
    const centroids: Array<{ x: number; y: number }> = []
    
    for (let i = 0; i < k; i++) {
      const clusterNodes = nodes.filter(node => assignments.get(node.id) === i)
      
      if (clusterNodes.length > 0) {
        const centerX = clusterNodes.reduce((sum, node) => sum + (node.x || 0), 0) / clusterNodes.length
        const centerY = clusterNodes.reduce((sum, node) => sum + (node.y || 0), 0) / clusterNodes.length
        centroids.push({ x: centerX, y: centerY })
      } else {
        // 如果聚类为空，随机初始化
        centroids.push({
          x: Math.random() * 800,
          y: Math.random() * 600
        })
      }
    }

    return centroids
  }

  private assignmentsEqual(
    assignments1: Map<string, number>,
    assignments2: Map<string, number>
  ): boolean {
    if (assignments1.size !== assignments2.size) return false
    
    for (const [nodeId, clusterId] of assignments1) {
      if (assignments2.get(nodeId) !== clusterId) return false
    }
    
    return true
  }

  private buildClusterHierarchy(
    clusters: Cluster[],
    nodes: GraphNode[],
    links: GraphLink[]
  ): ClusterHierarchy {
    // 简化的层次结构构建
    return {
      levels: 1,
      levelClusters: [clusters],
      parentChildMap: new Map()
    }
  }
}

export default GraphClusteringAnalyzer
