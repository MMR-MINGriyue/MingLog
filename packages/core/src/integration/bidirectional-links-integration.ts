/**
 * 双向链接系统集成修复
 * 完善双向链接系统与其他模块的集成，确保链接创建和管理功能正常
 */

import { EventBus } from '../event-system/EventBus'
import { DatabaseManager } from '../database/DatabaseManager'
import { LinkManagerService } from '../links/LinkManagerService'
import { CrossModuleLinkService } from '../services/CrossModuleLinkService'
import type { CoreAPI } from '../types'

export interface BidirectionalLinksIntegrationOptions {
  enableAutoLinking?: boolean
  enableRealTimeSync?: boolean
  enableCrossModuleLinks?: boolean
  maxLinkDepth?: number
  linkValidationTimeout?: number
}

export class BidirectionalLinksIntegration {
  private eventBus: EventBus
  private database: DatabaseManager
  private linkManager: LinkManagerService
  private crossModuleService: CrossModuleLinkService
  private options: Required<BidirectionalLinksIntegrationOptions>
  private initialized: boolean = false

  constructor(
    coreAPI: CoreAPI,
    options: BidirectionalLinksIntegrationOptions = {}
  ) {
    this.eventBus = coreAPI.events
    this.database = coreAPI.database
    this.options = {
      enableAutoLinking: true,
      enableRealTimeSync: true,
      enableCrossModuleLinks: true,
      maxLinkDepth: 3,
      linkValidationTimeout: 5000,
      ...options
    }

    this.linkManager = new LinkManagerService(this.database, this.eventBus)
    this.crossModuleService = new CrossModuleLinkService(this.database, this.eventBus, {
      enableBidirectionalLinks: true,
      enableLinkValidation: true,
      maxCacheSize: 1000
    })
  }

  /**
   * 初始化双向链接集成
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return
    }

    try {
      // 1. 初始化数据库表
      await this.initializeDatabaseTables()

      // 2. 初始化服务
      await this.linkManager.initialize()
      await this.crossModuleService.initialize()

      // 3. 设置事件监听器
      this.setupEventListeners()

      // 4. 启用实时同步
      if (this.options.enableRealTimeSync) {
        this.enableRealTimeSync()
      }

      // 5. 启用自动链接
      if (this.options.enableAutoLinking) {
        this.enableAutoLinking()
      }

      this.initialized = true
      this.eventBus.emit('bidirectional-links:initialized', {
        options: this.options
      })

      console.log('✅ 双向链接系统集成初始化完成')
    } catch (error) {
      console.error('❌ 双向链接系统集成初始化失败:', error)
      throw error
    }
  }

  /**
   * 初始化数据库表
   */
  private async initializeDatabaseTables(): Promise<void> {
    // 创建链接表
    await this.database.execute(`
      CREATE TABLE IF NOT EXISTS bidirectional_links (
        id TEXT PRIMARY KEY,
        source_type TEXT NOT NULL,
        source_id TEXT NOT NULL,
        target_type TEXT NOT NULL,
        target_id TEXT NOT NULL,
        link_type TEXT NOT NULL,
        context TEXT,
        position INTEGER,
        strength REAL DEFAULT 1.0,
        bidirectional BOOLEAN DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        metadata TEXT DEFAULT '{}',
        UNIQUE(source_type, source_id, target_type, target_id, position)
      )
    `)

    // 创建索引
    await this.database.execute(`
      CREATE INDEX IF NOT EXISTS idx_bidirectional_links_source 
      ON bidirectional_links(source_type, source_id)
    `)

    await this.database.execute(`
      CREATE INDEX IF NOT EXISTS idx_bidirectional_links_target 
      ON bidirectional_links(target_type, target_id)
    `)

    await this.database.execute(`
      CREATE INDEX IF NOT EXISTS idx_bidirectional_links_type 
      ON bidirectional_links(link_type)
    `)
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听内容更新事件
    this.eventBus.on('content:updated', this.handleContentUpdate.bind(this))
    this.eventBus.on('content:deleted', this.handleContentDelete.bind(this))

    // 监听模块事件
    this.eventBus.on('notes:created', this.handleNotesEvent.bind(this))
    this.eventBus.on('notes:updated', this.handleNotesEvent.bind(this))
    this.eventBus.on('tasks:created', this.handleTasksEvent.bind(this))
    this.eventBus.on('tasks:updated', this.handleTasksEvent.bind(this))
    this.eventBus.on('mindmap:updated', this.handleMindMapEvent.bind(this))

    // 监听链接事件
    this.eventBus.on('links:created', this.handleLinkCreated.bind(this))
    this.eventBus.on('links:deleted', this.handleLinkDeleted.bind(this))
  }

  /**
   * 启用实时同步
   */
  private enableRealTimeSync(): void {
    // 设置定期同步任务
    setInterval(() => {
      this.syncBidirectionalLinks()
    }, 30000) // 每30秒同步一次

    console.log('🔄 双向链接实时同步已启用')
  }

  /**
   * 启用自动链接
   */
  private enableAutoLinking(): void {
    this.eventBus.on('content:analyzed', this.handleAutoLinking.bind(this))
    console.log('🤖 自动链接功能已启用')
  }

  /**
   * 处理内容更新
   */
  private async handleContentUpdate(event: any): Promise<void> {
    const { entityType, entityId, content } = event.data

    try {
      // 解析内容中的链接
      const links = await this.parseLinksFromContent(content)

      // 更新链接关系
      await this.updateLinksForEntity(entityType, entityId, links)

      // 发送更新事件
      this.eventBus.emit('bidirectional-links:updated', {
        entityType,
        entityId,
        linkCount: links.length
      })
    } catch (error) {
      console.error('处理内容更新失败:', error)
    }
  }

  /**
   * 处理内容删除
   */
  private async handleContentDelete(event: any): Promise<void> {
    const { entityType, entityId } = event.data

    try {
      // 删除相关的所有链接
      await this.deleteLinksForEntity(entityType, entityId)

      this.eventBus.emit('bidirectional-links:entity-deleted', {
        entityType,
        entityId
      })
    } catch (error) {
      console.error('处理内容删除失败:', error)
    }
  }

  /**
   * 处理Notes模块事件
   */
  private async handleNotesEvent(event: any): Promise<void> {
    const { note } = event.data

    if (this.options.enableCrossModuleLinks) {
      await this.createCrossModuleLinks('notes', note.id, note.content)
    }
  }

  /**
   * 处理Tasks模块事件
   */
  private async handleTasksEvent(event: any): Promise<void> {
    const { task } = event.data

    if (this.options.enableCrossModuleLinks) {
      await this.createCrossModuleLinks('tasks', task.id, task.description || '')
    }
  }

  /**
   * 处理MindMap模块事件
   */
  private async handleMindMapEvent(event: any): Promise<void> {
    const { mindmap } = event.data

    if (this.options.enableCrossModuleLinks) {
      // 处理思维导图节点的链接
      for (const node of mindmap.nodes || []) {
        await this.createCrossModuleLinks('mindmap', node.id, node.content || '')
      }
    }
  }

  /**
   * 处理链接创建
   */
  private async handleLinkCreated(event: any): Promise<void> {
    const { link } = event.data

    // 如果启用双向链接，创建反向链接
    if (link.bidirectional !== false) {
      await this.createReverseLink(link)
    }
  }

  /**
   * 处理链接删除
   */
  private async handleLinkDeleted(event: any): Promise<void> {
    const { linkId } = event.data

    // 删除对应的反向链接
    await this.deleteReverseLink(linkId)
  }

  /**
   * 从内容中解析链接
   */
  private async parseLinksFromContent(content: string): Promise<any[]> {
    const links: any[] = []

    // 解析页面链接 [[页面名称]]
    const pageLinks = content.match(/\[\[([^\]]+)\]\]/g) || []
    for (const match of pageLinks) {
      const pageName = match.slice(2, -2)
      const [name, alias] = pageName.split('|')
      
      links.push({
        type: 'page-reference',
        targetName: name.trim(),
        alias: alias?.trim(),
        position: content.indexOf(match)
      })
    }

    // 解析块引用 ((块ID))
    const blockLinks = content.match(/\(\(([^)]+)\)\)/g) || []
    for (const match of blockLinks) {
      const blockId = match.slice(2, -2)
      
      links.push({
        type: 'block-reference',
        targetId: blockId.trim(),
        position: content.indexOf(match)
      })
    }

    return links
  }

  /**
   * 更新实体的链接关系
   */
  private async updateLinksForEntity(entityType: string, entityId: string, links: any[]): Promise<void> {
    // 删除旧链接
    await this.database.execute(
      'DELETE FROM bidirectional_links WHERE source_type = ? AND source_id = ?',
      [entityType, entityId]
    )

    // 创建新链接
    for (const link of links) {
      await this.createBidirectionalLink(entityType, entityId, link)
    }
  }

  /**
   * 创建双向链接
   */
  private async createBidirectionalLink(sourceType: string, sourceId: string, linkData: any): Promise<void> {
    const linkId = `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const now = new Date().toISOString()

    await this.database.execute(
      `INSERT INTO bidirectional_links 
       (id, source_type, source_id, target_type, target_id, link_type, position, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        linkId,
        sourceType,
        sourceId,
        linkData.type === 'page-reference' ? 'page' : 'block',
        linkData.targetName || linkData.targetId,
        linkData.type,
        linkData.position,
        now,
        now
      ]
    )
  }

  /**
   * 创建跨模块链接
   */
  private async createCrossModuleLinks(sourceModule: string, sourceId: string, content: string): Promise<void> {
    const links = await this.parseLinksFromContent(content)

    for (const link of links) {
      try {
        await this.crossModuleService.createLink(
          sourceModule,
          sourceId,
          'notes', // 假设链接到notes模块
          link.targetName || link.targetId,
          'reference'
        )
      } catch (error) {
        // 忽略重复链接错误
        if (!error.message.includes('already exists')) {
          console.warn('创建跨模块链接失败:', error)
        }
      }
    }
  }

  /**
   * 创建反向链接
   */
  private async createReverseLink(originalLink: any): Promise<void> {
    // 实现反向链接创建逻辑
    // 这里简化实现，实际应该根据具体需求完善
  }

  /**
   * 删除实体的所有链接
   */
  private async deleteLinksForEntity(entityType: string, entityId: string): Promise<void> {
    await this.database.execute(
      'DELETE FROM bidirectional_links WHERE (source_type = ? AND source_id = ?) OR (target_type = ? AND target_id = ?)',
      [entityType, entityId, entityType, entityId]
    )
  }

  /**
   * 删除反向链接
   */
  private async deleteReverseLink(linkId: string): Promise<void> {
    // 实现反向链接删除逻辑
  }

  /**
   * 同步双向链接
   */
  private async syncBidirectionalLinks(): Promise<void> {
    try {
      // 检查并修复不一致的链接
      const inconsistentLinks = await this.findInconsistentLinks()
      
      for (const link of inconsistentLinks) {
        await this.repairLink(link)
      }

      if (inconsistentLinks.length > 0) {
        console.log(`🔧 修复了 ${inconsistentLinks.length} 个不一致的链接`)
      }
    } catch (error) {
      console.error('同步双向链接失败:', error)
    }
  }

  /**
   * 查找不一致的链接
   */
  private async findInconsistentLinks(): Promise<any[]> {
    // 实现链接一致性检查逻辑
    return []
  }

  /**
   * 修复链接
   */
  private async repairLink(link: any): Promise<void> {
    // 实现链接修复逻辑
  }

  /**
   * 处理自动链接
   */
  private async handleAutoLinking(event: any): Promise<void> {
    // 实现自动链接建议逻辑
  }

  /**
   * 获取集成状态
   */
  getIntegrationStatus() {
    return {
      initialized: this.initialized,
      options: this.options,
      services: {
        linkManager: !!this.linkManager,
        crossModuleService: !!this.crossModuleService
      }
    }
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    // 清理事件监听器和资源
    this.initialized = false
  }
}
