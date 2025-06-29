import { useState, useEffect, useCallback } from 'react'
import { 
  Tag, 
  CreateTagRequest,
  getTags, 
  createTag, 
  deleteTag,
  withErrorHandling 
} from '../utils/tauri'

interface UseTagsReturn {
  tags: Tag[]
  loading: boolean
  error: string | null
  createNewTag: (request: CreateTagRequest) => Promise<Tag | null>
  deleteExistingTag: (id: string) => Promise<boolean>
  refreshTags: () => Promise<void>
  clearError: () => void
  getTagById: (id: string) => Tag | undefined
  getTagsByIds: (ids: string[]) => Tag[]
}

export const useTags = (): UseTagsReturn => {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadTags = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    const result = await withErrorHandling(
      () => getTags(),
      'Failed to load tags'
    )
    
    if (result) {
      setTags(result)
    } else {
      setError('Failed to load tags')
    }
    
    setLoading(false)
  }, [])

  const createNewTag = useCallback(async (request: CreateTagRequest): Promise<Tag | null> => {
    setError(null)
    
    // Check if tag with same name already exists
    const existingTag = tags.find(tag => 
      tag.name.toLowerCase() === request.name.toLowerCase()
    )
    
    if (existingTag) {
      setError('Tag with this name already exists')
      return null
    }
    
    const result = await withErrorHandling(
      () => createTag(request),
      'Failed to create tag'
    )
    
    if (result) {
      setTags(prev => [...prev, result].sort((a, b) => a.name.localeCompare(b.name)))
      return result
    } else {
      setError('Failed to create tag')
      return null
    }
  }, [tags])

  const deleteExistingTag = useCallback(async (id: string): Promise<boolean> => {
    setError(null)
    
    const result = await withErrorHandling(
      () => deleteTag(id),
      'Failed to delete tag'
    )
    
    if (result !== null) {
      setTags(prev => prev.filter(tag => tag.id !== id))
      return true
    } else {
      setError('Failed to delete tag')
      return false
    }
  }, [])

  const refreshTags = useCallback(async () => {
    await loadTags()
  }, [loadTags])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const getTagById = useCallback((id: string): Tag | undefined => {
    return tags.find(tag => tag.id === id)
  }, [tags])

  const getTagsByIds = useCallback((ids: string[]): Tag[] => {
    return tags.filter(tag => ids.includes(tag.id))
  }, [tags])

  useEffect(() => {
    loadTags()
  }, [loadTags])

  return {
    tags,
    loading,
    error,
    createNewTag,
    deleteExistingTag,
    refreshTags,
    clearError,
    getTagById,
    getTagsByIds
  }
}
