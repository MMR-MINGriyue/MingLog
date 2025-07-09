// Mock for @tauri-apps/api/event
import { vi } from 'vitest'

const listen = vi.fn().mockImplementation((event, handler) => {
  return Promise.resolve(() => {
    // Mock unlisten function
  })
})

const emit = vi.fn().mockImplementation((event, payload) => {
  return Promise.resolve()
})

export { listen, emit }
export default { listen, emit }
