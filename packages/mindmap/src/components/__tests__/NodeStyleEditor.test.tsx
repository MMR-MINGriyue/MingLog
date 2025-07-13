/**
 * 节点样式编辑器组件测试
 * 测试样式编辑器的功能和用户交互
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NodeStyleEditor } from '../NodeStyleEditor'
import { MindMapNode, NodeStyle } from '../../types'

// 模拟测试数据
const mockNode: MindMapNode = {
  id: 'test-node',
  text: '测试节点',
  level: 1,
  children: [],
  style: {
    backgroundColor: '#ffffff',
    borderColor: '#d1d5db',
    borderWidth: 2,
    borderRadius: 6,
    fontSize: 14,
    fontColor: '#374151',
    fontWeight: 'normal',
    padding: 8
  },
  metadata: {
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

const mockStyle: NodeStyle = {
  backgroundColor: '#ffffff',
  borderColor: '#d1d5db',
  borderWidth: 2,
  borderRadius: 6,
  fontSize: 14,
  fontColor: '#374151',
  fontWeight: 'normal',
  padding: 8
}

describe('NodeStyleEditor组件', () => {
  const mockOnStyleChange = vi.fn()
  const mockOnApplyToAll = vi.fn()
  const mockOnApplyToSiblings = vi.fn()
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('基础渲染', () => {
    it('应该在visible为true时显示编辑器', () => {
      render(
        <NodeStyleEditor
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

    it('应该在visible为false时隐藏编辑器', () => {
      render(
        <NodeStyleEditor
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
        <NodeStyleEditor
          selectedNode={mockNode}
          currentStyle={mockStyle}
          onStyleChange={mockOnStyleChange}
          visible={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('🎨 颜色')).toBeInTheDocument()
      expect(screen.getByText('📝 字体')).toBeInTheDocument()
      expect(screen.getByText('📐 布局')).toBeInTheDocument()
      expect(screen.getByText('⭐ 预设')).toBeInTheDocument()
    })

    it('应该显示实时预览', () => {
      render(
        <NodeStyleEditor
          selectedNode={mockNode}
          currentStyle={mockStyle}
          onStyleChange={mockOnStyleChange}
          visible={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('实时预览')).toBeInTheDocument()
      expect(screen.getByText('测试节点')).toBeInTheDocument()
    })
  })

  describe('标签页切换', () => {
    it('应该能够切换到字体标签页', async () => {
      const user = userEvent.setup()
      render(
        <NodeStyleEditor
          selectedNode={mockNode}
          currentStyle={mockStyle}
          onStyleChange={mockOnStyleChange}
          visible={true}
          onClose={mockOnClose}
        />
      )

      await user.click(screen.getByText('📝 字体'))
      
      expect(screen.getByText('字体大小')).toBeInTheDocument()
      expect(screen.getByText('字体粗细')).toBeInTheDocument()
    })

    it('应该能够切换到布局标签页', async () => {
      const user = userEvent.setup()
      render(
        <NodeStyleEditor
          selectedNode={mockNode}
          currentStyle={mockStyle}
          onStyleChange={mockOnStyleChange}
          visible={true}
          onClose={mockOnClose}
        />
      )

      await user.click(screen.getByText('📐 布局'))
      
      expect(screen.getByText('边框宽度')).toBeInTheDocument()
      expect(screen.getByText('圆角半径')).toBeInTheDocument()
      expect(screen.getByText('内边距')).toBeInTheDocument()
    })

    it('应该能够切换到预设标签页', async () => {
      const user = userEvent.setup()
      render(
        <NodeStyleEditor
          selectedNode={mockNode}
          currentStyle={mockStyle}
          onStyleChange={mockOnStyleChange}
          visible={true}
          onClose={mockOnClose}
        />
      )

      await user.click(screen.getByText('⭐ 预设'))
      
      expect(screen.getByText('默认')).toBeInTheDocument()
      expect(screen.getByText('强调')).toBeInTheDocument()
      expect(screen.getByText('警告')).toBeInTheDocument()
    })
  })

  describe('颜色编辑', () => {
    it('应该能够修改背景颜色', async () => {
      const user = userEvent.setup()
      render(
        <NodeStyleEditor
          selectedNode={mockNode}
          currentStyle={mockStyle}
          onStyleChange={mockOnStyleChange}
          visible={true}
          onClose={mockOnClose}
        />
      )

      const colorInput = screen.getByDisplayValue('#ffffff')
      await user.clear(colorInput)
      await user.type(colorInput, '#ff0000')

      expect(mockOnStyleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          backgroundColor: '#ff0000'
        })
      )
    })

    it('应该显示颜色调色板', () => {
      render(
        <NodeStyleEditor
          selectedNode={mockNode}
          currentStyle={mockStyle}
          onStyleChange={mockOnStyleChange}
          visible={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('基础色')).toBeInTheDocument()
      expect(screen.getByText('蓝色系')).toBeInTheDocument()
      expect(screen.getByText('绿色系')).toBeInTheDocument()
    })

    it('应该能够点击调色板颜色', async () => {
      const user = userEvent.setup()
      render(
        <NodeStyleEditor
          selectedNode={mockNode}
          currentStyle={mockStyle}
          onStyleChange={mockOnStyleChange}
          visible={true}
          onClose={mockOnClose}
        />
      )

      // 查找颜色色块（通过样式属性）
      const colorSwatches = document.querySelectorAll('.color-swatch')
      expect(colorSwatches.length).toBeGreaterThan(0)

      // 点击第一个色块
      await user.click(colorSwatches[0])

      expect(mockOnStyleChange).toHaveBeenCalled()
    })
  })

  describe('字体编辑', () => {
    it('应该能够调整字体大小', async () => {
      const user = userEvent.setup()
      render(
        <NodeStyleEditor
          selectedNode={mockNode}
          currentStyle={mockStyle}
          onStyleChange={mockOnStyleChange}
          visible={true}
          onClose={mockOnClose}
        />
      )

      await user.click(screen.getByText('📝 字体'))
      
      const fontSizeSlider = screen.getByDisplayValue('14')
      fireEvent.change(fontSizeSlider, { target: { value: '18' } })

      expect(mockOnStyleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          fontSize: 18
        })
      )
    })

    it('应该能够修改字体粗细', async () => {
      const user = userEvent.setup()
      render(
        <NodeStyleEditor
          selectedNode={mockNode}
          currentStyle={mockStyle}
          onStyleChange={mockOnStyleChange}
          visible={true}
          onClose={mockOnClose}
        />
      )

      await user.click(screen.getByText('📝 字体'))
      
      const fontWeightSelect = screen.getByDisplayValue('正常')
      await user.selectOptions(fontWeightSelect, 'bold')

      expect(mockOnStyleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          fontWeight: 'bold'
        })
      )
    })
  })

  describe('预设样式', () => {
    it('应该能够应用预设样式', async () => {
      const user = userEvent.setup()
      render(
        <NodeStyleEditor
          selectedNode={mockNode}
          currentStyle={mockStyle}
          onStyleChange={mockOnStyleChange}
          visible={true}
          onClose={mockOnClose}
        />
      )

      await user.click(screen.getByText('⭐ 预设'))
      await user.click(screen.getByText('强调'))

      expect(mockOnStyleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          backgroundColor: '#3b82f6',
          fontColor: '#ffffff',
          fontWeight: 'bold'
        })
      )
    })
  })

  describe('操作按钮', () => {
    it('应该能够重置样式', async () => {
      const user = userEvent.setup()
      render(
        <NodeStyleEditor
          selectedNode={mockNode}
          currentStyle={mockStyle}
          onStyleChange={mockOnStyleChange}
          visible={true}
          onClose={mockOnClose}
        />
      )

      await user.click(screen.getByText('🔄 重置'))

      expect(mockOnStyleChange).toHaveBeenCalledWith(
        expect.objectContaining({
          backgroundColor: '#ffffff',
          borderColor: '#d1d5db'
        })
      )
    })

    it('应该能够应用到所有节点', async () => {
      const user = userEvent.setup()
      render(
        <NodeStyleEditor
          selectedNode={mockNode}
          currentStyle={mockStyle}
          onStyleChange={mockOnStyleChange}
          onApplyToAll={mockOnApplyToAll}
          visible={true}
          onClose={mockOnClose}
        />
      )

      await user.click(screen.getByText('🌐 应用到全部'))

      expect(mockOnApplyToAll).toHaveBeenCalledWith(mockStyle)
    })

    it('应该能够应用到同级节点', async () => {
      const user = userEvent.setup()
      render(
        <NodeStyleEditor
          selectedNode={mockNode}
          currentStyle={mockStyle}
          onStyleChange={mockOnStyleChange}
          onApplyToSiblings={mockOnApplyToSiblings}
          visible={true}
          onClose={mockOnClose}
        />
      )

      await user.click(screen.getByText('👥 应用到同级'))

      expect(mockOnApplyToSiblings).toHaveBeenCalledWith(mockStyle)
    })

    it('应该能够关闭编辑器', async () => {
      const user = userEvent.setup()
      render(
        <NodeStyleEditor
          selectedNode={mockNode}
          currentStyle={mockStyle}
          onStyleChange={mockOnStyleChange}
          visible={true}
          onClose={mockOnClose}
        />
      )

      await user.click(screen.getByText('✅ 完成'))

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('应该能够通过关闭按钮关闭编辑器', async () => {
      const user = userEvent.setup()
      render(
        <NodeStyleEditor
          selectedNode={mockNode}
          currentStyle={mockStyle}
          onStyleChange={mockOnStyleChange}
          visible={true}
          onClose={mockOnClose}
        />
      )

      await user.click(screen.getByText('✕'))

      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('无节点选中状态', () => {
    it('应该在没有选中节点时显示示例节点', () => {
      render(
        <NodeStyleEditor
          selectedNode={null}
          currentStyle={mockStyle}
          onStyleChange={mockOnStyleChange}
          visible={true}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('示例节点')).toBeInTheDocument()
    })

    it('应该在没有选中节点时禁用同级应用按钮', () => {
      render(
        <NodeStyleEditor
          selectedNode={null}
          currentStyle={mockStyle}
          onStyleChange={mockOnStyleChange}
          onApplyToSiblings={mockOnApplyToSiblings}
          visible={true}
          onClose={mockOnClose}
        />
      )

      const applySiblingsButton = screen.getByText('👥 应用到同级')
      expect(applySiblingsButton).toBeDisabled()
    })
  })
})
