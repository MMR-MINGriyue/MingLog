/**
 * Vitest 测试设置文件
 */

import '@testing-library/jest-dom';

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
