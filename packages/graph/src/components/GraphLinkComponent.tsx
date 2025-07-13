/**
 * 图谱连接线组件
 * 提供可定制的连接线渲染和交互功能
 */

import React, { useCallback, useMemo } from 'react'
import { GraphLink, GraphNode } from '../types'

interface GraphLinkComponentProps {
  /** 连接线数据 */
  link: GraphLink
  /** 源节点 */
  sourceNode: GraphNode
  /** 目标节点 */
  targetNode: GraphNode
  /** 是否选中 */
  selected?: boolean
  /** 是否悬停 */
  hovered?: boolean
  /** 是否显示标签 */
  showLabel?: boolean
  /** 是否显示箭头 */
  showArrow?: boolean
  /** 连接线点击回调 */
  onClick?: (link: GraphLink) => void
  /** 连接线悬停回调 */
  onHover?: (link: GraphLink | null) => void
  /** 类名 */
  className?: string
}

interface LinkStyle {
  stroke: string
  strokeWidth: number
  strokeOpacity: number
  strokeDasharray?: string
}

/**
 * 获取连接线样式
 */
const getLinkStyle = (
  link: GraphLink,
  selected: boolean,
  hovered: boolean
): LinkStyle => {
  const baseColors = {
    reference: '#9B9B9B',
    tag: '#7ED321',
    folder: '#F5A623',
    similarity: '#50E3C2'
  }

  let stroke = link.color || baseColors[link.type] || '#999'
  let strokeWidth = Math.sqrt(link.weight || 1) * 2
  let strokeOpacity = 0.6
  let strokeDasharray: string | undefined

  if (selected) {
    stroke = '#007AFF'
    strokeWidth = Math.max(strokeWidth, 3)
    strokeOpacity = 1
  } else if (hovered) {
    strokeWidth = Math.max(strokeWidth, 2.5)
    strokeOpacity = 0.8
  }

  // 根据连接类型设置样式
  switch (link.type) {
    case 'similarity':
      strokeDasharray = '5,5'
      break
    case 'reference':
      strokeDasharray = undefined
      break
    case 'tag':
      strokeDasharray = '2,3'
      break
    case 'folder':
      strokeDasharray = '8,4'
      break
  }

  return { stroke, strokeWidth, strokeOpacity, strokeDasharray }
}

/**
 * 计算连接线路径
 */
const calculateLinkPath = (
  sourceNode: GraphNode,
  targetNode: GraphNode,
  curved: boolean = false
): string => {
  const sx = sourceNode.x || 0
  const sy = sourceNode.y || 0
  const tx = targetNode.x || 0
  const ty = targetNode.y || 0

  if (!curved) {
    return `M ${sx} ${sy} L ${tx} ${ty}`
  }

  // 计算曲线控制点
  const dx = tx - sx
  const dy = ty - sy
  const dr = Math.sqrt(dx * dx + dy * dy)
  
  // 弯曲程度
  const curvature = 0.3
  const midX = (sx + tx) / 2
  const midY = (sy + ty) / 2
  
  // 垂直于连线的偏移
  const offsetX = -dy * curvature
  const offsetY = dx * curvature
  
  const controlX = midX + offsetX
  const controlY = midY + offsetY

  return `M ${sx} ${sy} Q ${controlX} ${controlY} ${tx} ${ty}`
}

/**
 * 计算箭头路径
 */
const calculateArrowPath = (
  sourceNode: GraphNode,
  targetNode: GraphNode,
  arrowSize: number = 8
): string => {
  const sx = sourceNode.x || 0
  const sy = sourceNode.y || 0
  const tx = targetNode.x || 0
  const ty = targetNode.y || 0

  // 计算角度
  const angle = Math.atan2(ty - sy, tx - sx)
  
  // 箭头顶点（在目标节点边缘）
  const nodeRadius = 8 // 假设节点半径
  const arrowTipX = tx - Math.cos(angle) * nodeRadius
  const arrowTipY = ty - Math.sin(angle) * nodeRadius
  
  // 箭头两翼
  const arrowAngle = Math.PI / 6 // 30度
  const wing1X = arrowTipX - Math.cos(angle - arrowAngle) * arrowSize
  const wing1Y = arrowTipY - Math.sin(angle - arrowAngle) * arrowSize
  const wing2X = arrowTipX - Math.cos(angle + arrowAngle) * arrowSize
  const wing2Y = arrowTipY - Math.sin(angle + arrowAngle) * arrowSize

  return `M ${arrowTipX} ${arrowTipY} L ${wing1X} ${wing1Y} M ${arrowTipX} ${arrowTipY} L ${wing2X} ${wing2Y}`
}

/**
 * 计算标签位置
 */
const calculateLabelPosition = (
  sourceNode: GraphNode,
  targetNode: GraphNode
): { x: number; y: number; angle: number } => {
  const sx = sourceNode.x || 0
  const sy = sourceNode.y || 0
  const tx = targetNode.x || 0
  const ty = targetNode.y || 0

  const x = (sx + tx) / 2
  const y = (sy + ty) / 2
  const angle = Math.atan2(ty - sy, tx - sx) * 180 / Math.PI

  return { x, y, angle }
}

/**
 * 图谱连接线组件
 */
export const GraphLinkComponent: React.FC<GraphLinkComponentProps> = ({
  link,
  sourceNode,
  targetNode,
  selected = false,
  hovered = false,
  showLabel = false,
  showArrow = true,
  onClick,
  onHover,
  className = ''
}) => {
  const linkStyle = getLinkStyle(link, selected, hovered)
  
  // 计算路径和位置
  const linkPath = useMemo(() => 
    calculateLinkPath(sourceNode, targetNode, link.type === 'similarity'),
    [sourceNode, targetNode, link.type]
  )
  
  const arrowPath = useMemo(() => 
    showArrow ? calculateArrowPath(sourceNode, targetNode) : '',
    [sourceNode, targetNode, showArrow]
  )
  
  const labelPosition = useMemo(() => 
    showLabel ? calculateLabelPosition(sourceNode, targetNode) : null,
    [sourceNode, targetNode, showLabel]
  )

  /**
   * 处理点击
   */
  const handleClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation()
    onClick?.(link)
  }, [link, onClick])

  /**
   * 处理鼠标进入
   */
  const handleMouseEnter = useCallback(() => {
    onHover?.(link)
  }, [link, onHover])

  /**
   * 处理鼠标离开
   */
  const handleMouseLeave = useCallback(() => {
    onHover?.(null)
  }, [onHover])

  return (
    <g
      className={`graph-link ${className} ${selected ? 'selected' : ''} ${hovered ? 'hovered' : ''}`}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: 'pointer' }}
    >
      {/* 连接线路径 */}
      <path
        d={linkPath}
        stroke={linkStyle.stroke}
        strokeWidth={linkStyle.strokeWidth}
        strokeOpacity={linkStyle.strokeOpacity}
        strokeDasharray={linkStyle.strokeDasharray}
        fill="none"
        className="link-path"
      />

      {/* 箭头 */}
      {showArrow && arrowPath && (
        <path
          d={arrowPath}
          stroke={linkStyle.stroke}
          strokeWidth={linkStyle.strokeWidth}
          strokeOpacity={linkStyle.strokeOpacity}
          fill="none"
          className="link-arrow"
        />
      )}

      {/* 连接线标签 */}
      {showLabel && link.label && labelPosition && (
        <g className="link-label">
          {/* 标签背景 */}
          <rect
            x={labelPosition.x - 20}
            y={labelPosition.y - 8}
            width={40}
            height={16}
            fill="white"
            stroke={linkStyle.stroke}
            strokeWidth={1}
            rx={3}
            opacity={0.9}
          />
          {/* 标签文字 */}
          <text
            x={labelPosition.x}
            y={labelPosition.y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="10"
            fontFamily="Arial, sans-serif"
            fill="#333"
            transform={Math.abs(labelPosition.angle) > 90 
              ? `rotate(${labelPosition.angle + 180} ${labelPosition.x} ${labelPosition.y})`
              : `rotate(${labelPosition.angle} ${labelPosition.x} ${labelPosition.y})`
            }
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {link.label}
          </text>
        </g>
      )}

      {/* 交互区域（更宽的透明路径，便于点击） */}
      <path
        d={linkPath}
        stroke="transparent"
        strokeWidth={Math.max(linkStyle.strokeWidth + 6, 10)}
        fill="none"
        className="link-interaction-area"
        style={{ pointerEvents: 'all' }}
      >
        <title>
          {`${link.type} 连接\n${link.label ? `标签: ${link.label}` : ''}\n${link.weight ? `权重: ${link.weight}` : ''}`}
        </title>
      </path>
    </g>
  )
}

export default GraphLinkComponent
