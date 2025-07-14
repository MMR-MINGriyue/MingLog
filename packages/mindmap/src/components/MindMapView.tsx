/**
 * 思维导图主视图组件
 */

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { select, Selection } from 'd3-selection'
import { zoom, zoomIdentity, ZoomBehavior } from 'd3-zoom'
import { drag } from 'd3-drag'
import 'd3-transition'

import { MindMapProps, MindMapData, MindMapNode, LayoutConfig, ExportConfig, LayoutType } from '../types'
import { treeLayout } from '../algorithms/TreeLayout'
import { radialLayout } from '../algorithms/RadialLayout'
import { MindMapNode as NodeComponent } from './MindMapNode'
import { MindMapLink } from './MindMapLink'
import { MindMapToolbar } from './MindMapToolbar'

export const MindMapView: React.FC<MindMapProps> = ({
  data,
  width = 800,
  height = 600,
  layout = { type: 'tree' },
  enableZoom = true,
  enableDrag = true,
  enableEdit = false,
  showToolbar = true,
  showMinimap = false,
  showGrid = false,
  onNodeClick,
  onNodeDoubleClick,
  onNodeEdit,
  onNodeAdd,
  onNodeDelete,
  onNodeMove,
  onLinkClick,
  onBackgroundClick,
  onZoom,
  onExport,
  className = '',
  style
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [layoutData, setLayoutData] = useState<MindMapData>(data)
  const [currentLayout, setCurrentLayout] = useState<LayoutConfig>(layout)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set())
  const [draggedNode, setDraggedNode] = useState<MindMapNode | null>(null)
  const [isLayouting, setIsLayouting] = useState(false)
  const [editingNode, setEditingNode] = useState<string | null>(null)
  const [renderTime, setRenderTime] = useState(0)

  // 性能监控
  const performanceRef = useRef({
    lastRenderStart: 0,
    frameCount: 0,
    totalRenderTime: 0
  })

  // 布局计算
  const calculateLayout = useCallback(async (newData: MindMapData, layoutConfig: LayoutConfig) => {
    const startTime = performance.now()
    setIsLayouting(true)

    try {
      let layoutAlgorithm

      switch (layoutConfig.type) {
        case 'tree':
          layoutAlgorithm = treeLayout
          break
        case 'radial':
          layoutAlgorithm = radialLayout
          break
        default:
          layoutAlgorithm = treeLayout
      }

      const layoutResult = layoutAlgorithm.calculate(newData, layoutConfig)
      setLayoutData(layoutResult)

      const endTime = performance.now()
      const layoutTime = endTime - startTime

      // 性能监控：确保布局计算时间<100ms
      if (layoutTime > 100) {
        console.warn(`布局计算时间过长: ${layoutTime.toFixed(2)}ms`)
      }

      return layoutResult
    } catch (error) {
      console.error('布局计算失败:', error)
      setLayoutData(newData) // 回退到原始数据
      return newData
    } finally {
      setIsLayouting(false)
    }
  }, [])

  // 数据变化时重新计算布局
  useEffect(() => {
    calculateLayout(data, currentLayout)
  }, [data, currentLayout, calculateLayout])

  // 布局配置变化时重新计算
  useEffect(() => {
    if (layout.type !== currentLayout.type) {
      setCurrentLayout(layout)
    }
  }, [layout, currentLayout])

  // 渲染性能监控
  useEffect(() => {
    const startTime = performance.now()
    performanceRef.current.lastRenderStart = startTime

    return () => {
      const endTime = performance.now()
      const renderTime = endTime - startTime

      performanceRef.current.frameCount++
      performanceRef.current.totalRenderTime += renderTime

      setRenderTime(renderTime)

      // 性能警告：确保渲染时间<100ms
      if (renderTime > 100) {
        console.warn(`思维导图渲染时间过长: ${renderTime.toFixed(2)}ms`)
      }
    }
  })

  // 节点点击处理
  const handleNodeClick = useCallback((node: MindMapNode, event: MouseEvent) => {
    event.stopPropagation()

    if (event.ctrlKey || event.metaKey) {
      // 多选模式
      setSelectedNodes(prev => {
        const newSet = new Set(prev)
        if (newSet.has(node.id)) {
          newSet.delete(node.id)
        } else {
          newSet.add(node.id)
        }
        return newSet
      })
    } else {
      // 单选模式
      setSelectedNodes(new Set([node.id]))
    }

    onNodeClick?.(node, event)
  }, [onNodeClick])

  // 节点双击处理
  const handleNodeDoubleClick = useCallback((node: MindMapNode, event: MouseEvent) => {
    event.stopPropagation()

    if (enableEdit) {
      setEditingNode(node.id)
    }

    onNodeDoubleClick?.(node, event)
  }, [enableEdit, onNodeDoubleClick])

  // 节点编辑处理
  const handleNodeEdit = useCallback((node: MindMapNode, newText: string) => {
    setEditingNode(null)

    if (newText.trim() && newText !== node.text) {
      onNodeEdit?.(node, newText.trim())
    }
  }, [onNodeEdit])

  // 节点移动处理
  const handleNodeMove = useCallback((node: MindMapNode, newPosition: { x: number; y: number }) => {
    if (!enableDrag) return

    // 更新本地状态
    setLayoutData(prev => ({
      ...prev,
      nodes: prev.nodes.map(n =>
        n.id === node.id ? { ...n, x: newPosition.x, y: newPosition.y } : n
      )
    }))

    onNodeMove?.(node, newPosition)
  }, [enableDrag, onNodeMove])

  // 背景点击处理
  const handleBackgroundClick = useCallback((event: MouseEvent) => {
    setSelectedNodes(new Set())
    setEditingNode(null)
    onBackgroundClick?.(event)
  }, [onBackgroundClick])

  // 缩放处理
  const handleZoom = useCallback((scale: number) => {
    setZoomLevel(scale)
    onZoom?.(scale)
  }, [onZoom])

  // D3.js 集成
  useEffect(() => {
    if (!svgRef.current) return

    const svg = select(svgRef.current)
    const container = svg.select('.mindmap-container')

    // 清除现有内容
    container.selectAll('*').remove()

    // 设置缩放行为
    if (enableZoom) {
      const zoomBehavior: ZoomBehavior<SVGSVGElement, unknown> = zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 5])
        .on('zoom', (event) => {
          const { transform } = event
          container.attr('transform', transform.toString())
          handleZoom(transform.k)
        })

      svg.call(zoomBehavior)

      // 重置缩放
      svg.call(zoomBehavior.transform, zoomIdentity)
    }

    // 设置拖拽行为
    if (enableDrag) {
      const dragBehavior = drag<SVGGElement, MindMapNode>()
        .on('start', (event, d) => {
          setDraggedNode(d)
        })
        .on('drag', (event, d) => {
          const newX = event.x
          const newY = event.y

          // 更新节点位置
          select(event.sourceEvent.target.parentNode)
            .attr('transform', `translate(${newX}, ${newY})`)

          // 更新连线
          updateLinks(d.id, newX, newY)
        })
        .on('end', (event, d) => {
          const newPosition = { x: event.x, y: event.y }
          handleNodeMove(d, newPosition)
          setDraggedNode(null)
        })

      // 应用拖拽行为到节点
      container.selectAll('.mindmap-node')
        .call(dragBehavior as any)
    }

    // 背景点击事件
    svg.on('click', (event) => {
      if (event.target === svg.node()) {
        handleBackgroundClick(event)
      }
    })

  }, [layoutData, enableZoom, enableDrag, handleZoom, handleNodeMove, handleBackgroundClick])

  // 更新连线位置
  const updateLinks = useCallback((nodeId: string, newX: number, newY: number) => {
    if (!svgRef.current) return

    const svg = select(svgRef.current)

    // 更新以该节点为源的连线
    svg.selectAll(`.link-source-${nodeId}`)
      .attr('x1', newX)
      .attr('y1', newY)

    // 更新以该节点为目标的连线
    svg.selectAll(`.link-target-${nodeId}`)
      .attr('x2', newX)
      .attr('y2', newY)
  }, [])

  // 渲染节点
  const renderNodes = useCallback(() => {
    if (!svgRef.current) return

    const svg = select(svgRef.current)
    const container = svg.select('.mindmap-container')

    const nodeGroups = container.selectAll('.mindmap-node')
      .data(layoutData.nodes, (d: any) => d.id)

    // 移除不存在的节点
    nodeGroups.exit().remove()

    // 添加新节点
    const nodeEnter = nodeGroups.enter()
      .append('g')
      .attr('class', 'mindmap-node')
      .attr('transform', d => `translate(${d.x || 0}, ${d.y || 0})`)

    // 添加节点背景
    nodeEnter.append('rect')
      .attr('class', 'node-background')
      .attr('rx', d => d.style?.borderRadius || 6)
      .attr('ry', d => d.style?.borderRadius || 6)
      .attr('fill', d => d.style?.backgroundColor || '#F3F4F6')
      .attr('stroke', d => d.style?.borderColor || '#D1D5DB')
      .attr('stroke-width', d => d.style?.borderWidth || 1)

    // 添加节点文本
    nodeEnter.append('text')
      .attr('class', 'node-text')
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'central')
      .attr('fill', d => d.style?.textColor || '#1F2937')
      .attr('font-size', d => d.style?.fontSize || 14)
      .attr('font-weight', d => d.style?.fontWeight || 'normal')
      .text(d => d.text)

    // 更新现有节点
    const nodeUpdate = nodeEnter.merge(nodeGroups as any)

    // 计算文本尺寸并调整背景
    nodeUpdate.each(function(d) {
      const group = select(this)
      const text = group.select('.node-text')
      const background = group.select('.node-background')

      // 获取文本边界框
      const textBBox = (text.node() as SVGTextElement)?.getBBox()
      if (textBBox) {
        const padding = d.style?.padding || 8
        const minWidth = d.style?.minWidth || 60
        const minHeight = d.style?.minHeight || 30

        const width = Math.max(textBBox.width + padding * 2, minWidth)
        const height = Math.max(textBBox.height + padding * 2, minHeight)

        background
          .attr('x', -width / 2)
          .attr('y', -height / 2)
          .attr('width', width)
          .attr('height', height)
      }
    })

    // 添加交互事件
    nodeUpdate
      .style('cursor', enableDrag ? 'move' : 'pointer')
      .on('click', (event, d) => handleNodeClick(d, event))
      .on('dblclick', (event, d) => handleNodeDoubleClick(d, event))

    // 选中状态样式
    nodeUpdate.select('.node-background')
      .attr('stroke-width', d => selectedNodes.has(d.id) ? 3 : (d.style?.borderWidth || 1))
      .attr('stroke', d => selectedNodes.has(d.id) ? '#3B82F6' : (d.style?.borderColor || '#D1D5DB'))

  }, [layoutData.nodes, selectedNodes, enableDrag, handleNodeClick, handleNodeDoubleClick])

  // 渲染连线
  const renderLinks = useCallback(() => {
    if (!svgRef.current) return

    const svg = select(svgRef.current)
    const container = svg.select('.mindmap-container')

    const links = container.selectAll('.mindmap-link')
      .data(layoutData.links, (d: any) => d.id)

    // 移除不存在的连线
    links.exit().remove()

    // 添加新连线
    const linkEnter = links.enter()
      .append('line')
      .attr('class', 'mindmap-link')

    // 更新连线
    const linkUpdate = linkEnter.merge(links as any)

    linkUpdate
      .attr('class', d => `mindmap-link link-source-${d.source} link-target-${d.target}`)
      .attr('x1', d => {
        const sourceNode = layoutData.nodes.find(n => n.id === d.source)
        return sourceNode?.x || 0
      })
      .attr('y1', d => {
        const sourceNode = layoutData.nodes.find(n => n.id === d.source)
        return sourceNode?.y || 0
      })
      .attr('x2', d => {
        const targetNode = layoutData.nodes.find(n => n.id === d.target)
        return targetNode?.x || 0
      })
      .attr('y2', d => {
        const targetNode = layoutData.nodes.find(n => n.id === d.target)
        return targetNode?.y || 0
      })
      .attr('stroke', d => d.style?.strokeColor || '#6B7280')
      .attr('stroke-width', d => d.style?.strokeWidth || 2)
      .attr('stroke-dasharray', d => d.style?.strokeDasharray || 'none')
      .style('cursor', 'pointer')
      .on('click', (event, d) => onLinkClick?.(d, event))

  }, [layoutData.nodes, layoutData.links, onLinkClick])

  // 渲染网格
  const renderGrid = useCallback(() => {
    if (!showGrid || !svgRef.current) return

    const svg = select(svgRef.current)
    let defs = svg.select('defs')

    if (defs.empty()) {
      defs = svg.append('defs') as any
    }

    // 创建网格图案
    const pattern = defs.selectAll('#grid-pattern')
      .data([1])
      .enter()
      .append('pattern')
      .attr('id', 'grid-pattern')
      .attr('width', 20)
      .attr('height', 20)
      .attr('patternUnits', 'userSpaceOnUse')

    pattern.append('path')
      .attr('d', 'M 20 0 L 0 0 0 20')
      .attr('fill', 'none')
      .attr('stroke', '#E5E7EB')
      .attr('stroke-width', 1)

    // 应用网格背景
    svg.select('.grid-background')
      .attr('fill', 'url(#grid-pattern)')

  }, [showGrid])

  // 主渲染效果
  useEffect(() => {
    if (isLayouting) return

    renderGrid()
    renderLinks()
    renderNodes()
  }, [layoutData, isLayouting, renderGrid, renderLinks, renderNodes])

  // 工具栏操作
  const handleLayoutChange = useCallback((layoutType: LayoutType) => {
    const newLayout = { ...currentLayout, type: layoutType }
    setCurrentLayout(newLayout)
  }, [currentLayout])

  const handleExport = useCallback((config: ExportConfig) => {
    onExport?.(config)
  }, [onExport])

  const handleAddNode = useCallback(() => {
    if (selectedNodes.size === 1) {
      const selectedNodeId = Array.from(selectedNodes)[0]
      const selectedNode = layoutData.nodes.find(n => n.id === selectedNodeId)
      if (selectedNode) {
        onNodeAdd?.(selectedNode)
      }
    }
  }, [selectedNodes, layoutData.nodes, onNodeAdd])

  const handleDeleteNode = useCallback(() => {
    selectedNodes.forEach(nodeId => {
      const node = layoutData.nodes.find(n => n.id === nodeId)
      if (node && node.id !== layoutData.rootId) {
        onNodeDelete?.(node)
      }
    })
    setSelectedNodes(new Set())
  }, [selectedNodes, layoutData.nodes, layoutData.rootId, onNodeDelete])

  return (
    <div
      ref={containerRef}
      className={`mindmap-view ${className}`}
      style={{
        width,
        height,
        position: 'relative',
        overflow: 'hidden',
        ...style
      }}
    >
      {/* 工具栏 */}
      {showToolbar && (
        <MindMapToolbar
          currentLayout={currentLayout.type}
          zoomLevel={zoomLevel}
          onLayoutChange={handleLayoutChange}
          onZoomIn={() => handleZoom(Math.min(zoomLevel * 1.2, 5))}
          onZoomOut={() => handleZoom(Math.max(zoomLevel / 1.2, 0.1))}
          onFitToView={() => handleZoom(1)}
          onExport={handleExport}
        />
      )}

      {/* 主SVG画布 */}
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="mindmap-svg"
        style={{
          display: 'block',
          background: style?.backgroundColor || '#FAFAFA'
        }}
      >
        {/* 网格背景 */}
        {showGrid && (
          <rect
            className="grid-background"
            width="100%"
            height="100%"
            fill="url(#grid-pattern)"
          />
        )}

        {/* 主容器组 */}
        <g className="mindmap-container" />
      </svg>

      {/* 小地图 */}
      {showMinimap && (
        <div className="mindmap-minimap">
          <svg
            width={200}
            height={150}
            className="minimap-svg"
            style={{
              position: 'absolute',
              bottom: 20,
              right: 20,
              border: '1px solid #D1D5DB',
              borderRadius: 4,
              background: 'rgba(255, 255, 255, 0.9)'
            }}
          >
            {/* 小地图内容 */}
            <g className="minimap-content" transform="scale(0.1)">
              {layoutData.nodes.map(node => (
                <circle
                  key={node.id}
                  cx={node.x || 0}
                  cy={node.y || 0}
                  r={5}
                  fill={selectedNodes.has(node.id) ? '#3B82F6' : '#9CA3AF'}
                />
              ))}
            </g>
          </svg>
        </div>
      )}

      {/* 加载状态 */}
      {isLayouting && (
        <div
          className="mindmap-loading"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(255, 255, 255, 0.9)',
            padding: '20px',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}
        >
          <div
            className="loading-spinner"
            style={{
              width: '20px',
              height: '20px',
              border: '2px solid #E5E7EB',
              borderTop: '2px solid #3B82F6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}
          />
          <span>计算布局中...</span>
        </div>
      )}

      {/* 性能信息（开发模式） */}
      {process.env.NODE_ENV === 'development' && (
        <div
          className="mindmap-performance"
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            background: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            fontFamily: 'monospace'
          }}
        >
          <div>渲染时间: {renderTime.toFixed(2)}ms</div>
          <div>缩放级别: {(zoomLevel * 100).toFixed(0)}%</div>
          <div>节点数量: {layoutData.nodes.length}</div>
          <div>连线数量: {layoutData.links.length}</div>
          <div>选中节点: {selectedNodes.size}</div>
        </div>
      )}

      {/* 编辑模式 */}
      {editingNode && (
        <NodeEditor
          nodeId={editingNode}
          initialText={layoutData.nodes.find(n => n.id === editingNode)?.text || ''}
          onSave={(text) => {
            const node = layoutData.nodes.find(n => n.id === editingNode)
            if (node) {
              handleNodeEdit(node, text)
            }
          }}
          onCancel={() => setEditingNode(null)}
        />
      )}

      {/* CSS动画 */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .mindmap-node {
          transition: all 0.2s ease;
        }

        .mindmap-node:hover {
          filter: brightness(1.1);
        }

        .mindmap-link {
          transition: all 0.2s ease;
        }

        .mindmap-link:hover {
          stroke-width: 3;
        }
      `}</style>
    </div>
  )
}

// 节点编辑器组件
const NodeEditor: React.FC<{
  nodeId: string
  initialText: string
  onSave: (text: string) => void
  onCancel: () => void
}> = ({ nodeId, initialText, onSave, onCancel }) => {
  const [text, setText] = useState(initialText)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSave(text)
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'white',
        padding: '20px',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        zIndex: 1000
      }}
    >
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => onSave(text)}
        style={{
          width: '200px',
          padding: '8px',
          border: '1px solid #D1D5DB',
          borderRadius: '4px',
          fontSize: '14px'
        }}
      />
    </div>
  )
}

export default MindMapView
