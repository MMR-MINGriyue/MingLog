/**
 * 图谱工具函数
 */

import * as d3 from 'd3'
import { GraphNode, GraphLink, GraphData, GraphFilter } from '../types'

// 创建力导向仿真
export const createForceSimulation = (
  nodes: GraphNode[],
  links: GraphLink[],
  config: {
    width: number
    height: number
    linkDistance: number
    linkStrength: number
    chargeStrength: number
    centerForce: number
    collisionRadius: number
  }
) => {
  const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id((d: any) => d.id).distance(config.linkDistance).strength(config.linkStrength))
    .force('charge', d3.forceManyBody().strength(config.chargeStrength))
    .force('center', d3.forceCenter(config.width / 2, config.height / 2).strength(config.centerForce))
    .force('collision', d3.forceCollide().radius(config.collisionRadius))

  return simulation
}

// 更新仿真
export const updateSimulation = (
  linkSelection: any,
  nodeSelection: any,
  labelGroup: any
) => {
  linkSelection
    .attr('x1', (d: any) => d.source.x)
    .attr('y1', (d: any) => d.source.y)
    .attr('x2', (d: any) => d.target.x)
    .attr('y2', (d: any) => d.target.y)

  nodeSelection
    .attr('cx', (d: any) => d.x)
    .attr('cy', (d: any) => d.y)

  labelGroup.selectAll('text')
    .attr('x', (d: any) => d.x)
    .attr('y', (d: any) => d.y + 4)
}

// 渲染节点
export const renderNodes = (
  nodeGroup: any,
  nodes: GraphNode[],
  config: {
    nodeRadius: number
    getNodeColor: (node: GraphNode) => string
    onNodeClick: (node: GraphNode, event: MouseEvent) => void
    onNodeHover: (node: GraphNode | null, event: MouseEvent) => void
  }
) => {
  const nodeSelection = nodeGroup
    .selectAll('circle')
    .data(nodes)
    .enter()
    .append('circle')
    .attr('r', config.nodeRadius)
    .attr('fill', config.getNodeColor)
    .style('cursor', 'pointer')
    .on('click', (event: MouseEvent, d: GraphNode) => {
      event.stopPropagation()
      config.onNodeClick(d, event)
    })
    .on('mouseenter', (event: MouseEvent, d: GraphNode) => {
      config.onNodeHover(d, event)
    })
    .on('mouseleave', (event: MouseEvent) => {
      config.onNodeHover(null, event)
    })

  return nodeSelection
}

// 渲染链接
export const renderLinks = (
  linkGroup: any,
  links: GraphLink[],
  config: {
    getLinkColor: (link: GraphLink) => string
    onLinkClick: (link: GraphLink, event: MouseEvent) => void
    onLinkHover: (link: GraphLink | null, event: MouseEvent) => void
  }
) => {
  const linkSelection = linkGroup
    .selectAll('line')
    .data(links)
    .enter()
    .append('line')
    .attr('stroke', config.getLinkColor)
    .attr('stroke-width', 1)
    .style('cursor', 'pointer')
    .on('click', (event: MouseEvent, d: GraphLink) => {
      event.stopPropagation()
      config.onLinkClick(d, event)
    })
    .on('mouseenter', (event: MouseEvent, d: GraphLink) => {
      config.onLinkHover(d, event)
    })
    .on('mouseleave', (event: MouseEvent) => {
      config.onLinkHover(null, event)
    })

  return linkSelection
}

// 渲染标签
export const renderLabels = (labelGroup: any, nodes: GraphNode[]) => {
  labelGroup
    .selectAll('text')
    .data(nodes)
    .enter()
    .append('text')
    .text((d: GraphNode) => d.title)
    .attr('text-anchor', 'middle')
    .attr('font-size', '12px')
    .attr('fill', '#333')
    .style('pointer-events', 'none')
}

// 设置缩放
export const setupZoom = (
  svg: any,
  zoomGroup: any,
  config: {
    enableZoom: boolean
    enablePan: boolean
    maxZoom: number
    minZoom: number
  },
  onZoom: (transform: { x: number; y: number; k: number }) => void
) => {
  const zoom = d3.zoom()
    .scaleExtent([config.minZoom, config.maxZoom])
    .on('zoom', (event: any) => {
      const { x, y, k } = event.transform
      zoomGroup.attr('transform', event.transform)
      onZoom({ x, y, k })
    })

  if (config.enableZoom && config.enablePan) {
    svg.call(zoom)
  } else if (config.enablePan) {
    svg.call(zoom.scaleExtent([1, 1]))
  }
}

// 设置拖拽
export const setupDrag = (
  nodeSelection: any,
  simulation: any,
  config: {
    onDragStart?: (node: GraphNode, event: MouseEvent) => void
    onDragEnd?: (node: GraphNode, event: MouseEvent) => void
  }
) => {
  const drag = d3.drag<Element, GraphNode>()
    .on('start', (event: any, d: GraphNode) => {
      if (!event.active) simulation.alphaTarget(0.3).restart()
      d.fx = d.x
      d.fy = d.y
      config.onDragStart?.(d, event.sourceEvent)
    })
    .on('drag', (event: any, d: GraphNode) => {
      d.fx = event.x
      d.fy = event.y
    })
    .on('end', (event: any, d: GraphNode) => {
      if (!event.active) simulation.alphaTarget(0)
      d.fx = null
      d.fy = null
      config.onDragEnd?.(d, event.sourceEvent)
    })

  nodeSelection.call(drag)
}

// 过滤图数据
export const filterGraphData = (data: GraphData, filter: GraphFilter): GraphData => {
  let filteredNodes = [...data.nodes]
  let filteredLinks = [...data.links]

  // 按节点类型过滤
  if (filter.nodeTypes && filter.nodeTypes.length > 0) {
    filteredNodes = filteredNodes.filter(node => filter.nodeTypes!.includes(node.type))
  }

  // 按链接类型过滤
  if (filter.linkTypes && filter.linkTypes.length > 0) {
    filteredLinks = filteredLinks.filter(link => filter.linkTypes!.includes(link.type))
  }

  // 按标签过滤
  if (filter.tags && filter.tags.length > 0) {
    filteredNodes = filteredNodes.filter(node => 
      node.tags && node.tags.some(tag => filter.tags!.includes(tag))
    )
  }

  // 按搜索查询过滤
  if (filter.searchQuery) {
    const query = filter.searchQuery.toLowerCase()
    filteredNodes = filteredNodes.filter(node => 
      node.title.toLowerCase().includes(query) ||
      (node.content && node.content.toLowerCase().includes(query))
    )
  }

  // 按日期范围过滤
  if (filter.dateRange) {
    const { start, end } = filter.dateRange
    filteredNodes = filteredNodes.filter(node => {
      if (!node.createdAt) return false
      const nodeDate = new Date(node.createdAt)
      return nodeDate >= new Date(start) && nodeDate <= new Date(end)
    })
  }

  // 过滤掉不存在的节点的链接
  const nodeIds = new Set(filteredNodes.map(node => node.id))
  filteredLinks = filteredLinks.filter(link => {
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id
    const targetId = typeof link.target === 'string' ? link.target : link.target.id
    return nodeIds.has(sourceId) && nodeIds.has(targetId)
  })

  return {
    nodes: filteredNodes,
    links: filteredLinks
  }
}

// 计算图统计信息
export const calculateGraphStats = (data: GraphData) => {
  const nodeCount = data.nodes.length
  const linkCount = data.links.length
  
  // 计算连接度
  const connections = new Map<string, number>()
  data.links.forEach(link => {
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id
    const targetId = typeof link.target === 'string' ? link.target : link.target.id
    
    connections.set(sourceId, (connections.get(sourceId) || 0) + 1)
    connections.set(targetId, (connections.get(targetId) || 0) + 1)
  })

  const connectionCounts = Array.from(connections.values())
  const avgConnections = connectionCounts.length > 0 
    ? connectionCounts.reduce((sum, count) => sum + count, 0) / connectionCounts.length 
    : 0
  const maxConnections = connectionCounts.length > 0 ? Math.max(...connectionCounts) : 0

  // 计算密度
  const maxPossibleLinks = nodeCount * (nodeCount - 1) / 2
  const density = maxPossibleLinks > 0 ? linkCount / maxPossibleLinks : 0

  return {
    nodeCount,
    linkCount,
    avgConnections,
    maxConnections,
    clusters: 0, // 需要更复杂的算法计算
    density,
    components: 0 // 需要更复杂的算法计算
  }
}

// 查找最短路径
export const findShortestPath = (
  data: GraphData,
  sourceId: string,
  targetId: string
): GraphNode[] | null => {
  // 简化的BFS实现
  const visited = new Set<string>()
  const queue: { nodeId: string; path: string[] }[] = [{ nodeId: sourceId, path: [sourceId] }]
  
  // 构建邻接表
  const adjacency = new Map<string, string[]>()
  data.links.forEach(link => {
    const source = typeof link.source === 'string' ? link.source : link.source.id
    const target = typeof link.target === 'string' ? link.target : link.target.id
    
    if (!adjacency.has(source)) adjacency.set(source, [])
    if (!adjacency.has(target)) adjacency.set(target, [])
    
    adjacency.get(source)!.push(target)
    adjacency.get(target)!.push(source)
  })

  while (queue.length > 0) {
    const { nodeId, path } = queue.shift()!
    
    if (nodeId === targetId) {
      return path.map(id => data.nodes.find(node => node.id === id)!).filter(Boolean)
    }
    
    if (visited.has(nodeId)) continue
    visited.add(nodeId)
    
    const neighbors = adjacency.get(nodeId) || []
    neighbors.forEach(neighborId => {
      if (!visited.has(neighborId)) {
        queue.push({ nodeId: neighborId, path: [...path, neighborId] })
      }
    })
  }
  
  return null
}

// 导出聚类功能
export * from './clustering'

// 导出分析功能
export * from './analytics'
