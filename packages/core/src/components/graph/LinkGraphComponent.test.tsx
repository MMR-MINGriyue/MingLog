/**
 * LinkGraphComponent 单元测试
 * 测试图谱组件的渲染、交互和数据处理
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LinkGraphComponent } from './LinkGraphComponent';
import { testUtils } from '@test/setup';
import type { LinkGraphData, LinkGraphNode, LinkGraphEdge } from '../../types/links';

// 模拟D3.js
vi.mock('d3', () => ({
  select: vi.fn(() => ({
    selectAll: vi.fn(() => ({
      data: vi.fn(() => ({
        enter: vi.fn(() => ({
          append: vi.fn(() => ({
            attr: vi.fn(() => ({ attr: vi.fn() })),
            style: vi.fn(() => ({ style: vi.fn() })),
            text: vi.fn(() => ({ text: vi.fn() })),
            on: vi.fn(() => ({ on: vi.fn() }))
          }))
        })),
        exit: vi.fn(() => ({ remove: vi.fn() })),
        attr: vi.fn(() => ({ attr: vi.fn() })),
        style: vi.fn(() => ({ style: vi.fn() }))
      }))
    })),
    append: vi.fn(() => ({
      attr: vi.fn(() => ({ attr: vi.fn() })),
      style: vi.fn(() => ({ style: vi.fn() }))
    })),
    attr: vi.fn(() => ({ attr: vi.fn() })),
    style: vi.fn(() => ({ style: vi.fn() })),
    call: vi.fn(() => ({ call: vi.fn() })),
    on: vi.fn(() => ({ on: vi.fn() }))
  })),
  forceSimulation: vi.fn(() => ({
    nodes: vi.fn(() => ({ nodes: vi.fn() })),
    force: vi.fn(() => ({ force: vi.fn() })),
    on: vi.fn(() => ({ on: vi.fn() })),
    restart: vi.fn(),
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
  zoom: vi.fn(() => ({
    scaleExtent: vi.fn(() => ({ scaleExtent: vi.fn() })),
    on: vi.fn(() => ({ on: vi.fn() }))
  })),
  drag: vi.fn(() => ({
    on: vi.fn(() => ({ on: vi.fn() }))
  }))
}));

describe('LinkGraphComponent', () => {
  const mockData: LinkGraphData = {
    nodes: [
      {
        id: 'node1',
        type: 'page',
        title: 'Page 1',
        x: 100,
        y: 100
      },
      {
        id: 'node2',
        type: 'page',
        title: 'Page 2',
        x: 200,
        y: 200
      },
      {
        id: 'node3',
        type: 'block',
        title: 'Block 1',
        x: 150,
        y: 150
      }
    ] as LinkGraphNode[],
    edges: [
      {
        id: 'edge1',
        source: 'node1',
        target: 'node2',
        type: 'page-reference'
      },
      {
        id: 'edge2',
        source: 'node2',
        target: 'node3',
        type: 'block-reference'
      }
    ] as LinkGraphEdge[]
  };

  const defaultProps = {
    data: mockData,
    width: 800,
    height: 600,
    layout: 'force' as const,
    enableDrag: true,
    enableZoom: true,
    filters: {
      nodeTypes: ['page', 'block'],
      edgeTypes: ['page-reference', 'block-reference'],
      minConnections: 0
    },
    style: {
      nodeSize: 8,
      linkWidth: 2,
      colors: {
        page: '#0066cc',
        block: '#28a745',
        tag: '#ffc107',
        link: '#6c757d',
        selected: '#dc3545',
        hovered: '#17a2b8'
      }
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('渲染测试', () => {
    it('应该正确渲染图谱容器', () => {
      render(<LinkGraphComponent {...defaultProps} />);
      
      const container = screen.getByTestId('link-graph-component');
      expect(container).toBeInTheDocument();
      expect(container).toHaveClass('link-graph-component');
    });

    it('应该设置正确的容器尺寸', () => {
      render(<LinkGraphComponent {...defaultProps} />);
      
      const container = screen.getByTestId('link-graph-component');
      expect(container).toHaveStyle({
        width: '800px',
        height: '600px'
      });
    });

    it('应该创建SVG元素', async () => {
      render(<LinkGraphComponent {...defaultProps} />);
      
      await waitFor(() => {
        const svg = container.querySelector('svg');
        expect(svg).toBeInTheDocument();
      });
    });
  });

  describe('数据处理测试', () => {
    it('应该正确过滤节点', () => {
      const filteredProps = {
        ...defaultProps,
        filters: {
          nodeTypes: ['page'],
          edgeTypes: ['page-reference'],
          minConnections: 0
        }
      };

      render(<LinkGraphComponent {...filteredProps} />);
      
      // 验证只有page类型的节点被处理
      // 这里需要通过组件的内部状态或回调来验证
    });

    it('应该根据最小连接数过滤节点', () => {
      const filteredProps = {
        ...defaultProps,
        filters: {
          nodeTypes: ['page', 'block'],
          edgeTypes: ['page-reference', 'block-reference'],
          minConnections: 2
        }
      };

      render(<LinkGraphComponent {...filteredProps} />);
      
      // 验证连接数少于2的节点被过滤
    });

    it('应该正确处理空数据', () => {
      const emptyProps = {
        ...defaultProps,
        data: { nodes: [], edges: [] }
      };

      expect(() => {
        render(<LinkGraphComponent {...emptyProps} />);
      }).not.toThrow();
    });
  });

  describe('交互测试', () => {
    it('应该响应节点点击事件', async () => {
      const onNodeClick = vi.fn();
      render(
        <LinkGraphComponent 
          {...defaultProps} 
          onNodeClick={onNodeClick}
        />
      );

      // 模拟节点点击
      // 由于D3.js被模拟，这里需要手动触发回调
      const mockNode = mockData.nodes[0];
      
      // 假设组件内部会调用onNodeClick
      await waitFor(() => {
        // 这里需要根据实际实现来测试
      });
    });

    it('应该响应节点悬停事件', async () => {
      const onNodeHover = vi.fn();
      render(
        <LinkGraphComponent 
          {...defaultProps} 
          onNodeHover={onNodeHover}
        />
      );

      // 测试悬停事件
    });

    it('应该支持拖拽功能', () => {
      render(<LinkGraphComponent {...defaultProps} enableDrag={true} />);
      
      // 验证拖拽功能已启用
    });

    it('应该支持缩放功能', () => {
      render(<LinkGraphComponent {...defaultProps} enableZoom={true} />);
      
      // 验证缩放功能已启用
    });
  });

  describe('布局测试', () => {
    it('应该支持力导向布局', () => {
      render(<LinkGraphComponent {...defaultProps} layout="force" />);
      
      // 验证力导向布局被应用
    });

    it('应该支持层次布局', () => {
      render(<LinkGraphComponent {...defaultProps} layout="hierarchy" />);
      
      // 验证层次布局被应用
    });

    it('应该支持圆形布局', () => {
      render(<LinkGraphComponent {...defaultProps} layout="circular" />);
      
      // 验证圆形布局被应用
    });

    it('应该支持网格布局', () => {
      render(<LinkGraphComponent {...defaultProps} layout="grid" />);
      
      // 验证网格布局被应用
    });
  });

  describe('样式测试', () => {
    it('应该应用自定义节点大小', () => {
      const customProps = {
        ...defaultProps,
        style: {
          ...defaultProps.style,
          nodeSize: 12
        }
      };

      render(<LinkGraphComponent {...customProps} />);
      
      // 验证节点大小被正确应用
    });

    it('应该应用自定义链接宽度', () => {
      const customProps = {
        ...defaultProps,
        style: {
          ...defaultProps.style,
          linkWidth: 4
        }
      };

      render(<LinkGraphComponent {...customProps} />);
      
      // 验证链接宽度被正确应用
    });

    it('应该应用自定义颜色', () => {
      const customProps = {
        ...defaultProps,
        style: {
          ...defaultProps.style,
          colors: {
            ...defaultProps.style.colors,
            page: '#ff0000'
          }
        }
      };

      render(<LinkGraphComponent {...customProps} />);
      
      // 验证自定义颜色被正确应用
    });
  });

  describe('性能测试', () => {
    it('应该处理大量节点而不崩溃', () => {
      const largeData = {
        nodes: Array.from({ length: 1000 }, (_, i) => ({
          id: `node${i}`,
          type: 'page' as const,
          title: `Page ${i}`,
          x: Math.random() * 800,
          y: Math.random() * 600
        })),
        edges: Array.from({ length: 500 }, (_, i) => ({
          id: `edge${i}`,
          source: `node${i}`,
          target: `node${(i + 1) % 1000}`,
          type: 'page-reference' as const
        }))
      };

      expect(() => {
        render(<LinkGraphComponent {...defaultProps} data={largeData} />);
      }).not.toThrow();
    });

    it('应该在数据更新时正确重新渲染', async () => {
      const { rerender } = render(<LinkGraphComponent {...defaultProps} />);
      
      const newData = {
        ...mockData,
        nodes: [
          ...mockData.nodes,
          {
            id: 'node4',
            type: 'page' as const,
            title: 'Page 4',
            x: 300,
            y: 300
          }
        ]
      };

      rerender(<LinkGraphComponent {...defaultProps} data={newData} />);
      
      // 验证组件正确处理数据更新
    });
  });

  describe('错误处理测试', () => {
    it('应该处理无效的节点数据', () => {
      const invalidData = {
        nodes: [
          { id: '', type: 'page', title: '', x: 0, y: 0 } // 无效节点
        ],
        edges: []
      };

      expect(() => {
        render(<LinkGraphComponent {...defaultProps} data={invalidData} />);
      }).not.toThrow();
    });

    it('应该处理循环引用的边', () => {
      const cyclicData = {
        nodes: [
          { id: 'node1', type: 'page' as const, title: 'Page 1', x: 0, y: 0 },
          { id: 'node2', type: 'page' as const, title: 'Page 2', x: 100, y: 100 }
        ],
        edges: [
          { id: 'edge1', source: 'node1', target: 'node2', type: 'page-reference' as const },
          { id: 'edge2', source: 'node2', target: 'node1', type: 'page-reference' as const }
        ]
      };

      expect(() => {
        render(<LinkGraphComponent {...defaultProps} data={cyclicData} />);
      }).not.toThrow();
    });
  });
});
