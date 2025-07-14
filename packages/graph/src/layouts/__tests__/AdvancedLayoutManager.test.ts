/**
 * 高级布局算法管理器测试
 * 测试多种布局算法和智能布局切换功能
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { AdvancedLayoutManager, AdvancedLayoutConfig } from '../AdvancedLayoutManager'
import { GraphData, GraphNode, GraphLink } from '../../types'

// 测试数据
const mockNodes: GraphNode[] = [
  {
    id: 'node1',
    title: '中心节点',
    type: 'note',
    x: 0,
    y: 0
  },
  {
    id: 'node2',
    title: '子节点1',
    type: 'note',
    x: 0,
    y: 0
  },
  {
    id: 'node3',
    title: '子节点2',
    type: 'note',
    x: 0,
    y: 0
  },
  {
    id: 'node4',
    title: '叶节点1',
    type: 'note',
    x: 0,
    y: 0
  },
  {
    id: 'node5',
    title: '叶节点2',
    type: 'note',
    x: 0,
    y: 0
  }
]

const mockLinks: GraphLink[] = [
  {
    id: 'link1',
    source: 'node1',
    target: 'node2',
    type: 'reference',
    weight: 0.8
  },
  {
    id: 'link2',
    source: 'node1',
    target: 'node3',
    type: 'reference',
    weight: 0.7
  },
  {
    id: 'link3',
    source: 'node2',
    target: 'node4',
    type: 'reference',
    weight: 0.6
  },
  {
    id: 'link4',
    source: 'node3',
    target: 'node5',
    type: 'reference',
    weight: 0.5
  }
]

const mockGraphData: GraphData = {
  nodes: mockNodes,
  links: mockLinks
}

const baseConfig: AdvancedLayoutConfig = {
  type: 'force',
  width: 800,
  height: 600
}

describe('AdvancedLayoutManager', () => {
  let layoutManager: AdvancedLayoutManager

  beforeEach(() => {
    layoutManager = new AdvancedLayoutManager()
  })

  describe('层次布局算法', () => {
    it('应该正确计算层次布局', () => {
      const config = {
        ...baseConfig,
        type: 'hierarchical' as const,
        direction: 'top-down' as const,
        layerSeparation: 100,
        nodeSeparation: 80
      }

      const result = layoutManager.hierarchicalLayout(mockNodes, mockLinks, config)
      
      expect(result).toHaveLength(mockNodes.length)
      expect(result.every(node => typeof node.x === 'number')).toBe(true)
      expect(result.every(node => typeof node.y === 'number')).toBe(true)
    })

    it('应该支持不同的布局方向', () => {
      const directions = ['top-down', 'bottom-up', 'left-right', 'right-left'] as const
      
      directions.forEach(direction => {
        const config = {
          ...baseConfig,
          type: 'hierarchical' as const,
          direction
        }

        const result = layoutManager.hierarchicalLayout(mockNodes, mockLinks, config)
        expect(result).toHaveLength(mockNodes.length)
      })
    })

    it('应该正确处理平衡子树选项', () => {
      const config = {
        ...baseConfig,
        type: 'hierarchical' as const,
        balanceSubtrees: true
      }

      const result = layoutManager.hierarchicalLayout(mockNodes, mockLinks, config)
      expect(result).toHaveLength(mockNodes.length)
    })
  })

  describe('圆形布局算法', () => {
    it('应该正确计算圆形布局', () => {
      const config = {
        ...baseConfig,
        type: 'circular' as const,
        radius: 150,
        startAngle: 0,
        clockwise: true
      }

      const result = layoutManager.circularLayout(mockNodes, mockLinks, config)
      
      expect(result).toHaveLength(mockNodes.length)
      
      // 验证节点在圆周上
      const centerX = config.width / 2
      const centerY = config.height / 2
      
      result.forEach(node => {
        const distance = Math.sqrt(
          Math.pow((node.x || 0) - centerX, 2) + 
          Math.pow((node.y || 0) - centerY, 2)
        )
        expect(distance).toBeCloseTo(config.radius!, 1)
      })
    })

    it('应该支持逆时针排列', () => {
      const config = {
        ...baseConfig,
        type: 'circular' as const,
        clockwise: false
      }

      const result = layoutManager.circularLayout(mockNodes, mockLinks, config)
      expect(result).toHaveLength(mockNodes.length)
    })

    it('应该支持按连接数分组', () => {
      const config = {
        ...baseConfig,
        type: 'circular' as const,
        groupByConnections: true
      }

      const result = layoutManager.circularLayout(mockNodes, mockLinks, config)
      expect(result).toHaveLength(mockNodes.length)
    })
  })

  describe('网格布局算法', () => {
    it('应该正确计算网格布局', () => {
      const config = {
        ...baseConfig,
        type: 'grid' as const,
        columns: 3,
        cellPadding: 20
      }

      const result = layoutManager.gridLayout(mockNodes, mockLinks, config)
      
      expect(result).toHaveLength(mockNodes.length)
      
      // 验证节点在网格中
      result.forEach(node => {
        expect(node.x).toBeGreaterThan(0)
        expect(node.x).toBeLessThan(config.width)
        expect(node.y).toBeGreaterThan(0)
        expect(node.y).toBeLessThan(config.height)
      })
    })

    it('应该支持按连接关系对齐', () => {
      const config = {
        ...baseConfig,
        type: 'grid' as const,
        alignToConnections: true
      }

      const result = layoutManager.gridLayout(mockNodes, mockLinks, config)
      expect(result).toHaveLength(mockNodes.length)
    })

    it('应该自动计算列数', () => {
      const config = {
        ...baseConfig,
        type: 'grid' as const
        // 不指定columns，应该自动计算
      }

      const result = layoutManager.gridLayout(mockNodes, mockLinks, config)
      expect(result).toHaveLength(mockNodes.length)
    })
  })

  describe('径向布局算法', () => {
    it('应该正确计算径向布局', () => {
      const config = {
        ...baseConfig,
        type: 'radial' as const,
        centerNodeId: 'node1',
        radiusStep: 80
      }

      const result = layoutManager.radialLayout(mockNodes, mockLinks, config)
      
      expect(result).toHaveLength(mockNodes.length)
      
      // 验证中心节点在中心位置
      const centerNode = result.find(n => n.id === 'node1')
      expect(centerNode?.x).toBeCloseTo(config.width / 2, 1)
      expect(centerNode?.y).toBeCloseTo(config.height / 2, 1)
    })

    it('应该自动选择最连接的节点作为中心', () => {
      const config = {
        ...baseConfig,
        type: 'radial' as const
        // 不指定centerNodeId，应该自动选择
      }

      const result = layoutManager.radialLayout(mockNodes, mockLinks, config)
      expect(result).toHaveLength(mockNodes.length)
    })

    it('应该支持自定义角度范围', () => {
      const config = {
        ...baseConfig,
        type: 'radial' as const,
        angleSpread: Math.PI // 半圆
      }

      const result = layoutManager.radialLayout(mockNodes, mockLinks, config)
      expect(result).toHaveLength(mockNodes.length)
    })
  })

  describe('增强力导向布局', () => {
    it('应该创建力导向仿真', () => {
      const config = {
        ...baseConfig,
        linkDistance: 50,
        chargeStrength: -300,
        centerForce: 0.1
      }

      const simulation = layoutManager.enhancedForceLayout(mockNodes, mockLinks, config)
      
      expect(simulation).toBeDefined()
      expect(typeof simulation.stop).toBe('function')
      expect(typeof simulation.restart).toBe('function')
    })

    it('应该支持碰撞检测', () => {
      const config = {
        ...baseConfig,
        collisionRadius: 15,
        enableCollision: true
      }

      const simulation = layoutManager.enhancedForceLayout(mockNodes, mockLinks, config)
      expect(simulation).toBeDefined()
    })

    it('应该支持边界约束', () => {
      const config = {
        ...baseConfig,
        width: 400,
        height: 300
      }

      const simulation = layoutManager.enhancedForceLayout(mockNodes, mockLinks, config)
      
      // 运行几次迭代
      simulation.tick()
      simulation.tick()
      simulation.tick()
      
      // 验证节点在边界内
      mockNodes.forEach(node => {
        expect(node.x || 0).toBeGreaterThanOrEqual(0)
        expect(node.x || 0).toBeLessThanOrEqual(config.width)
        expect(node.y || 0).toBeGreaterThanOrEqual(0)
        expect(node.y || 0).toBeLessThanOrEqual(config.height)
      })
    })
  })

  describe('智能布局选择', () => {
    it('应该为小型网络建议圆形布局', () => {
      const smallNodes = mockNodes.slice(0, 3)
      const smallLinks = mockLinks.slice(0, 2)
      
      const suggestion = layoutManager.suggestOptimalLayout(smallNodes, smallLinks)
      expect(suggestion).toBe('circular')
    })

    it('应该为层次结构建议层次布局', () => {
      // 创建明显的层次结构
      const hierarchicalNodes = [
        { id: 'root', title: '根节点', type: 'note' as const },
        { id: 'child1', title: '子节点1', type: 'note' as const },
        { id: 'child2', title: '子节点2', type: 'note' as const },
        { id: 'leaf1', title: '叶节点1', type: 'note' as const },
        { id: 'leaf2', title: '叶节点2', type: 'note' as const }
      ]
      
      const hierarchicalLinks = [
        { id: 'link1', source: 'root', target: 'child1', type: 'reference' as const },
        { id: 'link2', source: 'root', target: 'child2', type: 'reference' as const },
        { id: 'link3', source: 'child1', target: 'leaf1', type: 'reference' as const },
        { id: 'link4', source: 'child2', target: 'leaf2', type: 'reference' as const }
      ]
      
      const suggestion = layoutManager.suggestOptimalLayout(hierarchicalNodes, hierarchicalLinks)
      expect(suggestion).toBe('hierarchical')
    })

    it('应该为大型网络建议网格布局', () => {
      const largeNodes = Array.from({ length: 60 }, (_, i) => ({
        id: `node${i}`,
        title: `节点${i}`,
        type: 'note' as const
      }))
      
      const suggestion = layoutManager.suggestOptimalLayout(largeNodes, [])
      expect(suggestion).toBe('grid')
    })
  })

  describe('布局过渡动画', () => {
    it('应该执行布局过渡', async () => {
      const currentNodes = [...mockNodes]
      const config = {
        ...baseConfig,
        animationDuration: 100 // 短动画用于测试
      }

      const progressCallback = vi.fn()
      
      const result = await layoutManager.transitionToLayout(
        currentNodes,
        'circular',
        config,
        progressCallback
      )
      
      expect(result).toHaveLength(mockNodes.length)
      expect(progressCallback).toHaveBeenCalled()
    })

    it('应该防止并发过渡', async () => {
      const currentNodes = [...mockNodes]
      const config = {
        ...baseConfig,
        animationDuration: 100
      }

      // 启动第一个过渡
      const transition1 = layoutManager.transitionToLayout(currentNodes, 'circular', config)
      
      // 尝试启动第二个过渡
      await expect(
        layoutManager.transitionToLayout(currentNodes, 'grid', config)
      ).rejects.toThrow('布局过渡正在进行中')

      // 等待第一个过渡完成
      await transition1
    })

    it('应该支持不同的缓动函数', async () => {
      const easingFunctions = ['linear', 'ease-in', 'ease-out', 'ease-in-out', 'bounce'] as const
      
      for (const easing of easingFunctions) {
        const config = {
          ...baseConfig,
          animationDuration: 50,
          easing
        }

        const result = await layoutManager.transitionToLayout(
          [...mockNodes],
          'circular',
          config
        )
        
        expect(result).toHaveLength(mockNodes.length)
      }
    })
  })

  describe('布局指标计算', () => {
    it('应该计算布局指标', () => {
      // 设置节点位置
      const positionedNodes = mockNodes.map((node, index) => ({
        ...node,
        x: index * 100,
        y: index * 50
      }))

      const metrics = layoutManager.calculateLayoutMetrics(positionedNodes, mockLinks)
      
      expect(metrics.overlappingNodes).toBeGreaterThanOrEqual(0)
      expect(metrics.averageEdgeLength).toBeGreaterThan(0)
      expect(metrics.compactness).toBeGreaterThanOrEqual(0)
      expect(metrics.visualBalance).toBeGreaterThanOrEqual(0)
      expect(metrics.visualBalance).toBeLessThanOrEqual(1)
    })

    it('应该检测重叠节点', () => {
      // 创建重叠的节点
      const overlappingNodes = mockNodes.map(node => ({
        ...node,
        x: 100, // 所有节点在同一位置
        y: 100
      }))

      const metrics = layoutManager.calculateLayoutMetrics(overlappingNodes, mockLinks)
      expect(metrics.overlappingNodes).toBeGreaterThan(0)
    })

    it('应该计算视觉平衡度', () => {
      // 创建平衡的布局
      const balancedNodes = [
        { ...mockNodes[0], x: 100, y: 100 },
        { ...mockNodes[1], x: 200, y: 100 },
        { ...mockNodes[2], x: 100, y: 200 },
        { ...mockNodes[3], x: 200, y: 200 }
      ]

      const metrics = layoutManager.calculateLayoutMetrics(balancedNodes, mockLinks)
      expect(metrics.visualBalance).toBeGreaterThan(0.5) // 应该相对平衡
    })
  })

  describe('性能测试', () => {
    it('应该在合理时间内完成布局计算', () => {
      const largeNodes = Array.from({ length: 100 }, (_, i) => ({
        id: `node${i}`,
        title: `节点${i}`,
        type: 'note' as const,
        x: 0,
        y: 0
      }))

      const largeLinks = Array.from({ length: 150 }, (_, i) => ({
        id: `link${i}`,
        source: `node${i % 100}`,
        target: `node${(i + 1) % 100}`,
        type: 'reference' as const
      }))

      const startTime = performance.now()
      
      const result = layoutManager.circularLayout(largeNodes, largeLinks, baseConfig)
      
      const endTime = performance.now()
      const duration = endTime - startTime

      expect(result).toHaveLength(largeNodes.length)
      expect(duration).toBeLessThan(100) // 应该在100ms内完成
    })

    it('应该正确处理空数据', () => {
      const emptyNodes: GraphNode[] = []
      const emptyLinks: GraphLink[] = []

      const result = layoutManager.circularLayout(emptyNodes, emptyLinks, baseConfig)
      expect(result).toHaveLength(0)

      const metrics = layoutManager.calculateLayoutMetrics(emptyNodes, emptyLinks)
      expect(metrics.overlappingNodes).toBe(0)
      expect(metrics.averageEdgeLength).toBe(0)
    })

    it('应该处理单个节点', () => {
      const singleNode = [mockNodes[0]]
      const noLinks: GraphLink[] = []

      const result = layoutManager.radialLayout(singleNode, noLinks, baseConfig)
      expect(result).toHaveLength(1)
      
      // 单个节点应该在中心
      expect(result[0].x).toBeCloseTo(baseConfig.width / 2, 1)
      expect(result[0].y).toBeCloseTo(baseConfig.height / 2, 1)
    })
  })

  describe('错误处理', () => {
    it('应该处理无效的配置', () => {
      const invalidConfig = {
        ...baseConfig,
        width: -100, // 无效宽度
        height: -100  // 无效高度
      }

      // 应该不抛出错误，而是使用默认值或处理无效输入
      expect(() => {
        layoutManager.circularLayout(mockNodes, mockLinks, invalidConfig)
      }).not.toThrow()
    })

    it('应该处理缺失的节点引用', () => {
      const invalidLinks = [
        {
          id: 'invalid-link',
          source: 'non-existent-node',
          target: 'another-non-existent-node',
          type: 'reference' as const
        }
      ]

      expect(() => {
        layoutManager.hierarchicalLayout(mockNodes, invalidLinks, baseConfig)
      }).not.toThrow()
    })
  })
})
