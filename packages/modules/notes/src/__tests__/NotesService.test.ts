/**
 * NotesService 单元测试
 * 测试笔记服务的所有 CRUD 操作
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { NotesModule } from '../NotesModule'

// 模拟依赖
const mockConsoleLog = vi.spyOn(console, 'log').mockImplementation(() => {})

describe('NotesService', () => {
  let notesModule: NotesModule
  let notesService: any
  
  beforeEach(async () => {
    vi.clearAllMocks()
    notesModule = new NotesModule()
    await notesModule.initialize()
    notesService = notesModule.getNotesService()
  })
  
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('构造函数', () => {
    it('应该正确初始化 NotesService', () => {
      expect(notesService).toBeDefined()
      expect(mockConsoleLog).toHaveBeenCalledWith('NotesService initialized')
    })
  })

  describe('getNotes() 方法', () => {
    it('应该返回笔记列表', async () => {
      const notes = await notesService.getNotes()
      
      expect(notes).toEqual([])
      expect(Array.isArray(notes)).toBe(true)
    })

    it('应该是异步方法', () => {
      const result = notesService.getNotes()
      
      expect(result).toBeInstanceOf(Promise)
    })
  })

  describe('createNote() 方法', () => {
    it('应该创建新笔记', async () => {
      const noteData = {
        title: 'Test Note',
        content: 'This is a test note'
      }
      
      const createdNote = await notesService.createNote(noteData)
      
      expect(createdNote).toEqual({
        id: '1',
        title: 'Test Note',
        content: 'This is a test note'
      })
    })

    it('应该为新笔记分配 ID', async () => {
      const noteData = {
        title: 'Another Note'
      }
      
      const createdNote = await notesService.createNote(noteData)
      
      expect(createdNote.id).toBe('1')
      expect(createdNote.title).toBe('Another Note')
    })

    it('应该处理空笔记数据', async () => {
      const createdNote = await notesService.createNote({})
      
      expect(createdNote).toEqual({ id: '1' })
    })

    it('应该处理 null 笔记数据', async () => {
      const createdNote = await notesService.createNote(null)
      
      expect(createdNote).toEqual({ id: '1' })
    })

    it('应该处理 undefined 笔记数据', async () => {
      const createdNote = await notesService.createNote(undefined)
      
      expect(createdNote).toEqual({ id: '1' })
    })

    it('应该保留所有传入的属性', async () => {
      const noteData = {
        title: 'Complex Note',
        content: 'Content here',
        tags: ['tag1', 'tag2'],
        metadata: { author: 'test' }
      }
      
      const createdNote = await notesService.createNote(noteData)
      
      expect(createdNote).toEqual({
        id: '1',
        title: 'Complex Note',
        content: 'Content here',
        tags: ['tag1', 'tag2'],
        metadata: { author: 'test' }
      })
    })
  })

  describe('updateNote() 方法', () => {
    it('应该更新现有笔记', async () => {
      const noteId = 'note-123'
      const updateData = {
        title: 'Updated Title',
        content: 'Updated content'
      }
      
      const updatedNote = await notesService.updateNote(noteId, updateData)
      
      expect(updatedNote).toEqual({
        id: 'note-123',
        title: 'Updated Title',
        content: 'Updated content'
      })
    })

    it('应该保持原有 ID', async () => {
      const noteId = 'original-id'
      const updateData = {
        title: 'Title'
      }

      const updatedNote = await notesService.updateNote(noteId, updateData)

      expect(updatedNote.id).toBe('original-id')
      expect(updatedNote.title).toBe('Title')
    })

    it('应该处理空更新数据', async () => {
      const noteId = 'test-id'
      
      const updatedNote = await notesService.updateNote(noteId, {})
      
      expect(updatedNote).toEqual({ id: 'test-id' })
    })

    it('应该处理 null 更新数据', async () => {
      const noteId = 'test-id'
      
      const updatedNote = await notesService.updateNote(noteId, null)
      
      expect(updatedNote).toEqual({ id: 'test-id' })
    })

    it('应该处理 undefined 更新数据', async () => {
      const noteId = 'test-id'
      
      const updatedNote = await notesService.updateNote(noteId, undefined)
      
      expect(updatedNote).toEqual({ id: 'test-id' })
    })

    it('应该保留所有更新属性', async () => {
      const noteId = 'complex-note'
      const updateData = {
        title: 'New Title',
        content: 'New content',
        tags: ['new-tag'],
        isArchived: true
      }
      
      const updatedNote = await notesService.updateNote(noteId, updateData)
      
      expect(updatedNote).toEqual({
        id: 'complex-note',
        title: 'New Title',
        content: 'New content',
        tags: ['new-tag'],
        isArchived: true
      })
    })
  })

  describe('deleteNote() 方法', () => {
    it('应该删除笔记', async () => {
      const noteId = 'note-to-delete'
      
      const result = await notesService.deleteNote(noteId)
      
      expect(result).toBe(true)
    })

    it('应该处理空字符串 ID', async () => {
      const result = await notesService.deleteNote('')
      
      expect(result).toBe(true)
    })

    it('应该处理 null ID', async () => {
      const result = await notesService.deleteNote(null)
      
      expect(result).toBe(true)
    })

    it('应该处理 undefined ID', async () => {
      const result = await notesService.deleteNote(undefined)
      
      expect(result).toBe(true)
    })

    it('应该处理数字 ID', async () => {
      const result = await notesService.deleteNote(123)
      
      expect(result).toBe(true)
    })
  })

  describe('异步行为', () => {
    it('所有方法都应该返回 Promise', () => {
      expect(notesService.getNotes()).toBeInstanceOf(Promise)
      expect(notesService.createNote({})).toBeInstanceOf(Promise)
      expect(notesService.updateNote('id', {})).toBeInstanceOf(Promise)
      expect(notesService.deleteNote('id')).toBeInstanceOf(Promise)
    })

    it('所有方法都应该可以被 await', async () => {
      await expect(notesService.getNotes()).resolves.toBeDefined()
      await expect(notesService.createNote({})).resolves.toBeDefined()
      await expect(notesService.updateNote('id', {})).resolves.toBeDefined()
      await expect(notesService.deleteNote('id')).resolves.toBeDefined()
    })
  })

  describe('错误处理', () => {
    it('方法不应该抛出同步错误', () => {
      expect(() => notesService.getNotes()).not.toThrow()
      expect(() => notesService.createNote({})).not.toThrow()
      expect(() => notesService.updateNote('id', {})).not.toThrow()
      expect(() => notesService.deleteNote('id')).not.toThrow()
    })

    // 注意：当前的简化实现不会抛出异步错误
    // 在实际实现中，应该测试数据库连接失败等错误情况
  })

  describe('数据类型处理', () => {
    it('createNote 应该处理各种数据类型', async () => {
      const testCases = [
        { input: { title: 'string' }, expected: { id: '1', title: 'string' } },
        { input: { count: 42 }, expected: { id: '1', count: 42 } },
        { input: { active: true }, expected: { id: '1', active: true } },
        { input: { tags: [] }, expected: { id: '1', tags: [] } },
        { input: { nested: { prop: 'value' } }, expected: { id: '1', nested: { prop: 'value' } } }
      ]

      for (const testCase of testCases) {
        const result = await notesService.createNote(testCase.input)
        expect(result).toEqual(testCase.expected)
      }
    })

    it('updateNote 应该处理各种数据类型', async () => {
      const testCases = [
        { input: { title: 'string' }, expected: { id: 'test', title: 'string' } },
        { input: { count: 42 }, expected: { id: 'test', count: 42 } },
        { input: { active: false }, expected: { id: 'test', active: false } },
        { input: { tags: ['a', 'b'] }, expected: { id: 'test', tags: ['a', 'b'] } }
      ]

      for (const testCase of testCases) {
        const result = await notesService.updateNote('test', testCase.input)
        expect(result).toEqual(testCase.expected)
      }
    })
  })
})
