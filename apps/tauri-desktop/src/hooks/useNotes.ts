import { useState, useEffect, useCallback } from 'react'
import { 
  Note, 
  CreateNoteRequest, 
  UpdateNoteRequest,
  getNotes, 
  createNote, 
  updateNote, 
  deleteNote,
  withErrorHandling 
} from '../utils/tauri'

interface UseNotesReturn {
  notes: Note[]
  loading: boolean
  error: string | null
  createNewNote: (request: CreateNoteRequest) => Promise<Note | null>
  updateExistingNote: (request: UpdateNoteRequest) => Promise<Note | null>
  deleteExistingNote: (id: string) => Promise<boolean>
  refreshNotes: () => Promise<void>
  clearError: () => void
}

export const useNotes = (limit?: number, offset?: number): UseNotesReturn => {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadNotes = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    const result = await withErrorHandling(
      () => getNotes(limit, offset),
      'Failed to load notes'
    )
    
    if (result) {
      setNotes(result)
    } else {
      setError('Failed to load notes')
    }
    
    setLoading(false)
  }, [limit, offset])

  const createNewNote = useCallback(async (request: CreateNoteRequest): Promise<Note | null> => {
    setError(null)
    
    const result = await withErrorHandling(
      () => createNote(request),
      'Failed to create note'
    )
    
    if (result) {
      setNotes(prev => [result, ...prev])
      return result
    } else {
      setError('Failed to create note')
      return null
    }
  }, [])

  const updateExistingNote = useCallback(async (request: UpdateNoteRequest): Promise<Note | null> => {
    setError(null)
    
    const result = await withErrorHandling(
      () => updateNote(request),
      'Failed to update note'
    )
    
    if (result) {
      setNotes(prev => prev.map(note => 
        note.id === result.id ? result : note
      ))
      return result
    } else {
      setError('Failed to update note')
      return null
    }
  }, [])

  const deleteExistingNote = useCallback(async (id: string): Promise<boolean> => {
    setError(null)
    
    const result = await withErrorHandling(
      () => deleteNote(id),
      'Failed to delete note'
    )
    
    if (result !== null) {
      setNotes(prev => prev.filter(note => note.id !== id))
      return true
    } else {
      setError('Failed to delete note')
      return false
    }
  }, [])

  const refreshNotes = useCallback(async () => {
    await loadNotes()
  }, [loadNotes])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  useEffect(() => {
    loadNotes()
  }, [loadNotes])

  return {
    notes,
    loading,
    error,
    createNewNote,
    updateExistingNote,
    deleteExistingNote,
    refreshNotes,
    clearError
  }
}
