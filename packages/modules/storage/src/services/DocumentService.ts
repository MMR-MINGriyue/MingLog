/**
 * 文档服务
 * 提供文档的CRUD操作、搜索和关系管理
 */

import { BaseService } from './BaseService';
import type {
  DocumentEntity,
  DocumentPermissions,
  DocumentStatus,
  QueryOptions,
  QueryResult,
  SearchResult,
  DataAccessLayer
} from '../types';

/**
 * 文档服务类
 */
export class DocumentService extends BaseService {
  protected readonly serviceName = 'DocumentService';

  constructor(dataAccessLayer: DataAccessLayer) {
    super(dataAccessLayer);
  }

  /**
   * 初始化服务
   */
  protected async onInitialize(): Promise<void> {
    // 检查文档表是否存在
    const connection = await this.dataAccessLayer.getConnection();
    await connection.get("SELECT name FROM sqlite_master WHERE type='table' AND name='documents'");
    this.log('文档服务初始化完成');
  }

  /**
   * 启动服务
   */
  protected async onStart(): Promise<void> {
    this.log('文档服务启动完成');
  }

  /**
   * 停止服务
   */
  protected async onStop(): Promise<void> {
    this.log('文档服务停止完成');
  }

  /**
   * 创建文档
   */
  public async createDocument(document: Omit<DocumentEntity, 'id' | 'created_at' | 'updated_at'>): Promise<DocumentEntity> {
    return await this.executeWithTiming(async () => {
      this.validateRequired(document, ['title', 'content', 'path']);

      const connection = await this.dataAccessLayer.getConnection();
      const now = new Date();
      const id = this.generateId();

      const newDocument: DocumentEntity = {
        ...document,
        id,
        created_at: now,
        updated_at: now,
        tags: document.tags || [],
        metadata: document.metadata || {},
        is_template: document.is_template || false,
        sort_order: document.sort_order || 0,
        permissions: document.permissions || {
          is_public: false,
          allow_comments: true,
          allow_copy: true,
          allow_export: true,
          shared_users: [],
          editors: [],
          viewers: []
        }
      };

      await connection.run(`
        INSERT INTO documents (
          id, title, content, status, parent_id, path, icon, cover, 
          tags, metadata, is_template, template_id, sort_order, permissions,
          created_at, updated_at, created_by, updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        newDocument.id,
        newDocument.title,
        this.stringifyJSON(newDocument.content),
        newDocument.status,
        newDocument.parent_id,
        newDocument.path,
        newDocument.icon,
        newDocument.cover,
        this.stringifyJSON(newDocument.tags),
        this.stringifyJSON(newDocument.metadata),
        newDocument.is_template ? 1 : 0,
        newDocument.template_id,
        newDocument.sort_order,
        this.stringifyJSON(newDocument.permissions),
        this.formatDate(newDocument.created_at),
        this.formatDate(newDocument.updated_at),
        newDocument.created_by,
        newDocument.updated_by
      ]);

      this.log(`文档创建成功: ${newDocument.id}`);
      return newDocument;
    }, '创建文档');
  }

  /**
   * 根据ID获取文档
   */
  public async getDocumentById(id: string): Promise<DocumentEntity | null> {
    return await this.executeWithTiming(async () => {
      this.validateRequired({ id }, ['id']);

      const connection = await this.dataAccessLayer.getConnection();
      const row = await connection.get(`
        SELECT * FROM documents WHERE id = ? AND status != 'deleted'
      `, [id]);

      return row ? this.mapRowToDocument(row) : null;
    }, '获取文档');
  }

  /**
   * 更新文档
   */
  public async updateDocument(id: string, updates: Partial<DocumentEntity>): Promise<DocumentEntity> {
    return await this.executeWithTiming(async () => {
      this.validateRequired({ id }, ['id']);

      const connection = await this.dataAccessLayer.getConnection();
      const now = new Date();

      // 构建更新字段
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      if (updates.title !== undefined) {
        updateFields.push('title = ?');
        updateValues.push(updates.title);
      }

      if (updates.content !== undefined) {
        updateFields.push('content = ?');
        updateValues.push(this.stringifyJSON(updates.content));
      }

      if (updates.status !== undefined) {
        updateFields.push('status = ?');
        updateValues.push(updates.status);
      }

      if (updates.parent_id !== undefined) {
        updateFields.push('parent_id = ?');
        updateValues.push(updates.parent_id);
      }

      if (updates.path !== undefined) {
        updateFields.push('path = ?');
        updateValues.push(updates.path);
      }

      if (updates.icon !== undefined) {
        updateFields.push('icon = ?');
        updateValues.push(updates.icon);
      }

      if (updates.cover !== undefined) {
        updateFields.push('cover = ?');
        updateValues.push(updates.cover);
      }

      if (updates.tags !== undefined) {
        updateFields.push('tags = ?');
        updateValues.push(this.stringifyJSON(updates.tags));
      }

      if (updates.metadata !== undefined) {
        updateFields.push('metadata = ?');
        updateValues.push(this.stringifyJSON(updates.metadata));
      }

      if (updates.permissions !== undefined) {
        updateFields.push('permissions = ?');
        updateValues.push(this.stringifyJSON(updates.permissions));
      }

      if (updates.sort_order !== undefined) {
        updateFields.push('sort_order = ?');
        updateValues.push(updates.sort_order);
      }

      if (updates.updated_by !== undefined) {
        updateFields.push('updated_by = ?');
        updateValues.push(updates.updated_by);
      }

      // 总是更新 updated_at
      updateFields.push('updated_at = ?');
      updateValues.push(this.formatDate(now));

      if (updateFields.length === 1) { // 只有 updated_at
        throw new Error('没有提供要更新的字段');
      }

      updateValues.push(id);

      await connection.run(`
        UPDATE documents SET ${updateFields.join(', ')} WHERE id = ?
      `, updateValues);

      const updatedDocument = await this.getDocumentById(id);
      if (!updatedDocument) {
        throw new Error('文档更新后未找到');
      }

      this.log(`文档更新成功: ${id}`);
      return updatedDocument;
    }, '更新文档');
  }

  /**
   * 删除文档（软删除）
   */
  public async deleteDocument(id: string): Promise<void> {
    return await this.executeWithTiming(async () => {
      this.validateRequired({ id }, ['id']);

      const connection = await this.dataAccessLayer.getConnection();
      const now = new Date();

      await connection.run(`
        UPDATE documents SET status = 'deleted', updated_at = ? WHERE id = ?
      `, [this.formatDate(now), id]);

      this.log(`文档删除成功: ${id}`);
    }, '删除文档');
  }

  /**
   * 查询文档
   */
  public async queryDocuments(options: QueryOptions = {}): Promise<QueryResult<DocumentEntity>> {
    return await this.executeWithTiming(async () => {
      const connection = await this.dataAccessLayer.getConnection();
      
      let whereClause = "WHERE status != 'deleted'";
      const params: any[] = [];

      // 构建查询条件
      if (options.filters) {
        const filterConditions: string[] = [];
        
        if (options.filters.parent_id !== undefined) {
          filterConditions.push('parent_id = ?');
          params.push(options.filters.parent_id);
        }

        if (options.filters.status) {
          filterConditions.push('status = ?');
          params.push(options.filters.status);
        }

        if (options.filters.is_template !== undefined) {
          filterConditions.push('is_template = ?');
          params.push(options.filters.is_template ? 1 : 0);
        }

        if (filterConditions.length > 0) {
          whereClause += ' AND ' + filterConditions.join(' AND ');
        }
      }

      // 搜索条件
      if (options.search) {
        whereClause += ' AND (title LIKE ? OR content LIKE ?)';
        const searchTerm = `%${options.search}%`;
        params.push(searchTerm, searchTerm);
      }

      // 排序
      const sortBy = options.sort_by || 'updated_at';
      const sortOrder = options.sort_order || 'desc';
      const orderClause = `ORDER BY ${sortBy} ${sortOrder}`;

      // 分页
      const limit = options.limit || 50;
      const offset = options.offset || 0;
      const limitClause = `LIMIT ? OFFSET ?`;

      // 获取总数
      const countResult = await connection.get<{ count: number }>(
        `SELECT COUNT(*) as count FROM documents ${whereClause}`,
        params
      );
      const total = countResult?.count || 0;

      // 获取数据
      const rows = await connection.query(
        `SELECT * FROM documents ${whereClause} ${orderClause} ${limitClause}`,
        [...params, limit, offset]
      );

      const documents = rows.map(row => this.mapRowToDocument(row));

      const page = Math.floor(offset / limit) + 1;
      const totalPages = Math.ceil(total / limit);

      return {
        data: documents,
        total,
        page,
        page_size: limit,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1
      };
    }, '查询文档');
  }

  /**
   * 全文搜索文档
   */
  public async searchDocuments(searchTerm: string, options: {
    includeContent?: boolean;
    includeTags?: boolean;
    includeMetadata?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<SearchResult[]> {
    return await this.executeWithTiming(async () => {
      this.validateRequired({ searchTerm }, ['searchTerm']);

      const connection = await this.dataAccessLayer.getConnection();
      const {
        includeContent = true,
        includeTags = true,
        includeMetadata = true,
        limit = 50,
        offset = 0
      } = options;

      let searchConditions: string[] = [];
      let searchParams: any[] = [];

      // 搜索标题
      searchConditions.push('title LIKE ?');
      searchParams.push(`%${searchTerm}%`);

      // 搜索内容
      if (includeContent) {
        searchConditions.push('content LIKE ?');
        searchParams.push(`%${searchTerm}%`);
      }

      // 搜索标签
      if (includeTags) {
        searchConditions.push('tags LIKE ?');
        searchParams.push(`%${searchTerm}%`);
      }

      // 搜索元数据
      if (includeMetadata) {
        searchConditions.push('metadata LIKE ?');
        searchParams.push(`%${searchTerm}%`);
      }

      const whereClause = `WHERE (${searchConditions.join(' OR ')}) AND status != 'deleted'`;

      const rows = await connection.query(`
        SELECT *,
               CASE
                 WHEN title LIKE ? THEN 10
                 WHEN content LIKE ? THEN 5
                 WHEN tags LIKE ? THEN 3
                 ELSE 1
               END as relevance_score
        FROM documents
        ${whereClause}
        ORDER BY relevance_score DESC, updated_at DESC
        LIMIT ? OFFSET ?
      `, [
        `%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`,
        ...searchParams,
        limit, offset
      ]);

      return rows.map(row => ({
        document_id: row.id,
        title: row.title,
        content: this.extractSearchSnippet(row.content, searchTerm),
        score: row.relevance_score,
        highlights: this.generateHighlights(row, searchTerm),
        match_type: this.determineMatchType(row, searchTerm)
      }));
    }, '搜索文档');
  }

  /**
   * 获取文档的子文档
   */
  public async getChildDocuments(parentId: string): Promise<DocumentEntity[]> {
    return await this.executeWithTiming(async () => {
      this.validateRequired({ parentId }, ['parentId']);

      const connection = await this.dataAccessLayer.getConnection();
      const rows = await connection.query(`
        SELECT * FROM documents
        WHERE parent_id = ? AND status != 'deleted'
        ORDER BY sort_order ASC, created_at ASC
      `, [parentId]);

      return rows.map(row => this.mapRowToDocument(row));
    }, '获取子文档');
  }

  /**
   * 获取文档的父文档路径
   */
  public async getDocumentPath(documentId: string): Promise<DocumentEntity[]> {
    return await this.executeWithTiming(async () => {
      this.validateRequired({ documentId }, ['documentId']);

      const path: DocumentEntity[] = [];
      let currentId: string | null = documentId;

      while (currentId) {
        const document = await this.getDocumentById(currentId);
        if (!document) break;

        path.unshift(document);
        currentId = document.parent_id;
      }

      return path;
    }, '获取文档路径');
  }

  /**
   * 移动文档到新的父文档
   */
  public async moveDocument(documentId: string, newParentId: string | null, newSortOrder?: number): Promise<DocumentEntity> {
    return await this.executeWithTiming(async () => {
      this.validateRequired({ documentId }, ['documentId']);

      const connection = await this.dataAccessLayer.getConnection();
      const transaction = await connection.beginTransaction();

      try {
        // 检查是否会造成循环引用
        if (newParentId) {
          const isCircular = await this.checkCircularReference(documentId, newParentId);
          if (isCircular) {
            throw new Error('移动操作会造成循环引用');
          }
        }

        // 获取当前文档
        const document = await this.getDocumentById(documentId);
        if (!document) {
          throw new Error('文档不存在');
        }

        // 如果没有指定排序位置，则放到最后
        let sortOrder = newSortOrder;
        if (sortOrder === undefined) {
          const siblings = newParentId
            ? await this.getChildDocuments(newParentId)
            : await this.getRootDocuments();

          sortOrder = siblings.length > 0
            ? Math.max(...siblings.map(d => d.sort_order)) + 1
            : 0;
        }

        // 更新文档的父级和排序
        const updatedDocument = await this.updateDocument(documentId, {
          parent_id: newParentId,
          sort_order: sortOrder
        });

        await transaction.commit();
        this.log(`文档移动成功: ${documentId}`);
        return updatedDocument;
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    }, '移动文档');
  }

  /**
   * 复制文档
   */
  public async duplicateDocument(documentId: string, options: {
    newTitle?: string;
    newParentId?: string;
    includeChildren?: boolean;
    copyAsTemplate?: boolean;
  } = {}): Promise<DocumentEntity> {
    return await this.executeWithTiming(async () => {
      this.validateRequired({ documentId }, ['documentId']);

      const originalDocument = await this.getDocumentById(documentId);
      if (!originalDocument) {
        throw new Error('原文档不存在');
      }

      const {
        newTitle = `${originalDocument.title} (副本)`,
        newParentId = originalDocument.parent_id,
        includeChildren = false,
        copyAsTemplate = false
      } = options;

      // 创建新文档
      const newDocument = await this.createDocument({
        title: newTitle,
        content: originalDocument.content,
        status: copyAsTemplate ? originalDocument.status : DocumentStatus.DRAFT,
        parent_id: newParentId,
        path: this.generateUniquePath(newTitle, newParentId),
        icon: originalDocument.icon,
        cover: originalDocument.cover,
        tags: [...originalDocument.tags],
        metadata: { ...originalDocument.metadata },
        is_template: copyAsTemplate,
        template_id: copyAsTemplate ? undefined : originalDocument.id,
        sort_order: 0,
        permissions: { ...originalDocument.permissions }
      });

      // 如果需要复制子文档
      if (includeChildren) {
        const children = await this.getChildDocuments(documentId);
        for (const child of children) {
          await this.duplicateDocument(child.id, {
            newParentId: newDocument.id,
            includeChildren: true,
            copyAsTemplate
          });
        }
      }

      this.log(`文档复制成功: ${documentId} -> ${newDocument.id}`);
      return newDocument;
    }, '复制文档');
  }

  /**
   * 处理编辑器文档创建事件
   */
  public async handleDocumentCreated(data: any): Promise<void> {
    this.logDebug('处理文档创建事件', data);
    // 这里可以添加文档创建后的处理逻辑
  }

  /**
   * 获取根级文档
   */
  public async getRootDocuments(): Promise<DocumentEntity[]> {
    return await this.executeWithTiming(async () => {
      const connection = await this.dataAccessLayer.getConnection();
      const rows = await connection.query(`
        SELECT * FROM documents
        WHERE parent_id IS NULL AND status != 'deleted'
        ORDER BY sort_order ASC, created_at ASC
      `);

      return rows.map(row => this.mapRowToDocument(row));
    }, '获取根级文档');
  }

  /**
   * 根据标签获取文档
   */
  public async getDocumentsByTag(tag: string): Promise<DocumentEntity[]> {
    return await this.executeWithTiming(async () => {
      this.validateRequired({ tag }, ['tag']);

      const connection = await this.dataAccessLayer.getConnection();
      const rows = await connection.query(`
        SELECT * FROM documents
        WHERE tags LIKE ? AND status != 'deleted'
        ORDER BY updated_at DESC
      `, [`%"${tag}"%`]);

      return rows.map(row => this.mapRowToDocument(row));
    }, '根据标签获取文档');
  }

  /**
   * 获取所有标签及其使用次数
   */
  public async getAllTags(): Promise<{ tag: string; count: number }[]> {
    return await this.executeWithTiming(async () => {
      const connection = await this.dataAccessLayer.getConnection();
      const rows = await connection.query(`
        SELECT tags FROM documents WHERE status != 'deleted'
      `);

      const tagCounts = new Map<string, number>();

      rows.forEach(row => {
        const tags = this.parseJSON(row.tags, []);
        tags.forEach((tag: string) => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      });

      return Array.from(tagCounts.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count);
    }, '获取所有标签');
  }

  /**
   * 更新文档权限
   */
  public async updateDocumentPermissions(documentId: string, permissions: Partial<DocumentPermissions>): Promise<DocumentEntity> {
    return await this.executeWithTiming(async () => {
      this.validateRequired({ documentId }, ['documentId']);

      const document = await this.getDocumentById(documentId);
      if (!document) {
        throw new Error('文档不存在');
      }

      const updatedPermissions = {
        ...document.permissions,
        ...permissions
      };

      return await this.updateDocument(documentId, {
        permissions: updatedPermissions
      });
    }, '更新文档权限');
  }

  /**
   * 检查用户对文档的访问权限
   */
  public async checkDocumentAccess(documentId: string, userId: string, action: 'read' | 'write' | 'delete'): Promise<boolean> {
    return await this.executeWithTiming(async () => {
      this.validateRequired({ documentId, userId, action }, ['documentId', 'userId', 'action']);

      const document = await this.getDocumentById(documentId);
      if (!document) {
        return false;
      }

      const permissions = document.permissions;

      // 如果是文档创建者，拥有所有权限
      if (document.created_by === userId) {
        return true;
      }

      // 检查公开权限
      if (permissions.is_public && action === 'read') {
        return true;
      }

      // 检查编辑权限
      if (action === 'write' && permissions.editors.includes(userId)) {
        return true;
      }

      // 检查查看权限
      if (action === 'read' && (permissions.viewers.includes(userId) || permissions.editors.includes(userId))) {
        return true;
      }

      // 检查共享用户权限
      if (permissions.shared_users.includes(userId)) {
        return action === 'read' || action === 'write';
      }

      return false;
    }, '检查文档访问权限');
  }

  /**
   * 分享文档给用户
   */
  public async shareDocument(documentId: string, targetUserId: string, permission: 'read' | 'write'): Promise<DocumentEntity> {
    return await this.executeWithTiming(async () => {
      this.validateRequired({ documentId, targetUserId, permission }, ['documentId', 'targetUserId', 'permission']);

      const document = await this.getDocumentById(documentId);
      if (!document) {
        throw new Error('文档不存在');
      }

      const permissions = { ...document.permissions };

      // 移除用户的其他权限
      permissions.viewers = permissions.viewers.filter(id => id !== targetUserId);
      permissions.editors = permissions.editors.filter(id => id !== targetUserId);
      permissions.shared_users = permissions.shared_users.filter(id => id !== targetUserId);

      // 添加新权限
      if (permission === 'read') {
        permissions.viewers.push(targetUserId);
      } else if (permission === 'write') {
        permissions.editors.push(targetUserId);
      }

      return await this.updateDocument(documentId, { permissions });
    }, '分享文档');
  }

  /**
   * 取消文档分享
   */
  public async unshareDocument(documentId: string, targetUserId: string): Promise<DocumentEntity> {
    return await this.executeWithTiming(async () => {
      this.validateRequired({ documentId, targetUserId }, ['documentId', 'targetUserId']);

      const document = await this.getDocumentById(documentId);
      if (!document) {
        throw new Error('文档不存在');
      }

      const permissions = { ...document.permissions };

      // 移除用户的所有权限
      permissions.viewers = permissions.viewers.filter(id => id !== targetUserId);
      permissions.editors = permissions.editors.filter(id => id !== targetUserId);
      permissions.shared_users = permissions.shared_users.filter(id => id !== targetUserId);

      return await this.updateDocument(documentId, { permissions });
    }, '取消文档分享');
  }

  /**
   * 处理编辑器文档创建事件
   */
  public async handleDocumentCreated(data: any): Promise<void> {
    this.logDebug('处理文档创建事件', data);
    // 这里可以添加文档创建后的处理逻辑
  }

  /**
   * 处理编辑器文档更新事件
   */
  public async handleDocumentUpdated(data: any): Promise<void> {
    this.logDebug('处理文档更新事件', data);
    // 这里可以添加文档更新后的处理逻辑
  }

  /**
   * 检查循环引用
   */
  private async checkCircularReference(documentId: string, newParentId: string): Promise<boolean> {
    let currentId: string | null = newParentId;

    while (currentId) {
      if (currentId === documentId) {
        return true; // 发现循环引用
      }

      const parent = await this.getDocumentById(currentId);
      if (!parent) break;

      currentId = parent.parent_id;
    }

    return false;
  }

  /**
   * 生成唯一路径
   */
  private async generateUniquePath(title: string, parentId?: string | null): Promise<string> {
    const basePath = this.sanitizePath(title);
    let path = basePath;
    let counter = 1;

    while (await this.isPathExists(path, parentId)) {
      path = `${basePath}-${counter}`;
      counter++;
    }

    return parentId ? `${await this.getParentPath(parentId)}/${path}` : path;
  }

  /**
   * 检查路径是否存在
   */
  private async isPathExists(path: string, parentId?: string | null): Promise<boolean> {
    const connection = await this.dataAccessLayer.getConnection();
    const fullPath = parentId ? `${await this.getParentPath(parentId)}/${path}` : path;

    const result = await connection.get(`
      SELECT id FROM documents WHERE path = ? AND status != 'deleted'
    `, [fullPath]);

    return !!result;
  }

  /**
   * 获取父路径
   */
  private async getParentPath(parentId: string): Promise<string> {
    const parent = await this.getDocumentById(parentId);
    return parent ? parent.path : '';
  }

  /**
   * 清理路径字符串
   */
  private sanitizePath(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fff]/g, '-') // 保留中文字符
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * 提取搜索片段
   */
  private extractSearchSnippet(content: string, searchTerm: string, maxLength: number = 200): string {
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    const lowerContent = contentStr.toLowerCase();
    const lowerTerm = searchTerm.toLowerCase();

    const index = lowerContent.indexOf(lowerTerm);
    if (index === -1) {
      return this.truncateText(contentStr, maxLength);
    }

    const start = Math.max(0, index - 50);
    const end = Math.min(contentStr.length, index + searchTerm.length + 50);

    let snippet = contentStr.substring(start, end);
    if (start > 0) snippet = '...' + snippet;
    if (end < contentStr.length) snippet = snippet + '...';

    return snippet;
  }

  /**
   * 生成搜索高亮
   */
  private generateHighlights(row: any, searchTerm: string): string[] {
    const highlights: string[] = [];
    const lowerTerm = searchTerm.toLowerCase();

    // 检查标题匹配
    if (row.title.toLowerCase().includes(lowerTerm)) {
      highlights.push(`标题: ${row.title}`);
    }

    // 检查标签匹配
    const tags = this.parseJSON(row.tags, []);
    const matchingTags = tags.filter((tag: string) =>
      tag.toLowerCase().includes(lowerTerm)
    );
    if (matchingTags.length > 0) {
      highlights.push(`标签: ${matchingTags.join(', ')}`);
    }

    return highlights;
  }

  /**
   * 确定匹配类型
   */
  private determineMatchType(row: any, searchTerm: string): 'title' | 'content' | 'tag' | 'metadata' {
    const lowerTerm = searchTerm.toLowerCase();

    if (row.title.toLowerCase().includes(lowerTerm)) {
      return 'title';
    }

    const tags = this.parseJSON(row.tags, []);
    if (tags.some((tag: string) => tag.toLowerCase().includes(lowerTerm))) {
      return 'tag';
    }

    const contentStr = typeof row.content === 'string' ? row.content : JSON.stringify(row.content);
    if (contentStr.toLowerCase().includes(lowerTerm)) {
      return 'content';
    }

    return 'metadata';
  }

  /**
   * 将数据库行映射为文档实体
   */
  private mapRowToDocument(row: any): DocumentEntity {
    return {
      id: row.id,
      title: row.title,
      content: this.parseJSON(row.content, []),
      status: row.status,
      parent_id: row.parent_id,
      path: row.path,
      icon: row.icon,
      cover: row.cover,
      tags: this.parseJSON(row.tags, []),
      metadata: this.parseJSON(row.metadata, {}),
      is_template: Boolean(row.is_template),
      template_id: row.template_id,
      sort_order: row.sort_order,
      permissions: this.parseJSON(row.permissions, {
        is_public: false,
        allow_comments: true,
        allow_copy: true,
        allow_export: true,
        shared_users: [],
        editors: [],
        viewers: []
      }),
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
      created_by: row.created_by,
      updated_by: row.updated_by
    };
  }
}
