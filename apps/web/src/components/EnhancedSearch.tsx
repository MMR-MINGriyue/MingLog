import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useApiStore } from '../stores/api-store';
import { LoadingSpinner, EmptySearch, useToast } from '@minglog/ui';
import { debounce } from 'lodash-es';

interface SearchResult {
  id: string;
  type: 'page' | 'block';
  title: string;
  content: string;
  excerpt: string;
  score: number;
  metadata: {
    pageId?: string;
    pageName?: string;
    blockId?: string;
    tags?: string[];
    isJournal?: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

interface SearchFilters {
  type: 'all' | 'pages' | 'blocks';
  tags: string[];
  isJournal?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  sortBy: 'relevance' | 'date' | 'title';
}

interface EnhancedSearchProps {
  onResultSelect?: (result: SearchResult) => void;
  placeholder?: string;
  showFilters?: boolean;
  autoFocus?: boolean;
}

export const EnhancedSearch: React.FC<EnhancedSearchProps> = ({
  onResultSelect,
  placeholder = "搜索页面和块...",
  showFilters = true,
  autoFocus = false,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [filters, setFilters] = useState<SearchFilters>({
    type: 'all',
    tags: [],
    sortBy: 'relevance',
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const { search, currentGraph } = useApiStore();
  const { addToast } = useToast();

  // Load search history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('minglog-search-history');
    if (savedHistory) {
      try {
        setSearchHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Failed to load search history:', error);
      }
    }
  }, []);

  // Save search history to localStorage
  const saveSearchHistory = useCallback((newHistory: string[]) => {
    try {
      localStorage.setItem('minglog-search-history', JSON.stringify(newHistory));
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string, searchFilters: SearchFilters) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const searchResults = await search(
          searchQuery,
          currentGraph?.id,
          searchFilters.type
        );
        
        // Apply additional filters
        let filteredResults = searchResults.data || [];
        
        if (searchFilters.tags.length > 0) {
          filteredResults = filteredResults.filter((result: any) =>
            searchFilters.tags.some(tag => 
              result.metadata?.tags?.includes(tag)
            )
          );
        }

        if (searchFilters.isJournal !== undefined) {
          filteredResults = filteredResults.filter((result: any) =>
            result.metadata?.isJournal === searchFilters.isJournal
          );
        }

        // Sort results
        if (searchFilters.sortBy === 'date') {
          filteredResults.sort((a: any, b: any) => 
            new Date(b.metadata.updatedAt).getTime() - new Date(a.metadata.updatedAt).getTime()
          );
        } else if (searchFilters.sortBy === 'title') {
          filteredResults.sort((a: any, b: any) => a.title.localeCompare(b.title));
        }

        setResults(filteredResults);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Search failed:', error);
        addToast({
          type: 'error',
          title: '搜索失败',
          message: error instanceof Error ? error.message : '搜索时发生错误',
        });
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [search, currentGraph, addToast]
  );

  // Handle search input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);
    setShowResults(true);
    
    if (newQuery.trim()) {
      debouncedSearch(newQuery, filters);
    } else {
      setResults([]);
      setIsSearching(false);
    }
  };

  // Handle search submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // Add to search history
      const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 10);
      setSearchHistory(newHistory);
      saveSearchHistory(newHistory);
      
      // Trigger immediate search
      debouncedSearch(query, filters);
    }
  };

  // Handle result selection
  const handleResultSelect = (result: SearchResult) => {
    setShowResults(false);
    setQuery('');
    onResultSelect?.(result);
    
    // Add to search history
    const searchTerm = result.title;
    const newHistory = [searchTerm, ...searchHistory.filter(h => h !== searchTerm)].slice(0, 10);
    setSearchHistory(newHistory);
    saveSearchHistory(newHistory);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleResultSelect(results[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowResults(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    
    if (query.trim()) {
      debouncedSearch(query, updatedFilters);
    }
  };

  // Clear search history
  const clearSearchHistory = () => {
    setSearchHistory([]);
    saveSearchHistory([]);
    addToast({
      type: 'success',
      title: '搜索历史已清除',
      duration: 2000
    });
  };

  // Auto focus
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
    }
  }, [autoFocus]);

  // Highlight search terms in text
  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-yellow-900 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  return (
    <div className="relative">
      {/* Search Input */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowResults(true)}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {isSearching ? (
              <LoadingSpinner size="sm" />
            ) : (
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </div>
          
          {/* Advanced Filters Toggle */}
          {showFilters && (
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
            </button>
          )}
        </div>
      </form>

      {/* Advanced Filters */}
      {showAdvancedFilters && showFilters && (
        <div className="mt-2 p-4 bg-gray-50 rounded-lg border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">类型</label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange({ type: e.target.value as any })}
                className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="all">全部</option>
                <option value="pages">页面</option>
                <option value="blocks">块</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">排序</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange({ sortBy: e.target.value as any })}
                className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="relevance">相关性</option>
                <option value="date">日期</option>
                <option value="title">标题</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">内容类型</label>
              <select
                value={filters.isJournal === undefined ? 'all' : filters.isJournal ? 'journal' : 'regular'}
                onChange={(e) => {
                  const value = e.target.value;
                  handleFilterChange({ 
                    isJournal: value === 'all' ? undefined : value === 'journal' 
                  });
                }}
                className="w-full px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="all">全部</option>
                <option value="journal">日记</option>
                <option value="regular">普通页面</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Search Results */}
      {showResults && (
        <div 
          ref={resultsRef}
          className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50"
        >
          {/* Search History */}
          {!query && searchHistory.length > 0 && (
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-700">搜索历史</h4>
                <button
                  onClick={clearSearchHistory}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  清除
                </button>
              </div>
              <div className="space-y-1">
                {searchHistory.slice(0, 5).map((historyItem, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setQuery(historyItem);
                      debouncedSearch(historyItem, filters);
                    }}
                    className="block w-full text-left px-2 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                  >
                    <svg className="w-4 h-4 inline mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {historyItem}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Results */}
          {query && (
            <div className="max-h-80 overflow-y-auto">
              {results.length === 0 && !isSearching ? (
                <div className="p-4">
                  <EmptySearch query={query} />
                </div>
              ) : (
                <div className="py-2">
                  {results.map((result, index) => (
                    <button
                      key={result.id}
                      onClick={() => handleResultSelect(result)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                        index === selectedIndex ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {result.type === 'page' ? (
                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {highlightText(result.title, query)}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {highlightText(result.excerpt, query)}
                          </div>
                          <div className="flex items-center mt-2 space-x-2 text-xs text-gray-400">
                            <span>{result.type === 'page' ? '页面' : '块'}</span>
                            {result.metadata.pageName && result.type === 'block' && (
                              <>
                                <span>•</span>
                                <span>{result.metadata.pageName}</span>
                              </>
                            )}
                            {result.metadata.isJournal && (
                              <>
                                <span>•</span>
                                <span>📅 日记</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0 text-xs text-gray-400">
                          {Math.round(result.score * 100)}%
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Click outside to close */}
      {showResults && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowResults(false)}
        />
      )}
    </div>
  );
};
