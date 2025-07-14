/**
 * 图谱聚类分析工具
 */

import { GraphNode, GraphLink, Cluster } from '../types'

/**
 * 基于连接度的聚类算法
 */
export const clusterByConnectivity = (
  nodes: GraphNode[],
  links: GraphLink[],
  options: {
    minClusterSize?: number
    maxClusters?: number
    threshold?: number
  } = {}
): Cluster[] => {
  const { minClusterSize = 3, maxClusters = 10, threshold = 0.5 } = options

  // 构建邻接表
  const adjacencyMap = new Map<string, Set<string>>()
  nodes.forEach(node => {
    adjacencyMap.set(node.id, new Set())
  })

  links.forEach(link => {
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id
    const targetId = typeof link.target === 'string' ? link.target : link.target.id
    
    adjacencyMap.get(sourceId)?.add(targetId)
    adjacencyMap.get(targetId)?.add(sourceId)
  })

  // 计算节点间的相似度
  const calculateSimilarity = (nodeId1: string, nodeId2: string): number => {
    const neighbors1 = adjacencyMap.get(nodeId1) || new Set()
    const neighbors2 = adjacencyMap.get(nodeId2) || new Set()
    
    const intersection = new Set([...neighbors1].filter(x => neighbors2.has(x)))
    const union = new Set([...neighbors1, ...neighbors2])
    
    return union.size > 0 ? intersection.size / union.size : 0
  }

  // 使用层次聚类
  const clusters: Cluster[] = []
  const visited = new Set<string>()

  nodes.forEach(node => {
    if (visited.has(node.id)) return

    const cluster: Cluster = {
      id: `cluster_${clusters.length}`,
      nodes: [node.id],
      center: { x: node.x || 0, y: node.y || 0 },
      radius: 50,
      color: getClusterColor(clusters.length),
      label: `聚类 ${clusters.length + 1}`
    }

    visited.add(node.id)

    // 查找相似的节点
    nodes.forEach(otherNode => {
      if (visited.has(otherNode.id)) return
      
      const similarity = calculateSimilarity(node.id, otherNode.id)
      if (similarity >= threshold) {
        cluster.nodes.push(otherNode.id)
        visited.add(otherNode.id)
      }
    })

    // 只保留足够大的聚类
    if (cluster.nodes.length >= minClusterSize) {
      // 计算聚类中心
      const clusterNodes = cluster.nodes.map(id => nodes.find(n => n.id === id)!).filter(Boolean)
      const centerX = clusterNodes.reduce((sum, n) => sum + (n.x || 0), 0) / clusterNodes.length
      const centerY = clusterNodes.reduce((sum, n) => sum + (n.y || 0), 0) / clusterNodes.length
      
      cluster.center = { x: centerX, y: centerY }
      cluster.radius = Math.max(50, Math.sqrt(clusterNodes.length) * 20)
      
      clusters.push(cluster)
    }
  })

  // 限制聚类数量
  return clusters.slice(0, maxClusters)
}

/**
 * 基于标签的聚类算法
 */
export const clusterByTags = (
  nodes: GraphNode[],
  options: {
    minClusterSize?: number
    maxClusters?: number
  } = {}
): Cluster[] => {
  const { minClusterSize = 2, maxClusters = 15 } = options

  // 按标签分组
  const tagGroups = new Map<string, GraphNode[]>()
  
  nodes.forEach(node => {
    if (node.tags && node.tags.length > 0) {
      node.tags.forEach(tag => {
        if (!tagGroups.has(tag)) {
          tagGroups.set(tag, [])
        }
        tagGroups.get(tag)!.push(node)
      })
    }
  })

  const clusters: Cluster[] = []
  let clusterIndex = 0

  tagGroups.forEach((tagNodes, tag) => {
    if (tagNodes.length >= minClusterSize && clusterIndex < maxClusters) {
      // 计算聚类中心
      const centerX = tagNodes.reduce((sum, n) => sum + (n.x || 0), 0) / tagNodes.length
      const centerY = tagNodes.reduce((sum, n) => sum + (n.y || 0), 0) / tagNodes.length

      const cluster: Cluster = {
        id: `tag_cluster_${clusterIndex}`,
        nodes: tagNodes.map(n => n.id),
        center: { x: centerX, y: centerY },
        radius: Math.max(40, Math.sqrt(tagNodes.length) * 15),
        color: getClusterColor(clusterIndex),
        label: `#${tag}`
      }

      clusters.push(cluster)
      clusterIndex++
    }
  })

  return clusters
}

/**
 * 基于节点类型的聚类算法
 */
export const clusterByType = (
  nodes: GraphNode[],
  options: {
    minClusterSize?: number
  } = {}
): Cluster[] => {
  const { minClusterSize = 2 } = options

  // 按类型分组
  const typeGroups = new Map<string, GraphNode[]>()
  
  nodes.forEach(node => {
    if (!typeGroups.has(node.type)) {
      typeGroups.set(node.type, [])
    }
    typeGroups.get(node.type)!.push(node)
  })

  const clusters: Cluster[] = []
  let clusterIndex = 0

  typeGroups.forEach((typeNodes, type) => {
    if (typeNodes.length >= minClusterSize) {
      // 计算聚类中心
      const centerX = typeNodes.reduce((sum, n) => sum + (n.x || 0), 0) / typeNodes.length
      const centerY = typeNodes.reduce((sum, n) => sum + (n.y || 0), 0) / typeNodes.length

      const cluster: Cluster = {
        id: `type_cluster_${clusterIndex}`,
        nodes: typeNodes.map(n => n.id),
        center: { x: centerX, y: centerY },
        radius: Math.max(50, Math.sqrt(typeNodes.length) * 18),
        color: getClusterColor(clusterIndex),
        label: getTypeLabel(type)
      }

      clusters.push(cluster)
      clusterIndex++
    }
  })

  return clusters
}

/**
 * 获取聚类颜色
 */
const getClusterColor = (index: number): string => {
  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1'
  ]
  return colors[index % colors.length]
}

/**
 * 获取类型标签
 */
const getTypeLabel = (type: string): string => {
  const typeLabels: Record<string, string> = {
    'note': '笔记',
    'tag': '标签',
    'folder': '文件夹',
    'link': '链接'
  }
  return typeLabels[type] || type
}

/**
 * 计算聚类统计信息
 */
export const calculateClusterStats = (clusters: Cluster[]): {
  totalClusters: number
  averageSize: number
  largestCluster: number
  smallestCluster: number
  coverage: number
} => {
  if (clusters.length === 0) {
    return {
      totalClusters: 0,
      averageSize: 0,
      largestCluster: 0,
      smallestCluster: 0,
      coverage: 0
    }
  }

  const sizes = clusters.map(c => c.nodes.length)
  const totalNodes = sizes.reduce((sum, size) => sum + size, 0)

  return {
    totalClusters: clusters.length,
    averageSize: Math.round(totalNodes / clusters.length),
    largestCluster: Math.max(...sizes),
    smallestCluster: Math.min(...sizes),
    coverage: totalNodes // 这里需要总节点数来计算覆盖率
  }
}
