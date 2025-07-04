import { vi } from 'vitest'

// Mock implementation of Tauri's invoke function
export const invoke = vi.fn().mockImplementation((command: string, args?: any) => {
  switch (command) {
    case 'get_memory_info':
      return Promise.resolve({ 
        used: 100 * 1024 * 1024, 
        total: 1024 * 1024 * 1024 
      })
    
    case 'measure_db_performance':
      return Promise.resolve({ 
        query_time: 25,
        insert_time: 15,
        update_time: 20,
        delete_time: 10
      })
    
    case 'get_system_info':
      return Promise.resolve({
        memory: { 
          used: 100, 
          total: 1024, 
          percentage: 10 
        },
        cpu: { 
          usage: 15, 
          cores: 8 
        },
        disk: { 
          read_bytes: 1000, 
          write_bytes: 500 
        },
        process: {
          run_time: 3600,
          threads: 4,
          status: 'Running'
        }
      })
    
    case 'analyze_performance_bottlenecks':
      return Promise.resolve({
        cpu_bottleneck: false,
        memory_bottleneck: false,
        disk_bottleneck: false,
        recommendations: [
          'System performance is optimal',
          'No bottlenecks detected'
        ]
      })
    
    case 'search_blocks':
      return Promise.resolve({
        results: [],
        total_results: 0,
        query_time_ms: 5
      })
    
    default:
      console.warn(`Unhandled Tauri command: ${command}`)
      return Promise.resolve({})
  }
})

// Mock other Tauri API functions that might be used
export const listen = vi.fn().mockResolvedValue(() => {})
export const emit = vi.fn().mockResolvedValue(undefined)

// Export default for compatibility
export default {
  invoke,
  listen,
  emit,
}
