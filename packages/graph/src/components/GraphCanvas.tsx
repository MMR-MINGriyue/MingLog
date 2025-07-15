/**
 * 图谱画布组件
 * 提供知识图谱的核心渲染和交互功能
 */

import React, { useRef, useEffect, useState, useCallback } from 'react'
import * as d3 from 'd3'
import { GraphData, GraphNode, GraphLink, GraphConfig } from '../types'

interface GraphCanvasProps {
  /** 图谱数据 */
  data: GraphData
  /** 画布宽度 */
  width?: number
  /** 画布高度 */
  height?: number
  /** 图谱配置 */
  config?: Partial<GraphConfig>
  /** 节点点击回调 */
  onNodeClick?: (node: GraphNode) => void
  /** 节点双击回调 */
  onNodeDoubleClick?: (node: GraphNode) => void
  /** 节点悬停回调 */
  onNodeHover?: (node: GraphNode | null) => void
  /** 连接线点击回调 */
  onLinkClick?: (link: GraphLink) => void
  /** 背景点击回调 */
  onBackgroundClick?: () => void
  /** 类名 */
  className?: string
}

interface GraphState {
  /** 选中的节点 */
  selectedNodes: Set<string>
  /** 悬停的节点 */
  hoveredNode: string | null
  /** 缩放变换 */
  transform: d3.ZoomTransform
}

/**
 * 图谱画布组件
 */
export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  data,
  width = 800,
  height = 600,
  config = {},
  onNodeClick,
  onNodeDoubleClick,
  onNodeHover,
  onLinkClick,
  onBackgroundClick,
  className = ''
}) => {
  // 引用
  const svgRef = useRef<SVGSVGElement>(null)
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null)

  // 状态
  const [graphState, setGraphState] = useState<GraphState>({
    selectedNodes: new Set(),
    hoveredNode: null,
    transform: d3.zoomIdentity
  })

  // 默认配置
  const defaultConfig: GraphConfig = {
    nodeRadius: 8,
    linkDistance: 50,
    linkStrength: 0.1,
    chargeStrength: -300,
    centerForce: 0.1,
    collisionRadius: 12,
    enableZoom: true,
    enableDrag: true,
    enablePan: true,
    showLabels: true,
    showTooltips: true,
    highlightConnected: true,
    maxZoom: 10,
    minZoom: 0.1,
    backgroundColor: '#ffffff',
    nodeColors: {
      note: '#4A90E2',
      tag: '#7ED321',
      folder: '#F5A623',
      link: '#BD10E0'
    },
    linkColors: {
      reference: '#9B9B9B',
      tag: '#7ED321',
      folder: '#F5A623',
      similarity: '#50E3C2'
    }
  }

  const finalConfig = { ...defaultConfig, ...config }

  /**
   * 初始化力导向仿真
   */
  const initializeSimulation = useCallback(() => {
    if (!data.nodes.length) return

    // 创建仿真
    const simulation = d3.forceSimulation<GraphNode>(data.nodes)
      .force('link', d3.forceLink<GraphNode, GraphLink>(data.links)
        .id(d => d.id)
        .distance(finalConfig.linkDistance || 50)
        .strength(finalConfig.linkStrength || 0.1)
      )
      .force('charge', d3.forceManyBody().strength(finalConfig.chargeStrength || -300))
      .force('center', d3.forceCenter(width / 2, height / 2).strength(finalConfig.centerForce || 0.1))
      .force('collision', d3.forceCollide().radius(finalConfig.collisionRadius || 12))

    simulationRef.current = simulation
    return simulation
  }, [data, width, height, finalConfig])

  /**
   * 渲染图谱
   */
  const renderGraph = useCallback(() => {
    const svg = d3.select(svgRef.current)
    if (!svg.node()) return

    // 清空之前的内容
    svg.selectAll('*').remove()

    // 设置背景
    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', finalConfig.backgroundColor || '#ffffff')
      .on('click', () => {
        setGraphState(prev => ({ ...prev, selectedNodes: new Set() }))
        onBackgroundClick?.()
      })

    // 创建主要绘图组
    const g = svg.append('g').attr('class', 'graph-container')

    // 设置缩放行为
    if (finalConfig.enableZoom) {
      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([finalConfig.minZoom!, finalConfig.maxZoom!])
        .on('zoom', (event) => {
          const transform = event.transform
          g.attr('transform', transform)
          setGraphState(prev => ({ ...prev, transform }))
        })

      svg.call(zoom)
    }

    // 渲染连接线
    const linkGroup = g.append('g').attr('class', 'links')
    const links = linkGroup.selectAll('.link')
      .data(data.links)
      .enter()
      .append('line')
      .attr('class', 'link')
      .attr('stroke', d => finalConfig.linkColors![d.type] || '#999')
      .attr('stroke-width', d => Math.sqrt(d.weight || 1))
      .attr('stroke-opacity', 0.6)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        event.stopPropagation()
        onLinkClick?.(d)
      })

    // 渲染节点
    const nodeGroup = g.append('g').attr('class', 'nodes')
    const nodes = nodeGroup.selectAll('.node')
      .data(data.nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .style('cursor', finalConfig.enableDrag ? 'grab' : 'pointer')

    // 节点圆圈
    nodes.append('circle')
      .attr('r', d => (d.size || 1) * finalConfig.nodeRadius!)
      .attr('fill', d => d.color || finalConfig.nodeColors![d.type] || '#999')
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)

    // 节点标签
    if (finalConfig.showLabels) {
      nodes.append('text')
        .attr('class', 'node-label')
        .attr('dx', finalConfig.nodeRadius! + 4)
        .attr('dy', '.35em')
        .style('font-size', '12px')
        .style('font-family', 'Arial, sans-serif')
        .style('fill', '#333')
        .style('pointer-events', 'none')
        .text(d => d.title)
    }

    // 节点交互
    nodes
      .on('click', (event, d) => {
        event.stopPropagation()
        setGraphState(prev => ({
          ...prev,
          selectedNodes: new Set([d.id])
        }))
        onNodeClick?.(d)
      })
      .on('dblclick', (event, d) => {
        event.stopPropagation()
        onNodeDoubleClick?.(d)
      })
      .on('mouseenter', (event, d) => {
        setGraphState(prev => ({ ...prev, hoveredNode: d.id }))
        onNodeHover?.(d)
        
        // 高亮连接的节点
        if (finalConfig.highlightConnected) {
          const connectedNodeIds = new Set<string>()
          data.links.forEach(link => {
            if (link.source === d.id || (typeof link.source === 'object' && link.source.id === d.id)) {
              connectedNodeIds.add(typeof link.target === 'string' ? link.target : link.target.id)
            }
            if (link.target === d.id || (typeof link.target === 'object' && link.target.id === d.id)) {
              connectedNodeIds.add(typeof link.source === 'string' ? link.source : link.source.id)
            }
          })

          nodes.style('opacity', node => 
            node.id === d.id || connectedNodeIds.has(node.id) ? 1 : 0.3
          )
          links.style('opacity', link => {
            const sourceId = typeof link.source === 'string' ? link.source : link.source.id
            const targetId = typeof link.target === 'string' ? link.target : link.target.id
            return sourceId === d.id || targetId === d.id ? 1 : 0.1
          })
        }
      })
      .on('mouseleave', () => {
        setGraphState(prev => ({ ...prev, hoveredNode: null }))
        onNodeHover?.(null)
        
        // 恢复透明度
        if (finalConfig.highlightConnected) {
          nodes.style('opacity', 1)
          links.style('opacity', 0.6)
        }
      })

    // 拖拽行为
    if (finalConfig.enableDrag) {
      const drag = d3.drag<SVGGElement, GraphNode>()
        .on('start', (event, d) => {
          if (!event.active && simulationRef.current) {
            simulationRef.current.alphaTarget(0.3).restart()
          }
          d.fx = d.x
          d.fy = d.y
        })
        .on('drag', (event, d) => {
          d.fx = event.x
          d.fy = event.y
        })
        .on('end', (event, d) => {
          if (!event.active && simulationRef.current) {
            simulationRef.current.alphaTarget(0)
          }
          d.fx = null
          d.fy = null
        })

      nodes.call(drag)
    }

    // 启动仿真
    const simulation = initializeSimulation()
    if (simulation) {
      simulation.on('tick', () => {
        links
          .attr('x1', d => (typeof d.source === 'object' ? d.source.x : 0) || 0)
          .attr('y1', d => (typeof d.source === 'object' ? d.source.y : 0) || 0)
          .attr('x2', d => (typeof d.target === 'object' ? d.target.x : 0) || 0)
          .attr('y2', d => (typeof d.target === 'object' ? d.target.y : 0) || 0)

        nodes.attr('transform', d => `translate(${d.x || 0}, ${d.y || 0})`)
      })
    }

  }, [data, width, height, finalConfig, onNodeClick, onNodeDoubleClick, onNodeHover, onLinkClick, onBackgroundClick, initializeSimulation])

  // 数据变化时重新渲染
  useEffect(() => {
    renderGraph()
  }, [renderGraph])

  // 组件卸载时清理仿真
  useEffect(() => {
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop()
      }
    }
  }, [])

  return (
    <div className={`graph-canvas ${className}`}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="graph-svg"
        style={{ border: '1px solid #e1e5e9' }}
      />
      
      {/* 图谱信息显示 */}
      <div className="graph-info">
        <div className="info-item">
          节点: {data.nodes.length}
        </div>
        <div className="info-item">
          连接: {data.links.length}
        </div>
        {graphState.selectedNodes.size > 0 && (
          <div className="info-item">
            已选择: {graphState.selectedNodes.size}
          </div>
        )}
      </div>
    </div>
  )
}

export default GraphCanvas
