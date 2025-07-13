/**
 * 编辑器模块单元测试
 * 测试编辑器模块的核心功能、生命周期管理和集成能力
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EditorModule, type EditorModuleConfig } from './EditorModule';
import { EditorModuleFactory } from './EditorModuleFactory';
import { EDITOR_EVENTS, BLOCK_TYPES, EDITOR_COMMANDS } from './constants';

// Mock types for testing
interface MockEventBus {
  on: ReturnType<typeof vi.fn>;
  off: ReturnType<typeof vi.fn>;
  emit: ReturnType<typeof vi.fn>;
  once: ReturnType<typeof vi.fn>;
  removeAllListeners: ReturnType<typeof vi.fn>;
  listenerCount: ReturnType<typeof vi.fn>;
  getEventHistory: ReturnType<typeof vi.fn>;
}

interface MockCoreAPI {
  events: MockEventBus;
  storage: {
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    clear: ReturnType<typeof vi.fn>;
    keys: ReturnType<typeof vi.fn>;
  };
  settings: {
    get: ReturnType<typeof vi.fn>;
    set: ReturnType<typeof vi.fn>;
    delete: ReturnType<typeof vi.fn>;
    getAll: ReturnType<typeof vi.fn>;
    reset: ReturnType<typeof vi.fn>;
  };
  database: {
    query: ReturnType<typeof vi.fn>;
    execute: ReturnType<typeof vi.fn>;
    transaction: ReturnType<typeof vi.fn>;
  };
  modules: {
    get: ReturnType<typeof vi.fn>;
    getAll: ReturnType<typeof vi.fn>;
    isActive: ReturnType<typeof vi.fn>;
  };
}

describe('EditorModule', () => {
  let editorModule: EditorModule;
  let mockCoreAPI: MockCoreAPI;
  let mockEventBus: MockEventBus;
  let mockConfig: EditorModuleConfig;

  beforeEach(() => {
    // 创建Mock EventBus
    mockEventBus = {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
      once: vi.fn(),
      removeAllListeners: vi.fn(),
      listenerCount: vi.fn(),
      getEventHistory: vi.fn()
    };

    // 创建Mock CoreAPI
    mockCoreAPI = {
      events: mockEventBus,
      storage: {
        get: vi.fn(),
        set: vi.fn(),
        delete: vi.fn(),
        clear: vi.fn(),
        keys: vi.fn()
      },
      settings: {
        get: vi.fn().mockResolvedValue({}),
        set: vi.fn(),
        delete: vi.fn(),
        getAll: vi.fn(),
        reset: vi.fn()
      },
      database: {
        query: vi.fn(),
        execute: vi.fn(),
        transaction: vi.fn()
      },
      modules: {
        get: vi.fn(),
        getAll: vi.fn(),
        isActive: vi.fn()
      }
    };

    // 创建测试配置
    mockConfig = {
      id: 'editor',
      name: '编辑器模块',
      version: '1.0.0',
      description: '测试编辑器模块',
      enabled: true,
      dependencies: [],
      settings: {},
      author: 'Test',
      category: '测试',
      editorSettings: {
        autoSaveInterval: 30000,
        spellCheck: true,
        syntaxHighlight: true,
        fontSize: 16,
        fontFamily: 'Inter',
        darkMode: false,
        enableBidirectionalLinks: true,
        enableBlockDragging: true,
        maxUndoHistory: 50
      },
      supportedBlockTypes: Object.values(BLOCK_TYPES),
      shortcuts: {
        'bold': 'Ctrl+B',
        'italic': 'Ctrl+I',
        'save': 'Ctrl+S'
      }
    };

    editorModule = new EditorModule();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('模块生命周期', () => {
    it('应该正确初始化编辑器模块', async () => {
      await editorModule.initialize(mockCoreAPI);

      expect(editorModule.getStatus().initialized).toBe(true);
      expect(mockEventBus.emit).toHaveBeenCalledWith(
        EDITOR_EVENTS.INITIALIZED,
        expect.objectContaining({
          moduleId: 'editor'
        }),
        'editor'
      );
    });

    it('应该防止重复初始化', async () => {
      await editorModule.initialize(mockCoreAPI);
      
      // 第二次初始化应该直接返回
      await editorModule.initialize(mockCoreAPI);
      
      // 只应该发送一次初始化事件
      expect(mockEventBus.emit).toHaveBeenCalledTimes(1);
    });

    it('应该正确激活模块', async () => {
      await editorModule.initialize(mockCoreAPI);
      await editorModule.activate();

      expect(mockEventBus.emit).toHaveBeenCalledWith(
        EDITOR_EVENTS.ACTIVATED,
        expect.objectContaining({
          moduleId: 'editor'
        }),
        'editor'
      );
    });

    it('应该在未初始化时拒绝激活', async () => {
      await expect(editorModule.activate()).rejects.toThrow('模块未初始化');
    });

    it('应该正确停用模块', async () => {
      await editorModule.initialize(mockCoreAPI);
      await editorModule.activate();
      await editorModule.deactivate();

      expect(mockEventBus.emit).toHaveBeenCalledWith(
        EDITOR_EVENTS.DEACTIVATED,
        expect.objectContaining({
          moduleId: 'editor'
        }),
        'editor'
      );
    });

    it('应该正确销毁模块', async () => {
      await editorModule.initialize(mockCoreAPI);
      await editorModule.destroy();

      expect(editorModule.getStatus().initialized).toBe(false);
      expect(mockEventBus.emit).toHaveBeenCalledWith(
        EDITOR_EVENTS.DESTROYED,
        expect.objectContaining({
          moduleId: 'editor'
        }),
        'editor'
      );
    });
  });

  describe('模块状态', () => {
    it('应该返回正确的模块状态', async () => {
      const status = editorModule.getStatus();

      expect(status).toEqual({
        id: 'editor',
        name: '编辑器模块',
        version: '1.0.0',
        initialized: false,
        autoSaveEnabled: false,
        supportedBlockTypes: [],
        settings: {}
      });
    });

    it('应该在初始化后更新状态', async () => {
      await editorModule.initialize(mockCoreAPI);
      const status = editorModule.getStatus();

      expect(status.initialized).toBe(true);
      expect(status.supportedBlockTypes).toEqual(Object.values(BLOCK_TYPES));
    });
  });

  describe('编辑器服务', () => {
    it('应该在初始化后提供编辑器服务', async () => {
      await editorModule.initialize(mockCoreAPI);
      
      const service = editorModule.getEditorService();
      expect(service).toBeDefined();
      expect(typeof service.createDocument).toBe('function');
      expect(typeof service.openDocument).toBe('function');
      expect(typeof service.saveDocument).toBe('function');
    });

    it('应该在未初始化时拒绝提供服务', () => {
      expect(() => editorModule.getEditorService()).toThrow('编辑器服务未初始化');
    });
  });

  describe('事件处理', () => {
    beforeEach(async () => {
      await editorModule.initialize(mockCoreAPI);
    });

    it('应该注册事件监听器', () => {
      expect(mockEventBus.on).toHaveBeenCalledWith('document:changed', expect.any(Function));
      expect(mockEventBus.on).toHaveBeenCalledWith('settings:changed', expect.any(Function));
      expect(mockEventBus.on).toHaveBeenCalledWith('link:created', expect.any(Function));
    });

    it('应该在销毁时移除事件监听器', async () => {
      await editorModule.destroy();
      
      expect(mockEventBus.off).toHaveBeenCalledWith('document:changed', expect.any(Function));
      expect(mockEventBus.off).toHaveBeenCalledWith('settings:changed', expect.any(Function));
      expect(mockEventBus.off).toHaveBeenCalledWith('link:created', expect.any(Function));
    });
  });

  describe('自动保存功能', () => {
    beforeEach(async () => {
      await editorModule.initialize(mockCoreAPI);
    });

    it('应该启动自动保存定时器', async () => {
      await editorModule.activate();
      
      const status = editorModule.getStatus();
      expect(status.autoSaveEnabled).toBe(true);
    });

    it('应该在停用时停止自动保存', async () => {
      await editorModule.activate();
      await editorModule.deactivate();
      
      const status = editorModule.getStatus();
      expect(status.autoSaveEnabled).toBe(false);
    });

    it('应该定期发送自动保存事件', async () => {
      vi.useFakeTimers();
      
      await editorModule.activate();
      
      // 快进30秒
      vi.advanceTimersByTime(30000);
      
      expect(mockEventBus.emit).toHaveBeenCalledWith(
        EDITOR_EVENTS.AUTO_SAVE,
        {},
        'editor'
      );
      
      vi.useRealTimers();
    });
  });

  describe('配置管理', () => {
    it('应该加载默认配置', async () => {
      await editorModule.initialize(mockCoreAPI);
      
      const status = editorModule.getStatus();
      expect(status.settings).toBeDefined();
      expect(status.settings.autoSaveInterval).toBe(30000);
    });

    it('应该处理配置加载错误', async () => {
      mockCoreAPI.settings.get.mockRejectedValue(new Error('配置加载失败'));
      
      // 应该使用默认配置而不是抛出错误
      await expect(editorModule.initialize(mockCoreAPI)).resolves.not.toThrow();
    });
  });

  describe('性能测试', () => {
    it('应该快速初始化模块', async () => {
      const startTime = performance.now();
      
      await editorModule.initialize(mockCoreAPI);
      
      const endTime = performance.now();
      const initTime = endTime - startTime;
      
      // 初始化时间应该小于100ms
      expect(initTime).toBeLessThan(100);
    });

    it('应该快速获取模块状态', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 1000; i++) {
        editorModule.getStatus();
      }
      
      const endTime = performance.now();
      const avgTime = (endTime - startTime) / 1000;
      
      // 平均获取状态时间应该小于1ms
      expect(avgTime).toBeLessThan(1);
    });
  });
});

describe('EditorModuleFactory', () => {
  let factory: EditorModuleFactory;

  beforeEach(() => {
    factory = new EditorModuleFactory();
  });

  describe('模块创建', () => {
    it('应该创建编辑器模块实例', async () => {
      const config = factory.getDefaultConfig();
      const module = await factory.create(config);

      expect(module).toBeInstanceOf(EditorModule);
      expect(module.id).toBe('editor');
    });

    it('应该验证模块配置', async () => {
      const invalidConfig = {
        id: 'wrong-id',
        name: '错误配置',
        version: '1.0.0',
        description: '测试',
        enabled: true,
        dependencies: [],
        settings: {},
        author: 'Test',
        category: '测试'
      } as any;

      await expect(factory.create(invalidConfig)).rejects.toThrow('编辑器模块ID必须为"editor"');
    });

    it('应该验证编辑器设置', async () => {
      const config = factory.getDefaultConfig();
      config.editorSettings.autoSaveInterval = 500; // 小于1秒

      await expect(factory.create(config)).rejects.toThrow('自动保存间隔不能小于1秒');
    });
  });

  describe('兼容性检查', () => {
    it('应该检查核心版本兼容性', () => {
      expect(factory.checkCompatibility('1.0.0')).toBe(true);
      expect(factory.checkCompatibility('1.5.0')).toBe(true);
      expect(factory.checkCompatibility('2.0.0')).toBe(true);
      expect(factory.checkCompatibility('0.9.0')).toBe(false);
    });
  });

  describe('模块信息', () => {
    it('应该返回正确的依赖列表', () => {
      const dependencies = factory.getDependencies();
      expect(dependencies).toEqual([]);
    });

    it('应该返回提供的服务列表', () => {
      const services = factory.getProvidedServices();
      expect(services).toContain('editor');
      expect(services).toContain('document-manager');
      expect(services).toContain('block-editor');
    });

    it('应该返回所需权限列表', () => {
      const permissions = factory.getRequiredPermissions();
      expect(permissions).toContain('storage.read');
      expect(permissions).toContain('storage.write');
      expect(permissions).toContain('file.read');
      expect(permissions).toContain('file.write');
    });
  });
});
