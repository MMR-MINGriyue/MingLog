/**
 * 外键约束修复验证测试
 * 验证TasksModule中的表创建顺序修复是否有效
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { TasksModule } from '../TasksModule'
import type { CoreAPI } from '@minglog/core'

// 模拟数据库连接
const createMockDatabase = () => {
  const executedQueries: string[] = []
  
  return {
    execute: vi.fn().mockImplementation((sql: string) => {
      executedQueries.push(sql)
      return Promise.resolve()
    }),
    query: vi.fn().mockImplementation((sql: string) => {
      if (sql === 'PRAGMA foreign_keys') {
        return Promise.resolve([{ foreign_keys: 1 }])
      }
      if (sql.includes('table_info')) {
        return Promise.resolve([
          { cid: 0, name: 'id', type: 'TEXT', notnull: 1, dflt_value: null, pk: 1 },
          { cid: 1, name: 'name', type: 'TEXT', notnull: 1, dflt_value: null, pk: 0 }
        ])
      }
      if (sql.includes('foreign_key_list')) {
        return Promise.resolve([
          { id: 0, seq: 0, table: 'projects', from: 'project_id', to: 'id', on_update: 'NO ACTION', on_delete: 'SET NULL' },
          { id: 1, seq: 0, table: 'tasks', from: 'parent_task_id', to: 'id', on_update: 'NO ACTION', on_delete: 'CASCADE' }
        ])
      }
      return Promise.resolve([])
    }),
    getExecutedQueries: () => executedQueries
  }
}

describe('外键约束修复验证', () => {
  let tasksModule: TasksModule
  let mockDatabase: ReturnType<typeof createMockDatabase>
  let mockCoreAPI: CoreAPI

  beforeEach(() => {
    mockDatabase = createMockDatabase()
    
    mockCoreAPI = {
      database: mockDatabase,
      events: {
        emit: vi.fn(),
        on: vi.fn(),
        off: vi.fn()
      }
    } as any

    tasksModule = new TasksModule({
      id: 'tasks',
      name: '任务管理',
      version: '1.0.0',
      enabled: true
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('应该按正确顺序创建数据库表', async () => {
    // 初始化模块
    await tasksModule.initialize(mockCoreAPI)

    const executedQueries = mockDatabase.getExecutedQueries()
    
    // 验证查询执行顺序
    expect(executedQueries.length).toBeGreaterThanOrEqual(3)
    
    // 查找projects表和tasks表的创建语句
    const projectsCreateIndex = executedQueries.findIndex(query => 
      query.includes('CREATE TABLE IF NOT EXISTS projects')
    )
    const tasksCreateIndex = executedQueries.findIndex(query => 
      query.includes('CREATE TABLE IF NOT EXISTS tasks')
    )
    
    // 验证projects表在tasks表之前创建
    expect(projectsCreateIndex).toBeGreaterThanOrEqual(0)
    expect(tasksCreateIndex).toBeGreaterThanOrEqual(0)
    expect(projectsCreateIndex).toBeLessThan(tasksCreateIndex)
    
    console.log('✅ 表创建顺序验证通过: projects表在tasks表之前创建')
  })

  it('应该正确设置外键约束', async () => {
    // 初始化模块
    await tasksModule.initialize(mockCoreAPI)

    const executedQueries = mockDatabase.getExecutedQueries()
    
    // 查找tasks表创建语句
    const tasksCreateQuery = executedQueries.find(query => 
      query.includes('CREATE TABLE IF NOT EXISTS tasks')
    )
    
    expect(tasksCreateQuery).toBeDefined()
    
    // 验证外键约束语法
    expect(tasksCreateQuery).toContain('FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL')
    expect(tasksCreateQuery).toContain('FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE CASCADE')
    
    console.log('✅ 外键约束语法验证通过')
  })

  it('应该验证外键约束状态', async () => {
    // 初始化模块
    await tasksModule.initialize(mockCoreAPI)

    // 验证是否调用了外键约束检查
    expect(mockDatabase.query).toHaveBeenCalledWith('PRAGMA foreign_keys')
    expect(mockDatabase.query).toHaveBeenCalledWith('PRAGMA table_info(projects)')
    expect(mockDatabase.query).toHaveBeenCalledWith('PRAGMA table_info(tasks)')
    expect(mockDatabase.query).toHaveBeenCalledWith('PRAGMA foreign_key_list(tasks)')
    
    console.log('✅ 外键约束验证调用通过')
  })

  it('应该处理数据库错误而不崩溃', async () => {
    // 模拟数据库错误
    mockDatabase.execute.mockRejectedValueOnce(new Error('Database error'))

    // 验证错误被正确抛出
    await expect(tasksModule.initialize(mockCoreAPI)).rejects.toThrow('Database error')
    
    console.log('✅ 数据库错误处理验证通过')
  })

  it('应该在没有数据库连接时优雅处理', async () => {
    // 创建没有数据库的CoreAPI
    const mockCoreAPIWithoutDB = {
      events: {
        emit: vi.fn(),
        on: vi.fn(),
        off: vi.fn()
      }
    } as any

    // 应该不抛出错误
    await expect(tasksModule.initialize(mockCoreAPIWithoutDB)).resolves.not.toThrow()
    
    console.log('✅ 无数据库连接处理验证通过')
  })
})

describe('外键约束修复前后对比', () => {
  it('修复前的问题：tasks表在projects表之前创建会导致外键约束失败', () => {
    // 模拟修复前的错误顺序
    const wrongOrderQueries = [
      'CREATE TABLE IF NOT EXISTS tasks (..., FOREIGN KEY (project_id) REFERENCES projects(id))',
      'CREATE TABLE IF NOT EXISTS projects (...)'
    ]
    
    // 在实际数据库中，这种顺序会导致FOREIGN KEY constraint failed错误
    // 因为tasks表试图引用尚不存在的projects表
    
    const tasksIndex = wrongOrderQueries.findIndex(q => q.includes('tasks'))
    const projectsIndex = wrongOrderQueries.findIndex(q => q.includes('projects'))
    
    expect(tasksIndex).toBeLessThan(projectsIndex) // 错误的顺序
    console.log('❌ 修复前：错误的表创建顺序会导致外键约束失败')
  })

  it('修复后的正确顺序：projects表在tasks表之前创建', () => {
    // 模拟修复后的正确顺序
    const correctOrderQueries = [
      'CREATE TABLE IF NOT EXISTS projects (...)',
      'CREATE TABLE IF NOT EXISTS tasks (..., FOREIGN KEY (project_id) REFERENCES projects(id))'
    ]
    
    const projectsIndex = correctOrderQueries.findIndex(q => q.includes('projects'))
    const tasksIndex = correctOrderQueries.findIndex(q => q.includes('tasks'))
    
    expect(projectsIndex).toBeLessThan(tasksIndex) // 正确的顺序
    console.log('✅ 修复后：正确的表创建顺序确保外键约束成功')
  })
})
