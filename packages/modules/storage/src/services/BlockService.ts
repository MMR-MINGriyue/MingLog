/**
 * 块服务
 * 提供块的CRUD操作、层次结构管理和内容解析
 */

import { BaseService } from './BaseService';
import type { 
  BlockEntity, 
  QueryOptions, 
  QueryResult,
  DataAccessLayer 
} from '../types';

/**
 * 块服务类
 */
export class BlockService extends BaseService {
  protected readonly serviceName = 'BlockService';

  constructor(dataAccessLayer: DataAccessLayer) {
    super(dataAccessLayer);
  }

  /**
   * 初始化服务
   */
  protected async onInitialize(): Promise<void> {
    // 检查块表是否存在
    const connection = await this.dataAccessLayer.getConnection();
    await connection.get("SELECT name FROM sqlite_master WHERE type='table' AND name='blocks'");
    this.log('块服务初始化完成');
  }

  /**
   * 启动服务
   */
  protected async onStart(): Promise<void> {
    this.log('块服务启动完成');
  }

  /**
   * 停止服务
   */
  protected async onStop(): Promise<void> {
    this.log('块服务停止完成');
  }

  /**
   * 创建块
   */
  public async createBlock(block: Omit<BlockEntity, 'id' | 'created_at' | 'updated_at'>): Promise<BlockEntity> {
    return await this.executeWithTiming(async () => {
      this.validateRequired(block, ['document_id', 'type', 'content', 'path']);

      const connection = await this.dataAccessLayer.getConnection();
      const now = new Date();
      const id = this.generateId();

      const newBlock: BlockEntity = {
        ...block,
        id,
        created_at: now,
        updated_at: now,
        properties: block.properties || {},
        sort_order: block.sort_order || 0,
        is_deleted: false
      };

      await connection.run(`
        INSERT INTO blocks (
          id, document_id, parent_id, type, content, properties, 
          sort_order, path, is_deleted, created_at, updated_at, 
          created_by, updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        newBlock.id,
        newBlock.document_id,
        newBlock.parent_id,
        newBlock.type,
        this.stringifyJSON(newBlock.content),
        this.stringifyJSON(newBlock.properties),
        newBlock.sort_order,
        newBlock.path,
        newBlock.is_deleted ? 1 : 0,
        this.formatDate(newBlock.created_at),
        this.formatDate(newBlock.updated_at),
        newBlock.created_by,
        newBlock.updated_by
      ]);

      this.log(`块创建成功: ${newBlock.id}`);
      return newBlock;
    }, '创建块');
  }

  /**
   * 根据ID获取块
   */
  public async getBlockById(id: string): Promise<BlockEntity | null> {
    return await this.executeWithTiming(async () => {
      this.validateRequired({ id }, ['id']);

      const connection = await this.dataAccessLayer.getConnection();
      const row = await connection.get(`
        SELECT * FROM blocks WHERE id = ? AND is_deleted = 0
      `, [id]);

      return row ? this.mapRowToBlock(row) : null;
    }, '获取块');
  }

  /**
   * 根据文档ID获取所有块
   */
  public async getBlocksByDocumentId(documentId: string): Promise<BlockEntity[]> {
    return await this.executeWithTiming(async () => {
      this.validateRequired({ documentId }, ['documentId']);

      const connection = await this.dataAccessLayer.getConnection();
      const rows = await connection.query(`
        SELECT * FROM blocks 
        WHERE document_id = ? AND is_deleted = 0 
        ORDER BY sort_order ASC, created_at ASC
      `, [documentId]);

      return rows.map(row => this.mapRowToBlock(row));
    }, '获取文档块');
  }

  /**
   * 获取子块
   */
  public async getChildBlocks(parentId: string): Promise<BlockEntity[]> {
    return await this.executeWithTiming(async () => {
      this.validateRequired({ parentId }, ['parentId']);

      const connection = await this.dataAccessLayer.getConnection();
      const rows = await connection.query(`
        SELECT * FROM blocks 
        WHERE parent_id = ? AND is_deleted = 0 
        ORDER BY sort_order ASC, created_at ASC
      `, [parentId]);

      return rows.map(row => this.mapRowToBlock(row));
    }, '获取子块');
  }

  /**
   * 更新块
   */
  public async updateBlock(id: string, updates: Partial<BlockEntity>): Promise<BlockEntity> {
    return await this.executeWithTiming(async () => {
      this.validateRequired({ id }, ['id']);

      const connection = await this.dataAccessLayer.getConnection();
      const now = new Date();

      // 构建更新字段
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      if (updates.type !== undefined) {
        updateFields.push('type = ?');
        updateValues.push(updates.type);
      }

      if (updates.content !== undefined) {
        updateFields.push('content = ?');
        updateValues.push(this.stringifyJSON(updates.content));
      }

      if (updates.properties !== undefined) {
        updateFields.push('properties = ?');
        updateValues.push(this.stringifyJSON(updates.properties));
      }

      if (updates.parent_id !== undefined) {
        updateFields.push('parent_id = ?');
        updateValues.push(updates.parent_id);
      }

      if (updates.sort_order !== undefined) {
        updateFields.push('sort_order = ?');
        updateValues.push(updates.sort_order);
      }

      if (updates.path !== undefined) {
        updateFields.push('path = ?');
        updateValues.push(updates.path);
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
        UPDATE blocks SET ${updateFields.join(', ')} WHERE id = ?
      `, updateValues);

      const updatedBlock = await this.getBlockById(id);
      if (!updatedBlock) {
        throw new Error('块更新后未找到');
      }

      this.log(`块更新成功: ${id}`);
      return updatedBlock;
    }, '更新块');
  }

  /**
   * 删除块（软删除）
   */
  public async deleteBlock(id: string): Promise<void> {
    return await this.executeWithTiming(async () => {
      this.validateRequired({ id }, ['id']);

      const connection = await this.dataAccessLayer.getConnection();
      const now = new Date();

      // 软删除块及其所有子块
      await connection.run(`
        UPDATE blocks SET is_deleted = 1, updated_at = ? 
        WHERE id = ? OR parent_id = ?
      `, [this.formatDate(now), id, id]);

      this.log(`块删除成功: ${id}`);
    }, '删除块');
  }

  /**
   * 移动块
   */
  public async moveBlock(id: string, newParentId: string | null, newSortOrder?: number): Promise<BlockEntity> {
    return await this.executeWithTiming(async () => {
      this.validateRequired({ id }, ['id']);

      const connection = await this.dataAccessLayer.getConnection();
      const transaction = await connection.beginTransaction();

      try {
        // 获取当前块
        const currentBlock = await this.getBlockById(id);
        if (!currentBlock) {
          throw new Error('块不存在');
        }

        // 如果没有指定新的排序位置，则放到最后
        let sortOrder = newSortOrder;
        if (sortOrder === undefined) {
          const siblings = newParentId 
            ? await this.getChildBlocks(newParentId)
            : await this.getRootBlocks(currentBlock.document_id);
          
          sortOrder = siblings.length > 0 
            ? Math.max(...siblings.map(b => b.sort_order)) + 1 
            : 0;
        }

        // 更新块的父级和排序
        const updates: Partial<BlockEntity> = {
          parent_id: newParentId,
          sort_order: sortOrder
        };

        // 如果父级改变了，需要更新路径
        if (newParentId !== currentBlock.parent_id) {
          const newPath = newParentId 
            ? `${await this.getBlockPath(newParentId)}/${id}`
            : id;
          updates.path = newPath;
        }

        const updatedBlock = await this.updateBlock(id, updates);

        await transaction.commit();
        this.log(`块移动成功: ${id}`);
        return updatedBlock;
      } catch (error) {
        await transaction.rollback();
        throw error;
      }
    }, '移动块');
  }

  /**
   * 查询块
   */
  public async queryBlocks(options: QueryOptions = {}): Promise<QueryResult<BlockEntity>> {
    return await this.executeWithTiming(async () => {
      const connection = await this.dataAccessLayer.getConnection();
      
      let whereClause = 'WHERE is_deleted = 0';
      const params: any[] = [];

      // 构建查询条件
      if (options.filters) {
        const filterConditions: string[] = [];
        
        if (options.filters.document_id) {
          filterConditions.push('document_id = ?');
          params.push(options.filters.document_id);
        }

        if (options.filters.parent_id !== undefined) {
          filterConditions.push('parent_id = ?');
          params.push(options.filters.parent_id);
        }

        if (options.filters.type) {
          filterConditions.push('type = ?');
          params.push(options.filters.type);
        }

        if (filterConditions.length > 0) {
          whereClause += ' AND ' + filterConditions.join(' AND ');
        }
      }

      // 搜索条件
      if (options.search) {
        whereClause += ' AND content LIKE ?';
        params.push(`%${options.search}%`);
      }

      // 排序
      const sortBy = options.sort_by || 'sort_order';
      const sortOrder = options.sort_order || 'asc';
      const orderClause = `ORDER BY ${sortBy} ${sortOrder}`;

      // 分页
      const limit = options.limit || 100;
      const offset = options.offset || 0;
      const limitClause = `LIMIT ? OFFSET ?`;

      // 获取总数
      const countResult = await connection.get<{ count: number }>(
        `SELECT COUNT(*) as count FROM blocks ${whereClause}`,
        params
      );
      const total = countResult?.count || 0;

      // 获取数据
      const rows = await connection.query(
        `SELECT * FROM blocks ${whereClause} ${orderClause} ${limitClause}`,
        [...params, limit, offset]
      );

      const blocks = rows.map(row => this.mapRowToBlock(row));

      const page = Math.floor(offset / limit) + 1;
      const totalPages = Math.ceil(total / limit);

      return {
        data: blocks,
        total,
        page,
        page_size: limit,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1
      };
    }, '查询块');
  }

  /**
   * 获取根级块
   */
  public async getRootBlocks(documentId: string): Promise<BlockEntity[]> {
    return await this.executeWithTiming(async () => {
      this.validateRequired({ documentId }, ['documentId']);

      const connection = await this.dataAccessLayer.getConnection();
      const rows = await connection.query(`
        SELECT * FROM blocks 
        WHERE document_id = ? AND parent_id IS NULL AND is_deleted = 0 
        ORDER BY sort_order ASC, created_at ASC
      `, [documentId]);

      return rows.map(row => this.mapRowToBlock(row));
    }, '获取根级块');
  }

  /**
   * 获取块路径
   */
  private async getBlockPath(blockId: string): Promise<string> {
    const block = await this.getBlockById(blockId);
    if (!block) {
      throw new Error('块不存在');
    }
    return block.path;
  }

  /**
   * 处理编辑器块创建事件
   */
  public async handleBlockCreated(data: any): Promise<void> {
    this.logDebug('处理块创建事件', data);
    // 这里可以添加块创建后的处理逻辑
  }

  /**
   * 处理编辑器块更新事件
   */
  public async handleBlockUpdated(data: any): Promise<void> {
    this.logDebug('处理块更新事件', data);
    // 这里可以添加块更新后的处理逻辑
  }

  /**
   * 将数据库行映射为块实体
   */
  private mapRowToBlock(row: any): BlockEntity {
    return {
      id: row.id,
      document_id: row.document_id,
      parent_id: row.parent_id,
      type: row.type,
      content: this.parseJSON(row.content, {}),
      properties: this.parseJSON(row.properties, {}),
      sort_order: row.sort_order,
      path: row.path,
      is_deleted: Boolean(row.is_deleted),
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
      created_by: row.created_by,
      updated_by: row.updated_by
    };
  }
}
