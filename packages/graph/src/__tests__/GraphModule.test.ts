/**
 * 图谱可视化模块测试
 * 测试图谱的数据关联、可视化和性能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GraphModule, GraphService } from '../GraphModule'
import { GraphData, GraphNode, GraphLink, LayoutConfig } from '../types'

// 模拟核心API
const mockCoreAPI = {
  database: {
    execute: vi.fn(),
    query: vi.fn()
  },
  events: {
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn()
  }
}

describe('GraphModule', () => {
  let graphModule: GraphModule

  beforeEach(() => {
    vi.clearAllMocks()
    graphModule = new GraphModule({
      enabled: true,
      settings: {
        defaultLayout: 'force',
        enableClustering: true,
        maxNodes: 5000,
        performanceMode: false
      },
      preferences: {
        theme: 'default',
        showLabels: true,
        enablePhysics: true
      }
    })
  })

  describe('模块生命周期', () => {
    it('应该正确初始化模块', async () => {
      expect(graphModule.status).toBe('uninitialized')
      
      await graphModule.initialize(mockCoreAPI)
      
      expect(graphModule.status).toBe('initialized')
      expect(graphModule.metadata.id).toBe('graph')
      expect(graphModule.metadata.name).toBe('图谱可视化')
    })

    it('应该正确激活模块', async () => {
      await graphModule.initialize(mockCoreAPI)
      await graphModule.activate()
      
      expect(graphModule.status).toBe('active')
      expect(mockCoreAPI.events.on).toHaveBeenCalledWith('notes:page:created', expect.any(Function))
      expect(mockCoreAPI.events.on).toHaveBeenCalledWith('tasks:task:created', expect.any(Function))
    })

    it('应该正确停用模块', async () => {
      await graphModule.initialize(mockCoreAPI)
      await graphModule.activate()
      await graphModule.deactivate()
      
      expect(graphModule.status).toBe('inactive')
      expect(mockCoreAPI.events.off).toHaveBeenCalledWith('notes:page:created', expect.any(Function))
      expect(mockCoreAPI.events.off).toHaveBeenCalledWith('tasks:task:created', expect.any(Function))
    })

    it('应该能够获取图谱服务', async () => {
      await graphModule.initialize(mockCoreAPI)
      
      const service = graphModule.getGraphService()
      expect(service).toBeInstanceOf(GraphService)
    })

    it('应该在未初始化时抛出错误', () => {
      expect(() => graphModule.getGraphService()).toThrow('Graph service not initialized')
    })
  })

  describe('健康状态检查', () => {
    it('应该返回正确的健康状态', async () => {
      await graphModule.initialize(mockCoreAPI)
      await graphModule.activate()
      
      const health = await graphModule.getHealthStatus()
      
      expect(health.status).toBe('healthy')
      expect(health.details?.serviceInitialized).toBe(true)
      expect(health.details?.moduleVersion).toBe('1.0.0')
    })

    it('应该在服务未初始化时返回错误状态', async () => {
      const health = await graphModule.getHealthStatus()
      
      expect(health.status).toBe('error')
      expect(health.message).toBe('图谱服务未初始化')
    })
  })
})

describe('GraphService', () => {
  let graphService: GraphService

  beforeEach(() => {
    vi.clearAllMocks()
    graphService = new GraphService(mockCoreAPI)
  })

  describe('图谱管理', () => {
    it('应该成功创建图谱', async () => {
      const title = '知识图谱'
      const description = '这是一个测试图谱'
      
      const graph = await graphService.createGraph(title, description)
      
      expect(graph).toBeDefined()
      expect(graph.nodes).toHaveLength(0)
      expect(graph.links).toHaveLength(0)
      
      expect(mockCoreAPI.events.emit).toHaveBeenCalledWith('graph:created', {
        id: expect.any(String),
        data: graph,
        title,
        description
      })
    })

    it('应该能够获取图谱', async () => {
      const graph = await graphService.createGraph('测试图谱')
      const graphId = 'test-graph-id'
      
      // 模拟存储
      await graphService.updateGraph(graphId, graph)
      
      const retrieved = await graphService.getGraph(graphId)
      expect(retrieved).toBeDefined()
    })

    it('应该在图谱不存在时返回null', async () => {
      const result = await graphService.getGraph('non-existent-id')
      expect(result).toBeNull()
    })

    it('应该能够更新图谱', async () => {
      const graph = await graphService.createGraph('原始图谱')
      const graphId = 'test-graph-id'
      
      const newNode: GraphNode = {
        id: 'node1',
        title: '新节点',
        type: 'note',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      const updated = await graphService.updateGraph(graphId, {
        ...graph,
        nodes: [newNode]
      })
      
      expect(updated.nodes).toHaveLength(1)
      expect(updated.nodes[0].title).toBe('新节点')
      expect(mockCoreAPI.events.emit).toHaveBeenCalledWith('graph:updated', {
        id: graphId,
        data: updated
      })
    })

    it('应该能够删除图谱', async () => {
      const graph = await graphService.createGraph('要删除的图谱')
      const graphId = 'test-graph-id'
      
      const deleted = await graphService.deleteGraph(graphId)
      
      expect(deleted).toBe(true)
      expect(mockCoreAPI.events.emit).toHaveBeenCalledWith('graph:deleted', {
        id: graphId
      })
    })
  })

  describe('节点操作', () => {
    let testGraph: GraphData
    let graphId: string

    beforeEach(async () => {
      testGraph = await graphService.createGraph('测试图谱')
      graphId = 'test-graph-id'
    })

    it('应该能够添加节点', async () => {
      const nodeData = {
        title: '新节点',
        type: 'note' as const,
        content: '节点内容',
        tags: ['标签1', '标签2']
      }
      
      const newNode = await graphService.addNode(graphId, nodeData)
      
      expect(newNode).toBeDefined()
      expect(newNode.id).toBeDefined()
      expect(newNode.title).toBe(nodeData.title)
      expect(newNode.type).toBe(nodeData.type)
      expect(newNode.content).toBe(nodeData.content)
      expect(newNode.tags).toEqual(nodeData.tags)
      expect(newNode.createdAt).toBeDefined()
      expect(newNode.updatedAt).toBeDefined()
      
      expect(mockCoreAPI.events.emit).toHaveBeenCalledWith('graph:node:added', {
        graphId,
        node: newNode
      })
    })

    it('应该能够更新节点', async () => {
      const node = await graphService.addNode(graphId, {
        title: '原始节点',
        type: 'note'
      })
      
      const updatedNode = await graphService.updateNode(graphId, node.id, {
        title: '更新后的节点',
        content: '新内容'
      })
      
      expect(updatedNode.title).toBe('更新后的节点')
      expect(updatedNode.content).toBe('新内容')
      expect(updatedNode.updatedAt).not.toBe(node.updatedAt)
      
      expect(mockCoreAPI.events.emit).toHaveBeenCalledWith('graph:node:updated', {
        graphId,
        node: updatedNode
      })
    })

    it('应该能够删除节点', async () => {
      const node = await graphService.addNode(graphId, {
        title: '要删除的节点',
        type: 'note'
      })
      
      const deleted = await graphService.deleteNode(graphId, node.id)
      
      expect(deleted).toBe(true)
      expect(mockCoreAPI.events.emit).toHaveBeenCalledWith('graph:node:deleted', {
        graphId,
        nodeId: node.id
      })
    })

    it('应该在节点不存在时返回false', async () => {
      const result = await graphService.deleteNode(graphId, 'non-existent-node')
      expect(result).toBe(false)
    })
  })

  describe('链接操作', () => {
    let testGraph: GraphData
    let graphId: string
    let node1: GraphNode
    let node2: GraphNode

    beforeEach(async () => {
      testGraph = await graphService.createGraph('测试图谱')
      graphId = 'test-graph-id'
      
      node1 = await graphService.addNode(graphId, {
        title: '节点1',
        type: 'note'
      })
      
      node2 = await graphService.addNode(graphId, {
        title: '节点2',
        type: 'note'
      })
    })

    it('应该能够添加链接', async () => {
      const linkData = {
        source: node1.id,
        target: node2.id,
        type: 'reference' as const,
        weight: 1,
        label: '引用关系'
      }
      
      const newLink = await graphService.addLink(graphId, linkData)
      
      expect(newLink).toBeDefined()
      expect(newLink.id).toBeDefined()
      expect(newLink.source).toBe(linkData.source)
      expect(newLink.target).toBe(linkData.target)
      expect(newLink.type).toBe(linkData.type)
      expect(newLink.weight).toBe(linkData.weight)
      expect(newLink.label).toBe(linkData.label)
      
      expect(mockCoreAPI.events.emit).toHaveBeenCalledWith('graph:link:added', {
        graphId,
        link: newLink
      })
    })

    it('应该能够更新链接', async () => {
      const link = await graphService.addLink(graphId, {
        source: node1.id,
        target: node2.id,
        type: 'reference'
      })
      
      const updatedLink = await graphService.updateLink(graphId, link.id, {
        weight: 2,
        label: '强引用'
      })
      
      expect(updatedLink.weight).toBe(2)
      expect(updatedLink.label).toBe('强引用')
      
      expect(mockCoreAPI.events.emit).toHaveBeenCalledWith('graph:link:updated', {
        graphId,
        link: updatedLink
      })
    })

    it('应该能够删除链接', async () => {
      const link = await graphService.addLink(graphId, {
        source: node1.id,
        target: node2.id,
        type: 'reference'
      })
      
      const deleted = await graphService.deleteLink(graphId, link.id)
      
      expect(deleted).toBe(true)
      expect(mockCoreAPI.events.emit).toHaveBeenCalledWith('graph:link:deleted', {
        graphId,
        linkId: link.id
      })
    })
  })

  describe('数据关联', () => {
    let graphId: string
    let node: GraphNode

    beforeEach(async () => {
      const graph = await graphService.createGraph('关联测试')
      graphId = 'test-graph-id'
      
      node = await graphService.addNode(graphId, {
        title: '测试节点',
        type: 'note'
      })
    })

    it('应该能够关联笔记', async () => {
      const noteId = 'note-123'
      
      const linked = await graphService.linkToNote(graphId, node.id, noteId)
      
      expect(linked).toBe(true)
      expect(mockCoreAPI.events.emit).toHaveBeenCalledWith('graph:node:linked:note', {
        graphId,
        nodeId: node.id,
        noteId
      })
    })

    it('应该能够关联任务', async () => {
      const taskId = 'task-456'
      
      const linked = await graphService.linkToTask(graphId, node.id, taskId)
      
      expect(linked).toBe(true)
      expect(mockCoreAPI.events.emit).toHaveBeenCalledWith('graph:node:linked:task', {
        graphId,
        nodeId: node.id,
        taskId
      })
    })

    it('应该能够取消关联笔记', async () => {
      const noteId = 'note-123'
      await graphService.linkToNote(graphId, node.id, noteId)
      
      const unlinked = await graphService.unlinkFromNote(graphId, node.id, noteId)
      
      expect(unlinked).toBe(true)
      expect(mockCoreAPI.events.emit).toHaveBeenCalledWith('graph:node:unlinked:note', {
        graphId,
        nodeId: node.id,
        noteId
      })
    })

    it('应该能够取消关联任务', async () => {
      const taskId = 'task-456'
      await graphService.linkToTask(graphId, node.id, taskId)
      
      const unlinked = await graphService.unlinkFromTask(graphId, node.id, taskId)
      
      expect(unlinked).toBe(true)
      expect(mockCoreAPI.events.emit).toHaveBeenCalledWith('graph:node:unlinked:task', {
        graphId,
        nodeId: node.id,
        taskId
      })
    })
  })

  describe('分析功能', () => {
    let graphId: string
    let testGraph: GraphData

    beforeEach(async () => {
      testGraph = await graphService.createGraph('分析测试')
      graphId = 'analysis-test-graph'
      
      // 创建测试数据
      const node1 = await graphService.addNode(graphId, {
        title: '节点1',
        type: 'note',
        tags: ['标签A', '标签B']
      })
      
      const node2 = await graphService.addNode(graphId, {
        title: '节点2',
        type: 'tag',
        tags: ['标签A']
      })
      
      const node3 = await graphService.addNode(graphId, {
        title: '节点3',
        type: 'note',
        tags: ['标签C']
      })
      
      await graphService.addLink(graphId, {
        source: node1.id,
        target: node2.id,
        type: 'reference'
      })
      
      await graphService.addLink(graphId, {
        source: node2.id,
        target: node3.id,
        type: 'reference'
      })
    })

    it('应该能够计算图谱统计信息', async () => {
      const stats = await graphService.calculateStats(graphId)
      
      expect(stats).toBeDefined()
      expect(stats.nodeCount).toBe(3)
      expect(stats.linkCount).toBe(2)
      expect(stats.avgConnections).toBeGreaterThan(0)
    })

    it('应该能够查找聚类', async () => {
      const clusters = await graphService.findClusters(graphId, 'connectivity')
      
      expect(clusters).toBeDefined()
      expect(Array.isArray(clusters)).toBe(true)
    })

    it('应该能够查找最短路径', async () => {
      const graph = await graphService.getGraph(graphId)
      if (graph && graph.nodes.length >= 2) {
        const sourceId = graph.nodes[0].id
        const targetId = graph.nodes[graph.nodes.length - 1].id
        
        const path = await graphService.findShortestPath(graphId, sourceId, targetId)
        
        expect(path).toBeDefined()
        if (path) {
          expect(path.nodes.length).toBeGreaterThan(0)
          expect(path.links.length).toBeGreaterThanOrEqual(0)
        }
      }
    })
  })

  describe('搜索和过滤', () => {
    let graphId: string

    beforeEach(async () => {
      const graph = await graphService.createGraph('搜索测试')
      graphId = 'search-test-graph'
      
      await graphService.addNode(graphId, {
        title: '重要笔记',
        type: 'note',
        content: '这是重要内容',
        tags: ['重要', '笔记']
      })
      
      await graphService.addNode(graphId, {
        title: '普通标签',
        type: 'tag',
        content: '标签描述',
        tags: ['标签']
      })
      
      await graphService.addNode(graphId, {
        title: '特殊文件',
        type: 'note',
        content: '特殊内容',
        tags: ['特殊', '文件']
      })
    })

    it('应该能够搜索节点', async () => {
      const results = await graphService.searchNodes(graphId, '重要')
      
      expect(results.totalResults).toBe(1)
      expect(results.nodes).toHaveLength(1)
      expect(results.nodes[0].title).toBe('重要笔记')
      expect(results.query).toBe('重要')
    })

    it('应该能够按标签搜索', async () => {
      const results = await graphService.searchNodes(graphId, '标签')
      
      expect(results.totalResults).toBeGreaterThan(0)
      expect(results.nodes.some(node => node.tags?.includes('标签'))).toBe(true)
    })

    it('应该在图谱不存在时返回空结果', async () => {
      const results = await graphService.searchNodes('non-existent', '查询')
      
      expect(results.totalResults).toBe(0)
      expect(results.nodes).toHaveLength(0)
      expect(results.links).toHaveLength(0)
    })
  })

  describe('布局计算', () => {
    it('应该能够计算力导向布局', async () => {
      const graphData: GraphData = {
        nodes: [
          { id: '1', title: '节点1', type: 'note' },
          { id: '2', title: '节点2', type: 'note' },
          { id: '3', title: '节点3', type: 'note' }
        ],
        links: [
          { id: 'l1', source: '1', target: '2', type: 'reference' },
          { id: 'l2', source: '2', target: '3', type: 'reference' }
        ]
      }
      
      const layoutConfig: LayoutConfig = {
        type: 'force',
        linkDistance: 50,
        linkStrength: 0.1,
        forceStrength: -300,
        centerStrength: 0.1
      }
      
      const layoutResult = await graphService.calculateLayout(graphData, layoutConfig)
      
      expect(layoutResult).toBeDefined()
      expect(layoutResult.nodes).toHaveLength(graphData.nodes.length)
      expect(layoutResult.links).toHaveLength(graphData.links.length)
    })

    it('应该在布局计算失败时返回原始数据', async () => {
      const graphData: GraphData = {
        nodes: [],
        links: []
      }
      
      const layoutConfig: LayoutConfig = {
        type: 'invalid' as any
      }
      
      const layoutResult = await graphService.calculateLayout(graphData, layoutConfig)
      
      expect(layoutResult).toEqual(graphData)
    })
  })

  describe('导入导出', () => {
    it('应该能够从笔记导入图谱', async () => {
      const noteIds = ['note1', 'note2', 'note3']
      
      const importedGraph = await graphService.importFromNotes(noteIds)
      
      expect(importedGraph.nodes).toHaveLength(noteIds.length)
      expect(importedGraph.nodes.every(node => node.type === 'note')).toBe(true)
      expect(importedGraph.links.length).toBeGreaterThan(0)
    })

    it('应该能够导出为JSON', async () => {
      const graphData: GraphData = {
        nodes: [{ id: '1', title: '测试节点', type: 'note' }],
        links: []
      }
      
      const exported = await graphService.exportGraph(graphData, { format: 'json' })
      
      expect(typeof exported).toBe('string')
      const parsed = JSON.parse(exported as string)
      expect(parsed.nodes).toHaveLength(1)
      expect(parsed.nodes[0].title).toBe('测试节点')
    })

    it('应该能够导出为CSV', async () => {
      const graphData: GraphData = {
        nodes: [{ id: '1', title: '测试节点', type: 'note' }],
        links: [{ id: 'l1', source: '1', target: '1', type: 'reference' }]
      }
      
      const exported = await graphService.exportGraph(graphData, { format: 'csv' })
      
      expect(typeof exported).toBe('string')
      expect(exported).toContain('# Nodes')
      expect(exported).toContain('# Links')
      expect(exported).toContain('测试节点')
    })

    it('应该在不支持的格式时抛出错误', async () => {
      const graphData: GraphData = { nodes: [], links: [] }
      
      await expect(graphService.exportGraph(graphData, { format: 'unsupported' as any }))
        .rejects.toThrow('Unsupported export format: unsupported')
    })
  })
})
