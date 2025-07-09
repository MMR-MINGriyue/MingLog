import React, { useMemo } from 'react';
import { FixedSizeList as List } from 'react-window';

interface PerformanceEntry {
  id: string;
  name: string;
  type: 'navigation' | 'resource' | 'measure' | 'mark';
  startTime: number;
  duration: number;
  size?: number;
  status?: string;
}

interface VirtualizedPerformanceListProps {
  entries?: PerformanceEntry[];
  height?: number;
  itemHeight?: number;
  onEntryClick?: (entry: PerformanceEntry) => void;
  className?: string;
}

interface PerformanceItemProps {
  index: number;
  style: React.CSSProperties;
  data: {
    entries: PerformanceEntry[];
    onEntryClick?: (entry: PerformanceEntry) => void;
  };
}

const PerformanceItem: React.FC<PerformanceItemProps> = ({ index, style, data }) => {
  const { entries, onEntryClick } = data;
  const entry = entries[index];

  if (!entry) return null;

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'navigation': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'resource': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'measure': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'mark': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatDuration = (duration: number) => {
    if (duration < 1) return `${(duration * 1000).toFixed(2)}μs`;
    if (duration < 1000) return `${duration.toFixed(2)}ms`;
    return `${(duration / 1000).toFixed(2)}s`;
  };

  const formatSize = (size?: number) => {
    if (!size) return '-';
    if (size < 1024) return `${size}B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)}KB`;
    return `${(size / (1024 * 1024)).toFixed(1)}MB`;
  };

  return (
    <div
      style={style}
      className={`px-4 py-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 ${
        onEntryClick ? 'cursor-pointer' : ''
      }`}
      onClick={() => onEntryClick?.(entry)}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${getTypeColor(entry.type)}`}>
              {entry.type}
            </span>
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {entry.name}
            </h3>
          </div>
          <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
            <span>Start: {entry.startTime.toFixed(2)}ms</span>
            <span>Duration: {formatDuration(entry.duration)}</span>
            {entry.size && <span>Size: {formatSize(entry.size)}</span>}
            {entry.status && <span>Status: {entry.status}</span>}
          </div>
        </div>
        <div className="flex-shrink-0 ml-4">
          <div className="text-right">
            <div className={`text-sm font-medium ${
              entry.duration > 100 ? 'text-red-600' :
              entry.duration > 50 ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {formatDuration(entry.duration)}
            </div>
            <div className="text-xs text-gray-400">
              {entry.type === 'resource' ? 'Load Time' : 'Duration'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const VirtualizedPerformanceList: React.FC<VirtualizedPerformanceListProps> = ({
  entries = [],
  height = 400,
  itemHeight = 80,
  onEntryClick,
  className = '',
}) => {
  // 确保entries是数组
  const safeEntries = Array.isArray(entries) ? entries : [];

  const itemData = useMemo(() => ({
    entries: safeEntries,
    onEntryClick,
  }), [safeEntries, onEntryClick]);

  const sortedEntries = useMemo(() => {
    return [...safeEntries].sort((a, b) => a.startTime - b.startTime);
  }, [safeEntries]);

  const stats = useMemo(() => {
    if (safeEntries.length === 0) {
      return {
        total: 0,
        totalDuration: 0,
        avgDuration: 0,
        slowestEntry: null,
      };
    }

    const totalDuration = safeEntries.reduce((sum, entry) => sum + entry.duration, 0);
    const avgDuration = totalDuration / safeEntries.length;
    const slowestEntry = safeEntries.reduce((slowest, entry) =>
      entry.duration > slowest.duration ? entry : slowest,
      safeEntries[0]
    );

    return {
      total: safeEntries.length,
      totalDuration,
      avgDuration,
      slowestEntry,
    };
  }, [safeEntries]);

  if (safeEntries.length === 0) {
    return (
      <div className={`flex items-center justify-center h-32 text-gray-500 dark:text-gray-400 ${className}`}>
        <div className="text-center">
          <p className="text-sm">No performance entries found</p>
          <p className="text-xs mt-1">Performance data will appear here when available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden ${className}`}>
      {/* Stats Header */}
      <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">{stats.total}</div>
            <div className="text-gray-500 dark:text-gray-400">Total Entries</div>
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {stats.totalDuration.toFixed(2)}ms
            </div>
            <div className="text-gray-500 dark:text-gray-400">Total Duration</div>
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {stats.avgDuration.toFixed(2)}ms
            </div>
            <div className="text-gray-500 dark:text-gray-400">Avg Duration</div>
          </div>
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {stats.slowestEntry?.duration?.toFixed(2) || 0}ms
            </div>
            <div className="text-gray-500 dark:text-gray-400">Slowest</div>
          </div>
        </div>
      </div>

      {/* Virtualized List */}
      <List
        height={height}
        itemCount={sortedEntries.length}
        itemSize={itemHeight}
        itemData={{ ...itemData, entries: sortedEntries }}
        overscanCount={5}
      >
        {PerformanceItem}
      </List>
    </div>
  );
};

export default VirtualizedPerformanceList;
