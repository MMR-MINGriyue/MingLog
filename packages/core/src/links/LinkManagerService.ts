/**
 * MingLog 链接管理服务
 * 负责链接的创建、更新、删除和查询
 */

import { 
  Link, 
  CreateLinkRequest, 
  BacklinkInfo, 
  LinkManager, 
  SourceType, 
  TargetType,
  LinkGraphData,
  LinkGraphNode,
  LinkGraphEdge
} from '../types/links';
import { DatabaseConnection, DatabaseQueryResult } from '../database/DatabaseConnection';
import { EventBus } from '../event-system/EventBus';
import { UnifiedLinkParser } from './UnifiedLinkParser';

export class LinkManagerService implements LinkManager {
  private parser: UnifiedLinkParser;

  constructor(
    private database: DatabaseConnection,
    private eventBus: EventBus
  ) {
    this.parser = new UnifiedLinkParser();
  }

  /**
   * 创建新链接
   * @param linkRequest 链接创建请求
   * @returns 创建的链接
   */
  async createLink(linkRequest: CreateLinkRequest): Promise<Link> {
    const now = new Date().toISOString();
    const linkId = this.generateLinkId();

    const link: Link = {
      id: linkId,
      sourceType: linkRequest.sourceType,
      sourceId: linkRequest.sourceId,
      targetType: linkRequest.targetType,
      targetId: linkRequest.targetId,
      linkType: linkRequest.linkType,
      context: linkRequest.context,
      position: linkRequest.position,
      createdAt: now,
      updatedAt: now
    };

    // 插入数据库
    await this.database.execute(
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
        link.context || null,
        link.position || null,
        link.createdAt,
        link.updatedAt
      ]
    );

    // 发送事件
    this.eventBus.emit('links:created', { link });

    return link;
  }

  /**
   * 更新内容的所有链接
   * @param sourceType 源类型
   * @param sourceId 源ID
   * @param content 内容
   */
  async updateLinksForContent(
    sourceType: SourceType, 
    sourceId: string, 
    content: string
  ): Promise<void> {
    // 1. 删除旧链接
    await this.deleteLinksForSource(sourceType, sourceId);

    // 2. 解析新链接
    const pageLinks = this.parser.parsePageLinks(content);
    const blockLinks = this.parser.parseBlockLinks(content);

    const newLinks: Link[] = [];

    // 3. 创建页面链接记录
    for (const pageLink of pageLinks) {
      try {
        const link = await this.createPageLink(sourceType, sourceId, pageLink);
        newLinks.push(link);
      } catch (error) {
        console.warn('Failed to create page link:', error);
      }
    }

    // 4. 创建块引用记录
    for (const blockLink of blockLinks) {
      try {
        const link = await this.createBlockLink(sourceType, sourceId, blockLink);
        newLinks.push(link);
      } catch (error) {
        console.warn('Failed to create block link:', error);
      }
    }

    // 5. 发送批量更新事件
    this.eventBus.emit('links:bulk-updated', {
      sourceType,
      sourceId,
      links: newLinks
    });

    this.eventBus.emit('links:updated', {
      sourceType,
      sourceId,
      linkCount: newLinks.length
    });
  }

  /**
   * 获取反向链接
   * @param targetId 目标ID
   * @param targetType 目标类型
   * @returns 反向链接列表
   */
  async getBacklinks(targetId: string, targetType?: TargetType): Promise<BacklinkInfo[]> {
    let query = `
      SELECT 
        l.*,
        n.title as source_title,
        n.content as source_content
      FROM links l
      LEFT JOIN notes n ON l.source_id = n.id AND l.source_type = 'page'
      WHERE l.target_id = ?
    `;
    
    const params: any[] = [targetId];

    if (targetType) {
      query += ' AND l.target_type = ?';
      params.push(targetType);
    }

    query += ' ORDER BY l.created_at DESC';

    const results = await this.database.query(query, params);
    return results.map((row: DatabaseQueryResult) => this.mapToBacklinkInfo(row));
  }

  /**
   * 获取正向链接
   * @param sourceId 源ID
   * @param sourceType 源类型
   * @returns 正向链接列表
   */
  async getForwardLinks(sourceId: string, sourceType?: SourceType): Promise<Link[]> {
    let query = 'SELECT * FROM links WHERE source_id = ?';
    const params: any[] = [sourceId];

    if (sourceType) {
      query += ' AND source_type = ?';
      params.push(sourceType);
    }

    query += ' ORDER BY position ASC, created_at ASC';

    const results = await this.database.query(query, params);
    return results.map((row: DatabaseQueryResult) => this.mapToLink(row));
  }

  /**
   * 删除源的所有链接
   * @param sourceType 源类型
   * @param sourceId 源ID
   */
  async deleteLinksForSource(sourceType: SourceType, sourceId: string): Promise<void> {
    await this.database.execute(
      'DELETE FROM links WHERE source_type = ? AND source_id = ?',
      [sourceType, sourceId]
    );
  }

  /**
   * 删除单个链接
   * @param linkId 链接ID
   */
  async deleteLink(linkId: string): Promise<void> {
    await this.database.execute('DELETE FROM links WHERE id = ?', [linkId]);
    this.eventBus.emit('links:deleted', { linkId });
  }

  /**
   * 获取链接图谱数据
   * @param centerNodeId 中心节点ID
   * @param maxDepth 最大深度
   * @returns 图谱数据
   */
  async getLinkGraph(centerNodeId: string, maxDepth: number = 2): Promise<LinkGraphData> {
    const nodes = new Map<string, LinkGraphNode>();
    const edges: LinkGraphEdge[] = [];
    const visited = new Set<string>();

    // 递归构建图谱
    await this.buildGraphRecursive(centerNodeId, 0, maxDepth, nodes, edges, visited);

    return {
      nodes: Array.from(nodes.values()),
      edges,
      centerNodeId,
      maxDepth
    };
  }

  /**
   * 创建页面链接
   */
  private async createPageLink(
    sourceType: SourceType, 
    sourceId: string, 
    pageLink: any
  ): Promise<Link> {
    // 查找目标页面ID（通过标题或别名）
    const targetId = await this.findPageIdByName(pageLink.pageName);
    
    if (!targetId) {
      // 如果页面不存在，可以选择创建或跳过
      throw new Error(`Page not found: ${pageLink.pageName}`);
    }

    return this.createLink({
      sourceType,
      sourceId,
      targetType: 'page',
      targetId,
      linkType: 'page-reference',
      context: pageLink.context,
      position: pageLink.position
    });
  }

  /**
   * 创建块引用链接
   */
  private async createBlockLink(
    sourceType: SourceType, 
    sourceId: string, 
    blockLink: any
  ): Promise<Link> {
    // 验证块ID是否存在
    const blockExists = await this.verifyBlockExists(blockLink.blockId);
    
    if (!blockExists) {
      throw new Error(`Block not found: ${blockLink.blockId}`);
    }

    return this.createLink({
      sourceType,
      sourceId,
      targetType: 'block',
      targetId: blockLink.blockId,
      linkType: 'block-reference',
      context: blockLink.context,
      position: blockLink.position
    });
  }

  /**
   * 通过页面名称查找页面ID
   */
  private async findPageIdByName(pageName: string): Promise<string | null> {
    // 先通过标题查找
    const titleResult = await this.database.query(
      'SELECT id FROM notes WHERE title = ? LIMIT 1',
      [pageName]
    );

    if (titleResult.length > 0) {
      return titleResult[0].id;
    }

    // 再通过别名查找
    const aliasResult = await this.database.query(
      'SELECT page_id FROM page_aliases WHERE alias = ? LIMIT 1',
      [pageName]
    );

    if (aliasResult.length > 0) {
      return aliasResult[0].page_id;
    }

    return null;
  }

  /**
   * 验证块是否存在
   */
  private async verifyBlockExists(blockId: string): Promise<boolean> {
    // 这里需要根据实际的块存储方式来实现
    // 暂时返回true，后续需要完善
    return true;
  }

  /**
   * 递归构建图谱
   */
  private async buildGraphRecursive(
    nodeId: string,
    currentDepth: number,
    maxDepth: number,
    nodes: Map<string, LinkGraphNode>,
    edges: LinkGraphEdge[],
    visited: Set<string>
  ): Promise<void> {
    if (currentDepth > maxDepth || visited.has(nodeId)) {
      return;
    }

    visited.add(nodeId);

    // 添加当前节点
    if (!nodes.has(nodeId)) {
      const nodeInfo = await this.getNodeInfo(nodeId);
      if (nodeInfo) {
        nodes.set(nodeId, nodeInfo);
      }
    }

    // 获取相关链接
    const forwardLinks = await this.getForwardLinks(nodeId);
    const backlinks = await this.getBacklinks(nodeId);

    // 处理正向链接
    for (const link of forwardLinks) {
      const edgeId = `${link.sourceId}-${link.targetId}`;
      edges.push({
        id: edgeId,
        source: link.sourceId,
        target: link.targetId,
        type: link.linkType
      });

      await this.buildGraphRecursive(
        link.targetId,
        currentDepth + 1,
        maxDepth,
        nodes,
        edges,
        visited
      );
    }

    // 处理反向链接
    for (const backlink of backlinks) {
      const edgeId = `${backlink.sourceId}-${nodeId}`;
      if (!edges.some(e => e.id === edgeId)) {
        edges.push({
          id: edgeId,
          source: backlink.sourceId,
          target: nodeId,
          type: backlink.linkType
        });
      }

      await this.buildGraphRecursive(
        backlink.sourceId,
        currentDepth + 1,
        maxDepth,
        nodes,
        edges,
        visited
      );
    }
  }

  /**
   * 获取节点信息
   */
  private async getNodeInfo(nodeId: string): Promise<LinkGraphNode | null> {
    const result = await this.database.query(
      'SELECT id, title FROM notes WHERE id = ? LIMIT 1',
      [nodeId]
    );

    if (result.length > 0) {
      return {
        id: result[0].id,
        title: result[0].title,
        type: 'page'
      };
    }

    return null;
  }

  /**
   * 映射数据库行到Link对象
   */
  private mapToLink(row: DatabaseQueryResult): Link {
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
      updatedAt: row.updated_at
    };
  }

  /**
   * 映射数据库行到BacklinkInfo对象
   */
  private mapToBacklinkInfo(row: DatabaseQueryResult): BacklinkInfo {
    return {
      id: row.id,
      sourceType: row.source_type,
      sourceId: row.source_id,
      sourceTitle: row.source_title,
      sourceContent: row.source_content,
      linkType: row.link_type,
      context: row.context || '',
      position: row.position,
      createdAt: row.created_at
    };
  }

  /**
   * 生成链接ID
   */
  private generateLinkId(): string {
    return 'link_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
  }
}
