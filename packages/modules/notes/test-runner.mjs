/**
 * 简单的测试运行器
 * 用于验证笔记模块的基本功能
 */

import { NotesModule } from './dist/NotesModule.js'

// 简单的测试框架
class SimpleTest {
  constructor() {
    this.tests = []
    this.passed = 0
    this.failed = 0
  }

  describe(name, fn) {
    console.log(`\n📝 ${name}`)
    fn()
  }

  it(name, fn) {
    try {
      fn()
      console.log(`  ✅ ${name}`)
      this.passed++
    } catch (error) {
      console.log(`  ❌ ${name}`)
      console.log(`     Error: ${error.message}`)
      this.failed++
    }
  }

  expect(actual) {
    return {
      toBe: (expected) => {
        if (actual !== expected) {
          throw new Error(`Expected ${expected}, but got ${actual}`)
        }
      },
      toEqual: (expected) => {
        if (JSON.stringify(actual) !== JSON.stringify(expected)) {
          throw new Error(`Expected ${JSON.stringify(expected)}, but got ${JSON.stringify(actual)}`)
        }
      },
      toBeDefined: () => {
        if (actual === undefined) {
          throw new Error(`Expected value to be defined, but got undefined`)
        }
      },
      toBeInstanceOf: (constructor) => {
        if (!(actual instanceof constructor)) {
          throw new Error(`Expected instance of ${constructor.name}, but got ${typeof actual}`)
        }
      }
    }
  }

  async run() {
    console.log('🚀 开始运行笔记模块测试...\n')
    
    await this.runBasicTests()
    await this.runLifecycleTests()
    await this.runEventTests()
    
    console.log(`\n📊 测试结果: ${this.passed} 通过, ${this.failed} 失败`)
    
    if (this.failed > 0) {
      process.exit(1)
    } else {
      console.log('🎉 所有测试通过!')
      process.exit(0)
    }
  }

  async runBasicTests() {
    this.describe('NotesModule 基本功能', () => {
      this.it('应该正确创建模块实例', () => {
        const module = new NotesModule()
        this.expect(module).toBeDefined()
        this.expect(module.metadata.id).toBe('notes')
        this.expect(module.metadata.name).toBe('笔记管理')
      })

      this.it('应该有正确的默认配置', () => {
        const module = new NotesModule()
        this.expect(module.config.enabled).toBe(true)
        this.expect(module.config.settings).toEqual({})
        this.expect(module.config.preferences).toEqual({})
      })

      this.it('应该返回正确的路由配置', () => {
        const module = new NotesModule()
        const routes = module.getRoutes()
        this.expect(routes.length).toBe(4)
        this.expect(routes[0].path).toBe('/notes')
        this.expect(routes[0].name).toBe('Notes List')
      })

      this.it('应该返回正确的菜单项', () => {
        const module = new NotesModule()
        const menuItems = module.getMenuItems()
        this.expect(menuItems.length).toBe(4)
        this.expect(menuItems[0].id).toBe('notes')
        this.expect(menuItems[0].title).toBe('笔记')
      })
    })
  }

  async runLifecycleTests() {
    this.describe('NotesModule 生命周期', () => {
      this.it('应该正确初始化', async () => {
        const module = new NotesModule()
        await module.initialize()
        this.expect(module.status).toBe('initialized')
        
        const notesService = module.getNotesService()
        this.expect(notesService).toBeDefined()
      })

      this.it('应该正确激活', async () => {
        const module = new NotesModule()
        await module.initialize()
        await module.activate()
        this.expect(module.status).toBe('active')
      })

      this.it('应该正确停用', async () => {
        const module = new NotesModule()
        await module.initialize()
        await module.activate()
        await module.deactivate()
        this.expect(module.status).toBe('inactive')
      })

      this.it('应该正确销毁', async () => {
        const module = new NotesModule()
        await module.initialize()
        await module.destroy()
        this.expect(module.status).toBe('destroyed')
      })
    })
  }

  async runEventTests() {
    this.describe('NotesModule 事件处理', () => {
      this.it('应该处理事件而不抛出错误', () => {
        const module = new NotesModule()
        const event = {
          type: 'test:event',
          data: { test: 'data' },
          timestamp: Date.now()
        }
        
        // 应该不抛出错误
        module.onEvent(event)
      })

      this.it('应该处理搜索事件', () => {
        const module = new NotesModule()
        const searchEvent = {
          type: 'search:query',
          data: { query: 'test search' },
          timestamp: Date.now()
        }
        
        // 应该不抛出错误
        module.onEvent(searchEvent)
      })

      this.it('应该处理数据事件', () => {
        const module = new NotesModule()
        const dataEvent = {
          type: 'data:created',
          data: { entityType: 'note', id: 'test-note' },
          timestamp: Date.now()
        }
        
        // 应该不抛出错误
        module.onEvent(dataEvent)
      })
    })
  }
}

// 运行测试
const test = new SimpleTest()
test.run().catch(console.error)
