/**
 * 交互式图形渲染器
 * 提供高性能的图形渲染和交互支持
 */

import React, { useEffect, useRef, useCallback, useMemo } from 'react'
import { GraphData, GraphNode, GraphLink, LayoutConfig } from '@minglog/graph'
import * as d3 from 'd3'

interface InteractiveGraphRendererProps {
  /** 图形数据 */
  data: GraphData
  /** 布局配置 */
  layout: LayoutConfig
  /** 选中的节点 */
  selectedNodes: Set<string>
  /** 选中的连接 */
  selectedLinks: Set<string>
  /** 悬停的节点 */
  hoveredNode: string | null
  /** 悬停的连接 */
  hoveredLink: string | null
  /** 高亮的路径 */
  highlightedPath: string[]
  /** 节点点击回调 */
  onNodeClick?: (event: React.MouseEvent, node: GraphNode) => void
  /** 连接点击回调 */
  onLinkClick?: (event: React.MouseEvent, link: GraphLink) => void
  /** 节点悬停回调 */
  onNodeHover?: (node: GraphNode | null) => void
  /** 连接悬停回调 */
  onLinkHover?: (link: GraphLink | null) => void
  /** 节点拖拽回调 */
  onNodeDrag?: (nodeId: string, x: number, y: number) => void
  /** 右键菜单回调 */
  onContextMenu?: (event: React.MouseEvent, target: { type: 'node' | 'link'; id: string }) => void
}

interface RenderState {
  simulation: d3.Simulation<GraphNode, GraphLink> | null
  nodeElements: d3.Selection<SVGGElement, GraphNode, SVGGElement, unknown> | null
  linkElements: d3.Selection<SVGLineElement, GraphLink, SVGGElement, unknown> | null
}

/**
 * 交互式图形渲染器组件
 */
export const InteractiveGraphRenderer: React.FC<InteractiveGraphRendererProps> = ({
  data,
  layout,
  selectedNodes,
  selectedLinks,
  hoveredNode,
  hoveredLink,
  highlightedPath,
  onNodeClick,
  onLinkClick,
  onNodeHover,
  onLinkHover,
  onNodeDrag,
  onContextMenu
}) => {
  // 引用
  const containerRef = useRef<SVGGElement>(null)
  const renderStateRef = useRef<RenderState>({
    simulation: null,
    nodeElements: null,
    linkElements: null
  })

  // 创建力导向仿真
  const createSimulation = useCallback((nodes: GraphNode[], links: GraphLink[]) => {
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d: any) => d.id))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(0, 0))
      .force('collision', d3.forceCollide().radius(20))

    // 根据布局类型调整力
    switch (layout.type) {
      case 'force':
        simulation
          .force('link', d3.forceLink(links)
            .id((d: any) => d.id)
            .distance(layout.linkDistance || 50)
            .strength(layout.linkStrength || 0.1)
          )
          .force('charge', d3.forceManyBody().strength(layout.forceStrength || -300))
          .force('center', d3.forceCenter(0, 0).strength(layout.centerStrength || 0.1))
        break

      case 'hierarchical':
        // 层次布局使用不同的力配置
        simulation
          .force('link', d3.forceLink(links)
            .id((d: any) => d.id)
            .distance(layout.layerSeparation || 100)
          )
          .force('charge', d3.forceManyBody().strength(-100))
        break

      default:
        // 其他布局类型禁用仿真
        simulation.stop()
        break
    }

    return simulation
  }, [layout])

  // 应用布局位置
  const applyLayoutPositions = useCallback((nodes: GraphNode[]) => {
    switch (layout.type) {
      case 'circular':
        const radius = layout.radius || 200
        nodes.forEach((node, i) => {
          const angle = (i / nodes.length) * 2 * Math.PI
          node.x = Math.cos(angle) * radius
          node.y = Math.sin(angle) * radius
        })
        break

      case 'grid':
        const columns = layout.columns || Math.ceil(Math.sqrt(nodes.length))
        const cellSize = layout.cellSize || 80
        nodes.forEach((node, i) => {
          node.x = (i % columns) * cellSize - (columns * cellSize) / 2
          node.y = Math.floor(i / columns) * cellSize - (Math.floor(nodes.length / columns) * cellSize) / 2
        })
        break

      case 'radial':
        const centerNode = nodes.find(n => n.id === layout.centerNode) || nodes[0]
        if (centerNode) {
          centerNode.x = 0
          centerNode.y = 0
          
          const radiusStep = layout.radiusStep || 60
          const otherNodes = nodes.filter(n => n.id !== centerNode.id)
          
          otherNodes.forEach((node, i) => {
            const level = Math.floor(i / 8) + 1
            const angleStep = (2 * Math.PI) / Math.min(8, otherNodes.length - (level - 1) * 8)
            const angle = (i % 8) * angleStep
            
            node.x = Math.cos(angle) * radiusStep * level
            node.y = Math.sin(angle) * radiusStep * level
          })
        }
        break
    }
  }, [layout])

  // 渲染连接线
  const renderLinks = useCallback((container: d3.Selection<SVGGElement, unknown, null, undefined>) => {
    const linkSelection = container.selectAll<SVGLineElement, GraphLink>('.graph-link')
      .data(data.links, (d: GraphLink) => d.id)

    // 移除旧元素
    linkSelection.exit().remove()

    // 添加新元素
    const linkEnter = linkSelection.enter()
      .append('line')
      .attr('class', 'graph-link')
      .attr('stroke', '#999')
      .attr('stroke-width', 1.5)
      .attr('stroke-opacity', 0.6)

    // 合并选择
    const linkUpdate = linkEnter.merge(linkSelection)

    // 更新样式
    linkUpdate
      .classed('selected', (d: GraphLink) => selectedLinks.has(d.id))
      .classed('highlighted', (d: GraphLink) => {
        if (highlightedPath.length < 2) return false
        for (let i = 0; i < highlightedPath.length - 1; i++) {
          const sourceId = typeof d.source === 'string' ? d.source : d.source.id
          const targetId = typeof d.target === 'string' ? d.target : d.target.id
          if ((sourceId === highlightedPath[i] && targetId === highlightedPath[i + 1]) ||
              (sourceId === highlightedPath[i + 1] && targetId === highlightedPath[i])) {
            return true
          }
        }
        return false
      })
      .attr('stroke', (d: GraphLink) => {
        if (selectedLinks.has(d.id)) return 'var(--primary-color, #3b82f6)'
        if (hoveredLink === d.id) return 'var(--warning-color, #f59e0b)'
        return '#999'
      })
      .attr('stroke-width', (d: GraphLink) => {
        if (selectedLinks.has(d.id)) return 3
        if (hoveredLink === d.id) return 2.5
        return 1.5
      })

    // 添加事件监听
    linkUpdate
      .on('click', (event: MouseEvent, d: GraphLink) => {
        event.stopPropagation()
        onLinkClick?.(event as any, d)
      })
      .on('mouseenter', (event: MouseEvent, d: GraphLink) => {
        onLinkHover?.(d)
      })
      .on('mouseleave', () => {
        onLinkHover?.(null)
      })
      .on('contextmenu', (event: MouseEvent, d: GraphLink) => {
        event.preventDefault()
        onContextMenu?.(event as any, { type: 'link', id: d.id })
      })

    renderStateRef.current.linkElements = linkUpdate
    return linkUpdate
  }, [data.links, selectedLinks, hoveredLink, highlightedPath, onLinkClick, onLinkHover, onContextMenu])

  // 渲染节点
  const renderNodes = useCallback((container: d3.Selection<SVGGElement, unknown, null, undefined>) => {
    const nodeSelection = container.selectAll<SVGGElement, GraphNode>('.graph-node')
      .data(data.nodes, (d: GraphNode) => d.id)

    // 移除旧元素
    nodeSelection.exit().remove()

    // 添加新元素
    const nodeEnter = nodeSelection.enter()
      .append('g')
      .attr('class', 'graph-node')

    // 添加圆形
    nodeEnter.append('circle')
      .attr('r', (d: GraphNode) => d.size || 8)
      .attr('fill', (d: GraphNode) => d.color || '#69b3a2')

    // 添加标签
    nodeEnter.append('text')
      .attr('class', 'node-label')
      .attr('dy', (d: GraphNode) => (d.size || 8) + 15)
      .attr('text-anchor', 'middle')
      .text((d: GraphNode) => d.label || d.id)

    // 合并选择
    const nodeUpdate = nodeEnter.merge(nodeSelection)

    // 更新样式
    nodeUpdate
      .classed('selected', (d: GraphNode) => selectedNodes.has(d.id))
      .classed('highlighted', (d: GraphNode) => highlightedPath.includes(d.id))

    nodeUpdate.select('circle')
      .attr('r', (d: GraphNode) => {
        const baseSize = d.size || 8
        if (selectedNodes.has(d.id)) return baseSize * 1.3
        if (hoveredNode === d.id) return baseSize * 1.2
        return baseSize
      })
      .attr('fill', (d: GraphNode) => {
        if (selectedNodes.has(d.id)) return 'var(--primary-color, #3b82f6)'
        if (hoveredNode === d.id) return 'var(--warning-color, #f59e0b)'
        if (highlightedPath.includes(d.id)) return 'var(--success-color, #10b981)'
        return d.color || '#69b3a2'
      })
      .attr('stroke', (d: GraphNode) => {
        if (selectedNodes.has(d.id)) return 'var(--primary-color-dark, #1d4ed8)'
        return 'none'
      })
      .attr('stroke-width', (d: GraphNode) => selectedNodes.has(d.id) ? 2 : 0)

    nodeUpdate.select('.node-label')
      .classed('selected', (d: GraphNode) => selectedNodes.has(d.id))
      .attr('dy', (d: GraphNode) => {
        const baseSize = d.size || 8
        const currentSize = selectedNodes.has(d.id) ? baseSize * 1.3 : 
                          hoveredNode === d.id ? baseSize * 1.2 : baseSize
        return currentSize + 15
      })

    // 添加事件监听
    nodeUpdate
      .style('cursor', 'pointer')
      .on('click', (event: MouseEvent, d: GraphNode) => {
        event.stopPropagation()
        onNodeClick?.(event as any, d)
      })
      .on('mouseenter', (event: MouseEvent, d: GraphNode) => {
        onNodeHover?.(d)
      })
      .on('mouseleave', () => {
        onNodeHover?.(null)
      })
      .on('contextmenu', (event: MouseEvent, d: GraphNode) => {
        event.preventDefault()
        onContextMenu?.(event as any, { type: 'node', id: d.id })
      })

    // 添加拖拽行为
    const drag = d3.drag<SVGGElement, GraphNode>()
      .on('start', (event, d) => {
        if (renderStateRef.current.simulation) {
          renderStateRef.current.simulation.alphaTarget(0.3).restart()
        }
        d.fx = d.x
        d.fy = d.y
      })
      .on('drag', (event, d) => {
        d.fx = event.x
        d.fy = event.y
        onNodeDrag?.(d.id, event.x, event.y)
      })
      .on('end', (event, d) => {
        if (renderStateRef.current.simulation) {
          renderStateRef.current.simulation.alphaTarget(0)
        }
        d.fx = null
        d.fy = null
      })

    nodeUpdate.call(drag)

    renderStateRef.current.nodeElements = nodeUpdate
    return nodeUpdate
  }, [data.nodes, selectedNodes, hoveredNode, highlightedPath, onNodeClick, onNodeHover, onNodeDrag, onContextMenu])

  // 更新位置
  const updatePositions = useCallback(() => {
    if (renderStateRef.current.linkElements) {
      renderStateRef.current.linkElements
        .attr('x1', (d: GraphLink) => (typeof d.source === 'object' ? d.source.x : 0) || 0)
        .attr('y1', (d: GraphLink) => (typeof d.source === 'object' ? d.source.y : 0) || 0)
        .attr('x2', (d: GraphLink) => (typeof d.target === 'object' ? d.target.x : 0) || 0)
        .attr('y2', (d: GraphLink) => (typeof d.target === 'object' ? d.target.y : 0) || 0)
    }

    if (renderStateRef.current.nodeElements) {
      renderStateRef.current.nodeElements
        .attr('transform', (d: GraphNode) => `translate(${d.x || 0}, ${d.y || 0})`)
    }
  }, [])

  // 初始化和更新图形
  useEffect(() => {
    if (!containerRef.current) return

    const container = d3.select(containerRef.current)

    // 应用布局位置
    if (layout.type !== 'force') {
      applyLayoutPositions(data.nodes)
    }

    // 渲染连接和节点
    renderLinks(container)
    renderNodes(container)

    // 创建或更新仿真
    if (layout.type === 'force') {
      const simulation = createSimulation(data.nodes, data.links)
      renderStateRef.current.simulation = simulation

      simulation.on('tick', updatePositions)

      return () => {
        simulation.stop()
      }
    } else {
      // 非力导向布局直接更新位置
      updatePositions()
    }
  }, [data, layout, applyLayoutPositions, renderLinks, renderNodes, createSimulation, updatePositions])

  // 更新选择和悬停状态
  useEffect(() => {
    if (renderStateRef.current.nodeElements) {
      renderStateRef.current.nodeElements
        .classed('selected', (d: GraphNode) => selectedNodes.has(d.id))
        .classed('highlighted', (d: GraphNode) => highlightedPath.includes(d.id))

      renderStateRef.current.nodeElements.select('circle')
        .attr('r', (d: GraphNode) => {
          const baseSize = d.size || 8
          if (selectedNodes.has(d.id)) return baseSize * 1.3
          if (hoveredNode === d.id) return baseSize * 1.2
          return baseSize
        })
        .attr('fill', (d: GraphNode) => {
          if (selectedNodes.has(d.id)) return 'var(--primary-color, #3b82f6)'
          if (hoveredNode === d.id) return 'var(--warning-color, #f59e0b)'
          if (highlightedPath.includes(d.id)) return 'var(--success-color, #10b981)'
          return d.color || '#69b3a2'
        })
    }

    if (renderStateRef.current.linkElements) {
      renderStateRef.current.linkElements
        .classed('selected', (d: GraphLink) => selectedLinks.has(d.id))
        .attr('stroke', (d: GraphLink) => {
          if (selectedLinks.has(d.id)) return 'var(--primary-color, #3b82f6)'
          if (hoveredLink === d.id) return 'var(--warning-color, #f59e0b)'
          return '#999'
        })
    }
  }, [selectedNodes, selectedLinks, hoveredNode, hoveredLink, highlightedPath])

  return <g ref={containerRef} className="interactive-graph-renderer" />
}

export default InteractiveGraphRenderer
