/**
 * 测试设置文件
 * 配置测试环境和全局模拟
 */

import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// 扩展expect匹配器
expect.extend(matchers);

// 每个测试后清理
afterEach(() => {
  cleanup();
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

// 模拟Range和Selection API
global.Range = class Range {
  startContainer: Node = document.body;
  endContainer: Node = document.body;
  startOffset: number = 0;
  endOffset: number = 0;
  collapsed: boolean = true;
  commonAncestorContainer: Node = document.body;

  setStart() {}
  setEnd() {}
  selectNode() {}
  selectNodeContents() {}
  collapse() {}
  deleteContents() {}
  extractContents() { return new DocumentFragment(); }
  cloneContents() { return new DocumentFragment(); }
  insertNode() {}
  surroundContents() {}
  cloneRange() { return new Range(); }
  detach() {}
  toString() { return ''; }
  compareBoundaryPoints() { return 0; }
  getBoundingClientRect() {
    return {
      left: 0,
      top: 0,
      right: 100,
      bottom: 20,
      width: 100,
      height: 20,
      x: 0,
      y: 0,
      toJSON: () => ({})
    };
  }
  getClientRects() {
    return {
      length: 1,
      item: () => this.getBoundingClientRect(),
      [Symbol.iterator]: function* () {
        yield this.getBoundingClientRect();
      }
    } as any;
  }
};

global.Selection = class Selection {
  anchorNode: Node | null = null;
  anchorOffset: number = 0;
  focusNode: Node | null = null;
  focusOffset: number = 0;
  isCollapsed: boolean = true;
  rangeCount: number = 0;
  type: string = 'None';

  addRange() {}
  removeRange() {}
  removeAllRanges() {}
  getRangeAt() { return new Range(); }
  collapse() {}
  extend() {}
  collapseToStart() {}
  collapseToEnd() {}
  selectAllChildren() {}
  deleteFromDocument() {}
  toString() { return ''; }
  containsNode() { return false; }
};

// 模拟document.createRange
document.createRange = () => new Range();

// 模拟window.getSelection
window.getSelection = () => new Selection();

// 模拟DOMRect
global.DOMRect = class DOMRect {
  constructor(
    public x: number = 0,
    public y: number = 0,
    public width: number = 0,
    public height: number = 0
  ) {}

  get left() { return this.x; }
  get right() { return this.x + this.width; }
  get top() { return this.y; }
  get bottom() { return this.y + this.height; }

  toJSON() {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      left: this.left,
      right: this.right,
      top: this.top,
      bottom: this.bottom
    };
  }
};

// 模拟Element.getBoundingClientRect
Element.prototype.getBoundingClientRect = vi.fn(() => new DOMRect(0, 0, 100, 20));

// 模拟Element.scrollIntoView
Element.prototype.scrollIntoView = vi.fn();

// 模拟requestAnimationFrame
global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16));
global.cancelAnimationFrame = vi.fn((id) => clearTimeout(id));

// 模拟performance.now
global.performance = global.performance || {};
global.performance.now = vi.fn(() => Date.now());

// 模拟localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};
global.localStorage = localStorageMock;

// 模拟sessionStorage
global.sessionStorage = localStorageMock;

// 模拟console方法（避免测试输出污染）
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
};

// 模拟URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

// 模拟Blob
global.Blob = class Blob {
  constructor(public parts: any[] = [], public options: any = {}) {}
  
  get size() { return 0; }
  get type() { return this.options.type || ''; }
  
  slice() { return new Blob(); }
  stream() { return new ReadableStream(); }
  text() { return Promise.resolve(''); }
  arrayBuffer() { return Promise.resolve(new ArrayBuffer(0)); }
};

// 模拟File
global.File = class File extends Blob {
  constructor(
    parts: any[],
    public name: string,
    options: any = {}
  ) {
    super(parts, options);
  }
  
  get lastModified() { return Date.now(); }
  get webkitRelativePath() { return ''; }
};

// 模拟FileReader
global.FileReader = class FileReader {
  result: any = null;
  error: any = null;
  readyState: number = 0;
  
  onload: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  onprogress: ((event: any) => void) | null = null;
  
  readAsText() {
    setTimeout(() => {
      this.result = '';
      this.readyState = 2;
      this.onload?.({ target: this });
    }, 0);
  }
  
  readAsDataURL() {
    setTimeout(() => {
      this.result = 'data:text/plain;base64,';
      this.readyState = 2;
      this.onload?.({ target: this });
    }, 0);
  }
  
  abort() {}
};

// 模拟Clipboard API
global.navigator.clipboard = {
  writeText: vi.fn(() => Promise.resolve()),
  readText: vi.fn(() => Promise.resolve('')),
  write: vi.fn(() => Promise.resolve()),
  read: vi.fn(() => Promise.resolve([]))
};

// 模拟MutationObserver
global.MutationObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  takeRecords: vi.fn(() => [])
}));

// 设置测试环境变量
process.env.NODE_ENV = 'test';

// 全局错误处理
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// 导出测试工具函数
export const createMockEvent = (type: string, properties: any = {}) => {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.assign(event, properties);
  return event;
};

export const createMockKeyboardEvent = (key: string, options: any = {}) => {
  return new KeyboardEvent('keydown', {
    key,
    code: key,
    bubbles: true,
    cancelable: true,
    ...options
  });
};

export const createMockMouseEvent = (type: string, options: any = {}) => {
  return new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: 0,
    clientY: 0,
    ...options
  });
};

// 测试数据工厂
export const createTestElement = (type: string = 'paragraph', text: string = '测试文本') => ({
  id: `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  type,
  children: [{ text }],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

export const createTestContent = (count: number = 3) => {
  return Array.from({ length: count }, (_, i) => 
    createTestElement('paragraph', `测试段落 ${i + 1}`)
  );
};
