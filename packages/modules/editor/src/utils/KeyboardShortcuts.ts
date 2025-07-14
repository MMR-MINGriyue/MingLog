/**
 * 键盘快捷键处理系统
 * 提供统一的快捷键管理和处理
 */

import type { FormatType, BlockFormatType } from '../components/RichTextToolbar';

/**
 * 快捷键配置接口
 */
export interface ShortcutConfig {
  /** 快捷键组合 */
  key: string;
  /** 是否需要Ctrl键 */
  ctrl?: boolean;
  /** 是否需要Shift键 */
  shift?: boolean;
  /** 是否需要Alt键 */
  alt?: boolean;
  /** 是否需要Meta键（Mac的Cmd键） */
  meta?: boolean;
  /** 快捷键描述 */
  description: string;
  /** 快捷键处理函数 */
  handler: () => void;
}

/**
 * 快捷键处理器接口
 */
export interface ShortcutHandlers {
  /** 格式化处理 */
  onFormat: (format: FormatType) => void;
  /** 块格式化处理 */
  onBlockFormat: (blockType: BlockFormatType) => void;
  /** 插入链接 */
  onInsertLink: () => void;
  /** 保存文档 */
  onSave: () => void;
  /** 撤销 */
  onUndo?: () => void;
  /** 重做 */
  onRedo?: () => void;
  /** 查找 */
  onFind?: () => void;
  /** 替换 */
  onReplace?: () => void;
  /** 全局命令面板 */
  onCommandPalette?: () => void;
  /** 块选择 */
  onSelectBlock?: () => void;
  /** 块导航 */
  onNavigateBlock?: (direction: 'up' | 'down' | 'first' | 'last') => void;
  /** 块操作 */
  onBlockOperation?: (operation: string, options?: any) => void;
  /** 缩进 */
  onIndent?: () => void;
  /** 取消缩进 */
  onOutdent?: () => void;
  /** 复制块 */
  onCopyBlock?: () => void;
  /** 剪切块 */
  onCutBlock?: () => void;
  /** 粘贴块 */
  onPasteBlock?: () => void;
  /** 删除块 */
  onDeleteBlock?: () => void;
  /** 复制块 */
  onDuplicateBlock?: () => void;
  /** 移动块 */
  onMoveBlock?: (direction: 'up' | 'down') => void;
}

/**
 * 键盘快捷键管理器
 */
export class KeyboardShortcuts {
  private shortcuts: Map<string, ShortcutConfig> = new Map();
  private isEnabled = true;

  constructor(handlers: ShortcutHandlers) {
    this.registerDefaultShortcuts(handlers);
  }

  /**
   * 注册默认快捷键
   */
  private registerDefaultShortcuts(handlers: ShortcutHandlers): void {
    // 文本格式化快捷键
    this.register({
      key: 'b',
      ctrl: true,
      description: '粗体',
      handler: () => handlers.onFormat('bold')
    });

    this.register({
      key: 'i',
      ctrl: true,
      description: '斜体',
      handler: () => handlers.onFormat('italic')
    });

    this.register({
      key: 'u',
      ctrl: true,
      description: '下划线',
      handler: () => handlers.onFormat('underline')
    });

    this.register({
      key: 'x',
      ctrl: true,
      shift: true,
      description: '删除线',
      handler: () => handlers.onFormat('strikethrough')
    });

    this.register({
      key: '`',
      ctrl: true,
      description: '行内代码',
      handler: () => handlers.onFormat('code')
    });

    this.register({
      key: 'h',
      ctrl: true,
      shift: true,
      description: '高亮',
      handler: () => handlers.onFormat('highlight')
    });

    // 块格式化快捷键
    this.register({
      key: '1',
      ctrl: true,
      alt: true,
      description: '一级标题',
      handler: () => handlers.onBlockFormat('heading-1')
    });

    this.register({
      key: '2',
      ctrl: true,
      alt: true,
      description: '二级标题',
      handler: () => handlers.onBlockFormat('heading-2')
    });

    this.register({
      key: '3',
      ctrl: true,
      alt: true,
      description: '三级标题',
      handler: () => handlers.onBlockFormat('heading-3')
    });

    this.register({
      key: '8',
      ctrl: true,
      shift: true,
      description: '无序列表',
      handler: () => handlers.onBlockFormat('bulleted-list')
    });

    this.register({
      key: '7',
      ctrl: true,
      shift: true,
      description: '有序列表',
      handler: () => handlers.onBlockFormat('numbered-list')
    });

    this.register({
      key: '9',
      ctrl: true,
      shift: true,
      description: '任务列表',
      handler: () => handlers.onBlockFormat('todo-list')
    });

    this.register({
      key: '.',
      ctrl: true,
      shift: true,
      description: '引用',
      handler: () => handlers.onBlockFormat('quote')
    });

    this.register({
      key: 'c',
      ctrl: true,
      alt: true,
      description: '代码块',
      handler: () => handlers.onBlockFormat('code')
    });

    // 插入操作快捷键
    this.register({
      key: 'k',
      ctrl: true,
      description: '插入链接',
      handler: handlers.onInsertLink
    });

    // 文档操作快捷键
    this.register({
      key: 's',
      ctrl: true,
      description: '保存文档',
      handler: handlers.onSave
    });

    // 历史操作快捷键
    if (handlers.onUndo) {
      this.register({
        key: 'z',
        ctrl: true,
        description: '撤销',
        handler: handlers.onUndo
      });
    }

    if (handlers.onRedo) {
      this.register({
        key: 'y',
        ctrl: true,
        description: '重做',
        handler: handlers.onRedo
      });
    }

    // 查找替换快捷键
    if (handlers.onFind) {
      this.register({
        key: 'f',
        ctrl: true,
        description: '查找',
        handler: handlers.onFind
      });
    }

    if (handlers.onReplace) {
      this.register({
        key: 'h',
        ctrl: true,
        description: '替换',
        handler: handlers.onReplace
      });
    }

    // 全局命令面板快捷键
    if (handlers.onCommandPalette) {
      this.register({
        key: 'p',
        ctrl: true,
        description: '命令面板',
        handler: handlers.onCommandPalette
      });

      this.register({
        key: 'k',
        ctrl: true,
        shift: true,
        description: '命令面板',
        handler: handlers.onCommandPalette
      });
    }

    // 块选择和导航快捷键
    if (handlers.onSelectBlock) {
      this.register({
        key: 'Escape',
        description: '选择当前块',
        handler: handlers.onSelectBlock
      });
    }

    if (handlers.onNavigateBlock) {
      this.register({
        key: 'ArrowUp',
        alt: true,
        description: '导航到上一个块',
        handler: () => handlers.onNavigateBlock!('up')
      });

      this.register({
        key: 'ArrowDown',
        alt: true,
        description: '导航到下一个块',
        handler: () => handlers.onNavigateBlock!('down')
      });

      this.register({
        key: 'Home',
        ctrl: true,
        description: '导航到第一个块',
        handler: () => handlers.onNavigateBlock!('first')
      });

      this.register({
        key: 'End',
        ctrl: true,
        description: '导航到最后一个块',
        handler: () => handlers.onNavigateBlock!('last')
      });
    }

    // 缩进操作快捷键
    if (handlers.onIndent) {
      this.register({
        key: 'Tab',
        description: '增加缩进',
        handler: handlers.onIndent
      });
    }

    if (handlers.onOutdent) {
      this.register({
        key: 'Tab',
        shift: true,
        description: '减少缩进',
        handler: handlers.onOutdent
      });
    }

    // 块操作快捷键
    if (handlers.onCopyBlock) {
      this.register({
        key: 'd',
        ctrl: true,
        description: '复制块',
        handler: handlers.onCopyBlock
      });
    }

    if (handlers.onCutBlock) {
      this.register({
        key: 'x',
        ctrl: true,
        shift: true,
        description: '剪切块',
        handler: handlers.onCutBlock
      });
    }

    if (handlers.onPasteBlock) {
      this.register({
        key: 'v',
        ctrl: true,
        shift: true,
        description: '粘贴块',
        handler: handlers.onPasteBlock
      });
    }

    if (handlers.onDeleteBlock) {
      this.register({
        key: 'Delete',
        ctrl: true,
        shift: true,
        description: '删除块',
        handler: handlers.onDeleteBlock
      });
    }

    if (handlers.onDuplicateBlock) {
      this.register({
        key: 'd',
        ctrl: true,
        shift: true,
        description: '复制块',
        handler: handlers.onDuplicateBlock
      });
    }

    if (handlers.onMoveBlock) {
      this.register({
        key: 'ArrowUp',
        ctrl: true,
        shift: true,
        description: '向上移动块',
        handler: () => handlers.onMoveBlock!('up')
      });

      this.register({
        key: 'ArrowDown',
        ctrl: true,
        shift: true,
        description: '向下移动块',
        handler: () => handlers.onMoveBlock!('down')
      });
    }
  }

  /**
   * 注册快捷键
   */
  register(config: ShortcutConfig): void {
    const key = this.generateKey(config);
    this.shortcuts.set(key, config);
  }

  /**
   * 注销快捷键
   */
  unregister(config: Omit<ShortcutConfig, 'description' | 'handler'>): void {
    const key = this.generateKey(config);
    this.shortcuts.delete(key);
  }

  /**
   * 处理键盘事件
   */
  handleKeyDown(event: KeyboardEvent): boolean {
    if (!this.isEnabled) {
      return false;
    }

    const key = this.generateKeyFromEvent(event);
    const shortcut = this.shortcuts.get(key);

    if (shortcut) {
      event.preventDefault();
      event.stopPropagation();
      shortcut.handler();
      return true;
    }

    return false;
  }

  /**
   * 启用快捷键
   */
  enable(): void {
    this.isEnabled = true;
  }

  /**
   * 禁用快捷键
   */
  disable(): void {
    this.isEnabled = false;
  }

  /**
   * 获取所有快捷键配置
   */
  getAllShortcuts(): ShortcutConfig[] {
    return Array.from(this.shortcuts.values());
  }

  /**
   * 获取快捷键帮助信息
   */
  getHelpText(): string {
    const shortcuts = this.getAllShortcuts();
    const groups = this.groupShortcuts(shortcuts);
    
    let helpText = '# 键盘快捷键\n\n';
    
    for (const [groupName, groupShortcuts] of Object.entries(groups)) {
      helpText += `## ${groupName}\n\n`;
      for (const shortcut of groupShortcuts) {
        const keyCombo = this.formatKeyCombo(shortcut);
        helpText += `- **${keyCombo}**: ${shortcut.description}\n`;
      }
      helpText += '\n';
    }
    
    return helpText;
  }

  /**
   * 生成快捷键标识
   */
  private generateKey(config: ShortcutConfig | Omit<ShortcutConfig, 'description' | 'handler'>): string {
    const parts: string[] = [];
    
    if (config.ctrl) parts.push('ctrl');
    if (config.shift) parts.push('shift');
    if (config.alt) parts.push('alt');
    if (config.meta) parts.push('meta');
    
    parts.push(config.key.toLowerCase());
    
    return parts.join('+');
  }

  /**
   * 从键盘事件生成快捷键标识
   */
  private generateKeyFromEvent(event: KeyboardEvent): string {
    const parts: string[] = [];
    
    if (event.ctrlKey) parts.push('ctrl');
    if (event.shiftKey) parts.push('shift');
    if (event.altKey) parts.push('alt');
    if (event.metaKey) parts.push('meta');
    
    parts.push(event.key.toLowerCase());
    
    return parts.join('+');
  }

  /**
   * 格式化快捷键组合显示
   */
  private formatKeyCombo(config: ShortcutConfig): string {
    const parts: string[] = [];
    
    if (config.ctrl) parts.push('Ctrl');
    if (config.shift) parts.push('Shift');
    if (config.alt) parts.push('Alt');
    if (config.meta) parts.push('Cmd');
    
    parts.push(config.key.toUpperCase());
    
    return parts.join(' + ');
  }

  /**
   * 将快捷键分组
   */
  private groupShortcuts(shortcuts: ShortcutConfig[]): Record<string, ShortcutConfig[]> {
    const groups: Record<string, ShortcutConfig[]> = {
      '文本格式': [],
      '块格式': [],
      '插入操作': [],
      '文档操作': [],
      '编辑操作': []
    };

    for (const shortcut of shortcuts) {
      if (shortcut.description.includes('粗体') || 
          shortcut.description.includes('斜体') || 
          shortcut.description.includes('下划线') ||
          shortcut.description.includes('删除线') ||
          shortcut.description.includes('代码') ||
          shortcut.description.includes('高亮')) {
        groups['文本格式'].push(shortcut);
      } else if (shortcut.description.includes('标题') ||
                 shortcut.description.includes('列表') ||
                 shortcut.description.includes('引用')) {
        groups['块格式'].push(shortcut);
      } else if (shortcut.description.includes('插入')) {
        groups['插入操作'].push(shortcut);
      } else if (shortcut.description.includes('保存')) {
        groups['文档操作'].push(shortcut);
      } else {
        groups['编辑操作'].push(shortcut);
      }
    }

    // 移除空分组
    Object.keys(groups).forEach(key => {
      if (groups[key].length === 0) {
        delete groups[key];
      }
    });

    return groups;
  }
}

/**
 * 创建快捷键管理器实例
 */
export function createKeyboardShortcuts(handlers: ShortcutHandlers): KeyboardShortcuts {
  return new KeyboardShortcuts(handlers);
}
