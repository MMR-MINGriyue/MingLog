import React, { useState, useCallback } from 'react'
import { NodeViewWrapper, NodeViewProps } from '@tiptap/react'

interface LinkComponentProps extends NodeViewProps {
  node: {
    attrs: {
      linkText: string
      linkType: 'page' | 'block'
      exists: boolean
    }
  }
}

/**
 * 双向链接组件
 * 渲染可点击的链接，支持页面链接和块引用
 */
export const LinkComponent: React.FC<LinkComponentProps> = ({ 
  node, 
  updateAttributes, 
  deleteNode,
  editor 
}) => {
  const { linkText, linkType, exists } = node.attrs
  const [isHovered, setIsHovered] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(linkText)

  // 处理链接点击
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // 获取编辑器扩展选项
    const extension = editor.extensionManager.extensions.find(ext => ext.name === 'bidirectionalLink')
    const options = extension?.options
    
    if (options?.onLinkClick) {
      options.onLinkClick(linkText, linkType)
    } else {
      // 默认行为：导航到链接页面
      if (linkType === 'page') {
        window.location.hash = `#/notes/${encodeURIComponent(linkText)}`
      } else {
        window.location.hash = `#/blocks/${encodeURIComponent(linkText)}`
      }
    }
  }, [linkText, linkType, editor])

  // 处理双击编辑
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsEditing(true)
    setEditValue(linkText)
  }, [linkText])

  // 处理编辑完成
  const handleEditComplete = useCallback(() => {
    if (editValue.trim() && editValue !== linkText) {
      updateAttributes({
        linkText: editValue.trim(),
        exists: true // 重新验证
      })
    }
    setIsEditing(false)
  }, [editValue, linkText, updateAttributes])

  // 处理键盘事件
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleEditComplete()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setIsEditing(false)
      setEditValue(linkText)
    }
  }, [handleEditComplete, linkText])

  // 处理删除
  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    deleteNode()
  }, [deleteNode])

  // 获取链接样式类
  const getLinkClasses = () => {
    const baseClasses = [
      'inline-flex',
      'items-center',
      'px-1',
      'py-0.5',
      'rounded',
      'text-sm',
      'font-medium',
      'cursor-pointer',
      'transition-all',
      'duration-200',
      'hover:shadow-sm',
      'relative',
      'group'
    ]

    if (linkType === 'page') {
      if (exists) {
        baseClasses.push(
          'text-blue-700',
          'bg-blue-50',
          'border',
          'border-blue-200',
          'hover:bg-blue-100',
          'hover:border-blue-300'
        )
      } else {
        baseClasses.push(
          'text-red-700',
          'bg-red-50',
          'border',
          'border-red-200',
          'hover:bg-red-100',
          'hover:border-red-300',
          'border-dashed'
        )
      }
    } else {
      // 块引用样式
      if (exists) {
        baseClasses.push(
          'text-purple-700',
          'bg-purple-50',
          'border',
          'border-purple-200',
          'hover:bg-purple-100',
          'hover:border-purple-300'
        )
      } else {
        baseClasses.push(
          'text-red-700',
          'bg-red-50',
          'border',
          'border-red-200',
          'hover:bg-red-100',
          'hover:border-red-300',
          'border-dashed'
        )
      }
    }

    return baseClasses.join(' ')
  }

  // 获取链接前缀
  const getLinkPrefix = () => {
    if (linkType === 'page') {
      return '[[' 
    } else {
      return '(('
    }
  }

  // 获取链接后缀
  const getLinkSuffix = () => {
    if (linkType === 'page') {
      return ']]'
    } else {
      return '))'
    }
  }

  if (isEditing) {
    return (
      <NodeViewWrapper className="inline">
        <span className="inline-flex items-center">
          <span className="text-gray-400 text-sm">{getLinkPrefix()}</span>
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleEditComplete}
            onKeyDown={handleKeyDown}
            className="inline-block min-w-0 px-1 py-0.5 text-sm border-none outline-none bg-transparent"
            style={{ width: `${Math.max(editValue.length, 5)}ch` }}
            autoFocus
          />
          <span className="text-gray-400 text-sm">{getLinkSuffix()}</span>
        </span>
      </NodeViewWrapper>
    )
  }

  return (
    <NodeViewWrapper className="inline">
      <span
        className={getLinkClasses()}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title={exists ? `${linkType === 'page' ? '页面' : '块引用'}: ${linkText}` : `${linkType === 'page' ? '页面不存在' : '块不存在'}: ${linkText}`}
      >
        {/* 链接图标 */}
        <span className="mr-1 text-xs opacity-60">
          {linkType === 'page' ? '📄' : '🔗'}
        </span>
        
        {/* 链接文本 */}
        <span className="truncate max-w-xs">
          {linkText}
        </span>

        {/* 不存在的链接显示警告图标 */}
        {!exists && (
          <span className="ml-1 text-xs text-red-500" title="链接目标不存在">
            ⚠️
          </span>
        )}

        {/* 悬停时显示操作按钮 */}
        {isHovered && (
          <div className="absolute -top-8 left-0 flex items-center space-x-1 bg-white border border-gray-200 rounded shadow-lg px-2 py-1 z-10">
            <button
              onClick={handleClick}
              className="text-xs text-blue-600 hover:text-blue-800"
              title="打开链接"
            >
              打开
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={handleDoubleClick}
              className="text-xs text-gray-600 hover:text-gray-800"
              title="编辑链接"
            >
              编辑
            </button>
            <span className="text-gray-300">|</span>
            <button
              onClick={handleDelete}
              className="text-xs text-red-600 hover:text-red-800"
              title="删除链接"
            >
              删除
            </button>
          </div>
        )}
      </span>
    </NodeViewWrapper>
  )
}
