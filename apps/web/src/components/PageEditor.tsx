import React, { useState, useEffect, useCallback } from 'react';
import { DraggableBlockTree } from '@minglog/editor';
import { Button, LoadingSpinner, EmptyBlocks, ErrorMessage, useToast } from '@minglog/ui';
import { useLogseqStore, core } from '../stores/logseq-store';
import type { Block, Page } from '@minglog/core';

interface PageEditorProps {
  page: Page;
  onPageChange?: (page: Page) => void;
}

export const PageEditor: React.FC<PageEditorProps> = ({
  page,
  onPageChange,
}) => {
  const { currentGraph } = useLogseqStore();

  const [blocks, setBlocks] = useState<Block[]>([]);
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [isCreatingBlock, setIsCreatingBlock] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToast();

  // Load blocks for the current page
  useEffect(() => {
    const loadBlocks = async () => {
      if (page) {
        try {
          setIsLoading(true);
          const pageBlocks = core.blocks.getBlocksByPage(page.id);
          setBlocks(pageBlocks);
          setError(null);
        } catch (error) {
          console.error('Failed to load blocks:', error);
          setError('Failed to load blocks');
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadBlocks();
  }, [page.id]);

  // Refresh blocks helper
  const refreshBlocks = useCallback(async () => {
    if (page) {
      const pageBlocks = core.blocks.getBlocksByPage(page.id);
      setBlocks(pageBlocks);
    }
  }, [page.id]);

  const handleUpdateBlock = async (blockId: string, content: string) => {
    try {
      await core.blocks.updateBlock(blockId, { content });
      await refreshBlocks();
    } catch (error) {
      console.error('Failed to update block:', error);
    }
  };

  const handleCreateBlock = async (parentId?: string) => {
    if (!currentGraph) {
      addToast({
        type: 'error',
        title: '创建失败',
        message: '没有选择图谱',
      });
      return;
    }

    setIsCreatingBlock(true);
    try {
      const newBlock = await core.blocks.createBlock('', page.id, parentId);
      await refreshBlocks();
      setFocusedBlockId(newBlock.id);

      addToast({
        type: 'success',
        title: '块创建成功',
        message: '新的内容块已添加',
        duration: 2000
      });
    } catch (error) {
      console.error('Failed to create block:', error);
      addToast({
        type: 'error',
        title: '创建失败',
        message: error instanceof Error ? error.message : '创建块时发生错误',
      });
    } finally {
      setIsCreatingBlock(false);
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    try {
      await core.blocks.deleteBlock(blockId);
      await refreshBlocks();
      setFocusedBlockId(null);
    } catch (error) {
      console.error('Failed to delete block:', error);
    }
  };

  const handleIndentBlock = async (blockId: string) => {
    try {
      await core.blocks.indentBlock(blockId);
      await refreshBlocks();
    } catch (error) {
      console.error('Failed to indent block:', error);
    }
  };

  const handleOutdentBlock = async (blockId: string) => {
    try {
      await core.blocks.outdentBlock(blockId);
      await refreshBlocks();
    } catch (error) {
      console.error('Failed to outdent block:', error);
    }
  };

  const handleToggleCollapse = async (blockId: string) => {
    try {
      await core.blocks.toggleCollapse(blockId);
      await refreshBlocks();

      addToast({
        type: 'success',
        title: '块状态已更新',
        message: '块的折叠状态已切换',
        duration: 1500
      });
    } catch (error) {
      console.error('Failed to toggle collapse:', error);
      addToast({
        type: 'error',
        title: '操作失败',
        message: error instanceof Error ? error.message : '切换块状态时发生错误',
      });
    }
  };

  const handleMoveBlock = async (blockId: string, newParentId?: string, newOrder?: number) => {
    try {
      // TODO: Implement move block in core
      console.log('Move block:', blockId, 'to parent:', newParentId, 'order:', newOrder);
      await refreshBlocks();

      addToast({
        type: 'success',
        title: '块已移动',
        message: '块的位置已更新',
        duration: 2000
      });
    } catch (error) {
      console.error('Failed to move block:', error);
      addToast({
        type: 'error',
        title: '移动失败',
        message: error instanceof Error ? error.message : '移动块时发生错误',
      });
    }
  };

  const handleFocusBlock = (blockId: string) => {
    setFocusedBlockId(blockId);
  };

  // Navigate between blocks
  const handleArrowNavigation = (currentBlockId: string, direction: 'up' | 'down') => {
    const blockIds = blocks.map(b => b.id);
    const currentIndex = blockIds.indexOf(currentBlockId);
    
    if (direction === 'up' && currentIndex > 0) {
      setFocusedBlockId(blockIds[currentIndex - 1]);
    } else if (direction === 'down' && currentIndex < blockIds.length - 1) {
      setFocusedBlockId(blockIds[currentIndex + 1]);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="正在加载页面内容..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <ErrorMessage
          title="加载失败"
          message={error}
          type="error"
          onRetry={() => loadBlocks(page.id)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {page.title || page.name}
        </h1>
        {page.isJournal && (
          <div className="text-sm text-gray-500 mb-2">
            📅 Journal - {page.journalDate}
          </div>
        )}
        {page.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {page.tags.map(tag => (
              <span
                key={tag}
                className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Editor Content */}
      <div className="bg-white rounded-lg border border-gray-200 min-h-[400px]">
        {blocks.length > 0 ? (
          <div className="p-6">
            <DraggableBlockTree
              blocks={blocks}
              onUpdateBlock={handleUpdateBlock}
              onCreateBlock={handleCreateBlock}
              onDeleteBlock={handleDeleteBlock}
              onIndentBlock={handleIndentBlock}
              onOutdentBlock={handleOutdentBlock}
              onToggleCollapse={handleToggleCollapse}
              onFocusBlock={handleFocusBlock}
              onMoveBlock={handleMoveBlock}
              focusedBlockId={focusedBlockId}
            />
          </div>
        ) : (
          <EmptyBlocks onCreateBlock={() => handleCreateBlock()} />
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-4 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {blocks.length} block{blocks.length !== 1 ? 's' : ''}
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => handleCreateBlock()}
            variant="secondary"
            size="sm"
            disabled={isCreatingBlock}
          >
            {isCreatingBlock ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                创建中...
              </>
            ) : (
              '+ 添加块'
            )}
          </Button>
        </div>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-900 mb-3">⌨️ 快捷键指南</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs text-gray-600">
          <div className="space-y-1">
            <h4 className="font-medium text-gray-800">基本操作</h4>
            <div><kbd className="bg-white px-1 rounded">Enter</kbd> 创建新块</div>
            <div><kbd className="bg-white px-1 rounded">Backspace</kbd> 删除空块</div>
            <div><kbd className="bg-white px-1 rounded">Ctrl+Del</kbd> 删除当前块</div>
            <div><kbd className="bg-white px-1 rounded">Ctrl+D</kbd> 复制块</div>
          </div>
          <div className="space-y-1">
            <h4 className="font-medium text-gray-800">缩进与移动</h4>
            <div><kbd className="bg-white px-1 rounded">Tab</kbd> 增加缩进</div>
            <div><kbd className="bg-white px-1 rounded">Shift+Tab</kbd> 减少缩进</div>
            <div><kbd className="bg-white px-1 rounded">Ctrl+Shift+↑</kbd> 向上移动</div>
            <div><kbd className="bg-white px-1 rounded">Ctrl+Shift+↓</kbd> 向下移动</div>
          </div>
          <div className="space-y-1">
            <h4 className="font-medium text-gray-800">格式化</h4>
            <div><kbd className="bg-white px-1 rounded">Ctrl+B</kbd> 粗体</div>
            <div><kbd className="bg-white px-1 rounded">Ctrl+I</kbd> 斜体</div>
            <div><kbd className="bg-white px-1 rounded">Ctrl+U</kbd> 下划线</div>
            <div><kbd className="bg-white px-1 rounded">Ctrl+E</kbd> 代码</div>
            <div><kbd className="bg-white px-1 rounded">Ctrl+/</kbd> 格式化工具栏</div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">
            💡 提示：您也可以拖拽块来重新排序，点击折叠按钮来隐藏子块
          </p>
          <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
            <div><kbd className="bg-white px-1 rounded">Tab</kbd> Indent</div>
            <div><kbd className="bg-white px-1 rounded">Shift+Tab</kbd> Outdent</div>
            <div><kbd className="bg-white px-1 rounded">Backspace</kbd> Delete empty</div>
            <div><kbd className="bg-white px-1 rounded">Ctrl+↑</kbd> Previous block</div>
            <div><kbd className="bg-white px-1 rounded">Ctrl+↓</kbd> Next block</div>
            <div><kbd className="bg-white px-1 rounded">[[]]</kbd> Page link</div>
            <div><kbd className="bg-white px-1 rounded">(())</kbd> Block ref</div>
          </div>
        </div>
      </div>
    </div>
  );
};
