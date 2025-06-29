import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Edit3,
  Network,
  Search,
  Plus,
  BookOpen,
  TrendingUp,
  Clock,
  Star
} from 'lucide-react'
import { getNotes, getTags, getAppInfo, withErrorHandling, Note, Tag, AppInfo } from '../utils/tauri'

const HomePage: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [appInfo, setAppInfo] = useState<AppInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalNotes: 0,
    thisWeek: 0,
    recent: 0,
    favorites: 0
  })

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)

      // Load app info
      const info = await withErrorHandling(() => getAppInfo(), 'Failed to load app info')
      if (info) setAppInfo(info)

      // Load notes
      const notesData = await withErrorHandling(() => getNotes(10, 0), 'Failed to load notes')
      if (notesData) {
        setNotes(notesData)

        // Calculate stats
        const now = new Date()
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

        setStats({
          totalNotes: notesData.length,
          thisWeek: notesData.filter(note => new Date(note.created_at) > weekAgo).length,
          recent: notesData.slice(0, 5).length,
          favorites: notesData.filter(note => note.is_favorite).length
        })
      }

      // Load tags
      const tagsData = await withErrorHandling(() => getTags(), 'Failed to load tags')
      if (tagsData) setTags(tagsData)

      setLoading(false)
    }

    loadData()
  }, [])

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your workspace...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-6xl mx-auto p-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to {appInfo?.name || 'MingLog Desktop'}
          </h1>
          <p className="text-lg text-gray-600">
            Your personal knowledge management workspace
          </p>
          {appInfo && (
            <p className="text-sm text-gray-500 mt-2">
              Version {appInfo.version} • {appInfo.description}
            </p>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Link
            to="/editor"
            className="card hover:shadow-medium transition-shadow group"
          >
            <div className="card-body text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                <Plus className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Create New Note
              </h3>
              <p className="text-gray-600 text-sm">
                Start writing your thoughts and ideas
              </p>
            </div>
          </Link>

          <Link
            to="/search"
            className="card hover:shadow-medium transition-shadow group"
          >
            <div className="card-body text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-success-100 rounded-lg flex items-center justify-center group-hover:bg-success-200 transition-colors">
                <Search className="w-6 h-6 text-success-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Search Notes
              </h3>
              <p className="text-gray-600 text-sm">
                Find what you're looking for quickly
              </p>
            </div>
          </Link>

          <Link
            to="/graph"
            className="card hover:shadow-medium transition-shadow group"
          >
            <div className="card-body text-center">
              <div className="w-12 h-12 mx-auto mb-4 bg-warning-100 rounded-lg flex items-center justify-center group-hover:bg-warning-200 transition-colors">
                <Network className="w-6 h-6 text-warning-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Knowledge Graph
              </h3>
              <p className="text-gray-600 text-sm">
                Visualize connections between ideas
              </p>
            </div>
          </Link>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Notes</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalNotes}</p>
                </div>
                <BookOpen className="w-8 h-8 text-primary-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">This Week</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.thisWeek}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-success-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Recent</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.recent}</p>
                </div>
                <Clock className="w-8 h-8 text-warning-600" />
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Favorites</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.favorites}</p>
                </div>
                <Star className="w-8 h-8 text-error-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Notes */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900">Recent Notes</h2>
          </div>
          <div className="card-body">
            {notes.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No notes yet
                </h3>
                <p className="text-gray-600 mb-4">
                  Start by creating your first note to see it here
                </p>
                <Link to="/editor" className="btn-primary">
                  Create First Note
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {notes.slice(0, 5).map((note) => (
                  <div key={note.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {note.title || 'Untitled'}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(note.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {note.is_favorite && (
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      )}
                      <Link
                        to={`/editor/${note.id}`}
                        className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                      >
                        Edit
                      </Link>
                    </div>
                  </div>
                ))}
                {notes.length > 5 && (
                  <div className="text-center pt-4">
                    <Link to="/search" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                      View all {notes.length} notes →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Getting Started */}
        <div className="mt-8 card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900">Getting Started</h2>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  📝 Writing Notes
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Use the powerful editor to write and format your notes with rich text, 
                  code blocks, and more.
                </p>
                <Link to="/editor" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                  Start Writing →
                </Link>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  🔍 Finding Information
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Use the search feature to quickly find any note or piece of information 
                  across your entire knowledge base.
                </p>
                <Link to="/search" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                  Try Search →
                </Link>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  🕸️ Knowledge Graph
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Visualize the connections between your notes and discover new 
                  relationships in your knowledge.
                </p>
                <Link to="/graph" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                  Explore Graph →
                </Link>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  ⚙️ Customization
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Customize your workspace, manage your data, and configure 
                  settings to match your workflow.
                </p>
                <Link to="/settings" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                  Open Settings →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HomePage
