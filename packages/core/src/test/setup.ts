/**
 * MingLog 测试环境设置
 * 配置测试所需的全局设置和模拟
 */

import '@testing-library/jest-dom';
import { vi } from 'vitest';

// 模拟浏览器API
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// 模拟ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// 模拟IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// 模拟localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// 模拟sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock
});

// 模拟URL.createObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: vi.fn(() => 'mocked-url'),
});

Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  value: vi.fn(),
});

// 模拟Worker
class MockWorker {
  constructor(public url: string) {}
  postMessage = vi.fn();
  terminate = vi.fn();
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
}

Object.defineProperty(window, 'Worker', {
  writable: true,
  value: MockWorker,
});

// 模拟performance API
Object.defineProperty(window, 'performance', {
  writable: true,
  value: {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByType: vi.fn(() => []),
    getEntriesByName: vi.fn(() => []),
    clearMarks: vi.fn(),
    clearMeasures: vi.fn(),
    memory: {
      usedJSHeapSize: 1000000,
      totalJSHeapSize: 2000000,
      jsHeapSizeLimit: 4000000,
    },
  },
});

// 模拟PerformanceObserver
global.PerformanceObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn(() => []),
}));

// 模拟requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => {
  setTimeout(cb, 16);
  return 1;
});

global.cancelAnimationFrame = vi.fn();

// 模拟fetch
global.fetch = vi.fn();

// 模拟console方法（避免测试输出污染）
const originalConsole = { ...console };
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// 测试前后的清理
beforeEach(() => {
  // 清理所有模拟
  vi.clearAllMocks();
  
  // 重置localStorage
  localStorageMock.getItem.mockReturnValue(null);
  localStorageMock.setItem.mockImplementation(() => {});
  localStorageMock.removeItem.mockImplementation(() => {});
  localStorageMock.clear.mockImplementation(() => {});
});

afterEach(() => {
  // 清理DOM
  document.body.innerHTML = '';
  
  // 清理定时器
  vi.clearAllTimers();
});

// 全局测试工具函数
export const testUtils = {
  // 等待异步操作完成
  waitFor: async (fn: () => boolean, timeout = 5000) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if (fn()) return;
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    throw new Error('Timeout waiting for condition');
  },
  
  // 模拟用户交互
  mockUserInteraction: {
    click: (element: HTMLElement) => {
      element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    },
    
    type: (element: HTMLInputElement, text: string) => {
      element.value = text;
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    },
    
    keyDown: (element: HTMLElement, key: string) => {
      element.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
    }
  },
  
  // 创建测试数据
  createMockData: {
    pageLink: (overrides = {}) => ({
      id: 'test-page-link',
      type: 'page-reference' as const,
      pageName: 'Test Page',
      alias: 'Test',
      position: 0,
      context: 'test-context',
      ...overrides
    }),
    
    blockLink: (overrides = {}) => ({
      id: 'test-block-link',
      type: 'block-reference' as const,
      blockId: 'test-block',
      alias: 'Test Block',
      position: 0,
      context: 'test-context',
      ...overrides
    }),
    
    searchDocument: (overrides = {}) => ({
      id: 'test-doc',
      title: 'Test Document',
      content: 'This is test content',
      type: 'page' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: ['test'],
      ...overrides
    }),
    
    graphNode: (overrides = {}) => ({
      id: 'test-node',
      type: 'page' as const,
      title: 'Test Node',
      x: 0,
      y: 0,
      ...overrides
    }),
    
    graphEdge: (overrides = {}) => ({
      id: 'test-edge',
      source: 'node1',
      target: 'node2',
      type: 'page-reference' as const,
      ...overrides
    })
  },
  
  // 恢复原始console（用于调试）
  restoreConsole: () => {
    global.console = originalConsole;
  }
};

// 导出模拟对象供测试使用
export const mocks = {
  localStorage: localStorageMock,
  Worker: MockWorker,
  fetch: global.fetch,
  performance: window.performance,
  console: global.console
};
