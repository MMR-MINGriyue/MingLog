/**
 * 图谱选择器组件
 * Graph Selector Component
 */

import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { useLocale } from '../hooks/useLocale';

export interface Graph {
  id: string;
  name: string;
  path: string;
  settings?: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

interface GraphSelectorProps {
  graphs: Graph[];
  currentGraph: Graph | null;
  onGraphSelect: (graph: Graph) => void;
  onCreateGraph: () => void;
  loading?: boolean;
  className?: string;
  variant?: 'dropdown' | 'sidebar' | 'modal';
  showCreateButton?: boolean;
}

export const GraphSelector: React.FC<GraphSelectorProps> = ({
  graphs,
  currentGraph,
  onGraphSelect,
  onCreateGraph,
  loading = false,
  className,
  variant = 'dropdown',
  showCreateButton = true,
}) => {
  const { t } = useLocale();
  const [isOpen, setIsOpen] = useState(false);

  if (variant === 'dropdown') {
    return (
      <div className={clsx('relative', className)}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={loading}
          className={clsx(
            'w-full flex items-center justify-between px-3 py-2 text-left',
            'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600',
            'rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
            'text-gray-900 dark:text-gray-100',
            loading && 'opacity-50 cursor-not-allowed'
          )}
        >
          <div className="flex items-center min-w-0">
            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="truncate">
              {loading ? t('common.loading') : (currentGraph?.name || t('graph.selectGraph'))}
            </span>
          </div>
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isOpen && !loading && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg">
            <div className="py-1 max-h-60 overflow-y-auto">
              {graphs.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                  {t('graph.noGraphs')}
                </div>
              ) : (
                graphs.map((graph) => (
                  <button
                    key={graph.id}
                    type="button"
                    onClick={() => {
                      onGraphSelect(graph);
                      setIsOpen(false);
                    }}
                    className={clsx(
                      'w-full text-left px-3 py-2 text-sm transition-colors',
                      currentGraph?.id === graph.id
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                        : 'text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                    )}
                  >
                    <div className="font-medium">{graph.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {graph.path}
                    </div>
                  </button>
                ))
              )}
              
              {showCreateButton && (
                <>
                  <div className="border-t border-gray-200 dark:border-gray-600 my-1" />
                  <button
                    type="button"
                    onClick={() => {
                      onCreateGraph();
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                  >
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      {t('graph.createGraph')}
                    </div>
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Backdrop */}
        {isOpen && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
        )}
      </div>
    );
  }

  if (variant === 'sidebar') {
    return (
      <div className={clsx('space-y-2', className)}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {t('graph.title')}
          </h3>
          {showCreateButton && (
            <button
              type="button"
              onClick={onCreateGraph}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title={t('graph.createGraph')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            ))}
          </div>
        ) : graphs.length === 0 ? (
          <div className="text-center py-4">
            <div className="text-gray-400 dark:text-gray-600 mb-2">
              <svg className="w-8 h-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
              {t('graph.noGraphs')}
            </p>
            {showCreateButton && (
              <button
                type="button"
                onClick={onCreateGraph}
                className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
              >
                {t('graph.createGraph')}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {graphs.map((graph) => (
              <button
                key={graph.id}
                type="button"
                onClick={() => onGraphSelect(graph)}
                className={clsx(
                  'w-full text-left p-2 rounded-md text-sm transition-colors',
                  currentGraph?.id === graph.id
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 border border-blue-200 dark:border-blue-700'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                <div className="font-medium truncate">{graph.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {graph.path}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return null;
};

// 图谱状态指示器
export const GraphStatus: React.FC<{
  graph: Graph | null;
  className?: string;
}> = ({ graph, className }) => {
  const { t } = useLocale();

  if (!graph) {
    return (
      <div className={clsx('flex items-center text-amber-600 dark:text-amber-400', className)}>
        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <span className="text-sm">{t('graph.noGraphSelected')}</span>
      </div>
    );
  }

  return (
    <div className={clsx('flex items-center text-green-600 dark:text-green-400', className)}>
      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="text-sm">{graph.name}</span>
    </div>
  );
};

export default GraphSelector;
