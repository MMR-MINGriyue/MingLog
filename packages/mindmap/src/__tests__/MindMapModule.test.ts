/**
 * 思维导图模块测试
 * 测试思维导图的创建、编辑、布局和性能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { MindMapModule, MindMapService } from '../MindMapModule'
import { MindMapData, MindMapNode, LayoutConfig } from '../types'

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

describe('MindMapModule', () => {
  let mindMapModule: MindMapModule

  beforeEach(() => {
    vi.clearAllMocks()
    mindMapModule = new MindMapModule({
      enabled: true,
      settings: {
        defaultLayout: 'tree',
        enableAnimation: true,
        maxNodes: 1000
      },
      preferences: {
        theme: 'default',
        autoSave: true
      }
    })
  })

  describe('模块生命周期', () => {
    it('应该正确初始化模块', async () => {
      expect(mindMapModule.status).toBe('uninitialized')
      
      await mindMapModule.initialize(mockCoreAPI)
      
      expect(mindMapModule.status).toBe('initialized')
      expect(mindMapModule.metadata.id).toBe('mindmap')
      expect(mindMapModule.metadata.name).toBe('思维导图')
    })

    it('应该正确激活模块', async () => {
      await mindMapModule.initialize(mockCoreAPI)
      await mindMapModule.activate()
      
      expect(mindMapModule.status).toBe('active')
      expect(mockCoreAPI.events.on).toHaveBeenCalledWith('notes:block:created', expect.any(Function))
      expect(mockCoreAPI.events.on).toHaveBeenCalledWith('notes:block:updated', expect.any(Function))
    })

    it('应该正确停用模块', async () => {
      await mindMapModule.initialize(mockCoreAPI)
      await mindMapModule.activate()
      await mindMapModule.deactivate()
      
      expect(mindMapModule.status).toBe('inactive')
      expect(mockCoreAPI.events.off).toHaveBeenCalledWith('notes:block:created', expect.any(Function))
      expect(mockCoreAPI.events.off).toHaveBeenCalledWith('notes:block:updated', expect.any(Function))
    })

    it('应该能够获取思维导图服务', async () => {
      await mindMapModule.initialize(mockCoreAPI)
      
      const service = mindMapModule.getMindMapService()
      expect(service).toBeInstanceOf(MindMapService)
    })

    it('应该在未初始化时抛出错误', () => {
      expect(() => mindMapModule.getMindMapService()).toThrow('MindMap service not initialized')
    })
  })

  describe('健康状态检查', () => {
    it('应该返回正确的健康状态', async () => {
      await mindMapModule.initialize(mockCoreAPI)
      await mindMapModule.activate()
      
      const health = await mindMapModule.getHealthStatus()
      
      expect(health.status).toBe('healthy')
      expect(health.details?.serviceInitialized).toBe(true)
      expect(health.details?.moduleVersion).toBe('1.0.0')
    })

    it('应该在服务未初始化时返回错误状态', async () => {
      const health = await mindMapModule.getHealthStatus()
      
      expect(health.status).toBe('error')
      expect(health.message).toBe('思维导图服务未初始化')
    })
  })
})

describe('MindMapService', () => {
  let mindMapService: MindMapService

  beforeEach(() => {
    vi.clearAllMocks()
    mindMapService = new MindMapService(mockCoreAPI)
  })

  describe('思维导图管理', () => {
    it('应该成功创建思维导图', async () => {
      const title = '我的思维导图'
      const description = '这是一个测试思维导图'
      
      const mindMap = await mindMapService.createMindMap(title, description)
      
      expect(mindMap).toBeDefined()
      expect(mindMap.metadata?.title).toBe(title)
      expect(mindMap.metadata?.description).toBe(description)
      expect(mindMap.nodes).toHaveLength(1)
      expect(mindMap.links).toHaveLength(0)
      expect(mindMap.rootId).toBeDefined()
      
      const rootNode = mindMap.nodes[0]
      expect(rootNode.text).toBe(title)
      expect(rootNode.level).toBe(0)
      expect(rootNode.children).toHaveLength(0)
      expect(rootNode.style).toBeDefined()
      expect(rootNode.metadata?.createdAt).toBeInstanceOf(Date)
      
      expect(mockCoreAPI.events.emit).toHaveBeenCalledWith('mindmap:created', {
        id: expect.any(String),
        data: mindMap
      })
    })

    it('应该能够获取思维导图', async () => {
      const mindMap = await mindMapService.createMindMap('测试导图')
      const mapId = 'test-map-id'
      
      // 模拟存储
      await mindMapService.updateMindMap(mapId, mindMap)
      
      const retrieved = await mindMapService.getMindMap(mapId)
      expect(retrieved).toBeDefined()
      expect(retrieved?.metadata?.title).toBe('测试导图')
    })

    it('应该在思维导图不存在时返回null', async () => {
      const result = await mindMapService.getMindMap('non-existent-id')
      expect(result).toBeNull()
    })

    it('应该能够更新思维导图', async () => {
      const mindMap = await mindMapService.createMindMap('原始标题')
      const mapId = 'test-map-id'
      
      const updated = await mindMapService.updateMindMap(mapId, {
        ...mindMap,
        metadata: {
          ...mindMap.metadata,
          title: '更新后的标题'
        }
      })
      
      expect(updated.metadata?.title).toBe('更新后的标题')
      expect(updated.metadata?.updatedAt).toBeInstanceOf(Date)
      expect(mockCoreAPI.events.emit).toHaveBeenCalledWith('mindmap:updated', {
        id: mapId,
        data: updated
      })
    })

    it('应该能够删除思维导图', async () => {
      const mindMap = await mindMapService.createMindMap('要删除的导图')
      const mapId = 'test-map-id'
      
      const deleted = await mindMapService.deleteMindMap(mapId)
      
      expect(deleted).toBe(true)
      expect(mockCoreAPI.events.emit).toHaveBeenCalledWith('mindmap:deleted', {
        id: mapId
      })
    })
  })

  describe('节点操作', () => {
    let testMindMap: MindMapData
    let mapId: string

    beforeEach(async () => {
      testMindMap = await mindMapService.createMindMap('测试导图')
      mapId = 'test-map-id'
    })

    it('应该能够添加节点', async () => {
      const parentId = testMindMap.rootId
      const nodeText = '新节点'
      
      const newNode = await mindMapService.addNode(mapId, parentId, nodeText)
      
      expect(newNode).toBeDefined()
      expect(newNode.text).toBe(nodeText)
      expect(newNode.parentId).toBe(parentId)
      expect(newNode.level).toBe(1)
      expect(newNode.style).toBeDefined()
      expect(newNode.metadata?.createdAt).toBeInstanceOf(Date)
      
      expect(mockCoreAPI.events.emit).toHaveBeenCalledWith('mindmap:node:added', {
        mapId,
        node: newNode,
        parentId
      })
    })

    it('应该能够更新节点', async () => {
      const parentId = testMindMap.rootId
      const node = await mindMapService.addNode(mapId, parentId, '原始文本')
      
      const updatedNode = await mindMapService.updateNode(mapId, node.id, {
        text: '更新后的文本',
        style: {
          ...node.style,
          backgroundColor: '#FF0000'
        }
      })
      
      expect(updatedNode.text).toBe('更新后的文本')
      expect(updatedNode.style?.backgroundColor).toBe('#FF0000')
      expect(updatedNode.metadata?.updatedAt).toBeInstanceOf(Date)
      
      expect(mockCoreAPI.events.emit).toHaveBeenCalledWith('mindmap:node:updated', {
        mapId,
        node: updatedNode
      })
    })

    it('应该能够删除节点', async () => {
      const parentId = testMindMap.rootId
      const node = await mindMapService.addNode(mapId, parentId, '要删除的节点')
      
      const deleted = await mindMapService.deleteNode(mapId, node.id)
      
      expect(deleted).toBe(true)
      expect(mockCoreAPI.events.emit).toHaveBeenCalledWith('mindmap:node:deleted', {
        mapId,
        nodeId: node.id
      })
    })

    it('应该不能删除根节点', async () => {
      await expect(mindMapService.deleteNode(mapId, testMindMap.rootId))
        .rejects.toThrow('Cannot delete root node')
    })

    it('应该能够移动节点', async () => {
      const rootId = testMindMap.rootId
      const node1 = await mindMapService.addNode(mapId, rootId, '节点1')
      const node2 = await mindMapService.addNode(mapId, rootId, '节点2')
      
      const moved = await mindMapService.moveNode(mapId, node1.id, node2.id)
      
      expect(moved).toBe(true)
      expect(mockCoreAPI.events.emit).toHaveBeenCalledWith('mindmap:node:moved', {
        mapId,
        nodeId: node1.id,
        oldParentId: node1.parentId,
        newParentId: node2.id
      })
    })

    it('应该不能移动根节点', async () => {
      const node = await mindMapService.addNode(mapId, testMindMap.rootId, '节点')
      
      await expect(mindMapService.moveNode(mapId, testMindMap.rootId, node.id))
        .rejects.toThrow('Cannot move root node')
    })

    it('应该不能移动节点到其子节点', async () => {
      const rootId = testMindMap.rootId
      const parent = await mindMapService.addNode(mapId, rootId, '父节点')
      const child = await mindMapService.addNode(mapId, parent.id, '子节点')
      
      await expect(mindMapService.moveNode(mapId, parent.id, child.id))
        .rejects.toThrow('Cannot move node to its descendant')
    })
  })

  describe('布局计算', () => {
    it('应该能够计算树形布局', async () => {
      const mindMap = await mindMapService.createMindMap('布局测试')
      const layoutConfig: LayoutConfig = {
        type: 'tree',
        nodeSpacing: 120,
        levelSpacing: 200
      }
      
      const layoutResult = await mindMapService.calculateLayout(mindMap, layoutConfig)
      
      expect(layoutResult).toBeDefined()
      expect(layoutResult.nodes).toHaveLength(mindMap.nodes.length)
      expect(layoutResult.nodes[0].x).toBeDefined()
      expect(layoutResult.nodes[0].y).toBeDefined()
    })

    it('应该能够计算径向布局', async () => {
      const mindMap = await mindMapService.createMindMap('径向布局测试')
      const layoutConfig: LayoutConfig = {
        type: 'radial',
        radius: 200,
        angleStep: 60
      }
      
      const layoutResult = await mindMapService.calculateLayout(mindMap, layoutConfig)
      
      expect(layoutResult).toBeDefined()
      expect(layoutResult.nodes[0].x).toBeDefined()
      expect(layoutResult.nodes[0].y).toBeDefined()
    })
  })

  describe('搜索和过滤', () => {
    let testMindMap: MindMapData
    let mapId: string

    beforeEach(async () => {
      testMindMap = await mindMapService.createMindMap('搜索测试')
      mapId = 'search-test-map'
      
      // 添加一些测试节点
      await mindMapService.addNode(mapId, testMindMap.rootId, '重要节点')
      await mindMapService.addNode(mapId, testMindMap.rootId, '普通节点')
      await mindMapService.addNode(mapId, testMindMap.rootId, '特殊节点')
    })

    it('应该能够搜索节点', async () => {
      const results = await mindMapService.searchNodes(mapId, '重要')
      
      expect(results).toHaveLength(1)
      expect(results[0].text).toBe('重要节点')
    })

    it('应该能够过滤节点', async () => {
      const results = await mindMapService.filterNodes(mapId, (node) => 
        node.text.includes('节点') && node.level > 0
      )
      
      expect(results).toHaveLength(3)
      expect(results.every(node => node.level > 0)).toBe(true)
    })

    it('应该在思维导图不存在时返回空数组', async () => {
      const searchResults = await mindMapService.searchNodes('non-existent', '查询')
      const filterResults = await mindMapService.filterNodes('non-existent', () => true)
      
      expect(searchResults).toHaveLength(0)
      expect(filterResults).toHaveLength(0)
    })
  })

  describe('导入导出', () => {
    it('应该能够从大纲导入', async () => {
      const blocks = [
        { id: '1', content: '主题', level: 1 },
        { id: '2', content: '子主题1', level: 2 },
        { id: '3', content: '子主题2', level: 2 }
      ]
      
      const mindMap = await mindMapService.importFromOutline(blocks)
      
      expect(mindMap).toBeDefined()
      expect(mindMap.nodes.length).toBeGreaterThan(0)
    })

    it('应该能够导出为JSON', async () => {
      const mindMap = await mindMapService.createMindMap('导出测试')
      
      const exported = await mindMapService.exportMindMap(mindMap, { format: 'json' })
      
      expect(typeof exported).toBe('string')
      const parsed = JSON.parse(exported as string)
      expect(parsed.metadata?.title).toBe('导出测试')
    })

    it('应该能够导出为PNG', async () => {
      const mindMap = await mindMapService.createMindMap('PNG导出测试')
      
      const exported = await mindMapService.exportMindMap(mindMap, { 
        format: 'png',
        width: 800,
        height: 600
      })
      
      expect(exported).toBeInstanceOf(Blob)
    })

    it('应该在不支持的格式时抛出错误', async () => {
      const mindMap = await mindMapService.createMindMap('错误测试')
      
      await expect(mindMapService.exportMindMap(mindMap, { format: 'unsupported' as any }))
        .rejects.toThrow('Unsupported export format: unsupported')
    })
  })
})
