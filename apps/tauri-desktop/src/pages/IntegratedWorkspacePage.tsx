/**
 * 集成工作空间页面 - 图谱与编辑器的双向链接
 */

import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Network,
  Edit3,
  ArrowLeft,
  ArrowRight,
  Maximize2,
  Minimize2,
  Link as LinkIcon,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react'
import { GraphView, GraphData, GraphNode } from '@minglog/graph'
import { BlockEditor, BlockTree, MubuBlockEditor } from '@minglog/editor'
import {
  getGraphData,
  getPage,
  getBlocksByPage,
  createSampleGraphData,
  withErrorHandling
} from '../utils/tauri'
import { useNotifications } from '../components/NotificationSystem'
import { useDataSync } from '../hooks/useDataSync'

interface IntegratedWorkspacePageProps {}

const IntegratedWorkspacePage: React.FC<IntegratedWorkspacePageProps> = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { success, error } = useNotifications()

  // 使用数据同步Hook
  const {
    graphData,
    updateGraphData,
    selectNode: syncSelectNode,
    currentPage,
    updateEditorContent,
    openPage,
    isLoading: isSyncLoading,
    errors: syncErrors,
    clearErrors,
    refresh
  } = useDataSync()

  // 布局状态
  const [layout, setLayout] = useState<'split' | 'graph-only' | 'editor-only'>('split')
  const [graphWidth, setGraphWidth] = useState(50) // 百分比

  // 本地状态
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [blocks, setBlocks] = useState<any[]>([])
  const [isEditorLoading, setIsEditorLoading] = useState(false)

  // 同步状态
  const [isLinked, setIsLinked] = useState(true) // 是否启用双向链接
  const [isMubuMode, setIsMubuMode] = useState(true) // 是否启用幕布模式

  // 从URL参数获取初始状态
  const initialNodeId = searchParams.get('nodeId')
  const initialPageId = searchParams.get('pageId')

  // 加载图谱数据
  const loadGraphData = useCallback(async () => {
    try {
      const data = await withErrorHandling(
        () => getGraphData('default', true),
        '加载图谱数据失败'
      )

      if (data) {
        await updateGraphData(data)
      } else {
        // 如果没有数据，创建示例数据
        const sampleData = createSampleGraphData()
        await updateGraphData(sampleData)
      }
    } catch (err) {
      console.error('Failed to load graph data:', err)
      // 创建本地示例数据作为后备
      const fallbackData = {
        nodes: [
          {
            id: 'note1',
            title: '我的第一篇笔记',
            type: 'note' as const,
            content: '这是一篇关于知识管理的笔记',
            tags: ['知识管理', '笔记'],
            size: 10,
            color: '#3b82f6'
          },
          {
            id: 'note2',
            title: '图谱可视化',
            type: 'note' as const,
            content: '探索知识之间的关联',
            tags: ['可视化', '图谱'],
            size: 8,
            color: '#10b981'
          },
          {
            id: 'tag1',
            title: '知识管理',
            type: 'tag' as const,
            size: 6,
            color: '#f59e0b'
          }
        ],
        links: [
          {
            id: 'link1',
            source: 'note1',
            target: 'tag1',
            type: 'tag' as const,
            weight: 1
          },
          {
            id: 'link2',
            source: 'note1',
            target: 'note2',
            type: 'reference' as const,
            weight: 0.8
          }
        ]
      }
      await updateGraphData(fallbackData)
    }
  }, [updateGraphData])

  // 加载页面和块数据
  const loadPageData = useCallback(async (pageId: string) => {
    if (!pageId) return
    
    setIsEditorLoading(true)
    
    try {
      const [page, pageBlocks] = await Promise.all([
        withErrorHandling(() => getPage(pageId), '加载页面失败'),
        withErrorHandling(() => getBlocksByPage(pageId), '加载块数据失败')
      ])
      
      if (page) {
        // setCurrentPage(page) // TODO: 修复setCurrentPage函数
      }
      
      if (pageBlocks) {
        setBlocks(pageBlocks)
      }
    } catch (err) {
      console.error('Failed to load page data:', err)
    } finally {
      setIsEditorLoading(false)
    }
  }, [])

  // 处理图谱节点点击
  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNode(node)
    syncSelectNode(node.id)

    if (isLinked && node.type === 'note') {
      // 如果是笔记节点，加载对应的页面
      loadPageData(node.id)
      openPage(node.id)
      setSearchParams(prev => {
        const newParams = new URLSearchParams(prev)
        newParams.set('nodeId', node.id)
        newParams.set('pageId', node.id)
        return newParams
      })

      success(`已跳转到笔记: ${node.title}`)
    }
  }, [isLinked, loadPageData, syncSelectNode, openPage, setSearchParams, success])

  // 处理编辑器内容变化
  const handleEditorChange = useCallback(async (content: any) => {
    // 实时同步到图谱和搜索索引
    if (isLinked && selectedNode) {
      try {
        await updateEditorContent(selectedNode.id, content)
        console.log('Editor content synced to graph')
      } catch (err) {
        console.error('Failed to sync editor content:', err)
      }
    }
  }, [isLinked, selectedNode, updateEditorContent])

  // 初始化加载
  useEffect(() => {
    loadGraphData()
    
    if (initialPageId) {
      loadPageData(initialPageId)
    }
  }, [loadGraphData, loadPageData, initialPageId])

  // 处理布局切换
  const handleLayoutChange = (newLayout: typeof layout) => {
    setLayout(newLayout)
  }

  // 处理分割线拖拽
  const handleSplitResize = useCallback((e: React.MouseEvent) => {
    const startX = e.clientX
    const startWidth = graphWidth
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - startX
      const containerWidth = window.innerWidth
      const deltaPercent = (deltaX / containerWidth) * 100
      const newWidth = Math.max(20, Math.min(80, startWidth + deltaPercent))
      setGraphWidth(newWidth)
    }
    
    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [graphWidth])

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* 顶部工具栏 */}
      <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="btn-ghost p-2"
            title="返回"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <h1 className="text-xl font-semibold text-gray-900">
            集成工作空间
          </h1>
          
          {selectedNode && (
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <LinkIcon className="w-4 h-4" />
              <span>{selectedNode.title}</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {/* 双向链接开关 */}
          <button
            onClick={() => setIsLinked(!isLinked)}
            className={`btn-ghost p-2 ${isLinked ? 'text-blue-600' : 'text-gray-400'}`}
            title={isLinked ? '禁用双向链接' : '启用双向链接'}
          >
            {isLinked ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>

          {/* 幕布模式切换 */}
          <button
            onClick={() => setIsMubuMode(!isMubuMode)}
            className={`btn-ghost p-2 ${isMubuMode ? 'text-green-600' : 'text-gray-400'}`}
            title={isMubuMode ? '切换到普通编辑器' : '切换到幕布编辑器'}
          >
            <LinkIcon className="w-5 h-5" />
          </button>

          {/* 布局切换 */}
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => handleLayoutChange('graph-only')}
              className={`p-2 rounded ${layout === 'graph-only' ? 'bg-white shadow-sm' : ''}`}
              title="仅图谱"
            >
              <Network className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleLayoutChange('split')}
              className={`p-2 rounded ${layout === 'split' ? 'bg-white shadow-sm' : ''}`}
              title="分割视图"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleLayoutChange('editor-only')}
              className={`p-2 rounded ${layout === 'editor-only' ? 'bg-white shadow-sm' : ''}`}
              title="仅编辑器"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>

          {/* 刷新按钮 */}
          <button
            onClick={loadGraphData}
            className="btn-ghost p-2"
            title="刷新图谱"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 图谱视图 */}
        {(layout === 'graph-only' || layout === 'split') && (
          <div 
            className="bg-white border-r border-gray-200 flex flex-col"
            style={{ 
              width: layout === 'split' ? `${graphWidth}%` : '100%' 
            }}
          >
            <div className="h-12 border-b border-gray-200 flex items-center justify-between px-4">
              <h2 className="font-medium text-gray-900">知识图谱</h2>
              {graphData && (
                <span className="text-sm text-gray-500">
                  {graphData.nodes.length} 节点, {graphData.links.length} 连接
                </span>
              )}
            </div>
            
            <div className="flex-1 relative">
              {isSyncLoading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                    <p className="text-gray-600">同步数据中...</p>
                  </div>
                </div>
              ) : graphData ? (
                <GraphView
                  data={graphData}
                  width={layout === 'split' ? window.innerWidth * (graphWidth / 100) : window.innerWidth}
                  height={window.innerHeight - 112} // 减去顶部工具栏和标题栏高度
                  onNodeClick={handleNodeClick}
                  showLabels={true}
                  enableZoom={true}
                  enableDrag={true}
                  enablePan={true}
                  className="w-full h-full"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center text-gray-500">
                    <Network className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="mb-2">暂无图谱数据</p>
                    <button
                      onClick={loadGraphData}
                      className="btn-primary"
                    >
                      重新加载
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 分割线 */}
        {layout === 'split' && (
          <div
            className="w-1 bg-gray-200 cursor-col-resize hover:bg-gray-300 transition-colors"
            onMouseDown={handleSplitResize}
          />
        )}

        {/* 编辑器视图 */}
        {(layout === 'editor-only' || layout === 'split') && (
          <div 
            className="bg-white flex flex-col"
            style={{ 
              width: layout === 'split' ? `${100 - graphWidth}%` : '100%' 
            }}
          >
            <div className="h-12 border-b border-gray-200 flex items-center justify-between px-4">
              <h2 className="font-medium text-gray-900">
                {currentPage ? currentPage.title : '编辑器'}
              </h2>
              {blocks.length > 0 && (
                <span className="text-sm text-gray-500">
                  {blocks.length} 个块
                </span>
              )}
            </div>
            
            <div className="flex-1 overflow-auto">
              {isEditorLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                    <p className="text-gray-600">加载编辑器中...</p>
                  </div>
                </div>
              ) : currentPage ? (
                <div className="p-6">
                  {isMubuMode ? (
                    <MubuBlockEditor
                      placeholder="开始编写内容..."
                      onChange={handleEditorChange}
                      autoFocus={true}
                      className="min-h-96"
                      mubuConfig={{
                        highlightCurrentBlock: true,
                        showIndentGuides: true,
                        showCollapseIcons: true,
                        maxIndentLevel: 6
                      }}
                      onBlockIndent={(blockId, level) => {
                        console.log('Block indented:', blockId, level)
                      }}
                      onBlockOutdent={(blockId, level) => {
                        console.log('Block outdented:', blockId, level)
                      }}
                      onBlockMove={(blockId, direction) => {
                        console.log('Block moved:', blockId, direction)
                      }}
                      onBlockToggle={(blockId, collapsed) => {
                        console.log('Block toggled:', blockId, collapsed)
                      }}
                      onBlockDuplicate={(blockId) => {
                        console.log('Block duplicated:', blockId)
                      }}
                      onBlockFocus={(blockId) => {
                        console.log('Block focused:', blockId)
                      }}
                    />
                  ) : (
                    <BlockEditor
                      placeholder="开始编写内容..."
                      onChange={handleEditorChange}
                      autoFocus={true}
                      className="min-h-96"
                    />
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-gray-500">
                    <Edit3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="mb-2">请从图谱中选择一个节点开始编辑</p>
                    <p className="text-sm">或者点击图谱中的笔记节点</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default IntegratedWorkspacePage
