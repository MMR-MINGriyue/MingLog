import React, { useState, useEffect } from 'react';
import { Page } from '@minglog/core';
import { core } from '../stores/logseq-store';

interface PageListProps {
  onPageSelect: (page: Page) => void;
  selectedPageId?: string;
}

export const PageList: React.FC<PageListProps> = ({
  onPageSelect,
  selectedPageId,
}) => {
  const [pages, setPages] = useState<Page[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Load all pages
    const allPages = core.pages.getAllPages();
    setPages(allPages);
  }, []);

  const filteredPages = pages.filter(page =>
    page.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreatePage = () => {
    const pageName = prompt('Enter page name:');
    if (pageName && pageName.trim()) {
      core.pages.createPage(pageName.trim()).then(newPage => {
        setPages(prev => [...prev, newPage]);
        onPageSelect(newPage);
      });
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
          onClick={handleCreatePage}
          className="w-full mt-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          + New Page
        </button>
      </div>

      {/* Page List */}
      <div className="flex-1 overflow-y-auto">
        {filteredPages.length === 0 ? (
          <div className="p-4 text-gray-500 text-sm">
            {searchQuery ? 'No pages found' : 'No pages yet'}
          </div>
        ) : (
          <div className="p-2">
            {filteredPages.map(page => (
              <button
                key={page.id}
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
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
