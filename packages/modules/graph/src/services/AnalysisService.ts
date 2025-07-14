/**
 * 图谱分析服务
 * 提供图谱的高级分析功能，包括中心性分析、社区检测、路径分析等
 */

import { GraphData, GraphNode, GraphLink, Cluster, Path } from '../types'

export interface IAnalysisService {
  // 中心性分析
  calculateBetweennessCentrality(data: GraphData): Promise<Map<string, number>>
  calculateClosenessCentrality(data: GraphData): Promise<Map<string, number>>
  calculateDegreeCentrality(data: GraphData): Promise<Map<string, number>>
  calculatePageRank(data: GraphData, damping?: number, iterations?: number): Promise<Map<string, number>>

  // 社区检测
  detectCommunities(data: GraphData, algorithm?: 'louvain' | 'modularity'): Promise<Cluster[]>
  calculateModularity(data: GraphData, communities: Cluster[]): Promise<number>

  // 路径分析
  findShortestPath(data: GraphData, sourceId: string, targetId: string): Promise<Path | null>
  findAllPaths(data: GraphData, sourceId: string, targetId: string, maxLength?: number): Promise<Path[]>
  calculatePathLength(data: GraphData, nodeIds: string[]): Promise<number>

  // 结构分析
  calculateClusteringCoefficient(data: GraphData): Promise<number>
  calculateNetworkDensity(data: GraphData): Promise<number>
  findBridges(data: GraphData): Promise<GraphLink[]>
  findArticulationPoints(data: GraphData): Promise<GraphNode[]>

  // 相似性分析
  calculateNodeSimilarity(data: GraphData, nodeId1: string, nodeId2: string): Promise<number>
  findSimilarNodes(data: GraphData, nodeId: string, threshold?: number): Promise<Array<{ node: GraphNode; similarity: number }>>

  // 影响力分析
  calculateInfluenceScore(data: GraphData, nodeId: string): Promise<number>
  findInfluentialNodes(data: GraphData, topK?: number): Promise<Array<{ node: GraphNode; score: number }>>

  // 异常检测
  detectAnomalies(data: GraphData): Promise<Array<{ node: GraphNode; anomalyScore: number; reason: string }>>

  // 趋势分析
  analyzeTrends(historicalData: GraphData[]): Promise<any>
}

export class AnalysisService implements IAnalysisService {
  private coreAPI: any

  constructor(coreAPI?: any) {
    this.coreAPI = coreAPI
  }

  async calculateBetweennessCentrality(data: GraphData): Promise<Map<string, number>> {
    const centrality = new Map<string, number>()

    // 初始化所有节点的中心性为0
    for (const node of data.nodes) {
      centrality.set(node.id, 0)
    }

    // 对每对节点计算最短路径
    for (let i = 0; i < data.nodes.length; i++) {
      for (let j = i + 1; j < data.nodes.length; j++) {
        const sourceId = data.nodes[i].id
        const targetId = data.nodes[j].id

        const path = await this.findShortestPath(data, sourceId, targetId)
        if (path && path.nodes.length > 2) {
          // 对路径中的中间节点增加中心性分数
          for (let k = 1; k < path.nodes.length - 1; k++) {
            const nodeId = path.nodes[k].id
            centrality.set(nodeId, (centrality.get(nodeId) || 0) + 1)
          }
        }
      }
    }

    // 标准化
    const totalPairs = (data.nodes.length * (data.nodes.length - 1)) / 2
    for (const [nodeId, score] of centrality) {
      centrality.set(nodeId, totalPairs > 0 ? score / totalPairs : 0)
    }

    return centrality
  }

  async calculateClosenessCentrality(data: GraphData): Promise<Map<string, number>> {
    const centrality = new Map<string, number>()

    for (const node of data.nodes) {
      let totalDistance = 0
      let reachableNodes = 0

      for (const otherNode of data.nodes) {
        if (node.id !== otherNode.id) {
          const path = await this.findShortestPath(data, node.id, otherNode.id)
          if (path) {
            totalDistance += path.length
            reachableNodes++
          }
        }
      }

      // 接近中心性 = (可达节点数 - 1) / 总距离
      const closeness = reachableNodes > 0 ? (reachableNodes - 1) / totalDistance : 0
      centrality.set(node.id, closeness)
    }

    return centrality
  }

  async calculateDegreeCentrality(data: GraphData): Promise<Map<string, number>> {
    const centrality = new Map<string, number>()

    // 初始化
    for (const node of data.nodes) {
      centrality.set(node.id, 0)
    }

    // 计算度数
    for (const link of data.links) {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id
      const targetId = typeof link.target === 'string' ? link.target : link.target.id

      centrality.set(sourceId, (centrality.get(sourceId) || 0) + 1)
      centrality.set(targetId, (centrality.get(targetId) || 0) + 1)
    }

    // 标准化（除以最大可能度数）
    const maxDegree = data.nodes.length - 1
    for (const [nodeId, degree] of centrality) {
      centrality.set(nodeId, maxDegree > 0 ? degree / maxDegree : 0)
    }

    return centrality
  }

  async calculatePageRank(data: GraphData, damping: number = 0.85, iterations: number = 100): Promise<Map<string, number>> {
    const pageRank = new Map<string, number>()
    const nodeCount = data.nodes.length

    if (nodeCount === 0) return pageRank

    // 初始化PageRank值
    const initialValue = 1.0 / nodeCount
    for (const node of data.nodes) {
      pageRank.set(node.id, initialValue)
    }

    // 构建邻接表
    const outLinks = new Map<string, string[]>()
    const inLinks = new Map<string, string[]>()

    for (const node of data.nodes) {
      outLinks.set(node.id, [])
      inLinks.set(node.id, [])
    }

    for (const link of data.links) {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id
      const targetId = typeof link.target === 'string' ? link.target : link.target.id

      outLinks.get(sourceId)?.push(targetId)
      inLinks.get(targetId)?.push(sourceId)
    }

    // 迭代计算PageRank
    for (let iter = 0; iter < iterations; iter++) {
      const newPageRank = new Map<string, number>()

      for (const node of data.nodes) {
        let rank = (1 - damping) / nodeCount

        const incomingNodes = inLinks.get(node.id) || []
        for (const incomingNodeId of incomingNodes) {
          const incomingRank = pageRank.get(incomingNodeId) || 0
          const outDegree = outLinks.get(incomingNodeId)?.length || 1
          rank += damping * (incomingRank / outDegree)
        }

        newPageRank.set(node.id, rank)
      }

      // 更新PageRank值
      for (const [nodeId, rank] of newPageRank) {
        pageRank.set(nodeId, rank)
      }
    }

    return pageRank
  }

  async detectCommunities(data: GraphData, algorithm: 'louvain' | 'modularity' = 'louvain'): Promise<Cluster[]> {
    if (algorithm === 'louvain') {
      return this.louvainCommunityDetection(data)
    } else {
      return this.modularityCommunityDetection(data)
    }
  }

  async calculateModularity(data: GraphData, communities: Cluster[]): Promise<number> {
    const totalEdges = data.links.length
    if (totalEdges === 0) return 0

    let modularity = 0

    // 构建社区映射
    const nodeToCommunity = new Map<string, string>()
    for (const community of communities) {
      for (const nodeId of community.nodes) {
        nodeToCommunity.set(nodeId, community.id)
      }
    }

    // 计算度数
    const degrees = new Map<string, number>()
    for (const node of data.nodes) {
      degrees.set(node.id, 0)
    }

    for (const link of data.links) {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id
      const targetId = typeof link.target === 'string' ? link.target : link.target.id

      degrees.set(sourceId, (degrees.get(sourceId) || 0) + 1)
      degrees.set(targetId, (degrees.get(targetId) || 0) + 1)
    }

    // 计算模块度
    for (const link of data.links) {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id
      const targetId = typeof link.target === 'string' ? link.target : link.target.id

      const sourceCommunity = nodeToCommunity.get(sourceId)
      const targetCommunity = nodeToCommunity.get(targetId)

      if (sourceCommunity === targetCommunity) {
        const ki = degrees.get(sourceId) || 0
        const kj = degrees.get(targetId) || 0
        modularity += 1 - (ki * kj) / (2 * totalEdges)
      }
    }

    return modularity / (2 * totalEdges)
  }

  async findShortestPath(data: GraphData, sourceId: string, targetId: string): Promise<Path | null> {
    if (sourceId === targetId) {
      const sourceNode = data.nodes.find(n => n.id === sourceId)
      return sourceNode ? { nodes: [sourceNode], links: [], length: 0, weight: 0 } : null
    }

    // 构建邻接表
    const adjacency = new Map<string, Array<{ nodeId: string; link: GraphLink; weight: number }>>()
    for (const node of data.nodes) {
      adjacency.set(node.id, [])
    }

    for (const link of data.links) {
      const sourceNodeId = typeof link.source === 'string' ? link.source : link.source.id
      const targetNodeId = typeof link.target === 'string' ? link.target : link.target.id
      const weight = link.weight || 1

      adjacency.get(sourceNodeId)?.push({ nodeId: targetNodeId, link, weight })
      adjacency.get(targetNodeId)?.push({ nodeId: sourceNodeId, link, weight })
    }

    // Dijkstra算法
    const distances = new Map<string, number>()
    const previous = new Map<string, { nodeId: string; link: GraphLink }>()
    const visited = new Set<string>()
    const queue: Array<{ nodeId: string; distance: number }> = []

    // 初始化
    for (const node of data.nodes) {
      distances.set(node.id, node.id === sourceId ? 0 : Infinity)
    }
    queue.push({ nodeId: sourceId, distance: 0 })

    while (queue.length > 0) {
      // 找到距离最小的未访问节点
      queue.sort((a, b) => a.distance - b.distance)
      const current = queue.shift()!

      if (visited.has(current.nodeId)) continue
      visited.add(current.nodeId)

      if (current.nodeId === targetId) break

      const neighbors = adjacency.get(current.nodeId) || []
      for (const neighbor of neighbors) {
        if (visited.has(neighbor.nodeId)) continue

        const newDistance = (distances.get(current.nodeId) || 0) + neighbor.weight
        if (newDistance < (distances.get(neighbor.nodeId) || Infinity)) {
          distances.set(neighbor.nodeId, newDistance)
          previous.set(neighbor.nodeId, { nodeId: current.nodeId, link: neighbor.link })
          queue.push({ nodeId: neighbor.nodeId, distance: newDistance })
        }
      }
    }

    // 重构路径
    if (!previous.has(targetId)) return null

    const pathNodes: GraphNode[] = []
    const pathLinks: GraphLink[] = []
    let currentNodeId = targetId

    while (currentNodeId !== sourceId) {
      const node = data.nodes.find(n => n.id === currentNodeId)
      if (!node) return null

      pathNodes.unshift(node)

      const prev = previous.get(currentNodeId)
      if (!prev) return null

      pathLinks.unshift(prev.link)
      currentNodeId = prev.nodeId
    }

    const sourceNode = data.nodes.find(n => n.id === sourceId)
    if (!sourceNode) return null
    pathNodes.unshift(sourceNode)

    return {
      nodes: pathNodes,
      links: pathLinks,
      length: pathNodes.length - 1,
      weight: distances.get(targetId) || 0
    }
  }

  async findAllPaths(data: GraphData, sourceId: string, targetId: string, maxLength: number = 5): Promise<Path[]> {
    const paths: Path[] = []

    // 构建邻接表
    const adjacency = new Map<string, Array<{ nodeId: string; link: GraphLink }>>()
    for (const node of data.nodes) {
      adjacency.set(node.id, [])
    }

    for (const link of data.links) {
      const sourceNodeId = typeof link.source === 'string' ? link.source : link.source.id
      const targetNodeId = typeof link.target === 'string' ? link.target : link.target.id

      adjacency.get(sourceNodeId)?.push({ nodeId: targetNodeId, link })
      adjacency.get(targetNodeId)?.push({ nodeId: sourceNodeId, link })
    }

    // DFS查找所有路径
    const dfs = (currentNodeId: string, visited: Set<string>, pathNodes: GraphNode[], pathLinks: GraphLink[], totalWeight: number) => {
      if (pathNodes.length > maxLength) return

      if (currentNodeId === targetId && pathNodes.length > 1) {
        paths.push({
          nodes: [...pathNodes],
          links: [...pathLinks],
          length: pathNodes.length - 1,
          weight: totalWeight
        })
        return
      }

      const neighbors = adjacency.get(currentNodeId) || []
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor.nodeId)) {
          const neighborNode = data.nodes.find(n => n.id === neighbor.nodeId)
          if (neighborNode) {
            visited.add(neighbor.nodeId)
            pathNodes.push(neighborNode)
            pathLinks.push(neighbor.link)

            dfs(neighbor.nodeId, visited, pathNodes, pathLinks, totalWeight + (neighbor.link.weight || 1))

            pathNodes.pop()
            pathLinks.pop()
            visited.delete(neighbor.nodeId)
          }
        }
      }
    }

    const sourceNode = data.nodes.find(n => n.id === sourceId)
    if (sourceNode) {
      const visited = new Set([sourceId])
      dfs(sourceId, visited, [sourceNode], [], 0)
    }

    return paths.sort((a, b) => a.weight - b.weight)
  }

  async calculatePathLength(data: GraphData, nodeIds: string[]): Promise<number> {
    if (nodeIds.length < 2) return 0

    let totalLength = 0
    for (let i = 0; i < nodeIds.length - 1; i++) {
      const path = await this.findShortestPath(data, nodeIds[i], nodeIds[i + 1])
      if (!path) return Infinity
      totalLength += path.weight
    }

    return totalLength
  }

  async calculateClusteringCoefficient(data: GraphData): Promise<number> {
    let totalCoefficient = 0
    let nodeCount = 0

    // 构建邻接表
    const adjacency = new Map<string, Set<string>>()
    for (const node of data.nodes) {
      adjacency.set(node.id, new Set())
    }

    for (const link of data.links) {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id
      const targetId = typeof link.target === 'string' ? link.target : link.target.id

      adjacency.get(sourceId)?.add(targetId)
      adjacency.get(targetId)?.add(sourceId)
    }

    for (const node of data.nodes) {
      const neighbors = adjacency.get(node.id) || new Set()
      const degree = neighbors.size

      if (degree < 2) continue

      // 计算邻居之间的连接数
      let triangles = 0
      const neighborArray = Array.from(neighbors)

      for (let i = 0; i < neighborArray.length; i++) {
        for (let j = i + 1; j < neighborArray.length; j++) {
          if (adjacency.get(neighborArray[i])?.has(neighborArray[j])) {
            triangles++
          }
        }
      }

      // 聚类系数 = 实际三角形数 / 可能的三角形数
      const possibleTriangles = (degree * (degree - 1)) / 2
      const coefficient = possibleTriangles > 0 ? triangles / possibleTriangles : 0

      totalCoefficient += coefficient
      nodeCount++
    }

    return nodeCount > 0 ? totalCoefficient / nodeCount : 0
  }

  async calculateNetworkDensity(data: GraphData): Promise<number> {
    const nodeCount = data.nodes.length
    const linkCount = data.links.length

    if (nodeCount < 2) return 0

    const maxPossibleLinks = (nodeCount * (nodeCount - 1)) / 2
    return linkCount / maxPossibleLinks
  }

  async findBridges(data: GraphData): Promise<GraphLink[]> {
    // 简化的桥检测算法
    const bridges: GraphLink[] = []

    for (const link of data.links) {
      // 临时移除这条边
      const tempData = {
        nodes: data.nodes,
        links: data.links.filter(l => l.id !== link.id)
      }

      // 检查连通性是否改变
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id
      const targetId = typeof link.target === 'string' ? link.target : link.target.id

      const path = await this.findShortestPath(tempData, sourceId, targetId)
      if (!path) {
        bridges.push(link)
      }
    }

    return bridges
  }

  async findArticulationPoints(data: GraphData): Promise<GraphNode[]> {
    // 简化的关节点检测算法
    const articulationPoints: GraphNode[] = []

    for (const node of data.nodes) {
      // 临时移除这个节点及其相关边
      const tempData = {
        nodes: data.nodes.filter(n => n.id !== node.id),
        links: data.links.filter(l => {
          const sourceId = typeof l.source === 'string' ? l.source : l.source.id
          const targetId = typeof l.target === 'string' ? l.target : l.target.id
          return sourceId !== node.id && targetId !== node.id
        })
      }

      // 检查连通分量数是否增加
      const originalComponents = await this.getConnectedComponents(data)
      const newComponents = await this.getConnectedComponents(tempData)

      if (newComponents.length > originalComponents.length) {
        articulationPoints.push(node)
      }
    }

    return articulationPoints
  }

  async calculateNodeSimilarity(data: GraphData, nodeId1: string, nodeId2: string): Promise<number> {
    // 基于共同邻居的Jaccard相似度
    const neighbors1 = new Set<string>()
    const neighbors2 = new Set<string>()

    for (const link of data.links) {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id
      const targetId = typeof link.target === 'string' ? link.target : link.target.id

      if (sourceId === nodeId1) neighbors1.add(targetId)
      if (targetId === nodeId1) neighbors1.add(sourceId)
      if (sourceId === nodeId2) neighbors2.add(targetId)
      if (targetId === nodeId2) neighbors2.add(sourceId)
    }

    const intersection = new Set([...neighbors1].filter(x => neighbors2.has(x)))
    const union = new Set([...neighbors1, ...neighbors2])

    return union.size > 0 ? intersection.size / union.size : 0
  }

  async findSimilarNodes(data: GraphData, nodeId: string, threshold: number = 0.1): Promise<Array<{ node: GraphNode; similarity: number }>> {
    const similarNodes: Array<{ node: GraphNode; similarity: number }> = []

    for (const node of data.nodes) {
      if (node.id !== nodeId) {
        const similarity = await this.calculateNodeSimilarity(data, nodeId, node.id)
        if (similarity >= threshold) {
          similarNodes.push({ node, similarity })
        }
      }
    }

    return similarNodes.sort((a, b) => b.similarity - a.similarity)
  }

  async calculateInfluenceScore(data: GraphData, nodeId: string): Promise<number> {
    // 综合度中心性和PageRank的影响力分数
    const degreeCentrality = await this.calculateDegreeCentrality(data)
    const pageRank = await this.calculatePageRank(data)

    const degreeScore = degreeCentrality.get(nodeId) || 0
    const pageRankScore = pageRank.get(nodeId) || 0

    return (degreeScore + pageRankScore) / 2
  }

  async findInfluentialNodes(data: GraphData, topK: number = 10): Promise<Array<{ node: GraphNode; score: number }>> {
    const influentialNodes: Array<{ node: GraphNode; score: number }> = []

    for (const node of data.nodes) {
      const score = await this.calculateInfluenceScore(data, node.id)
      influentialNodes.push({ node, score })
    }

    return influentialNodes
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
  }

  async detectAnomalies(data: GraphData): Promise<Array<{ node: GraphNode; anomalyScore: number; reason: string }>> {
    const anomalies: Array<{ node: GraphNode; anomalyScore: number; reason: string }> = []

    // 计算度中心性
    const degreeCentrality = await this.calculateDegreeCentrality(data)
    const degrees = Array.from(degreeCentrality.values())
    const avgDegree = degrees.reduce((a, b) => a + b, 0) / degrees.length
    const stdDegree = Math.sqrt(degrees.reduce((sum, d) => sum + Math.pow(d - avgDegree, 2), 0) / degrees.length)

    for (const node of data.nodes) {
      const degree = degreeCentrality.get(node.id) || 0
      const zScore = stdDegree > 0 ? Math.abs(degree - avgDegree) / stdDegree : 0

      if (zScore > 2) { // 2个标准差之外
        anomalies.push({
          node,
          anomalyScore: zScore,
          reason: degree > avgDegree ? '连接度异常高' : '连接度异常低'
        })
      }
    }

    return anomalies.sort((a, b) => b.anomalyScore - a.anomalyScore)
  }

  async analyzeTrends(historicalData: GraphData[]): Promise<any> {
    if (historicalData.length < 2) {
      return { message: '需要至少2个时间点的数据来分析趋势' }
    }

    const trends = {
      nodeGrowth: [],
      linkGrowth: [],
      densityTrend: [],
      centralityTrends: new Map<string, number[]>()
    }

    for (const data of historicalData) {
      trends.nodeGrowth.push(data.nodes.length)
      trends.linkGrowth.push(data.links.length)

      const density = await this.calculateNetworkDensity(data)
      trends.densityTrend.push(density)
    }

    return trends
  }

  private async louvainCommunityDetection(data: GraphData): Promise<Cluster[]> {
    // 简化的Louvain算法实现
    const communities = new Map<string, Set<string>>()
    let communityId = 0

    // 初始化：每个节点为一个社区
    for (const node of data.nodes) {
      communities.set(`community_${communityId++}`, new Set([node.id]))
    }

    // 这里应该实现完整的Louvain算法
    // 为了简化，返回基于连通分量的社区
    const connectedComponents = await this.getConnectedComponents(data)

    const clusters: Cluster[] = []
    for (let i = 0; i < connectedComponents.length; i++) {
      const component = connectedComponents[i]
      clusters.push({
        id: `cluster_${i}`,
        nodes: component.map(n => n.id),
        center: { x: 0, y: 0 }, // 可以计算质心
        radius: 50,
        color: `hsl(${(i * 137.5) % 360}, 70%, 50%)`,
        label: `社区 ${i + 1}`
      })
    }

    return clusters
  }

  private async modularityCommunityDetection(data: GraphData): Promise<Cluster[]> {
    // 基于模块度优化的社区检测
    return this.louvainCommunityDetection(data) // 简化实现
  }

  private async getConnectedComponents(data: GraphData): Promise<GraphNode[][]> {
    const visited = new Set<string>()
    const components: GraphNode[][] = []

    // 构建邻接表
    const adjacency = new Map<string, string[]>()
    for (const node of data.nodes) {
      adjacency.set(node.id, [])
    }

    for (const link of data.links) {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id
      const targetId = typeof link.target === 'string' ? link.target : link.target.id

      adjacency.get(sourceId)?.push(targetId)
      adjacency.get(targetId)?.push(sourceId)
    }

    // DFS查找连通分量
    const dfs = (nodeId: string, component: GraphNode[]) => {
      if (visited.has(nodeId)) return

      visited.add(nodeId)
      const node = data.nodes.find(n => n.id === nodeId)
      if (node) {
        component.push(node)
      }

      const neighbors = adjacency.get(nodeId) || []
      for (const neighborId of neighbors) {
        dfs(neighborId, component)
      }
    }

    for (const node of data.nodes) {
      if (!visited.has(node.id)) {
        const component: GraphNode[] = []
        dfs(node.id, component)
        if (component.length > 0) {
          components.push(component)
        }
      }
    }

    return components
  }
}