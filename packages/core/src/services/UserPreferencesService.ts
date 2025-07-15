/**
 * 用户偏好设置服务
 * 管理用户的个性化设置和偏好配置
 */

import { EventEmitter } from 'events'

// 主题类型
export enum ThemeType {
  LIGHT = 'light',
  DARK = 'dark',
  AUTO = 'auto',
  CUSTOM = 'custom'
}

// 语言类型
export enum LanguageType {
  ZH_CN = 'zh-CN',
  EN_US = 'en-US',
  JA_JP = 'ja-JP',
  KO_KR = 'ko-KR'
}

// 视图模式
export enum ViewMode {
  LIST = 'list',
  GRID = 'grid',
  CARD = 'card',
  TIMELINE = 'timeline',
  KANBAN = 'kanban'
}

// 排序方式
export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc'
}

// 快捷键配置
export interface KeyboardShortcut {
  id: string
  name: string
  description: string
  keys: string[]
  action: string
  context?: string
  enabled: boolean
  modifiable: boolean
}

// 主题配置
export interface ThemeConfig {
  type: ThemeType
  name: string
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
    surface: string
    text: string
    textSecondary: string
    border: string
    success: string
    warning: string
    error: string
    info: string
  }
  fonts: {
    primary: string
    secondary: string
    monospace: string
    sizes: {
      xs: string
      sm: string
      md: string
      lg: string
      xl: string
      xxl: string
    }
  }
  spacing: {
    xs: string
    sm: string
    md: string
    lg: string
    xl: string
    xxl: string
  }
  borderRadius: {
    sm: string
    md: string
    lg: string
    full: string
  }
  shadows: {
    sm: string
    md: string
    lg: string
    xl: string
  }
  animations: {
    duration: {
      fast: string
      normal: string
      slow: string
    }
    easing: {
      ease: string
      easeIn: string
      easeOut: string
      easeInOut: string
    }
  }
}

// 布局配置
export interface LayoutConfig {
  sidebar: {
    width: number
    collapsed: boolean
    position: 'left' | 'right'
    autoHide: boolean
  }
  header: {
    height: number
    visible: boolean
    fixed: boolean
  }
  footer: {
    height: number
    visible: boolean
  }
  panels: {
    [panelId: string]: {
      width?: number
      height?: number
      position?: 'left' | 'right' | 'top' | 'bottom'
      visible: boolean
      resizable: boolean
    }
  }
  grid: {
    columns: number
    gap: number
    responsive: boolean
  }
}

// 编辑器配置
export interface EditorConfig {
  theme: string
  fontSize: number
  fontFamily: string
  lineHeight: number
  tabSize: number
  wordWrap: boolean
  lineNumbers: boolean
  minimap: boolean
  autoSave: boolean
  autoSaveDelay: number
  spellCheck: boolean
  syntaxHighlight: boolean
  autoComplete: boolean
  bracketMatching: boolean
  folding: boolean
  rulers: number[]
}

// 通知配置
export interface NotificationConfig {
  enabled: boolean
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  duration: number
  sound: boolean
  desktop: boolean
  email: boolean
  types: {
    info: boolean
    success: boolean
    warning: boolean
    error: boolean
  }
}

// 用户偏好设置
export interface UserPreferences {
  // 基础设置
  language: LanguageType
  theme: ThemeConfig
  timezone: string
  dateFormat: string
  timeFormat: string

  // 界面设置
  layout: LayoutConfig
  defaultViewMode: ViewMode
  itemsPerPage: number
  showTutorials: boolean
  compactMode: boolean

  // 编辑器设置
  editor: EditorConfig

  // 快捷键设置
  shortcuts: KeyboardShortcut[]

  // 通知设置
  notifications: NotificationConfig

  // 隐私设置
  analytics: boolean
  crashReporting: boolean
  dataCollection: boolean

  // 性能设置
  animationsEnabled: boolean
  hardwareAcceleration: boolean
  preloadContent: boolean
  cacheSize: number

  // 自定义设置
  customFields: Record<string, any>

  // 元数据
  version: string
  lastUpdated: Date
  syncEnabled: boolean
}

/**
 * 用户偏好设置服务实现
 */
export class UserPreferencesService extends EventEmitter {
  private preferences: UserPreferences
  private defaultPreferences: UserPreferences
  private storageKey = 'minglog_user_preferences'

  constructor(private coreAPI?: any) {
    super()
    this.defaultPreferences = this.createDefaultPreferences()
    this.preferences = { ...this.defaultPreferences }
    this.initializePreferences()
  }

  /**
   * 获取用户偏好设置
   */
  getPreferences(): UserPreferences {
    return { ...this.preferences }
  }

  /**
   * 获取特定偏好设置
   */
  getPreference<T>(key: keyof UserPreferences): T {
    return this.preferences[key] as T
  }

  /**
   * 设置用户偏好
   */
  async setPreference<T>(key: keyof UserPreferences, value: T): Promise<void> {
    const oldValue = (this.preferences as any)[key]
    (this.preferences as any)[key] = value
    this.preferences.lastUpdated = new Date()

    await this.savePreferences()

    // 发送变更事件
    this.emit('preference:changed', {
      key,
      oldValue,
      newValue: value
    })

    // 发送特定偏好变更事件
    this.emit(`preference:${key}:changed`, {
      oldValue,
      newValue: value
    })
  }

  /**
   * 批量设置偏好
   */
  async setPreferences(updates: Partial<UserPreferences>): Promise<void> {
    const changes: Array<{ key: string, oldValue: any, newValue: any }> = []

    for (const [key, value] of Object.entries(updates)) {
      const oldValue = (this.preferences as any)[key]
      (this.preferences as any)[key] = value
      changes.push({ key, oldValue, newValue: value })
    }

    this.preferences.lastUpdated = new Date()
    await this.savePreferences()

    // 发送批量变更事件
    this.emit('preferences:changed', { changes })

    // 发送单个变更事件
    changes.forEach(({ key, oldValue, newValue }) => {
      this.emit('preference:changed', { key, oldValue, newValue })
      this.emit(`preference:${key}:changed`, { oldValue, newValue })
    })
  }

  /**
   * 重置偏好设置
   */
  async resetPreferences(): Promise<void> {
    const oldPreferences = { ...this.preferences }
    this.preferences = { ...this.defaultPreferences }
    this.preferences.lastUpdated = new Date()

    await this.savePreferences()

    this.emit('preferences:reset', {
      oldPreferences,
      newPreferences: this.preferences
    })
  }

  /**
   * 重置特定偏好设置
   */
  async resetPreference(key: keyof UserPreferences): Promise<void> {
    const oldValue = this.preferences[key]
    // 获取默认值并设置
    const defaultVal = (this.defaultPreferences as any)[key];
    (this.preferences as any)[key] = defaultVal
    this.preferences.lastUpdated = new Date()

    await this.savePreferences()

    this.emit('preference:reset', {
      key,
      oldValue,
      newValue: defaultVal
    })
  }

  /**
   * 导入偏好设置
   */
  async importPreferences(data: string | Partial<UserPreferences>): Promise<void> {
    try {
      let importedPreferences: Partial<UserPreferences>

      if (typeof data === 'string') {
        importedPreferences = JSON.parse(data)
      } else {
        importedPreferences = data
      }

      // 验证导入的数据
      const validatedPreferences = this.validatePreferences(importedPreferences)

      await this.setPreferences(validatedPreferences)

      this.emit('preferences:imported', {
        importedPreferences: validatedPreferences
      })
    } catch (error) {
      throw new Error(`导入偏好设置失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 导出偏好设置
   */
  exportPreferences(includeCustomFields: boolean = true): string {
    const exportData = { ...this.preferences }

    if (!includeCustomFields) {
      delete exportData.customFields
    }

    return JSON.stringify(exportData, null, 2)
  }

  /**
   * 获取主题配置
   */
  getThemeConfig(): ThemeConfig {
    return this.preferences.theme
  }

  /**
   * 设置主题
   */
  async setTheme(theme: ThemeConfig): Promise<void> {
    await this.setPreference('theme', theme)
  }

  /**
   * 获取快捷键配置
   */
  getShortcuts(): KeyboardShortcut[] {
    return [...this.preferences.shortcuts]
  }

  /**
   * 设置快捷键
   */
  async setShortcut(shortcut: KeyboardShortcut): Promise<void> {
    const shortcuts = [...this.preferences.shortcuts]
    const index = shortcuts.findIndex(s => s.id === shortcut.id)

    if (index >= 0) {
      shortcuts[index] = shortcut
    } else {
      shortcuts.push(shortcut)
    }

    await this.setPreference('shortcuts', shortcuts)
  }

  /**
   * 删除快捷键
   */
  async removeShortcut(shortcutId: string): Promise<void> {
    const shortcuts = this.preferences.shortcuts.filter(s => s.id !== shortcutId)
    await this.setPreference('shortcuts', shortcuts)
  }

  /**
   * 获取布局配置
   */
  getLayoutConfig(): LayoutConfig {
    return this.preferences.layout
  }

  /**
   * 设置布局配置
   */
  async setLayoutConfig(layout: LayoutConfig): Promise<void> {
    await this.setPreference('layout', layout)
  }

  /**
   * 获取编辑器配置
   */
  getEditorConfig(): EditorConfig {
    return this.preferences.editor
  }

  /**
   * 设置编辑器配置
   */
  async setEditorConfig(editor: EditorConfig): Promise<void> {
    await this.setPreference('editor', editor)
  }

  /**
   * 同步偏好设置到云端
   */
  async syncToCloud(): Promise<void> {
    if (!this.preferences.syncEnabled) {
      throw new Error('云同步未启用')
    }

    try {
      // 在实际应用中，这里会调用云端API
      console.log('同步偏好设置到云端...')

      this.emit('preferences:sync:started')

      // 模拟同步过程
      await new Promise(resolve => setTimeout(resolve, 1000))

      this.emit('preferences:sync:completed')
    } catch (error) {
      this.emit('preferences:sync:failed', { error })
      throw error
    }
  }

  /**
   * 从云端同步偏好设置
   */
  async syncFromCloud(): Promise<void> {
    if (!this.preferences.syncEnabled) {
      throw new Error('云同步未启用')
    }

    try {
      this.emit('preferences:sync:started')

      // 在实际应用中，这里会从云端获取数据
      console.log('从云端同步偏好设置...')

      // 模拟同步过程
      await new Promise(resolve => setTimeout(resolve, 1000))

      this.emit('preferences:sync:completed')
    } catch (error) {
      this.emit('preferences:sync:failed', { error })
      throw error
    }
  }

  /**
   * 获取偏好设置版本信息
   */
  getVersion(): string {
    return this.preferences.version
  }

  /**
   * 检查是否需要迁移
   */
  needsMigration(): boolean {
    const currentVersion = this.preferences.version
    const latestVersion = this.defaultPreferences.version
    return currentVersion !== latestVersion
  }

  /**
   * 迁移偏好设置
   */
  async migratePreferences(): Promise<void> {
    if (!this.needsMigration()) {
      return
    }

    const oldVersion = this.preferences.version
    const newVersion = this.defaultPreferences.version

    try {
      // 执行迁移逻辑
      await this.performMigration(oldVersion, newVersion)

      this.preferences.version = newVersion
      this.preferences.lastUpdated = new Date()

      await this.savePreferences()

      this.emit('preferences:migrated', {
        fromVersion: oldVersion,
        toVersion: newVersion
      })
    } catch (error) {
      this.emit('preferences:migration:failed', {
        fromVersion: oldVersion,
        toVersion: newVersion,
        error
      })
      throw error
    }
  }

  // 私有方法

  /**
   * 初始化偏好设置
   */
  private async initializePreferences(): Promise<void> {
    try {
      await this.loadPreferences()

      // 检查是否需要迁移
      if (this.needsMigration()) {
        await this.migratePreferences()
      }
    } catch (error) {
      console.warn('加载偏好设置失败，使用默认设置:', error)
      this.preferences = { ...this.defaultPreferences }
    }
  }

  /**
   * 加载偏好设置
   */
  private async loadPreferences(): Promise<void> {
    try {
      let savedPreferences: string | null = null

      if (this.coreAPI?.storage) {
        savedPreferences = await this.coreAPI.storage.get(this.storageKey)
      } else {
        savedPreferences = localStorage.getItem(this.storageKey)
      }

      if (savedPreferences) {
        const parsed = JSON.parse(savedPreferences)
        this.preferences = this.mergeWithDefaults(parsed)
      }
    } catch (error) {
      throw new Error(`加载偏好设置失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 保存偏好设置
   */
  private async savePreferences(): Promise<void> {
    try {
      const serialized = JSON.stringify(this.preferences)

      if (this.coreAPI?.storage) {
        await this.coreAPI.storage.set(this.storageKey, serialized)
      } else {
        localStorage.setItem(this.storageKey, serialized)
      }
    } catch (error) {
      throw new Error(`保存偏好设置失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  /**
   * 与默认设置合并
   */
  private mergeWithDefaults(preferences: Partial<UserPreferences>): UserPreferences {
    return {
      ...this.defaultPreferences,
      ...preferences,
      // 确保嵌套对象也被正确合并
      theme: {
        ...this.defaultPreferences.theme,
        ...preferences.theme
      },
      layout: {
        ...this.defaultPreferences.layout,
        ...preferences.layout
      },
      editor: {
        ...this.defaultPreferences.editor,
        ...preferences.editor
      },
      notifications: {
        ...this.defaultPreferences.notifications,
        ...preferences.notifications
      },
      shortcuts: preferences.shortcuts || this.defaultPreferences.shortcuts
    }
  }

  /**
   * 验证偏好设置
   */
  private validatePreferences(preferences: Partial<UserPreferences>): Partial<UserPreferences> {
    const validated: Partial<UserPreferences> = {}

    // 验证语言设置
    if (preferences.language && Object.values(LanguageType).includes(preferences.language)) {
      validated.language = preferences.language
    }

    // 验证主题设置
    if (preferences.theme) {
      validated.theme = this.validateThemeConfig(preferences.theme) as ThemeConfig
    }

    // 验证布局设置
    if (preferences.layout) {
      validated.layout = this.validateLayoutConfig(preferences.layout) as LayoutConfig
    }

    // 验证编辑器设置
    if (preferences.editor) {
      validated.editor = this.validateEditorConfig(preferences.editor) as EditorConfig
    }

    // 验证快捷键设置
    if (preferences.shortcuts && Array.isArray(preferences.shortcuts)) {
      validated.shortcuts = preferences.shortcuts.filter(this.validateShortcut)
    }

    // 验证其他基础设置
    if (preferences.timezone && typeof preferences.timezone === 'string') {
      validated.timezone = preferences.timezone
    }

    if (preferences.dateFormat && typeof preferences.dateFormat === 'string') {
      validated.dateFormat = preferences.dateFormat
    }

    if (preferences.timeFormat && typeof preferences.timeFormat === 'string') {
      validated.timeFormat = preferences.timeFormat
    }

    return validated
  }

  /**
   * 验证主题配置
   */
  private validateThemeConfig(theme: Partial<ThemeConfig>): Partial<ThemeConfig> {
    const validated: Partial<ThemeConfig> = {}

    if (theme.type && Object.values(ThemeType).includes(theme.type)) {
      validated.type = theme.type
    }

    if (theme.name && typeof theme.name === 'string') {
      validated.name = theme.name
    }

    if (theme.colors && typeof theme.colors === 'object') {
      validated.colors = theme.colors
    }

    return validated
  }

  /**
   * 验证布局配置
   */
  private validateLayoutConfig(layout: Partial<LayoutConfig>): Partial<LayoutConfig> {
    // 简化的布局验证
    return layout
  }

  /**
   * 验证编辑器配置
   */
  private validateEditorConfig(editor: Partial<EditorConfig>): Partial<EditorConfig> {
    // 简化的编辑器验证
    return editor
  }

  /**
   * 验证快捷键配置
   */
  private validateShortcut(shortcut: any): shortcut is KeyboardShortcut {
    return (
      shortcut &&
      typeof shortcut.id === 'string' &&
      typeof shortcut.name === 'string' &&
      Array.isArray(shortcut.keys) &&
      typeof shortcut.action === 'string'
    )
  }

  /**
   * 执行版本迁移
   */
  private async performMigration(fromVersion: string, toVersion: string): Promise<void> {
    console.log(`迁移偏好设置从版本 ${fromVersion} 到 ${toVersion}`)

    // 这里可以添加具体的迁移逻辑
    // 例如：重命名字段、转换数据格式、添加新的默认值等

    if (fromVersion === '1.0.0' && toVersion === '1.1.0') {
      // 示例迁移：添加新的编辑器设置
      if (!this.preferences.editor.rulers) {
        this.preferences.editor.rulers = []
      }
    }

    // 可以添加更多版本的迁移逻辑
  }

  /**
   * 创建默认偏好设置
   */
  private createDefaultPreferences(): UserPreferences {
    return {
      // 基础设置
      language: LanguageType.ZH_CN,
      theme: this.createDefaultTheme(),
      timezone: 'Asia/Shanghai',
      dateFormat: 'YYYY-MM-DD',
      timeFormat: 'HH:mm:ss',

      // 界面设置
      layout: this.createDefaultLayout(),
      defaultViewMode: ViewMode.LIST,
      itemsPerPage: 20,
      showTutorials: true,
      compactMode: false,

      // 编辑器设置
      editor: this.createDefaultEditor(),

      // 快捷键设置
      shortcuts: this.createDefaultShortcuts(),

      // 通知设置
      notifications: this.createDefaultNotifications(),

      // 隐私设置
      analytics: true,
      crashReporting: true,
      dataCollection: true,

      // 性能设置
      animationsEnabled: true,
      hardwareAcceleration: true,
      preloadContent: true,
      cacheSize: 100, // MB

      // 自定义设置
      customFields: {},

      // 元数据
      version: '1.1.0',
      lastUpdated: new Date(),
      syncEnabled: false
    }
  }

  /**
   * 创建默认主题
   */
  private createDefaultTheme(): ThemeConfig {
    return {
      type: ThemeType.LIGHT,
      name: '默认浅色主题',
      colors: {
        primary: '#3b82f6',
        secondary: '#64748b',
        accent: '#8b5cf6',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#1e293b',
        textSecondary: '#64748b',
        border: '#e2e8f0',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        info: '#3b82f6'
      },
      fonts: {
        primary: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        secondary: 'Georgia, "Times New Roman", serif',
        monospace: '"Fira Code", "JetBrains Mono", Consolas, monospace',
        sizes: {
          xs: '0.75rem',
          sm: '0.875rem',
          md: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          xxl: '1.5rem'
        }
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        xxl: '3rem'
      },
      borderRadius: {
        sm: '0.25rem',
        md: '0.375rem',
        lg: '0.5rem',
        full: '9999px'
      },
      shadows: {
        sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
      },
      animations: {
        duration: {
          fast: '150ms',
          normal: '300ms',
          slow: '500ms'
        },
        easing: {
          ease: 'ease',
          easeIn: 'ease-in',
          easeOut: 'ease-out',
          easeInOut: 'ease-in-out'
        }
      }
    }
  }

  /**
   * 创建默认布局
   */
  private createDefaultLayout(): LayoutConfig {
    return {
      sidebar: {
        width: 280,
        collapsed: false,
        position: 'left',
        autoHide: false
      },
      header: {
        height: 60,
        visible: true,
        fixed: true
      },
      footer: {
        height: 40,
        visible: true
      },
      panels: {},
      grid: {
        columns: 12,
        gap: 16,
        responsive: true
      }
    }
  }

  /**
   * 创建默认编辑器配置
   */
  private createDefaultEditor(): EditorConfig {
    return {
      theme: 'vs-light',
      fontSize: 14,
      fontFamily: '"Fira Code", "JetBrains Mono", Consolas, monospace',
      lineHeight: 1.5,
      tabSize: 2,
      wordWrap: true,
      lineNumbers: true,
      minimap: true,
      autoSave: true,
      autoSaveDelay: 1000,
      spellCheck: true,
      syntaxHighlight: true,
      autoComplete: true,
      bracketMatching: true,
      folding: true,
      rulers: [80, 120]
    }
  }

  /**
   * 创建默认快捷键
   */
  private createDefaultShortcuts(): KeyboardShortcut[] {
    return [
      {
        id: 'save',
        name: '保存',
        description: '保存当前文档',
        keys: ['Ctrl', 'S'],
        action: 'save',
        enabled: true,
        modifiable: true
      },
      {
        id: 'new',
        name: '新建',
        description: '创建新文档',
        keys: ['Ctrl', 'N'],
        action: 'new',
        enabled: true,
        modifiable: true
      },
      {
        id: 'search',
        name: '搜索',
        description: '打开搜索',
        keys: ['Ctrl', 'F'],
        action: 'search',
        enabled: true,
        modifiable: true
      },
      {
        id: 'command-palette',
        name: '命令面板',
        description: '打开命令面板',
        keys: ['Ctrl', 'Shift', 'P'],
        action: 'command-palette',
        enabled: true,
        modifiable: true
      }
    ]
  }

  /**
   * 创建默认通知配置
   */
  private createDefaultNotifications(): NotificationConfig {
    return {
      enabled: true,
      position: 'top-right',
      duration: 5000,
      sound: true,
      desktop: true,
      email: false,
      types: {
        info: true,
        success: true,
        warning: true,
        error: true
      }
    }
  }
}

export default UserPreferencesService