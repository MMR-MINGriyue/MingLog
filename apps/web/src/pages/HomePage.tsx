import React, { useEffect, useState } from 'react';
import { BlockTree } from '@minglog/editor';
import { Button } from '@minglog/ui';
import { useLogseqStore } from '../stores/logseq-store';
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
  const [blocks, setBlocks] = useState<Block[]>([]);

  useEffect(() => {
    const initializeTodayPage = async () => {
      try {
        const page = await core.pages.createTodayJournal();
        setTodayPage(page);
        
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
      if (todayPage) {
        const pageBlocks = core.blocks.getBlocksByPage(todayPage.id);
        setBlocks(pageBlocks);
      }
    } catch (error) {
      console.error('Failed to update block:', error);
    }
  };

  const handleCreateBlock = async (parentId?: string) => {
    if (!todayPage) return;
    
    try {
      await createBlock('', todayPage.id, parentId);
      // Refresh blocks
      const pageBlocks = core.blocks.getBlocksByPage(todayPage.id);
      setBlocks(pageBlocks);
    } catch (error) {
      console.error('Failed to create block:', error);
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    try {
      await deleteBlock(blockId);
      // Refresh blocks
      if (todayPage) {
        const pageBlocks = core.blocks.getBlocksByPage(todayPage.id);
        setBlocks(pageBlocks);
      }
    } catch (error) {
      console.error('Failed to delete block:', error);
    }
  };

  if (!todayPage) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading today's journal...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">
          {todayPage.name}
        </h1>
        <Button
          onClick={() => handleCreateBlock()}
          variant="primary"
          size="sm"
        >
          Add Block
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {blocks.length > 0 ? (
          <BlockTree
            blocks={blocks}
            onUpdateBlock={handleUpdateBlock}
            onCreateBlock={handleCreateBlock}
            onDeleteBlock={handleDeleteBlock}
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

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">{blocks.length}</div>
          <div className="text-sm text-gray-500">Blocks Today</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-green-600">
            {core.pages.getAllPages().length}
          </div>
          <div className="text-sm text-gray-500">Total Pages</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="text-2xl font-bold text-purple-600">
            {core.pages.getJournalPages().length}
          </div>
          <div className="text-sm text-gray-500">Journal Days</div>
        </div>
      </div>
    </div>
  );
};
