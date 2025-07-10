/**
 * MingLog 集成测试设置
 * 为集成测试提供全局配置和模拟
 */

import { vi, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';

// 全局测试配置
const INTEGRATION_TEST_CONFIG = {
  timeout: 60000,
  retries: 2,
  verbose: true,
  mockTimers: false,
  mockConsole: false
};

// 模拟浏览器 API
const mockBrowserAPIs = () => {
  // 模拟 localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    
    return {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value.toString();
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      }),
      get length() {
        return Object.keys(store).length;
      },
      key: vi.fn((index: number) => {
        const keys = Object.keys(store);
        return keys[index] || null;
      })
    };
  })();

  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true
  });

  // 模拟 sessionStorage
  const sessionStorageMock = (() => {
    let store: Record<string, string> = {};
    
    return {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        store[key] = value.toString();
      }),
      removeItem: vi.fn((key: string) => {
        delete store[key];
      }),
      clear: vi.fn(() => {
        store = {};
      }),
      get length() {
        return Object.keys(store).length;
      },
      key: vi.fn((index: number) => {
        const keys = Object.keys(store);
        return keys[index] || null;
      })
    };
  })();

  Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock,
    writable: true
  });

  // 模拟 IndexedDB
  const indexedDBMock = {
    open: vi.fn().mockReturnValue({
      result: {
        createObjectStore: vi.fn(),
        transaction: vi.fn().mockReturnValue({
          objectStore: vi.fn().mockReturnValue({
            add: vi.fn(),
            get: vi.fn(),
            put: vi.fn(),
            delete: vi.fn(),
            clear: vi.fn()
          })
        })
      },
      onsuccess: null,
      onerror: null
    }),
    deleteDatabase: vi.fn()
  };

  Object.defineProperty(window, 'indexedDB', {
    value: indexedDBMock,
    writable: true
  });

  // 模拟 fetch
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue({}),
    text: vi.fn().mockResolvedValue(''),
    blob: vi.fn().mockResolvedValue(new Blob()),
    arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0))
  });

  // 模拟 URL
  global.URL = {
    createObjectURL: vi.fn().mockReturnValue('blob:mock-url'),
    revokeObjectURL: vi.fn()
  } as any;

  // 模拟 FileReader
  global.FileReader = vi.fn().mockImplementation(() => ({
    readAsText: vi.fn(),
    readAsDataURL: vi.fn(),
    readAsArrayBuffer: vi.fn(),
    result: null,
    error: null,
    onload: null,
    onerror: null,
    onprogress: null
  })) as any;

  // 模拟 Blob
  global.Blob = vi.fn().mockImplementation((parts, options) => ({
    size: parts ? parts.join('').length : 0,
    type: options?.type || '',
    slice: vi.fn(),
    stream: vi.fn(),
    text: vi.fn().mockResolvedValue(parts ? parts.join('') : ''),
    arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0))
  })) as any;

  // 模拟 performance
  Object.defineProperty(window, 'performance', {
    value: {
      now: vi.fn(() => Date.now()),
      mark: vi.fn(),
      measure: vi.fn(),
      getEntriesByType: vi.fn().mockReturnValue([]),
      getEntriesByName: vi.fn().mockReturnValue([]),
      clearMarks: vi.fn(),
      clearMeasures: vi.fn(),
      memory: {
        usedJSHeapSize: 1000000,
        totalJSHeapSize: 2000000,
        jsHeapSizeLimit: 4000000
      }
    },
    writable: true
  });

  // 模拟 IntersectionObserver
  global.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    root: null,
    rootMargin: '',
    thresholds: []
  }));

  // 模拟 ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation((callback) => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn()
  }));

  // 模拟 MutationObserver
  global.MutationObserver = vi.fn().mockImplementation((callback) => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
    takeRecords: vi.fn().mockReturnValue([])
  }));
};

// 模拟桌面环境 API
const mockDesktopAPIs = () => {
  // 模拟 Tauri API
  const mockTauriAPI = {
    invoke: vi.fn().mockResolvedValue({}),
    listen: vi.fn().mockResolvedValue(() => {}),
    emit: vi.fn().mockResolvedValue(undefined),
    
    fs: {
      readTextFile: vi.fn().mockResolvedValue(''),
      writeTextFile: vi.fn().mockResolvedValue(undefined),
      exists: vi.fn().mockResolvedValue(true),
      createDir: vi.fn().mockResolvedValue(undefined),
      removeFile: vi.fn().mockResolvedValue(undefined),
      readDir: vi.fn().mockResolvedValue([]),
      copyFile: vi.fn().mockResolvedValue(undefined),
      renameFile: vi.fn().mockResolvedValue(undefined)
    },
    
    path: {
      appDataDir: vi.fn().mockResolvedValue('/mock/app/data'),
      documentDir: vi.fn().mockResolvedValue('/mock/documents'),
      homeDir: vi.fn().mockResolvedValue('/mock/home'),
      join: vi.fn().mockImplementation((...paths) => paths.join('/')),
      dirname: vi.fn().mockImplementation((path) => path.split('/').slice(0, -1).join('/')),
      basename: vi.fn().mockImplementation((path) => path.split('/').pop() || '')
    },
    
    window: {
      getCurrent: vi.fn().mockReturnValue({
        setTitle: vi.fn().mockResolvedValue(undefined),
        minimize: vi.fn().mockResolvedValue(undefined),
        maximize: vi.fn().mockResolvedValue(undefined),
        close: vi.fn().mockResolvedValue(undefined),
        show: vi.fn().mockResolvedValue(undefined),
        hide: vi.fn().mockResolvedValue(undefined),
        setSize: vi.fn().mockResolvedValue(undefined),
        setPosition: vi.fn().mockResolvedValue(undefined)
      })
    },
    
    notification: {
      sendNotification: vi.fn().mockResolvedValue(undefined),
      isPermissionGranted: vi.fn().mockResolvedValue(true),
      requestPermission: vi.fn().mockResolvedValue('granted')
    },
    
    dialog: {
      open: vi.fn().mockResolvedValue('/mock/selected/path'),
      save: vi.fn().mockResolvedValue('/mock/save/path'),
      message: vi.fn().mockResolvedValue(undefined),
      ask: vi.fn().mockResolvedValue(true),
      confirm: vi.fn().mockResolvedValue(true)
    },
    
    clipboard: {
      writeText: vi.fn().mockResolvedValue(undefined),
      readText: vi.fn().mockResolvedValue('mock clipboard text')
    },
    
    shell: {
      open: vi.fn().mockResolvedValue(undefined)
    }
  };

  // 设置全局 Tauri API
  Object.defineProperty(window, '__TAURI__', {
    value: mockTauriAPI,
    writable: true
  });

  // 模拟 Electron API（如果需要）
  Object.defineProperty(window, 'electronAPI', {
    value: {
      platform: 'mock',
      versions: {
        node: '18.0.0',
        chrome: '108.0.0',
        electron: '22.0.0'
      }
    },
    writable: true
  });
};

// 模拟数据库连接
const mockDatabaseConnection = () => {
  const mockDB = {
    query: vi.fn().mockResolvedValue([]),
    execute: vi.fn().mockResolvedValue({ changes: 1, lastInsertRowid: 1 }),
    close: vi.fn().mockResolvedValue(undefined),
    prepare: vi.fn().mockReturnValue({
      run: vi.fn().mockReturnValue({ changes: 1, lastInsertRowid: 1 }),
      get: vi.fn().mockReturnValue(undefined),
      all: vi.fn().mockReturnValue([]),
      finalize: vi.fn()
    }),
    transaction: vi.fn().mockImplementation((callback) => callback()),
    backup: vi.fn().mockResolvedValue(undefined),
    pragma: vi.fn().mockResolvedValue([])
  };

  return mockDB;
};

// 设置测试环境
const setupTestEnvironment = () => {
  // 设置环境变量
  process.env.NODE_ENV = 'test';
  process.env.MINGLOG_ENV = 'integration-test';
  process.env.MINGLOG_DEBUG = 'true';

  // 模拟控制台（如果需要）
  if (INTEGRATION_TEST_CONFIG.mockConsole) {
    global.console = {
      ...console,
      log: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      info: vi.fn(),
      debug: vi.fn()
    };
  }

  // 设置时区
  process.env.TZ = 'UTC';

  // 模拟 Date.now 为固定时间（如果需要）
  if (INTEGRATION_TEST_CONFIG.mockTimers) {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
  }
};

// 清理测试环境
const cleanupTestEnvironment = () => {
  if (INTEGRATION_TEST_CONFIG.mockTimers) {
    vi.useRealTimers();
  }
  
  vi.clearAllMocks();
  vi.resetAllMocks();
};

// 全局设置
beforeAll(() => {
  setupTestEnvironment();
  mockBrowserAPIs();
  mockDesktopAPIs();
});

afterAll(() => {
  cleanupTestEnvironment();
});

beforeEach(() => {
  // 每个测试前重置模拟
  vi.clearAllMocks();
});

afterEach(() => {
  // 每个测试后清理
  if (window.localStorage) {
    window.localStorage.clear();
  }
  if (window.sessionStorage) {
    window.sessionStorage.clear();
  }
});

// 导出测试工具
export const testUtils = {
  mockDatabaseConnection,
  
  // 等待异步操作完成
  waitFor: async (condition: () => boolean, timeout = 5000) => {
    const start = Date.now();
    while (!condition() && Date.now() - start < timeout) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    if (!condition()) {
      throw new Error(`Condition not met within ${timeout}ms`);
    }
  },
  
  // 模拟延迟
  delay: (ms: number) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // 创建模拟事件
  createMockEvent: (type: string, data: any = {}) => ({
    type,
    data,
    timestamp: Date.now(),
    source: 'test'
  }),
  
  // 验证模拟调用
  expectMockCalled: (mockFn: any, times?: number) => {
    if (times !== undefined) {
      expect(mockFn).toHaveBeenCalledTimes(times);
    } else {
      expect(mockFn).toHaveBeenCalled();
    }
  }
};

// 导出配置
export { INTEGRATION_TEST_CONFIG };
