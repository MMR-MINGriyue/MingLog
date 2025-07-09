import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Tauri API
const mockTauri = {
  invoke: vi.fn(),
  listen: vi.fn(),
  emit: vi.fn(),
}

// Mock window.__TAURI__
Object.defineProperty(window, '__TAURI__', {
  value: mockTauri,
  writable: true,
})

// Create a mock function for Tauri IPC
const mockTauriIPC = vi.fn((message) => {
  // Parse the message to extract command and args
  let cmd, args;

  if (typeof message === 'object' && message !== null) {
    cmd = message.cmd || message.command;
    args = message.payload || message.args || message;
  } else {
    return Promise.resolve({});
  }

  switch (cmd) {
    case 'search_blocks':
      return Promise.resolve({
        blocks: args?.request?.query ? [
          {
            id: 'test-block-1',
            title: 'Integration Test Page',
            content: 'This is a test page for integration testing',
            type: 'block',
            score: 95.0,
          },
          {
            id: 'test-block-2',
            title: 'Test Block',
            content: 'This is a test block',
            type: 'block',
            score: 85.0,
          }
        ] : [],
        total: args?.request?.query ? 2 : 0,
        query: args?.request?.query || '',
      });
    case 'create_note':
      return Promise.resolve({
        id: 'mock-note-id',
        title: args?.request?.title || 'Mock Note',
        content: args?.request?.content || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    case 'get_notes':
      return Promise.resolve([]);
    case 'update_note':
      return Promise.resolve({
        id: args?.request?.id || 'mock-note-id',
        title: args?.request?.title || 'Updated Note',
        content: args?.request?.content || '',
        updated_at: new Date().toISOString(),
      });
    case 'delete_note':
      return Promise.resolve();
    case 'export_data':
    case 'import_data':
      return Promise.resolve('success');
    case 'get_system_info':
      return Promise.resolve({
        platform: 'test',
        version: '1.0.0',
        memory: 8192,
        cpu_count: 4,
      });
    default:
      return Promise.resolve({});
  }
});

// Mock window.__TAURI_IPC__ - this is the low-level IPC function
Object.defineProperty(window, '__TAURI_IPC__', {
  value: mockTauriIPC,
  writable: true,
  configurable: true,
});

// Also set it as a global for tests that might access it directly
(globalThis as any).__TAURI_IPC__ = mockTauriIPC;

// Mock performance.memory
Object.defineProperty(performance, 'memory', {
  value: {
    usedJSHeapSize: 50 * 1024 * 1024, // 50MB
    totalJSHeapSize: 100 * 1024 * 1024, // 100MB
    jsHeapSizeLimit: 2 * 1024 * 1024 * 1024, // 2GB
  },
  writable: true,
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock matchMedia
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

// Setup cleanup after each test
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})
