/**
 * 批量操作服务
 * 提供跨模块的统一批量操作功能
 */

import { EventEmitter } from 'events'
import { EntityType } from './DataAssociationService'

// 批量操作类型
export enum BatchOperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  MOVE = 'move',
  COPY = 'copy',
  TAG = 'tag',
  UNTAG = 'untag',
  EXPORT = 'export',
  IMPORT = 'import',
  ASSOCIATE = 'associate',
  DISASSOCIATE = 'disassociate',
  ARCHIVE = 'archive',
  RESTORE = 'restore'
}

// 批量操作状态
export enum BatchOperationStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  PAUSED = 'paused'
}

// 批量操作项
export interface BatchOperationItem {
  id: string
  entityType: EntityType
  entityId: string
  title: string
  content?: string
  metadata?: Record<string, any>
  selected: boolean
  processed?: boolean
  error?: string
}

// 批量操作参数
export interface BatchOperationParams {
  [key: string]: any
}

// 批量操作配置
export interface BatchOperationConfig {
  id: string
  name: string
  description: string
  type: BatchOperationType
  entityTypes: EntityType[]
  params: BatchOperationParams
  options: {
    parallel?: boolean
    batchSize?: number
    retryCount?: number
    validateBeforeExecute?: boolean
    createBackup?: boolean
    dryRun?: boolean
  }
}

// 批量操作结果
export interface BatchOperationResult {
  operationId: string
  status: BatchOperationStatus
  totalItems: number
  processedItems: number
  successCount: number
  failureCount: number
  skippedCount: number
  startTime: Date
  endTime?: Date
  duration?: number
  errors: Array<{
    itemId: string
    error: string
    details?: any
  }>
  warnings: Array<{
    itemId: string
    warning: string
    details?: any
  }>
  summary: string
  resultData?: any
}

// 批量操作进度
export interface BatchOperationProgress {
  operationId: string
  status: BatchOperationStatus
  currentItem: number
  totalItems: number
  percentage: number
  estimatedTimeRemaining?: number
  currentItemTitle?: string
  message?: string
}

// 批量操作处理器接口
export interface IBatchOperationHandler {
  canHandle(type: BatchOperationType, entityType: EntityType): boolean
  validate(items: BatchOperationItem[], params: BatchOperationParams): Promise<string[]>
  execute(items: BatchOperationItem[], params: BatchOperationParams, config: BatchOperationConfig): Promise<any[]>
  preview(items: BatchOperationItem[], params: BatchOperationParams): Promise<string>
}

/**
 * 批量操作服务实现
 */
export class BatchOperationService extends EventEmitter {
  private operations: Map<string, BatchOperationResult> = new Map()
  private handlers: Map<string, IBatchOperationHandler> = new Map()
  private runningOperations: Set<string> = new Set()

  constructor(private coreAPI?: any) {
    super()
    this.initializeBuiltInHandlers()
  }

  /**
   * 注册批量操作处理器
   */
  registerHandler(key: string, handler: IBatchOperationHandler): void {
    this.handlers.set(key, handler)
    console.log(`批量操作处理器已注册: ${key}`)
  }

  /**
   * 注销批量操作处理器
   */
  unregisterHandler(key: string): void {
    this.handlers.delete(key)
    console.log(`批量操作处理器已注销: ${key}`)
  }

  /**
   * 获取可用的批量操作
   */
  getAvailableOperations(entityType: EntityType): BatchOperationConfig[] {
    const operations: BatchOperationConfig[] = []

    // 通用操作
    operations.push(
      {
        id: 'bulk-delete',
        name: '批量删除',
        description: '删除选中的项目',
        type: BatchOperationType.DELETE,
        entityTypes: [entityType],
        params: {},
        options: {
          validateBeforeExecute: true,
          createBackup: true
        }
      },
      {
        id: 'bulk-tag',
        name: '批量添加标签',
        description: '为选中项目添加标签',
        type: BatchOperationType.TAG,
        entityTypes: [entityType],
        params: {
          tags: []
        },
        options: {
          parallel: true,
          batchSize: 50
        }
      },
      {
        id: 'bulk-export',
        name: '批量导出',
        description: '导出选中项目的数据',
        type: BatchOperationType.EXPORT,
        entityTypes: [entityType],
        params: {
          format: 'json',
          includeMetadata: true
        },
        options: {
          parallel: false
        }
      }
    )

    // 根据实体类型添加特定操作
    switch (entityType) {
      case EntityType.NOTE:
        operations.push({
          id: 'bulk-move-notes',
          name: '批量移动笔记',
          description: '将选中笔记移动到指定位置',
          type: BatchOperationType.MOVE,
          entityTypes: [EntityType.NOTE],
          params: {
            targetPath: ''
          },
          options: {
            validateBeforeExecute: true
          }
        })
        break

      case EntityType.TASK:
        operations.push({
          id: 'bulk-update-status',
          name: '批量更新状态',
          description: '批量更新任务状态',
          type: BatchOperationType.UPDATE,
          entityTypes: [EntityType.TASK],
          params: {
            status: 'completed'
          },
          options: {
            parallel: true,
            batchSize: 100
          }
        })
        break
    }

    return operations
  }

  /**
   * 验证批量操作
   */
  async validateOperation(
    items: BatchOperationItem[],
    config: BatchOperationConfig
  ): Promise<string[]> {
    const errors: string[] = []

    // 基础验证
    if (items.length === 0) {
      errors.push('没有选中任何项目')
      return errors
    }

    if (items.length > 10000) {
      errors.push('选中项目过多，请分批处理')
    }

    // 实体类型验证
    const invalidItems = items.filter(item => 
      !config.entityTypes.includes(item.entityType)
    )
    if (invalidItems.length > 0) {
      errors.push(`${invalidItems.length} 个项目的类型不支持此操作`)
    }

    // 使用处理器验证
    const handler = this.findHandler(config.type, items[0]?.entityType)
    if (handler) {
      const handlerErrors = await handler.validate(items, config.params)
      errors.push(...handlerErrors)
    }

    return errors
  }

  /**
   * 预览批量操作
   */
  async previewOperation(
    items: BatchOperationItem[],
    config: BatchOperationConfig
  ): Promise<string> {
    const handler = this.findHandler(config.type, items[0]?.entityType)
    if (!handler) {
      return '未找到对应的操作处理器'
    }

    return handler.preview(items, config.params)
  }

  /**
   * 执行批量操作
   */
  async executeOperation(
    items: BatchOperationItem[],
    config: BatchOperationConfig
  ): Promise<string> {
    const operationId = this.generateOperationId()
    
    // 创建操作结果
    const result: BatchOperationResult = {
      operationId,
      status: BatchOperationStatus.PENDING,
      totalItems: items.length,
      processedItems: 0,
      successCount: 0,
      failureCount: 0,
      skippedCount: 0,
      startTime: new Date(),
      errors: [],
      warnings: [],
      summary: ''
    }

    this.operations.set(operationId, result)
    this.runningOperations.add(operationId)

    // 异步执行操作
    this.executeOperationAsync(operationId, items, config).catch(error => {
      console.error(`批量操作执行失败 (${operationId}):`, error)
      result.status = BatchOperationStatus.FAILED
      result.summary = `操作失败: ${error.message}`
      this.operations.set(operationId, result)
      this.runningOperations.delete(operationId)
    })

    return operationId
  }

  /**
   * 获取操作结果
   */
  getOperationResult(operationId: string): BatchOperationResult | null {
    return this.operations.get(operationId) || null
  }

  /**
   * 获取操作进度
   */
  getOperationProgress(operationId: string): BatchOperationProgress | null {
    const result = this.operations.get(operationId)
    if (!result) return null

    const percentage = result.totalItems > 0 
      ? Math.round((result.processedItems / result.totalItems) * 100)
      : 0

    return {
      operationId,
      status: result.status,
      currentItem: result.processedItems,
      totalItems: result.totalItems,
      percentage,
      message: result.summary
    }
  }

  /**
   * 取消操作
   */
  async cancelOperation(operationId: string): Promise<boolean> {
    const result = this.operations.get(operationId)
    if (!result || result.status !== BatchOperationStatus.RUNNING) {
      return false
    }

    result.status = BatchOperationStatus.CANCELLED
    result.endTime = new Date()
    result.duration = result.endTime.getTime() - result.startTime.getTime()
    result.summary = '操作已取消'

    this.operations.set(operationId, result)
    this.runningOperations.delete(operationId)

    // 发送事件
    this.emit('operation:cancelled', { operationId, result })

    return true
  }

  /**
   * 清理完成的操作
   */
  cleanupCompletedOperations(olderThanHours: number = 24): number {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000)
    let cleanedCount = 0

    for (const [operationId, result] of this.operations) {
      if (
        result.status === BatchOperationStatus.COMPLETED ||
        result.status === BatchOperationStatus.FAILED ||
        result.status === BatchOperationStatus.CANCELLED
      ) {
        if (result.endTime && result.endTime < cutoffTime) {
          this.operations.delete(operationId)
          cleanedCount++
        }
      }
    }

    return cleanedCount
  }

  /**
   * 获取操作统计
   */
  getOperationStatistics(): {
    total: number
    running: number
    completed: number
    failed: number
    cancelled: number
  } {
    const stats = {
      total: this.operations.size,
      running: 0,
      completed: 0,
      failed: 0,
      cancelled: 0
    }

    for (const result of this.operations.values()) {
      switch (result.status) {
        case BatchOperationStatus.RUNNING:
          stats.running++
          break
        case BatchOperationStatus.COMPLETED:
          stats.completed++
          break
        case BatchOperationStatus.FAILED:
          stats.failed++
          break
        case BatchOperationStatus.CANCELLED:
          stats.cancelled++
          break
      }
    }

    return stats
  }

  // 私有方法

  private async executeOperationAsync(
    operationId: string,
    items: BatchOperationItem[],
    config: BatchOperationConfig
  ): Promise<void> {
    const result = this.operations.get(operationId)!
    
    try {
      result.status = BatchOperationStatus.RUNNING
      this.operations.set(operationId, result)

      // 发送开始事件
      this.emit('operation:started', { operationId, result })

      // 查找处理器
      const handler = this.findHandler(config.type, items[0]?.entityType)
      if (!handler) {
        throw new Error('未找到对应的操作处理器')
      }

      // 执行验证
      if (config.options.validateBeforeExecute) {
        const errors = await this.validateOperation(items, config)
        if (errors.length > 0) {
          throw new Error(`验证失败: ${errors.join(', ')}`)
        }
      }

      // 创建备份
      if (config.options.createBackup) {
        await this.createBackup(items, operationId)
      }

      // 执行操作
      const batchSize = config.options.batchSize || 10
      const parallel = config.options.parallel || false

      if (parallel) {
        await this.executeParallel(handler, items, config, result, batchSize)
      } else {
        await this.executeSequential(handler, items, config, result, batchSize)
      }

      // 完成操作
      result.status = BatchOperationStatus.COMPLETED
      result.endTime = new Date()
      result.duration = result.endTime.getTime() - result.startTime.getTime()
      result.summary = `成功处理 ${result.successCount} 个项目${result.failureCount > 0 ? `，${result.failureCount} 个失败` : ''}`

      this.operations.set(operationId, result)
      this.runningOperations.delete(operationId)

      // 发送完成事件
      this.emit('operation:completed', { operationId, result })

    } catch (error) {
      result.status = BatchOperationStatus.FAILED
      result.endTime = new Date()
      result.duration = result.endTime ? result.endTime.getTime() - result.startTime.getTime() : 0
      result.summary = `操作失败: ${error instanceof Error ? error.message : '未知错误'}`

      // 添加错误到错误列表
      result.errors.push({
        itemId: 'operation',
        error: error instanceof Error ? error.message : '未知错误',
        details: error instanceof Error ? error.stack : undefined
      })

      this.operations.set(operationId, result)
      this.runningOperations.delete(operationId)

      // 发送失败事件
      this.emit('operation:failed', { operationId, result, error })
    }
  }

  private async executeSequential(
    handler: IBatchOperationHandler,
    items: BatchOperationItem[],
    config: BatchOperationConfig,
    result: BatchOperationResult,
    batchSize: number
  ): Promise<void> {
    for (let i = 0; i < items.length; i += batchSize) {
      // 检查是否已被取消
      if (result.status === BatchOperationStatus.CANCELLED) {
        return
      }

      const batch = items.slice(i, i + batchSize)

      try {
        await handler.execute(batch, config.params, config)
        result.successCount += batch.length
      } catch (error) {
        result.failureCount += batch.length
        batch.forEach(item => {
          result.errors.push({
            itemId: item.id,
            error: error instanceof Error ? error.message : '处理失败'
          })
        })
      }

      result.processedItems += batch.length
      this.operations.set(result.operationId, result)

      // 发送进度事件
      this.emit('operation:progress', {
        operationId: result.operationId,
        progress: this.getOperationProgress(result.operationId)
      })

      // 检查是否被取消
      const currentResult = this.operations.get(result.operationId)
      if (currentResult?.status === BatchOperationStatus.CANCELLED) {
        break
      }
    }
  }

  private async executeParallel(
    handler: IBatchOperationHandler,
    items: BatchOperationItem[],
    config: BatchOperationConfig,
    result: BatchOperationResult,
    batchSize: number
  ): Promise<void> {
    const batches: BatchOperationItem[][] = []
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize))
    }

    const promises = batches.map(async (batch) => {
      try {
        await handler.execute(batch, config.params, config)
        return { success: batch.length, errors: [] }
      } catch (error) {
        return {
          success: 0,
          errors: batch.map(item => ({
            itemId: item.id,
            error: error instanceof Error ? error.message : '处理失败'
          }))
        }
      }
    })

    const results = await Promise.all(promises)
    
    for (const batchResult of results) {
      result.successCount += batchResult.success
      result.failureCount += batchResult.errors.length
      result.errors.push(...batchResult.errors)
      result.processedItems += batchResult.success + batchResult.errors.length
    }

    this.operations.set(result.operationId, result)
  }

  private findHandler(type: BatchOperationType, entityType: EntityType): IBatchOperationHandler | null {
    for (const handler of this.handlers.values()) {
      if (handler.canHandle(type, entityType)) {
        return handler
      }
    }
    return null
  }

  private async createBackup(items: BatchOperationItem[], operationId: string): Promise<void> {
    // 简化的备份实现
    const backupData = {
      operationId,
      timestamp: new Date().toISOString(),
      items: items.map(item => ({
        id: item.id,
        entityType: item.entityType,
        entityId: item.entityId,
        title: item.title,
        content: item.content,
        metadata: item.metadata
      }))
    }

    // 在实际应用中，这里会保存到文件或数据库
    console.log(`创建备份 (${operationId}):`, backupData)
  }

  private initializeBuiltInHandlers(): void {
    // 注册内置处理器
    this.registerHandler('default-delete', new DefaultDeleteHandler())
    this.registerHandler('default-tag', new DefaultTagHandler())
    this.registerHandler('default-export', new DefaultExportHandler())
  }

  private generateOperationId(): string {
    return `batch_op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

// 默认删除处理器
class DefaultDeleteHandler implements IBatchOperationHandler {
  canHandle(type: BatchOperationType, entityType: EntityType): boolean {
    return type === BatchOperationType.DELETE
  }

  async validate(items: BatchOperationItem[], params: BatchOperationParams): Promise<string[]> {
    const errors: string[] = []
    
    if (items.length > 1000) {
      errors.push('一次删除的项目不能超过1000个')
    }

    return errors
  }

  async execute(items: BatchOperationItem[], params: BatchOperationParams, config: BatchOperationConfig): Promise<any[]> {
    // 模拟删除操作
    const results = []
    for (const item of items) {
      // 在实际应用中，这里会调用相应的删除API
      console.log(`删除项目: ${item.entityType}:${item.entityId}`)
      results.push({ id: item.id, deleted: true })
    }
    return results
  }

  async preview(items: BatchOperationItem[], params: BatchOperationParams): Promise<string> {
    return `将删除 ${items.length} 个项目:\n${items.map(item => `- ${item.title}`).join('\n')}`
  }
}

// 默认标签处理器
class DefaultTagHandler implements IBatchOperationHandler {
  canHandle(type: BatchOperationType, entityType: EntityType): boolean {
    return type === BatchOperationType.TAG
  }

  async validate(items: BatchOperationItem[], params: BatchOperationParams): Promise<string[]> {
    const errors: string[] = []
    
    if (!params.tags || !Array.isArray(params.tags) || params.tags.length === 0) {
      errors.push('请指定要添加的标签')
    }

    return errors
  }

  async execute(items: BatchOperationItem[], params: BatchOperationParams, config: BatchOperationConfig): Promise<any[]> {
    const results = []
    for (const item of items) {
      console.log(`为项目 ${item.entityType}:${item.entityId} 添加标签: ${params.tags.join(', ')}`)
      results.push({ id: item.id, tagsAdded: params.tags })
    }
    return results
  }

  async preview(items: BatchOperationItem[], params: BatchOperationParams): Promise<string> {
    return `将为 ${items.length} 个项目添加标签: ${params.tags.join(', ')}`
  }
}

// 默认导出处理器
class DefaultExportHandler implements IBatchOperationHandler {
  canHandle(type: BatchOperationType, entityType: EntityType): boolean {
    return type === BatchOperationType.EXPORT
  }

  async validate(items: BatchOperationItem[], params: BatchOperationParams): Promise<string[]> {
    const errors: string[] = []
    
    if (!params.format) {
      errors.push('请指定导出格式')
    }

    return errors
  }

  async execute(items: BatchOperationItem[], params: BatchOperationParams, config: BatchOperationConfig): Promise<any[]> {
    const exportData = items.map(item => ({
      id: item.entityId,
      type: item.entityType,
      title: item.title,
      content: item.content,
      metadata: params.includeMetadata ? item.metadata : undefined
    }))

    console.log(`导出 ${items.length} 个项目为 ${params.format} 格式`)
    return [{ format: params.format, data: exportData }]
  }

  async preview(items: BatchOperationItem[], params: BatchOperationParams): Promise<string> {
    return `将导出 ${items.length} 个项目为 ${params.format} 格式`
  }
}

export default BatchOperationService
