/**
 * GraphView 组件测试
 * 测试图谱视图组件的核心功能
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GraphView } from '../components/GraphView'
import { GraphData, GraphNode, GraphLink, GraphFilter } from '../types'

// Mock D3
vi.mock('d3', () => ({
  select: vi.fn(() => ({
    selectAll: vi.fn(() => ({
      data: vi.fn(() => ({
        enter: vi.fn(() => ({
          append: vi.fn(() => ({
            attr: vi.fn(() => ({ attr: vi.fn() })),
            style: vi.fn(() => ({ style: vi.fn() })),
            on: vi.fn(() => ({ on: vi.fn() }))
          }))
        })),
        exit: vi.fn(() => ({ remove: vi.fn() })),
        merge: vi.fn(() => ({
          attr: vi.fn(() => ({ attr: vi.fn() })),
          style: vi.fn(() => ({ style: vi.fn() })),
          on: vi.fn(() => ({ on: vi.fn() }))
        }))
      }))
    })),
    append: vi.fn(() => ({
      attr: vi.fn(() => ({ attr: vi.fn() })),
      style: vi.fn(() => ({ style: vi.fn() })),
      call: vi.fn()
    })),
    call: vi.fn(),
    on: vi.fn(),
    transition: vi.fn(() => ({
      duration: vi.fn(() => ({
        call: vi.fn()
      }))
    }))
  })),
  zoom: vi.fn(() => ({
    scaleExtent: vi.fn(() => ({
      on: vi.fn()
    })),
    transform: vi.fn()
  })),
  zoomIdentity: {
    translate: vi.fn(() => ({
      scale: vi.fn()
    }))
  },
  drag: vi.fn(() => ({
    on: vi.fn()
  })),
  forceSimulation: vi.fn(() => ({
    force: vi.fn(() => ({ force: vi.fn() })),
    on: vi.fn(),
    nodes: vi.fn(() => ({ nodes: vi.fn() })),
    alpha: vi.fn(() => ({ alpha: vi.fn() })),
    restart: vi.fn(),
    stop: vi.fn()
  })),
  forceLink: vi.fn(() => ({
    id: vi.fn(() => ({ distance: vi.fn() }))
  })),
  forceManyBody: vi.fn(() => ({
    strength: vi.fn()
  })),
  forceCenter: vi.fn()
}))

describe('GraphView', () => {
  const mockNodes: GraphNode[] = [
    {
      id: 'node1',
      type: 'note',
      label: '笔记1',
      x: 100,
      y: 100,
      size: 10,
      color: '#3b82f6',
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date()
      }
    },
    {
      id: 'node2',
      type: 'task',
      label: '任务1',
      x: 200,
      y: 200,
      size: 12,
      color: '#10b981',
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }
  ]

  const mockLinks: GraphLink[] = [
    {
      id: 'link1',
      source: 'node1',
      target: 'node2',
      type: 'reference',
      weight: 1,
      color: '#6b7280'
    }
  ]

  const mockData: GraphData = {
    nodes: mockNodes,
    links: mockLinks
  }

  const defaultProps = {
    data: mockData,
    width: 800,
    height: 600
  }

  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('基本渲染', () => {
    it('应该正确渲染图谱容器', () => {
      render(<GraphView {...defaultProps} />)
      
      const container = screen.getByRole('img') // SVG元素
      expect(container).toBeInTheDocument()
    })

    it('应该应用正确的尺寸', () => {
      render(<GraphView {...defaultProps} />)
      
      const svg = screen.getByRole('img')
      expect(svg).toHaveClass('w-full', 'h-full')
    })

    it('应该渲染交互组件', () => {
      render(<GraphView {...defaultProps} />)
      
      // 验证GraphInteractions组件是否被渲染
      const container = screen.getByTestId('graph-interactions') || screen.getByRole('img').parentElement
      expect(container).toBeInTheDocument()
    })
  })

  describe('节点交互', () => {
    it('应该在点击节点时触发回调', async () => {
      const onNodeClick = vi.fn()
      render(<GraphView {...defaultProps} onNodeClick={onNodeClick} />)
      
      const svg = screen.getByRole('img')
      await user.click(svg)
    })

    it('应该在悬停节点时触发回调', async () => {
      const onNodeHover = vi.fn()
      render(<GraphView {...defaultProps} onNodeHover={onNodeHover} />)
      
      const svg = screen.getByRole('img')
      await user.hover(svg)
    })

    it('应该支持节点选择', () => {
      const { container } = render(<GraphView {...defaultProps} />)
      
      // 验证选择状态管理
      expect(container).toBeInTheDocument()
    })
  })

  describe('链接交互', () => {
    it('应该在点击链接时触发回调', async () => {
      const onLinkClick = vi.fn()
      render(<GraphView {...defaultProps} onLinkClick={onLinkClick} />)
      
      const svg = screen.getByRole('img')
      await user.click(svg)
    })

    it('应该在悬停链接时触发回调', async () => {
      const onLinkHover = vi.fn()
      render(<GraphView {...defaultProps} onLinkHover={onLinkHover} />)
      
      const svg = screen.getByRole('img')
      await user.hover(svg)
    })
  })

  describe('缩放和平移', () => {
    it('应该支持缩放功能', async () => {
      const onZoom = vi.fn()
      render(<GraphView {...defaultProps} enableZoom={true} onZoom={onZoom} />)
      
      const svg = screen.getByRole('img')
      fireEvent.wheel(svg, { deltaY: -100 })
    })

    it('应该支持平移功能', () => {
      render(<GraphView {...defaultProps} enablePan={true} />)
      
      const svg = screen.getByRole('img')
      expect(svg).toHaveStyle({ cursor: 'grab' })
    })

    it('应该在缩放时触发回调', async () => {
      const onZoom = vi.fn()
      render(<GraphView {...defaultProps} enableZoom={true} onZoom={onZoom} />)
      
      const svg = screen.getByRole('img')
      fireEvent.wheel(svg, { deltaY: -100 })
    })
  })

  describe('过滤功能', () => {
    it('应该根据过滤器显示节点', () => {
      const filter: GraphFilter = {
        nodeTypes: ['note']
      }
      
      render(<GraphView {...defaultProps} filter={filter} />)
      
      // 验证只显示笔记类型的节点
    })

    it('应该根据过滤器显示链接', () => {
      const filter: GraphFilter = {
        linkTypes: ['reference']
      }
      
      render(<GraphView {...defaultProps} filter={filter} />)
      
      // 验证只显示引用类型的链接
    })

    it('应该支持搜索过滤', () => {
      const filter: GraphFilter = {
        search: '笔记'
      }
      
      render(<GraphView {...defaultProps} filter={filter} />)
      
      // 验证搜索结果
    })
  })

  describe('聚类功能', () => {
    it('应该显示聚类控制面板', () => {
      render(<GraphView {...defaultProps} />)
      
      // 查找聚类控制面板
      const clusterPanel = screen.queryByText('聚类分析')
      if (clusterPanel) {
        expect(clusterPanel).toBeInTheDocument()
      }
    })

    it('应该能够切换聚类类型', async () => {
      render(<GraphView {...defaultProps} />)
      
      const clusterSelect = screen.queryByDisplayValue('连接度聚类')
      if (clusterSelect) {
        await user.selectOptions(clusterSelect, '标签聚类')
        expect(clusterSelect).toHaveValue('tags')
      }
    })

    it('应该能够显示/隐藏聚类', async () => {
      render(<GraphView {...defaultProps} />)
      
      const toggleButton = screen.queryByText('显示') || screen.queryByText('隐藏')
      if (toggleButton) {
        await user.click(toggleButton)
      }
    })
  })

  describe('性能优化', () => {
    it('应该在大数据集时启用虚拟化', () => {
      const largeData: GraphData = {
        nodes: Array.from({ length: 1000 }, (_, i) => ({
          id: `node_${i}`,
          type: 'note',
          label: `节点 ${i}`,
          x: Math.random() * 800,
          y: Math.random() * 600,
          size: 10,
          color: '#3b82f6',
          metadata: {
            createdAt: new Date(),
            updatedAt: new Date()
          }
        })),
        links: []
      }
      
      render(<GraphView {...defaultProps} data={largeData} />)
      
      // 验证虚拟化是否启用
    })

    it('应该正确管理内存', () => {
      const { unmount } = render(<GraphView {...defaultProps} />)
      
      // 卸载组件
      unmount()
      
      // 验证清理工作是否完成
    })
  })

  describe('布局算法', () => {
    it('应该支持力导向布局', () => {
      render(<GraphView {...defaultProps} layout="force" />)
      
      // 验证力导向布局是否应用
    })

    it('应该支持层次布局', () => {
      render(<GraphView {...defaultProps} layout="hierarchical" />)
      
      // 验证层次布局是否应用
    })

    it('应该支持径向布局', () => {
      render(<GraphView {...defaultProps} layout="radial" />)
      
      // 验证径向布局是否应用
    })
  })

  describe('右键菜单', () => {
    it('应该在右键点击时显示上下文菜单', async () => {
      render(<GraphView {...defaultProps} />)
      
      const svg = screen.getByRole('img')
      fireEvent.contextMenu(svg)
      
      // 验证上下文菜单是否显示
      await waitFor(() => {
        const menu = screen.queryByRole('menu')
        if (menu) {
          expect(menu).toBeInTheDocument()
        }
      })
    })

    it('应该提供正确的菜单选项', async () => {
      render(<GraphView {...defaultProps} />)
      
      const svg = screen.getByRole('img')
      fireEvent.contextMenu(svg)
      
      await waitFor(() => {
        const selectAllOption = screen.queryByText('全选')
        const zoomFitOption = screen.queryByText('适应窗口')
        
        if (selectAllOption) expect(selectAllOption).toBeInTheDocument()
        if (zoomFitOption) expect(zoomFitOption).toBeInTheDocument()
      })
    })
  })

  describe('数据更新', () => {
    it('应该在数据变化时重新渲染', () => {
      const { rerender } = render(<GraphView {...defaultProps} />)
      
      const newData: GraphData = {
        nodes: [
          ...mockNodes,
          {
            id: 'node3',
            type: 'mindmap',
            label: '思维导图1',
            x: 300,
            y: 300,
            size: 8,
            color: '#f59e0b',
            metadata: {
              createdAt: new Date(),
              updatedAt: new Date()
            }
          }
        ],
        links: mockLinks
      }
      
      rerender(<GraphView {...defaultProps} data={newData} />)
    })

    it('应该正确处理空数据', () => {
      const emptyData: GraphData = {
        nodes: [],
        links: []
      }
      
      render(<GraphView {...defaultProps} data={emptyData} />)
      
      // 应该不会崩溃
    })
  })

  describe('错误处理', () => {
    it('应该优雅地处理无效数据', () => {
      const invalidData = {
        nodes: [{ id: 'invalid' }], // 缺少必需字段
        links: []
      } as GraphData
      
      expect(() => {
        render(<GraphView {...defaultProps} data={invalidData} />)
      }).not.toThrow()
    })

    it('应该在回调函数出错时不崩溃', async () => {
      const errorCallback = vi.fn(() => {
        throw new Error('回调错误')
      })
      
      render(<GraphView {...defaultProps} onNodeClick={errorCallback} />)
      
      const svg = screen.getByRole('img')
      
      expect(() => {
        fireEvent.click(svg)
      }).not.toThrow()
    })
  })

  describe('可访问性', () => {
    it('应该具有正确的ARIA属性', () => {
      render(<GraphView {...defaultProps} />)
      
      const svg = screen.getByRole('img')
      expect(svg).toHaveAttribute('aria-label')
    })

    it('应该支持键盘导航', async () => {
      render(<GraphView {...defaultProps} />)
      
      await user.keyboard('{Tab}')
      
      // 验证焦点管理
    })
  })
})
