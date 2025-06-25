import React, { useEffect, useState } from 'react';
import { useApiStore } from '../stores/api-store';
import { PageList } from '../components/PageList';
import { PageEditor } from '../components/PageEditor';
import { LoadingSpinner, ErrorMessage, useToast } from '@minglog/ui';
import type { Page } from '../services/api';

export const HomePage: React.FC = () => {
  const {
    initialize,
    isInitialized,
    isLoading,
    error,
    currentGraph,
    currentPage,
    setCurrentPage,
    createTodayJournal,
  } = useApiStore();

  const [todayPage, setTodayPage] = useState<Page | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    const initializeTodayPage = async () => {
      try {
        await initialize();

        if (currentGraph) {
          const page = await createTodayJournal(currentGraph.id);
          setTodayPage(page);
          setCurrentPage(page);

          addToast({
            type: 'success',
            title: '欢迎回来！',
            message: '今日日记已准备就绪',
            duration: 3000
          });
        }
      } catch (error) {
        console.error('Failed to initialize today page:', error);
        addToast({
          type: 'error',
          title: '初始化失败',
          message: '无法创建今日日记，请稍后重试',
          duration: 5000
        });
      }
    };

    initializeTodayPage();
  }, [initialize, currentGraph, createTodayJournal, setCurrentPage, addToast]);

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
