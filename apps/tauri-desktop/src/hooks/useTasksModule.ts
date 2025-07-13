/**
 * 任务模块钩子
 * 提供任务管理模块的服务访问
 */

import { useState, useEffect, useCallback } from 'react'
import { TasksModule } from '../../packages/modules/tasks/src/TasksModule'
import { 
  ITasksService, 
  IProjectsService, 
  IGTDService 
} from '../../packages/modules/tasks/src/services'

interface UseTasksModuleReturn {
  /** 任务模块实例 */
  tasksModule: TasksModule | null
  /** 任务服务 */
  tasksService: ITasksService | null
  /** 项目服务 */
  projectsService: IProjectsService | null
  /** GTD服务 */
  gtdService: IGTDService | null
  /** 模块是否已初始化 */
  isInitialized: boolean
  /** 模块是否已激活 */
  isActive: boolean
  /** 初始化错误 */
  error: string | null
  /** 重新初始化模块 */
  reinitialize: () => Promise<void>
}

/**
 * 任务模块钩子
 * 管理任务模块的生命周期和服务访问
 */
export const useTasksModule = (): UseTasksModuleReturn => {
  const [tasksModule, setTasksModule] = useState<TasksModule | null>(null)
  const [tasksService, setTasksService] = useState<ITasksService | null>(null)
  const [projectsService, setProjectsService] = useState<IProjectsService | null>(null)
  const [gtdService, setGTDService] = useState<IGTDService | null>(null)
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
      on: (event: string, handler: Function) => {
        console.log('Event listener added:', event)
      },
      off: (event: string, handler: Function) => {
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

  // 初始化任务模块
  const initializeModule = useCallback(async () => {
    try {
      setError(null)
      
      // 创建任务模块实例
      const module = new TasksModule({
        enabled: true,
        settings: {
          enableGTD: true,
          enableTimeTracking: true,
          enableKanban: true,
          enableNotifications: true
        },
        preferences: {
          defaultPriority: 'medium',
          defaultView: 'list',
          autoSave: true
        }
      })

      // 初始化模块
      await module.initialize(mockCoreAPI)
      setTasksModule(module)
      setIsInitialized(true)

      // 激活模块
      await module.activate()
      setIsActive(true)

      // 获取服务实例
      const tasks = module.getTasksService()
      const projects = module.getProjectsService()
      const gtd = module.getGTDService()

      setTasksService(tasks)
      setProjectsService(projects)
      setGTDService(gtd)

      console.log('Tasks module initialized successfully')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '初始化任务模块失败'
      setError(errorMessage)
      console.error('Failed to initialize tasks module:', err)
    }
  }, [])

  // 重新初始化模块
  const reinitialize = useCallback(async () => {
    // 清理现有状态
    if (tasksModule) {
      try {
        await tasksModule.deactivate()
        await tasksModule.destroy()
      } catch (err) {
        console.warn('Failed to cleanup existing module:', err)
      }
    }

    setTasksModule(null)
    setTasksService(null)
    setProjectsService(null)
    setGTDService(null)
    setIsInitialized(false)
    setIsActive(false)
    setError(null)

    // 重新初始化
    await initializeModule()
  }, [tasksModule, initializeModule])

  // 组件挂载时初始化模块
  useEffect(() => {
    initializeModule()

    // 清理函数
    return () => {
      if (tasksModule) {
        tasksModule.deactivate().catch(console.error)
        tasksModule.destroy().catch(console.error)
      }
    }
  }, []) // 只在组件挂载时执行一次

  // 监听模块状态变化
  useEffect(() => {
    if (tasksModule) {
      const handleModuleEvent = (event: any) => {
        console.log('Module event:', event)
        // 处理模块事件
      }

      // 添加事件监听器
      tasksModule.onEvent(handleModuleEvent)

      return () => {
        // 清理事件监听器
        // 注意：实际实现中需要提供移除监听器的方法
      }
    }
  }, [tasksModule])

  return {
    tasksModule,
    tasksService,
    projectsService,
    gtdService,
    isInitialized,
    isActive,
    error,
    reinitialize
  }
}

export default useTasksModule
