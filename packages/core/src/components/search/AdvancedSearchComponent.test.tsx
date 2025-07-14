/**
 * AdvancedSearchComponent 单元测试
 * 测试高级搜索组件的搜索功能、过滤器、搜索历史和异步处理
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdvancedSearchComponent } from './AdvancedSearchComponent';
import { SearchEngine, SearchDocument, SearchResult } from '../../search/SearchEngine';
import { MockFactory } from '../../test/TestInfrastructureSetup';

describe('AdvancedSearchComponent', () => {
  // 测试数据
  const mockDocuments: SearchDocument[] = [
    {
      id: 'doc1',
      title: '测试文档1',
      content: '这是一个测试文档的内容',
      type: 'page',
      path: '/test/doc1',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      tags: ['测试', '文档'],
      author: '测试用户'
    },
    {
      id: 'doc2',
      title: '测试文档2',
      content: '另一个测试文档的内容',
      type: 'block',
      path: '/test/doc2',
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
      tags: ['测试'],
      author: '测试用户'
    }
  ];

  const mockSearchResults: SearchResult[] = mockDocuments.map((doc, index) => ({
    document: doc,
    score: 1.0 - index * 0.1,
    highlights: [
      {
        field: 'content',
        fragments: [`<mark>测试</mark>文档的内容`],
        score: 0.8
      }
    ],
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

  // Mock搜索引擎实例
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
      
      // 当showFilters为false时，不应显示过滤器
      expect(screen.queryByText('文件类型')).not.toBeInTheDocument();
      
      // 重新渲染，启用过滤器
      rerender(<AdvancedSearchComponent {...defaultProps} showFilters={true} />);
      
      // 点击高级选项按钮显示过滤器
      const advancedBtn = screen.getByTitle('高级选项');
      fireEvent.click(advancedBtn);
      
      expect(screen.getByText('文档类型:')).toBeInTheDocument();
    });

    it('应该根据props控制搜索历史显示', () => {
      render(<AdvancedSearchComponent {...defaultProps} showHistory={false} />);
      
      // 当showHistory为false时，不应显示搜索历史
      expect(screen.queryByText('搜索历史')).not.toBeInTheDocument();
    });
  });

  describe('搜索功能测试', () => {
    it('应该处理搜索输入变化', async () => {
      render(<AdvancedSearchComponent {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/输入搜索查询/);

      await act(async () => {
        await userEvent.type(searchInput, '测试查询');
      });

      expect(searchInput).toHaveValue('测试查询');
      expect(mockSearchEngine.getSuggestions).toHaveBeenCalledWith('测试查询', 5);
    });

    it('应该在Enter键时执行搜索', async () => {
      render(<AdvancedSearchComponent {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/输入搜索查询/);

      await act(async () => {
        await userEvent.type(searchInput, '测试查询');
        await userEvent.keyboard('{Enter}');
      });

      expect(mockSearchEngine.search).toHaveBeenCalledWith('测试查询', expect.any(Object));
    });

    it('应该在点击搜索按钮时执行搜索', async () => {
      render(<AdvancedSearchComponent {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/输入搜索查询/);
      const searchBtn = screen.getByText('搜索');

      await act(async () => {
        await userEvent.type(searchInput, '测试查询');
        await userEvent.click(searchBtn);
      });

      expect(mockSearchEngine.search).toHaveBeenCalledWith('测试查询', expect.any(Object));
    });

    it('应该显示搜索结果', async () => {
      render(<AdvancedSearchComponent {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/输入搜索查询/);

      await act(async () => {
        await userEvent.type(searchInput, '测试');
        await userEvent.keyboard('{Enter}');
      });

      await waitFor(() => {
        // 验证搜索结果数量
        expect(screen.getByText(/找到.*2.*个结果/)).toBeInTheDocument();
        // 验证结果标题（可能包含emoji前缀）
        expect(screen.getByText(/测试文档1/)).toBeInTheDocument();
        expect(screen.getByText(/测试文档2/)).toBeInTheDocument();
      });
    });

    it('应该处理空查询', async () => {
      render(<AdvancedSearchComponent {...defaultProps} />);

      const searchBtn = screen.getByText('搜索');

      await act(async () => {
        await userEvent.click(searchBtn);
      });

      // 空查询不应调用搜索引擎
      expect(mockSearchEngine.search).not.toHaveBeenCalled();
    });

    it('应该处理搜索错误', async () => {
      mockSearchEngine.search.mockImplementation(() => {
        throw new Error('搜索失败');
      });

      render(<AdvancedSearchComponent {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/输入搜索查询/);

      await act(async () => {
        await userEvent.type(searchInput, '测试');
        await userEvent.keyboard('{Enter}');
      });

      await waitFor(() => {
        expect(screen.getByText(/搜索失败/)).toBeInTheDocument();
      });
    });
  });

  describe('搜索建议测试', () => {
    it('应该显示搜索建议', async () => {
      render(<AdvancedSearchComponent {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/输入搜索查询/);

      await act(async () => {
        await userEvent.type(searchInput, '测试');
      });

      await waitFor(() => {
        expect(screen.getByText('🔍 测试建议1')).toBeInTheDocument();
        expect(screen.getByText('🔍 测试建议2')).toBeInTheDocument();
      });
    });

    it('应该在点击建议时选择建议', async () => {
      render(<AdvancedSearchComponent {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/输入搜索查询/);

      await act(async () => {
        await userEvent.type(searchInput, '测试');
      });

      await waitFor(() => {
        const suggestion = screen.getByText('🔍 测试建议1');
        expect(suggestion).toBeInTheDocument();
      });

      const suggestion = screen.getByText('🔍 测试建议1');

      await act(async () => {
        await userEvent.click(suggestion);
      });

      expect(searchInput).toHaveValue('测试建议1');
      expect(mockSearchEngine.search).toHaveBeenCalledWith('测试建议1', expect.any(Object));
    });

    it('应该在Escape键时隐藏建议', async () => {
      render(<AdvancedSearchComponent {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/输入搜索查询/);

      await act(async () => {
        await userEvent.type(searchInput, '测试');
      });

      await waitFor(() => {
        expect(screen.getByText('🔍 测试建议1')).toBeInTheDocument();
      });

      await act(async () => {
        await userEvent.keyboard('{Escape}');
      });

      await waitFor(() => {
        expect(screen.queryByText('🔍 测试建议1')).not.toBeInTheDocument();
      });
    });
  });

  describe('搜索历史测试', () => {
    it('应该保存搜索历史', async () => {
      render(<AdvancedSearchComponent {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/输入搜索查询/);

      await act(async () => {
        await userEvent.type(searchInput, '测试查询');
        await userEvent.keyboard('{Enter}');
      });

      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith(
          'minglog-search-history',
          JSON.stringify(['测试查询'])
        );
      });
    });

    it('应该加载保存的搜索历史', () => {
      const mockHistory = ['历史查询1', '历史查询2'];
      (localStorage.getItem as any).mockReturnValue(JSON.stringify(mockHistory));
      
      render(<AdvancedSearchComponent {...defaultProps} />);
      
      expect(localStorage.getItem).toHaveBeenCalledWith('minglog-search-history');
    });

    it('应该限制历史记录数量', async () => {
      const props = { ...defaultProps, maxHistoryItems: 2 };
      render(<AdvancedSearchComponent {...props} />);

      const searchInput = screen.getByPlaceholderText(/输入搜索查询/);

      // 执行多次搜索
      for (let i = 1; i <= 3; i++) {
        await act(async () => {
          await userEvent.clear(searchInput);
          await userEvent.type(searchInput, `查询${i}`);
          await userEvent.keyboard('{Enter}');
        });

        await waitFor(() => {
          expect(mockSearchEngine.search).toHaveBeenCalled();
        });
      }

      // 验证历史记录被限制在2个
      const lastCall = (localStorage.setItem as any).mock.calls.slice(-1)[0];
      const savedHistory = JSON.parse(lastCall[1]);
      expect(savedHistory).toHaveLength(2);
      expect(savedHistory).toEqual(['查询3', '查询2']);
    });
  });

  describe('清除功能测试', () => {
    it('应该清除搜索输入和结果', async () => {
      render(<AdvancedSearchComponent {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/输入搜索查询/);
      const clearBtn = screen.getByText('清除');

      // 先执行搜索
      await act(async () => {
        await userEvent.type(searchInput, '测试');
        await userEvent.keyboard('{Enter}');
      });

      await waitFor(() => {
        expect(screen.getByText(/测试文档1/)).toBeInTheDocument();
      });

      // 点击清除
      await act(async () => {
        await userEvent.click(clearBtn);
      });

      expect(searchInput).toHaveValue('');
      expect(screen.queryByText(/测试文档1/)).not.toBeInTheDocument();
    });
  });

  describe('回调函数测试', () => {
    it('应该调用onResults回调', async () => {
      const onResults = vi.fn();
      render(<AdvancedSearchComponent {...defaultProps} onResults={onResults} />);

      const searchInput = screen.getByPlaceholderText(/输入搜索查询/);

      await act(async () => {
        await userEvent.type(searchInput, '测试');
        await userEvent.keyboard('{Enter}');
      });

      await waitFor(() => {
        expect(onResults).toHaveBeenCalledWith(mockSearchResults);
      });
    });

    it('应该调用onDocumentClick回调', async () => {
      const onDocumentClick = vi.fn();
      render(<AdvancedSearchComponent {...defaultProps} onDocumentClick={onDocumentClick} />);

      const searchInput = screen.getByPlaceholderText(/输入搜索查询/);

      await act(async () => {
        await userEvent.type(searchInput, '测试');
        await userEvent.keyboard('{Enter}');
      });

      await waitFor(() => {
        expect(screen.getByText(/测试文档1/)).toBeInTheDocument();
      });

      const documentLink = screen.getByText(/测试文档1/);

      await act(async () => {
        await userEvent.click(documentLink);
      });

      expect(onDocumentClick).toHaveBeenCalledWith(mockDocuments[0]);
    });
  });

  describe('过滤器功能测试', () => {
    it('应该显示和隐藏高级选项', async () => {
      render(<AdvancedSearchComponent {...defaultProps} />);

      const advancedBtn = screen.getByTitle('高级选项');

      // 初始状态不显示高级选项
      expect(screen.queryByText('文件类型')).not.toBeInTheDocument();

      // 点击显示高级选项
      await userEvent.click(advancedBtn);

      expect(screen.getByText('文档类型:')).toBeInTheDocument();
      expect(screen.getByText('时间范围:')).toBeInTheDocument();

      // 再次点击隐藏高级选项
      await userEvent.click(advancedBtn);

      expect(screen.queryByText('文档类型:')).not.toBeInTheDocument();
    });

    it('应该应用文件类型过滤器', async () => {
      render(<AdvancedSearchComponent {...defaultProps} />);

      // 显示高级选项
      const advancedBtn = screen.getByTitle('高级选项');

      await act(async () => {
        await userEvent.click(advancedBtn);
      });

      // 选择文件类型过滤器 - 使用实际的checkbox
      const pageCheckbox = screen.getByRole('checkbox', { name: /page/ });

      await act(async () => {
        await userEvent.click(pageCheckbox);
      });

      // 执行搜索
      const searchInput = screen.getByPlaceholderText(/输入搜索查询/);

      await act(async () => {
        await userEvent.type(searchInput, '测试');
        await userEvent.keyboard('{Enter}');
      });

      // 验证搜索时应用了过滤器
      expect(mockSearchEngine.search).toHaveBeenCalledWith('测试',
        expect.objectContaining({
          filters: expect.objectContaining({
            fileTypes: ['page']
          })
        })
      );
    });

    it('应该应用标签过滤器', async () => {
      render(<AdvancedSearchComponent {...defaultProps} />);

      const advancedBtn = screen.getByTitle('高级选项');

      await act(async () => {
        await userEvent.click(advancedBtn);
      });

      // 选择tag类型过滤器
      const tagCheckbox = screen.getByRole('checkbox', { name: /tag/ });

      await act(async () => {
        await userEvent.click(tagCheckbox);
      });

      // 执行搜索
      const searchInput = screen.getByPlaceholderText(/输入搜索查询/);

      await act(async () => {
        await userEvent.type(searchInput, '内容');
        await userEvent.keyboard('{Enter}');
      });

      expect(mockSearchEngine.search).toHaveBeenCalledWith('内容',
        expect.objectContaining({
          filters: expect.objectContaining({
            fileTypes: ['tag']
          })
        })
      );
    });

    it('应该清除搜索查询', async () => {
      render(<AdvancedSearchComponent {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/输入搜索查询/);

      await act(async () => {
        await userEvent.type(searchInput, '测试查询');
      });

      expect(searchInput).toHaveValue('测试查询');

      // 清除搜索查询
      const clearBtn = screen.getByText('清除');

      await act(async () => {
        await userEvent.click(clearBtn);
      });

      // 验证查询被清除
      expect(searchInput).toHaveValue('');
    });
  });

  describe('搜索选项测试', () => {
    it('应该应用默认搜索选项', () => {
      const defaultOptions = {
        limit: 10,
        sortBy: 'title' as const,
        highlight: false
      };

      render(<AdvancedSearchComponent {...defaultProps} defaultOptions={defaultOptions} />);

      const searchInput = screen.getByPlaceholderText(/输入搜索查询/);
      fireEvent.change(searchInput, { target: { value: '测试' } });
      fireEvent.keyDown(searchInput, { key: 'Enter' });

      expect(mockSearchEngine.search).toHaveBeenCalledWith('测试',
        expect.objectContaining({
          limit: 10,
          sortBy: 'title',
          highlight: false
        })
      );
    });

    it('应该修改搜索选项', async () => {
      render(<AdvancedSearchComponent {...defaultProps} />);

      const advancedBtn = screen.getByTitle('高级选项');

      await act(async () => {
        await userEvent.click(advancedBtn);
      });

      // 修改结果数量限制 - 使用实际的select元素（默认值是20）
      const limitSelect = screen.getByDisplayValue('20'); // 每页结果的select

      await act(async () => {
        await userEvent.selectOptions(limitSelect, '50');
      });

      // 修改排序方式
      const sortSelect = screen.getByDisplayValue('相关性'); // 排序方式的select（显示文本）

      await act(async () => {
        await userEvent.selectOptions(sortSelect, 'title');
      });

      // 执行搜索
      const searchInput = screen.getByPlaceholderText(/输入搜索查询/);

      await act(async () => {
        await userEvent.type(searchInput, '测试');
        await userEvent.keyboard('{Enter}');
      });

      expect(mockSearchEngine.search).toHaveBeenCalledWith('测试',
        expect.objectContaining({
          limit: 50,
          sortBy: 'title'
        })
      );
    });
  });

  describe('加载状态测试', () => {
    it('应该显示加载状态', async () => {
      // Mock一个延迟的搜索
      let resolveSearch: (value: any) => void;
      const searchPromise = new Promise(resolve => {
        resolveSearch = resolve;
      });

      mockSearchEngine.search.mockImplementation(() => searchPromise);

      render(<AdvancedSearchComponent {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/输入搜索查询/);
      const searchBtn = screen.getByText('搜索');

      await act(async () => {
        await userEvent.type(searchInput, '测试');
      });

      // 点击搜索按钮
      await act(async () => {
        await userEvent.click(searchBtn);
      });

      // 验证加载状态 - 检查按钮状态和加载文本
      await waitFor(() => {
        expect(searchBtn).toBeDisabled();
        expect(searchBtn).toHaveTextContent('搜索中...');
      });

      // 完成搜索
      await act(async () => {
        resolveSearch!(mockSearchResults);
      });

      // 等待搜索完成
      await waitFor(() => {
        expect(screen.getByText('搜索')).toBeInTheDocument();
        expect(searchBtn).not.toBeDisabled();
      });
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
      const largeResults: SearchResult[] = Array.from({ length: 1000 }, (_, i) => ({
        document: {
          id: `doc${i}`,
          title: `文档${i}`,
          content: `内容${i}`,
          type: 'page' as const,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        score: 1.0 - i * 0.001,
        highlights: [],
        matchedFields: ['title']
      }));

      mockSearchEngine.search.mockReturnValue(largeResults);

      render(<AdvancedSearchComponent {...defaultProps} />);

      const searchInput = screen.getByPlaceholderText(/输入搜索查询/);

      const startTime = performance.now();

      await act(async () => {
        await userEvent.type(searchInput, '测试');
        await userEvent.keyboard('{Enter}');
      });

      await waitFor(() => {
        // 验证结果数量显示
        expect(screen.getByText(/找到.*1000.*个结果/)).toBeInTheDocument();
      });

      const endTime = performance.now();
      const searchTime = endTime - startTime;

      // 验证搜索处理时间合理（在测试环境中放宽限制）
      expect(searchTime).toBeLessThan(2000);
    });
  });

  describe('错误处理测试', () => {
    it('应该处理搜索引擎为null的情况', () => {
      expect(() => {
        render(<AdvancedSearchComponent {...defaultProps} searchEngine={null as any} />);
      }).not.toThrow();
    });

    it('应该处理localStorage错误', () => {
      (localStorage.getItem as any).mockImplementation(() => {
        throw new Error('localStorage error');
      });

      expect(() => {
        render(<AdvancedSearchComponent {...defaultProps} />);
      }).not.toThrow();
    });

    it('应该处理无效的搜索历史数据', () => {
      (localStorage.getItem as any).mockReturnValue('invalid json');

      expect(() => {
        render(<AdvancedSearchComponent {...defaultProps} />);
      }).not.toThrow();
    });
  });
});
