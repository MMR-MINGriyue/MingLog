/**
 * 双向链接管理器测试
 * 测试链接的创建、管理、分析和建议功能
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EventBus } from '@minglog/core'
import { BidirectionalLinkManager, LinkCreationRequest } from '../BidirectionalLinkManager'
import { GraphData, GraphNode, GraphLink } from '../../types'

// 模拟EventBus
const mockEventBus = {
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn()
} as unknown as EventBus

// 测试数据
const mockNodes: GraphNode[] = [
  {
    id: 'node1',
    title: '测试笔记1',
    type: 'note',
    content: '这是一个关于JavaScript的笔记',
    tags: ['JavaScript', '编程', '前端'],
    x: 100,
    y: 100
  },
  {
    id: 'node2',
    title: 'React组件',
    type: 'note',
    content: '关于React组件的学习笔记',
    tags: ['React', '组件', '前端'],
    x: 200,
    y: 150
  },
  {
    id: 'node3',
    title: '前端标签',
    type: 'tag',
    x: 150,
    y: 200
  },
  {
    id: 'node4',
    title: 'TypeScript',
    type: 'note',
    content: 'TypeScript类型系统学习',
    tags: ['TypeScript', '编程', '类型'],
    x: 300,
    y: 100
  }
]

const mockLinks: GraphLink[] = [
  {
    id: 'link1',
    source: 'node1',
    target: 'node2',
    type: 'reference',
    weight: 0.8
  }
]

const mockGraphData: GraphData = {
  nodes: mockNodes,
  links: mockLinks
}

describe('BidirectionalLinkManager', () => {
  let linkManager: BidirectionalLinkManager

  beforeEach(() => {
    vi.clearAllMocks()
    linkManager = new BidirectionalLinkManager(mockEventBus)
    linkManager.initializeLinks(mockGraphData)
  })

  describe('初始化和基础功能', () => {
    it('应该正确初始化链接数据', () => {
      const allLinks = linkManager.getAllLinks()
      expect(allLinks).toHaveLength(1)
      expect(allLinks[0].id).toBe('link1')
    })

    it('应该正确建立节点连接关系', () => {
      const node1Connections = linkManager.getConnectedNodes('node1')
      const node2Connections = linkManager.getConnectedNodes('node2')
      
      expect(node1Connections).toContain('node2')
      expect(node2Connections).toContain('node1')
    })

    it('应该正确获取节点的链接', () => {
      const node1Links = linkManager.getNodeLinks('node1')
      const node2Links = linkManager.getNodeLinks('node2')
      
      expect(node1Links).toHaveLength(1)
      expect(node2Links).toHaveLength(1)
      expect(node1Links[0].id).toBe('link1')
    })
  })

  describe('链接创建', () => {
    it('应该能够创建新的单向链接', async () => {
      const request: LinkCreationRequest = {
        sourceId: 'node1',
        targetId: 'node3',
        linkType: 'tag',
        strength: 0.6,
        label: '标签关联',
        bidirectional: false
      }

      const link = await linkManager.createLink(request)
      
      expect(link.source).toBe('node1')
      expect(link.target).toBe('node3')
      expect(link.type).toBe('tag')
      expect(link.weight).toBe(0.6)
      expect(link.label).toBe('标签关联')
      
      expect(mockEventBus.emit).toHaveBeenCalledWith('link:created', expect.any(Object))
    })

    it('应该能够创建双向链接', async () => {
      const request: LinkCreationRequest = {
        sourceId: 'node2',
        targetId: 'node4',
        linkType: 'similarity',
        strength: 0.7,
        bidirectional: true
      }

      const link = await linkManager.createLink(request)
      
      expect(link.source).toBe('node2')
      expect(link.target).toBe('node4')
      
      // 检查是否创建了反向链接
      const allLinks = linkManager.getAllLinks()
      const reverseLink = allLinks.find(l => 
        l.source === 'node4' && l.target === 'node2' && l.type === 'similarity'
      )
      
      expect(reverseLink).toBeDefined()
      expect(mockEventBus.emit).toHaveBeenCalledWith('bidirectional-link:created', expect.any(Object))
    })

    it('应该验证链接创建请求', async () => {
      // 测试空的源节点ID
      const invalidRequest1: LinkCreationRequest = {
        sourceId: '',
        targetId: 'node2',
        linkType: 'reference'
      }
      
      await expect(linkManager.createLink(invalidRequest1)).rejects.toThrow('源节点和目标节点ID不能为空')

      // 测试自环链接
      const invalidRequest2: LinkCreationRequest = {
        sourceId: 'node1',
        targetId: 'node1',
        linkType: 'reference'
      }
      
      await expect(linkManager.createLink(invalidRequest2)).rejects.toThrow('不能创建自环链接')

      // 测试无效的强度值
      const invalidRequest3: LinkCreationRequest = {
        sourceId: 'node1',
        targetId: 'node3',
        linkType: 'reference',
        strength: 1.5
      }
      
      await expect(linkManager.createLink(invalidRequest3)).rejects.toThrow('链接强度必须在0-1之间')
    })

    it('应该防止创建重复链接', async () => {
      const request: LinkCreationRequest = {
        sourceId: 'node1',
        targetId: 'node2',
        linkType: 'reference'
      }

      await expect(linkManager.createLink(request)).rejects.toThrow('链接已存在')
    })
  })

  describe('链接更新和删除', () => {
    it('应该能够更新链接属性', async () => {
      const allLinks = linkManager.getAllLinks()
      const linkToUpdate = allLinks[0]
      
      const updatedLink = await linkManager.updateLink({
        linkId: linkToUpdate.id,
        linkType: 'similarity',
        strength: 0.9,
        label: '更新的标签'
      })

      expect(updatedLink.type).toBe('similarity')
      expect(updatedLink.weight).toBe(0.9)
      expect(updatedLink.label).toBe('更新的标签')
      
      expect(mockEventBus.emit).toHaveBeenCalledWith('link:updated', expect.any(Object))
    })

    it('应该能够删除链接', async () => {
      const allLinks = linkManager.getAllLinks()
      const linkToDelete = allLinks[0]
      
      const result = await linkManager.deleteLink(linkToDelete.id)
      
      expect(result).toBe(true)
      expect(linkManager.getAllLinks()).toHaveLength(0)
      expect(mockEventBus.emit).toHaveBeenCalledWith('link:deleted', expect.any(Object))
    })

    it('应该在删除不存在的链接时返回false', async () => {
      const result = await linkManager.deleteLink('non-existent-link')
      expect(result).toBe(false)
    })
  })

  describe('链接查询', () => {
    beforeEach(async () => {
      // 添加更多测试链接
      await linkManager.createLink({
        sourceId: 'node2',
        targetId: 'node3',
        linkType: 'tag',
        strength: 0.5
      })
      
      await linkManager.createLink({
        sourceId: 'node3',
        targetId: 'node4',
        linkType: 'folder',
        strength: 0.7
      })
    })

    it('应该能够获取两个节点间的链接', () => {
      const linksBetween = linkManager.getLinksBetweenNodes('node1', 'node2')
      expect(linksBetween).toHaveLength(1)
      expect(linksBetween[0].type).toBe('reference')
    })

    it('应该能够获取节点的所有连接节点', () => {
      const node3Connections = linkManager.getConnectedNodes('node3')
      expect(node3Connections).toContain('node2')
      expect(node3Connections).toContain('node4')
      expect(node3Connections).toHaveLength(2)
    })
  })

  describe('链接分析', () => {
    beforeEach(async () => {
      // 创建更复杂的链接网络
      await linkManager.createLink({
        sourceId: 'node2',
        targetId: 'node3',
        linkType: 'tag',
        strength: 0.9
      })
      
      await linkManager.createLink({
        sourceId: 'node3',
        targetId: 'node4',
        linkType: 'reference',
        strength: 0.3
      })
      
      // 创建双向链接
      await linkManager.createLink({
        sourceId: 'node1',
        targetId: 'node4',
        linkType: 'similarity',
        bidirectional: true
      })
    })

    it('应该能够分析链接网络', () => {
      const analysis = linkManager.analyzeLinkNetwork(mockGraphData)
      
      expect(analysis.totalLinks).toBeGreaterThan(0)
      expect(analysis.strongestLinks).toBeDefined()
      expect(analysis.weakestLinks).toBeDefined()
      expect(analysis.centralNodes).toBeDefined()
      expect(analysis.isolatedNodes).toBeDefined()
    })

    it('应该正确识别双向链接', () => {
      const analysis = linkManager.analyzeLinkNetwork(mockGraphData)
      expect(analysis.bidirectionalLinks).toBeGreaterThan(0)
    })

    it('应该正确计算节点中心性', () => {
      const analysis = linkManager.analyzeLinkNetwork(mockGraphData)
      
      // node3应该是中心节点（连接最多）
      const centralNodeIds = analysis.centralNodes.map(n => n.id)
      expect(centralNodeIds).toContain('node3')
    })
  })

  describe('链接建议', () => {
    it('应该基于标签相似性提供建议', () => {
      const suggestions = linkManager.getLinkSuggestions('node1', mockGraphData)
      
      // node1和node2都有'前端'标签，应该有建议
      const reactSuggestion = suggestions.find(s => s.targetNode.id === 'node2')
      expect(reactSuggestion).toBeDefined()
      expect(reactSuggestion?.suggestedType).toBe('tag')
      expect(reactSuggestion?.confidence).toBeGreaterThan(0)
    })

    it('应该基于类型相似性提供建议', () => {
      const suggestions = linkManager.getLinkSuggestions('node1', mockGraphData)
      
      // node1和node2、node4都是note类型
      const typeSuggestions = suggestions.filter(s => s.suggestedType === 'similarity')
      expect(typeSuggestions.length).toBeGreaterThan(0)
    })

    it('应该排除已连接的节点', () => {
      const suggestions = linkManager.getLinkSuggestions('node1', mockGraphData)
      
      // node2已经与node1连接，不应该出现在建议中
      const node2Suggestion = suggestions.find(s => s.targetNode.id === 'node2')
      expect(node2Suggestion).toBeUndefined()
    })

    it('应该按置信度排序建议', () => {
      const suggestions = linkManager.getLinkSuggestions('node1', mockGraphData)
      
      for (let i = 1; i < suggestions.length; i++) {
        expect(suggestions[i-1].confidence).toBeGreaterThanOrEqual(suggestions[i].confidence)
      }
    })
  })

  describe('事件处理', () => {
    it('应该处理节点添加事件', () => {
      const newNode: GraphNode = {
        id: 'node5',
        title: '新节点',
        type: 'note',
        x: 400,
        y: 200
      }

      // 模拟节点添加事件
      const eventHandler = (mockEventBus.on as any).mock.calls.find(
        call => call[0] === 'graph:node-added'
      )?.[1]
      
      if (eventHandler) {
        eventHandler({ node: newNode })
      }

      // 验证新节点的连接映射已创建
      const connections = linkManager.getConnectedNodes('node5')
      expect(connections).toEqual([])
    })

    it('应该处理节点删除事件', () => {
      // 模拟节点删除事件
      const eventHandler = (mockEventBus.on as any).mock.calls.find(
        call => call[0] === 'graph:node-removed'
      )?.[1]
      
      if (eventHandler) {
        eventHandler({ nodeId: 'node1' })
      }

      // 验证相关链接已删除
      const node1Links = linkManager.getNodeLinks('node1')
      expect(node1Links).toHaveLength(0)
    })
  })
})
