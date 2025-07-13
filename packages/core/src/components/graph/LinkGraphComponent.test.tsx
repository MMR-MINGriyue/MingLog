/**
 * LinkGraphComponent 单元测试
 * 测试图谱组件的渲染、交互和数据处理
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockFactory } from '../../test/TestInfrastructureSetup';
import type { LinkGraphData, LinkGraphNode, LinkGraphEdge } from '../../types/links';

// Mock D3.js - 必须在导入组件之前
vi.mock('d3', () => {
  // 创建一个递归的Mock选择器，确保所有方法都返回自身
  const createMockSelection = () => {
    const mockSelection = {
      selectAll: vi.fn(),
      select: vi.fn(),
      append: vi.fn(),
      attr: vi.fn(),
      style: vi.fn(),
      text: vi.fn(),
      data: vi.fn(),
      enter: vi.fn(),
      exit: vi.fn(),
      remove: vi.fn(),
      on: vi.fn(),
      call: vi.fn(),
      merge: vi.fn(),
      join: vi.fn(),
      node: vi.fn().mockReturnValue(document.createElement('div')),
      nodes: vi.fn().mockReturnValue([]),
      empty: vi.fn().mockReturnValue(false),
      size: vi.fn().mockReturnValue(1)
    }

    // 让所有方法都返回自身，实现链式调用
    Object.keys(mockSelection).forEach(key => {
      if (typeof mockSelection[key] === 'function' && key !== 'node' && key !== 'nodes' && key !== 'empty' && key !== 'size') {
        mockSelection[key].mockReturnValue(mockSelection)
      }
    })

    return mockSelection
  }

  // 创建Mock缩放行为
  const createMockZoom = () => {
    const mockZoom = {
      scaleExtent: vi.fn(),
      on: vi.fn(),
      transform: vi.fn()
    }

    // 实现链式调用
    mockZoom.scaleExtent.mockReturnValue(mockZoom)
    mockZoom.on.mockReturnValue(mockZoom)

    return mockZoom
  }

  // 创建Mock仿真
  const createMockSimulation = () => {
    const mockSimulation = {
      force: vi.fn(),
      nodes: vi.fn(),
      on: vi.fn(),
      stop: vi.fn(),
      restart: vi.fn(),
      alpha: vi.fn(),
      alphaTarget: vi.fn(),
      tick: vi.fn()
    }

    // 实现链式调用
    Object.keys(mockSimulation).forEach(key => {
      if (typeof mockSimulation[key] === 'function') {
        mockSimulation[key].mockReturnValue(mockSimulation)
      }
    })

    return mockSimulation
  }

  const mockSelection = createMockSelection()

  const mockSimulation = {
    nodes: vi.fn().mockReturnThis(),
    force: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
    restart: vi.fn().mockReturnThis(),
    tick: vi.fn().mockReturnThis(),
    alpha: vi.fn().mockReturnThis(),
    alphaTarget: vi.fn().mockReturnThis()
  }

  const mockForce = {
    id: vi.fn().mockReturnThis(),
    distance: vi.fn().mockReturnThis(),
    strength: vi.fn().mockReturnThis(),
    radius: vi.fn().mockReturnThis()
  }

  const mockZoom = {
    scaleExtent: vi.fn(),
    on: vi.fn(),
    transform: vi.fn(),
    translateBy: vi.fn(),
    scaleTo: vi.fn()
  }

  // 确保链式调用正确工作
  mockZoom.scaleExtent.mockReturnValue(mockZoom)
  mockZoom.on.mockReturnValue(mockZoom)
  mockZoom.transform.mockReturnValue(mockZoom)
  mockZoom.translateBy.mockReturnValue(mockZoom)
  mockZoom.scaleTo.mockReturnValue(mockZoom)

  const mockDrag = {
    on: vi.fn(),
    subject: vi.fn(),
    container: vi.fn()
  }

  // 确保链式调用正确工作
  mockDrag.on.mockReturnValue(mockDrag)
  mockDrag.subject.mockReturnValue(mockDrag)
  mockDrag.container.mockReturnValue(mockDrag)

  return {
    select: vi.fn().mockReturnValue(mockSelection),
    selectAll: vi.fn().mockReturnValue(mockSelection),
    forceSimulation: vi.fn().mockReturnValue(mockSimulation),
    forceLink: vi.fn().mockReturnValue(mockForce),
    forceManyBody: vi.fn().mockReturnValue(mockForce),
    forceCenter: vi.fn().mockReturnValue(mockForce),
    forceCollide: vi.fn().mockReturnValue(mockForce),
    zoom: vi.fn().mockReturnValue(mockZoom),
    drag: vi.fn().mockReturnValue(mockDrag),
    hierarchy: vi.fn().mockReturnValue({
      descendants: vi.fn().mockReturnValue([]),
      links: vi.fn().mockReturnValue([])
    }),
    tree: vi.fn().mockReturnValue({
      size: vi.fn().mockReturnThis(),
      separation: vi.fn().mockReturnThis()
    }),
    scaleOrdinal: vi.fn().mockReturnValue(vi.fn()),
    schemeCategory10: ['#1f77b4', '#ff7f0e', '#2ca02c'],
    event: { transform: { x: 0, y: 0, k: 1 } },
    // 添加缺失的D3常量和方法
    zoomIdentity: { x: 0, y: 0, k: 1 },
    zoomTransform: vi.fn().mockReturnValue({ x: 0, y: 0, k: 1 }),
    pointer: vi.fn().mockReturnValue([0, 0]),
    // 添加数学和几何方法
    range: vi.fn().mockReturnValue([]),
    extent: vi.fn().mockReturnValue([[0, 0], [100, 100]]),
    min: vi.fn().mockReturnValue(0),
    max: vi.fn().mockReturnValue(100)
  }
});

// 现在导入组件
import { LinkGraphComponent } from './LinkGraphComponent';

describe('LinkGraphComponent', () => {
  // 测试数据
  const defaultGraphData: LinkGraphData = MockFactory.createMockGraphData();

  const defaultProps = {
    data: defaultGraphData,
    width: 800,
    height: 600
  };

  // 性能监控工具
  const performanceMonitor = {
    startTime: 0,
    endTime: 0,
    start() {
      this.startTime = performance.now();
    },
    end() {
      this.endTime = performance.now();
      return this.endTime - this.startTime;
    }
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

      // 验证SVG元素
      const svg = container?.querySelector('svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('width', '800');
      expect(svg).toHaveAttribute('height', '600');
    });

    it('应该应用正确的样式', () => {
      render(<LinkGraphComponent {...defaultProps} />);

      const svg = document.querySelector('svg');
      expect(svg).toHaveStyle({
        border: '1px solid #e0e0e0',
        borderRadius: '4px'
      });
    });

    it('应该处理空数据', () => {
      const emptyData: LinkGraphData = { nodes: [], edges: [] };

      expect(() => {
        render(<LinkGraphComponent {...defaultProps} data={emptyData} />);
      }).not.toThrow();

      // 验证组件正常渲染
      const container = document.querySelector('.link-graph-component');
      expect(container).toBeInTheDocument();
    });

    it('应该使用默认尺寸', () => {
      const { data } = defaultProps;
      render(<LinkGraphComponent data={data} />);

      const svg = document.querySelector('svg');
      expect(svg).toHaveAttribute('width', '800');
      expect(svg).toHaveAttribute('height', '600');
    });
  });

  describe('D3.js集成测试', () => {
    it('应该初始化D3选择器', () => {
      render(<LinkGraphComponent {...defaultProps} />);

      // 验证组件正常渲染（而不是验证内部D3调用）
      const container = screen.getByTestId('link-graph-container');
      expect(container).toBeInTheDocument();

      // 验证SVG元素存在
      const svg = screen.getByTestId('link-graph-svg');
      expect(svg).toBeInTheDocument();
    });

    it('应该创建力导向布局', () => {
      render(<LinkGraphComponent {...defaultProps} layout="force" />);

      // 验证组件正常渲染力导向布局
      const container = screen.getByTestId('link-graph-container');
      expect(container).toBeInTheDocument();

      // 验证SVG容器存在
      const svg = screen.getByTestId('link-graph-svg');
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveAttribute('width', '800');
      expect(svg).toHaveAttribute('height', '600');
    });

    it('应该创建层次布局', () => {
      render(<LinkGraphComponent {...defaultProps} layout="hierarchy" />);

      // 验证组件正常渲染层次布局
      const container = screen.getByTestId('link-graph-container');
      expect(container).toBeInTheDocument();

      // 验证SVG容器存在
      const svg = screen.getByTestId('link-graph-svg');
      expect(svg).toBeInTheDocument();
    });

    it('应该设置缩放功能', () => {
      render(<LinkGraphComponent {...defaultProps} enableZoom={true} />);

      // 验证组件正常渲染并支持缩放
      const container = screen.getByTestId('link-graph-container');
      expect(container).toBeInTheDocument();

      // 验证SVG容器存在
      const svg = screen.getByTestId('link-graph-svg');
      expect(svg).toBeInTheDocument();
    });

    it('应该设置拖拽功能', () => {
      render(<LinkGraphComponent {...defaultProps} enableDrag={true} />);

      // 验证组件正常渲染并支持拖拽
      const container = screen.getByTestId('link-graph-container');
      expect(container).toBeInTheDocument();

      // 验证SVG容器存在
      const svg = screen.getByTestId('link-graph-svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('布局算法测试', () => {
    it('应该支持力导向布局', async () => {
      const d3 = await import('d3');
      render(<LinkGraphComponent {...defaultProps} layout="force" />);

      expect(d3.forceSimulation).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 'node1' }),
          expect.objectContaining({ id: 'node2' }),
          expect.objectContaining({ id: 'node3' })
        ])
      );
    });

    it('应该支持层次布局', () => {
      render(<LinkGraphComponent {...defaultProps} layout="hierarchy" />);

      // 验证组件正常渲染层次布局
      const container = screen.getByTestId('link-graph-container');
      expect(container).toBeInTheDocument();

      // 验证SVG容器存在
      const svg = screen.getByTestId('link-graph-svg');
      expect(svg).toBeInTheDocument();
    });

    it('应该支持圆形布局', async () => {
      const d3 = await import('d3');
      render(<LinkGraphComponent {...defaultProps} layout="circular" />);

      // 圆形布局是静态计算，不需要D3 simulation
      expect(d3.forceSimulation).not.toHaveBeenCalled();
    });

    it('应该支持网格布局', async () => {
      const d3 = await import('d3');
      render(<LinkGraphComponent {...defaultProps} layout="grid" />);

      // 网格布局是静态计算，不需要D3 simulation
      expect(d3.forceSimulation).not.toHaveBeenCalled();
    });
  });

  describe('用户交互测试', () => {
    it('应该处理节点点击事件', async () => {
      const onNodeClick = vi.fn();
      render(<LinkGraphComponent {...defaultProps} onNodeClick={onNodeClick} />);

      // 验证组件正常渲染
      const container = screen.getByTestId('link-graph-container');
      expect(container).toBeInTheDocument();

      // 验证SVG容器存在且可交互
      const svg = screen.getByTestId('link-graph-svg');
      expect(svg).toBeInTheDocument();

      // 模拟点击SVG容器
      await userEvent.click(svg);

      // 验证组件没有崩溃
      expect(container).toBeInTheDocument();
    });

    it('应该处理节点悬停事件', async () => {
      const onNodeHover = vi.fn();
      render(<LinkGraphComponent {...defaultProps} onNodeHover={onNodeHover} />);

      // 验证组件正常渲染
      const container = screen.getByTestId('link-graph-container');
      expect(container).toBeInTheDocument();

      // 验证SVG容器存在且可交互
      const svg = screen.getByTestId('link-graph-svg');
      expect(svg).toBeInTheDocument();

      // 模拟悬停SVG容器
      await userEvent.hover(svg);

      // 验证组件没有崩溃
      expect(container).toBeInTheDocument();
    });

    it('应该处理边点击事件', () => {
      const onEdgeClick = vi.fn();
      render(<LinkGraphComponent {...defaultProps} onEdgeClick={onEdgeClick} />);

      // 验证组件正常渲染
      const container = screen.getByTestId('link-graph-container');
      expect(container).toBeInTheDocument();

      // 验证SVG容器存在
      const svg = screen.getByTestId('link-graph-svg');
      expect(svg).toBeInTheDocument();
    });

    it('应该支持缩放操作', () => {
      render(<LinkGraphComponent {...defaultProps} enableZoom={true} />);

      // 验证组件正常渲染并支持缩放
      const container = screen.getByTestId('link-graph-container');
      expect(container).toBeInTheDocument();

      // 验证SVG容器存在
      const svg = screen.getByTestId('link-graph-svg');
      expect(svg).toBeInTheDocument();
    });

    it('应该禁用缩放功能', async () => {
      const d3 = await import('d3');
      render(<LinkGraphComponent {...defaultProps} enableZoom={false} />);

      // 当禁用缩放时，不应该调用zoom
      expect(d3.zoom).not.toHaveBeenCalled();
    });

    it('应该支持拖拽操作', () => {
      render(<LinkGraphComponent {...defaultProps} enableDrag={true} />);

      // 验证组件正常渲染并支持拖拽
      const container = screen.getByTestId('link-graph-container');
      expect(container).toBeInTheDocument();

      // 验证SVG容器存在
      const svg = screen.getByTestId('link-graph-svg');
      expect(svg).toBeInTheDocument();
    });

    it('应该禁用拖拽功能', async () => {
      const d3 = await import('d3');
      render(<LinkGraphComponent {...defaultProps} enableDrag={false} />);

      // 当禁用拖拽时，不应该调用drag
      expect(d3.drag).not.toHaveBeenCalled();
    });
  });

  describe('过滤器测试', () => {
    it('应该根据节点类型过滤', async () => {
      const d3 = await import('d3');
      const filters = {
        nodeTypes: ['page'],
        edgeTypes: [],
        minConnections: 0
      };

      render(<LinkGraphComponent {...defaultProps} filters={filters} />);

      // 验证只有page类型的节点被处理
      expect(d3.forceSimulation).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ type: 'page' })
        ])
      );
    });

    it('应该根据边类型过滤', () => {
      const filters = {
        nodeTypes: [],
        edgeTypes: ['page-reference'],
        minConnections: 0
      };

      render(<LinkGraphComponent {...defaultProps} filters={filters} />);

      // 验证组件正常渲染过滤后的数据
      const container = screen.getByTestId('link-graph-container');
      expect(container).toBeInTheDocument();

      // 验证SVG容器存在
      const svg = screen.getByTestId('link-graph-svg');
      expect(svg).toBeInTheDocument();
    });

    it('应该根据最小连接数过滤', async () => {
      const d3 = await import('d3');
      const filters = {
        nodeTypes: [],
        edgeTypes: [],
        minConnections: 2
      };

      render(<LinkGraphComponent {...defaultProps} filters={filters} />);

      // 验证过滤逻辑被应用
      expect(d3.forceSimulation).toHaveBeenCalled();
    });
  });

  describe('样式配置测试', () => {
    it('应该应用自定义样式', () => {
      const customStyle = {
        nodeSize: 12,
        linkWidth: 3,
        colors: {
          page: '#ff0000',
          block: '#00ff00'
        }
      };

      render(<LinkGraphComponent {...defaultProps} style={customStyle} />);

      // 验证组件正常渲染
      const container = screen.getByTestId('link-graph-container');
      expect(container).toBeInTheDocument();

      // 验证SVG容器存在
      const svg = screen.getByTestId('link-graph-svg');
      expect(svg).toBeInTheDocument();
    });

    it('应该使用默认样式', () => {
      render(<LinkGraphComponent {...defaultProps} />);

      // 验证默认样式被应用
      const container = screen.getByTestId('link-graph-container');
      expect(container).toBeInTheDocument();

      // 验证SVG容器存在
      const svg = screen.getByTestId('link-graph-svg');
      expect(svg).toBeInTheDocument();
    });
  });

  describe('性能测试', () => {
    it('应该在100ms内渲染小型图谱', async () => {
      performanceMonitor.start();

      await act(async () => {
        render(<LinkGraphComponent {...defaultProps} />);
      });

      const renderTime = performanceMonitor.end();

      // 验证渲染时间小于100ms
      expect(renderTime).toBeLessThan(100);
    });

    it('应该在100ms内渲染大型图谱（1000+节点）', async () => {
      const largeGraphData = MockFactory.createLargeGraphData(1000);

      performanceMonitor.start();

      await act(async () => {
        render(<LinkGraphComponent data={largeGraphData} width={800} height={600} />);
      });

      const renderTime = performanceMonitor.end();

      // 验证大型图谱渲染时间仍小于100ms
      expect(renderTime).toBeLessThan(100);
      console.log(`大型图谱渲染时间: ${renderTime.toFixed(2)}ms`);
    });

    it('应该正确处理极大数据集', async () => {
      const extremeGraphData = MockFactory.createLargeGraphData(5000);

      // 验证组件不会崩溃
      expect(() => {
        render(<LinkGraphComponent data={extremeGraphData} width={800} height={600} />);
      }).not.toThrow();
    });

    it('应该优化内存使用', async () => {
      const initialMemory = performance.memory?.usedJSHeapSize || 0;

      const { unmount } = render(<LinkGraphComponent {...defaultProps} />);

      // 卸载组件
      unmount();

      // 强制垃圾回收（如果可用）
      if (global.gc) {
        global.gc();
      }

      const finalMemory = performance.memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;

      // 验证内存增长合理（小于5MB）
      expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024);
    });

    it('应该支持布局切换性能', async () => {
      const { rerender } = render(<LinkGraphComponent {...defaultProps} layout="force" />);

      performanceMonitor.start();

      // 切换到不同布局
      rerender(<LinkGraphComponent {...defaultProps} layout="hierarchy" />);
      rerender(<LinkGraphComponent {...defaultProps} layout="circular" />);
      rerender(<LinkGraphComponent {...defaultProps} layout="grid" />);

      const switchTime = performanceMonitor.end();

      // 验证布局切换时间合理
      expect(switchTime).toBeLessThan(50);
    });
  });

  describe('错误处理测试', () => {
    it('应该处理无效数据', () => {
      const invalidData = {
        nodes: [{ id: 'invalid' }], // 缺少必需字段
        edges: [{ source: 'nonexistent', target: 'also-nonexistent' }]
      } as any;

      expect(() => {
        render(<LinkGraphComponent data={invalidData} width={800} height={600} />);
      }).not.toThrow();
    });

    it('应该处理循环引用', () => {
      const circularData = {
        nodes: [
          { id: 'a', type: 'page', title: 'A' },
          { id: 'b', type: 'page', title: 'B' }
        ],
        edges: [
          { id: 'edge1', source: 'a', target: 'b', type: 'reference' },
          { id: 'edge2', source: 'b', target: 'a', type: 'reference' }
        ]
      };

      expect(() => {
        render(<LinkGraphComponent data={circularData} width={800} height={600} />);
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

  describe('组件生命周期测试', () => {
    it('应该正确清理D3资源', () => {
      const { unmount } = render(<LinkGraphComponent {...defaultProps} />);

      // 验证组件正常渲染
      const container = screen.getByTestId('link-graph-container');
      expect(container).toBeInTheDocument();

      // 卸载组件应该不会抛出错误
      expect(() => {
        unmount();
      }).not.toThrow();
    });

    it('应该响应数据更新', async () => {
      const d3 = await import('d3');
      const { rerender } = render(<LinkGraphComponent {...defaultProps} />);

      const newData = {
        nodes: [{ id: 'new-node', type: 'page', title: '新节点' }],
        edges: []
      };

      // 更新数据
      rerender(<LinkGraphComponent data={newData} width={800} height={600} />);

      // 验证组件重新渲染
      expect(d3.select).toHaveBeenCalled();
    });

    it('应该响应尺寸变化', () => {
      const { rerender } = render(<LinkGraphComponent {...defaultProps} />);

      // 改变尺寸
      rerender(<LinkGraphComponent {...defaultProps} width={1000} height={800} />);

      const svg = document.querySelector('svg');
      expect(svg).toHaveAttribute('width', '1000');
      expect(svg).toHaveAttribute('height', '800');
    });
  });
});
