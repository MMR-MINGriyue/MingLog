/**
 * 图谱可视化模块钩子
 * 提供图谱模块的服务访问和状态管理
 */

import { useState, useEffect, useCallback } from 'react'
import { GraphModule, GraphService } from '@minglog/graph'
import { 
  GraphData, 
  GraphNode, 
  GraphLink, 
  GraphFilter, 
  LayoutConfig, 
  GraphStats,
  SearchResult,
  Cluster,
  Path,
  ExportOptions
} from '@minglog/graph'

interface UseGraphModuleReturn {
  /** 图谱模块实例 */
  graphModule: GraphModule | null
  /** 图谱服务 */
  graphService: GraphService | null
  /** 模块是否已初始化 */
  isInitialized: boolean
  /** 模块是否已激活 */
  isActive: boolean
  /** 初始化错误 */
  error: string | null
  /** 重新初始化模块 */
  reinitialize: () => Promise<void>
  
  // 便捷方法
  /** 创建图谱 */
  createGraph: (title: string, description?: string) => Promise<GraphData>
  /** 获取图谱 */
  getGraph: (id: string) => Promise<GraphData | null>
  /** 更新图谱 */
  updateGraph: (id: string, data: Partial<GraphData>) => Promise<GraphData>
  /** 删除图谱 */
  deleteGraph: (id: string) => Promise<boolean>
  
  /** 添加节点 */
  addNode: (graphId: string, node: Omit<GraphNode, 'id'>) => Promise<GraphNode>
  /** 更新节点 */
  updateNode: (graphId: string, nodeId: string, updates: Partial<GraphNode>) => Promise<GraphNode>
  /** 删除节点 */
  deleteNode: (graphId: string, nodeId: string) => Promise<boolean>
  
  /** 添加链接 */
  addLink: (graphId: string, link: Omit<GraphLink, 'id'>) => Promise<GraphLink>
  /** 更新链接 */
  updateLink: (graphId: string, linkId: string, updates: Partial<GraphLink>) => Promise<GraphLink>
  /** 删除链接 */
  deleteLink: (graphId: string, linkId: string) => Promise<boolean>
  
  /** 关联笔记 */
  linkToNote: (graphId: string, nodeId: string, noteId: string) => Promise<boolean>
  /** 关联任务 */
  linkToTask: (graphId: string, nodeId: string, taskId: string) => Promise<boolean>
  /** 取消关联笔记 */
  unlinkFromNote: (graphId: string, nodeId: string, noteId: string) => Promise<boolean>
  /** 取消关联任务 */
  unlinkFromTask: (graphId: string, nodeId: string, taskId: string) => Promise<boolean>
  
  /** 计算统计信息 */
  calculateStats: (graphId: string) => Promise<GraphStats>
  /** 查找聚类 */
  findClusters: (graphId: string, algorithm: 'connectivity' | 'tags' | 'type') => Promise<Cluster[]>
  /** 查找最短路径 */
  findShortestPath: (graphId: string, sourceId: string, targetId: string) => Promise<Path | null>
  
  /** 搜索节点 */
  searchNodes: (graphId: string, query: string) => Promise<SearchResult>
  /** 过滤图谱 */
  filterGraph: (graphId: string, filter: GraphFilter) => Promise<GraphData>
  
  /** 计算布局 */
  calculateLayout: (data: GraphData, config: LayoutConfig) => Promise<GraphData>
  /** 从笔记导入 */
  importFromNotes: (noteIds: string[]) => Promise<GraphData>
  /** 导出图谱 */
  exportGraph: (data: GraphData, options: ExportOptions) => Promise<Blob | string>
}

/**
 * 图谱可视化模块钩子
 * 管理图谱模块的生命周期和服务访问
 */
export const useGraphModule = (): UseGraphModuleReturn => {
  const [graphModule, setGraphModule] = useState<GraphModule | null>(null)
  const [graphService, setGraphService] = useState<GraphService | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 模拟核心API（在实际应用中会从核心系统获取）
  const mockCoreAPI = {
    database: {
      execute: async (sql: string, params?: any[]) => {
        // 模拟数据库操作
        console.log('Database execute:', sql, params)
        return { changes: 1, lastInsertRowid: Date.now() }
      },
      query: async (sql: string, params?: any[]) => {
        // 模拟数据库查询
        console.log('Database query:', sql, params)
        return []
      }
    },
    events: {
      emit: (event: string, data: any) => {
        console.log('Event emitted:', event, data)
      },
      on: (event: string, _handler: Function) => {
        console.log('Event listener added:', event)
      },
      off: (event: string, _handler: Function) => {
        console.log('Event listener removed:', event)
      }
    },
    storage: {
      get: async (key: string) => {
        return localStorage.getItem(key)
      },
      set: async (key: string, value: string) => {
        localStorage.setItem(key, value)
      },
      remove: async (key: string) => {
        localStorage.removeItem(key)
      }
    }
  }

  // 初始化图谱模块
  const initializeModule = useCallback(async () => {
    try {
      setError(null)
      
      // 创建图谱模块实例
      const module = new GraphModule({
        enabled: true,
        settings: {
          defaultLayout: 'force',
          enableClustering: true,
          maxNodes: 5000,
          performanceMode: false,
          autoLayout: true
        },
        preferences: {
          theme: 'default',
          showLabels: true,
          enablePhysics: true,
          highlightConnected: true
        }
      })

      // 初始化模块
      await module.initialize(mockCoreAPI)
      setGraphModule(module)
      setIsInitialized(true)

      // 激活模块
      await module.activate()
      setIsActive(true)

      // 获取服务实例
      const service = module.getGraphService()
      setGraphService(service)

      console.log('图谱可视化模块初始化成功')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '初始化图谱模块失败'
      setError(errorMessage)
      console.error('Failed to initialize graph module:', err)
    }
  }, [])

  // 重新初始化模块
  const reinitialize = useCallback(async () => {
    // 清理现有状态
    if (graphModule) {
      try {
        await graphModule.deactivate()
        await graphModule.destroy()
      } catch (err) {
        console.warn('Failed to cleanup existing module:', err)
      }
    }

    setGraphModule(null)
    setGraphService(null)
    setIsInitialized(false)
    setIsActive(false)
    setError(null)

    // 重新初始化
    await initializeModule()
  }, [graphModule, initializeModule])

  // 组件挂载时初始化模块
  useEffect(() => {
    initializeModule()

    // 清理函数
    return () => {
      if (graphModule) {
        graphModule.deactivate().catch(console.error)
        graphModule.destroy().catch(console.error)
      }
    }
  }, []) // 只在组件挂载时执行一次

  // 便捷方法实现
  const createGraph = useCallback(async (title: string, description?: string): Promise<GraphData> => {
    if (!graphService) {
      throw new Error('图谱服务未初始化')
    }
    return graphService.createGraph(title, description)
  }, [graphService])

  const getGraph = useCallback(async (id: string): Promise<GraphData | null> => {
    if (!graphService) {
      throw new Error('图谱服务未初始化')
    }
    return graphService.getGraph(id)
  }, [graphService])

  const updateGraph = useCallback(async (id: string, data: Partial<GraphData>): Promise<GraphData> => {
    if (!graphService) {
      throw new Error('图谱服务未初始化')
    }
    return graphService.updateGraph(id, data)
  }, [graphService])

  const deleteGraph = useCallback(async (id: string): Promise<boolean> => {
    if (!graphService) {
      throw new Error('图谱服务未初始化')
    }
    return graphService.deleteGraph(id)
  }, [graphService])

  const addNode = useCallback(async (graphId: string, node: Omit<GraphNode, 'id'>): Promise<GraphNode> => {
    if (!graphService) {
      throw new Error('图谱服务未初始化')
    }
    return graphService.addNode(graphId, node)
  }, [graphService])

  const updateNode = useCallback(async (graphId: string, nodeId: string, updates: Partial<GraphNode>): Promise<GraphNode> => {
    if (!graphService) {
      throw new Error('图谱服务未初始化')
    }
    return graphService.updateNode(graphId, nodeId, updates)
  }, [graphService])

  const deleteNode = useCallback(async (graphId: string, nodeId: string): Promise<boolean> => {
    if (!graphService) {
      throw new Error('图谱服务未初始化')
    }
    return graphService.deleteNode(graphId, nodeId)
  }, [graphService])

  const addLink = useCallback(async (graphId: string, link: Omit<GraphLink, 'id'>): Promise<GraphLink> => {
    if (!graphService) {
      throw new Error('图谱服务未初始化')
    }
    return graphService.addLink(graphId, link)
  }, [graphService])

  const updateLink = useCallback(async (graphId: string, linkId: string, updates: Partial<GraphLink>): Promise<GraphLink> => {
    if (!graphService) {
      throw new Error('图谱服务未初始化')
    }
    return graphService.updateLink(graphId, linkId, updates)
  }, [graphService])

  const deleteLink = useCallback(async (graphId: string, linkId: string): Promise<boolean> => {
    if (!graphService) {
      throw new Error('图谱服务未初始化')
    }
    return graphService.deleteLink(graphId, linkId)
  }, [graphService])

  const linkToNote = useCallback(async (graphId: string, nodeId: string, noteId: string): Promise<boolean> => {
    if (!graphService) {
      throw new Error('图谱服务未初始化')
    }
    return graphService.linkToNote(graphId, nodeId, noteId)
  }, [graphService])

  const linkToTask = useCallback(async (graphId: string, nodeId: string, taskId: string): Promise<boolean> => {
    if (!graphService) {
      throw new Error('图谱服务未初始化')
    }
    return graphService.linkToTask(graphId, nodeId, taskId)
  }, [graphService])

  const unlinkFromNote = useCallback(async (graphId: string, nodeId: string, noteId: string): Promise<boolean> => {
    if (!graphService) {
      throw new Error('图谱服务未初始化')
    }
    return graphService.unlinkFromNote(graphId, nodeId, noteId)
  }, [graphService])

  const unlinkFromTask = useCallback(async (graphId: string, nodeId: string, taskId: string): Promise<boolean> => {
    if (!graphService) {
      throw new Error('图谱服务未初始化')
    }
    return graphService.unlinkFromTask(graphId, nodeId, taskId)
  }, [graphService])

  const calculateStats = useCallback(async (graphId: string): Promise<GraphStats> => {
    if (!graphService) {
      throw new Error('图谱服务未初始化')
    }
    return graphService.calculateStats(graphId)
  }, [graphService])

  const findClusters = useCallback(async (graphId: string, algorithm: 'connectivity' | 'tags' | 'type'): Promise<Cluster[]> => {
    if (!graphService) {
      throw new Error('图谱服务未初始化')
    }
    return graphService.findClusters(graphId, algorithm)
  }, [graphService])

  const findShortestPath = useCallback(async (graphId: string, sourceId: string, targetId: string): Promise<Path | null> => {
    if (!graphService) {
      throw new Error('图谱服务未初始化')
    }
    return graphService.findShortestPath(graphId, sourceId, targetId)
  }, [graphService])

  const searchNodes = useCallback(async (graphId: string, query: string): Promise<SearchResult> => {
    if (!graphService) {
      throw new Error('图谱服务未初始化')
    }
    return graphService.searchNodes(graphId, query)
  }, [graphService])

  const filterGraph = useCallback(async (graphId: string, filter: GraphFilter): Promise<GraphData> => {
    if (!graphService) {
      throw new Error('图谱服务未初始化')
    }
    return graphService.filterGraph(graphId, filter)
  }, [graphService])

  const calculateLayout = useCallback(async (data: GraphData, config: LayoutConfig): Promise<GraphData> => {
    if (!graphService) {
      throw new Error('图谱服务未初始化')
    }
    return graphService.calculateLayout(data, config)
  }, [graphService])

  const importFromNotes = useCallback(async (noteIds: string[]): Promise<GraphData> => {
    if (!graphService) {
      throw new Error('图谱服务未初始化')
    }
    return graphService.importFromNotes(noteIds)
  }, [graphService])

  const exportGraph = useCallback(async (data: GraphData, options: ExportOptions): Promise<Blob | string> => {
    if (!graphService) {
      throw new Error('图谱服务未初始化')
    }
    return graphService.exportGraph(data, options)
  }, [graphService])

  return {
    graphModule,
    graphService,
    isInitialized,
    isActive,
    error,
    reinitialize,
    
    // 便捷方法
    createGraph,
    getGraph,
    updateGraph,
    deleteGraph,
    addNode,
    updateNode,
    deleteNode,
    addLink,
    updateLink,
    deleteLink,
    linkToNote,
    linkToTask,
    unlinkFromNote,
    unlinkFromTask,
    calculateStats,
    findClusters,
    findShortestPath,
    searchNodes,
    filterGraph,
    calculateLayout,
    importFromNotes,
    exportGraph
  }
}

export default useGraphModule
