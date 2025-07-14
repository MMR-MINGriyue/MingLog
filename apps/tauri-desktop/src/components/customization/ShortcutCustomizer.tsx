/**
 * 快捷键自定义组件
 * 提供快捷键的查看、编辑和自定义功能
 */

import React, { useState, useCallback, useEffect, useRef } from 'react'
import { 
  Keyboard, 
  Edit, 
  Save, 
  X, 
  RotateCcw, 
  Search, 
  Filter,
  Plus,
  Trash2,
  AlertTriangle,
  Check
} from 'lucide-react'
import { 
  KeyboardShortcut 
} from '../../packages/core/src/services/UserPreferencesService'

interface ShortcutCustomizerProps {
  /** 当前快捷键配置 */
  shortcuts: KeyboardShortcut[]
  /** 快捷键变更回调 */
  onShortcutChange: (shortcut: KeyboardShortcut) => void
  /** 快捷键删除回调 */
  onShortcutDelete: (shortcutId: string) => void
  /** 快捷键添加回调 */
  onShortcutAdd: (shortcut: Omit<KeyboardShortcut, 'id'>) => void
  /** 重置快捷键回调 */
  onResetShortcuts: () => void
  /** 类名 */
  className?: string
}

interface ShortcutConflict {
  shortcutId: string
  conflictWith: string[]
  keys: string[]
}

export const ShortcutCustomizer: React.FC<ShortcutCustomizerProps> = ({
  shortcuts,
  onShortcutChange,
  onShortcutDelete,
  onShortcutAdd,
  onResetShortcuts,
  className = ''
}) => {
  // 状态管理
  const [editingShortcut, setEditingShortcut] = useState<string | null>(null)
  const [recordingKeys, setRecordingKeys] = useState(false)
  const [currentKeys, setCurrentKeys] = useState<string[]>([])
  const [searchText, setSearchText] = useState('')
  const [filterContext, setFilterContext] = useState<string>('all')
  const [showConflicts, setShowConflicts] = useState(false)
  const [newShortcutDialog, setNewShortcutDialog] = useState(false)
  const [newShortcut, setNewShortcut] = useState({
    name: '',
    description: '',
    action: '',
    context: '',
    keys: [] as string[]
  })

  // 引用
  const keyRecorderRef = useRef<HTMLDivElement>(null)

  // 检测快捷键冲突
  const detectConflicts = useCallback((): ShortcutConflict[] => {
    const conflicts: ShortcutConflict[] = []
    const keyMap = new Map<string, string[]>()

    shortcuts.forEach(shortcut => {
      if (!shortcut.enabled) return
      
      const keyString = shortcut.keys.join('+')
      if (!keyMap.has(keyString)) {
        keyMap.set(keyString, [])
      }
      keyMap.get(keyString)!.push(shortcut.id)
    })

    keyMap.forEach((shortcutIds, keyString) => {
      if (shortcutIds.length > 1) {
        shortcutIds.forEach(id => {
          conflicts.push({
            shortcutId: id,
            conflictWith: shortcutIds.filter(otherId => otherId !== id),
            keys: keyString.split('+')
          })
        })
      }
    })

    return conflicts
  }, [shortcuts])

  // 过滤快捷键
  const filteredShortcuts = useCallback(() => {
    let filtered = shortcuts

    // 文本搜索过滤
    if (searchText) {
      const lowerSearchText = searchText.toLowerCase()
      filtered = filtered.filter(shortcut =>
        shortcut.name.toLowerCase().includes(lowerSearchText) ||
        shortcut.description.toLowerCase().includes(lowerSearchText) ||
        shortcut.action.toLowerCase().includes(lowerSearchText) ||
        shortcut.keys.some(key => key.toLowerCase().includes(lowerSearchText))
      )
    }

    // 上下文过滤
    if (filterContext !== 'all') {
      filtered = filtered.filter(shortcut => 
        shortcut.context === filterContext || (!shortcut.context && filterContext === 'global')
      )
    }

    return filtered
  }, [shortcuts, searchText, filterContext])

  // 获取可用的上下文
  const availableContexts = useCallback(() => {
    const contexts = new Set<string>()
    shortcuts.forEach(shortcut => {
      if (shortcut.context) {
        contexts.add(shortcut.context)
      }
    })
    return ['all', 'global', ...Array.from(contexts)]
  }, [shortcuts])

  // 开始录制快捷键
  const startRecording = useCallback((shortcutId: string) => {
    setEditingShortcut(shortcutId)
    setRecordingKeys(true)
    setCurrentKeys([])
  }, [])

  // 停止录制快捷键
  const stopRecording = useCallback(() => {
    setRecordingKeys(false)
    setCurrentKeys([])
  }, [])

  // 保存快捷键
  const saveShortcut = useCallback(() => {
    if (!editingShortcut || currentKeys.length === 0) return

    const shortcut = shortcuts.find(s => s.id === editingShortcut)
    if (shortcut) {
      onShortcutChange({
        ...shortcut,
        keys: [...currentKeys]
      })
    }

    setEditingShortcut(null)
    stopRecording()
  }, [editingShortcut, currentKeys, shortcuts, onShortcutChange, stopRecording])

  // 取消编辑
  const cancelEdit = useCallback(() => {
    setEditingShortcut(null)
    stopRecording()
  }, [stopRecording])

  // 处理键盘事件
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!recordingKeys) return

    event.preventDefault()
    event.stopPropagation()

    const keys: string[] = []
    
    // 修饰键
    if (event.ctrlKey) keys.push('Ctrl')
    if (event.altKey) keys.push('Alt')
    if (event.shiftKey) keys.push('Shift')
    if (event.metaKey) keys.push('Meta')

    // 主键
    if (event.key && !['Control', 'Alt', 'Shift', 'Meta'].includes(event.key)) {
      keys.push(event.key.length === 1 ? event.key.toUpperCase() : event.key)
    }

    if (keys.length > 0) {
      setCurrentKeys(keys)
    }
  }, [recordingKeys])

  // 处理键盘事件监听
  useEffect(() => {
    if (recordingKeys) {
      document.addEventListener('keydown', handleKeyDown, true)
      return () => {
        document.removeEventListener('keydown', handleKeyDown, true)
      }
    }
  }, [recordingKeys, handleKeyDown])

  // 切换快捷键启用状态
  const toggleShortcutEnabled = useCallback((shortcutId: string) => {
    const shortcut = shortcuts.find(s => s.id === shortcutId)
    if (shortcut) {
      onShortcutChange({
        ...shortcut,
        enabled: !shortcut.enabled
      })
    }
  }, [shortcuts, onShortcutChange])

  // 重置单个快捷键
  const resetShortcut = useCallback((shortcutId: string) => {
    // 这里需要从默认配置中获取原始快捷键
    // 简化实现，实际中需要访问默认配置
    console.log('重置快捷键:', shortcutId)
  }, [])

  // 添加新快捷键
  const handleAddShortcut = useCallback(() => {
    if (newShortcut.name && newShortcut.action && newShortcut.keys.length > 0) {
      onShortcutAdd({
        name: newShortcut.name,
        description: newShortcut.description,
        action: newShortcut.action,
        context: newShortcut.context || undefined,
        keys: newShortcut.keys,
        enabled: true,
        modifiable: true
      })

      setNewShortcut({
        name: '',
        description: '',
        action: '',
        context: '',
        keys: []
      })
      setNewShortcutDialog(false)
    }
  }, [newShortcut, onShortcutAdd])

  // 格式化快捷键显示
  const formatKeys = useCallback((keys: string[]) => {
    return keys.join(' + ')
  }, [])

  // 检查快捷键是否有冲突
  const hasConflict = useCallback((shortcutId: string) => {
    const conflicts = detectConflicts()
    return conflicts.some(conflict => conflict.shortcutId === shortcutId)
  }, [detectConflicts])

  // 渲染快捷键项
  const renderShortcutItem = (shortcut: KeyboardShortcut) => {
    const isEditing = editingShortcut === shortcut.id
    const isConflicted = hasConflict(shortcut.id)

    return (
      <div 
        key={shortcut.id} 
        className={`shortcut-item ${!shortcut.enabled ? 'disabled' : ''} ${isConflicted ? 'conflict' : ''}`}
      >
        <div className="shortcut-info">
          <div className="shortcut-header">
            <h4 className="shortcut-name">{shortcut.name}</h4>
            {isConflicted && (
              <AlertTriangle size={16} className="conflict-icon" title="快捷键冲突" />
            )}
          </div>
          <p className="shortcut-description">{shortcut.description}</p>
          <div className="shortcut-meta">
            <span className="shortcut-action">动作: {shortcut.action}</span>
            {shortcut.context && (
              <span className="shortcut-context">上下文: {shortcut.context}</span>
            )}
          </div>
        </div>

        <div className="shortcut-keys">
          {isEditing ? (
            <div className="key-recorder" ref={keyRecorderRef}>
              {recordingKeys ? (
                <div className="recording-indicator">
                  <span className="recording-text">
                    {currentKeys.length > 0 ? formatKeys(currentKeys) : '按下快捷键...'}
                  </span>
                  <div className="recording-actions">
                    <button onClick={saveShortcut} className="save-key-button" disabled={currentKeys.length === 0}>
                      <Check size={14} />
                    </button>
                    <button onClick={cancelEdit} className="cancel-key-button">
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => startRecording(shortcut.id)}
                  className="start-recording-button"
                >
                  点击录制快捷键
                </button>
              )}
            </div>
          ) : (
            <div className="key-display">
              <span className="keys-text">{formatKeys(shortcut.keys)}</span>
            </div>
          )}
        </div>

        <div className="shortcut-actions">
          <button
            onClick={() => toggleShortcutEnabled(shortcut.id)}
            className={`action-button toggle-button ${shortcut.enabled ? 'enabled' : 'disabled'}`}
            title={shortcut.enabled ? '禁用快捷键' : '启用快捷键'}
          >
            {shortcut.enabled ? '启用' : '禁用'}
          </button>

          {shortcut.modifiable && (
            <>
              <button
                onClick={() => isEditing ? cancelEdit() : startRecording(shortcut.id)}
                className="action-button edit-button"
                title={isEditing ? '取消编辑' : '编辑快捷键'}
              >
                {isEditing ? <X size={14} /> : <Edit size={14} />}
              </button>

              <button
                onClick={() => resetShortcut(shortcut.id)}
                className="action-button reset-button"
                title="重置快捷键"
              >
                <RotateCcw size={14} />
              </button>

              <button
                onClick={() => onShortcutDelete(shortcut.id)}
                className="action-button delete-button"
                title="删除快捷键"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  const conflicts = detectConflicts()

  return (
    <div className={`shortcut-customizer ${className}`}>
      {/* 工具栏 */}
      <div className="customizer-toolbar">
        <div className="toolbar-left">
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="搜索快捷键..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="search-input"
            />
          </div>

          <select
            value={filterContext}
            onChange={(e) => setFilterContext(e.target.value)}
            className="context-filter"
          >
            <option value="all">所有上下文</option>
            <option value="global">全局</option>
            {availableContexts().filter(ctx => ctx !== 'all' && ctx !== 'global').map(context => (
              <option key={context} value={context}>{context}</option>
            ))}
          </select>
        </div>

        <div className="toolbar-right">
          {conflicts.length > 0 && (
            <button
              onClick={() => setShowConflicts(!showConflicts)}
              className={`conflicts-button ${showConflicts ? 'active' : ''}`}
            >
              <AlertTriangle size={16} />
              {conflicts.length} 个冲突
            </button>
          )}

          <button
            onClick={() => setNewShortcutDialog(true)}
            className="add-shortcut-button"
          >
            <Plus size={16} />
            添加快捷键
          </button>

          <button
            onClick={onResetShortcuts}
            className="reset-all-button"
          >
            <RotateCcw size={16} />
            重置全部
          </button>
        </div>
      </div>

      {/* 冲突警告 */}
      {showConflicts && conflicts.length > 0 && (
        <div className="conflicts-panel">
          <h3>快捷键冲突</h3>
          {conflicts.map((conflict, index) => {
            const shortcut = shortcuts.find(s => s.id === conflict.shortcutId)
            return (
              <div key={index} className="conflict-item">
                <span className="conflict-shortcut">{shortcut?.name}</span>
                <span className="conflict-keys">{formatKeys(conflict.keys)}</span>
                <span className="conflict-description">
                  与 {conflict.conflictWith.length} 个其他快捷键冲突
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* 快捷键列表 */}
      <div className="shortcuts-list">
        {filteredShortcuts().map(renderShortcutItem)}
      </div>

      {/* 添加快捷键对话框 */}
      {newShortcutDialog && (
        <div className="dialog-overlay">
          <div className="add-shortcut-dialog">
            <h3>添加新快捷键</h3>
            
            <div className="dialog-form">
              <div className="form-field">
                <label>名称</label>
                <input
                  type="text"
                  value={newShortcut.name}
                  onChange={(e) => setNewShortcut(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="输入快捷键名称"
                />
              </div>

              <div className="form-field">
                <label>描述</label>
                <input
                  type="text"
                  value={newShortcut.description}
                  onChange={(e) => setNewShortcut(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="输入快捷键描述"
                />
              </div>

              <div className="form-field">
                <label>动作</label>
                <input
                  type="text"
                  value={newShortcut.action}
                  onChange={(e) => setNewShortcut(prev => ({ ...prev, action: e.target.value }))}
                  placeholder="输入动作名称"
                />
              </div>

              <div className="form-field">
                <label>上下文（可选）</label>
                <input
                  type="text"
                  value={newShortcut.context}
                  onChange={(e) => setNewShortcut(prev => ({ ...prev, context: e.target.value }))}
                  placeholder="输入上下文"
                />
              </div>

              <div className="form-field">
                <label>快捷键</label>
                <div className="key-input">
                  {newShortcut.keys.length > 0 ? (
                    <span className="keys-display">{formatKeys(newShortcut.keys)}</span>
                  ) : (
                    <span className="keys-placeholder">点击录制快捷键</span>
                  )}
                  <button
                    onClick={() => {
                      // 简化实现，实际中需要实现键盘录制
                      const keys = ['Ctrl', 'Shift', 'N'] // 示例
                      setNewShortcut(prev => ({ ...prev, keys }))
                    }}
                    className="record-key-button"
                  >
                    <Keyboard size={16} />
                    录制
                  </button>
                </div>
              </div>
            </div>

            <div className="dialog-actions">
              <button
                onClick={() => setNewShortcutDialog(false)}
                className="cancel-button"
              >
                取消
              </button>
              <button
                onClick={handleAddShortcut}
                className="add-button"
                disabled={!newShortcut.name || !newShortcut.action || newShortcut.keys.length === 0}
              >
                添加
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ShortcutCustomizer
