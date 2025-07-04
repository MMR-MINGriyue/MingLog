import React, { useState, useEffect } from 'react'
import { Plus, Trash2, GripVertical } from 'lucide-react'

export interface Block {
  id: string
  content: string
  type: 'text' | 'heading' | 'list' | 'code'
  order: number
  page_id: string
  created_at: number
  updated_at: number
}

export interface BlockEditorProps {
  blocks: Block[]
  onBlocksChange: (blocks: Block[]) => void
  onSave?: () => void
  placeholder?: string
  className?: string
}

export const BlockEditor: React.FC<BlockEditorProps> = ({
  blocks,
  onBlocksChange,
  onSave,
  placeholder = "Start typing...",
  className = ""
}) => {
  const [localBlocks, setLocalBlocks] = useState<Block[]>(blocks)

  useEffect(() => {
    setLocalBlocks(blocks)
  }, [blocks])

  const addBlock = (afterIndex?: number) => {
    const newBlock: Block = {
      id: `block-${Date.now()}`,
      content: '',
      type: 'text',
      order: afterIndex !== undefined ? afterIndex + 1 : localBlocks.length,
      page_id: localBlocks[0]?.page_id || '',
      created_at: Date.now(),
      updated_at: Date.now()
    }

    const updatedBlocks = [...localBlocks]
    if (afterIndex !== undefined) {
      updatedBlocks.splice(afterIndex + 1, 0, newBlock)
    } else {
      updatedBlocks.push(newBlock)
    }

    setLocalBlocks(updatedBlocks)
    onBlocksChange(updatedBlocks)
  }

  const updateBlock = (id: string, content: string) => {
    const updatedBlocks = localBlocks.map(block =>
      block.id === id
        ? { ...block, content, updated_at: Date.now() }
        : block
    )
    setLocalBlocks(updatedBlocks)
    onBlocksChange(updatedBlocks)
  }

  const deleteBlock = (id: string) => {
    const updatedBlocks = localBlocks.filter(block => block.id !== id)
    setLocalBlocks(updatedBlocks)
    onBlocksChange(updatedBlocks)
  }

  const handleKeyDown = (e: React.KeyboardEvent, blockId: string, index: number) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      addBlock(index)
    } else if (e.key === 'Backspace') {
      const block = localBlocks.find(b => b.id === blockId)
      if (block && block.content === '' && localBlocks.length > 1) {
        e.preventDefault()
        deleteBlock(blockId)
      }
    }
  }

  return (
    <div className={`block-editor ${className}`}>
      {localBlocks.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <p>No blocks yet. Click the + button to add your first block.</p>
          <button
            type="button"
            onClick={() => addBlock()}
            className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Block
          </button>
        </div>
      )}

      {localBlocks.map((block, index) => (
        <div key={block.id} className="block-item group relative mb-2">
          <div className="flex items-start space-x-2">
            <div className="flex-shrink-0 pt-2">
              <GripVertical className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
            </div>
            
            <div className="flex-1">
              <textarea
                value={block.content}
                onChange={(e) => updateBlock(block.id, e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, block.id, index)}
                placeholder={index === 0 ? placeholder : "Type something..."}
                className="w-full p-2 border border-gray-200 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={Math.max(1, Math.ceil(block.content.length / 50))}
                style={{ minHeight: '40px' }}
              />
            </div>

            <div className="flex-shrink-0 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => addBlock(index)}
                className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                title="Add block below"
              >
                <Plus className="w-4 h-4" />
              </button>
              {localBlocks.length > 1 && (
                <button
                  type="button"
                  onClick={() => deleteBlock(block.id)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors ml-1"
                  title="Delete block"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      {localBlocks.length > 0 && (
        <div className="mt-4 flex justify-between items-center">
          <button
            type="button"
            onClick={() => addBlock()}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Block
          </button>

          {onSave && (
            <button
              type="button"
              onClick={onSave}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Save Changes
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// Simple BlockTree component
export interface BlockTreeProps {
  blocks: Block[]
  onBlockSelect?: (block: Block) => void
  className?: string
}

export const BlockTree: React.FC<BlockTreeProps> = ({
  blocks,
  onBlockSelect,
  className = ""
}) => {
  return (
    <div className={`block-tree ${className}`}>
      <h3 className="text-sm font-medium text-gray-700 mb-2">Block Structure</h3>
      <div className="space-y-1">
        {blocks.map((block, index) => (
          <div
            key={block.id}
            onClick={() => onBlockSelect?.(block)}
            className="p-2 text-sm border border-gray-200 rounded cursor-pointer hover:bg-gray-50 transition-colors"
          >
            <div className="font-medium">Block {index + 1}</div>
            <div className="text-gray-500 truncate">
              {block.content || 'Empty block'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default BlockEditor
