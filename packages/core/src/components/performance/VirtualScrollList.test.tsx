/**
 * VirtualScrollList 单元测试
 * 测试虚拟滚动组件的性能和功能
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VirtualScrollList } from './VirtualScrollList';
import { testUtils } from '@test/setup';
import type { VirtualScrollItem } from './VirtualScrollList';

describe('VirtualScrollList', () => {
  let mockItems: VirtualScrollItem[];
  let mockRenderItem: vi.Mock;

  beforeEach(() => {
    mockItems = Array.from({ length: 1000 }, (_, index) => ({
      id: `item-${index}`,
      data: {
        title: `Item ${index}`,
        content: `Content for item ${index}`
      }
    }));

    mockRenderItem = vi.fn((item, index) => (
      <div key={item.id} data-testid={`item-${index}`}>
        {item.data.title}
      </div>
    ));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('基本渲染', () => {
    it('应该正确渲染虚拟滚动容器', () => {
      render(
        <VirtualScrollList
          items={mockItems.slice(0, 10)}
          height={400}
          renderItem={mockRenderItem}
        />
      );

      const container = screen.getByTestId('virtual-scroll-list');
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('virtual-scroll-list');
    });

    it('应该设置正确的容器高度', () => {
      render(
        <VirtualScrollList
          items={mockItems.slice(0, 10)}
          height={400}
          renderItem={mockRenderItem}
        />
      );

      const container = screen.getByTestId('virtual-scroll-list');
      expect(container).toHaveStyle({ height: '400px' });
    });

    it('应该只渲染可见区域的项目', () => {
      render(
        <VirtualScrollList
          items={mockItems}
          height={400}
          itemHeight={50}
          renderItem={mockRenderItem}
        />
      );

      // 在400px高度和50px项目高度下，应该只渲染约8个可见项目 + 缓冲区
      const renderedItems = screen.getAllByTestId(/^item-/);
      expect(renderedItems.length).toBeLessThan(20); // 包含缓冲区
      expect(renderedItems.length).toBeGreaterThan(5);
    });
  });

  describe('滚动功能', () => {
    it('应该响应滚动事件', async () => {
      const onScroll = vi.fn();
      
      render(
        <VirtualScrollList
          items={mockItems}
          height={400}
          itemHeight={50}
          renderItem={mockRenderItem}
          onScroll={onScroll}
        />
      );

      const container = screen.getByTestId('virtual-scroll-list');
      
      fireEvent.scroll(container, { target: { scrollTop: 100 } });
      
      await waitFor(() => {
        expect(onScroll).toHaveBeenCalled();
      });
    });

    it('应该在滚动时更新可见项目', async () => {
      render(
        <VirtualScrollList
          items={mockItems}
          height={400}
          itemHeight={50}
          renderItem={mockRenderItem}
        />
      );

      const container = screen.getByTestId('virtual-scroll-list');
      
      // 初始状态
      expect(screen.queryByTestId('item-0')).toBeInTheDocument();
      expect(screen.queryByTestId('item-20')).not.toBeInTheDocument();

      // 滚动到中间
      fireEvent.scroll(container, { target: { scrollTop: 1000 } });

      await waitFor(() => {
        expect(screen.queryByTestId('item-0')).not.toBeInTheDocument();
        expect(screen.queryByTestId('item-20')).toBeInTheDocument();
      });
    });

    it('应该正确计算滚动容器的总高度', () => {
      render(
        <VirtualScrollList
          items={mockItems.slice(0, 100)}
          height={400}
          itemHeight={50}
          renderItem={mockRenderItem}
        />
      );

      const spacer = screen.getByTestId('virtual-scroll-spacer');
      expect(spacer).toHaveStyle({ height: '5000px' }); // 100 * 50px
    });
  });

  describe('动态高度支持', () => {
    it('应该支持动态高度项目', () => {
      const dynamicItems = mockItems.slice(0, 10).map((item, index) => ({
        ...item,
        height: 50 + (index % 3) * 20 // 不同高度
      }));

      render(
        <VirtualScrollList
          items={dynamicItems}
          height={400}
          dynamicHeight={true}
          renderItem={mockRenderItem}
        />
      );

      const container = screen.getByTestId('virtual-scroll-list');
      expect(container).toBeInTheDocument();
    });

    it('应该在动态高度模式下正确计算位置', async () => {
      const dynamicItems = [
        { id: 'item-1', height: 100, data: { title: 'Item 1' } },
        { id: 'item-2', height: 150, data: { title: 'Item 2' } },
        { id: 'item-3', height: 80, data: { title: 'Item 3' } }
      ];

      render(
        <VirtualScrollList
          items={dynamicItems}
          height={400}
          dynamicHeight={true}
          renderItem={mockRenderItem}
        />
      );

      // 验证总高度计算正确
      const spacer = screen.getByTestId('virtual-scroll-spacer');
      expect(spacer).toHaveStyle({ height: '330px' }); // 100 + 150 + 80
    });
  });

  describe('懒加载功能', () => {
    it('应该在接近底部时触发加载更多', async () => {
      const onLoadMore = vi.fn();
      
      render(
        <VirtualScrollList
          items={mockItems.slice(0, 20)}
          height={400}
          itemHeight={50}
          renderItem={mockRenderItem}
          onLoadMore={onLoadMore}
          hasMore={true}
        />
      );

      const container = screen.getByTestId('virtual-scroll-list');
      
      // 滚动到接近底部
      const scrollHeight = 20 * 50; // 总高度
      const scrollTop = scrollHeight - 400 - 100; // 距离底部100px
      
      fireEvent.scroll(container, { 
        target: { 
          scrollTop,
          scrollHeight,
          clientHeight: 400
        } 
      });

      await waitFor(() => {
        expect(onLoadMore).toHaveBeenCalled();
      });
    });

    it('应该显示加载指示器', () => {
      render(
        <VirtualScrollList
          items={mockItems.slice(0, 10)}
          height={400}
          itemHeight={50}
          renderItem={mockRenderItem}
          loading={true}
        />
      );

      const loadingIndicator = screen.getByTestId('virtual-scroll-loading');
      expect(loadingIndicator).toBeInTheDocument();
      expect(loadingIndicator).toHaveTextContent('加载中...');
    });

    it('应该在没有更多数据时不触发加载', async () => {
      const onLoadMore = vi.fn();
      
      render(
        <VirtualScrollList
          items={mockItems.slice(0, 10)}
          height={400}
          itemHeight={50}
          renderItem={mockRenderItem}
          onLoadMore={onLoadMore}
          hasMore={false}
        />
      );

      const container = screen.getByTestId('virtual-scroll-list');
      
      fireEvent.scroll(container, { 
        target: { 
          scrollTop: 1000,
          scrollHeight: 1000,
          clientHeight: 400
        } 
      });

      await testUtils.waitFor(() => false, 100); // 等待100ms
      expect(onLoadMore).not.toHaveBeenCalled();
    });
  });

  describe('缓冲区管理', () => {
    it('应该根据缓冲区大小渲染额外项目', () => {
      render(
        <VirtualScrollList
          items={mockItems}
          height={400}
          itemHeight={50}
          overscan={10}
          renderItem={mockRenderItem}
        />
      );

      // 验证渲染的项目数量包含缓冲区
      const renderedItems = screen.getAllByTestId(/^item-/);
      expect(renderedItems.length).toBeGreaterThan(8); // 可见项目 + 缓冲区
    });

    it('应该在缓冲区为0时只渲染可见项目', () => {
      render(
        <VirtualScrollList
          items={mockItems}
          height={400}
          itemHeight={50}
          overscan={0}
          renderItem={mockRenderItem}
        />
      );

      const renderedItems = screen.getAllByTestId(/^item-/);
      expect(renderedItems.length).toBeLessThanOrEqual(8); // 只有可见项目
    });
  });

  describe('性能测试', () => {
    it('应该处理大量数据而不影响性能', () => {
      const largeItems = Array.from({ length: 100000 }, (_, index) => ({
        id: `large-item-${index}`,
        data: { title: `Large Item ${index}` }
      }));

      const start = performance.now();
      
      render(
        <VirtualScrollList
          items={largeItems}
          height={400}
          itemHeight={50}
          renderItem={mockRenderItem}
        />
      );

      const end = performance.now();
      
      // 渲染时间应该在合理范围内
      expect(end - start).toBeLessThan(100);
      
      // 只应该渲染可见项目
      const renderedItems = screen.getAllByTestId(/^item-/);
      expect(renderedItems.length).toBeLessThan(50);
    });

    it('应该在快速滚动时保持性能', async () => {
      render(
        <VirtualScrollList
          items={mockItems}
          height={400}
          itemHeight={50}
          renderItem={mockRenderItem}
        />
      );

      const container = screen.getByTestId('virtual-scroll-list');
      
      // 快速连续滚动
      for (let i = 0; i < 10; i++) {
        fireEvent.scroll(container, { target: { scrollTop: i * 100 } });
      }

      // 应该没有性能问题
      await waitFor(() => {
        expect(container).toBeInTheDocument();
      });
    });
  });

  describe('错误处理', () => {
    it('应该处理空项目列表', () => {
      expect(() => {
        render(
          <VirtualScrollList
            items={[]}
            height={400}
            renderItem={mockRenderItem}
          />
        );
      }).not.toThrow();
    });

    it('应该处理无效的项目高度', () => {
      expect(() => {
        render(
          <VirtualScrollList
            items={mockItems.slice(0, 10)}
            height={400}
            itemHeight={0}
            renderItem={mockRenderItem}
          />
        );
      }).not.toThrow();
    });

    it('应该处理渲染函数错误', () => {
      const errorRenderItem = vi.fn(() => {
        throw new Error('Render error');
      });

      expect(() => {
        render(
          <VirtualScrollList
            items={mockItems.slice(0, 1)}
            height={400}
            renderItem={errorRenderItem}
          />
        );
      }).toThrow();
    });
  });

  describe('自定义样式', () => {
    it('应该应用自定义类名', () => {
      render(
        <VirtualScrollList
          items={mockItems.slice(0, 10)}
          height={400}
          renderItem={mockRenderItem}
          className="custom-virtual-list"
        />
      );

      const container = screen.getByTestId('virtual-scroll-list');
      expect(container).toHaveClass('custom-virtual-list');
    });

    it('应该在滚动时添加滚动状态类', async () => {
      render(
        <VirtualScrollList
          items={mockItems}
          height={400}
          itemHeight={50}
          renderItem={mockRenderItem}
        />
      );

      const container = screen.getByTestId('virtual-scroll-list');
      
      fireEvent.scroll(container, { target: { scrollTop: 100 } });
      
      await waitFor(() => {
        expect(container).toHaveClass('scrolling');
      });

      // 等待滚动结束
      await testUtils.waitFor(() => !container.classList.contains('scrolling'), 200);
    });
  });
});
