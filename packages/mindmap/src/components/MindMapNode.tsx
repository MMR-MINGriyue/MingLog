/**
 * 思维导图节点组件
 */

import React, { useState, useRef, useEffect } from 'react'
import { MindMapNode as MindMapNodeType } from '../types'

interface MindMapNodeProps {
  node: MindMapNodeType
  onClick?: (node: MindMapNodeType, event: React.MouseEvent) => void
  onDoubleClick?: (node: MindMapNodeType, event: React.MouseEvent) => void
  onEdit?: (node: MindMapNodeType, newText: string) => void
  onAddChild?: () => void
  onDelete?: () => void
  onDragStart?: (event: React.MouseEvent) => void
  onDrag?: (position: { x: number; y: number }) => void
  onDragEnd?: () => void
  enableEdit?: boolean
  enableDrag?: boolean
  isSelected?: boolean
}

export const MindMapNode: React.FC<MindMapNodeProps> = ({
  node,
  onClick,
  onDoubleClick,
  onEdit,
  onAddChild,
  onDelete,
  onDragStart,
  onDrag,
  onDragEnd,
  enableEdit = false,
  enableDrag = false,
  isSelected = false
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(node.text)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const {
    x = 0,
    y = 0,
    text,
    style = {}
  } = node

  const {
    backgroundColor = '#ffffff',
    borderColor = '#d1d5db',
    borderWidth = 2,
    borderRadius = 6,
    fontSize = 14,
    fontColor = '#374151',
    fontWeight = 'normal',
    padding = 8
  } = style

  // 选择状态的样式
  const selectedStyle = isSelected ? {
    borderColor: '#3b82f6',
    borderWidth: 3,
    backgroundColor: '#eff6ff'
  } : {}

  // 计算节点尺寸
  const textWidth = Math.max(80, text.length * (fontSize * 0.6) + padding * 2)
  const textHeight = fontSize + padding * 2

  // 处理双击编辑
  const handleDoubleClick = (event: React.MouseEvent) => {
    if (enableEdit) {
      setIsEditing(true)
      setEditText(text)
    }
    onDoubleClick?.(node, event)
  }

  // 处理拖拽开始
  const handleMouseDown = (event: React.MouseEvent) => {
    if (!enableDrag) return

    setDragStart({ x: event.clientX, y: event.clientY })
    setIsDragging(true)
    onDragStart?.(event)

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragStart) return

      const deltaX = e.clientX - dragStart.x
      const deltaY = e.clientY - dragStart.y

      onDrag?.({
        x: x + deltaX,
        y: y + deltaY
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
      setDragStart(null)
      onDragEnd?.()

      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // 处理编辑完成
  const handleEditComplete = () => {
    setIsEditing(false)
    if (editText !== text && onEdit) {
      onEdit(node, editText)
    }
  }

  // 处理键盘事件
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleEditComplete()
    } else if (event.key === 'Escape') {
      setIsEditing(false)
      setEditText(text)
    }
  }

  // 自动聚焦输入框
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  return (
    <g
      className="mindmap-node"
      transform={`translate(${x}, ${y})`}
      style={{
        cursor: enableDrag ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
        opacity: isDragging ? 0.7 : 1
      }}
      onMouseDown={handleMouseDown}
    >
      {/* 节点背景 */}
      <rect
        x={-textWidth / 2}
        y={-textHeight / 2}
        width={textWidth}
        height={textHeight}
        fill={selectedStyle.backgroundColor || backgroundColor}
        stroke={selectedStyle.borderColor || borderColor}
        strokeWidth={selectedStyle.borderWidth || borderWidth}
        rx={borderRadius}
        ry={borderRadius}
        onClick={(e) => onClick?.(node, e)}
        onDoubleClick={handleDoubleClick}
        className={`node-background ${isSelected ? 'selected' : ''}`}
        style={{
          filter: isSelected
            ? 'drop-shadow(0 4px 8px rgba(59, 130, 246, 0.3))'
            : 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
          transition: 'all 0.2s ease'
        }}
      />

      {/* 操作按钮（仅在选中时显示） */}
      {isSelected && (
        <g className="node-actions">
          {/* 添加子节点按钮 */}
          <circle
            cx={textWidth / 2 + 15}
            cy={0}
            r={8}
            fill="#10b981"
            stroke="#ffffff"
            strokeWidth={2}
            onClick={(e) => {
              e.stopPropagation()
              onAddChild?.()
            }}
            style={{ cursor: 'pointer' }}
          >
            <title>添加子节点</title>
          </circle>
          <text
            x={textWidth / 2 + 15}
            y={0}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={10}
            fill="white"
            style={{ pointerEvents: 'none' }}
          >
            +
          </text>

          {/* 删除节点按钮（非根节点） */}
          {node.level > 0 && (
            <>
              <circle
                cx={textWidth / 2 + 15}
                cy={20}
                r={8}
                fill="#ef4444"
                stroke="#ffffff"
                strokeWidth={2}
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete?.()
                }}
                style={{ cursor: 'pointer' }}
              >
                <title>删除节点</title>
              </circle>
              <text
                x={textWidth / 2 + 15}
                y={20}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={10}
                fill="white"
                style={{ pointerEvents: 'none' }}
              >
                ×
              </text>
            </>
          )}
        </g>
      )}

      {/* 节点文本 */}
      {isEditing ? (
        <foreignObject
          x={-textWidth / 2 + padding}
          y={-textHeight / 2 + padding}
          width={textWidth - padding * 2}
          height={textHeight - padding * 2}
        >
          <input
            ref={inputRef}
            type="text"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onBlur={handleEditComplete}
            onKeyDown={handleKeyDown}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              fontSize: `${fontSize}px`,
              color: fontColor,
              fontWeight,
              textAlign: 'center',
              fontFamily: 'inherit'
            }}
          />
        </foreignObject>
      ) : (
        <text
          x={0}
          y={0}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={fontSize}
          fill={fontColor}
          fontWeight={fontWeight}
          onClick={(e) => onClick?.(node, e)}
          onDoubleClick={handleDoubleClick}
          className="node-text"
          style={{
            userSelect: 'none',
            pointerEvents: 'none'
          }}
        >
          {text}
        </text>
      )}

      {/* 节点级别指示器 */}
      {node.level > 0 && (
        <circle
          cx={textWidth / 2 - 8}
          cy={-textHeight / 2 + 8}
          r={6}
          fill={borderColor}
          opacity={0.6}
        >
          <title>{`Level ${node.level}`}</title>
        </circle>
      )}
    </g>
  )
}

export default MindMapNode
