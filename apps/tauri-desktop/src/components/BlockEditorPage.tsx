import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { BlockEditor, BlockTree } from '@minglog/editor'
import { Save, FileText, Plus, ArrowLeft } from 'lucide-react'
import { 
  Block, 
  Page, 
  CreateBlockRequest, 
  UpdateBlockRequest, 
  CreatePageRequest,
  getPage, 
  createPage, 
  updatePage,
  getBlocksByPage, 
  createBlock, 
  updateBlock, 
  deleteBlock,
  withErrorHandling 
} from '../utils/tauri'
import { useNotifications } from './NotificationSystem'

const BlockEditorPage: React.FC = () => {
  const { pageId } = useParams<{ pageId?: string }>()
  const navigate = useNavigate()
  const { success, error } = useNotifications()

  const [page, setPage] = useState<Page | null>(null)
  const [blocks, setBlocks] = useState<Block[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null)

  // Load page and blocks
  useEffect(() => {
    const loadPageData = async () => {
      if (!pageId || pageId === 'new') {
        // Create new page
        const newPageRequest: CreatePageRequest = {
          name: `Page ${new Date().toLocaleDateString()}`,
          title: 'Untitled Page',
          tags: [],
          is_journal: false
        }
        
        const newPage = await withErrorHandling(
          () => createPage(newPageRequest),
          'Failed to create new page'
        )
        
        if (newPage) {
          setPage(newPage)
          // Create initial block
          const initialBlockRequest: CreateBlockRequest = {
            content: '',
            page_id: newPage.id,
            order: 0
          }
          
          const initialBlock = await withErrorHandling(
            () => createBlock(initialBlockRequest),
            'Failed to create initial block'
          )
          
          if (initialBlock) {
            setBlocks([initialBlock])
            setFocusedBlockId(initialBlock.id)
          }
        }
      } else {
        // Load existing page
        const existingPage = await withErrorHandling(
          () => getPage(pageId),
          'Failed to load page'
        )
        
        if (existingPage) {
          setPage(existingPage)
          
          const pageBlocks = await withErrorHandling(
            () => getBlocksByPage(pageId),
            'Failed to load blocks'
          )
          
          if (pageBlocks) {
            setBlocks(pageBlocks.sort((a, b) => a.order - b.order))
          }
        }
      }
      
      setIsLoading(false)
    }

    loadPageData()
  }, [pageId])

  const handleUpdateBlock = useCallback(async (blockId: string, content: string) => {
    const updateRequest: UpdateBlockRequest = {
      id: blockId,
      content
    }
    
    const updatedBlock = await withErrorHandling(
      () => updateBlock(updateRequest),
      'Failed to update block'
    )
    
    if (updatedBlock) {
      setBlocks(prev => prev.map(block => 
        block.id === blockId ? updatedBlock : block
      ))
    }
  }, [])

  const handleCreateBlock = useCallback(async (parentId?: string, order?: number) => {
    if (!page) return

    const newOrder = order ?? blocks.length
    const createRequest: CreateBlockRequest = {
      content: '',
      page_id: page.id,
      parent_id: parentId,
      order: newOrder
    }
    
    const newBlock = await withErrorHandling(
      () => createBlock(createRequest),
      'Failed to create block'
    )
    
    if (newBlock) {
      setBlocks(prev => [...prev, newBlock].sort((a, b) => a.order - b.order))
      setFocusedBlockId(newBlock.id)
    }
  }, [page, blocks])

  const handleDeleteBlock = useCallback(async (blockId: string) => {
    const success = await withErrorHandling(
      () => deleteBlock(blockId),
      'Failed to delete block'
    )
    
    if (success !== null) {
      setBlocks(prev => prev.filter(block => block.id !== blockId))
    }
  }, [])

  const handleIndentBlock = useCallback(async (blockId: string) => {
    // Find the previous block to make it the parent
    const blockIndex = blocks.findIndex(b => b.id === blockId)
    if (blockIndex <= 0) return
    
    const previousBlock = blocks[blockIndex - 1]
    const updateRequest: UpdateBlockRequest = {
      id: blockId,
      parent_id: previousBlock.id
    }
    
    const updatedBlock = await withErrorHandling(
      () => updateBlock(updateRequest),
      'Failed to indent block'
    )
    
    if (updatedBlock) {
      setBlocks(prev => prev.map(block => 
        block.id === blockId ? updatedBlock : block
      ))
    }
  }, [blocks])

  const handleOutdentBlock = useCallback(async (blockId: string) => {
    const updateRequest: UpdateBlockRequest = {
      id: blockId,
      parent_id: undefined
    }
    
    const updatedBlock = await withErrorHandling(
      () => updateBlock(updateRequest),
      'Failed to outdent block'
    )
    
    if (updatedBlock) {
      setBlocks(prev => prev.map(block => 
        block.id === blockId ? updatedBlock : block
      ))
    }
  }, [])

  const handleToggleCollapse = useCallback(async (blockId: string) => {
    const block = blocks.find(b => b.id === blockId)
    if (!block) return
    
    const updateRequest: UpdateBlockRequest = {
      id: blockId,
      collapsed: !block.collapsed
    }
    
    const updatedBlock = await withErrorHandling(
      () => updateBlock(updateRequest),
      'Failed to toggle collapse'
    )
    
    if (updatedBlock) {
      setBlocks(prev => prev.map(b => 
        b.id === blockId ? updatedBlock : b
      ))
    }
  }, [blocks])

  const handleSavePage = useCallback(async () => {
    if (!page) return
    
    const result = await withErrorHandling(
      () => updatePage({ id: page.id, title: page.title }),
      'Failed to save page'
    )
    
    if (result) {
      success('Page Saved', 'Your changes have been saved successfully')
    }
  }, [page, success])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading page...</p>
        </div>
      </div>
    )
  }

  if (!page) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Page not found</p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/')}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              title="Back to home"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-gray-400" />
              <h1 className="text-xl font-semibold text-gray-900">
                {page.title || page.name}
              </h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleCreateBlock()}
              className="btn-secondary flex items-center space-x-2"
              title="Add new block"
            >
              <Plus className="w-4 h-4" />
              <span>Add Block</span>
            </button>
            <button
              onClick={handleSavePage}
              className="btn-primary flex items-center space-x-2"
              title="Save page"
            >
              <Save className="w-4 h-4" />
              <span>Save</span>
            </button>
          </div>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {blocks.length > 0 ? (
            <BlockTree
              blocks={blocks}
              onUpdateBlock={handleUpdateBlock}
              onCreateBlock={handleCreateBlock}
              onDeleteBlock={handleDeleteBlock}
              onIndentBlock={handleIndentBlock}
              onOutdentBlock={handleOutdentBlock}
              onToggleCollapse={handleToggleCollapse}
              onFocusBlock={setFocusedBlockId}
              focusedBlockId={focusedBlockId}
            />
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No blocks yet</p>
              <button
                onClick={() => handleCreateBlock()}
                className="btn-primary"
              >
                Create your first block
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BlockEditorPage
