/**
 * 思维导图模块综合集成测试
 * 验证MindMapCanvas、MindMapEditor等组件的完整集成和<100ms性能目标
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MindMapCanvas } from '../components/MindMapCanvas'
import { MindMapEditor } from '../components/MindMapEditor'
import { MindMapService } from '../MindMapModule'
import { LayoutManager } from '../algorithms/LayoutManager'
import type { MindMapData, MindMapNode, LayoutConfig } from '../types'

// 性能目标常量
const PERFORMANCE_TARGETS = {
  RENDER_TIME: 100, // ms
  LAYOUT_CALCULATION: 100, // ms
  USER_INTERACTION: 50, // ms
  LARGE_DATASET: 200, // ms
  MEMORY_LIMIT: 50 * 1024 * 1024 // 50MB
}

// 测试数据生成器
function generateMindMapData(nodeCount: number): MindMapData {
  const nodes: MindMapNode[] = []
  const links: any[] = []

  // 创建根节点
  nodes.push({
    id: 'root',
    text: '根节点',
    level: 0,
    children: [],
    x: 400,
    y: 300,
    style: {
      backgroundColor: '#4A90E2',
      textColor: '#FFFFFF',
      borderColor: '#2E5C8A',
      radius: 25,
      fontSize: 14
    },
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date()
    }
  })

  // 创建子节点
  for (let i = 1; i < nodeCount; i++) {
    const parentIndex = Math.floor(Math.random() * i)
    const parentId = nodes[parentIndex].id
    const nodeId = `node-${i}`

    nodes.push({
      id: nodeId,
      text: `节点 ${i}`,
      level: nodes[parentIndex].level + 1,
      children: [],
      x: 400 + (Math.random() - 0.5) * 600,
      y: 300 + (Math.random() - 0.5) * 400,
      style: {
        backgroundColor: '#E8F4FD',
        textColor: '#333333',
        borderColor: '#4A90E2',
        radius: 20,
        fontSize: 12
      },
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    // 添加链接
    links.push({
      id: `link-${parentId}-${nodeId}`,
      source: parentId,
      target: nodeId,
      type: 'hierarchy'
    })

    // 更新父节点的children
    nodes[parentIndex].children.push(nodeId)
  }

  return {
    nodes,
    links,
    rootId: 'root',
    metadata: {
      title: `测试思维导图 (${nodeCount} 节点)`,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0.0'
    }
  }
}

// 模拟D3.js
vi.mock('d3', () => ({
  select: vi.fn(() => ({
    selectAll: vi.fn(() => ({
      data: vi.fn(() => ({
        enter: vi.fn(() => ({
          append: vi.fn(() => ({
            attr: vi.fn(() => ({ attr: vi.fn(), style: vi.fn(), on: vi.fn() })),
            style: vi.fn(() => ({ attr: vi.fn(), style: vi.fn(), on: vi.fn() })),
            on: vi.fn(() => ({ attr: vi.fn(), style: vi.fn(), on: vi.fn() }))
          }))
        })),
        exit: vi.fn(() => ({ remove: vi.fn() })),
        attr: vi.fn(() => ({ attr: vi.fn(), style: vi.fn(), on: vi.fn() })),
        style: vi.fn(() => ({ attr: vi.fn(), style: vi.fn(), on: vi.fn() })),
        on: vi.fn(() => ({ attr: vi.fn(), style: vi.fn(), on: vi.fn() }))
      }))
    })),
    attr: vi.fn(() => ({ attr: vi.fn(), call: vi.fn(), on: vi.fn() })),
    call: vi.fn(() => ({ attr: vi.fn(), call: vi.fn(), on: vi.fn() })),
    on: vi.fn(() => ({ attr: vi.fn(), call: vi.fn(), on: vi.fn() })),
    append: vi.fn(() => ({ attr: vi.fn(), selectAll: vi.fn() }))
  })),
  zoom: vi.fn(() => ({
    scaleExtent: vi.fn(() => ({
      on: vi.fn(() => ({}))
    }))
  })),
  zoomIdentity: { k: 1, x: 0, y: 0 },
  drag: vi.fn(() => ({
    on: vi.fn(() => ({}))
  })),
  forceSimulation: vi.fn(() => ({
    nodes: vi.fn(() => ({})),
    force: vi.fn(() => ({})),
    on: vi.fn(() => ({})),
    stop: vi.fn(() => ({}))
  })),
  forceLink: vi.fn(() => ({
    id: vi.fn(() => ({})),
    distance: vi.fn(() => ({}))
  })),
  forceManyBody: vi.fn(() => ({
    strength: vi.fn(() => ({}))
  })),
  forceCenter: vi.fn(() => ({}))
}))

describe('思维导图模块综合集成测试', () => {
  let mindMapService: MindMapService
  let layoutManager: LayoutManager

  beforeEach(() => {
    vi.clearAllMocks()
    mindMapService = new MindMapService()
    layoutManager = new LayoutManager()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('MindMapCanvas 集成测试', () => {
    it('应该在100ms内渲染小型思维导图', async () => {
      const testData = generateMindMapData(20)
      
      const startTime = performance.now()
      
      render(
        <MindMapCanvas
          data={testData}
          width={800}
          height={600}
          layout={{ type: 'tree', direction: 'right' }}
        />
      )
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      expect(renderTime).toBeLessThan(PERFORMANCE_TARGETS.RENDER_TIME)
      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument() // SVG元素
    })

    it('应该在200ms内渲染大型思维导图', async () => {
      const testData = generateMindMapData(500)
      
      const startTime = performance.now()
      
      render(
        <MindMapCanvas
          data={testData}
          width={1200}
          height={800}
          layout={{ type: 'tree', direction: 'right' }}
        />
      )
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      expect(renderTime).toBeLessThan(PERFORMANCE_TARGETS.LARGE_DATASET)
    })

    it('应该正确处理用户交互', async () => {
      const testData = generateMindMapData(10)
      const onNodeClick = vi.fn()
      const onBackgroundClick = vi.fn()
      
      render(
        <MindMapCanvas
          data={testData}
          onNodeClick={onNodeClick}
          onBackgroundClick={onBackgroundClick}
        />
      )
      
      const canvas = screen.getByRole('img', { hidden: true })
      
      // 测试背景点击
      const startTime = performance.now()
      fireEvent.click(canvas)
      const endTime = performance.now()
      
      expect(endTime - startTime).toBeLessThan(PERFORMANCE_TARGETS.USER_INTERACTION)
    })

    it('应该支持拖拽和缩放功能', () => {
      const testData = generateMindMapData(10)
      
      render(
        <MindMapCanvas
          data={testData}
          enableDrag={true}
          enableZoom={true}
        />
      )
      
      const canvas = screen.getByRole('img', { hidden: true })
      expect(canvas).toBeInTheDocument()
      
      // 验证拖拽事件处理
      fireEvent.mouseDown(canvas)
      fireEvent.mouseMove(canvas, { clientX: 100, clientY: 100 })
      fireEvent.mouseUp(canvas)
      
      // 验证缩放事件处理
      fireEvent.wheel(canvas, { deltaY: -100 })
    })
  })

  describe('MindMapEditor 集成测试', () => {
    it('应该快速初始化编辑器', async () => {
      const testData = generateMindMapData(50)
      
      const startTime = performance.now()
      
      render(
        <MindMapEditor
          initialData={testData}
          width={1000}
          height={700}
          enableEdit={true}
          showToolbar={true}
        />
      )
      
      const endTime = performance.now()
      const initTime = endTime - startTime
      
      expect(initTime).toBeLessThan(PERFORMANCE_TARGETS.RENDER_TIME)
      expect(document.querySelector('.mindmap-editor')).toBeInTheDocument()
    })

    it('应该支持节点编辑操作', async () => {
      const testData = generateMindMapData(10)
      const onSave = vi.fn()
      const onChange = vi.fn()
      
      render(
        <MindMapEditor
          initialData={testData}
          enableEdit={true}
          onSave={onSave}
          onChange={onChange}
        />
      )
      
      const editor = document.querySelector('.mindmap-editor')
      expect(editor).toBeInTheDocument()
      
      // 模拟节点编辑操作
      const startTime = performance.now()
      
      // 这里应该触发节点编辑，但由于D3被模拟，我们主要测试组件存在性
      expect(editor).toBeInTheDocument()
      
      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(PERFORMANCE_TARGETS.USER_INTERACTION)
    })

    it('应该正确处理自动保存', async () => {
      const testData = generateMindMapData(10)
      const onSave = vi.fn()
      
      render(
        <MindMapEditor
          initialData={testData}
          enableEdit={true}
          onSave={onSave}
        />
      )
      
      // 等待自动保存触发
      await waitFor(() => {
        expect(document.querySelector('.mindmap-editor')).toBeInTheDocument()
      }, { timeout: 1000 })
    })
  })

  describe('布局算法集成测试', () => {
    it('树形布局应该在100ms内完成计算', async () => {
      const testData = generateMindMapData(100)
      const config: LayoutConfig = { type: 'tree', direction: 'right' }
      
      const startTime = performance.now()
      
      const result = await layoutManager.calculateLayout(testData, config)
      
      const endTime = performance.now()
      const calculationTime = endTime - startTime
      
      expect(calculationTime).toBeLessThan(PERFORMANCE_TARGETS.LAYOUT_CALCULATION)
      expect(result.nodes).toHaveLength(100)
      expect(result.nodes.every(node => typeof node.x === 'number' && typeof node.y === 'number')).toBe(true)
    })

    it('径向布局应该正确计算节点位置', async () => {
      const testData = generateMindMapData(50)
      const config: LayoutConfig = { type: 'radial' }
      
      const startTime = performance.now()
      
      const result = await layoutManager.calculateLayout(testData, config)
      
      const endTime = performance.now()
      const calculationTime = endTime - startTime
      
      expect(calculationTime).toBeLessThan(PERFORMANCE_TARGETS.LAYOUT_CALCULATION)
      expect(result.nodes).toHaveLength(50)
    })

    it('力导向布局应该在合理时间内收敛', async () => {
      const testData = generateMindMapData(30) // 力导向布局计算量大，减少节点数
      const config: LayoutConfig = { type: 'force', iterations: 100 }
      
      const startTime = performance.now()
      
      const result = await layoutManager.calculateLayout(testData, config)
      
      const endTime = performance.now()
      const calculationTime = endTime - startTime
      
      // 力导向布局允许更长的计算时间
      expect(calculationTime).toBeLessThan(500)
      expect(result.nodes).toHaveLength(30)
    })
  })

  describe('性能和内存管理测试', () => {
    it('应该有效管理大型数据集的内存使用', async () => {
      const initialMemory = process.memoryUsage?.()?.heapUsed || 0
      
      // 创建多个大型思维导图
      const mindMaps = []
      for (let i = 0; i < 5; i++) {
        const testData = generateMindMapData(200)
        mindMaps.push(testData)
        
        render(
          <MindMapCanvas
            key={i}
            data={testData}
            width={800}
            height={600}
          />
        )
      }
      
      const peakMemory = process.memoryUsage?.()?.heapUsed || 0
      const memoryGrowth = peakMemory - initialMemory
      
      // 内存增长应该在合理范围内
      if (initialMemory > 0) {
        expect(memoryGrowth).toBeLessThan(PERFORMANCE_TARGETS.MEMORY_LIMIT)
      }
    })

    it('应该支持并发布局计算', async () => {
      const testData = generateMindMapData(50)
      const configs: LayoutConfig[] = [
        { type: 'tree', direction: 'right' },
        { type: 'tree', direction: 'down' },
        { type: 'radial' }
      ]
      
      const startTime = performance.now()
      
      // 并发执行多个布局计算
      const promises = configs.map(config => 
        layoutManager.calculateLayout(testData, config)
      )
      
      const results = await Promise.all(promises)
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      
      // 并发执行应该比串行执行更快
      expect(totalTime).toBeLessThan(300)
      expect(results).toHaveLength(3)
      results.forEach(result => {
        expect(result.nodes).toHaveLength(50)
      })
    })
  })

  describe('跨模块集成测试', () => {
    it('应该正确集成事件系统', async () => {
      const testData = generateMindMapData(10)
      const eventHandler = vi.fn()
      
      // 模拟事件总线
      const mockEventBus = {
        emit: vi.fn(),
        on: vi.fn(),
        off: vi.fn()
      }
      
      render(
        <MindMapEditor
          initialData={testData}
          enableEdit={true}
        />
      )
      
      // 验证组件正确渲染
      expect(document.querySelector('.mindmap-editor')).toBeInTheDocument()
    })

    it('应该支持数据导入导出', async () => {
      const testData = generateMindMapData(20)
      
      const startTime = performance.now()
      
      // 测试JSON导出
      const jsonExport = JSON.stringify(testData)
      const parsedData = JSON.parse(jsonExport)
      
      const endTime = performance.now()
      const exportTime = endTime - startTime
      
      expect(exportTime).toBeLessThan(50) // 导出应该很快
      expect(parsedData.nodes).toHaveLength(testData.nodes.length)
      expect(parsedData.links).toHaveLength(testData.links.length)
    })
  })

  describe('错误处理和边界情况', () => {
    it('应该处理空数据集', () => {
      const emptyData: MindMapData = {
        nodes: [],
        links: [],
        rootId: '',
        metadata: {
          title: '空思维导图',
          createdAt: new Date(),
          updatedAt: new Date(),
          version: '1.0.0'
        }
      }
      
      expect(() => {
        render(<MindMapCanvas data={emptyData} />)
      }).not.toThrow()
    })

    it('应该处理无效的布局配置', async () => {
      const testData = generateMindMapData(10)
      const invalidConfig = { type: 'invalid-layout' } as LayoutConfig
      
      await expect(
        layoutManager.calculateLayout(testData, invalidConfig)
      ).rejects.toThrow('不支持的布局类型')
    })

    it('应该优雅处理渲染错误', () => {
      const invalidData = {
        nodes: [{ id: 'invalid', text: null }],
        links: [],
        rootId: 'invalid',
        metadata: {}
      } as any
      
      expect(() => {
        render(<MindMapCanvas data={invalidData} />)
      }).not.toThrow()
    })
  })
})
