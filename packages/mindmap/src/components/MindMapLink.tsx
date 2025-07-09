/**
 * 思维导图链接组件
 */

import React from 'react'
import { MindMapLink as MindMapLinkType, MindMapNode } from '../types'

interface MindMapLinkProps {
  link: MindMapLinkType
  sourceNode: MindMapNode
  targetNode: MindMapNode
  onClick?: (link: MindMapLinkType, event: React.MouseEvent) => void
}

export const MindMapLink: React.FC<MindMapLinkProps> = ({
  link,
  sourceNode,
  targetNode,
  onClick
}) => {
  const {
    strokeWidth = 2,
    strokeColor = '#6b7280',
    strokeDasharray,
    opacity = 0.8
  } = link.style || {}

  // 计算连接点
  const sourceX = sourceNode.x || 0
  const sourceY = sourceNode.y || 0
  const targetX = targetNode.x || 0
  const targetY = targetNode.y || 0

  // 计算节点边界点
  const { sourcePoint, targetPoint } = calculateConnectionPoints(
    sourceX, sourceY, targetX, targetY,
    sourceNode, targetNode
  )

  // 生成路径
  const pathData = generatePath(sourcePoint, targetPoint, link.type)

  return (
    <g className="mindmap-link">
      <path
        d={pathData}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
        opacity={opacity}
        markerEnd="url(#arrowhead)"
        onClick={(e) => onClick?.(link, e)}
        style={{
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        className="link-path"
      />
    </g>
  )
}

/**
 * 计算连接点
 */
function calculateConnectionPoints(
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number,
  sourceNode: MindMapNode,
  targetNode: MindMapNode
) {
  // 简化计算，使用节点中心点
  // 实际应用中可以根据节点尺寸计算边界点
  const sourceNodeWidth = estimateNodeWidth(sourceNode)
  const sourceNodeHeight = estimateNodeHeight(sourceNode)
  const targetNodeWidth = estimateNodeWidth(targetNode)
  const targetNodeHeight = estimateNodeHeight(targetNode)

  // 计算方向向量
  const dx = targetX - sourceX
  const dy = targetY - sourceY
  const distance = Math.sqrt(dx * dx + dy * dy)

  if (distance === 0) {
    return {
      sourcePoint: { x: sourceX, y: sourceY },
      targetPoint: { x: targetX, y: targetY }
    }
  }

  // 单位向量
  const unitX = dx / distance
  const unitY = dy / distance

  // 计算源节点边界点
  const sourceRadius = Math.max(sourceNodeWidth, sourceNodeHeight) / 2
  const sourcePoint = {
    x: sourceX + unitX * sourceRadius,
    y: sourceY + unitY * sourceRadius
  }

  // 计算目标节点边界点
  const targetRadius = Math.max(targetNodeWidth, targetNodeHeight) / 2
  const targetPoint = {
    x: targetX - unitX * targetRadius,
    y: targetY - unitY * targetRadius
  }

  return { sourcePoint, targetPoint }
}

/**
 * 生成路径数据
 */
function generatePath(
  sourcePoint: { x: number; y: number },
  targetPoint: { x: number; y: number },
  linkType: MindMapLinkType['type']
): string {
  const { x: x1, y: y1 } = sourcePoint
  const { x: x2, y: y2 } = targetPoint

  switch (linkType) {
    case 'parent-child':
      // 贝塞尔曲线
      const midX = (x1 + x2) / 2
      const controlPoint1X = midX
      const controlPoint1Y = y1
      const controlPoint2X = midX
      const controlPoint2Y = y2

      return `M ${x1} ${y1} C ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${x2} ${y2}`

    case 'reference':
      // 虚线直线
      return `M ${x1} ${y1} L ${x2} ${y2}`

    default:
      // 直线
      return `M ${x1} ${y1} L ${x2} ${y2}`
  }
}

/**
 * 估算节点宽度
 */
function estimateNodeWidth(node: MindMapNode): number {
  const fontSize = node.style?.fontSize || 14
  const padding = (node.style?.padding || 8) * 2
  return Math.max(80, node.text.length * (fontSize * 0.6) + padding)
}

/**
 * 估算节点高度
 */
function estimateNodeHeight(node: MindMapNode): number {
  const fontSize = node.style?.fontSize || 14
  const padding = (node.style?.padding || 8) * 2
  return fontSize + padding
}

export default MindMapLink
