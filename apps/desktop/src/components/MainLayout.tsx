/**
 * 桌面应用主布局组件
 * Desktop App Main Layout Component
 */

import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import {
  GraphSelector,
  GraphStatus,
  CreateGraphModal,
  PageManager,
  DataManager,
  LanguageToggle,
  ThemeToggle,
  LocaleProvider,
  useLocale,
} from '@minglog/ui';
import { MubuStyleBlockTree } from '@minglog/editor';
import type { Graph, Page } from '@minglog/ui';

interface MainLayoutProps {
  className?: string;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ className }) => {
  return (
    <LocaleProvider>
      <MainLayoutContent className={className} />
    </LocaleProvider>
  );
};

const MainLayoutContent: React.FC<MainLayoutProps> = ({ className }) => {
  const { t } = useLocale();
  
  // 状态管理
  const [graphs, setGraphs] = useState<Graph[]>([]);
  const [currentGraph, setCurrentGraph] = useState<Graph | null>(null);
  const [pages, setPages] = useState<Page[]>([]);
  const [currentPage, setCurrentPage] = useState<Page | null>(null);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'pages' | 'data'>('pages');
  
  // 模态框状态
  const [showCreateGraphModal, setShowCreateGraphModal] = useState(false);
  const [showDataManager, setShowDataManager] = useState(false);

  // 初始化数据
  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    setLoading(true);
    try {
      // 这里应该从实际的数据源加载数据
      // 暂时使用模拟数据
      const mockGraphs: Graph[] = [
        {
          id: '1',
          name: '个人知识库',
          path: 'personal-knowledge',
          createdAt: Date.now() - 86400000,
          updatedAt: Date.now() - 3600000,
        },
        {
          id: '2',
          name: '工作笔记',
          path: 'work-notes',
          createdAt: Date.now() - 172800000,
          updatedAt: Date.now() - 7200000,
        },
      ];
      
      setGraphs(mockGraphs);
      setCurrentGraph(mockGraphs[0]);
      
      // 加载页面数据
      if (mockGraphs[0]) {
        await loadPagesForGraph(mockGraphs[0].id);
      }
    } catch (error) {
      console.error('Failed to initialize data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPagesForGraph = async (graphId: string) => {
    try {
      // 这里应该从实际的数据源加载页面
      const mockPages: Page[] = [
        {
          id: '1',
          name: '欢迎页面',
          title: '欢迎使用 MingLog',
          tags: ['欢迎', '介绍'],
          isJournal: false,
          createdAt: Date.now() - 86400000,
          updatedAt: Date.now() - 3600000,
          graphId,
        },
        {
          id: '2',
          name: '今日日记',
          title: '2025-06-27 日记',
          tags: ['日记'],
          isJournal: true,
          journalDate: '2025-06-27',
          createdAt: Date.now() - 3600000,
          updatedAt: Date.now() - 1800000,
          graphId,
        },
      ];
      
      setPages(mockPages);
      setCurrentPage(mockPages[0]);
    } catch (error) {
      console.error('Failed to load pages:', error);
    }
  };

  // 图谱操作
  const handleGraphSelect = async (graph: Graph) => {
    setCurrentGraph(graph);
    setCurrentPage(null);
    await loadPagesForGraph(graph.id);
  };

  const handleCreateGraph = async (name: string, path: string) => {
    try {
      const newGraph: Graph = {
        id: Date.now().toString(),
        name,
        path,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      setGraphs(prev => [...prev, newGraph]);
      setCurrentGraph(newGraph);
      setPages([]);
      setCurrentPage(null);
    } catch (error) {
      console.error('Failed to create graph:', error);
      throw error;
    }
  };

  // 页面操作
  const handlePageSelect = (page: Page) => {
    setCurrentPage(page);
    // 加载页面的块数据
    loadBlocksForPage(page.id);
  };

  const handleCreatePage = async () => {
    if (!currentGraph) {
      alert(t('graph.selectGraphFirst'));
      return;
    }

    const name = prompt(t('pages.enterPageName'));
    if (!name?.trim()) return;

    try {
      const newPage: Page = {
        id: Date.now().toString(),
        name: name.trim(),
        title: name.trim(),
        tags: [],
        isJournal: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        graphId: currentGraph.id,
      };
      
      setPages(prev => [...prev, newPage]);
      setCurrentPage(newPage);
    } catch (error) {
      console.error('Failed to create page:', error);
    }
  };

  const handleDeletePage = async (page: Page) => {
    if (!confirm(t('pages.confirmDelete'))) return;

    try {
      setPages(prev => prev.filter(p => p.id !== page.id));
      if (currentPage?.id === page.id) {
        setCurrentPage(null);
      }
    } catch (error) {
      console.error('Failed to delete page:', error);
    }
  };

  const handleUpdatePage = async (page: Page, updates: Partial<Page>) => {
    try {
      const updatedPage = { ...page, ...updates, updatedAt: Date.now() };
      setPages(prev => prev.map(p => p.id === page.id ? updatedPage : p));
      if (currentPage?.id === page.id) {
        setCurrentPage(updatedPage);
      }
    } catch (error) {
      console.error('Failed to update page:', error);
    }
  };

  const loadBlocksForPage = async (pageId: string) => {
    try {
      // 这里应该从实际的数据源加载块
      const mockBlocks = [
        {
          id: '1',
          content: '欢迎使用 MingLog！',
          pageId,
          order: 0,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: '2',
          content: '这是一个现代化的知识管理工具。',
          pageId,
          order: 1,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ];
      
      setBlocks(mockBlocks);
    } catch (error) {
      console.error('Failed to load blocks:', error);
    }
  };

  // 数据管理操作
  const handleImportData = async (data: any, format: 'json' | 'markdown' | 'csv') => {
    try {
      console.log('Importing data:', { data, format });
      // 实现数据导入逻辑
    } catch (error) {
      console.error('Failed to import data:', error);
      throw error;
    }
  };

  const handleExportData = async (format: 'json' | 'markdown' | 'csv') => {
    try {
      console.log('Exporting data in format:', format);
      // 实现数据导出逻辑
    } catch (error) {
      console.error('Failed to export data:', error);
      throw error;
    }
  };

  const handleBackupData = async () => {
    try {
      console.log('Creating backup...');
      // 实现数据备份逻辑
    } catch (error) {
      console.error('Failed to backup data:', error);
      throw error;
    }
  };

  const handleRestoreData = async (backupData: any) => {
    try {
      console.log('Restoring data:', backupData);
      // 实现数据恢复逻辑
    } catch (error) {
      console.error('Failed to restore data:', error);
      throw error;
    }
  };

  return (
    <div className={clsx('flex h-screen bg-gray-100 dark:bg-gray-900', className)}>
      {/* 侧边栏 */}
      <div className={clsx(
        'flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300',
        sidebarCollapsed ? 'w-16' : 'w-80'
      )}>
        {/* 侧边栏头部 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          {!sidebarCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">M</span>
              </div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                MingLog
              </h1>
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <LanguageToggle size="sm" />
            <ThemeToggle size="sm" />
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {!sidebarCollapsed && (
          <>
            {/* 图谱选择器 */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <GraphSelector
                graphs={graphs}
                currentGraph={currentGraph}
                onGraphSelect={handleGraphSelect}
                onCreateGraph={() => setShowCreateGraphModal(true)}
                loading={loading}
                variant="dropdown"
              />
              <div className="mt-2">
                <GraphStatus graph={currentGraph} />
              </div>
            </div>

            {/* 标签页 */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setActiveTab('pages')}
                className={clsx(
                  'flex-1 px-4 py-2 text-sm font-medium transition-colors',
                  activeTab === 'pages'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                )}
              >
                {t('pages.title')}
              </button>
              <button
                onClick={() => setActiveTab('data')}
                className={clsx(
                  'flex-1 px-4 py-2 text-sm font-medium transition-colors',
                  activeTab === 'data'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                )}
              >
                {t('data.title')}
              </button>
            </div>

            {/* 标签页内容 */}
            <div className="flex-1 overflow-hidden">
              {activeTab === 'pages' ? (
                <PageManager
                  pages={pages}
                  currentPage={currentPage}
                  currentGraph={currentGraph}
                  onPageSelect={handlePageSelect}
                  onCreatePage={handleCreatePage}
                  onDeletePage={handleDeletePage}
                  onUpdatePage={handleUpdatePage}
                  loading={loading}
                />
              ) : (
                <div className="p-4 overflow-y-auto h-full">
                  <DataManager
                    onImportData={handleImportData}
                    onExportData={handleExportData}
                    onBackupData={handleBackupData}
                    onRestoreData={handleRestoreData}
                    loading={loading}
                  />
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {currentPage ? (
          <>
            {/* 页面头部 */}
            <div className="flex-shrink-0 p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {currentPage.title || currentPage.name}
                  </h2>
                  {currentPage.isJournal && (
                    <div className="flex items-center mt-1 text-sm text-gray-500 dark:text-gray-400">
                      <span className="mr-1">📅</span>
                      {currentPage.journalDate}
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {t('pages.lastModified')}: {new Date(currentPage.updatedAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* 编辑器区域 */}
            <div className="flex-1 overflow-y-auto p-6">
              <MubuStyleBlockTree
                blocks={blocks}
                onUpdateBlock={(blockId, content) => {
                  setBlocks(prev => prev.map(b => 
                    b.id === blockId ? { ...b, content, updatedAt: Date.now() } : b
                  ));
                }}
                onCreateBlock={(parentId, order) => {
                  const newBlock = {
                    id: Date.now().toString(),
                    content: '',
                    pageId: currentPage.id,
                    parentId,
                    order: order || blocks.length,
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                  };
                  setBlocks(prev => [...prev, newBlock]);
                }}
                onDeleteBlock={(blockId) => {
                  setBlocks(prev => prev.filter(b => b.id !== blockId));
                }}
                onIndentBlock={(blockId) => {
                  console.log('Indent block:', blockId);
                }}
                onOutdentBlock={(blockId) => {
                  console.log('Outdent block:', blockId);
                }}
                onToggleCollapse={(blockId) => {
                  console.log('Toggle collapse:', blockId);
                }}
                onFocusBlock={(blockId) => {
                  console.log('Focus block:', blockId);
                }}
                onMoveBlock={(blockId, direction) => {
                  console.log('Move block:', blockId, direction);
                }}
                onDuplicateBlock={(blockId) => {
                  const block = blocks.find(b => b.id === blockId);
                  if (block) {
                    const newBlock = {
                      ...block,
                      id: Date.now().toString(),
                      createdAt: Date.now(),
                      updatedAt: Date.now(),
                    };
                    setBlocks(prev => [...prev, newBlock]);
                  }
                }}
                showConnectors={true}
                compactMode={false}
              />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-gray-400 dark:text-gray-600 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                {t('pages.selectPageToStart')}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {currentGraph ? t('pages.selectFromSidebar') : t('graph.selectGraphFirst')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* 模态框 */}
      <CreateGraphModal
        isOpen={showCreateGraphModal}
        onClose={() => setShowCreateGraphModal(false)}
        onCreateGraph={handleCreateGraph}
      />
    </div>
  );
};

export default MainLayout;
