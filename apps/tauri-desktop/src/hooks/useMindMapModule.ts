/**
 * 思维导图模块钩子
 * 提供思维导图模块的服务访问和状态管理
 */

import { useState, useEffect, useCallback } from 'react'
import { MindMapModule, MindMapService } from '@minglog/mindmap'
import { MindMapData, MindMapNode, LayoutConfig, ExportConfig } from '@minglog/mindmap'

interface UseMindMapModuleReturn {
  /** 思维导图模块实例 */
  mindMapModule: MindMapModule | null
  /** 思维导图服务 */
  mindMapService: MindMapService | null
  /** 模块是否已初始化 */
  isInitialized: boolean
  /** 模块是否已激活 */
  isActive: boolean
  /** 初始化错误 */
  error: string | null
  /** 重新初始化模块 */
  reinitialize: () => Promise<void>
  
  // 便捷方法
  /** 创建思维导图 */
  createMindMap: (title: string, description?: string) => Promise<MindMapData>
  /** 获取思维导图 */
  getMindMap: (id: string) => Promise<MindMapData | null>
  /** 更新思维导图 */
  updateMindMap: (id: string, data: Partial<MindMapData>) => Promise<MindMapData>
  /** 删除思维导图 */
  deleteMindMap: (id: string) => Promise<boolean>
  
  /** 添加节点 */
  addNode: (mapId: string, parentId: string, text: string) => Promise<MindMapNode>
  /** 更新节点 */
  updateNode: (mapId: string, nodeId: string, updates: Partial<MindMapNode>) => Promise<MindMapNode>
  /** 删除节点 */
  deleteNode: (mapId: string, nodeId: string) => Promise<boolean>
  /** 移动节点 */
  moveNode: (mapId: string, nodeId: string, newParentId: string) => Promise<boolean>
  
  /** 计算布局 */
  calculateLayout: (data: MindMapData, config: LayoutConfig) => Promise<MindMapData>
  /** 导出思维导图 */
  exportMindMap: (data: MindMapData, config: ExportConfig) => Promise<Blob | string>
  /** 搜索节点 */
  searchNodes: (mapId: string, query: string) => Promise<MindMapNode[]>
}

/**
 * 思维导图模块钩子
 * 管理思维导图模块的生命周期和服务访问
 */
export const useMindMapModule = (): UseMindMapModuleReturn => {
  const [mindMapModule, setMindMapModule] = useState<MindMapModule | null>(null)
  const [mindMapService, setMindMapService] = useState<MindMapService | null>(null)
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

  // 初始化思维导图模块
  const initializeModule = useCallback(async () => {
    try {
      setError(null)
      
      // 创建思维导图模块实例
      const module = new MindMapModule({
        enabled: true,
        settings: {
          defaultLayout: 'tree',
          enableAnimation: true,
          maxNodes: 1000,
          autoSave: true
        },
        preferences: {
          theme: 'default',
          showGrid: false,
          showMinimap: true
        }
      })

      // 初始化模块
      await module.initialize(mockCoreAPI)
      setMindMapModule(module)
      setIsInitialized(true)

      // 激活模块
      await module.activate()
      setIsActive(true)

      // 获取服务实例
      const service = module.getMindMapService()
      setMindMapService(service)

      console.log('思维导图模块初始化成功')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '初始化思维导图模块失败'
      setError(errorMessage)
      console.error('Failed to initialize mindmap module:', err)
    }
  }, [])

  // 重新初始化模块
  const reinitialize = useCallback(async () => {
    // 清理现有状态
    if (mindMapModule) {
      try {
        await mindMapModule.deactivate()
        await mindMapModule.destroy()
      } catch (err) {
        console.warn('Failed to cleanup existing module:', err)
      }
    }

    setMindMapModule(null)
    setMindMapService(null)
    setIsInitialized(false)
    setIsActive(false)
    setError(null)

    // 重新初始化
    await initializeModule()
  }, [mindMapModule, initializeModule])

  // 组件挂载时初始化模块
  useEffect(() => {
    initializeModule()

    // 清理函数
    return () => {
      if (mindMapModule) {
        mindMapModule.deactivate().catch(console.error)
        mindMapModule.destroy().catch(console.error)
      }
    }
  }, []) // 只在组件挂载时执行一次

  // 便捷方法
  const createMindMap = useCallback(async (title: string, description?: string): Promise<MindMapData> => {
    if (!mindMapService) {
      throw new Error('思维导图服务未初始化')
    }
    return mindMapService.createMindMap(title, description)
  }, [mindMapService])

  const getMindMap = useCallback(async (id: string): Promise<MindMapData | null> => {
    if (!mindMapService) {
      throw new Error('思维导图服务未初始化')
    }
    return mindMapService.getMindMap(id)
  }, [mindMapService])

  const updateMindMap = useCallback(async (id: string, data: Partial<MindMapData>): Promise<MindMapData> => {
    if (!mindMapService) {
      throw new Error('思维导图服务未初始化')
    }
    return mindMapService.updateMindMap(id, data)
  }, [mindMapService])

  const deleteMindMap = useCallback(async (id: string): Promise<boolean> => {
    if (!mindMapService) {
      throw new Error('思维导图服务未初始化')
    }
    return mindMapService.deleteMindMap(id)
  }, [mindMapService])

  const addNode = useCallback(async (mapId: string, parentId: string, text: string): Promise<MindMapNode> => {
    if (!mindMapService) {
      throw new Error('思维导图服务未初始化')
    }
    return mindMapService.addNode(mapId, parentId, text)
  }, [mindMapService])

  const updateNode = useCallback(async (mapId: string, nodeId: string, updates: Partial<MindMapNode>): Promise<MindMapNode> => {
    if (!mindMapService) {
      throw new Error('思维导图服务未初始化')
    }
    return mindMapService.updateNode(mapId, nodeId, updates)
  }, [mindMapService])

  const deleteNode = useCallback(async (mapId: string, nodeId: string): Promise<boolean> => {
    if (!mindMapService) {
      throw new Error('思维导图服务未初始化')
    }
    return mindMapService.deleteNode(mapId, nodeId)
  }, [mindMapService])

  const moveNode = useCallback(async (mapId: string, nodeId: string, newParentId: string): Promise<boolean> => {
    if (!mindMapService) {
      throw new Error('思维导图服务未初始化')
    }
    return mindMapService.moveNode(mapId, nodeId, newParentId)
  }, [mindMapService])

  const calculateLayout = useCallback(async (data: MindMapData, config: LayoutConfig): Promise<MindMapData> => {
    if (!mindMapService) {
      throw new Error('思维导图服务未初始化')
    }
    return mindMapService.calculateLayout(data, config)
  }, [mindMapService])

  const exportMindMap = useCallback(async (data: MindMapData, config: ExportConfig): Promise<Blob | string> => {
    if (!mindMapService) {
      throw new Error('思维导图服务未初始化')
    }
    return mindMapService.exportMindMap(data, config)
  }, [mindMapService])

  const searchNodes = useCallback(async (mapId: string, query: string): Promise<MindMapNode[]> => {
    if (!mindMapService) {
      throw new Error('思维导图服务未初始化')
    }
    return mindMapService.searchNodes(mapId, query)
  }, [mindMapService])

  return {
    mindMapModule,
    mindMapService,
    isInitialized,
    isActive,
    error,
    reinitialize,
    
    // 便捷方法
    createMindMap,
    getMindMap,
    updateMindMap,
    deleteMindMap,
    addNode,
    updateNode,
    deleteNode,
    moveNode,
    calculateLayout,
    exportMindMap,
    searchNodes
  }
}

export default useMindMapModule
