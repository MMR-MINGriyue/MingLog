/**
 * 核心工具函数
 */

import { Module, ModuleConfig, ModuleFactory } from '../types'

/**
 * 创建简单的模块工厂
 */
export function createModuleFactory<T extends Module>(
  moduleClass: new (config: ModuleConfig) => T
): ModuleFactory {
  return {
    async create(config: ModuleConfig): Promise<T> {
      return new moduleClass(config)
    }
  }
}

/**
 * 验证模块配置
 */
export function validateModuleConfig(config: ModuleConfig): string[] {
  const errors: string[] = []

  if (!config.id) {
    errors.push('Module ID is required')
  }

  if (!config.name) {
    errors.push('Module name is required')
  }

  if (!config.version) {
    errors.push('Module version is required')
  }

  if (!config.description) {
    errors.push('Module description is required')
  }

  if (!Array.isArray(config.dependencies)) {
    errors.push('Module dependencies must be an array')
  }

  return errors
}

/**
 * 比较版本号
 */
export function compareVersions(version1: string, version2: string): number {
  const v1Parts = version1.split('.').map(Number)
  const v2Parts = version2.split('.').map(Number)
  
  const maxLength = Math.max(v1Parts.length, v2Parts.length)
  
  for (let i = 0; i < maxLength; i++) {
    const v1Part = v1Parts[i] || 0
    const v2Part = v2Parts[i] || 0
    
    if (v1Part > v2Part) return 1
    if (v1Part < v2Part) return -1
  }
  
  return 0
}

/**
 * 检查版本兼容性
 */
export function isVersionCompatible(required: string, actual: string): boolean {
  // 简单的语义版本检查
  // 支持 ^1.0.0 (兼容版本) 和 ~1.0.0 (补丁版本) 格式
  
  if (required.startsWith('^')) {
    const requiredVersion = required.slice(1)
    const [reqMajor] = requiredVersion.split('.').map(Number)
    const [actualMajor] = actual.split('.').map(Number)
    
    return actualMajor === reqMajor && compareVersions(actual, requiredVersion) >= 0
  }
  
  if (required.startsWith('~')) {
    const requiredVersion = required.slice(1)
    const [reqMajor, reqMinor] = requiredVersion.split('.').map(Number)
    const [actualMajor, actualMinor] = actual.split('.').map(Number)
    
    return actualMajor === reqMajor && 
           actualMinor === reqMinor && 
           compareVersions(actual, requiredVersion) >= 0
  }
  
  // 精确匹配
  return actual === required
}

/**
 * 深度克隆对象
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }
  
  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T
  }
  
  if (obj instanceof Array) {
    return obj.map(item => deepClone(item)) as unknown as T
  }
  
  if (typeof obj === 'object') {
    const cloned = {} as T
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key])
      }
    }
    return cloned
  }
  
  return obj
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | undefined
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastTime = 0
  
  return (...args: Parameters<T>) => {
    const now = Date.now()
    
    if (now - lastTime >= wait) {
      lastTime = now
      func(...args)
    }
  }
}

/**
 * 生成唯一ID
 */
export function generateId(): string {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * 格式化时间
 */
export function formatTime(date: Date | string | number): string {
  const d = new Date(date)
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

/**
 * 安全的JSON解析
 */
export function safeJsonParse<T = any>(json: string, defaultValue: T): T {
  try {
    return JSON.parse(json)
  } catch {
    return defaultValue
  }
}

/**
 * 安全的JSON字符串化
 */
export function safeJsonStringify(obj: any, defaultValue: string = '{}'): string {
  try {
    return JSON.stringify(obj)
  } catch {
    return defaultValue
  }
}

/**
 * 检查对象是否为空
 */
export function isEmpty(obj: any): boolean {
  if (obj == null) return true
  if (Array.isArray(obj) || typeof obj === 'string') return obj.length === 0
  if (typeof obj === 'object') return Object.keys(obj).length === 0
  return false
}

/**
 * 合并对象
 */
export function merge<T extends Record<string, any>>(target: T, ...sources: Partial<T>[]): T {
  const result = { ...target }
  
  for (const source of sources) {
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        const value = source[key]
        if (value !== undefined) {
          result[key] = value as T[Extract<keyof T, string>]
        }
      }
    }
  }
  
  return result
}
