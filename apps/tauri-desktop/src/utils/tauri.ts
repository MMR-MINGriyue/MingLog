import { invoke } from '@tauri-apps/api/tauri'

// Types for API responses
export interface Note {
  id: string
  title: string
  content: string
  tags?: string[]
  created_at: string
  updated_at: string
  is_favorite: boolean
  is_archived: boolean
}

export interface Tag {
  id: string
  name: string
  color?: string
  created_at: string
}

export interface CreateNoteRequest {
  title: string
  content: string
  tags?: string[]
}

export interface UpdateNoteRequest {
  id: string
  title?: string
  content?: string
  tags?: string[]
  is_favorite?: boolean
  is_archived?: boolean
}

export interface CreateTagRequest {
  name: string
  color?: string
}

export interface SearchRequest {
  query: string
  tags?: string[]
  date_from?: string
  date_to?: string
  include_archived?: boolean
  limit?: number
  offset?: number
}

export interface SearchResult {
  notes: Note[]
  total: number
  has_more: boolean
}

export interface AppInfo {
  name: string
  version: string
  description: string
  author: string
}

// App commands
export const initApp = (): Promise<string> => invoke('init_app')

export const getAppInfo = (): Promise<AppInfo> => invoke('get_app_info')

// Database commands
export const initDatabase = (): Promise<string> => invoke('init_database')

// Note commands
export const createNote = (request: CreateNoteRequest): Promise<Note> =>
  invoke('create_note', { request })

export const getNote = (id: string): Promise<Note> =>
  invoke('get_note', { id })

export const getNotes = (limit?: number, offset?: number): Promise<Note[]> =>
  invoke('get_notes', { limit, offset })

export const updateNote = (request: UpdateNoteRequest): Promise<Note> =>
  invoke('update_note', { request })

export const deleteNote = (id: string): Promise<void> =>
  invoke('delete_note', { id })

export const searchNotes = (request: SearchRequest): Promise<SearchResult> =>
  invoke('search_notes', { request })

// Tag commands
export const getTags = (): Promise<Tag[]> => invoke('get_tags')

export const createTag = (request: CreateTagRequest): Promise<Tag> =>
  invoke('create_tag', { request })

export const deleteTag = (id: string): Promise<void> =>
  invoke('delete_tag', { id })

// Settings commands
export const getSettings = (): Promise<Record<string, string>> =>
  invoke('get_settings')

export const updateSettings = (settings: Record<string, string>): Promise<void> =>
  invoke('update_settings', { settings })

// File commands
export const saveFile = (path: string, content: string): Promise<void> =>
  invoke('save_file', { path, content })

export const loadFile = (path: string): Promise<string> =>
  invoke('load_file', { path })

export const exportData = (path: string): Promise<void> =>
  invoke('export_data', { path })

export const importData = (path: string): Promise<string> =>
  invoke('import_data', { path })

// Error handling wrapper
export const withErrorHandling = async <T>(
  operation: () => Promise<T>,
  errorMessage?: string
): Promise<T | null> => {
  try {
    return await operation()
  } catch (error) {
    console.error(errorMessage || 'Operation failed:', error)
    return null
  }
}
