import React, { useState, useEffect } from 'react';
import { Plus, GripVertical, Trash2, Type, List, Hash, Quote } from 'lucide-react';

interface Block {
  id: string;
  content: string;
  type: 'paragraph' | 'heading' | 'list' | 'quote';
  level: number;
}

interface SimpleBlockEditorProps {
  blocks: Block[];
  onChange: (blocks: Block[]) => void;
  placeholder?: string;
  className?: string;
}

export const SimpleBlockEditor: React.FC<SimpleBlockEditorProps> = ({
  blocks,
  onChange,
  placeholder = "Start writing...",
  className = ""
}) => {
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [showBlockMenu, setShowBlockMenu] = useState<string | null>(null);

  const addBlock = (afterId?: string) => {
    const newBlock: Block = {
      id: `block-${Date.now()}`,
      content: '',
      type: 'paragraph',
      level: 0
    };

    if (!afterId) {
      onChange([...blocks, newBlock]);
    } else {
      const index = blocks.findIndex(b => b.id === afterId);
      const newBlocks = [...blocks];
      newBlocks.splice(index + 1, 0, newBlock);
      onChange(newBlocks);
    }

    // Focus the new block
    setTimeout(() => {
      setFocusedBlockId(newBlock.id);
    }, 0);
  };

  const updateBlock = (id: string, updates: Partial<Block>) => {
    const newBlocks = blocks.map(block =>
      block.id === id ? { ...block, ...updates } : block
    );
    onChange(newBlocks);
  };

  const deleteBlock = (id: string) => {
    if (blocks.length <= 1) return; // Keep at least one block
    const newBlocks = blocks.filter(block => block.id !== id);
    onChange(newBlocks);
  };

  const handleKeyDown = (e: React.KeyboardEvent, blockId: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addBlock(blockId);
    } else if (e.key === 'Backspace') {
      const block = blocks.find(b => b.id === blockId);
      if (block && block.content === '') {
        e.preventDefault();
        deleteBlock(blockId);
      }
    }
  };

  const getBlockIcon = (type: Block['type']) => {
    switch (type) {
      case 'heading': return <Hash size={16} />;
      case 'list': return <List size={16} />;
      case 'quote': return <Quote size={16} />;
      default: return <Type size={16} />;
    }
  };

  const getBlockStyles = (type: Block['type']) => {
    switch (type) {
      case 'heading':
        return 'text-xl font-bold text-gray-900';
      case 'list':
        return 'text-gray-700 pl-4 border-l-2 border-gray-200';
      case 'quote':
        return 'text-gray-600 italic pl-4 border-l-4 border-blue-200 bg-blue-50';
      default:
        return 'text-gray-700';
    }
  };

  // Initialize with one block if empty
  useEffect(() => {
    if (blocks.length === 0) {
      addBlock();
    }
  }, []);

  return (
    <div className={`space-y-2 ${className}`}>
      {blocks.map((block, index) => (
        <div
          key={block.id}
          className="group relative"
          onMouseEnter={() => setShowBlockMenu(block.id)}
          onMouseLeave={() => setShowBlockMenu(null)}
        >
          {/* Block Controls */}
          <div className={`absolute left-0 top-0 flex items-center space-x-1 -ml-12 transition-opacity ${
            showBlockMenu === block.id ? 'opacity-100' : 'opacity-0'
          }`}>
            <button
              onClick={() => addBlock(index > 0 ? blocks[index - 1].id : undefined)}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
              title="Add block above"
            >
              <Plus size={14} />
            </button>
            
            <div className="relative">
              <button
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                title="Block type"
              >
                {getBlockIcon(block.type)}
              </button>
              
              {/* Block Type Menu */}
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 hidden group-hover:block">
                {(['paragraph', 'heading', 'list', 'quote'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => updateBlock(block.id, { type })}
                    className={`flex items-center space-x-2 px-3 py-1 text-sm hover:bg-gray-100 w-full text-left ${
                      block.type === type ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    {getBlockIcon(type)}
                    <span className="capitalize">{type}</span>
                  </button>
                ))}
              </div>
            </div>
            
            <button
              className="p-1 text-gray-400 hover:text-gray-600"
              title="Drag to reorder"
            >
              <GripVertical size={14} />
            </button>
            
            {blocks.length > 1 && (
              <button
                onClick={() => deleteBlock(block.id)}
                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                title="Delete block"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>

          {/* Block Content */}
          <div className="relative">
            <textarea
              value={block.content}
              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
              onFocus={() => setFocusedBlockId(block.id)}
              onKeyDown={(e) => handleKeyDown(e, block.id)}
              placeholder={index === 0 && !block.content ? placeholder : "Type something..."}
              className={`w-full min-h-[2.5rem] resize-none border-none outline-none bg-transparent ${getBlockStyles(block.type)} placeholder-gray-400`}
              style={{ 
                height: 'auto',
                minHeight: '2.5rem'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = target.scrollHeight + 'px';
              }}
            />
            
            {/* Focus indicator */}
            {focusedBlockId === block.id && (
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-full -ml-3" />
            )}
          </div>
        </div>
      ))}
      
      {/* Add block at end */}
      <button
        onClick={() => addBlock()}
        className="flex items-center space-x-2 text-gray-400 hover:text-gray-600 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <Plus size={16} />
        <span>Add a block</span>
      </button>
    </div>
  );
};
