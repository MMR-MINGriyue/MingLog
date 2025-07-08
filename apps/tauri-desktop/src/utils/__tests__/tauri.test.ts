import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest'

// Mock Tauri API - use vi.hoisted to avoid hoisting issues
const mockInvoke = vi.hoisted(() => vi.fn())

// Mock both the old and new Tauri API imports
vi.mock('@tauri-apps/api/core', () => ({
  invoke: mockInvoke,
}))

vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: mockInvoke,
}))

import * as tauriUtils from '../tauri'

// Mock console methods
const consoleSpy = {
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
  warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
  log: vi.spyOn(console, 'log').mockImplementation(() => {}),
}

describe('tauri utils', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    consoleSpy.error.mockClear()
    consoleSpy.warn.mockClear()
    consoleSpy.log.mockClear()
  })

  afterAll(() => {
    consoleSpy.error.mockRestore()
    consoleSpy.warn.mockRestore()
    consoleSpy.log.mockRestore()
  })

  describe('withErrorHandling', () => {
    it('executes function successfully', async () => {
      const mockFn = vi.fn().mockResolvedValue('success')
      
      const result = await tauriUtils.withErrorHandling(mockFn)
      
      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledTimes(1)
      expect(consoleSpy.error).not.toHaveBeenCalled()
    })

    it('handles function errors', async () => {
      const error = new Error('Test error')
      const mockFn = vi.fn().mockRejectedValue(error)
      
      const result = await tauriUtils.withErrorHandling(mockFn)
      
      expect(result).toBeUndefined()
      expect(consoleSpy.error).toHaveBeenCalledWith('Error:', error)
    })

    it('passes error message to function', async () => {
      const mockFn = vi.fn().mockResolvedValue('success')

      await tauriUtils.withErrorHandling(mockFn, 'Custom error message')

      expect(mockFn).toHaveBeenCalledTimes(1)
    })
  })

  describe('searchBlocks', () => {
    const mockSearchResults = {
      blocks: [
        {
          id: '1',
          title: 'Test Page',
          content: 'Test content',
          type: 'page',
          score: 0.95,
        },
      ],
      total: 1,
      query: 'test',
    }

    it('searches with default parameters', async () => {
      mockInvoke.mockResolvedValue(mockSearchResults)
      
      const result = await tauriUtils.searchBlocks({ query: 'test' })
      
      expect(mockInvoke).toHaveBeenCalledWith('search_blocks', {
        request: {
          query: 'test',
          include_pages: true,
          include_blocks: true,
          limit: 20,
        }
      })
      expect(result).toEqual(mockSearchResults)
    })

    it('searches with custom parameters', async () => {
      mockInvoke.mockResolvedValue(mockSearchResults)
      
      const params = {
        query: 'custom search',
        include_pages: false,
        include_blocks: true,
        limit: 50,
      }
      
      const result = await tauriUtils.searchBlocks(params)
      
      expect(mockInvoke).toHaveBeenCalledWith('search_blocks', { request: params })
      expect(result).toEqual(mockSearchResults)
    })

    it('handles search errors', async () => {
      const error = new Error('Search failed')
      mockInvoke.mockRejectedValue(error)
      
      const result = await tauriUtils.searchBlocks({ query: 'test' })
      
      expect(result).toBeUndefined()
      expect(consoleSpy.error).toHaveBeenCalledWith('Error:', error)
    })
  })

  describe('createNote', () => {
    const mockNote = {
      id: '1',
      title: 'Test Note',
      content: 'Test content',
      created_at: Date.now(),
      updated_at: Date.now(),
      tags: [],
    }

    it('creates note successfully', async () => {
      mockInvoke.mockResolvedValue(mockNote)

      const result = await tauriUtils.createNote({
        title: 'Test Note',
        content: 'Test content'
      })

      expect(mockInvoke).toHaveBeenCalledWith('create_note', {
        request: {
          title: 'Test Note',
          content: 'Test content',
        }
      })
      expect(result).toEqual(mockNote)
    })

    it('creates note with tags', async () => {
      mockInvoke.mockResolvedValue(mockNote)

      const result = await tauriUtils.createNote({
        title: 'Test Note',
        content: 'Test content',
        tags: ['tag1', 'tag2']
      })

      expect(mockInvoke).toHaveBeenCalledWith('create_note', {
        request: {
          title: 'Test Note',
          content: 'Test content',
          tags: ['tag1', 'tag2'],
        }
      })
      expect(result).toEqual(mockNote)
    })

    it('handles creation errors', async () => {
      const error = new Error('Creation failed')
      mockInvoke.mockRejectedValue(error)

      const result = await tauriUtils.createNote({
        title: 'Test Note',
        content: 'Test content'
      })

      expect(result).toBeUndefined()
      expect(consoleSpy.error).toHaveBeenCalledWith('Error:', error)
    })
  })

  describe('updateNote', () => {
    const mockUpdatedNote = {
      id: '1',
      title: 'Updated Note',
      content: 'Updated content',
      created_at: Date.now() - 1000,
      updated_at: Date.now(),
      tags: ['updated'],
    }

    it('updates note successfully', async () => {
      mockInvoke.mockResolvedValue(mockUpdatedNote)

      const updates = {
        id: '1',
        title: 'Updated Note',
        content: 'Updated content',
        tags: ['updated'],
      }

      const result = await tauriUtils.updateNote(updates)

      expect(mockInvoke).toHaveBeenCalledWith('update_note', {
        request: updates,
      })
      expect(result).toEqual(mockUpdatedNote)
    })

    it('handles update errors', async () => {
      const error = new Error('Update failed')
      mockInvoke.mockRejectedValue(error)

      const result = await tauriUtils.updateNote({ id: '1', title: 'Updated' })

      expect(result).toBeUndefined()
      expect(consoleSpy.error).toHaveBeenCalledWith('Error:', error)
    })
  })

  describe('deleteNote', () => {
    it('deletes note successfully', async () => {
      mockInvoke.mockResolvedValue({ success: true })
      
      const result = await tauriUtils.deleteNote('1')
      
      expect(mockInvoke).toHaveBeenCalledWith('delete_note', { id: '1' })
      expect(result).toEqual({ success: true })
    })

    it('handles deletion errors', async () => {
      const error = new Error('Deletion failed')
      mockInvoke.mockRejectedValue(error)
      
      const result = await tauriUtils.deleteNote('1')
      
      expect(result).toBeUndefined()
      expect(consoleSpy.error).toHaveBeenCalledWith('Error:', error)
    })
  })

  describe('getNotes', () => {
    const mockNotes = [
      { id: '1', title: 'Note 1', content: 'Content 1' },
      { id: '2', title: 'Note 2', content: 'Content 2' },
    ]

    it('gets notes successfully', async () => {
      mockInvoke.mockResolvedValue(mockNotes)

      const result = await tauriUtils.getNotes()

      expect(mockInvoke).toHaveBeenCalledWith('get_notes', { limit: undefined, offset: undefined })
      expect(result).toEqual(mockNotes)
    })

    it('handles get notes errors', async () => {
      const error = new Error('Get notes failed')
      mockInvoke.mockRejectedValue(error)

      const result = await tauriUtils.getNotes()

      expect(result).toBeUndefined()
      expect(consoleSpy.error).toHaveBeenCalledWith('Error:', error)
    })
  })

  describe('exportData', () => {
    const mockExportData = {
      notes: [],
      settings: {},
      version: '1.0.0',
      exported_at: Date.now(),
    }

    it('exports data successfully', async () => {
      mockInvoke.mockResolvedValue(mockExportData)
      
      const result = await tauriUtils.exportData('/path/to/export.json')
      
      expect(mockInvoke).toHaveBeenCalledWith('export_data', {
        path: '/path/to/export.json',
      })
      expect(result).toEqual(mockExportData)
    })

    it('handles export errors', async () => {
      const error = new Error('Export failed')
      mockInvoke.mockRejectedValue(error)
      
      const result = await tauriUtils.exportData('/path/to/export.json')
      
      expect(result).toBeUndefined()
      expect(consoleSpy.error).toHaveBeenCalledWith('Error:', error)
    })
  })

  describe('importData', () => {
    it('imports data successfully', async () => {
      mockInvoke.mockResolvedValue({ success: true, imported_count: 10 })
      
      const result = await tauriUtils.importData('/path/to/import.json')
      
      expect(mockInvoke).toHaveBeenCalledWith('import_data', {
        path: '/path/to/import.json',
      })
      expect(result).toEqual({ success: true, imported_count: 10 })
    })

    it('handles import errors', async () => {
      const error = new Error('Import failed')
      mockInvoke.mockRejectedValue(error)
      
      const result = await tauriUtils.importData('/path/to/import.json')
      
      expect(result).toBeUndefined()
      expect(consoleSpy.error).toHaveBeenCalledWith('Error:', error)
    })
  })
})
