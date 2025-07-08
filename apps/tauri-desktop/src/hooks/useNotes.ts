import { useState, useEffect, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/core'

interface Note {
  id: string
  title: string
  content: string
  created_at: number
  updated_at: number
  tags: string[]
}

interface CreateNoteRequest {
  title: string
  content: string
  tags?: string[]
}

interface UpdateNoteRequest {
  id: string
  title?: string
  content?: string
  tags?: string[]
}

interface UseNotesReturn {
  notes: Note[]
  loading: boolean
  error: string | null
  createNote: (note: CreateNoteRequest) => Promise<Note | null>
  updateNote: (note: UpdateNoteRequest) => Promise<Note | null>
  deleteNote: (id: string) => Promise<boolean>
  getNoteById: (id: string) => Note | undefined
  searchNotes: (query: string) => Note[]
  refreshNotes: () => Promise<void>
}

export const useNotes = (): UseNotesReturn => {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load all notes
  const loadNotes = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await invoke<Note[]>('get_all_notes')
      setNotes(result || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load notes'
      setError(errorMessage)
      console.error('Failed to load notes:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Create a new note
  const createNote = useCallback(async (noteData: CreateNoteRequest): Promise<Note | null> => {
    try {
      setError(null)
      const newNote = await invoke<Note>('create_note', { request: noteData })
      if (newNote) {
        setNotes(prev => [newNote, ...prev])
        return newNote
      }
      return null
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create note'
      setError(errorMessage)
      console.error('Failed to create note:', err)
      return null
    }
  }, [])

  // Update an existing note
  const updateNote = useCallback(async (noteData: UpdateNoteRequest): Promise<Note | null> => {
    try {
      setError(null)
      const updatedNote = await invoke<Note>('update_note', { request: noteData })
      if (updatedNote) {
        setNotes(prev => prev.map(note => 
          note.id === updatedNote.id ? updatedNote : note
        ))
        return updatedNote
      }
      return null
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update note'
      setError(errorMessage)
      console.error('Failed to update note:', err)
      return null
    }
  }, [])

  // Delete a note
  const deleteNote = useCallback(async (id: string): Promise<boolean> => {
    try {
      setError(null)
      await invoke('delete_note', { id })
      setNotes(prev => prev.filter(note => note.id !== id))
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete note'
      setError(errorMessage)
      console.error('Failed to delete note:', err)
      return false
    }
  }, [])

  // Get a note by ID
  const getNoteById = useCallback((id: string): Note | undefined => {
    return notes.find(note => note.id === id)
  }, [notes])

  // Search notes by query
  const searchNotes = useCallback((query: string): Note[] => {
    if (!query.trim()) {
      return notes
    }

    const lowercaseQuery = query.toLowerCase()
    return notes.filter(note => 
      note.title.toLowerCase().includes(lowercaseQuery) ||
      note.content.toLowerCase().includes(lowercaseQuery) ||
      note.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    )
  }, [notes])

  // Refresh notes (reload from backend)
  const refreshNotes = useCallback(async () => {
    await loadNotes()
  }, [loadNotes])

  // Load notes on mount
  useEffect(() => {
    loadNotes()
  }, [loadNotes])

  return {
    notes,
    loading,
    error,
    createNote,
    updateNote,
    deleteNote,
    getNoteById,
    searchNotes,
    refreshNotes
  }
}

export type { Note, CreateNoteRequest, UpdateNoteRequest, UseNotesReturn }
