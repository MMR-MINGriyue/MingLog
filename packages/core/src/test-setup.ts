/**
 * Vitest 测试设置文件
 * 配置全局测试环境和模拟
 */

import '@testing-library/jest-dom';
import { vi, beforeEach, afterEach } from 'vitest';

// 导入测试基础设施
import { MockFactory } from './test/TestInfrastructureSetup';

// 模拟浏览器API
Object.defineProperty(window, 'indexedDB', {
  value: {
    open: vi.fn(),
    deleteDatabase: vi.fn(),
    cmp: vi.fn(),
  },
  writable: true,
});

Object.defineProperty(window, 'Worker', {
  value: class MockWorker {
    constructor(url: string) {
      this.url = url;
    }
    url: string;
    onmessage: ((event: MessageEvent) => void) | null = null;
    onerror: ((event: ErrorEvent) => void) | null = null;
    postMessage = vi.fn();
    terminate = vi.fn();
  },
  writable: true,
});

Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: vi.fn(),
    unregister: vi.fn(),
    getRegistration: vi.fn(),
    getRegistrations: vi.fn(),
  },
  writable: true,
});

Object.defineProperty(window, 'IntersectionObserver', {
  value: class MockIntersectionObserver {
    constructor(callback: IntersectionObserverCallback) {
      this.callback = callback;
    }
    callback: IntersectionObserverCallback;
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  },
  writable: true,
});

Object.defineProperty(window, 'ResizeObserver', {
  value: class MockResizeObserver {
    constructor(callback: ResizeObserverCallback) {
      this.callback = callback;
    }
    callback: ResizeObserverCallback;
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  },
  writable: true,
});

Object.defineProperty(window, 'MutationObserver', {
  value: class MockMutationObserver {
    constructor(callback: MutationCallback) {
      this.callback = callback;
    }
    callback: MutationCallback;
    observe = vi.fn();
    disconnect = vi.fn();
    takeRecords = vi.fn(() => []);
  },
  writable: true,
});

// 模拟CSS支持检测
Object.defineProperty(window, 'CSS', {
  value: {
    supports: vi.fn((property: string, value: string) => true),
  },
  writable: true,
});

// 模拟getBoundingClientRect
Element.prototype.getBoundingClientRect = vi.fn(() => ({
  width: 100,
  height: 100,
  top: 0,
  left: 0,
  bottom: 100,
  right: 100,
  x: 0,
  y: 0,
  toJSON: vi.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
}
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
})

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock URL.createObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: vi.fn(() => 'mocked-url'),
})

Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  value: vi.fn(),
})

// Mock Canvas API
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(() => ({
    data: new Uint8ClampedArray(4),
  })),
  putImageData: vi.fn(),
  createImageData: vi.fn(() => []),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  fillText: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  transform: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
}))

// Mock SVG
Object.defineProperty(SVGElement.prototype, 'getBBox', {
  writable: true,
  value: vi.fn(() => ({
    x: 0,
    y: 0,
    width: 100,
    height: 100,
  })),
})

// Mock Tauri API
const mockTauriAPI = {
  invoke: vi.fn(),
  listen: vi.fn(),
  emit: vi.fn(),
}

Object.defineProperty(window, '__TAURI__', {
  value: mockTauriAPI
})

// 测试工具函数
export const createMockCoreAPI = () => ({
  database: {
    execute: vi.fn(),
    query: vi.fn(),
    transaction: vi.fn()
  },
  events: {
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn()
  },
  storage: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
    clear: vi.fn()
  },
  settings: {
    get: vi.fn(),
    set: vi.fn(),
    getModuleSettings: vi.fn(),
    setModuleSettings: vi.fn()
  },
  notifications: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn()
  },
  router: {
    navigate: vi.fn(),
    getCurrentPath: vi.fn(),
    addRoutes: vi.fn(),
    removeRoutes: vi.fn()
  }
})

// 创建Mock任务数据
export const createMockTask = (overrides = {}) => ({
  id: 'task_123',
  title: '测试任务',
  description: '这是一个测试任务',
  status: 'todo',
  priority: 'medium',
  tags: [],
  contexts: [],
  linkedNotes: [],
  linkedFiles: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

// 创建Mock笔记数据
export const createMockNote = (overrides = {}) => ({
  id: 'note_123',
  title: '测试笔记',
  content: '这是一个测试笔记的内容',
  tags: [],
  isFavorite: false,
  isArchived: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
})

// 等待异步操作完成的工具函数
export const waitForAsync = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms))

// 性能测试工具
export const measurePerformance = async (fn: () => Promise<void> | void) => {
  const start = performance.now()
  await fn()
  const end = performance.now()
  return end - start
}

// 全局测试钩子
beforeEach(() => {
  // 清理所有模拟
  vi.clearAllMocks()

  // 重置 localStorage
  localStorageMock.clear()

  // 重置 sessionStorage
  sessionStorageMock.clear()
})

afterEach(() => {
  // 清理定时器
  vi.clearAllTimers()

  // 清理所有模拟调用记录
  vi.clearAllMocks()
})

// 导出增强的测试工具
export { MockFactory }
