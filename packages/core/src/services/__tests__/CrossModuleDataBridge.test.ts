/**
 * 跨模块数据桥梁测试
 * 测试思维导图与图谱之间的数据同步和关联功能
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EventBus } from '../event-system/EventBus'
import { CrossModuleDataBridge, DataAssociation } from '../CrossModuleDataBridge'
import { MindMapData, MindMapNode } from '@minglog/mindmap'
import { GraphData, GraphNode } from '@minglog/graph'

// 模拟EventBus
const mockEventBus = {
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn()
} as unknown as EventBus

// 测试数据
const mockMindMapData: MindMapData = {
  nodes: [
    {
      id: 'mind1',
      text: '中心主题',
      level: 0,
      children: ['mind2', 'mind3'],
      x: 400,
      y: 300,
      tags: ['主题', '中心']
    },
    {
      id: 'mind2',
      text: '子主题1',
      level: 1,
      children: [],
      parentId: 'mind1',
      x: 300,
      y: 200,
      tags: ['子主题']
    },
    {
      id: 'mind3',
      text: '子主题2',
      level: 1,
      children: [],
      parentId: 'mind1',
      x: 500,
      y: 200,
      tags: ['子主题']
    }
  ],
  links: [
    {
      id: 'link1',
      source: 'mind1',
      target: 'mind2',
      type: 'parent-child'
    },
    {
      id: 'link2',
      source: 'mind1',
      target: 'mind3',
      type: 'parent-child'
    }
  ],
  rootId: 'mind1'
}

const mockGraphData: GraphData = {
  nodes: [
    {
      id: 'graph1',
      title: '知识节点1',
      type: 'note',
      content: '这是一个知识节点',
      tags: ['知识', '节点'],
      x: 100,
      y: 100
    },
    {
      id: 'graph2',
      title: '知识节点2',
      type: 'note',
      content: '这是另一个知识节点',
      tags: ['知识', '关联'],
      x: 200,
      y: 150
    }
  ],
  links: [
    {
      id: 'glink1',
      source: 'graph1',
      target: 'graph2',
      type: 'reference',
      weight: 0.8
    }
  ]
}

describe('CrossModuleDataBridge', () => {
  let dataBridge: CrossModuleDataBridge

  beforeEach(() => {
    vi.clearAllMocks()
    dataBridge = new CrossModuleDataBridge(mockEventBus)
  })

  describe('关联管理', () => {
    it('应该能够创建数据关联', async () => {
      const association = await dataBridge.createAssociation(
        'mindmap',
        'mind1',
        'graph',
        'graph1',
        {
          associationType: 'sync',
          strength: 0.9,
          bidirectional: true,
          metadata: { test: 'data' }
        }
      )

      expect(association.sourceModule).toBe('mindmap')
      expect(association.sourceEntityId).toBe('mind1')
      expect(association.targetModule).toBe('graph')
      expect(association.targetEntityId).toBe('graph1')
      expect(association.associationType).toBe('sync')
      expect(association.strength).toBe(0.9)
      expect(association.bidirectional).toBe(true)
      expect(association.metadata).toEqual({ test: 'data' })

      expect(mockEventBus.emit).toHaveBeenCalledWith(
        'cross-module:association-created',
        expect.objectContaining({ association }),
        'CrossModuleDataBridge'
      )
    })

    it('应该能够获取所有关联', async () => {
      await dataBridge.createAssociation('mindmap', 'mind1', 'graph', 'graph1')
      await dataBridge.createAssociation('mindmap', 'mind2', 'graph', 'graph2')

      const associations = dataBridge.getAllAssociations()
      expect(associations).toHaveLength(2)
    })

    it('应该能够根据模块获取关联', async () => {
      await dataBridge.createAssociation('mindmap', 'mind1', 'graph', 'graph1')
      await dataBridge.createAssociation('graph', 'graph1', 'mindmap', 'mind2')

      const mindMapAssociations = dataBridge.getAssociationsByModule('mindmap')
      const graphAssociations = dataBridge.getAssociationsByModule('graph')

      expect(mindMapAssociations).toHaveLength(2)
      expect(graphAssociations).toHaveLength(2)
    })

    it('应该能够删除关联', async () => {
      const association = await dataBridge.createAssociation('mindmap', 'mind1', 'graph', 'graph1')
      
      const deleteResult = await dataBridge.deleteAssociation(association.id)
      expect(deleteResult).toBe(true)

      const associations = dataBridge.getAllAssociations()
      expect(associations).toHaveLength(0)

      expect(mockEventBus.emit).toHaveBeenCalledWith(
        'cross-module:association-deleted',
        expect.objectContaining({ associationId: association.id }),
        'CrossModuleDataBridge'
      )
    })

    it('应该在删除不存在的关联时返回false', async () => {
      const result = await dataBridge.deleteAssociation('non-existent')
      expect(result).toBe(false)
    })
  })

  describe('数据同步', () => {
    it('应该能够将思维导图同步到图谱', async () => {
      const graphData = await dataBridge.syncMindMapToGraph(mockMindMapData)

      expect(graphData.nodes).toHaveLength(3)
      expect(graphData.links).toHaveLength(2)

      // 验证节点转换
      const rootNode = graphData.nodes.find(n => n.id === 'mind1')
      expect(rootNode).toBeDefined()
      expect(rootNode?.title).toBe('中心主题')
      expect(rootNode?.type).toBe('note')
      expect(rootNode?.tags).toEqual(['主题', '中心'])

      // 验证连接转换
      const link = graphData.links.find(l => l.id === 'link1')
      expect(link).toBeDefined()
      expect(link?.type).toBe('reference')
      expect(link?.weight).toBe(0.8)

      expect(mockEventBus.emit).toHaveBeenCalledWith(
        'cross-module:mindmap-to-graph-synced',
        expect.objectContaining({ mindMapData: mockMindMapData, graphData }),
        'CrossModuleDataBridge'
      )
    })

    it('应该能够将图谱同步到思维导图', async () => {
      const mindMapData = await dataBridge.syncGraphToMindMap(mockGraphData)

      expect(mindMapData.nodes).toHaveLength(2)
      expect(mindMapData.links).toHaveLength(1)

      // 验证节点转换
      const node = mindMapData.nodes.find(n => n.id === 'graph1')
      expect(node).toBeDefined()
      expect(node?.text).toBe('知识节点1')
      expect(node?.tags).toEqual(['知识', '节点'])

      // 验证连接转换
      const link = mindMapData.links.find(l => l.id === 'glink1')
      expect(link).toBeDefined()
      expect(link?.type).toBe('parent-child')

      expect(mockEventBus.emit).toHaveBeenCalledWith(
        'cross-module:graph-to-mindmap-synced',
        expect.objectContaining({ graphData: mockGraphData, mindMapData }),
        'CrossModuleDataBridge'
      )
    })

    it('应该能够执行双向同步', async () => {
      const result = await dataBridge.performBidirectionalSync(mockMindMapData, mockGraphData)

      expect(result.mindMapData).toBeDefined()
      expect(result.graphData).toBeDefined()

      expect(mockEventBus.emit).toHaveBeenCalledWith(
        'cross-module:bidirectional-sync-completed',
        expect.objectContaining({
          mindMapData: result.mindMapData,
          graphData: result.graphData
        }),
        'CrossModuleDataBridge'
      )
    })

    it('应该防止并发同步', async () => {
      // 启动第一个同步
      const sync1Promise = dataBridge.performBidirectionalSync(mockMindMapData, mockGraphData)
      
      // 尝试启动第二个同步
      await expect(
        dataBridge.performBidirectionalSync(mockMindMapData, mockGraphData)
      ).rejects.toThrow('同步正在进行中，请稍后再试')

      // 等待第一个同步完成
      await sync1Promise
    })
  })

  describe('数据转换', () => {
    it('应该正确计算节点大小', () => {
      const mindMapNode: MindMapNode = {
        id: 'test',
        text: '测试节点',
        level: 1,
        children: ['child1', 'child2', 'child3']
      }

      // 通过同步测试节点大小计算
      const graphData = dataBridge.syncMindMapToGraph({
        nodes: [mindMapNode],
        links: [],
        rootId: 'test'
      })

      const convertedNode = graphData.nodes[0]
      expect(convertedNode.size).toBeGreaterThan(1) // 应该根据层级和子节点数量计算
    })

    it('应该正确识别根节点', () => {
      const graphData: GraphData = {
        nodes: [
          { id: 'root', title: '根节点', type: 'note' },
          { id: 'child1', title: '子节点1', type: 'note' },
          { id: 'child2', title: '子节点2', type: 'note' }
        ],
        links: [
          { id: 'link1', source: 'root', target: 'child1', type: 'reference' },
          { id: 'link2', source: 'root', target: 'child2', type: 'reference' }
        ]
      }

      const mindMapData = dataBridge.syncGraphToMindMap(graphData)
      expect(mindMapData.rootId).toBe('root')
    })

    it('应该正确计算节点层级', () => {
      const graphData: GraphData = {
        nodes: [
          { id: 'root', title: '根节点', type: 'note' },
          { id: 'level1', title: '一级节点', type: 'note' },
          { id: 'level2', title: '二级节点', type: 'note' }
        ],
        links: [
          { id: 'link1', source: 'root', target: 'level1', type: 'reference' },
          { id: 'link2', source: 'level1', target: 'level2', type: 'reference' }
        ]
      }

      const mindMapData = dataBridge.syncGraphToMindMap(graphData)
      
      const rootNode = mindMapData.nodes.find(n => n.id === 'root')
      const level1Node = mindMapData.nodes.find(n => n.id === 'level1')
      const level2Node = mindMapData.nodes.find(n => n.id === 'level2')

      expect(rootNode?.level).toBe(0)
      expect(level1Node?.level).toBe(1)
      expect(level2Node?.level).toBe(2)
    })
  })

  describe('事件处理', () => {
    it('应该监听思维导图更新事件', () => {
      expect(mockEventBus.on).toHaveBeenCalledWith(
        'mindmap:updated',
        expect.any(Function)
      )
    })

    it('应该监听图谱更新事件', () => {
      expect(mockEventBus.on).toHaveBeenCalledWith(
        'graph:updated',
        expect.any(Function)
      )
    })

    it('应该监听链接变更事件', () => {
      expect(mockEventBus.on).toHaveBeenCalledWith(
        'bidirectional-link:created',
        expect.any(Function)
      )
    })

    it('应该处理节点添加事件', () => {
      const eventHandlers = (mockEventBus.on as any).mock.calls
      const nodeAddedHandler = eventHandlers.find(
        call => call[0] === 'mindmap:node:added'
      )?.[1]

      expect(nodeAddedHandler).toBeDefined()
    })
  })

  describe('配置管理', () => {
    it('应该使用默认配置', () => {
      const bridge = new CrossModuleDataBridge(mockEventBus)
      // 配置应该被正确初始化
      expect(bridge).toBeDefined()
    })

    it('应该接受自定义配置', () => {
      const customConfig = {
        autoSync: false,
        syncInterval: 10000,
        conflictResolution: 'source-wins' as const
      }

      const bridge = new CrossModuleDataBridge(mockEventBus, customConfig)
      expect(bridge).toBeDefined()
    })
  })

  describe('错误处理', () => {
    it('应该处理空数据同步', async () => {
      const emptyMindMapData: MindMapData = {
        nodes: [],
        links: [],
        rootId: ''
      }

      const emptyGraphData: GraphData = {
        nodes: [],
        links: []
      }

      const result = await dataBridge.performBidirectionalSync(emptyMindMapData, emptyGraphData)
      
      expect(result.mindMapData.nodes).toHaveLength(0)
      expect(result.graphData.nodes).toHaveLength(0)
    })

    it('应该处理无效的关联创建', async () => {
      // 测试相同模块和实体的关联
      await expect(
        dataBridge.createAssociation('mindmap', 'same-id', 'mindmap', 'same-id')
      ).resolves.toBeDefined() // 应该允许，但可能有特殊处理
    })
  })

  describe('性能测试', () => {
    it('应该能够处理大量数据的同步', async () => {
      // 创建大量测试数据
      const largeMindMapData: MindMapData = {
        nodes: Array.from({ length: 100 }, (_, i) => ({
          id: `mind${i}`,
          text: `节点${i}`,
          level: i % 5,
          children: []
        })),
        links: Array.from({ length: 99 }, (_, i) => ({
          id: `link${i}`,
          source: `mind${i}`,
          target: `mind${i + 1}`,
          type: 'parent-child'
        })),
        rootId: 'mind0'
      }

      const startTime = performance.now()
      const result = await dataBridge.syncMindMapToGraph(largeMindMapData)
      const endTime = performance.now()

      expect(result.nodes).toHaveLength(100)
      expect(result.links).toHaveLength(99)
      expect(endTime - startTime).toBeLessThan(100) // 应该在100ms内完成
    })
  })
})
