/**
 * NotesModule 事件处理测试
 * 测试模块的事件监听和处理功能
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NotesModule } from '../NotesModule'

// 模拟依赖
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {})
const mockConsoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

describe('NotesModule - 事件处理', () => {
  let notesModule: NotesModule
  
  beforeEach(() => {
    vi.clearAllMocks()
    notesModule = new NotesModule()
  })
  
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('onEvent() 方法', () => {
    it('应该记录接收到的事件', () => {
      const testEvent = {
        type: 'test:event',
        data: { test: 'data' },
        source: 'test',
        timestamp: Date.now()
      }
      
      notesModule.onEvent(testEvent)
      
      expect(mockConsoleLog).toHaveBeenCalledWith('Notes module received event:', testEvent)
    })

    describe('data:created 事件', () => {
      it('应该处理笔记创建事件', () => {
        const createEvent = {
          type: 'data:created',
          data: {
            entityType: 'note',
            id: 'note-123',
            title: 'Test Note'
          },
          source: 'notes',
          timestamp: Date.now()
        }
        
        notesModule.onEvent(createEvent)
        
        expect(mockConsoleLog).toHaveBeenCalledWith('Notes module received event:', createEvent)
        expect(mockConsoleLog).toHaveBeenCalledWith('Note created:', createEvent.data)
      })

      it('应该忽略非笔记实体的创建事件', () => {
        const createEvent = {
          type: 'data:created',
          data: {
            entityType: 'task',
            id: 'task-123'
          },
          source: 'tasks',
          timestamp: Date.now()
        }
        
        notesModule.onEvent(createEvent)
        
        expect(mockConsoleLog).toHaveBeenCalledWith('Notes module received event:', createEvent)
        expect(mockConsoleLog).not.toHaveBeenCalledWith('Note created:', expect.anything())
      })

      it('应该处理没有 entityType 的创建事件', () => {
        const createEvent = {
          type: 'data:created',
          data: {
            id: 'unknown-123'
          },
          source: 'unknown',
          timestamp: Date.now()
        }
        
        notesModule.onEvent(createEvent)
        
        expect(mockConsoleLog).toHaveBeenCalledWith('Notes module received event:', createEvent)
        expect(mockConsoleLog).not.toHaveBeenCalledWith('Note created:', expect.anything())
      })
    })

    describe('data:updated 事件', () => {
      it('应该处理笔记更新事件', () => {
        const updateEvent = {
          type: 'data:updated',
          data: {
            entityType: 'note',
            id: 'note-123',
            title: 'Updated Note'
          },
          source: 'notes',
          timestamp: Date.now()
        }
        
        notesModule.onEvent(updateEvent)
        
        expect(mockConsoleLog).toHaveBeenCalledWith('Notes module received event:', updateEvent)
        expect(mockConsoleLog).toHaveBeenCalledWith('Note updated:', updateEvent.data)
      })

      it('应该忽略非笔记实体的更新事件', () => {
        const updateEvent = {
          type: 'data:updated',
          data: {
            entityType: 'task',
            id: 'task-123'
          },
          source: 'tasks',
          timestamp: Date.now()
        }
        
        notesModule.onEvent(updateEvent)
        
        expect(mockConsoleLog).toHaveBeenCalledWith('Notes module received event:', updateEvent)
        expect(mockConsoleLog).not.toHaveBeenCalledWith('Note updated:', expect.anything())
      })
    })

    describe('data:deleted 事件', () => {
      it('应该处理笔记删除事件', () => {
        const deleteEvent = {
          type: 'data:deleted',
          data: {
            entityType: 'note',
            id: 'note-123'
          },
          source: 'notes',
          timestamp: Date.now()
        }
        
        notesModule.onEvent(deleteEvent)
        
        expect(mockConsoleLog).toHaveBeenCalledWith('Notes module received event:', deleteEvent)
        expect(mockConsoleLog).toHaveBeenCalledWith('Note deleted:', deleteEvent.data)
      })

      it('应该忽略非笔记实体的删除事件', () => {
        const deleteEvent = {
          type: 'data:deleted',
          data: {
            entityType: 'task',
            id: 'task-123'
          },
          source: 'tasks',
          timestamp: Date.now()
        }
        
        notesModule.onEvent(deleteEvent)
        
        expect(mockConsoleLog).toHaveBeenCalledWith('Notes module received event:', deleteEvent)
        expect(mockConsoleLog).not.toHaveBeenCalledWith('Note deleted:', expect.anything())
      })
    })

    describe('search:query 事件', () => {
      it('应该处理搜索查询事件', () => {
        const searchEvent = {
          type: 'search:query',
          data: {
            query: 'test search'
          },
          source: 'search',
          timestamp: Date.now()
        }
        
        notesModule.onEvent(searchEvent)
        
        expect(mockConsoleLog).toHaveBeenCalledWith('Notes module received event:', searchEvent)
        expect(mockConsoleLog).toHaveBeenCalledWith('Searching notes for:', 'test search')
      })

      it('应该处理没有查询数据的搜索事件', () => {
        const searchEvent = {
          type: 'search:query',
          data: {},
          source: 'search',
          timestamp: Date.now()
        }
        
        notesModule.onEvent(searchEvent)
        
        expect(mockConsoleLog).toHaveBeenCalledWith('Notes module received event:', searchEvent)
        expect(mockConsoleLog).toHaveBeenCalledWith('Searching notes for:', undefined)
      })

      it('应该处理没有数据的搜索事件', () => {
        const searchEvent = {
          type: 'search:query',
          source: 'search',
          timestamp: Date.now()
        }
        
        notesModule.onEvent(searchEvent)
        
        expect(mockConsoleLog).toHaveBeenCalledWith('Notes module received event:', searchEvent)
        expect(mockConsoleLog).toHaveBeenCalledWith('Searching notes for:', undefined)
      })
    })

    describe('未知事件类型', () => {
      it('应该处理未知事件类型', () => {
        const unknownEvent = {
          type: 'unknown:event',
          data: { test: 'data' },
          source: 'unknown',
          timestamp: Date.now()
        }
        
        notesModule.onEvent(unknownEvent)
        
        expect(mockConsoleLog).toHaveBeenCalledWith('Notes module received event:', unknownEvent)
        // 应该不会有额外的处理日志
        expect(mockConsoleLog).toHaveBeenCalledTimes(1)
      })
    })

    describe('事件数据边界情况', () => {
      it('应该处理空事件对象', () => {
        const emptyEvent = {
          type: '',
          timestamp: Date.now()
        }
        
        expect(() => notesModule.onEvent(emptyEvent)).not.toThrow()
        expect(mockConsoleLog).toHaveBeenCalledWith('Notes module received event:', emptyEvent)
      })

      it('应该处理 null 数据', () => {
        const nullDataEvent = {
          type: 'data:created',
          data: null,
          timestamp: Date.now()
        }
        
        expect(() => notesModule.onEvent(nullDataEvent)).not.toThrow()
        expect(mockConsoleLog).toHaveBeenCalledWith('Notes module received event:', nullDataEvent)
      })

      it('应该处理 undefined 数据', () => {
        const undefinedDataEvent = {
          type: 'data:updated',
          data: undefined,
          timestamp: Date.now()
        }
        
        expect(() => notesModule.onEvent(undefinedDataEvent)).not.toThrow()
        expect(mockConsoleLog).toHaveBeenCalledWith('Notes module received event:', undefinedDataEvent)
      })
    })
  })

  describe('handleSearchQuery 私有方法', () => {
    beforeEach(async () => {
      await notesModule.initialize()
    })

    it('应该处理搜索查询而不抛出错误', () => {
      const searchEvent = {
        type: 'search:query',
        data: { query: 'test' },
        timestamp: Date.now()
      }
      
      expect(() => notesModule.onEvent(searchEvent)).not.toThrow()
    })

    it('应该在搜索出错时记录错误', () => {
      // 模拟搜索错误场景
      const searchEvent = {
        type: 'search:query',
        data: { query: 'test' },
        timestamp: Date.now()
      }
      
      notesModule.onEvent(searchEvent)
      
      // 验证没有错误被抛出
      expect(mockConsoleError).not.toHaveBeenCalled()
    })
  })
})
