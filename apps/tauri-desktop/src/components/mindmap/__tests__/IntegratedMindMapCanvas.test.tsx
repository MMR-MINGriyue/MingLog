/**
 * 集成思维导图画布组件测试
 */

import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { IntegratedMindMapCanvas } from '../IntegratedMindMapCanvas'
import { MindMapData } from '@minglog/mindmap'

// Mock appCore
const mockAppCore = {
  isInitialized: vi.fn(),
  initialize: vi.fn(),
  getModuleManager: vi.fn(),
  getEventBus: vi.fn()
}

const mockModuleManager = {
  getModule: vi.fn()
}

const mockEventBus = {
  emit: vi.fn()
}

const mockMindMapModule = {
  id: 'mindmap',
  name: '思维导图',
  status: 'active'
}

vi.mock('../../core/AppCore', () => ({
  appCore: mockAppCore
}))

// Mock MindMapCanvas
vi.mock('@minglog/mindmap', () => ({
  MindMapCanvas: vi.fn(({ onNodeClick, onNodeDoubleClick, onBackgroundClick }) => (
    <div data-testid="mindmap-canvas">
      <button 
        data-testid="test-node" 
        onClick={() => onNodeClick?.({ id: 'test-node', text: '测试节点', level: 0, children: [] })}
      >
        测试节点
      </button>
      <button 
        data-testid="test-node-double" 
        onDoubleClick={() => onNodeDoubleClick?.({ id: 'test-node', text: '测试节点', level: 0, children: [] })}
      >
        双击测试
      </button>
      <div 
        data-testid="test-background" 
        onClick={(e) => onBackgroundClick?.(e)}
      >
        背景区域
      </div>
    </div>
  ))
}))

// Mock UI components
vi.mock('../ui/LoadingSpinner', () => ({
  LoadingSpinner: ({ size }: { size: string }) => (
    <div data-testid="loading-spinner" data-size={size}>Loading...</div>
  )
}))

vi.mock('../ui/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="error-boundary">{children}</div>
  )
}))

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

describe('IntegratedMindMapCanvas', () => {
  beforeEach(() => {
    // 重置所有mock
    vi.clearAllMocks()
    
    // 设置默认mock返回值
    mockAppCore.isInitialized.mockReturnValue(true)
    mockAppCore.getModuleManager.mockReturnValue(mockModuleManager)
    mockAppCore.getEventBus.mockReturnValue(mockEventBus)
    mockModuleManager.getModule.mockReturnValue(mockMindMapModule)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('基础渲染', () => {
    it('应该正确渲染思维导图画布', async () => {
      render(
        <IntegratedMindMapCanvas
          data={mockMindMapData}
          width={800}
          height={600}
        />
      )

      // 等待初始化完成
      await waitFor(() => {
        expect(screen.getByTestId('mindmap-canvas')).toBeInTheDocument()
      })

      // 验证MindMapCanvas被正确渲染
      expect(screen.getByTestId('mindmap-canvas')).toBeInTheDocument()
    })

    it('应该显示加载状态', () => {
      // 模拟未初始化状态
      mockAppCore.isInitialized.mockReturnValue(false)
      mockAppCore.initialize.mockImplementation(() => new Promise(() => {})) // 永不resolve

      render(
        <IntegratedMindMapCanvas
          data={mockMindMapData}
          width={800}
          height={600}
        />
      )

      // 验证加载状态
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
      expect(screen.getByText('正在初始化思维导图...')).toBeInTheDocument()
    })

    it('应该显示错误状态', async () => {
      // 模拟初始化错误
      mockAppCore.initialize.mockRejectedValue(new Error('初始化失败'))

      render(
        <IntegratedMindMapCanvas
          data={mockMindMapData}
          width={800}
          height={600}
        />
      )

      // 等待错误状态显示
      await waitFor(() => {
        expect(screen.getByText('思维导图初始化失败')).toBeInTheDocument()
      })

      expect(screen.getByText('初始化失败')).toBeInTheDocument()
    })
  })

  describe('事件处理', () => {
    it('应该处理节点点击事件', async () => {
      const onNodeClick = vi.fn()

      render(
        <IntegratedMindMapCanvas
          data={mockMindMapData}
          width={800}
          height={600}
          onNodeClick={onNodeClick}
        />
      )

      // 等待组件初始化
      await waitFor(() => {
        expect(screen.getByTestId('mindmap-canvas')).toBeInTheDocument()
      })

      // 点击节点
      fireEvent.click(screen.getByTestId('test-node'))

      // 验证事件处理
      expect(onNodeClick).toHaveBeenCalledWith({
        id: 'test-node',
        text: '测试节点',
        level: 0,
        children: []
      })

      // 验证事件总线调用
      expect(mockEventBus.emit).toHaveBeenCalledWith(
        'mindmap:node:clicked',
        {
          nodeId: 'test-node',
          nodeText: '测试节点',
          nodeLevel: 0
        },
        'IntegratedMindMapCanvas'
      )
    })

    it('应该处理节点双击事件', async () => {
      const onNodeDoubleClick = vi.fn()

      render(
        <IntegratedMindMapCanvas
          data={mockMindMapData}
          width={800}
          height={600}
          onNodeDoubleClick={onNodeDoubleClick}
        />
      )

      // 等待组件初始化
      await waitFor(() => {
        expect(screen.getByTestId('mindmap-canvas')).toBeInTheDocument()
      })

      // 双击节点
      fireEvent.doubleClick(screen.getByTestId('test-node-double'))

      // 验证事件处理
      expect(onNodeDoubleClick).toHaveBeenCalledWith({
        id: 'test-node',
        text: '测试节点',
        level: 0,
        children: []
      })

      // 验证事件总线调用
      expect(mockEventBus.emit).toHaveBeenCalledWith(
        'mindmap:node:double-clicked',
        {
          nodeId: 'test-node',
          nodeText: '测试节点',
          nodeLevel: 0
        },
        'IntegratedMindMapCanvas'
      )
    })

    it('应该处理背景点击事件', async () => {
      const onBackgroundClick = vi.fn()

      render(
        <IntegratedMindMapCanvas
          data={mockMindMapData}
          width={800}
          height={600}
          onBackgroundClick={onBackgroundClick}
        />
      )

      // 等待组件初始化
      await waitFor(() => {
        expect(screen.getByTestId('mindmap-canvas')).toBeInTheDocument()
      })

      // 点击背景
      fireEvent.click(screen.getByTestId('test-background'))

      // 验证事件处理
      expect(onBackgroundClick).toHaveBeenCalled()

      // 验证事件总线调用
      expect(mockEventBus.emit).toHaveBeenCalledWith(
        'mindmap:background:clicked',
        expect.objectContaining({
          timestamp: expect.any(Number)
        }),
        'IntegratedMindMapCanvas'
      )
    })
  })

  describe('核心系统集成', () => {
    it('应该正确初始化核心系统', async () => {
      mockAppCore.isInitialized.mockReturnValue(false)

      render(
        <IntegratedMindMapCanvas
          data={mockMindMapData}
          width={800}
          height={600}
        />
      )

      // 验证核心系统初始化调用
      await waitFor(() => {
        expect(mockAppCore.initialize).toHaveBeenCalled()
      })

      expect(mockAppCore.getModuleManager).toHaveBeenCalled()
      expect(mockAppCore.getEventBus).toHaveBeenCalled()
    })

    it('应该处理模块未找到的情况', async () => {
      mockModuleManager.getModule.mockReturnValue(null)

      render(
        <IntegratedMindMapCanvas
          data={mockMindMapData}
          width={800}
          height={600}
        />
      )

      // 等待错误状态
      await waitFor(() => {
        expect(screen.getByText('思维导图模块未找到或未激活')).toBeInTheDocument()
      })
    })
  })

  describe('属性传递', () => {
    it('应该正确传递所有属性到MindMapCanvas', async () => {
      const props = {
        data: mockMindMapData,
        width: 1000,
        height: 800,
        layout: { type: 'radial' as const },
        enableDrag: false,
        enableZoom: false,
        className: 'custom-class'
      }

      render(<IntegratedMindMapCanvas {...props} />)

      // 等待组件渲染
      await waitFor(() => {
        expect(screen.getByTestId('mindmap-canvas')).toBeInTheDocument()
      })

      // 验证MindMapCanvas被调用时传递了正确的属性
      const { MindMapCanvas } = await import('@minglog/mindmap')
      expect(MindMapCanvas).toHaveBeenCalledWith(
        expect.objectContaining({
          data: mockMindMapData,
          width: 1000,
          height: 800,
          layout: { type: 'radial' },
          enableDrag: false,
          enableZoom: false,
          showLabels: true,
          className: 'integrated-mindmap-canvas'
        }),
        expect.any(Object)
      )
    })
  })
})
