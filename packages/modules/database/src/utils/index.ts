/**
 * 数据库模块工具函数
 */

export * from './validation'
export * from './formatting'
export * from './helpers'

// 常用工具函数
export const DatabaseUtils = {
  /**
   * 生成唯一ID
   */
  generateId: (prefix = 'db'): string => {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  },

  /**
   * 验证数据库名称
   */
  validateDatabaseName: (name: string): boolean => {
    return name && name.trim().length > 0 && name.length <= 100
  },

  /**
   * 验证字段名称
   */
  validateFieldName: (name: string): boolean => {
    return name && name.trim().length > 0 && name.length <= 50
  },

  /**
   * 格式化文件大小
   */
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  },

  /**
   * 深度克隆对象
   */
  deepClone: <T>(obj: T): T => {
    return JSON.parse(JSON.stringify(obj))
  },

  /**
   * 防抖函数
   */
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void => {
    let timeout: NodeJS.Timeout
    return (...args: Parameters<T>) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  },

  /**
   * 节流函数
   */
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void => {
    let inThrottle: boolean
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => (inThrottle = false), limit)
      }
    }
  }
}
