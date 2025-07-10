/**
 * NotesModule 单元测试
 * 测试笔记模块的所有核心功能和生命周期方法
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NotesModule } from '../NotesModule'

// 模拟依赖
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {})
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

describe('NotesModule', () => {
  let notesModule: NotesModule
  
  beforeEach(() => {
    // 清除所有模拟调用
    vi.clearAllMocks()
    
    // 创建新的模块实例
    notesModule = new NotesModule()
  })
  
  afterEach(() => {
    // 清理资源
    vi.restoreAllMocks()
  })

  describe('构造函数和元数据', () => {
    it('应该正确初始化模块元数据', () => {
      expect(notesModule.metadata).toEqual({
        id: 'notes',
        name: '笔记管理',
        version: '1.0.0',
        description: '提供笔记的创建、编辑、标签管理等功能',
        author: 'MingLog Team',
        icon: '📝',
        tags: ['notes', 'writing', 'documents'],
        dependencies: [],
        optionalDependencies: []
      })
    })

    it('应该使用默认配置初始化', () => {
      expect(notesModule.config).toEqual({
        enabled: true,
        settings: {},
        preferences: {}
      })
    })

    it('应该接受自定义配置', () => {
      const customConfig = {
        enabled: false,
        settings: { theme: 'dark' },
        preferences: { autoSave: true }
      }
      
      const moduleWithConfig = new NotesModule(customConfig)
      expect(moduleWithConfig.config).toEqual(customConfig)
    })

    it('应该初始状态为 UNINITIALIZED', () => {
      expect(notesModule.status).toBe('uninitialized')
    })
  })

  describe('生命周期方法', () => {
    describe('initialize()', () => {
      it('应该成功初始化模块', async () => {
        await notesModule.initialize()
        
        expect(notesModule.status).toBe('initialized')
        expect(mockConsoleLog).toHaveBeenCalledWith('Notes module initializing...')
      })

      it('应该初始化 NotesService', async () => {
        await notesModule.initialize()
        
        const notesService = notesModule.getNotesService()
        expect(notesService).toBeDefined()
      })

      it('应该在已初始化时跳过重复初始化', async () => {
        await notesModule.initialize()
        mockConsoleLog.mockClear()
        
        await notesModule.initialize()
        expect(mockConsoleLog).not.toHaveBeenCalledWith('Notes module initializing...')
      })
    })

    describe('activate()', () => {
      it('应该成功激活模块', async () => {
        await notesModule.initialize()
        await notesModule.activate()
        
        expect(notesModule.status).toBe('active')
        expect(mockConsoleLog).toHaveBeenCalledWith('Notes module activating...')
      })

      it('应该在激活前先初始化', async () => {
        await notesModule.activate()
        
        expect(notesModule.status).toBe('active')
        expect(mockConsoleLog).toHaveBeenCalledWith('Notes module initializing...')
        expect(mockConsoleLog).toHaveBeenCalledWith('Notes module activating...')
      })
    })

    describe('deactivate()', () => {
      it('应该成功停用模块', async () => {
        await notesModule.initialize()
        await notesModule.activate()
        await notesModule.deactivate()
        
        expect(notesModule.status).toBe('inactive')
        expect(mockConsoleLog).toHaveBeenCalledWith('Notes module deactivating...')
      })
    })

    describe('destroy()', () => {
      it('应该成功销毁模块', async () => {
        await notesModule.initialize()
        await notesModule.destroy()
        
        expect(notesModule.status).toBe('destroyed')
        expect(mockConsoleLog).toHaveBeenCalledWith('Notes module destroying...')
      })
    })
  })

  describe('配置管理', () => {
    it('应该正确获取配置', () => {
      const config = notesModule.getConfig()
      expect(config).toEqual({
        enabled: true,
        settings: {},
        preferences: {}
      })
    })

    it('应该正确设置配置', () => {
      const newConfig = {
        enabled: false,
        settings: { theme: 'dark' }
      }
      
      notesModule.setConfig(newConfig)
      expect(notesModule.config.enabled).toBe(false)
      expect(notesModule.config.settings).toEqual({ theme: 'dark' })
    })

    it('应该合并配置而不是替换', () => {
      notesModule.setConfig({ settings: { theme: 'dark' } })
      notesModule.setConfig({ preferences: { autoSave: true } })
      
      expect(notesModule.config).toEqual({
        enabled: true,
        settings: { theme: 'dark' },
        preferences: { autoSave: true }
      })
    })
  })

  describe('路由配置', () => {
    it('应该返回正确的路由配置', () => {
      const routes = notesModule.getRoutes()
      
      expect(routes).toHaveLength(4)
      expect(routes[0]).toEqual({
        path: '/notes',
        component: expect.any(Function),
        name: 'Notes List'
      })
      expect(routes[1]).toEqual({
        path: '/notes/new',
        component: expect.any(Function),
        name: 'New Note'
      })
      expect(routes[2]).toEqual({
        path: '/notes/:id',
        component: expect.any(Function),
        name: 'View Note'
      })
      expect(routes[3]).toEqual({
        path: '/notes/:id/edit',
        component: expect.any(Function),
        name: 'Edit Note'
      })
    })

    it('路由组件应该返回占位符内容', () => {
      const routes = notesModule.getRoutes()
      const component = routes[0].component
      
      expect(component()).toBe('Notes Module - Coming Soon')
    })
  })

  describe('菜单项配置', () => {
    it('应该返回正确的菜单项', () => {
      const menuItems = notesModule.getMenuItems()
      
      expect(menuItems).toHaveLength(4)
      expect(menuItems).toEqual([
        {
          id: 'notes',
          title: '笔记',
          icon: '📝',
          path: '/notes',
          order: 1
        },
        {
          id: 'notes-new',
          title: '新建笔记',
          icon: '➕',
          path: '/notes/new',
          order: 2
        },
        {
          id: 'notes-favorites',
          title: '收藏笔记',
          icon: '⭐',
          path: '/notes/favorites',
          order: 3
        },
        {
          id: 'notes-archived',
          title: '归档笔记',
          icon: '📦',
          path: '/notes/archived',
          order: 4
        }
      ])
    })
  })

  describe('健康状态检查', () => {
    it('应该返回健康状态', async () => {
      const healthStatus = await notesModule.getHealthStatus()
      
      expect(healthStatus).toEqual({
        status: 'healthy',
        message: 'Module is healthy'
      })
    })
  })
})
