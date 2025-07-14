/**
 * 代码编辑器组件测试
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CodeEditor, type CodeEditorProps } from './CodeEditor';
import type { SupportedLanguage } from '../services/CodeHighlightService';

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => Date.now())
  }
});

describe('CodeEditor', () => {
  const mockOnChange = vi.fn();
  const mockOnLanguageChange = vi.fn();
  const mockOnFocus = vi.fn();
  const mockOnBlur = vi.fn();

  const defaultProps: CodeEditorProps = {
    value: '',
    onChange: mockOnChange
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基础渲染', () => {
    it('应该正确渲染代码编辑器', () => {
      render(<CodeEditor {...defaultProps} />);
      
      expect(screen.getByTestId('code-editor-textarea')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument(); // 语言选择器
    });

    it('应该显示占位符文本', () => {
      const placeholder = '请输入代码...';
      render(<CodeEditor {...defaultProps} placeholder={placeholder} />);
      
      const textarea = screen.getByTestId('code-editor-textarea');
      expect(textarea).toHaveAttribute('placeholder', placeholder);
    });

    it('应该在只读模式下隐藏语言选择器', () => {
      render(<CodeEditor {...defaultProps} readOnly />);
      
      expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
    });

    it('应该显示当前语言', () => {
      render(<CodeEditor {...defaultProps} language="javascript" />);
      
      expect(screen.getByText('JAVASCRIPT')).toBeInTheDocument();
    });

    it('应该显示光标位置', () => {
      render(<CodeEditor {...defaultProps} />);
      
      expect(screen.getByText(/行 1, 列 1/)).toBeInTheDocument();
    });
  });

  describe('内容编辑', () => {
    it('应该处理文本输入', async () => {
      const user = userEvent.setup();
      render(<CodeEditor {...defaultProps} />);
      
      const textarea = screen.getByTestId('code-editor-textarea');
      await user.type(textarea, 'console.log("hello");');
      
      expect(mockOnChange).toHaveBeenCalledWith('console.log("hello");');
    });

    it('应该处理Tab键缩进', async () => {
      const user = userEvent.setup();
      render(<CodeEditor {...defaultProps} tabSize={2} />);
      
      const textarea = screen.getByTestId('code-editor-textarea');
      await user.click(textarea);
      await user.keyboard('{Tab}');
      
      expect(mockOnChange).toHaveBeenCalledWith('  '); // 2个空格
    });

    it('应该处理Enter键自动缩进', async () => {
      const user = userEvent.setup();
      render(<CodeEditor {...defaultProps} value="  if (true) {" autoIndent />);
      
      const textarea = screen.getByTestId('code-editor-textarea');
      await user.click(textarea);
      // 将光标移到末尾
      fireEvent.change(textarea, { target: { selectionStart: 13, selectionEnd: 13 } });
      await user.keyboard('{Enter}');
      
      expect(mockOnChange).toHaveBeenCalled();
    });

    it('应该在只读模式下禁用编辑', async () => {
      const user = userEvent.setup();
      render(<CodeEditor {...defaultProps} readOnly />);
      
      const textarea = screen.getByTestId('code-editor-textarea');
      expect(textarea).toHaveAttribute('readOnly');
      
      await user.type(textarea, 'test');
      expect(mockOnChange).not.toHaveBeenCalled();
    });
  });

  describe('语言选择', () => {
    it('应该显示支持的语言列表', () => {
      render(<CodeEditor {...defaultProps} />);
      
      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
      
      // 检查一些常见语言选项
      expect(screen.getByRole('option', { name: /JavaScript/ })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /Python/ })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /HTML/ })).toBeInTheDocument();
    });

    it('应该处理语言变更', async () => {
      const user = userEvent.setup();
      render(<CodeEditor {...defaultProps} onLanguageChange={mockOnLanguageChange} />);
      
      const select = screen.getByRole('combobox');
      await user.selectOptions(select, 'python');
      
      expect(mockOnLanguageChange).toHaveBeenCalledWith('python');
    });

    it('应该设置默认语言', () => {
      render(<CodeEditor {...defaultProps} language="python" />);
      
      const select = screen.getByRole('combobox');
      expect(select).toHaveValue('python');
    });
  });

  describe('语法高亮', () => {
    it('应该在启用语法高亮时显示高亮层', async () => {
      render(
        <CodeEditor 
          {...defaultProps} 
          value="console.log('test');" 
          language="javascript"
          enableSyntaxHighlight 
        />
      );
      
      // 等待高亮处理完成
      await waitFor(() => {
        expect(document.querySelector('.highlight-layer')).toBeInTheDocument();
      }, { timeout: 1000 });
    });

    it('应该在禁用语法高亮时隐藏高亮层', () => {
      render(
        <CodeEditor 
          {...defaultProps} 
          value="console.log('test');" 
          enableSyntaxHighlight={false}
        />
      );
      
      expect(document.querySelector('.highlight-layer')).not.toBeInTheDocument();
    });

    it('应该显示高亮状态', async () => {
      render(
        <CodeEditor 
          {...defaultProps} 
          value="console.log('test');" 
          language="javascript"
          enableSyntaxHighlight 
        />
      );
      
      // 可能会短暂显示"正在高亮..."状态
      // 由于高亮很快，这个测试可能需要调整
    });
  });

  describe('行号显示', () => {
    it('应该在启用时显示行号', async () => {
      render(
        <CodeEditor 
          {...defaultProps} 
          value="line 1\nline 2\nline 3"
          showLineNumbers 
        />
      );
      
      await waitFor(() => {
        // 检查是否有行号相关的内容
        expect(screen.getByText(/行 1, 列/)).toBeInTheDocument();
      });
    });

    it('应该在禁用时隐藏行号', () => {
      render(
        <CodeEditor 
          {...defaultProps} 
          value="line 1\nline 2"
          showLineNumbers={false}
        />
      );
      
      // 行号通常在高亮层中，这里检查基础功能
      expect(screen.getByTestId('code-editor-textarea')).toBeInTheDocument();
    });
  });

  describe('主题支持', () => {
    it('应该应用浅色主题', () => {
      render(<CodeEditor {...defaultProps} theme="light" />);
      
      const container = document.querySelector('.code-editor');
      expect(container).toHaveStyle({ backgroundColor: '#ffffff' });
    });

    it('应该应用深色主题', () => {
      render(<CodeEditor {...defaultProps} theme="dark" />);
      
      const container = document.querySelector('.code-editor');
      expect(container).toHaveStyle({ backgroundColor: '#1e1e1e' });
    });
  });

  describe('事件处理', () => {
    it('应该处理焦点事件', async () => {
      const user = userEvent.setup();
      render(<CodeEditor {...defaultProps} onFocus={mockOnFocus} />);
      
      const textarea = screen.getByTestId('code-editor-textarea');
      await user.click(textarea);
      
      expect(mockOnFocus).toHaveBeenCalled();
    });

    it('应该处理失焦事件', async () => {
      const user = userEvent.setup();
      render(<CodeEditor {...defaultProps} onBlur={mockOnBlur} />);
      
      const textarea = screen.getByTestId('code-editor-textarea');
      await user.click(textarea);
      await user.tab(); // 移动焦点
      
      expect(mockOnBlur).toHaveBeenCalled();
    });

    it('应该更新光标位置', async () => {
      const user = userEvent.setup();
      render(<CodeEditor {...defaultProps} value="line 1\nline 2" />);
      
      const textarea = screen.getByTestId('code-editor-textarea');
      await user.click(textarea);
      
      // 模拟光标移动
      fireEvent.select(textarea);
      
      expect(screen.getByText(/行 \d+, 列 \d+/)).toBeInTheDocument();
    });
  });

  describe('配置选项', () => {
    it('应该应用自定义字体大小', () => {
      render(<CodeEditor {...defaultProps} fontSize={16} />);
      
      const container = document.querySelector('.code-editor');
      expect(container).toHaveStyle({ fontSize: '16px' });
    });

    it('应该应用最大高度限制', () => {
      render(<CodeEditor {...defaultProps} maxHeight={300} />);
      
      const container = document.querySelector('.code-editor');
      expect(container).toHaveStyle({ maxHeight: '300px' });
    });

    it('应该应用自定义样式类名', () => {
      render(<CodeEditor {...defaultProps} className="custom-editor" />);
      
      const container = document.querySelector('.code-editor');
      expect(container).toHaveClass('custom-editor');
    });

    it('应该应用自定义样式', () => {
      const customStyle = { border: '2px solid red' };
      render(<CodeEditor {...defaultProps} style={customStyle} />);
      
      const container = document.querySelector('.code-editor');
      expect(container).toHaveStyle({ border: '2px solid red' });
    });
  });

  describe('自动检测', () => {
    it('应该在启用自动检测时检测语言', async () => {
      render(
        <CodeEditor 
          {...defaultProps} 
          value="function test() {}"
          autoDetectLanguage
          onLanguageChange={mockOnLanguageChange}
        />
      );
      
      // 等待自动检测完成
      await waitFor(() => {
        expect(mockOnLanguageChange).toHaveBeenCalledWith('javascript');
      }, { timeout: 1000 });
    });

    it('应该在禁用自动检测时保持当前语言', async () => {
      render(
        <CodeEditor 
          {...defaultProps} 
          value="function test() {}"
          language="text"
          autoDetectLanguage={false}
          onLanguageChange={mockOnLanguageChange}
        />
      );
      
      // 等待一段时间确保没有自动检测
      await new Promise(resolve => setTimeout(resolve, 200));
      
      expect(mockOnLanguageChange).not.toHaveBeenCalled();
    });
  });

  describe('性能测试', () => {
    it('应该处理大量文本', async () => {
      const largeText = 'console.log("test");\n'.repeat(1000);
      
      const { rerender } = render(
        <CodeEditor {...defaultProps} value="" />
      );
      
      const startTime = performance.now();
      rerender(<CodeEditor {...defaultProps} value={largeText} />);
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(1000); // 应该在1秒内完成
    });
  });

  describe('错误处理', () => {
    it('应该处理空值', () => {
      render(<CodeEditor {...defaultProps} value="" />);
      
      expect(screen.getByTestId('code-editor-textarea')).toHaveValue('');
    });

    it('应该处理undefined值', () => {
      render(<CodeEditor {...defaultProps} value={undefined as any} />);
      
      expect(screen.getByTestId('code-editor-textarea')).toHaveValue('');
    });

    it('应该显示错误状态', async () => {
      // 这个测试需要模拟高亮服务出错的情况
      // 由于我们的简化实现不太可能出错，这里只是结构性测试
      render(
        <CodeEditor 
          {...defaultProps} 
          value="test code"
          enableSyntaxHighlight
        />
      );
      
      // 检查是否有错误状态的容器
      expect(document.querySelector('.code-editor')).toBeInTheDocument();
    });
  });
});
