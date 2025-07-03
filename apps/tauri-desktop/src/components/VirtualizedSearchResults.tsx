import React, { useMemo, useCallback, useRef, useEffect, useState } from 'react'
import { FileText, Hash, Calendar, Clock } from 'lucide-react'

interface SearchResult {
  id: string
  result_type: string
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

interface VirtualizedSearchResultsProps {
  results: SearchResult[]
  selectedIndex: number
  query: string
  onResultClick: (result: SearchResult, index: number) => void
  highlightText: (text: string, query: string) => React.ReactNode
  formatDate: (timestamp: number) => string
}

const ITEM_HEIGHT = 80 // Height of each search result item
const CONTAINER_HEIGHT = 400 // Max height of the results container
const BUFFER_SIZE = 5 // Number of items to render outside visible area

const VirtualizedSearchResults: React.FC<VirtualizedSearchResultsProps> = ({
  results,
  selectedIndex,
  query,
  onResultClick,
  highlightText,
  formatDate,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const visibleCount = Math.ceil(CONTAINER_HEIGHT / ITEM_HEIGHT)
    const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_SIZE)
    const endIndex = Math.min(results.length, startIndex + visibleCount + BUFFER_SIZE * 2)
    
    return { startIndex, endIndex, visibleCount }
  }, [scrollTop, results.length])

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  // Scroll to selected item
  useEffect(() => {
    if (containerRef.current && selectedIndex >= 0) {
      const itemTop = selectedIndex * ITEM_HEIGHT
      const itemBottom = itemTop + ITEM_HEIGHT
      const containerTop = scrollTop
      const containerBottom = scrollTop + CONTAINER_HEIGHT

      if (itemTop < containerTop) {
        containerRef.current.scrollTop = itemTop
      } else if (itemBottom > containerBottom) {
        containerRef.current.scrollTop = itemBottom - CONTAINER_HEIGHT
      }
    }
  }, [selectedIndex, scrollTop])

  // Render visible items
  const visibleItems = useMemo(() => {
    const items = []
    const { startIndex, endIndex } = visibleRange

    for (let i = startIndex; i < endIndex; i++) {
      const result = results[i]
      if (!result) continue

      const isSelected = i === selectedIndex
      const isPage = result.result_type === 'page'

      items.push(
        <div
          key={result.id}
          data-testid={`search-result-${i}`}
          data-result-id={result.id}
          className={`
            absolute left-0 right-0 px-4 py-3 cursor-pointer border-b border-gray-100 dark:border-gray-700
            transition-colors duration-150
            ${isSelected
              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
              : 'hover:bg-gray-50 dark:hover:bg-gray-800'
            }
          `}
          style={{
            top: i * ITEM_HEIGHT,
            height: ITEM_HEIGHT,
          }}
          onClick={() => onResultClick(result, i)}
        >
          <div className="flex items-start space-x-3 h-full">
            <div className="flex-shrink-0 mt-1">
              {isPage ? (
                <FileText className="w-4 h-4 text-blue-500" data-testid="file-text-icon" />
              ) : (
                <Hash className="w-4 h-4 text-gray-500" data-testid="hash-icon" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {highlightText(result.title, query)}
                </h4>
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  {result.is_journal && (
                    <Calendar className="w-3 h-3" data-testid="calendar-icon" />
                  )}
                  <Clock className="w-3 h-3" data-testid="clock-icon" />
                  <span>{formatDate(result.updated_at)}</span>
                </div>
              </div>
              
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                {highlightText(result.excerpt, query)}
              </p>
              
              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center space-x-2 text-xs">
                  {result.page_name && !isPage && (
                    <span className="text-gray-500">
                      in {highlightText(result.page_name, query)}
                    </span>
                  )}
                  {result.tags.length > 0 && (
                    <div className="flex space-x-1">
                      {result.tags.slice(0, 2).map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs"
                        >
                          {highlightText(tag, query)}
                        </span>
                      ))}
                      {result.tags.length > 2 && (
                        <span className="text-gray-400 text-xs">
                          +{result.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="text-xs text-gray-400">
                  {Math.round(result.score * 100)}% match
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return items
  }, [results, visibleRange, selectedIndex, query, onResultClick, highlightText, formatDate])

  const totalHeight = results.length * ITEM_HEIGHT

  return (
    <div
      ref={containerRef}
      data-testid="search-results-container"
      className="relative overflow-auto"
      style={{ height: Math.min(CONTAINER_HEIGHT, totalHeight) }}
      onScroll={handleScroll}
    >
      {/* Virtual container to maintain scroll height */}
      <div
        data-testid="search-results-virtual-container"
        style={{ height: totalHeight, position: 'relative' }}
      >
        {visibleItems}
      </div>
    </div>
  )
}

export default React.memo(VirtualizedSearchResults)
