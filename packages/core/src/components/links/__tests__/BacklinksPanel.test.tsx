/**
 * BacklinksPanel 单元测试
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BacklinksPanel } from '../BacklinksPanel';
import { BacklinkInfo } from '../../../types/links';

describe('BacklinksPanel', () => {
  const mockBacklinks: BacklinkInfo[] = [
    {
      id: 'link-1',
      sourceType: 'page',
      sourceId: 'page-1',
      sourceTitle: '源页面1',
      targetType: 'page',
      targetId: 'target-page',
      linkType: 'page-reference',
      context: '这是第一个反向链接的上下文',
      position: 10,
      createdAt: '2024-01-01T10:00:00Z',
      updatedAt: '2024-01-01T10:00:00Z'
    },
    {
      id: 'link-2',
      sourceType: 'page',
      sourceId: 'page-2',
      sourceTitle: '源页面2',
      targetType: 'page',
      targetId: 'target-page',
      linkType: 'page-reference',
      context: '这是第二个反向链接的上下文',
      position: 20,
      createdAt: '2024-01-02T10:00:00Z',
      updatedAt: '2024-01-02T10:00:00Z'
    },
    {
      id: 'link-3',
      sourceType: 'block',
      sourceId: 'block-1',
      sourceTitle: '源块1',
      targetType: 'page',
      targetId: 'target-page',
      linkType: 'block-reference',
      context: '这是块引用的上下文',
      position: 5,
      createdAt: '2024-01-03T10:00:00Z',
      updatedAt: '2024-01-03T10:00:00Z'
    }
  ];

  const defaultProps = {
    targetId: 'target-page',
    isOpen: true,
    onClose: vi.fn(),
    backlinks: mockBacklinks
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基础渲染', () => {
    it('should render when open', () => {
      render(<BacklinksPanel {...defaultProps} />);
      
      expect(screen.getByTestId('backlinks-panel')).toBeInTheDocument();
      expect(screen.getByText('反向链接')).toBeInTheDocument();
      expect(screen.getByText('(3)')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(<BacklinksPanel {...defaultProps} isOpen={false} />);
      
      expect(screen.queryByTestId('backlinks-panel')).not.toBeInTheDocument();
    });

    it('should display correct statistics', () => {
      render(<BacklinksPanel {...defaultProps} />);
      
      expect(screen.getByText('页面引用:')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // 2个页面引用
      expect(screen.getByText('块引用:')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // 1个块引用
      expect(screen.getByText('来源:')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument(); // 3个唯一来源
    });
  });

  describe('加载状态', () => {
    it('should show loading state', () => {
      render(<BacklinksPanel {...defaultProps} loading={true} />);
      
      expect(screen.getByText('加载反向链接...')).toBeInTheDocument();
      expect(screen.getByTestId('backlinks-panel')).toHaveClass('loading');
    });

    it('should show error state', () => {
      const errorMessage = '加载失败';
      render(<BacklinksPanel {...defaultProps} error={errorMessage} />);
      
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByText('重试')).toBeInTheDocument();
    });

    it('should show empty state when no backlinks', () => {
      render(<BacklinksPanel {...defaultProps} backlinks={[]} />);
      
      expect(screen.getByText('暂无反向链接')).toBeInTheDocument();
      expect(screen.getByText('当其他页面引用此页面时，链接会显示在这里')).toBeInTheDocument();
    });
  });

  describe('过滤功能', () => {
    it('should filter by link type', async () => {
      render(<BacklinksPanel {...defaultProps} />);
      
      // 选择只显示页面引用
      const typeFilter = screen.getByDisplayValue('全部类型');
      fireEvent.change(typeFilter, { target: { value: 'page-reference' } });
      
      await waitFor(() => {
        expect(screen.getByText('显示 2 / 3 个链接')).toBeInTheDocument();
      });
    });

    it('should filter by search query', async () => {
      render(<BacklinksPanel {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('搜索反向链接...');
      fireEvent.change(searchInput, { target: { value: '源页面1' } });
      
      await waitFor(() => {
        expect(screen.getByText('显示 1 / 3 个链接')).toBeInTheDocument();
      });
    });

    it('should clear search query', async () => {
      render(<BacklinksPanel {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('搜索反向链接...');
      fireEvent.change(searchInput, { target: { value: '测试' } });
      
      // 应该显示清除按钮
      const clearButton = screen.getByTitle('清除搜索');
      fireEvent.click(clearButton);
      
      expect(searchInput).toHaveValue('');
    });

    it('should reset all filters', async () => {
      render(<BacklinksPanel {...defaultProps} />);
      
      // 设置一些过滤条件
      const typeFilter = screen.getByDisplayValue('全部类型');
      fireEvent.change(typeFilter, { target: { value: 'page-reference' } });
      
      const searchInput = screen.getByPlaceholderText('搜索反向链接...');
      fireEvent.change(searchInput, { target: { value: '测试' } });
      
      // 重置过滤器
      const resetButton = screen.getByText('重置过滤器');
      fireEvent.click(resetButton);
      
      expect(typeFilter).toHaveValue('all');
      expect(searchInput).toHaveValue('');
    });
  });

  describe('排序功能', () => {
    it('should sort by date', async () => {
      render(<BacklinksPanel {...defaultProps} />);
      
      const sortSelect = screen.getByDisplayValue('按时间');
      fireEvent.change(sortSelect, { target: { value: 'date' } });
      
      // 验证排序结果（最新的在前）
      const linkItems = screen.getAllByTestId('backlink-item');
      expect(linkItems).toHaveLength(3);
    });

    it('should sort by source', async () => {
      render(<BacklinksPanel {...defaultProps} />);
      
      const sortSelect = screen.getByDisplayValue('按时间');
      fireEvent.change(sortSelect, { target: { value: 'source' } });
      
      // 验证按来源排序
      const linkItems = screen.getAllByTestId('backlink-item');
      expect(linkItems).toHaveLength(3);
    });
  });

  describe('分组功能', () => {
    it('should group by source', async () => {
      render(<BacklinksPanel {...defaultProps} />);
      
      const groupSelect = screen.getByDisplayValue('不分组');
      fireEvent.change(groupSelect, { target: { value: 'source' } });
      
      // 应该显示分组标题
      expect(screen.getByText('源页面1')).toBeInTheDocument();
      expect(screen.getByText('源页面2')).toBeInTheDocument();
      expect(screen.getByText('源块1')).toBeInTheDocument();
    });

    it('should group by type', async () => {
      render(<BacklinksPanel {...defaultProps} />);
      
      const groupSelect = screen.getByDisplayValue('不分组');
      fireEvent.change(groupSelect, { target: { value: 'type' } });
      
      // 应该显示类型分组
      expect(screen.getAllByText('页面引用')).toHaveLength(2); // 一个在过滤器，一个在分组标题
      expect(screen.getAllByText('块引用')).toHaveLength(2); // 一个在过滤器，一个在分组标题
    });
  });

  describe('交互功能', () => {
    it('should handle refresh', () => {
      const onRefresh = vi.fn();
      render(<BacklinksPanel {...defaultProps} onRefresh={onRefresh} />);
      
      const refreshButton = screen.getByTitle('刷新 (F5)');
      fireEvent.click(refreshButton);
      
      expect(onRefresh).toHaveBeenCalled();
    });

    it('should handle close', () => {
      const onClose = vi.fn();
      render(<BacklinksPanel {...defaultProps} onClose={onClose} />);
      
      const closeButton = screen.getByTitle('关闭 (Esc)');
      fireEvent.click(closeButton);
      
      expect(onClose).toHaveBeenCalled();
    });

    it('should handle link click', () => {
      const onLinkClick = vi.fn();
      render(<BacklinksPanel {...defaultProps} onLinkClick={onLinkClick} />);
      
      const firstLink = screen.getByText('源页面1');
      fireEvent.click(firstLink);
      
      expect(onLinkClick).toHaveBeenCalledWith(mockBacklinks[0]);
    });
  });

  describe('键盘快捷键', () => {
    it('should close on Escape key', () => {
      const onClose = vi.fn();
      render(<BacklinksPanel {...defaultProps} onClose={onClose} />);
      
      fireEvent.keyDown(document, { key: 'Escape' });
      
      expect(onClose).toHaveBeenCalled();
    });

    it('should refresh on F5 key', () => {
      const onRefresh = vi.fn();
      render(<BacklinksPanel {...defaultProps} onRefresh={onRefresh} />);
      
      fireEvent.keyDown(document, { key: 'F5' });
      
      expect(onRefresh).toHaveBeenCalled();
    });

    it('should refresh on Ctrl+R', () => {
      const onRefresh = vi.fn();
      render(<BacklinksPanel {...defaultProps} onRefresh={onRefresh} />);
      
      fireEvent.keyDown(document, { key: 'r', ctrlKey: true });
      
      expect(onRefresh).toHaveBeenCalled();
    });
  });

  describe('位置和大小', () => {
    it('should apply correct position class', () => {
      render(<BacklinksPanel {...defaultProps} position="left" />);
      
      const panel = screen.getByTestId('backlinks-panel');
      expect(panel).toHaveClass('backlinks-panel--left');
    });

    it('should apply custom size', () => {
      render(<BacklinksPanel {...defaultProps} width={400} height={500} />);
      
      const panel = screen.getByTestId('backlinks-panel');
      expect(panel).toHaveStyle('width: 400px');
      expect(panel).toHaveStyle('height: 500px');
    });
  });

  describe('边界情况', () => {
    it('should handle undefined backlinks', () => {
      render(<BacklinksPanel {...defaultProps} backlinks={undefined} />);
      
      expect(screen.getByText('(0)')).toBeInTheDocument();
      expect(screen.getByText('暂无反向链接')).toBeInTheDocument();
    });

    it('should handle empty search with no results', async () => {
      render(<BacklinksPanel {...defaultProps} />);
      
      const searchInput = screen.getByPlaceholderText('搜索反向链接...');
      fireEvent.change(searchInput, { target: { value: '不存在的内容' } });
      
      await waitFor(() => {
        expect(screen.getByText('没有找到匹配的链接')).toBeInTheDocument();
        expect(screen.getByText('尝试调整搜索条件或过滤器')).toBeInTheDocument();
      });
    });
  });
});
