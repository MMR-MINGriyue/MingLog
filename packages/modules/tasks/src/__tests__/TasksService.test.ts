/**
 * TasksService 单元测试
 * 测试任务管理服务的核心功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TasksService } from '../services/TasksService'
import { TaskStatus, TaskPriority, CreateTaskRequest } from '../types'

// 模拟核心API
const mockCoreAPI = {
  database: {
    execute: vi.fn(),
    query: vi.fn()
  },
  events: {
    emit: vi.fn()
  }
}

describe('TasksService', () => {
  let tasksService: TasksService

  beforeEach(() => {
    vi.clearAllMocks()
    tasksService = new TasksService(mockCoreAPI)
  })

  describe('基础导入测试', () => {
    it('应该能够导入TaskStatus枚举', () => {
      expect(TaskStatus.TODO).toBe('todo')
      expect(TaskStatus.IN_PROGRESS).toBe('in-progress')
      expect(TaskStatus.DONE).toBe('done')
      expect(TaskStatus.CANCELLED).toBe('cancelled')
    })

    it('应该能够导入TaskPriority枚举', () => {
      expect(TaskPriority.LOW).toBe('low')
      expect(TaskPriority.MEDIUM).toBe('medium')
      expect(TaskPriority.HIGH).toBe('high')
      expect(TaskPriority.URGENT).toBe('urgent')
    })

    it('应该能够创建TasksService实例', () => {
      expect(tasksService).toBeDefined()
      expect(tasksService).toBeInstanceOf(TasksService)
    })
  })

  describe('createTask', () => {
    it('应该成功创建任务', async () => {
      const createRequest: CreateTaskRequest = {
        title: '测试任务',
        description: '这是一个测试任务',
        priority: TaskPriority.HIGH,
        tags: ['测试', '重要'],
        contexts: ['@电脑']
      }

      mockCoreAPI.database.execute.mockResolvedValue({ changes: 1 })

      const task = await tasksService.createTask(createRequest)

      expect(task).toBeDefined()
      expect(task.title).toBe(createRequest.title)
      expect(task.description).toBe(createRequest.description)
      expect(task.priority).toBe(createRequest.priority)
      expect(task.status).toBe(TaskStatus.TODO)
      expect(task.tags).toEqual(createRequest.tags)
      expect(task.contexts).toEqual(createRequest.contexts)
      expect(task.id).toBeDefined()
      expect(task.createdAt).toBeInstanceOf(Date)
      expect(task.updatedAt).toBeInstanceOf(Date)

      // 验证数据库调用
      expect(mockCoreAPI.database.execute).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO tasks'),
        expect.arrayContaining([
          task.id,
          task.title,
          task.description,
          task.status,
          task.priority
        ])
      )

      // 验证事件发送
      expect(mockCoreAPI.events.emit).toHaveBeenCalledWith('task:created', { task })
    })

    it('应该处理最小化的任务创建请求', async () => {
      const createRequest: CreateTaskRequest = {
        title: '简单任务'
      }

      mockCoreAPI.database.execute.mockResolvedValue({ changes: 1 })

      const task = await tasksService.createTask(createRequest)

      expect(task.title).toBe(createRequest.title)
      expect(task.description).toBeUndefined()
      expect(task.priority).toBe(TaskPriority.MEDIUM) // 默认优先级
      expect(task.status).toBe(TaskStatus.TODO) // 默认状态
      expect(task.tags).toEqual([])
      expect(task.contexts).toEqual([])
      expect(task.linkedNotes).toEqual([])
      expect(task.linkedFiles).toEqual([])
    })
  })
    expect(typeof TasksModule).toBe('function')
  })

  it('应该能够导入所有类型定义', () => {
    const types = require('../types')
    expect(types.TaskStatus).toBeDefined()
    expect(types.TaskPriority).toBeDefined()
    // GTDContext是一个类型，不是值，所以不能直接检查
  })
})
