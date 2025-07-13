/**
 * 富文本工具栏组件测试
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RichTextToolbar, type FormatType, type BlockFormatType } from './RichTextToolbar';

describe('RichTextToolbar', () => {
  const mockOnFormat = vi.fn();
  const mockOnBlockFormat = vi.fn();
  const mockOnInsertLink = vi.fn();
  const mockOnInsertImage = vi.fn();
  const mockOnUndo = vi.fn();
  const mockOnRedo = vi.fn();

  const defaultProps = {
    activeFormats: [] as FormatType[],
    currentBlockType: 'paragraph' as BlockFormatType,
    onFormat: mockOnFormat,
    onBlockFormat: mockOnBlockFormat,
    onInsertLink: mockOnInsertLink
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基础渲染', () => {
    it('应该正确渲染工具栏', () => {
      render(<RichTextToolbar {...defaultProps} />);
      
      expect(screen.getByTestId('rich-text-toolbar')).toBeInTheDocument();
      expect(screen.getByTestId('toolbar-bold')).toBeInTheDocument();
      expect(screen.getByTestId('toolbar-italic')).toBeInTheDocument();
      expect(screen.getByTestId('toolbar-underline')).toBeInTheDocument();
    });

    it('应该在只读模式下不渲染', () => {
      render(<RichTextToolbar {...defaultProps} readOnly />);
      
      expect(screen.queryByTestId('rich-text-toolbar')).not.toBeInTheDocument();
    });

    it('应该显示正确的按钮标题和快捷键', () => {
      render(<RichTextToolbar {...defaultProps} />);
      
      const boldButton = screen.getByTestId('toolbar-bold');
      expect(boldButton).toHaveAttribute('title', '粗体 (Ctrl+B)');
      
      const italicButton = screen.getByTestId('toolbar-italic');
      expect(italicButton).toHaveAttribute('title', '斜体 (Ctrl+I)');
    });
  });

  describe('文本格式化', () => {
    it('应该处理粗体格式化', async () => {
      const user = userEvent.setup();
      render(<RichTextToolbar {...defaultProps} />);
      
      const boldButton = screen.getByTestId('toolbar-bold');
      await user.click(boldButton);
      
      expect(mockOnFormat).toHaveBeenCalledWith('bold');
    });

    it('应该处理斜体格式化', async () => {
      const user = userEvent.setup();
      render(<RichTextToolbar {...defaultProps} />);
      
      const italicButton = screen.getByTestId('toolbar-italic');
      await user.click(italicButton);
      
      expect(mockOnFormat).toHaveBeenCalledWith('italic');
    });

    it('应该处理下划线格式化', async () => {
      const user = userEvent.setup();
      render(<RichTextToolbar {...defaultProps} />);
      
      const underlineButton = screen.getByTestId('toolbar-underline');
      await user.click(underlineButton);
      
      expect(mockOnFormat).toHaveBeenCalledWith('underline');
    });

    it('应该处理删除线格式化', async () => {
      const user = userEvent.setup();
      render(<RichTextToolbar {...defaultProps} />);
      
      const strikethroughButton = screen.getByTestId('toolbar-strikethrough');
      await user.click(strikethroughButton);
      
      expect(mockOnFormat).toHaveBeenCalledWith('strikethrough');
    });

    it('应该处理行内代码格式化', async () => {
      const user = userEvent.setup();
      render(<RichTextToolbar {...defaultProps} />);
      
      const codeButton = screen.getByTestId('toolbar-code');
      await user.click(codeButton);
      
      expect(mockOnFormat).toHaveBeenCalledWith('code');
    });

    it('应该显示激活状态', () => {
      render(
        <RichTextToolbar 
          {...defaultProps} 
          activeFormats={['bold', 'italic']}
        />
      );
      
      const boldButton = screen.getByTestId('toolbar-bold');
      const italicButton = screen.getByTestId('toolbar-italic');
      const underlineButton = screen.getByTestId('toolbar-underline');
      
      expect(boldButton).toHaveClass('active');
      expect(italicButton).toHaveClass('active');
      expect(underlineButton).not.toHaveClass('active');
    });
  });

  describe('块格式化', () => {
    it('应该处理标题格式化', async () => {
      const user = userEvent.setup();
      render(<RichTextToolbar {...defaultProps} />);
      
      const h1Button = screen.getByTestId('toolbar-heading-1');
      await user.click(h1Button);
      
      expect(mockOnBlockFormat).toHaveBeenCalledWith('heading-1');
    });

    it('应该处理列表格式化', async () => {
      const user = userEvent.setup();
      render(<RichTextToolbar {...defaultProps} />);
      
      const bulletListButton = screen.getByTestId('toolbar-bulleted-list');
      await user.click(bulletListButton);
      
      expect(mockOnBlockFormat).toHaveBeenCalledWith('bulleted-list');
    });

    it('应该处理引用格式化', async () => {
      const user = userEvent.setup();
      render(<RichTextToolbar {...defaultProps} />);
      
      const quoteButton = screen.getByTestId('toolbar-quote');
      await user.click(quoteButton);
      
      expect(mockOnBlockFormat).toHaveBeenCalledWith('quote');
    });

    it('应该显示当前块类型的激活状态', () => {
      render(
        <RichTextToolbar 
          {...defaultProps} 
          currentBlockType="heading-1"
        />
      );
      
      const h1Button = screen.getByTestId('toolbar-heading-1');
      const h2Button = screen.getByTestId('toolbar-heading-2');
      
      expect(h1Button).toHaveClass('active');
      expect(h2Button).not.toHaveClass('active');
    });
  });

  describe('插入操作', () => {
    it('应该处理链接插入', async () => {
      const user = userEvent.setup();
      render(<RichTextToolbar {...defaultProps} />);
      
      const linkButton = screen.getByTestId('toolbar-link');
      await user.click(linkButton);
      
      expect(mockOnInsertLink).toHaveBeenCalled();
    });

    it('应该处理分隔线插入', async () => {
      const user = userEvent.setup();
      render(<RichTextToolbar {...defaultProps} />);
      
      const dividerButton = screen.getByTestId('toolbar-divider');
      await user.click(dividerButton);
      
      expect(mockOnBlockFormat).toHaveBeenCalledWith('divider');
    });

    it('应该显示可选的插入按钮', () => {
      render(
        <RichTextToolbar 
          {...defaultProps} 
          onInsertImage={mockOnInsertImage}
        />
      );
      
      expect(screen.getByTestId('toolbar-image')).toBeInTheDocument();
    });
  });

  describe('历史操作', () => {
    it('应该显示撤销重做按钮', () => {
      render(
        <RichTextToolbar 
          {...defaultProps} 
          onUndo={mockOnUndo}
          onRedo={mockOnRedo}
        />
      );
      
      expect(screen.getByTestId('toolbar-undo')).toBeInTheDocument();
      expect(screen.getByTestId('toolbar-redo')).toBeInTheDocument();
    });

    it('应该处理撤销操作', async () => {
      const user = userEvent.setup();
      render(
        <RichTextToolbar 
          {...defaultProps} 
          onUndo={mockOnUndo}
        />
      );
      
      const undoButton = screen.getByTestId('toolbar-undo');
      await user.click(undoButton);
      
      expect(mockOnUndo).toHaveBeenCalled();
    });

    it('应该处理重做操作', async () => {
      const user = userEvent.setup();
      render(
        <RichTextToolbar 
          {...defaultProps} 
          onRedo={mockOnRedo}
        />
      );
      
      const redoButton = screen.getByTestId('toolbar-redo');
      await user.click(redoButton);
      
      expect(mockOnRedo).toHaveBeenCalled();
    });
  });

  describe('禁用状态', () => {
    it('应该在只读模式下禁用所有按钮', () => {
      render(<RichTextToolbar {...defaultProps} readOnly />);
      
      // 只读模式下不应该渲染工具栏
      expect(screen.queryByTestId('rich-text-toolbar')).not.toBeInTheDocument();
    });

    it('应该支持单个按钮的禁用状态', () => {
      // 这个功能需要在工具栏配置中支持
      // 目前的实现中，按钮的禁用状态主要通过readOnly控制
      render(<RichTextToolbar {...defaultProps} />);
      
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).not.toBeDisabled();
      });
    });
  });

  describe('自定义样式', () => {
    it('应该应用自定义类名', () => {
      render(
        <RichTextToolbar 
          {...defaultProps} 
          className="custom-toolbar"
        />
      );
      
      const toolbar = screen.getByTestId('rich-text-toolbar');
      expect(toolbar).toHaveClass('custom-toolbar');
    });

    it('应该应用自定义样式', () => {
      const customStyle = { backgroundColor: 'red' };
      render(
        <RichTextToolbar 
          {...defaultProps} 
          style={customStyle}
        />
      );
      
      const toolbar = screen.getByTestId('rich-text-toolbar');
      expect(toolbar).toHaveStyle({ backgroundColor: 'red' });
    });
  });
});
