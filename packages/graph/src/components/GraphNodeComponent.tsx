/**
 * 图谱节点组件
 * 提供可定制的节点渲染和交互功能
 */

import React, { useState, useCallback } from 'react'
import { GraphNode } from '../types'

interface GraphNodeComponentProps {
  /** 节点数据 */
  node: GraphNode
  /** 节点半径 */
  radius?: number
  /** 是否选中 */
  selected?: boolean
  /** 是否悬停 */
  hovered?: boolean
  /** 是否显示标签 */
  showLabel?: boolean
  /** 是否显示工具提示 */
  showTooltip?: boolean
  /** 节点点击回调 */
  onClick?: (node: GraphNode) => void
  /** 节点双击回调 */
  onDoubleClick?: (node: GraphNode) => void
  /** 节点悬停回调 */
  onHover?: (node: GraphNode | null) => void
  /** 节点拖拽开始回调 */
  onDragStart?: (node: GraphNode) => void
  /** 节点拖拽回调 */
  onDrag?: (node: GraphNode, x: number, y: number) => void
  /** 节点拖拽结束回调 */
  onDragEnd?: (node: GraphNode) => void
  /** 类名 */
  className?: string
}

interface NodeStyle {
  fill: string
  stroke: string
  strokeWidth: number
  opacity: number
  scale: number
}

/**
 * 获取节点样式
 */
const getNodeStyle = (
  node: GraphNode, 
  selected: boolean, 
  hovered: boolean
): NodeStyle => {
  const baseColors = {
    note: '#4A90E2',
    tag: '#7ED321', 
    folder: '#F5A623',
    link: '#BD10E0'
  }

  let fill = node.color || baseColors[node.type] || '#999'
  let stroke = '#fff'
  let strokeWidth = 2
  let opacity = 1
  let scale = 1

  if (selected) {
    stroke = '#007AFF'
    strokeWidth = 3
    scale = 1.2
  } else if (hovered) {
    stroke = '#007AFF'
    strokeWidth = 2.5
    scale = 1.1
    opacity = 0.9
  }

  return { fill, stroke, strokeWidth, opacity, scale }
}

/**
 * 获取节点图标
 */
const getNodeIcon = (type: GraphNode['type']): string => {
  const icons = {
    note: '📝',
    tag: '🏷️',
    folder: '📁',
    link: '🔗'
  }
  return icons[type] || '⚪'
}

/**
 * 图谱节点组件
 */
export const GraphNodeComponent: React.FC<GraphNodeComponentProps> = ({
  node,
  radius = 8,
  selected = false,
  hovered = false,
  showLabel = true,
  showTooltip = true,
  onClick,
  onDoubleClick,
  onHover,
  onDragStart,
  onDrag,
  onDragEnd,
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)

  const nodeStyle = getNodeStyle(node, selected, hovered)
  const nodeIcon = getNodeIcon(node.type)
  const actualRadius = radius * (node.size || 1) * nodeStyle.scale

  /**
   * 处理鼠标按下
   */
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    event.preventDefault()
    setIsDragging(true)
    setDragStart({ x: event.clientX, y: event.clientY })
    onDragStart?.(node)
  }, [node, onDragStart])

  /**
   * 处理鼠标移动
   */
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!isDragging || !dragStart) return

    const deltaX = event.clientX - dragStart.x
    const deltaY = event.clientY - dragStart.y
    
    onDrag?.(node, deltaX, deltaY)
  }, [isDragging, dragStart, node, onDrag])

  /**
   * 处理鼠标释放
   */
  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false)
      setDragStart(null)
      onDragEnd?.(node)
    }
  }, [isDragging, node, onDragEnd])

  /**
   * 处理点击
   */
  const handleClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation()
    onClick?.(node)
  }, [node, onClick])

  /**
   * 处理双击
   */
  const handleDoubleClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation()
    onDoubleClick?.(node)
  }, [node, onDoubleClick])

  /**
   * 处理鼠标进入
   */
  const handleMouseEnter = useCallback(() => {
    onHover?.(node)
  }, [node, onHover])

  /**
   * 处理鼠标离开
   */
  const handleMouseLeave = useCallback(() => {
    onHover?.(null)
  }, [onHover])

  return (
    <g
      className={`graph-node ${className} ${selected ? 'selected' : ''} ${hovered ? 'hovered' : ''}`}
      transform={`translate(${node.x || 0}, ${node.y || 0})`}
      style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* 节点背景圆圈 */}
      <circle
        r={actualRadius}
        fill={nodeStyle.fill}
        stroke={nodeStyle.stroke}
        strokeWidth={nodeStyle.strokeWidth}
        opacity={nodeStyle.opacity}
        className="node-background"
      />

      {/* 节点图标 */}
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={actualRadius * 0.8}
        fill="white"
        className="node-icon"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {nodeIcon}
      </text>

      {/* 节点标签 */}
      {showLabel && (
        <text
          x={actualRadius + 4}
          y={0}
          textAnchor="start"
          dominantBaseline="central"
          fontSize="12"
          fontFamily="Arial, sans-serif"
          fill="#333"
          className="node-label"
          style={{ pointerEvents: 'none', userSelect: 'none' }}
        >
          {node.title}
        </text>
      )}

      {/* 节点大小指示器（如果节点有特殊大小） */}
      {node.size && node.size > 1 && (
        <circle
          r={actualRadius + 2}
          fill="none"
          stroke={nodeStyle.fill}
          strokeWidth={1}
          strokeDasharray="2,2"
          opacity={0.5}
          className="node-size-indicator"
        />
      )}

      {/* 工具提示触发区域 */}
      {showTooltip && (
        <circle
          r={actualRadius + 5}
          fill="transparent"
          className="node-tooltip-trigger"
          style={{ pointerEvents: 'all' }}
        >
          <title>
            {`${node.title}\n类型: ${node.type}\n${node.content ? `内容: ${node.content.slice(0, 100)}...` : ''}\n${node.tags ? `标签: ${node.tags.join(', ')}` : ''}`}
          </title>
        </circle>
      )}
    </g>
  )
}

export default GraphNodeComponent
