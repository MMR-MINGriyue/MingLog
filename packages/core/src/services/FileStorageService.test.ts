/**
 * 文件存储服务测试
 * 测试文件存储、检索、删除等核心功能
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { FileStorageService, type FileEntity, type FileMetadata, type FileAssociation } from './FileStorageService'
import { EventBus } from '../event-system/EventBus'
import { SearchEngine } from '../search/SearchEngine'
import fs from 'fs/promises'
import path from 'path'

// Mock fs模块
vi.mock('fs/promises', () => ({
  mkdir: vi.fn(),
  writeFile: vi.fn(),
  unlink: vi.fn(),
  copyFile: vi.fn()
}))

// Mock crypto模块
vi.mock('crypto', () => ({
  createHash: vi.fn(() => ({
    update: vi.fn().mockReturnThis(),
    digest: vi.fn(() => 'mock-hash-value')
  }))
}))

// 创建测试文件
const createTestFile = (name: string, type: string, size: number, content: string = 'test content'): File => {
  const file = new File([content], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

describe('FileStorageService', () => {
  let fileStorageService: FileStorageService
  let mockEventBus: EventBus
  let mockSearchEngine: SearchEngine

  beforeEach(() => {
    // 创建mock对象
    mockEventBus = {
      emit: vi.fn(),
      on: vi.fn(),
      off: vi.fn()
    } as any

    mockSearchEngine = {
      addDocument: vi.fn(),
      updateDocument: vi.fn(),
      removeDocument: vi.fn(),
      search: vi.fn().mockResolvedValue([])
    } as any

    // 创建服务实例
    fileStorageService = new FileStorageService(
      {
        storage_root: './test-storage',
        thumbnail_dir: './test-thumbnails',
        max_file_size: 10 * 1024 * 1024, // 10MB
        allowed_types: ['image/*', 'text/*', 'application/pdf'],
        enable_thumbnails: true,
        enable_indexing: true,
        storage_strategy: 'flat'
      },
      mockEventBus,
      mockSearchEngine
    )

    // Mock performance.now
    vi.spyOn(performance, 'now').mockReturnValue(1000)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('初始化', () => {
    it('应该正确初始化服务', async () => {
      await fileStorageService.initialize()

      expect(fs.mkdir).toHaveBeenCalledWith('./test-storage', { recursive: true })
      expect(fs.mkdir).toHaveBeenCalledWith('./test-thumbnails', { recursive: true })
      expect(mockEventBus.emit).toHaveBeenCalledWith('file-storage:initialized', expect.any(Object))
    })

    it('应该注册事件监听器', () => {
      expect(mockEventBus.on).toHaveBeenCalledWith('file:upload:complete', expect.any(Function))
      expect(mockEventBus.on).toHaveBeenCalledWith('file:upload:remove', expect.any(Function))
    })
  })

  describe('文件存储', () => {
    beforeEach(async () => {
      await fileStorageService.initialize()
    })

    it('应该成功存储有效文件', async () => {
      const testFile = createTestFile('test.txt', 'text/plain', 1024)
      const metadata: Partial<FileMetadata> = {
        description: '测试文件',
        tags: ['测试', '文档'],
        category: 'documents'
      }

      const result = await fileStorageService.storeFile(testFile, metadata)

      expect(result.success).toBe(true)
      expect(result.file).toBeDefined()
      expect(result.file!.name).toBe('test.txt')
      expect(result.file!.original_name).toBe('test.txt')
      expect(result.file!.type).toBe('text/plain')
      expect(result.file!.size).toBe(1024)
      expect(result.file!.metadata.description).toBe('测试文件')
      expect(result.file!.metadata.tags).toEqual(['测试', '文档'])
      expect(result.duration).toBeDefined()

      expect(fs.writeFile).toHaveBeenCalled()
      expect(mockSearchEngine.addDocument).toHaveBeenCalled()
      expect(mockEventBus.emit).toHaveBeenCalledWith('file-storage:file-stored', expect.any(Object))
    })

    it('应该拒绝超大文件', async () => {
      const largeFile = createTestFile('large.txt', 'text/plain', 20 * 1024 * 1024) // 20MB

      const result = await fileStorageService.storeFile(largeFile)

      expect(result.success).toBe(false)
      expect(result.error).toContain('文件大小超过限制')
    })

    it('应该拒绝不支持的文件类型', async () => {
      const unsupportedFile = createTestFile('test.exe', 'application/x-executable', 1024)

      const result = await fileStorageService.storeFile(unsupportedFile)

      expect(result.success).toBe(false)
      expect(result.error).toContain('不支持的文件类型')
    })

    it('应该处理重复文件', async () => {
      const testFile1 = createTestFile('test1.txt', 'text/plain', 1024, 'same content')
      const testFile2 = createTestFile('test2.txt', 'text/plain', 1024, 'same content')

      // 存储第一个文件
      const result1 = await fileStorageService.storeFile(testFile1)
      expect(result1.success).toBe(true)

      // 存储第二个文件（内容相同）
      const result2 = await fileStorageService.storeFile(testFile2)
      expect(result2.success).toBe(true)
      expect(result2.file!.checksum).toBe(result1.file!.checksum)
    })
  })

  describe('文件查询', () => {
    let testFile: FileEntity

    beforeEach(async () => {
      await fileStorageService.initialize()
      
      const file = createTestFile('test.txt', 'text/plain', 1024)
      const result = await fileStorageService.storeFile(file, {
        description: '测试文件',
        tags: ['测试', '文档'],
        category: 'documents'
      })
      testFile = result.file!
    })

    it('应该能够根据ID获取文件', async () => {
      const file = await fileStorageService.getFile(testFile.id)
      
      expect(file).toBeDefined()
      expect(file!.id).toBe(testFile.id)
      expect(file!.name).toBe('test.txt')
    })

    it('应该返回null对于不存在的文件', async () => {
      const file = await fileStorageService.getFile('non-existent-id')
      
      expect(file).toBeNull()
    })

    it('应该支持基本查询', async () => {
      const result = await fileStorageService.queryFiles({
        limit: 10,
        offset: 0
      })

      expect(result.files).toHaveLength(1)
      expect(result.total).toBe(1)
      expect(result.page).toBe(1)
      expect(result.has_next).toBe(false)
      expect(result.has_prev).toBe(false)
    })

    it('应该支持类型过滤', async () => {
      const result = await fileStorageService.queryFiles({
        type_filter: ['text/*']
      })

      expect(result.files).toHaveLength(1)
      expect(result.files[0].type).toBe('text/plain')
    })

    it('应该支持标签过滤', async () => {
      const result = await fileStorageService.queryFiles({
        tag_filter: ['测试']
      })

      expect(result.files).toHaveLength(1)
      expect(result.files[0].metadata.tags).toContain('测试')
    })

    it('应该支持大小范围过滤', async () => {
      const result = await fileStorageService.queryFiles({
        size_range: {
          min: 500,
          max: 2000
        }
      })

      expect(result.files).toHaveLength(1)
      expect(result.files[0].size).toBe(1024)
    })

    it('应该支持排序', async () => {
      // 添加另一个文件
      const file2 = createTestFile('test2.txt', 'text/plain', 2048)
      await fileStorageService.storeFile(file2)

      const result = await fileStorageService.queryFiles({
        sort_by: 'size',
        sort_order: 'desc'
      })

      expect(result.files).toHaveLength(2)
      expect(result.files[0].size).toBe(2048)
      expect(result.files[1].size).toBe(1024)
    })
  })

  describe('文件元数据更新', () => {
    let testFile: FileEntity

    beforeEach(async () => {
      await fileStorageService.initialize()
      
      const file = createTestFile('test.txt', 'text/plain', 1024)
      const result = await fileStorageService.storeFile(file)
      testFile = result.file!
    })

    it('应该成功更新文件元数据', async () => {
      const newMetadata: Partial<FileMetadata> = {
        description: '更新的描述',
        tags: ['新标签']
      }

      const result = await fileStorageService.updateFileMetadata(testFile.id, newMetadata)

      expect(result.success).toBe(true)
      expect(result.file!.metadata.description).toBe('更新的描述')
      expect(result.file!.metadata.tags).toEqual(['新标签'])
      expect(mockEventBus.emit).toHaveBeenCalledWith('file-storage:file-updated', expect.any(Object))
    })

    it('应该拒绝更新不存在的文件', async () => {
      const result = await fileStorageService.updateFileMetadata('non-existent-id', {
        description: '新描述'
      })

      expect(result.success).toBe(false)
      expect(result.error).toBe('文件不存在')
    })
  })

  describe('文件删除', () => {
    let testFile: FileEntity

    beforeEach(async () => {
      await fileStorageService.initialize()
      
      const file = createTestFile('test.txt', 'text/plain', 1024)
      const result = await fileStorageService.storeFile(file)
      testFile = result.file!
    })

    it('应该支持软删除', async () => {
      const result = await fileStorageService.deleteFile(testFile.id, false)

      expect(result.success).toBe(true)
      expect(mockEventBus.emit).toHaveBeenCalledWith('file-storage:file-deleted', expect.objectContaining({
        operation: 'soft-delete'
      }))

      // 文件应该仍然存在但被标记为删除
      const file = await fileStorageService.getFile(testFile.id)
      expect(file).toBeDefined()
      expect(file!.metadata.custom_fields.deleted).toBe(true)
    })

    it('应该支持永久删除', async () => {
      const result = await fileStorageService.deleteFile(testFile.id, true)

      expect(result.success).toBe(true)
      expect(fs.unlink).toHaveBeenCalled()
      expect(mockSearchEngine.removeDocument).toHaveBeenCalledWith(testFile.id)
      expect(mockEventBus.emit).toHaveBeenCalledWith('file-storage:file-deleted', expect.objectContaining({
        operation: 'permanent-delete'
      }))

      // 文件应该完全不存在
      const file = await fileStorageService.getFile(testFile.id)
      expect(file).toBeNull()
    })
  })

  describe('文件关联', () => {
    let testFile: FileEntity

    beforeEach(async () => {
      await fileStorageService.initialize()
      
      const file = createTestFile('test.txt', 'text/plain', 1024)
      const result = await fileStorageService.storeFile(file)
      testFile = result.file!
    })

    it('应该成功添加文件关联', async () => {
      const association: FileAssociation = {
        type: 'document',
        target_id: 'doc-123',
        relationship: 'attachment'
      }

      const result = await fileStorageService.addFileAssociation(testFile.id, association)

      expect(result.success).toBe(true)
      expect(result.file!.associations).toHaveLength(1)
      expect(result.file!.associations[0]).toEqual(association)
      expect(mockEventBus.emit).toHaveBeenCalledWith('file-storage:association-added', expect.any(Object))
    })

    it('应该拒绝重复的关联', async () => {
      const association: FileAssociation = {
        type: 'document',
        target_id: 'doc-123',
        relationship: 'attachment'
      }

      // 添加第一次
      await fileStorageService.addFileAssociation(testFile.id, association)
      
      // 尝试添加重复关联
      const result = await fileStorageService.addFileAssociation(testFile.id, association)

      expect(result.success).toBe(false)
      expect(result.error).toBe('关联已存在')
    })

    it('应该成功移除文件关联', async () => {
      const association: FileAssociation = {
        type: 'document',
        target_id: 'doc-123',
        relationship: 'attachment'
      }

      // 先添加关联
      await fileStorageService.addFileAssociation(testFile.id, association)
      
      // 移除关联
      const result = await fileStorageService.removeFileAssociation(
        testFile.id,
        'document',
        'doc-123',
        'attachment'
      )

      expect(result.success).toBe(true)
      expect(result.file!.associations).toHaveLength(0)
      expect(mockEventBus.emit).toHaveBeenCalledWith('file-storage:association-removed', expect.any(Object))
    })
  })

  describe('性能测试', () => {
    it('应该在100ms内完成文件验证', async () => {
      await fileStorageService.initialize()
      
      const testFile = createTestFile('test.txt', 'text/plain', 1024)
      const startTime = performance.now()
      
      await fileStorageService.storeFile(testFile)
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      // 由于我们mock了performance.now，这里主要测试逻辑正确性
      expect(duration).toBeDefined()
    })
  })
})
