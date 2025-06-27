/**
 * 幕布风格块树组件
 * Mubu-style Block Tree Component
 */

import React, { useCallback, useState } from 'react';
import { MubuStyleEditor } from './MubuStyleEditor';
import { clsx } from 'clsx';
import type { Block } from '@minglog/core';

interface MubuStyleBlockTreeProps {
  blocks: Block[];
  onUpdateBlock: (blockId: string, content: string) => void;
  onCreateBlock: (parentId?: string, order?: number) => void;
  onDeleteBlock: (blockId: string) => void;
  onIndentBlock: (blockId: string) => void;
  onOutdentBlock: (blockId: string) => void;
  onToggleCollapse: (blockId: string) => void;
  onFocusBlock: (blockId: string) => void;
  onMoveBlock: (blockId: string, direction: 'up' | 'down') => void;
  onDuplicateBlock: (blockId: string) => void;
  level?: number;
  focusedBlockId?: string;
  collapsedBlocks?: Set<string>;
  className?: string;
  showConnectors?: boolean;
  compactMode?: boolean;
}

export const MubuStyleBlockTree: React.FC<MubuStyleBlockTreeProps> = ({
  blocks,
  onUpdateBlock,
  onCreateBlock,
  onDeleteBlock,
  onIndentBlock,
  onOutdentBlock,
  onToggleCollapse,
  onFocusBlock,
  onMoveBlock,
  onDuplicateBlock,
  level = 0,
  focusedBlockId,
  collapsedBlocks = new Set(),
  className,
  showConnectors = true,
  compactMode = false,
}) => {
  const [draggedBlock, setDraggedBlock] = useState<string | null>(null);

  // 获取子块
  const getChildBlocks = useCallback((parentId: string): Block[] => {
    return blocks
      .filter(block => block.parentId === parentId)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [blocks]);

  // 获取根块
  const rootBlocks = blocks
    .filter(block => !block.parentId || !blocks.find(b => b.id === block.parentId))
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  // 处理块更新
  const handleBlockUpdate = useCallback((blockId: string, content: string) => {
    onUpdateBlock(blockId, content);
  }, [onUpdateBlock]);

  // 处理回车键
  const handleEnter = useCallback((blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (block) {
      onCreateBlock(block.parentId, (block.order || 0) + 1);
    }
  }, [blocks, onCreateBlock]);

  // 处理退格键
  const handleBackspace = useCallback((blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (block && (!block.content || block.content.trim() === '')) {
      onDeleteBlock(blockId);
    }
  }, [blocks, onDeleteBlock]);

  // 处理 Tab 键（缩进）
  const handleTab = useCallback((blockId: string) => {
    onIndentBlock(blockId);
  }, [onIndentBlock]);

  // 处理 Shift+Tab 键（取消缩进）
  const handleShiftTab = useCallback((blockId: string) => {
    onOutdentBlock(blockId);
  }, [onOutdentBlock]);

  // 处理上下箭头导航
  const handleArrowUp = useCallback((blockId: string) => {
    const currentIndex = blocks.findIndex(b => b.id === blockId);
    if (currentIndex > 0) {
      onFocusBlock(blocks[currentIndex - 1].id);
    }
  }, [blocks, onFocusBlock]);

  const handleArrowDown = useCallback((blockId: string) => {
    const currentIndex = blocks.findIndex(b => b.id === blockId);
    if (currentIndex < blocks.length - 1) {
      onFocusBlock(blocks[currentIndex + 1].id);
    }
  }, [blocks, onFocusBlock]);

  // 处理块移动
  const handleMoveUp = useCallback((blockId: string) => {
    onMoveBlock(blockId, 'up');
  }, [onMoveBlock]);

  const handleMoveDown = useCallback((blockId: string) => {
    onMoveBlock(blockId, 'down');
  }, [onMoveBlock]);

  // 处理块复制
  const handleDuplicate = useCallback((blockId: string) => {
    onDuplicateBlock(blockId);
  }, [onDuplicateBlock]);

  // 处理块删除
  const handleDelete = useCallback((blockId: string) => {
    onDeleteBlock(blockId);
  }, [onDeleteBlock]);

  // 处理折叠切换
  const handleToggleCollapse = useCallback((blockId: string) => {
    onToggleCollapse(blockId);
  }, [onToggleCollapse]);

  // 渲染单个块
  const renderBlock = useCallback((block: Block, blockLevel: number = level): React.ReactNode => {
    const childBlocks = getChildBlocks(block.id);
    const hasChildren = childBlocks.length > 0;
    const isCollapsed = collapsedBlocks.has(block.id);
    const isFocused = focusedBlockId === block.id;
    const isDragged = draggedBlock === block.id;

    return (
      <div
        key={block.id}
        className={clsx(
          'mubu-block-item',
          compactMode ? 'mb-1' : 'mb-2',
          isDragged && 'opacity-50',
          isFocused && 'ring-2 ring-blue-500 ring-opacity-50 rounded-md'
        )}
      >
        {/* 主块 */}
        <div className="relative">
          {/* 连接线 */}
          {showConnectors && blockLevel > 0 && (
            <div className="absolute left-0 top-0 bottom-0 pointer-events-none">
              {/* 垂直连接线 */}
              <div
                className="absolute border-l border-gray-200 dark:border-gray-700"
                style={{
                  left: `${(blockLevel - 1) * 24 + 12}px`,
                  top: 0,
                  height: hasChildren && !isCollapsed ? '100%' : '24px',
                }}
              />
              {/* 水平连接线 */}
              <div
                className="absolute border-t border-gray-200 dark:border-gray-700"
                style={{
                  left: `${(blockLevel - 1) * 24 + 12}px`,
                  top: '12px',
                  width: '12px',
                }}
              />
            </div>
          )}

          <MubuStyleEditor
            block={block}
            level={blockLevel}
            autoFocus={isFocused}
            showBullet={true}
            hasChildren={hasChildren}
            isCollapsed={isCollapsed}
            placeholder={blockLevel === 0 ? '开始写作...' : '添加子项...'}
            onUpdate={(content) => handleBlockUpdate(block.id, content)}
            onEnter={() => handleEnter(block.id)}
            onBackspace={() => handleBackspace(block.id)}
            onTab={() => handleTab(block.id)}
            onShiftTab={() => handleShiftTab(block.id)}
            onArrowUp={() => handleArrowUp(block.id)}
            onArrowDown={() => handleArrowDown(block.id)}
            onDelete={() => handleDelete(block.id)}
            onDuplicate={() => handleDuplicate(block.id)}
            onMoveUp={() => handleMoveUp(block.id)}
            onMoveDown={() => handleMoveDown(block.id)}
            onToggleCollapse={() => handleToggleCollapse(block.id)}
            className={clsx(
              'transition-all duration-200',
              compactMode && 'py-1'
            )}
          />
        </div>

        {/* 子块 */}
        {hasChildren && !isCollapsed && (
          <div className={clsx('mubu-children', compactMode ? 'mt-1' : 'mt-2')}>
            <MubuStyleBlockTree
              blocks={childBlocks}
              onUpdateBlock={onUpdateBlock}
              onCreateBlock={onCreateBlock}
              onDeleteBlock={onDeleteBlock}
              onIndentBlock={onIndentBlock}
              onOutdentBlock={onOutdentBlock}
              onToggleCollapse={onToggleCollapse}
              onFocusBlock={onFocusBlock}
              onMoveBlock={onMoveBlock}
              onDuplicateBlock={onDuplicateBlock}
              level={blockLevel + 1}
              focusedBlockId={focusedBlockId}
              collapsedBlocks={collapsedBlocks}
              showConnectors={showConnectors}
              compactMode={compactMode}
            />
          </div>
        )}
      </div>
    );
  }, [
    getChildBlocks,
    collapsedBlocks,
    focusedBlockId,
    draggedBlock,
    compactMode,
    showConnectors,
    level,
    handleBlockUpdate,
    handleEnter,
    handleBackspace,
    handleTab,
    handleShiftTab,
    handleArrowUp,
    handleArrowDown,
    handleDelete,
    handleDuplicate,
    handleMoveUp,
    handleMoveDown,
    handleToggleCollapse,
    onUpdateBlock,
    onCreateBlock,
    onDeleteBlock,
    onIndentBlock,
    onOutdentBlock,
    onToggleCollapse,
    onFocusBlock,
    onMoveBlock,
    onDuplicateBlock,
  ]);

  if (rootBlocks.length === 0) {
    return (
      <div className={clsx('mubu-empty-state', className)}>
        <div className="text-center py-12">
          <div className="text-gray-400 dark:text-gray-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            开始创建您的第一个块
          </p>
          <button
            onClick={() => onCreateBlock()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            创建块
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('mubu-block-tree', className)}>
      <div className={clsx('space-y-1', compactMode && 'space-y-0.5')}>
        {rootBlocks.map(block => renderBlock(block, level))}
      </div>
    </div>
  );
};

export default MubuStyleBlockTree;
