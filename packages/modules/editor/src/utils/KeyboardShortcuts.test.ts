/**
 * 键盘快捷键系统测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { KeyboardShortcuts, createKeyboardShortcuts, type ShortcutHandlers } from './KeyboardShortcuts';

describe('KeyboardShortcuts', () => {
  let shortcuts: KeyboardShortcuts;
  let mockHandlers: ShortcutHandlers;

  beforeEach(() => {
    mockHandlers = {
      onFormat: vi.fn(),
      onBlockFormat: vi.fn(),
      onInsertLink: vi.fn(),
      onSave: vi.fn(),
      onUndo: vi.fn(),
      onRedo: vi.fn(),
      onFind: vi.fn(),
      onReplace: vi.fn()
    };

    shortcuts = createKeyboardShortcuts(mockHandlers);
  });

  describe('基础功能', () => {
    it('应该正确创建快捷键管理器', () => {
      expect(shortcuts).toBeInstanceOf(KeyboardShortcuts);
      expect(shortcuts.getAllShortcuts().length).toBeGreaterThan(0);
    });

    it('应该默认启用快捷键', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'b',
        ctrlKey: true
      });

      const handled = shortcuts.handleKeyDown(event);
      expect(handled).toBe(true);
      expect(mockHandlers.onFormat).toHaveBeenCalledWith('bold');
    });

    it('应该能够禁用快捷键', () => {
      shortcuts.disable();

      const event = new KeyboardEvent('keydown', {
        key: 'b',
        ctrlKey: true
      });

      const handled = shortcuts.handleKeyDown(event);
      expect(handled).toBe(false);
      expect(mockHandlers.onFormat).not.toHaveBeenCalled();
    });

    it('应该能够重新启用快捷键', () => {
      shortcuts.disable();
      shortcuts.enable();

      const event = new KeyboardEvent('keydown', {
        key: 'b',
        ctrlKey: true
      });

      const handled = shortcuts.handleKeyDown(event);
      expect(handled).toBe(true);
      expect(mockHandlers.onFormat).toHaveBeenCalledWith('bold');
    });
  });

  describe('文本格式化快捷键', () => {
    it('应该处理粗体快捷键 (Ctrl+B)', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'b',
        ctrlKey: true
      });

      const handled = shortcuts.handleKeyDown(event);
      expect(handled).toBe(true);
      expect(mockHandlers.onFormat).toHaveBeenCalledWith('bold');
    });

    it('应该处理斜体快捷键 (Ctrl+I)', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'i',
        ctrlKey: true
      });

      const handled = shortcuts.handleKeyDown(event);
      expect(handled).toBe(true);
      expect(mockHandlers.onFormat).toHaveBeenCalledWith('italic');
    });

    it('应该处理下划线快捷键 (Ctrl+U)', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'u',
        ctrlKey: true
      });

      const handled = shortcuts.handleKeyDown(event);
      expect(handled).toBe(true);
      expect(mockHandlers.onFormat).toHaveBeenCalledWith('underline');
    });

    it('应该处理删除线快捷键 (Ctrl+Shift+X)', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'x',
        ctrlKey: true,
        shiftKey: true
      });

      const handled = shortcuts.handleKeyDown(event);
      expect(handled).toBe(true);
      expect(mockHandlers.onFormat).toHaveBeenCalledWith('strikethrough');
    });

    it('应该处理行内代码快捷键 (Ctrl+`)', () => {
      const event = new KeyboardEvent('keydown', {
        key: '`',
        ctrlKey: true
      });

      const handled = shortcuts.handleKeyDown(event);
      expect(handled).toBe(true);
      expect(mockHandlers.onFormat).toHaveBeenCalledWith('code');
    });

    it('应该处理高亮快捷键 (Ctrl+Shift+H)', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'h',
        ctrlKey: true,
        shiftKey: true
      });

      const handled = shortcuts.handleKeyDown(event);
      expect(handled).toBe(true);
      expect(mockHandlers.onFormat).toHaveBeenCalledWith('highlight');
    });
  });

  describe('块格式化快捷键', () => {
    it('应该处理一级标题快捷键 (Ctrl+Alt+1)', () => {
      const event = new KeyboardEvent('keydown', {
        key: '1',
        ctrlKey: true,
        altKey: true
      });

      const handled = shortcuts.handleKeyDown(event);
      expect(handled).toBe(true);
      expect(mockHandlers.onBlockFormat).toHaveBeenCalledWith('heading-1');
    });

    it('应该处理二级标题快捷键 (Ctrl+Alt+2)', () => {
      const event = new KeyboardEvent('keydown', {
        key: '2',
        ctrlKey: true,
        altKey: true
      });

      const handled = shortcuts.handleKeyDown(event);
      expect(handled).toBe(true);
      expect(mockHandlers.onBlockFormat).toHaveBeenCalledWith('heading-2');
    });

    it('应该处理无序列表快捷键 (Ctrl+Shift+8)', () => {
      const event = new KeyboardEvent('keydown', {
        key: '8',
        ctrlKey: true,
        shiftKey: true
      });

      const handled = shortcuts.handleKeyDown(event);
      expect(handled).toBe(true);
      expect(mockHandlers.onBlockFormat).toHaveBeenCalledWith('bulleted-list');
    });

    it('应该处理有序列表快捷键 (Ctrl+Shift+7)', () => {
      const event = new KeyboardEvent('keydown', {
        key: '7',
        ctrlKey: true,
        shiftKey: true
      });

      const handled = shortcuts.handleKeyDown(event);
      expect(handled).toBe(true);
      expect(mockHandlers.onBlockFormat).toHaveBeenCalledWith('numbered-list');
    });

    it('应该处理引用快捷键 (Ctrl+Shift+.)', () => {
      const event = new KeyboardEvent('keydown', {
        key: '.',
        ctrlKey: true,
        shiftKey: true
      });

      const handled = shortcuts.handleKeyDown(event);
      expect(handled).toBe(true);
      expect(mockHandlers.onBlockFormat).toHaveBeenCalledWith('quote');
    });
  });

  describe('插入操作快捷键', () => {
    it('应该处理插入链接快捷键 (Ctrl+K)', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'k',
        ctrlKey: true
      });

      const handled = shortcuts.handleKeyDown(event);
      expect(handled).toBe(true);
      expect(mockHandlers.onInsertLink).toHaveBeenCalled();
    });
  });

  describe('文档操作快捷键', () => {
    it('应该处理保存快捷键 (Ctrl+S)', () => {
      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true
      });

      const handled = shortcuts.handleKeyDown(event);
      expect(handled).toBe(true);
      expect(mockHandlers.onSave).toHaveBeenCalled();
    });
  });

  describe('历史操作快捷键', () => {
    it('应该处理撤销快捷键 (Ctrl+Z)', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'z',
        ctrlKey: true
      });

      const handled = shortcuts.handleKeyDown(event);
      expect(handled).toBe(true);
      expect(mockHandlers.onUndo).toHaveBeenCalled();
    });

    it('应该处理重做快捷键 (Ctrl+Y)', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'y',
        ctrlKey: true
      });

      const handled = shortcuts.handleKeyDown(event);
      expect(handled).toBe(true);
      expect(mockHandlers.onRedo).toHaveBeenCalled();
    });
  });

  describe('查找替换快捷键', () => {
    it('应该处理查找快捷键 (Ctrl+F)', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'f',
        ctrlKey: true
      });

      const handled = shortcuts.handleKeyDown(event);
      expect(handled).toBe(true);
      expect(mockHandlers.onFind).toHaveBeenCalled();
    });

    it('应该处理替换快捷键 (Ctrl+H)', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'h',
        ctrlKey: true
      });

      const handled = shortcuts.handleKeyDown(event);
      expect(handled).toBe(true);
      expect(mockHandlers.onReplace).toHaveBeenCalled();
    });
  });

  describe('自定义快捷键', () => {
    it('应该能够注册自定义快捷键', () => {
      const customHandler = vi.fn();
      
      shortcuts.register({
        key: 'e',
        ctrl: true,
        description: '自定义操作',
        handler: customHandler
      });

      const event = new KeyboardEvent('keydown', {
        key: 'e',
        ctrlKey: true
      });

      const handled = shortcuts.handleKeyDown(event);
      expect(handled).toBe(true);
      expect(customHandler).toHaveBeenCalled();
    });

    it('应该能够注销快捷键', () => {
      shortcuts.unregister({
        key: 'b',
        ctrl: true
      });

      const event = new KeyboardEvent('keydown', {
        key: 'b',
        ctrlKey: true
      });

      const handled = shortcuts.handleKeyDown(event);
      expect(handled).toBe(false);
      expect(mockHandlers.onFormat).not.toHaveBeenCalled();
    });
  });

  describe('帮助功能', () => {
    it('应该生成帮助文本', () => {
      const helpText = shortcuts.getHelpText();
      
      expect(helpText).toContain('# 键盘快捷键');
      expect(helpText).toContain('文本格式');
      expect(helpText).toContain('Ctrl + B');
      expect(helpText).toContain('粗体');
    });

    it('应该正确分组快捷键', () => {
      const allShortcuts = shortcuts.getAllShortcuts();
      expect(allShortcuts.length).toBeGreaterThan(10);
      
      const helpText = shortcuts.getHelpText();
      expect(helpText).toContain('## 文本格式');
      expect(helpText).toContain('## 块格式');
      expect(helpText).toContain('## 文档操作');
    });
  });

  describe('边界情况', () => {
    it('应该忽略不匹配的快捷键', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'x',
        ctrlKey: true
      });

      const handled = shortcuts.handleKeyDown(event);
      expect(handled).toBe(false);
    });

    it('应该正确处理大小写', () => {
      const event = new KeyboardEvent('keydown', {
        key: 'B', // 大写
        ctrlKey: true
      });

      const handled = shortcuts.handleKeyDown(event);
      expect(handled).toBe(true);
      expect(mockHandlers.onFormat).toHaveBeenCalledWith('bold');
    });

    it('应该处理没有可选处理器的情况', () => {
      const minimalHandlers: ShortcutHandlers = {
        onFormat: vi.fn(),
        onBlockFormat: vi.fn(),
        onInsertLink: vi.fn(),
        onSave: vi.fn()
      };

      const minimalShortcuts = createKeyboardShortcuts(minimalHandlers);
      
      // 应该不会因为缺少可选处理器而出错
      expect(minimalShortcuts.getAllShortcuts().length).toBeGreaterThan(0);
    });
  });
});
