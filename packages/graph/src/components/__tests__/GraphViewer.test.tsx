/**
 * 图谱查看器组件测试
 * 测试图谱可视化的渲染、交互和功能
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GraphViewer } from '../GraphViewer'
import { GraphData, GraphNode, GraphLink } from '../../types'

// 模拟D3
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
        }))
      }))
    })),
    append: vi.fn(() => ({
      attr: vi.fn(() => ({ attr: vi.fn() })),
      on: vi.fn(() => ({ on: vi.fn() }))
    })),
    call: vi.fn(),
    node: vi.fn(() => ({}))
  })),
  forceSimulation: vi.fn(() => ({
    force: vi.fn(() => ({ force: vi.fn() })),
    on: vi.fn(() => ({ on: vi.fn() })),
    stop: vi.fn()
  })),
  forceLink: vi.fn(() => ({
    id: vi.fn(() => ({ id: vi.fn() })),
    distance: vi.fn(() => ({ distance: vi.fn() })),
    strength: vi.fn(() => ({ strength: vi.fn() }))
  })),
  forceManyBody: vi.fn(() => ({
    strength: vi.fn(() => ({ strength: vi.fn() }))
  })),
  forceCenter: vi.fn(() => ({
    strength: vi.fn(() => ({ strength: vi.fn() }))
  })),
  forceCollide: vi.fn(() => ({
    radius: vi.fn(() => ({ radius: vi.fn() }))
  })),
  zoom: vi.fn(() => ({
    scaleExtent: vi.fn(() => ({ scaleExtent: vi.fn() })),
    on: vi.fn(() => ({ on: vi.fn() }))
  })),
  drag: vi.fn(() => ({
    on: vi.fn(() => ({ on: vi.fn() }))
  })),
  zoomIdentity: { k: 1, x: 0, y: 0 }
}))

// 测试数据
const mockNodes: GraphNode[] = [
  {
    id: 'node1',
    title: '测试笔记1',
    type: 'note',
    content: '这是一个测试笔记',
    tags: ['测试', '笔记'],
    x: 100,
    y: 100
  },
  {
    id: 'node2',
    title: '测试标签',
    type: 'tag',
    x: 200,
    y: 150
  },
  {
    id: 'node3',
    title: '测试文件夹',
    type: 'folder',
    x: 150,
    y: 200
  }
]

const mockLinks: GraphLink[] = [
  {
    id: 'link1',
    source: 'node1',
    target: 'node2',
    type: 'reference',
    weight: 1
  },
  {
    id: 'link2',
    source: 'node2',
    target: 'node3',
    type: 'tag',
    weight: 0.5
  }
]

const mockData: GraphData = {
  nodes: mockNodes,
  links: mockLinks
}

describe('GraphViewer组件', () => {
  const mockOnNodeClick = vi.fn()
  const mockOnNodeDoubleClick = vi.fn()
  const mockOnLinkClick = vi.fn()
  const mockOnSelectionChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('基础渲染', () => {
    it('应该正确渲染图谱查看器', () => {
      render(
        <GraphViewer
          data={mockData}
          width={800}
          height={600}
          onNodeClick={mockOnNodeClick}
          onNodeDoubleClick={mockOnNodeDoubleClick}
          onLinkClick={mockOnLinkClick}
          onSelectionChange={mockOnSelectionChange}
        />
      )

      expect(screen.getByRole('textbox', { name: /搜索节点/i })).toBeInTheDocument()
      expect(screen.getByText(/显示 3 个节点，2 个连接/)).toBeInTheDocument()
      expect(screen.getByText('图例')).toBeInTheDocument()
    })

    it('应该显示正确的统计信息', () => {
      render(<GraphViewer data={mockData} />)
      
      expect(screen.getByText('显示 3 个节点，2 个连接')).toBeInTheDocument()
    })

    it('应该显示图例', () => {
      render(<GraphViewer data={mockData} />)
      
      expect(screen.getByText('图例')).toBeInTheDocument()
      expect(screen.getByText('笔记')).toBeInTheDocument()
      expect(screen.getByText('标签')).toBeInTheDocument()
      expect(screen.getByText('文件夹')).toBeInTheDocument()
      expect(screen.getByText('链接')).toBeInTheDocument()
    })
  })

  describe('搜索功能', () => {
    it('应该能够搜索节点', async () => {
      const user = userEvent.setup()
      render(<GraphViewer data={mockData} />)

      const searchInput = screen.getByRole('textbox', { name: /搜索节点/i })
      await user.type(searchInput, '测试笔记')

      await waitFor(() => {
        expect(screen.getByText(/显示 1 个节点，0 个连接/)).toBeInTheDocument()
      })
    })

    it('应该在搜索无结果时显示空状态', async () => {
      const user = userEvent.setup()
      render(<GraphViewer data={mockData} />)

      const searchInput = screen.getByRole('textbox', { name: /搜索节点/i })
      await user.type(searchInput, '不存在的内容')

      await waitFor(() => {
        expect(screen.getByText('暂无图谱数据')).toBeInTheDocument()
        expect(screen.getByText('没有找到匹配的节点，尝试调整搜索条件')).toBeInTheDocument()
      })
    })

    it('应该能够清空搜索', async () => {
      const user = userEvent.setup()
      render(<GraphViewer data={mockData} />)

      const searchInput = screen.getByRole('textbox', { name: /搜索节点/i })
      await user.type(searchInput, '测试')
      await user.clear(searchInput)

      await waitFor(() => {
        expect(screen.getByText(/显示 3 个节点，2 个连接/)).toBeInTheDocument()
      })
    })
  })

  describe('过滤功能', () => {
    it('应该能够按节点类型过滤', () => {
      const filter = { nodeTypes: ['note'] }
      render(<GraphViewer data={mockData} filter={filter} />)

      expect(screen.getByText(/显示 1 个节点，0 个连接/)).toBeInTheDocument()
    })

    it('应该能够按标签过滤', () => {
      const filter = { tags: ['测试'] }
      render(<GraphViewer data={mockData} filter={filter} />)

      expect(screen.getByText(/显示 1 个节点，0 个连接/)).toBeInTheDocument()
    })

    it('应该能够按连接类型过滤', () => {
      const filter = { linkTypes: ['reference'] }
      render(<GraphViewer data={mockData} filter={filter} />)

      // 应该保留有reference连接的节点
      expect(screen.getByText(/显示 3 个节点，1 个连接/)).toBeInTheDocument()
    })
  })

  describe('状态管理', () => {
    it('应该显示加载状态', () => {
      render(<GraphViewer data={mockData} loading={true} />)

      expect(screen.getByText('加载图谱中...')).toBeInTheDocument()
      expect(screen.getByRole('status', { name: /loading/i }) || screen.getByText('加载图谱中...')).toBeInTheDocument()
    })

    it('应该显示错误状态', () => {
      const errorMessage = '加载图谱失败'
      render(<GraphViewer data={mockData} error={errorMessage} />)

      expect(screen.getByText(errorMessage)).toBeInTheDocument()
      expect(screen.getByText('重试')).toBeInTheDocument()
    })

    it('应该显示空数据状态', () => {
      const emptyData = { nodes: [], links: [] }
      render(<GraphViewer data={emptyData} />)

      expect(screen.getByText('暂无图谱数据')).toBeInTheDocument()
      expect(screen.getByText('创建一些笔记和标签来生成知识图谱')).toBeInTheDocument()
    })
  })

  describe('配置选项', () => {
    it('应该应用自定义配置', () => {
      const config = {
        nodeRadius: 12,
        showLabels: false,
        backgroundColor: '#f0f0f0'
      }

      render(<GraphViewer data={mockData} config={config} />)

      // 配置应该传递给GraphCanvas组件
      // 这里我们主要测试组件不会崩溃
      expect(screen.getByText(/显示 3 个节点，2 个连接/)).toBeInTheDocument()
    })

    it('应该支持自定义尺寸', () => {
      render(<GraphViewer data={mockData} width={1000} height={800} />)

      const viewer = screen.getByText(/显示 3 个节点，2 个连接/).closest('.graph-viewer')
      expect(viewer).toBeInTheDocument()
    })
  })

  describe('响应式设计', () => {
    it('应该在小屏幕上正确显示', () => {
      // 模拟小屏幕
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 480,
      })

      render(<GraphViewer data={mockData} />)

      expect(screen.getByText(/显示 3 个节点，2 个连接/)).toBeInTheDocument()
    })
  })

  describe('性能测试', () => {
    it('应该能够处理大量节点', () => {
      // 创建大量测试数据
      const largeNodes: GraphNode[] = Array.from({ length: 100 }, (_, i) => ({
        id: `node${i}`,
        title: `节点${i}`,
        type: 'note',
        x: Math.random() * 800,
        y: Math.random() * 600
      }))

      const largeLinks: GraphLink[] = Array.from({ length: 150 }, (_, i) => ({
        id: `link${i}`,
        source: `node${i % 100}`,
        target: `node${(i + 1) % 100}`,
        type: 'reference'
      }))

      const largeData = { nodes: largeNodes, links: largeLinks }

      const startTime = performance.now()
      render(<GraphViewer data={largeData} />)
      const endTime = performance.now()

      // 渲染时间应该在合理范围内（<100ms）
      expect(endTime - startTime).toBeLessThan(100)
      expect(screen.getByText(/显示 100 个节点，150 个连接/)).toBeInTheDocument()
    })
  })

  describe('无障碍性', () => {
    it('应该有正确的ARIA标签', () => {
      render(<GraphViewer data={mockData} />)

      const searchInput = screen.getByRole('textbox')
      expect(searchInput).toHaveAttribute('placeholder', '搜索节点...')
    })

    it('应该支持键盘导航', async () => {
      const user = userEvent.setup()
      render(<GraphViewer data={mockData} />)

      const searchInput = screen.getByRole('textbox')
      await user.tab()
      
      expect(searchInput).toHaveFocus()
    })
  })
})
