import React, { useEffect, useState } from 'react';
import { useLogseqStore, core } from '../stores/logseq-store';
import { PageList } from '../components/PageList';
import { PageEditor } from '../components/PageEditor';
import { LoadingSpinner, ErrorMessage, useToast } from '@minglog/ui';
import type { Page } from '@minglog/core';

export const HomePage: React.FC = () => {
  const {
    initialize,
    isInitialized,
    currentPage,
    setCurrentPage,
  } = useLogseqStore();

  const [todayPage, setTodayPage] = useState<Page | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    const initializeTodayPage = async () => {
      try {
        setIsLoading(true);
        await initialize();

        // Create today's journal page
        const page = await core.pages.createTodayJournal();
        setTodayPage(page);
        setCurrentPage(page);
        setError(null);
      } catch (error) {
        console.error('Failed to initialize today page:', error);
        setError('无法创建今日日记，请稍后重试');
      } finally {
        setIsLoading(false);
      }
    };

    if (!isInitialized) {
      initializeTodayPage();
    }
  }, [initialize, setCurrentPage, isInitialized]);

  const handlePageSelect = (page: Page) => {
    setCurrentPage(page);
  };

  if (isLoading || !isInitialized) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner
          size="lg"
          text="正在初始化 MingLog..."
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <ErrorMessage
          title="初始化失败"
          message={error}
          type="error"
          onRetry={() => window.location.reload()}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Page List Sidebar */}
      <PageList
        onPageSelect={handlePageSelect}
        selectedPageId={currentPage?.id}
      />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {currentPage ? (
          <div className="p-6">
            <PageEditor page={currentPage} />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-gray-500 text-lg mb-4">
                Welcome to MingLog
              </div>
              <div className="text-gray-400">
                Select a page from the sidebar to start editing
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
