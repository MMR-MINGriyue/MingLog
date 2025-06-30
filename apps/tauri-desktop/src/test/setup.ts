import '@testing-library/jest-dom'

// 检测是否在Jest环境中
const isJest = typeof jest !== 'undefined'
const mockFn = isJest ? jest.fn : require('vitest').vi.fn

// Mock Tauri APIs
const mockTauri = {
  invoke: mockFn(),
  listen: mockFn(),
  emit: mockFn(),
}

// Mock window.__TAURI__
Object.defineProperty(window, '__TAURI__', {
  value: mockTauri,
  writable: true,
})

// Mock Tauri modules
const mockModule = isJest ? jest.mock : require('vitest').vi.mock

if (isJest) {
  jest.mock('@tauri-apps/api/core', () => ({
    invoke: mockTauri.invoke,
  }))

  jest.mock('@tauri-apps/api/event', () => ({
    listen: mockTauri.listen,
    emit: mockTauri.emit,
  }))

  jest.mock('@tauri-apps/api/dialog', () => ({
    open: jest.fn(),
    save: jest.fn(),
  }))
} else {
  const { vi } = require('vitest')
  vi.mock('@tauri-apps/api/core', () => ({
    invoke: mockTauri.invoke,
  }))

  vi.mock('@tauri-apps/api/event', () => ({
    listen: mockTauri.listen,
    emit: mockTauri.emit,
  }))

  vi.mock('@tauri-apps/api/dialog', () => ({
    open: vi.fn(),
    save: vi.fn(),
  }))
}

// Mock ResizeObserver
global.ResizeObserver = mockFn().mockImplementation(() => ({
  observe: mockFn(),
  unobserve: mockFn(),
  disconnect: mockFn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = mockFn().mockImplementation(() => ({
  observe: mockFn(),
  unobserve: mockFn(),
  disconnect: mockFn(),
}))

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockFn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: mockFn(), // deprecated
    removeListener: mockFn(), // deprecated
    addEventListener: mockFn(),
    removeEventListener: mockFn(),
    dispatchEvent: mockFn(),
  })),
})

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: mockFn(),
  writable: true,
})

// Mock localStorage
const localStorageMock = {
  getItem: mockFn(),
  setItem: mockFn(),
  removeItem: mockFn(),
  clear: mockFn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock sessionStorage
const sessionStorageMock = {
  getItem: mockFn(),
  setItem: mockFn(),
  removeItem: mockFn(),
  clear: mockFn(),
}
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
})

// Reset all mocks before each test
beforeEach(() => {
  if (isJest) {
    jest.clearAllMocks()
  } else {
    const { vi } = require('vitest')
    vi.clearAllMocks()
  }
  localStorageMock.getItem.mockClear()
  localStorageMock.setItem.mockClear()
  localStorageMock.removeItem.mockClear()
  localStorageMock.clear.mockClear()
  sessionStorageMock.getItem.mockClear()
  sessionStorageMock.setItem.mockClear()
  sessionStorageMock.removeItem.mockClear()
  sessionStorageMock.clear.mockClear()
})
