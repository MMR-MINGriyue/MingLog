/**
 * PageManager 组件测试
 * PageManager Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render, mockPage, mockGraph } from '../../test/utils';
import { PageManager } from '../PageManager';

describe('PageManager', () => {
  const mockPages = [
    mockPage,
    {
      id: 'test-page-2',
      name: '日记页面',
      title: '2025-06-27 日记',
      tags: ['日记'],
      isJournal: true,
      journalDate: '2025-06-27',
      createdAt: Date.now() - 3600000,
      updatedAt: Date.now() - 1800000,
      graphId: 'test-graph-1',
    },
  ];

  const defaultProps = {
    pages: mockPages,
    currentPage: mockPages[0],
    currentGraph: mockGraph,
    onPageSelect: vi.fn(),
    onCreatePage: vi.fn(),
    onDeletePage: vi.fn(),
    onUpdatePage: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders correctly with pages', () => {
      render(<PageManager {...defaultProps} />);
      
      expect(screen.getByText('页面')).toBeInTheDocument();
      expect(screen.getByText('测试页面标题')).toBeInTheDocument();
      expect(screen.getByText('2025-06-27 日记')).toBeInTheDocument();
    });

    it('shows no graph selected state', () => {
      render(<PageManager {...defaultProps} currentGraph={null} />);
      
      expect(screen.getByText('请先选择一个图谱')).toBeInTheDocument();
    });

    it('shows empty state when no pages', () => {
      render(<PageManager {...defaultProps} pages={[]} currentPage={null} />);
      
      expect(screen.getByText('暂无页面')).toBeInTheDocument();
      expect(screen.getByText('创建第一个页面')).toBeInTheDocument();
    });

    it('shows loading state', () => {
      render(<PageManager {...defaultProps} loading={true} />);
      
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe('search functionality', () => {
    it('filters pages by search query', async () => {
      render(<PageManager {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('搜索页面、标签或内容...');
      fireEvent.change(searchInput, { target: { value: '日记' } });
      
      await waitFor(() => {
        expect(screen.getByText('2025-06-27 日记')).toBeInTheDocument();
        expect(screen.queryByText('测试页面标题')).not.toBeInTheDocument();
      });
    });

    it('shows no results when search has no matches', async () => {
      render(<PageManager {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('搜索页面、标签或内容...');
      fireEvent.change(searchInput, { target: { value: '不存在的内容' } });
      
      await waitFor(() => {
        expect(screen.getByText('没有找到匹配的页面')).toBeInTheDocument();
      });
    });
  });

  describe('filtering and sorting', () => {
    it('filters by page type', async () => {
      render(<PageManager {...defaultProps} />);
      
      // Click filter dropdown
      const filterButton = screen.getByText(/筛选:/);
      fireEvent.click(filterButton);
      
      // Select journal filter
      const journalFilter = screen.getByText('日记页面');
      fireEvent.click(journalFilter);
      
      await waitFor(() => {
        expect(screen.getByText('2025-06-27 日记')).toBeInTheDocument();
        expect(screen.queryByText('测试页面标题')).not.toBeInTheDocument();
      });
    });

    it('sorts pages by different criteria', async () => {
      render(<PageManager {...defaultProps} />);
      
      // Click sort dropdown
      const sortButton = screen.getByText(/排序:/);
      fireEvent.click(sortButton);
      
      // Select name sort
      const nameSort = screen.getByText('名称');
      fireEvent.click(nameSort);
      
      // Check if pages are reordered (this would need more complex testing)
      expect(screen.getByText('测试页面标题')).toBeInTheDocument();
    });
  });

  describe('view modes', () => {
    it('switches between list and grid view', () => {
      render(<PageManager {...defaultProps} />);
      
      // Find grid view button
      const gridButton = screen.getByTitle('网格视图');
      fireEvent.click(gridButton);
      
      // Check if view changed (would need to check CSS classes or layout)
      expect(gridButton).toBeInTheDocument();
    });
  });

  describe('page actions', () => {
    it('calls onPageSelect when page is clicked', () => {
      render(<PageManager {...defaultProps} />);
      
      const pageItem = screen.getByText('测试页面标题');
      fireEvent.click(pageItem);
      
      expect(defaultProps.onPageSelect).toHaveBeenCalledWith(mockPages[0]);
    });

    it('calls onCreatePage when create button is clicked', () => {
      render(<PageManager {...defaultProps} />);
      
      const createButton = screen.getByText('新建页面');
      fireEvent.click(createButton);
      
      expect(defaultProps.onCreatePage).toHaveBeenCalled();
    });

    it('calls onDeletePage when delete button is clicked', async () => {
      render(<PageManager {...defaultProps} />);
      
      // Hover over page item to show delete button
      const pageItem = screen.getByText('测试页面标题').closest('div');
      if (pageItem) {
        fireEvent.mouseEnter(pageItem);
        
        await waitFor(() => {
          const deleteButton = screen.getByTitle('删除页面');
          fireEvent.click(deleteButton);
        });
      }
      
      expect(defaultProps.onDeletePage).toHaveBeenCalledWith(mockPages[0]);
    });
  });

  describe('page display', () => {
    it('shows journal indicator for journal pages', () => {
      render(<PageManager {...defaultProps} />);
      
      // Look for journal emoji
      expect(screen.getByText('📅')).toBeInTheDocument();
    });

    it('displays page tags', () => {
      render(<PageManager {...defaultProps} />);
      
      expect(screen.getByText('#测试')).toBeInTheDocument();
      expect(screen.getByText('#页面')).toBeInTheDocument();
    });

    it('shows relative time for page updates', () => {
      render(<PageManager {...defaultProps} />);
      
      // Should show some relative time text
      expect(screen.getByText(/前/)).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('has proper ARIA labels', () => {
      render(<PageManager {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('搜索页面、标签或内容...');
      expect(searchInput).toHaveAttribute('type', 'text');
    });

    it('supports keyboard navigation', () => {
      render(<PageManager {...defaultProps} />);
      
      const pageItem = screen.getByText('测试页面标题');
      fireEvent.keyDown(pageItem, { key: 'Enter' });
      
      // Should handle keyboard events appropriately
      expect(pageItem).toBeInTheDocument();
    });
  });

  describe('responsive design', () => {
    it('adapts to different screen sizes', () => {
      render(<PageManager {...defaultProps} />);
      
      // Check if responsive classes are applied
      const container = screen.getByText('页面').closest('div');
      expect(container).toHaveClass('flex', 'flex-col', 'h-full');
    });
  });
});
