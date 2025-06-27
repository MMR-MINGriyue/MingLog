/**
 * 页面管理组件
 * Page Manager Component
 */

import React, { useState, useMemo } from 'react';
import { clsx } from 'clsx';
import { useLocale } from '../hooks/useLocale';
import { Button } from './Button';
import { Input } from './Input';
import { Dropdown } from './Dropdown';

export interface Page {
  id: string;
  name: string;
  title?: string;
  tags: string[];
  isJournal: boolean;
  journalDate?: string;
  properties?: Record<string, any>;
  createdAt: number;
  updatedAt: number;
  graphId: string;
}

interface PageManagerProps {
  pages: Page[];
  currentPage: Page | null;
  currentGraph: { id: string; name: string } | null;
  onPageSelect: (page: Page) => void;
  onCreatePage: () => void;
  onDeletePage: (page: Page) => void;
  onUpdatePage: (page: Page, updates: Partial<Page>) => void;
  loading?: boolean;
  className?: string;
}

export const PageManager: React.FC<PageManagerProps> = ({
  pages,
  currentPage,
  currentGraph,
  onPageSelect,
  onCreatePage,
  onDeletePage,
  onUpdatePage,
  loading = false,
  className,
}) => {
  const { t, formatRelativeTime } = useLocale();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'updated' | 'created'>('updated');
  const [filterBy, setFilterBy] = useState<'all' | 'journal' | 'regular'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // 过滤和排序页面
  const filteredAndSortedPages = useMemo(() => {
    let filtered = pages;

    // 搜索过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(page => 
        page.name.toLowerCase().includes(query) ||
        page.title?.toLowerCase().includes(query) ||
        page.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // 类型过滤
    if (filterBy === 'journal') {
      filtered = filtered.filter(page => page.isJournal);
    } else if (filterBy === 'regular') {
      filtered = filtered.filter(page => !page.isJournal);
    }

    // 排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'created':
          return b.createdAt - a.createdAt;
        case 'updated':
        default:
          return b.updatedAt - a.updatedAt;
      }
    });

    return filtered;
  }, [pages, searchQuery, sortBy, filterBy]);

  const sortOptions = [
    { value: 'updated', label: t('pages.sortBy.updated') },
    { value: 'created', label: t('pages.sortBy.created') },
    { value: 'name', label: t('pages.sortBy.name') },
  ];

  const filterOptions = [
    { value: 'all', label: t('pages.filterBy.all') },
    { value: 'regular', label: t('pages.filterBy.regular') },
    { value: 'journal', label: t('pages.filterBy.journal') },
  ];

  if (!currentGraph) {
    return (
      <div className={clsx('flex items-center justify-center h-full', className)}>
        <div className="text-center">
          <div className="text-gray-400 dark:text-gray-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            {t('graph.selectGraphFirst')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('flex flex-col h-full', className)}>
      {/* 头部 */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {t('pages.title')}
          </h2>
          <div className="flex items-center space-x-2">
            {/* 视图模式切换 */}
            <div className="flex rounded-md border border-gray-300 dark:border-gray-600">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={clsx(
                  'p-1.5 rounded-l-md transition-colors',
                  viewMode === 'list'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
                title={t('pages.viewMode.list')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={clsx(
                  'p-1.5 rounded-r-md transition-colors',
                  viewMode === 'grid'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
                title={t('pages.viewMode.grid')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </button>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={onCreatePage}
              disabled={loading}
              leftIcon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              {t('pages.createPage')}
            </Button>
          </div>
        </div>

        {/* 搜索和过滤 */}
        <div className="space-y-3">
          <Input
            type="text"
            placeholder={t('pages.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />

          <div className="flex space-x-2">
            <Dropdown
              trigger={
                <Button variant="secondary" size="sm">
                  {t('pages.sortBy.title')}: {sortOptions.find(opt => opt.value === sortBy)?.label}
                </Button>
              }
              items={sortOptions.map(option => ({
                label: option.label,
                onClick: () => setSortBy(option.value as any),
                active: sortBy === option.value,
              }))}
            />

            <Dropdown
              trigger={
                <Button variant="secondary" size="sm">
                  {t('pages.filterBy.title')}: {filterOptions.find(opt => opt.value === filterBy)?.label}
                </Button>
              }
              items={filterOptions.map(option => ({
                label: option.label,
                onClick: () => setFilterBy(option.value as any),
                active: filterBy === option.value,
              }))}
            />
          </div>
        </div>
      </div>

      {/* 页面列表 */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ))}
          </div>
        ) : filteredAndSortedPages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-gray-400 dark:text-gray-600 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">
                {searchQuery ? t('pages.noSearchResults') : t('pages.noPages')}
              </p>
              {!searchQuery && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={onCreatePage}
                >
                  {t('pages.createFirstPage')}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className={clsx(
            'p-4',
            viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'
              : 'space-y-2'
          )}>
            {filteredAndSortedPages.map((page) => (
              <PageItem
                key={page.id}
                page={page}
                isSelected={currentPage?.id === page.id}
                viewMode={viewMode}
                onSelect={() => onPageSelect(page)}
                onDelete={() => onDeletePage(page)}
                onUpdate={(updates) => onUpdatePage(page, updates)}
                formatRelativeTime={formatRelativeTime}
                t={t}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// 页面项组件
const PageItem: React.FC<{
  page: Page;
  isSelected: boolean;
  viewMode: 'list' | 'grid';
  onSelect: () => void;
  onDelete: () => void;
  onUpdate: (updates: Partial<Page>) => void;
  formatRelativeTime: (date: Date) => string;
  t: (key: string) => string;
}> = ({ page, isSelected, viewMode, onSelect, onDelete, onUpdate, formatRelativeTime, t }) => {
  const [showActions, setShowActions] = useState(false);

  if (viewMode === 'grid') {
    return (
      <div
        className={clsx(
          'p-4 border rounded-lg cursor-pointer transition-all',
          isSelected
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
        )}
        onClick={onSelect}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center">
            {page.isJournal && (
              <span className="text-blue-500 mr-2">📅</span>
            )}
            <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
              {page.title || page.name}
            </h3>
          </div>
          {showActions && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-red-500 hover:text-red-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
        
        <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
          {formatRelativeTime(new Date(page.updatedAt))}
        </div>
        
        {page.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {page.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded"
              >
                #{tag}
              </span>
            ))}
            {page.tags.length > 3 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                +{page.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={clsx(
        'flex items-center p-3 rounded-lg cursor-pointer transition-all',
        isSelected
          ? 'bg-blue-100 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700'
          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
      )}
      onClick={onSelect}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center mb-1">
          {page.isJournal && (
            <span className="text-blue-500 mr-2">📅</span>
          )}
          <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
            {page.title || page.name}
          </h3>
        </div>
        
        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
          <span>{formatRelativeTime(new Date(page.updatedAt))}</span>
          {page.tags.length > 0 && (
            <>
              <span className="mx-2">•</span>
              <div className="flex space-x-1">
                {page.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="text-xs">#{tag}</span>
                ))}
                {page.tags.length > 2 && (
                  <span className="text-xs">+{page.tags.length - 2}</span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      
      {showActions && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="ml-2 p-1 text-red-500 hover:text-red-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default PageManager;
