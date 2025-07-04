/**
 * Environment detection utilities for cross-platform compatibility
 */

// 检测是否在Tauri环境中
export const isTauriEnvironment = (): boolean => {
  return typeof window !== 'undefined' &&
         (window as any).__TAURI__ !== undefined &&
         typeof (window as any).__TAURI__.invoke === 'function'
}

// 检测是否在浏览器环境中
export const isBrowserEnvironment = (): boolean => {
  return typeof window !== 'undefined' && 
         typeof document !== 'undefined' &&
         !isTauriEnvironment()
}

// 检测是否在移动设备上
export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.innerWidth <= 768
}

// 检测是否支持触摸
export const isTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false
  
  return 'ontouchstart' in window || 
         navigator.maxTouchPoints > 0 ||
         (navigator as any).msMaxTouchPoints > 0
}

// 检测浏览器类型
export const getBrowserInfo = () => {
  if (typeof window === 'undefined') {
    return { name: 'unknown', version: 'unknown' }
  }

  const userAgent = navigator.userAgent
  
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    return { name: 'chrome', version: userAgent.match(/Chrome\/(\d+)/)?.[1] || 'unknown' }
  }
  
  if (userAgent.includes('Firefox')) {
    return { name: 'firefox', version: userAgent.match(/Firefox\/(\d+)/)?.[1] || 'unknown' }
  }
  
  if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    return { name: 'safari', version: userAgent.match(/Version\/(\d+)/)?.[1] || 'unknown' }
  }
  
  if (userAgent.includes('Edg')) {
    return { name: 'edge', version: userAgent.match(/Edg\/(\d+)/)?.[1] || 'unknown' }
  }
  
  return { name: 'unknown', version: 'unknown' }
}

// 检测性能API支持
export const getPerformanceCapabilities = () => {
  if (typeof window === 'undefined') {
    return {
      performance: false,
      memory: false,
      observer: false,
      timing: false
    }
  }

  return {
    performance: 'performance' in window,
    memory: 'memory' in (window.performance || {}),
    observer: 'PerformanceObserver' in window,
    timing: 'timing' in (window.performance || {})
  }
}

// 获取设备信息
export const getDeviceInfo = () => {
  if (typeof window === 'undefined') {
    return {
      screen: { width: 0, height: 0 },
      viewport: { width: 0, height: 0 },
      devicePixelRatio: 1,
      colorScheme: 'light'
    }
  }

  return {
    screen: {
      width: window.screen?.width || 0,
      height: window.screen?.height || 0
    },
    viewport: {
      width: window.innerWidth || 0,
      height: window.innerHeight || 0
    },
    devicePixelRatio: window.devicePixelRatio || 1,
    colorScheme: window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
}

// 检测网络状态
export const getNetworkInfo = () => {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return {
      online: true,
      effectiveType: 'unknown',
      downlink: 0,
      rtt: 0
    }
  }

  const connection = (navigator as any).connection
  
  return {
    online: navigator.onLine,
    effectiveType: connection?.effectiveType || 'unknown',
    downlink: connection?.downlink || 0,
    rtt: connection?.rtt || 0
  }
}

// 环境特性检测
export const getEnvironmentFeatures = () => {
  return {
    isTauri: isTauriEnvironment(),
    isBrowser: isBrowserEnvironment(),
    isMobile: isMobileDevice(),
    isTouch: isTouchDevice(),
    browser: getBrowserInfo(),
    performance: getPerformanceCapabilities(),
    device: getDeviceInfo(),
    network: getNetworkInfo()
  }
}

// 创建环境适配的API调用包装器
export const createEnvironmentAdapter = () => {
  const features = getEnvironmentFeatures()
  
  return {
    // 内存信息获取
    getMemoryInfo: async () => {
      if (features.isTauri) {
        try {
          const { invoke } = await import('@tauri-apps/api/tauri')
          return await invoke<{ used: number; total: number }>('get_memory_info')
        } catch (error) {
          console.warn('Tauri memory info not available:', error)
        }
      }
      
      // 浏览器环境的模拟数据
      if (features.performance.memory && (window.performance as any).memory) {
        const memory = (window.performance as any).memory
        return {
          used: memory.usedJSHeapSize || Math.random() * 100000000,
          total: memory.totalJSHeapSize || 200000000
        }
      }
      
      // 默认模拟数据
      return {
        used: Math.random() * 2000000000 + 500000000,
        total: 8000000000
      }
    },

    // 性能测量
    measurePerformance: async (operation: () => Promise<void> | void) => {
      const startTime = performance.now()
      
      try {
        await operation()
      } catch (error) {
        console.error('Performance measurement failed:', error)
      }
      
      return performance.now() - startTime
    },

    // 数据库性能测量（仅Tauri环境）
    measureDatabasePerformance: async () => {
      if (features.isTauri) {
        try {
          const { invoke } = await import('@tauri-apps/api/tauri')
          return await invoke<number>('measure_db_performance')
        } catch (error) {
          console.warn('Database performance measurement not available:', error)
        }
      }
      
      // 浏览器环境返回模拟值
      return Math.random() * 10 + 1
    },

    // 同步状态获取（仅Tauri环境）
    getSyncStatus: async () => {
      if (features.isTauri) {
        try {
          const { invoke } = await import('@tauri-apps/api/core')
          return await invoke<string>('get_sync_status')
        } catch (error) {
          console.warn('Sync status not available:', error)
        }
      }
      
      return 'Browser Mode'
    },

    // 获取环境特性
    getFeatures: () => features
  }
}

// 导出单例适配器
export const environmentAdapter = createEnvironmentAdapter()

// 类型定义
export interface EnvironmentFeatures {
  isTauri: boolean
  isBrowser: boolean
  isMobile: boolean
  isTouch: boolean
  browser: { name: string; version: string }
  performance: {
    performance: boolean
    memory: boolean
    observer: boolean
    timing: boolean
  }
  device: {
    screen: { width: number; height: number }
    viewport: { width: number; height: number }
    devicePixelRatio: number
    colorScheme: 'light' | 'dark'
  }
  network: {
    online: boolean
    effectiveType: string
    downlink: number
    rtt: number
  }
}

export interface MemoryInfo {
  used: number
  total: number
}

export interface EnvironmentAdapter {
  getMemoryInfo(): Promise<MemoryInfo>
  measurePerformance(operation: () => Promise<void> | void): Promise<number>
  measureDatabasePerformance(): Promise<number>
  getSyncStatus(): Promise<string>
  getFeatures(): EnvironmentFeatures
}
