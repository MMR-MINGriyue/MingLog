import React, { useMemo, memo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { FileText, Hash, Calendar, Clock } from 'lucide-react';

interface SearchResult {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  type?: 'note' | 'page' | 'block';
  result_type?: 'page' | 'block';
  score: number;
  highlights?: string[];
  tags?: string[];
  page_id?: string;
  page_name?: string;
  block_id?: string | null;
  is_journal?: boolean;
  created_at?: number;
  updated_at?: number;
}

interface VirtualizedSearchResultsProps {
  results: SearchResult[];
  onResultClick: (result: SearchResult, index?: number) => void;
  selectedIndex?: number;
  query?: string;
  highlightText?: (text: string, query: string) => React.ReactNode;
  formatDate?: (date: string | Date) => string;
  height?: number;
  itemHeight?: number;
  className?: string;
}

interface ResultItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    results: SearchResult[];
    onResultClick: (result: SearchResult, index?: number) => void;
    selectedIndex?: number;
    query?: string;
    highlightText?: (text: string, query: string) => React.ReactNode;
    formatDate?: (date: string | Date) => string;
  };
}

const ResultItem: React.FC<ResultItemProps> = memo(({ index, style, data }) => {
  const { results, onResultClick, selectedIndex, query, highlightText, formatDate } = data;
  const result = results[index];

  if (!result) return null;

  const isSelected = selectedIndex === index;

  // 优化点击处理函数，使用useCallback避免重新创建
  const handleClick = useCallback(() => {
    onResultClick(result, index);
  }, [onResultClick, result, index]);

  // Determine result type - support both 'type' and 'result_type'
  const resultType = result.type || result.result_type || 'note';

  // Get icon based on type and journal status
  const getIcon = () => {
    if (result.is_journal) {
      return <Calendar data-testid="calendar-icon" className="w-4 h-4" />;
    }

    switch (resultType) {
      case 'page':
        return <FileText data-testid="file-text-icon" className="w-4 h-4" />;
      case 'block':
        return <Hash data-testid="hash-icon" className="w-4 h-4" />;
      default:
        return <FileText data-testid="file-text-icon" className="w-4 h-4" />;
    }
  };

  // Format score as percentage
  const scorePercentage = Math.round(result.score * 100);

  // Get display content - use excerpt if available, otherwise content
  const displayContent = result.excerpt || result.content;

  // 优化文本高亮处理，使用useMemo缓存结果
  const highlightedTitle = useMemo(() => {
    return highlightText && query ? highlightText(result.title, query) : result.title;
  }, [highlightText, query, result.title]);

  const highlightedContent = useMemo(() => {
    return highlightText && query ? highlightText(displayContent, query) : displayContent;
  }, [highlightText, query, displayContent]);

  return (
    <div
      style={style}
      role="option"
      aria-selected={isSelected}
      data-testid={`search-result-${index}`}
      className={`absolute px-4 py-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${
        isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {highlightedTitle}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
            {highlightedContent}
          </p>

          {/* Tags display */}
          {result.tags && result.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {result.tags.slice(0, 2).map((tag, idx) => (
                <span
                  key={idx}
                  className="inline-block px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded"
                >
                  {tag}
                </span>
              ))}
              {result.tags.length > 2 && (
                <span className="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                  +{result.tags.length - 2}
                </span>
              )}
            </div>
          )}

          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-gray-400 dark:text-gray-500 capitalize">
              {resultType === 'block' && result.page_name ?
                `${resultType} in ${result.page_name}` :
                resultType}
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {scorePercentage}% match
            </span>
          </div>

          {/* Date display if formatDate is provided and timestamp exists */}
          {formatDate && result.created_at && (
            <div className="mt-1">
              <span className="text-xs text-gray-400 dark:text-gray-500">
                <Clock data-testid="clock-icon" className="w-3 h-3 inline mr-1" />
                {formatDate(result.created_at)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ResultItem.displayName = 'ResultItem';

const VirtualizedSearchResults: React.FC<VirtualizedSearchResultsProps> = ({
  results,
  onResultClick,
  selectedIndex,
  query,
  highlightText,
  formatDate,
  height = 400,
  itemHeight = 120,
  className = '',
}) => {
  // 优化itemData缓存，减少不必要的重新计算
  const itemData = useMemo(() => ({
    results,
    onResultClick,
    selectedIndex,
    query,
    highlightText,
    formatDate,
  }), [results, onResultClick, selectedIndex, query, highlightText, formatDate]);

  // 优化虚拟化配置
  const virtualizedConfig = useMemo(() => ({
    height,
    itemCount: results.length,
    itemSize: itemHeight,
    itemData,
    overscanCount: 3, // 减少预渲染项目数量以提升性能
    useIsScrolling: true, // 启用滚动状态优化
  }), [height, results.length, itemHeight, itemData]);

  if (results.length === 0) {
    return (
      <div
        className={`flex items-center justify-center h-32 text-gray-500 dark:text-gray-400 ${className}`}
        data-testid="search-results-container"
      >
        <div className="text-center">
          <p className="text-sm">No results found</p>
          <p className="text-xs mt-1">Try adjusting your search terms</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-auto border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden ${className}`}
      data-testid="search-results-container"
    >
      <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          {results.length} result{results.length !== 1 ? 's' : ''} found
        </p>
      </div>
      <div>
        <List
          {...virtualizedConfig}
        >
          {ResultItem}
        </List>
      </div>
    </div>
  );
};

export default VirtualizedSearchResults;
