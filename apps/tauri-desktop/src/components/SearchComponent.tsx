import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Search, X, FileText, Hash, Calendar, Clock, ArrowRight } from 'lucide-react'
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
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[70vh] flex flex-col">
        {/* Search Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Search className="w-5 h-5 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={pageId ? t('search.placeholder') : t('search.placeholder')}
              className="flex-1 bg-transparent border-none outline-none text-lg placeholder-gray-400"
            />
            {isLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            )}
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
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
        <div ref={resultsRef} className="flex-1 overflow-y-auto">
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
    </div>
  )
}

export default React.memo(SearchComponent)
