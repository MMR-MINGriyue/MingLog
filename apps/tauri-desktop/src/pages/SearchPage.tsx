import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter, Calendar, Tag, FileText, Star, Clock } from 'lucide-react'
import { searchNotes, SearchRequest, SearchResult, withErrorHandling } from '../utils/tauri'
import { useTags } from '../hooks/useTags'
import { useNotifications } from '../components/NotificationSystem'

const SearchPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [dateRange, setDateRange] = useState('any')
  const [contentType, setContentType] = useState('all')
  const [includeArchived, setIncludeArchived] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  const { tags } = useTags()
  const { error } = useNotifications()

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('minglog-recent-searches')
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved))
      } catch {
        // Ignore invalid JSON
      }
    }
  }, [])

  // Save recent searches to localStorage
  const saveRecentSearch = useCallback((query: string) => {
    if (!query.trim()) return

    const updated = [query, ...recentSearches.filter(q => q !== query)].slice(0, 10)
    setRecentSearches(updated)
    localStorage.setItem('minglog-recent-searches', JSON.stringify(updated))
  }, [recentSearches])

  // Perform search
  const performSearch = useCallback(async (query: string = searchQuery) => {
    if (!query.trim()) {
      setSearchResults(null)
      return
    }

    setIsSearching(true)

    const searchRequest: SearchRequest = {
      query: query.trim(),
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      include_archived: includeArchived,
      limit: 50,
      offset: 0
    }

    // Add date range filter
    if (dateRange !== 'any') {
      const now = new Date()
      let dateFrom: Date | undefined

      switch (dateRange) {
        case 'week':
          dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'month':
          dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case 'quarter':
          dateFrom = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
        case 'year':
          dateFrom = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
          break
      }

      if (dateFrom) {
        searchRequest.date_from = dateFrom.toISOString()
      }
    }

    const result = await withErrorHandling(
      () => searchNotes(searchRequest),
      'Search failed'
    )

    if (result) {
      setSearchResults(result)
      saveRecentSearch(query)
    } else {
      error('Search Failed', 'Unable to perform search. Please try again.')
    }

    setIsSearching(false)
  }, [searchQuery, selectedTags, dateRange, includeArchived, saveRecentSearch, error])

  // Handle search input
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    performSearch()
  }

  // Toggle tag filter
  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    )
  }

  // Clear all filters
  const clearFilters = () => {
    setSelectedTags([])
    setDateRange('any')
    setContentType('all')
    setIncludeArchived(false)
  }

  // Highlight search terms in text
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-yellow-900 px-1 rounded">
          {part}
        </mark>
      ) : part
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Search Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Search</h2>
          
          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search your notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded ${
                showFilters ? 'text-primary-600 bg-primary-100' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Filter className="w-5 h-5" />
            </button>
          </form>

          {/* Filters */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-700">Search Filters</h3>
                <button
                  onClick={clearFilters}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Clear All
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date Range
                  </label>
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="w-full input"
                  >
                    <option value="any">Any time</option>
                    <option value="week">Last 7 days</option>
                    <option value="month">Last 30 days</option>
                    <option value="quarter">Last 3 months</option>
                    <option value="year">Last year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content Type
                  </label>
                  <select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value)}
                    className="w-full input"
                  >
                    <option value="all">All content</option>
                    <option value="text">Text only</option>
                    <option value="images">With images</option>
                    <option value="code">With code</option>
                    <option value="links">With links</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Options
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={includeArchived}
                      onChange={(e) => setIncludeArchived(e.target.checked)}
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Include archived</span>
                  </label>
                </div>
              </div>

              {/* Tag Filters */}
              {tags.length > 0 && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Tags
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <button
                        key={tag.id}
                        onClick={() => toggleTag(tag.id)}
                        className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                          selectedTags.includes(tag.id)
                            ? 'bg-primary-100 border-primary-300 text-primary-700'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Tag className="w-3 h-3 inline mr-1" />
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Search Results */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-6">
          {searchQuery || searchResults ? (
            <div>
              {/* Search Status */}
              <div className="mb-6 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {isSearching ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                      Searching for "{searchQuery}"...
                    </div>
                  ) : searchResults ? (
                    <div>
                      Found {searchResults.total} result{searchResults.total !== 1 ? 's' : ''} for "{searchQuery}"
                      {selectedTags.length > 0 && (
                        <span className="ml-2">
                          with tags: {selectedTags.map(tagId =>
                            tags.find(t => t.id === tagId)?.name
                          ).filter(Boolean).join(', ')}
                        </span>
                      )}
                    </div>
                  ) : null}
                </div>

                {searchResults && searchResults.notes.length > 0 && (
                  <div className="text-sm text-gray-500">
                    {searchResults.has_more && 'Showing first 50 results'}
                  </div>
                )}
              </div>

              {/* Search Results */}
              {searchResults && searchResults.notes.length > 0 ? (
                <div className="space-y-4">
                  {searchResults.notes.map(note => (
                    <div key={note.id} className="card hover:shadow-medium transition-shadow">
                      <div className="card-body">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="text-lg font-semibold text-gray-900 truncate">
                                {highlightText(note.title || 'Untitled', searchQuery)}
                              </h3>
                              {note.is_favorite && (
                                <Star className="w-4 h-4 text-yellow-500 fill-current flex-shrink-0" />
                              )}
                              {note.is_archived && (
                                <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                                  Archived
                                </span>
                              )}
                            </div>

                            {note.content && (
                              <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                                {highlightText(
                                  note.content.length > 200
                                    ? note.content.substring(0, 200) + '...'
                                    : note.content,
                                  searchQuery
                                )}
                              </p>
                            )}

                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <div className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {new Date(note.updated_at).toLocaleDateString()}
                              </div>
                              {note.tags && note.tags.length > 0 && (
                                <div className="flex items-center">
                                  <Tag className="w-3 h-3 mr-1" />
                                  {note.tags.length} tag{note.tags.length !== 1 ? 's' : ''}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 ml-4">
                            <Link
                              to={`/editor/${note.id}`}
                              className="btn-secondary text-sm"
                            >
                              Edit
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {searchResults.has_more && (
                    <div className="text-center py-4">
                      <button
                        onClick={() => {/* TODO: Load more results */}}
                        className="btn-secondary"
                      >
                        Load More Results
                      </button>
                    </div>
                  )}
                </div>
              ) : searchResults && !isSearching ? (
                <div className="text-center py-12">
                  <Search className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No results found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Try adjusting your search terms or filters
                  </p>
                  <button
                    onClick={clearFilters}
                    className="btn-secondary"
                  >
                    Clear Filters
                  </button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Search Tips */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">Search Tips</h3>
                </div>
                <div className="card-body">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Basic Search</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Type keywords to find matching notes</li>
                        <li>• Use quotes for exact phrases: "machine learning"</li>
                        <li>• Search is case-insensitive</li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Advanced Search</h4>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Use filters to narrow results</li>
                        <li>• Search by tags: #productivity</li>
                        <li>• Filter by date ranges</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Searches */}
              <div className="card">
                <div className="card-header">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Searches</h3>
                    {recentSearches.length > 0 && (
                      <button
                        onClick={() => {
                          setRecentSearches([])
                          localStorage.removeItem('minglog-recent-searches')
                        }}
                        className="text-sm text-gray-500 hover:text-gray-700"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
                <div className="card-body">
                  {recentSearches.length > 0 ? (
                    <div className="space-y-2">
                      {recentSearches.map((query, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setSearchQuery(query)
                            performSearch(query)
                          }}
                          className="w-full text-left p-2 rounded hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 text-gray-400 mr-2" />
                            <span className="text-sm text-gray-700">{query}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-600 text-sm">
                        Your recent searches will appear here
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Popular Tags */}
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">Popular Tags</h3>
                </div>
                <div className="card-body">
                  <div className="text-center py-8">
                    <Tag className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-600 text-sm">
                      Start tagging your notes to see popular tags here
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SearchPage
