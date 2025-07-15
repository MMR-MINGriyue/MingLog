/**
 * 幕布风格快捷键处理器
 * 实现类似幕布（MuBu）的键盘快捷键和交互逻辑
 */

import { Editor, Transforms, Range, Path, Node, Element as SlateElement } from 'slate'
import { ReactEditor } from 'slate-react'
import { CustomEditor, CustomElement, MubuShortcutConfig, MubuEditorConfig } from '../types'

/**
 * 默认幕布快捷键配置
 */
export const DEFAULT_MUBU_SHORTCUTS: MubuShortcutConfig = {
  navigateUp: 'ArrowUp',
  navigateDown: 'ArrowDown',
  navigateLeft: 'ArrowLeft',
  navigateRight: 'ArrowRight',
  createBlock: 'Enter',
  createLineBreak: 'Shift+Enter',
  deleteBlock: 'Backspace',
  duplicateBlock: 'Ctrl+D',
  indentBlock: 'Tab',
  outdentBlock: 'Shift+Tab',
  moveBlockUp: 'Ctrl+ArrowUp',
  moveBlockDown: 'Ctrl+ArrowDown',
  toggleCollapse: 'Ctrl+/',
  collapseAll: 'Ctrl+Shift+/',
  expandAll: 'Ctrl+Shift+.'
}

/**
 * 默认幕布编辑器配置
 */
export const DEFAULT_MUBU_CONFIG: MubuEditorConfig = {
  shortcuts: DEFAULT_MUBU_SHORTCUTS,
  maxIndentLevel: 6,
  indentSize: 20,
  showIndentGuides: true,
  highlightCurrentBlock: true,
  showCollapseIcons: true,
  autoIndent: true,
  smartEnter: true,
  enableDragDrop: true,
  virtualScrolling: false,
  lazyRender: false
}

/**
 * 幕布快捷键处理器类
 */
export class MubuShortcutHandler {
  private editor: CustomEditor
  private config: MubuEditorConfig
  private eventHandlers: Map<string, (event: KeyboardEvent) => boolean>

  constructor(editor: CustomEditor, config: Partial<MubuEditorConfig> = {}) {
    this.editor = editor
    this.config = { ...DEFAULT_MUBU_CONFIG, ...config }
    this.eventHandlers = new Map()
    this.initializeHandlers()
  }

  /**
   * 初始化快捷键处理器
   */
  private initializeHandlers(): void {
    const { shortcuts } = this.config

    // 导航快捷键
    this.eventHandlers.set(shortcuts.navigateUp, this.handleNavigateUp.bind(this))
    this.eventHandlers.set(shortcuts.navigateDown, this.handleNavigateDown.bind(this))
    this.eventHandlers.set(shortcuts.navigateLeft, this.handleNavigateLeft.bind(this))
    this.eventHandlers.set(shortcuts.navigateRight, this.handleNavigateRight.bind(this))

    // 块操作快捷键
    this.eventHandlers.set(shortcuts.createBlock, this.handleCreateBlock.bind(this))
    this.eventHandlers.set(shortcuts.createLineBreak, this.handleCreateLineBreak.bind(this))
    this.eventHandlers.set(shortcuts.deleteBlock, this.handleDeleteBlock.bind(this))
    this.eventHandlers.set(shortcuts.duplicateBlock, this.handleDuplicateBlock.bind(this))

    // 层级操作快捷键
    this.eventHandlers.set(shortcuts.indentBlock, this.handleIndentBlock.bind(this))
    this.eventHandlers.set(shortcuts.outdentBlock, this.handleOutdentBlock.bind(this))

    // 移动操作快捷键
    this.eventHandlers.set(shortcuts.moveBlockUp, this.handleMoveBlockUp.bind(this))
    this.eventHandlers.set(shortcuts.moveBlockDown, this.handleMoveBlockDown.bind(this))

    // 折叠操作快捷键
    this.eventHandlers.set(shortcuts.toggleCollapse, this.handleToggleCollapse.bind(this))
    this.eventHandlers.set(shortcuts.collapseAll, this.handleCollapseAll.bind(this))
    this.eventHandlers.set(shortcuts.expandAll, this.handleExpandAll.bind(this))
  }

  /**
   * 处理键盘事件
   */
  public handleKeyDown(event: KeyboardEvent): boolean {
    const shortcutKey = this.getShortcutKey(event)
    const handler = this.eventHandlers.get(shortcutKey)

    if (handler) {
      const handled = handler(event)
      if (handled) {
        event.preventDefault()
        event.stopPropagation()
      }
      return handled
    }

    return false
  }

  /**
   * 获取快捷键字符串
   */
  private getShortcutKey(event: KeyboardEvent): string {
    const parts: string[] = []
    
    if (event.ctrlKey) parts.push('Ctrl')
    if (event.shiftKey) parts.push('Shift')
    if (event.altKey) parts.push('Alt')
    if (event.metaKey) parts.push('Meta')
    
    parts.push(event.key)
    
    return parts.join('+')
  }

  /**
   * 向上导航
   */
  private handleNavigateUp(event: KeyboardEvent): boolean {
    if (!this.editor.selection) return false

    const currentPath = this.editor.selection.anchor.path
    const previousPath = this.getPreviousBlockPath(currentPath)

    if (previousPath) {
      Transforms.select(this.editor, {
        anchor: { path: previousPath, offset: 0 },
        focus: { path: previousPath, offset: 0 }
      })
      return true
    }

    return false
  }

  /**
   * 向下导航
   */
  private handleNavigateDown(event: KeyboardEvent): boolean {
    if (!this.editor.selection) return false

    const currentPath = this.editor.selection.anchor.path
    const nextPath = this.getNextBlockPath(currentPath)

    if (nextPath) {
      Transforms.select(this.editor, {
        anchor: { path: nextPath, offset: 0 },
        focus: { path: nextPath, offset: 0 }
      })
      return true
    }

    return false
  }

  /**
   * 向左导航（减少缩进层级）
   */
  private handleNavigateLeft(event: KeyboardEvent): boolean {
    return this.handleOutdentBlock(event)
  }

  /**
   * 向右导航（增加缩进层级）
   */
  private handleNavigateRight(event: KeyboardEvent): boolean {
    return this.handleIndentBlock(event)
  }

  /**
   * 创建新块
   */
  private handleCreateBlock(event: KeyboardEvent): boolean {
    if (!this.editor.selection) return false

    const currentBlock = this.getCurrentBlock()
    if (!currentBlock) return false

    // 如果当前块为空，转换为段落
    if (this.isEmptyBlock(currentBlock)) {
      Transforms.setNodes(this.editor, { type: 'paragraph' })
      return true
    }

    // 创建新的同级块
    const newBlock: CustomElement = {
      id: this.generateId(),
      type: 'paragraph',
      level: currentBlock.level || 0,
      parentId: currentBlock.parentId,
      children: [{ text: '' }]
    }

    Transforms.insertNodes(this.editor, newBlock)
    return true
  }

  /**
   * 创建换行
   */
  private handleCreateLineBreak(event: KeyboardEvent): boolean {
    if (!this.editor.selection) return false
    
    Transforms.insertText(this.editor, '\n')
    return true
  }

  /**
   * 删除块或合并
   */
  private handleDeleteBlock(event: KeyboardEvent): boolean {
    if (!this.editor.selection) return false

    const currentBlock = this.getCurrentBlock()
    if (!currentBlock) return false

    // 如果块为空，删除块
    if (this.isEmptyBlock(currentBlock)) {
      const previousPath = this.getPreviousBlockPath(this.editor.selection.anchor.path)
      
      Transforms.removeNodes(this.editor)
      
      if (previousPath) {
        Transforms.select(this.editor, {
          anchor: { path: previousPath, offset: 0 },
          focus: { path: previousPath, offset: 0 }
        })
      }
      
      return true
    }

    // 如果光标在块开始位置，合并到上一块
    if (this.editor.selection.anchor.offset === 0) {
      const previousPath = this.getPreviousBlockPath(this.editor.selection.anchor.path)
      if (previousPath) {
        // 合并逻辑
        return this.mergeWithPreviousBlock(previousPath)
      }
    }

    return false
  }

  /**
   * 复制当前块
   */
  private handleDuplicateBlock(event: KeyboardEvent): boolean {
    if (!this.editor.selection) return false

    const currentBlock = this.getCurrentBlock()
    if (!currentBlock) return false

    const duplicatedBlock: CustomElement = {
      ...currentBlock,
      id: this.generateId(),
      children: [...currentBlock.children]
    }

    Transforms.insertNodes(this.editor, duplicatedBlock)
    return true
  }

  /**
   * 增加缩进
   */
  private handleIndentBlock(event: KeyboardEvent): boolean {
    if (!this.editor.selection) return false

    const currentBlock = this.getCurrentBlock()
    if (!currentBlock) return false

    const currentLevel = currentBlock.level || 0
    if (currentLevel >= this.config.maxIndentLevel) return false

    Transforms.setNodes(this.editor, { 
      level: currentLevel + 1 
    })

    return true
  }

  /**
   * 减少缩进
   */
  private handleOutdentBlock(event: KeyboardEvent): boolean {
    if (!this.editor.selection) return false

    const currentBlock = this.getCurrentBlock()
    if (!currentBlock) return false

    const currentLevel = currentBlock.level || 0
    if (currentLevel <= 0) return false

    Transforms.setNodes(this.editor, { 
      level: currentLevel - 1 
    })

    return true
  }

  /**
   * 向上移动块
   */
  private handleMoveBlockUp(event: KeyboardEvent): boolean {
    if (!this.editor.selection) return false

    const currentPath = this.editor.selection.anchor.path
    const previousPath = this.getPreviousBlockPath(currentPath)

    if (previousPath) {
      Transforms.moveNodes(this.editor, {
        at: currentPath,
        to: previousPath
      })
      return true
    }

    return false
  }

  /**
   * 向下移动块
   */
  private handleMoveBlockDown(event: KeyboardEvent): boolean {
    if (!this.editor.selection) return false

    const currentPath = this.editor.selection.anchor.path
    const nextPath = this.getNextBlockPath(currentPath)

    if (nextPath) {
      const targetPath = Path.next(nextPath)
      Transforms.moveNodes(this.editor, {
        at: currentPath,
        to: targetPath
      })
      return true
    }

    return false
  }

  /**
   * 切换折叠状态
   */
  private handleToggleCollapse(event: KeyboardEvent): boolean {
    if (!this.editor.selection) return false

    const currentBlock = this.getCurrentBlock()
    if (!currentBlock) return false

    const isCollapsed = currentBlock.isCollapsed || false
    Transforms.setNodes(this.editor, { 
      isCollapsed: !isCollapsed 
    })

    return true
  }

  /**
   * 折叠所有块
   */
  private handleCollapseAll(event: KeyboardEvent): boolean {
    // 实现折叠所有块的逻辑
    return true
  }

  /**
   * 展开所有块
   */
  private handleExpandAll(event: KeyboardEvent): boolean {
    // 实现展开所有块的逻辑
    return true
  }

  // 辅助方法
  private getCurrentBlock(): CustomElement | null {
    if (!this.editor.selection) return null

    const [match] = Editor.nodes(this.editor, {
      match: n => Editor.isBlock(this.editor, n),
      at: this.editor.selection
    })

    return match ? (match[0] as CustomElement) : null
  }

  private isEmptyBlock(block: CustomElement): boolean {
    return block.children.length === 1 && 
           'text' in block.children[0] && 
           block.children[0].text === ''
  }

  private getPreviousBlockPath(currentPath: Path): Path | null {
    try {
      return Path.previous(currentPath)
    } catch {
      return null
    }
  }

  private getNextBlockPath(currentPath: Path): Path | null {
    try {
      return Path.next(currentPath)
    } catch {
      return null
    }
  }

  private mergeWithPreviousBlock(previousPath: Path): boolean {
    // 实现与上一块合并的逻辑
    return true
  }

  private generateId(): string {
    return `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
