import '@testing-library/jest-dom'
import { vi, beforeEach } from 'vitest'
import { act } from '@testing-library/react'

// Export act for easy use in tests
export { act }
import i18n from '../i18n'

// Mock Tauri APIs
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

// Mock Tauri modules
vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: mockTauri.invoke,
}))

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
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
  writable: true,
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
})

// Mock Canvas API for Chart.js
const mockCanvas = {
  getContext: vi.fn(() => ({
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn(() => ({ data: new Array(4) })),
    putImageData: vi.fn(),
    createImageData: vi.fn(() => ({ data: new Array(4) })),
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
  })),
  toDataURL: vi.fn(() => 'data:image/png;base64,'),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  width: 300,
  height: 150,
}

Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
  value: mockCanvas.getContext,
})

Object.defineProperty(HTMLCanvasElement.prototype, 'toDataURL', {
  value: mockCanvas.toDataURL,
})

// Note: Chart.js mocks are handled in individual test files to avoid conflicts

// Mock D3 modules globally
vi.mock('d3-selection', () => ({
  select: vi.fn(() => ({
    selectAll: vi.fn(() => ({
      data: vi.fn(() => ({
        enter: vi.fn(() => ({
          append: vi.fn(() => ({
            attr: vi.fn(),
            style: vi.fn(),
            text: vi.fn(),
          })),
        })),
        exit: vi.fn(() => ({
          remove: vi.fn(),
        })),
      })),
      attr: vi.fn(),
      style: vi.fn(),
      text: vi.fn(),
    })),
    append: vi.fn(),
    attr: vi.fn(),
    style: vi.fn(),
  })),
}))

// Note: react-window mocks are handled in individual test files when needed

// Note: mindmap package mocks are handled in individual test files when needed

// Initialize i18n once globally to avoid repeated initialization
let i18nInitialized = false

const initializeI18n = async () => {
  if (!i18nInitialized) {
    try {
      if (!i18n.isInitialized) {
        await i18n.init()
      }
      await i18n.changeLanguage('en')
      i18nInitialized = true
    } catch (error) {
      console.warn('i18n initialization failed in tests:', error)
    }
  }
}

// Initialize i18n once at startup
initializeI18n()

// Reset all mocks before each test (optimized)
beforeEach(() => {
  vi.clearAllMocks()

  // Reset storage mocks efficiently
  Object.values(localStorageMock).forEach(mock => mock.mockClear())
  Object.values(sessionStorageMock).forEach(mock => mock.mockClear())

  // Reset Tauri mocks
  mockTauri.invoke.mockClear()
  mockTauri.listen.mockClear()
  mockTauri.emit.mockClear()
})
