/**
 * 全局键盘快捷键管理器
 * 统一管理系统级键盘快捷键，避免冲突，提供一致的用户体验
 */

import { EventEmitter } from 'events';

/**
 * 快捷键配置接口
 */
export interface GlobalShortcutConfig {
  /** 快捷键ID */
  id: string;
  /** 快捷键组合 */
  key: string;
  /** 修饰键 */
  modifiers: {
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
  };
  /** 快捷键描述 */
  description: string;
  /** 快捷键分类 */
  category: 'global' | 'navigation' | 'editing' | 'search' | 'modal' | 'mubu';
  /** 优先级 (数字越大优先级越高) */
  priority: number;
  /** 是否全局有效 */
  global: boolean;
  /** 上下文限制 */
  context?: string[];
  /** 处理函数 */
  handler: (event: KeyboardEvent) => void | boolean;
  /** 是否阻止默认行为 */
  preventDefault?: boolean;
  /** 是否阻止事件冒泡 */
  stopPropagation?: boolean;
}

/**
 * 快捷键上下文
 */
export interface ShortcutContext {
  /** 当前活动的模块 */
  activeModule?: string;
  /** 当前焦点元素类型 */
  focusType?: 'input' | 'textarea' | 'editor' | 'button' | 'none';
  /** 是否有模态框打开 */
  hasModal?: boolean;
  /** 当前页面路径 */
  currentPath?: string;
}

/**
 * 全局快捷键管理器
 */
export class GlobalShortcutManager extends EventEmitter {
  private shortcuts: Map<string, GlobalShortcutConfig> = new Map();
  private isEnabled = true;
  private context: ShortcutContext = {};
  private keydownHandler: (event: KeyboardEvent) => void;

  constructor() {
    super();
    this.keydownHandler = this.handleKeyDown.bind(this);
    this.init();
  }

  /**
   * 初始化管理器
   */
  private init(): void {
    // 注册默认的系统级快捷键
    this.registerDefaultShortcuts();

    // 注册幕布风格快捷键
    this.registerMubuShortcuts();

    // 绑定全局键盘事件
    document.addEventListener('keydown', this.keydownHandler, true);

    // 监听焦点变化
    document.addEventListener('focusin', this.updateContext.bind(this));
    document.addEventListener('focusout', this.updateContext.bind(this));
  }

  /**
   * 注册默认快捷键
   */
  private registerDefaultShortcuts(): void {
    // 全局搜索 - Ctrl+K
    this.register({
      id: 'global-search',
      key: 'k',
      modifiers: { ctrl: true },
      description: '打开全局搜索',
      category: 'global',
      priority: 100,
      global: true,
      handler: (event) => {
        // 检查是否在输入框中
        const target = event.target as HTMLElement;
        if (this.isInputElement(target)) {
          return false; // 不处理，让输入框处理
        }
        
        this.emit('global-search-open');
        return true;
      },
      preventDefault: true
    });

    // 关闭模态框 - Escape
    this.register({
      id: 'close-modal',
      key: 'Escape',
      modifiers: {},
      description: '关闭模态框/弹窗',
      category: 'modal',
      priority: 90,
      global: true,
      handler: (event) => {
        // 检查是否有模态框打开
        const modal = document.querySelector('[role="dialog"][aria-modal="true"]');
        if (modal) {
          this.emit('modal-close', { modal });
          return true;
        }
        
        // 检查是否有其他可关闭的元素
        const closeable = document.querySelector('[data-closeable="true"]');
        if (closeable) {
          this.emit('closeable-close', { element: closeable });
          return true;
        }
        
        return false;
      },
      preventDefault: true
    });

    // 快速保存 - Ctrl+S
    this.register({
      id: 'quick-save',
      key: 's',
      modifiers: { ctrl: true },
      description: '快速保存',
      category: 'global',
      priority: 80,
      global: true,
      handler: (event) => {
        this.emit('quick-save');
        return true;
      },
      preventDefault: true
    });

    // 撤销 - Ctrl+Z
    this.register({
      id: 'undo',
      key: 'z',
      modifiers: { ctrl: true },
      description: '撤销',
      category: 'editing',
      priority: 70,
      global: true,
      handler: (event) => {
        if (this.isInputElement(event.target as HTMLElement)) {
          return false; // 让输入框处理
        }
        
        this.emit('undo');
        return true;
      },
      preventDefault: true
    });

    // 重做 - Ctrl+Y 或 Ctrl+Shift+Z
    this.register({
      id: 'redo',
      key: 'y',
      modifiers: { ctrl: true },
      description: '重做',
      category: 'editing',
      priority: 70,
      global: true,
      handler: (event) => {
        if (this.isInputElement(event.target as HTMLElement)) {
          return false;
        }
        
        this.emit('redo');
        return true;
      },
      preventDefault: true
    });

    // 新建 - Ctrl+N
    this.register({
      id: 'new-document',
      key: 'n',
      modifiers: { ctrl: true },
      description: '新建文档',
      category: 'global',
      priority: 60,
      global: true,
      handler: (event) => {
        this.emit('new-document');
        return true;
      },
      preventDefault: true
    });

    // 打开 - Ctrl+O
    this.register({
      id: 'open-document',
      key: 'o',
      modifiers: { ctrl: true },
      description: '打开文档',
      category: 'global',
      priority: 60,
      global: true,
      handler: (event) => {
        this.emit('open-document');
        return true;
      },
      preventDefault: true
    });

    // 查找 - Ctrl+F
    this.register({
      id: 'find-in-page',
      key: 'f',
      modifiers: { ctrl: true },
      description: '页面内查找',
      category: 'search',
      priority: 50,
      global: true,
      handler: (event) => {
        if (this.isInputElement(event.target as HTMLElement)) {
          return false;
        }
        
        this.emit('find-in-page');
        return true;
      },
      preventDefault: true
    });

    // 帮助 - F1
    this.register({
      id: 'help',
      key: 'F1',
      modifiers: {},
      description: '打开帮助',
      category: 'global',
      priority: 40,
      global: true,
      handler: (event) => {
        this.emit('help-open');
        return true;
      },
      preventDefault: true
    });

    // 设置 - Ctrl+,
    this.register({
      id: 'settings',
      key: ',',
      modifiers: { ctrl: true },
      description: '打开设置',
      category: 'global',
      priority: 40,
      global: true,
      handler: (event) => {
        this.emit('settings-open');
        return true;
      },
      preventDefault: true
    });
  }

  /**
   * 注册幕布风格编辑器快捷键
   */
  registerMubuShortcuts(): void {
    // Tab - 增加缩进（仅在编辑器中）
    this.register({
      id: 'mubu-indent',
      key: 'Tab',
      modifiers: {},
      description: '增加块缩进',
      category: 'mubu',
      priority: 85,
      global: false,
      context: ['editor', 'block-editor'],
      handler: (event) => {
        const target = event.target as HTMLElement;
        if (this.isInBlockEditor(target)) {
          this.emit('mubu-indent');
          return true;
        }
        return false;
      },
      preventDefault: true
    });

    // Shift+Tab - 减少缩进（仅在编辑器中）
    this.register({
      id: 'mubu-outdent',
      key: 'Tab',
      modifiers: { shift: true },
      description: '减少块缩进',
      category: 'mubu',
      priority: 85,
      global: false,
      context: ['editor', 'block-editor'],
      handler: (event) => {
        const target = event.target as HTMLElement;
        if (this.isInBlockEditor(target)) {
          this.emit('mubu-outdent');
          return true;
        }
        return false;
      },
      preventDefault: true
    });

    // Ctrl+D - 复制当前块
    this.register({
      id: 'mubu-duplicate-block',
      key: 'd',
      modifiers: { ctrl: true },
      description: '复制当前块',
      category: 'mubu',
      priority: 75,
      global: false,
      context: ['editor', 'block-editor'],
      handler: (event) => {
        const target = event.target as HTMLElement;
        if (this.isInBlockEditor(target)) {
          this.emit('mubu-duplicate-block');
          return true;
        }
        return false;
      },
      preventDefault: true
    });

    // Ctrl+↑ - 向上移动块
    this.register({
      id: 'mubu-move-block-up',
      key: 'ArrowUp',
      modifiers: { ctrl: true },
      description: '向上移动块',
      category: 'mubu',
      priority: 75,
      global: false,
      context: ['editor', 'block-editor'],
      handler: (event) => {
        const target = event.target as HTMLElement;
        if (this.isInBlockEditor(target)) {
          this.emit('mubu-move-block-up');
          return true;
        }
        return false;
      },
      preventDefault: true
    });

    // Ctrl+↓ - 向下移动块
    this.register({
      id: 'mubu-move-block-down',
      key: 'ArrowDown',
      modifiers: { ctrl: true },
      description: '向下移动块',
      category: 'mubu',
      priority: 75,
      global: false,
      context: ['editor', 'block-editor'],
      handler: (event) => {
        const target = event.target as HTMLElement;
        if (this.isInBlockEditor(target)) {
          this.emit('mubu-move-block-down');
          return true;
        }
        return false;
      },
      preventDefault: true
    });

    // Ctrl+/ - 切换折叠
    this.register({
      id: 'mubu-toggle-collapse',
      key: '/',
      modifiers: { ctrl: true },
      description: '切换块折叠状态',
      category: 'mubu',
      priority: 75,
      global: false,
      context: ['editor', 'block-editor'],
      handler: (event) => {
        const target = event.target as HTMLElement;
        if (this.isInBlockEditor(target)) {
          this.emit('mubu-toggle-collapse');
          return true;
        }
        return false;
      },
      preventDefault: true
    });
  }

  /**
   * 检查是否在块编辑器中
   */
  private isInBlockEditor(element: HTMLElement): boolean {
    return element.closest('.minglog-editor, .mubu-block-editor, [data-slate-editor]') !== null;
  }

  /**
   * 注册快捷键
   */
  register(config: GlobalShortcutConfig): void {
    // 检查是否有冲突
    const conflictId = this.findConflict(config);
    if (conflictId) {
      console.warn(`快捷键冲突: ${config.id} 与 ${conflictId} 冲突`);
    }
    
    this.shortcuts.set(config.id, config);
    this.emit('shortcut-registered', config);
  }

  /**
   * 注销快捷键
   */
  unregister(id: string): void {
    const config = this.shortcuts.get(id);
    if (config) {
      this.shortcuts.delete(id);
      this.emit('shortcut-unregistered', config);
    }
  }

  /**
   * 处理键盘事件
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.isEnabled) {
      return;
    }

    // 更新上下文
    this.updateContext();

    // 查找匹配的快捷键
    const matchingShortcuts = this.findMatchingShortcuts(event);
    
    if (matchingShortcuts.length === 0) {
      return;
    }

    // 按优先级排序
    matchingShortcuts.sort((a, b) => b.priority - a.priority);

    // 执行第一个匹配的快捷键
    for (const shortcut of matchingShortcuts) {
      if (this.shouldExecuteShortcut(shortcut, event)) {
        const handled = shortcut.handler(event);
        
        if (handled !== false) {
          if (shortcut.preventDefault) {
            event.preventDefault();
          }
          if (shortcut.stopPropagation) {
            event.stopPropagation();
          }
          
          this.emit('shortcut-executed', { shortcut, event });
          break;
        }
      }
    }
  }

  /**
   * 查找匹配的快捷键
   */
  private findMatchingShortcuts(event: KeyboardEvent): GlobalShortcutConfig[] {
    const matching: GlobalShortcutConfig[] = [];

    for (const shortcut of this.shortcuts.values()) {
      if (this.isKeyMatch(event, shortcut)) {
        matching.push(shortcut);
      }
    }

    return matching;
  }

  /**
   * 检查按键是否匹配
   */
  private isKeyMatch(event: KeyboardEvent, shortcut: GlobalShortcutConfig): boolean {
    // 检查主键
    if (event.key !== shortcut.key) {
      return false;
    }

    // 检查修饰键
    const modifiers = shortcut.modifiers;
    if (!!event.ctrlKey !== !!modifiers.ctrl) return false;
    if (!!event.shiftKey !== !!modifiers.shift) return false;
    if (!!event.altKey !== !!modifiers.alt) return false;
    if (!!event.metaKey !== !!modifiers.meta) return false;

    return true;
  }

  /**
   * 检查是否应该执行快捷键
   */
  private shouldExecuteShortcut(shortcut: GlobalShortcutConfig, event: KeyboardEvent): boolean {
    // 检查上下文限制
    if (shortcut.context && shortcut.context.length > 0) {
      const currentContext = this.getCurrentContextString();
      if (!shortcut.context.includes(currentContext)) {
        return false;
      }
    }

    return true;
  }

  /**
   * 查找快捷键冲突
   */
  private findConflict(config: GlobalShortcutConfig): string | null {
    for (const [id, existing] of this.shortcuts) {
      if (id === config.id) continue;
      
      if (this.isShortcutConflict(config, existing)) {
        return id;
      }
    }
    
    return null;
  }

  /**
   * 检查快捷键是否冲突
   */
  private isShortcutConflict(a: GlobalShortcutConfig, b: GlobalShortcutConfig): boolean {
    if (a.key !== b.key) return false;
    
    const aModifiers = a.modifiers;
    const bModifiers = b.modifiers;
    
    return (
      !!aModifiers.ctrl === !!bModifiers.ctrl &&
      !!aModifiers.shift === !!bModifiers.shift &&
      !!aModifiers.alt === !!bModifiers.alt &&
      !!aModifiers.meta === !!bModifiers.meta
    );
  }

  /**
   * 检查是否为输入元素
   */
  private isInputElement(element: HTMLElement): boolean {
    if (!element) return false;
    
    const tagName = element.tagName.toLowerCase();
    return (
      tagName === 'input' ||
      tagName === 'textarea' ||
      element.contentEditable === 'true' ||
      element.hasAttribute('contenteditable')
    );
  }

  /**
   * 更新上下文信息
   */
  private updateContext(): void {
    const activeElement = document.activeElement as HTMLElement;
    
    this.context = {
      focusType: this.getFocusType(activeElement),
      hasModal: !!document.querySelector('[role="dialog"][aria-modal="true"]'),
      currentPath: window.location.pathname,
      activeModule: this.getActiveModule()
    };
  }

  /**
   * 获取焦点类型
   */
  private getFocusType(element: HTMLElement): ShortcutContext['focusType'] {
    if (!element) return 'none';
    
    const tagName = element.tagName.toLowerCase();
    if (tagName === 'input') return 'input';
    if (tagName === 'textarea') return 'textarea';
    if (tagName === 'button') return 'button';
    if (element.contentEditable === 'true') return 'editor';
    
    return 'none';
  }

  /**
   * 获取当前活动模块
   */
  private getActiveModule(): string {
    // 根据URL或DOM结构判断当前活动模块
    const path = window.location.pathname;
    if (path.includes('/mindmap')) return 'mindmap';
    if (path.includes('/notes')) return 'notes';
    if (path.includes('/tasks')) return 'tasks';
    if (path.includes('/graph')) return 'graph';
    
    return 'main';
  }

  /**
   * 获取当前上下文字符串
   */
  private getCurrentContextString(): string {
    return `${this.context.activeModule || 'main'}-${this.context.focusType || 'none'}`;
  }

  /**
   * 启用快捷键管理器
   */
  enable(): void {
    this.isEnabled = true;
  }

  /**
   * 禁用快捷键管理器
   */
  disable(): void {
    this.isEnabled = false;
  }

  /**
   * 获取所有快捷键
   */
  getAllShortcuts(): GlobalShortcutConfig[] {
    return Array.from(this.shortcuts.values());
  }

  /**
   * 获取快捷键帮助信息
   */
  getShortcutHelp(): { [category: string]: GlobalShortcutConfig[] } {
    const help: { [category: string]: GlobalShortcutConfig[] } = {};
    
    for (const shortcut of this.shortcuts.values()) {
      if (!help[shortcut.category]) {
        help[shortcut.category] = [];
      }
      help[shortcut.category].push(shortcut);
    }
    
    // 按优先级排序
    for (const category in help) {
      help[category].sort((a, b) => b.priority - a.priority);
    }
    
    return help;
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    document.removeEventListener('keydown', this.keydownHandler, true);
    document.removeEventListener('focusin', this.updateContext.bind(this));
    document.removeEventListener('focusout', this.updateContext.bind(this));
    this.shortcuts.clear();
    this.removeAllListeners();
  }
}

// 创建全局实例
export const globalShortcutManager = new GlobalShortcutManager();
