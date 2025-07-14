/**
 * MindMap模块性能基准测试
 * 验证<100ms渲染性能目标和大型思维导图处理能力
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MindMapService } from '../MindMapModule'
import { LayoutManager } from '../algorithms/LayoutManager'
import { MindMapData, MindMapNode, LayoutConfig } from '../types'

// 性能测试配置
const PERFORMANCE_TARGETS = {
  RENDER_TIME: 100, // ms
  LAYOUT_CALCULATION: 100, // ms
  LARGE_DATASET_RENDER: 200, // ms
  MEMORY_USAGE: 50 * 1024 * 1024, // 50MB
}

// 测试数据生成器
function generateTestData(nodeCount: number): MindMapData {
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
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date()
    }
  })

  // 创建子节点
  for (let i = 1; i < nodeCount; i++) {
    const parentIndex = Math.floor((i - 1) / 5) // 每个父节点最多5个子节点
    const parentId = parentIndex === 0 ? 'root' : `node-${parentIndex}`
    
    nodes.push({
      id: `node-${i}`,
      text: `节点 ${i}`,
      level: Math.floor(Math.log(i + 1) / Math.log(5)) + 1,
      parentId,
      children: [],
      x: 400 + (i % 10) * 80,
      y: 300 + Math.floor(i / 10) * 60,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date()
      }
    })

    // 创建连接
    links.push({
      id: `link-${i}`,
      source: parentId,
      target: `node-${i}`,
      type: 'parent-child'
    })
  }

  return { nodes, links, rootId: 'root' }
}

// 内存使用监控
function getMemoryUsage() {
  if (typeof performance !== 'undefined' && (performance as any).memory) {
    return (performance as any).memory.usedJSHeapSize
  }
  return 0
}

describe('MindMap性能基准测试', () => {
  let mindMapService: MindMapService
  let layoutManager: LayoutManager

  beforeEach(() => {
    // 模拟核心API
    const mockCoreAPI = {
      database: { execute: vi.fn(), query: vi.fn() },
      events: { emit: vi.fn(), on: vi.fn(), off: vi.fn() }
    }

    mindMapService = new MindMapService(mockCoreAPI)
    layoutManager = new LayoutManager()
  })

  describe('渲染性能测试', () => {
    it('小型思维导图应该在100ms内完成渲染', async () => {
      const testData = generateTestData(20)
      
      const startTime = performance.now()
      
      // 模拟渲染过程
      const mindMap = await mindMapService.createMindMap({
        title: '性能测试',
        data: testData
      })
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      expect(renderTime).toBeLessThan(PERFORMANCE_TARGETS.RENDER_TIME)
      expect(mindMap).toBeDefined()
      expect(mindMap.data.nodes).toHaveLength(20)
    })

    it('中型思维导图应该在150ms内完成渲染', async () => {
      const testData = generateTestData(100)
      
      const startTime = performance.now()
      
      const mindMap = await mindMapService.createMindMap({
        title: '中型性能测试',
        data: testData
      })
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      expect(renderTime).toBeLessThan(150)
      expect(mindMap.data.nodes).toHaveLength(100)
    })

    it('大型思维导图应该在200ms内完成渲染', async () => {
      const testData = generateTestData(500)
      
      const startTime = performance.now()
      
      const mindMap = await mindMapService.createMindMap({
        title: '大型性能测试',
        data: testData
      })
      
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      expect(renderTime).toBeLessThan(PERFORMANCE_TARGETS.LARGE_DATASET_RENDER)
      expect(mindMap.data.nodes).toHaveLength(500)
    })
  })

  describe('布局算法性能测试', () => {
    it('树形布局应该在100ms内完成计算', async () => {
      const testData = generateTestData(100)
      const config: LayoutConfig = { type: 'tree', direction: 'right' }
      
      const startTime = performance.now()
      
      const result = await layoutManager.calculateLayout(testData, config)
      
      const endTime = performance.now()
      const calculationTime = endTime - startTime
      
      expect(calculationTime).toBeLessThan(PERFORMANCE_TARGETS.LAYOUT_CALCULATION)
      expect(result.nodes).toHaveLength(100)
    })

    it('径向布局应该在100ms内完成计算', async () => {
      const testData = generateTestData(100)
      const config: LayoutConfig = { type: 'radial' }
      
      const startTime = performance.now()
      
      const result = await layoutManager.calculateLayout(testData, config)
      
      const endTime = performance.now()
      const calculationTime = endTime - startTime
      
      expect(calculationTime).toBeLessThan(PERFORMANCE_TARGETS.LAYOUT_CALCULATION)
      expect(result.nodes).toHaveLength(100)
    })

    it('力导向布局应该在合理时间内完成计算', async () => {
      const testData = generateTestData(50) // 力导向布局计算量大，减少节点数
      const config: LayoutConfig = { type: 'force', iterations: 100 }
      
      const startTime = performance.now()
      
      const result = await layoutManager.calculateLayout(testData, config)
      
      const endTime = performance.now()
      const calculationTime = endTime - startTime
      
      // 力导向布局允许更长的计算时间
      expect(calculationTime).toBeLessThan(500)
      expect(result.nodes).toHaveLength(50)
    })
  })

  describe('内存使用测试', () => {
    it('应该有效管理内存使用', async () => {
      const initialMemory = getMemoryUsage()
      
      // 创建多个思维导图
      const mindMaps = []
      for (let i = 0; i < 10; i++) {
        const testData = generateTestData(50)
        const mindMap = await mindMapService.createMindMap({
          title: `内存测试 ${i}`,
          data: testData
        })
        mindMaps.push(mindMap)
      }
      
      const peakMemory = getMemoryUsage()
      
      // 清理思维导图
      for (const mindMap of mindMaps) {
        await mindMapService.deleteMindMap(mindMap.id)
      }
      
      // 强制垃圾回收（如果可用）
      if (global.gc) {
        global.gc()
      }
      
      const finalMemory = getMemoryUsage()
      const memoryGrowth = finalMemory - initialMemory
      
      // 内存增长应该在合理范围内
      if (initialMemory > 0) {
        expect(memoryGrowth).toBeLessThan(PERFORMANCE_TARGETS.MEMORY_USAGE)
      }
    })
  })

  describe('缓存性能测试', () => {
    it('布局缓存应该显著提升性能', async () => {
      const testData = generateTestData(100)
      const config: LayoutConfig = { type: 'tree', direction: 'right' }
      
      // 第一次计算（无缓存）
      const startTime1 = performance.now()
      const result1 = await layoutManager.calculateLayout(testData, config)
      const endTime1 = performance.now()
      const firstCalculationTime = endTime1 - startTime1
      
      // 第二次计算（有缓存）
      const startTime2 = performance.now()
      const result2 = await layoutManager.calculateLayout(testData, config)
      const endTime2 = performance.now()
      const secondCalculationTime = endTime2 - startTime2
      
      // 缓存应该显著提升性能
      expect(secondCalculationTime).toBeLessThan(firstCalculationTime * 0.5)
      expect(result1.nodes).toHaveLength(result2.nodes.length)
    })
  })

  describe('并发性能测试', () => {
    it('应该能够处理并发布局计算', async () => {
      const testData = generateTestData(50)
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
      expect(totalTime).toBeLessThan(300) // 3个布局算法并发执行
      expect(results).toHaveLength(3)
      results.forEach(result => {
        expect(result.nodes).toHaveLength(50)
      })
    })
  })
})
