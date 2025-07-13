/**
 * 版本管理器
 * 提供文档和块的版本控制功能
 */

import { BaseService } from './BaseService';
import type { 
  VersionEntity, 
  QueryOptions, 
  QueryResult,
  DataAccessLayer 
} from '../types';

/**
 * 版本管理器类
 */
export class VersionManager extends BaseService {
  protected readonly serviceName = 'VersionManager';

  constructor(dataAccessLayer: DataAccessLayer) {
    super(dataAccessLayer);
  }

  /**
   * 初始化服务
   */
  protected async onInitialize(): Promise<void> {
    // 检查版本表是否存在
    const connection = await this.dataAccessLayer.getConnection();
    await connection.get("SELECT name FROM sqlite_master WHERE type='table' AND name='versions'");
    this.log('版本管理器初始化完成');
  }

  /**
   * 启动服务
   */
  protected async onStart(): Promise<void> {
    this.log('版本管理器启动完成');
  }

  /**
   * 停止服务
   */
  protected async onStop(): Promise<void> {
    this.log('版本管理器停止完成');
  }

  /**
   * 创建版本记录
   */
  public async createVersion(version: Omit<VersionEntity, 'id' | 'created_at' | 'updated_at'>): Promise<VersionEntity> {
    return await this.executeWithTiming(async () => {
      this.validateRequired(version, ['entity_id', 'entity_type', 'version', 'content', 'change_type']);

      const connection = await this.dataAccessLayer.getConnection();
      const now = new Date();
      const id = this.generateId();

      const newVersion: VersionEntity = {
        ...version,
        id,
        created_at: now,
        updated_at: now,
        change_size: version.change_size || 0,
        is_auto_save: version.is_auto_save || false
      };

      await connection.run(`
        INSERT INTO versions (
          id, entity_id, entity_type, version, content, change_description,
          change_type, change_size, is_auto_save, created_at, updated_at,
          created_by, updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        newVersion.id,
        newVersion.entity_id,
        newVersion.entity_type,
        newVersion.version,
        this.stringifyJSON(newVersion.content),
        newVersion.change_description,
        newVersion.change_type,
        newVersion.change_size,
        newVersion.is_auto_save ? 1 : 0,
        this.formatDate(newVersion.created_at),
        this.formatDate(newVersion.updated_at),
        newVersion.created_by,
        newVersion.updated_by
      ]);

      this.log(`版本记录创建成功: ${newVersion.id}`);
      return newVersion;
    }, '创建版本记录');
  }

  /**
   * 获取实体的版本历史
   */
  public async getVersionHistory(entityId: string, entityType: 'document' | 'block'): Promise<VersionEntity[]> {
    return await this.executeWithTiming(async () => {
      this.validateRequired({ entityId, entityType }, ['entityId', 'entityType']);

      const connection = await this.dataAccessLayer.getConnection();
      const rows = await connection.query(`
        SELECT * FROM versions 
        WHERE entity_id = ? AND entity_type = ? 
        ORDER BY version DESC
      `, [entityId, entityType]);

      return rows.map(row => this.mapRowToVersion(row));
    }, '获取版本历史');
  }

  /**
   * 获取特定版本
   */
  public async getVersion(entityId: string, entityType: 'document' | 'block', version: number): Promise<VersionEntity | null> {
    return await this.executeWithTiming(async () => {
      this.validateRequired({ entityId, entityType, version }, ['entityId', 'entityType', 'version']);

      const connection = await this.dataAccessLayer.getConnection();
      const row = await connection.get(`
        SELECT * FROM versions 
        WHERE entity_id = ? AND entity_type = ? AND version = ?
      `, [entityId, entityType, version]);

      return row ? this.mapRowToVersion(row) : null;
    }, '获取特定版本');
  }

  /**
   * 获取最新版本号
   */
  public async getLatestVersion(entityId: string, entityType: 'document' | 'block'): Promise<number> {
    return await this.executeWithTiming(async () => {
      this.validateRequired({ entityId, entityType }, ['entityId', 'entityType']);

      const connection = await this.dataAccessLayer.getConnection();
      const result = await connection.get<{ max_version: number }>(`
        SELECT MAX(version) as max_version FROM versions 
        WHERE entity_id = ? AND entity_type = ?
      `, [entityId, entityType]);

      return result?.max_version || 0;
    }, '获取最新版本号');
  }

  /**
   * 比较两个版本
   */
  public async compareVersions(
    entityId: string, 
    entityType: 'document' | 'block', 
    fromVersion: number, 
    toVersion: number
  ): Promise<{
    from: VersionEntity;
    to: VersionEntity;
    diff: any; // 这里可以实现具体的差异算法
  }> {
    return await this.executeWithTiming(async () => {
      const fromVersionEntity = await this.getVersion(entityId, entityType, fromVersion);
      const toVersionEntity = await this.getVersion(entityId, entityType, toVersion);

      if (!fromVersionEntity || !toVersionEntity) {
        throw new Error('版本不存在');
      }

      // 这里可以实现具体的差异比较算法
      const diff = this.calculateDiff(fromVersionEntity.content, toVersionEntity.content);

      return {
        from: fromVersionEntity,
        to: toVersionEntity,
        diff
      };
    }, '比较版本');
  }

  /**
   * 回滚到指定版本
   */
  public async rollbackToVersion(
    entityId: string, 
    entityType: 'document' | 'block', 
    targetVersion: number,
    userId?: string
  ): Promise<VersionEntity> {
    return await this.executeWithTiming(async () => {
      const targetVersionEntity = await this.getVersion(entityId, entityType, targetVersion);
      if (!targetVersionEntity) {
        throw new Error('目标版本不存在');
      }

      const latestVersion = await this.getLatestVersion(entityId, entityType);
      const newVersion = latestVersion + 1;

      // 创建新的版本记录，内容为目标版本的内容
      const rollbackVersion = await this.createVersion({
        entity_id: entityId,
        entity_type: entityType,
        version: newVersion,
        content: targetVersionEntity.content,
        change_description: `回滚到版本 ${targetVersion}`,
        change_type: 'restore',
        change_size: this.calculateContentSize(targetVersionEntity.content),
        is_auto_save: false,
        created_by: userId,
        updated_by: userId
      });

      this.log(`版本回滚成功: ${entityId} 回滚到版本 ${targetVersion}`);
      return rollbackVersion;
    }, '版本回滚');
  }

  /**
   * 清理旧版本
   */
  public async cleanupOldVersions(retentionDays: number = 30): Promise<number> {
    return await this.executeWithTiming(async () => {
      const connection = await this.dataAccessLayer.getConnection();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      const result = await connection.run(`
        DELETE FROM versions 
        WHERE created_at < ? AND is_auto_save = 1
      `, [this.formatDate(cutoffDate)]);

      const deletedCount = result.changes;
      this.log(`清理了 ${deletedCount} 个旧版本记录`);
      return deletedCount;
    }, '清理旧版本');
  }

  /**
   * 查询版本记录
   */
  public async queryVersions(options: QueryOptions = {}): Promise<QueryResult<VersionEntity>> {
    return await this.executeWithTiming(async () => {
      const connection = await this.dataAccessLayer.getConnection();
      
      let whereClause = 'WHERE 1=1';
      const params: any[] = [];

      // 构建查询条件
      if (options.filters) {
        const filterConditions: string[] = [];
        
        if (options.filters.entity_id) {
          filterConditions.push('entity_id = ?');
          params.push(options.filters.entity_id);
        }

        if (options.filters.entity_type) {
          filterConditions.push('entity_type = ?');
          params.push(options.filters.entity_type);
        }

        if (options.filters.change_type) {
          filterConditions.push('change_type = ?');
          params.push(options.filters.change_type);
        }

        if (options.filters.is_auto_save !== undefined) {
          filterConditions.push('is_auto_save = ?');
          params.push(options.filters.is_auto_save ? 1 : 0);
        }

        if (filterConditions.length > 0) {
          whereClause += ' AND ' + filterConditions.join(' AND ');
        }
      }

      // 排序
      const sortBy = options.sort_by || 'created_at';
      const sortOrder = options.sort_order || 'desc';
      const orderClause = `ORDER BY ${sortBy} ${sortOrder}`;

      // 分页
      const limit = options.limit || 50;
      const offset = options.offset || 0;
      const limitClause = `LIMIT ? OFFSET ?`;

      // 获取总数
      const countResult = await connection.get<{ count: number }>(
        `SELECT COUNT(*) as count FROM versions ${whereClause}`,
        params
      );
      const total = countResult?.count || 0;

      // 获取数据
      const rows = await connection.query(
        `SELECT * FROM versions ${whereClause} ${orderClause} ${limitClause}`,
        [...params, limit, offset]
      );

      const versions = rows.map(row => this.mapRowToVersion(row));

      const page = Math.floor(offset / limit) + 1;
      const totalPages = Math.ceil(total / limit);

      return {
        data: versions,
        total,
        page,
        page_size: limit,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1
      };
    }, '查询版本记录');
  }

  /**
   * 计算内容差异
   */
  private calculateDiff(fromContent: any, toContent: any): any {
    // 这里可以实现具体的差异算法，比如使用 diff 库
    // 简化实现，返回基本信息
    return {
      hasChanges: JSON.stringify(fromContent) !== JSON.stringify(toContent),
      fromSize: this.calculateContentSize(fromContent),
      toSize: this.calculateContentSize(toContent)
    };
  }

  /**
   * 计算内容大小
   */
  private calculateContentSize(content: any): number {
    return new Blob([JSON.stringify(content)]).size;
  }

  /**
   * 将数据库行映射为版本实体
   */
  private mapRowToVersion(row: any): VersionEntity {
    return {
      id: row.id,
      entity_id: row.entity_id,
      entity_type: row.entity_type,
      version: row.version,
      content: this.parseJSON(row.content, {}),
      change_description: row.change_description,
      change_type: row.change_type,
      change_size: row.change_size,
      is_auto_save: Boolean(row.is_auto_save),
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
      created_by: row.created_by,
      updated_by: row.updated_by
    };
  }
}
