/**
 * 块树组件 - 显示文档结构
 */

import React, { useState, useCallback } from 'react'
import { 
  ChevronRight, 
  ChevronDown, 
  Type, 
  Hash, 
  List, 
  Quote, 
  Code, 
  Minus, 
  Image as ImageIcon, 
  Table, 
  AlertCircle, 
  FileText
} from 'lucide-react'

import { BlockTreeProps, BlockTreeNode, BlockType } from '../types'

export const BlockTree: React.FC<BlockTreeProps> = ({
  blocks,
  onBlockSelect,
  onBlockToggle,
  onBlockMove,
  className = ''
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())

  // 获取块类型图标
  const getBlockIcon = (type: BlockType) => {
    const iconProps = { className: "w-4 h-4" }
    
    switch (type) {
      case 'paragraph':
        return <Type {...iconProps} />
      case 'heading-1':
      case 'heading-2':
      case 'heading-3':
        return <Hash {...iconProps} />
      case 'bulleted-list':
      case 'numbered-list':
        return <List {...iconProps} />
      case 'quote':
        return <Quote {...iconProps} />
      case 'code':
        return <Code {...iconProps} />
      case 'divider':
        return <Minus {...iconProps} />
      case 'image':
        return <ImageIcon {...iconProps} />
      case 'table':
        return <Table {...iconProps} />
      case 'callout':
        return <AlertCircle {...iconProps} />
      case 'toggle':
        return <FileText {...iconProps} />
      default:
        return <Type {...iconProps} />
    }
  }

  // 获取块类型颜色
  const getBlockColor = (type: BlockType) => {
    switch (type) {
      case 'heading-1':
        return 'text-blue-600'
      case 'heading-2':
        return 'text-blue-500'
      case 'heading-3':
        return 'text-blue-400'
      case 'quote':
        return 'text-gray-600'
      case 'code':
        return 'text-green-600'
      case 'callout':
        return 'text-yellow-600'
      default:
        return 'text-gray-500'
    }
  }

  // 处理节点展开/折叠
  const handleToggleExpand = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId)
      } else {
        newSet.add(nodeId)
      }
      return newSet
    })
    
    onBlockToggle?.(nodeId)
  }, [onBlockToggle])

  // 处理节点选择
  const handleNodeSelect = useCallback((nodeId: string) => {
    onBlockSelect?.(nodeId)
  }, [onBlockSelect])

  // 渲染树节点
  const renderTreeNode = (node: BlockTreeNode, depth: number = 0) => {
    const isExpanded = expandedNodes.has(node.id)
    const hasChildren = node.children && node.children.length > 0
    const indentLevel = depth * 16

    return (
      <div key={node.id} className="select-none">
        {/* 节点内容 */}
        <div
          className={`flex items-center py-1 px-2 hover:bg-gray-50 rounded cursor-pointer group ${
            node.isSelected ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
          }`}
          style={{ paddingLeft: `${8 + indentLevel}px` }}
          onClick={() => handleNodeSelect(node.id)}
        >
          {/* 展开/折叠按钮 */}
          <div className="w-4 h-4 flex items-center justify-center mr-1">
            {hasChildren ? (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleToggleExpand(node.id)
                }}
                className="hover:bg-gray-200 rounded p-0.5 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </button>
            ) : null}
          </div>

          {/* 块类型图标 */}
          <div className={`mr-2 ${getBlockColor(node.type)}`}>
            {getBlockIcon(node.type)}
          </div>

          {/* 节点标题 */}
          <span className="flex-1 text-sm truncate">
            {node.title || '无标题'}
          </span>

          {/* 层级指示器 */}
          {node.level > 0 && (
            <span className="text-xs text-gray-400 ml-2">
              H{node.level}
            </span>
          )}
        </div>

        {/* 子节点 */}
        {hasChildren && isExpanded && (
          <div className="ml-2">
            {node.children.map(child => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  // 渲染空状态
  if (!blocks || blocks.length === 0) {
    return (
      <div className={`minglog-block-tree ${className}`}>
        <div className="flex flex-col items-center justify-center py-8 text-gray-500">
          <FileText className="w-8 h-8 mb-2" />
          <p className="text-sm">暂无内容</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`minglog-block-tree ${className}`}>
      {/* 标题 */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <h3 className="text-sm font-medium text-gray-700">文档大纲</h3>
        <span className="text-xs text-gray-500">
          {blocks.length} 个块
        </span>
      </div>

      {/* 树结构 */}
      <div className="p-2 max-h-96 overflow-y-auto">
        {blocks.map(node => renderTreeNode(node))}
      </div>

      {/* 操作提示 */}
      <div className="p-3 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-500">
          点击跳转到对应块，点击箭头展开/折叠
        </p>
      </div>
    </div>
  )
}

export default BlockTree
