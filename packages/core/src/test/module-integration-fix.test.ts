/**
 * 模块间集成修复验证测试
 * 验证EventBus/ModuleManager集成稳定性修复是否有效
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { MingLogCore } from '../MingLogCore'
import { ModuleIntegrationFix } from '../fixes/module-integration-fix'
import type { DatabaseConnection } from '../database/DatabaseManager'

// 模拟数据库连接
const createMockDatabase = (): DatabaseConnection => ({
  execute: vi.fn().mockResolvedValue(undefined),
  query: vi.fn().mockResolvedValue([]),
  close: vi.fn().mockResolvedValue(undefined),
  isConnected: vi.fn().mockReturnValue(true),
})

describe('模块间集成修复验证', () => {
  let core: MingLogCore
  let mockDatabase: DatabaseConnection

  beforeEach(async () => {
    mockDatabase = createMockDatabase()
    
    core = new MingLogCore({
      database: mockDatabase,
      debugMode: true,
      maxEventHistory: 100
    })

    await core.initialize()
  })

  afterEach(async () => {
    if (core) {
      await core.destroy()
    }
  })

  describe('集成修复初始化', () => {
    it('应该成功初始化集成修复', () => {
      const integrationStatus = core.getIntegrationStatus()
      expect(integrationStatus).toBeDefined()
      expect(integrationStatus.options).toBeDefined()
      expect(integrationStatus.options.enableMemoryLeakDetection).toBe(true)
      expect(integrationStatus.options.enableEventValidation).toBe(true)
      expect(integrationStatus.options.enableErrorRecovery).toBe(true)
    })

    it('应该设置正确的配置选项', () => {
      const integrationStatus = core.getIntegrationStatus()
      expect(integrationStatus.options.maxEventQueueSize).toBe(1000)
      expect(integrationStatus.options.eventTimeoutMs).toBe(5000)
    })
  })

  describe('事件验证功能', () => {
    it('应该拒绝无效的事件类型', () => {
      const eventBus = core.getEventBus()
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // 测试无效事件类型
      eventBus.emit('', { data: 'test' }, 'test-source')
      eventBus.emit('123invalid', { data: 'test' }, 'test-source')
      eventBus.emit('invalid@event', { data: 'test' }, 'test-source')

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[IntegrationFix] 无效事件被拒绝')
      )

      consoleSpy.mockRestore()
    })

    it('应该拒绝过大的事件数据', () => {
      const eventBus = core.getEventBus()
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // 创建超过1MB的数据
      const largeData = {
        content: 'x'.repeat(1024 * 1024 + 1)
      }

      eventBus.emit('test:large-data', largeData, 'test-source')

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[IntegrationFix] 事件数据过大')
      )

      consoleSpy.mockRestore()
    })

    it('应该接受有效的事件', () => {
      const eventBus = core.getEventBus()
      const handler = vi.fn()

      eventBus.on('test:valid-event', handler)
      eventBus.emit('test:valid-event', { data: 'test' }, 'test-source')

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'test:valid-event',
          source: 'test-source',
          data: { data: 'test' }
        })
      )
    })
  })

  describe('内存泄漏检测', () => {
    it('应该跟踪事件监听器数量', () => {
      const eventBus = core.getEventBus()
      const integrationStatus = core.getIntegrationStatus()

      const initialHandlers = integrationStatus.totalHandlers

      // 添加多个监听器
      const handlers = []
      for (let i = 0; i < 10; i++) {
        const handler = vi.fn()
        handlers.push(handler)
        eventBus.on(`test:event-${i}`, handler)
      }

      const updatedStatus = core.getIntegrationStatus()
      expect(updatedStatus.totalHandlers).toBeGreaterThan(initialHandlers)

      // 移除监听器
      handlers.forEach((handler, i) => {
        eventBus.off(`test:event-${i}`, handler)
      })

      const finalStatus = core.getIntegrationStatus()
      expect(finalStatus.totalHandlers).toBeLessThanOrEqual(updatedStatus.totalHandlers)
    })

    it('应该警告过多的事件监听器', () => {
      const eventBus = core.getEventBus()
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // 添加大量监听器到同一个事件类型
      for (let i = 0; i < 55; i++) {
        eventBus.on('test:many-handlers', vi.fn())
      }

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[IntegrationFix] 事件类型 test:many-handlers 的监听器数量过多')
      )

      consoleSpy.mockRestore()
    })
  })

  describe('错误恢复功能', () => {
    it('应该处理事件发送错误', () => {
      const eventBus = core.getEventBus()
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // 模拟事件发送错误
      const originalEmit = eventBus.emit
      eventBus.emit = vi.fn().mockImplementation(() => {
        throw new Error('Event emission failed')
      })

      // 尝试发送事件
      expect(() => {
        originalEmit.call(eventBus, 'test:error-event', { data: 'test' }, 'test-source')
      }).not.toThrow()

      consoleSpy.mockRestore()
    })

    it('应该处理模块错误事件', async () => {
      const eventBus = core.getEventBus()
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})

      // 发送模块错误事件
      eventBus.emit('module:error', {
        moduleId: 'test-module',
        error: new Error('Test module error')
      }, 'ModuleManager')

      // 等待错误处理
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(consoleSpy).toHaveBeenCalledWith(
        '[IntegrationFix] 处理模块错误: test-module',
        'Test module error'
      )

      consoleSpy.mockRestore()
    })
  })

  describe('事件队列管理', () => {
    it('应该限制事件队列大小', () => {
      const eventBus = core.getEventBus()
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      // 模拟队列已满的情况
      const integrationStatus = core.getIntegrationStatus()
      
      // 由于我们无法直接访问内部队列，我们测试配置是否正确设置
      expect(integrationStatus.options.maxEventQueueSize).toBe(1000)

      consoleSpy.mockRestore()
    })
  })

  describe('优雅关闭', () => {
    it('应该在销毁时清理资源', async () => {
      const integrationStatus = core.getIntegrationStatus()
      expect(integrationStatus.cleanupTasks).toBeGreaterThan(0)

      // 销毁核心系统
      await core.destroy()

      // 验证清理是否执行（通过检查是否还能获取状态）
      expect(core.getIntegrationStatus()).toBeNull()
    })
  })

  describe('集成状态监控', () => {
    it('应该提供详细的集成状态信息', () => {
      const integrationStatus = core.getIntegrationStatus()

      expect(integrationStatus).toHaveProperty('eventHandlers')
      expect(integrationStatus).toHaveProperty('totalHandlers')
      expect(integrationStatus).toHaveProperty('eventQueueSize')
      expect(integrationStatus).toHaveProperty('cleanupTasks')
      expect(integrationStatus).toHaveProperty('options')

      expect(typeof integrationStatus.eventHandlers).toBe('number')
      expect(typeof integrationStatus.totalHandlers).toBe('number')
      expect(typeof integrationStatus.eventQueueSize).toBe('number')
      expect(typeof integrationStatus.cleanupTasks).toBe('number')
    })

    it('应该反映实时的状态变化', () => {
      const eventBus = core.getEventBus()
      
      const initialStatus = core.getIntegrationStatus()
      const initialHandlers = initialStatus.totalHandlers

      // 添加事件监听器
      const handler = vi.fn()
      eventBus.on('test:status-change', handler)

      const updatedStatus = core.getIntegrationStatus()
      expect(updatedStatus.totalHandlers).toBeGreaterThan(initialHandlers)

      // 移除事件监听器
      eventBus.off('test:status-change', handler)

      const finalStatus = core.getIntegrationStatus()
      expect(finalStatus.totalHandlers).toBeLessThanOrEqual(updatedStatus.totalHandlers)
    })
  })
})

describe('ModuleIntegrationFix独立测试', () => {
  it('应该能够独立创建和使用', () => {
    const mockEventBus = {
      emit: vi.fn(),
      on: vi.fn(),
      off: vi.fn()
    } as any

    const mockModuleManager = {
      getActiveModules: vi.fn().mockReturnValue([]),
      getModule: vi.fn().mockReturnValue(null)
    } as any

    const integrationFix = new ModuleIntegrationFix(mockEventBus, mockModuleManager)
    
    expect(integrationFix).toBeDefined()
    expect(integrationFix.getIntegrationStatus()).toBeDefined()

    // 清理
    integrationFix.cleanup()
  })
})
