import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  isTauriEnvironment,
  isBrowserEnvironment,
  isMobileDevice,
  isTouchDevice,
  getBrowserInfo,
  getPerformanceCapabilities,
  getDeviceInfo,
  getNetworkInfo,
  getEnvironmentFeatures,
  createEnvironmentAdapter
} from '../environment'

// Mock global objects
const mockWindow = {
  __TAURI__: undefined as any,
  innerWidth: 1920,
  innerHeight: 1080,
  navigator: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    onLine: true,
    connection: {
      effectiveType: '4g',
      downlink: 10,
      rtt: 50
    },
    maxTouchPoints: 0
  },
  performance: {
    memory: {
      usedJSHeapSize: 50000000,
      totalJSHeapSize: 100000000,
      jsHeapSizeLimit: 2000000000
    }
  },
  screen: {
    width: 1920,
    height: 1080
  }
}

describe('Environment Utils', () => {
  beforeEach(() => {
    // Reset window mock
    Object.defineProperty(global, 'window', {
      value: { ...mockWindow },
      writable: true
    })
    
    Object.defineProperty(global, 'navigator', {
      value: { ...mockWindow.navigator },
      writable: true
    })

    Object.defineProperty(global, 'document', {
      value: { createElement: vi.fn() },
      writable: true
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('isTauriEnvironment', () => {
    it('should return true when Tauri is available', () => {
      ;(global.window as any).__TAURI__ = {
        invoke: vi.fn()
      }

      expect(isTauriEnvironment()).toBe(true)
    })

    it('should return false when Tauri is not available', () => {
      ;(global.window as any).__TAURI__ = undefined

      expect(isTauriEnvironment()).toBe(false)
    })

    it('should return false when window is undefined', () => {
      Object.defineProperty(global, 'window', {
        value: undefined,
        writable: true
      })

      expect(isTauriEnvironment()).toBe(false)
    })

    it('should return false when __TAURI__.invoke is not a function', () => {
      ;(global.window as any).__TAURI__ = {
        invoke: 'not a function'
      }

      expect(isTauriEnvironment()).toBe(false)
    })
  })

  describe('isBrowserEnvironment', () => {
    it('should return true in browser environment', () => {
      ;(global.window as any).__TAURI__ = undefined

      expect(isBrowserEnvironment()).toBe(true)
    })

    it('should return false in Tauri environment', () => {
      ;(global.window as any).__TAURI__ = {
        invoke: vi.fn()
      }

      expect(isBrowserEnvironment()).toBe(false)
    })

    it('should return false when window is undefined', () => {
      Object.defineProperty(global, 'window', {
        value: undefined,
        writable: true
      })

      expect(isBrowserEnvironment()).toBe(false)
    })

    it('should return false when document is undefined', () => {
      Object.defineProperty(global, 'document', {
        value: undefined,
        writable: true
      })

      expect(isBrowserEnvironment()).toBe(false)
    })
  })

  describe('isMobileDevice', () => {
    it('should return false for desktop user agent', () => {
      expect(isMobileDevice()).toBe(false)
    })

    it('should return true for mobile user agent', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
        },
        writable: true
      })

      expect(isMobileDevice()).toBe(true)
    })

    it('should return true for Android user agent', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (Linux; Android 10; SM-G975F)'
        },
        writable: true
      })

      expect(isMobileDevice()).toBe(true)
    })

    it('should return true for small screen width', () => {
      ;(global.window as any).innerWidth = 600

      expect(isMobileDevice()).toBe(true)
    })

    it('should return false when window is undefined', () => {
      Object.defineProperty(global, 'window', {
        value: undefined,
        writable: true
      })

      expect(isMobileDevice()).toBe(false)
    })
  })

  describe('isTouchDevice', () => {
    it('should return false for non-touch device', () => {
      expect(isTouchDevice()).toBe(false)
    })

    it('should return true when maxTouchPoints > 0', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          ...mockWindow.navigator,
          maxTouchPoints: 5
        },
        writable: true
      })

      expect(isTouchDevice()).toBe(true)
    })

    it('should return true when ontouchstart exists', () => {
      ;(global.window as any).ontouchstart = () => {}

      expect(isTouchDevice()).toBe(true)
    })

    it('should return false when navigator is undefined', () => {
      Object.defineProperty(global, 'navigator', {
        value: undefined,
        writable: true
      })

      expect(isTouchDevice()).toBe(false)
    })
  })

  describe('getBrowserInfo', () => {
    it('should detect Chrome browser', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        writable: true
      })

      const info = getBrowserInfo()
      expect(info.name).toBe('Chrome')
      expect(info.version).toBe('91.0.4472.124')
    })

    it('should detect Firefox browser', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0'
        },
        writable: true
      })

      const info = getBrowserInfo()
      expect(info.name).toBe('Firefox')
      expect(info.version).toBe('89.0')
    })

    it('should detect Safari browser', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
        },
        writable: true
      })

      const info = getBrowserInfo()
      expect(info.name).toBe('Safari')
      expect(info.version).toBe('14.1.1')
    })

    it('should return unknown for unrecognized browser', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'Unknown Browser'
        },
        writable: true
      })

      const info = getBrowserInfo()
      expect(info.name).toBe('Unknown')
      expect(info.version).toBe('Unknown')
    })
  })

  describe('getPerformanceCapabilities', () => {
    it('should return performance capabilities', () => {
      const capabilities = getPerformanceCapabilities()

      expect(capabilities).toHaveProperty('memory')
      expect(capabilities).toHaveProperty('timing')
      expect(capabilities).toHaveProperty('observer')
      expect(capabilities).toHaveProperty('navigation')
      expect(capabilities.memory).toBe(true)
    })

    it('should handle missing performance API', () => {
      Object.defineProperty(global, 'window', {
        value: {
          ...mockWindow,
          performance: undefined
        },
        writable: true
      })

      const capabilities = getPerformanceCapabilities()
      expect(capabilities.memory).toBe(false)
      expect(capabilities.timing).toBe(false)
    })
  })

  describe('getDeviceInfo', () => {
    it('should return device information', () => {
      const deviceInfo = getDeviceInfo()

      expect(deviceInfo).toHaveProperty('screenWidth')
      expect(deviceInfo).toHaveProperty('screenHeight')
      expect(deviceInfo).toHaveProperty('windowWidth')
      expect(deviceInfo).toHaveProperty('windowHeight')
      expect(deviceInfo).toHaveProperty('pixelRatio')
      expect(deviceInfo).toHaveProperty('colorDepth')

      expect(deviceInfo.screenWidth).toBe(1920)
      expect(deviceInfo.screenHeight).toBe(1080)
    })

    it('should handle missing screen API', () => {
      Object.defineProperty(global, 'window', {
        value: {
          ...mockWindow,
          screen: undefined
        },
        writable: true
      })

      const deviceInfo = getDeviceInfo()
      expect(deviceInfo.screenWidth).toBe(0)
      expect(deviceInfo.screenHeight).toBe(0)
    })
  })

  describe('getNetworkInfo', () => {
    it('should return network information', () => {
      const networkInfo = getNetworkInfo()

      expect(networkInfo).toHaveProperty('online')
      expect(networkInfo).toHaveProperty('effectiveType')
      expect(networkInfo).toHaveProperty('downlink')
      expect(networkInfo).toHaveProperty('rtt')

      expect(networkInfo.online).toBe(true)
      expect(networkInfo.effectiveType).toBe('4g')
    })

    it('should handle missing connection API', () => {
      Object.defineProperty(global, 'navigator', {
        value: {
          onLine: true
        },
        writable: true
      })

      const networkInfo = getNetworkInfo()
      expect(networkInfo.online).toBe(true)
      expect(networkInfo.effectiveType).toBe('unknown')
      expect(networkInfo.downlink).toBe(0)
    })

    it('should handle missing navigator', () => {
      Object.defineProperty(global, 'navigator', {
        value: undefined,
        writable: true
      })

      const networkInfo = getNetworkInfo()
      expect(networkInfo.online).toBe(true)
      expect(networkInfo.effectiveType).toBe('unknown')
    })
  })

  describe('getEnvironmentFeatures', () => {
    it('should return comprehensive environment features', () => {
      const features = getEnvironmentFeatures()

      expect(features).toHaveProperty('isTauri')
      expect(features).toHaveProperty('isBrowser')
      expect(features).toHaveProperty('isMobile')
      expect(features).toHaveProperty('isTouch')
      expect(features).toHaveProperty('browser')
      expect(features).toHaveProperty('performance')
      expect(features).toHaveProperty('device')
      expect(features).toHaveProperty('network')

      expect(features.isBrowser).toBe(true)
      expect(features.isMobile).toBe(false)
    })
  })

  describe('createEnvironmentAdapter', () => {
    it('should create environment adapter with memory info', async () => {
      const adapter = createEnvironmentAdapter()

      expect(adapter).toHaveProperty('getMemoryInfo')

      const memoryInfo = await adapter.getMemoryInfo()
      expect(memoryInfo).toHaveProperty('used')
      expect(memoryInfo).toHaveProperty('total')
      expect(typeof memoryInfo.used).toBe('number')
      expect(typeof memoryInfo.total).toBe('number')
    })

    it('should handle Tauri environment in adapter', async () => {
      ;(global.window as any).__TAURI__ = {
        invoke: vi.fn()
      }

      // Mock dynamic import
      vi.doMock('@tauri-apps/api/tauri', () => ({
        invoke: vi.fn().mockResolvedValue({ used: 1000000, total: 2000000 })
      }))

      const adapter = createEnvironmentAdapter()
      const memoryInfo = await adapter.getMemoryInfo()

      expect(memoryInfo.used).toBeDefined()
      expect(memoryInfo.total).toBeDefined()
    })

    it('should fallback to browser memory API', async () => {
      ;(global.window as any).__TAURI__ = undefined

      const adapter = createEnvironmentAdapter()
      const memoryInfo = await adapter.getMemoryInfo()

      expect(memoryInfo.used).toBe(50000000)
      expect(memoryInfo.total).toBe(100000000)
    })

    it('should provide default memory values when APIs unavailable', async () => {
      ;(global.window as any).__TAURI__ = undefined
      ;(global.window as any).performance = undefined

      const adapter = createEnvironmentAdapter()
      const memoryInfo = await adapter.getMemoryInfo()

      expect(memoryInfo.used).toBeGreaterThan(0)
      expect(memoryInfo.total).toBe(8000000000)
    })
  })
})
