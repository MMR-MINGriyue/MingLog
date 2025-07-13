/**
 * 跨模块数据链接服务
 * 负责管理Notes、Tasks、MindMap之间的双向链接和数据引用
 */

import { EventBus } from '../event-system/EventBus'
import { DatabaseManager } from '../database/DatabaseManager'
import { Link, CreateLinkRequest, LinkType, SourceType, TargetType } from '../types/links'

export interface CrossModuleLinkOptions {
  enableAutoSync?: boolean
  enableBidirectionalLinks?: boolean
  enableLinkValidation?: boolean
  cacheSize?: number
}

export interface LinkReference {
  id: string
  sourceModule: string
  sourceId: string
  targetModule: string
  targetId: string
  linkType: 'reference' | 'embed' | 'mention' | 'dependency'
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface ModuleDataItem {
  id: string
  module: string
  type: string
  title: string
  content?: string
  metadata?: Record<string, any>
}

export class CrossModuleLinkService {
  private eventBus: EventBus
  private database: DatabaseManager
  private options: CrossModuleLinkOptions
  private linkCache = new Map<string, LinkReference[]>()
  private reverseCache = new Map<string, LinkReference[]>()

  constructor(
    eventBus: EventBus,
    database: DatabaseManager,
    options: CrossModuleLinkOptions = {}
  ) {
    this.eventBus = eventBus
    this.database = database
    this.options = {
      enableAutoSync: true,
      enableBidirectionalLinks: true,
      enableLinkValidation: true,
      cacheSize: 1000,
      ...options
    }

    this.initializeEventListeners()
  }

  /**
   * 初始化数据库表
   */
  async initialize(): Promise<void> {
    await this.database.execute(`
      CREATE TABLE IF NOT EXISTS cross_module_links (
        id TEXT PRIMARY KEY,
        source_module TEXT NOT NULL,
        source_id TEXT NOT NULL,
        target_module TEXT NOT NULL,
        target_id TEXT NOT NULL,
        link_type TEXT NOT NULL,
        metadata TEXT DEFAULT '{}',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        UNIQUE(source_module, source_id, target_module, target_id, link_type)
      )
    `)

    await this.database.execute(`
      CREATE INDEX IF NOT EXISTS idx_cross_links_source 
      ON cross_module_links(source_module, source_id)
    `)

    await this.database.execute(`
      CREATE INDEX IF NOT EXISTS idx_cross_links_target 
      ON cross_module_links(target_module, target_id)
    `)

    await this.database.execute(`
      CREATE INDEX IF NOT EXISTS idx_cross_links_type 
      ON cross_module_links(link_type)
    `)
  }

  /**
   * 创建跨模块链接
   */
  async createLink(
    sourceModule: string,
    sourceId: string,
    targetModule: string,
    targetId: string,
    linkType: 'reference' | 'embed' | 'mention' | 'dependency',
    metadata: Record<string, any> = {}
  ): Promise<LinkReference> {
    // 验证链接
    if (this.options.enableLinkValidation) {
      await this.validateLink(sourceModule, sourceId, targetModule, targetId)
    }

    const linkId = `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date()

    const link: LinkReference = {
      id: linkId,
      sourceModule,
      sourceId,
      targetModule,
      targetId,
      linkType,
      metadata,
      createdAt: now,
      updatedAt: now
    }

    // 保存到数据库
    await this.database.execute(
      `INSERT INTO cross_module_links 
       (id, source_module, source_id, target_module, target_id, link_type, metadata, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        link.id,
        link.sourceModule,
        link.sourceId,
        link.targetModule,
        link.targetId,
        link.linkType,
        JSON.stringify(link.metadata),
        link.createdAt.toISOString(),
        link.updatedAt.toISOString()
      ]
    )

    // 更新缓存
    this.updateCache(link)

    // 创建双向链接
    if (this.options.enableBidirectionalLinks && linkType === 'reference') {
      await this.createReverseLink(link)
    }

    // 发送事件
    this.eventBus.emit('cross-module:link-created', {
      link,
      sourceModule,
      targetModule
    })

    return link
  }

  /**
   * 获取模块项的所有链接
   */
  async getLinksForItem(module: string, itemId: string): Promise<{
    outgoing: LinkReference[]
    incoming: LinkReference[]
  }> {
    // 检查缓存
    const cacheKey = `${module}:${itemId}`
    if (this.linkCache.has(cacheKey)) {
      const outgoing = this.linkCache.get(cacheKey) || []
      const incoming = this.reverseCache.get(cacheKey) || []
      return { outgoing, incoming }
    }

    // 查询数据库
    const outgoingResults = await this.database.query(
      `SELECT * FROM cross_module_links 
       WHERE source_module = ? AND source_id = ?
       ORDER BY created_at DESC`,
      [module, itemId]
    )

    const incomingResults = await this.database.query(
      `SELECT * FROM cross_module_links 
       WHERE target_module = ? AND target_id = ?
       ORDER BY created_at DESC`,
      [module, itemId]
    )

    const outgoing = outgoingResults.map(this.mapRowToLink)
    const incoming = incomingResults.map(this.mapRowToLink)

    // 更新缓存
    this.linkCache.set(cacheKey, outgoing)
    this.reverseCache.set(cacheKey, incoming)

    return { outgoing, incoming }
  }

  /**
   * 删除链接
   */
  async deleteLink(linkId: string): Promise<void> {
    const link = await this.getLinkById(linkId)
    if (!link) return

    await this.database.execute(
      'DELETE FROM cross_module_links WHERE id = ?',
      [linkId]
    )

    // 清除缓存
    this.clearCacheForItem(link.sourceModule, link.sourceId)
    this.clearCacheForItem(link.targetModule, link.targetId)

    // 发送事件
    this.eventBus.emit('cross-module:link-deleted', { link })
  }

  /**
   * 删除模块项的所有链接
   */
  async deleteLinksForItem(module: string, itemId: string): Promise<void> {
    await this.database.execute(
      `DELETE FROM cross_module_links 
       WHERE (source_module = ? AND source_id = ?) 
          OR (target_module = ? AND target_id = ?)`,
      [module, itemId, module, itemId]
    )

    // 清除缓存
    this.clearCacheForItem(module, itemId)

    // 发送事件
    this.eventBus.emit('cross-module:links-deleted', { module, itemId })
  }

  /**
   * 获取模块间的链接统计
   */
  async getLinkStats(): Promise<{
    totalLinks: number
    linksByModule: Record<string, number>
    linksByType: Record<string, number>
    topLinkedItems: Array<{ module: string; itemId: string; linkCount: number }>
  }> {
    const totalResult = await this.database.query(
      'SELECT COUNT(*) as count FROM cross_module_links'
    )

    const moduleResult = await this.database.query(`
      SELECT source_module as module, COUNT(*) as count 
      FROM cross_module_links 
      GROUP BY source_module
    `)

    const typeResult = await this.database.query(`
      SELECT link_type, COUNT(*) as count 
      FROM cross_module_links 
      GROUP BY link_type
    `)

    const topLinkedResult = await this.database.query(`
      SELECT target_module as module, target_id as item_id, COUNT(*) as link_count
      FROM cross_module_links
      GROUP BY target_module, target_id
      ORDER BY link_count DESC
      LIMIT 10
    `)

    return {
      totalLinks: totalResult[0]?.count || 0,
      linksByModule: Object.fromEntries(
        moduleResult.map((row: any) => [row.module, row.count])
      ),
      linksByType: Object.fromEntries(
        typeResult.map((row: any) => [row.link_type, row.count])
      ),
      topLinkedItems: topLinkedResult.map((row: any) => ({
        module: row.module,
        itemId: row.item_id,
        linkCount: row.link_count
      }))
    }
  }

  /**
   * 验证链接的有效性
   */
  private async validateLink(
    sourceModule: string,
    sourceId: string,
    targetModule: string,
    targetId: string
  ): Promise<void> {
    // 检查源和目标是否存在
    const sourceExists = await this.checkItemExists(sourceModule, sourceId)
    const targetExists = await this.checkItemExists(targetModule, targetId)

    if (!sourceExists) {
      throw new Error(`Source item ${sourceModule}:${sourceId} does not exist`)
    }

    if (!targetExists) {
      throw new Error(`Target item ${targetModule}:${targetId} does not exist`)
    }
  }

  /**
   * 检查模块项是否存在
   */
  private async checkItemExists(module: string, itemId: string): Promise<boolean> {
    // 根据模块类型查询相应的表
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
        return false
    }

    const result = await this.database.query(
      `SELECT 1 FROM ${tableName} WHERE id = ? LIMIT 1`,
      [itemId]
    )

    return result.length > 0
  }

  /**
   * 创建反向链接
   */
  private async createReverseLink(originalLink: LinkReference): Promise<void> {
    const reverseId = `reverse_${originalLink.id}`
    
    await this.database.execute(
      `INSERT OR IGNORE INTO cross_module_links 
       (id, source_module, source_id, target_module, target_id, link_type, metadata, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        reverseId,
        originalLink.targetModule,
        originalLink.targetId,
        originalLink.sourceModule,
        originalLink.sourceId,
        'reference',
        JSON.stringify({ ...originalLink.metadata, isReverse: true }),
        originalLink.createdAt.toISOString(),
        originalLink.updatedAt.toISOString()
      ]
    )
  }

  /**
   * 初始化事件监听器
   */
  private initializeEventListeners(): void {
    // 监听数据删除事件，自动清理链接
    this.eventBus.on('data:deleted', async (event) => {
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

      await this.deleteLinksForItem(module, id)
    })

    // 监听数据更新事件，同步链接信息
    this.eventBus.on('data:updated', async (event) => {
      if (this.options.enableAutoSync) {
        // 这里可以添加自动同步逻辑
      }
    })
  }

  /**
   * 更新缓存
   */
  private updateCache(link: LinkReference): void {
    const sourceKey = `${link.sourceModule}:${link.sourceId}`
    const targetKey = `${link.targetModule}:${link.targetId}`

    // 更新源缓存
    if (!this.linkCache.has(sourceKey)) {
      this.linkCache.set(sourceKey, [])
    }
    this.linkCache.get(sourceKey)!.push(link)

    // 更新目标缓存
    if (!this.reverseCache.has(targetKey)) {
      this.reverseCache.set(targetKey, [])
    }
    this.reverseCache.get(targetKey)!.push(link)

    // 限制缓存大小
    if (this.linkCache.size > (this.options.cacheSize || 1000)) {
      const firstKey = this.linkCache.keys().next().value
      this.linkCache.delete(firstKey)
    }
  }

  /**
   * 清除缓存
   */
  private clearCacheForItem(module: string, itemId: string): void {
    const key = `${module}:${itemId}`
    this.linkCache.delete(key)
    this.reverseCache.delete(key)
  }

  /**
   * 获取链接详情
   */
  private async getLinkById(linkId: string): Promise<LinkReference | null> {
    const results = await this.database.query(
      'SELECT * FROM cross_module_links WHERE id = ?',
      [linkId]
    )

    return results.length > 0 ? this.mapRowToLink(results[0]) : null
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
}
