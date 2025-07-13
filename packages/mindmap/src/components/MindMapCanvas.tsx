/**
 * 思维导图画布组件
 * 提供思维导图的核心可视化和交互功能
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { select, Selection } from 'd3-selection'
import { zoom, zoomIdentity, ZoomBehavior, ZoomTransform } from 'd3-zoom'
import { drag } from 'd3-drag'
import { forceSimulation, forceLink, forceManyBody, forceCenter, Simulation } from 'd3-force'
import { linkHorizontal } from 'd3-shape'
import { MindMapNode, MindMapLink, MindMapData, LayoutConfig, NodeStyle, LayoutType } from '../types'
import { layoutManager } from '../algorithms/LayoutManager'

interface MindMapCanvasProps {
  /** 思维导图数据 */
  data: MindMapData
  /** 画布宽度 */
  width?: number
  /** 画布高度 */
  height?: number
  /** 布局配置 */
  layout?: LayoutConfig
  /** 是否启用拖拽 */
  enableDrag?: boolean
  /** 是否启用缩放 */
  enableZoom?: boolean
  /** 是否显示标签 */
  showLabels?: boolean
  /** 节点点击回调 */
  onNodeClick?: (node: MindMapNode) => void
  /** 节点双击回调 */
  onNodeDoubleClick?: (node: MindMapNode) => void
  /** 节点右键回调 */
  onNodeContextMenu?: (node: MindMapNode, event: React.MouseEvent) => void
  /** 背景点击回调 */
  onBackgroundClick?: (event: React.MouseEvent) => void
  /** 节点拖拽结束回调 */
  onNodeDragEnd?: (node: MindMapNode, x: number, y: number) => void
  /** 类名 */
  className?: string
}

interface CanvasState {
  /** 选中的节点ID */
  selectedNodeId: string | null
  /** 悬停的节点ID */
  hoveredNodeId: string | null
  /** 是否正在拖拽 */
  isDragging: boolean
  /** 缩放变换 */
  transform: ZoomTransform
}

/**
 * 思维导图画布组件
 * 使用D3.js实现高性能的思维导图可视化
 */
export const MindMapCanvas: React.FC<MindMapCanvasProps> = ({
  data,
  width = 800,
  height = 600,
  layout = { type: 'tree', direction: 'right' },
  enableDrag = true,
  enableZoom = true,
  showLabels = true,
  onNodeClick,
  onNodeDoubleClick,
  onNodeContextMenu,
  onBackgroundClick,
  onNodeDragEnd,
  className = ''
}) => {
  // 引用
  const svgRef = useRef<SVGSVGElement>(null)
  const gRef = useRef<SVGGElement>(null)
  const simulationRef = useRef<Simulation<MindMapNode, MindMapLink> | null>(null)

  // 状态管理
  const [canvasState, setCanvasState] = useState<CanvasState>({
    selectedNodeId: null,
    hoveredNodeId: null,
    isDragging: false,
    transform: zoomIdentity
  })

  /**
   * 计算节点布局位置
   * 使用布局管理器统一处理所有布局算法
   */
  const calculateLayout = useCallback(async (
    mindMapData: MindMapData,
    layoutConfig: LayoutConfig
  ): Promise<MindMapNode[]> => {
    try {
      // 使用布局管理器计算布局
      const layoutResult = await layoutManager.calculateLayout(mindMapData, layoutConfig)

      // 调整坐标以适应画布尺寸
      const adjustedNodes = layoutResult.nodes.map(node => ({
        ...node,
        x: (node.x || 0) + width / 2 - 400, // 居中调整
        y: (node.y || 0) + height / 2 - 300
      }))

      return adjustedNodes
    } catch (error) {
      console.error('布局计算失败:', error)
      // 回退到简单的默认布局
      return data.nodes.map((node, index) => ({
        ...node,
        x: width / 2 + (index % 3 - 1) * 100,
        y: height / 2 + Math.floor(index / 3) * 80
      }))
    }
  }, [width, height, data.nodes])

  /**
   * 处理节点的布局计算
   */
  const [layoutedNodes, setLayoutedNodes] = useState<MindMapNode[]>(data.nodes)
  const [isLayouting, setIsLayouting] = useState(false)

  // 异步计算布局
  useEffect(() => {
    const computeLayout = async () => {
      setIsLayouting(true)
      try {
        const newNodes = await calculateLayout(data, layout)
        setLayoutedNodes(newNodes)
      } catch (error) {
        console.error('布局计算失败:', error)
        setLayoutedNodes(data.nodes)
      } finally {
        setIsLayouting(false)
      }
    }

    computeLayout()
  }, [data, layout, calculateLayout])

  /**
   * 初始化SVG和D3组件
   */
  useEffect(() => {
    if (!svgRef.current || !gRef.current) return

    const svg = select(svgRef.current)
    const g = select(gRef.current)

    // 清除之前的内容
    g.selectAll('*').remove()

    // 设置缩放行为
    if (enableZoom) {
      const zoomBehavior = zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 10])
        .on('zoom', (event) => {
          g.attr('transform', event.transform)
          setCanvasState(prev => ({ ...prev, transform: event.transform }))
        })

      svg.call(zoomBehavior)

      // 背景点击事件
      svg.on('click', (event) => {
        if (event.target === svgRef.current) {
          setCanvasState(prev => ({ ...prev, selectedNodeId: null }))
          onBackgroundClick?.(event)
        }
      })
    }

    return () => {
      svg.on('.zoom', null)
      svg.on('click', null)
    }
  }, [enableZoom, onBackgroundClick])

  /**
   * 渲染连接线
   */
  useEffect(() => {
    if (!gRef.current) return

    const g = select(gRef.current)
    const linksGroup = g.select('.links-group').empty() 
      ? g.append('g').attr('class', 'links-group')
      : g.select('.links-group')

    // 创建路径生成器
    const linkPath = linkHorizontal<MindMapLink, MindMapNode>()
      .x(d => d.x || 0)
      .y(d => d.y || 0)
      .source(d => {
        const sourceNode = layoutedNodes.find(node => node.id === d.source)
        return sourceNode || { x: 0, y: 0, id: '', text: '', level: 0, children: [] } as MindMapNode
      })
      .target(d => {
        const targetNode = layoutedNodes.find(node => node.id === d.target)
        return targetNode || { x: 0, y: 0, id: '', text: '', level: 0, children: [] } as MindMapNode
      })

    // 绑定数据并渲染连接线
    const links = (linksGroup as any).selectAll('.mindmap-link')
      .data(data.links, (d: any) => d.id)

    links.enter()
      .append('path')
      .attr('class', 'mindmap-link')
      .attr('fill', 'none')
      .attr('stroke', '#999')
      .attr('stroke-width', 2)
      .attr('opacity', 0)
      .transition()
      .duration(300)
      .attr('opacity', 1)
      .attr('d', linkPath as any)

    links.transition()
      .duration(300)
      .attr('d', linkPath as any)

    links.exit()
      .transition()
      .duration(300)
      .attr('opacity', 0)
      .remove()

  }, [data.links, layoutedNodes])

  /**
   * 渲染节点
   */
  useEffect(() => {
    if (!gRef.current) return

    const g = select(gRef.current)
    const nodesGroup = g.select('.nodes-group').empty() 
      ? g.append('g').attr('class', 'nodes-group')
      : g.select('.nodes-group')

    // 绑定数据并渲染节点
    const nodes = (nodesGroup as any).selectAll('.mindmap-node')
      .data(layoutedNodes, (d: any) => d.id)

    const nodeEnter = nodes.enter()
      .append('g')
      .attr('class', 'mindmap-node')
      .attr('transform', (d: MindMapNode) => `translate(${d.x || 0}, ${d.y || 0})`)
      .style('cursor', enableDrag ? 'grab' : 'pointer')

    // 添加节点圆形
    nodeEnter.append('circle')
      .attr('r', 0)
      .attr('fill', (d: MindMapNode) => d.style?.backgroundColor || '#4A90E2')
      .attr('stroke', (d: MindMapNode) => d.style?.borderColor || '#2E5C8A')
      .attr('stroke-width', 2)
      .transition()
      .duration(300)
      .attr('r', (d: MindMapNode) => d.style?.radius || 20)

    // 添加节点文本
    if (showLabels) {
      nodeEnter.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em')
        .attr('fill', (d: MindMapNode) => d.style?.textColor || '#333')
        .attr('font-size', (d: MindMapNode) => d.style?.fontSize || '12px')
        .attr('font-weight', (d: MindMapNode) => d.style?.fontWeight || 'normal')
        .style('pointer-events', 'none')
        .style('user-select', 'none')
        .text((d: MindMapNode) => d.text.length > 10 ? d.text.substring(0, 10) + '...' : d.text)
        .attr('opacity', 0)
        .transition()
        .duration(300)
        .attr('opacity', 1)
    }

    // 更新现有节点
    const nodeUpdate = nodeEnter.merge(nodes as any)

    nodeUpdate.transition()
      .duration(300)
      .attr('transform', (d: MindMapNode) => `translate(${d.x || 0}, ${d.y || 0})`)

    nodeUpdate.select('circle')
      .attr('fill', (d: MindMapNode) => {
        if (canvasState.selectedNodeId === d.id) return '#FF6B6B'
        if (canvasState.hoveredNodeId === d.id) return '#5CB3CC'
        return d.style?.backgroundColor || '#4A90E2'
      })

    // 移除退出的节点
    nodes.exit()
      .transition()
      .duration(300)
      .attr('transform', (d: MindMapNode) => `translate(${d.x || 0}, ${d.y || 0}) scale(0)`)
      .style('opacity', 0)
      .remove()

    // 添加交互事件
    nodeUpdate
      .on('click', (event: any, d: MindMapNode) => {
        event.stopPropagation()
        setCanvasState(prev => ({ ...prev, selectedNodeId: d.id }))
        onNodeClick?.(d)
      })
      .on('dblclick', (event: any, d: MindMapNode) => {
        event.stopPropagation()
        onNodeDoubleClick?.(d)
      })
      .on('contextmenu', (event: any, d: MindMapNode) => {
        event.preventDefault()
        onNodeContextMenu?.(d, event as React.MouseEvent)
      })
      .on('mouseenter', (event: any, d: MindMapNode) => {
        setCanvasState(prev => ({ ...prev, hoveredNodeId: d.id }))
      })
      .on('mouseleave', () => {
        setCanvasState(prev => ({ ...prev, hoveredNodeId: null }))
      })

    // 添加拖拽行为
    if (enableDrag) {
      const dragBehavior = drag<SVGGElement, MindMapNode>()
        .on('start', (event: any, d: MindMapNode) => {
          setCanvasState(prev => ({ ...prev, isDragging: true }))
          select(event.sourceEvent.target.parentNode).style('cursor', 'grabbing')
        })
        .on('drag', (event: any, d: MindMapNode) => {
          d.x = event.x
          d.y = event.y
          select(event.sourceEvent.target.parentNode)
            .attr('transform', `translate(${d.x}, ${d.y})`)
        })
        .on('end', (event: any, d: MindMapNode) => {
          setCanvasState(prev => ({ ...prev, isDragging: false }))
          select(event.sourceEvent.target.parentNode).style('cursor', 'grab')
          onNodeDragEnd?.(d, d.x || 0, d.y || 0)
        })

      nodeUpdate.call(dragBehavior)
    }

  }, [layoutedNodes, canvasState.selectedNodeId, canvasState.hoveredNodeId, enableDrag, showLabels, onNodeClick, onNodeDoubleClick, onNodeContextMenu, onNodeDragEnd])

  return (
    <div className={`mindmap-canvas ${className}`}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="mindmap-svg"
        style={{ background: '#fafafa', border: '1px solid #e0e0e0' }}
      >
        <g ref={gRef} className="mindmap-container" />
      </svg>

      {/* 布局计算加载状态 */}
      {isLayouting && (
        <div className="layout-loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner" />
            <span>正在计算 {layout.type} 布局...</span>
          </div>
        </div>
      )}

      {/* 布局信息显示 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="layout-info">
          <div>布局类型: {layout.type}</div>
          <div>节点数量: {layoutedNodes.length}</div>
          <div>连接数量: {data.links.length}</div>
        </div>
      )}
    </div>
  )
}

export default MindMapCanvas
