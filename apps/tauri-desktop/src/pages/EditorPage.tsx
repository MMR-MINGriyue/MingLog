import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Save, FileText, Settings, Plus, Tag, Star, Archive, Trash2 } from 'lucide-react'
import { useNotes } from '../hooks/useNotes'
import { useTags } from '../hooks/useTags'
import { useNotifications } from '../components/NotificationSystem'
import { Note } from '../utils/tauri'

const EditorPage: React.FC = () => {
  const { pageId } = useParams<{ pageId?: string }>()
  const navigate = useNavigate()
  const { createNewNote, updateExistingNote, deleteExistingNote } = useNotes()
  const { tags, createNewTag } = useTags()
  const { success, error } = useNotifications()

  const [note, setNote] = useState<Note | null>(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [isFavorite, setIsFavorite] = useState(false)
  const [isArchived, setIsArchived] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [showTagInput, setShowTagInput] = useState(false)

  // Load existing note if pageId is provided
  useEffect(() => {
    if (pageId && pageId !== 'new') {
      // In a real app, you'd load the note by ID
      // For now, we'll create a placeholder
      setNote({
        id: pageId,
        title: 'Sample Note',
        content: 'This is a sample note content...',
        tags: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_favorite: false,
        is_archived: false
      })
      setTitle('Sample Note')
      setContent('This is a sample note content...')
    }
  }, [pageId])

  // Track unsaved changes
  useEffect(() => {
    if (note) {
      const hasChanges =
        title !== note.title ||
        content !== note.content ||
        isFavorite !== note.is_favorite ||
        isArchived !== note.is_archived ||
        JSON.stringify(selectedTags) !== JSON.stringify(note.tags || [])

      setHasUnsavedChanges(hasChanges)
    } else {
      setHasUnsavedChanges(title.trim() !== '' || content.trim() !== '')
    }
  }, [note, title, content, selectedTags, isFavorite, isArchived])

  const handleSave = async () => {
    if (!title.trim()) {
      error('Title Required', 'Please enter a title for your note')
      return
    }

    setIsLoading(true)

    try {
      if (note) {
        // Update existing note
        const result = await updateExistingNote({
          id: note.id,
          title: title.trim(),
          content: content.trim(),
          tags: selectedTags,
          is_favorite: isFavorite,
          is_archived: isArchived
        })

        if (result) {
          setNote(result)
          setHasUnsavedChanges(false)
          success('Note Updated', 'Your note has been saved successfully')
        }
      } else {
        // Create new note
        const result = await createNewNote({
          title: title.trim(),
          content: content.trim(),
          tags: selectedTags
        })

        if (result) {
          setNote(result)
          setHasUnsavedChanges(false)
          success('Note Created', 'Your new note has been created')
          navigate(`/editor/${result.id}`, { replace: true })
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!note) return

    if (window.confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      setIsLoading(true)

      const result = await deleteExistingNote(note.id)

      if (result) {
        success('Note Deleted', 'The note has been deleted')
        navigate('/')
      }

      setIsLoading(false)
    }
  }

  const handleAddTag = async () => {
    if (!newTagName.trim()) return

    const result = await createNewTag({
      name: newTagName.trim(),
      color: '#3B82F6' // Default blue color
    })

    if (result) {
      setSelectedTags(prev => [...prev, result.id])
      setNewTagName('')
      setShowTagInput(false)
      success('Tag Created', `Tag "${result.name}" has been created`)
    }
  }

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Editor Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {note ? 'Edit Note' : 'New Note'}
            </h2>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <FileText className="w-4 h-4" />
              <span>{title || 'Untitled Note'}</span>
              {hasUnsavedChanges && (
                <span className="text-orange-500">• Unsaved</span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {note && (
              <>
                <button
                  onClick={() => setIsFavorite(!isFavorite)}
                  className={`btn-ghost ${isFavorite ? 'text-yellow-500' : ''}`}
                  title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                </button>
                <button
                  onClick={() => setIsArchived(!isArchived)}
                  className={`btn-ghost ${isArchived ? 'text-gray-600' : ''}`}
                  title={isArchived ? 'Unarchive' : 'Archive'}
                >
                  <Archive className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDelete}
                  className="btn-ghost text-red-600 hover:text-red-700"
                  title="Delete note"
                  disabled={isLoading}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
            <button className="btn-ghost">
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading || !hasUnsavedChanges}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 bg-gray-50 overflow-hidden">
        <div className="h-full max-w-6xl mx-auto p-6 flex gap-6">
          {/* Main Editor */}
          <div className="flex-1 bg-white rounded-lg shadow-soft border border-gray-200 flex flex-col">
            {/* Title Input */}
            <div className="p-6 border-b border-gray-200">
              <input
                type="text"
                placeholder="Note title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-2xl font-bold text-gray-900 placeholder-gray-400 border-none outline-none resize-none"
              />
            </div>

            {/* Content Editor */}
            <div className="flex-1 p-6">
              <textarea
                placeholder="Start writing your note..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-full text-gray-700 placeholder-gray-400 border-none outline-none resize-none font-mono text-sm leading-relaxed"
                style={{ minHeight: '400px' }}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-80 space-y-6">
            {/* Tags Section */}
            <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Tags</h3>
                <button
                  onClick={() => setShowTagInput(!showTagInput)}
                  className="btn-ghost p-1"
                  title="Add new tag"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* New Tag Input */}
              {showTagInput && (
                <div className="mb-4 flex gap-2">
                  <input
                    type="text"
                    placeholder="Tag name..."
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                    className="flex-1 input text-sm"
                  />
                  <button
                    onClick={handleAddTag}
                    disabled={!newTagName.trim()}
                    className="btn-primary text-sm px-3 py-1"
                  >
                    Add
                  </button>
                </div>
              )}

              {/* Tag List */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {tags.map(tag => (
                  <label
                    key={tag.id}
                    className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTags.includes(tag.id)}
                      onChange={() => toggleTag(tag.id)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <Tag className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-700">{tag.name}</span>
                  </label>
                ))}
                {tags.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No tags yet. Create your first tag!
                  </p>
                )}
              </div>
            </div>

            {/* Note Info */}
            {note && (
              <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Note Info</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-500">Created:</span>
                    <span className="ml-2 text-gray-700">
                      {new Date(note.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Modified:</span>
                    <span className="ml-2 text-gray-700">
                      {new Date(note.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Words:</span>
                    <span className="ml-2 text-gray-700">
                      {content.trim().split(/\s+/).filter(word => word.length > 0).length}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Characters:</span>
                    <span className="ml-2 text-gray-700">
                      {content.length}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-soft border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full btn-ghost justify-start text-sm">
                  <FileText className="w-4 h-4 mr-2" />
                  Export as Markdown
                </button>
                <button className="w-full btn-ghost justify-start text-sm">
                  <FileText className="w-4 h-4 mr-2" />
                  Export as PDF
                </button>
                <button className="w-full btn-ghost justify-start text-sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Duplicate Note
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EditorPage
