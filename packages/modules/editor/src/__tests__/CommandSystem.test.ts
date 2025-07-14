/**
 * 命令系统单元测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CommandSystem, CommandType, CommandItem, CommandContext } from '../commands/CommandSystem';

// 模拟事件总线
class MockEventBus {
  private listeners = new Map<string, Function[]>();

  emit(type: string, data?: any, source?: string): void {
    const handlers = this.listeners.get(type) || [];
    handlers.forEach(handler => handler({ type, data, source, timestamp: Date.now() }));
  }

  on(type: string, handler: Function): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(handler);
  }

  off(type: string, handler: Function): void {
    const handlers = this.listeners.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }
}

describe('CommandSystem', () => {
  let commandSystem: CommandSystem;
  let mockEventBus: MockEventBus;

  beforeEach(() => {
    mockEventBus = new MockEventBus();
    commandSystem = new CommandSystem(mockEventBus as any);
  });

  describe('命令注册', () => {
    it('应该能够注册新命令', () => {
      const testCommand: CommandItem = {
        id: 'test-command',
        title: '测试命令',
        description: '这是一个测试命令',
        group: '测试',
        keywords: ['test', '测试'],
        handler: vi.fn()
      };

      commandSystem.registerCommand(testCommand);
      
      const results = commandSystem.searchCommands('测试');
      expect(results.commands).toHaveLength(1);
      expect(results.commands[0].id).toBe('test-command');
    });

    it('应该支持拼音搜索', () => {
      const testCommand: CommandItem = {
        id: 'heading-command',
        title: '标题',
        description: '创建标题',
        group: '基础',
        keywords: ['heading', '标题'],
        pinyin: ['biaoti'],
        handler: vi.fn()
      };

      commandSystem.registerCommand(testCommand);
      
      const results = commandSystem.searchCommands('bt');
      expect(results.commands).toHaveLength(1);
      expect(results.commands[0].id).toBe('heading-command');
    });
  });

  describe('命令搜索', () => {
    beforeEach(() => {
      // 注册测试命令
      const commands: CommandItem[] = [
        {
          id: 'heading-1',
          title: '标题 1',
          description: '创建一级标题',
          group: '基础',
          keywords: ['heading', 'h1', '标题'],
          pinyin: ['biaoti'],
          priority: 10,
          handler: vi.fn()
        },
        {
          id: 'paragraph',
          title: '段落',
          description: '创建段落',
          group: '基础',
          keywords: ['paragraph', '段落'],
          pinyin: ['duanluo'],
          priority: 8,
          handler: vi.fn()
        },
        {
          id: 'list',
          title: '列表',
          description: '创建列表',
          group: '基础',
          keywords: ['list', '列表'],
          pinyin: ['liebiao'],
          priority: 6,
          handler: vi.fn()
        }
      ];

      commands.forEach(cmd => commandSystem.registerCommand(cmd));
    });

    it('应该按优先级排序搜索结果', () => {
      const results = commandSystem.searchCommands('');
      expect(results.commands[0].id).toBe('heading-1'); // 最高优先级
      expect(results.commands[1].id).toBe('paragraph');
      expect(results.commands[2].id).toBe('list');
    });

    it('应该支持关键词搜索', () => {
      const results = commandSystem.searchCommands('标题');
      expect(results.commands).toHaveLength(1);
      expect(results.commands[0].id).toBe('heading-1');
    });

    it('应该支持模糊搜索', () => {
      const results = commandSystem.searchCommands('h1');
      expect(results.commands).toHaveLength(1);
      expect(results.commands[0].id).toBe('heading-1');
    });

    it('应该限制搜索结果数量', () => {
      // 注册更多命令
      for (let i = 0; i < 30; i++) {
        commandSystem.registerCommand({
          id: `test-${i}`,
          title: `测试命令 ${i}`,
          description: '测试',
          group: '测试',
          keywords: ['test'],
          handler: vi.fn()
        });
      }

      const results = commandSystem.searchCommands('test');
      expect(results.commands.length).toBeLessThanOrEqual(20); // 默认最大20个
    });
  });

  describe('命令执行', () => {
    it('应该能够执行命令', async () => {
      const mockHandler = vi.fn();
      const testCommand: CommandItem = {
        id: 'test-command',
        title: '测试命令',
        description: '测试',
        group: '测试',
        keywords: ['test'],
        handler: mockHandler
      };

      commandSystem.registerCommand(testCommand);

      const context: CommandContext = {
        editor: null,
        selection: null,
        data: { test: true }
      };

      await commandSystem.executeCommand('test-command', context);
      
      expect(mockHandler).toHaveBeenCalledWith(context);
    });

    it('应该处理命令执行错误', async () => {
      const errorHandler = vi.fn();
      mockEventBus.on('command:error', errorHandler);

      const testCommand: CommandItem = {
        id: 'error-command',
        title: '错误命令',
        description: '会抛出错误的命令',
        group: '测试',
        keywords: ['error'],
        handler: () => {
          throw new Error('测试错误');
        }
      };

      commandSystem.registerCommand(testCommand);

      const context: CommandContext = {
        editor: null,
        selection: null
      };

      await expect(commandSystem.executeCommand('error-command', context))
        .rejects.toThrow('测试错误');
      
      expect(errorHandler).toHaveBeenCalled();
    });

    it('应该检查命令是否可用', async () => {
      const testCommand: CommandItem = {
        id: 'disabled-command',
        title: '禁用命令',
        description: '被禁用的命令',
        group: '测试',
        keywords: ['disabled'],
        handler: vi.fn(),
        isEnabled: () => false
      };

      commandSystem.registerCommand(testCommand);

      const context: CommandContext = {
        editor: null,
        selection: null
      };

      await expect(commandSystem.executeCommand('disabled-command', context))
        .rejects.toThrow('Command disabled-command is not enabled');
    });
  });

  describe('使用统计', () => {
    it('应该记录命令使用次数', async () => {
      const testCommand: CommandItem = {
        id: 'usage-command',
        title: '使用统计命令',
        description: '测试使用统计',
        group: '测试',
        keywords: ['usage'],
        handler: vi.fn()
      };

      commandSystem.registerCommand(testCommand);

      const context: CommandContext = {
        editor: null,
        selection: null
      };

      // 执行命令多次
      await commandSystem.executeCommand('usage-command', context);
      await commandSystem.executeCommand('usage-command', context);
      await commandSystem.executeCommand('usage-command', context);

      const stats = commandSystem.getUsageStats();
      expect(stats.get('usage-command')).toBe(3);
    });

    it('应该记录最近使用的命令', async () => {
      const commands = ['cmd1', 'cmd2', 'cmd3'].map(id => ({
        id,
        title: `命令 ${id}`,
        description: '测试',
        group: '测试',
        keywords: [id],
        handler: vi.fn()
      }));

      commands.forEach(cmd => commandSystem.registerCommand(cmd));

      const context: CommandContext = {
        editor: null,
        selection: null
      };

      // 按顺序执行命令
      for (const cmd of commands) {
        await commandSystem.executeCommand(cmd.id, context);
      }

      const recent = commandSystem.getRecentCommands();
      expect(recent).toEqual(['cmd3', 'cmd2', 'cmd1']); // 最近的在前面
    });

    it('应该能够清除使用统计', () => {
      // 先记录一些使用统计
      commandSystem['usageStats'].set('test-cmd', 5);
      commandSystem['recentCommands'] = ['test-cmd'];

      commandSystem.clearUsageStats();

      expect(commandSystem.getUsageStats().size).toBe(0);
      expect(commandSystem.getRecentCommands()).toHaveLength(0);
    });
  });

  describe('事件发送', () => {
    it('应该在命令执行时发送事件', async () => {
      const eventHandler = vi.fn();
      mockEventBus.on('command:executed', eventHandler);

      const testCommand: CommandItem = {
        id: 'event-command',
        title: '事件命令',
        description: '测试事件发送',
        group: '测试',
        keywords: ['event'],
        handler: vi.fn()
      };

      commandSystem.registerCommand(testCommand);

      const context: CommandContext = {
        editor: null,
        selection: null
      };

      await commandSystem.executeCommand('event-command', context);

      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            commandId: 'event-command',
            command: '事件命令'
          })
        })
      );
    });
  });

  describe('默认命令', () => {
    it('应该包含默认的斜杠命令', () => {
      const results = commandSystem.searchCommands('标题');
      expect(results.commands.length).toBeGreaterThan(0);
      
      const headingCommand = results.commands.find(cmd => cmd.id === 'slash-heading1');
      expect(headingCommand).toBeDefined();
      expect(headingCommand?.title).toBe('标题 1');
    });

    it('应该包含@命令', () => {
      const results = commandSystem.searchCommands('用户');
      expect(results.commands.length).toBeGreaterThan(0);
      
      const mentionCommand = results.commands.find(cmd => cmd.id === 'mention-person');
      expect(mentionCommand).toBeDefined();
    });

    it('应该包含[[命令', () => {
      const results = commandSystem.searchCommands('页面');
      expect(results.commands.length).toBeGreaterThan(0);
      
      const linkCommand = results.commands.find(cmd => cmd.id === 'link-page');
      expect(linkCommand).toBeDefined();
    });
  });
});
