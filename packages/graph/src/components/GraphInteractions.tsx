/**
 * 图谱交互增强组件
 */

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { GraphNode, GraphLink } from '../types'

interface ContextMenuItem {
  id: string
  label: string
  icon?: string
  action?: () => void
  disabled?: boolean
  separator?: boolean
}

interface GraphInteractionsProps {
  nodes: GraphNode[]
  links: GraphLink[]
  selectedNodes: Set<string>
  onNodeSelect: (nodeIds: string[], addToSelection?: boolean) => void
  onNodeAction: (action: string, nodeIds: string[]) => void
  onLinkAction: (action: string, linkIds: string[]) => void
  children: React.ReactNode
}

export const GraphInteractions: React.FC<GraphInteractionsProps> = ({
  nodes,
  links,
  selectedNodes,
  onNodeSelect,
  onNodeAction,
  onLinkAction,
  children
}) => {
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    items: ContextMenuItem[]
    target: { type: 'node' | 'link' | 'background'; id?: string }
  } | null>(null)
  
  const [selectionBox, setSelectionBox] = useState<{
    startX: number
    startY: number
    endX: number
    endY: number
    active: boolean
  } | null>(null)
  
  const containerRef = useRef<HTMLDivElement>(null)

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
    
    let items: ContextMenuItem[] = []
    
    switch (target.type) {
      case 'node':
        items = getNodeContextMenuItems(target.id!)
        break
      case 'link':
        items = getLinkContextMenuItems(target.id!)
        break
      case 'background':
        items = getBackgroundContextMenuItems()
        break
    }
    
    setContextMenu({ x, y, items, target })
  }, [])

  // 获取节点右键菜单项
  const getNodeContextMenuItems = (nodeId: string): ContextMenuItem[] => {
    const isSelected = selectedNodes.has(nodeId)
    const selectedCount = selectedNodes.size
    
    return [
      {
        id: 'select',
        label: isSelected ? '取消选择' : '选择节点',
        action: () => {
          if (isSelected) {
            const newSelection = new Set(selectedNodes)
            newSelection.delete(nodeId)
            onNodeSelect(Array.from(newSelection))
          } else {
            onNodeSelect([nodeId], true)
          }
        }
      },
      {
        id: 'select-connected',
        label: '选择相连节点',
        action: () => {
          const connectedNodes = getConnectedNodes(nodeId)
          onNodeSelect([nodeId, ...connectedNodes])
        }
      },
      { id: 'separator1', label: '', separator: true },
      {
        id: 'focus',
        label: '聚焦到此节点',
        action: () => onNodeAction('focus', [nodeId])
      },
      {
        id: 'expand',
        label: '展开连接',
        action: () => onNodeAction('expand', [nodeId])
      },
      {
        id: 'hide',
        label: selectedCount > 1 ? `隐藏选中节点 (${selectedCount})` : '隐藏节点',
        action: () => {
          const nodesToHide = selectedCount > 1 ? Array.from(selectedNodes) : [nodeId]
          onNodeAction('hide', nodesToHide)
        }
      },
      { id: 'separator2', label: '', separator: true },
      {
        id: 'copy',
        label: '复制',
        action: () => onNodeAction('copy', [nodeId])
      },
      {
        id: 'delete',
        label: selectedCount > 1 ? `删除选中节点 (${selectedCount})` : '删除节点',
        action: () => {
          const nodesToDelete = selectedCount > 1 ? Array.from(selectedNodes) : [nodeId]
          onNodeAction('delete', nodesToDelete)
        }
      }
    ]
  }

  // 获取链接右键菜单项
  const getLinkContextMenuItems = (linkId: string): ContextMenuItem[] => {
    return [
      {
        id: 'select-endpoints',
        label: '选择端点',
        action: () => {
          const link = links.find(l => l.id === linkId)
          if (link) {
            const sourceId = typeof link.source === 'string' ? link.source : link.source.id
            const targetId = typeof link.target === 'string' ? link.target : link.target.id
            onNodeSelect([sourceId, targetId])
          }
        }
      },
      {
        id: 'highlight-path',
        label: '高亮路径',
        action: () => onLinkAction('highlight', [linkId])
      },
      { id: 'separator1', label: '', separator: true },
      {
        id: 'edit',
        label: '编辑链接',
        action: () => onLinkAction('edit', [linkId])
      },
      {
        id: 'delete',
        label: '删除链接',
        action: () => onLinkAction('delete', [linkId])
      }
    ]
  }

  // 获取背景右键菜单项
  const getBackgroundContextMenuItems = (): ContextMenuItem[] => {
    return [
      {
        id: 'select-all',
        label: '全选',
        action: () => onNodeSelect(nodes.map(n => n.id))
      },
      {
        id: 'clear-selection',
        label: '清除选择',
        action: () => onNodeSelect([]),
        disabled: selectedNodes.size === 0
      },
      { id: 'separator1', label: '', separator: true },
      {
        id: 'zoom-fit',
        label: '适应窗口',
        action: () => onNodeAction('zoom-fit', [])
      },
      {
        id: 'zoom-reset',
        label: '重置缩放',
        action: () => onNodeAction('zoom-reset', [])
      },
      { id: 'separator2', label: '', separator: true },
      {
        id: 'export',
        label: '导出图片',
        action: () => onNodeAction('export', [])
      }
    ]
  }

  // 获取相连节点
  const getConnectedNodes = (nodeId: string): string[] => {
    const connected = new Set<string>()
    
    links.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id
      const targetId = typeof link.target === 'string' ? link.target : link.target.id
      
      if (sourceId === nodeId) {
        connected.add(targetId)
      } else if (targetId === nodeId) {
        connected.add(sourceId)
      }
    })
    
    return Array.from(connected)
  }

  // 处理框选开始
  const handleSelectionStart = useCallback((event: React.MouseEvent) => {
    if (event.button !== 0) return // 只处理左键
    if (event.ctrlKey || event.metaKey) return // 按住Ctrl时不启动框选
    
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const startX = event.clientX - rect.left
    const startY = event.clientY - rect.top
    
    setSelectionBox({
      startX,
      startY,
      endX: startX,
      endY: startY,
      active: true
    })
  }, [])

  // 处理框选移动
  const handleSelectionMove = useCallback((event: MouseEvent) => {
    if (!selectionBox?.active) return
    
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    
    const endX = event.clientX - rect.left
    const endY = event.clientY - rect.top
    
    setSelectionBox(prev => prev ? { ...prev, endX, endY } : null)
  }, [selectionBox?.active])

  // 处理框选结束
  const handleSelectionEnd = useCallback(() => {
    if (!selectionBox?.active) return
    
    // 计算选择框范围内的节点
    const { startX, startY, endX, endY } = selectionBox
    const minX = Math.min(startX, endX)
    const maxX = Math.max(startX, endX)
    const minY = Math.min(startY, endY)
    const maxY = Math.max(startY, endY)
    
    const selectedNodeIds = nodes
      .filter(node => {
        const nodeX = node.x || 0
        const nodeY = node.y || 0
        return nodeX >= minX && nodeX <= maxX && nodeY >= minY && nodeY <= maxY
      })
      .map(node => node.id)
    
    if (selectedNodeIds.length > 0) {
      onNodeSelect(selectedNodeIds)
    }
    
    setSelectionBox(null)
  }, [selectionBox, nodes, onNodeSelect])

  // 绑定鼠标事件
  useEffect(() => {
    if (selectionBox?.active) {
      document.addEventListener('mousemove', handleSelectionMove)
      document.addEventListener('mouseup', handleSelectionEnd)
      
      return () => {
        document.removeEventListener('mousemove', handleSelectionMove)
        document.removeEventListener('mouseup', handleSelectionEnd)
      }
    }
  }, [selectionBox?.active, handleSelectionMove, handleSelectionEnd])

  // 关闭右键菜单
  const closeContextMenu = useCallback(() => {
    setContextMenu(null)
  }, [])

  // 点击外部关闭菜单
  useEffect(() => {
    if (contextMenu) {
      const handleClickOutside = () => closeContextMenu()
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [contextMenu, closeContextMenu])

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full"
      onMouseDown={handleSelectionStart}
      onContextMenu={(e) => handleContextMenu(e, { type: 'background' })}
    >
      {children}
      
      {/* 框选框 */}
      {selectionBox?.active && (
        <div
          className="absolute border-2 border-blue-500 bg-blue-100 bg-opacity-20 pointer-events-none"
          style={{
            left: Math.min(selectionBox.startX, selectionBox.endX),
            top: Math.min(selectionBox.startY, selectionBox.endY),
            width: Math.abs(selectionBox.endX - selectionBox.startX),
            height: Math.abs(selectionBox.endY - selectionBox.startY)
          }}
        />
      )}
      
      {/* 右键菜单 */}
      {contextMenu && (
        <div
          className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-48"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          {contextMenu.items.map((item, index) => (
            item.separator ? (
              <div key={index} className="border-t border-gray-200 my-1" />
            ) : (
              <button
                key={item.id}
                className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                  item.disabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700'
                }`}
                onClick={() => {
                  if (!item.disabled && item.action) {
                    item.action()
                    closeContextMenu()
                  }
                }}
                disabled={item.disabled}
              >
                {item.label}
              </button>
            )
          ))}
        </div>
      )}
    </div>
  )
}

export default GraphInteractions
