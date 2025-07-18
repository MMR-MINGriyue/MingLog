/**
 * 图谱可视化主组件
 */

import React, { useRef, useEffect, useState, useCallback } from 'react'
import * as d3 from 'd3'
import type { Simulation } from 'd3-force'
import { GraphViewProps, GraphNode, GraphLink, GraphState, Cluster } from '../types'
import {
  createForceSimulation,
  updateSimulation,
  renderNodes,
  renderLinks,
  renderLabels,
  setupZoom,
  setupDrag,
  filterGraphData,
  clusterByConnectivity,
  clusterByTags,
  clusterByType
} from '../utils'
import GraphInteractions from './GraphInteractions'

export const GraphView: React.FC<GraphViewProps> = ({
  data,
  width = 800,
  height = 600,
  nodeRadius = 8,
  linkDistance = 50,
  linkStrength = 0.1,
  chargeStrength = -300,
  centerForce = 0.1,
  collisionRadius = 12,
  enableZoom = true,
  enableDrag = true,
  enablePan = true,
  showLabels = true,
  showTooltips = true,
  highlightConnected = true,
  maxZoom = 10,
  minZoom = 0.1,
  backgroundColor = '#ffffff',
  nodeColors = {},
  linkColors = {},
  filter,
  layout,
  loading = false,
  error = null,
  onNodeClick,
  onNodeDoubleClick,
  onNodeHover,
  onLinkClick,
  onLinkHover,
  onBackgroundClick,
  onZoom,
  onDragStart,
  onDragEnd,
  className = '',
  style
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const simulationRef = useRef<Simulation<GraphNode, GraphLink> | null>(null)
  
  const [graphState, setGraphState] = useState<GraphState>({
    selectedNodes: new Set(),
    hoveredNode: null,
    hoveredLink: null,
    transform: { x: 0, y: 0, k: 1 },
    isLoading: loading,
    error
  })

  // 过滤数据
  const filteredData = filter ? filterGraphData(data, filter) : data

  // 性能优化状态
  const [visibleNodes, setVisibleNodes] = useState<GraphNode[]>([])
  const [visibleLinks, setVisibleLinks] = useState<GraphLink[]>([])
  const [renderBounds, setRenderBounds] = useState({
    x: 0, y: 0, width: 0, height: 0
  })

  // 聚类分析状态
  const [clusters, setClusters] = useState<Cluster[]>([])
  const [showClusters, setShowClusters] = useState(false)
  const [clusterType, setClusterType] = useState<'connectivity' | 'tags' | 'type'>('connectivity')

  // 默认节点颜色
  const getNodeColor = useCallback((node: GraphNode) => {
    if (node.color) return node.color
    if (nodeColors[node.type]) return nodeColors[node.type]
    
    switch (node.type) {
      case 'note':
        return '#3b82f6'
      case 'tag':
        return '#10b981'
      case 'folder':
        return '#f59e0b'
      case 'link':
        return '#8b5cf6'
      default:
        return '#6b7280'
    }
  }, [nodeColors])

  // 默认链接颜色
  const getLinkColor = useCallback((link: GraphLink) => {
    if (link.color) return link.color
    if (linkColors[link.type]) return linkColors[link.type]
    
    switch (link.type) {
      case 'reference':
        return '#3b82f6'
      case 'tag':
        return '#10b981'
      case 'folder':
        return '#f59e0b'
      case 'similarity':
        return '#8b5cf6'
      default:
        return '#d1d5db'
    }
  }, [linkColors])

  // 计算可见元素（虚拟化）
  const updateVisibleElements = useCallback(() => {
    // 如果数据量小于阈值，不启用虚拟化
    if (filteredData.nodes.length < 500) {
      setVisibleNodes(filteredData.nodes)
      setVisibleLinks(filteredData.links)
      return
    }

    const { x, y, k } = graphState.transform
    const margin = 100 // 额外边距

    const bounds = {
      x: -x / k - margin,
      y: -y / k - margin,
      width: width / k + 2 * margin,
      height: height / k + 2 * margin
    }

    setRenderBounds(bounds)

    // 过滤可见节点
    const visible = filteredData.nodes.filter(node => {
      if (!node.x || !node.y) return true // 初始化阶段显示所有节点
      return (
        node.x >= bounds.x &&
        node.x <= bounds.x + bounds.width &&
        node.y >= bounds.y &&
        node.y <= bounds.y + bounds.height
      )
    })

    setVisibleNodes(visible)

    // 过滤可见链接（只显示两端都可见的链接）
    const visibleNodeIds = new Set(visible.map(n => n.id))
    const visibleLinksFiltered = filteredData.links.filter(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id
      const targetId = typeof link.target === 'string' ? link.target : link.target.id
      return visibleNodeIds.has(sourceId) && visibleNodeIds.has(targetId)
    })

    setVisibleLinks(visibleLinksFiltered)
  }, [filteredData, graphState.transform, width, height])

  // 监听变换变化，更新可见元素
  useEffect(() => {
    updateVisibleElements()
  }, [updateVisibleElements])

  // 计算聚类
  const calculateClusters = useCallback(() => {
    let newClusters: Cluster[] = []

    switch (clusterType) {
      case 'connectivity':
        newClusters = clusterByConnectivity(filteredData.nodes, filteredData.links, {
          minClusterSize: 3,
          maxClusters: 8,
          threshold: 0.3
        })
        break
      case 'tags':
        newClusters = clusterByTags(filteredData.nodes, {
          minClusterSize: 2,
          maxClusters: 10
        })
        break
      case 'type':
        newClusters = clusterByType(filteredData.nodes, {
          minClusterSize: 2
        })
        break
    }

    setClusters(newClusters)
  }, [filteredData, clusterType])

  // 当数据或聚类类型变化时重新计算聚类
  useEffect(() => {
    if (filteredData.nodes.length > 0) {
      calculateClusters()
    }
  }, [calculateClusters])

  // 渲染聚类背景
  const renderClusterBackgrounds = useCallback((svg: any) => {
    if (!showClusters || clusters.length === 0) {
      svg.selectAll('.cluster-background').remove()
      return
    }

    const clusterGroup = svg.select('.cluster-group')
      .empty() ? svg.append('g').attr('class', 'cluster-group') : svg.select('.cluster-group')

    const clusterSelection = clusterGroup
      .selectAll('.cluster-background')
      .data(clusters, (d: Cluster) => d.id)

    clusterSelection.exit().remove()

    const clusterEnter = clusterSelection.enter()
      .append('circle')
      .attr('class', 'cluster-background')

    clusterEnter.merge(clusterSelection)
      .attr('cx', (d: Cluster) => d.center.x)
      .attr('cy', (d: Cluster) => d.center.y)
      .attr('r', (d: Cluster) => d.radius)
      .attr('fill', (d: Cluster) => d.color)
      .attr('fill-opacity', 0.1)
      .attr('stroke', (d: Cluster) => d.color)
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5')
      .attr('stroke-opacity', 0.5)

    // 添加聚类标签
    const labelSelection = clusterGroup
      .selectAll('.cluster-label')
      .data(clusters, (d: Cluster) => d.id)

    labelSelection.exit().remove()

    const labelEnter = labelSelection.enter()
      .append('text')
      .attr('class', 'cluster-label')

    labelEnter.merge(labelSelection)
      .attr('x', (d: Cluster) => d.center.x)
      .attr('y', (d: Cluster) => d.center.y - d.radius - 10)
      .attr('text-anchor', 'middle')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('fill', (d: Cluster) => d.color)
      .text((d: Cluster) => d.label || `聚类 ${d.id}`)
  }, [showClusters, clusters])

  // 处理节点点击
  const handleNodeClick = useCallback((node: GraphNode, event: MouseEvent) => {
    setGraphState(prev => ({
      ...prev,
      selectedNodes: new Set([node.id])
    }))
    onNodeClick?.(node, event)
  }, [onNodeClick])

  // 处理节点悬停
  const handleNodeHover = useCallback((node: GraphNode | null, event: MouseEvent) => {
    setGraphState(prev => ({
      ...prev,
      hoveredNode: node?.id || null
    }))
    onNodeHover?.(node, event)
  }, [onNodeHover])

  // 处理链接点击
  const handleLinkClick = useCallback((link: GraphLink, event: MouseEvent) => {
    onLinkClick?.(link, event)
  }, [onLinkClick])

  // 处理链接悬停
  const handleLinkHover = useCallback((link: GraphLink | null, event: MouseEvent) => {
    setGraphState(prev => ({
      ...prev,
      hoveredLink: link?.id || null
    }))
    onLinkHover?.(link, event)
  }, [onLinkHover])

  // 处理背景点击
  const handleBackgroundClick = useCallback((event: MouseEvent) => {
    setGraphState(prev => ({
      ...prev,
      selectedNodes: new Set(),
      hoveredNode: null,
      hoveredLink: null
    }))
    onBackgroundClick?.(event)
  }, [onBackgroundClick])

  // 处理缩放
  const handleZoom = useCallback((transform: { x: number; y: number; k: number }) => {
    setGraphState(prev => ({
      ...prev,
      transform
    }))
    onZoom?.(transform)
  }, [onZoom])

  // 处理节点选择
  const handleNodeSelection = useCallback((nodeIds: string[], addToSelection = false) => {
    setGraphState(prev => ({
      ...prev,
      selectedNodes: addToSelection
        ? new Set([...prev.selectedNodes, ...nodeIds])
        : new Set(nodeIds)
    }))
  }, [])

  // 处理节点操作
  const handleNodeAction = useCallback((action: string, nodeIds: string[]) => {
    switch (action) {
      case 'focus':
        // 聚焦到节点
        if (nodeIds.length > 0) {
          const node = filteredData.nodes.find(n => n.id === nodeIds[0])
          if (node && node.x && node.y) {
            const svg = d3.select(svgRef.current)
            const zoom = d3.zoom()
            svg.transition().duration(750).call(
              zoom.transform as any,
              d3.zoomIdentity.translate(width / 2 - node.x, height / 2 - node.y).scale(1.5)
            )
          }
        }
        break

      case 'zoom-fit':
        // 适应窗口
        const svg = d3.select(svgRef.current)
        const zoom = d3.zoom()
        svg.transition().duration(750).call(
          zoom.transform as any,
          d3.zoomIdentity
        )
        break

      default:
        console.log('Node action:', action, nodeIds)
    }
  }, [filteredData, width, height])

  // 处理链接操作
  const handleLinkAction = useCallback((action: string, linkIds: string[]) => {
    console.log('Link action:', action, linkIds)
  }, [])

  // 初始化图谱
  useEffect(() => {
    if (!svgRef.current || !filteredData.nodes.length) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    // 创建主容器
    const container = svg
      .attr('width', width)
      .attr('height', height)
      .style('background-color', backgroundColor)

    // 创建缩放组
    const zoomGroup = container.append('g').attr('class', 'zoom-group')

    // 创建链接组
    const linkGroup = zoomGroup.append('g').attr('class', 'links')
    
    // 创建节点组
    const nodeGroup = zoomGroup.append('g').attr('class', 'nodes')
    
    // 创建标签组
    const labelGroup = zoomGroup.append('g').attr('class', 'labels')

    // 设置缩放
    if (enableZoom || enablePan) {
      setupZoom(
        svg,
        zoomGroup,
        { enableZoom, enablePan, maxZoom, minZoom },
        handleZoom
      )
    }

    // 创建力导向仿真
    const simulation = createForceSimulation(
      filteredData.nodes,
      filteredData.links,
      {
        width,
        height,
        linkDistance,
        linkStrength,
        chargeStrength,
        centerForce,
        collisionRadius
      }
    )

    simulationRef.current = simulation

    // 渲染链接（使用虚拟化数据）
    const linkSelection = renderLinks(
      linkGroup,
      visibleLinks.length > 0 ? visibleLinks : filteredData.links,
      {
        getLinkColor,
        onLinkClick: handleLinkClick,
        onLinkHover: handleLinkHover
      }
    )

    // 渲染节点（使用虚拟化数据）
    const nodeSelection = renderNodes(
      nodeGroup,
      visibleNodes.length > 0 ? visibleNodes : filteredData.nodes,
      {
        nodeRadius,
        getNodeColor,
        onNodeClick: handleNodeClick,
        onNodeHover: handleNodeHover
      }
    )

    // 设置拖拽
    if (enableDrag) {
      setupDrag(
        nodeSelection,
        simulation,
        {
          onDragStart,
          onDragEnd
        }
      )
    }

    // 渲染聚类背景
    renderClusterBackgrounds(svg)

    // 渲染标签
    if (showLabels) {
      renderLabels(labelGroup, filteredData.nodes)
    }

    // 更新仿真
    simulation.on('tick', () => {
      updateSimulation(linkSelection, nodeSelection, labelGroup)
      // 更新聚类背景位置
      if (showClusters) {
        renderClusterBackgrounds(svg)
      }
    })

    // 背景点击事件
    svg.on('click', (event: MouseEvent) => {
      if (event.target === svg.node()) {
        handleBackgroundClick(event)
      }
    })

    return () => {
      simulation.stop()
    }
  }, [
    filteredData,
    width,
    height,
    nodeRadius,
    linkDistance,
    linkStrength,
    chargeStrength,
    centerForce,
    collisionRadius,
    enableZoom,
    enableDrag,
    enablePan,
    showLabels,
    maxZoom,
    minZoom,
    backgroundColor,
    getNodeColor,
    getLinkColor,
    handleNodeClick,
    handleNodeHover,
    handleLinkClick,
    handleLinkHover,
    handleBackgroundClick,
    handleZoom,
    onDragStart,
    onDragEnd
  ])

  // 更新加载状态
  useEffect(() => {
    setGraphState(prev => ({
      ...prev,
      isLoading: loading,
      error
    }))
  }, [loading, error])

  // 渲染加载状态
  if (graphState.isLoading) {
    return (
      <div 
        className={`flex items-center justify-center ${className}`}
        style={{ width, height, ...style }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-500">加载图谱中...</p>
        </div>
      </div>
    )
  }

  // 渲染错误状态
  if (graphState.error) {
    return (
      <div 
        className={`flex items-center justify-center ${className}`}
        style={{ width, height, ...style }}
      >
        <div className="text-center text-red-500">
          <p className="mb-2">图谱加载失败</p>
          <p className="text-sm text-gray-500">{graphState.error}</p>
        </div>
      </div>
    )
  }

  // 渲染空状态
  if (!filteredData.nodes.length) {
    return (
      <div 
        className={`flex items-center justify-center ${className}`}
        style={{ width, height, ...style }}
      >
        <div className="text-center text-gray-500">
          <p className="mb-2">暂无图谱数据</p>
          <p className="text-sm">创建一些笔记来生成图谱</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`minglog-graph-view ${className}`} style={style}>
      <GraphInteractions
        nodes={filteredData.nodes}
        links={filteredData.links}
        selectedNodes={graphState.selectedNodes}
        onNodeSelect={handleNodeSelection}
        onNodeAction={handleNodeAction}
        onLinkAction={handleLinkAction}
      >
        <svg
          ref={svgRef}
          className="w-full h-full"
          style={{ cursor: enablePan ? 'grab' : 'default' }}
        />
      </GraphInteractions>

      {/* 聚类控制面板 */}
      {clusters.length > 0 && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-3 border">
          <div className="flex items-center gap-2 mb-2">
            <label className="text-sm font-medium">聚类分析:</label>
            <button
              onClick={() => setShowClusters(!showClusters)}
              className={`px-2 py-1 text-xs rounded ${
                showClusters
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {showClusters ? '隐藏' : '显示'}
            </button>
          </div>
          <select
            value={clusterType}
            onChange={(e) => setClusterType(e.target.value as any)}
            className="text-xs border rounded px-2 py-1 w-full"
          >
            <option value="connectivity">连接度聚类</option>
            <option value="tags">标签聚类</option>
            <option value="type">类型聚类</option>
          </select>
          <div className="text-xs text-gray-500 mt-1">
            发现 {clusters.length} 个聚类
          </div>
        </div>
      )}
    </div>
  )
}

export default GraphView
