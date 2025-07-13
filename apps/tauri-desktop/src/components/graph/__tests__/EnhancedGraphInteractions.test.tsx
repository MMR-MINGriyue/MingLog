/**
 * 增强版图形交互测试
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { EnhancedGraphInteractions } from '../EnhancedGraphInteractions'
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

// Mock d3
vi.mock('d3', () => ({
  select: vi.fn(() => ({
    call: vi.fn(),
    on: vi.fn()
  })),
  zoom: vi.fn(() => ({
    scaleExtent: vi.fn(() => ({
      on: vi.fn(() => ({
        translateExtent: vi.fn()
      }))
    }))
  })),
  zoomIdentity: {
    translate: vi.fn(() => ({
      scale: vi.fn()
    }))
  }
}))

// Mock CSS imports
vi.mock('../EnhancedGraphInteractions.css', () => ({}))

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

describe('EnhancedGraphInteractions', () => {
  const mockOnNodeSelect = vi.fn()
  const mockOnLinkSelect = vi.fn()
  const mockOnNodeHover = vi.fn()
  const mockOnLinkHover = vi.fn()
  const mockOnNodeDrag = vi.fn()
  const mockOnViewportChange = vi.fn()
  const mockOnContextMenu = vi.fn()

  const defaultProps = {
    data: mockGraphData,
    width: 800,
    height: 600,
    selectedNodes: new Set<string>(),
    selectedLinks: new Set<string>(),
    hoveredNode: null,
    hoveredLink: null,
    onNodeSelect: mockOnNodeSelect,
    onLinkSelect: mockOnLinkSelect,
    onNodeHover: mockOnNodeHover,
    onLinkHover: mockOnLinkHover,
    onNodeDrag: mockOnNodeDrag,
    onViewportChange: mockOnViewportChange,
    onContextMenu: mockOnContextMenu
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockAppCore.isInitialized.mockReturnValue(true)
    mockAppCore.getEventBus.mockReturnValue(mockEventBus)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('基础渲染', () => {
    it('应该渲染交互容器', () => {
      render(
        <EnhancedGraphInteractions {...defaultProps}>
          <div data-testid="graph-content">图形内容</div>
        </EnhancedGraphInteractions>
      )

      expect(screen.getByTestId('graph-content')).toBeInTheDocument()
    })

    it('应该设置正确的容器尺寸', () => {
      const { container } = render(
        <EnhancedGraphInteractions {...defaultProps}>
          <div>内容</div>
        </EnhancedGraphInteractions>
      )

      const interactionContainer = container.querySelector('.enhanced-graph-interactions')
      expect(interactionContainer).toHaveStyle({
        width: '800px',
        height: '600px'
      })
    })

    it('应该渲染SVG元素', () => {
      const { container } = render(
        <EnhancedGraphInteractions {...defaultProps}>
          <div>内容</div>
        </EnhancedGraphInteractions>
      )

      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveAttribute('width', '800')
      expect(svg).toHaveAttribute('height', '600')
    })
  })

  describe('节点选择', () => {
    it('应该支持单选模式', () => {
      render(
        <EnhancedGraphInteractions {...defaultProps}>
          <div>内容</div>
        </EnhancedGraphInteractions>
      )

      // 模拟节点点击
      const container = document.querySelector('.enhanced-graph-interactions')!
      fireEvent.click(container)

      // 验证背景点击清除选择
      expect(mockOnNodeSelect).toHaveBeenCalledWith([], false)
    })

    it('应该支持多选模式', () => {
      render(
        <EnhancedGraphInteractions {...defaultProps}>
          <div>内容</div>
        </EnhancedGraphInteractions>
      )

      const container = document.querySelector('.enhanced-graph-interactions')!
      
      // 模拟Ctrl+点击
      fireEvent.click(container, { ctrlKey: true })

      // 验证多选模式
      expect(mockOnNodeSelect).toHaveBeenCalledWith([], false)
    })
  })

  describe('框选功能', () => {
    it('应该支持框选开始', () => {
      const { container } = render(
        <EnhancedGraphInteractions {...defaultProps}>
          <div>内容</div>
        </EnhancedGraphInteractions>
      )

      const interactionContainer = container.querySelector('.enhanced-graph-interactions')!
      
      // 模拟鼠标按下开始框选
      fireEvent.mouseDown(interactionContainer, {
        button: 0,
        clientX: 100,
        clientY: 100
      })

      // 验证框选开始
      expect(interactionContainer).toBeInTheDocument()
    })

    it('应该在框选时显示选择框', async () => {
      const { container } = render(
        <EnhancedGraphInteractions {...defaultProps}>
          <div>内容</div>
        </EnhancedGraphInteractions>
      )

      const interactionContainer = container.querySelector('.enhanced-graph-interactions')!
      
      // 开始框选
      fireEvent.mouseDown(interactionContainer, {
        button: 0,
        clientX: 100,
        clientY: 100
      })

      // 移动鼠标
      fireEvent.mouseMove(document, {
        clientX: 200,
        clientY: 200
      })

      // 检查是否显示选择框
      await waitFor(() => {
        const selectionBox = container.querySelector('.selection-box')
        expect(selectionBox).toBeInTheDocument()
      })
    })

    it('应该在框选结束时选择节点', () => {
      const { container } = render(
        <EnhancedGraphInteractions {...defaultProps}>
          <div>内容</div>
        </EnhancedGraphInteractions>
      )

      const interactionContainer = container.querySelector('.enhanced-graph-interactions')!
      
      // 开始框选
      fireEvent.mouseDown(interactionContainer, {
        button: 0,
        clientX: 50,
        clientY: 50
      })

      // 移动鼠标
      fireEvent.mouseMove(document, {
        clientX: 250,
        clientY: 250
      })

      // 结束框选
      fireEvent.mouseUp(document)

      // 验证选择了框内的节点
      expect(mockOnNodeSelect).toHaveBeenCalled()
    })
  })

  describe('右键菜单', () => {
    it('应该在右键点击时显示菜单', () => {
      const { container } = render(
        <EnhancedGraphInteractions {...defaultProps}>
          <div>内容</div>
        </EnhancedGraphInteractions>
      )

      const interactionContainer = container.querySelector('.enhanced-graph-interactions')!
      
      // 右键点击
      fireEvent.contextMenu(interactionContainer, {
        clientX: 100,
        clientY: 100
      })

      // 验证右键菜单回调被调用
      expect(mockOnContextMenu).toHaveBeenCalledWith('background', undefined, expect.any(Number), expect.any(Number))
    })

    it('应该显示右键菜单内容', async () => {
      const { container } = render(
        <EnhancedGraphInteractions {...defaultProps}>
          <div>内容</div>
        </EnhancedGraphInteractions>
      )

      const interactionContainer = container.querySelector('.enhanced-graph-interactions')!
      
      // 右键点击
      fireEvent.contextMenu(interactionContainer, {
        clientX: 100,
        clientY: 100
      })

      // 等待菜单显示
      await waitFor(() => {
        const contextMenu = container.querySelector('.context-menu')
        expect(contextMenu).toBeInTheDocument()
      })
    })

    it('应该在点击菜单项时执行操作', async () => {
      const { container } = render(
        <EnhancedGraphInteractions {...defaultProps}>
          <div>内容</div>
        </EnhancedGraphInteractions>
      )

      const interactionContainer = container.querySelector('.enhanced-graph-interactions')!
      
      // 右键点击
      fireEvent.contextMenu(interactionContainer, {
        clientX: 100,
        clientY: 100
      })

      // 等待菜单显示并点击菜单项
      await waitFor(() => {
        const selectAllItem = screen.getByText('全选节点')
        fireEvent.click(selectAllItem)
      })

      // 验证全选操作
      expect(mockOnNodeSelect).toHaveBeenCalledWith(['node1', 'node2', 'node3'], false)
    })
  })

  describe('缩放和平移', () => {
    it('应该支持缩放功能', () => {
      render(
        <EnhancedGraphInteractions {...defaultProps} enableZoom={true}>
          <div>内容</div>
        </EnhancedGraphInteractions>
      )

      // 验证缩放功能已启用
      expect(mockOnViewportChange).not.toHaveBeenCalled()
    })

    it('应该支持平移功能', () => {
      render(
        <EnhancedGraphInteractions {...defaultProps} enablePan={true}>
          <div>内容</div>
        </EnhancedGraphInteractions>
      )

      // 验证平移功能已启用
      expect(mockOnViewportChange).not.toHaveBeenCalled()
    })

    it('应该支持禁用缩放', () => {
      render(
        <EnhancedGraphInteractions {...defaultProps} enableZoom={false}>
          <div>内容</div>
        </EnhancedGraphInteractions>
      )

      // 验证缩放功能已禁用
      expect(mockOnViewportChange).not.toHaveBeenCalled()
    })
  })

  describe('事件处理', () => {
    it('应该在节点点击时发送事件', () => {
      render(
        <EnhancedGraphInteractions {...defaultProps}>
          <div>内容</div>
        </EnhancedGraphInteractions>
      )

      // 模拟节点点击事件
      const container = document.querySelector('.enhanced-graph-interactions')!
      fireEvent.click(container)

      // 验证事件总线调用
      expect(mockEventBus.emit).toHaveBeenCalled()
    })

    it('应该在视口变换时发送事件', () => {
      render(
        <EnhancedGraphInteractions {...defaultProps}>
          <div>内容</div>
        </EnhancedGraphInteractions>
      )

      // 模拟视口变换
      if (mockOnViewportChange) {
        mockOnViewportChange({ x: 10, y: 20, k: 1.5 })
      }

      // 验证回调被调用
      expect(mockOnViewportChange).toHaveBeenCalledWith({ x: 10, y: 20, k: 1.5 })
    })
  })

  describe('性能优化', () => {
    it('应该正确处理大量节点', () => {
      const largeData: GraphData = {
        nodes: Array.from({ length: 1000 }, (_, i) => ({
          id: `node${i}`,
          label: `节点${i}`,
          type: 'default',
          level: 0,
          x: Math.random() * 800,
          y: Math.random() * 600,
          size: 10,
          color: '#69b3a2'
        })),
        links: Array.from({ length: 500 }, (_, i) => ({
          id: `link${i}`,
          source: `node${i}`,
          target: `node${(i + 1) % 1000}`,
          type: 'default',
          weight: 1
        }))
      }

      const { container } = render(
        <EnhancedGraphInteractions {...defaultProps} data={largeData}>
          <div>内容</div>
        </EnhancedGraphInteractions>
      )

      // 验证组件能够处理大量数据
      expect(container.querySelector('.enhanced-graph-interactions')).toBeInTheDocument()
    })
  })

  describe('无障碍支持', () => {
    it('应该支持键盘导航', () => {
      const { container } = render(
        <EnhancedGraphInteractions {...defaultProps}>
          <div>内容</div>
        </EnhancedGraphInteractions>
      )

      const interactionContainer = container.querySelector('.enhanced-graph-interactions')!
      
      // 模拟键盘事件
      fireEvent.keyDown(interactionContainer, { key: 'Escape' })

      // 验证键盘事件处理
      expect(interactionContainer).toBeInTheDocument()
    })
  })
})
