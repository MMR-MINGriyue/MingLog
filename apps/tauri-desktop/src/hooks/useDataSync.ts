/**
 * 数据同步Hook - 提供统一的数据状态管理
 */

import { useState, useEffect, useCallback } from 'react'
import { dataSyncService, DataState, SearchIndex } from '../services/DataSyncService'
import { GraphData, GraphNode } from '@minglog/graph'
// TODO: 修复slate导入
// import { Descendant } from 'slate'

// 临时类型定义
type Descendant = any

export interface UseDataSyncReturn {
  // 状态
  state: DataState
  
  // 图谱相关
  graphData: GraphData | null
  updateGraphData: (data: GraphData) => Promise<void>
  selectNode: (nodeId: string) => void
  
  // 编辑器相关
  currentPage: any | null
  updateEditorContent: (pageId: string, content: Descendant[]) => Promise<void>
  openPage: (pageId: string) => void
  
  // 搜索相关
  searchIndex: SearchIndex | null
  
  // 工具方法
  isLoading: boolean
  errors: Error[]
  clearErrors: () => void
  refresh: () => Promise<void>
}

export const useDataSync = (): UseDataSyncReturn => {
  const [state, setState] = useState<DataState>(dataSyncService.getState())

  // 监听数据同步服务的状态变化
  useEffect(() => {
    const updateState = () => {
      setState(dataSyncService.getState())
    }

    // 监听各种数据更新事件
    dataSyncService.on('graph-updated', updateState)
    dataSyncService.on('editor-updated', updateState)
    dataSyncService.on('search-index-updated', updateState)
    dataSyncService.on('sync-error', updateState)

    // 初始化状态
    updateState()

    return () => {
      dataSyncService.off('graph-updated', updateState)
      dataSyncService.off('editor-updated', updateState)
      dataSyncService.off('search-index-updated', updateState)
      dataSyncService.off('sync-error', updateState)
    }
  }, [])

  // 更新图谱数据
  const updateGraphData = useCallback(async (data: GraphData) => {
    await dataSyncService.updateGraphData(data)
  }, [])

  // 选择节点
  const selectNode = useCallback((nodeId: string) => {
    dataSyncService.selectNode(nodeId)
  }, [])

  // 更新编辑器内容
  const updateEditorContent = useCallback(async (pageId: string, content: Descendant[]) => {
    await dataSyncService.updateEditorContent(pageId, content)
  }, [])

  // 打开页面
  const openPage = useCallback((pageId: string) => {
    dataSyncService.openPage(pageId)
  }, [])

  // 清理错误
  const clearErrors = useCallback(() => {
    dataSyncService.clearErrors()
  }, [])

  // 刷新数据
  const refresh = useCallback(async () => {
    // 这里可以重新加载所有数据
    try {
      // 重新加载图谱数据
      if (state.graphData) {
        await dataSyncService.updateGraphData(state.graphData)
      }
    } catch (error) {
      console.error('Failed to refresh data:', error)
    }
  }, [state.graphData])

  return {
    state,
    graphData: state.graphData,
    updateGraphData,
    selectNode,
    currentPage: state.currentPage,
    updateEditorContent,
    openPage,
    searchIndex: state.searchIndex,
    isLoading: state.isLoading,
    errors: state.errors,
    clearErrors,
    refresh
  }
}

// 图谱专用Hook
export const useGraphSync = () => {
  const { graphData, updateGraphData, selectNode, isLoading } = useDataSync()
  
  return {
    graphData,
    updateGraphData,
    selectNode,
    isLoading
  }
}

// 编辑器专用Hook
export const useEditorSync = () => {
  const { currentPage, updateEditorContent, openPage, isLoading } = useDataSync()
  
  return {
    currentPage,
    updateEditorContent,
    openPage,
    isLoading
  }
}

// 搜索专用Hook
export const useSearchSync = () => {
  const { searchIndex, isLoading } = useDataSync()
  
  // 搜索功能
  const search = useCallback((query: string) => {
    if (!searchIndex || !query.trim()) return []
    
    const lowerQuery = query.toLowerCase()
    const results: Array<{
      id: string
      title: string
      content: string
      type: 'page' | 'block' | 'tag'
      score: number
    }> = []
    
    // 搜索页面
    searchIndex.pages.forEach(page => {
      let score = 0
      
      // 标题匹配
      if (page.title.toLowerCase().includes(lowerQuery)) {
        score += 10
      }
      
      // 内容匹配
      if (page.content.toLowerCase().includes(lowerQuery)) {
        score += 5
      }
      
      // 标签匹配
      if (page.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) {
        score += 8
      }
      
      if (score > 0) {
        results.push({
          id: page.id,
          title: page.title,
          content: page.content.substring(0, 200) + '...',
          type: 'page',
          score
        })
      }
    })
    
    // 搜索标签
    searchIndex.tags.forEach(tag => {
      if (tag.name.toLowerCase().includes(lowerQuery)) {
        results.push({
          id: tag.name,
          title: `#${tag.name}`,
          content: `${tag.count} 个页面使用此标签`,
          type: 'tag',
          score: 6
        })
      }
    })
    
    // 按分数排序
    return results.sort((a, b) => b.score - a.score)
  }, [searchIndex])
  
  return {
    searchIndex,
    search,
    isLoading
  }
}

export default useDataSync
