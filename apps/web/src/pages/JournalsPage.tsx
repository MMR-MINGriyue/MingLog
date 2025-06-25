import React, { useState, useEffect } from 'react';
import { Button } from '@minglog/ui';
import { useLogseqStore } from '../stores/logseq-store';
import type { Page } from '@minglog/core';

export const JournalsPage: React.FC = () => {
  const { core, initialize, createPage } = useLogseqStore();
  const [journalPages, setJournalPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadJournalPages = async () => {
      try {
        setLoading(true);
        await initialize();
        const journals = await core.pages.getJournalPages();
        setJournalPages(journals);
      } catch (error) {
        console.error('Failed to load journal pages:', error);
      } finally {
        setLoading(false);
      }
    };

    loadJournalPages();
  }, [core, initialize]);

  const handleCreateTodayJournal = async () => {
    try {
      const todayPage = await core.pages.createTodayJournal();
      setJournalPages(prev => {
        const exists = prev.find(p => p.id === todayPage.id);
        if (exists) return prev;
        return [todayPage, ...prev];
      });
    } catch (error) {
      console.error('Failed to create today journal:', error);
    }
  };

  const handleCreateCustomJournal = () => {
    const dateStr = prompt('Enter date (YYYY-MM-DD):');
    if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      createPage(dateStr, true).then(newPage => {
        setJournalPages(prev => [newPage, ...prev]);
      }).catch(error => {
        console.error('Failed to create journal:', error);
        alert('Failed to create journal page. Please try again.');
      });
    } else if (dateStr) {
      alert('Please enter a valid date in YYYY-MM-DD format');
    }
  };

  // Filter journal pages
  const filteredJournals = journalPages.filter(page =>
    !searchQuery || 
    page.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Group journals by month
  const groupedJournals = filteredJournals.reduce((groups, page) => {
    if (!page.journalDate) return groups;
    
    const date = new Date(page.journalDate);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    
    if (!groups[monthKey]) {
      groups[monthKey] = {
        name: monthName,
        pages: []
      };
    }
    
    groups[monthKey].pages.push(page);
    return groups;
  }, {} as Record<string, { name: string; pages: Page[] }>);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading journal pages...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Journal Pages</h1>
        
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          {/* Search */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search journal pages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleCreateTodayJournal}
              variant="primary"
            >
              📅 Today's Journal
            </Button>
            <Button
              onClick={handleCreateCustomJournal}
              variant="secondary"
            >
              + Custom Date
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="text-sm text-gray-500 mb-4">
          {filteredJournals.length} journal pages
        </div>
      </div>

      {/* Journal Pages */}
      {filteredJournals.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            {searchQuery ? 'No journal pages match your search' : 'No journal pages yet'}
          </div>
          {!searchQuery && (
            <div className="space-x-2">
              <Button
                onClick={handleCreateTodayJournal}
                variant="primary"
              >
                Create Today's Journal
              </Button>
              <Button
                onClick={handleCreateCustomJournal}
                variant="secondary"
              >
                Create Custom Date
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedJournals)
            .sort(([a], [b]) => b.localeCompare(a)) // Sort by month descending
            .map(([monthKey, group]) => (
              <div key={monthKey}>
                <h2 className="text-lg font-semibold text-gray-800 mb-3">
                  {group.name}
                </h2>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {group.pages
                    .sort((a, b) => (b.journalDate || '').localeCompare(a.journalDate || ''))
                    .map(page => {
                      const date = page.journalDate ? new Date(page.journalDate) : new Date();
                      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                      const dayNumber = date.getDate();
                      
                      return (
                        <div
                          key={page.id}
                          className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => {
                            // Navigate to the journal page
                            window.location.href = `/?page=${page.id}`;
                          }}
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex flex-col items-center justify-center">
                              <div className="text-xs text-blue-600 font-medium">{dayName}</div>
                              <div className="text-lg font-bold text-blue-800">{dayNumber}</div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-gray-900 truncate">
                                {page.title || page.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {page.journalDate}
                              </div>
                            </div>
                          </div>

                          <div className="text-xs text-gray-400">
                            Updated: {new Date(page.updatedAt).toLocaleDateString()}
                          </div>

                          {page.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {page.tags.slice(0, 3).map(tag => (
                                <span
                                  key={tag}
                                  className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs"
                                >
                                  #{tag}
                                </span>
                              ))}
                              {page.tags.length > 3 && (
                                <span className="text-gray-400 text-xs">
                                  +{page.tags.length - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
};
