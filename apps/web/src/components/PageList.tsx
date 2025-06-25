import React, { useState, useEffect } from 'react';
import { Page } from '../services/api';
import { useApiStore } from '../stores/api-store';
import {
  LoadingSpinner,
  EmptyPages,
  ErrorMessage,
  useToast,
  ListSkeleton
} from '@minglog/ui';
import { CreatePageModal } from './CreatePageModal';
import { PageSettings } from './PageSettings';

interface PageListProps {
  onPageSelect: (page: Page) => void;
  selectedPageId?: string;
}

export const PageList: React.FC<PageListProps> = ({
  onPageSelect,
  selectedPageId,
}) => {
  const {
    pages,
    currentGraph,
    isLoading,
    error,
    createPage,
    updatePage,
    deletePage,
    loadPages
  } = useApiStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPageForSettings, setSelectedPageForSettings] = useState<Page | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const { addToast } = useToast();

  useEffect(() => {
    if (currentGraph) {
      loadPages(currentGraph.id);
    }
  }, [currentGraph, loadPages]);

  const filteredPages = pages.filter(page =>
    page.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreatePage = async (name: string, isJournal: boolean) => {
    if (!currentGraph) {
      addToast({
        type: 'error',
        title: '创建失败',
        message: '没有选择图谱',
      });
      return;
    }

    setIsCreating(true);
    try {
      const newPage = await createPage(name, currentGraph.id, isJournal);
      onPageSelect(newPage);
      setShowCreateModal(false);

      addToast({
        type: 'success',
        title: '页面创建成功',
        message: `页面"${name}"已创建`,
        duration: 3000
      });
    } catch (error) {
      console.error('Failed to create page:', error);
      addToast({
        type: 'error',
        title: '创建失败',
        message: error instanceof Error ? error.message : '创建页面时发生错误',
      });
      throw error; // Re-throw to let modal handle the error
    } finally {
      setIsCreating(false);
    }
  };

  const handleUpdatePage = async (page: Page, updates: Partial<Page>) => {
    try {
      const updatedPage = await updatePage(page.id, updates);
      setPages(prev => prev.map(p => p.id === page.id ? updatedPage : p));
    } catch (error) {
      console.error('Failed to update page:', error);
      throw error;
    }
  };

  const handleDeletePage = async (page: Page) => {
    try {
      await deletePage(page.id);
      setPages(prev => prev.filter(p => p.id !== page.id));
      // If the deleted page was selected, clear selection
      if (selectedPageId === page.id) {
        // Select the first available page or none
        const remainingPages = pages.filter(p => p.id !== page.id);
        if (remainingPages.length > 0) {
          onPageSelect(remainingPages[0]);
        }
      }
    } catch (error) {
      console.error('Failed to delete page:', error);
      throw error;
    }
  };

  return (
    <div className="w-64 bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Pages</h2>
        
        {/* Search */}
        <input
          type="text"
          placeholder="Search pages..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        {/* Create Page Button */}
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full mt-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          + New Page
        </button>
      </div>

      {/* Page List */}
      <div className="flex-1 overflow-y-auto">
        {error ? (
          <div className="p-4">
            <ErrorMessage
              title="加载失败"
              message={error}
              type="error"
              onRetry={() => currentGraph && loadPages(currentGraph.id)}
            />
          </div>
        ) : isLoading ? (
          <div className="p-4">
            <ListSkeleton items={5} />
          </div>
        ) : filteredPages.length === 0 ? (
          <div className="p-4">
            {searchQuery ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <svg className="w-12 h-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-sm">没有找到包含"{searchQuery}"的页面</p>
              </div>
            ) : (
              <EmptyPages onCreatePage={() => setShowCreateModal(true)} />
            )}
          </div>
        ) : (
          <div className="p-2">
            {filteredPages.map(page => (
              <div key={page.id} className="group relative">
                <button
                  onClick={() => onPageSelect(page)}
                  className={`w-full text-left p-2 rounded-md text-sm transition-colors ${
                    selectedPageId === page.id
                      ? 'bg-blue-100 text-blue-900 border border-blue-200'
                      : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <div className="font-medium truncate">
                    {page.title || page.name}
                  </div>
                  {page.isJournal && (
                    <div className="text-xs text-gray-500 mt-1">
                      📅 Journal
                    </div>
                  )}
                  {page.tags.length > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      {page.tags.map(tag => `#${tag}`).join(' ')}
                    </div>
                  )}
                </button>

                {/* Settings button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPageForSettings(page);
                  }}
                  className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 rounded transition-opacity"
                  title="Page settings"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Page Modal */}
      <CreatePageModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreatePage={handleCreatePage}
      />

      {/* Page Settings Modal */}
      {selectedPageForSettings && (
        <PageSettings
          page={selectedPageForSettings}
          onUpdatePage={(updates) => handleUpdatePage(selectedPageForSettings, updates)}
          onDeletePage={() => handleDeletePage(selectedPageForSettings)}
          onClose={() => setSelectedPageForSettings(null)}
        />
      )}
    </div>
  );
};
