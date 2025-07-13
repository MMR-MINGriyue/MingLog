/**
 * 高级聚类配置器测试
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { AdvancedClusteringConfigurator } from '../AdvancedClusteringConfigurator'
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

// Mock GraphClusteringAnalyzer
const mockClusteringResult = {
  clusters: [
    {
      id: 'cluster1',
      nodes: ['node1', 'node2'],
      center: { x: 100, y: 100 },
      radius: 50,
      color: '#3b82f6',
      label: '聚类 1'
    },
    {
      id: 'cluster2',
      nodes: ['node3'],
      center: { x: 200, y: 200 },
      radius: 30,
      color: '#10b981',
      label: '聚类 2'
    }
  ],
  modularity: 0.75,
  quality: {
    internalDensity: 0.8,
    silhouetteScore: 0.65,
    separation: 0.7,
    cohesion: 0.85
  },
  executionTime: 150
}

const mockAnalyzer = {
  performClustering: vi.fn()
}

vi.mock('@minglog/graph', () => ({
  GraphClusteringAnalyzer: vi.fn(() => mockAnalyzer)
}))

// Mock CSS imports
vi.mock('../AdvancedClusteringConfigurator.css', () => ({}))

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

describe('AdvancedClusteringConfigurator', () => {
  const mockOnClose = vi.fn()
  const mockOnClusteringComplete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockAppCore.isInitialized.mockReturnValue(true)
    mockAppCore.getEventBus.mockReturnValue(mockEventBus)
    mockAnalyzer.performClustering.mockResolvedValue(mockClusteringResult)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('基础渲染', () => {
    it('应该在visible为true时渲染配置器', () => {
      render(
        <AdvancedClusteringConfigurator
          data={mockGraphData}
          visible={true}
          onClose={mockOnClose}
          onClusteringComplete={mockOnClusteringComplete}
        />
      )

      expect(screen.getByText('🎯 高级聚类分析')).toBeInTheDocument()
    })

    it('应该在visible为false时不渲染配置器', () => {
      render(
        <AdvancedClusteringConfigurator
          data={mockGraphData}
          visible={false}
          onClose={mockOnClose}
          onClusteringComplete={mockOnClusteringComplete}
        />
      )

      expect(screen.queryByText('🎯 高级聚类分析')).not.toBeInTheDocument()
    })

    it('应该显示预设选择区域', () => {
      render(
        <AdvancedClusteringConfigurator
          data={mockGraphData}
          visible={true}
          onClose={mockOnClose}
          onClusteringComplete={mockOnClusteringComplete}
        />
      )

      expect(screen.getByText('分析预设')).toBeInTheDocument()
      expect(screen.getByText('快速分析')).toBeInTheDocument()
      expect(screen.getByText('详细社区')).toBeInTheDocument()
      expect(screen.getByText('位置聚类')).toBeInTheDocument()
      expect(screen.getByText('高质量分析')).toBeInTheDocument()
    })
  })

  describe('算法选择', () => {
    it('应该显示所有聚类算法', () => {
      render(
        <AdvancedClusteringConfigurator
          data={mockGraphData}
          visible={true}
          onClose={mockOnClose}
          onClusteringComplete={mockOnClusteringComplete}
        />
      )

      expect(screen.getByText('Louvain算法')).toBeInTheDocument()
      expect(screen.getByText('模块度优化')).toBeInTheDocument()
      expect(screen.getByText('连通性聚类')).toBeInTheDocument()
      expect(screen.getByText('K-means聚类')).toBeInTheDocument()
      expect(screen.getByText('标签聚类')).toBeInTheDocument()
      expect(screen.getByText('类型聚类')).toBeInTheDocument()
    })

    it('应该能够选择不同的算法', () => {
      render(
        <AdvancedClusteringConfigurator
          data={mockGraphData}
          visible={true}
          onClose={mockOnClose}
          onClusteringComplete={mockOnClusteringComplete}
        />
      )

      // 点击K-means算法
      fireEvent.click(screen.getByText('K-means聚类'))

      // 验证K-means特定的配置项出现
      expect(screen.getByText('聚类数量 (K)')).toBeInTheDocument()
    })
  })

  describe('预设配置', () => {
    it('应该能够应用预设配置', () => {
      render(
        <AdvancedClusteringConfigurator
          data={mockGraphData}
          visible={true}
          onClose={mockOnClose}
          onClusteringComplete={mockOnClusteringComplete}
        />
      )

      // 点击快速分析预设
      fireEvent.click(screen.getByText('快速分析'))

      // 验证预设被激活
      const quickAnalysisButton = screen.getByText('快速分析').closest('button')
      expect(quickAnalysisButton).toHaveClass('active')
    })
  })

  describe('参数配置', () => {
    it('应该显示Louvain算法的参数配置', () => {
      render(
        <AdvancedClusteringConfigurator
          data={mockGraphData}
          visible={true}
          onClose={mockOnClose}
          onClusteringComplete={mockOnClusteringComplete}
        />
      )

      // 默认选择Louvain算法
      expect(screen.getByText('分辨率参数')).toBeInTheDocument()
      expect(screen.getByText('最大迭代次数')).toBeInTheDocument()
      expect(screen.getByText('收敛阈值')).toBeInTheDocument()
    })

    it('应该能够调整分辨率参数', () => {
      render(
        <AdvancedClusteringConfigurator
          data={mockGraphData}
          visible={true}
          onClose={mockOnClose}
          onClusteringComplete={mockOnClusteringComplete}
        />
      )

      const resolutionSlider = screen.getByDisplayValue('1.0')
      fireEvent.change(resolutionSlider, { target: { value: '1.5' } })

      expect(screen.getByText('1.5')).toBeInTheDocument()
    })

    it('应该能够切换层次聚类选项', () => {
      render(
        <AdvancedClusteringConfigurator
          data={mockGraphData}
          visible={true}
          onClose={mockOnClose}
          onClusteringComplete={mockOnClusteringComplete}
        />
      )

      const hierarchicalCheckbox = screen.getByLabelText('启用层次聚类')
      fireEvent.click(hierarchicalCheckbox)

      expect(hierarchicalCheckbox).toBeChecked()
    })
  })

  describe('聚类分析执行', () => {
    it('应该能够开始聚类分析', async () => {
      render(
        <AdvancedClusteringConfigurator
          data={mockGraphData}
          visible={true}
          onClose={mockOnClose}
          onClusteringComplete={mockOnClusteringComplete}
        />
      )

      const analyzeButton = screen.getByText('开始分析')
      fireEvent.click(analyzeButton)

      // 验证进度界面显示
      await waitFor(() => {
        expect(screen.getByText('正在执行聚类分析')).toBeInTheDocument()
      })
    })

    it('应该在分析完成后显示结果', async () => {
      render(
        <AdvancedClusteringConfigurator
          data={mockGraphData}
          visible={true}
          onClose={mockOnClose}
          onClusteringComplete={mockOnClusteringComplete}
        />
      )

      const analyzeButton = screen.getByText('开始分析')
      fireEvent.click(analyzeButton)

      // 等待分析完成
      await waitFor(() => {
        expect(screen.getByText('✅ 聚类分析完成')).toBeInTheDocument()
      })

      // 验证结果显示
      expect(screen.getByText('聚类数量')).toBeInTheDocument()
      expect(screen.getByText('模块度')).toBeInTheDocument()
      expect(screen.getByText('执行时间')).toBeInTheDocument()
    })

    it('应该显示质量指标', async () => {
      render(
        <AdvancedClusteringConfigurator
          data={mockGraphData}
          visible={true}
          onClose={mockOnClose}
          onClusteringComplete={mockOnClusteringComplete}
        />
      )

      const analyzeButton = screen.getByText('开始分析')
      fireEvent.click(analyzeButton)

      await waitFor(() => {
        expect(screen.getByText('质量指标')).toBeInTheDocument()
      })

      expect(screen.getByText('内部密度')).toBeInTheDocument()
      expect(screen.getByText('轮廓系数')).toBeInTheDocument()
      expect(screen.getByText('分离度')).toBeInTheDocument()
      expect(screen.getByText('紧密度')).toBeInTheDocument()
    })

    it('应该调用聚类完成回调', async () => {
      render(
        <AdvancedClusteringConfigurator
          data={mockGraphData}
          visible={true}
          onClose={mockOnClose}
          onClusteringComplete={mockOnClusteringComplete}
        />
      )

      const analyzeButton = screen.getByText('开始分析')
      fireEvent.click(analyzeButton)

      await waitFor(() => {
        expect(mockOnClusteringComplete).toHaveBeenCalledWith(mockClusteringResult)
      })
    })
  })

  describe('事件处理', () => {
    it('应该在聚类完成时发送事件', async () => {
      render(
        <AdvancedClusteringConfigurator
          data={mockGraphData}
          visible={true}
          onClose={mockOnClose}
          onClusteringComplete={mockOnClusteringComplete}
        />
      )

      const analyzeButton = screen.getByText('开始分析')
      fireEvent.click(analyzeButton)

      await waitFor(() => {
        expect(mockEventBus.emit).toHaveBeenCalledWith(
          'graph:clustering:completed',
          expect.objectContaining({
            clusterCount: 2,
            modularity: 0.75,
            quality: expect.any(Object),
            executionTime: 150
          }),
          'AdvancedClusteringConfigurator'
        )
      })
    })
  })

  describe('错误处理', () => {
    it('应该处理空数据的情况', () => {
      const emptyData: GraphData = { nodes: [], links: [] }
      
      render(
        <AdvancedClusteringConfigurator
          data={emptyData}
          visible={true}
          onClose={mockOnClose}
          onClusteringComplete={mockOnClusteringComplete}
        />
      )

      const analyzeButton = screen.getByText('开始分析')
      expect(analyzeButton).toBeDisabled()
    })

    it('应该显示分析错误', async () => {
      mockAnalyzer.performClustering.mockRejectedValue(new Error('分析失败'))

      render(
        <AdvancedClusteringConfigurator
          data={mockGraphData}
          visible={true}
          onClose={mockOnClose}
          onClusteringComplete={mockOnClusteringComplete}
        />
      )

      const analyzeButton = screen.getByText('开始分析')
      fireEvent.click(analyzeButton)

      await waitFor(() => {
        expect(screen.getByText('❌')).toBeInTheDocument()
        expect(screen.getByText('分析失败')).toBeInTheDocument()
      })
    })
  })

  describe('关闭功能', () => {
    it('应该能够通过关闭按钮关闭', () => {
      render(
        <AdvancedClusteringConfigurator
          data={mockGraphData}
          visible={true}
          onClose={mockOnClose}
          onClusteringComplete={mockOnClusteringComplete}
        />
      )

      fireEvent.click(screen.getByTitle('关闭'))
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('应该能够通过取消按钮关闭', () => {
      render(
        <AdvancedClusteringConfigurator
          data={mockGraphData}
          visible={true}
          onClose={mockOnClose}
          onClusteringComplete={mockOnClusteringComplete}
        />
      )

      fireEvent.click(screen.getByText('取消'))
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('应该能够通过遮罩层关闭', () => {
      render(
        <AdvancedClusteringConfigurator
          data={mockGraphData}
          visible={true}
          onClose={mockOnClose}
          onClusteringComplete={mockOnClusteringComplete}
        />
      )

      fireEvent.click(document.querySelector('.configurator-overlay')!)
      expect(mockOnClose).toHaveBeenCalled()
    })
  })
})
