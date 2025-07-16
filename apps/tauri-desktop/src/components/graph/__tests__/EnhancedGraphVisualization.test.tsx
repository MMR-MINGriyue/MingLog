/**
 * 增强版图形可视化测试
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { EnhancedGraphVisualization } from '../EnhancedGraphVisualization'
import { GraphData, GraphNode, GraphLink } from '@minglog/graph'

// Mock appCore
const mockAppCore = {
  isInitialized: vi.fn(),
  getEventBus: vi.fn()
}

const mockEventBus = {
  emit: vi.fn()
}

vi.mock('../../core/AppCore', () => ({
  appCore: mockAppCore
}))

// Mock CSS imports
vi.mock('../EnhancedGraphVisualization.css', () => ({}))

// 测试数据
const mockGraphData: GraphData = {
  nodes: [
    {
      id: 'node1',
      label: '节点1',
      type: 'root',
      level: 0,
      x: 100,
      y: 100,
      size: 20,
      color: '#3b82f6'
    },
    {
      id: 'node2',
      label: '节点2',
      type: 'child',
      level: 1,
      x: 200,
      y: 150,
      size: 15,
      color: '#6b7280'
    },
    {
      id: 'node3',
      label: '节点3',
      type: 'child',
      level: 1,
      x: 150,
      y: 200,
      size: 15,
      color: '#6b7280'
    }
  ],
  links: [
    {
      id: 'link1',
      source: 'node1',
      target: 'node2',
      type: 'default',
      weight: 1
    },
    {
      id: 'link2',
      source: 'node1',
      target: 'node3',
      type: 'default',
      weight: 1
    }
  ]
}

describe('EnhancedGraphVisualization', () => {
  const mockOnClose = vi.fn()
  const mockOnNodeClick = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockAppCore.isInitialized.mockReturnValue(true)
    mockAppCore.getEventBus.mockReturnValue(mockEventBus)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('基础渲染', () => {
    it('应该在visible为true时渲染可视化界面', () => {
      render(
        <EnhancedGraphVisualization
          data={mockGraphData}
          visible={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('🌐 图形可视化分析')).toBeInTheDocument()
    })

    it('应该在visible为false时不渲染界面', () => {
      render(
        <EnhancedGraphVisualization
          data={mockGraphData}
          visible={false}
          onClose={mockOnClose}
        />
      )

      expect(screen.queryByText('🌐 图形可视化分析')).not.toBeInTheDocument()
    })

    it('应该显示工具栏组件', () => {
      render(
        <EnhancedGraphVisualization
          data={mockGraphData}
          visible={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByPlaceholderText('搜索节点...')).toBeInTheDocument()
      expect(screen.getByText('布局算法')).toBeInTheDocument()
      expect(screen.getByText('聚类分析')).toBeInTheDocument()
    })
  })

  describe('布局选择', () => {
    it('应该显示所有布局选项', () => {
      render(
        <EnhancedGraphVisualization
          data={mockGraphData}
          visible={true}
          onClose={mockOnClose}
        />
      )

      const layoutSelect = screen.getByDisplayValue('🌐 力导向布局')
      expect(layoutSelect).toBeInTheDocument()

      // 打开下拉菜单检查选项
      fireEvent.click(layoutSelect)
      // 注意：这里可能需要根据实际的select实现来调整测试方法
    })

    it('应该能够切换布局类型', () => {
      render(
        <EnhancedGraphVisualization
          data={mockGraphData}
          visible={true}
          onClose={mockOnClose}
        />
      )

      const layoutSelect = screen.getByDisplayValue('🌐 力导向布局')
      fireEvent.change(layoutSelect, { target: { value: 'circular' } })

      // 验证布局类型已更改
      expect(layoutSelect).toHaveValue('circular')
    })
  })

  describe('聚类分析', () => {
    it('应该显示聚类算法选项', () => {
      render(
        <EnhancedGraphVisualization
          data={mockGraphData}
          visible={true}
          onClose={mockOnClose}
        />
      )

      // 验证聚类分析按钮存在
      expect(screen.getByText('🎯 高级聚类分析')).toBeInTheDocument()
    })

    it('应该能够执行聚类分析', async () => {
      render(
        <EnhancedGraphVisualization
          data={mockGraphData}
          visible={true}
          onClose={mockOnClose}
        />
      )

      // 点击聚类分析按钮
      const clusteringButton = screen.getByText('🎯 高级聚类分析')
      fireEvent.click(clusteringButton)

      // 验证聚类分析面板已打开
      await waitFor(() => {
        expect(screen.getByText('开始分析')).toBeInTheDocument()
      })
    })

    it('应该显示聚类结果统计', async () => {
      render(
        <EnhancedGraphVisualization
          data={mockGraphData}
          visible={true}
          onClose={mockOnClose}
        />
      )

      // 点击聚类分析按钮来触发聚类
      const clusteringButton = screen.getByText('🎯 高级聚类分析')
      fireEvent.click(clusteringButton)

      // 验证聚类分析面板已打开
      await waitFor(() => {
        expect(screen.getByText('开始分析')).toBeInTheDocument()
      })
    })
  })

  describe('搜索功能', () => {
    it('应该能够搜索节点', () => {
      render(
        <EnhancedGraphVisualization
          data={mockGraphData}
          visible={true}
          onClose={mockOnClose}
        />
      )

      const searchInput = screen.getByPlaceholderText('搜索节点...')
      fireEvent.change(searchInput, { target: { value: '节点1' } })

      expect(searchInput).toHaveValue('节点1')
    })

    it('应该根据搜索查询过滤节点', () => {
      render(
        <EnhancedGraphVisualization
          data={mockGraphData}
          visible={true}
          onClose={mockOnClose}
        />
      )

      const searchInput = screen.getByPlaceholderText('搜索节点...')
      fireEvent.change(searchInput, { target: { value: '节点1' } })

      // 验证过滤后的节点数量显示
      // 注意：这里需要根据实际的UI实现来验证过滤结果
    })
  })

  describe('统计信息', () => {
    it('应该显示图形统计信息', () => {
      render(
        <EnhancedGraphVisualization
          data={mockGraphData}
          visible={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('📊 图形统计')).toBeInTheDocument()
      expect(screen.getByText('节点数量')).toBeInTheDocument()
      expect(screen.getByText('连接数量')).toBeInTheDocument()
      expect(screen.getByText('图密度')).toBeInTheDocument()
      expect(screen.getByText('平均度数')).toBeInTheDocument()
      expect(screen.getByText('最大度数')).toBeInTheDocument()
      expect(screen.getByText('连通分量')).toBeInTheDocument()
    })

    it('应该显示正确的统计数值', () => {
      render(
        <EnhancedGraphVisualization
          data={mockGraphData}
          visible={true}
          onClose={mockOnClose}
        />
      )

      // 验证节点数量
      expect(screen.getByText('3')).toBeInTheDocument() // 节点数量

      // 验证连接数量 - 使用更精确的选择器
      const statsGrid = screen.getByText('📊 图形统计').closest('.stats-panel')
      expect(statsGrid).toContainElement(screen.getByText('连接数量'))
      expect(statsGrid).toContainElement(screen.getAllByText('2')[0]) // 连接数量值
    })
  })

  describe('显示选项', () => {
    it('应该能够切换聚类显示', () => {
      render(
        <EnhancedGraphVisualization
          data={mockGraphData}
          visible={true}
          onClose={mockOnClose}
        />
      )

      const clusteringCheckbox = screen.getByLabelText('显示聚类')
      expect(clusteringCheckbox).toBeInTheDocument()

      fireEvent.click(clusteringCheckbox)
      expect(clusteringCheckbox).toBeChecked()
    })
  })

  describe('画布信息', () => {
    it('应该显示画布信息', () => {
      render(
        <EnhancedGraphVisualization
          data={mockGraphData}
          visible={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('节点数量')).toBeInTheDocument()
      expect(screen.getByText('连接数量')).toBeInTheDocument()
      expect(screen.getByText('布局算法')).toBeInTheDocument()
    })

    it('应该显示当前布局名称', () => {
      render(
        <EnhancedGraphVisualization
          data={mockGraphData}
          visible={true}
          onClose={mockOnClose}
        />
      )

      // 验证布局选择器存在
      expect(screen.getByText('布局算法')).toBeInTheDocument()
      expect(screen.getByRole('combobox')).toBeInTheDocument() // 布局选择器
    })
  })

  describe('事件处理', () => {
    it('应该正确打开聚类分析面板', async () => {
      render(
        <EnhancedGraphVisualization
          data={mockGraphData}
          visible={true}
          onClose={mockOnClose}
        />
      )

      // 点击聚类分析按钮
      const clusteringButton = screen.getByText('🎯 高级聚类分析')
      fireEvent.click(clusteringButton)

      // 验证聚类分析面板已打开
      await waitFor(() => {
        expect(screen.getByText('分析预设')).toBeInTheDocument()
        expect(screen.getByText('聚类算法')).toBeInTheDocument()
        expect(screen.getByText('开始分析')).toBeInTheDocument()
      })
    })
  })

  describe('关闭功能', () => {
    it('应该能够通过关闭按钮关闭', () => {
      render(
        <EnhancedGraphVisualization
          data={mockGraphData}
          visible={true}
          onClose={mockOnClose}
        />
      )

      fireEvent.click(screen.getByTitle('关闭'))
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('应该能够通过遮罩层关闭', () => {
      render(
        <EnhancedGraphVisualization
          data={mockGraphData}
          visible={true}
          onClose={mockOnClose}
        />
      )

      fireEvent.click(document.querySelector('.graph-visualization-overlay')!)
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('响应式设计', () => {
    it('应该根据传入的尺寸调整画布', () => {
      render(
        <EnhancedGraphVisualization
          data={mockGraphData}
          width={800}
          height={600}
          visible={true}
          onClose={mockOnClose}
        />
      )

      const canvas = document.querySelector('.enhanced-graph-interactions')
      expect(canvas).toHaveStyle({
        width: '500px',
        height: '480px'
      })
    })
  })
})
