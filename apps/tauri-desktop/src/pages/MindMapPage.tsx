/**
 * 思维导图页面
 */

import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { createMindMap, themes, layoutConfigs } from '@minglog/mindmap'
import { useNotes } from '../hooks/useNotes'
import { IntegratedMindMapCanvas } from '../components/mindmap/IntegratedMindMapCanvas'
import { ErrorBoundary } from '../components/ui/ErrorBoundary'

export const MindMapPage: React.FC = () => {
  const { graphId, pageId } = useParams<{ graphId: string; pageId: string }>()
  const navigate = useNavigate()
  const { notes, loading: notesLoading } = useNotes(graphId)
  
  const [selectedTheme, setSelectedTheme] = useState('default')
  const [selectedLayout, setSelectedLayout] = useState('tree')

  // 获取当前页面的笔记
  const currentNote = useMemo(() => {
    if (!pageId || !notes) return null
    return notes.find(note => note.id === pageId)
  }, [pageId, notes])

  // 转换笔记块为思维导图数据
  const mindMapData = useMemo(() => {
    if (!currentNote?.blocks || currentNote.blocks.length === 0) {
      // 创建默认的示例数据
      const sampleBlocks = [
        {
          id: 'root',
          content: '思维导图示例',
          type: 'heading',
          level: 0,
          children: [],
          parent_id: null,
          order: 0
        },
        {
          id: 'child1',
          content: '主要分支 1',
          type: 'paragraph',
          level: 1,
          children: [],
          parent_id: 'root',
          order: 1
        },
        {
          id: 'child2',
          content: '主要分支 2',
          type: 'paragraph',
          level: 1,
          children: [],
          parent_id: 'root',
          order: 2
        },
        {
          id: 'child1-1',
          content: '子分支 1.1',
          type: 'paragraph',
          level: 2,
          children: [],
          parent_id: 'child1',
          order: 1
        },
        {
          id: 'child1-2',
          content: '子分支 1.2',
          type: 'paragraph',
          level: 2,
          children: [],
          parent_id: 'child1',
          order: 2
        }
      ]
      
      try {
        return createMindMap(sampleBlocks)
      } catch (error) {
        console.error('创建示例思维导图失败:', error)
        return null
      }
    }

    try {
      return createMindMap(currentNote.blocks)
    } catch (error) {
      console.error('转换思维导图失败:', error)
      return null
    }
  }, [currentNote])

  // 处理节点点击
  const handleNodeClick = (node: any) => {
    console.log('节点点击:', node)
    // 可以在这里添加节点点击的逻辑，比如跳转到对应的块
  }

  // 处理节点编辑
  const handleNodeEdit = (node: any, newText: string) => {
    console.log('节点编辑:', node.id, newText)
    // 这里可以添加更新笔记内容的逻辑
  }

  // 处理导出
  const handleExport = () => {
    console.log('导出思维导图')
    // 这里可以添加导出逻辑
  }

  // 返回按钮
  const handleBack = () => {
    if (graphId) {
      navigate(`/graph/${graphId}`)
    } else {
      navigate('/')
    }
  }

  if (notesLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">加载中...</div>
      </div>
    )
  }

  if (!mindMapData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-lg text-red-600 mb-4">无法生成思维导图</div>
        <button
          onClick={handleBack}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          返回
        </button>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between p-4 border-b bg-white">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
          >
            ← 返回
          </button>
          <h1 className="text-xl font-semibold">
            {currentNote?.title || '思维导图'}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {/* 主题选择 */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">主题:</label>
            <select
              value={selectedTheme}
              onChange={(e) => setSelectedTheme(e.target.value)}
              className="px-2 py-1 text-sm border rounded"
            >
              <option value="default">默认</option>
              <option value="dark">深色</option>
              <option value="colorful">彩色</option>
            </select>
          </div>

          {/* 布局选择 */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">布局:</label>
            <select
              value={selectedLayout}
              onChange={(e) => setSelectedLayout(e.target.value)}
              className="px-2 py-1 text-sm border rounded"
            >
              <option value="tree">树形</option>
              <option value="radial">径向</option>
              <option value="compact">紧凑</option>
              <option value="spacious">宽松</option>
            </select>
          </div>

          {/* 导出按钮 */}
          <button
            onClick={handleExport}
            className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
          >
            导出
          </button>
        </div>
      </div>

      {/* 思维导图主体 */}
      <div className="flex-1 relative">
        <ErrorBoundary>
          <IntegratedMindMapCanvas
            data={mindMapData}
            width={window.innerWidth}
            height={window.innerHeight - 80} // 减去顶部工具栏高度
            layout={layoutConfigs[selectedLayout as keyof typeof layoutConfigs]}
            enableZoom={true}
            enableDrag={true}
            enableEdit={true}
            onNodeClick={handleNodeClick}
            onNodeDoubleClick={(node) => {
              console.log('节点双击:', node)
              // 可以在这里添加双击编辑逻辑
            }}
            onNodeEdit={handleNodeEdit}
            onBackgroundClick={() => {
              console.log('背景点击')
            }}
            style={{
              backgroundColor: themes[selectedTheme as keyof typeof themes]?.backgroundColor || '#fafafa'
            }}
            className="w-full h-full"
          />
        </ErrorBoundary>
      </div>
    </div>
  )
}

export default MindMapPage
