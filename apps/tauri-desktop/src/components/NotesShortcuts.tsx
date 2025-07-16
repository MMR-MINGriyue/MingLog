/**
 * 笔记快捷键管理组件
 * 提供笔记相关的键盘快捷键支持
 */

import { useEffect, useCallback } from 'react'

interface NotesShortcutsProps {
  onNewNote?: () => void
  onSaveNote?: () => void
  onDeleteNote?: () => void
  onToggleFavorite?: () => void
  onToggleArchive?: () => void
  onFocusSearch?: () => void
  onNextNote?: () => void
  onPrevNote?: () => void
  onTogglePreview?: () => void
  enabled?: boolean
}

// 快捷键配置
const SHORTCUTS = {
  NEW_NOTE: 'ctrl+n',
  SAVE_NOTE: 'ctrl+s',
  DELETE_NOTE: 'ctrl+d',
  TOGGLE_FAVORITE: 'ctrl+f',
  TOGGLE_ARCHIVE: 'ctrl+e',
  FOCUS_SEARCH: 'ctrl+/',
  NEXT_NOTE: 'ctrl+j',
  PREV_NOTE: 'ctrl+k',
  TOGGLE_PREVIEW: 'ctrl+p'
} as const

const NotesShortcuts: React.FC<NotesShortcutsProps> = ({
  onNewNote,
  onSaveNote,
  onDeleteNote,
  onToggleFavorite,
  onToggleArchive,
  onFocusSearch,
  onNextNote,
  onPrevNote,
  onTogglePreview,
  enabled = true
}) => {
  // 检查快捷键是否匹配
  const isShortcutMatch = useCallback((event: KeyboardEvent, shortcut: string): boolean => {
    const keys = shortcut.toLowerCase().split('+')
    const hasCtrl = keys.includes('ctrl')
    const hasShift = keys.includes('shift')
    const hasAlt = keys.includes('alt')
    const mainKey = keys[keys.length - 1]

    return (
      (hasCtrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey) &&
      (hasShift ? event.shiftKey : !event.shiftKey) &&
      (hasAlt ? event.altKey : !event.altKey) &&
      event.key.toLowerCase() === mainKey
    )
  }, [])

  // 处理键盘事件
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return

    // 如果焦点在输入框或文本区域，只处理特定快捷键
    const activeElement = document.activeElement
    const isInputFocused = activeElement && (
      activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.getAttribute('contenteditable') === 'true'
    )

    // 在输入框中只允许保存和搜索快捷键
    if (isInputFocused) {
      if (isShortcutMatch(event, SHORTCUTS.SAVE_NOTE)) {
        event.preventDefault()
        onSaveNote?.()
        return
      }
      if (isShortcutMatch(event, SHORTCUTS.FOCUS_SEARCH)) {
        event.preventDefault()
        onFocusSearch?.()
        return
      }
      return
    }

    // 处理所有快捷键
    if (isShortcutMatch(event, SHORTCUTS.NEW_NOTE)) {
      event.preventDefault()
      onNewNote?.()
    } else if (isShortcutMatch(event, SHORTCUTS.SAVE_NOTE)) {
      event.preventDefault()
      onSaveNote?.()
    } else if (isShortcutMatch(event, SHORTCUTS.DELETE_NOTE)) {
      event.preventDefault()
      onDeleteNote?.()
    } else if (isShortcutMatch(event, SHORTCUTS.TOGGLE_FAVORITE)) {
      event.preventDefault()
      onToggleFavorite?.()
    } else if (isShortcutMatch(event, SHORTCUTS.TOGGLE_ARCHIVE)) {
      event.preventDefault()
      onToggleArchive?.()
    } else if (isShortcutMatch(event, SHORTCUTS.FOCUS_SEARCH)) {
      event.preventDefault()
      onFocusSearch?.()
    } else if (isShortcutMatch(event, SHORTCUTS.NEXT_NOTE)) {
      event.preventDefault()
      onNextNote?.()
    } else if (isShortcutMatch(event, SHORTCUTS.PREV_NOTE)) {
      event.preventDefault()
      onPrevNote?.()
    } else if (isShortcutMatch(event, SHORTCUTS.TOGGLE_PREVIEW)) {
      event.preventDefault()
      onTogglePreview?.()
    }
  }, [
    enabled,
    isShortcutMatch,
    onNewNote,
    onSaveNote,
    onDeleteNote,
    onToggleFavorite,
    onToggleArchive,
    onFocusSearch,
    onNextNote,
    onPrevNote,
    onTogglePreview
  ])

  // 注册键盘事件监听器
  useEffect(() => {
    if (enabled) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled, handleKeyDown])

  // 这个组件不渲染任何内容
  return null
}

// 快捷键帮助组件
export const ShortcutsHelp: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null

  const shortcutsList = [
    { key: 'Ctrl+N', description: '新建笔记' },
    { key: 'Ctrl+S', description: '保存笔记' },
    { key: 'Ctrl+D', description: '删除笔记' },
    { key: 'Ctrl+F', description: '切换收藏' },
    { key: 'Ctrl+E', description: '切换归档' },
    { key: 'Ctrl+/', description: '聚焦搜索' },
    { key: 'Ctrl+J', description: '下一个笔记' },
    { key: 'Ctrl+K', description: '上一个笔记' },
    { key: 'Ctrl+P', description: '切换预览' },
    { key: 'Esc', description: '关闭对话框' }
  ]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">键盘快捷键</h3>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-3">
            {shortcutsList.map((shortcut, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-gray-700">{shortcut.description}</span>
                <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded">
                  {shortcut.key}
                </kbd>
              </div>
            ))}
          </div>
          
          <div className="mt-6 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              在编辑器中，大部分快捷键会被编辑器本身处理。只有保存和搜索快捷键在编辑时可用。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotesShortcuts
