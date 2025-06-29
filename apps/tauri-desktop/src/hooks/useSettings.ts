import { useState, useEffect, useCallback } from 'react'
import { 
  getSettings, 
  updateSettings,
  withErrorHandling 
} from '../utils/tauri'

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto'
  language: 'en' | 'zh' | 'ja'
  fontSize: 'small' | 'medium' | 'large'
  startWithSystem: boolean
  minimizeToTray: boolean
  autoSave: boolean
  autoSaveInterval: number // in seconds
  showLineNumbers: boolean
  wordWrap: boolean
  spellCheck: boolean
}

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'auto',
  language: 'en',
  fontSize: 'medium',
  startWithSystem: false,
  minimizeToTray: true,
  autoSave: true,
  autoSaveInterval: 30,
  showLineNumbers: true,
  wordWrap: true,
  spellCheck: true
}

interface UseSettingsReturn {
  settings: AppSettings
  loading: boolean
  error: string | null
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<boolean>
  updateMultipleSettings: (updates: Partial<AppSettings>) => Promise<boolean>
  resetToDefaults: () => Promise<boolean>
  refreshSettings: () => Promise<void>
  clearError: () => void
}

export const useSettings = (): UseSettingsReturn => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadSettings = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    const result = await withErrorHandling(
      () => getSettings(),
      'Failed to load settings'
    )
    
    if (result) {
      // Merge with defaults to ensure all settings exist
      const mergedSettings = { ...DEFAULT_SETTINGS }
      
      Object.entries(result).forEach(([key, value]) => {
        if (key in DEFAULT_SETTINGS) {
          try {
            // Parse JSON values if they're strings
            const parsedValue = typeof value === 'string' ? JSON.parse(value) : value
            ;(mergedSettings as any)[key] = parsedValue
          } catch {
            // If parsing fails, use the string value directly
            ;(mergedSettings as any)[key] = value
          }
        }
      })
      
      setSettings(mergedSettings)
    } else {
      setError('Failed to load settings')
      setSettings(DEFAULT_SETTINGS)
    }
    
    setLoading(false)
  }, [])

  const updateSetting = useCallback(async <K extends keyof AppSettings>(
    key: K, 
    value: AppSettings[K]
  ): Promise<boolean> => {
    setError(null)
    
    const settingsUpdate = { [key]: JSON.stringify(value) }
    
    const result = await withErrorHandling(
      () => updateSettings(settingsUpdate),
      `Failed to update setting: ${key}`
    )
    
    if (result !== null) {
      setSettings(prev => ({ ...prev, [key]: value }))
      return true
    } else {
      setError(`Failed to update setting: ${key}`)
      return false
    }
  }, [])

  const updateMultipleSettings = useCallback(async (updates: Partial<AppSettings>): Promise<boolean> => {
    setError(null)
    
    const settingsUpdate: Record<string, string> = {}
    Object.entries(updates).forEach(([key, value]) => {
      settingsUpdate[key] = JSON.stringify(value)
    })
    
    const result = await withErrorHandling(
      () => updateSettings(settingsUpdate),
      'Failed to update settings'
    )
    
    if (result !== null) {
      setSettings(prev => ({ ...prev, ...updates }))
      return true
    } else {
      setError('Failed to update settings')
      return false
    }
  }, [])

  const resetToDefaults = useCallback(async (): Promise<boolean> => {
    return await updateMultipleSettings(DEFAULT_SETTINGS)
  }, [updateMultipleSettings])

  const refreshSettings = useCallback(async () => {
    await loadSettings()
  }, [loadSettings])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  return {
    settings,
    loading,
    error,
    updateSetting,
    updateMultipleSettings,
    resetToDefaults,
    refreshSettings,
    clearError
  }
}
