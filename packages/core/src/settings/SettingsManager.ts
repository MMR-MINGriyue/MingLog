/**
 * 设置管理器
 * 负责模块设置的存储、读取、验证和管理
 */

import { CoreAPI, SettingItem } from '../types'
import { EventBus } from '../event-system/EventBus'

export interface SettingsValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

export interface SettingsSchema {
  [key: string]: SettingItem
}

export class SettingsManager {
  private coreAPI: CoreAPI
  private eventBus: EventBus
  private moduleSchemas: Map<string, SettingsSchema> = new Map()
  private settingsCache: Map<string, any> = new Map()

  constructor(coreAPI: CoreAPI, eventBus: EventBus) {
    this.coreAPI = coreAPI
    this.eventBus = eventBus
  }

  /**
   * 注册模块设置模式
   */
  registerModuleSchema(moduleId: string, settings: SettingItem[]): void {
    const schema: SettingsSchema = {}
    
    for (const setting of settings) {
      schema[setting.key] = setting
    }
    
    this.moduleSchemas.set(moduleId, schema)
    
    // 发送模式注册事件
    this.eventBus.emit('settings:schema-registered', {
      moduleId,
      schema
    }, 'SettingsManager')
  }

  /**
   * 获取模块设置模式
   */
  getModuleSchema(moduleId: string): SettingsSchema | undefined {
    return this.moduleSchemas.get(moduleId)
  }

  /**
   * 获取模块设置
   */
  async getModuleSettings(moduleId: string): Promise<Record<string, any>> {
    // 先检查缓存
    const cacheKey = `module:${moduleId}`
    if (this.settingsCache.has(cacheKey)) {
      return this.settingsCache.get(cacheKey)
    }

    try {
      const settings = await this.coreAPI.settings.getModuleSettings(moduleId)
      const schema = this.moduleSchemas.get(moduleId)
      
      // 合并默认值
      const mergedSettings = this.mergeWithDefaults(settings, schema)
      
      // 缓存结果
      this.settingsCache.set(cacheKey, mergedSettings)
      
      return mergedSettings
    } catch (error) {
      console.error(`Failed to get settings for module ${moduleId}:`, error)
      
      // 返回默认设置
      const schema = this.moduleSchemas.get(moduleId)
      return this.getDefaultSettings(schema)
    }
  }

  /**
   * 设置模块设置
   */
  async setModuleSettings(moduleId: string, settings: Record<string, any>): Promise<void> {
    const schema = this.moduleSchemas.get(moduleId)
    
    // 验证设置
    const validation = this.validateSettings(settings, schema)
    if (!validation.valid) {
      throw new Error(`Invalid settings: ${validation.errors.join(', ')}`)
    }

    try {
      // 获取当前设置
      const currentSettings = await this.getModuleSettings(moduleId)
      
      // 合并设置
      const mergedSettings = { ...currentSettings, ...settings }
      
      // 保存到存储
      await this.coreAPI.settings.setModuleSettings(moduleId, mergedSettings)
      
      // 更新缓存
      const cacheKey = `module:${moduleId}`
      this.settingsCache.set(cacheKey, mergedSettings)
      
      // 发送设置更改事件
      this.eventBus.emit('settings:changed', {
        moduleId,
        settings: mergedSettings,
        changedKeys: Object.keys(settings)
      }, 'SettingsManager')
      
    } catch (error) {
      console.error(`Failed to set settings for module ${moduleId}:`, error)
      throw error
    }
  }

  /**
   * 获取单个设置值
   */
  async getModuleSetting<T = any>(moduleId: string, key: string): Promise<T | null> {
    const settings = await this.getModuleSettings(moduleId)
    return settings[key] ?? null
  }

  /**
   * 设置单个设置值
   */
  async setModuleSetting(moduleId: string, key: string, value: any): Promise<void> {
    await this.setModuleSettings(moduleId, { [key]: value })
  }

  /**
   * 重置模块设置为默认值
   */
  async resetModuleSettings(moduleId: string): Promise<void> {
    const schema = this.moduleSchemas.get(moduleId)
    const defaultSettings = this.getDefaultSettings(schema)
    
    await this.setModuleSettings(moduleId, defaultSettings)
  }

  /**
   * 验证设置
   */
  validateSettings(settings: Record<string, any>, schema?: SettingsSchema): SettingsValidationResult {
    const result: SettingsValidationResult = {
      valid: true,
      errors: [],
      warnings: []
    }

    if (!schema) {
      result.warnings.push('No schema found for validation')
      return result
    }

    for (const [key, value] of Object.entries(settings)) {
      const settingSchema = schema[key]
      
      if (!settingSchema) {
        result.warnings.push(`Unknown setting: ${key}`)
        continue
      }

      // 类型验证
      const typeValidation = this.validateSettingType(value, settingSchema)
      if (!typeValidation.valid) {
        result.valid = false
        result.errors.push(`${key}: ${typeValidation.error}`)
        continue
      }

      // 自定义验证
      if (settingSchema.validation) {
        const customValidation = settingSchema.validation(value)
        if (customValidation !== true) {
          result.valid = false
          result.errors.push(`${key}: ${customValidation}`)
        }
      }
    }

    return result
  }

  /**
   * 导出模块设置
   */
  async exportModuleSettings(moduleId: string): Promise<string> {
    const settings = await this.getModuleSettings(moduleId)
    const schema = this.moduleSchemas.get(moduleId)
    
    const exportData = {
      moduleId,
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      settings,
      schema: schema ? Object.values(schema) : []
    }
    
    return JSON.stringify(exportData, null, 2)
  }

  /**
   * 导入模块设置
   */
  async importModuleSettings(moduleId: string, data: string): Promise<void> {
    try {
      const importData = JSON.parse(data)
      
      if (importData.moduleId !== moduleId) {
        throw new Error('Module ID mismatch')
      }
      
      const validation = this.validateSettings(importData.settings, this.moduleSchemas.get(moduleId))
      if (!validation.valid) {
        throw new Error(`Invalid settings: ${validation.errors.join(', ')}`)
      }
      
      await this.setModuleSettings(moduleId, importData.settings)
      
    } catch (error) {
      console.error(`Failed to import settings for module ${moduleId}:`, error)
      throw error
    }
  }

  /**
   * 清除设置缓存
   */
  clearCache(moduleId?: string): void {
    if (moduleId) {
      this.settingsCache.delete(`module:${moduleId}`)
    } else {
      this.settingsCache.clear()
    }
  }

  /**
   * 获取所有模块的设置概览
   */
  async getSettingsOverview(): Promise<Record<string, any>> {
    const overview: Record<string, any> = {}
    
    for (const moduleId of this.moduleSchemas.keys()) {
      try {
        overview[moduleId] = await this.getModuleSettings(moduleId)
      } catch (error) {
        overview[moduleId] = { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
    
    return overview
  }

  /**
   * 合并默认值
   */
  private mergeWithDefaults(settings: Record<string, any>, schema?: SettingsSchema): Record<string, any> {
    if (!schema) {
      return settings
    }

    const merged = { ...settings }
    
    for (const [key, settingSchema] of Object.entries(schema)) {
      if (!(key in merged) && settingSchema.defaultValue !== undefined) {
        merged[key] = settingSchema.defaultValue
      }
    }
    
    return merged
  }

  /**
   * 获取默认设置
   */
  private getDefaultSettings(schema?: SettingsSchema): Record<string, any> {
    if (!schema) {
      return {}
    }

    const defaults: Record<string, any> = {}
    
    for (const [key, settingSchema] of Object.entries(schema)) {
      if (settingSchema.defaultValue !== undefined) {
        defaults[key] = settingSchema.defaultValue
      }
    }
    
    return defaults
  }

  /**
   * 验证设置类型
   */
  private validateSettingType(value: any, schema: SettingItem): { valid: boolean; error?: string } {
    switch (schema.type) {
      case 'boolean':
        if (typeof value !== 'boolean') {
          return { valid: false, error: 'Expected boolean value' }
        }
        break
        
      case 'string':
        if (typeof value !== 'string') {
          return { valid: false, error: 'Expected string value' }
        }
        break
        
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          return { valid: false, error: 'Expected number value' }
        }
        break
        
      case 'select':
        if (schema.options && !schema.options.some(opt => opt.value === value)) {
          return { valid: false, error: 'Value not in allowed options' }
        }
        break
        
      case 'multiselect':
        if (!Array.isArray(value)) {
          return { valid: false, error: 'Expected array value' }
        }
        if (schema.options) {
          const allowedValues = schema.options.map(opt => opt.value)
          for (const item of value) {
            if (!allowedValues.includes(item)) {
              return { valid: false, error: `Value "${item}" not in allowed options` }
            }
          }
        }
        break
        
      case 'color':
        if (typeof value !== 'string' || !/^#[0-9A-Fa-f]{6}$/.test(value)) {
          return { valid: false, error: 'Expected valid hex color value' }
        }
        break
        
      case 'file':
        if (typeof value !== 'string') {
          return { valid: false, error: 'Expected file path string' }
        }
        break
    }
    
    return { valid: true }
  }
}
