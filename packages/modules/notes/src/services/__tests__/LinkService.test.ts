import { describe, it, expect, beforeEach, vi } from 'vitest'
import LinkService, { CreateLinkRequest, UpdateLinkRequest, SyncLinksRequest } from '../LinkService'
import { LinkRecord } from '../../database/LinkDatabaseSchema'

// Mock CoreAPI
const mockCoreAPI = {
  database: {
    query: vi.fn(),
    execute: vi.fn(),
    transaction: vi.fn()
  },
  events: {
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    once: vi.fn()
  }
}

describe('LinkService', () => {
  let linkService: LinkService

  beforeEach(() => {
    vi.clearAllMocks()
    linkService = new LinkService(mockCoreAPI as any)
  })

  describe('createLink', () => {
    it('应该创建新链接', async () => {
      const request: CreateLinkRequest = {
        source_type: 'page',
        source_id: 'page-1',
        target_type: 'page',
        target_id: 'page-2',
        link_type: 'page-reference',
        context: '这是一个链接到 [[页面2]] 的示例',
        position: 10,
        display_text: '页面2'
      }

      mockCoreAPI.database.execute.mockResolvedValue(undefined)

      const result = await linkService.createLink(request)

      expect(result).toMatchObject({
        source_type: 'page',
        source_id: 'page-1',
        target_type: 'page',
        target_id: 'page-2',
        link_type: 'page-reference',
        context: '这是一个链接到 [[页面2]] 的示例',
        position: 10,
        display_text: '页面2'
      })

      expect(result.id).toBeDefined()
      expect(result.created_at).toBeDefined()
      expect(result.updated_at).toBeDefined()
      expect(typeof result.created_at).toBe('string')
      expect(typeof result.updated_at).toBe('string')

      expect(mockCoreAPI.database.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO links'),
        expect.arrayContaining([
          result.id,
          'page',
          'page-1',
          'page',
          'page-2',
          'page-reference',
          '这是一个链接到 [[页面2]] 的示例',
          10,
          '页面2',
          result.created_at,
          result.updated_at
        ])
      )

      expect(mockCoreAPI.events.emit).toHaveBeenCalledWith('link:created', {
        link: result,
        source: { type: 'page', id: 'page-1' },
        target: { type: 'page', id: 'page-2' }
      })
    })
  })

  describe('getLink', () => {
    it('应该返回存在的链接', async () => {
      const mockLink: LinkRecord = {
        id: 'link-1',
        source_type: 'page',
        source_id: 'page-1',
        target_type: 'page',
        target_id: 'page-2',
        link_type: 'page-reference',
        context: '测试链接',
        position: 10,
        display_text: '页面2',
        created_at: '2025-01-14T10:00:00Z',
        updated_at: '2025-01-14T10:00:00Z'
      }

      mockCoreAPI.database.query.mockResolvedValue([mockLink])

      const result = await linkService.getLink('link-1')

      expect(result).toEqual(mockLink)
      expect(mockCoreAPI.database.query).toHaveBeenCalledWith(
        'SELECT * FROM links WHERE id = ?',
        ['link-1']
      )
    })

    it('应该返回null当链接不存在时', async () => {
      mockCoreAPI.database.query.mockResolvedValue([])

      const result = await linkService.getLink('non-existent')

      expect(result).toBeNull()
    })
  })

  describe('updateLink', () => {
    it('应该更新现有链接', async () => {
      const existingLink: LinkRecord = {
        id: 'link-1',
        source_type: 'page',
        source_id: 'page-1',
        target_type: 'page',
        target_id: 'page-2',
        link_type: 'page-reference',
        context: '旧上下文',
        position: 10,
        display_text: '旧显示文本',
        created_at: '2025-01-14T10:00:00Z',
        updated_at: '2025-01-14T10:00:00Z'
      }

      const updateRequest: UpdateLinkRequest = {
        id: 'link-1',
        context: '新上下文',
        position: 15,
        display_text: '新显示文本'
      }

      mockCoreAPI.database.query.mockResolvedValue([existingLink])
      mockCoreAPI.database.execute.mockResolvedValue(undefined)

      const result = await linkService.updateLink(updateRequest)

      expect(result).toMatchObject({
        id: 'link-1',
        context: '新上下文',
        position: 15,
        display_text: '新显示文本'
      })

      expect(result.updated_at).not.toBe(existingLink.updated_at)

      expect(mockCoreAPI.database.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE links SET'),
        expect.arrayContaining(['新上下文', 15, '新显示文本'])
      )

      expect(mockCoreAPI.events.emit).toHaveBeenCalledWith('link:updated', {
        link: result,
        previous: existingLink
      })
    })

    it('应该抛出错误当链接不存在时', async () => {
      mockCoreAPI.database.query.mockResolvedValue([])

      await expect(linkService.updateLink({
        id: 'non-existent',
        context: '新上下文'
      })).rejects.toThrow('Link not found: non-existent')
    })
  })

  describe('deleteLink', () => {
    it('应该删除现有链接', async () => {
      const existingLink: LinkRecord = {
        id: 'link-1',
        source_type: 'page',
        source_id: 'page-1',
        target_type: 'page',
        target_id: 'page-2',
        link_type: 'page-reference',
        created_at: '2025-01-14T10:00:00Z',
        updated_at: '2025-01-14T10:00:00Z'
      }

      mockCoreAPI.database.query.mockResolvedValue([existingLink])
      mockCoreAPI.database.execute.mockResolvedValue(undefined)

      await linkService.deleteLink('link-1')

      expect(mockCoreAPI.database.execute).toHaveBeenCalledWith(
        'DELETE FROM links WHERE id = ?',
        ['link-1']
      )

      expect(mockCoreAPI.events.emit).toHaveBeenCalledWith('link:deleted', {
        link: existingLink
      })
    })

    it('应该抛出错误当链接不存在时', async () => {
      mockCoreAPI.database.query.mockResolvedValue([])

      await expect(linkService.deleteLink('non-existent'))
        .rejects.toThrow('Link not found: non-existent')
    })
  })

  describe('getOutgoingLinks', () => {
    it('应该返回页面的出链', async () => {
      const mockLinks: LinkRecord[] = [
        {
          id: 'link-1',
          source_type: 'page',
          source_id: 'page-1',
          target_type: 'page',
          target_id: 'page-2',
          link_type: 'page-reference',
          position: 10,
          created_at: '2025-01-14T10:00:00Z',
          updated_at: '2025-01-14T10:00:00Z'
        }
      ]

      mockCoreAPI.database.query.mockResolvedValue(mockLinks)

      const result = await linkService.getOutgoingLinks('page', 'page-1')

      expect(result).toEqual(mockLinks)
      expect(mockCoreAPI.database.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE source_type = ? AND source_id = ?'),
        expect.arrayContaining(['page', 'page-1'])
      )
    })

    it('应该支持过滤和排序选项', async () => {
      mockCoreAPI.database.query.mockResolvedValue([])

      await linkService.getOutgoingLinks('page', 'page-1', {
        limit: 10,
        offset: 5,
        link_type: 'page-reference',
        sort_by: 'created_at',
        sort_order: 'desc'
      })

      expect(mockCoreAPI.database.query).toHaveBeenCalledWith(
        expect.stringContaining('AND link_type = ?'),
        expect.arrayContaining(['page', 'page-1', 'page-reference', 10, 5])
      )
    })
  })

  describe('getBacklinks', () => {
    it('应该返回页面的反向链接', async () => {
      const mockBacklinks = [
        {
          link_id: 'link-1',
          source_type: 'page',
          source_id: 'page-1',
          context: '链接上下文',
          position: 10,
          display_text: '显示文本',
          created_at: '2025-01-14T10:00:00Z',
          source_title: '源页面',
          source_content: '源页面标题'
        }
      ]

      mockCoreAPI.database.query.mockResolvedValue(mockBacklinks)

      const result = await linkService.getBacklinks('page', 'page-2')

      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        link_id: 'link-1',
        source: {
          type: 'page',
          id: 'page-1',
          title: '源页面',
          content: '源页面标题'
        },
        context: '链接上下文',
        position: 10,
        display_text: '显示文本',
        created_at: '2025-01-14T10:00:00Z'
      })
    })
  })

  describe('syncLinks', () => {
    it('应该同步内容中的链接', async () => {
      const request: SyncLinksRequest = {
        source_type: 'page',
        source_id: 'page-1',
        content: '这是一个包含 [[页面2]] 和 [[页面3|别名]] 的内容'
      }

      // Mock现有链接
      mockCoreAPI.database.query.mockResolvedValue([])
      mockCoreAPI.database.execute.mockResolvedValue(undefined)

      const result = await linkService.syncLinks(request)

      expect(result.created).toHaveLength(2)
      expect(result.updated).toHaveLength(0)
      expect(result.deleted).toHaveLength(0)

      expect(mockCoreAPI.events.emit).toHaveBeenCalledWith('links:synced', {
        source: { type: 'page', id: 'page-1' },
        summary: {
          created: 2,
          updated: 0,
          deleted: 0
        }
      })
    })
  })

  describe('getPageReferences', () => {
    it('应该返回页面引用统计', async () => {
      const mockReferences = [
        {
          page_id: 'page-1',
          page_name: '热门页面',
          reference_count: 10,
          last_referenced_at: '2025-01-14T10:00:00Z'
        }
      ]

      mockCoreAPI.database.query.mockResolvedValue(mockReferences)

      const result = await linkService.getPageReferences(10)

      expect(result).toEqual(mockReferences)
      expect(mockCoreAPI.database.query).toHaveBeenCalledWith(
        expect.stringContaining('FROM page_references'),
        [10]
      )
    })
  })

  describe('getOrphanPages', () => {
    it('应该返回孤立页面', async () => {
      const mockOrphans = [
        {
          id: 'page-1',
          name: '孤立页面',
          title: '孤立页面标题',
          created_at: '2025-01-14T10:00:00Z'
        }
      ]

      mockCoreAPI.database.query.mockResolvedValue(mockOrphans)

      const result = await linkService.getOrphanPages()

      expect(result).toEqual(mockOrphans)
      expect(mockCoreAPI.database.query).toHaveBeenCalledWith(
        expect.stringContaining('LEFT JOIN page_references pr')
      )
    })
  })
})
