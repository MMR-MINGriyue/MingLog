import { renderHook, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { useFileDropZone, useFileOperations } from '../useFileDropZone'

// Mock Tauri API
vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: vi.fn()
}))

// Mock Tauri event system
vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn()
}))

// Mock notifications
const mockAddNotification = vi.fn()
vi.mock('../../contexts/NotificationContext', () => ({
  useNotifications: () => ({
    addNotification: mockAddNotification
  })
}))

import { invoke } from '@tauri-apps/api/tauri'
import { listen } from '@tauri-apps/api/event'

describe('useFileDropZone Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should initialize with correct default state', () => {
      const { result } = renderHook(() => useFileDropZone())
      
      expect(result.current.isDragOver).toBe(false)
      expect(result.current.isImporting).toBe(false)
    })
  })

  describe('Event Listeners Setup', () => {
    it('should setup file drop event listeners on mount', () => {
      const mockUnlisten = vi.fn()
      vi.mocked(listen).mockResolvedValue(mockUnlisten)
      
      renderHook(() => useFileDropZone())
      
      expect(listen).toHaveBeenCalledWith('tauri://file-drop', expect.any(Function))
      expect(listen).toHaveBeenCalledWith('tauri://file-drop-hover', expect.any(Function))
      expect(listen).toHaveBeenCalledWith('tauri://file-drop-cancelled', expect.any(Function))
    })

    it('should cleanup event listeners on unmount', async () => {
      const mockUnlisten = vi.fn()
      vi.mocked(listen).mockResolvedValue(mockUnlisten)
      
      const { unmount } = renderHook(() => useFileDropZone())
      
      // Wait for listeners to be set up
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      
      unmount()
      
      // Cleanup should be called
      expect(mockUnlisten).toHaveBeenCalled()
    })
  })

  describe('File Drop Handling', () => {
    it('should handle file drop event', async () => {
      const mockUnlisten = vi.fn()
      let fileDropHandler: any
      
      vi.mocked(listen).mockImplementation((event, handler) => {
        if (event === 'tauri://file-drop') {
          fileDropHandler = handler
        }
        return Promise.resolve(mockUnlisten)
      })
      
      vi.mocked(invoke).mockResolvedValue({
        success: 2,
        failed: 0,
        files: ['file1.md', 'file2.md']
      })
      
      const { result } = renderHook(() => useFileDropZone())
      
      // Wait for setup
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      
      // Simulate file drop
      await act(async () => {
        await fileDropHandler({
          payload: ['path/to/file1.md', 'path/to/file2.md']
        })
      })
      
      expect(invoke).toHaveBeenCalledWith('import_markdown_files', {
        paths: ['path/to/file1.md', 'path/to/file2.md']
      })
      
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'success',
        title: '文件导入成功',
        message: '成功导入 2 个Markdown文件',
        duration: 4000
      })
    })

    it('should handle file drop with failures', async () => {
      const mockUnlisten = vi.fn()
      let fileDropHandler: any
      
      vi.mocked(listen).mockImplementation((event, handler) => {
        if (event === 'tauri://file-drop') {
          fileDropHandler = handler
        }
        return Promise.resolve(mockUnlisten)
      })
      
      vi.mocked(invoke).mockResolvedValue({
        success: 1,
        failed: 1,
        files: ['file1.md']
      })
      
      renderHook(() => useFileDropZone())
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      
      await act(async () => {
        await fileDropHandler({
          payload: ['file1.md', 'invalid.txt']
        })
      })
      
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'warning',
        title: '部分文件导入失败',
        message: '成功导入 1 个文件，1 个文件导入失败',
        duration: 5000
      })
    })

    it('should handle file drop error', async () => {
      const mockUnlisten = vi.fn()
      let fileDropHandler: any
      
      vi.mocked(listen).mockImplementation((event, handler) => {
        if (event === 'tauri://file-drop') {
          fileDropHandler = handler
        }
        return Promise.resolve(mockUnlisten)
      })
      
      vi.mocked(invoke).mockRejectedValue(new Error('Import failed'))
      
      renderHook(() => useFileDropZone())
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      
      await act(async () => {
        await fileDropHandler({
          payload: ['file1.md']
        })
      })
      
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'error',
        title: '文件导入失败',
        message: '文件导入过程中发生错误：Import failed',
        duration: 5000
      })
    })

    it('should filter non-markdown files', async () => {
      const mockUnlisten = vi.fn()
      let fileDropHandler: any
      
      vi.mocked(listen).mockImplementation((event, handler) => {
        if (event === 'tauri://file-drop') {
          fileDropHandler = handler
        }
        return Promise.resolve(mockUnlisten)
      })
      
      vi.mocked(invoke).mockResolvedValue({
        success: 1,
        failed: 0,
        files: ['file1.md']
      })
      
      renderHook(() => useFileDropZone())
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      
      await act(async () => {
        await fileDropHandler({
          payload: ['file1.md', 'file2.txt', 'file3.pdf']
        })
      })
      
      expect(invoke).toHaveBeenCalledWith('import_markdown_files', {
        paths: ['file1.md']
      })
    })
  })

  describe('Drag State Management', () => {
    it('should handle drag over event', async () => {
      const mockUnlisten = vi.fn()
      let dragOverHandler: any
      
      vi.mocked(listen).mockImplementation((event, handler) => {
        if (event === 'tauri://file-drop-hover') {
          dragOverHandler = handler
        }
        return Promise.resolve(mockUnlisten)
      })
      
      const { result } = renderHook(() => useFileDropZone())
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      
      expect(result.current.isDragOver).toBe(false)
      
      await act(async () => {
        dragOverHandler({ payload: [] })
      })
      
      expect(result.current.isDragOver).toBe(true)
    })

    it('should handle drag leave event', async () => {
      const mockUnlisten = vi.fn()
      let dragOverHandler: any
      let dragLeaveHandler: any
      
      vi.mocked(listen).mockImplementation((event, handler) => {
        if (event === 'tauri://file-drop-hover') {
          dragOverHandler = handler
        } else if (event === 'tauri://file-drop-cancelled') {
          dragLeaveHandler = handler
        }
        return Promise.resolve(mockUnlisten)
      })
      
      const { result } = renderHook(() => useFileDropZone())
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      
      // Set drag over first
      await act(async () => {
        dragOverHandler({ payload: [] })
      })
      
      expect(result.current.isDragOver).toBe(true)
      
      // Then drag leave
      await act(async () => {
        dragLeaveHandler({ payload: [] })
      })
      
      expect(result.current.isDragOver).toBe(false)
    })
  })

  describe('Loading State', () => {
    it('should manage importing state during file drop', async () => {
      const mockUnlisten = vi.fn()
      let fileDropHandler: any
      
      vi.mocked(listen).mockImplementation((event, handler) => {
        if (event === 'tauri://file-drop') {
          fileDropHandler = handler
        }
        return Promise.resolve(mockUnlisten)
      })
      
      // Mock slow import
      vi.mocked(invoke).mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({ success: 1, failed: 0, files: ['file1.md'] }), 100)
        )
      )
      
      const { result } = renderHook(() => useFileDropZone())
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0))
      })
      
      expect(result.current.isImporting).toBe(false)
      
      // Start import
      const importPromise = act(async () => {
        await fileDropHandler({ payload: ['file1.md'] })
      })
      
      // Should be importing
      expect(result.current.isImporting).toBe(true)
      
      // Wait for completion
      await importPromise
      
      expect(result.current.isImporting).toBe(false)
    })
  })
})

describe('useFileOperations Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Import Markdown Files', () => {
    it('should import markdown files with dialog', async () => {
      vi.mocked(invoke).mockResolvedValue({
        success: 3,
        failed: 0,
        files: ['file1.md', 'file2.md', 'file3.md']
      })
      
      const { result } = renderHook(() => useFileOperations())
      
      let importResult: any
      await act(async () => {
        importResult = await result.current.importMarkdownFiles()
      })
      
      expect(invoke).toHaveBeenCalledWith('import_markdown_files_with_dialog')
      expect(importResult).toEqual({
        success: 3,
        failed: 0,
        files: ['file1.md', 'file2.md', 'file3.md']
      })
      
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'success',
        title: '导入成功',
        message: '成功导入 3 个文件',
        duration: 4000
      })
    })

    it('should handle import with failures', async () => {
      vi.mocked(invoke).mockResolvedValue({
        success: 2,
        failed: 1,
        files: ['file1.md', 'file2.md']
      })
      
      const { result } = renderHook(() => useFileOperations())
      
      await act(async () => {
        await result.current.importMarkdownFiles()
      })
      
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'warning',
        title: '部分导入失败',
        message: '1 个文件导入失败',
        duration: 5000
      })
    })

    it('should handle import error', async () => {
      const errorMessage = 'Dialog cancelled'
      vi.mocked(invoke).mockRejectedValue(new Error(errorMessage))
      
      const { result } = renderHook(() => useFileOperations())
      
      await expect(
        act(async () => {
          await result.current.importMarkdownFiles()
        })
      ).rejects.toThrow(errorMessage)
      
      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'error',
        title: '导入失败',
        message: `文件导入失败：${errorMessage}`,
        duration: 5000
      })
    })

    it('should handle no files selected', async () => {
      vi.mocked(invoke).mockResolvedValue({
        success: 0,
        failed: 0,
        files: []
      })
      
      const { result } = renderHook(() => useFileOperations())
      
      await act(async () => {
        await result.current.importMarkdownFiles()
      })
      
      // Should not show success notification for 0 files
      expect(mockAddNotification).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success' })
      )
    })
  })

  describe('Error Handling', () => {
    it('should handle notification context not available', () => {
      // Mock useNotifications to throw error
      vi.doMock('../../contexts/NotificationContext', () => ({
        useNotifications: () => {
          throw new Error('NotificationProvider not found')
        }
      }))
      
      // Should not throw error when rendering hook
      expect(() => {
        renderHook(() => useFileDropZone())
      }).not.toThrow()
    })
  })
})
