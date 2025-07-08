/**
 * 搜索框组件
 * 支持实时搜索、键盘导航、搜索建议等功能
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Input } from '../../atoms/Input/Input'
import { Button } from '../../atoms/Button/Button'
import { cn } from '../../../utils/classNames'

export interface SearchResult {
  id: string
  title: string
  content?: string
  type: 'page' | 'block' | 'file' | 'task'
  url?: string
  metadata?: Record<string, any>
}

export interface SearchBoxProps {
  isOpen: boolean
  onClose: () => void
  onSearch?: (query: string) => Promise<SearchResult[]>
  onSelect?: (result: SearchResult) => void
  initialQuery?: string
  placeholder?: string
  className?: string
  maxResults?: number
  debounceDelay?: number
  showTypeFilter?: boolean
  showRecentSearches?: boolean
}

const typeIcons = {
  page: '📄',
  block: '🧩',
  file: '📁',
  task: '✅'
}

const typeLabels = {
  page: 'Page',
  block: 'Block',
  file: 'File',
  task: 'Task'
}

export function SearchBox({
  isOpen,
  onClose,
  onSearch,
  onSelect,
  initialQuery = '',
  placeholder = 'Search...',
  className,
  maxResults = 20,
  debounceDelay = 300,
  showTypeFilter = true,
  showRecentSearches = true
}: SearchBoxProps) {
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [typeFilter, setTypeFilter] = useState<SearchResult['type'] | 'all'>('all')
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const searchCache = useRef<Map<string, SearchResult[]>>(new Map())

  // 加载最近搜索
  useEffect(() => {
    if (showRecentSearches) {
      const saved = localStorage.getItem('minglog-recent-searches')
      if (saved) {
        try {
          setRecentSearches(JSON.parse(saved))
        } catch {
          // 忽略解析错误
        }
      }
    }
  }, [showRecentSearches])

  // 保存最近搜索
  const saveRecentSearch = useCallback((searchQuery: string) => {
    if (!showRecentSearches || !searchQuery.trim()) return
    
    setRecentSearches(prev => {
      const updated = [searchQuery, ...prev.filter(q => q !== searchQuery)].slice(0, 10)
      localStorage.setItem('minglog-recent-searches', JSON.stringify(updated))
      return updated
    })
  }, [showRecentSearches])

  // 聚焦输入框
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
      setQuery(initialQuery)
    }
  }, [isOpen, initialQuery])

  // 防抖搜索
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    const timeoutId = setTimeout(() => {
      performSearch(query)
    }, debounceDelay)

    return () => clearTimeout(timeoutId)
  }, [query, debounceDelay])

  // 执行搜索
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || !onSearch) {
      setResults([])
      return
    }

    // 检查缓存
    const cacheKey = `${searchQuery}-${typeFilter}`
    if (searchCache.current.has(cacheKey)) {
      setResults(searchCache.current.get(cacheKey)!)
      return
    }

    setIsLoading(true)
    try {
      const searchResults = await onSearch(searchQuery)
      
      // 应用类型过滤
      const filteredResults = typeFilter === 'all' 
        ? searchResults 
        : searchResults.filter(result => result.type === typeFilter)
      
      const limitedResults = filteredResults.slice(0, maxResults)
      
      // 缓存结果
      searchCache.current.set(cacheKey, limitedResults)
      setResults(limitedResults)
      setSelectedIndex(0)
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [onSearch, typeFilter, maxResults])

  // 键盘导航
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'Escape':
        onClose()
        break
      case 'ArrowDown':
        event.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
        break
      case 'ArrowUp':
        event.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, 0))
        break
      case 'Enter':
        event.preventDefault()
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex])
        }
        break
    }
  }, [results, selectedIndex, onClose])

  // 选择结果
  const handleSelect = useCallback((result: SearchResult) => {
    saveRecentSearch(query)
    onSelect?.(result)
    onClose()
  }, [query, onSelect, onClose, saveRecentSearch])

  // 选择最近搜索
  const handleRecentSearch = useCallback((recentQuery: string) => {
    setQuery(recentQuery)
  }, [])

  // 过滤后的结果
  const filteredResults = useMemo(() => {
    return typeFilter === 'all' 
      ? results 
      : results.filter(result => result.type === typeFilter)
  }, [results, typeFilter])

  // 显示的内容
  const showRecentSearchesContent = !query.trim() && recentSearches.length > 0 && showRecentSearches
  const showResults = query.trim() && (filteredResults.length > 0 || isLoading)

  if (!isOpen) return null

  return (
    <div className={cn(
      'fixed inset-0 z-modal bg-black/50 flex items-start justify-center pt-20 p-4',
      className
    )}>
      <div className={cn(
        'bg-background-elevated rounded-lg shadow-xl w-full max-w-2xl',
        'border border-border-primary overflow-hidden'
      )}>
        {/* 搜索输入 */}
        <div className="p-4 border-b border-border-primary">
          <div className="relative">
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              leftIcon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
              rightIcon={
                query && (
                  <button
                    onClick={() => setQuery('')}
                    className="text-foreground-tertiary hover:text-foreground-secondary"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )
              }
              fullWidth
            />
          </div>

          {/* 类型过滤器 */}
          {showTypeFilter && (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-sm text-foreground-secondary">Type:</span>
              <div className="flex gap-1">
                <Button
                  variant={typeFilter === 'all' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setTypeFilter('all')}
                >
                  All
                </Button>
                {Object.entries(typeLabels).map(([type, label]) => (
                  <Button
                    key={type}
                    variant={typeFilter === type ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setTypeFilter(type as SearchResult['type'])}
                  >
                    {typeIcons[type as SearchResult['type']]} {label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 搜索结果 */}
        <div ref={resultsRef} className="max-h-96 overflow-y-auto">
          {isLoading && (
            <div className="p-4 text-center text-foreground-secondary">
              <div className="inline-flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Searching...
              </div>
            </div>
          )}

          {showResults && !isLoading && (
            <div>
              {filteredResults.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => handleSelect(result)}
                  className={cn(
                    'w-full p-4 text-left hover:bg-interactive-hover transition-colors',
                    'border-b border-border-primary last:border-b-0',
                    index === selectedIndex && 'bg-interactive-selected'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg flex-shrink-0 mt-0.5">
                      {typeIcons[result.type]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-foreground-primary truncate">
                        {result.title}
                      </div>
                      {result.content && (
                        <div className="text-sm text-foreground-secondary mt-1 line-clamp-2">
                          {result.content}
                        </div>
                      )}
                      <div className="text-xs text-foreground-tertiary mt-1">
                        {typeLabels[result.type]}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {showRecentSearchesContent && (
            <div>
              <div className="p-3 text-sm font-medium text-foreground-secondary border-b border-border-primary">
                Recent Searches
              </div>
              {recentSearches.map((recentQuery, index) => (
                <button
                  key={index}
                  onClick={() => handleRecentSearch(recentQuery)}
                  className="w-full p-3 text-left hover:bg-interactive-hover transition-colors border-b border-border-primary last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <svg className="w-4 h-4 text-foreground-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-foreground-primary">{recentQuery}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {query.trim() && !isLoading && filteredResults.length === 0 && (
            <div className="p-8 text-center text-foreground-secondary">
              <div className="text-lg mb-2">No results found</div>
              <div className="text-sm">Try adjusting your search terms or filters</div>
            </div>
          )}
        </div>

        {/* 快捷键提示 */}
        <div className="p-3 bg-background-secondary border-t border-border-primary">
          <div className="flex items-center justify-between text-xs text-foreground-tertiary">
            <div className="flex items-center gap-4">
              <span>↑↓ Navigate</span>
              <span>↵ Select</span>
              <span>Esc Close</span>
            </div>
            {filteredResults.length > 0 && (
              <span>{filteredResults.length} results</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
