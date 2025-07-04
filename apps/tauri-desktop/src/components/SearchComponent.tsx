import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, X, FileText, Hash, Calendar, Clock, ArrowRight, Settings, HelpCircle } from 'lucide-react'
import { SearchEngine } from '@minglog/search'
import {
  BlockSearchRequest,
  BlockSearchResponse,
  BlockSearchResult,
  searchBlocks,
  withErrorHandling
} from '../utils/tauri'
import { useNotifications } from './NotificationSystem'
import VirtualizedSearchResults from './VirtualizedSearchResults'

interface SearchComponentProps {
  isOpen: boolean
  onClose: () => void
  initialQuery?: string
  pageId?: string // If provided, search within this page only
}

const SearchComponent: React.FC<SearchComponentProps> = ({
  isOpen,
  onClose,
  initialQuery = '',
  pageId
}) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { error } = useNotifications()
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<BlockSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [searchOptions, setSearchOptions] = useState({
    includePages: true,
    includeBlocks: true,
    limit: 20
  })
  const [showPreferences, setShowPreferences] = useState(false)
  const [showHelpGuide, setShowHelpGuide] = useState(false)
  const [tempPreferences, setTempPreferences] = useState({
    includePages: true,
    includeBlocks: true,
    debounceDelay: 300,
    resultsPerPage: 20
  })

  // Simple cache for search results
  const searchCache = useRef<Map<string, BlockSearchResult[]>>(new Map())

  // Check for first-time user and show guide automatically
  useEffect(() => {
    if (isOpen) {
      const seenGuides = localStorage.getItem('minglog_seen_guides')
      try {
        const parsedGuides = seenGuides ? JSON.parse(seenGuides) : {}
        if (!parsedGuides.search) {
          setShowHelpGuide(true)
        }
      } catch {
        // If parsing fails, treat as first-time user
        setShowHelpGuide(true)
      }
    }
  }, [isOpen])
  
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
      setQuery(initialQuery)
    }
  }, [isOpen, initialQuery])

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const timeoutId = setTimeout(() => {
      performSearch(query)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query, searchOptions, pageId])

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    // Create cache key
    const cacheKey = `${searchQuery}-${pageId}-${searchOptions.includePages}-${searchOptions.includeBlocks}-${searchOptions.limit}`

    // Check cache first
    const cachedResults = searchCache.current.get(cacheKey)
    if (cachedResults) {
      setResults(cachedResults)
      setSelectedIndex(0)
      return
    }

    setIsLoading(true)

    const request: BlockSearchRequest = {
      query: searchQuery,
      page_id: pageId,
      include_pages: searchOptions.includePages,
      include_blocks: searchOptions.includeBlocks,
      limit: searchOptions.limit
    }

    const response = await withErrorHandling(
      () => searchBlocks(request),
      'Failed to perform search'
    )

    if (response) {
      // Cache the results
      searchCache.current.set(cacheKey, response.results)
      setResults(response.results)
      setSelectedIndex(0)
    } else {
      setResults([])
    }

    setIsLoading(false)
  }, [searchOptions, pageId])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        onClose()
        break
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (results[selectedIndex]) {
          handleResultClick(results[selectedIndex])
        }
        break
    }
  }, [results, selectedIndex, onClose])

  const handleResultClick = useCallback((result: BlockSearchResult) => {
    if (result.result_type === 'page') {
      navigate(`/page/${result.id}`)
    } else if (result.result_type === 'block' && result.page_id) {
      navigate(`/page/${result.page_id}#${result.id}`)
    }
    onClose()
  }, [navigate, onClose])

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString()
  }

  const highlightText = useCallback((text: string, query: string) => {
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
  }, [])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-20">
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[70vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="search-title"
        aria-describedby="search-description"
      >
        {/* Hidden titles for ARIA */}
        <h1 id="search-title" className="sr-only">{t('search.title')}</h1>
        <p id="search-description" className="sr-only">{t('search.placeholder')}</p>

        {/* Search Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              role="combobox"
              aria-expanded={results.length > 0 ? 'true' : 'false'}
              aria-haspopup="listbox"
              aria-autocomplete="list"
              aria-controls="search-results-listbox"
              aria-label={t('search.placeholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('search.placeholder')}
              className="flex-1 bg-transparent border-none outline-none text-base sm:text-lg placeholder-gray-400"
            />
            {isLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            )}
            <button
              type="button"
              onClick={() => setShowHelpGuide(true)}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 rounded"
              aria-label="Show help guide"
              title="Help (F1)"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setShowPreferences(true)}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 rounded"
              aria-label="Open preferences"
              title="Settings (Ctrl+,)"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 text-gray-400 hover:text-gray-600 rounded"
              aria-label="Close search"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {/* Search Options */}
          <div className="flex items-center space-x-4 mt-3 text-sm">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={searchOptions.includePages}
                onChange={(e) => setSearchOptions(prev => ({ ...prev, includePages: e.target.checked }))}
                className="rounded"
              />
              <span className="text-gray-600 dark:text-gray-300">{t('page.pages')}</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={searchOptions.includeBlocks}
                onChange={(e) => setSearchOptions(prev => ({ ...prev, includeBlocks: e.target.checked }))}
                className="rounded"
              />
              <span className="text-gray-600 dark:text-gray-300">{t('block.blocks')}</span>
            </label>
            {pageId && (
              <span className="text-blue-600 dark:text-blue-400 text-xs">
                Searching in current page
              </span>
            )}
          </div>
        </div>

        {/* Search Results */}
        <div
          ref={resultsRef}
          className="flex-1 overflow-y-auto"
          role="listbox"
          id="search-results-listbox"
          aria-label={t('search.searchResults')}
        >
          {query.trim() && !isLoading && results.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>{t('search.noResults')}</p>
              <p className="text-sm mt-2">{t('search.searchError')}</p>
            </div>
          )}

          <VirtualizedSearchResults
            results={results}
            selectedIndex={selectedIndex}
            query={query}
            onResultClick={(result, index) => {
              setSelectedIndex(index)
              handleResultClick(result)
            }}
            highlightText={highlightText}
            formatDate={formatDate}
          />
        </div>

        {/* Footer */}
        {results.length > 0 && (
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 text-center">
            {t('search.resultCount', { count: results.length })} • {t('search.pressEscToClose')}
          </div>
        )}
      </div>

      {/* Preferences Dialog */}
      {showPreferences && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">User Preferences</h2>
              <div className="space-y-4">
                <div>
                  <label htmlFor="debounce-delay" className="block text-sm font-medium mb-2">Search Debounce Delay (ms)</label>
                  <input
                    id="debounce-delay"
                    type="number"
                    min="100"
                    max="2000"
                    defaultValue="300"
                    className="w-full p-2 border rounded text-base sm:text-lg"
                    aria-label="Search debounce delay in milliseconds"
                  />
                </div>
                <div>
                  <label htmlFor="results-per-page" className="block text-sm font-medium mb-2">Results per page</label>
                  <select id="results-per-page" className="w-full p-2 border rounded" aria-label="Number of results per page">
                    <option value="10">10</option>
                    <option value="20">20</option>
                    <option value="50">50</option>
                  </select>
                </div>
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={tempPreferences.includePages}
                      onChange={(e) => setTempPreferences(prev => ({ ...prev, includePages: e.target.checked }))}
                      className="rounded"
                      aria-label="Include pages by default"
                    />
                    <span className="text-sm">Include pages by default</span>
                  </label>
                </div>
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={tempPreferences.includeBlocks}
                      onChange={(e) => setTempPreferences(prev => ({ ...prev, includeBlocks: e.target.checked }))}
                      className="rounded"
                      aria-label="Include blocks by default"
                    />
                    <span className="text-sm">Include blocks by default</span>
                  </label>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowPreferences(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Save preferences to localStorage
                    const savedPrefs = localStorage.getItem('minglog_user_preferences')
                    const currentPrefs = savedPrefs ? JSON.parse(savedPrefs) : {}
                    const updatedPrefs = {
                      ...currentPrefs,
                      search: {
                        ...currentPrefs.search,
                        defaultIncludePages: tempPreferences.includePages,
                        defaultIncludeBlocks: tempPreferences.includeBlocks,
                        debounceDelay: tempPreferences.debounceDelay,
                        resultsPerPage: tempPreferences.resultsPerPage
                      }
                    }
                    localStorage.setItem('minglog_user_preferences', JSON.stringify(updatedPrefs))
                    setShowPreferences(false)
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Guide Dialog */}
      {showHelpGuide && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Quick Guide</h2>
              <div className="space-y-3">
                <h3 className="text-lg font-medium">Welcome to Smart Search</h3>
                <ul className="space-y-2 text-sm">
                  <li>• Use Ctrl+K to open search anywhere</li>
                  <li>• Press ESC to close search</li>
                  <li>• Use arrow keys to navigate results</li>
                  <li>• Press Enter to open selected result</li>
                </ul>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  type="button"
                  onClick={() => {
                    const seenGuides = localStorage.getItem('minglog_seen_guides')
                    try {
                      const parsedGuides = seenGuides ? JSON.parse(seenGuides) : {}
                      parsedGuides.search = true
                      localStorage.setItem('minglog_seen_guides', JSON.stringify(parsedGuides))
                    } catch {
                      localStorage.setItem('minglog_seen_guides', JSON.stringify({ search: true }))
                    }
                    setShowHelpGuide(false)
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Got it
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default React.memo(SearchComponent)
