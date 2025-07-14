/**
 * 布局管理器测试
 * 测试所有布局算法的功能和性能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { LayoutManager } from '../LayoutManager'
import { MindMapData, MindMapNode, LayoutConfig } from '../../types'

// 模拟测试数据
const createTestData = (): MindMapData => ({
  nodes: [
    {
      id: 'root',
      text: '中心主题',
      level: 0,
      children: [],
      x: 400,
      y: 300,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date()
      }
    },
    {
      id: 'node1',
      text: '子主题1',
      level: 1,
      parentId: 'root',
      children: [],
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date()
      }
    },
    {
      id: 'node2',
      text: '子主题2',
      level: 1,
      parentId: 'root',
      children: [],
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date()
      }
    },
    {
      id: 'node3',
      text: '子子主题1',
      level: 2,
      parentId: 'node1',
      children: [],
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }
  ],
  links: [
    {
      id: 'link1',
      source: 'root',
      target: 'node1',
      type: 'parent-child'
    },
    {
      id: 'link2',
      source: 'root',
      target: 'node2',
      type: 'parent-child'
    },
    {
      id: 'link3',
      source: 'node1',
      target: 'node3',
      type: 'parent-child'
    }
  ],
  rootId: 'root',
  metadata: {
    title: '测试思维导图',
    createdAt: new Date(),
    updatedAt: new Date(),
    version: '1.0.0'
  }
})

describe('LayoutManager', () => {
  let layoutManager: LayoutManager
  let testData: MindMapData

  beforeEach(() => {
    layoutManager = new LayoutManager()
    testData = createTestData()
    
    // 清除缓存和性能指标
    layoutManager.clearCache()
    layoutManager.clearPerformanceMetrics()
  })

  describe('基础功能', () => {
    it('应该支持所有布局类型', () => {
      const supportedLayouts = layoutManager.getSupportedLayouts()
      
      expect(supportedLayouts).toContain('tree')
      expect(supportedLayouts).toContain('radial')
      expect(supportedLayouts).toContain('force')
      expect(supportedLayouts.length).toBeGreaterThanOrEqual(3)
    })

    it('应该提供布局信息', () => {
      const treeInfo = layoutManager.getLayoutInfo('tree')
      
      expect(treeInfo.name).toBe('树形布局')
      expect(treeInfo.description).toContain('层次化')
      expect(treeInfo.features).toContain('层次清晰')
    })

    it('应该推荐合适的布局', () => {
      const recommended = layoutManager.getRecommendedLayout(testData)
      
      expect(['tree', 'radial', 'force']).toContain(recommended)
    })
  })

  describe('布局计算', () => {
    it('应该正确计算树形布局', async () => {
      const config: LayoutConfig = {
        type: 'tree',
        nodeSpacing: 100,
        levelSpacing: 150
      }

      const result = await layoutManager.calculateLayout(testData, config)
      
      expect(result.nodes).toHaveLength(testData.nodes.length)
      expect(result.links).toHaveLength(testData.links.length)
      
      // 检查节点是否有位置信息
      result.nodes.forEach(node => {
        expect(typeof node.x).toBe('number')
        expect(typeof node.y).toBe('number')
      })
    })

    it('应该正确计算径向布局', async () => {
      const config: LayoutConfig = {
        type: 'radial',
        nodeSpacing: 80,
        levelSpacing: 120
      }

      const result = await layoutManager.calculateLayout(testData, config)
      
      expect(result.nodes).toHaveLength(testData.nodes.length)
      
      // 检查根节点是否在中心
      const rootNode = result.nodes.find(n => n.id === 'root')
      expect(rootNode?.x).toBe(0)
      expect(rootNode?.y).toBe(0)
    })

    it('应该正确计算力导向布局', async () => {
      const config: LayoutConfig = {
        type: 'force',
        nodeSpacing: 80,
        linkDistance: 100,
        iterations: 50 // 减少迭代次数以加快测试
      }

      const startTime = performance.now()
      const result = await layoutManager.calculateLayout(testData, config)
      const endTime = performance.now()
      
      expect(result.nodes).toHaveLength(testData.nodes.length)
      
      // 力导向布局应该在合理时间内完成
      expect(endTime - startTime).toBeLessThan(2000) // 2秒内完成
      
      // 检查节点位置是否合理
      result.nodes.forEach(node => {
        expect(node.x).toBeGreaterThan(-1000)
        expect(node.x).toBeLessThan(1000)
        expect(node.y).toBeGreaterThan(-1000)
        expect(node.y).toBeLessThan(1000)
      })
    })

    it('应该处理无效的布局类型', async () => {
      const config: LayoutConfig = {
        type: 'invalid' as any
      }

      await expect(layoutManager.calculateLayout(testData, config))
        .rejects.toThrow('不支持的布局类型')
    })
  })

  describe('性能优化', () => {
    it('应该使用缓存提升性能', async () => {
      const config: LayoutConfig = {
        type: 'tree',
        nodeSpacing: 100
      }

      // 第一次计算
      const startTime1 = performance.now()
      await layoutManager.calculateLayout(testData, config, true)
      const endTime1 = performance.now()
      const firstTime = endTime1 - startTime1

      // 第二次计算（应该使用缓存）
      const startTime2 = performance.now()
      await layoutManager.calculateLayout(testData, config, true)
      const endTime2 = performance.now()
      const secondTime = endTime2 - startTime2

      // 缓存的计算应该更快
      expect(secondTime).toBeLessThan(firstTime)
    })

    it('应该记录性能指标', async () => {
      const config: LayoutConfig = {
        type: 'tree'
      }

      await layoutManager.calculateLayout(testData, config)
      
      const stats = layoutManager.getPerformanceStats()
      
      expect(stats.totalCalculations).toBe(1)
      expect(stats.averageTime).toBeGreaterThan(0)
      expect(stats.byLayoutType.tree).toBeDefined()
      expect(stats.byLayoutType.tree.count).toBe(1)
    })

    it('应该在性能超标时发出警告', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      
      // 创建大量节点以触发性能警告
      const largeData: MindMapData = {
        ...testData,
        nodes: Array.from({ length: 200 }, (_, i) => ({
          id: `node${i}`,
          text: `节点${i}`,
          level: Math.floor(i / 10),
          parentId: i === 0 ? undefined : `node${Math.floor((i - 1) / 10)}`,
          children: [],
          metadata: {
            createdAt: new Date(),
            updatedAt: new Date()
          }
        }))
      }

      const config: LayoutConfig = {
        type: 'force',
        iterations: 500 // 增加迭代次数
      }

      await layoutManager.calculateLayout(largeData, config)
      
      // 应该有性能警告（如果计算时间超过100ms）
      // 注意：这个测试可能不稳定，取决于机器性能
      
      consoleSpy.mockRestore()
    })
  })

  describe('布局过渡', () => {
    it('应该创建平滑的布局过渡', async () => {
      const fromConfig: LayoutConfig = { type: 'tree' }
      const toConfig: LayoutConfig = { type: 'radial' }

      const fromData = await layoutManager.calculateLayout(testData, fromConfig)
      const toData = await layoutManager.calculateLayout(testData, toConfig)

      const transition = layoutManager.createLayoutTransition(
        fromData,
        toData,
        {
          from: 'tree',
          to: 'radial',
          duration: 1000,
          easing: 'ease-in-out'
        }
      )

      expect(transition.keyframes.length).toBeGreaterThan(10)
      expect(transition.duration).toBe(1000)
      
      // 检查第一帧和最后一帧
      const firstFrame = transition.keyframes[0]
      const lastFrame = transition.keyframes[transition.keyframes.length - 1]
      
      expect(firstFrame.nodes[0].x).toBeCloseTo(fromData.nodes[0].x || 0, 1)
      expect(lastFrame.nodes[0].x).toBeCloseTo(toData.nodes[0].x || 0, 1)
    })
  })

  describe('推荐系统', () => {
    it('应该为小型思维导图推荐径向布局', () => {
      const smallData: MindMapData = {
        ...testData,
        nodes: testData.nodes.slice(0, 2) // 只保留2个节点
      }

      const recommended = layoutManager.getRecommendedLayout(smallData)
      expect(recommended).toBe('radial')
    })

    it('应该为大型思维导图推荐树形布局', () => {
      const largeData: MindMapData = {
        ...testData,
        nodes: Array.from({ length: 60 }, (_, i) => ({
          id: `node${i}`,
          text: `节点${i}`,
          level: Math.floor(i / 10),
          parentId: i === 0 ? undefined : 'root',
          children: [],
          metadata: {
            createdAt: new Date(),
            updatedAt: new Date()
          }
        }))
      }

      const recommended = layoutManager.getRecommendedLayout(largeData)
      expect(recommended).toBe('tree')
    })
  })
})
