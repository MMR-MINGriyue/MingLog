// Mock for @tauri-apps/api/event
const listen = jest.fn().mockImplementation((event, handler) => {
  return Promise.resolve(() => {
    // Mock unlisten function
  })
})

const emit = jest.fn().mockImplementation((event, payload) => {
  return Promise.resolve()
})

module.exports = {
  listen,
  emit,
  __esModule: true,
  default: { listen, emit }
}
