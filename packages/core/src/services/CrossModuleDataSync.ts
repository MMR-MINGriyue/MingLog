/**
 * 跨模块数据同步服务
 * 负责保持模块间数据的一致性和同步
 */

import { EventBus } from '../event-system/EventBus'
import { DatabaseManager } from '../database/DatabaseManager'
import { CrossModuleLinkService, LinkReference } from './CrossModuleLinkService'

export interface SyncRule {
  id: string
  sourceModule: string
  targetModule: string
  sourceField: string
  targetField: string
  syncDirection: 'one-way' | 'two-way'
  transformer?: (value: any) => any
  condition?: (sourceData: any, targetData: any) => boolean
}

export interface SyncConflict {
  id: string
  sourceModule: string
  sourceId: string
  targetModule: string
  targetId: string
  field: string
  sourceValue: any
  targetValue: any
  timestamp: Date
}

export class CrossModuleDataSync {
  private eventBus: EventBus
  private database: DatabaseManager
  private linkService: CrossModuleLinkService
  private syncRules = new Map<string, SyncRule>()
  private conflictQueue: SyncConflict[] = []
  private isProcessing = false

  constructor(
    eventBus: EventBus,
    database: DatabaseManager,
    linkService: CrossModuleLinkService
  ) {
    this.eventBus = eventBus
    this.database = database
    this.linkService = linkService

    this.initializeDefaultRules()
    this.initializeEventListeners()
  }

  /**
   * 初始化默认同步规则
   */
  private initializeDefaultRules(): void {
    // Notes -> Tasks: 标题同步
    this.addSyncRule({
      id: 'notes-tasks-title',
      sourceModule: 'notes',
      targetModule: 'tasks',
      sourceField: 'title',
      targetField: 'title',
      syncDirection: 'one-way'
    })

    // Tasks -> Notes: 完成状态同步
    this.addSyncRule({
      id: 'tasks-notes-status',
      sourceModule: 'tasks',
      targetModule: 'notes',
      sourceField: 'status',
      targetField: 'metadata.taskStatus',
      syncDirection: 'one-way',
      transformer: (status) => ({ taskStatus: status, lastSync: new Date() })
    })

    // MindMap -> Notes: 节点文本同步
    this.addSyncRule({
      id: 'mindmap-notes-text',
      sourceModule: 'mindmap',
      targetModule: 'notes',
      sourceField: 'text',
      targetField: 'title',
      syncDirection: 'two-way'
    })

    // Notes -> MindMap: 标签同步
    this.addSyncRule({
      id: 'notes-mindmap-tags',
      sourceModule: 'notes',
      targetModule: 'mindmap',
      sourceField: 'tags',
      targetField: 'metadata.tags',
      syncDirection: 'one-way'
    })
  }

  /**
   * 添加同步规则
   */
  addSyncRule(rule: SyncRule): void {
    this.syncRules.set(rule.id, rule)
  }

  /**
   * 移除同步规则
   */
  removeSyncRule(ruleId: string): void {
    this.syncRules.delete(ruleId)
  }

  /**
   * 获取所有同步规则
   */
  getSyncRules(): SyncRule[] {
    return Array.from(this.syncRules.values())
  }

  /**
   * 同步特定链接的数据
   */
  async syncLinkedData(link: LinkReference): Promise<void> {
    const applicableRules = this.getApplicableRules(link.sourceModule, link.targetModule)
    
    for (const rule of applicableRules) {
      try {
        await this.applySyncRule(rule, link)
      } catch (error) {
        console.error(`Failed to apply sync rule ${rule.id}:`, error)
        
        // 记录同步错误
        this.eventBus.emit('cross-module:sync-error', {
          rule,
          link,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }
  }

  /**
   * 批量同步所有链接数据
   */
  async syncAllLinkedData(): Promise<void> {
    if (this.isProcessing) {
      console.warn('Sync already in progress')
      return
    }

    this.isProcessing = true
    
    try {
      // 获取所有链接
      const stats = await this.linkService.getLinkStats()
      let processedCount = 0

      // 分批处理以避免内存问题
      const batchSize = 50
      
      for (const [sourceModule, count] of Object.entries(stats.linksByModule)) {
        for (let offset = 0; offset < count; offset += batchSize) {
          const links = await this.getLinksBatch(sourceModule, offset, batchSize)
          
          for (const link of links) {
            await this.syncLinkedData(link)
            processedCount++
          }

          // 发送进度事件
          this.eventBus.emit('cross-module:sync-progress', {
            processed: processedCount,
            total: stats.totalLinks,
            percentage: Math.round((processedCount / stats.totalLinks) * 100)
          })
        }
      }

      // 处理冲突队列
      await this.processConflictQueue()

      this.eventBus.emit('cross-module:sync-completed', {
        processedCount,
        conflictCount: this.conflictQueue.length
      })

    } finally {
      this.isProcessing = false
    }
  }

  /**
   * 应用同步规则
   */
  private async applySyncRule(rule: SyncRule, link: LinkReference): Promise<void> {
    // 获取源数据
    const sourceData = await this.getModuleData(link.sourceModule, link.sourceId)
    if (!sourceData) return

    // 获取目标数据
    const targetData = await this.getModuleData(link.targetModule, link.targetId)
    if (!targetData) return

    // 检查条件
    if (rule.condition && !rule.condition(sourceData, targetData)) {
      return
    }

    // 获取源值
    const sourceValue = this.getNestedValue(sourceData, rule.sourceField)
    if (sourceValue === undefined) return

    // 转换值
    const transformedValue = rule.transformer ? rule.transformer(sourceValue) : sourceValue

    // 获取当前目标值
    const currentTargetValue = this.getNestedValue(targetData, rule.targetField)

    // 检查是否需要更新
    if (this.valuesEqual(currentTargetValue, transformedValue)) {
      return
    }

    // 检查冲突（双向同步时）
    if (rule.syncDirection === 'two-way') {
      const conflict = this.detectConflict(rule, link, sourceValue, currentTargetValue)
      if (conflict) {
        this.conflictQueue.push(conflict)
        return
      }
    }

    // 更新目标数据
    await this.updateModuleData(
      link.targetModule,
      link.targetId,
      rule.targetField,
      transformedValue
    )

    // 发送同步事件
    this.eventBus.emit('cross-module:data-synced', {
      rule,
      link,
      field: rule.targetField,
      oldValue: currentTargetValue,
      newValue: transformedValue
    })
  }

  /**
   * 获取适用的同步规则
   */
  private getApplicableRules(sourceModule: string, targetModule: string): SyncRule[] {
    return Array.from(this.syncRules.values()).filter(rule =>
      rule.sourceModule === sourceModule && rule.targetModule === targetModule
    )
  }

  /**
   * 获取模块数据
   */
  private async getModuleData(module: string, itemId: string): Promise<any> {
    let tableName: string
    switch (module) {
      case 'notes':
        tableName = 'notes'
        break
      case 'tasks':
        tableName = 'tasks'
        break
      case 'mindmap':
        tableName = 'mindmap_nodes'
        break
      default:
        return null
    }

    const results = await this.database.query(
      `SELECT * FROM ${tableName} WHERE id = ?`,
      [itemId]
    )

    return results.length > 0 ? results[0] : null
  }

  /**
   * 更新模块数据
   */
  private async updateModuleData(
    module: string,
    itemId: string,
    field: string,
    value: any
  ): Promise<void> {
    let tableName: string
    switch (module) {
      case 'notes':
        tableName = 'notes'
        break
      case 'tasks':
        tableName = 'tasks'
        break
      case 'mindmap':
        tableName = 'mindmap_nodes'
        break
      default:
        throw new Error(`Unknown module: ${module}`)
    }

    // 处理嵌套字段
    if (field.includes('.')) {
      // 对于嵌套字段，需要特殊处理
      const [rootField, ...nestedPath] = field.split('.')
      const currentData = await this.getModuleData(module, itemId)
      const rootValue = currentData[rootField] || {}
      
      this.setNestedValue(rootValue, nestedPath.join('.'), value)
      
      await this.database.execute(
        `UPDATE ${tableName} SET ${rootField} = ?, updated_at = ? WHERE id = ?`,
        [JSON.stringify(rootValue), new Date().toISOString(), itemId]
      )
    } else {
      // 简单字段直接更新
      await this.database.execute(
        `UPDATE ${tableName} SET ${field} = ?, updated_at = ? WHERE id = ?`,
        [value, new Date().toISOString(), itemId]
      )
    }
  }

  /**
   * 获取嵌套值
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      if (current && typeof current === 'object') {
        return current[key]
      }
      return undefined
    }, obj)
  }

  /**
   * 设置嵌套值
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.')
    const lastKey = keys.pop()!
    
    const target = keys.reduce((current, key) => {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {}
      }
      return current[key]
    }, obj)
    
    target[lastKey] = value
  }

  /**
   * 比较值是否相等
   */
  private valuesEqual(a: any, b: any): boolean {
    if (a === b) return true
    if (a == null || b == null) return a === b
    if (typeof a !== typeof b) return false
    
    if (typeof a === 'object') {
      return JSON.stringify(a) === JSON.stringify(b)
    }
    
    return false
  }

  /**
   * 检测同步冲突
   */
  private detectConflict(
    rule: SyncRule,
    link: LinkReference,
    sourceValue: any,
    targetValue: any
  ): SyncConflict | null {
    // 简单的冲突检测：如果两个值都不为空且不相等，则认为有冲突
    if (sourceValue != null && targetValue != null && !this.valuesEqual(sourceValue, targetValue)) {
      return {
        id: `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sourceModule: link.sourceModule,
        sourceId: link.sourceId,
        targetModule: link.targetModule,
        targetId: link.targetId,
        field: rule.targetField,
        sourceValue,
        targetValue,
        timestamp: new Date()
      }
    }
    
    return null
  }

  /**
   * 处理冲突队列
   */
  private async processConflictQueue(): Promise<void> {
    for (const conflict of this.conflictQueue) {
      // 发送冲突事件，让用户或其他系统处理
      this.eventBus.emit('cross-module:sync-conflict', { conflict })
    }
    
    // 清空队列
    this.conflictQueue = []
  }

  /**
   * 获取链接批次
   */
  private async getLinksBatch(
    sourceModule: string,
    offset: number,
    limit: number
  ): Promise<LinkReference[]> {
    const results = await this.database.query(
      `SELECT * FROM cross_module_links 
       WHERE source_module = ? 
       ORDER BY created_at 
       LIMIT ? OFFSET ?`,
      [sourceModule, limit, offset]
    )

    return results.map(this.mapRowToLink)
  }

  /**
   * 将数据库行映射为链接对象
   */
  private mapRowToLink(row: any): LinkReference {
    return {
      id: row.id,
      sourceModule: row.source_module,
      sourceId: row.source_id,
      targetModule: row.target_module,
      targetId: row.target_id,
      linkType: row.link_type,
      metadata: JSON.parse(row.metadata || '{}'),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }
  }

  /**
   * 初始化事件监听器
   */
  private initializeEventListeners(): void {
    // 监听数据更新事件，触发同步
    this.eventBus.on('data:updated', async (event) => {
      const { type, id } = event.data
      let module: string

      switch (type) {
        case 'note':
          module = 'notes'
          break
        case 'task':
          module = 'tasks'
          break
        case 'mindmap-node':
          module = 'mindmap'
          break
        default:
          return
      }

      // 获取相关链接并同步
      const { outgoing } = await this.linkService.getLinksForItem(module, id)
      for (const link of outgoing) {
        await this.syncLinkedData(link)
      }
    })

    // 监听链接创建事件，立即同步
    this.eventBus.on('cross-module:link-created', async (event) => {
      const { link } = event.data
      await this.syncLinkedData(link)
    })
  }
}
