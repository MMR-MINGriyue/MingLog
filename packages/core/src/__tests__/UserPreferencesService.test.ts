/**
 * 用户偏好设置服务测试
 * 测试用户自定义功能、主题管理、布局配置等
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  UserPreferencesService,
  ThemeType,
  LanguageType,
  ViewMode,
  KeyboardShortcut
} from '../services/UserPreferencesService'

// 模拟存储API
const mockStorage = {
  data: new Map<string, string>(),
  get: vi.fn(async (key: string) => mockStorage.data.get(key) || null),
  set: vi.fn(async (key: string, value: string) => mockStorage.data.set(key, value)),
  remove: vi.fn(async (key: string) => mockStorage.data.delete(key))
}

// 模拟核心API
const mockCoreAPI = {
  events: {
    emit: vi.fn()
  },
  storage: mockStorage
}

describe('UserPreferencesService', () => {
  let userPreferencesService: UserPreferencesService

  beforeEach(() => {
    vi.clearAllMocks()
    mockStorage.data.clear()
    userPreferencesService = new UserPreferencesService(mockCoreAPI)
  })

  describe('基础偏好设置', () => {
    it('应该能够获取默认偏好设置', () => {
      const preferences = userPreferencesService.getPreferences()

      expect(preferences).toBeDefined()
      expect(preferences.language).toBe(LanguageType.ZH_CN)
      expect(preferences.theme.type).toBe(ThemeType.LIGHT)
      expect(preferences.defaultViewMode).toBe(ViewMode.LIST)
      expect(preferences.version).toBeDefined()
    })

    it('应该能够获取特定偏好设置', () => {
      const language = userPreferencesService.getPreference<LanguageType>('language')
      const theme = userPreferencesService.getPreference('theme')

      expect(language).toBe(LanguageType.ZH_CN)
      expect(theme).toBeDefined()
      expect(theme.type).toBe(ThemeType.LIGHT)
    })

    it('应该能够设置单个偏好', async () => {
      // 设置事件监听器来验证事件触发
      const eventSpy = vi.fn()
      userPreferencesService.on('preference:changed', eventSpy)

      await userPreferencesService.setPreference('language', LanguageType.EN_US)

      const language = userPreferencesService.getPreference<LanguageType>('language')
      expect(language).toBe(LanguageType.EN_US)

      // 验证事件被正确触发
      expect(eventSpy).toHaveBeenCalledWith(expect.objectContaining({
        key: 'language',
        newValue: LanguageType.EN_US
      }))
    })

    it('应该能够批量设置偏好', async () => {
      // 设置事件监听器来验证事件触发
      const eventSpy = vi.fn()
      userPreferencesService.on('preferences:changed', eventSpy)

      const updates = {
        language: LanguageType.EN_US,
        defaultViewMode: ViewMode.GRID,
        itemsPerPage: 50
      }

      await userPreferencesService.setPreferences(updates)

      const preferences = userPreferencesService.getPreferences()
      expect(preferences.language).toBe(LanguageType.EN_US)
      expect(preferences.defaultViewMode).toBe(ViewMode.GRID)
      expect(preferences.itemsPerPage).toBe(50)

      // 验证批量变更事件被正确触发
      expect(eventSpy).toHaveBeenCalledWith(expect.objectContaining({
        changes: expect.any(Array)
      }))
    })

    it('应该能够重置偏好设置', async () => {
      // 设置事件监听器来验证事件触发
      const eventSpy = vi.fn()
      userPreferencesService.on('preferences:reset', eventSpy)

      // 先修改一些设置
      await userPreferencesService.setPreference('language', LanguageType.EN_US)
      await userPreferencesService.setPreference('itemsPerPage', 100)

      // 重置
      await userPreferencesService.resetPreferences()

      const preferences = userPreferencesService.getPreferences()
      expect(preferences.language).toBe(LanguageType.ZH_CN) // 默认值
      expect(preferences.itemsPerPage).toBe(20) // 默认值

      // 验证重置事件被正确触发
      expect(eventSpy).toHaveBeenCalledWith(expect.objectContaining({
        oldPreferences: expect.any(Object),
        newPreferences: expect.any(Object)
      }))
    })

    it('应该能够重置特定偏好', async () => {
      // 修改语言设置
      await userPreferencesService.setPreference('language', LanguageType.EN_US)
      
      // 重置语言设置
      await userPreferencesService.resetPreference('language')
      
      const language = userPreferencesService.getPreference<LanguageType>('language')
      expect(language).toBe(LanguageType.ZH_CN) // 默认值
    })
  })

  describe('主题管理', () => {
    it('应该能够获取主题配置', () => {
      const theme = userPreferencesService.getThemeConfig()
      
      expect(theme).toBeDefined()
      expect(theme.type).toBe(ThemeType.LIGHT)
      expect(theme.name).toBeDefined()
      expect(theme.colors).toBeDefined()
      expect(theme.fonts).toBeDefined()
    })

    it('应该能够设置主题', async () => {
      const newTheme = {
        ...userPreferencesService.getThemeConfig(),
        type: ThemeType.DARK,
        name: '深色主题'
      }

      await userPreferencesService.setTheme(newTheme)
      
      const theme = userPreferencesService.getThemeConfig()
      expect(theme.type).toBe(ThemeType.DARK)
      expect(theme.name).toBe('深色主题')
    })

    it('应该能够创建自定义主题', async () => {
      const customTheme = {
        ...userPreferencesService.getThemeConfig(),
        type: ThemeType.CUSTOM,
        name: '自定义主题',
        colors: {
          ...userPreferencesService.getThemeConfig().colors,
          primary: '#ff6b6b'
        }
      }

      await userPreferencesService.setTheme(customTheme)
      
      const theme = userPreferencesService.getThemeConfig()
      expect(theme.type).toBe(ThemeType.CUSTOM)
      expect(theme.colors.primary).toBe('#ff6b6b')
    })
  })

  describe('布局管理', () => {
    it('应该能够获取布局配置', () => {
      const layout = userPreferencesService.getLayoutConfig()
      
      expect(layout).toBeDefined()
      expect(layout.sidebar).toBeDefined()
      expect(layout.header).toBeDefined()
      expect(layout.footer).toBeDefined()
      expect(layout.panels).toBeDefined()
      expect(layout.grid).toBeDefined()
    })

    it('应该能够设置布局配置', async () => {
      const newLayout = {
        ...userPreferencesService.getLayoutConfig(),
        sidebar: {
          ...userPreferencesService.getLayoutConfig().sidebar,
          width: 320,
          collapsed: true
        }
      }

      await userPreferencesService.setLayoutConfig(newLayout)
      
      const layout = userPreferencesService.getLayoutConfig()
      expect(layout.sidebar.width).toBe(320)
      expect(layout.sidebar.collapsed).toBe(true)
    })

    it('应该能够管理面板配置', async () => {
      const layout = userPreferencesService.getLayoutConfig()
      layout.panels['test-panel'] = {
        width: 300,
        height: 400,
        position: 'right',
        visible: true,
        resizable: true
      }

      await userPreferencesService.setLayoutConfig(layout)
      
      const updatedLayout = userPreferencesService.getLayoutConfig()
      expect(updatedLayout.panels['test-panel']).toBeDefined()
      expect(updatedLayout.panels['test-panel'].width).toBe(300)
    })
  })

  describe('快捷键管理', () => {
    it('应该能够获取快捷键配置', () => {
      const shortcuts = userPreferencesService.getShortcuts()
      
      expect(Array.isArray(shortcuts)).toBe(true)
      expect(shortcuts.length).toBeGreaterThan(0)
      
      // 检查默认快捷键
      const saveShortcut = shortcuts.find(s => s.id === 'save')
      expect(saveShortcut).toBeDefined()
      expect(saveShortcut?.keys).toEqual(['Ctrl', 'S'])
    })

    it('应该能够设置快捷键', async () => {
      const newShortcut: KeyboardShortcut = {
        id: 'test-shortcut',
        name: '测试快捷键',
        description: '这是一个测试快捷键',
        keys: ['Ctrl', 'Alt', 'T'],
        action: 'test-action',
        enabled: true,
        modifiable: true
      }

      await userPreferencesService.setShortcut(newShortcut)
      
      const shortcuts = userPreferencesService.getShortcuts()
      const testShortcut = shortcuts.find(s => s.id === 'test-shortcut')
      expect(testShortcut).toBeDefined()
      expect(testShortcut?.keys).toEqual(['Ctrl', 'Alt', 'T'])
    })

    it('应该能够修改现有快捷键', async () => {
      const shortcuts = userPreferencesService.getShortcuts()
      const saveShortcut = shortcuts.find(s => s.id === 'save')!
      
      const modifiedShortcut = {
        ...saveShortcut,
        keys: ['Ctrl', 'Shift', 'S']
      }

      await userPreferencesService.setShortcut(modifiedShortcut)
      
      const updatedShortcuts = userPreferencesService.getShortcuts()
      const updatedSaveShortcut = updatedShortcuts.find(s => s.id === 'save')
      expect(updatedSaveShortcut?.keys).toEqual(['Ctrl', 'Shift', 'S'])
    })

    it('应该能够删除快捷键', async () => {
      // 先添加一个快捷键
      const testShortcut: KeyboardShortcut = {
        id: 'test-delete',
        name: '待删除快捷键',
        description: '这个快捷键将被删除',
        keys: ['Ctrl', 'D'],
        action: 'delete-test',
        enabled: true,
        modifiable: true
      }

      await userPreferencesService.setShortcut(testShortcut)
      
      // 删除快捷键
      await userPreferencesService.removeShortcut('test-delete')
      
      const shortcuts = userPreferencesService.getShortcuts()
      const deletedShortcut = shortcuts.find(s => s.id === 'test-delete')
      expect(deletedShortcut).toBeUndefined()
    })
  })

  describe('编辑器配置', () => {
    it('应该能够获取编辑器配置', () => {
      const editor = userPreferencesService.getEditorConfig()
      
      expect(editor).toBeDefined()
      expect(editor.theme).toBeDefined()
      expect(editor.fontSize).toBeGreaterThan(0)
      expect(editor.fontFamily).toBeDefined()
      expect(typeof editor.wordWrap).toBe('boolean')
    })

    it('应该能够设置编辑器配置', async () => {
      const newEditor = {
        ...userPreferencesService.getEditorConfig(),
        fontSize: 16,
        theme: 'vs-dark',
        wordWrap: false
      }

      await userPreferencesService.setEditorConfig(newEditor)
      
      const editor = userPreferencesService.getEditorConfig()
      expect(editor.fontSize).toBe(16)
      expect(editor.theme).toBe('vs-dark')
      expect(editor.wordWrap).toBe(false)
    })
  })

  describe('导入导出', () => {
    it('应该能够导出偏好设置', () => {
      const exported = userPreferencesService.exportPreferences()
      
      expect(typeof exported).toBe('string')
      
      const parsed = JSON.parse(exported)
      expect(parsed.language).toBeDefined()
      expect(parsed.theme).toBeDefined()
      expect(parsed.version).toBeDefined()
    })

    it('应该能够导出偏好设置（不包含自定义字段）', () => {
      // 先设置一些自定义字段
      const preferences = userPreferencesService.getPreferences()
      preferences.customFields = { test: 'value' }
      
      const exported = userPreferencesService.exportPreferences(false)
      const parsed = JSON.parse(exported)
      
      expect(parsed.customFields).toBeUndefined()
    })

    it('应该能够导入偏好设置', async () => {
      // 设置事件监听器来验证事件触发
      const eventSpy = vi.fn()
      userPreferencesService.on('preferences:imported', eventSpy)

      const importData = {
        language: LanguageType.EN_US,
        timezone: 'America/New_York',
        dateFormat: 'MM/DD/YYYY'
      }

      await userPreferencesService.importPreferences(importData)

      const preferences = userPreferencesService.getPreferences()
      expect(preferences.language).toBe(LanguageType.EN_US)
      expect(preferences.timezone).toBe('America/New_York')
      expect(preferences.dateFormat).toBe('MM/DD/YYYY')

      // 验证导入事件被正确触发
      expect(eventSpy).toHaveBeenCalledWith(expect.objectContaining({
        importedPreferences: expect.any(Object)
      }))
    })

    it('应该能够导入JSON字符串格式的偏好设置', async () => {
      const importData = JSON.stringify({
        language: LanguageType.JA_JP,
        timezone: 'Asia/Tokyo',
        timeFormat: 'HH:mm'
      })

      await userPreferencesService.importPreferences(importData)

      const preferences = userPreferencesService.getPreferences()
      expect(preferences.language).toBe(LanguageType.JA_JP)
      expect(preferences.timezone).toBe('Asia/Tokyo')
      expect(preferences.timeFormat).toBe('HH:mm')
    })

    it('应该在导入无效数据时抛出错误', async () => {
      const invalidData = 'invalid json'
      
      await expect(userPreferencesService.importPreferences(invalidData))
        .rejects.toThrow('导入偏好设置失败')
    })
  })

  describe('版本管理和迁移', () => {
    it('应该能够获取版本信息', () => {
      const version = userPreferencesService.getVersion()
      expect(typeof version).toBe('string')
      expect(version.length).toBeGreaterThan(0)
    })

    it('应该能够检查是否需要迁移', () => {
      const needsMigration = userPreferencesService.needsMigration()
      expect(typeof needsMigration).toBe('boolean')
    })

    it('应该能够执行迁移', async () => {
      // 模拟旧版本
      const preferences = userPreferencesService.getPreferences()
      preferences.version = '1.0.0'
      
      await userPreferencesService.migratePreferences()
      
      const newVersion = userPreferencesService.getVersion()
      expect(newVersion).not.toBe('1.0.0')
    })
  })

  describe('云同步', () => {
    it('应该能够同步到云端', async () => {
      // 设置事件监听器来验证事件触发
      const startEventSpy = vi.fn()
      const completeEventSpy = vi.fn()
      userPreferencesService.on('preferences:sync:started', startEventSpy)
      userPreferencesService.on('preferences:sync:completed', completeEventSpy)

      // 启用同步
      await userPreferencesService.setPreference('syncEnabled', true)

      await userPreferencesService.syncToCloud()

      // 验证同步事件被触发
      expect(startEventSpy).toHaveBeenCalled()
      expect(completeEventSpy).toHaveBeenCalled()
    })

    it('应该能够从云端同步', async () => {
      // 设置事件监听器来验证事件触发
      const startEventSpy = vi.fn()
      const completeEventSpy = vi.fn()
      userPreferencesService.on('preferences:sync:started', startEventSpy)
      userPreferencesService.on('preferences:sync:completed', completeEventSpy)

      // 启用同步
      await userPreferencesService.setPreference('syncEnabled', true)

      await userPreferencesService.syncFromCloud()

      // 验证同步事件被触发
      expect(startEventSpy).toHaveBeenCalled()
      expect(completeEventSpy).toHaveBeenCalled()
    })

    it('应该在同步未启用时抛出错误', async () => {
      // 确保同步未启用
      await userPreferencesService.setPreference('syncEnabled', false)
      
      await expect(userPreferencesService.syncToCloud())
        .rejects.toThrow('云同步未启用')
      
      await expect(userPreferencesService.syncFromCloud())
        .rejects.toThrow('云同步未启用')
    })
  })

  describe('事件系统', () => {
    it('应该在偏好设置变更时触发事件', async () => {
      const eventSpy = vi.fn()
      userPreferencesService.on('preference:changed', eventSpy)
      
      await userPreferencesService.setPreference('language', LanguageType.EN_US)
      
      expect(eventSpy).toHaveBeenCalledWith(expect.objectContaining({
        key: 'language',
        newValue: LanguageType.EN_US
      }))
    })

    it('应该在批量变更时触发事件', async () => {
      const eventSpy = vi.fn()
      userPreferencesService.on('preferences:changed', eventSpy)

      await userPreferencesService.setPreferences({
        language: LanguageType.EN_US,
        timezone: 'America/New_York'
      })

      expect(eventSpy).toHaveBeenCalledWith(expect.objectContaining({
        changes: expect.any(Array)
      }))
    })

    it('应该在重置时触发事件', async () => {
      const eventSpy = vi.fn()
      userPreferencesService.on('preferences:reset', eventSpy)
      
      await userPreferencesService.resetPreferences()
      
      expect(eventSpy).toHaveBeenCalled()
    })
  })
})
