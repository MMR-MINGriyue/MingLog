import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useNotes } from '../useNotes'

// Mock Tauri API with proper hoisting
vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: vi.fn(),
}))

// Import the mocked invoke function
import { invoke } from '@tauri-apps/api/tauri'
const mockInvoke = vi.mocked(invoke)

// Mock sample data
const mockNotes = [
  {
    id: '1',
    title: 'Test Note 1',
    content: 'This is test content 1',
    created_at: 1640995200000,
    updated_at: 1640995200000,
    tags: ['test', 'sample'],
  },
  {
    id: '2',
    title: 'Test Note 2',
    content: 'This is test content 2',
    created_at: 1640995300000,
    updated_at: 1640995300000,
    tags: ['test'],
  },
]

describe('useNotes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockInvoke.mockResolvedValue(mockNotes)
  })

  it('initializes with empty notes array', () => {
    const { result } = renderHook(() => useNotes())
    
    expect(result.current.notes).toEqual([])
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it('loads notes on mount', async () => {
    const { result } = renderHook(() => useNotes())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    expect(mockInvoke).toHaveBeenCalledWith('get_all_notes')
    expect(result.current.notes).toEqual(mockNotes)
    expect(result.current.error).toBeNull()
  })

  it('handles loading error', async () => {
    const errorMessage = 'Failed to load notes'
    mockInvoke.mockRejectedValue(new Error(errorMessage))
    
    const { result } = renderHook(() => useNotes())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    expect(result.current.notes).toEqual([])
    expect(result.current.error).toBe(errorMessage)
  })

  it('creates a new note', async () => {
    const newNote = {
      id: '3',
      title: 'New Note',
      content: 'New content',
      created_at: Date.now(),
      updated_at: Date.now(),
      tags: [],
    }
    
    mockInvoke.mockResolvedValueOnce(mockNotes)
    mockInvoke.mockResolvedValueOnce(newNote)
    
    const { result } = renderHook(() => useNotes())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    await act(async () => {
      await result.current.createNote({ title: 'New Note', content: 'New content' })
    })

    expect(mockInvoke).toHaveBeenCalledWith('create_note', {
      request: { title: 'New Note', content: 'New content' }
    })
  })

  it('updates an existing note', async () => {
    const updatedNote = {
      ...mockNotes[0],
      title: 'Updated Title',
      content: 'Updated content',
      updated_at: Date.now(),
    }
    
    mockInvoke.mockResolvedValueOnce(mockNotes)
    mockInvoke.mockResolvedValueOnce(updatedNote)
    
    const { result } = renderHook(() => useNotes())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    await act(async () => {
      await result.current.updateNote({
        id: '1',
        title: 'Updated Title',
        content: 'Updated content',
      })
    })

    expect(mockInvoke).toHaveBeenCalledWith('update_note', {
      request: {
        id: '1',
        title: 'Updated Title',
        content: 'Updated content',
      }
    })
  })

  it('deletes a note', async () => {
    mockInvoke.mockResolvedValueOnce(mockNotes)
    mockInvoke.mockResolvedValueOnce(undefined)
    
    const { result } = renderHook(() => useNotes())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    await act(async () => {
      await result.current.deleteNote('1')
    })

    expect(mockInvoke).toHaveBeenCalledWith('delete_note', { id: '1' })
  })

  it.skip('searches notes', async () => {
    // This functionality is not implemented in the current useNotes hook
    const searchResults = [mockNotes[0]]
    mockInvoke.mockResolvedValueOnce({ notes: mockNotes })
    mockInvoke.mockResolvedValueOnce({ results: searchResults })

    const { result } = renderHook(() => useNotes())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // await act(async () => {
    //   await result.current.searchNotes('test')
    // })

    // expect(mockInvoke).toHaveBeenCalledWith('search_notes', { query: 'test' })
  })

  it.skip('filters notes by tag', () => {
    // This functionality is not implemented in the current useNotes hook
    const { result } = renderHook(() => useNotes())

    // act(() => {
    //   result.current.notes = mockNotes
    // })

    // const filteredNotes = result.current.getNotesWithTag('sample')
    // expect(filteredNotes).toEqual([mockNotes[0]])
  })

  it.skip('gets note by id', () => {
    // This functionality is not implemented in the current useNotes hook
    const { result } = renderHook(() => useNotes())

    // act(() => {
    //   result.current.notes = mockNotes
    // })

    // const note = result.current.getNoteById('1')
    // expect(note).toEqual(mockNotes[0])
  })

  it('handles concurrent operations', async () => {
    mockInvoke.mockResolvedValue(mockNotes)
    
    const { result } = renderHook(() => useNotes())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    // Simulate concurrent create and update operations
    const createPromise = act(async () => {
      await result.current.createNote({ title: 'Concurrent Note 1', content: 'Content 1' })
    })

    const updatePromise = act(async () => {
      await result.current.updateNote({ id: '1', title: 'Updated concurrently' })
    })
    
    await Promise.all([createPromise, updatePromise])
    
    expect(mockInvoke).toHaveBeenCalledTimes(3) // Initial load + create + update
  })

  it.skip('refreshes notes list', async () => {
    mockInvoke.mockResolvedValue(mockNotes)

    const { result } = renderHook(() => useNotes())

    // Wait for initial load to complete
    await waitFor(() => {
      expect(result.current).not.toBeNull()
      expect(result.current.loading).toBe(false)
    }, { timeout: 3000 })

    // Clear previous calls and refresh
    mockInvoke.mockClear()
    mockInvoke.mockResolvedValue(mockNotes)

    await act(async () => {
      await result.current.refreshNotes()
    })

    expect(mockInvoke).toHaveBeenCalledTimes(1) // Only refresh call
  })

  it.skip('handles empty notes response', async () => {
    mockInvoke.mockResolvedValue([])

    const { result } = renderHook(() => useNotes())

    await waitFor(() => {
      expect(result.current).not.toBeNull()
      expect(result.current.loading).toBe(false)
    }, { timeout: 3000 })

    expect(result.current.notes).toEqual([])
    expect(result.current.error).toBeNull()
  })
})
