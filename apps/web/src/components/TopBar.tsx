import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@minglog/ui';
import { useLogseqStore } from '../stores/logseq-store';
import { useApiStore } from '../stores/api-store';
import { EnhancedSearch } from './EnhancedSearch';
import { CreatePageModal } from './CreatePageModal';
import {
  Bars3Icon,
  MagnifyingGlassIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';

export const TopBar: React.FC = () => {
  const navigate = useNavigate();
  const {
    sidebarOpen,
    setSidebarOpen,
  } = useLogseqStore();

  const {
    setCurrentPage,
    createPage,
    currentGraph,
    pages,
  } = useApiStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQuickSearch, setShowQuickSearch] = useState(false);

  const handleSearchClick = () => {
    navigate('/search');
  };

  const handleQuickSearchResult = (result: any) => {
    setShowQuickSearch(false);

    if (result.type === 'page') {
      const page = pages.find(p => p.id === result.id);
      if (page) {
        setCurrentPage(page);
        navigate('/');
      }
    } else if (result.type === 'block' && result.metadata.pageId) {
      const page = pages.find(p => p.id === result.metadata.pageId);
      if (page) {
        setCurrentPage(page);
        navigate(`/?blockId=${result.id}`);
      }
    }
  };

  const handleCreatePage = async (name: string, isJournal: boolean) => {
    try {
      if (!currentGraph) {
        throw new Error('No graph selected');
      }
      const newPage = await createPage(name, currentGraph.id, isJournal);
      setCurrentPage(newPage);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Failed to create page:', error);
      throw error;
    }
  };

  // Global keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K for quick search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowQuickSearch(true);
      }

      // Escape to close quick search
      if (e.key === 'Escape' && showQuickSearch) {
        setShowQuickSearch(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showQuickSearch]);

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <Bars3Icon className="h-5 w-5" />
          </Button>
          
          <h1 className="text-xl font-semibold text-gray-900">
            MingLog
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          {/* Quick Search */}
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowQuickSearch(true)}
              className="text-gray-600 hover:text-gray-900"
            >
              <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
              搜索
              <kbd className="ml-2 px-1 py-0.5 text-xs bg-gray-100 border border-gray-300 rounded">
                ⌘K
              </kbd>
            </Button>

            {/* Quick Search Dropdown */}
            {showQuickSearch && (
              <div className="absolute top-full right-0 mt-2 w-96 z-50">
                <div className="bg-white border border-gray-200 rounded-lg shadow-lg">
                  <div className="p-4">
                    <EnhancedSearch
                      onResultSelect={handleQuickSearchResult}
                      placeholder="快速搜索..."
                      showFilters={false}
                      autoFocus={true}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Advanced Search */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSearchClick}
            className="text-gray-600 hover:text-gray-900"
          >
            高级搜索
          </Button>

          {/* Quick add */}
          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowCreateModal(true)}
            leftIcon={<PlusIcon className="h-4 w-4" />}
          >
            新建页面
          </Button>
        </div>
      </div>

      {/* Quick Search Overlay */}
      {showQuickSearch && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowQuickSearch(false)}
        />
      )}

      {/* Create Page Modal */}
      <CreatePageModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreatePage={handleCreatePage}
      />
    </header>
  );
};
