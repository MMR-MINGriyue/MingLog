/**
 * 块编辑器组件测试
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BlockEditor } from './BlockEditor';
import type { CustomElement } from '@minglog/editor';

// Mock @minglog/editor
vi.mock('@minglog/editor', () => ({
  BlockEditor: ({ value, onChange, readOnly, placeholder, className, style }: any) => (
    <div
      data-testid="base-block-editor"
      className={className}
      style={style}
    >
      <textarea
        data-testid="editor-textarea"
        value={value?.[0]?.children?.[0]?.text || ''}
        onChange={(e) => {
          const newValue = [{
            type: 'paragraph',
            children: [{ text: e.target.value }]
          }];
          onChange?.(newValue);
        }}
        readOnly={readOnly}
        placeholder={placeholder}
      />
    </div>
  )
}));

describe('BlockEditor', () => {
  const mockOnChange = vi.fn();
  const mockOnSave = vi.fn();
  const mockOnError = vi.fn();

  const defaultProps = {
    onChange: mockOnChange,
    onSave: mockOnSave,
    onError: mockOnError
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('基础渲染', () => {
    it('应该正确渲染编辑器', () => {
      render(<BlockEditor {...defaultProps} />);
      
      expect(screen.getByTestId('base-block-editor')).toBeInTheDocument();
      expect(screen.getByTestId('editor-textarea')).toBeInTheDocument();
      expect(screen.getByText('💾 保存')).toBeInTheDocument();
    });

    it('应该显示占位符文本', () => {
      const placeholder = '请输入内容...';
      render(<BlockEditor {...defaultProps} placeholder={placeholder} />);
      
      expect(screen.getByPlaceholderText(placeholder)).toBeInTheDocument();
    });

    it('应该应用自定义样式和类名', () => {
      const className = 'custom-editor';
      const style = { backgroundColor: 'red' };
      
      render(
        <BlockEditor 
          {...defaultProps} 
          className={className}
          style={style}
        />
      );
      
      const editor = screen.getByTestId('base-block-editor');
      expect(editor).toHaveClass('minglog-block-editor');
      expect(editor).toHaveClass(className);
      expect(editor).toHaveStyle({ backgroundColor: 'red' });
    });
  });

  describe('内容编辑', () => {
    it('应该处理内容变更', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<BlockEditor {...defaultProps} />);
      
      const textarea = screen.getByTestId('editor-textarea');
      await user.type(textarea, '测试内容');
      
      expect(mockOnChange).toHaveBeenCalledWith([{
        type: 'paragraph',
        children: [{ text: '测试内容' }]
      }]);
    });

    it('应该显示未保存状态', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<BlockEditor {...defaultProps} />);
      
      const textarea = screen.getByTestId('editor-textarea');
      await user.type(textarea, '测试');
      
      expect(screen.getByText('● 有未保存的更改')).toBeInTheDocument();
    });

    it('应该在只读模式下禁用编辑', () => {
      render(<BlockEditor {...defaultProps} readOnly />);
      
      const textarea = screen.getByTestId('editor-textarea');
      expect(textarea).toHaveAttribute('readonly');
      expect(screen.queryByText('💾 保存')).not.toBeInTheDocument();
    });
  });

  describe('自动保存功能', () => {
    it('应该在指定时间后自动保存', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      mockOnSave.mockResolvedValue(undefined);
      
      render(<BlockEditor {...defaultProps} autoSaveInterval={5000} />);
      
      const textarea = screen.getByTestId('editor-textarea');
      await user.type(textarea, '测试内容');
      
      // 快进5秒
      vi.advanceTimersByTime(5000);
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith([{
          type: 'paragraph',
          children: [{ text: '测试内容' }]
        }]);
      });
    });

    it('应该在自动保存成功后更新状态', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      mockOnSave.mockResolvedValue(undefined);
      
      render(<BlockEditor {...defaultProps} autoSaveInterval={1000} />);
      
      const textarea = screen.getByTestId('editor-textarea');
      await user.type(textarea, '测试');
      
      vi.advanceTimersByTime(1000);
      
      await waitFor(() => {
        expect(screen.getByText(/✅ 已保存/)).toBeInTheDocument();
      });
    });

    it('应该在自动保存失败时显示错误', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      const error = new Error('保存失败');
      mockOnSave.mockRejectedValue(error);
      
      render(<BlockEditor {...defaultProps} autoSaveInterval={1000} />);
      
      const textarea = screen.getByTestId('editor-textarea');
      await user.type(textarea, '测试');
      
      vi.advanceTimersByTime(1000);
      
      await waitFor(() => {
        expect(screen.getByText('❌ 保存失败')).toBeInTheDocument();
        expect(mockOnError).toHaveBeenCalledWith(error);
      });
    });

    it('应该在禁用自动保存时不自动保存', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      
      render(<BlockEditor {...defaultProps} autoSave={false} />);
      
      const textarea = screen.getByTestId('editor-textarea');
      await user.type(textarea, '测试');
      
      vi.advanceTimersByTime(30000);
      
      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });

  describe('手动保存', () => {
    it('应该能够手动保存', async () => {
      const user = userEvent.setup();
      mockOnSave.mockResolvedValue(undefined);
      
      render(<BlockEditor {...defaultProps} />);
      
      const textarea = screen.getByTestId('editor-textarea');
      await user.type(textarea, '测试内容');
      
      const saveButton = screen.getByText('💾 保存');
      await user.click(saveButton);
      
      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalledWith([{
          type: 'paragraph',
          children: [{ text: '测试内容' }]
        }]);
      });
    });

    it('应该在没有更改时禁用保存按钮', () => {
      render(<BlockEditor {...defaultProps} />);
      
      const saveButton = screen.getByText('💾 保存');
      expect(saveButton).toBeDisabled();
    });

    it('应该在保存过程中禁用保存按钮', async () => {
      const user = userEvent.setup();
      let resolvePromise: (value: any) => void;
      const savePromise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      mockOnSave.mockReturnValue(savePromise);
      
      render(<BlockEditor {...defaultProps} />);
      
      const textarea = screen.getByTestId('editor-textarea');
      await user.type(textarea, '测试');
      
      const saveButton = screen.getByText('💾 保存');
      await user.click(saveButton);
      
      expect(saveButton).toBeDisabled();
      expect(screen.getByText('💾 正在保存...')).toBeInTheDocument();
      
      // 完成保存
      resolvePromise!(undefined);
      
      await waitFor(() => {
        expect(screen.getByText(/✅ 已保存/)).toBeInTheDocument();
      });
    });
  });

  describe('编辑器信息', () => {
    it('应该显示字数统计', async () => {
      const user = userEvent.setup();
      render(<BlockEditor {...defaultProps} />);
      
      const textarea = screen.getByTestId('editor-textarea');
      await user.type(textarea, '测试内容');
      
      expect(screen.getByText('字数: 4')).toBeInTheDocument();
    });

    it('应该显示块数统计', () => {
      render(<BlockEditor {...defaultProps} />);
      
      expect(screen.getByText('块数: 1')).toBeInTheDocument();
    });
  });

  describe('初始值', () => {
    it('应该使用提供的初始值', () => {
      const initialValue: CustomElement[] = [{
        type: 'paragraph',
        children: [{ text: '初始内容' }]
      }];
      
      render(<BlockEditor {...defaultProps} initialValue={initialValue} />);
      
      const textarea = screen.getByTestId('editor-textarea');
      expect(textarea).toHaveValue('初始内容');
    });

    it('应该使用默认值当没有提供初始值时', () => {
      render(<BlockEditor {...defaultProps} />);
      
      const textarea = screen.getByTestId('editor-textarea');
      expect(textarea).toHaveValue('');
    });
  });

  describe('事件发送', () => {
    it('应该在内容变更时发送事件', async () => {
      const user = userEvent.setup();
      const mockDispatchEvent = vi.fn();
      Object.defineProperty(window, 'dispatchEvent', {
        value: mockDispatchEvent,
        writable: true
      });
      
      render(<BlockEditor {...defaultProps} editorId="test-editor" />);
      
      const textarea = screen.getByTestId('editor-textarea');
      await user.type(textarea, '测试');
      
      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'editor:content:changed',
          detail: expect.objectContaining({
            editorId: 'test-editor'
          })
        })
      );
    });
  });
});
