import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Date for testing environment
vi.stubGlobal('Date', class {
  constructor(...args: any[]) {
    if (args.length === 0) {
      return {
        toISOString: () => '2025-01-14T10:00:00.000Z'
      }
    }
    return new (Date as any)(...args)
  }

  static now() {
    return 1736852400000 // 2025-01-14T10:00:00.000Z
  }

  toISOString() {
    return '2025-01-14T10:00:00.000Z'
  }
})
import BlockReferenceService, { 
  CreateBlockReferenceRequest, 
  UpdateBlockReferenceRequest,
  SyncBlockReferencesRequest,
  BlockSearchOptions
} from '../BlockReferenceService'
import { BlockReferenceRecord } from '../../database/BlockReferenceDatabaseSchema'

// Mock CoreAPI
const mockCoreAPI = {
  database: {
    execute: vi.fn(),
    query: vi.fn()
  },
  events: {
    emit: vi.fn()
  }
}

describe('BlockReferenceService', () => {
  let service: BlockReferenceService

  beforeEach(() => {
    vi.clearAllMocks()
    service = new BlockReferenceService(mockCoreAPI as any)
  })

  describe('createBlockReference', () => {
    const mockRequest: CreateBlockReferenceRequest = {
      source_block_id: 'block-1',
      target_block_id: 'block-2',
      reference_type: 'direct',
      context: '((block-2))',
      position: 10
    }

    beforeEach(() => {
      // Mock block existence validation
      mockCoreAPI.database.query.mockResolvedValue([{ id: 'block-1' }])
    })

    it('应该成功创建块引用', async () => {
      mockCoreAPI.database.execute.mockResolvedValue(undefined)

      const result = await service.createBlockReference(mockRequest)

      expect(result).toMatchObject({
        source_block_id: 'block-1',
        target_block_id: 'block-2',
        reference_type: 'direct',
        context: '((block-2))',
        position: 10
      })

      expect(mockCoreAPI.database.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO block_references'),
        expect.arrayContaining(['block-1', 'block-2', 'direct'])
      )

      expect(mockCoreAPI.events.emit).toHaveBeenCalledWith(
        'block-reference:created',
        expect.objectContaining({
          reference: result,
          source_block: { id: 'block-1' },
          target_block: { id: 'block-2' }
        })
      )
    })

    it('应该拒绝自引用', async () => {
      const selfReferenceRequest = {
        ...mockRequest,
        target_block_id: 'block-1'
      }

      await expect(service.createBlockReference(selfReferenceRequest))
        .rejects.toThrow('Block cannot reference itself')
    })

    it('应该验证源块存在', async () => {
      mockCoreAPI.database.query.mockResolvedValueOnce([]) // 源块不存在
        .mockResolvedValueOnce([{ id: 'block-2' }]) // 目标块存在

      await expect(service.createBlockReference(mockRequest))
        .rejects.toThrow('Block with id block-1 does not exist')
    })

    it('应该验证目标块存在', async () => {
      mockCoreAPI.database.query.mockResolvedValueOnce([{ id: 'block-1' }]) // 源块存在
        .mockResolvedValueOnce([]) // 目标块不存在

      await expect(service.createBlockReference(mockRequest))
        .rejects.toThrow('Block with id block-2 does not exist')
    })
  })

  describe('updateBlockReference', () => {
    const mockUpdateRequest: UpdateBlockReferenceRequest = {
      id: 'ref-1',
      context: 'updated context',
      position: 20,
      reference_type: 'embed'
    }

    const mockExistingReference: BlockReferenceRecord = {
      id: 'ref-1',
      source_block_id: 'block-1',
      target_block_id: 'block-2',
      reference_type: 'direct',
      context: 'old context',
      position: 10,
      created_at: '2025-01-14T10:00:00Z',
      updated_at: '2025-01-14T10:00:00Z'
    }

    beforeEach(() => {
      mockCoreAPI.database.query.mockResolvedValue([mockExistingReference])
    })

    it('应该成功更新块引用', async () => {
      mockCoreAPI.database.execute.mockResolvedValue(undefined)

      const result = await service.updateBlockReference(mockUpdateRequest)

      expect(mockCoreAPI.database.execute).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE block_references SET'),
        expect.arrayContaining(['updated context', 20, 'embed'])
      )

      expect(mockCoreAPI.events.emit).toHaveBeenCalledWith(
        'block-reference:updated',
        expect.objectContaining({
          reference: result,
          previous: mockExistingReference,
          changes: expect.objectContaining({
            context: 'updated context',
            position: 20,
            reference_type: 'embed'
          })
        })
      )
    })

    it('应该处理引用不存在的情况', async () => {
      mockCoreAPI.database.query.mockResolvedValue([])

      await expect(service.updateBlockReference(mockUpdateRequest))
        .rejects.toThrow('Block reference with id ref-1 not found')
    })

    it('应该只更新提供的字段', async () => {
      const partialUpdate = {
        id: 'ref-1',
        context: 'new context'
      }

      await service.updateBlockReference(partialUpdate)

      expect(mockCoreAPI.database.execute).toHaveBeenCalledWith(
        expect.stringContaining('context = ?'),
        expect.arrayContaining(['new context'])
      )
    })
  })

  describe('deleteBlockReference', () => {
    const mockReference: BlockReferenceRecord = {
      id: 'ref-1',
      source_block_id: 'block-1',
      target_block_id: 'block-2',
      reference_type: 'direct',
      created_at: '2025-01-14T10:00:00Z',
      updated_at: '2025-01-14T10:00:00Z'
    }

    it('应该成功删除块引用', async () => {
      mockCoreAPI.database.query.mockResolvedValue([mockReference])
      mockCoreAPI.database.execute.mockResolvedValue(undefined)

      await service.deleteBlockReference('ref-1')

      expect(mockCoreAPI.database.execute).toHaveBeenCalledWith(
        'DELETE FROM block_references WHERE id = ?',
        ['ref-1']
      )

      expect(mockCoreAPI.events.emit).toHaveBeenCalledWith(
        'block-reference:deleted',
        expect.objectContaining({
          reference: mockReference,
          deleted_at: expect.any(String)
        })
      )
    })

    it('应该处理引用不存在的情况', async () => {
      mockCoreAPI.database.query.mockResolvedValue([])

      await expect(service.deleteBlockReference('ref-1'))
        .rejects.toThrow('Block reference with id ref-1 not found')
    })
  })

  describe('getBlockReference', () => {
    it('应该返回存在的块引用', async () => {
      const mockReference: BlockReferenceRecord = {
        id: 'ref-1',
        source_block_id: 'block-1',
        target_block_id: 'block-2',
        reference_type: 'direct',
        created_at: '2025-01-14T10:00:00Z',
        updated_at: '2025-01-14T10:00:00Z'
      }

      mockCoreAPI.database.query.mockResolvedValue([mockReference])

      const result = await service.getBlockReference('ref-1')

      expect(result).toEqual(mockReference)
      expect(mockCoreAPI.database.query).toHaveBeenCalledWith(
        'SELECT * FROM block_references WHERE id = ?',
        ['ref-1']
      )
    })

    it('应该返回null当引用不存在时', async () => {
      mockCoreAPI.database.query.mockResolvedValue([])

      const result = await service.getBlockReference('ref-1')

      expect(result).toBeNull()
    })
  })

  describe('getBlockReferences', () => {
    it('应该返回块的所有引用', async () => {
      const mockReferences = [
        { id: 'ref-1', target_block_id: 'block-1', reference_type: 'direct' },
        { id: 'ref-2', target_block_id: 'block-1', reference_type: 'embed' }
      ]

      mockCoreAPI.database.query.mockResolvedValue(mockReferences)

      const result = await service.getBlockReferences('block-1')

      expect(result).toEqual(mockReferences)
      expect(mockCoreAPI.database.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE br.target_block_id = ?'),
        expect.arrayContaining(['block-1'])
      )
    })

    it('应该支持查询选项', async () => {
      mockCoreAPI.database.query.mockResolvedValue([])

      await service.getBlockReferences('block-1', {
        limit: 10,
        offset: 5,
        reference_type: 'direct',
        sort_by: 'position',
        sort_order: 'asc'
      })

      expect(mockCoreAPI.database.query).toHaveBeenCalledWith(
        expect.stringContaining('AND br.reference_type = ?'),
        expect.arrayContaining(['block-1', 'direct', 10, 5])
      )
    })
  })

  describe('syncBlockReferences', () => {
    const mockSyncRequest: SyncBlockReferencesRequest = {
      source_block_id: 'block-1',
      content: '这是包含 ((block-2)) 和 ((block-3)) 的内容'
    }

    it('应该同步块引用', async () => {
      // Mock existing references
      mockCoreAPI.database.query.mockResolvedValue([])
      
      // Mock block existence validation
      mockCoreAPI.database.query.mockResolvedValue([{ id: 'block-2' }])
      mockCoreAPI.database.execute.mockResolvedValue(undefined)

      const result = await service.syncBlockReferences(mockSyncRequest)

      expect(result).toHaveProperty('created')
      expect(result).toHaveProperty('updated')
      expect(result).toHaveProperty('deleted')

      expect(mockCoreAPI.events.emit).toHaveBeenCalledWith(
        'block-references:synced',
        expect.objectContaining({
          source_block_id: 'block-1',
          created: expect.any(Number),
          updated: expect.any(Number),
          deleted: expect.any(Number)
        })
      )
    })
  })

  describe('searchBlocks', () => {
    const mockSearchOptions: BlockSearchOptions = {
      query: '测试',
      limit: 10,
      block_type: 'paragraph'
    }

    it('应该搜索块', async () => {
      const mockResults = [
        {
          id: 'block-1',
          content: '这是测试内容',
          block_type: 'paragraph',
          page_name: '测试页面',
          relevance_score: 100
        }
      ]

      mockCoreAPI.database.query.mockResolvedValue(mockResults)

      const result = await service.searchBlocks(mockSearchOptions)

      expect(result).toEqual(mockResults)
      expect(mockCoreAPI.database.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE b.content LIKE ?'),
        expect.arrayContaining(['测试', '测试%', '%测试%', '%测试%', 'paragraph', 10])
      )
    })
  })

  describe('getBlockReferenceStatistics', () => {
    it('应该返回块引用统计', async () => {
      const mockStats = {
        total_blocks: 100,
        referenced_blocks: 25,
        total_references: 50,
        average_references: 2.0
      }

      const mockMostReferenced = {
        id: 'block-1',
        content: '最多引用的块',
        reference_count: 10
      }

      mockCoreAPI.database.query.mockResolvedValueOnce([mockStats])
        .mockResolvedValueOnce([mockMostReferenced])

      const result = await service.getBlockReferenceStatistics()

      expect(result).toEqual({
        total_blocks: 100,
        referenced_blocks: 25,
        total_references: 50,
        average_references: 2.0,
        most_referenced_block: {
          id: 'block-1',
          content: '最多引用的块',
          reference_count: 10
        }
      })
    })

    it('应该处理没有最多引用块的情况', async () => {
      const mockStats = {
        total_blocks: 10,
        referenced_blocks: 0,
        total_references: 0,
        average_references: 0
      }

      mockCoreAPI.database.query.mockResolvedValueOnce([mockStats])
        .mockResolvedValueOnce([])

      const result = await service.getBlockReferenceStatistics()

      expect(result.most_referenced_block).toBeUndefined()
    })
  })
})
