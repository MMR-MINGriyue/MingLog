// Mock for @tauri-apps/api/dialog
const open = jest.fn().mockImplementation((options) => {
  return Promise.resolve('/mock/file/path.txt')
})

const save = jest.fn().mockImplementation((options) => {
  return Promise.resolve('/mock/save/path.txt')
})

const message = jest.fn().mockImplementation((message, options) => {
  return Promise.resolve()
})

const ask = jest.fn().mockImplementation((message, options) => {
  return Promise.resolve(true)
})

const confirm = jest.fn().mockImplementation((message, options) => {
  return Promise.resolve(true)
})

module.exports = {
  open,
  save,
  message,
  ask,
  confirm,
  __esModule: true,
  default: { open, save, message, ask, confirm }
}
