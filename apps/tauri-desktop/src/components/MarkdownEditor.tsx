/**
 * Markdown编辑器组件
 * 支持实时预览、语法高亮、快捷键等功能
 */

import React, { useState, useCallback, useRef, useEffect } from 'react'
import {
  Bold,
  Italic,
  Underline,
  Code,
  Link,
  Image,
  List,
  ListOrdered,
  Quote,
  Heading1,
  Heading2,
  Heading3,
  Eye,
  EyeOff,
  Split,
  Maximize2,
  Minimize2,
  Save,
  Undo,
  Redo
} from 'lucide-react'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  autoSave?: boolean
  onSave?: () => void
  readOnly?: boolean
}

// 编辑器模式
type EditorMode = 'edit' | 'preview' | 'split'

// 工具栏按钮配置
interface ToolbarButton {
  icon: React.ComponentType<any>
  title: string
  action: () => void
  shortcut?: string
  separator?: boolean
}

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = '开始记录您的想法...',
  className = '',
  autoSave = true,
  onSave,
  readOnly = false
}) => {
  const [mode, setMode] = useState<EditorMode>('edit')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [history, setHistory] = useState<string[]>([value])
  const [historyIndex, setHistoryIndex] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)

  // 添加到历史记录
  const addToHistory = useCallback((newValue: string) => {
    if (newValue !== history[historyIndex]) {
      const newHistory = history.slice(0, historyIndex + 1)
      newHistory.push(newValue)
      setHistory(newHistory)
      setHistoryIndex(newHistory.length - 1)
    }
  }, [history, historyIndex])

  // 撤销
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      onChange(history[newIndex])
    }
  }, [historyIndex, history, onChange])

  // 重做
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      onChange(history[newIndex])
    }
  }, [historyIndex, history, onChange])

  // 插入文本
  const insertText = useCallback((text: string, offset: number = 0) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newValue = value.slice(0, start) + text + value.slice(end)
    
    onChange(newValue)
    addToHistory(newValue)

    // 设置光标位置
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + text.length + offset, start + text.length + offset)
    }, 0)
  }, [value, onChange, addToHistory])

  // 包围选中文本
  const wrapText = useCallback((prefix: string, suffix: string = prefix) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.slice(start, end)
    const newText = prefix + selectedText + suffix
    const newValue = value.slice(0, start) + newText + value.slice(end)
    
    onChange(newValue)
    addToHistory(newValue)

    // 设置光标位置
    setTimeout(() => {
      textarea.focus()
      if (selectedText) {
        textarea.setSelectionRange(start + prefix.length, end + prefix.length)
      } else {
        textarea.setSelectionRange(start + prefix.length, start + prefix.length)
      }
    }, 0)
  }, [value, onChange, addToHistory])

  // 工具栏按钮配置
  const toolbarButtons: ToolbarButton[] = [
    {
      icon: Bold,
      title: '粗体',
      action: () => wrapText('**'),
      shortcut: 'Ctrl+B'
    },
    {
      icon: Italic,
      title: '斜体',
      action: () => wrapText('*'),
      shortcut: 'Ctrl+I'
    },
    {
      icon: Underline,
      title: '下划线',
      action: () => wrapText('<u>', '</u>')
    },
    {
      icon: Code,
      title: '行内代码',
      action: () => wrapText('`'),
      shortcut: 'Ctrl+`'
    },
    { icon: Bold, title: '', action: () => {}, separator: true },
    {
      icon: Heading1,
      title: '一级标题',
      action: () => insertText('# ', 0),
      shortcut: 'Ctrl+1'
    },
    {
      icon: Heading2,
      title: '二级标题',
      action: () => insertText('## ', 0),
      shortcut: 'Ctrl+2'
    },
    {
      icon: Heading3,
      title: '三级标题',
      action: () => insertText('### ', 0),
      shortcut: 'Ctrl+3'
    },
    { icon: Bold, title: '', action: () => {}, separator: true },
    {
      icon: List,
      title: '无序列表',
      action: () => insertText('- ', 0),
      shortcut: 'Ctrl+U'
    },
    {
      icon: ListOrdered,
      title: '有序列表',
      action: () => insertText('1. ', 0),
      shortcut: 'Ctrl+O'
    },
    {
      icon: Quote,
      title: '引用',
      action: () => insertText('> ', 0),
      shortcut: 'Ctrl+Q'
    },
    { icon: Bold, title: '', action: () => {}, separator: true },
    {
      icon: Link,
      title: '链接',
      action: () => insertText('[链接文本](URL)', -4),
      shortcut: 'Ctrl+K'
    },
    {
      icon: Image,
      title: '图片',
      action: () => insertText('![图片描述](图片URL)', -5)
    },
    { icon: Bold, title: '', action: () => {}, separator: true },
    {
      icon: Undo,
      title: '撤销',
      action: undo,
      shortcut: 'Ctrl+Z'
    },
    {
      icon: Redo,
      title: '重做',
      action: redo,
      shortcut: 'Ctrl+Y'
    }
  ]

  // 键盘快捷键处理
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault()
          wrapText('**')
          break
        case 'i':
          e.preventDefault()
          wrapText('*')
          break
        case '`':
          e.preventDefault()
          wrapText('`')
          break
        case '1':
          e.preventDefault()
          insertText('# ', 0)
          break
        case '2':
          e.preventDefault()
          insertText('## ', 0)
          break
        case '3':
          e.preventDefault()
          insertText('### ', 0)
          break
        case 'u':
          e.preventDefault()
          insertText('- ', 0)
          break
        case 'o':
          e.preventDefault()
          insertText('1. ', 0)
          break
        case 'q':
          e.preventDefault()
          insertText('> ', 0)
          break
        case 'k':
          e.preventDefault()
          insertText('[链接文本](URL)', -4)
          break
        case 'z':
          e.preventDefault()
          undo()
          break
        case 'y':
          e.preventDefault()
          redo()
          break
        case 's':
          e.preventDefault()
          onSave?.()
          break
      }
    }

    // Tab键处理
    if (e.key === 'Tab') {
      e.preventDefault()
      insertText('  ', 0) // 插入两个空格
    }
  }, [wrapText, insertText, undo, redo, onSave])

  // 简单的Markdown渲染
  const renderMarkdown = useCallback((text: string) => {
    return text
      // 标题
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      // 粗体和斜体
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // 行内代码
      .replace(/`(.*?)`/g, '<code>$1</code>')
      // 链接
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
      // 图片
      .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" style="max-width: 100%; height: auto;" />')
      // 列表
      .replace(/^- (.*$)/gm, '<li>$1</li>')
      .replace(/^1\. (.*$)/gm, '<li>$1</li>')
      // 引用
      .replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>')
      // 换行
      .replace(/\n/g, '<br>')
  }, [])

  // 模式切换按钮
  const ModeButtons = () => (
    <div className="flex items-center space-x-1 border-l border-gray-300 pl-3 ml-3">
      <button
        type="button"
        onClick={() => setMode('edit')}
        className={`p-2 rounded transition-colors ${
          mode === 'edit' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
        }`}
        title="编辑模式"
      >
        <EyeOff className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => setMode('split')}
        className={`p-2 rounded transition-colors ${
          mode === 'split' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
        }`}
        title="分屏模式"
      >
        <Split className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => setMode('preview')}
        className={`p-2 rounded transition-colors ${
          mode === 'preview' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
        }`}
        title="预览模式"
      >
        <Eye className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => setIsFullscreen(!isFullscreen)}
        className="p-2 rounded text-gray-600 hover:bg-gray-100 transition-colors"
        title={isFullscreen ? '退出全屏' : '全屏'}
      >
        {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
      </button>
    </div>
  )

  return (
    <div className={`markdown-editor ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''} ${className}`}>
      {/* 工具栏 */}
      {!readOnly && (
        <div className="border-b border-gray-200 p-3 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              {toolbarButtons.map((button, index) => (
                button.separator ? (
                  <div key={index} className="w-px h-6 bg-gray-300 mx-2" />
                ) : (
                  <button
                    key={index}
                    type="button"
                    onClick={button.action}
                    className="p-2 rounded text-gray-600 hover:bg-gray-200 transition-colors"
                    title={`${button.title}${button.shortcut ? ` (${button.shortcut})` : ''}`}
                  >
                    <button.icon className="w-4 h-4" />
                  </button>
                )
              ))}
              
              {onSave && (
                <>
                  <div className="w-px h-6 bg-gray-300 mx-2" />
                  <button
                    type="button"
                    onClick={onSave}
                    className="p-2 rounded text-gray-600 hover:bg-gray-200 transition-colors"
                    title="保存 (Ctrl+S)"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
            
            <ModeButtons />
          </div>
        </div>
      )}

      {/* 编辑器内容 */}
      <div className={`flex ${mode === 'split' ? 'divide-x divide-gray-200' : ''} ${isFullscreen ? 'h-full' : 'h-96'}`}>
        {/* 编辑区域 */}
        {(mode === 'edit' || mode === 'split') && (
          <div className={`${mode === 'split' ? 'w-1/2' : 'w-full'} flex flex-col`}>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => {
                onChange(e.target.value)
                if (autoSave) {
                  addToHistory(e.target.value)
                }
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              readOnly={readOnly}
              className="flex-1 p-4 resize-none border-none outline-none font-mono text-sm leading-relaxed"
              style={{ fontFamily: 'SF Mono, Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace' }}
            />
          </div>
        )}

        {/* 预览区域 */}
        {(mode === 'preview' || mode === 'split') && (
          <div className={`${mode === 'split' ? 'w-1/2' : 'w-full'} overflow-y-auto`}>
            <div
              ref={previewRef}
              className="p-4 prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default MarkdownEditor
