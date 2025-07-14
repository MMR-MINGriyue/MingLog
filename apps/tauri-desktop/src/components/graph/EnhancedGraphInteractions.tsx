/**
 * 增强版图形交互组件
 * 提供完整的图形交互功能，包括拖拽、缩放、选择、右键菜单等
 */

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { GraphData, GraphNode, GraphLink } from '@minglog/graph'
import * as d3 from 'd3'
import { appCore } from '../../core/AppCore'

interface ContextMenuItem {
  id: string
  label: string
  icon?: string
  action?: () => void
  disabled?: boolean
  separator?: boolean
}

interface SelectionBox {
  startX: number
  startY: number
  endX: number
  endY: number
  active: boolean
}

interface ViewportTransform {
  x: number
  y: number
  k: number
}

interface EnhancedGraphInteractionsProps {
  /** 图形数据 */
  data: GraphData
  /** 画布宽度 */
  width: number
  /** 画布高度 */
  height: number
  /** 选中的节点 */
  selectedNodes: Set<string>
  /** 选中的连接 */
  selectedLinks: Set<string>
  /** 悬停的节点 */
  hoveredNode: string | null
  /** 悬停的连接 */
  hoveredLink: string | null
  /** 启用拖拽 */
  enableDrag?: boolean
  /** 启用缩放 */
  enableZoom?: boolean
  /** 启用平移 */
  enablePan?: boolean
  /** 启用框选 */
  enableBoxSelect?: boolean
  /** 最小缩放比例 */
  minZoom?: number
  /** 最大缩放比例 */
  maxZoom?: number
  /** 节点选择回调 */
  onNodeSelect?: (nodeIds: string[], addToSelection?: boolean) => void
  /** 连接选择回调 */
  onLinkSelect?: (linkIds: string[], addToSelection?: boolean) => void
  /** 节点拖拽回调 */
  onNodeDrag?: (nodeId: string, x: number, y: number) => void
  /** 节点悬停回调 */
  onNodeHover?: (nodeId: string | null) => void
  /** 连接悬停回调 */
  onLinkHover?: (linkId: string | null) => void
  /** 视口变换回调 */
  onViewportChange?: (transform: ViewportTransform) => void
  /** 右键菜单回调 */
  onContextMenu?: (type: 'node' | 'link' | 'background', id?: string, x?: number, y?: number) => void
  /** 子组件 */
  children: React.ReactNode
  /** 自定义类名 */
  className?: string
}

interface InteractionState {
  /** 当前视口变换 */
  transform: ViewportTransform
  /** 框选状态 */
  selectionBox: SelectionBox | null
  /** 右键菜单状态 */
  contextMenu: {
    x: number
    y: number
    items: ContextMenuItem[]
    target: { type: 'node' | 'link' | 'background'; id?: string }
  } | null
  /** 是否正在拖拽 */
  isDragging: boolean
  /** 是否正在平移 */
  isPanning: boolean
}

/**
 * 增强版图形交互组件
 */
export const EnhancedGraphInteractions: React.FC<EnhancedGraphInteractionsProps> = ({
  data,
  width,
  height,
  selectedNodes,
  selectedLinks,
  hoveredNode,
  hoveredLink,
  enableDrag = true,
  enableZoom = true,
  enablePan = true,
  enableBoxSelect = true,
  minZoom = 0.1,
  maxZoom = 10,
  onNodeSelect,
  onLinkSelect,
  onNodeDrag,
  onNodeHover,
  onLinkHover,
  onViewportChange,
  onContextMenu,
  children,
  className = ''
}) => {
  // 引用
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)

  // 状态管理
  const [state, setState] = useState<InteractionState>({
    transform: { x: 0, y: 0, k: 1 },
    selectionBox: null,
    contextMenu: null,
    isDragging: false,
    isPanning: false
  })

  // 获取节点在屏幕上的位置
  const getNodeScreenPosition = useCallback((node: GraphNode) => {
    const { transform } = state
    return {
      x: (node.x || 0) * transform.k + transform.x,
      y: (node.y || 0) * transform.k + transform.y
    }
  }, [state.transform])

  // 获取屏幕坐标对应的图形坐标
  const getGraphPosition = useCallback((screenX: number, screenY: number) => {
    const { transform } = state
    return {
      x: (screenX - transform.x) / transform.k,
      y: (screenY - transform.y) / transform.k
    }
  }, [state.transform])

  // 初始化缩放行为
  useEffect(() => {
    if (!svgRef.current || !enableZoom) return

    const svg = d3.select(svgRef.current)
    
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([minZoom, maxZoom])
      .on('zoom', (event) => {
        const { x, y, k } = event.transform
        const newTransform = { x, y, k }
        
        setState(prev => ({ ...prev, transform: newTransform }))
        onViewportChange?.(newTransform)
      })
      .on('start', () => {
        setState(prev => ({ ...prev, isPanning: true }))
      })
      .on('end', () => {
        setState(prev => ({ ...prev, isPanning: false }))
      })

    if (enablePan) {
      svg.call(zoom)
    } else {
      // 只允许缩放，不允许平移
      svg.call(zoom.translateExtent([[0, 0], [width, height]]))
    }

    zoomRef.current = zoom

    return () => {
      svg.on('.zoom', null)
    }
  }, [enableZoom, enablePan, minZoom, maxZoom, width, height, onViewportChange])

  // 处理节点点击
  const handleNodeClick = useCallback((event: React.MouseEvent, node: GraphNode) => {
    event.stopPropagation()

    if (event.ctrlKey || event.metaKey) {
      // 多选模式
      const newSelection = new Set(selectedNodes)
      if (newSelection.has(node.id)) {
        newSelection.delete(node.id)
      } else {
        newSelection.add(node.id)
      }
      onNodeSelect?.(Array.from(newSelection), true)
    } else {
      // 单选模式
      onNodeSelect?.([node.id], false)
    }

    // 发送事件到事件总线
    if (appCore.isInitialized()) {
      const eventBus = appCore.getEventBus()
      eventBus?.emit('graph:node:clicked', {
        nodeId: node.id,
        multiSelect: event.ctrlKey || event.metaKey
      }, 'EnhancedGraphInteractions')
    }
  }, [selectedNodes, onNodeSelect])

  // 处理连接点击
  const handleLinkClick = useCallback((event: React.MouseEvent, link: GraphLink) => {
    event.stopPropagation()

    if (event.ctrlKey || event.metaKey) {
      // 多选模式
      const newSelection = new Set(selectedLinks)
      if (newSelection.has(link.id)) {
        newSelection.delete(link.id)
      } else {
        newSelection.add(link.id)
      }
      onLinkSelect?.(Array.from(newSelection), true)
    } else {
      // 单选模式
      onLinkSelect?.([link.id], false)
    }
  }, [selectedLinks, onLinkSelect])

  // 处理节点悬停
  const handleNodeHover = useCallback((node: GraphNode | null) => {
    onNodeHover?.(node?.id || null)
  }, [onNodeHover])

  // 处理连接悬停
  const handleLinkHover = useCallback((link: GraphLink | null) => {
    onLinkHover?.(link?.id || null)
  }, [onLinkHover])

  // 处理背景点击
  const handleBackgroundClick = useCallback((event: React.MouseEvent) => {
    if (state.isDragging || state.isPanning) return

    // 清除所有选择
    onNodeSelect?.([], false)
    onLinkSelect?.([], false)

    // 关闭右键菜单
    setState(prev => ({ ...prev, contextMenu: null }))
  }, [state.isDragging, state.isPanning, onNodeSelect, onLinkSelect])

  // 处理框选开始
  const handleSelectionStart = useCallback((event: React.MouseEvent) => {
    if (!enableBoxSelect) return
    if (event.button !== 0) return // 只处理左键
    if (event.ctrlKey || event.metaKey) return // 按住Ctrl时不启动框选
    if (state.isPanning) return // 平移时不启动框选

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const startX = event.clientX - rect.left
    const startY = event.clientY - rect.top

    setState(prev => ({
      ...prev,
      selectionBox: {
        startX,
        startY,
        endX: startX,
        endY: startY,
        active: true
      }
    }))

    event.preventDefault()
  }, [enableBoxSelect, state.isPanning])

  // 处理框选移动
  const handleSelectionMove = useCallback((event: React.MouseEvent) => {
    if (!state.selectionBox?.active) return

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const endX = event.clientX - rect.left
    const endY = event.clientY - rect.top

    setState(prev => ({
      ...prev,
      selectionBox: prev.selectionBox ? {
        ...prev.selectionBox,
        endX,
        endY
      } : null
    }))
  }, [state.selectionBox])

  // 处理框选结束
  const handleSelectionEnd = useCallback(() => {
    if (!state.selectionBox?.active) return

    const { startX, startY, endX, endY } = state.selectionBox
    const minX = Math.min(startX, endX)
    const maxX = Math.max(startX, endX)
    const minY = Math.min(startY, endY)
    const maxY = Math.max(startY, endY)

    // 转换为图形坐标
    const topLeft = getGraphPosition(minX, minY)
    const bottomRight = getGraphPosition(maxX, maxY)

    // 查找选择框内的节点
    const selectedNodeIds = data.nodes
      .filter(node => {
        const x = node.x || 0
        const y = node.y || 0
        return x >= topLeft.x && x <= bottomRight.x && 
               y >= topLeft.y && y <= bottomRight.y
      })
      .map(node => node.id)

    if (selectedNodeIds.length > 0) {
      onNodeSelect?.(selectedNodeIds, false)
    }

    setState(prev => ({ ...prev, selectionBox: null }))
  }, [state.selectionBox, data.nodes, getGraphPosition, onNodeSelect])

  // 处理右键菜单
  const handleContextMenu = useCallback((
    event: React.MouseEvent,
    target: { type: 'node' | 'link' | 'background'; id?: string }
  ) => {
    event.preventDefault()

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    onContextMenu?.(target.type, target.id, x, y)

    // 生成默认菜单项
    let items: ContextMenuItem[] = []

    switch (target.type) {
      case 'node':
        const isSelected = selectedNodes.has(target.id!)
        items = [
          {
            id: 'select',
            label: isSelected ? '取消选择' : '选择节点',
            icon: '🎯',
            action: () => {
              if (isSelected) {
                const newSelection = new Set(selectedNodes)
                newSelection.delete(target.id!)
                onNodeSelect?.(Array.from(newSelection), false)
              } else {
                onNodeSelect?.([target.id!], true)
              }
            }
          },
          {
            id: 'select-connected',
            label: '选择相连节点',
            icon: '🔗',
            action: () => {
              const connectedNodes = data.links
                .filter(link => {
                  const sourceId = typeof link.source === 'string' ? link.source : link.source.id
                  const targetId = typeof link.target === 'string' ? link.target : link.target.id
                  return sourceId === target.id || targetId === target.id
                })
                .map(link => {
                  const sourceId = typeof link.source === 'string' ? link.source : link.source.id
                  const targetId = typeof link.target === 'string' ? link.target : link.target.id
                  return sourceId === target.id ? targetId : sourceId
                })
              
              onNodeSelect?.([target.id!, ...connectedNodes], false)
            }
          },
          { id: 'separator1', label: '', separator: true },
          {
            id: 'focus',
            label: '聚焦到此节点',
            icon: '🎯',
            action: () => {
              const node = data.nodes.find(n => n.id === target.id)
              if (node && zoomRef.current && svgRef.current) {
                const svg = d3.select(svgRef.current)
                const centerX = width / 2 - (node.x || 0)
                const centerY = height / 2 - (node.y || 0)
                
                svg.transition()
                  .duration(750)
                  .call(zoomRef.current.transform, d3.zoomIdentity.translate(centerX, centerY).scale(1.5))
              }
            }
          }
        ]
        break

      case 'link':
        items = [
          {
            id: 'select',
            label: '选择连接',
            icon: '🔗',
            action: () => onLinkSelect?.([target.id!], false)
          },
          {
            id: 'select-endpoints',
            label: '选择端点',
            icon: '🎯',
            action: () => {
              const link = data.links.find(l => l.id === target.id)
              if (link) {
                const sourceId = typeof link.source === 'string' ? link.source : link.source.id
                const targetId = typeof link.target === 'string' ? link.target : link.target.id
                onNodeSelect?.([sourceId, targetId], false)
              }
            }
          }
        ]
        break

      case 'background':
        items = [
          {
            id: 'select-all',
            label: '全选节点',
            icon: '🎯',
            action: () => onNodeSelect?.(data.nodes.map(n => n.id), false)
          },
          {
            id: 'clear-selection',
            label: '清除选择',
            icon: '❌',
            action: () => {
              onNodeSelect?.([], false)
              onLinkSelect?.([], false)
            }
          },
          { id: 'separator1', label: '', separator: true },
          {
            id: 'fit-view',
            label: '适应视图',
            icon: '🔍',
            action: () => {
              if (zoomRef.current && svgRef.current) {
                const svg = d3.select(svgRef.current)
                svg.transition()
                  .duration(750)
                  .call(zoomRef.current.transform, d3.zoomIdentity)
              }
            }
          }
        ]
        break
    }

    setState(prev => ({
      ...prev,
      contextMenu: { x, y, items, target }
    }))
  }, [data, selectedNodes, selectedLinks, onNodeSelect, onLinkSelect, onContextMenu, width, height])

  // 全局事件监听
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (state.selectionBox?.active) {
        handleSelectionMove(event as any)
      }
    }

    const handleMouseUp = () => {
      if (state.selectionBox?.active) {
        handleSelectionEnd()
      }
    }

    const handleClickOutside = () => {
      setState(prev => ({ ...prev, contextMenu: null }))
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('click', handleClickOutside)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('click', handleClickOutside)
    }
  }, [state.selectionBox, handleSelectionMove, handleSelectionEnd])

  return (
    <div 
      ref={containerRef}
      className={`enhanced-graph-interactions ${className}`}
      style={{ width, height, position: 'relative', overflow: 'hidden' }}
      onMouseDown={handleSelectionStart}
      onClick={handleBackgroundClick}
      onContextMenu={(e) => handleContextMenu(e, { type: 'background' })}
    >
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ 
          cursor: state.isPanning ? 'grabbing' : (enablePan ? 'grab' : 'default'),
          userSelect: 'none'
        }}
      >
        <g transform={`translate(${state.transform.x},${state.transform.y}) scale(${state.transform.k})`}>
          {children}
        </g>
      </svg>

      {/* 框选框 */}
      {state.selectionBox?.active && (
        <div
          className="selection-box"
          style={{
            position: 'absolute',
            left: Math.min(state.selectionBox.startX, state.selectionBox.endX),
            top: Math.min(state.selectionBox.startY, state.selectionBox.endY),
            width: Math.abs(state.selectionBox.endX - state.selectionBox.startX),
            height: Math.abs(state.selectionBox.endY - state.selectionBox.startY),
            border: '2px dashed var(--primary-color, #3b82f6)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            pointerEvents: 'none',
            zIndex: 1000
          }}
        />
      )}

      {/* 右键菜单 */}
      {state.contextMenu && (
        <div
          className="context-menu"
          style={{
            position: 'absolute',
            left: state.contextMenu.x,
            top: state.contextMenu.y,
            zIndex: 2000
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="context-menu-content">
            {state.contextMenu.items.map((item, index) => (
              item.separator ? (
                <div key={item.id} className="context-menu-separator" />
              ) : (
                <button
                  key={item.id}
                  className={`context-menu-item ${item.disabled ? 'disabled' : ''}`}
                  onClick={() => {
                    if (!item.disabled && item.action) {
                      item.action()
                      setState(prev => ({ ...prev, contextMenu: null }))
                    }
                  }}
                  disabled={item.disabled}
                >
                  {item.icon && <span className="menu-icon">{item.icon}</span>}
                  <span className="menu-label">{item.label}</span>
                </button>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default EnhancedGraphInteractions
