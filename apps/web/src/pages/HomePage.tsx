import React, { useEffect, useState } from 'react';
import { BlockTree } from '@minglog/editor';
import { Button } from '@minglog/ui';
import { useLogseqStore } from '../stores/logseq-store';
import { PageList } from '../components/PageList';
import type { Block, Page } from '@minglog/core';

export const HomePage: React.FC = () => {
  const {
    core,
    createBlock,
    updateBlock,
    deleteBlock,
    createPage,
  } = useLogseqStore();

  const [todayPage, setTodayPage] = useState<Page | null>(null);
  const [currentPage, setCurrentPage] = useState<Page | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);

  useEffect(() => {
    const initializeTodayPage = async () => {
      try {
        const page = await core.pages.createTodayJournal();
        setTodayPage(page);
        setCurrentPage(page);

        // Get blocks for today's page
        const pageBlocks = core.blocks.getBlocksByPage(page.id);
        setBlocks(pageBlocks);
      } catch (error) {
        console.error('Failed to initialize today page:', error);
      }
    };

    initializeTodayPage();
  }, [core]);

  const handleUpdateBlock = async (blockId: string, content: string) => {
    try {
      await updateBlock(blockId, content);
      // Refresh blocks
      if (currentPage) {
        const pageBlocks = core.blocks.getBlocksByPage(currentPage.id);
        setBlocks(pageBlocks);
      }
    } catch (error) {
      console.error('Failed to update block:', error);
    }
  };

  const handleCreateBlock = async (parentId?: string) => {
    if (!currentPage) return;

    try {
      await createBlock('', currentPage.id, parentId);
      // Refresh blocks
      const pageBlocks = core.blocks.getBlocksByPage(currentPage.id);
      setBlocks(pageBlocks);
    } catch (error) {
      console.error('Failed to create block:', error);
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    try {
      await deleteBlock(blockId);
      // Refresh blocks
      if (currentPage) {
        const pageBlocks = core.blocks.getBlocksByPage(currentPage.id);
        setBlocks(pageBlocks);
      }
    } catch (error) {
      console.error('Failed to delete block:', error);
    }
  };

  const handleIndentBlock = async (blockId: string) => {
    try {
      await core.blocks.indentBlock(blockId);
      // Refresh blocks
      if (todayPage) {
        const pageBlocks = core.blocks.getBlocksByPage(todayPage.id);
        setBlocks(pageBlocks);
      }
    } catch (error) {
      console.error('Failed to indent block:', error);
    }
  };

  const handleOutdentBlock = async (blockId: string) => {
    try {
      await core.blocks.outdentBlock(blockId);
      // Refresh blocks
      if (todayPage) {
        const pageBlocks = core.blocks.getBlocksByPage(todayPage.id);
        setBlocks(pageBlocks);
      }
    } catch (error) {
      console.error('Failed to outdent block:', error);
    }
  };

  const handleToggleCollapse = async (blockId: string) => {
    try {
      await core.blocks.toggleCollapse(blockId);
      // Refresh blocks
      if (todayPage) {
        const pageBlocks = core.blocks.getBlocksByPage(todayPage.id);
        setBlocks(pageBlocks);
      }
    } catch (error) {
      console.error('Failed to toggle collapse:', error);
    }
  };

  const handleFocusBlock = (blockId: string) => {
    setFocusedBlockId(blockId);
  };

  const handlePageSelect = (page: Page) => {
    setCurrentPage(page);
    // Load blocks for the selected page
    const pageBlocks = core.blocks.getBlocksByPage(page.id);
    setBlocks(pageBlocks);
    setFocusedBlockId(null);
  };

  if (!todayPage) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading today's journal...</div>
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
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              {currentPage?.title || currentPage?.name || 'Select a page'}
            </h1>
            {currentPage && (
              <Button
                onClick={() => handleCreateBlock()}
                variant="primary"
                size="sm"
              >
                Add Block
              </Button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {currentPage ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              {blocks.length > 0 ? (
                <BlockTree
                  blocks={blocks}
                  onUpdateBlock={handleUpdateBlock}
                  onCreateBlock={handleCreateBlock}
                  onDeleteBlock={handleDeleteBlock}
                  onIndentBlock={handleIndentBlock}
                  onOutdentBlock={handleOutdentBlock}
                  onToggleCollapse={handleToggleCollapse}
                  onFocusBlock={handleFocusBlock}
                  focusedBlockId={focusedBlockId}
                />
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-500 mb-4">
                    No blocks yet. Start writing your thoughts!
                  </div>
                  <Button
                    onClick={() => handleCreateBlock()}
                    variant="primary"
                  >
                    Create First Block
                  </Button>
                </div>
              )}
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
    </div>
  );
};
