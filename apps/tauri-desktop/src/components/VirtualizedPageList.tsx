import React, { useMemo, useCallback, useRef, useEffect, useState, memo } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Calendar, Clock, Star, Edit3, Tag } from 'lucide-react'

interface Page {
  id: string
  title: string
  content?: string
  excerpt?: string
  created_at: number
  updated_at: number
  is_favorite?: boolean
  tags?: string[]
  word_count?: number
}

interface VirtualizedPageListProps {
  pages: Page[]
  selectedIndex?: number
  onPageClick?: (page: Page, index: number) => void
  onPageEdit?: (page: Page) => void
  formatDate: (timestamp: number) => string
  showExcerpt?: boolean
  showWordCount?: boolean
  itemHeight?: number
  containerHeight?: number
}

const DEFAULT_ITEM_HEIGHT = 120
const DEFAULT_CONTAINER_HEIGHT = 600
const BUFFER_SIZE = 3

const VirtualizedPageList: React.FC<VirtualizedPageListProps> = memo(({
  pages,
  selectedIndex = -1,
  onPageClick,
  onPageEdit,
  formatDate,
  showExcerpt = true,
  showWordCount = true,
  itemHeight = DEFAULT_ITEM_HEIGHT,
  containerHeight = DEFAULT_CONTAINER_HEIGHT,
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const visibleCount = Math.ceil(containerHeight / itemHeight)
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - BUFFER_SIZE)
    const endIndex = Math.min(pages.length, startIndex + visibleCount + BUFFER_SIZE * 2)
    
    return { startIndex, endIndex, visibleCount }
  }, [scrollTop, pages.length, itemHeight, containerHeight])

  // Handle scroll events
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement
    setScrollTop(target.scrollTop)
  }, [])

  // Auto-scroll to selected item
  useEffect(() => {
    if (selectedIndex >= 0 && containerRef.current) {
      const itemTop = selectedIndex * itemHeight
      const itemBottom = itemTop + itemHeight
      const containerTop = scrollTop
      const containerBottom = scrollTop + containerHeight

      if (itemTop < containerTop || itemBottom > containerBottom) {
        containerRef.current.scrollTo({
          top: itemTop - itemHeight,
          behavior: 'smooth'
        })
      }
    }
  }, [selectedIndex, itemHeight, containerHeight, scrollTop])

  // Generate visible items
  const visibleItems = useMemo(() => {
    const { startIndex, endIndex } = visibleRange
    const items: React.ReactNode[] = []

    for (let i = startIndex; i < endIndex; i++) {
      const page = pages[i]
      if (!page) continue

      const isSelected = i === selectedIndex
      const excerpt = showExcerpt && page.excerpt 
        ? page.excerpt.length > 150 
          ? page.excerpt.substring(0, 150) + '...'
          : page.excerpt
        : page.content 
          ? page.content.length > 150 
            ? page.content.substring(0, 150) + '...'
            : page.content
          : ''

      items.push(
        <div
          key={page.id}
          data-testid={`page-item-${i}`}
          data-page-id={page.id}
          className={`
            absolute left-0 right-0 mx-4 p-4 rounded-lg border cursor-pointer
            transition-all duration-200 hover:shadow-md
            ${isSelected
              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 shadow-md'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750'
            }
          `}
          style={{
            top: i * itemHeight,
            height: itemHeight - 8, // Account for margin
          }}
          onClick={() => onPageClick?.(page, i)}
        >
          <div className="flex items-start justify-between h-full">
            <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
              {/* Title and metadata */}
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 truncate">
                    {page.title || '无标题页面'}
                  </h3>
                  {page.is_favorite && (
                    <Star className="w-4 h-4 text-yellow-500 fill-current flex-shrink-0" />
                  )}
                </div>

                {/* Excerpt */}
                {showExcerpt && excerpt && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                    {excerpt}
                  </p>
                )}

                {/* Tags */}
                {page.tags && page.tags.length > 0 && (
                  <div className="flex items-center space-x-1 mb-2">
                    <Tag className="w-3 h-3 text-gray-400" />
                    <div className="flex flex-wrap gap-1">
                      {page.tags.slice(0, 3).map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                      {page.tags.length > 3 && (
                        <span className="text-xs text-gray-400">
                          +{page.tags.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer with dates and word count */}
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>创建: {formatDate(page.created_at)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>更新: {formatDate(page.updated_at)}</span>
                  </div>
                </div>
                {showWordCount && page.word_count !== undefined && (
                  <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    {page.word_count} 字
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-2 ml-4">
              {onPageEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onPageEdit(page)
                  }}
                  className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                  aria-label={`编辑页面: ${page.title}`}
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
              <Link
                to={`/editor/${page.id}`}
                onClick={(e) => e.stopPropagation()}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                打开
              </Link>
            </div>
          </div>
        </div>
      )
    }

    return items
  }, [pages, visibleRange, selectedIndex, onPageClick, onPageEdit, formatDate, showExcerpt, showWordCount, itemHeight])

  const totalHeight = pages.length * itemHeight

  // Empty state
  if (pages.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">暂无页面</h3>
          <p className="text-sm">开始创建您的第一个页面</p>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      data-testid="page-list-container"
      className="relative overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg"
      style={{ height: Math.min(containerHeight, totalHeight + 16) }} // Add padding
      onScroll={handleScroll}
    >
      {/* Virtual container to maintain scroll height */}
      <div
        data-testid="page-list-virtual-container"
        style={{ height: totalHeight + 16, position: 'relative', paddingTop: 8, paddingBottom: 8 }}
      >
        {visibleItems}
      </div>
    </div>
  )
})

VirtualizedPageList.displayName = 'VirtualizedPageList'

export default VirtualizedPageList
export type { Page, VirtualizedPageListProps }
