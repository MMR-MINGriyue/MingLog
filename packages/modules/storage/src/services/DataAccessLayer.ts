/**
 * 数据访问层实现
 * 提供数据库连接、事务管理和基础数据操作
 */

import { DatabaseManager } from '@minglog/core';
import type { 
  DataAccessLayer, 
  DatabaseConnection, 
  Transaction, 
  StorageConfig,
  DatabaseStats 
} from '../types';

/**
 * 数据库连接实现
 */
export class DatabaseConnectionImpl implements DatabaseConnection {
  private db: any;
  private isConnectedFlag = false;

  constructor(db: any) {
    this.db = db;
    this.isConnectedFlag = true;
  }

  /**
   * 执行查询
   */
  public async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    try {
      return await this.db.all(sql, params || []);
    } catch (error) {
      throw new Error(`查询执行失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 执行单个查询
   */
  public async get<T = any>(sql: string, params?: any[]): Promise<T | undefined> {
    try {
      return await this.db.get(sql, params || []);
    } catch (error) {
      throw new Error(`查询执行失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 执行更新
   */
  public async run(sql: string, params?: any[]): Promise<{ changes: number; lastInsertRowid: number }> {
    try {
      const result = await this.db.run(sql, params || []);
      return {
        changes: result.changes || 0,
        lastInsertRowid: result.lastID || 0
      };
    } catch (error) {
      throw new Error(`更新执行失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 开始事务
   */
  public async beginTransaction(): Promise<Transaction> {
    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await this.db.run('BEGIN TRANSACTION');
    
    return new TransactionImpl(this.db, transactionId);
  }

  /**
   * 关闭连接
   */
  public async close(): Promise<void> {
    if (this.isConnectedFlag) {
      await this.db.close();
      this.isConnectedFlag = false;
    }
  }

  /**
   * 是否已连接
   */
  public isConnected(): boolean {
    return this.isConnectedFlag;
  }
}

/**
 * 事务实现
 */
export class TransactionImpl implements Transaction {
  private db: any;
  private transactionId: string;
  private completed = false;

  constructor(db: any, transactionId: string) {
    this.db = db;
    this.transactionId = transactionId;
  }

  /**
   * 获取事务ID
   */
  public get id(): string {
    return this.transactionId;
  }

  /**
   * 提交事务
   */
  public async commit(): Promise<void> {
    if (this.completed) {
      throw new Error('事务已完成');
    }

    try {
      await this.db.run('COMMIT');
      this.completed = true;
    } catch (error) {
      await this.rollback();
      throw new Error(`事务提交失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 回滚事务
   */
  public async rollback(): Promise<void> {
    if (this.completed) {
      return;
    }

    try {
      await this.db.run('ROLLBACK');
      this.completed = true;
    } catch (error) {
      throw new Error(`事务回滚失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 是否已完成
   */
  public isCompleted(): boolean {
    return this.completed;
  }
}

/**
 * 数据访问层实现
 */
export class DataAccessLayerImpl implements DataAccessLayer {
  private databaseManager: DatabaseManager;
  private config: StorageConfig;
  private connection: DatabaseConnection | null = null;

  constructor(config: StorageConfig) {
    this.config = config;
    this.databaseManager = new DatabaseManager({
      path: config.database_path,
      options: {
        enableWAL: config.enable_wal,
        enableForeignKeys: config.enable_foreign_keys,
        timeout: config.query_timeout
      }
    });
  }

  /**
   * 获取数据库连接
   */
  public async getConnection(): Promise<DatabaseConnection> {
    if (!this.connection || !this.connection.isConnected()) {
      const db = await this.databaseManager.getDatabase();
      this.connection = new DatabaseConnectionImpl(db);
    }
    return this.connection;
  }

  /**
   * 执行迁移
   */
  public async migrate(): Promise<void> {
    const connection = await this.getConnection();
    
    try {
      // 创建文档表
      await connection.run(`
        CREATE TABLE IF NOT EXISTS documents (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'draft',
          parent_id TEXT,
          path TEXT NOT NULL,
          icon TEXT,
          cover TEXT,
          tags TEXT NOT NULL DEFAULT '[]',
          metadata TEXT NOT NULL DEFAULT '{}',
          is_template BOOLEAN NOT NULL DEFAULT 0,
          template_id TEXT,
          sort_order INTEGER NOT NULL DEFAULT 0,
          permissions TEXT NOT NULL DEFAULT '{}',
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          created_by TEXT,
          updated_by TEXT,
          FOREIGN KEY (parent_id) REFERENCES documents(id) ON DELETE SET NULL,
          FOREIGN KEY (template_id) REFERENCES documents(id) ON DELETE SET NULL
        )
      `);

      // 创建块表
      await connection.run(`
        CREATE TABLE IF NOT EXISTS blocks (
          id TEXT PRIMARY KEY,
          document_id TEXT NOT NULL,
          parent_id TEXT,
          type TEXT NOT NULL,
          content TEXT NOT NULL,
          properties TEXT NOT NULL DEFAULT '{}',
          sort_order INTEGER NOT NULL DEFAULT 0,
          path TEXT NOT NULL,
          is_deleted BOOLEAN NOT NULL DEFAULT 0,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          created_by TEXT,
          updated_by TEXT,
          FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
          FOREIGN KEY (parent_id) REFERENCES blocks(id) ON DELETE CASCADE
        )
      `);

      // 创建版本表
      await connection.run(`
        CREATE TABLE IF NOT EXISTS versions (
          id TEXT PRIMARY KEY,
          entity_id TEXT NOT NULL,
          entity_type TEXT NOT NULL CHECK (entity_type IN ('document', 'block')),
          version INTEGER NOT NULL,
          content TEXT NOT NULL,
          change_description TEXT,
          change_type TEXT NOT NULL CHECK (change_type IN ('create', 'update', 'delete', 'restore')),
          change_size INTEGER NOT NULL DEFAULT 0,
          is_auto_save BOOLEAN NOT NULL DEFAULT 0,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          created_by TEXT,
          updated_by TEXT
        )
      `);

      // 创建索引
      await this.createIndexes(connection);

      console.log('数据库迁移完成');
    } catch (error) {
      throw new Error(`数据库迁移失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 创建索引
   */
  private async createIndexes(connection: DatabaseConnection): Promise<void> {
    const indexes = [
      // 文档索引
      'CREATE INDEX IF NOT EXISTS idx_documents_parent_id ON documents(parent_id)',
      'CREATE INDEX IF NOT EXISTS idx_documents_path ON documents(path)',
      'CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status)',
      'CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_documents_updated_at ON documents(updated_at)',
      
      // 块索引
      'CREATE INDEX IF NOT EXISTS idx_blocks_document_id ON blocks(document_id)',
      'CREATE INDEX IF NOT EXISTS idx_blocks_parent_id ON blocks(parent_id)',
      'CREATE INDEX IF NOT EXISTS idx_blocks_type ON blocks(type)',
      'CREATE INDEX IF NOT EXISTS idx_blocks_path ON blocks(path)',
      'CREATE INDEX IF NOT EXISTS idx_blocks_is_deleted ON blocks(is_deleted)',
      
      // 版本索引
      'CREATE INDEX IF NOT EXISTS idx_versions_entity_id ON versions(entity_id)',
      'CREATE INDEX IF NOT EXISTS idx_versions_entity_type ON versions(entity_type)',
      'CREATE INDEX IF NOT EXISTS idx_versions_version ON versions(version)',
      'CREATE INDEX IF NOT EXISTS idx_versions_created_at ON versions(created_at)'
    ];

    for (const indexSql of indexes) {
      await connection.run(indexSql);
    }
  }

  /**
   * 检查数据库健康状态
   */
  public async healthCheck(): Promise<boolean> {
    try {
      const connection = await this.getConnection();
      await connection.get('SELECT 1');
      return true;
    } catch (error) {
      console.error('数据库健康检查失败:', error);
      return false;
    }
  }

  /**
   * 获取数据库统计信息
   */
  public async getStats(): Promise<DatabaseStats> {
    const connection = await this.getConnection();

    try {
      // 获取数据库大小
      const sizeResult = await connection.get<{ page_count: number; page_size: number }>(
        'PRAGMA page_count, page_size'
      );
      const size = (sizeResult?.page_count || 0) * (sizeResult?.page_size || 0);

      // 获取表数量
      const tableResult = await connection.query<{ count: number }>(
        "SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'"
      );
      const tableCount = tableResult[0]?.count || 0;

      // 获取文档数量
      const documentResult = await connection.query<{ count: number }>(
        'SELECT COUNT(*) as count FROM documents WHERE status != "deleted"'
      );
      const documentCount = documentResult[0]?.count || 0;

      // 获取块数量
      const blockResult = await connection.query<{ count: number }>(
        'SELECT COUNT(*) as count FROM blocks WHERE is_deleted = 0'
      );
      const blockCount = blockResult[0]?.count || 0;

      // 获取版本数量
      const versionResult = await connection.query<{ count: number }>(
        'SELECT COUNT(*) as count FROM versions'
      );
      const versionCount = versionResult[0]?.count || 0;

      // 获取最后更新时间
      const lastUpdatedResult = await connection.get<{ updated_at: string }>(
        'SELECT MAX(updated_at) as updated_at FROM documents'
      );
      const lastUpdated = lastUpdatedResult?.updated_at 
        ? new Date(lastUpdatedResult.updated_at) 
        : new Date();

      return {
        size,
        table_count: tableCount,
        document_count: documentCount,
        block_count: blockCount,
        version_count: versionCount,
        last_updated: lastUpdated
      };
    } catch (error) {
      throw new Error(`获取数据库统计信息失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
}
