/**
 * 笔记页面 - 完整的笔记CRUD系统
 * 支持笔记列表、编辑、搜索、标签管理等功能
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Tag,
  Calendar,
  Star,
  Archive,

  FileText,
  Filter,
  SortAsc,
  SortDesc,
  Keyboard
} from 'lucide-react'
import { useNotifications } from '../components/NotificationSystem'
import { notesService, Note, UpdateNoteInput } from '../services/NotesService'
import MarkdownEditor from '../components/MarkdownEditor'
import TagManager from '../components/TagManager'
import NotesShortcuts, { ShortcutsHelp } from '../components/NotesShortcuts'
import '../styles/notes.css'
import '../styles/markdown-editor.css'

// 排序选项
type SortOption = 'updated' | 'created' | 'title' | 'wordCount'
type SortDirection = 'asc' | 'desc'

// 过滤选项
interface FilterOptions {
  showArchived: boolean
  showFavorites: boolean
  selectedTags: string[]
}

const NotesPage: React.FC = () => {
  const { t: _t } = useTranslation()
  const navigate = useNavigate()
  const { noteId } = useParams<{ noteId?: string }>()
  const { success, error } = useNotifications()

  // 状态管理
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false)
  const [sortOption, setSortOption] = useState<SortOption>('updated')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    showArchived: false,
    showFavorites: false,
    selectedTags: []
  })

  // 引用
  const searchInputRef = useRef<HTMLInputElement>(null)



  // 初始化数据
  useEffect(() => {
    const loadNotes = async () => {
      setIsLoading(true)
      try {
        const loadedNotes = await notesService.getAllNotes()
        setNotes(loadedNotes)

        // 如果URL中有noteId，选中对应笔记
        if (noteId) {
          const note = loadedNotes.find(n => n.id === noteId)
          if (note) {
            setSelectedNote(note)
          }
        }
      } catch (err) {
        error('加载笔记失败')
      } finally {
        setIsLoading(false)
      }
    }

    loadNotes()
  }, [noteId, error])

  // 获取所有标签
  const allTags = useMemo(() => {
    const tagSet = new Set<string>()
    notes.forEach(note => {
      note.tags.forEach(tag => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  }, [notes])

  // 过滤和排序笔记
  const filteredAndSortedNotes = useMemo(() => {
    let filtered = notes.filter(note => {
      // 搜索过滤
      if (searchQuery) {
        const query = searchQuery.toLowerCase()
        const matchesTitle = note.title.toLowerCase().includes(query)
        const matchesContent = note.content.toLowerCase().includes(query)
        const matchesTags = note.tags.some(tag => tag.toLowerCase().includes(query))
        if (!matchesTitle && !matchesContent && !matchesTags) {
          return false
        }
      }

      // 归档过滤
      if (!filterOptions.showArchived && note.isArchived) {
        return false
      }

      // 收藏过滤
      if (filterOptions.showFavorites && !note.isFavorite) {
        return false
      }

      // 标签过滤
      if (filterOptions.selectedTags.length > 0) {
        const hasSelectedTag = filterOptions.selectedTags.some(tag => 
          note.tags.includes(tag)
        )
        if (!hasSelectedTag) {
          return false
        }
      }

      return true
    })

    // 排序
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortOption) {
        case 'title':
          comparison = a.title.localeCompare(b.title)
          break
        case 'created':
          comparison = a.createdAt.getTime() - b.createdAt.getTime()
          break
        case 'updated':
          comparison = a.updatedAt.getTime() - b.updatedAt.getTime()
          break
        case 'wordCount':
          comparison = a.wordCount - b.wordCount
          break
        default:
          comparison = a.updatedAt.getTime() - b.updatedAt.getTime()
      }

      return sortDirection === 'desc' ? -comparison : comparison
    })

    return filtered
  }, [notes, searchQuery, filterOptions, sortOption, sortDirection])

  // 创建新笔记
  const createNote = useCallback(async () => {
    try {
      const newNote = await notesService.createNote({
        title: '新笔记',
        content: '',
        tags: []
      })

      setNotes(prev => [newNote, ...prev])
      setSelectedNote(newNote)
      navigate(`/notes/${newNote.id}`)
      success('新笔记已创建')
    } catch (err) {
      error('创建笔记失败')
    }
  }, [navigate, success, error])

  // 更新笔记
  const updateNote = useCallback(async (noteId: string, updates: UpdateNoteInput) => {
    setIsSaving(true)
    try {
      const updatedNote = await notesService.updateNote(noteId, updates)

      setNotes(prev => prev.map(note =>
        note.id === noteId ? updatedNote : note
      ))

      if (selectedNote?.id === noteId) {
        setSelectedNote(updatedNote)
      }
    } catch (err) {
      error('保存失败')
    } finally {
      setIsSaving(false)
    }
  }, [selectedNote, error])

  // 删除笔记
  const deleteNote = useCallback(async (noteId: string) => {
    if (!confirm('确定要删除这个笔记吗？')) {
      return
    }

    try {
      await notesService.deleteNote(noteId)
      setNotes(prev => prev.filter(note => note.id !== noteId))

      if (selectedNote?.id === noteId) {
        setSelectedNote(null)
        navigate('/notes')
      }

      success('笔记已删除')
    } catch (err) {
      error('删除失败')
    }
  }, [selectedNote, navigate, success, error])

  // 切换收藏状态
  const toggleFavorite = useCallback(async (noteId: string) => {
    const note = notes.find(n => n.id === noteId)
    if (note) {
      await updateNote(noteId, { isFavorite: !note.isFavorite })
    }
  }, [notes, updateNote])

  // 切换归档状态
  const toggleArchive = useCallback(async (noteId: string) => {
    const note = notes.find(n => n.id === noteId)
    if (note) {
      await updateNote(noteId, { isArchived: !note.isArchived })
    }
  }, [notes, updateNote])

  // 快捷键处理函数
  const handleFocusSearch = useCallback(() => {
    searchInputRef.current?.focus()
  }, [])

  const handleNextNote = useCallback(() => {
    if (!selectedNote || filteredAndSortedNotes.length === 0) return
    const currentIndex = filteredAndSortedNotes.findIndex(note => note.id === selectedNote.id)
    const nextIndex = (currentIndex + 1) % filteredAndSortedNotes.length
    const nextNote = filteredAndSortedNotes[nextIndex]
    setSelectedNote(nextNote)
    navigate(`/notes/${nextNote.id}`)
  }, [selectedNote, filteredAndSortedNotes, navigate])

  const handlePrevNote = useCallback(() => {
    if (!selectedNote || filteredAndSortedNotes.length === 0) return
    const currentIndex = filteredAndSortedNotes.findIndex(note => note.id === selectedNote.id)
    const prevIndex = currentIndex === 0 ? filteredAndSortedNotes.length - 1 : currentIndex - 1
    const prevNote = filteredAndSortedNotes[prevIndex]
    setSelectedNote(prevNote)
    navigate(`/notes/${prevNote.id}`)
  }, [selectedNote, filteredAndSortedNotes, navigate])

  const handleToggleFavorite = useCallback(() => {
    if (selectedNote) {
      toggleFavorite(selectedNote.id)
    }
  }, [selectedNote, toggleFavorite])

  const handleToggleArchive = useCallback(() => {
    if (selectedNote) {
      toggleArchive(selectedNote.id)
    }
  }, [selectedNote, toggleArchive])

  const handleDeleteNote = useCallback(() => {
    if (selectedNote) {
      deleteNote(selectedNote.id)
    }
  }, [selectedNote, deleteNote])

  const handleSaveNote = useCallback(() => {
    // 保存逻辑已经在updateNote中自动处理
    if (selectedNote) {
      success('笔记已保存')
    }
  }, [selectedNote, success])

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载笔记中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex macos-content">
      {/* 左侧笔记列表 */}
      <div className="w-1/3 flex flex-col macos-vibrancy-sidebar border-r border-gray-200">
        {/* 工具栏 */}
        <div className="p-4 border-b border-gray-200">
          <div className="space-y-3">
            {/* 新建按钮 */}
            <button
              type="button"
              onClick={createNote}
              className="w-full macos-button macos-button-primary flex items-center justify-center space-x-2 py-3"
            >
              <Plus className="w-4 h-4" />
              <span>新建笔记</span>
            </button>

            {/* 搜索框 */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="搜索笔记..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 macos-input text-sm"
              />
            </div>

            {/* 过滤和排序 */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={`flex-1 macos-button ${showFilters ? 'macos-button-primary' : ''} flex items-center justify-center space-x-1 py-2`}
              >
                <Filter className="w-4 h-4" />
                <span className="text-sm">过滤</span>
              </button>
              
              <button
                type="button"
                onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                className="macos-button flex items-center justify-center p-2"
                title={`排序: ${sortDirection === 'asc' ? '升序' : '降序'}`}
              >
                {sortDirection === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
              </button>

              <button
                type="button"
                onClick={() => setShowShortcutsHelp(true)}
                className="macos-button flex items-center justify-center p-2"
                title="键盘快捷键 (F1)"
              >
                <Keyboard className="w-4 h-4" />
              </button>
            </div>

            {/* 过滤选项 */}
            {showFilters && (
              <div className="space-y-3 p-3 bg-gray-50 rounded-lg">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">排序方式</label>
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                    className="w-full macos-input text-sm"
                    title="选择排序方式"
                    aria-label="排序方式"
                  >
                    <option value="updated">最后修改</option>
                    <option value="created">创建时间</option>
                    <option value="title">标题</option>
                    <option value="wordCount">字数</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filterOptions.showFavorites}
                      onChange={(e) => setFilterOptions(prev => ({
                        ...prev,
                        showFavorites: e.target.checked
                      }))}
                      className="rounded"
                    />
                    <span className="text-sm">只显示收藏</span>
                  </label>
                  
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filterOptions.showArchived}
                      onChange={(e) => setFilterOptions(prev => ({
                        ...prev,
                        showArchived: e.target.checked
                      }))}
                      className="rounded"
                    />
                    <span className="text-sm">显示归档</span>
                  </label>
                </div>

                {allTags.length > 0 && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">标签过滤</label>
                    <div className="flex flex-wrap gap-1">
                      {allTags.map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            setFilterOptions(prev => ({
                              ...prev,
                              selectedTags: prev.selectedTags.includes(tag)
                                ? prev.selectedTags.filter(t => t !== tag)
                                : [...prev.selectedTags, tag]
                            }))
                          }}
                          className={`px-2 py-1 text-xs rounded-full border ${
                            filterOptions.selectedTags.includes(tag)
                              ? 'bg-blue-100 border-blue-300 text-blue-700'
                              : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 笔记列表 */}
        <div className="flex-1 overflow-y-auto">
          {filteredAndSortedNotes.length === 0 ? (
            <div className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">
                {searchQuery || filterOptions.selectedTags.length > 0 || filterOptions.showFavorites
                  ? '未找到匹配的笔记'
                  : '还没有笔记'
                }
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {searchQuery || filterOptions.selectedTags.length > 0 || filterOptions.showFavorites
                  ? '尝试调整搜索条件或过滤器'
                  : '创建您的第一个笔记开始记录'
                }
              </p>
            </div>
          ) : (
            filteredAndSortedNotes.map(note => (
              <div
                key={note.id}
                onClick={() => {
                  setSelectedNote(note)
                  navigate(`/notes/${note.id}`)
                }}
                className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                  selectedNote?.id === note.id
                    ? 'bg-blue-50 border-blue-200'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-900 truncate flex-1 mr-2">
                    {note.title}
                  </h3>
                  <div className="flex items-center space-x-1 flex-shrink-0">
                    {note.isFavorite && (
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    )}
                    {note.isArchived && (
                      <Archive className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                  {note.excerpt}
                </p>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-3">
                    <span>{note.updatedAt.toLocaleDateString('zh-CN')}</span>
                    <span>{note.wordCount} 字</span>
                  </div>
                  
                  {note.tags.length > 0 && (
                    <div className="flex items-center space-x-1">
                      <Tag className="w-3 h-3" />
                      <span>{note.tags.length}</span>
                    </div>
                  )}
                </div>
                
                {note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {note.tags.slice(0, 3).map(tag => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                    {note.tags.length > 3 && (
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                        +{note.tags.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 右侧编辑器 */}
      <div className="flex-1 flex flex-col">
        {selectedNote ? (
          <>
            {/* 编辑器头部 */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <input
                  type="text"
                  value={selectedNote.title}
                  onChange={(e) => updateNote(selectedNote.id, { title: e.target.value })}
                  className="text-2xl font-semibold bg-transparent border-none outline-none text-gray-900 placeholder-gray-400 flex-1 mr-4"
                  placeholder="笔记标题..."
                />
                
                <div className="flex items-center space-x-2">
                  {isSaving && (
                    <div className="flex items-center space-x-2 text-sm text-gray-500">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span>保存中...</span>
                    </div>
                  )}
                  
                  <button
                    type="button"
                    onClick={() => toggleFavorite(selectedNote.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      selectedNote.isFavorite
                        ? 'text-yellow-500 hover:bg-yellow-50'
                        : 'text-gray-400 hover:bg-gray-100'
                    }`}
                    title={selectedNote.isFavorite ? '取消收藏' : '添加收藏'}
                  >
                    <Star className={`w-5 h-5 ${selectedNote.isFavorite ? 'fill-current' : ''}`} />
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => toggleArchive(selectedNote.id)}
                    className={`p-2 rounded-lg transition-colors ${
                      selectedNote.isArchived
                        ? 'text-blue-500 hover:bg-blue-50'
                        : 'text-gray-400 hover:bg-gray-100'
                    }`}
                    title={selectedNote.isArchived ? '取消归档' : '归档笔记'}
                  >
                    <Archive className="w-5 h-5" />
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => deleteNote(selectedNote.id)}
                    className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    title="删除笔记"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>最后更新: {selectedNote.updatedAt.toLocaleString('zh-CN')}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Edit3 className="w-4 h-4" />
                      <span>{selectedNote.wordCount} 字</span>
                    </div>
                  </div>
                </div>

                {/* 标签管理 */}
                <div>
                  <TagManager
                    tags={selectedNote.tags}
                    allTags={allTags}
                    onChange={(newTags) => updateNote(selectedNote.id, { tags: newTags })}
                    onCreateTag={(tagName) => {
                      // 这里可以添加创建新标签的逻辑
                      console.log('创建新标签:', tagName)
                    }}
                    placeholder="添加标签..."
                    maxTags={10}
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Markdown编辑器 */}
            <div className="flex-1 p-6">
              <MarkdownEditor
                value={selectedNote.content}
                onChange={(content) => {
                  const excerpt = content.slice(0, 150).replace(/\n/g, ' ')
                  updateNote(selectedNote.id, {
                    content,
                    excerpt,
                    wordCount: content.length
                  })
                }}
                placeholder="开始记录您的想法..."
                className="h-full border-none"
                autoSave={true}
                onSave={() => {
                  // 手动保存逻辑（如果需要）
                }}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                <Edit3 className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">选择一个笔记开始编辑</h3>
              <p className="text-gray-500 mb-6">从左侧列表中选择笔记，或创建一个新笔记</p>
              <button
                type="button"
                onClick={createNote}
                className="macos-button macos-button-primary flex items-center space-x-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                <span>新建笔记</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 快捷键支持 */}
      <NotesShortcuts
        onNewNote={createNote}
        onSaveNote={handleSaveNote}
        onDeleteNote={handleDeleteNote}
        onToggleFavorite={handleToggleFavorite}
        onToggleArchive={handleToggleArchive}
        onFocusSearch={handleFocusSearch}
        onNextNote={handleNextNote}
        onPrevNote={handlePrevNote}
        enabled={true}
      />

      {/* 快捷键帮助对话框 */}
      <ShortcutsHelp
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
      />
    </div>
  )
}

export default NotesPage
