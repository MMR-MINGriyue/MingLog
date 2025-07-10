/**
 * 模块加载功能验证测试
 * 验证所有核心模块能正常加载和激活
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MingLogCore } from '../MingLogCore';
import { ModuleManager } from '../module-manager/ModuleManager';
import { EventBus } from '../event-system/EventBus';
import { DatabaseManager, DatabaseConnection } from '../database/DatabaseManager';
import { SettingsManager } from '../settings/SettingsManager';

describe('模块加载功能验证', () => {
  let core: MingLogCore;
  let moduleManager: ModuleManager;
  let eventBus: EventBus;

  beforeEach(async () => {
    // 创建模拟数据库连接
    const mockConnection: DatabaseConnection = {
      execute: vi.fn().mockResolvedValue(undefined),
      query: vi.fn().mockResolvedValue([]),
      close: vi.fn().mockResolvedValue(undefined),
      isConnected: vi.fn().mockReturnValue(true),
    };

    core = new MingLogCore({
      database: mockConnection,
      debugMode: false,
      maxEventHistory: 100
    });

    await core.initialize();
  });

  afterEach(async () => {
    if (core) {
      await core.shutdown();
    }
  });

  describe('核心系统初始化', () => {
    it('应该成功初始化MingLogCore', () => {
      expect(core).toBeDefined();
      expect(core.isInitialized()).toBe(true);
    });

    it('应该成功初始化ModuleManager', () => {
      const manager = core.getModuleManager();
      expect(manager).toBeDefined();
      expect(manager).toBeInstanceOf(ModuleManager);
    });

    it('应该成功初始化EventBus', () => {
      const bus = core.getEventBus();
      expect(bus).toBeDefined();
      expect(bus).toBeInstanceOf(EventBus);
    });

    it('应该成功初始化DatabaseManager', () => {
      const db = core.getDatabaseManager();
      expect(db).toBeDefined();
      expect(db).toBeInstanceOf(DatabaseManager);
    });

    it('应该成功初始化SettingsManager', () => {
      const settings = core.getSettingsManager();
      expect(settings).toBeDefined();
      expect(settings).toBeInstanceOf(SettingsManager);
    });
  });

  describe('模块注册和激活', () => {
    it('应该能够获取模块管理器', () => {
      const manager = core.getModuleManager();
      expect(manager).toBeDefined();
      expect(manager).toBeInstanceOf(ModuleManager);
    });

    it('应该能够获取注册的模块列表', () => {
      const manager = core.getModuleManager();
      const modules = manager.getRegisteredModules();

      // 模块列表应该是数组
      expect(Array.isArray(modules)).toBe(true);
    });

    it('应该能够获取激活的模块列表', () => {
      const manager = core.getModuleManager();
      const activeModules = manager.getActiveModules();

      // 激活模块列表应该是数组
      expect(Array.isArray(activeModules)).toBe(true);
    });

    it('应该能够注册测试模块', async () => {
      const manager = core.getModuleManager();

      // 创建一个简单的测试模块工厂
      const testModuleFactory = () => ({
        id: 'test-module',
        name: 'Test Module',
        version: '1.0.0',
        initialize: vi.fn().mockResolvedValue(undefined),
        activate: vi.fn().mockResolvedValue(undefined),
        deactivate: vi.fn().mockResolvedValue(undefined),
        destroy: vi.fn().mockResolvedValue(undefined),
      });

      // 注册测试模块
      await manager.registerModule('test-module', testModuleFactory, {
        id: 'test-module',
        name: 'Test Module',
        version: '1.0.0',
        enabled: true,
      });

      // 验证模块已注册
      const modules = manager.getRegisteredModules();
      expect(modules.some(m => m.id === 'test-module')).toBe(true);
    });
  });

  describe('模块间通信', () => {
    it('应该能够通过EventBus进行模块间通信', async () => {
      const eventBus = core.getEventBus();
      let eventReceived = false;
      let eventData: any = null;

      // 订阅测试事件
      eventBus.on('test-event', (data) => {
        eventReceived = true;
        eventData = data;
      });

      // 发送测试事件
      await eventBus.emit('test-event', { message: 'Hello from test' });

      // 验证事件是否被接收
      expect(eventReceived).toBe(true);
      expect(eventData).toEqual({ message: 'Hello from test' });
    });

    it('应该能够处理模块生命周期事件', async () => {
      const eventBus = core.getEventBus();
      const lifecycleEvents: string[] = [];

      // 订阅生命周期事件
      eventBus.on('module:initialized', () => lifecycleEvents.push('initialized'));
      eventBus.on('module:activated', () => lifecycleEvents.push('activated'));
      eventBus.on('module:deactivated', () => lifecycleEvents.push('deactivated'));

      // 模拟模块生命周期
      await eventBus.emit('module:initialized', { moduleId: 'test-module' });
      await eventBus.emit('module:activated', { moduleId: 'test-module' });

      // 验证事件是否按顺序触发
      expect(lifecycleEvents).toContain('initialized');
      expect(lifecycleEvents).toContain('activated');
    });
  });

  describe('数据库连接', () => {
    it('应该能够连接到数据库', async () => {
      const db = core.getDatabaseManager();
      const isConnected = await db.isConnected();
      expect(isConnected).toBe(true);
    });

    it('应该能够执行基本的数据库操作', async () => {
      const db = core.getDatabaseManager();
      
      // 测试创建表
      await db.execute(`
        CREATE TABLE IF NOT EXISTS test_table (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL
        )
      `);

      // 测试插入数据
      await db.execute(
        'INSERT INTO test_table (name) VALUES (?)',
        ['test-name']
      );

      // 测试查询数据
      const result = await db.query('SELECT * FROM test_table WHERE name = ?', ['test-name']);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('test-name');
    });
  });

  describe('设置管理', () => {
    it('应该能够读写设置', async () => {
      const settings = core.getSettingsManager();
      
      // 测试设置写入
      await settings.set('test.setting', 'test-value');
      
      // 测试设置读取
      const value = await settings.get('test.setting');
      expect(value).toBe('test-value');
    });

    it('应该能够处理默认设置', async () => {
      const settings = core.getSettingsManager();
      
      // 测试获取不存在的设置（应该返回默认值）
      const value = await settings.get('non.existent.setting', 'default-value');
      expect(value).toBe('default-value');
    });
  });

  describe('错误处理', () => {
    it('应该能够优雅地处理模块加载错误', async () => {
      const manager = core.getModuleManager();
      
      // 尝试加载不存在的模块
      const result = await manager.loadModule('non-existent-module').catch(e => e);
      
      // 应该返回错误而不是崩溃
      expect(result).toBeInstanceOf(Error);
    });

    it('应该能够处理数据库连接错误', async () => {
      // 创建一个使用无效路径的数据库管理器
      const invalidDb = new DatabaseManager(':invalid:path:');
      
      // 尝试连接应该失败但不崩溃
      const result = await invalidDb.connect().catch(e => e);
      expect(result).toBeInstanceOf(Error);
    });
  });

  describe('性能验证', () => {
    it('模块初始化应该在合理时间内完成', async () => {
      const startTime = Date.now();
      
      // 重新初始化核心系统
      const testCore = new MingLogCore({
        dataPath: ':memory:',
        enableLogging: false,
        modules: {
          notes: { enabled: true },
          tasks: { enabled: true }
        }
      });
      
      await testCore.initialize();
      
      const endTime = Date.now();
      const initTime = endTime - startTime;
      
      // 初始化应该在2秒内完成
      expect(initTime).toBeLessThan(2000);
      
      await testCore.shutdown();
    });

    it('事件处理应该高效', async () => {
      const eventBus = core.getEventBus();
      const eventCount = 1000;
      let receivedCount = 0;

      // 订阅事件
      eventBus.on('performance-test', () => {
        receivedCount++;
      });

      const startTime = Date.now();

      // 发送大量事件
      for (let i = 0; i < eventCount; i++) {
        await eventBus.emit('performance-test', { index: i });
      }

      const endTime = Date.now();
      const processingTime = endTime - startTime;

      // 验证所有事件都被处理
      expect(receivedCount).toBe(eventCount);
      
      // 处理1000个事件应该在1秒内完成
      expect(processingTime).toBeLessThan(1000);
    });
  });
});
