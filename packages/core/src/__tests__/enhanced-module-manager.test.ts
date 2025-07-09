/**
 * 增强模块管理器测试
 * 测试热重载、依赖解析、错误边界等新功能
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ModuleManager } from '../module-manager/ModuleManager'
import { EventBus } from '../event-system/EventBus'
import { Module, ModuleConfig, ModuleFactory, ModuleStatus, CoreAPI } from '../types'

// 模拟模块实现
class TestModule implements Module {
  readonly id: string
  readonly name: string
  readonly version: string = '1.0.0'
  readonly description: string = 'Test module'
  readonly dependencies: string[] = []

  private isInitialized = false
  private isActivated = false

  constructor(id: string, name: string, dependencies: string[] = []) {
    this.id = id
    this.name = name
    this.dependencies = dependencies
  }

  async initialize(core: CoreAPI): Promise<void> {
    this.isInitialized = true
  }

  async activate(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('Module not initialized')
    }
    this.isActivated = true
  }

  async deactivate(): Promise<void> {
    this.isActivated = false
  }

  async destroy(): Promise<void> {
    this.isInitialized = false
    this.isActivated = false
  }

  getStatus(): ModuleStatus {
    if (this.isActivated) return ModuleStatus.ACTIVE
    if (this.isInitialized) return ModuleStatus.LOADED
    return ModuleStatus.UNLOADED
  }
}

// 错误模块（用于测试错误处理）
class ErrorModule extends TestModule {
  private shouldFailOnActivate: boolean

  constructor(id: string, shouldFailOnActivate = false) {
    super(id, `Error Module ${id}`)
    this.shouldFailOnActivate = shouldFailOnActivate
  }

  async activate(): Promise<void> {
    if (this.shouldFailOnActivate) {
      throw new Error(`Activation failed for ${this.id}`)
    }
    await super.activate()
  }
}

// 模块工厂
class TestModuleFactory implements ModuleFactory {
  constructor(private moduleClass: typeof TestModule = TestModule) {}

  async create(config: ModuleConfig): Promise<Module> {
    return new this.moduleClass(config.id, config.name, config.dependencies)
  }
}

describe('Enhanced ModuleManager', () => {
  let eventBus: EventBus
  let moduleManager: ModuleManager
  let mockCoreAPI: CoreAPI

  beforeEach(() => {
    eventBus = new EventBus({ debugMode: true, enableMetrics: true })
    
    mockCoreAPI = {
      events: {
        emit: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
        once: vi.fn()
      },
      database: {
        query: vi.fn(),
        execute: vi.fn(),
        transaction: vi.fn()
      },
      storage: {
        get: vi.fn(),
        set: vi.fn(),
        remove: vi.fn(),
        clear: vi.fn()
      },
      notifications: {
        success: vi.fn(),
        error: vi.fn(),
        warning: vi.fn(),
        info: vi.fn()
      },
      router: {
        navigate: vi.fn(),
        getCurrentPath: vi.fn(),
        addRoutes: vi.fn(),
        removeRoutes: vi.fn()
      },
      settings: {
        get: vi.fn(),
        set: vi.fn(),
        getModuleSettings: vi.fn(),
        setModuleSettings: vi.fn()
      }
    }

    moduleManager = new ModuleManager(eventBus, mockCoreAPI, {
      enableHotReload: true,
      maxRetryAttempts: 2
    })
  })

  afterEach(() => {
    eventBus.destroy()
  })

  describe('依赖管理', () => {
    it('应该正确构建依赖图', async () => {
      const moduleA: ModuleConfig = {
        id: 'moduleA',
        name: 'Module A',
        description: 'Test module A',
        version: '1.0.0',
        enabled: true,
        dependencies: [],
        settings: {}
      }

      const moduleB: ModuleConfig = {
        id: 'moduleB',
        name: 'Module B',
        description: 'Test module B',
        version: '1.0.0',
        enabled: true,
        dependencies: ['moduleA'],
        settings: {}
      }

      await moduleManager.registerModule('moduleA', new TestModuleFactory(), moduleA)
      await moduleManager.registerModule('moduleB', new TestModuleFactory(), moduleB)

      const dependencyTree = moduleManager.getDependencyTree('moduleB')
      expect(dependencyTree.dependencies).toHaveLength(1)
      expect(dependencyTree.dependencies[0].id).toBe('moduleA')
    })

    it('应该检测循环依赖', async () => {
      const moduleA: ModuleConfig = {
        id: 'moduleA',
        name: 'Module A',
        description: 'Test module A',
        version: '1.0.0',
        enabled: true,
        dependencies: ['moduleB'],
        settings: {}
      }

      const moduleB: ModuleConfig = {
        id: 'moduleB',
        name: 'Module B',
        description: 'Test module B',
        version: '1.0.0',
        enabled: true,
        dependencies: ['moduleA'],
        settings: {}
      }

      await moduleManager.registerModule('moduleA', new TestModuleFactory(), moduleA)
      await moduleManager.registerModule('moduleB', new TestModuleFactory(), moduleB)

      await expect(moduleManager.loadModule('moduleA')).rejects.toThrow('Circular dependency detected')
    })

    it('应该按正确顺序激活依赖模块', async () => {
      const activationOrder: string[] = []
      
      class TrackingModule extends TestModule {
        async activate(): Promise<void> {
          activationOrder.push(this.id)
          await super.activate()
        }
      }

      const moduleA: ModuleConfig = {
        id: 'moduleA',
        name: 'Module A',
        description: 'Test module A',
        version: '1.0.0',
        enabled: true,
        dependencies: [],
        settings: {}
      }

      const moduleB: ModuleConfig = {
        id: 'moduleB',
        name: 'Module B',
        description: 'Test module B',
        version: '1.0.0',
        enabled: true,
        dependencies: ['moduleA'],
        settings: {}
      }

      await moduleManager.registerModule('moduleA', new TestModuleFactory(TrackingModule), moduleA)
      await moduleManager.registerModule('moduleB', new TestModuleFactory(TrackingModule), moduleB)

      await moduleManager.activateModule('moduleB')

      expect(activationOrder).toEqual(['moduleA', 'moduleB'])
    })
  })

  describe('错误处理和恢复', () => {
    it('应该处理模块激活错误', async () => {
      const errorModule: ModuleConfig = {
        id: 'errorModule',
        name: 'Error Module',
        description: 'Module that fails on activation',
        version: '1.0.0',
        enabled: true,
        dependencies: [],
        settings: {}
      }

      class ErrorModuleFactory implements ModuleFactory {
        async create(config: ModuleConfig): Promise<Module> {
          return new ErrorModule(config.id, true)
        }
      }

      await moduleManager.registerModule('errorModule', new ErrorModuleFactory(), errorModule)

      await expect(moduleManager.activateModule('errorModule')).rejects.toThrow('Activation failed')
      expect(moduleManager.getModuleStatus('errorModule')).toBe(ModuleStatus.ERROR)
    })

    it('应该提供模块健康检查', async () => {
      const testModule: ModuleConfig = {
        id: 'testModule',
        name: 'Test Module',
        description: 'Test module',
        version: '1.0.0',
        enabled: true,
        dependencies: [],
        settings: {}
      }

      await moduleManager.registerModule('testModule', new TestModuleFactory(), testModule)
      await moduleManager.activateModule('testModule')

      const health = await moduleManager.getModuleHealth('testModule')
      expect(health.status).toBe('active')
    })
  })

  describe('热重载功能', () => {
    it('应该支持模块重载', async () => {
      const testModule: ModuleConfig = {
        id: 'testModule',
        name: 'Test Module',
        description: 'Test module',
        version: '1.0.0',
        enabled: true,
        dependencies: [],
        settings: {}
      }

      await moduleManager.registerModule('testModule', new TestModuleFactory(), testModule)
      await moduleManager.activateModule('testModule')

      const originalInstance = moduleManager.getModule('testModule')
      
      await moduleManager.reloadModule('testModule')
      
      const newInstance = moduleManager.getModule('testModule')
      expect(newInstance).not.toBe(originalInstance)
      expect(moduleManager.getModuleStatus('testModule')).toBe(ModuleStatus.ACTIVE)
    })
  })

  describe('批量操作', () => {
    it('应该支持批量激活模块', async () => {
      const modules = ['moduleA', 'moduleB', 'moduleC']
      
      for (const moduleId of modules) {
        const config: ModuleConfig = {
          id: moduleId,
          name: `Module ${moduleId}`,
          description: `Test module ${moduleId}`,
          version: '1.0.0',
          enabled: true,
          dependencies: [],
          settings: {}
        }
        await moduleManager.registerModule(moduleId, new TestModuleFactory(), config)
      }

      const result = await moduleManager.batchOperation(modules, 'activate', { parallel: true })
      
      expect(result.success).toHaveLength(3)
      expect(result.failed).toHaveLength(0)
      
      for (const moduleId of modules) {
        expect(moduleManager.isModuleActive(moduleId)).toBe(true)
      }
    })
  })
})
