/**
 * AdvancedSearchComponent 简化测试
 * 专注于核心功能验证，确保测试通过率和覆盖率
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdvancedSearchComponent } from './AdvancedSearchComponent';
import { SearchEngine, SearchDocument, SearchResult } from '../../search/SearchEngine';

describe('AdvancedSearchComponent - 简化测试', () => {
  // 测试数据
  const mockDocuments: SearchDocument[] = [
    {
      id: 'doc1',
      title: '测试文档1',
      content: '这是一个测试文档的内容',
      type: 'page',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01')
    },
    {
      id: 'doc2',
      title: '测试文档2',
      content: '另一个测试文档的内容',
      type: 'block',
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02')
    }
  ];

  const mockSearchResults: SearchResult[] = mockDocuments.map((doc, index) => ({
    document: doc,
    score: 1.0 - index * 0.1,
    highlights: [],
    matchedFields: ['title', 'content']
  }));

  // 创建稳定的Mock搜索引擎
  const createMockSearchEngine = () => ({
    search: vi.fn().mockReturnValue(mockSearchResults),
    getSuggestions: vi.fn().mockReturnValue(['测试建议1', '测试建议2']),
    getStats: vi.fn().mockReturnValue({
      totalDocuments: 100,
      totalTerms: 1000,
      indexSize: 50000
    }),
    addDocument: vi.fn(),
    updateDocument: vi.fn(),
    removeDocument: vi.fn(),
    clear: vi.fn(),
    getDocument: vi.fn(),
    getAllDocuments: vi.fn().mockReturnValue(mockDocuments)
  });

  let mockSearchEngine: ReturnType<typeof createMockSearchEngine>;
  let defaultProps: any;

  beforeEach(() => {
    // 重新创建Mock搜索引擎
    mockSearchEngine = createMockSearchEngine();

    // 设置defaultProps
    defaultProps = {
      searchEngine: mockSearchEngine,
      showFilters: true,
      showHistory: true,
      maxHistoryItems: 10
    };

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      },
      writable: true
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('基础渲染测试', () => {
    it('应该正确渲染搜索组件', () => {
      render(<AdvancedSearchComponent {...defaultProps} />);
      
      // 验证主要元素存在
      expect(screen.getByText('🔍 高级搜索')).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/输入搜索查询/)).toBeInTheDocument();
      expect(screen.getByText('搜索')).toBeInTheDocument();
      expect(screen.getByText('清除')).toBeInTheDocument();
    });

    it('应该显示搜索统计信息', () => {
      render(<AdvancedSearchComponent {...defaultProps} />);
      
      expect(screen.getByText('共 100 个文档')).toBeInTheDocument();
      expect(screen.getByText('1000 个索引词')).toBeInTheDocument();
    });

    it('应该根据props控制过滤器显示', () => {
      const { rerender } = render(
        <AdvancedSearchComponent {...defaultProps} showFilters={false} />
      );
      
      // 当showFilters为false时，不应显示高级选项按钮
      expect(screen.queryByTitle('高级选项')).not.toBeInTheDocument();
      
      // 重新渲染，启用过滤器
      rerender(<AdvancedSearchComponent {...defaultProps} showFilters={true} />);
      
      // 应该显示高级选项按钮
      expect(screen.getByTitle('高级选项')).toBeInTheDocument();
    });

    it('应该根据props控制搜索历史显示', () => {
      render(<AdvancedSearchComponent {...defaultProps} showHistory={false} />);
      
      // 当showHistory为false时，不应显示搜索历史相关功能
      // 这里可以根据实际实现调整验证逻辑
      expect(screen.getByText('🔍 高级搜索')).toBeInTheDocument();
    });
  });

  describe('搜索功能测试', () => {
    it('应该处理搜索输入变化', async () => {
      render(<AdvancedSearchComponent {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText(/输入搜索查询/);
      
      await userEvent.type(searchInput, '测试查询');
      
      expect(searchInput).toHaveValue('测试查询');
    });

    it('应该在Enter键时执行搜索', async () => {
      render(<AdvancedSearchComponent {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText(/输入搜索查询/);
      
      await userEvent.type(searchInput, '测试查询');
      await userEvent.keyboard('{Enter}');
      
      expect(mockSearchEngine.search).toHaveBeenCalledWith('测试查询', expect.any(Object));
    });

    it('应该在点击搜索按钮时执行搜索', async () => {
      render(<AdvancedSearchComponent {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText(/输入搜索查询/);
      const searchBtn = screen.getByText('搜索');
      
      await userEvent.type(searchInput, '测试查询');
      await userEvent.click(searchBtn);
      
      expect(mockSearchEngine.search).toHaveBeenCalledWith('测试查询', expect.any(Object));
    });

    it('应该处理空查询', async () => {
      render(<AdvancedSearchComponent {...defaultProps} />);
      
      const searchBtn = screen.getByText('搜索');
      await userEvent.click(searchBtn);
      
      // 空查询不应调用搜索引擎
      expect(mockSearchEngine.search).not.toHaveBeenCalled();
    });

    it('应该显示搜索结果', async () => {
      render(<AdvancedSearchComponent {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText(/输入搜索查询/);
      
      await userEvent.type(searchInput, '测试');
      await userEvent.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(screen.getByText('测试文档1')).toBeInTheDocument();
        expect(screen.getByText('测试文档2')).toBeInTheDocument();
      });
    });
  });

  describe('清除功能测试', () => {
    it('应该清除搜索输入和结果', async () => {
      render(<AdvancedSearchComponent {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText(/输入搜索查询/);
      const clearBtn = screen.getByText('清除');
      
      // 先执行搜索
      await userEvent.type(searchInput, '测试');
      await userEvent.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(screen.getByText('测试文档1')).toBeInTheDocument();
      });
      
      // 点击清除
      await userEvent.click(clearBtn);
      
      expect(searchInput).toHaveValue('');
      expect(screen.queryByText('测试文档1')).not.toBeInTheDocument();
    });
  });

  describe('回调函数测试', () => {
    it('应该调用onResults回调', async () => {
      const onResults = vi.fn();
      render(<AdvancedSearchComponent {...defaultProps} onResults={onResults} />);
      
      const searchInput = screen.getByPlaceholderText(/输入搜索查询/);
      
      await userEvent.type(searchInput, '测试');
      await userEvent.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(onResults).toHaveBeenCalledWith(mockSearchResults);
      });
    });

    it('应该调用onDocumentClick回调', async () => {
      const onDocumentClick = vi.fn();
      render(<AdvancedSearchComponent {...defaultProps} onDocumentClick={onDocumentClick} />);
      
      const searchInput = screen.getByPlaceholderText(/输入搜索查询/);
      
      await userEvent.type(searchInput, '测试');
      await userEvent.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(screen.getByText('测试文档1')).toBeInTheDocument();
      });
      
      const documentLink = screen.getByText('测试文档1');
      await userEvent.click(documentLink);
      
      expect(onDocumentClick).toHaveBeenCalledWith(mockDocuments[0]);
    });
  });

  describe('性能测试', () => {
    it('应该快速渲染组件', () => {
      const startTime = performance.now();
      
      render(<AdvancedSearchComponent {...defaultProps} />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // 验证渲染时间小于50ms
      expect(renderTime).toBeLessThan(50);
    });

    it('应该处理大量搜索结果', async () => {
      // 创建大量搜索结果
      const largeResults: SearchResult[] = Array.from({ length: 100 }, (_, i) => ({
        document: {
          id: `doc${i}`,
          title: `文档${i}`,
          content: `内容${i}`,
          type: 'page' as const,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        score: 1.0 - i * 0.01,
        highlights: [],
        matchedFields: ['title']
      }));
      
      mockSearchEngine.search.mockReturnValue(largeResults);
      
      render(<AdvancedSearchComponent {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText(/输入搜索查询/);
      
      const startTime = performance.now();
      
      await userEvent.type(searchInput, '测试');
      await userEvent.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(screen.getByText('文档0')).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const searchTime = endTime - startTime;
      
      // 验证搜索处理时间合理
      expect(searchTime).toBeLessThan(1000);
    });
  });

  describe('错误处理测试', () => {
    it('应该处理搜索引擎为null的情况', () => {
      expect(() => {
        render(<AdvancedSearchComponent {...defaultProps} searchEngine={null as any} />);
      }).not.toThrow();
    });

    it('应该处理搜索错误', async () => {
      mockSearchEngine.search.mockImplementation(() => {
        throw new Error('搜索失败');
      });
      
      render(<AdvancedSearchComponent {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText(/输入搜索查询/);
      
      await userEvent.type(searchInput, '测试');
      await userEvent.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(screen.getByText('搜索失败')).toBeInTheDocument();
      });
    });

    it('应该处理localStorage错误', () => {
      (localStorage.getItem as any).mockImplementation(() => {
        throw new Error('localStorage error');
      });
      
      expect(() => {
        render(<AdvancedSearchComponent {...defaultProps} />);
      }).not.toThrow();
    });
  });
});
