import React, { useState, useEffect, useRef } from 'react';
import { Modal, ModalBody } from '@minglog/ui';
import { useLogseqStore } from '../stores/logseq-store';
import type { SearchResult } from '@minglog/core';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectResult?: (result: SearchResult) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectResult,
}) => {
  const { core, initialize } = useLogseqStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Perform search when query changes
  useEffect(() => {
    const performSearch = async () => {
      if (!query.trim()) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        await initialize();
        const searchResults = core.search.search(query, {
          includePages: true,
          includeBlocks: true,
          limit: 20,
        });
        setResults(searchResults);
        setSelectedIndex(0);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(performSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, core, initialize]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelectResult(results[selectedIndex]);
        }
        break;
      case 'Escape':
        onClose();
        break;
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    if (onSelectResult) {
      onSelectResult(result);
    }
    onClose();
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-yellow-200 text-yellow-900 px-1 rounded">
          {part}
        </mark>
      ) : part
    );
  };

  const getResultIcon = (result: SearchResult) => {
    if (result.type === 'page') {
      return result.metadata.isJournal ? '📅' : '📄';
    }
    return '📝';
  };

  const getResultTypeLabel = (result: SearchResult) => {
    if (result.type === 'page') {
      return result.metadata.isJournal ? 'Journal Page' : 'Page';
    }
    return 'Block';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      closeOnOverlayClick={true}
      closeOnEscape={true}
      showCloseButton={false}
    >
      <ModalBody className="p-0">
        {/* Search Input */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search pages and blocks..."
              className="block w-full pl-10 pr-3 py-3 border-0 text-lg placeholder-gray-500 focus:outline-none focus:ring-0"
            />
          </div>
        </div>

        {/* Search Results */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Searching...</div>
            </div>
          ) : query.trim() && results.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">No results found</div>
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => handleSelectResult(result)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                    index === selectedIndex ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 text-lg">
                      {getResultIcon(result)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {highlightText(result.title, query)}
                        </h3>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {getResultTypeLabel(result)}
                        </span>
                      </div>
                      
                      {result.excerpt && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {highlightText(result.excerpt, query)}
                        </p>
                      )}
                      
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                        {result.metadata.pageName && result.type === 'block' && (
                          <span>in {result.metadata.pageName}</span>
                        )}
                        {result.metadata.tags && result.metadata.tags.length > 0 && (
                          <span>
                            {result.metadata.tags.slice(0, 3).map(tag => `#${tag}`).join(' ')}
                          </span>
                        )}
                        <span>
                          {new Date(result.metadata.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex-shrink-0 text-xs text-gray-400">
                      {Math.round(result.score)}%
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-8 px-4 text-center text-gray-500">
              <div className="mb-2">
                <svg className="mx-auto h-12 w-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <p>Start typing to search pages and blocks</p>
              <div className="mt-4 text-xs text-gray-400">
                <div>Use ↑↓ to navigate</div>
                <div>Press Enter to select</div>
                <div>Press Esc to close</div>
              </div>
            </div>
          )}
        </div>
      </ModalBody>
    </Modal>
  );
};
