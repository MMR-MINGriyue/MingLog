/**
 * 图形分析面板测试
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { GraphAnalysisPanel } from '../GraphAnalysisPanel'
import { GraphData } from '@minglog/graph'

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

// Mock graph analysis functions
vi.mock('@minglog/graph', () => ({
  calculateGraphStats: vi.fn(),
  findCentralNodes: vi.fn(),
  calculateShortestPath: vi.fn(),
  generateAnalysisReport: vi.fn()
}))

// Mock CSS imports
vi.mock('../GraphAnalysisPanel.css', () => ({}))

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
    },
    {
      id: 'node4',
      label: '节点4',
      type: 'child',
      level: 2,
      x: 250,
      y: 250,
      size: 12,
      color: '#9ca3af'
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
    },
    {
      id: 'link3',
      source: 'node2',
      target: 'node4',
      type: 'default',
      weight: 1
    }
  ]
}

describe('GraphAnalysisPanel', () => {
  const mockOnClose = vi.fn()
  const mockOnNodeSelect = vi.fn()
  const mockOnPathHighlight = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockAppCore.isInitialized.mockReturnValue(true)
    mockAppCore.getEventBus.mockReturnValue(mockEventBus)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('基础渲染', () => {
    it('应该在visible为true时渲染分析面板', () => {
      render(
        <GraphAnalysisPanel
          data={mockGraphData}
          visible={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('📊 图形分析面板')).toBeInTheDocument()
    })

    it('应该在visible为false时不渲染面板', () => {
      render(
        <GraphAnalysisPanel
          data={mockGraphData}
          visible={false}
          onClose={mockOnClose}
        />
      )

      expect(screen.queryByText('📊 图形分析面板')).not.toBeInTheDocument()
    })

    it('应该显示所有分析标签', () => {
      render(
        <GraphAnalysisPanel
          data={mockGraphData}
          visible={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('中心性分析')).toBeInTheDocument()
      expect(screen.getByText('路径分析')).toBeInTheDocument()
      expect(screen.getByText('影响力分析')).toBeInTheDocument()
      expect(screen.getByText('结构分析')).toBeInTheDocument()
      expect(screen.getByText('分析报告')).toBeInTheDocument()
    })
  })

  describe('中心性分析', () => {
    it('应该默认显示中心性分析标签', () => {
      render(
        <GraphAnalysisPanel
          data={mockGraphData}
          visible={true}
          onClose={mockOnClose}
        />
      )

      const centralityTab = screen.getByText('中心性分析').closest('button')
      expect(centralityTab).toHaveClass('active')
    })

    it('应该显示度中心性结果', async () => {
      render(
        <GraphAnalysisPanel
          data={mockGraphData}
          visible={true}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('🎯 度中心性 (Degree Centrality)')).toBeInTheDocument()
      })
    })

    it('应该显示介数中心性结果', async () => {
      render(
        <GraphAnalysisPanel
          data={mockGraphData}
          visible={true}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('🌉 介数中心性 (Betweenness Centrality)')).toBeInTheDocument()
      })
    })

    it('应该能够点击节点进行选择', async () => {
      render(
        <GraphAnalysisPanel
          data={mockGraphData}
          visible={true}
          onClose={mockOnClose}
          onNodeSelect={mockOnNodeSelect}
        />
      )

      await waitFor(() => {
        const nodeItems = screen.getAllByText(/节点\d/)
        if (nodeItems.length > 0) {
          fireEvent.click(nodeItems[0])
          expect(mockOnNodeSelect).toHaveBeenCalled()
        }
      })
    })
  })

  describe('路径分析', () => {
    it('应该能够切换到路径分析标签', () => {
      render(
        <GraphAnalysisPanel
          data={mockGraphData}
          visible={true}
          onClose={mockOnClose}
        />
      )

      fireEvent.click(screen.getByText('路径分析'))
      expect(screen.getByText('🛤️ 路径分析')).toBeInTheDocument()
    })

    it('应该显示节点选择器', () => {
      render(
        <GraphAnalysisPanel
          data={mockGraphData}
          visible={true}
          onClose={mockOnClose}
        />
      )

      fireEvent.click(screen.getByText('路径分析'))
      
      expect(screen.getByText('起始节点:')).toBeInTheDocument()
      expect(screen.getByText('目标节点:')).toBeInTheDocument()
    })

    it('应该能够选择起始和目标节点', () => {
      render(
        <GraphAnalysisPanel
          data={mockGraphData}
          visible={true}
          onClose={mockOnClose}
        />
      )

      fireEvent.click(screen.getByText('路径分析'))

      const sourceSelect = screen.getAllByText('选择节点')[0].closest('select')!
      const targetSelect = screen.getAllByText('选择节点')[1].closest('select')!

      fireEvent.change(sourceSelect, { target: { value: 'node1' } })
      fireEvent.change(targetSelect, { target: { value: 'node4' } })

      expect(sourceSelect).toHaveValue('node1')
      expect(targetSelect).toHaveValue('node4')
    })

    it('应该能够执行路径分析', async () => {
      const { calculateShortestPath } = await import('@minglog/graph')
      vi.mocked(calculateShortestPath).mockReturnValue(['node1', 'node2', 'node4'])

      render(
        <GraphAnalysisPanel
          data={mockGraphData}
          visible={true}
          onClose={mockOnClose}
          onPathHighlight={mockOnPathHighlight}
        />
      )

      fireEvent.click(screen.getByText('路径分析'))

      const sourceSelect = screen.getAllByText('选择节点')[0].closest('select')!
      const targetSelect = screen.getAllByText('选择节点')[1].closest('select')!

      fireEvent.change(sourceSelect, { target: { value: 'node1' } })
      fireEvent.change(targetSelect, { target: { value: 'node4' } })

      const analyzeButton = screen.getByText('分析路径')
      fireEvent.click(analyzeButton)

      await waitFor(() => {
        expect(screen.getByText('最短路径结果:')).toBeInTheDocument()
        expect(mockOnPathHighlight).toHaveBeenCalledWith(['node1', 'node2', 'node4'])
      })
    })
  })

  describe('分析报告', () => {
    it('应该能够切换到分析报告标签', () => {
      render(
        <GraphAnalysisPanel
          data={mockGraphData}
          visible={true}
          onClose={mockOnClose}
        />
      )

      fireEvent.click(screen.getByText('分析报告'))
      expect(screen.getByText('生成分析报告')).toBeInTheDocument()
    })

    it('应该能够生成分析报告', async () => {
      const { generateAnalysisReport } = await import('@minglog/graph')
      const mockReport = {
        stats: {
          nodeCount: 4,
          linkCount: 3,
          avgConnections: 1.5,
          density: 0.5,
          components: 1
        },
        centralNodes: [
          { node: mockGraphData.nodes[0], connections: 2 },
          { node: mockGraphData.nodes[1], connections: 2 }
        ],
        recommendations: [
          '建议增加节点间的连接以提高图的连通性',
          '考虑重新组织节点布局以优化可视化效果'
        ]
      }
      vi.mocked(generateAnalysisReport).mockReturnValue(mockReport)

      render(
        <GraphAnalysisPanel
          data={mockGraphData}
          visible={true}
          onClose={mockOnClose}
        />
      )

      fireEvent.click(screen.getByText('分析报告'))
      fireEvent.click(screen.getByText('生成分析报告'))

      await waitFor(() => {
        expect(screen.getByText('📈 图形统计')).toBeInTheDocument()
        expect(screen.getByText('🌟 中心节点')).toBeInTheDocument()
        expect(screen.getByText('💡 优化建议')).toBeInTheDocument()
      })
    })

    it('应该显示正确的统计信息', async () => {
      const { generateAnalysisReport } = await import('@minglog/graph')
      const mockReport = {
        stats: {
          nodeCount: 4,
          linkCount: 3,
          avgConnections: 1.5,
          density: 0.5,
          components: 1
        },
        centralNodes: [],
        recommendations: []
      }
      vi.mocked(generateAnalysisReport).mockReturnValue(mockReport)

      render(
        <GraphAnalysisPanel
          data={mockGraphData}
          visible={true}
          onClose={mockOnClose}
        />
      )

      fireEvent.click(screen.getByText('分析报告'))
      fireEvent.click(screen.getByText('生成分析报告'))

      await waitFor(() => {
        expect(screen.getByText('4')).toBeInTheDocument() // 节点数量
        expect(screen.getByText('3')).toBeInTheDocument() // 连接数量
        expect(screen.getByText('50.00%')).toBeInTheDocument() // 图密度
      })
    })
  })

  describe('事件处理', () => {
    it('应该在中心性分析完成时发送事件', async () => {
      render(
        <GraphAnalysisPanel
          data={mockGraphData}
          visible={true}
          onClose={mockOnClose}
        />
      )

      await waitFor(() => {
        expect(mockEventBus.emit).toHaveBeenCalledWith(
          'graph:analysis:centrality-completed',
          expect.objectContaining({
            nodeCount: 4,
            topDegreeNode: expect.any(String),
            topBetweennessNode: expect.any(String),
            topClosenessNode: expect.any(String),
            topPagerankNode: expect.any(String)
          }),
          'GraphAnalysisPanel'
        )
      })
    })

    it('应该在路径分析完成时发送事件', async () => {
      const { calculateShortestPath } = await import('@minglog/graph')
      vi.mocked(calculateShortestPath).mockReturnValue(['node1', 'node2'])

      render(
        <GraphAnalysisPanel
          data={mockGraphData}
          visible={true}
          onClose={mockOnClose}
        />
      )

      fireEvent.click(screen.getByText('路径分析'))

      const sourceSelect = screen.getAllByText('选择节点')[0].closest('select')!
      const targetSelect = screen.getAllByText('选择节点')[1].closest('select')!

      fireEvent.change(sourceSelect, { target: { value: 'node1' } })
      fireEvent.change(targetSelect, { target: { value: 'node2' } })

      fireEvent.click(screen.getByText('分析路径'))

      await waitFor(() => {
        expect(mockEventBus.emit).toHaveBeenCalledWith(
          'graph:analysis:path-completed',
          expect.objectContaining({
            sourceId: 'node1',
            targetId: 'node2',
            pathLength: 2,
            pathExists: true
          }),
          'GraphAnalysisPanel'
        )
      })
    })
  })

  describe('关闭功能', () => {
    it('应该能够通过关闭按钮关闭', () => {
      render(
        <GraphAnalysisPanel
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
        <GraphAnalysisPanel
          data={mockGraphData}
          visible={true}
          onClose={mockOnClose}
        />
      )

      fireEvent.click(document.querySelector('.analysis-panel-overlay')!)
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('加载状态', () => {
    it('应该在分析时显示加载状态', () => {
      render(
        <GraphAnalysisPanel
          data={mockGraphData}
          visible={true}
          onClose={mockOnClose}
        />
      )

      // 初始加载时应该显示加载状态
      expect(screen.getByText('正在分析图形数据...')).toBeInTheDocument()
    })
  })
})
