/**
 * MingLog 高级搜索组件
 * 支持全文搜索、复杂查询语法和多维度过滤
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { SearchEngine, SearchDocument, SearchResult, SearchOptions } from '../../search/SearchEngine';
import { SearchFilter } from '../../search/SearchQueryParser';

export interface AdvancedSearchComponentProps {
  /** 搜索引擎实例 */
  searchEngine: SearchEngine;
  /** 搜索结果回调 */
  onResults?: (results: SearchResult[]) => void;
  /** 文档点击回调 */
  onDocumentClick?: (document: SearchDocument) => void;
  /** 是否显示过滤器 */
  showFilters?: boolean;
  /** 是否显示搜索历史 */
  showHistory?: boolean;
  /** 最大历史记录数 */
  maxHistoryItems?: number;
  /** 默认搜索选项 */
  defaultOptions?: Partial<SearchOptions>;
}

export const AdvancedSearchComponent: React.FC<AdvancedSearchComponentProps> = ({
  searchEngine,
  onResults,
  onDocumentClick,
  showFilters = true,
  showHistory = true,
  maxHistoryItems = 10,
  defaultOptions = {}
}) => {
  // 搜索状态
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 搜索选项
  const [searchOptions, setSearchOptions] = useState<SearchOptions>({
    limit: 20,
    offset: 0,
    sortBy: 'score',
    sortOrder: 'desc',
    highlight: true,
    fragmentSize: 150,
    maxFragments: 3,
    ...defaultOptions
  });

  // 过滤器状态
  const [filters, setFilters] = useState<SearchFilter>({
    fileTypes: [],
    tags: [],
    authors: [],
    paths: []
  });

  // 搜索历史
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // 高级搜索面板状态
  const [showAdvanced, setShowAdvanced] = useState(false);

  // 执行搜索
  const performSearch = useCallback(async (searchQuery: string, options?: Partial<SearchOptions>) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    if (!searchEngine || typeof searchEngine.search !== 'function') {
      setError('搜索引擎未初始化');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const searchResults = await Promise.resolve(searchEngine.search(searchQuery, {
        ...searchOptions,
        ...options,
        filters
      }));

      setResults(searchResults);

      if (onResults) {
        onResults(searchResults);
      }

      // 添加到搜索历史
      if (searchQuery && !searchHistory.includes(searchQuery)) {
        const newHistory = [searchQuery, ...searchHistory.slice(0, maxHistoryItems - 1)];
        setSearchHistory(newHistory);
        try {
          localStorage.setItem('minglog-search-history', JSON.stringify(newHistory));
        } catch (err) {
          console.warn('Failed to save search history:', err);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '搜索失败');
    } finally {
      setLoading(false);
    }
  }, [searchEngine, searchOptions, filters, onResults, searchHistory, maxHistoryItems]);

  // 处理搜索输入变化
  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);

    // 获取搜索建议
    if (value.trim() && searchEngine && typeof searchEngine.getSuggestions === 'function') {
      const searchSuggestions = searchEngine.getSuggestions(value, 5);
      setSuggestions(searchSuggestions);
      setShowSuggestions(searchSuggestions.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchEngine]);

  // 处理搜索提交
  const handleSearch = useCallback((searchQuery?: string) => {
    const queryToSearch = searchQuery || query;
    performSearch(queryToSearch);
    setShowSuggestions(false);
  }, [query, performSearch]);

  // 处理建议选择
  const handleSuggestionSelect = useCallback((suggestion: string) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  }, [handleSearch]);

  // 处理过滤器变化
  const handleFiltersChange = useCallback((newFilters: Partial<SearchFilter>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    
    // 如果有查询，重新搜索
    if (query.trim()) {
      performSearch(query);
    }
  }, [filters, query, performSearch]);

  // 处理搜索选项变化
  const handleOptionsChange = useCallback((newOptions: Partial<SearchOptions>) => {
    const updatedOptions = { ...searchOptions, ...newOptions };
    setSearchOptions(updatedOptions);
    
    // 如果有查询，重新搜索
    if (query.trim()) {
      performSearch(query, newOptions);
    }
  }, [searchOptions, query, performSearch]);

  // 清除搜索
  const handleClear = useCallback(() => {
    setQuery('');
    setResults([]);
    setError(null);
    setShowSuggestions(false);
  }, []);

  // 加载搜索历史
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('minglog-search-history');
      if (savedHistory) {
        setSearchHistory(JSON.parse(savedHistory));
      }
    } catch (err) {
      console.warn('Failed to load search history:', err);
    }
  }, []);

  // 搜索统计信息
  const searchStats = useMemo(() => {
    if (!searchEngine || typeof searchEngine.getStats !== 'function') {
      return { totalDocuments: 0, totalTerms: 0 };
    }
    return searchEngine.getStats();
  }, [searchEngine]);

  return (
    <div className="advanced-search-component">
      {/* 搜索头部 */}
      <div className="search-header">
        <h2 className="search-title">🔍 高级搜索</h2>
        <div className="search-stats">
          <span>共 {searchStats.totalDocuments} 个文档</span>
          <span>•</span>
          <span>{searchStats.totalTerms} 个索引词</span>
        </div>
      </div>

      {/* 主搜索框 */}
      <div className="search-main">
        <div className="search-input-container">
          <input
            type="text"
            className="search-input"
            placeholder="输入搜索查询... (支持 AND、OR、NOT、引号、通配符)"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              } else if (e.key === 'Escape') {
                setShowSuggestions(false);
              }
            }}
          />
          
          <div className="search-actions">
            <button
              className="search-btn search-btn--primary"
              onClick={() => handleSearch()}
              disabled={loading}
            >
              {loading ? '搜索中...' : '搜索'}
            </button>
            
            <button
              className="search-btn search-btn--secondary"
              onClick={handleClear}
            >
              清除
            </button>
            
            <button
              className="search-btn search-btn--toggle"
              onClick={() => setShowAdvanced(!showAdvanced)}
              title="高级选项"
            >
              ⚙️
            </button>
          </div>

          {/* 搜索建议 */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="search-suggestions">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  className="search-suggestion"
                  onClick={() => handleSuggestionSelect(suggestion)}
                >
                  🔍 {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 搜索语法提示 */}
        <div className="search-syntax-help">
          <details>
            <summary>搜索语法帮助</summary>
            <div className="syntax-examples">
              <div><code>"精确短语"</code> - 精确匹配短语</div>
              <div><code>term1 AND term2</code> - 同时包含两个词</div>
              <div><code>term1 OR term2</code> - 包含任一词</div>
              <div><code>NOT term</code> - 不包含该词</div>
              <div><code>title:关键词</code> - 在标题中搜索</div>
              <div><code>tag:标签名</code> - 按标签搜索</div>
              <div><code>type:page</code> - 按类型搜索</div>
              <div><code>wild*card</code> - 通配符搜索</div>
            </div>
          </details>
        </div>
      </div>

      {/* 高级选项面板 */}
      {showAdvanced && (
        <div className="search-advanced-panel">
          <div className="advanced-section">
            <h3>排序和显示</h3>
            <div className="advanced-controls">
              <label>
                排序方式:
                <select
                  value={searchOptions.sortBy}
                  onChange={(e) => handleOptionsChange({ sortBy: e.target.value })}
                >
                  <option value="score">相关性</option>
                  <option value="title">标题</option>
                  <option value="createdAt">创建时间</option>
                  <option value="updatedAt">更新时间</option>
                </select>
              </label>
              
              <label>
                排序方向:
                <select
                  value={searchOptions.sortOrder}
                  onChange={(e) => handleOptionsChange({ sortOrder: e.target.value as 'asc' | 'desc' })}
                >
                  <option value="desc">降序</option>
                  <option value="asc">升序</option>
                </select>
              </label>
              
              <label>
                每页结果:
                <select
                  value={searchOptions.limit}
                  onChange={(e) => handleOptionsChange({ limit: parseInt(e.target.value) })}
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
              </label>
            </div>
          </div>

          {showFilters && (
            <div className="advanced-section">
              <h3>过滤器</h3>
              <div className="filter-controls">
                <div className="filter-group">
                  <label>文档类型:</label>
                  <div className="filter-checkboxes">
                    {['page', 'block', 'tag'].map(type => (
                      <label key={type} className="filter-checkbox">
                        <input
                          type="checkbox"
                          checked={filters.fileTypes?.includes(type) || false}
                          onChange={(e) => {
                            const newTypes = e.target.checked
                              ? [...(filters.fileTypes || []), type]
                              : (filters.fileTypes || []).filter(t => t !== type);
                            handleFiltersChange({ fileTypes: newTypes });
                          }}
                        />
                        {type}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="filter-group">
                  <label>时间范围:</label>
                  <div className="date-range">
                    <input
                      type="date"
                      onChange={(e) => {
                        const start = e.target.value ? new Date(e.target.value) : undefined;
                        handleFiltersChange({
                          dateRange: { ...filters.dateRange, start }
                        });
                      }}
                    />
                    <span>到</span>
                    <input
                      type="date"
                      onChange={(e) => {
                        const end = e.target.value ? new Date(e.target.value) : undefined;
                        handleFiltersChange({
                          dateRange: { ...filters.dateRange, end }
                        });
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 搜索历史 */}
      {showHistory && searchHistory.length > 0 && (
        <div className="search-history">
          <h4>搜索历史</h4>
          <div className="history-items">
            {searchHistory.slice(0, 5).map((historyQuery, index) => (
              <button
                key={index}
                className="history-item"
                onClick={() => {
                  setQuery(historyQuery);
                  handleSearch(historyQuery);
                }}
              >
                🕒 {historyQuery}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 搜索结果 */}
      <div className="search-results">
        {error && (
          <div className="search-error">
            ⚠️ {error}
          </div>
        )}

        {loading && (
          <div className="search-loading">
            <div className="loading-spinner" />
            搜索中...
          </div>
        )}

        {!loading && !error && results.length === 0 && query && (
          <div className="search-empty">
            <div className="empty-icon">🔍</div>
            <div className="empty-message">没有找到匹配的结果</div>
            <div className="empty-suggestion">
              尝试使用不同的关键词或调整搜索条件
            </div>
          </div>
        )}

        {!loading && !error && results.length > 0 && (
          <>
            <div className="results-header">
              <span className="results-count">
                找到 {results.length} 个结果
              </span>
            </div>
            
            <div className="results-list">
              {results.map((result, index) => (
                <div
                  key={result.document.id}
                  className="result-item"
                  onClick={() => onDocumentClick?.(result.document)}
                >
                  <div className="result-header">
                    <h3 className="result-title">
                      {result.document.type === 'page' && '📄'}
                      {result.document.type === 'block' && '🧩'}
                      {result.document.type === 'tag' && '🏷️'}
                      {result.document.title}
                    </h3>
                    <div className="result-meta">
                      <span className="result-score">
                        相关性: {(result.score * 100).toFixed(1)}%
                      </span>
                      <span className="result-type">{result.document.type}</span>
                    </div>
                  </div>
                  
                  {result.highlights.length > 0 && (
                    <div className="result-highlights">
                      {result.highlights.map((highlight, hIndex) => (
                        <div key={hIndex} className="highlight-group">
                          <div className="highlight-field">{highlight.field}:</div>
                          {highlight.fragments.map((fragment, fIndex) => (
                            <div
                              key={fIndex}
                              className="highlight-fragment"
                              dangerouslySetInnerHTML={{ __html: fragment }}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="result-footer">
                    <span className="result-date">
                      {result.document.updatedAt.toLocaleDateString()}
                    </span>
                    {result.document.tags && result.document.tags.length > 0 && (
                      <div className="result-tags">
                        {result.document.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="result-tag">#{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdvancedSearchComponent;
