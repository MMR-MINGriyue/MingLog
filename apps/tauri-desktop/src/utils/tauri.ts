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

export interface Block {
  id: string
  content: string
  parent_id?: string
  page_id: string
  properties?: Record<string, any>
  children: string[]
  refs: string[]
  order: number
  collapsed: boolean
  created_at: number
  updated_at: number
}

export interface Page {
  id: string
  name: string
  title?: string
  properties?: Record<string, any>
  tags: string[]
  is_journal: boolean
  journal_date?: string
  created_at: number
  updated_at: number
}

export interface CreateBlockRequest {
  content: string
  parent_id?: string
  page_id: string
  properties?: Record<string, any>
  order?: number
}

export interface UpdateBlockRequest {
  id: string
  content?: string
  parent_id?: string
  properties?: Record<string, any>
  order?: number
  collapsed?: boolean
}

export interface CreatePageRequest {
  name: string
  title?: string
  properties?: Record<string, any>
  tags?: string[]
  is_journal?: boolean
  journal_date?: string
}

export interface BlockSearchRequest {
  query: string
  page_id?: string
  include_pages?: boolean
  include_blocks?: boolean
  tags?: string[]
  is_journal?: boolean
  limit?: number
  threshold?: number
}

export interface BlockSearchResult {
  id: string
  result_type: 'page' | 'block'
  title: string
  content: string
  excerpt: string
  score: number
  page_id?: string
  page_name?: string
  block_id?: string
  tags: string[]
  is_journal: boolean
  created_at: number
  updated_at: number
}

export interface BlockSearchResponse {
  results: BlockSearchResult[]
  total: number
  query: string
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

// Block commands
export const createBlock = (request: CreateBlockRequest): Promise<Block> =>
  invoke('create_block', { request })

export const getBlock = (id: string): Promise<Block> =>
  invoke('get_block', { id })

export const getBlocksByPage = (pageId: string): Promise<Block[]> =>
  invoke('get_blocks_by_page', { pageId })

export const updateBlock = (request: UpdateBlockRequest): Promise<Block> =>
  invoke('update_block', { request })

export const deleteBlock = (id: string): Promise<void> =>
  invoke('delete_block', { id })

// Page commands
export const createPage = (request: CreatePageRequest): Promise<Page> =>
  invoke('create_page', { request })

export const getPage = (id: string): Promise<Page> =>
  invoke('get_page', { id })

export const getPagesByGraph = (graphId: string): Promise<Page[]> =>
  invoke('get_pages_by_graph', { graphId })

export const updatePage = (request: { id: string; name?: string; title?: string; properties?: Record<string, any>; tags?: string[] }): Promise<Page> =>
  invoke('update_page', { request })

export const deletePage = (id: string): Promise<void> =>
  invoke('delete_page', { id })

// Search commands
export const searchBlocks = (request: BlockSearchRequest): Promise<BlockSearchResponse> =>
  invoke('search_blocks', { request })

export const searchInPage = (pageId: string, query: string): Promise<BlockSearchResponse> =>
  invoke('search_in_page', { pageId, query })

// Graph commands
export const getGraphData = (graphId: string, includeBlocks?: boolean): Promise<any> =>
  invoke('get_graph_data', { graphId, includeBlocks })

export const createSampleGraphData = (): Promise<void> =>
  invoke('create_sample_graph_data')

// File operations commands
export interface ImportResult {
  pages_imported: number
  blocks_imported: number
  errors: string[]
}

export interface ExportResult {
  files_exported: number
  total_size: number
  export_path: string
}

export const importMarkdownFile = (filePath: string, graphId: string): Promise<ImportResult> =>
  invoke('import_markdown_file', { filePath, graphId })

export const exportPageToMarkdown = (pageId: string, outputDir: string): Promise<string> =>
  invoke('export_page_to_markdown', { pageId, outputDir })

export const bulkExportPages = (pageIds: string[], outputDir: string): Promise<ExportResult> =>
  invoke('bulk_export_pages', { pageIds, outputDir })

export const createBackup = (outputPath: string): Promise<string> =>
  invoke('create_backup', { outputPath })

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
