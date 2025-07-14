/**
 * 数据关联服务测试
 * 测试跨模块数据关联功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DataAssociationService, AssociationType, EntityType } from '../services/DataAssociationService'

// 模拟核心API
const mockCoreAPI = {
  events: {
    emit: vi.fn()
  }
}

describe('DataAssociationService', () => {
  let dataAssociationService: DataAssociationService

  beforeEach(() => {
    vi.clearAllMocks()
    dataAssociationService = new DataAssociationService(mockCoreAPI)
  })

  describe('关联管理', () => {
    it('应该成功创建关联', async () => {
      const association = await dataAssociationService.createAssociation(
        EntityType.NOTE,
        'note-1',
        EntityType.TASK,
        'task-1',
        AssociationType.REFERENCE,
        0.8,
        { description: '笔记引用任务' }
      )

      expect(association).toBeDefined()
      expect(association.id).toBeDefined()
      expect(association.sourceType).toBe(EntityType.NOTE)
      expect(association.sourceId).toBe('note-1')
      expect(association.targetType).toBe(EntityType.TASK)
      expect(association.targetId).toBe('task-1')
      expect(association.associationType).toBe(AssociationType.REFERENCE)
      expect(association.strength).toBe(0.8)
      expect(association.metadata?.description).toBe('笔记引用任务')
      expect(association.createdAt).toBeInstanceOf(Date)
      expect(association.updatedAt).toBeInstanceOf(Date)

      expect(mockCoreAPI.events.emit).toHaveBeenCalledWith('data:association:created', association)
    })

    it('应该验证关联强度范围', async () => {
      await expect(dataAssociationService.createAssociation(
        EntityType.NOTE,
        'note-1',
        EntityType.TASK,
        'task-1',
        AssociationType.REFERENCE,
        1.5 // 超出范围
      )).rejects.toThrow('关联强度必须在0-1之间')

      await expect(dataAssociationService.createAssociation(
        EntityType.NOTE,
        'note-1',
        EntityType.TASK,
        'task-1',
        AssociationType.REFERENCE,
        -0.1 // 超出范围
      )).rejects.toThrow('关联强度必须在0-1之间')
    })

    it('应该防止重复关联', async () => {
      await dataAssociationService.createAssociation(
        EntityType.NOTE,
        'note-1',
        EntityType.TASK,
        'task-1',
        AssociationType.REFERENCE
      )

      await expect(dataAssociationService.createAssociation(
        EntityType.NOTE,
        'note-1',
        EntityType.TASK,
        'task-1',
        AssociationType.REFERENCE
      )).rejects.toThrow('关联已存在')
    })

    it('应该能够获取关联', async () => {
      const created = await dataAssociationService.createAssociation(
        EntityType.NOTE,
        'note-1',
        EntityType.TASK,
        'task-1',
        AssociationType.REFERENCE
      )

      const retrieved = await dataAssociationService.getAssociation(created.id)
      expect(retrieved).toEqual(created)
    })

    it('应该在关联不存在时返回null', async () => {
      const result = await dataAssociationService.getAssociation('non-existent')
      expect(result).toBeNull()
    })

    it('应该能够更新关联', async () => {
      const created = await dataAssociationService.createAssociation(
        EntityType.NOTE,
        'note-1',
        EntityType.TASK,
        'task-1',
        AssociationType.REFERENCE,
        0.5
      )

      // 等待一毫秒确保时间戳不同
      await new Promise(resolve => setTimeout(resolve, 1))

      const updated = await dataAssociationService.updateAssociation(created.id, {
        strength: 0.9,
        metadata: { updated: true }
      })

      expect(updated.strength).toBe(0.9)
      expect(updated.metadata?.updated).toBe(true)
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(created.updatedAt.getTime())

      expect(mockCoreAPI.events.emit).toHaveBeenCalledWith('data:association:updated', {
        previous: created,
        current: updated
      })
    })

    it('应该在更新不存在的关联时抛出错误', async () => {
      await expect(dataAssociationService.updateAssociation('non-existent', {
        strength: 0.9
      })).rejects.toThrow('关联记录 non-existent 不存在')
    })

    it('应该能够删除关联', async () => {
      const created = await dataAssociationService.createAssociation(
        EntityType.NOTE,
        'note-1',
        EntityType.TASK,
        'task-1',
        AssociationType.REFERENCE
      )

      const deleted = await dataAssociationService.deleteAssociation(created.id)
      expect(deleted).toBe(true)

      const retrieved = await dataAssociationService.getAssociation(created.id)
      expect(retrieved).toBeNull()

      expect(mockCoreAPI.events.emit).toHaveBeenCalledWith('data:association:deleted', created)
    })

    it('应该在删除不存在的关联时返回false', async () => {
      const result = await dataAssociationService.deleteAssociation('non-existent')
      expect(result).toBe(false)
    })
  })

  describe('关联查询', () => {
    beforeEach(async () => {
      // 创建测试数据
      await dataAssociationService.createAssociation(
        EntityType.NOTE,
        'note-1',
        EntityType.TASK,
        'task-1',
        AssociationType.REFERENCE,
        0.8
      )

      await dataAssociationService.createAssociation(
        EntityType.NOTE,
        'note-1',
        EntityType.MINDMAP_NODE,
        'mindmap-1',
        AssociationType.SEMANTIC,
        0.6
      )

      await dataAssociationService.createAssociation(
        EntityType.TASK,
        'task-1',
        EntityType.GRAPH_NODE,
        'graph-1',
        AssociationType.DEPENDENCY,
        0.9
      )
    })

    it('应该能够查询实体的所有关联', async () => {
      const associations = await dataAssociationService.getEntityAssociations(
        EntityType.NOTE,
        'note-1'
      )

      expect(associations).toHaveLength(2)
      expect(associations.every(a => 
        (a.sourceType === EntityType.NOTE && a.sourceId === 'note-1') ||
        (a.targetType === EntityType.NOTE && a.targetId === 'note-1')
      )).toBe(true)
    })

    it('应该能够按关联类型过滤', async () => {
      const associations = await dataAssociationService.queryAssociations({
        associationType: AssociationType.REFERENCE
      })

      expect(associations).toHaveLength(1)
      expect(associations[0].associationType).toBe(AssociationType.REFERENCE)
    })

    it('应该能够按强度过滤', async () => {
      const associations = await dataAssociationService.queryAssociations({
        minStrength: 0.7
      })

      expect(associations).toHaveLength(2)
      expect(associations.every(a => a.strength >= 0.7)).toBe(true)
    })

    it('应该能够排序和分页', async () => {
      const associations = await dataAssociationService.queryAssociations({
        sortBy: 'strength',
        sortOrder: 'desc',
        limit: 2,
        offset: 0
      })

      expect(associations).toHaveLength(2)
      expect(associations[0].strength).toBeGreaterThanOrEqual(associations[1].strength)
    })

    it('应该能够获取双向关联', async () => {
      const associations = await dataAssociationService.getBidirectionalAssociations(
        EntityType.TASK,
        'task-1'
      )

      expect(associations).toHaveLength(2)
      // 应该包含指向task-1的关联和从task-1发出的关联
    })
  })

  describe('批量操作', () => {
    it('应该能够批量创建关联', async () => {
      const associations = [
        {
          sourceType: EntityType.NOTE,
          sourceId: 'note-1',
          targetType: EntityType.TASK,
          targetId: 'task-1',
          associationType: AssociationType.REFERENCE,
          strength: 0.8
        },
        {
          sourceType: EntityType.NOTE,
          sourceId: 'note-2',
          targetType: EntityType.TASK,
          targetId: 'task-2',
          associationType: AssociationType.SEMANTIC,
          strength: 0.6
        },
        {
          sourceType: EntityType.NOTE,
          sourceId: 'note-1', // 重复关联，应该失败
          targetType: EntityType.TASK,
          targetId: 'task-1',
          associationType: AssociationType.REFERENCE,
          strength: 0.9
        }
      ]

      const result = await dataAssociationService.createAssociationsBatch(associations)

      expect(result.success).toBe(2)
      expect(result.failed).toBe(1)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].error).toContain('关联已存在')
    })

    it('应该能够批量删除关联', async () => {
      const assoc1 = await dataAssociationService.createAssociation(
        EntityType.NOTE,
        'note-1',
        EntityType.TASK,
        'task-1',
        AssociationType.REFERENCE
      )

      const assoc2 = await dataAssociationService.createAssociation(
        EntityType.NOTE,
        'note-2',
        EntityType.TASK,
        'task-2',
        AssociationType.SEMANTIC
      )

      const result = await dataAssociationService.deleteAssociationsBatch([
        assoc1.id,
        assoc2.id,
        'non-existent'
      ])

      expect(result.success).toBe(2)
      expect(result.failed).toBe(1)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].error).toBe('关联不存在')
    })
  })

  describe('搜索实体管理', () => {
    it('应该能够注册搜索实体', async () => {
      await dataAssociationService.registerSearchEntity(
        EntityType.NOTE,
        'note-1',
        '测试笔记',
        '这是一个测试笔记的内容',
        { tags: ['测试', '笔记'] }
      )

      // 验证实体已注册（通过搜索验证）
      const results = await dataAssociationService.unifiedSearch({
        query: '测试笔记',
        entityTypes: [EntityType.NOTE]
      })

      expect(results).toHaveLength(1)
      expect(results[0].title).toBe('测试笔记')
      expect(results[0].content).toBe('这是一个测试笔记的内容')
    })

    it('应该能够更新搜索实体', async () => {
      await dataAssociationService.registerSearchEntity(
        EntityType.NOTE,
        'note-1',
        '原始标题',
        '原始内容'
      )

      await dataAssociationService.updateSearchEntity(
        EntityType.NOTE,
        'note-1',
        {
          title: '更新后的标题',
          content: '更新后的内容'
        }
      )

      const results = await dataAssociationService.unifiedSearch({
        query: '更新后的标题',
        entityTypes: [EntityType.NOTE]
      })

      expect(results).toHaveLength(1)
      expect(results[0].title).toBe('更新后的标题')
    })

    it('应该能够移除搜索实体', async () => {
      await dataAssociationService.registerSearchEntity(
        EntityType.NOTE,
        'note-1',
        '要删除的笔记'
      )

      await dataAssociationService.unregisterSearchEntity(EntityType.NOTE, 'note-1')

      const results = await dataAssociationService.unifiedSearch({
        query: '要删除的笔记',
        entityTypes: [EntityType.NOTE]
      })

      expect(results).toHaveLength(0)
    })
  })

  describe('统一搜索', () => {
    beforeEach(async () => {
      // 注册测试实体
      await dataAssociationService.registerSearchEntity(
        EntityType.NOTE,
        'note-1',
        '重要笔记',
        '这是一个重要的笔记内容',
        { tags: ['重要', '笔记'] }
      )

      await dataAssociationService.registerSearchEntity(
        EntityType.TASK,
        'task-1',
        '重要任务',
        '这是一个重要的任务描述',
        { priority: 'high' }
      )

      await dataAssociationService.registerSearchEntity(
        EntityType.NOTE,
        'note-2',
        '普通笔记',
        '这是一个普通的笔记内容'
      )
    })

    it('应该能够进行基础搜索', async () => {
      const results = await dataAssociationService.unifiedSearch({
        query: '重要'
      })

      expect(results).toHaveLength(2)
      expect(results.every(r => r.title.includes('重要'))).toBe(true)
    })

    it('应该能够按实体类型过滤', async () => {
      const results = await dataAssociationService.unifiedSearch({
        query: '重要',
        entityTypes: [EntityType.NOTE]
      })

      expect(results).toHaveLength(1)
      expect(results[0].type).toBe(EntityType.NOTE)
      expect(results[0].title).toBe('重要笔记')
    })

    it('应该能够模糊匹配', async () => {
      const results = await dataAssociationService.unifiedSearch({
        query: '笔记',
        fuzzyMatch: true
      })

      expect(results.length).toBeGreaterThan(0)
      expect(results.some(r => r.title.includes('笔记'))).toBe(true)
    })

    it('应该能够分页', async () => {
      const results = await dataAssociationService.unifiedSearch({
        query: '笔记',
        limit: 1,
        offset: 0
      })

      expect(results).toHaveLength(1)
    })

    it('应该计算相关性评分', async () => {
      const results = await dataAssociationService.unifiedSearch({
        query: '重要笔记'
      })

      expect(results.length).toBeGreaterThan(0)
      expect(results.every(r => r.score > 0)).toBe(true)
      // 标题完全匹配的应该有更高的评分
      const exactMatch = results.find(r => r.title === '重要笔记')
      expect(exactMatch?.score).toBeGreaterThan(1)
    })
  })

  describe('关联图谱', () => {
    beforeEach(async () => {
      // 创建复杂的关联网络
      await dataAssociationService.registerSearchEntity(EntityType.NOTE, 'note-1', '笔记1')
      await dataAssociationService.registerSearchEntity(EntityType.TASK, 'task-1', '任务1')
      await dataAssociationService.registerSearchEntity(EntityType.MINDMAP_NODE, 'mindmap-1', '思维导图节点1')
      await dataAssociationService.registerSearchEntity(EntityType.GRAPH_NODE, 'graph-1', '图谱节点1')

      await dataAssociationService.createAssociation(
        EntityType.NOTE, 'note-1',
        EntityType.TASK, 'task-1',
        AssociationType.REFERENCE
      )

      await dataAssociationService.createAssociation(
        EntityType.TASK, 'task-1',
        EntityType.MINDMAP_NODE, 'mindmap-1',
        AssociationType.SEMANTIC
      )

      await dataAssociationService.createAssociation(
        EntityType.MINDMAP_NODE, 'mindmap-1',
        EntityType.GRAPH_NODE, 'graph-1',
        AssociationType.HIERARCHY
      )
    })

    it('应该能够获取关联图谱', async () => {
      const graph = await dataAssociationService.getAssociationGraph(
        EntityType.NOTE,
        'note-1',
        2
      )

      expect(graph.nodes.length).toBeGreaterThan(1)
      expect(graph.edges.length).toBeGreaterThan(0)
      
      // 验证节点包含起始节点（现在ID格式是 entityType:entityId）
      expect(graph.nodes.some(n => n.id === 'note:note-1' && n.type === EntityType.NOTE)).toBe(true)

      // 验证边的连接性
      expect(graph.edges.every(e =>
        graph.nodes.some(n => n.id === e.source) &&
        graph.nodes.some(n => n.id === e.target)
      )).toBe(true)
    })

    it('应该限制遍历深度', async () => {
      const shallowGraph = await dataAssociationService.getAssociationGraph(
        EntityType.NOTE,
        'note-1',
        1
      )

      const deepGraph = await dataAssociationService.getAssociationGraph(
        EntityType.NOTE,
        'note-1',
        3
      )

      expect(deepGraph.nodes.length).toBeGreaterThanOrEqual(shallowGraph.nodes.length)
    })
  })

  describe('统计信息', () => {
    beforeEach(async () => {
      await dataAssociationService.createAssociation(
        EntityType.NOTE, 'note-1',
        EntityType.TASK, 'task-1',
        AssociationType.REFERENCE, 0.8
      )

      await dataAssociationService.createAssociation(
        EntityType.NOTE, 'note-2',
        EntityType.TASK, 'task-2',
        AssociationType.SEMANTIC, 0.6
      )

      await dataAssociationService.createAssociation(
        EntityType.TASK, 'task-1',
        EntityType.MINDMAP_NODE, 'mindmap-1',
        AssociationType.DEPENDENCY, 0.9
      )
    })

    it('应该能够获取统计信息', () => {
      const stats = dataAssociationService.getStatistics()

      expect(stats.totalAssociations).toBe(3)
      expect(stats.associationsByType[AssociationType.REFERENCE]).toBe(1)
      expect(stats.associationsByType[AssociationType.SEMANTIC]).toBe(1)
      expect(stats.associationsByType[AssociationType.DEPENDENCY]).toBe(1)
      expect(stats.averageStrength).toBeCloseTo((0.8 + 0.6 + 0.9) / 3, 2)
    })
  })

  describe('清理功能', () => {
    it('应该能够清理孤立关联', async () => {
      // 创建关联但不注册搜索实体
      await dataAssociationService.createAssociation(
        EntityType.NOTE, 'orphan-note',
        EntityType.TASK, 'orphan-task',
        AssociationType.REFERENCE
      )

      // 注册一个实体并创建关联
      await dataAssociationService.registerSearchEntity(EntityType.NOTE, 'valid-note', '有效笔记')
      await dataAssociationService.registerSearchEntity(EntityType.TASK, 'valid-task', '有效任务')
      await dataAssociationService.createAssociation(
        EntityType.NOTE, 'valid-note',
        EntityType.TASK, 'valid-task',
        AssociationType.REFERENCE
      )

      const cleanedCount = await dataAssociationService.cleanupOrphanedAssociations()

      expect(cleanedCount).toBe(1) // 只清理了孤立关联
      
      const remainingAssociations = await dataAssociationService.queryAssociations({})
      expect(remainingAssociations).toHaveLength(1)
      expect(remainingAssociations[0].sourceId).toBe('valid-note')
    })
  })
})
