/**
 * 增强版导出对话框测试
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { EnhancedExportDialog } from '../EnhancedExportDialog'
import { MindMapData, exportManager } from '@minglog/mindmap'

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

// Mock exportManager
const mockExportResult = {
  filename: 'test-mindmap.png',
  size: 1024 * 1024,
  exportTime: 500,
  data: new Blob(['test'], { type: 'image/png' })
}

vi.mock('@minglog/mindmap', () => ({
  exportManager: {
    export: vi.fn(),
    downloadResult: vi.fn(),
    onProgress: vi.fn()
  }
}))

// Mock CSS imports
vi.mock('../EnhancedExportDialog.css', () => ({}))

// 测试数据
const mockMindMapData: MindMapData = {
  nodes: [
    {
      id: 'root',
      text: '根节点',
      level: 0,
      children: [
        {
          id: 'child1',
          text: '子节点1',
          level: 1,
          children: [],
          parentId: 'root'
        }
      ]
    }
  ],
  links: [
    {
      id: 'link1',
      source: 'root',
      target: 'child1',
      type: 'parent-child'
    }
  ],
  rootId: 'root',
  metadata: {
    title: '测试思维导图',
    createdAt: new Date(),
    updatedAt: new Date()
  }
}

describe('EnhancedExportDialog', () => {
  const mockOnClose = vi.fn()
  const mockOnExportComplete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockAppCore.isInitialized.mockReturnValue(true)
    mockAppCore.getEventBus.mockReturnValue(mockEventBus)
    
    // Mock exportManager methods
    vi.mocked(exportManager.export).mockResolvedValue(mockExportResult)
    vi.mocked(exportManager.downloadResult).mockResolvedValue(undefined)
    vi.mocked(exportManager.onProgress).mockReturnValue(() => {})
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('基础渲染', () => {
    it('应该在visible为true时渲染对话框', () => {
      render(
        <EnhancedExportDialog
          visible={true}
          onClose={mockOnClose}
          mindMapData={mockMindMapData}
        />
      )

      expect(screen.getByText('📤 导出思维导图')).toBeInTheDocument()
    })

    it('应该在visible为false时不渲染对话框', () => {
      render(
        <EnhancedExportDialog
          visible={false}
          onClose={mockOnClose}
          mindMapData={mockMindMapData}
        />
      )

      expect(screen.queryByText('📤 导出思维导图')).not.toBeInTheDocument()
    })

    it('应该显示步骤指示器', () => {
      render(
        <EnhancedExportDialog
          visible={true}
          onClose={mockOnClose}
          mindMapData={mockMindMapData}
        />
      )

      expect(screen.getByText('配置')).toBeInTheDocument()
      expect(screen.getByText('预览')).toBeInTheDocument()
      expect(screen.getByText('导出')).toBeInTheDocument()
      expect(screen.getByText('完成')).toBeInTheDocument()
    })
  })

  describe('格式选择', () => {
    it('应该显示所有导出格式', () => {
      render(
        <EnhancedExportDialog
          visible={true}
          onClose={mockOnClose}
          mindMapData={mockMindMapData}
        />
      )

      expect(screen.getByText('PNG图片')).toBeInTheDocument()
      expect(screen.getByText('SVG矢量图')).toBeInTheDocument()
      expect(screen.getByText('PDF文档')).toBeInTheDocument()
      expect(screen.getByText('JSON数据')).toBeInTheDocument()
    })

    it('应该能够选择不同的格式', () => {
      render(
        <EnhancedExportDialog
          visible={true}
          onClose={mockOnClose}
          mindMapData={mockMindMapData}
        />
      )

      // 点击SVG格式
      fireEvent.click(screen.getByText('SVG矢量图'))

      // 验证格式被选中（通过检查相关配置是否显示）
      expect(screen.getByDisplayValue('1200')).toBeInTheDocument() // 默认宽度
    })
  })

  describe('质量预设', () => {
    it('应该显示质量预设选项', () => {
      render(
        <EnhancedExportDialog
          visible={true}
          onClose={mockOnClose}
          mindMapData={mockMindMapData}
        />
      )

      expect(screen.getByText('草稿')).toBeInTheDocument()
      expect(screen.getByText('标准')).toBeInTheDocument()
      expect(screen.getByText('高质量')).toBeInTheDocument()
      expect(screen.getByText('印刷级')).toBeInTheDocument()
    })

    it('应该能够应用质量预设', () => {
      render(
        <EnhancedExportDialog
          visible={true}
          onClose={mockOnClose}
          mindMapData={mockMindMapData}
        />
      )

      // 点击高质量预设
      fireEvent.click(screen.getByText('高质量'))

      // 验证配置被更新
      expect(screen.getByDisplayValue('1920')).toBeInTheDocument() // 高质量宽度
      expect(screen.getByDisplayValue('1080')).toBeInTheDocument() // 高质量高度
    })
  })

  describe('配置选项', () => {
    it('应该能够修改尺寸配置', () => {
      render(
        <EnhancedExportDialog
          visible={true}
          onClose={mockOnClose}
          mindMapData={mockMindMapData}
        />
      )

      // 修改宽度
      const widthInput = screen.getByDisplayValue('1920')
      fireEvent.change(widthInput, { target: { value: '2000' } })

      expect(screen.getByDisplayValue('2000')).toBeInTheDocument()
    })

    it('应该能够修改背景颜色', () => {
      render(
        <EnhancedExportDialog
          visible={true}
          onClose={mockOnClose}
          mindMapData={mockMindMapData}
        />
      )

      // 修改背景颜色
      const colorInput = screen.getByDisplayValue('#ffffff')
      fireEvent.change(colorInput, { target: { value: '#ff0000' } })

      expect(screen.getByDisplayValue('#ff0000')).toBeInTheDocument()
    })

    it('应该能够切换元数据包含选项', () => {
      render(
        <EnhancedExportDialog
          visible={true}
          onClose={mockOnClose}
          mindMapData={mockMindMapData}
        />
      )

      // 切换元数据选项
      const metadataCheckbox = screen.getByLabelText('包含元数据')
      fireEvent.click(metadataCheckbox)

      expect(metadataCheckbox).not.toBeChecked()
    })
  })

  describe('高级选项', () => {
    it('应该能够展开高级选项', () => {
      render(
        <EnhancedExportDialog
          visible={true}
          onClose={mockOnClose}
          mindMapData={mockMindMapData}
        />
      )

      // 点击高级选项
      fireEvent.click(screen.getByText('高级选项 ▶'))

      // 验证高级选项展开
      expect(screen.getByText('图片质量')).toBeInTheDocument()
      expect(screen.getByText('DPI')).toBeInTheDocument()
    })

    it('应该能够调整图片质量', () => {
      render(
        <EnhancedExportDialog
          visible={true}
          onClose={mockOnClose}
          mindMapData={mockMindMapData}
        />
      )

      // 展开高级选项
      fireEvent.click(screen.getByText('高级选项 ▶'))

      // 调整质量滑块
      const qualitySlider = screen.getByDisplayValue('1')
      fireEvent.change(qualitySlider, { target: { value: '0.8' } })

      expect(screen.getByText('80%')).toBeInTheDocument()
    })
  })

  describe('预估信息', () => {
    it('应该显示预估文件大小', () => {
      render(
        <EnhancedExportDialog
          visible={true}
          onClose={mockOnClose}
          mindMapData={mockMindMapData}
        />
      )

      expect(screen.getByText('预估文件大小:')).toBeInTheDocument()
      expect(screen.getByText('节点数量:')).toBeInTheDocument()
      expect(screen.getByText('连接数量:')).toBeInTheDocument()
    })

    it('应该显示正确的节点和连接数量', () => {
      render(
        <EnhancedExportDialog
          visible={true}
          onClose={mockOnClose}
          mindMapData={mockMindMapData}
        />
      )

      expect(screen.getByText('2')).toBeInTheDocument() // 节点数量
      expect(screen.getByText('1')).toBeInTheDocument() // 连接数量
    })
  })

  describe('导出功能', () => {
    it('应该能够执行导出', async () => {
      render(
        <EnhancedExportDialog
          visible={true}
          onClose={mockOnClose}
          mindMapData={mockMindMapData}
          onExportComplete={mockOnExportComplete}
        />
      )

      // 点击导出按钮
      fireEvent.click(screen.getByText('导出'))

      // 等待导出完成
      await waitFor(() => {
        expect(exportManager.export).toHaveBeenCalled()
      })

      expect(exportManager.downloadResult).toHaveBeenCalledWith(mockExportResult)
      expect(mockOnExportComplete).toHaveBeenCalledWith(mockExportResult)
    })

    it('应该在导出时显示进度', async () => {
      // Mock进度回调
      const mockProgressCallback = vi.fn()
      vi.mocked(exportManager.onProgress).mockImplementation((callback) => {
        mockProgressCallback.mockImplementation(callback)
        return () => {}
      })

      render(
        <EnhancedExportDialog
          visible={true}
          onClose={mockOnClose}
          mindMapData={mockMindMapData}
        />
      )

      // 点击导出按钮
      fireEvent.click(screen.getByText('导出'))

      // 验证进度步骤显示
      await waitFor(() => {
        expect(screen.getByText('正在导出')).toBeInTheDocument()
      })
    })
  })

  describe('关闭功能', () => {
    it('应该能够通过关闭按钮关闭', () => {
      render(
        <EnhancedExportDialog
          visible={true}
          onClose={mockOnClose}
          mindMapData={mockMindMapData}
        />
      )

      fireEvent.click(screen.getByTitle('关闭'))
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('应该能够通过取消按钮关闭', () => {
      render(
        <EnhancedExportDialog
          visible={true}
          onClose={mockOnClose}
          mindMapData={mockMindMapData}
        />
      )

      fireEvent.click(screen.getByText('取消'))
      expect(mockOnClose).toHaveBeenCalled()
    })

    it('应该能够通过遮罩层关闭', () => {
      render(
        <EnhancedExportDialog
          visible={true}
          onClose={mockOnClose}
          mindMapData={mockMindMapData}
        />
      )

      fireEvent.click(document.querySelector('.export-dialog-overlay')!)
      expect(mockOnClose).toHaveBeenCalled()
    })
  })
})
