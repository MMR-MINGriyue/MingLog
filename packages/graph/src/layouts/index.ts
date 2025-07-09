/**
 * 图谱布局算法集合
 */

import * as d3 from 'd3'
import { GraphNode, GraphLink, LayoutType, LayoutConfig } from '../types'

// 力导向布局
export const forceLayout = (
  nodes: GraphNode[],
  links: GraphLink[],
  config: {
    width: number
    height: number
    linkDistance?: number
    linkStrength?: number
    chargeStrength?: number
    centerForce?: number
    collisionRadius?: number
  }
) => {
  const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links)
      .id((d: any) => d.id)
      .distance(config.linkDistance || 50)
      .strength(config.linkStrength || 0.1)
    )
    .force('charge', d3.forceManyBody().strength(config.chargeStrength || -300))
    .force('center', d3.forceCenter(config.width / 2, config.height / 2).strength(config.centerForce || 0.1))
    .force('collision', d3.forceCollide().radius(config.collisionRadius || 12))

  return simulation
}

// 环形布局
export const circularLayout = (
  nodes: GraphNode[],
  links: GraphLink[],
  config: { width: number; height: number; radius?: number }
) => {
  const radius = config.radius || Math.min(config.width, config.height) / 3
  const centerX = config.width / 2
  const centerY = config.height / 2
  
  nodes.forEach((node, i) => {
    const angle = (2 * Math.PI * i) / nodes.length
    node.x = centerX + radius * Math.cos(angle)
    node.y = centerY + radius * Math.sin(angle)
    node.fx = node.x
    node.fy = node.y
  })

  return nodes
}

// 层次布局
export const hierarchicalLayout = (
  nodes: GraphNode[],
  links: GraphLink[],
  config: { width: number; height: number; levelHeight?: number }
) => {
  const levelHeight = config.levelHeight || 100
  const nodesByLevel = new Map<number, GraphNode[]>()
  
  // 计算节点层级
  const visited = new Set<string>()
  const queue: { node: GraphNode; level: number }[] = []
  
  // 找到根节点（入度为0的节点）
  const inDegree = new Map<string, number>()
  nodes.forEach(node => inDegree.set(node.id, 0))
  links.forEach(link => {
    const targetId = typeof link.target === 'string' ? link.target : link.target.id
    inDegree.set(targetId, (inDegree.get(targetId) || 0) + 1)
  })
  
  const rootNodes = nodes.filter(node => inDegree.get(node.id) === 0)
  rootNodes.forEach(node => queue.push({ node, level: 0 }))
  
  // BFS分层
  while (queue.length > 0) {
    const { node, level } = queue.shift()!
    
    if (visited.has(node.id)) continue
    visited.add(node.id)
    
    if (!nodesByLevel.has(level)) {
      nodesByLevel.set(level, [])
    }
    nodesByLevel.get(level)!.push(node)
    
    // 添加子节点
    links.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id
      if (sourceId === node.id) {
        const targetId = typeof link.target === 'string' ? link.target : link.target.id
        const targetNode = nodes.find(n => n.id === targetId)
        if (targetNode && !visited.has(targetId)) {
          queue.push({ node: targetNode, level: level + 1 })
        }
      }
    })
  }
  
  // 设置节点位置
  nodesByLevel.forEach((levelNodes, level) => {
    const y = level * levelHeight + 50
    const totalWidth = config.width - 100
    const nodeSpacing = totalWidth / (levelNodes.length + 1)
    
    levelNodes.forEach((node, i) => {
      node.x = 50 + nodeSpacing * (i + 1)
      node.y = y
      node.fx = node.x
      node.fy = node.y
    })
  })

  return nodes
}

// 网格布局
export const gridLayout = (
  nodes: GraphNode[],
  links: GraphLink[],
  config: { width: number; height: number; columns?: number }
) => {
  const columns = config.columns || Math.ceil(Math.sqrt(nodes.length))
  const rows = Math.ceil(nodes.length / columns)
  
  const cellWidth = config.width / columns
  const cellHeight = config.height / rows
  
  nodes.forEach((node, i) => {
    const col = i % columns
    const row = Math.floor(i / columns)
    
    node.x = col * cellWidth + cellWidth / 2
    node.y = row * cellHeight + cellHeight / 2
    node.fx = node.x
    node.fy = node.y
  })

  return nodes
}

// 径向布局
export const radialLayout = (
  nodes: GraphNode[],
  links: GraphLink[],
  config: { width: number; height: number; centerNodeId?: string }
) => {
  const centerX = config.width / 2
  const centerY = config.height / 2
  
  // 找到中心节点
  let centerNode = nodes.find(n => n.id === config.centerNodeId)
  if (!centerNode) {
    // 选择连接数最多的节点作为中心
    const connectionCounts = new Map<string, number>()
    links.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id
      const targetId = typeof link.target === 'string' ? link.target : link.target.id
      
      connectionCounts.set(sourceId, (connectionCounts.get(sourceId) || 0) + 1)
      connectionCounts.set(targetId, (connectionCounts.get(targetId) || 0) + 1)
    })
    
    let maxConnections = 0
    nodes.forEach(node => {
      const connections = connectionCounts.get(node.id) || 0
      if (connections > maxConnections) {
        maxConnections = connections
        centerNode = node
      }
    })
  }
  
  if (!centerNode) {
    centerNode = nodes[0]
  }
  
  // 设置中心节点位置
  centerNode.x = centerX
  centerNode.y = centerY
  centerNode.fx = centerX
  centerNode.fy = centerY
  
  // 计算其他节点到中心的距离
  const distances = new Map<string, number>()
  const visited = new Set<string>()
  const queue: { nodeId: string; distance: number }[] = [{ nodeId: centerNode.id, distance: 0 }]
  
  while (queue.length > 0) {
    const { nodeId, distance } = queue.shift()!
    
    if (visited.has(nodeId)) continue
    visited.add(nodeId)
    distances.set(nodeId, distance)
    
    // 添加邻接节点
    links.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id
      const targetId = typeof link.target === 'string' ? link.target : link.target.id
      
      if (sourceId === nodeId && !visited.has(targetId)) {
        queue.push({ nodeId: targetId, distance: distance + 1 })
      } else if (targetId === nodeId && !visited.has(sourceId)) {
        queue.push({ nodeId: sourceId, distance: distance + 1 })
      }
    })
  }
  
  // 按距离分组节点
  const nodesByDistance = new Map<number, GraphNode[]>()
  nodes.forEach(node => {
    if (node.id === centerNode!.id) return
    
    const distance = distances.get(node.id) || 1
    if (!nodesByDistance.has(distance)) {
      nodesByDistance.set(distance, [])
    }
    nodesByDistance.get(distance)!.push(node)
  })
  
  // 设置节点位置
  nodesByDistance.forEach((distanceNodes, distance) => {
    const radius = distance * 80 + 60
    const angleStep = (2 * Math.PI) / distanceNodes.length
    
    distanceNodes.forEach((node, i) => {
      const angle = i * angleStep
      node.x = centerX + radius * Math.cos(angle)
      node.y = centerY + radius * Math.sin(angle)
      node.fx = node.x
      node.fy = node.y
    })
  })

  return nodes
}

// 应用布局
export const applyLayout = (
  nodes: GraphNode[],
  links: GraphLink[],
  layoutConfig: LayoutConfig,
  canvasConfig: { width: number; height: number }
) => {
  // 清除之前的固定位置
  nodes.forEach(node => {
    node.fx = null
    node.fy = null
  })
  
  switch (layoutConfig.type) {
    case 'force':
      return forceLayout(nodes, links, {
        ...canvasConfig,
        linkDistance: layoutConfig.linkDistance,
        linkStrength: layoutConfig.linkStrength,
        chargeStrength: layoutConfig.forceStrength,
        centerStrength: layoutConfig.centerStrength,
        collisionRadius: 12
      })
      
    case 'circular':
      return circularLayout(nodes, links, canvasConfig)
      
    case 'hierarchical':
      return hierarchicalLayout(nodes, links, canvasConfig)
      
    case 'grid':
      return gridLayout(nodes, links, canvasConfig)
      
    case 'radial':
      return radialLayout(nodes, links, canvasConfig)
      
    default:
      return forceLayout(nodes, links, canvasConfig)
  }
}
