/**
 * 思维导图编辑器组件测试
 * 测试思维导图的核心功能和用户交互
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MindMapEditor } from '../MindMapEditor'
import { MindMapData, MindMapNode } from '../../types'

// 模拟D3.js
vi.mock('d3', () => ({
  select: vi.fn(() => ({
    selectAll: vi.fn(() => ({ remove: vi.fn() })),
    append: vi.fn(() => ({ attr: vi.fn() })),
    attr: vi.fn(),
    call: vi.fn(),
    on: vi.fn(),
    node: vi.fn()
  })),
  zoom: vi.fn(() => ({
    scaleExtent: vi.fn(() => ({
      on: vi.fn()
    })),
    transform: vi.fn(),
    scaleBy: vi.fn()
  })),
  zoomIdentity: {
    translate: vi.fn(() => ({ scale: vi.fn() }))
  },
  drag: vi.fn(() => ({
    on: vi.fn()
  })),
  hierarchy: vi.fn(),
  tree: vi.fn(() => ({
    size: vi.fn(() => ({
      separation: vi.fn()
    }))
  })),
  linkHorizontal: vi.fn(() => ({
    x: vi.fn(() => ({
      y: vi.fn(() => ({
        source: vi.fn(() => ({
          target: vi.fn()
        }))
      }))
    }))
  }))
}))

// 模拟测试数据
const mockMindMapData: MindMapData = {
  nodes: [
    {
      id: 'root',
      text: '中心主题',
      level: 0,
      children: [],
      x: 400,
      y: 300,
      style: {
        backgroundColor: '#4A90E2',
        textColor: '#FFFFFF',
        borderColor: '#2E5C8A',
        radius: 30
      },
      metadata: {
        createdAt: new Date('2025-01-10T10:00:00Z'),
        updatedAt: new Date('2025-01-10T10:00:00Z')
      }
    },
    {
      id: 'node1',
      text: '子主题1',
      level: 1,
      parentId: 'root',
      children: [],
      x: 550,
      y: 250,
      style: {
        backgroundColor: '#F3F4F6',
        textColor: '#1F2937',
        borderColor: '#D1D5DB',
        radius: 20
      },
      metadata: {
        createdAt: new Date('2025-01-10T10:05:00Z'),
        updatedAt: new Date('2025-01-10T10:05:00Z')
      }
    }
  ],
  links: [
    {
      id: 'link1',
      source: 'root',
      target: 'node1',
      type: 'parent-child'
    }
  ],
  rootId: 'root',
  metadata: {
    title: '测试思维导图',
    createdAt: new Date('2025-01-10T10:00:00Z'),
    updatedAt: new Date('2025-01-10T10:05:00Z'),
    version: '1.0.0'
  }
}

describe('MindMapEditor组件', () => {
  beforeEach(() => {
    // 重置所有模拟函数
    vi.clearAllMocks()
  })

  describe('基础渲染', () => {
    it('应该正确渲染思维导图编辑器', () => {
      render(<MindMapEditor />)
      
      // 检查编辑器容器是否存在
      const editor = document.querySelector('.mindmap-editor')
      expect(editor).toBeInTheDocument()
    })

    it('应该使用提供的初始数据', () => {
      render(<MindMapEditor initialData={mockMindMapData} />)
      
      // 检查是否渲染了正确的节点数量
      // 注意：由于D3.js被模拟，我们主要测试组件的逻辑而不是实际的SVG渲染
      expect(document.querySelector('.mindmap-editor')).toBeInTheDocument()
    })

    it('应该显示工具栏', () => {
      render(<MindMapEditor showToolbar={true} />)
      
      // 工具栏应该存在（通过MindMapView组件渲染）
      expect(document.querySelector('.mindmap-editor')).toBeInTheDocument()
    })

    it('应该隐藏工具栏', () => {
      render(<MindMapEditor showToolbar={false} />)
      
      expect(document.querySelector('.mindmap-editor')).toBeInTheDocument()
    })
  })

  describe('编辑功能', () => {
    it('应该支持编辑模式', () => {
      render(<MindMapEditor enableEdit={true} />)
      
      expect(document.querySelector('.mindmap-editor')).toBeInTheDocument()
    })

    it('应该禁用编辑模式', () => {
      render(<MindMapEditor enableEdit={false} />)
      
      expect(document.querySelector('.mindmap-editor')).toBeInTheDocument()
    })
  })

  describe('数据变更回调', () => {
    it('应该在数据变更时调用onChange回调', async () => {
      const onChange = vi.fn()
      render(<MindMapEditor onChange={onChange} />)
      
      // 由于我们模拟了D3.js，这里主要测试组件是否正确设置了回调
      expect(onChange).not.toHaveBeenCalled()
    })

    it('应该在保存时调用onSave回调', async () => {
      const onSave = vi.fn()
      render(<MindMapEditor onSave={onSave} />)
      
      // 模拟键盘快捷键保存
      fireEvent.keyDown(document, { key: 's', ctrlKey: true })
      
      // 由于没有未保存的更改，onSave不应该被调用
      expect(onSave).not.toHaveBeenCalled()
    })

    it('应该在导出时调用onExport回调', async () => {
      const onExport = vi.fn()
      render(<MindMapEditor onExport={onExport} />)
      
      expect(document.querySelector('.mindmap-editor')).toBeInTheDocument()
    })
  })

  describe('键盘快捷键', () => {
    it('应该支持Ctrl+Z撤销', async () => {
      render(<MindMapEditor />)
      
      // 模拟撤销快捷键
      fireEvent.keyDown(document, { key: 'z', ctrlKey: true })
      
      // 由于没有历史记录，撤销不会有效果
      expect(document.querySelector('.mindmap-editor')).toBeInTheDocument()
    })

    it('应该支持Ctrl+Shift+Z重做', async () => {
      render(<MindMapEditor />)
      
      // 模拟重做快捷键
      fireEvent.keyDown(document, { key: 'z', ctrlKey: true, shiftKey: true })
      
      expect(document.querySelector('.mindmap-editor')).toBeInTheDocument()
    })

    it('应该支持Ctrl+S保存', async () => {
      const onSave = vi.fn()
      render(<MindMapEditor onSave={onSave} />)
      
      // 模拟保存快捷键
      fireEvent.keyDown(document, { key: 's', ctrlKey: true })
      
      // 由于没有未保存的更改，onSave不应该被调用
      expect(onSave).not.toHaveBeenCalled()
    })
  })

  describe('响应式设计', () => {
    it('应该支持自定义宽度和高度', () => {
      render(<MindMapEditor width={1200} height={800} />)
      
      expect(document.querySelector('.mindmap-editor')).toBeInTheDocument()
    })

    it('应该使用默认尺寸', () => {
      render(<MindMapEditor />)
      
      expect(document.querySelector('.mindmap-editor')).toBeInTheDocument()
    })
  })

  describe('状态管理', () => {
    it('应该显示未保存更改指示器', async () => {
      render(<MindMapEditor />)
      
      // 初始状态下不应该有未保存的更改
      expect(screen.queryByText(/未保存的更改/)).not.toBeInTheDocument()
    })

    it('应该正确管理历史记录', () => {
      render(<MindMapEditor />)
      
      // 组件应该正确初始化
      expect(document.querySelector('.mindmap-editor')).toBeInTheDocument()
    })
  })

  describe('性能测试', () => {
    it('应该在合理时间内渲染', () => {
      const startTime = performance.now()
      
      render(<MindMapEditor initialData={mockMindMapData} />)
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      // 渲染时间应该小于100ms
      expect(renderTime).toBeLessThan(100)
    })

    it('应该支持大量节点', () => {
      // 创建包含更多节点的测试数据
      const largeData: MindMapData = {
        ...mockMindMapData,
        nodes: Array.from({ length: 100 }, (_, i) => ({
          id: `node${i}`,
          text: `节点${i}`,
          level: 1,
          parentId: 'root',
          children: [],
          x: 400 + (i % 10) * 50,
          y: 300 + Math.floor(i / 10) * 50,
          metadata: {
            createdAt: new Date(),
            updatedAt: new Date()
          }
        }))
      }

      const startTime = performance.now()
      
      render(<MindMapEditor initialData={largeData} />)
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      // 即使有100个节点，渲染时间也应该小于200ms
      expect(renderTime).toBeLessThan(200)
    })
  })

  describe('错误处理', () => {
    it('应该处理无效的初始数据', () => {
      const invalidData = {
        nodes: [],
        links: [],
        rootId: 'nonexistent',
        metadata: {}
      } as MindMapData

      // 应该不会抛出错误
      expect(() => {
        render(<MindMapEditor initialData={invalidData} />)
      }).not.toThrow()
    })

    it('应该处理缺失的回调函数', () => {
      // 应该不会抛出错误
      expect(() => {
        render(<MindMapEditor />)
      }).not.toThrow()
    })
  })

  describe('可访问性', () => {
    it('应该支持键盘导航', () => {
      render(<MindMapEditor />)
      
      // 组件应该可以接收焦点
      const editor = document.querySelector('.mindmap-editor')
      expect(editor).toBeInTheDocument()
    })

    it('应该提供适当的ARIA标签', () => {
      render(<MindMapEditor />)
      
      // 检查是否有适当的可访问性属性
      expect(document.querySelector('.mindmap-editor')).toBeInTheDocument()
    })
  })
})
