/**
 * MingLog 核心功能集成测试
 * 验证所有核心模块的协同工作
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MingLogCore } from '../../MingLogCore';
import { LinkManagerService } from '../../services/LinkManagerService';
import { SearchEngine } from '../../search/SearchEngine';
import { PageLinkParser } from '../../parsers/PageLinkParser';
import { BlockLinkParser } from '../../parsers/BlockLinkParser';
import { CacheManager } from '../../services/CacheManager';
import { PerformanceMonitor } from '../../services/PerformanceMonitor';
import type { DatabaseConnection } from '../../database/DatabaseManager';
import type { SearchDocument, PageLink, BlockLink } from '../../types/links';

// 模拟数据库连接
const createMockDatabase = (): DatabaseConnection => ({
  query: vi.fn().mockResolvedValue([]),
  execute: vi.fn().mockResolvedValue({ changes: 1, lastInsertRowid: 1 }),
  close: vi.fn().mockResolvedValue(undefined),
  prepare: vi.fn().mockReturnValue({
    run: vi.fn().mockReturnValue({ changes: 1, lastInsertRowid: 1 }),
    get: vi.fn().mockReturnValue(undefined),
    all: vi.fn().mockReturnValue([]),
    finalize: vi.fn()
  }),
  transaction: vi.fn().mockImplementation((callback) => callback()),
  backup: vi.fn().mockResolvedValue(undefined),
  pragma: vi.fn().mockResolvedValue([])
});

describe('MingLog 核心功能集成测试', () => {
  let core: MingLogCore;
  let mockDatabase: DatabaseConnection;
  let linkManager: LinkManagerService;
  let searchEngine: SearchEngine;
  let pageLinkParser: PageLinkParser;
  let blockLinkParser: BlockLinkParser;
  let cacheManager: CacheManager;
  let performanceMonitor: PerformanceMonitor;

  beforeEach(async () => {
    // 创建模拟数据库
    mockDatabase = createMockDatabase();
    
    // 初始化核心系统
    core = new MingLogCore({
      database: mockDatabase,
      debugMode: true,
      maxEventHistory: 100
    });

    // 初始化各个服务
    linkManager = new LinkManagerService();
    searchEngine = new SearchEngine();
    pageLinkParser = new PageLinkParser();
    blockLinkParser = new BlockLinkParser();
    cacheManager = new CacheManager();
    performanceMonitor = new PerformanceMonitor();

    // 初始化核心系统
    await core.initialize();
    
    // 启动性能监控
    performanceMonitor.start();
  });

  afterEach(async () => {
    // 停止性能监控
    performanceMonitor.stop();
    
    // 销毁核心系统
    await core.destroy();
  });

  describe('核心系统初始化', () => {
    it('应该成功初始化所有核心组件', async () => {
      // 验证核心组件是否正确初始化
      expect(core.getEventBus()).toBeDefined();
      expect(core.getDatabaseManager()).toBeDefined();
      expect(core.getSettingsManager()).toBeDefined();
      expect(core.getModuleManager()).toBeDefined();
      expect(core.getCoreAPI()).toBeDefined();
    });

    it('应该正确设置事件监听器', async () => {
      const eventBus = core.getEventBus();
      const mockHandler = vi.fn();

      // 测试事件系统
      eventBus.on('test:event', mockHandler);
      eventBus.emit('test:event', { data: 'test' }, 'TestSource');

      expect(mockHandler).toHaveBeenCalledWith({
        type: 'test:event',
        data: { data: 'test' },
        source: 'TestSource',
        timestamp: expect.any(Number)
      });
    });

    it('应该正确初始化数据库连接', async () => {
      const dbManager = core.getDatabaseManager();
      
      // 验证数据库连接
      expect(dbManager.getConnection()).toBe(mockDatabase);
      
      // 测试数据库操作
      await dbManager.query('SELECT 1');
      expect(mockDatabase.query).toHaveBeenCalledWith('SELECT 1', undefined);
    });
  });

  describe('模块注册和管理', () => {
    it('应该能够注册和激活模块', async () => {
      const moduleManager = core.getModuleManager();
      
      // 创建测试模块
      const testModule = {
        id: 'test-module',
        name: '测试模块',
        version: '1.0.0',
        activate: vi.fn().mockResolvedValue(undefined),
        deactivate: vi.fn().mockResolvedValue(undefined)
      };

      const moduleFactory = vi.fn().mockReturnValue(testModule);
      const moduleConfig = {
        dependencies: [],
        settings: {}
      };

      // 注册模块
      await core.registerModule('test-module', moduleFactory, moduleConfig);
      
      // 激活模块
      await core.activateModule('test-module');
      
      // 验证模块状态
      const activeModules = moduleManager.getActiveModules();
      expect(activeModules).toHaveLength(1);
      expect(activeModules[0].id).toBe('test-module');
      expect(testModule.activate).toHaveBeenCalled();
    });

    it('应该能够停用模块', async () => {
      const moduleManager = core.getModuleManager();
      
      // 创建并注册测试模块
      const testModule = {
        id: 'test-module',
        name: '测试模块',
        version: '1.0.0',
        activate: vi.fn().mockResolvedValue(undefined),
        deactivate: vi.fn().mockResolvedValue(undefined)
      };

      const moduleFactory = vi.fn().mockReturnValue(testModule);
      await core.registerModule('test-module', moduleFactory, {});
      await core.activateModule('test-module');
      
      // 停用模块
      await core.deactivateModule('test-module');
      
      // 验证模块状态
      const activeModules = moduleManager.getActiveModules();
      expect(activeModules).toHaveLength(0);
      expect(testModule.deactivate).toHaveBeenCalled();
    });
  });

  describe('核心API功能', () => {
    it('应该提供完整的事件API', () => {
      const coreAPI = core.getCoreAPI();
      const mockHandler = vi.fn();

      // 测试事件API
      coreAPI.events.on('api:test', mockHandler);
      coreAPI.events.emit('api:test', { message: 'test' });

      expect(mockHandler).toHaveBeenCalled();
    });

    it('应该提供数据库访问API', async () => {
      const coreAPI = core.getCoreAPI();

      // 测试数据库查询
      await coreAPI.database.query('SELECT * FROM test');
      expect(mockDatabase.query).toHaveBeenCalledWith('SELECT * FROM test', undefined);

      // 测试数据库执行
      await coreAPI.database.execute('INSERT INTO test VALUES (?)', ['value']);
      expect(mockDatabase.execute).toHaveBeenCalledWith('INSERT INTO test VALUES (?)', ['value']);
    });

    it('应该提供存储API', async () => {
      const coreAPI = core.getCoreAPI();

      // 模拟存储查询结果
      vi.mocked(mockDatabase.query).mockResolvedValueOnce([
        { value: JSON.stringify({ test: 'data' }) }
      ]);

      // 测试存储操作
      await coreAPI.storage.set('test-key', { test: 'data' });
      const result = await coreAPI.storage.get('test-key');

      expect(result).toEqual({ test: 'data' });
    });

    it('应该提供通知API', () => {
      const coreAPI = core.getCoreAPI();
      const eventBus = core.getEventBus();
      const mockHandler = vi.fn();

      // 监听通知事件
      eventBus.on('notification:success', mockHandler);

      // 发送通知
      coreAPI.notifications.success('测试标题', '测试消息');

      expect(mockHandler).toHaveBeenCalledWith({
        type: 'notification:success',
        data: { title: '测试标题', message: '测试消息' },
        source: 'CoreAPI',
        timestamp: expect.any(Number)
      });
    });
  });

  describe('设置管理', () => {
    it('应该能够管理全局设置', async () => {
      const settingsManager = core.getSettingsManager();

      // 注册设置模式
      const schema = {
        type: 'object',
        properties: {
          theme: { type: 'string', default: 'light' },
          language: { type: 'string', default: 'zh-CN' }
        }
      };

      settingsManager.registerModuleSchema('test-module', schema);

      // 设置模块设置
      await settingsManager.setModuleSettings('test-module', {
        theme: 'dark',
        language: 'en-US'
      });

      // 获取模块设置
      const settings = await settingsManager.getModuleSettings('test-module');
      expect(settings.theme).toBe('dark');
      expect(settings.language).toBe('en-US');
    });

    it('应该验证设置值', async () => {
      const settingsManager = core.getSettingsManager();

      // 注册严格的设置模式
      const schema = {
        type: 'object',
        properties: {
          count: { type: 'number', minimum: 0, maximum: 100 }
        },
        required: ['count']
      };

      settingsManager.registerModuleSchema('strict-module', schema);

      // 测试有效设置
      await expect(
        settingsManager.setModuleSettings('strict-module', { count: 50 })
      ).resolves.not.toThrow();

      // 测试无效设置
      await expect(
        settingsManager.setModuleSettings('strict-module', { count: -1 })
      ).rejects.toThrow();
    });
  });

  describe('错误处理和恢复', () => {
    it('应该正确处理模块激活错误', async () => {
      const failingModule = {
        id: 'failing-module',
        name: '失败模块',
        version: '1.0.0',
        activate: vi.fn().mockRejectedValue(new Error('Activation failed')),
        deactivate: vi.fn().mockResolvedValue(undefined)
      };

      const moduleFactory = vi.fn().mockReturnValue(failingModule);

      // 注册模块
      await core.registerModule('failing-module', moduleFactory, {});

      // 激活应该失败
      await expect(core.activateModule('failing-module')).rejects.toThrow('Activation failed');

      // 验证模块未被激活
      const activeModules = core.getModuleManager().getActiveModules();
      expect(activeModules).toHaveLength(0);
    });

    it('应该正确处理数据库错误', async () => {
      const coreAPI = core.getCoreAPI();

      // 模拟数据库错误
      vi.mocked(mockDatabase.query).mockRejectedValueOnce(new Error('Database error'));

      // 数据库操作应该抛出错误
      await expect(coreAPI.database.query('SELECT * FROM test')).rejects.toThrow('Database error');
    });

    it('应该在销毁时正确清理资源', async () => {
      const eventBus = core.getEventBus();
      const mockHandler = vi.fn();

      // 添加事件监听器
      eventBus.on('test:cleanup', mockHandler);

      // 销毁核心系统
      await core.destroy();

      // 验证数据库连接被关闭
      expect(mockDatabase.close).toHaveBeenCalled();

      // 验证事件总线被销毁（事件不应该再被触发）
      eventBus.emit('test:cleanup', {}, 'Test');
      expect(mockHandler).not.toHaveBeenCalled();
    });
  });

  describe('性能监控', () => {
    it('应该记录核心操作的性能指标', async () => {
      const coreAPI = core.getCoreAPI();

      // 执行一些操作
      await performanceMonitor.measureAsync('core-operation', async () => {
        await coreAPI.storage.set('perf-test', { data: 'test' });
        await coreAPI.storage.get('perf-test');
      });

      // 验证性能指标
      const metrics = performanceMonitor.getMetricStats('core-operation');
      expect(metrics.count).toBe(1);
      expect(metrics.avg).toBeGreaterThan(0);
    });

    it('应该监控内存使用情况', async () => {
      // 创建一些数据
      const largeData = new Array(1000).fill(0).map((_, i) => ({
        id: i,
        data: `test-data-${i}`.repeat(100)
      }));

      // 存储数据
      for (let i = 0; i < 10; i++) {
        await core.getCoreAPI().storage.set(`large-data-${i}`, largeData);
      }

      // 检查性能报告
      const report = performanceMonitor.generateReport();
      expect(report.metrics.length).toBeGreaterThan(0);
      expect(report.score).toBeGreaterThan(0);
    });
  });
});
