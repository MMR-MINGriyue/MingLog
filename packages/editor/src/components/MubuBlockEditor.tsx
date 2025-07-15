/**
 * 幕布风格块编辑器
 * 集成幕布快捷键和交互功能的增强版BlockEditor
 */

import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react'
import { createEditor, Descendant, Editor, Transforms, Range, Path } from 'slate'
import { Slate, Editable, withReact, ReactEditor, RenderElementProps, RenderLeafProps } from 'slate-react'
import { withHistory } from 'slate-history'

import { BlockEditorProps, CustomEditor, CustomElement, MubuEditorConfig } from '../types'
import { MubuBlockElement, MubuBlockStyles } from './MubuBlockElement'
import { MubuShortcutHandler, DEFAULT_MUBU_CONFIG } from '../utils/MubuShortcutHandler'
import { getDefaultValue, normalizeValue } from '../utils/editor'

/**
 * 幕布块编辑器属性
 */
export interface MubuBlockEditorProps extends Omit<BlockEditorProps, 'enableMubuMode'> {
  mubuConfig?: Partial<MubuEditorConfig>
  onBlockIndent?: (blockId: string, level: number) => void
  onBlockOutdent?: (blockId: string, level: number) => void
  onBlockMove?: (blockId: string, direction: 'up' | 'down') => void
  onBlockToggle?: (blockId: string, collapsed: boolean) => void
  onBlockDuplicate?: (blockId: string) => void
  onBlockFocus?: (blockId: string) => void
  onBlockNavigate?: (direction: 'up' | 'down' | 'left' | 'right') => void
}

/**
 * 幕布块编辑器组件
 */
export const MubuBlockEditor: React.FC<MubuBlockEditorProps> = ({
  value: initialValue,
  placeholder = '开始写作...',
  readOnly = false,
  autoFocus = false,
  spellCheck = true,
  maxLength,
  allowedBlocks,
  showBlockMenu = true,
  showFormatToolbar = true,
  enableDragDrop = true,
  enableKeyboardShortcuts = true,
  mubuConfig = {},
  onChange,
  onSelectionChange,
  onFocus,
  onBlur,
  onKeyDown,
  onBlockCreate,
  onBlockUpdate,
  onBlockDelete,
  onBlockIndent,
  onBlockOutdent,
  onBlockMove,
  onBlockToggle,
  onBlockDuplicate,
  onBlockFocus,
  onBlockNavigate,
  className = '',
  style
}) => {
  // 合并配置
  const config = useMemo(() => ({
    ...DEFAULT_MUBU_CONFIG,
    ...mubuConfig
  }), [mubuConfig])

  // 创建编辑器实例
  const editor = useMemo(() => {
    return withHistory(withReact(createEditor())) as CustomEditor
  }, [])

  // 快捷键处理器
  const shortcutHandler = useMemo(() => {
    return new MubuShortcutHandler(editor, config)
  }, [editor, config])

  // 编辑器状态
  const [value, setValue] = useState<Descendant[]>(() => {
    return initialValue ? normalizeValue(initialValue) : getDefaultValue()
  })

  const [isBlockMenuVisible, setIsBlockMenuVisible] = useState(false)
  const [blockMenuPosition, setBlockMenuPosition] = useState<{ x: number; y: number } | null>(null)

  // 处理内容变更
  const handleChange = useCallback((newValue: Descendant[]) => {
    setValue(newValue)
    onChange?.(newValue)
  }, [onChange])

  // 处理选择变更
  const handleSelectionChange = useCallback(() => {
    onSelectionChange?.(editor.selection)
  }, [editor.selection, onSelectionChange])

  // 处理键盘事件
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    onKeyDown?.(event.nativeEvent)

    // 优先处理幕布快捷键
    if (enableKeyboardShortcuts) {
      const handled = shortcutHandler.handleKeyDown(event.nativeEvent)
      if (handled) {
        return
      }
    }

    // 处理斜杠命令
    if (event.key === '/' && showBlockMenu) {
      event.preventDefault()
      setIsBlockMenuVisible(true)
      // 简单的位置计算
      setBlockMenuPosition({ x: 100, y: 100 })
    }

    if (event.key === 'Escape') {
      setIsBlockMenuVisible(false)
    }
  }, [onKeyDown, enableKeyboardShortcuts, shortcutHandler, showBlockMenu])

  // 渲染元素
  const renderElement = useCallback((props: RenderElementProps) => {
    return (
      <MubuBlockElement
        {...props}
        config={config}
        onToggleCollapse={onBlockToggle}
        onBlockFocus={onBlockFocus}
      />
    )
  }, [config, onBlockToggle, onBlockFocus])

  // 渲染叶子节点
  const renderLeaf = useCallback((props: RenderLeafProps) => {
    const { attributes, children, leaf } = props
    let element = children

    if (leaf.bold) {
      element = <strong>{element}</strong>
    }

    if (leaf.italic) {
      element = <em>{element}</em>
    }

    if (leaf.underline) {
      element = <u>{element}</u>
    }

    if (leaf.strikethrough) {
      element = <s>{element}</s>
    }

    if (leaf.code) {
      element = <code className="mubu-inline-code">{element}</code>
    }

    return <span {...attributes}>{element}</span>
  }, [])

  // 监听全局幕布事件
  useEffect(() => {
    const handleMubuIndent = () => {
      if (!editor.selection) return
      
      const currentBlock = getCurrentBlock(editor)
      if (currentBlock) {
        const currentLevel = currentBlock.level || 0
        if (currentLevel < config.maxIndentLevel) {
          Transforms.setNodes(editor, { level: currentLevel + 1 })
          onBlockIndent?.(currentBlock.id, currentLevel + 1)
        }
      }
    }

    const handleMubuOutdent = () => {
      if (!editor.selection) return
      
      const currentBlock = getCurrentBlock(editor)
      if (currentBlock) {
        const currentLevel = currentBlock.level || 0
        if (currentLevel > 0) {
          Transforms.setNodes(editor, { level: currentLevel - 1 })
          onBlockOutdent?.(currentBlock.id, currentLevel - 1)
        }
      }
    }

    const handleMubuDuplicateBlock = () => {
      if (!editor.selection) return
      
      const currentBlock = getCurrentBlock(editor)
      if (currentBlock) {
        const duplicatedBlock: CustomElement = {
          ...currentBlock,
          id: generateId(),
          children: [...currentBlock.children]
        }
        
        Transforms.insertNodes(editor, duplicatedBlock)
        onBlockDuplicate?.(currentBlock.id)
      }
    }

    const handleMubuMoveBlockUp = () => {
      if (!editor.selection) return
      
      const currentPath = editor.selection.anchor.path
      const previousPath = getPreviousBlockPath(currentPath)
      
      if (previousPath) {
        Transforms.moveNodes(editor, {
          at: currentPath,
          to: previousPath
        })
        
        const currentBlock = getCurrentBlock(editor)
        if (currentBlock) {
          onBlockMove?.(currentBlock.id, 'up')
        }
      }
    }

    const handleMubuMoveBlockDown = () => {
      if (!editor.selection) return
      
      const currentPath = editor.selection.anchor.path
      const nextPath = getNextBlockPath(currentPath)
      
      if (nextPath) {
        const targetPath = Path.next(nextPath)
        Transforms.moveNodes(editor, {
          at: currentPath,
          to: targetPath
        })
        
        const currentBlock = getCurrentBlock(editor)
        if (currentBlock) {
          onBlockMove?.(currentBlock.id, 'down')
        }
      }
    }

    const handleMubuToggleCollapse = () => {
      if (!editor.selection) return
      
      const currentBlock = getCurrentBlock(editor)
      if (currentBlock) {
        const isCollapsed = currentBlock.isCollapsed || false
        Transforms.setNodes(editor, { isCollapsed: !isCollapsed })
        onBlockToggle?.(currentBlock.id, !isCollapsed)
      }
    }

    // 绑定事件监听器
    document.addEventListener('mubu-indent', handleMubuIndent)
    document.addEventListener('mubu-outdent', handleMubuOutdent)
    document.addEventListener('mubu-duplicate-block', handleMubuDuplicateBlock)
    document.addEventListener('mubu-move-block-up', handleMubuMoveBlockUp)
    document.addEventListener('mubu-move-block-down', handleMubuMoveBlockDown)
    document.addEventListener('mubu-toggle-collapse', handleMubuToggleCollapse)

    return () => {
      document.removeEventListener('mubu-indent', handleMubuIndent)
      document.removeEventListener('mubu-outdent', handleMubuOutdent)
      document.removeEventListener('mubu-duplicate-block', handleMubuDuplicateBlock)
      document.removeEventListener('mubu-move-block-up', handleMubuMoveBlockUp)
      document.removeEventListener('mubu-move-block-down', handleMubuMoveBlockDown)
      document.removeEventListener('mubu-toggle-collapse', handleMubuToggleCollapse)
    }
  }, [editor, config, onBlockIndent, onBlockOutdent, onBlockDuplicate, onBlockMove, onBlockToggle])

  return (
    <>
      {/* 注入幕布样式 */}
      <style dangerouslySetInnerHTML={{ __html: MubuBlockStyles }} />
      
      <div
        className={`mubu-block-editor ${className}`}
        style={style}
        data-slate-editor
      >
        <Slate
          editor={editor}
          initialValue={value}
          onChange={handleChange}
          onSelectionChange={handleSelectionChange}
        >
          <Editable
            readOnly={readOnly}
            placeholder={placeholder}
            autoFocus={autoFocus}
            spellCheck={spellCheck}
            renderElement={renderElement}
            renderLeaf={renderLeaf}
            onKeyDown={handleKeyDown}
            onFocus={onFocus}
            onBlur={onBlur}
            className="mubu-editor-content focus:outline-none"
          />
        </Slate>
      </div>
    </>
  )
}

// 辅助函数
function getCurrentBlock(editor: CustomEditor): CustomElement | null {
  if (!editor.selection) return null

  const [match] = Editor.nodes(editor, {
    match: n => Editor.isBlock(editor, n),
    at: editor.selection
  })

  return match ? (match[0] as CustomElement) : null
}

function getPreviousBlockPath(currentPath: Path): Path | null {
  try {
    return Path.previous(currentPath)
  } catch {
    return null
  }
}

function getNextBlockPath(currentPath: Path): Path | null {
  try {
    return Path.next(currentPath)
  } catch {
    return null
  }
}

function generateId(): string {
  return `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export default MubuBlockEditor
