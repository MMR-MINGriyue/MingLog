import React, { useCallback } from 'react';
import { BlockEditor } from './BlockEditor';
import type { Block } from '@minglog/core';

interface BlockTreeProps {
  blocks: Block[];
  onUpdateBlock: (blockId: string, content: string) => void;
  onCreateBlock: (parentId?: string, order?: number) => void;
  onDeleteBlock: (blockId: string) => void;
  onIndentBlock: (blockId: string) => void;
  onOutdentBlock: (blockId: string) => void;
  onToggleCollapse: (blockId: string) => void;
  onFocusBlock: (blockId: string) => void;
  level?: number;
  focusedBlockId?: string;
}

export const BlockTree: React.FC<BlockTreeProps> = ({
  blocks,
  onUpdateBlock,
  onCreateBlock,
  onDeleteBlock,
  onIndentBlock,
  onOutdentBlock,
  onToggleCollapse,
  onFocusBlock,
  level = 0,
  focusedBlockId,
}) => {

  const handleBlockUpdate = useCallback((blockId: string, content: string) => {
    onUpdateBlock(blockId, content);
  }, [onUpdateBlock]);

  const handleEnter = useCallback((blockId: string) => {
    onCreateBlock(blockId);
  }, [onCreateBlock]);

  const handleBackspace = useCallback((blockId: string) => {
    onDeleteBlock(blockId);
  }, [onDeleteBlock]);

  const handleTab = useCallback((blockId: string) => {
    onIndentBlock(blockId);
  }, [onIndentBlock]);

  const handleShiftTab = useCallback((blockId: string) => {
    onOutdentBlock(blockId);
  }, [onOutdentBlock]);

  const handleArrowUp = useCallback((blockId: string) => {
    onFocusBlock(blockId);
  }, [onFocusBlock]);

  const handleArrowDown = useCallback((blockId: string) => {
    onFocusBlock(blockId);
  }, [onFocusBlock]);

  const getChildBlocks = useCallback((parentId: string): Block[] => {
    return blocks.filter(block => block.parentId === parentId);
  }, [blocks]);

  const renderBlock = (block: Block) => {
    const childBlocks = getChildBlocks(block.id);
    const hasChildren = childBlocks.length > 0;
    const isCollapsed = block.collapsed && hasChildren;

    return (
      <div key={block.id} className="group">
        <div className="flex items-start space-x-2 py-1 hover:bg-gray-50 rounded relative">
          {/* Indentation lines */}
          {level > 0 && (
            <div className="absolute left-0 top-0 bottom-0 flex">
              {Array.from({ length: level }).map((_, i) => (
                <div
                  key={i}
                  className="w-6 border-l border-gray-200"
                  style={{ marginLeft: `${i * 24}px` }}
                />
              ))}
            </div>
          )}

          {/* Bullet point and collapse toggle */}
          <div
            className="flex-shrink-0 flex items-center justify-center w-6 h-6 relative z-10"
            style={{ marginLeft: `${level * 24}px` }}
          >
            {hasChildren ? (
              <button
                onClick={() => onToggleCollapse(block.id)}
                className="w-4 h-4 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
                title={isCollapsed ? 'Expand' : 'Collapse'}
              >
                <svg
                  className={`w-3 h-3 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            ) : (
              <div className="w-2 h-2 bg-gray-400 rounded-full" />
            )}
          </div>

          {/* Block content */}
          <div className="flex-1 min-w-0">
            <BlockEditor
              block={block}
              level={0} // Reset level since we handle indentation in the tree
              onUpdate={(content) => handleBlockUpdate(block.id, content)}
              onEnter={() => handleEnter(block.id)}
              onBackspace={() => handleBackspace(block.id)}
              onTab={() => handleTab(block.id)}
              onShiftTab={() => handleShiftTab(block.id)}
              onArrowUp={() => handleArrowUp(block.id)}
              onArrowDown={() => handleArrowDown(block.id)}
              autoFocus={focusedBlockId === block.id}
            />
          </div>
        </div>

        {/* Child blocks */}
        {hasChildren && !isCollapsed && (
          <div className="ml-6">
            <BlockTree
              blocks={childBlocks}
              onUpdateBlock={onUpdateBlock}
              onCreateBlock={onCreateBlock}
              onDeleteBlock={onDeleteBlock}
              onIndentBlock={onIndentBlock}
              onOutdentBlock={onOutdentBlock}
              onToggleCollapse={onToggleCollapse}
              onFocusBlock={onFocusBlock}
              level={level + 1}
              focusedBlockId={focusedBlockId}
            />
          </div>
        )}
      </div>
    );
  };

  // Get root blocks (blocks without parent or parent not in current blocks)
  const rootBlocks = blocks.filter(block => 
    !block.parentId || !blocks.find(b => b.id === block.parentId)
  );

  return (
    <div className="space-y-1">
      {rootBlocks.map(renderBlock)}
    </div>
  );
};
