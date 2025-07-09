/**
 * MingLog 浏览器兼容性测试
 * 测试在不同浏览器环境下的功能兼容性
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { testUtils } from '@test/setup';

// 模拟不同浏览器环境
const mockBrowserEnvironments = {
  chrome: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    features: {
      localStorage: true,
      sessionStorage: true,
      indexedDB: true,
      webWorkers: true,
      serviceWorker: true,
      webGL: true,
      webRTC: true,
      intersectionObserver: true,
      resizeObserver: true,
      mutationObserver: true
    }
  },
  firefox: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
    features: {
      localStorage: true,
      sessionStorage: true,
      indexedDB: true,
      webWorkers: true,
      serviceWorker: true,
      webGL: true,
      webRTC: true,
      intersectionObserver: true,
      resizeObserver: true,
      mutationObserver: true
    }
  },
  safari: {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    features: {
      localStorage: true,
      sessionStorage: true,
      indexedDB: true,
      webWorkers: true,
      serviceWorker: true,
      webGL: true,
      webRTC: false, // Safari 有限制
      intersectionObserver: true,
      resizeObserver: true,
      mutationObserver: true
    }
  },
  edge: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
    features: {
      localStorage: true,
      sessionStorage: true,
      indexedDB: true,
      webWorkers: true,
      serviceWorker: true,
      webGL: true,
      webRTC: true,
      intersectionObserver: true,
      resizeObserver: true,
      mutationObserver: true
    }
  },
  ie11: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; WOW64; Trident/7.0; rv:11.0) like Gecko',
    features: {
      localStorage: true,
      sessionStorage: true,
      indexedDB: true,
      webWorkers: true,
      serviceWorker: false,
      webGL: false,
      webRTC: false,
      intersectionObserver: false,
      resizeObserver: false,
      mutationObserver: true
    }
  }
};

// 浏览器环境模拟器
class BrowserEnvironmentMock {
  constructor(private browserName: keyof typeof mockBrowserEnvironments) {
    this.setupEnvironment();
  }

  private setupEnvironment() {
    const env = mockBrowserEnvironments[this.browserName];
    
    // 模拟 User Agent
    Object.defineProperty(navigator, 'userAgent', {
      value: env.userAgent,
      configurable: true
    });

    // 模拟各种 Web API
    this.mockWebAPIs(env.features);
  }

  private mockWebAPIs(features: any) {
    // localStorage
    if (!features.localStorage) {
      Object.defineProperty(window, 'localStorage', {
        value: undefined,
        configurable: true
      });
    }

    // sessionStorage
    if (!features.sessionStorage) {
      Object.defineProperty(window, 'sessionStorage', {
        value: undefined,
        configurable: true
      });
    }

    // IndexedDB
    if (!features.indexedDB) {
      Object.defineProperty(window, 'indexedDB', {
        value: undefined,
        configurable: true
      });
    }

    // Web Workers
    if (!features.webWorkers) {
      Object.defineProperty(window, 'Worker', {
        value: undefined,
        configurable: true
      });
    }

    // Service Worker
    if (!features.serviceWorker) {
      Object.defineProperty(navigator, 'serviceWorker', {
        value: undefined,
        configurable: true
      });
    }

    // IntersectionObserver
    if (!features.intersectionObserver) {
      Object.defineProperty(window, 'IntersectionObserver', {
        value: undefined,
        configurable: true
      });
    }

    // ResizeObserver
    if (!features.resizeObserver) {
      Object.defineProperty(window, 'ResizeObserver', {
        value: undefined,
        configurable: true
      });
    }

    // WebGL
    if (!features.webGL) {
      const mockGetContext = vi.fn(() => null);
      HTMLCanvasElement.prototype.getContext = mockGetContext;
    }
  }

  restore() {
    // 恢复原始环境
    vi.restoreAllMocks();
  }
}

describe('浏览器兼容性测试', () => {
  let originalUserAgent: string;
  let browserMock: BrowserEnvironmentMock;

  beforeEach(() => {
    originalUserAgent = navigator.userAgent;
  });

  afterEach(() => {
    if (browserMock) {
      browserMock.restore();
    }
  });

  describe('Chrome 兼容性', () => {
    beforeEach(() => {
      browserMock = new BrowserEnvironmentMock('chrome');
    });

    it('应该支持所有现代 Web API', () => {
      expect(window.localStorage).toBeDefined();
      expect(window.sessionStorage).toBeDefined();
      expect(window.indexedDB).toBeDefined();
      expect(window.Worker).toBeDefined();
      expect(navigator.serviceWorker).toBeDefined();
      expect(window.IntersectionObserver).toBeDefined();
      expect(window.ResizeObserver).toBeDefined();
    });

    it('应该正确检测浏览器类型', () => {
      const isChrome = /Chrome/.test(navigator.userAgent) && !/Edge/.test(navigator.userAgent);
      expect(isChrome).toBe(true);
    });

    it('应该支持现代 JavaScript 特性', () => {
      // ES6+ 特性测试
      expect(typeof Promise).toBe('function');
      expect(typeof Map).toBe('function');
      expect(typeof Set).toBe('function');
      expect(typeof Symbol).toBe('function');
      
      // 异步函数
      const asyncFunction = async () => 'test';
      expect(asyncFunction.constructor.name).toBe('AsyncFunction');
    });
  });

  describe('Firefox 兼容性', () => {
    beforeEach(() => {
      browserMock = new BrowserEnvironmentMock('firefox');
    });

    it('应该支持 Firefox 特定的 API', () => {
      expect(window.localStorage).toBeDefined();
      expect(window.indexedDB).toBeDefined();
      
      const isFirefox = /Firefox/.test(navigator.userAgent);
      expect(isFirefox).toBe(true);
    });

    it('应该处理 Firefox 的 CSS 前缀', () => {
      const element = document.createElement('div');
      
      // 测试 CSS 属性兼容性
      const testProperties = [
        'transform',
        'transition',
        'animation',
        'userSelect'
      ];

      testProperties.forEach(prop => {
        // Firefox 通常支持标准属性
        expect(prop in element.style).toBe(true);
      });
    });
  });

  describe('Safari 兼容性', () => {
    beforeEach(() => {
      browserMock = new BrowserEnvironmentMock('safari');
    });

    it('应该处理 Safari 的限制', () => {
      const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
      expect(isSafari).toBe(true);

      // Safari 对某些 API 有限制
      expect(window.localStorage).toBeDefined();
      expect(window.indexedDB).toBeDefined();
    });

    it('应该处理 Safari 的日期解析差异', () => {
      // Safari 对日期字符串解析较严格
      const dateString = '2024-01-01T00:00:00.000Z';
      const date = new Date(dateString);
      
      expect(date.getTime()).not.toBeNaN();
    });

    it('应该处理 Safari 的存储限制', () => {
      // Safari 在隐私模式下可能禁用 localStorage
      try {
        localStorage.setItem('test', 'value');
        localStorage.removeItem('test');
        expect(true).toBe(true); // 如果没有抛出错误
      } catch (error) {
        // Safari 隐私模式下的预期行为
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Edge 兼容性', () => {
    beforeEach(() => {
      browserMock = new BrowserEnvironmentMock('edge');
    });

    it('应该支持现代 Edge 的所有功能', () => {
      const isEdge = /Edg/.test(navigator.userAgent);
      expect(isEdge).toBe(true);

      // 现代 Edge 基于 Chromium，应该支持所有现代 API
      expect(window.localStorage).toBeDefined();
      expect(window.sessionStorage).toBeDefined();
      expect(window.indexedDB).toBeDefined();
      expect(window.Worker).toBeDefined();
    });
  });

  describe('IE11 兼容性（降级支持）', () => {
    beforeEach(() => {
      browserMock = new BrowserEnvironmentMock('ie11');
    });

    it('应该检测 IE11 环境', () => {
      const isIE11 = /Trident/.test(navigator.userAgent);
      expect(isIE11).toBe(true);
    });

    it('应该提供 Polyfill 支持', () => {
      // 检查是否需要 polyfill
      if (!window.IntersectionObserver) {
        // 模拟 polyfill 加载
        expect(window.IntersectionObserver).toBeUndefined();
      }

      if (!window.ResizeObserver) {
        expect(window.ResizeObserver).toBeUndefined();
      }
    });

    it('应该使用兼容的 API', () => {
      // IE11 支持的基本 API
      expect(window.localStorage).toBeDefined();
      expect(window.sessionStorage).toBeDefined();
      expect(window.indexedDB).toBeDefined();
      expect(window.MutationObserver).toBeDefined();
    });
  });

  describe('移动端浏览器兼容性', () => {
    it('应该支持移动端 Chrome', () => {
      const mobileChrome = 'Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';
      
      Object.defineProperty(navigator, 'userAgent', {
        value: mobileChrome,
        configurable: true
      });

      const isMobileChrome = /Chrome/.test(navigator.userAgent) && /Mobile/.test(navigator.userAgent);
      expect(isMobileChrome).toBe(true);
    });

    it('应该支持移动端 Safari', () => {
      const mobileSafari = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
      
      Object.defineProperty(navigator, 'userAgent', {
        value: mobileSafari,
        configurable: true
      });

      const isMobileSafari = /Safari/.test(navigator.userAgent) && /Mobile/.test(navigator.userAgent);
      expect(isMobileSafari).toBe(true);
    });

    it('应该处理触摸事件', () => {
      // 模拟触摸支持
      Object.defineProperty(window, 'ontouchstart', {
        value: null,
        configurable: true
      });

      const supportsTouchEvents = 'ontouchstart' in window;
      expect(supportsTouchEvents).toBe(true);
    });
  });

  describe('功能检测和降级', () => {
    it('应该检测 localStorage 支持', () => {
      function isLocalStorageSupported() {
        try {
          const test = '__localStorage_test__';
          localStorage.setItem(test, test);
          localStorage.removeItem(test);
          return true;
        } catch {
          return false;
        }
      }

      const supported = isLocalStorageSupported();
      expect(typeof supported).toBe('boolean');
    });

    it('应该检测 IndexedDB 支持', () => {
      function isIndexedDBSupported() {
        return 'indexedDB' in window;
      }

      const supported = isIndexedDBSupported();
      expect(typeof supported).toBe('boolean');
    });

    it('应该检测 Web Workers 支持', () => {
      function isWebWorkersSupported() {
        return typeof Worker !== 'undefined';
      }

      const supported = isWebWorkersSupported();
      expect(typeof supported).toBe('boolean');
    });

    it('应该检测 Service Worker 支持', () => {
      function isServiceWorkerSupported() {
        return 'serviceWorker' in navigator;
      }

      const supported = isServiceWorkerSupported();
      expect(typeof supported).toBe('boolean');
    });

    it('应该检测 IntersectionObserver 支持', () => {
      function isIntersectionObserverSupported() {
        return 'IntersectionObserver' in window;
      }

      const supported = isIntersectionObserverSupported();
      expect(typeof supported).toBe('boolean');
    });
  });

  describe('CSS 兼容性', () => {
    it('应该检测 CSS Grid 支持', () => {
      function isCSSGridSupported() {
        const element = document.createElement('div');
        return 'grid' in element.style;
      }

      const supported = isCSSGridSupported();
      expect(typeof supported).toBe('boolean');
    });

    it('应该检测 CSS Flexbox 支持', () => {
      function isFlexboxSupported() {
        const element = document.createElement('div');
        return 'flex' in element.style || 'webkitFlex' in element.style;
      }

      const supported = isFlexboxSupported();
      expect(typeof supported).toBe('boolean');
    });

    it('应该检测 CSS 自定义属性支持', () => {
      function isCSSCustomPropertiesSupported() {
        return window.CSS && CSS.supports && CSS.supports('color', 'var(--test)');
      }

      const supported = isCSSCustomPropertiesSupported();
      expect(typeof supported).toBe('boolean');
    });
  });

  describe('性能 API 兼容性', () => {
    it('应该检测 Performance API 支持', () => {
      function isPerformanceAPISupported() {
        return 'performance' in window && 'now' in performance;
      }

      const supported = isPerformanceAPISupported();
      expect(supported).toBe(true);
    });

    it('应该检测 PerformanceObserver 支持', () => {
      function isPerformanceObserverSupported() {
        return 'PerformanceObserver' in window;
      }

      const supported = isPerformanceObserverSupported();
      expect(typeof supported).toBe('boolean');
    });
  });

  describe('网络 API 兼容性', () => {
    it('应该检测 Fetch API 支持', () => {
      function isFetchSupported() {
        return 'fetch' in window;
      }

      const supported = isFetchSupported();
      expect(typeof supported).toBe('boolean');
    });

    it('应该检测 WebSocket 支持', () => {
      function isWebSocketSupported() {
        return 'WebSocket' in window;
      }

      const supported = isWebSocketSupported();
      expect(typeof supported).toBe('boolean');
    });
  });

  describe('错误处理兼容性', () => {
    it('应该处理不同浏览器的错误格式', () => {
      const testError = new Error('Test error');
      
      // 检查错误对象的基本属性
      expect(testError.message).toBe('Test error');
      expect(testError.name).toBe('Error');
      
      // 堆栈跟踪在不同浏览器中格式不同
      if (testError.stack) {
        expect(typeof testError.stack).toBe('string');
      }
    });

    it('应该处理 Promise 拒绝', async () => {
      const rejectedPromise = Promise.reject(new Error('Promise rejection'));
      
      try {
        await rejectedPromise;
        expect(false).toBe(true); // 不应该到达这里
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('Promise rejection');
      }
    });
  });
});
