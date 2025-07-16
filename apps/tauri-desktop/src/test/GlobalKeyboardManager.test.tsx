/**
 * 全局键盘管理器测试
 */

// import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import GlobalKeyboardManager from '../components/GlobalKeyboardManager';
import { globalShortcutManager } from '../services/GlobalShortcutManager';
import { keyboardNavigationManager } from '../services/KeyboardNavigationManager';

// Mock services
vi.mock('../services/GlobalShortcutManager', () => ({
  globalShortcutManager: {
    on: vi.fn(),
    off: vi.fn(),
    getShortcutHelp: vi.fn(() => ({
      global: [
        {
          id: 'global-search',
          key: 'k',
          modifiers: { ctrl: true },
          description: '打开全局搜索'
        }
      ]
    }))
  }
}));

vi.mock('../services/KeyboardNavigationManager', () => ({
  keyboardNavigationManager: {
    on: vi.fn(),
    off: vi.fn()
  }
}));

describe('GlobalKeyboardManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 基础渲染测试
  describe('基础渲染', () => {
    it('应该正确渲染子组件', () => {
      render(
        <GlobalKeyboardManager>
          <div data-testid="child">测试内容</div>
        </GlobalKeyboardManager>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('测试内容')).toBeInTheDocument();
    });

    it('应该应用键盘导航样式', () => {
      render(
        <GlobalKeyboardManager>
          <div>测试内容</div>
        </GlobalKeyboardManager>
      );

      // 检查样式是否被注入
      const styles = document.querySelector('style');
      expect(styles?.textContent).toContain('.keyboard-focus');
    });
  });

  // 快捷键管理测试
  describe('快捷键管理', () => {
    it('应该注册快捷键事件监听器', () => {
      render(
        <GlobalKeyboardManager enableShortcuts={true}>
          <div>测试内容</div>
        </GlobalKeyboardManager>
      );

      expect(globalShortcutManager.on).toHaveBeenCalledWith('global-search-open', expect.any(Function));
      expect(globalShortcutManager.on).toHaveBeenCalledWith('modal-close', expect.any(Function));
      expect(globalShortcutManager.on).toHaveBeenCalledWith('quick-save', expect.any(Function));
    });

    it('应该在禁用快捷键时不注册监听器', () => {
      render(
        <GlobalKeyboardManager enableShortcuts={false}>
          <div>测试内容</div>
        </GlobalKeyboardManager>
      );

      expect(globalShortcutManager.on).not.toHaveBeenCalled();
    });

    it('应该在组件卸载时清理事件监听器', () => {
      const { unmount } = render(
        <GlobalKeyboardManager enableShortcuts={true}>
          <div>测试内容</div>
        </GlobalKeyboardManager>
      );

      unmount();

      expect(globalShortcutManager.off).toHaveBeenCalledWith('global-search-open', expect.any(Function));
      expect(globalShortcutManager.off).toHaveBeenCalledWith('modal-close', expect.any(Function));
    });
  });

  // 键盘导航测试
  describe('键盘导航', () => {
    it('应该注册导航事件监听器', () => {
      render(
        <GlobalKeyboardManager enableNavigation={true}>
          <div>测试内容</div>
        </GlobalKeyboardManager>
      );

      expect(keyboardNavigationManager.on).toHaveBeenCalledWith('element-activated', expect.any(Function));
    });

    it('应该在禁用导航时不注册监听器', () => {
      render(
        <GlobalKeyboardManager enableNavigation={false}>
          <div>测试内容</div>
        </GlobalKeyboardManager>
      );

      expect(keyboardNavigationManager.on).not.toHaveBeenCalled();
    });
  });

  // 快捷键帮助测试
  describe('快捷键帮助', () => {
    it('应该在按F1时显示帮助对话框', async () => {
      render(
        <GlobalKeyboardManager showShortcutHelp={true}>
          <div>测试内容</div>
        </GlobalKeyboardManager>
      );

      fireEvent.keyDown(document, { key: 'F1' });

      await waitFor(() => {
        expect(screen.getByText('键盘快捷键')).toBeInTheDocument();
      });
    });

    it('应该在按Shift+?时显示帮助对话框', async () => {
      render(
        <GlobalKeyboardManager showShortcutHelp={true}>
          <div>测试内容</div>
        </GlobalKeyboardManager>
      );

      fireEvent.keyDown(document, { key: '?', shiftKey: true });

      await waitFor(() => {
        expect(screen.getByText('键盘快捷键')).toBeInTheDocument();
      });
    });

    it('应该显示快捷键列表', async () => {
      render(
        <GlobalKeyboardManager showShortcutHelp={true}>
          <div>测试内容</div>
        </GlobalKeyboardManager>
      );

      fireEvent.keyDown(document, { key: 'F1' });

      await waitFor(() => {
        expect(screen.getByText('打开全局搜索')).toBeInTheDocument();
        expect(screen.getByText('Ctrl + k')).toBeInTheDocument();
      });
    });

    it('应该能够关闭帮助对话框', async () => {
      render(
        <GlobalKeyboardManager showShortcutHelp={true}>
          <div>测试内容</div>
        </GlobalKeyboardManager>
      );

      // 打开帮助对话框
      fireEvent.keyDown(document, { key: 'F1' });

      await waitFor(() => {
        expect(screen.getByText('键盘快捷键')).toBeInTheDocument();
      });

      // 点击关闭按钮
      const closeButton = screen.getByRole('button');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('键盘快捷键')).not.toBeInTheDocument();
      });
    });

    it('应该在禁用帮助时不显示对话框', () => {
      render(
        <GlobalKeyboardManager showShortcutHelp={false}>
          <div>测试内容</div>
        </GlobalKeyboardManager>
      );

      fireEvent.keyDown(document, { key: 'F1' });

      expect(screen.queryByText('键盘快捷键')).not.toBeInTheDocument();
    });
  });

  // 自定义事件处理测试
  describe('自定义事件处理', () => {
    it('应该处理全局搜索事件', () => {
      const mockSearchTrigger = document.createElement('button');
      mockSearchTrigger.setAttribute('data-search-trigger', '');
      mockSearchTrigger.click = vi.fn();
      document.body.appendChild(mockSearchTrigger);

      render(
        <GlobalKeyboardManager>
          <div>测试内容</div>
        </GlobalKeyboardManager>
      );

      // 触发全局搜索事件
      const event = new CustomEvent('global-search-open');
      document.dispatchEvent(event);

      expect(mockSearchTrigger.click).toHaveBeenCalled();

      document.body.removeChild(mockSearchTrigger);
    });

    it('应该处理快速保存事件', () => {
      const mockSaveButton = document.createElement('button');
      mockSaveButton.setAttribute('data-save-trigger', '');
      mockSaveButton.click = vi.fn();
      document.body.appendChild(mockSaveButton);

      render(
        <GlobalKeyboardManager>
          <div>测试内容</div>
        </GlobalKeyboardManager>
      );

      // 触发快速保存事件
      const event = new CustomEvent('quick-save');
      document.dispatchEvent(event);

      expect(mockSaveButton.click).toHaveBeenCalled();

      document.body.removeChild(mockSaveButton);
    });

    it('应该处理撤销事件', () => {
      const mockUndoButton = document.createElement('button');
      mockUndoButton.setAttribute('data-undo-trigger', '');
      mockUndoButton.click = vi.fn();
      document.body.appendChild(mockUndoButton);

      render(
        <GlobalKeyboardManager>
          <div>测试内容</div>
        </GlobalKeyboardManager>
      );

      // 触发撤销事件
      const event = new CustomEvent('undo');
      document.dispatchEvent(event);

      expect(mockUndoButton.click).toHaveBeenCalled();

      document.body.removeChild(mockUndoButton);
    });
  });

  // 配置选项测试
  describe('配置选项', () => {
    it('应该支持自定义帮助触发键', async () => {
      render(
        <GlobalKeyboardManager 
          showShortcutHelp={true}
          helpTriggerKey="h"
        >
          <div>测试内容</div>
        </GlobalKeyboardManager>
      );

      fireEvent.keyDown(document, { key: 'h' });

      await waitFor(() => {
        expect(screen.getByText('键盘快捷键')).toBeInTheDocument();
      });
    });

    it('应该支持禁用所有功能', () => {
      render(
        <GlobalKeyboardManager 
          enableShortcuts={false}
          enableNavigation={false}
          showShortcutHelp={false}
        >
          <div>测试内容</div>
        </GlobalKeyboardManager>
      );

      expect(globalShortcutManager.on).not.toHaveBeenCalled();
      expect(keyboardNavigationManager.on).not.toHaveBeenCalled();

      fireEvent.keyDown(document, { key: 'F1' });
      expect(screen.queryByText('键盘快捷键')).not.toBeInTheDocument();
    });
  });

  // 错误处理测试
  describe('错误处理', () => {
    it('应该在没有搜索触发器时优雅处理', () => {
      render(
        <GlobalKeyboardManager>
          <div>测试内容</div>
        </GlobalKeyboardManager>
      );

      // 确保没有搜索触发器
      const searchTrigger = document.querySelector('[data-search-trigger]');
      expect(searchTrigger).toBeNull();

      // 触发搜索事件不应该报错
      expect(() => {
        const event = new CustomEvent('global-search-open');
        document.dispatchEvent(event);
      }).not.toThrow();
    });

    it('应该在没有保存按钮时优雅处理', () => {
      render(
        <GlobalKeyboardManager>
          <div>测试内容</div>
        </GlobalKeyboardManager>
      );

      // 触发保存事件不应该报错
      expect(() => {
        const event = new CustomEvent('quick-save');
        document.dispatchEvent(event);
      }).not.toThrow();
    });
  });

  // 性能测试
  describe('性能测试', () => {
    it('应该快速初始化', () => {
      const startTime = performance.now();

      render(
        <GlobalKeyboardManager>
          <div>测试内容</div>
        </GlobalKeyboardManager>
      );

      const endTime = performance.now();
      const initTime = endTime - startTime;

      // 初始化时间应该小于50ms
      expect(initTime).toBeLessThan(50);
    });

    it('应该快速响应键盘事件', async () => {
      render(
        <GlobalKeyboardManager showShortcutHelp={true}>
          <div>测试内容</div>
        </GlobalKeyboardManager>
      );

      const startTime = performance.now();

      fireEvent.keyDown(document, { key: 'F1' });

      await waitFor(() => {
        expect(screen.getByText('键盘快捷键')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const responseTime = endTime - startTime;

      // 响应时间应该小于100ms
      expect(responseTime).toBeLessThan(100);
    });
  });
});
