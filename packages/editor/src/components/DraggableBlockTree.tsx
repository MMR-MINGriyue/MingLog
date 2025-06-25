import React, { useCallback, useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BlockEditor } from './BlockEditor';
import type { Block } from '@minglog/core';

interface DraggableBlockTreeProps {
  blocks: Block[];
  onUpdateBlock: (blockId: string, content: string) => void;
  onCreateBlock: (parentId?: string, order?: number) => void;
  onDeleteBlock: (blockId: string) => void;
  onIndentBlock: (blockId: string) => void;
  onOutdentBlock: (blockId: string) => void;
  onToggleCollapse: (blockId: string) => void;
  onFocusBlock: (blockId: string) => void;
  onMoveBlock: (blockId: string, newParentId?: string, newOrder?: number) => void;
  level?: number;
  focusedBlockId?: string;
}

interface SortableBlockItemProps {
  block: Block;
  level: number;
  children: Block[];
  onUpdateBlock: (blockId: string, content: string) => void;
  onCreateBlock: (parentId?: string, order?: number) => void;
  onDeleteBlock: (blockId: string) => void;
  onIndentBlock: (blockId: string) => void;
  onOutdentBlock: (blockId: string) => void;
  onToggleCollapse: (blockId: string) => void;
  onFocusBlock: (blockId: string) => void;
  onMoveBlock: (blockId: string, newParentId?: string, newOrder?: number) => void;
  focusedBlockId?: string;
}

const SortableBlockItem: React.FC<SortableBlockItemProps> = ({
  block,
  level,
  children,
  onUpdateBlock,
  onCreateBlock,
  onDeleteBlock,
  onIndentBlock,
  onOutdentBlock,
  onToggleCollapse,
  onFocusBlock,
  onMoveBlock,
  focusedBlockId,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const hasChildren = children.length > 0;
  const isCollapsed = block.collapsed && hasChildren;

  const handleBlockUpdate = useCallback((content: string) => {
    onUpdateBlock(block.id, content);
  }, [onUpdateBlock, block.id]);

  const handleEnter = useCallback(() => {
    onCreateBlock(block.id);
  }, [onCreateBlock, block.id]);

  const handleBackspace = useCallback(() => {
    onDeleteBlock(block.id);
  }, [onDeleteBlock, block.id]);

  const handleTab = useCallback(() => {
    onIndentBlock(block.id);
  }, [onIndentBlock, block.id]);

  const handleShiftTab = useCallback(() => {
    onOutdentBlock(block.id);
  }, [onOutdentBlock, block.id]);

  const handleArrowUp = useCallback(() => {
    onFocusBlock(block.id);
  }, [onFocusBlock, block.id]);

  const handleArrowDown = useCallback(() => {
    onFocusBlock(block.id);
  }, [onFocusBlock, block.id]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group ${isDragging ? 'opacity-50' : ''}`}
    >
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

        {/* Drag handle */}
        <div
          className="flex-shrink-0 flex items-center justify-center w-6 h-6 relative z-10 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ marginLeft: `${level * 24}px` }}
          {...attributes}
          {...listeners}
        >
          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </div>

        {/* Bullet point and collapse toggle */}
        <div className="flex-shrink-0 flex items-center justify-center w-6 h-6 relative z-10">
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
            level={0}
            onUpdate={handleBlockUpdate}
            onEnter={handleEnter}
            onBackspace={handleBackspace}
            onTab={handleTab}
            onShiftTab={handleShiftTab}
            onArrowUp={handleArrowUp}
            onArrowDown={handleArrowDown}
            autoFocus={focusedBlockId === block.id}
          />
        </div>

        {/* Block actions */}
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex space-x-1">
            <button
              onClick={() => onCreateBlock(block.id)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded text-xs"
              title="Add child block"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
            <button
              onClick={() => onDeleteBlock(block.id)}
              className="p-1 text-gray-400 hover:text-red-600 rounded text-xs"
              title="Delete block"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Child blocks */}
      {hasChildren && !isCollapsed && (
        <div className="ml-6">
          <DraggableBlockTree
            blocks={children}
            onUpdateBlock={onUpdateBlock}
            onCreateBlock={onCreateBlock}
            onDeleteBlock={onDeleteBlock}
            onIndentBlock={onIndentBlock}
            onOutdentBlock={onOutdentBlock}
            onToggleCollapse={onToggleCollapse}
            onFocusBlock={onFocusBlock}
            onMoveBlock={onMoveBlock}
            level={level + 1}
            focusedBlockId={focusedBlockId}
          />
        </div>
      )}
    </div>
  );
};

export const DraggableBlockTree: React.FC<DraggableBlockTreeProps> = ({
  blocks,
  onUpdateBlock,
  onCreateBlock,
  onDeleteBlock,
  onIndentBlock,
  onOutdentBlock,
  onToggleCollapse,
  onFocusBlock,
  onMoveBlock,
  level = 0,
  focusedBlockId,
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const getChildBlocks = useCallback((parentId: string): Block[] => {
    return blocks.filter(block => block.parentId === parentId);
  }, [blocks]);

  // Get root blocks (blocks without parent or parent not in current blocks)
  const rootBlocks = blocks.filter(block => 
    !block.parentId || !blocks.find(b => b.id === block.parentId)
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = rootBlocks.findIndex(block => block.id === active.id);
      const newIndex = rootBlocks.findIndex(block => block.id === over?.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        // Move block within the same level
        onMoveBlock(active.id as string, undefined, newIndex);
      }
    }

    setActiveId(null);
  };

  const activeBlock = activeId ? blocks.find(block => block.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={rootBlocks.map(block => block.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-1">
          {rootBlocks.map(block => (
            <SortableBlockItem
              key={block.id}
              block={block}
              level={level}
              children={getChildBlocks(block.id)}
              onUpdateBlock={onUpdateBlock}
              onCreateBlock={onCreateBlock}
              onDeleteBlock={onDeleteBlock}
              onIndentBlock={onIndentBlock}
              onOutdentBlock={onOutdentBlock}
              onToggleCollapse={onToggleCollapse}
              onFocusBlock={onFocusBlock}
              onMoveBlock={onMoveBlock}
              focusedBlockId={focusedBlockId}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeBlock ? (
          <div className="bg-white shadow-lg rounded-lg p-2 border">
            <div className="text-sm text-gray-700">
              {activeBlock.content || 'Empty block'}
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
