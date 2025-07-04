// Mock for @tauri-apps/api/core
const invoke = jest.fn().mockImplementation((command, args) => {
  // Mock different commands with appropriate responses
  switch (command) {
    case 'init_app':
      return Promise.resolve('App initialized successfully')
    case 'init_database':
      return Promise.resolve('Database initialized successfully')
    case 'check_app_ready':
      return Promise.resolve(true)
    case 'get_memory_info':
      return Promise.resolve({
        used: Math.random() * 2000000000 + 500000000,
        total: 8000000000
      })
    case 'measure_db_performance':
      return Promise.resolve()
    case 'get_sync_status':
      return Promise.resolve('Idle')
    case 'get_sync_stats':
      return Promise.resolve({ total_files: 10 })
    case 'get_webdav_config':
      return Promise.resolve({ enabled: true })
    default:
      return Promise.resolve(null)
  }
})

module.exports = {
  invoke,
  __esModule: true,
  default: { invoke }
}
