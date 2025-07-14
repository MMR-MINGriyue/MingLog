/**
 * CrossModuleLinkService 集成测试
 * 测试跨模块数据链接服务的核心功能
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { CrossModuleLinkService, LinkReference } from '../services/CrossModuleLinkService'
import { EventBus } from '../event-system/EventBus'
import { DatabaseManager } from '../database/DatabaseManager'

// Mock数据库管理器
const mockDatabase = {
  execute: vi.fn(),
  query: vi.fn(),
  transaction: vi.fn()
} as unknown as DatabaseManager

// Mock事件总线
const mockEventBus = {
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn()
} as unknown as EventBus

describe('CrossModuleLinkService', () => {
  let linkService: CrossModuleLinkService

  beforeEach(async () => {
    vi.clearAllMocks()
    linkService = new CrossModuleLinkService(mockEventBus, mockDatabase)
    await linkService.initialize()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('初始化', () => {
    it('应该创建必要的数据库表', async () => {
      expect(mockDatabase.execute).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS cross_module_links')
      )
      expect(mockDatabase.execute).toHaveBeenCalledWith(
        expect.stringContaining('CREATE INDEX IF NOT EXISTS idx_cross_links_source')
      )
      expect(mockDatabase.execute).toHaveBeenCalledWith(
        expect.stringContaining('CREATE INDEX IF NOT EXISTS idx_cross_links_target')
      )
    })
  })

  describe('创建链接', () => {
    beforeEach(() => {
      // Mock数据库查询以验证项目存在
      mockDatabase.query = vi.fn()
        .mockResolvedValueOnce([{ id: 'note_123' }]) // 源存在
        .mockResolvedValueOnce([{ id: 'task_456' }]) // 目标存在
    })

    it('应该成功创建基本链接', async () => {
      mockDatabase.execute = vi.fn().mockResolvedValue({ lastInsertRowid: 1 })

      const result = await linkService.createLink(
        'notes',
        'note_123',
        'tasks',
        'task_456',
        'reference'
      )

      expect(result).toBeDefined()
      expect(result.sourceModule).toBe('notes')
      expect(result.sourceId).toBe('note_123')
      expect(result.targetModule).toBe('tasks')
      expect(result.targetId).toBe('task_456')
      expect(result.linkType).toBe('reference')

      expect(mockDatabase.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO cross_module_links'),
        expect.arrayContaining([
          expect.any(String), // id
          'notes',
          'note_123',
          'tasks',
          'task_456',
          'reference',
          '{}', // metadata
          expect.any(String), // created_at
          expect.any(String)  // updated_at
        ])
      )

      expect(mockEventBus.emit).toHaveBeenCalledWith('cross-module:link-created', {
        link: result,
        sourceModule: 'notes',
        targetModule: 'tasks'
      })
    })

    it('应该支持带元数据的链接', async () => {
      mockDatabase.execute = vi.fn().mockResolvedValue({ lastInsertRowid: 1 })

      const metadata = {
        displayText: '相关任务',
        position: 42
      }

      const result = await linkService.createLink(
        'notes',
        'note_123',
        'tasks',
        'task_456',
        'reference',
        metadata
      )

      expect(result.metadata).toEqual(metadata)
    })

    it('应该在启用双向链接时创建反向链接', async () => {
      const linkServiceWithBidirectional = new CrossModuleLinkService(
        mockEventBus,
        mockDatabase,
        { enableBidirectionalLinks: true }
      )

      mockDatabase.execute = vi.fn().mockResolvedValue({ lastInsertRowid: 1 })

      await linkServiceWithBidirectional.createLink(
        'notes',
        'note_123',
        'tasks',
        'task_456',
        'reference'
      )

      // 应该调用两次execute：一次原始链接，一次反向链接
      expect(mockDatabase.execute).toHaveBeenCalledTimes(2)
    })

    it('应该在源不存在时抛出错误', async () => {
      mockDatabase.query = vi.fn()
        .mockResolvedValueOnce([]) // 源不存在
        .mockResolvedValueOnce([{ id: 'task_456' }]) // 目标存在

      await expect(linkService.createLink(
        'notes',
        'nonexistent',
        'tasks',
        'task_456',
        'reference'
      )).rejects.toThrow('Source item notes:nonexistent does not exist')
    })

    it('应该在目标不存在时抛出错误', async () => {
      mockDatabase.query = vi.fn()
        .mockResolvedValueOnce([{ id: 'note_123' }]) // 源存在
        .mockResolvedValueOnce([]) // 目标不存在

      await expect(linkService.createLink(
        'notes',
        'note_123',
        'tasks',
        'nonexistent',
        'reference'
      )).rejects.toThrow('Target item tasks:nonexistent does not exist')
    })
  })

  describe('获取链接', () => {
    const mockLinks = [
      {
        id: 'link_1',
        source_module: 'notes',
        source_id: 'note_123',
        target_module: 'tasks',
        target_id: 'task_456',
        link_type: 'reference',
        metadata: '{}',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'link_2',
        source_module: 'tasks',
        source_id: 'task_789',
        target_module: 'notes',
        target_id: 'note_123',
        link_type: 'reference',
        metadata: '{}',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ]

    it('应该获取项目的所有链接', async () => {
      mockDatabase.query = vi.fn()
        .mockResolvedValueOnce([mockLinks[0]]) // 出站链接
        .mockResolvedValueOnce([mockLinks[1]]) // 入站链接

      const result = await linkService.getLinksForItem('notes', 'note_123')

      expect(result.outgoing).toHaveLength(1)
      expect(result.incoming).toHaveLength(1)
      expect(result.outgoing[0].targetModule).toBe('tasks')
      expect(result.incoming[0].sourceModule).toBe('tasks')
    })

    it('应该使用缓存提高性能', async () => {
      mockDatabase.query = vi.fn()
        .mockResolvedValueOnce([mockLinks[0]])
        .mockResolvedValueOnce([mockLinks[1]])

      // 第一次调用
      await linkService.getLinksForItem('notes', 'note_123')
      
      // 第二次调用应该使用缓存
      await linkService.getLinksForItem('notes', 'note_123')

      // 数据库查询应该只调用一次
      expect(mockDatabase.query).toHaveBeenCalledTimes(2) // 出站和入站各一次
    })
  })

  describe('删除链接', () => {
    it('应该能够删除单个链接', async () => {
      const mockLink = {
        id: 'link_1',
        source_module: 'notes',
        source_id: 'note_123',
        target_module: 'tasks',
        target_id: 'task_456',
        link_type: 'reference',
        metadata: '{}',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      mockDatabase.query = vi.fn().mockResolvedValue([mockLink])
      mockDatabase.execute = vi.fn().mockResolvedValue({ changes: 1 })

      await linkService.deleteLink('link_1')

      expect(mockDatabase.execute).toHaveBeenCalledWith(
        'DELETE FROM cross_module_links WHERE id = ?',
        ['link_1']
      )

      expect(mockEventBus.emit).toHaveBeenCalledWith('cross-module:link-deleted', {
        link: expect.objectContaining({ id: 'link_1' })
      })
    })

    it('应该能够删除项目的所有链接', async () => {
      mockDatabase.execute = vi.fn().mockResolvedValue({ changes: 2 })

      await linkService.deleteLinksForItem('notes', 'note_123')

      expect(mockDatabase.execute).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM cross_module_links'),
        ['notes', 'note_123', 'notes', 'note_123']
      )

      expect(mockEventBus.emit).toHaveBeenCalledWith('cross-module:links-deleted', {
        module: 'notes',
        itemId: 'note_123'
      })
    })
  })

  describe('链接统计', () => {
    it('应该生成正确的统计信息', async () => {
      mockDatabase.query = vi.fn()
        .mockResolvedValueOnce([{ count: 10 }]) // 总链接数
        .mockResolvedValueOnce([
          { module: 'notes', count: 5 },
          { module: 'tasks', count: 3 },
          { module: 'mindmap', count: 2 }
        ]) // 按模块统计
        .mockResolvedValueOnce([
          { link_type: 'reference', count: 7 },
          { link_type: 'embed', count: 2 },
          { link_type: 'mention', count: 1 }
        ]) // 按类型统计
        .mockResolvedValueOnce([
          { module: 'notes', item_id: 'note_123', link_count: 5 },
          { module: 'tasks', item_id: 'task_456', link_count: 3 }
        ]) // 最多链接的项目

      const stats = await linkService.getLinkStats()

      expect(stats.totalLinks).toBe(10)
      expect(stats.linksByModule).toEqual({
        notes: 5,
        tasks: 3,
        mindmap: 2
      })
      expect(stats.linksByType).toEqual({
        reference: 7,
        embed: 2,
        mention: 1
      })
      expect(stats.topLinkedItems).toHaveLength(2)
    })
  })

  describe('事件处理', () => {
    it('应该监听数据删除事件并清理链接', async () => {
      const eventHandler = vi.fn()
      mockEventBus.on = vi.fn((event, handler) => {
        if (event === 'data:deleted') {
          eventHandler.mockImplementation(handler)
        }
      })

      // 重新初始化以绑定事件监听器
      linkService = new CrossModuleLinkService(mockEventBus, mockDatabase)

      // 模拟数据删除事件
      await eventHandler({
        data: { type: 'note', id: 'note_123' }
      })

      expect(mockDatabase.execute).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM cross_module_links'),
        ['notes', 'note_123', 'notes', 'note_123']
      )
    })
  })

  describe('错误处理', () => {
    it('应该在数据库错误时抛出异常', async () => {
      mockDatabase.execute = vi.fn().mockRejectedValue(new Error('数据库错误'))

      await expect(linkService.createLink(
        'notes',
        'note_123',
        'tasks',
        'task_456',
        'reference'
      )).rejects.toThrow('数据库错误')
    })

    it('应该优雅地处理不存在的链接删除', async () => {
      mockDatabase.query = vi.fn().mockResolvedValue([]) // 链接不存在

      // 不应该抛出错误
      await expect(linkService.deleteLink('nonexistent')).resolves.toBeUndefined()
    })
  })

  describe('性能优化', () => {
    it('应该限制缓存大小', async () => {
      const linkServiceWithSmallCache = new CrossModuleLinkService(
        mockEventBus,
        mockDatabase,
        { cacheSize: 2 }
      )

      mockDatabase.query = vi.fn().mockResolvedValue([])

      // 添加超过缓存大小的项目
      await linkServiceWithSmallCache.getLinksForItem('notes', 'note_1')
      await linkServiceWithSmallCache.getLinksForItem('notes', 'note_2')
      await linkServiceWithSmallCache.getLinksForItem('notes', 'note_3')

      // 验证缓存管理
      // 这里需要访问私有属性来验证，或者通过行为来验证
    })
  })
})
