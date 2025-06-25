import React, { useState, useEffect } from 'react';
import { Button } from '@minglog/ui';
import { useLogseqStore } from '../stores/logseq-store';
import { CreatePageModal } from '../components/CreatePageModal';
import { PageSettings } from '../components/PageSettings';
import type { Page } from '@minglog/core';

export const PagesPage: React.FC = () => {
  const { core, initialize, createPage, updatePage, deletePage } = useLogseqStore();
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPageForSettings, setSelectedPageForSettings] = useState<Page | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'updated' | 'created'>('updated');
  const [filterBy, setFilterBy] = useState<'all' | 'journal' | 'regular'>('all');

  useEffect(() => {
    const loadPages = async () => {
      try {
        setLoading(true);
        await initialize();
        const allPages = await core.pages.getAllPages();
        setPages(allPages);
      } catch (error) {
        console.error('Failed to load pages:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPages();
  }, [core, initialize]);

  const handleCreatePage = async (name: string, isJournal: boolean) => {
    try {
      const newPage = await createPage(name, isJournal);
      setPages(prev => [...prev, newPage]);
    } catch (error) {
      console.error('Failed to create page:', error);
      throw error;
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
    } catch (error) {
      console.error('Failed to delete page:', error);
      throw error;
    }
  };

  // Filter and sort pages
  const filteredAndSortedPages = pages
    .filter(page => {
      // Filter by search query
      const matchesSearch = !searchQuery || 
        page.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      // Filter by type
      const matchesFilter = filterBy === 'all' || 
        (filterBy === 'journal' && page.isJournal) ||
        (filterBy === 'regular' && !page.isJournal);

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading pages...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">All Pages</h1>
        
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search pages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter */}
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Pages</option>
            <option value="regular">Regular Pages</option>
            <option value="journal">Journal Pages</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="updated">Last Updated</option>
            <option value="created">Date Created</option>
            <option value="name">Name</option>
          </select>

          {/* Create Button */}
          <Button
            onClick={() => setShowCreateModal(true)}
            variant="primary"
          >
            + New Page
          </Button>
        </div>

        {/* Stats */}
        <div className="text-sm text-gray-500 mb-4">
          Showing {filteredAndSortedPages.length} of {pages.length} pages
        </div>
      </div>

      {/* Pages Grid */}
      {filteredAndSortedPages.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            {searchQuery || filterBy !== 'all' ? 'No pages match your criteria' : 'No pages yet'}
          </div>
          {!searchQuery && filterBy === 'all' && (
            <Button
              onClick={() => setShowCreateModal(true)}
              variant="primary"
            >
              Create Your First Page
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedPages.map(page => (
            <div
              key={page.id}
              className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-medium text-gray-900 truncate">
                  {page.title || page.name}
                </h3>
                <button
                  onClick={() => setSelectedPageForSettings(page)}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded"
                  title="Page settings"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>

              <div className="text-sm text-gray-500 mb-2">
                {page.name !== (page.title || page.name) && (
                  <div>Name: {page.name}</div>
                )}
                <div>Updated: {new Date(page.updatedAt).toLocaleDateString()}</div>
                <div>Created: {new Date(page.createdAt).toLocaleDateString()}</div>
              </div>

              <div className="flex items-center gap-2 text-xs">
                {page.isJournal && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    📅 Journal
                  </span>
                )}
                {page.tags.map(tag => (
                  <span
                    key={tag}
                    className="bg-gray-100 text-gray-700 px-2 py-1 rounded"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

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
