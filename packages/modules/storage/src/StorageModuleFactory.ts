/**
 * 数据存储模块工厂
 * 负责创建和配置存储模块实例
 */

import { BaseModuleFactory, type ModuleConfig } from '@minglog/core';
import { StorageModule, type StorageModuleConfig } from './StorageModule';
import type { StorageConfig } from './types';
import path from 'path';
import os from 'os';

/**
 * 存储模块工厂类
 */
export class StorageModuleFactory extends BaseModuleFactory<StorageModule> {
  /**
   * 创建存储模块实例
   */
  public create(config?: Partial<StorageModuleConfig>): StorageModule {
    const fullConfig = this.createDefaultConfig(config);
    return new StorageModule(fullConfig);
  }

  /**
   * 创建默认配置
   */
  private createDefaultConfig(config?: Partial<StorageModuleConfig>): StorageModuleConfig {
    const defaultStorageConfig: StorageConfig = {
      database_path: this.getDefaultDatabasePath(),
      enable_wal: true,
      pool_size: 10,
      query_timeout: 30000,
      enable_foreign_keys: true,
      enable_sync: true,
      backup: {
        enabled: true,
        interval: 24, // 24小时
        retention_days: 30,
        backup_dir: this.getDefaultBackupDir()
      }
    };

    const defaultConfig: StorageModuleConfig = {
      name: StorageModule.MODULE_NAME,
      version: StorageModule.MODULE_VERSION,
      enabled: true,
      storage: defaultStorageConfig
    };

    return this.mergeConfigs(defaultConfig, config);
  }

  /**
   * 获取默认数据库路径
   */
  private getDefaultDatabasePath(): string {
    const userDataDir = this.getUserDataDirectory();
    return path.join(userDataDir, 'minglog.db');
  }

  /**
   * 获取默认备份目录
   */
  private getDefaultBackupDir(): string {
    const userDataDir = this.getUserDataDirectory();
    return path.join(userDataDir, 'backups');
  }

  /**
   * 获取用户数据目录
   */
  private getUserDataDirectory(): string {
    const platform = os.platform();
    const homeDir = os.homedir();

    switch (platform) {
      case 'win32':
        return path.join(homeDir, 'AppData', 'Local', 'MingLog');
      case 'darwin':
        return path.join(homeDir, 'Library', 'Application Support', 'MingLog');
      case 'linux':
        return path.join(homeDir, '.config', 'minglog');
      default:
        return path.join(homeDir, '.minglog');
    }
  }

  /**
   * 创建开发环境配置
   */
  public createDevelopmentConfig(config?: Partial<StorageModuleConfig>): StorageModuleConfig {
    const devStorageConfig: StorageConfig = {
      database_path: path.join(process.cwd(), 'data', 'dev', 'minglog.db'),
      enable_wal: false, // 开发环境禁用WAL以便调试
      pool_size: 5,
      query_timeout: 10000,
      enable_foreign_keys: true,
      enable_sync: false, // 开发环境禁用同步
      backup: {
        enabled: false, // 开发环境禁用备份
        interval: 24,
        retention_days: 7,
        backup_dir: path.join(process.cwd(), 'data', 'dev', 'backups')
      }
    };

    const devConfig: StorageModuleConfig = {
      name: StorageModule.MODULE_NAME,
      version: StorageModule.MODULE_VERSION,
      enabled: true,
      storage: devStorageConfig
    };

    return this.mergeConfigs(devConfig, config);
  }

  /**
   * 创建测试环境配置
   */
  public createTestConfig(config?: Partial<StorageModuleConfig>): StorageModuleConfig {
    const testStorageConfig: StorageConfig = {
      database_path: ':memory:', // 使用内存数据库
      enable_wal: false,
      pool_size: 1,
      query_timeout: 5000,
      enable_foreign_keys: true,
      enable_sync: false,
      backup: {
        enabled: false,
        interval: 24,
        retention_days: 1,
        backup_dir: '/tmp/minglog-test-backups'
      }
    };

    const testConfig: StorageModuleConfig = {
      name: StorageModule.MODULE_NAME,
      version: StorageModule.MODULE_VERSION,
      enabled: true,
      storage: testStorageConfig
    };

    return this.mergeConfigs(testConfig, config);
  }

  /**
   * 创建生产环境配置
   */
  public createProductionConfig(config?: Partial<StorageModuleConfig>): StorageModuleConfig {
    const prodStorageConfig: StorageConfig = {
      database_path: this.getDefaultDatabasePath(),
      enable_wal: true,
      pool_size: 20,
      query_timeout: 60000,
      enable_foreign_keys: true,
      enable_sync: true,
      backup: {
        enabled: true,
        interval: 6, // 6小时备份一次
        retention_days: 90,
        backup_dir: this.getDefaultBackupDir()
      }
    };

    const prodConfig: StorageModuleConfig = {
      name: StorageModule.MODULE_NAME,
      version: StorageModule.MODULE_VERSION,
      enabled: true,
      storage: prodStorageConfig
    };

    return this.mergeConfigs(prodConfig, config);
  }

  /**
   * 验证配置
   */
  public validateConfig(config: StorageModuleConfig): boolean {
    try {
      // 验证基础配置
      if (!config.name || !config.version) {
        throw new Error('模块名称和版本不能为空');
      }

      // 验证存储配置
      const storage = config.storage;
      if (!storage) {
        throw new Error('存储配置不能为空');
      }

      if (!storage.database_path) {
        throw new Error('数据库路径不能为空');
      }

      if (storage.pool_size <= 0) {
        throw new Error('连接池大小必须大于0');
      }

      if (storage.query_timeout <= 0) {
        throw new Error('查询超时时间必须大于0');
      }

      // 验证备份配置
      if (storage.backup.enabled) {
        if (storage.backup.interval <= 0) {
          throw new Error('备份间隔必须大于0');
        }

        if (storage.backup.retention_days <= 0) {
          throw new Error('备份保留天数必须大于0');
        }

        if (!storage.backup.backup_dir) {
          throw new Error('备份目录不能为空');
        }
      }

      return true;
    } catch (error) {
      console.error('存储模块配置验证失败:', error);
      return false;
    }
  }

  /**
   * 获取配置模板
   */
  public getConfigTemplate(): StorageModuleConfig {
    return {
      name: StorageModule.MODULE_NAME,
      version: StorageModule.MODULE_VERSION,
      enabled: true,
      storage: {
        database_path: '/path/to/minglog.db',
        enable_wal: true,
        pool_size: 10,
        query_timeout: 30000,
        enable_foreign_keys: true,
        enable_sync: true,
        backup: {
          enabled: true,
          interval: 24,
          retention_days: 30,
          backup_dir: '/path/to/backups'
        }
      }
    };
  }

  /**
   * 合并配置
   */
  private mergeConfigs(
    defaultConfig: StorageModuleConfig, 
    userConfig?: Partial<StorageModuleConfig>
  ): StorageModuleConfig {
    if (!userConfig) {
      return defaultConfig;
    }

    return {
      ...defaultConfig,
      ...userConfig,
      storage: {
        ...defaultConfig.storage,
        ...userConfig.storage,
        backup: {
          ...defaultConfig.storage.backup,
          ...userConfig.storage?.backup
        }
      }
    };
  }

  /**
   * 创建配置构建器
   */
  public createConfigBuilder(): StorageConfigBuilder {
    return new StorageConfigBuilder();
  }
}

/**
 * 存储配置构建器
 */
export class StorageConfigBuilder {
  private config: Partial<StorageModuleConfig> = {};

  /**
   * 设置数据库路径
   */
  public databasePath(path: string): this {
    if (!this.config.storage) {
      this.config.storage = {} as StorageConfig;
    }
    this.config.storage.database_path = path;
    return this;
  }

  /**
   * 启用/禁用WAL模式
   */
  public enableWAL(enabled: boolean): this {
    if (!this.config.storage) {
      this.config.storage = {} as StorageConfig;
    }
    this.config.storage.enable_wal = enabled;
    return this;
  }

  /**
   * 设置连接池大小
   */
  public poolSize(size: number): this {
    if (!this.config.storage) {
      this.config.storage = {} as StorageConfig;
    }
    this.config.storage.pool_size = size;
    return this;
  }

  /**
   * 设置查询超时时间
   */
  public queryTimeout(timeout: number): this {
    if (!this.config.storage) {
      this.config.storage = {} as StorageConfig;
    }
    this.config.storage.query_timeout = timeout;
    return this;
  }

  /**
   * 配置备份
   */
  public backup(config: Partial<StorageConfig['backup']>): this {
    if (!this.config.storage) {
      this.config.storage = {} as StorageConfig;
    }
    if (!this.config.storage.backup) {
      this.config.storage.backup = {} as StorageConfig['backup'];
    }
    Object.assign(this.config.storage.backup, config);
    return this;
  }

  /**
   * 构建配置
   */
  public build(): Partial<StorageModuleConfig> {
    return { ...this.config };
  }
}

/**
 * 默认存储模块工厂实例
 */
export const storageModuleFactory = new StorageModuleFactory();
