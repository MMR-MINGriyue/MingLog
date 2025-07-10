/**
 * MingLog 块编辑器主组件
 */

import React, { useCallback, useMemo, useState, useEffect } from 'react'
import { createEditor, Descendant, Editor, Transforms, Range } from 'slate'
import { Slate, Editable, withReact, ReactEditor, RenderElementProps, RenderLeafProps } from 'slate-react'
import { withHistory } from 'slate-history'

import { BlockEditorProps, CustomEditor, CustomElement, BlockType, CustomText } from '../types'
import { BlockElement } from './BlockElement'
import { BlockMenu } from './BlockMenu'
import { getDefaultValue, normalizeValue } from '../utils/editor'

export const BlockEditor: React.FC<BlockEditorProps> = ({
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
  onChange,
  onSelectionChange,
  onFocus,
  onBlur,
  onKeyDown,
  onBlockCreate,
  onBlockUpdate,
  onBlockDelete,
  className = '',
  style
}) => {
  // 创建编辑器实例
  const editor = useMemo(() => {
    return withHistory(withReact(createEditor())) as CustomEditor
  }, [])

  // 编辑器状态
  const [isBlockMenuVisible, setIsBlockMenuVisible] = useState(false)
  const [blockMenuPosition, setBlockMenuPosition] = useState<{ x: number; y: number } | null>(null)

  // 编辑器值
  const [value, setValue] = useState<Descendant[]>(() => {
    return normalizeValue(initialValue || getDefaultValue())
  })

  // 同步外部值变化
  useEffect(() => {
    if (initialValue) {
      setValue(normalizeValue(initialValue))
    }
  }, [initialValue])

  // 处理编辑器值变化
  const handleChange = useCallback((newValue: Descendant[]) => {
    setValue(newValue)
    onChange?.(newValue)
  }, [onChange])

  // 处理选择变化
  const handleSelectionChange = useCallback(() => {
    onSelectionChange?.(editor.selection)
  }, [editor, onSelectionChange])

  // 处理键盘事件
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    onKeyDown?.(event.nativeEvent)

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
  }, [onKeyDown, showBlockMenu])

  // 处理块类型选择
  const handleBlockTypeSelect = useCallback((blockType: BlockType) => {
    if (!editor.selection) return

    const matches = Array.from(Editor.nodes(editor, {
      match: n => Editor.isBlock(editor, n),
      at: editor.selection
    }))

    if (matches.length === 0) return
    const [match] = matches

    if (match) {
      const [, path] = match

      // 转换块类型
      Transforms.setNodes(
        editor,
        { type: blockType },
        { at: path }
      )

      // 触发块创建事件
      const newNodes = Array.from(Editor.nodes(editor, { at: path }))
      if (newNodes.length > 0) {
        onBlockCreate?.(newNodes[0][0] as CustomElement)
      }
    }

    setIsBlockMenuVisible(false)
    ReactEditor.focus(editor)
  }, [editor, onBlockCreate])

  // 渲染元素
  const renderElement = useCallback((props: RenderElementProps) => {
    return <BlockElement {...props} onBlockUpdate={onBlockUpdate} onBlockDelete={onBlockDelete} />
  }, [onBlockUpdate, onBlockDelete])

  // 渲染叶子节点
  const renderLeaf = useCallback((props: RenderLeafProps) => {
    const { attributes, children, leaf } = props
    const text = leaf as CustomText

    let element = <span {...attributes}>{children}</span>

    if (text.bold) {
      element = <strong>{element}</strong>
    }

    if (text.italic) {
      element = <em>{element}</em>
    }

    if (text.underline) {
      element = <u>{element}</u>
    }

    if (text.code) {
      element = <code className="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">{element}</code>
    }

    return element
  }, [])

  return (
    <div
      className={`minglog-editor ${className}`}
      style={style}
    >
      <Slate
        editor={editor}
        initialValue={value}
        onChange={handleChange}
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
          className="minglog-editor-content focus:outline-none"
        />

        {/* 块菜单 */}
        {isBlockMenuVisible && blockMenuPosition && (
          <BlockMenu
            position={blockMenuPosition}
            onSelect={handleBlockTypeSelect}
            onClose={() => setIsBlockMenuVisible(false)}
            allowedBlocks={allowedBlocks}
          />
        )}
      </Slate>
    </div>
  )
}

export default BlockEditor
