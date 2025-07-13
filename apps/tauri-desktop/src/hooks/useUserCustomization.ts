/**
 * 用户自定义钩子
 * 提供用户偏好设置和自定义功能的状态管理
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  UserPreferencesService,
  UserPreferences,
  ThemeConfig,
  LayoutConfig,
  EditorConfig,
  KeyboardShortcut,
  NotificationConfig,
  ThemeType,
  LanguageType,
  ViewMode
} from '../../packages/core/src/services/UserPreferencesService'

interface UseUserCustomizationReturn {
  /** 用户偏好设置服务实例 */
  preferencesService: UserPreferencesService | null
  /** 是否已初始化 */
  isInitialized: boolean
  /** 初始化错误 */
  error: string | null
  
  // 偏好设置状态
  /** 当前用户偏好设置 */
  preferences: UserPreferences | null
  /** 是否正在加载 */
  isLoading: boolean
  /** 是否正在保存 */
  isSaving: boolean
  /** 是否正在同步 */
  isSyncing: boolean
  
  // 主题相关
  /** 当前主题配置 */
  currentTheme: ThemeConfig | null
  /** 可用主题列表 */
  availableThemes: ThemeConfig[]
  
  // 布局相关
  /** 当前布局配置 */
  currentLayout: LayoutConfig | null
  /** 保存的布局列表 */
  savedLayouts: Array<{ name: string, layout: LayoutConfig }>
  
  // 快捷键相关
  /** 当前快捷键配置 */
  shortcuts: KeyboardShortcut[]
  
  // 操作方法
  /** 获取偏好设置 */
  getPreference: <T>(key: keyof UserPreferences) => T | null
  /** 设置偏好 */
  setPreference: <T>(key: keyof UserPreferences, value: T) => Promise<void>
  /** 批量设置偏好 */
  setPreferences: (updates: Partial<UserPreferences>) => Promise<void>
  /** 重置偏好设置 */
  resetPreferences: () => Promise<void>
  /** 重置特定偏好 */
  resetPreference: (key: keyof UserPreferences) => Promise<void>
  
  // 主题操作
  /** 设置主题 */
  setTheme: (theme: ThemeConfig) => Promise<void>
  /** 切换主题类型 */
  switchThemeType: (type: ThemeType) => Promise<void>
  /** 创建自定义主题 */
  createCustomTheme: (name: string, baseTheme: ThemeConfig, customizations: Partial<ThemeConfig>) => Promise<void>
  
  // 布局操作
  /** 设置布局 */
  setLayout: (layout: LayoutConfig) => Promise<void>
  /** 保存布局 */
  saveLayout: (name: string, layout: LayoutConfig) => Promise<void>
  /** 加载布局 */
  loadLayout: (name: string) => Promise<void>
  /** 删除布局 */
  deleteLayout: (name: string) => Promise<void>
  
  // 快捷键操作
  /** 设置快捷键 */
  setShortcut: (shortcut: KeyboardShortcut) => Promise<void>
  /** 删除快捷键 */
  removeShortcut: (shortcutId: string) => Promise<void>
  /** 重置快捷键 */
  resetShortcuts: () => Promise<void>
  
  // 导入导出
  /** 导出偏好设置 */
  exportPreferences: (includeCustomFields?: boolean) => string
  /** 导入偏好设置 */
  importPreferences: (data: string | Partial<UserPreferences>) => Promise<void>
  
  // 同步操作
  /** 同步到云端 */
  syncToCloud: () => Promise<void>
  /** 从云端同步 */
  syncFromCloud: () => Promise<void>
  
  // 工具方法
  /** 重新初始化服务 */
  reinitialize: () => Promise<void>
}

/**
 * 用户自定义钩子实现
 */
export const useUserCustomization = (): UseUserCustomizationReturn => {
  // 状态管理
  const [preferencesService, setPreferencesService] = useState<UserPreferencesService | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  
  const [savedLayouts, setSavedLayouts] = useState<Array<{ name: string, layout: LayoutConfig }>>([])
  const [availableThemes, setAvailableThemes] = useState<ThemeConfig[]>([])

  // 模拟核心API
  const mockCoreAPI = useMemo(() => ({
    events: {
      emit: (event: string, data: any) => {
        console.log('Event emitted:', event, data)
      }
    },
    storage: {
      get: async (key: string) => localStorage.getItem(key),
      set: async (key: string, value: string) => localStorage.setItem(key, value),
      remove: async (key: string) => localStorage.removeItem(key)
    }
  }), [])

  // 初始化服务
  const initializeService = useCallback(async () => {
    try {
      setError(null)
      setIsLoading(true)
      
      // 创建用户偏好设置服务
      const service = new UserPreferencesService(mockCoreAPI)
      setPreferencesService(service)

      // 设置事件监听器
      setupEventListeners(service)

      // 获取当前偏好设置
      const currentPreferences = service.getPreferences()
      setPreferences(currentPreferences)

      // 加载保存的布局
      await loadSavedLayouts()

      // 加载可用主题
      await loadAvailableThemes()

      setIsInitialized(true)
      console.log('用户自定义服务初始化成功')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '初始化用户自定义服务失败'
      setError(errorMessage)
      console.error('Failed to initialize user customization service:', err)
    } finally {
      setIsLoading(false)
    }
  }, [mockCoreAPI])

  // 设置事件监听器
  const setupEventListeners = useCallback((service: UserPreferencesService) => {
    // 偏好设置变更事件
    service.on('preference:changed', (event) => {
      console.log('偏好设置已变更:', event)
      setPreferences(service.getPreferences())
    })

    service.on('preferences:changed', (event) => {
      console.log('批量偏好设置已变更:', event)
      setPreferences(service.getPreferences())
    })

    service.on('preferences:reset', (event) => {
      console.log('偏好设置已重置:', event)
      setPreferences(service.getPreferences())
    })

    // 同步事件
    service.on('preferences:sync:started', () => {
      setIsSyncing(true)
    })

    service.on('preferences:sync:completed', () => {
      setIsSyncing(false)
      setPreferences(service.getPreferences())
    })

    service.on('preferences:sync:failed', (event) => {
      setIsSyncing(false)
      console.error('同步失败:', event.error)
    })

    // 迁移事件
    service.on('preferences:migrated', (event) => {
      console.log('偏好设置已迁移:', event)
      setPreferences(service.getPreferences())
    })
  }, [])

  // 加载保存的布局
  const loadSavedLayouts = useCallback(async () => {
    try {
      const layoutsData = localStorage.getItem('minglog_saved_layouts')
      if (layoutsData) {
        const layouts = JSON.parse(layoutsData)
        setSavedLayouts(layouts)
      }
    } catch (error) {
      console.error('加载保存的布局失败:', error)
    }
  }, [])

  // 加载可用主题
  const loadAvailableThemes = useCallback(async () => {
    try {
      // 这里可以从配置文件或API加载主题
      // 简化实现，使用默认主题
      const themes: ThemeConfig[] = [
        // 默认主题会从服务中获取
      ]
      setAvailableThemes(themes)
    } catch (error) {
      console.error('加载可用主题失败:', error)
    }
  }, [])

  // 重新初始化服务
  const reinitialize = useCallback(async () => {
    setPreferencesService(null)
    setIsInitialized(false)
    setError(null)
    setPreferences(null)
    setSavedLayouts([])
    setAvailableThemes([])
    
    await initializeService()
  }, [initializeService])

  // 组件挂载时初始化服务
  useEffect(() => {
    initializeService()
  }, [initializeService])

  // 获取偏好设置
  const getPreference = useCallback(<T,>(key: keyof UserPreferences): T | null => {
    if (!preferencesService) return null
    return preferencesService.getPreference<T>(key)
  }, [preferencesService])

  // 设置偏好
  const setPreference = useCallback(async <T,>(key: keyof UserPreferences, value: T): Promise<void> => {
    if (!preferencesService) {
      throw new Error('用户偏好设置服务未初始化')
    }
    
    setIsSaving(true)
    try {
      await preferencesService.setPreference(key, value)
    } finally {
      setIsSaving(false)
    }
  }, [preferencesService])

  // 批量设置偏好
  const setPreferences = useCallback(async (updates: Partial<UserPreferences>): Promise<void> => {
    if (!preferencesService) {
      throw new Error('用户偏好设置服务未初始化')
    }
    
    setIsSaving(true)
    try {
      await preferencesService.setPreferences(updates)
    } finally {
      setIsSaving(false)
    }
  }, [preferencesService])

  // 重置偏好设置
  const resetPreferences = useCallback(async (): Promise<void> => {
    if (!preferencesService) {
      throw new Error('用户偏好设置服务未初始化')
    }
    
    await preferencesService.resetPreferences()
  }, [preferencesService])

  // 重置特定偏好
  const resetPreference = useCallback(async (key: keyof UserPreferences): Promise<void> => {
    if (!preferencesService) {
      throw new Error('用户偏好设置服务未初始化')
    }
    
    await preferencesService.resetPreference(key)
  }, [preferencesService])

  // 设置主题
  const setTheme = useCallback(async (theme: ThemeConfig): Promise<void> => {
    if (!preferencesService) {
      throw new Error('用户偏好设置服务未初始化')
    }
    
    await preferencesService.setTheme(theme)
  }, [preferencesService])

  // 切换主题类型
  const switchThemeType = useCallback(async (type: ThemeType): Promise<void> => {
    if (!preferencesService || !preferences) {
      throw new Error('用户偏好设置服务未初始化')
    }
    
    const newTheme = { ...preferences.theme, type }
    await preferencesService.setTheme(newTheme)
  }, [preferencesService, preferences])

  // 创建自定义主题
  const createCustomTheme = useCallback(async (
    name: string,
    baseTheme: ThemeConfig,
    customizations: Partial<ThemeConfig>
  ): Promise<void> => {
    const customTheme: ThemeConfig = {
      ...baseTheme,
      ...customizations,
      type: ThemeType.CUSTOM,
      name
    }
    
    await setTheme(customTheme)
    
    // 保存到可用主题列表
    setAvailableThemes(prev => [...prev, customTheme])
  }, [setTheme])

  // 设置布局
  const setLayout = useCallback(async (layout: LayoutConfig): Promise<void> => {
    if (!preferencesService) {
      throw new Error('用户偏好设置服务未初始化')
    }
    
    await preferencesService.setLayoutConfig(layout)
  }, [preferencesService])

  // 保存布局
  const saveLayout = useCallback(async (name: string, layout: LayoutConfig): Promise<void> => {
    const newLayout = { name, layout }
    const updatedLayouts = [...savedLayouts, newLayout]
    
    setSavedLayouts(updatedLayouts)
    localStorage.setItem('minglog_saved_layouts', JSON.stringify(updatedLayouts))
  }, [savedLayouts])

  // 加载布局
  const loadLayout = useCallback(async (name: string): Promise<void> => {
    const savedLayout = savedLayouts.find(l => l.name === name)
    if (savedLayout) {
      await setLayout(savedLayout.layout)
    }
  }, [savedLayouts, setLayout])

  // 删除布局
  const deleteLayout = useCallback(async (name: string): Promise<void> => {
    const updatedLayouts = savedLayouts.filter(l => l.name !== name)
    setSavedLayouts(updatedLayouts)
    localStorage.setItem('minglog_saved_layouts', JSON.stringify(updatedLayouts))
  }, [savedLayouts])

  // 设置快捷键
  const setShortcut = useCallback(async (shortcut: KeyboardShortcut): Promise<void> => {
    if (!preferencesService) {
      throw new Error('用户偏好设置服务未初始化')
    }
    
    await preferencesService.setShortcut(shortcut)
  }, [preferencesService])

  // 删除快捷键
  const removeShortcut = useCallback(async (shortcutId: string): Promise<void> => {
    if (!preferencesService) {
      throw new Error('用户偏好设置服务未初始化')
    }
    
    await preferencesService.removeShortcut(shortcutId)
  }, [preferencesService])

  // 重置快捷键
  const resetShortcuts = useCallback(async (): Promise<void> => {
    await resetPreference('shortcuts')
  }, [resetPreference])

  // 导出偏好设置
  const exportPreferences = useCallback((includeCustomFields: boolean = true): string => {
    if (!preferencesService) {
      throw new Error('用户偏好设置服务未初始化')
    }
    
    return preferencesService.exportPreferences(includeCustomFields)
  }, [preferencesService])

  // 导入偏好设置
  const importPreferences = useCallback(async (data: string | Partial<UserPreferences>): Promise<void> => {
    if (!preferencesService) {
      throw new Error('用户偏好设置服务未初始化')
    }
    
    await preferencesService.importPreferences(data)
  }, [preferencesService])

  // 同步到云端
  const syncToCloud = useCallback(async (): Promise<void> => {
    if (!preferencesService) {
      throw new Error('用户偏好设置服务未初始化')
    }
    
    await preferencesService.syncToCloud()
  }, [preferencesService])

  // 从云端同步
  const syncFromCloud = useCallback(async (): Promise<void> => {
    if (!preferencesService) {
      throw new Error('用户偏好设置服务未初始化')
    }
    
    await preferencesService.syncFromCloud()
  }, [preferencesService])

  // 计算派生状态
  const currentTheme = useMemo(() => {
    return preferences?.theme || null
  }, [preferences])

  const currentLayout = useMemo(() => {
    return preferences?.layout || null
  }, [preferences])

  const shortcuts = useMemo(() => {
    return preferences?.shortcuts || []
  }, [preferences])

  return {
    preferencesService,
    isInitialized,
    error,
    
    preferences,
    isLoading,
    isSaving,
    isSyncing,
    
    currentTheme,
    availableThemes,
    
    currentLayout,
    savedLayouts,
    
    shortcuts,
    
    getPreference,
    setPreference,
    setPreferences,
    resetPreferences,
    resetPreference,
    
    setTheme,
    switchThemeType,
    createCustomTheme,
    
    setLayout,
    saveLayout,
    loadLayout,
    deleteLayout,
    
    setShortcut,
    removeShortcut,
    resetShortcuts,
    
    exportPreferences,
    importPreferences,
    
    syncToCloud,
    syncFromCloud,
    
    reinitialize
  }
}

export default useUserCustomization
