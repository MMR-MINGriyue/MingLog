/**
 * LinkGraphComponent 简化测试
 * 专注于组件渲染和基础功能验证，避免D3.js复杂集成问题
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MockFactory } from '../../test/TestInfrastructureSetup';
import type { LinkGraphData } from '../../types/links';

// 完全Mock D3.js，避免实际DOM操作
vi.mock('d3', () => ({
  select: vi.fn(() => ({
    selectAll: vi.fn(() => ({
      remove: vi.fn()
    })),
    append: vi.fn(() => ({
      attr: vi.fn(() => ({ attr: vi.fn() }))
    })),
    call: vi.fn()
  })),
  forceSimulation: vi.fn(() => ({
    nodes: vi.fn(() => ({ nodes: vi.fn() })),
    force: vi.fn(() => ({ force: vi.fn() })),
    on: vi.fn(() => ({ on: vi.fn() })),
    stop: vi.fn()
  })),
  forceLink: vi.fn(() => ({
    id: vi.fn(() => ({ id: vi.fn() })),
    distance: vi.fn(() => ({ distance: vi.fn() }))
  })),
  forceManyBody: vi.fn(() => ({
    strength: vi.fn(() => ({ strength: vi.fn() }))
  })),
  forceCenter: vi.fn(() => ({ forceCenter: vi.fn() })),
  forceCollide: vi.fn(() => ({ radius: vi.fn() })),
  zoom: vi.fn(() => ({
    scaleExtent: vi.fn(() => ({ scaleExtent: vi.fn() })),
    on: vi.fn(() => ({ on: vi.fn() }))
  })),
  drag: vi.fn(() => ({
    on: vi.fn(() => ({ on: vi.fn() }))
  })),
  hierarchy: vi.fn(() => ({
    descendants: vi.fn(() => [])
  })),
  tree: vi.fn(() => vi.fn())
}));

// 现在导入组件
import { LinkGraphComponent } from './LinkGraphComponent';

describe('LinkGraphComponent - 简化测试', () => {
  // 测试数据
  const defaultGraphData: LinkGraphData = MockFactory.createMockGraphData();
  
  const defaultProps = {
    data: defaultGraphData,
    width: 800,
    height: 600
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('基础渲染测试', () => {
    it('应该正确渲染图谱容器', () => {
      render(<LinkGraphComponent {...defaultProps} />);
      
      // 验证容器元素存在
      const container = document.querySelector('.link-graph-component');
      expect(container).toBeInTheDocument();
      expect(container).toHaveStyle({ width: '800px', height: '600px' });
    });

    it('应该渲染SVG元素', () => {
      render(<LinkGraphComponent {...defaultProps} />);
      
      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('width', '800');
      expect(svg).toHaveAttribute('height', '600');
    });

    it('应该应用正确的SVG样式', () => {
      render(<LinkGraphComponent {...defaultProps} />);
      
      const svg = document.querySelector('svg');
      expect(svg).toHaveStyle({
        border: '1px solid #e0e0e0',
        borderRadius: '4px'
      });
    });

    it('应该使用默认尺寸', () => {
      const { data } = defaultProps;
      render(<LinkGraphComponent data={data} />);
      
      const svg = document.querySelector('svg');
      expect(svg).toHaveAttribute('width', '800');
      expect(svg).toHaveAttribute('height', '600');
    });

    it('应该处理空数据', () => {
      const emptyData: LinkGraphData = { nodes: [], edges: [] };
      
      expect(() => {
        render(<LinkGraphComponent {...defaultProps} data={emptyData} />);
      }).not.toThrow();
      
      const container = document.querySelector('.link-graph-component');
      expect(container).toBeInTheDocument();
    });
  });

  describe('Props验证测试', () => {
    it('应该接受自定义尺寸', () => {
      render(<LinkGraphComponent {...defaultProps} width={1000} height={800} />);
      
      const container = document.querySelector('.link-graph-component');
      expect(container).toHaveStyle({ width: '1000px', height: '800px' });
      
      const svg = document.querySelector('svg');
      expect(svg).toHaveAttribute('width', '1000');
      expect(svg).toHaveAttribute('height', '800');
    });

    it('应该接受回调函数', () => {
      const onNodeClick = vi.fn();
      const onEdgeClick = vi.fn();
      const onNodeHover = vi.fn();
      
      expect(() => {
        render(
          <LinkGraphComponent 
            {...defaultProps} 
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onNodeHover={onNodeHover}
          />
        );
      }).not.toThrow();
    });

    it('应该接受布局配置', () => {
      expect(() => {
        render(<LinkGraphComponent {...defaultProps} layout="hierarchy" />);
      }).not.toThrow();
      
      expect(() => {
        render(<LinkGraphComponent {...defaultProps} layout="circular" />);
      }).not.toThrow();
      
      expect(() => {
        render(<LinkGraphComponent {...defaultProps} layout="grid" />);
      }).not.toThrow();
    });

    it('应该接受交互配置', () => {
      expect(() => {
        render(<LinkGraphComponent {...defaultProps} enableDrag={false} />);
      }).not.toThrow();
      
      expect(() => {
        render(<LinkGraphComponent {...defaultProps} enableZoom={false} />);
      }).not.toThrow();
    });
  });

  describe('错误处理测试', () => {
    it('应该处理无效数据', () => {
      const invalidData = {
        nodes: [{ id: 'invalid' }],
        edges: [{ source: 'nonexistent', target: 'also-nonexistent' }]
      } as any;
      
      expect(() => {
        render(<LinkGraphComponent data={invalidData} width={800} height={600} />);
      }).not.toThrow();
    });

    it('应该处理负数尺寸', () => {
      expect(() => {
        render(<LinkGraphComponent {...defaultProps} width={-100} height={-100} />);
      }).not.toThrow();
    });

    it('应该处理零尺寸', () => {
      expect(() => {
        render(<LinkGraphComponent {...defaultProps} width={0} height={0} />);
      }).not.toThrow();
    });
  });

  describe('性能测试', () => {
    it('应该快速渲染小型图谱', () => {
      const startTime = performance.now();
      
      render(<LinkGraphComponent {...defaultProps} />);
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // 验证渲染时间合理（小于50ms）
      expect(renderTime).toBeLessThan(50);
    });

    it('应该处理大型数据集', () => {
      const largeGraphData = MockFactory.createLargeGraphData(1000);
      
      expect(() => {
        render(<LinkGraphComponent data={largeGraphData} width={800} height={600} />);
      }).not.toThrow();
    });
  });

  describe('组件生命周期测试', () => {
    it('应该正确卸载', () => {
      const { unmount } = render(<LinkGraphComponent {...defaultProps} />);
      
      expect(() => {
        unmount();
      }).not.toThrow();
    });

    it('应该响应数据更新', () => {
      const { rerender } = render(<LinkGraphComponent {...defaultProps} />);
      
      const newData = {
        nodes: [{ id: 'new-node', type: 'page', title: '新节点' }],
        edges: []
      };
      
      expect(() => {
        rerender(<LinkGraphComponent data={newData} width={800} height={600} />);
      }).not.toThrow();
    });

    it('应该响应尺寸变化', () => {
      const { rerender } = render(<LinkGraphComponent {...defaultProps} />);
      
      rerender(<LinkGraphComponent {...defaultProps} width={1000} height={800} />);
      
      const svg = document.querySelector('svg');
      expect(svg).toHaveAttribute('width', '1000');
      expect(svg).toHaveAttribute('height', '800');
    });
  });
});
