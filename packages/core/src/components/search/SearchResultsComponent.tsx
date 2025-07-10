/**
 * MingLog 搜索结果组件
 * 显示搜索结果列表，支持分页、排序和详细视图
 */

import React, { useState, useCallback } from 'react';
import { SearchResult, SearchDocument } from '../../search/SearchEngine';

export interface SearchResultsComponentProps {
  /** 搜索结果 */
  results: SearchResult[];
  /** 加载状态 */
  loading?: boolean;
  /** 错误信息 */
  error?: string | null;
  /** 当前页码 */
  currentPage?: number;
  /** 每页结果数 */
  pageSize?: number;
  /** 总结果数 */
  totalResults?: number;
  /** 文档点击回调 */
  onDocumentClick?: (document: SearchDocument) => void;
  /** 页码变化回调 */
  onPageChange?: (page: number) => void;
  /** 显示模式 */
  viewMode?: 'list' | 'grid' | 'compact';
  /** 是否显示预览 */
  showPreview?: boolean;
}

export const SearchResultsComponent: React.FC<SearchResultsComponentProps> = ({
  results,
  loading = false,
  error = null,
  currentPage = 1,
  pageSize = 20,
  totalResults,
  onDocumentClick,
  onPageChange,
  viewMode = 'list',
  showPreview = true
}) => {
  const [selectedResult, setSelectedResult] = useState<string | null>(null);
  const [expandedResults, setExpandedResults] = useState<Set<string>>(new Set());

  // 切换结果展开状态
  const toggleExpanded = useCallback((resultId: string) => {
    const newExpanded = new Set(expandedResults);
    if (newExpanded.has(resultId)) {
      newExpanded.delete(resultId);
    } else {
      newExpanded.add(resultId);
    }
    setExpandedResults(newExpanded);
  }, [expandedResults]);

  // 处理文档点击
  const handleDocumentClick = useCallback((document: SearchDocument, event: React.MouseEvent) => {
    event.preventDefault();
    setSelectedResult(document.id);
    if (onDocumentClick) {
      onDocumentClick(document);
    }
  }, [onDocumentClick]);

  // 生成分页信息
  const getPaginationInfo = () => {
    const total = totalResults || results.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (currentPage - 1) * pageSize + 1;
    const endIndex = Math.min(currentPage * pageSize, total);
    
    return { total, totalPages, startIndex, endIndex };
  };

  // 渲染加载状态
  if (loading) {
    return (
      <div className="search-results-loading">
        <div className="loading-spinner" />
        <span>搜索中...</span>
      </div>
    );
  }

  // 渲染错误状态
  if (error) {
    return (
      <div className="search-results-error">
        <div className="error-icon">⚠️</div>
        <div className="error-message">{error}</div>
        <button className="error-retry" onClick={() => window.location.reload()}>
          重试
        </button>
      </div>
    );
  }

  // 渲染空结果
  if (results.length === 0) {
    return (
      <div className="search-results-empty">
        <div className="empty-icon">🔍</div>
        <div className="empty-title">没有找到匹配的结果</div>
        <div className="empty-suggestions">
          <p>建议：</p>
          <ul>
            <li>检查拼写是否正确</li>
            <li>尝试使用不同的关键词</li>
            <li>使用更通用的搜索词</li>
            <li>减少搜索条件</li>
          </ul>
        </div>
      </div>
    );
  }

  const paginationInfo = getPaginationInfo();

  return (
    <div className={`search-results search-results--${viewMode}`}>
      {/* 结果头部 */}
      <div className="search-results-header">
        <div className="results-info">
          <span className="results-count">
            显示第 {paginationInfo.startIndex}-{paginationInfo.endIndex} 项，
            共 {paginationInfo.total} 个结果
          </span>
        </div>
        
        <div className="results-controls">
          <div className="view-mode-selector">
            <button
              className={`view-mode-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => {/* 切换到列表视图 */}}
              title="列表视图"
            >
              📋
            </button>
            <button
              className={`view-mode-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => {/* 切换到网格视图 */}}
              title="网格视图"
            >
              ⊞
            </button>
            <button
              className={`view-mode-btn ${viewMode === 'compact' ? 'active' : ''}`}
              onClick={() => {/* 切换到紧凑视图 */}}
              title="紧凑视图"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* 结果列表 */}
      <div className="search-results-list">
        {results.map((result, index) => (
          <SearchResultItem
            key={result.document.id}
            result={result}
            index={index}
            isSelected={selectedResult === result.document.id}
            isExpanded={expandedResults.has(result.document.id)}
            viewMode={viewMode}
            showPreview={showPreview}
            onClick={handleDocumentClick}
            onToggleExpanded={toggleExpanded}
          />
        ))}
      </div>

      {/* 分页控件 */}
      {paginationInfo.totalPages > 1 && (
        <div className="search-results-pagination">
          <button
            className="pagination-btn pagination-btn--prev"
            disabled={currentPage <= 1}
            onClick={() => onPageChange?.(currentPage - 1)}
          >
            ← 上一页
          </button>
          
          <div className="pagination-pages">
            {Array.from({ length: Math.min(5, paginationInfo.totalPages) }, (_, i) => {
              const pageNum = Math.max(1, currentPage - 2) + i;
              if (pageNum > paginationInfo.totalPages) return null;
              
              return (
                <button
                  key={pageNum}
                  className={`pagination-page ${currentPage === pageNum ? 'active' : ''}`}
                  onClick={() => onPageChange?.(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button
            className="pagination-btn pagination-btn--next"
            disabled={currentPage >= paginationInfo.totalPages}
            onClick={() => onPageChange?.(currentPage + 1)}
          >
            下一页 →
          </button>
        </div>
      )}
    </div>
  );
};

// 单个搜索结果项组件
interface SearchResultItemProps {
  result: SearchResult;
  index: number;
  isSelected: boolean;
  isExpanded: boolean;
  viewMode: 'list' | 'grid' | 'compact';
  showPreview: boolean;
  onClick: (document: SearchDocument, event: React.MouseEvent) => void;
  onToggleExpanded: (resultId: string) => void;
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({
  result,
  index,
  isSelected,
  isExpanded,
  viewMode,
  showPreview,
  onClick,
  onToggleExpanded
}) => {
  const { document, score, highlights } = result;

  // 获取文档图标
  const getDocumentIcon = () => {
    switch (document.type) {
      case 'page': return '📄';
      case 'block': return '🧩';
      case 'tag': return '🏷️';
      default: return '📄';
    }
  };

  // 获取相关性颜色
  const getScoreColor = () => {
    if (score > 0.8) return '#28a745';
    if (score > 0.6) return '#ffc107';
    if (score > 0.4) return '#fd7e14';
    return '#dc3545';
  };

  // 截断文本
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div
      className={`search-result-item ${isSelected ? 'selected' : ''} ${isExpanded ? 'expanded' : ''}`}
      onClick={(e) => onClick(document, e)}
    >
      {/* 结果头部 */}
      <div className="result-item-header">
        <div className="result-item-title">
          <span className="result-icon">{getDocumentIcon()}</span>
          <h3 className="result-title">{document.title}</h3>
          <div className="result-badges">
            <span className="result-type-badge">{document.type}</span>
            <span 
              className="result-score-badge"
              style={{ backgroundColor: getScoreColor() }}
            >
              {(score * 100).toFixed(0)}%
            </span>
          </div>
        </div>
        
        <div className="result-item-actions">
          {highlights.length > 0 && (
            <button
              className="result-expand-btn"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpanded(document.id);
              }}
              title={isExpanded ? '收起详情' : '展开详情'}
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          )}
        </div>
      </div>

      {/* 结果内容 */}
      <div className="result-item-content">
        {/* 基本信息 */}
        {viewMode !== 'compact' && (
          <div className="result-item-summary">
            <p className="result-summary">
              {truncateText(document.content, viewMode === 'grid' ? 100 : 200)}
            </p>
          </div>
        )}

        {/* 高亮片段 */}
        {isExpanded && highlights.length > 0 && (
          <div className="result-item-highlights">
            <h4 className="highlights-title">匹配片段:</h4>
            {highlights.map((highlight, hIndex) => (
              <div key={hIndex} className="highlight-section">
                <div className="highlight-field-name">
                  {highlight.field === 'title' ? '标题' : '内容'}:
                </div>
                <div className="highlight-fragments">
                  {highlight.fragments.map((fragment, fIndex) => (
                    <div
                      key={fIndex}
                      className="highlight-fragment"
                      dangerouslySetInnerHTML={{ __html: fragment }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 元数据 */}
        <div className="result-item-meta">
          <div className="result-meta-left">
            <span className="result-date">
              更新于 {document.updatedAt.toLocaleDateString()}
            </span>
            {document.path && (
              <span className="result-path" title={document.path}>
                📁 {truncateText(document.path, 30)}
              </span>
            )}
          </div>
          
          <div className="result-meta-right">
            {document.tags && document.tags.length > 0 && (
              <div className="result-tags">
                {document.tags.slice(0, 3).map(tag => (
                  <span key={tag} className="result-tag">
                    #{tag}
                  </span>
                ))}
                {document.tags.length > 3 && (
                  <span className="result-tag-more">
                    +{document.tags.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchResultsComponent;
