/**
 * 笔记服务 - 处理笔记的CRUD操作和业务逻辑
 */

import { invoke } from '@tauri-apps/api/tauri'

// 笔记数据类型
export interface Note {
  id: string
  title: string
  content: string
  excerpt: string
  tags: string[]
  isFavorite: boolean
  isArchived: boolean
  createdAt: Date
  updatedAt: Date
  wordCount: number
}

// 创建笔记的输入类型
export interface CreateNoteInput {
  title: string
  content?: string
  tags?: string[]
}

// 更新笔记的输入类型
export interface UpdateNoteInput {
  title?: string
  content?: string
  tags?: string[]
  isFavorite?: boolean
  isArchived?: boolean
}

// 搜索选项
export interface SearchOptions {
  query?: string
  tags?: string[]
  isFavorite?: boolean
  isArchived?: boolean
  sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'wordCount'
  sortOrder?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

// 笔记统计信息
export interface NotesStats {
  total: number
  favorites: number
  archived: number
  totalWords: number
  tagsCount: number
}

/**
 * 笔记服务类
 */
export class NotesService {
  private static instance: NotesService | null = null

  private constructor() {}

  /**
   * 获取单例实例
   */
  public static getInstance(): NotesService {
    if (!NotesService.instance) {
      NotesService.instance = new NotesService()
    }
    return NotesService.instance
  }

  /**
   * 获取所有笔记
   */
  async getAllNotes(options: SearchOptions = {}): Promise<Note[]> {
    try {
      const result = await invoke<any[]>('get_notes', { options })
      return result.map(this.transformNoteFromDb)
    } catch (error) {
      console.error('Failed to get notes:', error)
      // 返回模拟数据作为后备
      return this.getMockNotes()
    }
  }

  /**
   * 根据ID获取笔记
   */
  async getNoteById(id: string): Promise<Note | null> {
    try {
      const result = await invoke<any>('get_note_by_id', { id })
      return result ? this.transformNoteFromDb(result) : null
    } catch (error) {
      console.error('Failed to get note by id:', error)
      // 返回模拟数据作为后备
      const mockNotes = this.getMockNotes()
      return mockNotes.find(note => note.id === id) || null
    }
  }

  /**
   * 创建新笔记
   */
  async createNote(input: CreateNoteInput): Promise<Note> {
    try {
      const noteData = {
        id: `note-${Date.now()}`,
        title: input.title,
        content: input.content || '',
        excerpt: this.generateExcerpt(input.content || ''),
        tags: input.tags || [],
        isFavorite: false,
        isArchived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        wordCount: (input.content || '').length
      }

      const result = await invoke<any>('create_note', { note: noteData })
      return this.transformNoteFromDb(result)
    } catch (error) {
      console.error('Failed to create note:', error)
      // 返回模拟创建的笔记
      return {
        id: `note-${Date.now()}`,
        title: input.title,
        content: input.content || '',
        excerpt: this.generateExcerpt(input.content || ''),
        tags: input.tags || [],
        isFavorite: false,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        wordCount: (input.content || '').length
      }
    }
  }

  /**
   * 更新笔记
   */
  async updateNote(id: string, input: UpdateNoteInput): Promise<Note> {
    try {
      const updateData = {
        ...input,
        updatedAt: new Date().toISOString(),
        ...(input.content !== undefined && {
          excerpt: this.generateExcerpt(input.content),
          wordCount: input.content.length
        })
      }

      const result = await invoke<any>('update_note', { id, updates: updateData })
      return this.transformNoteFromDb(result)
    } catch (error) {
      console.error('Failed to update note:', error)
      throw new Error('更新笔记失败')
    }
  }

  /**
   * 删除笔记
   */
  async deleteNote(id: string): Promise<boolean> {
    try {
      await invoke('delete_note', { id })
      return true
    } catch (error) {
      console.error('Failed to delete note:', error)
      throw new Error('删除笔记失败')
    }
  }

  /**
   * 搜索笔记
   */
  async searchNotes(query: string, options: SearchOptions = {}): Promise<Note[]> {
    try {
      const searchOptions = { ...options, query }
      const result = await invoke<any[]>('search_notes', { options: searchOptions })
      return result.map(this.transformNoteFromDb)
    } catch (error) {
      console.error('Failed to search notes:', error)
      // 返回模拟搜索结果
      const mockNotes = this.getMockNotes()
      return mockNotes.filter(note => 
        note.title.toLowerCase().includes(query.toLowerCase()) ||
        note.content.toLowerCase().includes(query.toLowerCase()) ||
        note.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      )
    }
  }

  /**
   * 获取所有标签
   */
  async getAllTags(): Promise<string[]> {
    try {
      return await invoke<string[]>('get_all_tags')
    } catch (error) {
      console.error('Failed to get tags:', error)
      // 返回模拟标签
      const mockNotes = this.getMockNotes()
      const tagSet = new Set<string>()
      mockNotes.forEach(note => {
        note.tags.forEach(tag => tagSet.add(tag))
      })
      return Array.from(tagSet).sort()
    }
  }

  /**
   * 获取笔记统计信息
   */
  async getNotesStats(): Promise<NotesStats> {
    try {
      return await invoke<NotesStats>('get_notes_stats')
    } catch (error) {
      console.error('Failed to get notes stats:', error)
      // 返回模拟统计
      const mockNotes = this.getMockNotes()
      const tagSet = new Set<string>()
      mockNotes.forEach(note => {
        note.tags.forEach(tag => tagSet.add(tag))
      })
      
      return {
        total: mockNotes.length,
        favorites: mockNotes.filter(note => note.isFavorite).length,
        archived: mockNotes.filter(note => note.isArchived).length,
        totalWords: mockNotes.reduce((sum, note) => sum + note.wordCount, 0),
        tagsCount: tagSet.size
      }
    }
  }

  /**
   * 批量操作笔记
   */
  async batchUpdateNotes(ids: string[], updates: UpdateNoteInput): Promise<boolean> {
    try {
      await invoke('batch_update_notes', { ids, updates })
      return true
    } catch (error) {
      console.error('Failed to batch update notes:', error)
      throw new Error('批量更新笔记失败')
    }
  }

  /**
   * 导出笔记
   */
  async exportNotes(ids: string[], format: 'json' | 'markdown' | 'txt' = 'json'): Promise<string> {
    try {
      return await invoke<string>('export_notes', { ids, format })
    } catch (error) {
      console.error('Failed to export notes:', error)
      throw new Error('导出笔记失败')
    }
  }

  /**
   * 导入笔记
   */
  async importNotes(data: string, format: 'json' | 'markdown' | 'txt' = 'json'): Promise<Note[]> {
    try {
      const result = await invoke<any[]>('import_notes', { data, format })
      return result.map(this.transformNoteFromDb)
    } catch (error) {
      console.error('Failed to import notes:', error)
      throw new Error('导入笔记失败')
    }
  }

  /**
   * 从数据库格式转换为应用格式
   */
  private transformNoteFromDb(dbNote: any): Note {
    return {
      id: dbNote.id,
      title: dbNote.title,
      content: dbNote.content,
      excerpt: dbNote.excerpt,
      tags: Array.isArray(dbNote.tags) ? dbNote.tags : JSON.parse(dbNote.tags || '[]'),
      isFavorite: Boolean(dbNote.is_favorite),
      isArchived: Boolean(dbNote.is_archived),
      createdAt: new Date(dbNote.created_at),
      updatedAt: new Date(dbNote.updated_at),
      wordCount: dbNote.word_count || dbNote.content?.length || 0
    }
  }

  /**
   * 生成笔记摘要
   */
  private generateExcerpt(content: string, maxLength: number = 150): string {
    if (!content) return ''
    
    // 移除Markdown标记和多余空白
    const cleanContent = content
      .replace(/#{1,6}\s+/g, '') // 移除标题标记
      .replace(/\*\*(.*?)\*\*/g, '$1') // 移除粗体标记
      .replace(/\*(.*?)\*/g, '$1') // 移除斜体标记
      .replace(/`(.*?)`/g, '$1') // 移除代码标记
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 移除链接，保留文本
      .replace(/\n+/g, ' ') // 将换行符替换为空格
      .replace(/\s+/g, ' ') // 合并多个空格
      .trim()

    return cleanContent.length > maxLength 
      ? cleanContent.slice(0, maxLength) + '...'
      : cleanContent
  }

  /**
   * 获取模拟数据
   */
  private getMockNotes(): Note[] {
    return [
      {
        id: 'note-1',
        title: '欢迎使用 MingLog',
        content: '# 欢迎使用 MingLog\n\n这是您的第一个笔记。您可以在这里记录想法、制定计划或保存重要信息。\n\n## 功能特点\n\n- 📝 **富文本编辑**: 支持Markdown语法\n- 🏷️ **标签管理**: 灵活的标签系统\n- 🔍 **快速搜索**: 全文搜索功能\n- 💾 **自动保存**: 实时保存您的内容\n- ⭐ **收藏功能**: 标记重要笔记\n- 📁 **归档管理**: 整理您的笔记\n\n## 快捷键\n\n- `Ctrl+N`: 新建笔记\n- `Ctrl+S`: 保存笔记\n- `Ctrl+F`: 搜索笔记\n- `Ctrl+K`: 全局搜索\n\n开始您的笔记之旅吧！',
        excerpt: '这是您的第一个笔记。您可以在这里记录想法、制定计划或保存重要信息...',
        tags: ['欢迎', '指南', '功能'],
        isFavorite: true,
        isArchived: false,
        createdAt: new Date('2024-01-15T10:00:00'),
        updatedAt: new Date('2024-01-15T10:00:00'),
        wordCount: 156
      },
      {
        id: 'note-2',
        title: '项目计划',
        content: '# 项目计划\n\n## 第一阶段\n- [ ] 需求分析\n- [ ] 技术选型\n- [ ] 原型设计\n\n## 第二阶段\n- [ ] 核心功能开发\n- [ ] 测试用例编写\n- [ ] 性能优化\n\n## 第三阶段\n- [ ] 用户测试\n- [ ] 文档编写\n- [ ] 发布准备',
        excerpt: '项目开发的三个主要阶段规划，包括需求分析、开发和测试...',
        tags: ['项目', '计划', '开发'],
        isFavorite: false,
        isArchived: false,
        createdAt: new Date('2024-01-16T14:30:00'),
        updatedAt: new Date('2024-01-16T16:45:00'),
        wordCount: 89
      },
      {
        id: 'note-3',
        title: '学习笔记 - React Hooks',
        content: '# React Hooks 学习笔记\n\n## useState\n用于在函数组件中添加状态。\n\n```javascript\nconst [count, setCount] = useState(0)\n```\n\n## useEffect\n用于处理副作用，如数据获取、订阅等。\n\n```javascript\nuseEffect(() => {\n  // 副作用逻辑\n}, [dependencies])\n```\n\n## useCallback\n用于优化性能，缓存函数引用。\n\n```javascript\nconst memoizedCallback = useCallback(() => {\n  // 回调逻辑\n}, [dependencies])\n```',
        excerpt: 'React Hooks的基础用法，包括useState、useEffect和useCallback...',
        tags: ['学习', 'React', '前端', '编程'],
        isFavorite: true,
        isArchived: false,
        createdAt: new Date('2024-01-17T09:15:00'),
        updatedAt: new Date('2024-01-17T11:20:00'),
        wordCount: 134
      }
    ]
  }
}

// 导出单例实例
export const notesService = NotesService.getInstance()
