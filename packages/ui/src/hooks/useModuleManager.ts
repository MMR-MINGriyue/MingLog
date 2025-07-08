/**
 * 模块管理Hook
 * 提供模块状态管理和操作功能
 */

import { useState, useEffect, useCallback } from 'react'
import { ModuleConfig, ModuleStatus, MingLogCore } from '@minglog/core'

export interface UseModuleManagerOptions {
  core: MingLogCore
  autoRefresh?: boolean
  refreshInterval?: number
}

export interface UseModuleManagerReturn {
  modules: ModuleConfig[]
  moduleStatuses: Record<string, ModuleStatus>
  moduleSettings: Record<string, any>
  moduleSchemas: Record<string, any[]>
  loading: boolean
  error: string | null
  toggleModule: (moduleId: string, enabled: boolean) => Promise<void>
  updateModuleConfig: (moduleId: string, config: Record<string, any>) => Promise<void>
  refresh: () => Promise<void>
}

export function useModuleManager(options: UseModuleManagerOptions): UseModuleManagerReturn {
  const { core, autoRefresh = false, refreshInterval = 5000 } = options
  
  const [modules, setModules] = useState<ModuleConfig[]>([])
  const [moduleStatuses, setModuleStatuses] = useState<Record<string, ModuleStatus>>({})
  const [moduleSettings, setModuleSettings] = useState<Record<string, any>>({})
  const [moduleSchemas, setModuleSchemas] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 刷新模块列表和状态
  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const moduleManager = core.getModuleManager()
      
      // 获取所有注册的模块
      const registeredModules = moduleManager.getRegisteredModules()
      setModules(registeredModules)

      // 获取模块状态
      const statuses: Record<string, ModuleStatus> = {}
      const settings: Record<string, any> = {}
      const schemas: Record<string, any[]> = {}

      for (const module of registeredModules) {
        statuses[module.id] = moduleManager.getModuleStatus(module.id) || ModuleStatus.UNLOADED

        // 获取模块实例以获取设置模式
        const moduleInstance = moduleManager.getModule(module.id)
        if (moduleInstance && moduleInstance.getSettings) {
          schemas[module.id] = moduleInstance.getSettings()
        }

        // 获取当前设置值
        try {
          settings[module.id] = await core.getCoreAPI().settings.getModuleSettings(module.id)
        } catch (err) {
          settings[module.id] = {}
        }
      }

      setModuleStatuses(statuses)
      setModuleSettings(settings)
      setModuleSchemas(schemas)

    } catch (err) {
      setError(err instanceof Error ? err.message : '获取模块信息失败')
      console.error('Failed to refresh modules:', err)
    } finally {
      setLoading(false)
    }
  }, [core])

  // 切换模块启用状态
  const toggleModule = useCallback(async (moduleId: string, enabled: boolean) => {
    try {
      const moduleManager = core.getModuleManager()
      
      if (enabled) {
        await moduleManager.activateModule(moduleId)
      } else {
        await moduleManager.deactivateModule(moduleId)
      }

      // 更新本地状态
      setModules(prev => prev.map(module => 
        module.id === moduleId ? { ...module, enabled } : module
      ))

      // 刷新状态
      const newStatus = moduleManager.getModuleStatus(moduleId) || ModuleStatus.UNLOADED
      setModuleStatuses(prev => ({ ...prev, [moduleId]: newStatus }))

    } catch (err) {
      setError(err instanceof Error ? err.message : '模块操作失败')
      console.error('Failed to toggle module:', err)
      throw err
    }
  }, [core])

  // 更新模块配置
  const updateModuleConfig = useCallback(async (moduleId: string, config: Record<string, any>) => {
    try {
      const coreAPI = core.getCoreAPI()
      await coreAPI.settings.setModuleSettings(moduleId, config)

      // 更新本地状态
      setModules(prev => prev.map(module =>
        module.id === moduleId ? { ...module, settings: { ...module.settings, ...config } } : module
      ))

      setModuleSettings(prev => ({
        ...prev,
        [moduleId]: { ...prev[moduleId], ...config }
      }))

    } catch (err) {
      setError(err instanceof Error ? err.message : '更新模块配置失败')
      console.error('Failed to update module config:', err)
      throw err
    }
  }, [core])

  // 监听模块事件
  useEffect(() => {
    const eventBus = core.getEventBus()
    
    const handleModuleEvent = (event: any) => {
      const { moduleId } = event.data
      if (moduleId) {
        // 更新特定模块的状态
        const moduleManager = core.getModuleManager()
        const newStatus = moduleManager.getModuleStatus(moduleId) || 'unloaded'
        setModuleStatuses(prev => ({ ...prev, [moduleId]: newStatus }))
      }
    }

    // 监听模块生命周期事件
    eventBus.on('module:activated', handleModuleEvent)
    eventBus.on('module:deactivated', handleModuleEvent)
    eventBus.on('module:error', handleModuleEvent)

    return () => {
      eventBus.off('module:activated', handleModuleEvent)
      eventBus.off('module:deactivated', handleModuleEvent)
      eventBus.off('module:error', handleModuleEvent)
    }
  }, [core])

  // 自动刷新
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(refresh, refreshInterval)
      return () => clearInterval(interval)
    }
  }, [autoRefresh, refreshInterval, refresh])

  // 初始加载
  useEffect(() => {
    refresh()
  }, [refresh])

  return {
    modules,
    moduleStatuses,
    moduleSettings,
    moduleSchemas,
    loading,
    error,
    toggleModule,
    updateModuleConfig,
    refresh
  }
}
