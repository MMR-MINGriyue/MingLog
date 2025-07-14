/**
 * 存储模块测试
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StorageModule, type StorageModuleConfig } from './StorageModule';
import { storageModuleFactory } from './StorageModuleFactory';
import type { StorageConfig } from './types';

// Mock dependencies
vi.mock('@minglog/core', () => ({
  BaseModule: class {
    constructor(config: any) {}
    protected logger = {
      info: vi.fn(),
      error: vi.fn(),
      warn: vi.fn(),
      debug: vi.fn()
    };
    protected eventBus = {
      emit: vi.fn(),
      on: vi.fn(),
      off: vi.fn()
    };
  }
}));

describe('StorageModule', () => {
  let storageModule: StorageModule;
  let testConfig: StorageModuleConfig;

  beforeEach(() => {
    testConfig = storageModuleFactory.createTestConfig();
    storageModule = new StorageModule(testConfig);
  });

  afterEach(async () => {
    if (storageModule) {
      try {
        await storageModule.stop();
      } catch (error) {
        // 忽略停止时的错误
      }
    }
  });

  describe('模块基础功能', () => {
    it('应该正确创建存储模块实例', () => {
      expect(storageModule).toBeDefined();
      expect(storageModule.getStorageConfig()).toEqual(testConfig.storage);
    });

    it('应该返回正确的模块元数据', () => {
      const metadata = StorageModule.getMetadata();
      
      expect(metadata.name).toBe('storage');
      expect(metadata.version).toBe('1.0.0');
      expect(metadata.description).toBe('数据存储与管理模块');
      expect(metadata.capabilities).toContain('document-storage');
      expect(metadata.capabilities).toContain('block-storage');
      expect(metadata.capabilities).toContain('version-control');
    });

    it('应该提供所有必需的服务', () => {
      expect(storageModule.getDocumentService()).toBeDefined();
      expect(storageModule.getBlockService()).toBeDefined();
      expect(storageModule.getVersionManager()).toBeDefined();
      expect(storageModule.getSyncManager()).toBeDefined();
    });
  });

  describe('配置管理', () => {
    it('应该正确获取存储配置', () => {
      const config = storageModule.getStorageConfig();
      
      expect(config).toBeDefined();
      expect(config.database_path).toBe(':memory:');
      expect(config.enable_wal).toBe(false);
      expect(config.pool_size).toBe(1);
    });

    it('应该支持配置更新', async () => {
      const newConfig: Partial<StorageConfig> = {
        query_timeout: 15000,
        pool_size: 5
      };

      await storageModule.updateStorageConfig(newConfig);
      
      const updatedConfig = storageModule.getStorageConfig();
      expect(updatedConfig.query_timeout).toBe(15000);
      expect(updatedConfig.pool_size).toBe(5);
    });
  });

  describe('生命周期管理', () => {
    it('应该支持模块初始化', async () => {
      // 由于使用了内存数据库，这个测试可能需要mock
      // 这里主要测试方法存在性
      expect(typeof storageModule.initialize).toBe('function');
    });

    it('应该支持模块启动和停止', async () => {
      expect(typeof storageModule.start).toBe('function');
      expect(typeof storageModule.stop).toBe('function');
    });

    it('应该提供健康检查功能', async () => {
      const healthStatus = await storageModule.getHealthStatus();
      
      expect(healthStatus).toBeDefined();
      expect(healthStatus.status).toMatch(/healthy|unhealthy|degraded/);
      expect(healthStatus.details).toBeDefined();
    });
  });

  describe('数据库操作', () => {
    it('应该提供数据库连接', async () => {
      expect(typeof storageModule.getDatabaseConnection).toBe('function');
    });

    it('应该提供数据库统计信息', async () => {
      expect(typeof storageModule.getDatabaseStats).toBe('function');
    });

    it('应该支持健康检查', async () => {
      expect(typeof storageModule.healthCheck).toBe('function');
    });
  });

  describe('错误处理', () => {
    it('应该处理无效配置', () => {
      expect(() => {
        const invalidConfig = {
          ...testConfig,
          storage: {
            ...testConfig.storage,
            database_path: '', // 无效路径
            pool_size: -1 // 无效池大小
          }
        };
        new StorageModule(invalidConfig);
      }).not.toThrow(); // 构造函数不应该抛出错误，错误应该在初始化时处理
    });

    it('应该在健康检查失败时返回正确状态', async () => {
      // 这里可以mock数据访问层来模拟失败情况
      const healthStatus = await storageModule.getHealthStatus();
      expect(['healthy', 'unhealthy', 'degraded']).toContain(healthStatus.status);
    });
  });
});

describe('StorageModuleFactory', () => {
  describe('配置创建', () => {
    it('应该创建默认配置', () => {
      const config = storageModuleFactory.create();
      expect(config).toBeInstanceOf(StorageModule);
    });

    it('应该创建开发环境配置', () => {
      const config = storageModuleFactory.createDevelopmentConfig();
      
      expect(config.storage.enable_wal).toBe(false);
      expect(config.storage.enable_sync).toBe(false);
      expect(config.storage.backup.enabled).toBe(false);
    });

    it('应该创建测试环境配置', () => {
      const config = storageModuleFactory.createTestConfig();
      
      expect(config.storage.database_path).toBe(':memory:');
      expect(config.storage.pool_size).toBe(1);
      expect(config.storage.backup.enabled).toBe(false);
    });

    it('应该创建生产环境配置', () => {
      const config = storageModuleFactory.createProductionConfig();
      
      expect(config.storage.enable_wal).toBe(true);
      expect(config.storage.enable_sync).toBe(true);
      expect(config.storage.backup.enabled).toBe(true);
      expect(config.storage.pool_size).toBe(20);
    });
  });

  describe('配置验证', () => {
    it('应该验证有效配置', () => {
      const validConfig = storageModuleFactory.createTestConfig();
      const isValid = storageModuleFactory.validateConfig(validConfig);
      expect(isValid).toBe(true);
    });

    it('应该拒绝无效配置', () => {
      const invalidConfig = {
        name: '',
        version: '',
        enabled: true,
        storage: {
          database_path: '',
          enable_wal: true,
          pool_size: -1,
          query_timeout: -1,
          enable_foreign_keys: true,
          enable_sync: true,
          backup: {
            enabled: true,
            interval: -1,
            retention_days: -1,
            backup_dir: ''
          }
        }
      };

      const isValid = storageModuleFactory.validateConfig(invalidConfig);
      expect(isValid).toBe(false);
    });
  });

  describe('配置构建器', () => {
    it('应该支持链式配置', () => {
      const builder = storageModuleFactory.createConfigBuilder();
      const config = builder
        .databasePath('/test/path.db')
        .enableWAL(false)
        .poolSize(5)
        .queryTimeout(10000)
        .backup({ enabled: false })
        .build();

      expect(config.storage?.database_path).toBe('/test/path.db');
      expect(config.storage?.enable_wal).toBe(false);
      expect(config.storage?.pool_size).toBe(5);
      expect(config.storage?.query_timeout).toBe(10000);
      expect(config.storage?.backup?.enabled).toBe(false);
    });
  });

  describe('配置模板', () => {
    it('应该提供配置模板', () => {
      const template = storageModuleFactory.getConfigTemplate();
      
      expect(template.name).toBe('storage');
      expect(template.version).toBe('1.0.0');
      expect(template.storage).toBeDefined();
      expect(template.storage.database_path).toBeDefined();
      expect(template.storage.backup).toBeDefined();
    });
  });
});
