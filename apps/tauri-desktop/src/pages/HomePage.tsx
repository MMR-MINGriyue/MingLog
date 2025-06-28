import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { Link } from 'react-router-dom';
import { FileText, Plus, Search, Clock } from 'lucide-react';

interface Page {
  id: string;
  title: string;
  content: string;
  created_at: number;
  updated_at: number;
}

export const HomePage: React.FC = () => {
  const [pages, setPages] = useState<Page[]>([]);
  const [allPages, setAllPages] = useState<Page[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadPages();
  }, []);

  useEffect(() => {
    const searchPages = async () => {
      if (searchQuery.trim() === '') {
        setPages(allPages);
        return;
      }

      try {
        setIsSearching(true);
        const searchResults = await invoke('search_pages', { query: searchQuery }) as string;
        const parsedResults = JSON.parse(searchResults) as Page[];
        setPages(parsedResults);
      } catch (error) {
        console.error('Failed to search pages:', error);
        setPages([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchPages, 300); // Debounce search
    return () => clearTimeout(timeoutId);
  }, [searchQuery, allPages]);

  const loadPages = async () => {
    try {
      setIsLoading(true);
      const pagesData = await invoke('get_recent_pages', { limit: 50 }) as string;
      const parsedPages = JSON.parse(pagesData) as Page[];
      setAllPages(parsedPages);
      setPages(parsedPages);
    } catch (error) {
      console.error('Failed to load pages:', error);
      // Set empty array on error to prevent UI issues
      setAllPages([]);
      setPages([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Pages are already filtered by the backend search

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Welcome to MingLog</h1>
          <Link
            to="/editor"
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            <span>New Page</span>
          </Link>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search pages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        {pages.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {allPages.length === 0 ? 'No pages yet' : 'No pages found'}
            </h3>
            <p className="text-gray-600 mb-6">
              {allPages.length === 0
                ? 'Create your first page to get started with MingLog.'
                : 'Try adjusting your search query.'}
            </p>
            {allPages.length === 0 && (
              <Link
                to="/editor"
                className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={18} />
                <span>Create First Page</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pages.map((page) => (
              <Link
                key={page.id}
                to={`/editor/${page.id}`}
                className="block p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-900 truncate flex-1">
                    {page.title || 'Untitled'}
                  </h3>
                  <FileText className="text-gray-400 ml-2" size={16} />
                </div>
                
                <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                  {page.content.substring(0, 150)}
                  {page.content.length > 150 && '...'}
                </p>
                
                <div className="flex items-center text-xs text-gray-500">
                  <Clock size={12} className="mr-1" />
                  <span>Updated {formatDate(page.updated_at)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
