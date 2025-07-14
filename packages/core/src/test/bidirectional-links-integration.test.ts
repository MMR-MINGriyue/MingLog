/**
 * 双向链接系统集成测试
 * 验证双向链接系统与其他模块的集成是否正常工作
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { BidirectionalLinksIntegration } from '../integration/bidirectional-links-integration'
import { EventBus } from '../event-system/EventBus'
import { DatabaseManager } from '../database/DatabaseManager'
import type { CoreAPI, DatabaseConnection } from '../types'

// 模拟数据库连接
const createMockDatabase = (): DatabaseConnection => ({
  execute: vi.fn().mockResolvedValue(undefined),
  query: vi.fn().mockResolvedValue([]),
  close: vi.fn().mockResolvedValue(undefined),
  isConnected: vi.fn().mockReturnValue(true),
})

describe('双向链接系统集成测试', () => {
  let integration: BidirectionalLinksIntegration
  let eventBus: EventBus
  let mockDatabase: DatabaseConnection
  let coreAPI: CoreAPI

  beforeEach(async () => {
    mockDatabase = createMockDatabase()
    eventBus = new EventBus({ debugMode: false })
    
    coreAPI = {
      events: eventBus,
      database: new DatabaseManager(mockDatabase),
      modules: {
        get: vi.fn(),
        register: vi.fn(),
        unregister: vi.fn()
      }
    } as any

    integration = new BidirectionalLinksIntegration(coreAPI, {
      enableAutoLinking: true,
      enableRealTimeSync: true,
      enableCrossModuleLinks: true
    })
  })

  afterEach(async () => {
    if (integration) {
      await integration.cleanup()
    }
  })

  describe('初始化', () => {
    it('应该成功初始化双向链接集成', async () => {
      await integration.initialize()

      const status = integration.getIntegrationStatus()
      expect(status.initialized).toBe(true)
      expect(status.options.enableAutoLinking).toBe(true)
      expect(status.options.enableRealTimeSync).toBe(true)
      expect(status.options.enableCrossModuleLinks).toBe(true)
    })

    it('应该创建必要的数据库表', async () => {
      await integration.initialize()

      expect(mockDatabase.execute).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS bidirectional_links')
      )
      expect(mockDatabase.execute).toHaveBeenCalledWith(
        expect.stringContaining('CREATE INDEX IF NOT EXISTS idx_bidirectional_links_source')
      )
    })

    it('应该发送初始化完成事件', async () => {
      const eventSpy = vi.fn()
      eventBus.on('bidirectional-links:initialized', eventSpy)

      await integration.initialize()

      expect(eventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            options: expect.any(Object)
          })
        })
      )
    })
  })

  describe('内容更新处理', () => {
    beforeEach(async () => {
      await integration.initialize()
    })

    it('应该处理包含页面链接的内容更新', async () => {
      const content = '这是一个包含[[目标页面]]的内容'
      
      eventBus.emit('content:updated', {
        entityType: 'note',
        entityId: 'note-1',
        content
      })

      // 等待异步处理
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(mockDatabase.execute).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM bidirectional_links'),
        ['note', 'note-1']
      )
    })

    it('应该处理包含块引用的内容更新', async () => {
      const content = '这是一个包含((block-123))的内容'
      
      eventBus.emit('content:updated', {
        entityType: 'note',
        entityId: 'note-1',
        content
      })

      // 等待异步处理
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(mockDatabase.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO bidirectional_links'),
        expect.arrayContaining([
          expect.any(String), // linkId
          'note',
          'note-1',
          'block',
          'block-123',
          'block-reference',
          expect.any(Number), // position
          expect.any(String), // created_at
          expect.any(String)  // updated_at
        ])
      )
    })

    it('应该处理内容删除事件', async () => {
      eventBus.emit('content:deleted', {
        entityType: 'note',
        entityId: 'note-1'
      })

      // 等待异步处理
      await new Promise(resolve => setTimeout(resolve, 100))

      expect(mockDatabase.execute).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM bidirectional_links'),
        ['note', 'note-1', 'note', 'note-1']
      )
    })
  })

  describe('模块事件处理', () => {
    beforeEach(async () => {
      await integration.initialize()
    })

    it('应该处理Notes模块事件', async () => {
      const note = {
        id: 'note-1',
        title: '测试笔记',
        content: '这是一个包含[[链接页面]]的笔记'
      }

      eventBus.emit('notes:created', { note })

      // 等待异步处理
      await new Promise(resolve => setTimeout(resolve, 100))

      // 验证是否尝试创建跨模块链接
      expect(mockDatabase.execute).toHaveBeenCalled()
    })

    it('应该处理Tasks模块事件', async () => {
      const task = {
        id: 'task-1',
        title: '测试任务',
        description: '这是一个包含[[相关页面]]的任务'
      }

      eventBus.emit('tasks:created', { task })

      // 等待异步处理
      await new Promise(resolve => setTimeout(resolve, 100))

      // 验证是否尝试创建跨模块链接
      expect(mockDatabase.execute).toHaveBeenCalled()
    })

    it('应该处理MindMap模块事件', async () => {
      const mindmap = {
        id: 'mindmap-1',
        nodes: [
          {
            id: 'node-1',
            content: '包含[[链接]]的节点'
          }
        ]
      }

      eventBus.emit('mindmap:updated', { mindmap })

      // 等待异步处理
      await new Promise(resolve => setTimeout(resolve, 100))

      // 验证是否尝试创建跨模块链接
      expect(mockDatabase.execute).toHaveBeenCalled()
    })
  })

  describe('链接解析', () => {
    beforeEach(async () => {
      await integration.initialize()
    })

    it('应该正确解析页面链接语法', async () => {
      const content = '这里有[[页面1]]和[[页面2|别名]]的链接'
      
      eventBus.emit('content:updated', {
        entityType: 'note',
        entityId: 'note-1',
        content
      })

      // 等待异步处理
      await new Promise(resolve => setTimeout(resolve, 100))

      // 验证是否创建了两个链接
      const insertCalls = (mockDatabase.execute as any).mock.calls.filter(
        call => call[0].includes('INSERT INTO bidirectional_links')
      )
      expect(insertCalls.length).toBeGreaterThanOrEqual(2)
    })

    it('应该正确解析块引用语法', async () => {
      const content = '引用块((block-1))和((block-2))'
      
      eventBus.emit('content:updated', {
        entityType: 'note',
        entityId: 'note-1',
        content
      })

      // 等待异步处理
      await new Promise(resolve => setTimeout(resolve, 100))

      // 验证是否创建了块引用链接
      const insertCalls = (mockDatabase.execute as any).mock.calls.filter(
        call => call[0].includes('INSERT INTO bidirectional_links') &&
               call[1].includes('block-reference')
      )
      expect(insertCalls.length).toBeGreaterThanOrEqual(2)
    })

    it('应该处理混合链接语法', async () => {
      const content = '混合链接：[[页面链接]]和((块引用))'
      
      eventBus.emit('content:updated', {
        entityType: 'note',
        entityId: 'note-1',
        content
      })

      // 等待异步处理
      await new Promise(resolve => setTimeout(resolve, 100))

      // 验证是否创建了不同类型的链接
      const insertCalls = (mockDatabase.execute as any).mock.calls.filter(
        call => call[0].includes('INSERT INTO bidirectional_links')
      )
      expect(insertCalls.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('双向链接创建', () => {
    beforeEach(async () => {
      await integration.initialize()
    })

    it('应该处理链接创建事件', async () => {
      const link = {
        id: 'link-1',
        sourceType: 'note',
        sourceId: 'note-1',
        targetType: 'page',
        targetId: 'page-1',
        bidirectional: true
      }

      eventBus.emit('links:created', { link })

      // 等待异步处理
      await new Promise(resolve => setTimeout(resolve, 100))

      // 验证是否处理了链接创建
      expect(mockDatabase.execute).toHaveBeenCalled()
    })

    it('应该处理链接删除事件', async () => {
      const linkId = 'link-1'

      eventBus.emit('links:deleted', { linkId })

      // 等待异步处理
      await new Promise(resolve => setTimeout(resolve, 100))

      // 验证是否处理了链接删除
      expect(mockDatabase.execute).toHaveBeenCalled()
    })
  })

  describe('集成状态', () => {
    it('应该返回正确的集成状态', async () => {
      const status = integration.getIntegrationStatus()

      expect(status).toHaveProperty('initialized')
      expect(status).toHaveProperty('options')
      expect(status).toHaveProperty('services')
      expect(status.services).toHaveProperty('linkManager')
      expect(status.services).toHaveProperty('crossModuleService')
    })

    it('初始化前应该返回未初始化状态', () => {
      const status = integration.getIntegrationStatus()
      expect(status.initialized).toBe(false)
    })

    it('初始化后应该返回已初始化状态', async () => {
      await integration.initialize()
      
      const status = integration.getIntegrationStatus()
      expect(status.initialized).toBe(true)
    })
  })

  describe('错误处理', () => {
    it('应该处理数据库错误', async () => {
      mockDatabase.execute = vi.fn().mockRejectedValue(new Error('Database error'))
      
      await expect(integration.initialize()).rejects.toThrow('Database error')
    })

    it('应该优雅处理内容解析错误', async () => {
      await integration.initialize()
      
      // 发送无效内容
      eventBus.emit('content:updated', {
        entityType: 'note',
        entityId: 'note-1',
        content: null
      })

      // 应该不抛出错误
      await new Promise(resolve => setTimeout(resolve, 100))
    })
  })

  describe('清理', () => {
    it('应该正确清理资源', async () => {
      await integration.initialize()
      expect(integration.getIntegrationStatus().initialized).toBe(true)

      await integration.cleanup()
      expect(integration.getIntegrationStatus().initialized).toBe(false)
    })
  })
})
