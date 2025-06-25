import React, { useState, useCallback } from 'react';
import { BlockEditor } from './BlockEditor';
import type { Block } from '@minglog/core';

interface BlockTreeProps {
  blocks: Block[];
  onUpdateBlock: (blockId: string, content: string) => void;
  onCreateBlock: (parentId?: string) => void;
  onDeleteBlock: (blockId: string) => void;
  level?: number;
}

export const BlockTree: React.FC<BlockTreeProps> = ({
  blocks,
  onUpdateBlock,
  onCreateBlock,
  onDeleteBlock,
  level = 0,
}) => {
  const [focusedBlockId] = useState<string | null>(null);

  const handleBlockUpdate = useCallback((blockId: string, content: string) => {
    onUpdateBlock(blockId, content);
  }, [onUpdateBlock]);

  const handleEnter = useCallback((blockId: string) => {
    onCreateBlock(blockId);
  }, [onCreateBlock]);

  const handleBackspace = useCallback((blockId: string) => {
    onDeleteBlock(blockId);
  }, [onDeleteBlock]);

  const getChildBlocks = useCallback((parentId: string): Block[] => {
    return blocks.filter(block => block.parentId === parentId);
  }, [blocks]);

  const renderBlock = (block: Block) => {
    const childBlocks = getChildBlocks(block.id);
    const hasChildren = childBlocks.length > 0;

    return (
      <div key={block.id} className="group">
        <div 
          className="flex items-start space-x-2 py-1 hover:bg-gray-50 rounded"
          style={{ paddingLeft: `${level * 24}px` }}
        >
          {/* Bullet point */}
          <div className="flex-shrink-0 w-2 h-2 bg-gray-400 rounded-full mt-2" />
          
          {/* Block content */}
          <div className="flex-1 min-w-0">
            <BlockEditor
              block={block}
              onUpdate={(content) => handleBlockUpdate(block.id, content)}
              onEnter={() => handleEnter(block.id)}
              onBackspace={() => handleBackspace(block.id)}
              autoFocus={focusedBlockId === block.id}
            />
          </div>
        </div>

        {/* Child blocks */}
        {hasChildren && (
          <BlockTree
            blocks={childBlocks}
            onUpdateBlock={onUpdateBlock}
            onCreateBlock={onCreateBlock}
            onDeleteBlock={onDeleteBlock}
            level={level + 1}
          />
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
