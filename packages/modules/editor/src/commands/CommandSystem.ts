/**
 * 增强的命令系统
 * 支持多种命令模式：斜杠命令、@命令、[[命令、+命令
 * 借鉴Notion、Logseq、幕布的优秀设计
 */

import type { EventBus } from '@minglog/core';
import type { BlockType } from '../types';

/**
 * 命令类型枚举
 */
export enum CommandType {
  SLASH = 'slash',        // /命令 - 块类型选择
  MENTION = 'mention',    // @命令 - 提及和链接
  LINK = 'link',         // [[命令 - 双向链接
  CREATE = 'create',     // +命令 - 快速创建
  SHORTCUT = 'shortcut'  // 快捷键命令
}

/**
 * 命令触发器接口
 */
export interface CommandTrigger {
  /** 触发字符 */
  trigger: string;
  /** 命令类型 */
  type: CommandType;
  /** 是否需要空格分隔 */
  requiresSpace?: boolean;
  /** 最小查询长度 */
  minQueryLength?: number;
}

/**
 * 命令项接口
 */
export interface CommandItem {
  /** 命令ID */
  id: string;
  /** 命令标题 */
  title: string;
  /** 命令描述 */
  description: string;
  /** 命令图标 */
  icon?: string;
  /** 命令分组 */
  group: string;
  /** 搜索关键词 */
  keywords: string[];
  /** 拼音关键词（支持中文搜索） */
  pinyin?: string[];
  /** 快捷键 */
  shortcut?: string;
  /** 命令处理函数 */
  handler: (context: CommandContext) => void | Promise<void>;
  /** 是否可用 */
  isEnabled?: (context: CommandContext) => boolean;
  /** 命令优先级（用于排序） */
  priority?: number;
}

/**
 * 命令上下文
 */
export interface CommandContext {
  /** 编辑器实例 */
  editor: any;
  /** 当前选择 */
  selection?: any;
  /** 触发位置 */
  position?: { x: number; y: number };
  /** 查询字符串 */
  query?: string;
  /** 额外数据 */
  data?: Record<string, any>;
}

/**
 * 命令搜索结果
 */
export interface CommandSearchResult {
  /** 匹配的命令 */
  commands: CommandItem[];
  /** 搜索统计 */
  stats: {
    total: number;
    filtered: number;
    searchTime: number;
  };
}

/**
 * 命令系统配置
 */
export interface CommandSystemConfig {
  /** 是否启用拼音搜索 */
  enablePinyinSearch: boolean;
  /** 是否启用模糊搜索 */
  enableFuzzySearch: boolean;
  /** 最大搜索结果数 */
  maxResults: number;
  /** 搜索防抖延迟 */
  searchDebounce: number;
  /** 是否显示快捷键提示 */
  showShortcuts: boolean;
  /** 是否记录使用频率 */
  trackUsage: boolean;
}

/**
 * 增强的命令系统类
 */
export class CommandSystem {
  private commands = new Map<string, CommandItem>();
  private triggers = new Map<string, CommandTrigger>();
  private usageStats = new Map<string, number>();
  private recentCommands: string[] = [];
  private eventBus: EventBus;
  private config: CommandSystemConfig;

  constructor(eventBus: EventBus, config: Partial<CommandSystemConfig> = {}) {
    this.eventBus = eventBus;
    this.config = {
      enablePinyinSearch: true,
      enableFuzzySearch: true,
      maxResults: 20,
      searchDebounce: 150,
      showShortcuts: true,
      trackUsage: true,
      ...config
    };

    this.initializeDefaultTriggers();
    this.initializeDefaultCommands();
  }

  /**
   * 初始化默认触发器
   */
  private initializeDefaultTriggers(): void {
    // 斜杠命令
    this.registerTrigger({
      trigger: '/',
      type: CommandType.SLASH,
      requiresSpace: false,
      minQueryLength: 0
    });

    // @命令
    this.registerTrigger({
      trigger: '@',
      type: CommandType.MENTION,
      requiresSpace: false,
      minQueryLength: 0
    });

    // [[命令
    this.registerTrigger({
      trigger: '[[',
      type: CommandType.LINK,
      requiresSpace: false,
      minQueryLength: 0
    });

    // +命令
    this.registerTrigger({
      trigger: '+',
      type: CommandType.CREATE,
      requiresSpace: false,
      minQueryLength: 0
    });
  }

  /**
   * 初始化默认命令
   */
  private initializeDefaultCommands(): void {
    // 基础块类型命令
    this.registerSlashCommands();
    this.registerMentionCommands();
    this.registerLinkCommands();
    this.registerCreateCommands();
  }

  /**
   * 注册斜杠命令
   */
  private registerSlashCommands(): void {
    const blockCommands: Array<Omit<CommandItem, 'handler'> & { blockType: BlockType }> = [
      {
        id: 'slash-text',
        title: '文本',
        description: '普通文本段落',
        icon: 'Type',
        group: '基础',
        keywords: ['text', 'paragraph', '文本', '段落'],
        pinyin: ['wenben', 'duanluo'],
        blockType: 'paragraph',
        priority: 10
      },
      {
        id: 'slash-heading1',
        title: '标题 1',
        description: '大标题',
        icon: 'Heading1',
        group: '基础',
        keywords: ['heading', 'h1', '标题', '大标题'],
        pinyin: ['biaoti', 'dabiaoti'],
        shortcut: 'Ctrl+Alt+1',
        blockType: 'heading-1',
        priority: 9
      },
      {
        id: 'slash-list',
        title: '项目符号列表',
        description: '创建项目符号列表',
        icon: 'List',
        group: '基础',
        keywords: ['list', 'bullet', '列表', '项目符号'],
        pinyin: ['liebiao', 'xiangmufuhao'],
        blockType: 'bulleted-list',
        priority: 8
      },
      {
        id: 'slash-todo',
        title: '待办事项',
        description: '创建待办事项列表',
        icon: 'CheckSquare',
        group: '基础',
        keywords: ['todo', 'task', 'checkbox', '待办', '任务'],
        pinyin: ['daiban', 'renwu'],
        shortcut: 'Ctrl+Shift+T',
        blockType: 'todo-list',
        priority: 7
      }
    ];

    blockCommands.forEach(cmd => {
      this.registerCommand({
        ...cmd,
        handler: (context: CommandContext) => {
          this.handleBlockTypeCommand(cmd.blockType, context);
        }
      });
    });
  }

  /**
   * 注册@命令
   */
  private registerMentionCommands(): void {
    this.registerCommand({
      id: 'mention-person',
      title: '提及用户',
      description: '提及团队成员',
      icon: 'User',
      group: '提及',
      keywords: ['person', 'user', 'member', '用户', '成员'],
      pinyin: ['yonghu', 'chengyuan'],
      handler: (context: CommandContext) => {
        this.handleMentionPerson(context);
      }
    });

    this.registerCommand({
      id: 'mention-page',
      title: '链接页面',
      description: '链接到其他页面',
      icon: 'FileText',
      group: '提及',
      keywords: ['page', 'link', '页面', '链接'],
      pinyin: ['yemian', 'lianjie'],
      handler: (context: CommandContext) => {
        this.handleMentionPage(context);
      }
    });

    this.registerCommand({
      id: 'mention-date',
      title: '插入日期',
      description: '插入日期和时间',
      icon: 'Calendar',
      group: '提及',
      keywords: ['date', 'time', 'calendar', '日期', '时间'],
      pinyin: ['riqi', 'shijian'],
      handler: (context: CommandContext) => {
        this.handleMentionDate(context);
      }
    });
  }

  /**
   * 注册[[命令
   */
  private registerLinkCommands(): void {
    this.registerCommand({
      id: 'link-page',
      title: '创建页面链接',
      description: '创建双向链接到页面',
      icon: 'Link',
      group: '链接',
      keywords: ['link', 'page', 'bidirectional', '链接', '页面', '双向'],
      pinyin: ['lianjie', 'yemian', 'shuangxiang'],
      handler: (context: CommandContext) => {
        this.handleCreatePageLink(context);
      }
    });
  }

  /**
   * 注册+命令
   */
  private registerCreateCommands(): void {
    this.registerCommand({
      id: 'create-subpage',
      title: '创建子页面',
      description: '在当前页面下创建子页面',
      icon: 'Plus',
      group: '创建',
      keywords: ['subpage', 'child', '子页面'],
      pinyin: ['ziyemian'],
      handler: (context: CommandContext) => {
        this.handleCreateSubpage(context);
      }
    });
  }

  /**
   * 注册触发器
   */
  registerTrigger(trigger: CommandTrigger): void {
    this.triggers.set(trigger.trigger, trigger);
  }

  /**
   * 注册命令
   */
  registerCommand(command: CommandItem): void {
    this.commands.set(command.id, command);
  }

  /**
   * 搜索命令
   */
  searchCommands(query: string, type?: CommandType): CommandSearchResult {
    const startTime = performance.now();
    const normalizedQuery = query.toLowerCase().trim();
    
    let filteredCommands = Array.from(this.commands.values());

    // 按类型过滤
    if (type) {
      // 这里可以根据命令的分组或其他属性来过滤
      // 暂时保留所有命令
    }

    // 搜索过滤
    if (normalizedQuery) {
      filteredCommands = filteredCommands.filter(cmd => {
        // 标题匹配
        if (cmd.title.toLowerCase().includes(normalizedQuery)) return true;
        
        // 描述匹配
        if (cmd.description.toLowerCase().includes(normalizedQuery)) return true;
        
        // 关键词匹配
        if (cmd.keywords.some(keyword => keyword.toLowerCase().includes(normalizedQuery))) return true;
        
        // 拼音匹配
        if (this.config.enablePinyinSearch && cmd.pinyin) {
          if (cmd.pinyin.some(py => py.includes(normalizedQuery))) return true;
        }

        return false;
      });
    }

    // 排序：优先级 > 使用频率 > 最近使用 > 字母顺序
    filteredCommands.sort((a, b) => {
      // 优先级排序
      const priorityA = a.priority || 0;
      const priorityB = b.priority || 0;
      if (priorityA !== priorityB) return priorityB - priorityA;

      // 使用频率排序
      const usageA = this.usageStats.get(a.id) || 0;
      const usageB = this.usageStats.get(b.id) || 0;
      if (usageA !== usageB) return usageB - usageA;

      // 最近使用排序
      const recentA = this.recentCommands.indexOf(a.id);
      const recentB = this.recentCommands.indexOf(b.id);
      if (recentA !== -1 && recentB !== -1) return recentA - recentB;
      if (recentA !== -1) return -1;
      if (recentB !== -1) return 1;

      // 字母顺序
      return a.title.localeCompare(b.title);
    });

    // 限制结果数量
    const results = filteredCommands.slice(0, this.config.maxResults);

    const searchTime = performance.now() - startTime;

    return {
      commands: results,
      stats: {
        total: this.commands.size,
        filtered: results.length,
        searchTime
      }
    };
  }

  /**
   * 执行命令
   */
  async executeCommand(commandId: string, context: CommandContext): Promise<void> {
    const command = this.commands.get(commandId);
    if (!command) {
      throw new Error(`Command ${commandId} not found`);
    }

    // 检查命令是否可用
    if (command.isEnabled && !command.isEnabled(context)) {
      throw new Error(`Command ${commandId} is not enabled`);
    }

    try {
      // 记录使用统计
      if (this.config.trackUsage) {
        this.recordUsage(commandId);
      }

      // 执行命令
      await command.handler(context);

      // 发送命令执行事件
      this.eventBus.emit('command:executed', {
        commandId,
        command: command.title,
        timestamp: Date.now()
      }, 'CommandSystem');

    } catch (error) {
      // 发送命令错误事件
      this.eventBus.emit('command:error', {
        commandId,
        error: error instanceof Error ? error.message : String(error),
        timestamp: Date.now()
      }, 'CommandSystem');

      throw error;
    }
  }

  /**
   * 记录使用统计
   */
  private recordUsage(commandId: string): void {
    const currentCount = this.usageStats.get(commandId) || 0;
    this.usageStats.set(commandId, currentCount + 1);

    // 更新最近使用列表
    const index = this.recentCommands.indexOf(commandId);
    if (index > -1) {
      this.recentCommands.splice(index, 1);
    }
    this.recentCommands.unshift(commandId);

    // 限制最近使用列表长度
    if (this.recentCommands.length > 20) {
      this.recentCommands = this.recentCommands.slice(0, 20);
    }
  }

  // 命令处理函数
  private handleBlockTypeCommand(blockType: BlockType, context: CommandContext): void {
    const { editor } = context;
    if (!editor) return;

    try {
      // 获取当前选择
      const { selection } = editor;
      if (!selection) return;

      // 获取当前块
      const [match] = editor.nodes({
        match: n => editor.isBlock(n),
        at: selection
      });

      if (match) {
        const [, path] = match;

        // 创建新的块属性
        const newProperties: Partial<any> = {
          type: blockType,
          updatedAt: new Date().toISOString()
        };

        // 根据块类型设置特定属性
        switch (blockType) {
          case 'todo-list':
            newProperties.checked = false;
            break;
          case 'bulleted-list':
          case 'numbered-list':
            newProperties.level = 1;
            break;
          case 'code':
            newProperties.language = 'javascript';
            break;
        }

        // 转换块类型
        editor.setNodes(newProperties, { at: path });

        // 发送事件
        this.eventBus.emit('block:converted', {
          blockType,
          path: path.toString(),
          timestamp: Date.now()
        }, 'CommandSystem');
      }
    } catch (error) {
      console.error('块类型转换失败:', error);
      throw error;
    }
  }

  private handleMentionPerson(context: CommandContext): void {
    const { editor } = context;
    if (!editor) return;

    // 插入用户提及占位符
    const mentionElement = {
      type: 'mention',
      mentionType: 'user',
      userId: '',
      displayName: '@用户',
      children: [{ text: '' }]
    };

    editor.insertNodes([mentionElement]);
    console.log('插入用户提及');
  }

  private handleMentionPage(context: CommandContext): void {
    const { editor } = context;
    if (!editor) return;

    // 插入页面链接占位符
    const linkElement = {
      type: 'page-link',
      pageId: '',
      pageName: '页面名称',
      children: [{ text: '[[页面名称]]' }]
    };

    editor.insertNodes([linkElement]);
    console.log('插入页面链接');
  }

  private handleMentionDate(context: CommandContext): void {
    const { editor } = context;
    if (!editor) return;

    // 插入当前日期
    const today = new Date().toLocaleDateString('zh-CN');
    editor.insertText(`@${today}`);
    console.log('插入日期:', today);
  }

  private handleCreatePageLink(context: CommandContext): void {
    const { editor, query } = context;
    if (!editor) return;

    // 创建双向链接
    const pageName = query || '新页面';
    const linkElement = {
      type: 'page-link',
      pageId: `page-${Date.now()}`,
      pageName,
      children: [{ text: `[[${pageName}]]` }]
    };

    editor.insertNodes([linkElement]);
    console.log('创建页面链接:', pageName);
  }

  private handleCreateSubpage(context: CommandContext): void {
    const { editor, query } = context;
    if (!editor) return;

    // 创建子页面引用
    const subpageName = query || '新子页面';
    const subpageElement = {
      type: 'subpage',
      name: subpageName,
      children: [{ text: `📄 ${subpageName}` }]
    };

    editor.insertNodes([subpageElement]);
    console.log('创建子页面:', subpageName);
  }

  /**
   * 获取使用统计
   */
  getUsageStats(): Map<string, number> {
    return new Map(this.usageStats);
  }

  /**
   * 获取最近使用的命令
   */
  getRecentCommands(): string[] {
    return [...this.recentCommands];
  }

  /**
   * 清除使用统计
   */
  clearUsageStats(): void {
    this.usageStats.clear();
    this.recentCommands = [];
  }
}
