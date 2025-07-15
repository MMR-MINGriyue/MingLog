import { Link, CreateLinkRequest, SourceType } from '../types/links'

export interface ILinkService {
  createLink(request: CreateLinkRequest): Promise<Link>
  updateLink(id: string, updates: Partial<Link>): Promise<Link>
  deleteLink(id: string): Promise<void>
  getLink(id: string): Promise<Link | null>
  getLinksBySource(sourceType: string, sourceId: string): Promise<Link[]>
  getLinksByTarget(targetType: string, targetId: string): Promise<Link[]>
  getBacklinks(targetType: string, targetId: string): Promise<Link[]>
  searchLinks(query: string): Promise<Link[]>
  validateLinkTarget(targetType: string, targetId: string): Promise<boolean>
  getPageSuggestions(query: string): Promise<string[]>
}

/**
 * 双向链接服务
 * 管理页面和块之间的链接关系
 */
export class LinkService implements ILinkService {
  private databaseService: any // 注入数据库服务

  constructor(databaseService: any) {
    this.databaseService = databaseService
  }

  /**
   * 创建新链接
   */
  async createLink(request: CreateLinkRequest): Promise<Link> {
    const id = this.generateId()
    const now = new Date().toISOString()
    
    const link: Link = {
      id,
      sourceType: request.sourceType,
      sourceId: request.sourceId,
      targetType: request.targetType,
      targetId: request.targetId,
      linkType: request.linkType,
      context: request.context,
      position: request.position,
      createdAt: now,
      updatedAt: now,
    }

    // 保存到数据库
    await this.databaseService.execute(
      `INSERT INTO links (
        id, source_type, source_id, target_type, target_id, 
        link_type, context, position, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        link.id,
        link.sourceType,
        link.sourceId,
        link.targetType,
        link.targetId,
        link.linkType,
        link.context,
        link.position,
        link.createdAt,
        link.updatedAt,
      ]
    )

    return link
  }

  /**
   * 更新链接
   */
  async updateLink(id: string, updates: Partial<Link>): Promise<Link> {
    const existingLink = await this.getLink(id)
    if (!existingLink) {
      throw new Error(`Link with id ${id} not found`)
    }

    const updatedLink: Link = {
      ...existingLink,
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    await this.databaseService.execute(
      `UPDATE links SET 
        source_type = ?, source_id = ?, target_type = ?, target_id = ?,
        link_type = ?, context = ?, position = ?, updated_at = ?
      WHERE id = ?`,
      [
        updatedLink.sourceType,
        updatedLink.sourceId,
        updatedLink.targetType,
        updatedLink.targetId,
        updatedLink.linkType,
        updatedLink.context,
        updatedLink.position,
        updatedLink.updatedAt,
        id,
      ]
    )

    return updatedLink
  }

  /**
   * 删除链接
   */
  async deleteLink(id: string): Promise<void> {
    await this.databaseService.execute('DELETE FROM links WHERE id = ?', [id])
  }

  /**
   * 获取单个链接
   */
  async getLink(id: string): Promise<Link | null> {
    const result = await this.databaseService.query(
      'SELECT * FROM links WHERE id = ?',
      [id]
    )
    
    if (result.length === 0) {
      return null
    }

    return this.mapRowToLink(result[0])
  }

  /**
   * 获取源的所有链接
   */
  async getLinksBySource(sourceType: string, sourceId: string): Promise<Link[]> {
    const result = await this.databaseService.query(
      'SELECT * FROM links WHERE source_type = ? AND source_id = ? ORDER BY position',
      [sourceType, sourceId]
    )

    return result.map(this.mapRowToLink)
  }

  /**
   * 获取目标的所有链接
   */
  async getLinksByTarget(targetType: string, targetId: string): Promise<Link[]> {
    const result = await this.databaseService.query(
      'SELECT * FROM links WHERE target_type = ? AND target_id = ? ORDER BY created_at DESC',
      [targetType, targetId]
    )

    return result.map(this.mapRowToLink)
  }

  /**
   * 获取反向链接（指向目标的所有链接）
   */
  async getBacklinks(targetType: string, targetId: string): Promise<Link[]> {
    return this.getLinksByTarget(targetType, targetId)
  }

  /**
   * 搜索链接
   */
  async searchLinks(query: string): Promise<Link[]> {
    const result = await this.databaseService.query(
      `SELECT * FROM links 
       WHERE context LIKE ? OR target_id LIKE ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [`%${query}%`, `%${query}%`]
    )

    return result.map(this.mapRowToLink)
  }

  /**
   * 验证链接目标是否存在
   */
  async validateLinkTarget(targetType: string, targetId: string): Promise<boolean> {
    try {
      if (targetType === 'page') {
        // 检查页面是否存在
        const result = await this.databaseService.query(
          'SELECT id FROM notes WHERE title = ? OR id = ?',
          [targetId, targetId]
        )
        return result.length > 0
      } else if (targetType === 'block') {
        // 检查块是否存在
        const result = await this.databaseService.query(
          'SELECT id FROM blocks WHERE id = ?',
          [targetId]
        )
        return result.length > 0
      }
      return false
    } catch (error) {
      console.error('Error validating link target:', error)
      return false
    }
  }

  /**
   * 获取页面名称建议
   */
  async getPageSuggestions(query: string): Promise<string[]> {
    try {
      const result = await this.databaseService.query(
        `SELECT title FROM notes 
         WHERE title LIKE ? 
         ORDER BY updated_at DESC 
         LIMIT 10`,
        [`%${query}%`]
      )

      return result.map((row: any) => row.title)
    } catch (error) {
      console.error('Error getting page suggestions:', error)
      return []
    }
  }

  /**
   * 批量创建链接（用于解析文档中的所有链接）
   */
  async createLinksFromContent(
    sourceType: SourceType,
    sourceId: string,
    content: string
  ): Promise<Link[]> {
    const links: Link[] = []
    
    // 解析页面链接 [[页面名称]]
    const pageLinks = this.extractPageLinks(content)
    for (const { text, position } of pageLinks) {
      try {
        const link = await this.createLink({
          sourceType,
          sourceId,
          targetType: 'page',
          targetId: text,
          linkType: 'page-reference',
          context: this.extractContext(content, position),
          position,
        })
        links.push(link)
      } catch (error) {
        console.error('Error creating page link:', error)
      }
    }

    // 解析块引用 ((块ID))
    const blockLinks = this.extractBlockLinks(content)
    for (const { text, position } of blockLinks) {
      try {
        const link = await this.createLink({
          sourceType,
          sourceId,
          targetType: 'block',
          targetId: text,
          linkType: 'block-reference',
          context: this.extractContext(content, position),
          position,
        })
        links.push(link)
      } catch (error) {
        console.error('Error creating block link:', error)
      }
    }

    return links
  }

  /**
   * 删除源的所有链接
   */
  async deleteLinksFromSource(sourceType: string, sourceId: string): Promise<void> {
    await this.databaseService.execute(
      'DELETE FROM links WHERE source_type = ? AND source_id = ?',
      [sourceType, sourceId]
    )
  }

  // 私有辅助方法

  private generateId(): string {
    return `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private mapRowToLink(row: any): Link {
    return {
      id: row.id,
      sourceType: row.source_type,
      sourceId: row.source_id,
      targetType: row.target_type,
      targetId: row.target_id,
      linkType: row.link_type,
      context: row.context,
      position: row.position,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }
  }

  private extractPageLinks(content: string): Array<{ text: string; position: number }> {
    const links: Array<{ text: string; position: number }> = []
    const regex = /\[\[([^\]]+)\]\]/g
    let match

    while ((match = regex.exec(content)) !== null) {
      links.push({
        text: match[1],
        position: match.index,
      })
    }

    return links
  }

  private extractBlockLinks(content: string): Array<{ text: string; position: number }> {
    const links: Array<{ text: string; position: number }> = []
    const regex = /\(\(([^)]+)\)\)/g
    let match

    while ((match = regex.exec(content)) !== null) {
      links.push({
        text: match[1],
        position: match.index,
      })
    }

    return links
  }

  private extractContext(content: string, position: number, contextLength: number = 50): string {
    const start = Math.max(0, position - contextLength)
    const end = Math.min(content.length, position + contextLength)
    return content.slice(start, end)
  }
}
