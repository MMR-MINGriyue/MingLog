import React, { useMemo } from 'react'
import { FixedSizeList as List } from 'react-window'

interface Page {
  id: string
  title: string
  content: string
  created_at: number
  updated_at: number
  tags?: string[]
}

interface VirtualizedPageListProps {
  pages: Page[]
  onPageSelect?: (page: Page) => void
  height?: number
  itemHeight?: number
  className?: string
}

interface PageItemProps {
  index: number
  style: React.CSSProperties
  data: {
    pages: Page[]
    onPageSelect?: (page: Page) => void
  }
}

const PageItem: React.FC<PageItemProps> = ({ index, style, data }) => {
  const { pages, onPageSelect } = data
  const page = pages[index]

  if (!page) {
    return (
      <div style={style} className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    )
  }

  const handleClick = () => {
    onPageSelect?.(page)
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString()
  }

  const truncateContent = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  return (
    <div
      style={style}
      className="p-4 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
      onClick={handleClick}
      data-testid={`page-item-${page.id}`}
    >
      <div className="flex flex-col space-y-2">
        <div className="flex items-start justify-between">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate flex-1">
            {page.title || 'Untitled Page'}
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 flex-shrink-0">
            {formatDate(page.updated_at)}
          </span>
        </div>
        
        {page.content && (
          <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2">
            {truncateContent(page.content)}
          </p>
        )}
        
        {page.tags && page.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {page.tags.slice(0, 3).map((tag, tagIndex) => (
              <span
                key={tagIndex}
                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
              >
                {tag}
              </span>
            ))}
            {page.tags.length > 3 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                +{page.tags.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

const VirtualizedPageList: React.FC<VirtualizedPageListProps> = ({
  pages,
  onPageSelect,
  height = 400,
  itemHeight = 120,
  className = ''
}) => {
  const listData = useMemo(() => ({
    pages,
    onPageSelect
  }), [pages, onPageSelect])

  if (!pages || pages.length === 0) {
    return (
      <div 
        className={`flex items-center justify-center ${className}`}
        style={{ height }}
        data-testid="empty-page-list"
      >
        <div className="text-center text-gray-500 dark:text-gray-400">
          <p className="text-sm">No pages found</p>
          <p className="text-xs mt-1">Create your first page to get started</p>
        </div>
      </div>
    )
  }

  return (
    <div className={className} data-testid="virtualized-page-list">
      <List
        height={height}
        itemCount={pages.length}
        itemSize={itemHeight}
        itemData={listData}
        overscanCount={5}
      >
        {PageItem}
      </List>
    </div>
  )
}

export default VirtualizedPageList
export type { Page, VirtualizedPageListProps }
