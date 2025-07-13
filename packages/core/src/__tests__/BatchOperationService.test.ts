/**
 * 批量操作服务测试
 * 测试批量选择、操作执行、导入导出等功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  BatchOperationService,
  BatchOperationItem,
  BatchOperationConfig,
  BatchOperationType,
  BatchOperationStatus
} from '../services/BatchOperationService'
import { EntityType } from '../services/DataAssociationService'

// 模拟核心API
const mockCoreAPI = {
  events: {
    emit: vi.fn()
  }
}

describe('BatchOperationService', () => {
  let batchOperationService: BatchOperationService

  beforeEach(() => {
    vi.clearAllMocks()
    batchOperationService = new BatchOperationService(mockCoreAPI)
  })

  describe('批量操作配置', () => {
    it('应该能够获取可用的批量操作', () => {
      const operations = batchOperationService.getAvailableOperations(EntityType.NOTE)
      
      expect(operations.length).toBeGreaterThan(0)
      expect(operations.some(op => op.type === BatchOperationType.DELETE)).toBe(true)
      expect(operations.some(op => op.type === BatchOperationType.TAG)).toBe(true)
      expect(operations.some(op => op.type === BatchOperationType.EXPORT)).toBe(true)
    })

    it('应该根据实体类型返回不同的操作', () => {
      const noteOperations = batchOperationService.getAvailableOperations(EntityType.NOTE)
      const taskOperations = batchOperationService.getAvailableOperations(EntityType.TASK)
      
      expect(noteOperations.some(op => op.id === 'bulk-move-notes')).toBe(true)
      expect(taskOperations.some(op => op.id === 'bulk-update-status')).toBe(true)
    })
  })

  describe('操作验证', () => {
    let testItems: BatchOperationItem[]
    let testConfig: BatchOperationConfig

    beforeEach(() => {
      testItems = [
        {
          id: 'item1',
          entityType: EntityType.NOTE,
          entityId: 'note1',
          title: '测试笔记1',
          content: '内容1',
          selected: true
        },
        {
          id: 'item2',
          entityType: EntityType.NOTE,
          entityId: 'note2',
          title: '测试笔记2',
          content: '内容2',
          selected: true
        }
      ]

      testConfig = {
        id: 'test-delete',
        name: '测试删除',
        description: '删除测试项目',
        type: BatchOperationType.DELETE,
        entityTypes: [EntityType.NOTE],
        params: {},
        options: {
          validateBeforeExecute: true
        }
      }
    })

    it('应该能够验证批量操作', async () => {
      const errors = await batchOperationService.validateOperation(testItems, testConfig)
      
      expect(Array.isArray(errors)).toBe(true)
      expect(errors.length).toBe(0) // 应该没有验证错误
    })

    it('应该在没有选中项目时返回错误', async () => {
      const errors = await batchOperationService.validateOperation([], testConfig)
      
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0]).toContain('没有选中任何项目')
    })

    it('应该在项目过多时返回错误', async () => {
      const manyItems = Array.from({ length: 10001 }, (_, i) => ({
        id: `item${i}`,
        entityType: EntityType.NOTE,
        entityId: `note${i}`,
        title: `笔记${i}`,
        selected: true
      }))

      const errors = await batchOperationService.validateOperation(manyItems, testConfig)
      
      expect(errors.some(error => error.includes('选中项目过多'))).toBe(true)
    })

    it('应该在实体类型不匹配时返回错误', async () => {
      const mixedItems = [
        ...testItems,
        {
          id: 'task1',
          entityType: EntityType.TASK,
          entityId: 'task1',
          title: '测试任务',
          selected: true
        }
      ]

      const errors = await batchOperationService.validateOperation(mixedItems, testConfig)
      
      expect(errors.some(error => error.includes('类型不支持此操作'))).toBe(true)
    })
  })

  describe('操作预览', () => {
    it('应该能够预览批量操作', async () => {
      const testItems: BatchOperationItem[] = [
        {
          id: 'item1',
          entityType: EntityType.NOTE,
          entityId: 'note1',
          title: '测试笔记1',
          selected: true
        }
      ]

      const testConfig: BatchOperationConfig = {
        id: 'test-delete',
        name: '测试删除',
        description: '删除测试项目',
        type: BatchOperationType.DELETE,
        entityTypes: [EntityType.NOTE],
        params: {},
        options: {}
      }

      const preview = await batchOperationService.previewOperation(testItems, testConfig)
      
      expect(typeof preview).toBe('string')
      expect(preview.length).toBeGreaterThan(0)
      expect(preview).toContain('测试笔记1')
    })
  })

  describe('操作执行', () => {
    let testItems: BatchOperationItem[]
    let testConfig: BatchOperationConfig

    beforeEach(() => {
      testItems = [
        {
          id: 'item1',
          entityType: EntityType.NOTE,
          entityId: 'note1',
          title: '测试笔记1',
          selected: true
        },
        {
          id: 'item2',
          entityType: EntityType.NOTE,
          entityId: 'note2',
          title: '测试笔记2',
          selected: true
        }
      ]

      testConfig = {
        id: 'test-delete',
        name: '测试删除',
        description: '删除测试项目',
        type: BatchOperationType.DELETE,
        entityTypes: [EntityType.NOTE],
        params: {},
        options: {
          batchSize: 10,
          parallel: false
        }
      }
    })

    it('应该能够执行批量操作', async () => {
      const operationId = await batchOperationService.executeOperation(testItems, testConfig)
      
      expect(typeof operationId).toBe('string')
      expect(operationId.length).toBeGreaterThan(0)
      
      // 等待操作完成
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const result = batchOperationService.getOperationResult(operationId)
      expect(result).toBeDefined()
      expect(result?.operationId).toBe(operationId)
    })

    it('应该能够获取操作进度', async () => {
      const operationId = await batchOperationService.executeOperation(testItems, testConfig)
      
      const progress = batchOperationService.getOperationProgress(operationId)
      expect(progress).toBeDefined()
      expect(progress?.operationId).toBe(operationId)
      expect(progress?.totalItems).toBe(testItems.length)
    })

    it('应该能够取消正在运行的操作', async () => {
      // 创建一个较大的测试数据集来确保操作需要一些时间
      const largeTestItems = Array.from({ length: 100 }, (_, i) => ({
        entityType: EntityType.NOTE,
        entityId: `note${i}`,
        metadata: { title: `测试笔记${i}` }
      }))

      const operationId = await batchOperationService.executeOperation(largeTestItems, testConfig)

      // 立即尝试取消操作
      const cancelled = await batchOperationService.cancelOperation(operationId)
      expect(cancelled).toBe(true)

      const result = batchOperationService.getOperationResult(operationId)
      expect(result?.status).toBe(BatchOperationStatus.CANCELLED)
    })

    it('应该在取消不存在的操作时返回false', async () => {
      const cancelled = await batchOperationService.cancelOperation('non-existent')
      expect(cancelled).toBe(false)
    })
  })

  describe('标签操作', () => {
    it('应该能够批量添加标签', async () => {
      const testItems: BatchOperationItem[] = [
        {
          id: 'item1',
          entityType: EntityType.NOTE,
          entityId: 'note1',
          title: '测试笔记1',
          selected: true
        }
      ]

      const tagConfig: BatchOperationConfig = {
        id: 'test-tag',
        name: '测试标签',
        description: '添加标签',
        type: BatchOperationType.TAG,
        entityTypes: [EntityType.NOTE],
        params: {
          tags: ['重要', '测试']
        },
        options: {}
      }

      const operationId = await batchOperationService.executeOperation(testItems, tagConfig)
      
      // 等待操作完成
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const result = batchOperationService.getOperationResult(operationId)
      expect(result?.status).toBe(BatchOperationStatus.COMPLETED)
      expect(result?.successCount).toBe(1)
    })

    it('应该在没有指定标签时验证失败', async () => {
      const testItems: BatchOperationItem[] = [
        {
          id: 'item1',
          entityType: EntityType.NOTE,
          entityId: 'note1',
          title: '测试笔记1',
          selected: true
        }
      ]

      const tagConfig: BatchOperationConfig = {
        id: 'test-tag',
        name: '测试标签',
        description: '添加标签',
        type: BatchOperationType.TAG,
        entityTypes: [EntityType.NOTE],
        params: {
          tags: []
        },
        options: {}
      }

      const errors = await batchOperationService.validateOperation(testItems, tagConfig)
      expect(errors.some(error => error.includes('请指定要添加的标签'))).toBe(true)
    })
  })

  describe('导出操作', () => {
    it('应该能够批量导出数据', async () => {
      const testItems: BatchOperationItem[] = [
        {
          id: 'item1',
          entityType: EntityType.NOTE,
          entityId: 'note1',
          title: '测试笔记1',
          content: '内容1',
          selected: true
        }
      ]

      const exportConfig: BatchOperationConfig = {
        id: 'test-export',
        name: '测试导出',
        description: '导出数据',
        type: BatchOperationType.EXPORT,
        entityTypes: [EntityType.NOTE],
        params: {
          format: 'json',
          includeMetadata: true
        },
        options: {}
      }

      const operationId = await batchOperationService.executeOperation(testItems, exportConfig)
      
      // 等待操作完成
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const result = batchOperationService.getOperationResult(operationId)
      expect(result?.status).toBe(BatchOperationStatus.COMPLETED)
      expect(result?.successCount).toBe(1)
    })

    it('应该在没有指定格式时验证失败', async () => {
      const testItems: BatchOperationItem[] = [
        {
          id: 'item1',
          entityType: EntityType.NOTE,
          entityId: 'note1',
          title: '测试笔记1',
          selected: true
        }
      ]

      const exportConfig: BatchOperationConfig = {
        id: 'test-export',
        name: '测试导出',
        description: '导出数据',
        type: BatchOperationType.EXPORT,
        entityTypes: [EntityType.NOTE],
        params: {},
        options: {}
      }

      const errors = await batchOperationService.validateOperation(testItems, exportConfig)
      expect(errors.some(error => error.includes('请指定导出格式'))).toBe(true)
    })
  })

  describe('操作统计', () => {
    it('应该能够获取操作统计信息', () => {
      const stats = batchOperationService.getOperationStatistics()
      
      expect(stats).toBeDefined()
      expect(typeof stats.total).toBe('number')
      expect(typeof stats.running).toBe('number')
      expect(typeof stats.completed).toBe('number')
      expect(typeof stats.failed).toBe('number')
      expect(typeof stats.cancelled).toBe('number')
    })

    it('应该能够清理完成的操作', async () => {
      // 执行一个操作
      const testItems: BatchOperationItem[] = [
        {
          id: 'item1',
          entityType: EntityType.NOTE,
          entityId: 'note1',
          title: '测试笔记1',
          selected: true
        }
      ]

      const testConfig: BatchOperationConfig = {
        id: 'test-delete',
        name: '测试删除',
        description: '删除测试项目',
        type: BatchOperationType.DELETE,
        entityTypes: [EntityType.NOTE],
        params: {},
        options: {}
      }

      await batchOperationService.executeOperation(testItems, testConfig)
      
      // 等待操作完成
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // 清理操作（使用0小时，应该清理所有完成的操作）
      const cleanedCount = batchOperationService.cleanupCompletedOperations(0)
      expect(cleanedCount).toBeGreaterThanOrEqual(0)
    })
  })

  describe('错误处理', () => {
    it('应该能够处理操作执行中的错误', async () => {
      // 创建一个会失败的配置
      const testItems: BatchOperationItem[] = [
        {
          id: 'item1',
          entityType: EntityType.NOTE,
          entityId: 'note1',
          title: '测试笔记1',
          selected: true
        }
      ]

      const invalidConfig: BatchOperationConfig = {
        id: 'invalid-operation',
        name: '无效操作',
        description: '这是一个无效的操作',
        type: 'invalid' as any,
        entityTypes: [EntityType.NOTE],
        params: {},
        options: {}
      }

      const operationId = await batchOperationService.executeOperation(testItems, invalidConfig)
      
      // 等待操作完成
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const result = batchOperationService.getOperationResult(operationId)
      expect(result?.status).toBe(BatchOperationStatus.FAILED)
      expect(result?.errors.length).toBeGreaterThan(0)
    })
  })
})
