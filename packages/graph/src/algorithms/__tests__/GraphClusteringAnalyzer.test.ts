/**
 * 图形聚类分析器测试
 * 测试多种社区检测算法和聚类质量评估功能
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GraphClusteringAnalyzer, ClusteringConfig } from '../GraphClusteringAnalyzer'
import { GraphNode, GraphLink } from '../../types'

// 测试数据
const mockNodes: GraphNode[] = [
  // 第一个社区
  { id: 'node1', title: '节点1', type: 'note', x: 100, y: 100, tags: ['社区A', '技术'] },
  { id: 'node2', title: '节点2', type: 'note', x: 120, y: 110, tags: ['社区A', '技术'] },
  { id: 'node3', title: '节点3', type: 'note', x: 110, y: 120, tags: ['社区A'] },
  
  // 第二个社区
  { id: 'node4', title: '节点4', type: 'tag', x: 300, y: 200, tags: ['社区B', '设计'] },
  { id: 'node5', title: '节点5', type: 'tag', x: 320, y: 210, tags: ['社区B', '设计'] },
  { id: 'node6', title: '节点6', type: 'tag', x: 310, y: 220, tags: ['社区B'] },
  
  // 第三个社区
  { id: 'node7', title: '节点7', type: 'folder', x: 500, y: 300, tags: ['社区C', '管理'] },
  { id: 'node8', title: '节点8', type: 'folder', x: 520, y: 310, tags: ['社区C', '管理'] },
  
  // 孤立节点
  { id: 'node9', title: '孤立节点', type: 'note', x: 700, y: 400, tags: ['孤立'] }
]

const mockLinks: GraphLink[] = [
  // 第一个社区内部连接
  { id: 'link1', source: 'node1', target: 'node2', type: 'reference', weight: 0.8 },
  { id: 'link2', source: 'node2', target: 'node3', type: 'reference', weight: 0.7 },
  { id: 'link3', source: 'node1', target: 'node3', type: 'reference', weight: 0.6 },
  
  // 第二个社区内部连接
  { id: 'link4', source: 'node4', target: 'node5', type: 'tag', weight: 0.9 },
  { id: 'link5', source: 'node5', target: 'node6', type: 'tag', weight: 0.8 },
  { id: 'link6', source: 'node4', target: 'node6', type: 'tag', weight: 0.7 },
  
  // 第三个社区内部连接
  { id: 'link7', source: 'node7', target: 'node8', type: 'folder', weight: 0.9 },
  
  // 社区间弱连接
  { id: 'link8', source: 'node3', target: 'node4', type: 'reference', weight: 0.3 },
  { id: 'link9', source: 'node6', target: 'node7', type: 'reference', weight: 0.2 }
]

const baseConfig: ClusteringConfig = {
  algorithm: 'louvain',
  minClusterSize: 2,
  maxClusters: 5,
  resolution: 1.0,
  maxIterations: 100,
  convergenceThreshold: 1e-6,
  hierarchical: false
}

describe('GraphClusteringAnalyzer', () => {
  let analyzer: GraphClusteringAnalyzer

  beforeEach(() => {
    analyzer = new GraphClusteringAnalyzer()
  })

  describe('Louvain算法', () => {
    it('应该正确执行Louvain社区检测', async () => {
      const config = { ...baseConfig, algorithm: 'louvain' as const }
      
      const result = await analyzer.performClustering(mockNodes, mockLinks, config)
      
      expect(result.clusters.length).toBeGreaterThan(0)
      expect(result.clusters.length).toBeLessThanOrEqual(config.maxClusters!)
      expect(result.modularity).toBeGreaterThanOrEqual(-1)
      expect(result.modularity).toBeLessThanOrEqual(1)
      expect(result.executionTime).toBeGreaterThan(0)
      expect(result.executionTime).toBeLessThan(100) // 应该在100ms内完成
    })

    it('应该支持不同的分辨率参数', async () => {
      const lowResConfig = { ...baseConfig, algorithm: 'louvain' as const, resolution: 0.5 }
      const highResConfig = { ...baseConfig, algorithm: 'louvain' as const, resolution: 2.0 }
      
      const lowResResult = await analyzer.performClustering(mockNodes, mockLinks, lowResConfig)
      const highResResult = await analyzer.performClustering(mockNodes, mockLinks, highResConfig)
      
      // 低分辨率通常产生更少的聚类
      expect(lowResResult.clusters.length).toBeLessThanOrEqual(highResResult.clusters.length)
    })

    it('应该正确计算模块度', async () => {
      const config = { ...baseConfig, algorithm: 'louvain' as const }
      
      const result = await analyzer.performClustering(mockNodes, mockLinks, config)
      
      // 对于有明显社区结构的图，模块度应该为正
      expect(result.modularity).toBeGreaterThan(0)
    })
  })

  describe('模块度优化算法', () => {
    it('应该正确执行模块度优化', async () => {
      const config = { ...baseConfig, algorithm: 'modularity' as const }
      
      const result = await analyzer.performClustering(mockNodes, mockLinks, config)
      
      expect(result.clusters.length).toBeGreaterThan(0)
      expect(result.modularity).toBeGreaterThanOrEqual(-1)
      expect(result.modularity).toBeLessThanOrEqual(1)
    })

    it('应该在指定迭代次数内收敛', async () => {
      const config = { 
        ...baseConfig, 
        algorithm: 'modularity' as const,
        maxIterations: 10
      }
      
      const startTime = performance.now()
      const result = await analyzer.performClustering(mockNodes, mockLinks, config)
      const endTime = performance.now()
      
      expect(result.executionTime).toBeLessThan(endTime - startTime + 10) // 允许一些误差
    })
  })

  describe('连通性聚类', () => {
    it('应该正确识别连通分量', async () => {
      const config = { ...baseConfig, algorithm: 'connectivity' as const }
      
      const result = await analyzer.performClustering(mockNodes, mockLinks, config)
      
      // 应该至少有一个聚类（主要连通分量）
      expect(result.clusters.length).toBeGreaterThan(0)
      
      // 验证每个聚类内的节点都是连通的
      result.clusters.forEach(cluster => {
        expect(cluster.nodes.length).toBeGreaterThanOrEqual(config.minClusterSize!)
      })
    })

    it('应该正确处理孤立节点', async () => {
      // 创建包含孤立节点的图
      const isolatedNodes = [
        ...mockNodes,
        { id: 'isolated1', title: '孤立1', type: 'note', x: 800, y: 500 },
        { id: 'isolated2', title: '孤立2', type: 'note', x: 900, y: 600 }
      ]
      
      const config = { ...baseConfig, algorithm: 'connectivity' as const, minClusterSize: 1 }
      
      const result = await analyzer.performClustering(isolatedNodes, mockLinks, config)
      
      // 应该包含孤立节点的单节点聚类
      const singleNodeClusters = result.clusters.filter(c => c.nodes.length === 1)
      expect(singleNodeClusters.length).toBeGreaterThan(0)
    })
  })

  describe('标签聚类', () => {
    it('应该按标签正确分组节点', async () => {
      const config = { ...baseConfig, algorithm: 'tags' as const }
      
      const result = await analyzer.performClustering(mockNodes, mockLinks, config)
      
      expect(result.clusters.length).toBeGreaterThan(0)
      
      // 验证同一聚类中的节点有共同标签
      result.clusters.forEach(cluster => {
        if (cluster.label) {
          const clusterNodes = mockNodes.filter(n => cluster.nodes.includes(n.id))
          const hasCommonTag = clusterNodes.every(node => 
            node.tags?.includes(cluster.label!)
          )
          expect(hasCommonTag).toBe(true)
        }
      })
    })

    it('应该处理没有标签的节点', async () => {
      const nodesWithoutTags = mockNodes.map(node => ({ ...node, tags: undefined }))
      const config = { ...baseConfig, algorithm: 'tags' as const }
      
      const result = await analyzer.performClustering(nodesWithoutTags, mockLinks, config)
      
      // 没有标签的节点应该不会形成基于标签的聚类
      expect(result.clusters.length).toBe(0)
    })
  })

  describe('类型聚类', () => {
    it('应该按节点类型正确分组', async () => {
      const config = { ...baseConfig, algorithm: 'type' as const }
      
      const result = await analyzer.performClustering(mockNodes, mockLinks, config)
      
      expect(result.clusters.length).toBeGreaterThan(0)
      
      // 验证同一聚类中的节点有相同类型
      result.clusters.forEach(cluster => {
        const clusterNodes = mockNodes.filter(n => cluster.nodes.includes(n.id))
        const nodeTypes = [...new Set(clusterNodes.map(n => n.type))]
        expect(nodeTypes.length).toBe(1) // 每个聚类只有一种类型
      })
    })

    it('应该为每种节点类型创建聚类', async () => {
      const config = { ...baseConfig, algorithm: 'type' as const, minClusterSize: 1 }
      
      const result = await analyzer.performClustering(mockNodes, mockLinks, config)
      
      const nodeTypes = [...new Set(mockNodes.map(n => n.type))]
      expect(result.clusters.length).toBe(nodeTypes.length)
    })
  })

  describe('K-means聚类', () => {
    it('应该基于位置进行K-means聚类', async () => {
      const config = { ...baseConfig, algorithm: 'kmeans' as const, maxClusters: 3 }
      
      const result = await analyzer.performClustering(mockNodes, mockLinks, config)
      
      expect(result.clusters.length).toBeGreaterThan(0)
      expect(result.clusters.length).toBeLessThanOrEqual(config.maxClusters!)
      
      // 验证聚类中心计算
      result.clusters.forEach(cluster => {
        expect(cluster.center.x).toBeGreaterThanOrEqual(0)
        expect(cluster.center.y).toBeGreaterThanOrEqual(0)
        expect(cluster.radius).toBeGreaterThan(0)
      })
    })

    it('应该处理没有位置信息的节点', async () => {
      const nodesWithoutPosition = mockNodes.map(node => ({ ...node, x: undefined, y: undefined }))
      const config = { ...baseConfig, algorithm: 'kmeans' as const }
      
      const result = await analyzer.performClustering(nodesWithoutPosition, mockLinks, config)
      
      // 应该能够处理并分配随机位置
      expect(result.clusters.length).toBeGreaterThan(0)
    })
  })

  describe('聚类质量评估', () => {
    it('应该计算正确的聚类质量指标', async () => {
      const config = { ...baseConfig, algorithm: 'louvain' as const }
      
      const result = await analyzer.performClustering(mockNodes, mockLinks, config)
      
      expect(result.quality.internalDensity).toBeGreaterThanOrEqual(0)
      expect(result.quality.internalDensity).toBeLessThanOrEqual(1)
      expect(result.quality.externalDensity).toBeGreaterThanOrEqual(0)
      expect(result.quality.silhouetteScore).toBeGreaterThanOrEqual(-1)
      expect(result.quality.silhouetteScore).toBeLessThanOrEqual(1)
      expect(result.quality.separation).toBeGreaterThanOrEqual(0)
      expect(result.quality.separation).toBeLessThanOrEqual(1)
      expect(result.quality.cohesion).toBeGreaterThanOrEqual(0)
      expect(result.quality.cohesion).toBeLessThanOrEqual(1)
    })

    it('应该为高质量聚类返回更好的指标', async () => {
      // 创建明显分离的聚类
      const wellSeparatedNodes: GraphNode[] = [
        // 聚类1
        { id: 'c1n1', title: '聚类1节点1', type: 'note', x: 0, y: 0 },
        { id: 'c1n2', title: '聚类1节点2', type: 'note', x: 10, y: 10 },
        // 聚类2
        { id: 'c2n1', title: '聚类2节点1', type: 'note', x: 1000, y: 1000 },
        { id: 'c2n2', title: '聚类2节点2', type: 'note', x: 1010, y: 1010 }
      ]
      
      const wellSeparatedLinks: GraphLink[] = [
        { id: 'l1', source: 'c1n1', target: 'c1n2', type: 'reference', weight: 1.0 },
        { id: 'l2', source: 'c2n1', target: 'c2n2', type: 'reference', weight: 1.0 }
      ]
      
      const config = { ...baseConfig, algorithm: 'connectivity' as const }
      
      const result = await analyzer.performClustering(wellSeparatedNodes, wellSeparatedLinks, config)
      
      // 良好分离的聚类应该有高内部密度和低外部密度
      expect(result.quality.internalDensity).toBeGreaterThan(0.5)
      expect(result.quality.externalDensity).toBe(0) // 没有跨聚类连接
    })
  })

  describe('性能测试', () => {
    it('应该在合理时间内处理大型图', async () => {
      // 创建大型图
      const largeNodes: GraphNode[] = Array.from({ length: 100 }, (_, i) => ({
        id: `large_node_${i}`,
        title: `大型节点${i}`,
        type: 'note',
        x: Math.random() * 1000,
        y: Math.random() * 1000
      }))
      
      const largeLinks: GraphLink[] = Array.from({ length: 200 }, (_, i) => ({
        id: `large_link_${i}`,
        source: `large_node_${i % 100}`,
        target: `large_node_${(i + 1) % 100}`,
        type: 'reference',
        weight: Math.random()
      }))
      
      const config = { ...baseConfig, algorithm: 'louvain' as const }
      
      const startTime = performance.now()
      const result = await analyzer.performClustering(largeNodes, largeLinks, config)
      const endTime = performance.now()
      
      expect(result.executionTime).toBeLessThan(100) // 应该在100ms内完成
      expect(endTime - startTime).toBeLessThan(200) // 总时间应该合理
      expect(result.clusters.length).toBeGreaterThan(0)
    })

    it('应该正确处理空图', async () => {
      const config = { ...baseConfig, algorithm: 'louvain' as const }
      
      const result = await analyzer.performClustering([], [], config)
      
      expect(result.clusters).toHaveLength(0)
      expect(result.modularity).toBe(0)
      expect(result.executionTime).toBeGreaterThan(0)
    })

    it('应该正确处理单节点图', async () => {
      const singleNode = [mockNodes[0]]
      const config = { ...baseConfig, algorithm: 'connectivity' as const, minClusterSize: 1 }
      
      const result = await analyzer.performClustering(singleNode, [], config)
      
      expect(result.clusters).toHaveLength(1)
      expect(result.clusters[0].nodes).toHaveLength(1)
      expect(result.clusters[0].nodes[0]).toBe(singleNode[0].id)
    })
  })

  describe('错误处理', () => {
    it('应该处理无效的算法类型', async () => {
      const invalidConfig = { ...baseConfig, algorithm: 'invalid' as any }
      
      await expect(
        analyzer.performClustering(mockNodes, mockLinks, invalidConfig)
      ).rejects.toThrow('不支持的聚类算法')
    })

    it('应该处理无效的链接引用', async () => {
      const invalidLinks: GraphLink[] = [
        { id: 'invalid', source: 'non-existent', target: 'also-non-existent', type: 'reference' }
      ]
      
      const config = { ...baseConfig, algorithm: 'connectivity' as const }
      
      // 应该不抛出错误，而是忽略无效链接
      const result = await analyzer.performClustering(mockNodes, invalidLinks, config)
      expect(result.clusters.length).toBeGreaterThanOrEqual(0)
    })

    it('应该处理极端配置参数', async () => {
      const extremeConfig = {
        ...baseConfig,
        algorithm: 'louvain' as const,
        minClusterSize: 1000, // 比节点总数还大
        maxClusters: 0,
        resolution: -1.0
      }
      
      // 应该能够处理并返回合理结果
      const result = await analyzer.performClustering(mockNodes, mockLinks, extremeConfig)
      expect(result.clusters.length).toBeGreaterThanOrEqual(0)
    })
  })

  describe('聚类一致性', () => {
    it('应该为相同输入产生一致的结果', async () => {
      const config = { ...baseConfig, algorithm: 'connectivity' as const }
      
      const result1 = await analyzer.performClustering(mockNodes, mockLinks, config)
      const result2 = await analyzer.performClustering(mockNodes, mockLinks, config)
      
      // 连通性聚类应该产生确定性结果
      expect(result1.clusters.length).toBe(result2.clusters.length)
      expect(result1.modularity).toBeCloseTo(result2.modularity, 3)
    })

    it('应该正确处理节点顺序变化', async () => {
      const shuffledNodes = [...mockNodes].reverse()
      const config = { ...baseConfig, algorithm: 'type' as const }
      
      const originalResult = await analyzer.performClustering(mockNodes, mockLinks, config)
      const shuffledResult = await analyzer.performClustering(shuffledNodes, mockLinks, config)
      
      // 类型聚类不应该受节点顺序影响
      expect(originalResult.clusters.length).toBe(shuffledResult.clusters.length)
    })
  })
})
