/**
 * 增强版节点样式编辑器测试
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { EnhancedNodeStyleEditor } from '../EnhancedNodeStyleEditor'
import { NodeStyle, MindMapNode } from '@minglog/mindmap'

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
vi.mock('../ColorPicker.css', () => ({}))
vi.mock('../ShapeSelector.css', () => ({}))
vi.mock('../EnhancedNodeStyleEditor.css', () => ({}))

// 测试数据
const mockNode: MindMapNode = {
  id: 'test-node',
  text: '测试节点',
  level: 0,
  children: []
}

const mockStyle: NodeStyle = {
  backgroundColor: '#ffffff',
  borderColor: '#d1d5db',
  borderWidth: 2,
  borderRadius: 6,
  fontSize: 14,
  fontColor: '#374151',
  fontWeight: 'normal',
  padding: 8,
  shape: 'rounded-rect'
}

describe('EnhancedNodeStyleEditor', () => {
  const mockOnStyleChange = vi.fn()
  const mockOnApplyToAll = vi.fn()
  const mockOnApplyToSiblings = vi.fn()
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    // 确保appCore初始化状态为true
    mockAppCore.isInitialized.mockReturnValue(true)
    mockAppCore.getEventBus.mockReturnValue(mockEventBus)

    // 重置事件总线mock
    mockEventBus.emit.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('基础渲染', () => {
    it('应该在visible为true时渲染编辑器', () => {
      render(
        <EnhancedNodeStyleEditor
          selectedNode={mockNode}
          currentStyle={mockStyle}
          onStyleChange={mockOnStyleChange}
          visible={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('🎨 节点样式编辑器')).toBeInTheDocument()
      expect(screen.getByText('- 测试节点')).toBeInTheDocument()
    })

    it('应该在visible为false时不渲染编辑器', () => {
      render(
        <EnhancedNodeStyleEditor
          selectedNode={mockNode}
          currentStyle={mockStyle}
          onStyleChange={mockOnStyleChange}
          visible={false}
          onClose={mockOnClose}
        />
      )

      expect(screen.queryByText('🎨 节点样式编辑器')).not.toBeInTheDocument()
    })

    it('应该显示所有标签页', () => {
      render(
        <EnhancedNodeStyleEditor
          selectedNode={mockNode}
          currentStyle={mockStyle}
          onStyleChange={mockOnStyleChange}
          visible={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('预设')).toBeInTheDocument()
      expect(screen.getByText('颜色')).toBeInTheDocument()
      expect(screen.getByText('形状')).toBeInTheDocument()
      expect(screen.getByText('字体')).toBeInTheDocument()
      expect(screen.getByText('布局')).toBeInTheDocument()
    })
  })

  describe('标签页切换', () => {
    it('应该能够切换到不同的标签页', () => {
      render(
        <EnhancedNodeStyleEditor
          selectedNode={mockNode}
          currentStyle={mockStyle}
          onStyleChange={mockOnStyleChange}
          visible={true}
          onClose={mockOnClose}
        />
      )

      // 默认应该显示预设标签页
      expect(screen.getByText('基础样式')).toBeInTheDocument()

      // 切换到颜色标签页
      fireEvent.click(screen.getByText('颜色'))
      expect(screen.getByText('背景颜色')).toBeInTheDocument()
      expect(screen.getByText('边框颜色')).toBeInTheDocument()
      expect(screen.getByText('文字颜色')).toBeInTheDocument()

      // 切换到字体标签页
      fireEvent.click(screen.getByText('字体'))
      expect(screen.getByText('字体大小')).toBeInTheDocument()
      expect(screen.getByText('字体粗细')).toBeInTheDocument()
    })
  })

  describe('样式预览', () => {
    it('应该显示实时预览', () => {
      render(
        <EnhancedNodeStyleEditor
          selectedNode={mockNode}
          currentStyle={mockStyle}
          onStyleChange={mockOnStyleChange}
          visible={true}
          onClose={mockOnClose}
        />
      )

      const preview = screen.getByText('测试节点')
      expect(preview).toBeInTheDocument()
      expect(preview).toHaveStyle({
        backgroundColor: '#ffffff',
        borderColor: '#d1d5db',
        color: '#374151'
      })
    })
  })

  describe('预设样式', () => {
    it('应该显示预设样式选项', () => {
      render(
        <EnhancedNodeStyleEditor
          selectedNode={mockNode}
          currentStyle={mockStyle}
          onStyleChange={mockOnStyleChange}
          visible={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('默认样式')).toBeInTheDocument()
      expect(screen.getByText('蓝色主题')).toBeInTheDocument()
      expect(screen.getByText('绿色清新')).toBeInTheDocument()
    })

    it('应该能够应用预设样式', () => {
      render(
        <EnhancedNodeStyleEditor
          selectedNode={mockNode}
          currentStyle={mockStyle}
          onStyleChange={mockOnStyleChange}
          visible={true}
          onClose={mockOnClose}
        />
      )

      // 点击蓝色主题预设
      fireEvent.click(screen.getByText('蓝色主题'))

      expect(mockOnStyleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          backgroundColor: '#eff6ff',
          borderColor: '#3b82f6',
          fontColor: '#1e40af'
        })
      )
    })
  })

  describe('字体控制', () => {
    it('应该能够调整字体大小', () => {
      render(
        <EnhancedNodeStyleEditor
          selectedNode={mockNode}
          currentStyle={mockStyle}
          onStyleChange={mockOnStyleChange}
          visible={true}
          onClose={mockOnClose}
        />
      )

      // 切换到字体标签页
      fireEvent.click(screen.getByText('字体'))

      // 调整字体大小
      const fontSizeSlider = screen.getByDisplayValue('14')
      fireEvent.change(fontSizeSlider, { target: { value: '16' } })

      expect(mockOnStyleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          fontSize: 16
        })
      )
    })

    it('应该能够切换字体粗细', () => {
      render(
        <EnhancedNodeStyleEditor
          selectedNode={mockNode}
          currentStyle={mockStyle}
          onStyleChange={mockOnStyleChange}
          visible={true}
          onClose={mockOnClose}
        />
      )

      // 切换到字体标签页
      fireEvent.click(screen.getByText('字体'))

      // 切换字体粗细
      const fontWeightSelect = screen.getByDisplayValue('正常')
      fireEvent.change(fontWeightSelect, { target: { value: 'bold' } })

      expect(mockOnStyleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          fontWeight: 'bold'
        })
      )
    })
  })

  describe('布局控制', () => {
    it('应该能够调整边框宽度', () => {
      render(
        <EnhancedNodeStyleEditor
          selectedNode={mockNode}
          currentStyle={mockStyle}
          onStyleChange={mockOnStyleChange}
          visible={true}
          onClose={mockOnClose}
        />
      )

      // 切换到布局标签页
      fireEvent.click(screen.getByText('布局'))

      // 调整边框宽度
      const borderWidthSlider = screen.getByDisplayValue('2')
      fireEvent.change(borderWidthSlider, { target: { value: '4' } })

      expect(mockOnStyleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          borderWidth: 4
        })
      )
    })
  })

  describe('操作按钮', () => {
    it('应该能够重置样式', () => {
      render(
        <EnhancedNodeStyleEditor
          selectedNode={mockNode}
          currentStyle={mockStyle}
          onStyleChange={mockOnStyleChange}
          visible={true}
          onClose={mockOnClose}
        />
      )

      fireEvent.click(screen.getByText('重置'))

      expect(mockOnStyleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          backgroundColor: '#ffffff',
          borderColor: '#d1d5db'
        })
      )
    })

    it('应该能够应用到所有节点', () => {
      render(
        <EnhancedNodeStyleEditor
          selectedNode={mockNode}
          currentStyle={mockStyle}
          onStyleChange={mockOnStyleChange}
          onApplyToAll={mockOnApplyToAll}
          visible={true}
          onClose={mockOnClose}
        />
      )

      fireEvent.click(screen.getByText('应用到全部'))

      expect(mockOnApplyToAll).toHaveBeenCalledWith(mockStyle)
    })

    it('应该能够关闭编辑器', () => {
      render(
        <EnhancedNodeStyleEditor
          selectedNode={mockNode}
          currentStyle={mockStyle}
          onStyleChange={mockOnStyleChange}
          visible={true}
          onClose={mockOnClose}
        />
      )

      fireEvent.click(screen.getByText('✕'))

      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('样式应用验证', () => {
    it('应该正确应用预设样式并触发回调', async () => {
      render(
        <EnhancedNodeStyleEditor
          selectedNode={mockNode}
          currentStyle={mockStyle}
          onStyleChange={mockOnStyleChange}
          visible={true}
          onClose={mockOnClose}
        />
      )

      // 应用预设样式
      const blueThemeButton = screen.getByText('蓝色主题')
      fireEvent.click(blueThemeButton)

      // 验证样式变更回调被调用
      await waitFor(() => {
        expect(mockOnStyleChange).toHaveBeenCalledWith(
          expect.objectContaining({
            backgroundColor: '#eff6ff',
            borderColor: '#3b82f6',
            fontColor: '#1e40af'
          })
        )
      })

      // 验证预览节点样式已更新
      const previewNode = screen.getByText('测试节点')
      expect(previewNode).toHaveStyle({
        backgroundColor: 'rgb(239, 246, 255)',
        borderColor: 'rgb(59, 130, 246)',
        color: 'rgb(30, 64, 175)'
      })
    })
  })
})
