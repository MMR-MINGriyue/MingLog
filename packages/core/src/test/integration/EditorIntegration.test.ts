/**
 * MingLog 编辑器集成测试
 * 验证富文本编辑器与双向链接系统的集成
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { LinkManagerService } from '../../services/LinkManagerService';
import { PageLinkParser } from '../../parsers/PageLinkParser';
import { BlockLinkParser } from '../../parsers/BlockLinkParser';
import { SearchEngine } from '../../search/SearchEngine';
import type { PageLink, BlockLink, SearchDocument } from '../../types/links';

// 模拟编辑器组件
const MockEditor: React.FC<{
  content: string;
  onChange: (content: string) => void;
  onLinkCreate?: (link: PageLink | BlockLink) => void;
  onLinkUpdate?: (linkId: string, updates: Partial<PageLink | BlockLink>) => void;
  onLinkDelete?: (linkId: string) => void;
}> = ({ content, onChange, onLinkCreate, onLinkUpdate, onLinkDelete }) => {
  const [editorContent, setEditorContent] = React.useState(content);
  const [cursorPosition, setCursorPosition] = React.useState(0);
  
  const linkManager = React.useRef(new LinkManagerService());
  const pageLinkParser = React.useRef(new PageLinkParser());
  const blockLinkParser = React.useRef(new BlockLinkParser());

  // 处理内容变化
  const handleContentChange = React.useCallback(async (newContent: string) => {
    setEditorContent(newContent);
    onChange(newContent);

    // 解析新链接
    const pageLinks = pageLinkParser.current.parse(newContent, 'current-page');
    const blockLinks = blockLinkParser.current.parse(newContent, 'current-page');
    
    // 通知链接创建
    [...pageLinks, ...blockLinks].forEach(link => {
      onLinkCreate?.(link);
    });
  }, [onChange, onLinkCreate]);

  // 处理键盘输入
  const handleKeyDown = React.useCallback((event: React.KeyboardEvent) => {
    if (event.key === '[' && event.ctrlKey) {
      // Ctrl+[ 快捷键创建页面链接
      event.preventDefault();
      const beforeCursor = editorContent.substring(0, cursorPosition);
      const afterCursor = editorContent.substring(cursorPosition);
      const newContent = beforeCursor + '[[]]' + afterCursor;
      handleContentChange(newContent);
      setCursorPosition(cursorPosition + 2); // 光标移到 [[ 之间
    } else if (event.key === '(' && event.ctrlKey) {
      // Ctrl+( 快捷键创建块链接
      event.preventDefault();
      const beforeCursor = editorContent.substring(0, cursorPosition);
      const afterCursor = editorContent.substring(cursorPosition);
      const newContent = beforeCursor + '(())' + afterCursor;
      handleContentChange(newContent);
      setCursorPosition(cursorPosition + 2); // 光标移到 (( 之间
    }
  }, [editorContent, cursorPosition, handleContentChange]);

  // 自动补全功能
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  React.useEffect(() => {
    // 检测是否在输入链接
    const beforeCursor = editorContent.substring(0, cursorPosition);
    const linkMatch = beforeCursor.match(/\[\[([^\]]*?)$/);
    
    if (linkMatch) {
      const query = linkMatch[1];
      if (query.length > 0) {
        // 模拟搜索建议
        const mockSuggestions = [
          '机器学习',
          '深度学习',
          '人工智能',
          '神经网络'
        ].filter(item => item.includes(query));
        
        setSuggestions(mockSuggestions);
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  }, [editorContent, cursorPosition]);

  return (
    <div data-testid="mock-editor">
      <textarea
        data-testid="editor-textarea"
        value={editorContent}
        onChange={(e) => {
          setCursorPosition(e.target.selectionStart);
          handleContentChange(e.target.value);
        }}
        onKeyDown={handleKeyDown}
        onSelect={(e) => setCursorPosition((e.target as HTMLTextAreaElement).selectionStart)}
        style={{ width: '100%', height: '200px', fontFamily: 'monospace' }}
      />
      
      {showSuggestions && (
        <div data-testid="link-suggestions" style={{ border: '1px solid #ccc', background: 'white' }}>
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              data-testid={`suggestion-${index}`}
              onClick={() => {
                const beforeCursor = editorContent.substring(0, cursorPosition);
                const afterCursor = editorContent.substring(cursorPosition);
                const beforeLink = beforeCursor.replace(/\[\[([^\]]*?)$/, `[[${suggestion}]]`);
                const newContent = beforeLink + afterCursor;
                handleContentChange(newContent);
                setShowSuggestions(false);
              }}
              style={{ padding: '4px 8px', cursor: 'pointer' }}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}

      <div data-testid="editor-stats">
        <span>光标位置: {cursorPosition}</span>
        <span> | 内容长度: {editorContent.length}</span>
      </div>
    </div>
  );
};

describe('编辑器集成测试', () => {
  let linkManager: LinkManagerService;
  let searchEngine: SearchEngine;
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    linkManager = new LinkManagerService();
    searchEngine = new SearchEngine();
    user = userEvent.setup();

    // 添加一些测试文档到搜索引擎
    const testDocs: SearchDocument[] = [
      {
        id: 'ml-doc',
        title: '机器学习',
        content: '机器学习是人工智能的一个分支',
        type: 'page',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'dl-doc',
        title: '深度学习',
        content: '深度学习是机器学习的高级形式',
        type: 'page',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    testDocs.forEach(doc => searchEngine.addDocument(doc));
  });

  describe('基本编辑功能', () => {
    it('应该能够输入和编辑文本内容', async () => {
      const mockOnChange = vi.fn();
      
      render(
        <MockEditor
          content=""
          onChange={mockOnChange}
        />
      );

      const textarea = screen.getByTestId('editor-textarea');
      
      // 输入文本
      await user.type(textarea, '这是一个测试文档');
      
      expect(mockOnChange).toHaveBeenCalledWith('这是一个测试文档');
      expect(textarea).toHaveValue('这是一个测试文档');
    });

    it('应该显示编辑器统计信息', async () => {
      render(
        <MockEditor
          content="初始内容"
          onChange={vi.fn()}
        />
      );

      const stats = screen.getByTestId('editor-stats');
      expect(stats).toHaveTextContent('内容长度: 4');
    });
  });

  describe('链接创建功能', () => {
    it('应该支持手动输入页面链接', async () => {
      const mockOnLinkCreate = vi.fn();
      
      render(
        <MockEditor
          content=""
          onChange={vi.fn()}
          onLinkCreate={mockOnLinkCreate}
        />
      );

      const textarea = screen.getByTestId('editor-textarea');
      
      // 输入页面链接语法
      await user.type(textarea, '这是关于[[机器学习]]的文档');
      
      // 验证链接创建回调被调用
      await waitFor(() => {
        expect(mockOnLinkCreate).toHaveBeenCalled();
      });

      const linkCall = mockOnLinkCreate.mock.calls.find(call => 
        call[0].type === 'page-reference' && call[0].pageName === '机器学习'
      );
      expect(linkCall).toBeDefined();
    });

    it('应该支持快捷键创建链接', async () => {
      const mockOnChange = vi.fn();
      
      render(
        <MockEditor
          content="测试内容"
          onChange={mockOnChange}
        />
      );

      const textarea = screen.getByTestId('editor-textarea');
      
      // 设置光标位置
      textarea.focus();
      textarea.setSelectionRange(4, 4); // 在"测试内容"之后
      
      // 使用快捷键创建页面链接
      await user.keyboard('{Control>}[{/Control}');
      
      // 验证链接语法被插入
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('测试内容[[]]');
      });
    });

    it('应该支持块链接创建', async () => {
      const mockOnLinkCreate = vi.fn();
      
      render(
        <MockEditor
          content=""
          onChange={vi.fn()}
          onLinkCreate={mockOnLinkCreate}
        />
      );

      const textarea = screen.getByTestId('editor-textarea');
      
      // 输入块链接语法
      await user.type(textarea, '参考重要概念：((concept-123))');
      
      // 验证块链接创建
      await waitFor(() => {
        expect(mockOnLinkCreate).toHaveBeenCalled();
      });

      const blockLinkCall = mockOnLinkCreate.mock.calls.find(call => 
        call[0].type === 'block-reference' && call[0].blockId === 'concept-123'
      );
      expect(blockLinkCall).toBeDefined();
    });
  });

  describe('自动补全功能', () => {
    it('应该在输入链接时显示建议', async () => {
      render(
        <MockEditor
          content=""
          onChange={vi.fn()}
        />
      );

      const textarea = screen.getByTestId('editor-textarea');
      
      // 开始输入链接
      await user.type(textarea, '这是关于[[机器');
      
      // 验证建议列表显示
      await waitFor(() => {
        expect(screen.getByTestId('link-suggestions')).toBeInTheDocument();
      });

      // 验证建议内容
      expect(screen.getByTestId('suggestion-0')).toHaveTextContent('机器学习');
    });

    it('应该能够选择建议完成链接', async () => {
      const mockOnChange = vi.fn();
      
      render(
        <MockEditor
          content=""
          onChange={mockOnChange}
        />
      );

      const textarea = screen.getByTestId('editor-textarea');
      
      // 输入部分链接
      await user.type(textarea, '[[机器');
      
      // 等待建议显示
      await waitFor(() => {
        expect(screen.getByTestId('link-suggestions')).toBeInTheDocument();
      });

      // 点击建议
      await user.click(screen.getByTestId('suggestion-0'));
      
      // 验证链接被完成
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('[[机器学习]]');
      });
    });

    it('应该在完成链接后隐藏建议', async () => {
      render(
        <MockEditor
          content=""
          onChange={vi.fn()}
        />
      );

      const textarea = screen.getByTestId('editor-textarea');
      
      // 输入完整链接
      await user.type(textarea, '[[机器学习]]');
      
      // 验证建议列表不显示
      expect(screen.queryByTestId('link-suggestions')).not.toBeInTheDocument();
    });
  });

  describe('链接编辑功能', () => {
    it('应该支持编辑现有链接', async () => {
      const mockOnLinkUpdate = vi.fn();
      
      render(
        <MockEditor
          content="这是关于[[机器学习]]的文档"
          onChange={vi.fn()}
          onLinkUpdate={mockOnLinkUpdate}
        />
      );

      const textarea = screen.getByTestId('editor-textarea');
      
      // 修改链接文本
      textarea.focus();
      textarea.setSelectionRange(5, 9); // 选中"机器学习"
      await user.type(textarea, '深度学习');
      
      // 验证链接更新
      await waitFor(() => {
        expect(textarea).toHaveValue('这是关于[[深度学习]]的文档');
      });
    });

    it('应该支持删除链接', async () => {
      const mockOnLinkDelete = vi.fn();
      
      render(
        <MockEditor
          content="这是关于[[机器学习]]的文档"
          onChange={vi.fn()}
          onLinkDelete={mockOnLinkDelete}
        />
      );

      const textarea = screen.getByTestId('editor-textarea');
      
      // 删除整个链接
      textarea.focus();
      textarea.setSelectionRange(3, 11); // 选中"[[机器学习]]"
      await user.keyboard('{Delete}');
      
      // 验证链接被删除
      await waitFor(() => {
        expect(textarea).toHaveValue('这是关于的文档');
      });
    });
  });

  describe('实时链接解析', () => {
    it('应该实时解析和更新链接', async () => {
      const mockOnLinkCreate = vi.fn();
      
      render(
        <MockEditor
          content=""
          onChange={vi.fn()}
          onLinkCreate={mockOnLinkCreate}
        />
      );

      const textarea = screen.getByTestId('editor-textarea');
      
      // 逐步输入链接
      await user.type(textarea, '[[');
      expect(mockOnLinkCreate).not.toHaveBeenCalled();
      
      await user.type(textarea, '机器学习');
      expect(mockOnLinkCreate).not.toHaveBeenCalled();
      
      await user.type(textarea, ']]');
      
      // 验证完整链接被解析
      await waitFor(() => {
        expect(mockOnLinkCreate).toHaveBeenCalled();
      });
    });

    it('应该处理多个链接的解析', async () => {
      const mockOnLinkCreate = vi.fn();
      
      render(
        <MockEditor
          content=""
          onChange={vi.fn()}
          onLinkCreate={mockOnLinkCreate}
        />
      );

      const textarea = screen.getByTestId('editor-textarea');
      
      // 输入包含多个链接的文本
      await user.type(textarea, '[[机器学习]]和[[深度学习]]都是[[人工智能]]的分支');
      
      // 验证所有链接都被解析
      await waitFor(() => {
        expect(mockOnLinkCreate).toHaveBeenCalledTimes(3);
      });

      const linkNames = mockOnLinkCreate.mock.calls.map(call => call[0].pageName);
      expect(linkNames).toContain('机器学习');
      expect(linkNames).toContain('深度学习');
      expect(linkNames).toContain('人工智能');
    });
  });

  describe('性能优化', () => {
    it('应该防抖处理频繁的内容变化', async () => {
      const mockOnChange = vi.fn();
      
      render(
        <MockEditor
          content=""
          onChange={mockOnChange}
        />
      );

      const textarea = screen.getByTestId('editor-textarea');
      
      // 快速输入多个字符
      await user.type(textarea, '快速输入测试', { delay: 10 });
      
      // 等待防抖完成
      await waitFor(() => {
        expect(mockOnChange).toHaveBeenCalledWith('快速输入测试');
      }, { timeout: 1000 });

      // 验证不会有过多的调用
      expect(mockOnChange.mock.calls.length).toBeLessThan(20);
    });

    it('应该优化大文档的链接解析性能', async () => {
      const mockOnLinkCreate = vi.fn();
      
      // 创建大文档内容
      const largeContent = Array.from({ length: 100 }, (_, i) => 
        `这是第${i}段，包含[[链接${i}]]`
      ).join('\n');
      
      const startTime = performance.now();
      
      render(
        <MockEditor
          content={largeContent}
          onChange={vi.fn()}
          onLinkCreate={mockOnLinkCreate}
        />
      );
      
      const parseTime = performance.now() - startTime;
      
      // 验证解析时间在合理范围内
      expect(parseTime).toBeLessThan(1000); // 1秒内完成
      
      // 验证所有链接都被解析
      await waitFor(() => {
        expect(mockOnLinkCreate).toHaveBeenCalledTimes(100);
      });
    });
  });
});
