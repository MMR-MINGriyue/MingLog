/**
 * 图谱可视化主组件
 */

import React, { useRef, useEffect, useState, useCallback } from 'react'
import * as d3 from 'd3'
import type { Simulation } from 'd3-force'
import { GraphViewProps, GraphNode, GraphLink, GraphState } from '../types'
import {
  createForceSimulation,
  updateSimulation,
  renderNodes,
  renderLinks,
  renderLabels,
  setupZoom,
  setupDrag,
  filterGraphData
} from '../utils'

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

    // 渲染链接
    const linkSelection = renderLinks(
      linkGroup,
      filteredData.links,
      {
        getLinkColor,
        onLinkClick: handleLinkClick,
        onLinkHover: handleLinkHover
      }
    )

    // 渲染节点
    const nodeSelection = renderNodes(
      nodeGroup,
      filteredData.nodes,
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

    // 渲染标签
    if (showLabels) {
      renderLabels(labelGroup, filteredData.nodes)
    }

    // 更新仿真
    simulation.on('tick', () => {
      updateSimulation(linkSelection, nodeSelection, labelGroup)
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
      <svg
        ref={svgRef}
        className="w-full h-full"
        style={{ cursor: enablePan ? 'grab' : 'default' }}
      />
    </div>
  )
}

export default GraphView
