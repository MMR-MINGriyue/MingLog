/**
 * 图谱分析和统计工具
 */

import { GraphNode, GraphLink, GraphStats } from '../types'

/**
 * 计算图谱统计信息
 */
export const calculateGraphStats = (
  nodes: GraphNode[],
  links: GraphLink[]
): GraphStats => {
  const nodeCount = nodes.length
  const linkCount = links.length

  // 计算连接度统计
  const connectionCounts = new Map<string, number>()
  nodes.forEach(node => connectionCounts.set(node.id, 0))

  links.forEach(link => {
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id
    const targetId = typeof link.target === 'string' ? link.target : link.target.id
    
    connectionCounts.set(sourceId, (connectionCounts.get(sourceId) || 0) + 1)
    connectionCounts.set(targetId, (connectionCounts.get(targetId) || 0) + 1)
  })

  const connections = Array.from(connectionCounts.values())
  const avgConnections = connections.length > 0 
    ? connections.reduce((sum, count) => sum + count, 0) / connections.length 
    : 0
  const maxConnections = connections.length > 0 ? Math.max(...connections) : 0

  // 计算图密度
  const maxPossibleLinks = nodeCount * (nodeCount - 1) / 2
  const density = maxPossibleLinks > 0 ? linkCount / maxPossibleLinks : 0

  // 计算连通分量数量
  const components = calculateConnectedComponents(nodes, links)

  return {
    nodeCount,
    linkCount,
    avgConnections: Math.round(avgConnections * 100) / 100,
    maxConnections,
    clusters: 0, // 这个值需要从外部传入
    density: Math.round(density * 10000) / 10000,
    components
  }
}

/**
 * 计算连通分量数量
 */
export const calculateConnectedComponents = (
  nodes: GraphNode[],
  links: GraphLink[]
): number => {
  const visited = new Set<string>()
  const adjacencyMap = new Map<string, Set<string>>()
  
  // 构建邻接表
  nodes.forEach(node => {
    adjacencyMap.set(node.id, new Set())
  })
  
  links.forEach(link => {
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id
    const targetId = typeof link.target === 'string' ? link.target : link.target.id
    
    adjacencyMap.get(sourceId)?.add(targetId)
    adjacencyMap.get(targetId)?.add(sourceId)
  })
  
  let componentCount = 0
  
  // DFS遍历每个连通分量
  const dfs = (nodeId: string) => {
    if (visited.has(nodeId)) return
    
    visited.add(nodeId)
    const neighbors = adjacencyMap.get(nodeId) || new Set()
    
    neighbors.forEach(neighborId => {
      if (!visited.has(neighborId)) {
        dfs(neighborId)
      }
    })
  }
  
  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      dfs(node.id)
      componentCount++
    }
  })
  
  return componentCount
}

/**
 * 查找中心节点（连接度最高的节点）
 */
export const findCentralNodes = (
  nodes: GraphNode[],
  links: GraphLink[],
  topN = 5
): Array<{ node: GraphNode; connections: number; centrality: number }> => {
  const connectionCounts = new Map<string, number>()
  nodes.forEach(node => connectionCounts.set(node.id, 0))

  links.forEach(link => {
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id
    const targetId = typeof link.target === 'string' ? link.target : link.target.id
    
    connectionCounts.set(sourceId, (connectionCounts.get(sourceId) || 0) + 1)
    connectionCounts.set(targetId, (connectionCounts.get(targetId) || 0) + 1)
  })

  const maxConnections = Math.max(...Array.from(connectionCounts.values()))

  return nodes
    .map(node => ({
      node,
      connections: connectionCounts.get(node.id) || 0,
      centrality: maxConnections > 0 ? (connectionCounts.get(node.id) || 0) / maxConnections : 0
    }))
    .sort((a, b) => b.connections - a.connections)
    .slice(0, topN)
}

/**
 * 查找孤立节点（没有连接的节点）
 */
export const findIsolatedNodes = (
  nodes: GraphNode[],
  links: GraphLink[]
): GraphNode[] => {
  const connectedNodes = new Set<string>()
  
  links.forEach(link => {
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id
    const targetId = typeof link.target === 'string' ? link.target : link.target.id
    
    connectedNodes.add(sourceId)
    connectedNodes.add(targetId)
  })
  
  return nodes.filter(node => !connectedNodes.has(node.id))
}

/**
 * 计算节点间的最短路径
 */
export const calculateShortestPath = (
  nodes: GraphNode[],
  links: GraphLink[],
  startNodeId: string,
  endNodeId: string
): string[] | null => {
  const adjacencyMap = new Map<string, Set<string>>()
  
  // 构建邻接表
  nodes.forEach(node => {
    adjacencyMap.set(node.id, new Set())
  })
  
  links.forEach(link => {
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id
    const targetId = typeof link.target === 'string' ? link.target : link.target.id
    
    adjacencyMap.get(sourceId)?.add(targetId)
    adjacencyMap.get(targetId)?.add(sourceId)
  })
  
  // BFS查找最短路径
  const queue: Array<{ nodeId: string; path: string[] }> = [
    { nodeId: startNodeId, path: [startNodeId] }
  ]
  const visited = new Set<string>([startNodeId])
  
  while (queue.length > 0) {
    const { nodeId, path } = queue.shift()!
    
    if (nodeId === endNodeId) {
      return path
    }
    
    const neighbors = adjacencyMap.get(nodeId) || new Set()
    neighbors.forEach(neighborId => {
      if (!visited.has(neighborId)) {
        visited.add(neighborId)
        queue.push({ nodeId: neighborId, path: [...path, neighborId] })
      }
    })
  }
  
  return null
}

/**
 * 分析节点类型分布
 */
export const analyzeNodeTypeDistribution = (
  nodes: GraphNode[]
): Record<string, { count: number; percentage: number }> => {
  const typeCount = new Map<string, number>()
  
  nodes.forEach(node => {
    typeCount.set(node.type, (typeCount.get(node.type) || 0) + 1)
  })
  
  const total = nodes.length
  const distribution: Record<string, { count: number; percentage: number }> = {}
  
  typeCount.forEach((count, type) => {
    distribution[type] = {
      count,
      percentage: Math.round((count / total) * 10000) / 100
    }
  })
  
  return distribution
}

/**
 * 分析链接类型分布
 */
export const analyzeLinkTypeDistribution = (
  links: GraphLink[]
): Record<string, { count: number; percentage: number }> => {
  const typeCount = new Map<string, number>()
  
  links.forEach(link => {
    typeCount.set(link.type, (typeCount.get(link.type) || 0) + 1)
  })
  
  const total = links.length
  const distribution: Record<string, { count: number; percentage: number }> = {}
  
  typeCount.forEach((count, type) => {
    distribution[type] = {
      count,
      percentage: Math.round((count / total) * 10000) / 100
    }
  })
  
  return distribution
}

/**
 * 生成图谱分析报告
 */
export const generateAnalysisReport = (
  nodes: GraphNode[],
  links: GraphLink[]
): {
  stats: GraphStats
  centralNodes: Array<{ node: GraphNode; connections: number; centrality: number }>
  isolatedNodes: GraphNode[]
  nodeTypeDistribution: Record<string, { count: number; percentage: number }>
  linkTypeDistribution: Record<string, { count: number; percentage: number }>
  recommendations: string[]
} => {
  const stats = calculateGraphStats(nodes, links)
  const centralNodes = findCentralNodes(nodes, links)
  const isolatedNodes = findIsolatedNodes(nodes, links)
  const nodeTypeDistribution = analyzeNodeTypeDistribution(nodes)
  const linkTypeDistribution = analyzeLinkTypeDistribution(links)
  
  // 生成建议
  const recommendations: string[] = []
  
  if (isolatedNodes.length > 0) {
    recommendations.push(`发现 ${isolatedNodes.length} 个孤立节点，建议建立更多连接`)
  }
  
  if (stats.density < 0.1) {
    recommendations.push('图谱密度较低，建议增加节点间的关联')
  }
  
  if (stats.components > 1) {
    recommendations.push(`图谱有 ${stats.components} 个独立的连通分量，建议建立跨组件的连接`)
  }
  
  if (centralNodes.length > 0 && centralNodes[0].connections > stats.avgConnections * 3) {
    recommendations.push('存在高度中心化的节点，建议平衡连接分布')
  }
  
  return {
    stats,
    centralNodes,
    isolatedNodes,
    nodeTypeDistribution,
    linkTypeDistribution,
    recommendations
  }
}
