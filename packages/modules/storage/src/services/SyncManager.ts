/**
 * 同步管理器
 * 提供数据同步、备份和恢复功能
 */

import { BaseService } from './BaseService';
import type { 
  SyncResult, 
  SyncStatus, 
  StorageConfig,
  ImportExportOptions,
  DataAccessLayer 
} from '../types';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * 同步管理器类
 */
export class SyncManager extends BaseService {
  protected readonly serviceName = 'SyncManager';
  private syncConfig: StorageConfig;

  constructor(dataAccessLayer: DataAccessLayer, config: StorageConfig) {
    super(dataAccessLayer);
    this.syncConfig = config;
  }

  /**
   * 初始化服务
   */
  protected async onInitialize(): Promise<void> {
    // 确保备份目录存在
    if (this.syncConfig.backup.enabled) {
      await this.ensureBackupDirectory();
    }
    this.log('同步管理器初始化完成');
  }

  /**
   * 启动服务
   */
  protected async onStart(): Promise<void> {
    // 启动自动备份
    if (this.syncConfig.backup.enabled) {
      this.startAutoBackup();
    }
    this.log('同步管理器启动完成');
  }

  /**
   * 停止服务
   */
  protected async onStop(): Promise<void> {
    // 停止自动备份
    this.stopAutoBackup();
    this.log('同步管理器停止完成');
  }

  /**
   * 配置更新处理
   */
  protected async onConfigUpdate(config: StorageConfig): Promise<void> {
    this.syncConfig = config;
    
    // 重新启动自动备份
    this.stopAutoBackup();
    if (config.backup.enabled) {
      await this.ensureBackupDirectory();
      this.startAutoBackup();
    }
  }

  /**
   * 执行数据同步
   */
  public async sync(): Promise<SyncResult> {
    return await this.executeWithTiming(async () => {
      const startTime = new Date();
      let status: SyncStatus = SyncStatus.SYNCING;
      let syncedDocuments = 0;
      let syncedBlocks = 0;
      let conflicts = 0;
      const errors: string[] = [];

      try {
        // 这里实现具体的同步逻辑
        // 目前是简化实现，主要用于架构演示
        
        // 模拟同步过程
        await this.sleep(100);
        
        status = SyncStatus.SUCCESS;
        this.log('数据同步完成');
      } catch (error) {
        status = SyncStatus.ERROR;
        const errorMessage = error instanceof Error ? error.message : '未知错误';
        errors.push(errorMessage);
        this.logError('数据同步失败', error);
      }

      const completedAt = new Date();
      const duration = completedAt.getTime() - startTime.getTime();

      return {
        status,
        synced_documents: syncedDocuments,
        synced_blocks: syncedBlocks,
        conflicts,
        errors,
        started_at: startTime,
        completed_at: completedAt,
        duration
      };
    }, '数据同步');
  }

  /**
   * 创建数据备份
   */
  public async createBackup(): Promise<string> {
    return await this.executeWithTiming(async () => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `minglog-backup-${timestamp}.db`;
      const backupPath = path.join(this.syncConfig.backup.backup_dir, backupFileName);

      try {
        // 复制数据库文件
        await fs.copyFile(this.syncConfig.database_path, backupPath);
        
        this.log(`备份创建成功: ${backupPath}`);
        return backupPath;
      } catch (error) {
        this.logError('备份创建失败', error);
        throw error;
      }
    }, '创建备份');
  }

  /**
   * 恢复数据备份
   */
  public async restoreBackup(backupPath: string): Promise<void> {
    return await this.executeWithTiming(async () => {
      try {
        // 检查备份文件是否存在
        await fs.access(backupPath);
        
        // 创建当前数据库的备份
        const currentBackupPath = await this.createBackup();
        this.log(`当前数据库已备份到: ${currentBackupPath}`);
        
        // 恢复备份
        await fs.copyFile(backupPath, this.syncConfig.database_path);
        
        this.log(`数据恢复成功: ${backupPath}`);
      } catch (error) {
        this.logError('数据恢复失败', error);
        throw error;
      }
    }, '恢复备份');
  }

  /**
   * 导出数据
   */
  public async exportData(options: ImportExportOptions): Promise<string> {
    return await this.executeWithTiming(async () => {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const exportFileName = `minglog-export-${timestamp}.${options.format}`;
      const exportPath = path.join(this.syncConfig.backup.backup_dir, exportFileName);

      try {
        const connection = await this.dataAccessLayer.getConnection();
        
        // 获取要导出的数据
        const documents = await connection.query('SELECT * FROM documents WHERE status != "deleted"');
        const blocks = await connection.query('SELECT * FROM blocks WHERE is_deleted = 0');
        
        let exportData: any = {
          documents,
          blocks,
          exported_at: new Date().toISOString(),
          version: '1.0.0'
        };

        if (options.include_metadata) {
          const stats = await this.dataAccessLayer.getStats();
          exportData.metadata = stats;
        }

        if (options.include_versions) {
          const versions = await connection.query('SELECT * FROM versions');
          exportData.versions = versions;
        }

        // 根据格式导出
        switch (options.format) {
          case 'json':
            await fs.writeFile(exportPath, JSON.stringify(exportData, null, 2));
            break;
          case 'markdown':
            const markdownContent = this.convertToMarkdown(exportData);
            await fs.writeFile(exportPath, markdownContent);
            break;
          default:
            throw new Error(`不支持的导出格式: ${options.format}`);
        }

        this.log(`数据导出成功: ${exportPath}`);
        return exportPath;
      } catch (error) {
        this.logError('数据导出失败', error);
        throw error;
      }
    }, '导出数据');
  }

  /**
   * 导入数据
   */
  public async importData(filePath: string, options: ImportExportOptions): Promise<void> {
    return await this.executeWithTiming(async () => {
      try {
        // 检查文件是否存在
        await fs.access(filePath);
        
        const fileContent = await fs.readFile(filePath, 'utf-8');
        let importData: any;

        // 根据格式解析数据
        switch (options.format) {
          case 'json':
            importData = JSON.parse(fileContent);
            break;
          default:
            throw new Error(`不支持的导入格式: ${options.format}`);
        }

        // 导入数据到数据库
        await this.importToDatabase(importData);
        
        this.log(`数据导入成功: ${filePath}`);
      } catch (error) {
        this.logError('数据导入失败', error);
        throw error;
      }
    }, '导入数据');
  }

  /**
   * 检查数据完整性
   */
  public async checkDataIntegrity(): Promise<{
    isValid: boolean;
    issues: string[];
    stats: any;
  }> {
    return await this.executeWithTiming(async () => {
      const issues: string[] = [];
      const connection = await this.dataAccessLayer.getConnection();

      try {
        // 检查外键约束
        const orphanedBlocks = await connection.query(`
          SELECT COUNT(*) as count FROM blocks 
          WHERE document_id NOT IN (SELECT id FROM documents)
        `);
        
        if (orphanedBlocks[0]?.count > 0) {
          issues.push(`发现 ${orphanedBlocks[0].count} 个孤立的块`);
        }

        // 检查数据一致性
        const stats = await this.dataAccessLayer.getStats();
        
        const isValid = issues.length === 0;
        
        if (isValid) {
          this.log('数据完整性检查通过');
        } else {
          this.logWarning('数据完整性检查发现问题', issues);
        }

        return {
          isValid,
          issues,
          stats
        };
      } catch (error) {
        this.logError('数据完整性检查失败', error);
        throw error;
      }
    }, '数据完整性检查');
  }

  /**
   * 清理旧备份
   */
  public async cleanupOldBackups(): Promise<number> {
    return await this.executeWithTiming(async () => {
      try {
        const backupDir = this.syncConfig.backup.backup_dir;
        const retentionDays = this.syncConfig.backup.retention_days;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

        const files = await fs.readdir(backupDir);
        let deletedCount = 0;

        for (const file of files) {
          if (file.startsWith('minglog-backup-')) {
            const filePath = path.join(backupDir, file);
            const stats = await fs.stat(filePath);
            
            if (stats.mtime < cutoffDate) {
              await fs.unlink(filePath);
              deletedCount++;
            }
          }
        }

        this.log(`清理了 ${deletedCount} 个旧备份文件`);
        return deletedCount;
      } catch (error) {
        this.logError('清理旧备份失败', error);
        throw error;
      }
    }, '清理旧备份');
  }

  private backupTimer: NodeJS.Timeout | null = null;

  /**
   * 启动自动备份
   */
  private startAutoBackup(): void {
    if (this.backupTimer) {
      return;
    }

    const intervalMs = this.syncConfig.backup.interval * 60 * 60 * 1000; // 转换为毫秒
    
    this.backupTimer = setInterval(async () => {
      try {
        await this.createBackup();
        await this.cleanupOldBackups();
      } catch (error) {
        this.logError('自动备份失败', error);
      }
    }, intervalMs);

    this.log(`自动备份已启动，间隔: ${this.syncConfig.backup.interval} 小时`);
  }

  /**
   * 停止自动备份
   */
  private stopAutoBackup(): void {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
      this.backupTimer = null;
      this.log('自动备份已停止');
    }
  }

  /**
   * 确保备份目录存在
   */
  private async ensureBackupDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.syncConfig.backup.backup_dir, { recursive: true });
    } catch (error) {
      this.logError('创建备份目录失败', error);
      throw error;
    }
  }

  /**
   * 转换为Markdown格式
   */
  private convertToMarkdown(data: any): string {
    // 简化的Markdown转换实现
    let markdown = '# MingLog 数据导出\n\n';
    markdown += `导出时间: ${data.exported_at}\n\n`;
    
    if (data.documents) {
      markdown += '## 文档\n\n';
      for (const doc of data.documents) {
        markdown += `### ${doc.title}\n\n`;
        markdown += `路径: ${doc.path}\n\n`;
        // 这里可以添加更详细的内容转换
      }
    }

    return markdown;
  }

  /**
   * 导入数据到数据库
   */
  private async importToDatabase(data: any): Promise<void> {
    const connection = await this.dataAccessLayer.getConnection();
    const transaction = await connection.beginTransaction();

    try {
      // 导入文档
      if (data.documents) {
        for (const doc of data.documents) {
          await connection.run(`
            INSERT OR REPLACE INTO documents (
              id, title, content, status, parent_id, path, icon, cover,
              tags, metadata, is_template, template_id, sort_order, permissions,
              created_at, updated_at, created_by, updated_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            doc.id, doc.title, doc.content, doc.status, doc.parent_id,
            doc.path, doc.icon, doc.cover, doc.tags, doc.metadata,
            doc.is_template, doc.template_id, doc.sort_order, doc.permissions,
            doc.created_at, doc.updated_at, doc.created_by, doc.updated_by
          ]);
        }
      }

      // 导入块
      if (data.blocks) {
        for (const block of data.blocks) {
          await connection.run(`
            INSERT OR REPLACE INTO blocks (
              id, document_id, parent_id, type, content, properties,
              sort_order, path, is_deleted, created_at, updated_at,
              created_by, updated_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            block.id, block.document_id, block.parent_id, block.type,
            block.content, block.properties, block.sort_order, block.path,
            block.is_deleted, block.created_at, block.updated_at,
            block.created_by, block.updated_by
          ]);
        }
      }

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}
