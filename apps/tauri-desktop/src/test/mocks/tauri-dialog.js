// Mock for @tauri-apps/api/dialog
import { vi } from 'vitest'

const open = vi.fn().mockImplementation((options) => {
  return Promise.resolve('/mock/file/path.txt')
})

const save = vi.fn().mockImplementation((options) => {
  return Promise.resolve('/mock/save/path.txt')
})

const message = vi.fn().mockImplementation((message, options) => {
  return Promise.resolve()
})

const ask = vi.fn().mockImplementation((message, options) => {
  return Promise.resolve(true)
})

const confirm = vi.fn().mockImplementation((message, options) => {
  return Promise.resolve(true)
})

export { open, save, message, ask, confirm }
export default { open, save, message, ask, confirm }
