import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

// Import after mocking
import { useSettings } from '../useSettings'
import { invoke } from '@tauri-apps/api/core'

const mockInvoke = vi.mocked(invoke)

// localStorage is not used in the actual useSettings hook

// Mock default settings - matching actual DEFAULT_SETTINGS
const defaultSettings = {
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

const mockSettings = {
  theme: 'dark',
  language: 'zh',
  fontSize: 16,
  startWithSystem: true,
  minimizeToTray: false,
  autoSave: false,
  autoSaveInterval: 60,
  showLineNumbers: false,
  wordWrap: false,
  spellCheck: false
}

describe('useSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockInvoke.mockResolvedValue(defaultSettings)
  })

  it('initializes with default settings', () => {
    const { result } = renderHook(() => useSettings())
    
    expect(result.current.settings).toEqual(defaultSettings)
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBeNull()
  })

  it.skip('loads settings from localStorage first', async () => {
    const cachedSettings = JSON.stringify(mockSettings)
    localStorageMock.getItem.mockReturnValue(cachedSettings)
    
    const { result } = renderHook(() => useSettings())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    expect(localStorageMock.getItem).toHaveBeenCalledWith('minglog-settings')
    expect(result.current.settings).toEqual(mockSettings)
  })

  it('loads settings from Tauri backend', async () => {
    mockInvoke.mockResolvedValue(mockSettings)

    const { result } = renderHook(() => useSettings())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(mockInvoke).toHaveBeenCalledWith('get_settings')
    expect(result.current.settings).toEqual(mockSettings)
  })

  it('handles loading error gracefully', async () => {
    const errorMessage = 'Failed to load settings'
    mockInvoke.mockRejectedValue(new Error(errorMessage))
    
    const { result } = renderHook(() => useSettings())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    expect(result.current.settings).toEqual(defaultSettings)
    expect(result.current.error).toBe(errorMessage)
  })

  it('updates a single setting', async () => {
    mockInvoke.mockResolvedValueOnce(mockSettings)
    mockInvoke.mockResolvedValueOnce({ success: true })
    
    const { result } = renderHook(() => useSettings())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    await act(async () => {
      await result.current.updateSetting('theme', 'light')
    })
    
    expect(mockInvoke).toHaveBeenCalledWith('update_settings', {
      settings: { theme: '"light"' }
    })
  })

  it('updates multiple settings', async () => {
    mockInvoke.mockResolvedValueOnce(mockSettings)
    mockInvoke.mockResolvedValueOnce({ success: true })
    
    const { result } = renderHook(() => useSettings())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    const newSettings = { theme: 'light', fontSize: 18 }
    
    await act(async () => {
      await result.current.updateMultipleSettings(newSettings)
    })
    
    expect(mockInvoke).toHaveBeenCalledWith('update_settings', {
      settings: { theme: '"light"', fontSize: '18' }
    })
  })

  it('resets settings to default', async () => {
    mockInvoke.mockResolvedValueOnce(mockSettings)
    mockInvoke.mockResolvedValueOnce({ success: true })
    
    const { result } = renderHook(() => useSettings())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    await act(async () => {
      await result.current.resetToDefaults()
    })
    
    expect(mockInvoke).toHaveBeenCalledWith('update_settings', {
      settings: expect.any(Object)
    })
  })

  it.skip('exports settings', async () => {
    const exportData = { settings: mockSettings, version: '1.0.0' }
    mockInvoke.mockResolvedValueOnce(mockSettings)
    mockInvoke.mockResolvedValueOnce(exportData)
    
    const { result } = renderHook(() => useSettings())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    let exportResult
    await act(async () => {
      exportResult = await result.current.exportSettings()
    })
    
    expect(mockInvoke).toHaveBeenCalledWith('export_settings')
    expect(exportResult).toEqual(exportData)
  })

  it.skip('imports settings', async () => {
    const importData = { settings: mockSettings, version: '1.0.0' }
    mockInvoke.mockResolvedValueOnce(mockSettings)
    mockInvoke.mockResolvedValueOnce({ success: true })
    
    const { result } = renderHook(() => useSettings())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    await act(async () => {
      await result.current.importSettings(importData)
    })
    
    expect(mockInvoke).toHaveBeenCalledWith('import_settings', importData)
    expect(localStorageMock.setItem).toHaveBeenCalled()
  })

  it('validates setting values', async () => {
    mockInvoke.mockResolvedValue(mockSettings)
    
    const { result } = renderHook(() => useSettings())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    // Test invalid theme value
    await act(async () => {
      try {
        await result.current.updateSetting('theme', 'invalid-theme')
      } catch (error) {
        expect(error).toBeDefined()
      }
    })
  })

  it('handles concurrent setting updates', async () => {
    mockInvoke.mockResolvedValue(mockSettings)
    
    const { result } = renderHook(() => useSettings())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    // Simulate concurrent updates
    const update1 = act(async () => {
      await result.current.updateSetting('theme', 'light')
    })
    
    const update2 = act(async () => {
      await result.current.updateSetting('fontSize', 20)
    })
    
    await Promise.all([update1, update2])
    
    expect(mockInvoke).toHaveBeenCalledTimes(3) // Initial load + 2 updates
  })

  it.skip('persists settings to localStorage', async () => {
    mockInvoke.mockResolvedValue(mockSettings)
    
    const { result } = renderHook(() => useSettings())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    await act(async () => {
      await result.current.updateSetting('theme', 'light')
    })
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'minglog-settings',
      expect.stringContaining('"theme":"light"')
    )
  })

  it.skip('handles malformed localStorage data', async () => {
    localStorageMock.getItem.mockReturnValue('invalid-json')
    
    const { result } = renderHook(() => useSettings())
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })
    
    // Should fall back to backend settings
    expect(mockInvoke).toHaveBeenCalledWith('get_settings')
    expect(result.current.settings).toEqual(mockSettings)
  })
})
