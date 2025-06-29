import React, { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Filter, Calendar, Tag, FileText, Star, Clock, Hash, ArrowRight } from 'lucide-react'
import {
  searchBlocks,
  BlockSearchRequest,
  BlockSearchResponse,
  BlockSearchResult,
  withErrorHandling
} from '../utils/tauri'
import { useTags } from '../hooks/useTags'
import { useNotifications } from '../components/NotificationSystem'
import SearchComponent from '../components/SearchComponent'

const SearchPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [searchResults, setSearchResults] = useState<BlockSearchResponse | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [includePages, setIncludePages] = useState(true)
  const [includeBlocks, setIncludeBlocks] = useState(true)
  const [isJournalFilter, setIsJournalFilter] = useState<boolean | undefined>(undefined)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [showQuickSearch, setShowQuickSearch] = useState(false)

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

    const request: BlockSearchRequest = {
      query,
      include_pages: includePages,
      include_blocks: includeBlocks,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      is_journal: isJournalFilter,
      limit: 50
    }

    const result = await withErrorHandling(
      () => searchBlocks(request),
      'Search failed'
    )

    if (result) {
      setSearchResults(result)
      saveRecentSearch(query)
    } else {
      error('Search Failed', 'Unable to perform search. Please try again.')
    }

    setIsSearching(false)
  }, [searchQuery, selectedTags, includePages, includeBlocks, isJournalFilter, saveRecentSearch, error])

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

  // Handle result click
  const handleResultClick = (result: BlockSearchResult) => {
    if (result.result_type === 'page') {
      navigate(`/blocks/${result.id}`)
    } else if (result.result_type === 'block' && result.page_id) {
      navigate(`/blocks/${result.page_id}#${result.id}`)
    }
  }

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  // Highlight search terms
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">
          {part}
        </mark>
      ) : part
    )
  }

  // Clear all filters
  const clearFilters = () => {
    setSelectedTags([])
    setIncludePages(true)
    setIncludeBlocks(true)
    setIsJournalFilter(undefined)
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
                    Search In
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={includePages}
                        onChange={(e) => setIncludePages(e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Pages</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={includeBlocks}
                        onChange={(e) => setIncludeBlocks(e.target.checked)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Blocks</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content Type
                  </label>
                  <select
                    value={isJournalFilter === undefined ? 'all' : isJournalFilter ? 'journal' : 'regular'}
                    onChange={(e) => {
                      const value = e.target.value
                      setIsJournalFilter(value === 'all' ? undefined : value === 'journal')
                    }}
                    className="w-full input"
                  >
                    <option value="all">All content</option>
                    <option value="journal">Journal entries</option>
                    <option value="regular">Regular pages</option>
                  </select>
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
                          with tags: {selectedTags.join(', ')}
                        </span>
                      )}
                    </div>
                  ) : null}
                </div>

                {searchResults && searchResults.results.length > 0 && (
                  <div className="text-sm text-gray-500">
                    Showing {searchResults.results.length} of {searchResults.total} results
                  </div>
                )}
              </div>

              {/* Search Results */}
              {searchResults && searchResults.results.length > 0 ? (
                <div className="space-y-4">
                  {searchResults.results.map(result => (
                    <div
                      key={result.id}
                      className="card hover:shadow-medium transition-shadow cursor-pointer"
                      onClick={() => handleResultClick(result)}
                    >
                      <div className="card-body">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              {result.result_type === 'page' ? (
                                <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                              ) : (
                                <Hash className="w-4 h-4 text-green-500 flex-shrink-0" />
                              )}
                              <h3 className="text-lg font-semibold text-gray-900 truncate">
                                {highlightText(result.title, searchQuery)}
                              </h3>
                              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                                {result.result_type}
                              </span>
                              {result.is_journal && (
                                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-600">
                                  Journal
                                </span>
                              )}
                            </div>

                            <p className="text-gray-600 text-sm mb-3 line-clamp-3">
                              {highlightText(result.excerpt, searchQuery)}
                            </p>

                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <div className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                {formatDate(result.updated_at)}
                              </div>

                              {result.page_name && result.result_type === 'block' && (
                                <div className="flex items-center">
                                  <FileText className="w-3 h-3 mr-1" />
                                  {result.page_name}
                                </div>
                              )}

                              {result.tags.length > 0 && (
                                <div className="flex items-center">
                                  <Tag className="w-3 h-3 mr-1" />
                                  {result.tags.slice(0, 2).join(', ')}
                                  {result.tags.length > 2 && ` +${result.tags.length - 2}`}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 ml-4">
                            <div className="text-xs text-gray-400">
                              {Math.round(result.score * 100)}%
                            </div>
                            <ArrowRight className="w-4 h-4 text-gray-400" />
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
