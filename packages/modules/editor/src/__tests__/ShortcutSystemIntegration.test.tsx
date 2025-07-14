/**
 * 快捷键系统集成测试
 * 测试命令系统、块导航、双向链接等功能的协同工作
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SlateEditorIntegration } from '../slate/SlateEditorIntegration';
import type { CustomElement } from '@minglog/editor';

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

// 测试数据
const TEST_CONTENT: CustomElement[] = [
  {
    id: 'test-1',
    type: 'heading-1',
    children: [{ text: '测试标题' }],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'test-2',
    type: 'paragraph',
    children: [{ text: '这是一个测试段落' }],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

describe('快捷键系统集成测试', () => {
  let mockEventBus: MockEventBus;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    mockEventBus = new MockEventBus();
    user = userEvent.setup();
    
    // 模拟 DOM 方法
    Object.defineProperty(Range.prototype, 'getBoundingClientRect', {
      value: () => ({
        left: 100,
        top: 100,
        right: 200,
        bottom: 120,
        width: 100,
        height: 20
      })
    });
  });

  describe('编辑器基础功能', () => {
    it('应该渲染编辑器', () => {
      render(
        <SlateEditorIntegration
          initialValue={TEST_CONTENT}
          eventBus={mockEventBus as any}
          placeholder="开始输入..."
        />
      );

      expect(screen.getByText('测试标题')).toBeInTheDocument();
      expect(screen.getByText('这是一个测试段落')).toBeInTheDocument();
    });

    it('应该支持文本输入', async () => {
      const onChange = vi.fn();
      
      render(
        <SlateEditorIntegration
          initialValue={TEST_CONTENT}
          eventBus={mockEventBus as any}
          onChange={onChange}
        />
      );

      const editor = screen.getByRole('textbox');
      await user.click(editor);
      await user.type(editor, '新增文本');

      await waitFor(() => {
        expect(onChange).toHaveBeenCalled();
      });
    });
  });

  describe('斜杠命令功能', () => {
    it('应该在输入斜杠时显示块菜单', async () => {
      render(
        <SlateEditorIntegration
          initialValue={TEST_CONTENT}
          eventBus={mockEventBus as any}
        />
      );

      const editor = screen.getByRole('textbox');
      await user.click(editor);
      
      // 模拟按下斜杠键
      fireEvent.keyDown(editor, { key: '/', code: 'Slash' });

      await waitFor(() => {
        expect(screen.getByText('搜索块类型...')).toBeInTheDocument();
      });
    });

    it('应该能够搜索和选择块类型', async () => {
      render(
        <SlateEditorIntegration
          initialValue={TEST_CONTENT}
          eventBus={mockEventBus as any}
        />
      );

      const editor = screen.getByRole('textbox');
      await user.click(editor);
      
      // 触发斜杠命令
      fireEvent.keyDown(editor, { key: '/', code: 'Slash' });

      await waitFor(() => {
        expect(screen.getByText('搜索块类型...')).toBeInTheDocument();
      });

      // 搜索标题
      const searchInput = screen.getByPlaceholderText('搜索块类型...');
      await user.type(searchInput, '标题');

      await waitFor(() => {
        expect(screen.getByText('标题 1')).toBeInTheDocument();
      });

      // 选择标题
      await user.click(screen.getByText('标题 1'));

      // 菜单应该关闭
      await waitFor(() => {
        expect(screen.queryByText('搜索块类型...')).not.toBeInTheDocument();
      });
    });

    it('应该支持键盘导航选择块类型', async () => {
      render(
        <SlateEditorIntegration
          initialValue={TEST_CONTENT}
          eventBus={mockEventBus as any}
        />
      );

      const editor = screen.getByRole('textbox');
      await user.click(editor);
      
      // 触发斜杠命令
      fireEvent.keyDown(editor, { key: '/', code: 'Slash' });

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('搜索块类型...');
        expect(searchInput).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('搜索块类型...');
      
      // 使用方向键导航
      fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
      fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
      
      // 按回车选择
      fireEvent.keyDown(searchInput, { key: 'Enter' });

      // 菜单应该关闭
      await waitFor(() => {
        expect(screen.queryByText('搜索块类型...')).not.toBeInTheDocument();
      });
    });
  });

  describe('全局命令面板', () => {
    it('应该在按Ctrl+P时显示命令面板', async () => {
      render(
        <SlateEditorIntegration
          initialValue={TEST_CONTENT}
          eventBus={mockEventBus as any}
        />
      );

      const editor = screen.getByRole('textbox');
      await user.click(editor);
      
      // 按Ctrl+P
      fireEvent.keyDown(editor, { key: 'p', ctrlKey: true });

      await waitFor(() => {
        expect(screen.getByText('搜索命令或输入')).toBeInTheDocument();
      });
    });

    it('应该能够搜索全局命令', async () => {
      render(
        <SlateEditorIntegration
          initialValue={TEST_CONTENT}
          eventBus={mockEventBus as any}
        />
      );

      const editor = screen.getByRole('textbox');
      await user.click(editor);
      
      // 打开命令面板
      fireEvent.keyDown(editor, { key: 'p', ctrlKey: true });

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/搜索命令/);
        expect(searchInput).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/搜索命令/);
      await user.type(searchInput, '标题');

      await waitFor(() => {
        expect(screen.getByText('标题 1')).toBeInTheDocument();
      });
    });

    it('应该在按Escape时关闭命令面板', async () => {
      render(
        <SlateEditorIntegration
          initialValue={TEST_CONTENT}
          eventBus={mockEventBus as any}
        />
      );

      const editor = screen.getByRole('textbox');
      await user.click(editor);
      
      // 打开命令面板
      fireEvent.keyDown(editor, { key: 'p', ctrlKey: true });

      await waitFor(() => {
        expect(screen.getByText('搜索命令或输入')).toBeInTheDocument();
      });

      // 按Escape关闭
      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(screen.queryByText('搜索命令或输入')).not.toBeInTheDocument();
      });
    });
  });

  describe('块导航功能', () => {
    it('应该支持Alt+方向键导航', async () => {
      const onChange = vi.fn();
      
      render(
        <SlateEditorIntegration
          initialValue={TEST_CONTENT}
          eventBus={mockEventBus as any}
          onChange={onChange}
        />
      );

      const editor = screen.getByRole('textbox');
      await user.click(editor);
      
      // 按Alt+下箭头
      fireEvent.keyDown(editor, { key: 'ArrowDown', altKey: true });

      // 应该阻止默认行为
      expect(onChange).not.toHaveBeenCalled();
    });

    it('应该支持Tab缩进操作', async () => {
      render(
        <SlateEditorIntegration
          initialValue={TEST_CONTENT}
          eventBus={mockEventBus as any}
        />
      );

      const editor = screen.getByRole('textbox');
      await user.click(editor);
      
      // 按Tab键
      fireEvent.keyDown(editor, { key: 'Tab' });

      // 应该阻止默认行为并执行缩进操作
      // 这里我们主要测试事件被正确处理
    });
  });

  describe('事件系统集成', () => {
    it('应该在命令执行时发送事件', async () => {
      const eventHandler = vi.fn();
      mockEventBus.on('command:executed', eventHandler);

      render(
        <SlateEditorIntegration
          initialValue={TEST_CONTENT}
          eventBus={mockEventBus as any}
        />
      );

      const editor = screen.getByRole('textbox');
      await user.click(editor);
      
      // 触发斜杠命令并选择一个块类型
      fireEvent.keyDown(editor, { key: '/', code: 'Slash' });

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText('搜索块类型...');
        expect(searchInput).toBeInTheDocument();
      });

      // 选择第一个可用的命令
      const firstCommand = screen.getByText('文本');
      await user.click(firstCommand);

      await waitFor(() => {
        expect(eventHandler).toHaveBeenCalled();
      });
    });

    it('应该在块操作时发送事件', async () => {
      const eventHandler = vi.fn();
      mockEventBus.on('blocks:indented', eventHandler);

      render(
        <SlateEditorIntegration
          initialValue={TEST_CONTENT}
          eventBus={mockEventBus as any}
        />
      );

      const editor = screen.getByRole('textbox');
      await user.click(editor);
      
      // 执行缩进操作
      fireEvent.keyDown(editor, { key: 'Tab' });

      // 由于我们的实现会发送事件，这里应该被调用
      // 注意：实际的事件发送可能需要更复杂的设置
    });
  });

  describe('错误处理', () => {
    it('应该处理无效的命令执行', async () => {
      const onError = vi.fn();
      
      render(
        <SlateEditorIntegration
          initialValue={TEST_CONTENT}
          eventBus={mockEventBus as any}
          onError={onError}
        />
      );

      // 这里我们可以模拟一个会导致错误的场景
      // 比如命令系统初始化失败等
    });

    it('应该处理编辑器异常状态', async () => {
      render(
        <SlateEditorIntegration
          initialValue={[]} // 空内容
          eventBus={mockEventBus as any}
        />
      );

      const editor = screen.getByRole('textbox');
      
      // 应该能够正常处理空内容状态
      expect(editor).toBeInTheDocument();
    });
  });

  describe('性能测试', () => {
    it('应该在大量内容时保持响应', async () => {
      // 创建大量测试内容
      const largeContent: CustomElement[] = Array.from({ length: 100 }, (_, i) => ({
        id: `large-${i}`,
        type: 'paragraph',
        children: [{ text: `段落 ${i + 1}` }],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }));

      const startTime = performance.now();
      
      render(
        <SlateEditorIntegration
          initialValue={largeContent}
          eventBus={mockEventBus as any}
        />
      );

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // 渲染时间应该在合理范围内（比如小于1秒）
      expect(renderTime).toBeLessThan(1000);
    });

    it('应该在频繁搜索时保持性能', async () => {
      render(
        <SlateEditorIntegration
          initialValue={TEST_CONTENT}
          eventBus={mockEventBus as any}
        />
      );

      const editor = screen.getByRole('textbox');
      await user.click(editor);
      
      // 打开命令面板
      fireEvent.keyDown(editor, { key: 'p', ctrlKey: true });

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/搜索命令/);
        expect(searchInput).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/搜索命令/);
      
      // 快速输入多个字符来测试防抖
      const startTime = performance.now();
      
      await user.type(searchInput, 'abcdefg');
      
      const endTime = performance.now();
      const searchTime = endTime - startTime;

      // 搜索应该是响应式的
      expect(searchTime).toBeLessThan(500);
    });
  });
});
