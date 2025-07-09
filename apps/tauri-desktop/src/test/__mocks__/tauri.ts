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
      })

    case 'create_note':
      return Promise.resolve({
        id: 'mock-note-id',
        title: args?.request?.title || 'Mock Note',
        content: args?.request?.content || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })

    case 'get_notes':
      return Promise.resolve([])

    case 'update_note':
      return Promise.resolve({
        id: args?.request?.id || 'mock-note-id',
        title: args?.request?.title || 'Updated Note',
        content: args?.request?.content || '',
        updated_at: new Date().toISOString(),
      })

    case 'delete_note':
      return Promise.resolve()

    case 'export_data':
    case 'import_data':
      return Promise.resolve('success')

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
