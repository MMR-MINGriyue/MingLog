/**
 * MingLog 反向链接面板组件
 * 实时显示当前页面的反向链接
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { BacklinkInfo, LinkType } from '../../types/links';
import { BacklinksList } from './BacklinksList';

export interface BacklinksPanelProps {
  /** 目标页面ID */
  targetId: string;
  /** 目标类型 */
  targetType?: 'page' | 'block';
  /** 是否打开面板 */
  isOpen: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 反向链接数据 */
  backlinks?: BacklinkInfo[];
  /** 加载状态 */
  loading?: boolean;
  /** 错误信息 */
  error?: string;
  /** 刷新回调 */
  onRefresh?: () => void;
  /** 链接点击回调 */
  onLinkClick?: (backlink: BacklinkInfo) => void;
  /** 面板位置 */
  position?: 'right' | 'left' | 'bottom';
  /** 面板宽度 */
  width?: number;
  /** 面板高度 */
  height?: number;
  /** 是否可调整大小 */
  resizable?: boolean;
}

export const BacklinksPanel: React.FC<BacklinksPanelProps> = ({
  targetId,
  targetType = 'page',
  isOpen,
  onClose,
  backlinks = [],
  loading = false,
  error,
  onRefresh,
  onLinkClick,
  position = 'right',
  width = 350,
  height = 400,
  resizable = true
}) => {
  const [filterType, setFilterType] = useState<LinkType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'source' | 'relevance'>('date');
  const [groupBy, setGroupBy] = useState<'none' | 'source' | 'type'>('none');
  const [panelSize, setPanelSize] = useState({ width, height });

  // 过滤和排序反向链接
  const filteredAndSortedBacklinks = useMemo(() => {
    let filtered = backlinks;

    // 按类型过滤
    if (filterType !== 'all') {
      filtered = filtered.filter(link => link.linkType === filterType);
    }

    // 按搜索查询过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(link => 
        link.sourceTitle?.toLowerCase().includes(query) ||
        link.context.toLowerCase().includes(query) ||
        link.sourceId.toLowerCase().includes(query)
      );
    }

    // 排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'source':
          return (a.sourceTitle || a.sourceId).localeCompare(b.sourceTitle || b.sourceId);
        case 'relevance':
          // 简单的相关性评分：上下文长度
          return b.context.length - a.context.length;
        default:
          return 0;
      }
    });

    return filtered;
  }, [backlinks, filterType, searchQuery, sortBy]);

  // 分组反向链接
  const groupedBacklinks = useMemo(() => {
    if (groupBy === 'none') {
      return { '全部': filteredAndSortedBacklinks };
    }

    const groups: Record<string, BacklinkInfo[]> = {};

    filteredAndSortedBacklinks.forEach(link => {
      let groupKey: string;
      
      switch (groupBy) {
        case 'source':
          groupKey = link.sourceTitle || link.sourceId;
          break;
        case 'type':
          groupKey = link.linkType === 'page-reference' ? '页面引用' : '块引用';
          break;
        default:
          groupKey = '全部';
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(link);
    });

    return groups;
  }, [filteredAndSortedBacklinks, groupBy]);

  // 统计信息
  const stats = useMemo(() => {
    const total = backlinks.length;
    const pageReferences = backlinks.filter(link => link.linkType === 'page-reference').length;
    const blockReferences = backlinks.filter(link => link.linkType === 'block-reference').length;
    const uniqueSources = new Set(backlinks.map(link => link.sourceId)).size;

    return {
      total,
      pageReferences,
      blockReferences,
      uniqueSources,
      filtered: filteredAndSortedBacklinks.length
    };
  }, [backlinks, filteredAndSortedBacklinks]);

  // 处理刷新
  const handleRefresh = useCallback(() => {
    if (onRefresh) {
      onRefresh();
    }
  }, [onRefresh]);

  // 处理清除搜索
  const handleClearSearch = useCallback(() => {
    setSearchQuery('');
  }, []);

  // 处理重置过滤器
  const handleResetFilters = useCallback(() => {
    setFilterType('all');
    setSearchQuery('');
    setSortBy('date');
    setGroupBy('none');
  }, []);

  // 键盘快捷键
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'F5' || (event.ctrlKey && event.key === 'r')) {
        event.preventDefault();
        handleRefresh();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleRefresh]);

  if (!isOpen) return null;

  return (
    <div
      className={`backlinks-panel backlinks-panel--${position}`}
      style={{
        width: panelSize.width,
        height: panelSize.height
      }}
      data-testid="backlinks-panel"
    >
      {/* 头部 */}
      <div className="backlinks-panel__header">
        <div className="backlinks-panel__title">
          <span className="backlinks-panel__icon">🔗</span>
          <span>反向链接</span>
          <span className="backlinks-panel__count">({stats.total})</span>
        </div>
        
        <div className="backlinks-panel__actions">
          <button
            className="backlinks-panel__action-btn"
            onClick={handleRefresh}
            disabled={loading}
            title="刷新 (F5)"
          >
            🔄
          </button>
          
          <button
            className="backlinks-panel__action-btn"
            onClick={onClose}
            title="关闭 (Esc)"
          >
            ✕
          </button>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="backlinks-panel__stats">
        <div className="backlinks-panel__stat">
          <span className="backlinks-panel__stat-label">页面引用:</span>
          <span className="backlinks-panel__stat-value">{stats.pageReferences}</span>
        </div>
        <div className="backlinks-panel__stat">
          <span className="backlinks-panel__stat-label">块引用:</span>
          <span className="backlinks-panel__stat-value">{stats.blockReferences}</span>
        </div>
        <div className="backlinks-panel__stat">
          <span className="backlinks-panel__stat-label">来源:</span>
          <span className="backlinks-panel__stat-value">{stats.uniqueSources}</span>
        </div>
      </div>

      {/* 过滤器和搜索 */}
      <div className="backlinks-panel__filters">
        {/* 搜索框 */}
        <div className="backlinks-panel__search">
          <input
            type="text"
            placeholder="搜索反向链接..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="backlinks-panel__search-input"
          />
          {searchQuery && (
            <button
              className="backlinks-panel__search-clear"
              onClick={handleClearSearch}
              title="清除搜索"
            >
              ✕
            </button>
          )}
        </div>

        {/* 过滤器行 */}
        <div className="backlinks-panel__filter-row">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as LinkType | 'all')}
            className="backlinks-panel__filter-select"
          >
            <option value="all">全部类型</option>
            <option value="page-reference">页面引用</option>
            <option value="block-reference">块引用</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'source' | 'relevance')}
            className="backlinks-panel__filter-select"
          >
            <option value="date">按时间</option>
            <option value="source">按来源</option>
            <option value="relevance">按相关性</option>
          </select>

          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as 'none' | 'source' | 'type')}
            className="backlinks-panel__filter-select"
          >
            <option value="none">不分组</option>
            <option value="source">按来源</option>
            <option value="type">按类型</option>
          </select>
        </div>

        {/* 重置按钮 */}
        {(filterType !== 'all' || searchQuery || sortBy !== 'date' || groupBy !== 'none') && (
          <button
            className="backlinks-panel__reset-btn"
            onClick={handleResetFilters}
          >
            重置过滤器
          </button>
        )}
      </div>

      {/* 内容区域 */}
      <div className="backlinks-panel__content">
        {loading ? (
          <div className="backlinks-panel__loading">
            <div className="backlinks-panel__spinner" />
            <span>加载反向链接...</span>
          </div>
        ) : error ? (
          <div className="backlinks-panel__error">
            <span className="backlinks-panel__error-icon">⚠️</span>
            <span className="backlinks-panel__error-message">{error}</span>
            <button
              className="backlinks-panel__error-retry"
              onClick={handleRefresh}
            >
              重试
            </button>
          </div>
        ) : stats.filtered === 0 ? (
          <div className="backlinks-panel__empty">
            {stats.total === 0 ? (
              <>
                <span className="backlinks-panel__empty-icon">🔗</span>
                <span className="backlinks-panel__empty-message">
                  暂无反向链接
                </span>
                <span className="backlinks-panel__empty-hint">
                  当其他页面引用此页面时，链接会显示在这里
                </span>
              </>
            ) : (
              <>
                <span className="backlinks-panel__empty-icon">🔍</span>
                <span className="backlinks-panel__empty-message">
                  没有找到匹配的链接
                </span>
                <span className="backlinks-panel__empty-hint">
                  尝试调整搜索条件或过滤器
                </span>
              </>
            )}
          </div>
        ) : (
          <BacklinksList
            groupedBacklinks={groupedBacklinks}
            onLinkClick={onLinkClick}
            showGroupHeaders={groupBy !== 'none'}
          />
        )}
      </div>

      {/* 底部信息 */}
      {stats.filtered > 0 && (
        <div className="backlinks-panel__footer">
          <span className="backlinks-panel__result-count">
            显示 {stats.filtered} / {stats.total} 个链接
          </span>
        </div>
      )}
    </div>
  );
};

export default BacklinksPanel;
