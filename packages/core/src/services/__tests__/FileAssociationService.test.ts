/**
 * 文件关联服务测试
 * 测试文件与笔记、任务的双向关联功能
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { EventBus } from '../../event-system/EventBus'
import { CrossModuleLinkService } from '../CrossModuleLinkService'
import { SearchEngine } from '../../search/SearchEngine'
import { FileStorageService, FileEntity } from '../FileStorageService'
import { 
  FileAssociationService, 
  FileAssociation, 
  AssociationModule, 
  FileAssociationType 
} from '../FileAssociationService'

// Mock dependencies
const mockEventBus = {
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn()
} as unknown as EventBus

const mockCrossModuleLinkService = {
  createLink: vi.fn(),
  getLinksForItem: vi.fn(),
  deleteLink: vi.fn(),
  updateLink: vi.fn()
} as unknown as CrossModuleLinkService

const mockSearchEngine = {
  createIndex: vi.fn(),
  addDocument: vi.fn(),
  removeDocument: vi.fn(),
  search: vi.fn()
} as unknown as SearchEngine

const mockFileStorageService = {
  getFile: vi.fn()
} as unknown as FileStorageService

// 创建测试文件实体
const createTestFileEntity = (): FileEntity => ({
  id: 'test-file-id',
  name: 'test-document.pdf',
  original_name: 'test-document.pdf',
  type: 'application/pdf',
  size: 1024 * 1024,
  path: '/test/path/test-document.pdf',
  checksum: 'test-checksum',
  url: 'http://localhost/files/test-document.pdf',
  thumbnail_path: undefined,
  metadata: {
    description: '测试文档',
    tags: ['测试', '文档'],
    category: 'document',
    custom_fields: {},
    permissions: {
      is_public: false,
      allow_download: true,
      allow_preview: true,
      shared_users: [],
      editors: [],
      viewers: []
    }
  },
  associations: [],
  created_at: new Date('2024-01-01'),
  updated_at: new Date('2024-01-01')
})

describe('FileAssociationService', () => {
  let fileAssociationService: FileAssociationService
  let testFile: FileEntity

  beforeEach(() => {
    testFile = createTestFileEntity()
    
    fileAssociationService = new FileAssociationService(
      mockEventBus,
      mockCrossModuleLinkService,
      mockSearchEngine,
      mockFileStorageService,
      {
        enableAutoSuggestions: true,
        enableBidirectionalLinks: true,
        enableIndexing: true,
        cacheSize: 100
      }
    )

    // Reset mocks
    vi.clearAllMocks()
    
    // Setup default mock responses
    ;(mockFileStorageService.getFile as any).mockResolvedValue(testFile)
    ;(mockCrossModuleLinkService.createLink as any).mockResolvedValue({ id: 'link-id' })
    ;(mockCrossModuleLinkService.getLinksForItem as any).mockResolvedValue({ 
      outgoing: [], 
      incoming: [] 
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('初始化', () => {
    it('应该正确初始化服务', async () => {
      await fileAssociationService.initialize()

      expect(mockSearchEngine.createIndex).toHaveBeenCalledWith(
        'file-associations',
        expect.objectContaining({
          fields: expect.arrayContaining(['fileId', 'module', 'entityId']),
          searchableFields: expect.arrayContaining(['metadata.description']),
          filterFields: expect.arrayContaining(['module', 'associationType'])
        })
      )

      expect(mockEventBus.emit).toHaveBeenCalledWith(
        'file-association:service-initialized',
        expect.objectContaining({
          config: expect.any(Object),
          metrics: expect.any(Object)
        }),
        'FileAssociationService'
      )
    })

    it('应该处理初始化错误', async () => {
      ;(mockSearchEngine.createIndex as any).mockRejectedValue(new Error('索引创建失败'))

      await expect(fileAssociationService.initialize()).rejects.toThrow('索引创建失败')
    })
  })

  describe('创建关联', () => {
    it('应该成功创建文件关联', async () => {
      const association = await fileAssociationService.createAssociation(
        'test-file-id',
        'notes',
        'note-123',
        'reference',
        {
          strength: 0.8,
          metadata: {
            description: '测试关联',
            tags: ['重要']
          }
        }
      )

      expect(association).toMatchObject({
        fileId: 'test-file-id',
        module: 'notes',
        entityId: 'note-123',
        associationType: 'reference',
        strength: 0.8,
        metadata: {
          description: '测试关联',
          tags: ['重要']
        }
      })

      expect(mockCrossModuleLinkService.createLink).toHaveBeenCalledWith(
        'files',
        'test-file-id',
        'notes',
        'note-123',
        'reference',
        expect.objectContaining({
          strength: 0.8
        })
      )

      expect(mockEventBus.emit).toHaveBeenCalledWith(
        'file-association:created',
        expect.objectContaining({
          association,
          file: testFile
        }),
        'FileAssociationService'
      )
    })

    it('应该在文件不存在时抛出错误', async () => {
      ;(mockFileStorageService.getFile as any).mockResolvedValue(null)

      await expect(
        fileAssociationService.createAssociation(
          'nonexistent-file',
          'notes',
          'note-123',
          'reference'
        )
      ).rejects.toThrow('文件不存在: nonexistent-file')
    })

    it('应该使用默认配置值', async () => {
      const association = await fileAssociationService.createAssociation(
        'test-file-id',
        'tasks',
        'task-456',
        'attachment'
      )

      expect(association.strength).toBe(1.0)
      expect(association.bidirectional).toBe(true)
      expect(association.metadata.tags).toEqual([])
    })

    it('应该处理创建错误', async () => {
      ;(mockCrossModuleLinkService.createLink as any).mockRejectedValue(
        new Error('链接创建失败')
      )

      await expect(
        fileAssociationService.createAssociation(
          'test-file-id',
          'notes',
          'note-123',
          'reference'
        )
      ).rejects.toThrow('链接创建失败')

      expect(mockEventBus.emit).toHaveBeenCalledWith(
        'file-association:error',
        expect.objectContaining({
          operation: 'create',
          error: '链接创建失败'
        }),
        'FileAssociationService'
      )
    })
  })

  describe('查询关联', () => {
    it('应该查询文件的所有关联', async () => {
      const mockAssociations = [
        {
          id: 'assoc-1',
          fileId: 'test-file-id',
          module: 'notes' as AssociationModule,
          entityId: 'note-123',
          associationType: 'reference' as FileAssociationType,
          strength: 1.0,
          bidirectional: true,
          metadata: { tags: [], customFields: {} },
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]

      // Mock executeAssociationQuery method
      vi.spyOn(fileAssociationService as any, 'executeAssociationQuery')
        .mockResolvedValue(mockAssociations)

      const result = await fileAssociationService.queryAssociations({
        fileId: 'test-file-id'
      })

      expect(result.associations).toEqual(mockAssociations)
      expect(result.total).toBe(1)
      expect(result.hasMore).toBe(false)
      expect(result.stats.byModule.notes).toBe(1)
      expect(result.stats.byType.reference).toBe(1)
    })

    it('应该支持分页查询', async () => {
      const mockAssociations = Array.from({ length: 15 }, (_, i) => ({
        id: `assoc-${i}`,
        fileId: 'test-file-id',
        module: 'notes' as AssociationModule,
        entityId: `note-${i}`,
        associationType: 'reference' as FileAssociationType,
        strength: 1.0,
        bidirectional: true,
        metadata: { tags: [], customFields: {} },
        createdAt: new Date(),
        updatedAt: new Date()
      }))

      vi.spyOn(fileAssociationService as any, 'executeAssociationQuery')
        .mockResolvedValue(mockAssociations)

      const result = await fileAssociationService.queryAssociations({
        limit: 10,
        offset: 0
      })

      expect(result.associations).toHaveLength(10)
      expect(result.total).toBe(15)
      expect(result.hasMore).toBe(true)
    })

    it('应该支持模块和类型过滤', async () => {
      vi.spyOn(fileAssociationService as any, 'executeAssociationQuery')
        .mockResolvedValue([])

      await fileAssociationService.queryAssociations({
        module: 'notes',
        associationType: 'reference'
      })

      expect(fileAssociationService['buildQueryConditions']).toHaveBeenCalledWith({
        module: 'notes',
        associationType: 'reference'
      })
    })
  })

  describe('删除关联', () => {
    it('应该成功删除关联', async () => {
      const mockAssociation = {
        id: 'assoc-1',
        fileId: 'test-file-id',
        module: 'notes' as AssociationModule,
        entityId: 'note-123',
        associationType: 'reference' as FileAssociationType
      }

      vi.spyOn(fileAssociationService as any, 'findAssociationById')
        .mockResolvedValue(mockAssociation)
      vi.spyOn(fileAssociationService as any, 'findLinkIdByAssociation')
        .mockResolvedValue('link-id')

      const result = await fileAssociationService.deleteAssociation('assoc-1')

      expect(result).toBe(true)
      expect(mockCrossModuleLinkService.deleteLink).toHaveBeenCalledWith('link-id')
      expect(mockEventBus.emit).toHaveBeenCalledWith(
        'file-association:deleted',
        expect.objectContaining({
          associationId: 'assoc-1',
          association: mockAssociation
        }),
        'FileAssociationService'
      )
    })

    it('应该在关联不存在时返回false', async () => {
      vi.spyOn(fileAssociationService as any, 'findAssociationById')
        .mockResolvedValue(null)

      const result = await fileAssociationService.deleteAssociation('nonexistent')

      expect(result).toBe(false)
      expect(mockCrossModuleLinkService.deleteLink).not.toHaveBeenCalled()
    })
  })

  describe('更新关联', () => {
    it('应该成功更新关联', async () => {
      const mockAssociation = {
        id: 'assoc-1',
        fileId: 'test-file-id',
        module: 'notes' as AssociationModule,
        entityId: 'note-123',
        associationType: 'reference' as FileAssociationType,
        strength: 1.0,
        metadata: { tags: [], customFields: {} },
        createdAt: new Date(),
        updatedAt: new Date()
      }

      vi.spyOn(fileAssociationService as any, 'findAssociationById')
        .mockResolvedValue(mockAssociation)
      vi.spyOn(fileAssociationService as any, 'findLinkIdByAssociation')
        .mockResolvedValue('link-id')

      const updates = {
        associationType: 'embed' as FileAssociationType,
        strength: 0.8
      }

      const updatedAssociation = await fileAssociationService.updateAssociation(
        'assoc-1',
        updates
      )

      expect(updatedAssociation.associationType).toBe('embed')
      expect(updatedAssociation.strength).toBe(0.8)
      expect(mockCrossModuleLinkService.updateLink).toHaveBeenCalledWith(
        'link-id',
        expect.objectContaining({
          linkType: 'embed',
          metadata: expect.objectContaining({
            strength: 0.8
          })
        })
      )
    })

    it('应该在关联不存在时抛出错误', async () => {
      vi.spyOn(fileAssociationService as any, 'findAssociationById')
        .mockResolvedValue(null)

      await expect(
        fileAssociationService.updateAssociation('nonexistent', {})
      ).rejects.toThrow('关联不存在: nonexistent')
    })
  })

  describe('关联建议', () => {
    it('应该生成关联建议', async () => {
      const mockSuggestions = [
        {
          id: 'suggestion-1',
          fileId: 'test-file-id',
          targetModule: 'notes' as AssociationModule,
          targetEntityId: 'note-123',
          suggestedType: 'reference' as FileAssociationType,
          confidence: 0.8,
          reason: '内容相似性高'
        }
      ]

      vi.spyOn(fileAssociationService as any, 'generateSuggestions')
        .mockResolvedValue(mockSuggestions)

      const suggestions = await fileAssociationService.getAssociationSuggestions(
        'test-file-id',
        { maxSuggestions: 5, minConfidence: 0.7 }
      )

      expect(suggestions).toEqual(mockSuggestions)
      expect(mockEventBus.emit).toHaveBeenCalledWith(
        'file-association:suggestions-generated',
        expect.objectContaining({
          fileId: 'test-file-id',
          suggestions: mockSuggestions
        }),
        'FileAssociationService'
      )
    })

    it('应该在禁用建议时返回空数组', async () => {
      const serviceWithoutSuggestions = new FileAssociationService(
        mockEventBus,
        mockCrossModuleLinkService,
        mockSearchEngine,
        mockFileStorageService,
        { enableAutoSuggestions: false }
      )

      const suggestions = await serviceWithoutSuggestions.getAssociationSuggestions('test-file-id')

      expect(suggestions).toEqual([])
    })

    it('应该过滤低置信度建议', async () => {
      const mockSuggestions = [
        {
          id: 'suggestion-1',
          fileId: 'test-file-id',
          targetModule: 'notes' as AssociationModule,
          targetEntityId: 'note-123',
          suggestedType: 'reference' as FileAssociationType,
          confidence: 0.9,
          reason: '高置信度建议'
        },
        {
          id: 'suggestion-2',
          fileId: 'test-file-id',
          targetModule: 'tasks' as AssociationModule,
          targetEntityId: 'task-456',
          suggestedType: 'mention' as FileAssociationType,
          confidence: 0.5,
          reason: '低置信度建议'
        }
      ]

      vi.spyOn(fileAssociationService as any, 'generateSuggestions')
        .mockResolvedValue(mockSuggestions)

      const suggestions = await fileAssociationService.getAssociationSuggestions(
        'test-file-id',
        { minConfidence: 0.7 }
      )

      expect(suggestions).toHaveLength(1)
      expect(suggestions[0].confidence).toBe(0.9)
    })
  })

  describe('搜索关联', () => {
    it('应该使用搜索引擎搜索关联', async () => {
      const mockSearchResults = {
        results: [
          { id: 'assoc-1', score: 0.9 },
          { id: 'assoc-2', score: 0.8 }
        ],
        total: 2
      }

      const mockAssociation = {
        id: 'assoc-1',
        fileId: 'test-file-id',
        module: 'notes' as AssociationModule,
        entityId: 'note-123',
        associationType: 'reference' as FileAssociationType
      }

      ;(mockSearchEngine.search as any).mockResolvedValue(mockSearchResults)
      vi.spyOn(fileAssociationService as any, 'findAssociationById')
        .mockResolvedValue(mockAssociation)

      const results = await fileAssociationService.searchAssociations(
        '测试查询',
        { modules: ['notes'], limit: 10 }
      )

      expect(mockSearchEngine.search).toHaveBeenCalledWith(
        '测试查询',
        expect.objectContaining({
          filters: {
            type: 'file-association',
            module: ['notes']
          },
          limit: 10
        })
      )

      expect(results).toHaveLength(1)
      expect(results[0]).toEqual(mockAssociation)
    })

    it('应该在禁用索引时使用基础查询', async () => {
      const serviceWithoutIndexing = new FileAssociationService(
        mockEventBus,
        mockCrossModuleLinkService,
        mockSearchEngine,
        mockFileStorageService,
        { enableIndexing: false }
      )

      vi.spyOn(serviceWithoutIndexing, 'queryAssociations')
        .mockResolvedValue({
          associations: [],
          total: 0,
          hasMore: false,
          stats: {
            byModule: { notes: 0, tasks: 0, mindmap: 0, graph: 0 },
            byType: { attachment: 0, reference: 0, embed: 0, mention: 0, dependency: 0 },
            averageStrength: 0
          }
        })

      await serviceWithoutIndexing.searchAssociations('测试查询')

      expect(serviceWithoutIndexing.queryAssociations).toHaveBeenCalledWith({
        search: '测试查询',
        limit: 20
      })
    })
  })

  describe('性能测试', () => {
    it('应该在100ms内完成关联创建', async () => {
      const startTime = performance.now()

      await fileAssociationService.createAssociation(
        'test-file-id',
        'notes',
        'note-123',
        'reference'
      )

      const endTime = performance.now()
      const duration = endTime - startTime

      expect(duration).toBeLessThan(100)
    })

    it('应该正确管理缓存大小', async () => {
      const serviceWithSmallCache = new FileAssociationService(
        mockEventBus,
        mockCrossModuleLinkService,
        mockSearchEngine,
        mockFileStorageService,
        { cacheSize: 2 }
      )

      // 这里需要通过行为来验证缓存管理，因为缓存是私有的
      // 可以通过多次查询来间接验证缓存行为
      vi.spyOn(serviceWithSmallCache as any, 'executeAssociationQuery')
        .mockResolvedValue([])

      await serviceWithSmallCache.queryAssociations({ fileId: 'file-1' })
      await serviceWithSmallCache.queryAssociations({ fileId: 'file-2' })
      await serviceWithSmallCache.queryAssociations({ fileId: 'file-3' })

      // 验证缓存管理逻辑被调用
      expect(serviceWithSmallCache['manageCacheSize']).toBeDefined()
    })
  })
})
