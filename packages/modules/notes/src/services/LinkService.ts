/**
 * 双向链接服务
 * 
 * 功能：
 * - 链接的CRUD操作
 * - 反向链接查询
 * - 链接统计和分析
 * - 链接同步和更新
 */

import { CoreAPI } from '@minglog/core'
import { LinkRecord, PageReference, BacklinkInfo } from '../database/LinkDatabaseSchema'
import BiDirectionalLinkParser, { LinkMatch } from '../parsers/BiDirectionalLinkParser'

export interface CreateLinkRequest {
  /** 源类型 */
  source_type: 'page' | 'block'
  /** 源ID */
  source_id: string
  /** 目标类型 */
  target_type: 'page' | 'block'
  /** 目标ID */
  target_id: string
  /** 链接类型 */
  link_type: 'page-reference' | 'block-reference' | 'alias'
  /** 链接上下文 */
  context?: string
  /** 位置 */
  position?: number
  /** 显示文本 */
  display_text?: string
}

export interface UpdateLinkRequest {
  /** 链接ID */
  id: string
  /** 链接上下文 */
  context?: string
  /** 位置 */
  position?: number
  /** 显示文本 */
  display_text?: string
}

export interface LinkQueryOptions {
  /** 限制数量 */
  limit?: number
  /** 偏移量 */
  offset?: number
  /** 链接类型过滤 */
  link_type?: string
  /** 排序方式 */
  sort_by?: 'created_at' | 'position' | 'reference_count'
  /** 排序方向 */
  sort_order?: 'asc' | 'desc'
}

export interface SyncLinksRequest {
  /** 源类型 */
  source_type: 'page' | 'block'
  /** 源ID */
  source_id: string
  /** 源内容 */
  content: string
}

export class LinkService {
  constructor(private coreAPI: CoreAPI) {}

  /**
   * 创建链接
   */
  async createLink(request: CreateLinkRequest): Promise<LinkRecord> {
    const linkId = this.generateLinkId()
    const now = new Date().toISOString()

    const linkRecord: LinkRecord = {
      id: linkId,
      source_type: request.source_type,
      source_id: request.source_id,
      target_type: request.target_type,
      target_id: request.target_id,
      link_type: request.link_type,
      context: request.context,
      position: request.position,
      display_text: request.display_text,
      created_at: now,
      updated_at: now
    }

    // 插入链接记录
    await this.coreAPI.database.execute(
      `INSERT INTO links (
        id, source_type, source_id, target_type, target_id, 
        link_type, context, position, display_text, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        linkRecord.id,
        linkRecord.source_type,
        linkRecord.source_id,
        linkRecord.target_type,
        linkRecord.target_id,
        linkRecord.link_type,
        linkRecord.context,
        linkRecord.position,
        linkRecord.display_text,
        linkRecord.created_at,
        linkRecord.updated_at
      ]
    )

    // 发送链接创建事件
    this.coreAPI.events.emit('link:created', {
      link: linkRecord,
      source: { type: request.source_type, id: request.source_id },
      target: { type: request.target_type, id: request.target_id }
    })

    return linkRecord
  }

  /**
   * 获取链接
   */
  async getLink(id: string): Promise<LinkRecord | null> {
    const results = await this.coreAPI.database.query<LinkRecord>(
      'SELECT * FROM links WHERE id = ?',
      [id]
    )

    return results.length > 0 ? results[0] : null
  }

  /**
   * 更新链接
   */
  async updateLink(request: UpdateLinkRequest): Promise<LinkRecord> {
    const existingLink = await this.getLink(request.id)
    if (!existingLink) {
      throw new Error(`Link not found: ${request.id}`)
    }

    const updatedLink: LinkRecord = {
      ...existingLink,
      context: request.context ?? existingLink.context,
      position: request.position ?? existingLink.position,
      display_text: request.display_text ?? existingLink.display_text,
      updated_at: new Date().toISOString()
    }

    await this.coreAPI.database.execute(
      `UPDATE links SET 
        context = ?, position = ?, display_text = ?, updated_at = ?
       WHERE id = ?`,
      [
        updatedLink.context,
        updatedLink.position,
        updatedLink.display_text,
        updatedLink.updated_at,
        updatedLink.id
      ]
    )

    // 发送链接更新事件
    this.coreAPI.events.emit('link:updated', {
      link: updatedLink,
      previous: existingLink
    })

    return updatedLink
  }

  /**
   * 删除链接
   */
  async deleteLink(id: string): Promise<void> {
    const existingLink = await this.getLink(id)
    if (!existingLink) {
      throw new Error(`Link not found: ${id}`)
    }

    await this.coreAPI.database.execute(
      'DELETE FROM links WHERE id = ?',
      [id]
    )

    // 发送链接删除事件
    this.coreAPI.events.emit('link:deleted', {
      link: existingLink
    })
  }

  /**
   * 获取页面/块的所有出链
   */
  async getOutgoingLinks(
    sourceType: 'page' | 'block',
    sourceId: string,
    options: LinkQueryOptions = {}
  ): Promise<LinkRecord[]> {
    const {
      limit = 50,
      offset = 0,
      link_type,
      sort_by = 'position',
      sort_order = 'asc'
    } = options

    let sql = `
      SELECT * FROM links 
      WHERE source_type = ? AND source_id = ?
    `
    const params: any[] = [sourceType, sourceId]

    if (link_type) {
      sql += ' AND link_type = ?'
      params.push(link_type)
    }

    sql += ` ORDER BY ${sort_by} ${sort_order.toUpperCase()}`
    sql += ' LIMIT ? OFFSET ?'
    params.push(limit, offset)

    return this.coreAPI.database.query<LinkRecord>(sql, params)
  }

  /**
   * 获取页面/块的所有反向链接
   */
  async getBacklinks(
    targetType: 'page' | 'block',
    targetId: string,
    options: LinkQueryOptions = {}
  ): Promise<BacklinkInfo[]> {
    const {
      limit = 50,
      offset = 0,
      link_type,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = options

    let sql = `
      SELECT 
        l.id as link_id,
        l.source_type,
        l.source_id,
        l.context,
        l.position,
        l.display_text,
        l.created_at,
        CASE 
          WHEN l.source_type = 'page' THEN p.name
          WHEN l.source_type = 'block' THEN b.content
        END as source_title,
        CASE 
          WHEN l.source_type = 'page' THEN p.title
          WHEN l.source_type = 'block' THEN (
            SELECT p2.name FROM pages p2 WHERE p2.id = b.page_id
          )
        END as source_content
      FROM links l
      LEFT JOIN pages p ON l.source_type = 'page' AND l.source_id = p.id
      LEFT JOIN blocks b ON l.source_type = 'block' AND l.source_id = b.id
      WHERE l.target_type = ? AND l.target_id = ?
    `
    const params: any[] = [targetType, targetId]

    if (link_type) {
      sql += ' AND l.link_type = ?'
      params.push(link_type)
    }

    sql += ` ORDER BY l.${sort_by} ${sort_order.toUpperCase()}`
    sql += ' LIMIT ? OFFSET ?'
    params.push(limit, offset)

    const results = await this.coreAPI.database.query<any>(sql, params)

    return results.map(row => ({
      link_id: row.link_id,
      source: {
        type: row.source_type,
        id: row.source_id,
        title: row.source_title,
        content: row.source_content
      },
      context: row.context,
      position: row.position,
      display_text: row.display_text,
      created_at: row.created_at
    }))
  }

  /**
   * 同步内容中的链接
   * 解析内容中的双向链接并更新数据库
   */
  async syncLinks(request: SyncLinksRequest): Promise<{
    created: LinkRecord[]
    updated: LinkRecord[]
    deleted: LinkRecord[]
  }> {
    const { source_type, source_id, content } = request

    // 解析内容中的链接
    const parseResult = BiDirectionalLinkParser.parse(content)
    const newLinks = parseResult.links

    // 获取现有链接
    const existingLinks = await this.getOutgoingLinks(source_type, source_id)

    const created: LinkRecord[] = []
    const updated: LinkRecord[] = []
    const deleted: LinkRecord[] = []

    // 处理新链接
    for (const linkMatch of newLinks) {
      const existingLink = existingLinks.find(link => 
        link.target_id === linkMatch.pageName && 
        link.position === linkMatch.startIndex
      )

      if (existingLink) {
        // 更新现有链接
        const updatedLink = await this.updateLink({
          id: existingLink.id,
          context: linkMatch.fullMatch,
          position: linkMatch.startIndex,
          display_text: linkMatch.displayText
        })
        updated.push(updatedLink)
      } else {
        // 创建新链接
        const newLink = await this.createLink({
          source_type,
          source_id,
          target_type: 'page', // 假设链接到页面
          target_id: linkMatch.pageName,
          link_type: linkMatch.type === 'alias' ? 'alias' : 'page-reference',
          context: linkMatch.fullMatch,
          position: linkMatch.startIndex,
          display_text: linkMatch.displayText
        })
        created.push(newLink)
      }
    }

    // 删除不再存在的链接
    const newLinkPositions = new Set(newLinks.map(link => link.startIndex))
    for (const existingLink of existingLinks) {
      if (existingLink.position && !newLinkPositions.has(existingLink.position)) {
        await this.deleteLink(existingLink.id)
        deleted.push(existingLink)
      }
    }

    // 发送同步完成事件
    this.coreAPI.events.emit('links:synced', {
      source: { type: source_type, id: source_id },
      summary: {
        created: created.length,
        updated: updated.length,
        deleted: deleted.length
      }
    })

    return { created, updated, deleted }
  }

  /**
   * 获取页面引用统计
   */
  async getPageReferences(limit: number = 50): Promise<PageReference[]> {
    return this.coreAPI.database.query<PageReference>(
      `SELECT * FROM page_references 
       WHERE reference_count > 0 
       ORDER BY reference_count DESC, last_referenced_at DESC 
       LIMIT ?`,
      [limit]
    )
  }

  /**
   * 获取孤立页面
   */
  async getOrphanPages(): Promise<any[]> {
    return this.coreAPI.database.query(
      `SELECT p.id, p.name, p.title, p.created_at
       FROM pages p
       LEFT JOIN page_references pr ON p.id = pr.page_id
       WHERE pr.page_id IS NULL OR pr.reference_count = 0
       ORDER BY p.created_at DESC`
    )
  }

  /**
   * 生成链接ID
   */
  private generateLinkId(): string {
    return `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

export default LinkService
