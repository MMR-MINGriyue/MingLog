/**
 * 数据存储模块
 * 提供完整的数据持久化和管理功能
 */

import { BaseModule, type ModuleConfig, type ModuleMetadata } from '@minglog/core';
import type { 
  StorageConfig, 
  DataAccessLayer, 
  DatabaseConnection,
  DatabaseStats 
} from './types';
import { DataAccessLayerImpl } from './services/DataAccessLayer';
import { DocumentService } from './services/DocumentService';
import { BlockService } from './services/BlockService';
import { VersionManager } from './services/VersionManager';
import { SyncManager } from './services/SyncManager';

/**
 * 存储模块配置接口
 */
export interface StorageModuleConfig extends ModuleConfig {
  /** 存储配置 */
  storage: StorageConfig;
}

/**
 * 存储模块类
 */
export class StorageModule extends BaseModule {
  /** 模块名称 */
  public static readonly MODULE_NAME = 'storage';
  
  /** 模块版本 */
  public static readonly MODULE_VERSION = '1.0.0';

  /** 数据访问层 */
  private dataAccessLayer: DataAccessLayer;
  
  /** 文档服务 */
  private documentService: DocumentService;
  
  /** 块服务 */
  private blockService: BlockService;
  
  /** 版本管理器 */
  private versionManager: VersionManager;
  
  /** 同步管理器 */
  private syncManager: SyncManager;

  /** 模块配置 */
  private storageConfig: StorageConfig;

  /**
   * 构造函数
   */
  constructor(config: StorageModuleConfig) {
    super(config);
    this.storageConfig = config.storage;
    this.initializeServices();
  }

  /**
   * 获取模块元数据
   */
  public static getMetadata(): ModuleMetadata {
    return {
      name: StorageModule.MODULE_NAME,
      version: StorageModule.MODULE_VERSION,
      description: '数据存储与管理模块',
      author: 'MingLog Team',
      dependencies: ['core'],
      optionalDependencies: ['editor'],
      capabilities: [
        'document-storage',
        'block-storage', 
        'version-control',
        'data-sync',
        'backup-restore',
        'search-index',
        'data-export',
        'data-import'
      ],
      permissions: [
        'database-read',
        'database-write',
        'file-system-read',
        'file-system-write'
      ]
    };
  }

  /**
   * 初始化服务
   */
  private initializeServices(): void {
    // 创建数据访问层
    this.dataAccessLayer = new DataAccessLayerImpl(this.storageConfig);
    
    // 创建核心服务
    this.documentService = new DocumentService(this.dataAccessLayer);
    this.blockService = new BlockService(this.dataAccessLayer);
    this.versionManager = new VersionManager(this.dataAccessLayer);
    this.syncManager = new SyncManager(this.dataAccessLayer, this.storageConfig);
  }

  /**
   * 模块初始化
   */
  public async initialize(): Promise<void> {
    try {
      this.logger.info('正在初始化数据存储模块...');

      // 初始化数据访问层
      await this.dataAccessLayer.migrate();
      
      // 检查数据库健康状态
      const isHealthy = await this.dataAccessLayer.healthCheck();
      if (!isHealthy) {
        throw new Error('数据库健康检查失败');
      }

      // 初始化各个服务
      await this.documentService.initialize();
      await this.blockService.initialize();
      await this.versionManager.initialize();
      await this.syncManager.initialize();

      // 注册事件监听器
      this.registerEventListeners();

      this.logger.info('数据存储模块初始化完成');
    } catch (error) {
      this.logger.error('数据存储模块初始化失败:', error);
      throw error;
    }
  }

  /**
   * 模块启动
   */
  public async start(): Promise<void> {
    try {
      this.logger.info('正在启动数据存储模块...');

      // 启动各个服务
      await this.documentService.start();
      await this.blockService.start();
      await this.versionManager.start();
      await this.syncManager.start();

      // 发送模块启动事件
      this.eventBus.emit('storage:module:started', {
        module: StorageModule.MODULE_NAME,
        version: StorageModule.MODULE_VERSION,
        timestamp: new Date()
      });

      this.logger.info('数据存储模块启动完成');
    } catch (error) {
      this.logger.error('数据存储模块启动失败:', error);
      throw error;
    }
  }

  /**
   * 模块停止
   */
  public async stop(): Promise<void> {
    try {
      this.logger.info('正在停止数据存储模块...');

      // 停止各个服务
      await this.syncManager.stop();
      await this.versionManager.stop();
      await this.blockService.stop();
      await this.documentService.stop();

      // 关闭数据库连接
      const connection = await this.dataAccessLayer.getConnection();
      await connection.close();

      // 发送模块停止事件
      this.eventBus.emit('storage:module:stopped', {
        module: StorageModule.MODULE_NAME,
        timestamp: new Date()
      });

      this.logger.info('数据存储模块停止完成');
    } catch (error) {
      this.logger.error('数据存储模块停止失败:', error);
      throw error;
    }
  }

  /**
   * 获取文档服务
   */
  public getDocumentService(): DocumentService {
    return this.documentService;
  }

  /**
   * 获取块服务
   */
  public getBlockService(): BlockService {
    return this.blockService;
  }

  /**
   * 获取版本管理器
   */
  public getVersionManager(): VersionManager {
    return this.versionManager;
  }

  /**
   * 获取同步管理器
   */
  public getSyncManager(): SyncManager {
    return this.syncManager;
  }

  /**
   * 获取数据库连接
   */
  public async getDatabaseConnection(): Promise<DatabaseConnection> {
    return await this.dataAccessLayer.getConnection();
  }

  /**
   * 获取数据库统计信息
   */
  public async getDatabaseStats(): Promise<DatabaseStats> {
    return await this.dataAccessLayer.getStats();
  }

  /**
   * 执行数据库健康检查
   */
  public async healthCheck(): Promise<boolean> {
    try {
      return await this.dataAccessLayer.healthCheck();
    } catch (error) {
      this.logger.error('数据库健康检查失败:', error);
      return false;
    }
  }

  /**
   * 注册事件监听器
   */
  private registerEventListeners(): void {
    // 监听编辑器事件
    this.eventBus.on('editor:document:created', async (data) => {
      await this.documentService.handleDocumentCreated(data);
    });

    this.eventBus.on('editor:document:updated', async (data) => {
      await this.documentService.handleDocumentUpdated(data);
    });

    this.eventBus.on('editor:block:created', async (data) => {
      await this.blockService.handleBlockCreated(data);
    });

    this.eventBus.on('editor:block:updated', async (data) => {
      await this.blockService.handleBlockUpdated(data);
    });

    // 监听系统事件
    this.eventBus.on('system:shutdown', async () => {
      await this.stop();
    });
  }

  /**
   * 获取模块健康状态
   */
  public async getHealthStatus(): Promise<{
    status: 'healthy' | 'unhealthy' | 'degraded';
    details: Record<string, any>;
  }> {
    try {
      const dbHealthy = await this.dataAccessLayer.healthCheck();
      const stats = await this.dataAccessLayer.getStats();

      return {
        status: dbHealthy ? 'healthy' : 'unhealthy',
        details: {
          database: {
            healthy: dbHealthy,
            size: stats.size,
            tables: stats.table_count,
            documents: stats.document_count,
            blocks: stats.block_count,
            versions: stats.version_count,
            lastUpdated: stats.last_updated
          },
          services: {
            documentService: this.documentService.isRunning(),
            blockService: this.blockService.isRunning(),
            versionManager: this.versionManager.isRunning(),
            syncManager: this.syncManager.isRunning()
          }
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error instanceof Error ? error.message : '未知错误'
        }
      };
    }
  }

  /**
   * 获取模块配置
   */
  public getStorageConfig(): StorageConfig {
    return { ...this.storageConfig };
  }

  /**
   * 更新模块配置
   */
  public async updateStorageConfig(config: Partial<StorageConfig>): Promise<void> {
    this.storageConfig = { ...this.storageConfig, ...config };
    
    // 通知各个服务配置已更新
    await this.documentService.updateConfig(this.storageConfig);
    await this.blockService.updateConfig(this.storageConfig);
    await this.versionManager.updateConfig(this.storageConfig);
    await this.syncManager.updateConfig(this.storageConfig);

    this.eventBus.emit('storage:config:updated', {
      config: this.storageConfig,
      timestamp: new Date()
    });
  }
}
