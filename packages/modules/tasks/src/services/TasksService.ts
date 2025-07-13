/**
 * 任务管理服务
 * 处理任务的CRUD操作和业务逻辑
 */

import {
  Task,
  TaskStatus,
  TaskPriority,
  TaskRecurrence,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskFilter,
  TaskSortOptions,
  TaskStats,
  TimeEntry,
  CreateTimeEntryRequest,
  UpdateTimeEntryRequest,
  GTDContext,
  CreateGTDContextRequest,
  TaskTemplate,
  CreateTaskTemplateRequest
} from '../types'

export interface ITasksService {
  // 任务CRUD操作
  createTask(request: CreateTaskRequest): Promise<Task>
  getTask(id: string): Promise<Task | null>
  updateTask(id: string, request: UpdateTaskRequest): Promise<Task>
  deleteTask(id: string): Promise<boolean>
  
  // 任务查询
  getTasks(filter?: TaskFilter, sort?: TaskSortOptions, limit?: number, offset?: number): Promise<Task[]>
  getTasksByProject(projectId: string): Promise<Task[]>
  getTasksByStatus(status: TaskStatus): Promise<Task[]>
  getTasksByPriority(priority: TaskPriority): Promise<Task[]>
  getSubTasks(parentTaskId: string): Promise<Task[]>
  
  // 任务状态管理
  markTaskCompleted(id: string): Promise<Task>
  markTaskInProgress(id: string): Promise<Task>
  markTaskCancelled(id: string): Promise<Task>
  
  // 任务关联
  linkTaskToNote(taskId: string, noteId: string): Promise<void>
  unlinkTaskFromNote(taskId: string, noteId: string): Promise<void>
  linkTaskToFile(taskId: string, fileId: string): Promise<void>
  unlinkTaskFromFile(taskId: string, fileId: string): Promise<void>
  
  // 任务统计
  getTaskStats(filter?: TaskFilter): Promise<TaskStats>
  getOverdueTasks(): Promise<Task[]>
  getTasksDueToday(): Promise<Task[]>
  getTasksDueThisWeek(): Promise<Task[]>
  
  // 时间跟踪
  createTimeEntry(request: CreateTimeEntryRequest): Promise<TimeEntry>
  updateTimeEntry(id: string, request: UpdateTimeEntryRequest): Promise<TimeEntry>
  deleteTimeEntry(id: string): Promise<boolean>
  getTimeEntries(taskId: string): Promise<TimeEntry[]>
  startTimeTracking(taskId: string): Promise<TimeEntry>
  stopTimeTracking(entryId: string): Promise<TimeEntry>
  
  // GTD上下文管理
  createContext(request: CreateGTDContextRequest): Promise<GTDContext>
  getContexts(): Promise<GTDContext[]>
  updateContext(id: string, request: Partial<CreateGTDContextRequest>): Promise<GTDContext>
  deleteContext(id: string): Promise<boolean>
  
  // 任务模板
  createTaskTemplate(request: CreateTaskTemplateRequest): Promise<TaskTemplate>
  getTaskTemplates(): Promise<TaskTemplate[]>
  createTaskFromTemplate(templateId: string, overrides?: Partial<CreateTaskRequest>): Promise<Task>
  
  // 搜索
  searchTasks(query: string, filter?: TaskFilter): Promise<Task[]>
}

export class TasksService implements ITasksService {
  private coreAPI: any // 将在模块初始化时注入

  constructor(coreAPI?: any) {
    this.coreAPI = coreAPI
  }

  // 任务CRUD操作
  async createTask(request: CreateTaskRequest): Promise<Task> {
    const now = new Date()
    const task: Task = {
      id: this.generateId(),
      title: request.title,
      description: request.description,
      status: TaskStatus.TODO,
      priority: request.priority || TaskPriority.MEDIUM,
      dueDate: request.dueDate,
      estimatedTime: request.estimatedTime,
      projectId: request.projectId,
      parentTaskId: request.parentTaskId,
      linkedNotes: request.linkedNotes || [],
      linkedFiles: request.linkedFiles || [],
      tags: request.tags || [],
      contexts: request.contexts || [],
      recurrence: request.recurrence,
      createdAt: now,
      updatedAt: now
    }

    // 通过Tauri API保存到数据库
    if (this.coreAPI?.database) {
      await this.coreAPI.database.execute(
        `INSERT INTO tasks (
          id, title, description, status, priority, due_date, estimated_time,
          project_id, parent_task_id, linked_notes, linked_files, tags, contexts,
          recurrence, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          task.id, task.title, task.description, task.status, task.priority,
          task.dueDate?.toISOString(), task.estimatedTime, task.projectId,
          task.parentTaskId, JSON.stringify(task.linkedNotes), 
          JSON.stringify(task.linkedFiles), JSON.stringify(task.tags),
          JSON.stringify(task.contexts), JSON.stringify(task.recurrence),
          task.createdAt.toISOString(), task.updatedAt.toISOString()
        ]
      )
    }

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('task:created', { task })
    }

    return task
  }

  async getTask(id: string): Promise<Task | null> {
    if (!this.coreAPI?.database) {
      throw new Error('Database not available')
    }

    const result = await this.coreAPI.database.query(
      'SELECT * FROM tasks WHERE id = ?',
      [id]
    )

    if (result.length === 0) {
      return null
    }

    return this.mapRowToTask(result[0])
  }

  async updateTask(id: string, request: UpdateTaskRequest): Promise<Task> {
    const existingTask = await this.getTask(id)
    if (!existingTask) {
      throw new Error(`Task with id ${id} not found`)
    }

    const updatedTask: Task = {
      ...existingTask,
      ...request,
      updatedAt: new Date()
    }

    if (this.coreAPI?.database) {
      await this.coreAPI.database.execute(
        `UPDATE tasks SET 
          title = ?, description = ?, status = ?, priority = ?, due_date = ?,
          estimated_time = ?, actual_time = ?, project_id = ?, parent_task_id = ?,
          linked_notes = ?, linked_files = ?, tags = ?, contexts = ?,
          recurrence = ?, updated_at = ?
        WHERE id = ?`,
        [
          updatedTask.title, updatedTask.description, updatedTask.status,
          updatedTask.priority, updatedTask.dueDate?.toISOString(),
          updatedTask.estimatedTime, updatedTask.actualTime, updatedTask.projectId,
          updatedTask.parentTaskId, JSON.stringify(updatedTask.linkedNotes),
          JSON.stringify(updatedTask.linkedFiles), JSON.stringify(updatedTask.tags),
          JSON.stringify(updatedTask.contexts), JSON.stringify(updatedTask.recurrence),
          updatedTask.updatedAt.toISOString(), id
        ]
      )
    }

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('task:updated', { task: updatedTask, previousTask: existingTask })
    }

    return updatedTask
  }

  async deleteTask(id: string): Promise<boolean> {
    const task = await this.getTask(id)
    if (!task) {
      return false
    }

    if (this.coreAPI?.database) {
      await this.coreAPI.database.execute('DELETE FROM tasks WHERE id = ?', [id])
    }

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('task:deleted', { task })
    }

    return true
  }

  async getTasks(filter?: TaskFilter, sort?: TaskSortOptions, limit?: number, offset?: number): Promise<Task[]> {
    if (!this.coreAPI?.database) {
      return []
    }

    let query = 'SELECT * FROM tasks WHERE 1=1'
    const params: any[] = []

    // 应用过滤器
    if (filter) {
      if (filter.status && filter.status.length > 0) {
        query += ` AND status IN (${filter.status.map(() => '?').join(',')})`
        params.push(...filter.status)
      }
      if (filter.priority && filter.priority.length > 0) {
        query += ` AND priority IN (${filter.priority.map(() => '?').join(',')})`
        params.push(...filter.priority)
      }
      if (filter.priorities && filter.priorities.length > 0) {
        query += ` AND priority IN (${filter.priorities.map(() => '?').join(',')})`
        params.push(...filter.priorities)
      }
      if (filter.projectId) {
        query += ' AND project_id = ?'
        params.push(filter.projectId)
      }
      if (filter.parentTaskId) {
        query += ' AND parent_task_id = ?'
        params.push(filter.parentTaskId)
      }
      if (filter.tags && filter.tags.length > 0) {
        // 使用JSON查询来匹配标签
        const tagConditions = filter.tags.map(() => 'JSON_EXTRACT(tags, "$") LIKE ?').join(' OR ')
        query += ` AND (${tagConditions})`
        params.push(...filter.tags.map(tag => `%"${tag}"%`))
      }
      if (filter.contexts && filter.contexts.length > 0) {
        // 使用JSON查询来匹配上下文
        const contextConditions = filter.contexts.map(() => 'JSON_EXTRACT(contexts, "$") LIKE ?').join(' OR ')
        query += ` AND (${contextConditions})`
        params.push(...filter.contexts.map(context => `%"${context}"%`))
      }
      if (filter.dueAfter) {
        query += ' AND due_date > ?'
        params.push(filter.dueAfter.toISOString())
      }
      if (filter.dueBefore) {
        query += ' AND due_date < ?'
        params.push(filter.dueBefore.toISOString())
      }
      if (filter.dueDateFrom) {
        query += ' AND due_date >= ?'
        params.push(filter.dueDateFrom.toISOString())
      }
      if (filter.dueDateTo) {
        query += ' AND due_date <= ?'
        params.push(filter.dueDateTo.toISOString())
      }
      if (filter.hasLinkedNotes !== undefined) {
        if (filter.hasLinkedNotes) {
          query += ' AND JSON_ARRAY_LENGTH(linked_notes) > 0'
        } else {
          query += ' AND JSON_ARRAY_LENGTH(linked_notes) = 0'
        }
      }
      if (filter.hasLinkedFiles !== undefined) {
        if (filter.hasLinkedFiles) {
          query += ' AND JSON_ARRAY_LENGTH(linked_files) > 0'
        } else {
          query += ' AND JSON_ARRAY_LENGTH(linked_files) = 0'
        }
      }
      if (filter.hasRecurrence !== undefined) {
        if (filter.hasRecurrence) {
          query += ' AND recurrence IS NOT NULL'
        } else {
          query += ' AND recurrence IS NULL'
        }
      }
      if (filter.search) {
        query += ' AND (title LIKE ? OR description LIKE ?)'
        params.push(`%${filter.search}%`, `%${filter.search}%`)
      }
    }

    // 应用排序
    if (sort) {
      query += ` ORDER BY ${sort.field} ${sort.direction.toUpperCase()}`
    } else {
      query += ' ORDER BY created_at DESC'
    }

    // 应用分页
    if (limit) {
      query += ' LIMIT ?'
      params.push(limit)
      if (offset) {
        query += ' OFFSET ?'
        params.push(offset)
      }
    }

    const results = await this.coreAPI.database.query(query, params)
    return results.map((row: any) => this.mapRowToTask(row))
  }

  // 任务状态管理
  async markTaskCompleted(id: string): Promise<Task> {
    const task = await this.updateTask(id, {
      status: TaskStatus.DONE,
      completedAt: new Date()
    })

    // 发送任务完成事件
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('task:completed', { task })
    }

    // 如果是重复任务，创建下一个实例
    if (task.recurrence) {
      await this.createRecurringTaskInstance(task)
    }

    return task
  }

  async markTaskInProgress(id: string): Promise<Task> {
    const task = await this.updateTask(id, {
      status: TaskStatus.IN_PROGRESS
    })

    // 发送任务开始事件
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('task:started', { task })
    }

    return task
  }

  async markTaskCancelled(id: string): Promise<Task> {
    const task = await this.updateTask(id, {
      status: TaskStatus.CANCELLED
    })

    // 发送任务取消事件
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('task:cancelled', { task })
    }

    return task
  }

  // 优先级管理
  async updateTaskPriority(id: string, priority: TaskPriority): Promise<Task> {
    return this.updateTask(id, { priority })
  }

  async getTasksByPriorityRange(minPriority: TaskPriority, maxPriority?: TaskPriority): Promise<Task[]> {
    const priorityOrder = [TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH, TaskPriority.URGENT]
    const minIndex = priorityOrder.indexOf(minPriority)
    const maxIndex = maxPriority ? priorityOrder.indexOf(maxPriority) : priorityOrder.length - 1

    const validPriorities = priorityOrder.slice(minIndex, maxIndex + 1)
    return this.getTasks({ priorities: validPriorities })
  }

  // 截止日期管理
  async getOverdueTasks(): Promise<Task[]> {
    const now = new Date()
    return this.getTasks({
      dueBefore: now,
      status: [TaskStatus.TODO, TaskStatus.IN_PROGRESS]
    })
  }

  async getTasksDueToday(): Promise<Task[]> {
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    return this.getTasks({
      dueAfter: today,
      dueBefore: tomorrow,
      status: [TaskStatus.TODO, TaskStatus.IN_PROGRESS]
    })
  }

  async getTasksDueThisWeek(): Promise<Task[]> {
    const today = new Date()
    const nextWeek = new Date(today)
    nextWeek.setDate(nextWeek.getDate() + 7)

    return this.getTasks({
      dueAfter: today,
      dueBefore: nextWeek,
      status: [TaskStatus.TODO, TaskStatus.IN_PROGRESS]
    })
  }

  // 标签管理
  async addTagToTask(taskId: string, tag: string): Promise<Task> {
    const task = await this.getTask(taskId)
    if (!task) {
      throw new Error(`Task ${taskId} not found`)
    }

    if (!task.tags.includes(tag)) {
      task.tags.push(tag)
      return this.updateTask(taskId, { tags: task.tags })
    }

    return task
  }

  async removeTagFromTask(taskId: string, tag: string): Promise<Task> {
    const task = await this.getTask(taskId)
    if (!task) {
      throw new Error(`Task ${taskId} not found`)
    }

    const updatedTags = task.tags.filter(t => t !== tag)
    return this.updateTask(taskId, { tags: updatedTags })
  }

  async getAllTags(): Promise<string[]> {
    const query = `
      SELECT DISTINCT json_each.value as tag
      FROM tasks, json_each(tasks.tags)
      WHERE json_each.value IS NOT NULL
      ORDER BY tag
    `

    if (this.coreAPI?.database) {
      const results = await this.coreAPI.database.query(query)
      return results.map((row: any) => row.tag)
    }

    return []
  }

  async getTasksByTag(tag: string): Promise<Task[]> {
    return this.getTasks({ tags: [tag] })
  }

  async getTagUsageStats(): Promise<Array<{ tag: string; count: number }>> {
    const query = `
      SELECT json_each.value as tag, COUNT(*) as count
      FROM tasks, json_each(tasks.tags)
      WHERE json_each.value IS NOT NULL
      GROUP BY json_each.value
      ORDER BY count DESC, tag
    `

    if (this.coreAPI?.database) {
      const results = await this.coreAPI.database.query(query)
      return results.map((row: any) => ({ tag: row.tag, count: row.count }))
    }

    return []
  }

  // 重复任务管理
  async createRecurringTaskInstance(originalTask: Task): Promise<Task | null> {
    if (!originalTask.recurrence) {
      return null
    }

    const nextDueDate = this.calculateNextDueDate(originalTask.dueDate, originalTask.recurrence)
    if (!nextDueDate) {
      return null
    }

    // 创建新的任务实例
    const newTask = await this.createTask({
      title: originalTask.title,
      description: originalTask.description,
      priority: originalTask.priority,
      dueDate: nextDueDate,
      estimatedTime: originalTask.estimatedTime,
      projectId: originalTask.projectId,
      tags: [...originalTask.tags],
      contexts: [...originalTask.contexts],
      recurrence: originalTask.recurrence
    })

    // 发送重复任务创建事件
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('task:recurring-created', {
        originalTask,
        newTask
      })
    }

    return newTask
  }

  private calculateNextDueDate(currentDueDate: Date | undefined, recurrence: TaskRecurrence): Date | null {
    if (!currentDueDate) {
      return null
    }

    const nextDate = new Date(currentDueDate)

    switch (recurrence.type) {
      case 'daily':
        nextDate.setDate(nextDate.getDate() + (recurrence.interval || 1))
        break
      case 'weekly':
        nextDate.setDate(nextDate.getDate() + 7 * (recurrence.interval || 1))
        break
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + (recurrence.interval || 1))
        break
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + (recurrence.interval || 1))
        break
      default:
        return null
    }

    // 检查结束日期
    if (recurrence.endDate && nextDate > recurrence.endDate) {
      return null
    }

    return nextDate
  }

  // 工具方法
  private generateId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private mapRowToTask(row: any): Task {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status as TaskStatus,
      priority: row.priority as TaskPriority,
      dueDate: row.due_date ? new Date(row.due_date) : undefined,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      estimatedTime: row.estimated_time,
      actualTime: row.actual_time,
      projectId: row.project_id,
      parentTaskId: row.parent_task_id,
      linkedNotes: JSON.parse(row.linked_notes || '[]'),
      linkedFiles: JSON.parse(row.linked_files || '[]'),
      tags: JSON.parse(row.tags || '[]'),
      contexts: JSON.parse(row.contexts || '[]'),
      recurrence: row.recurrence ? JSON.parse(row.recurrence) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      createdBy: row.created_by
    }
  }

  // 占位符实现 - 后续完善
  async getTasksByProject(projectId: string): Promise<Task[]> {
    return this.getTasks({ projectId })
  }

  async getTasksByStatus(status: TaskStatus): Promise<Task[]> {
    return this.getTasks({ status: [status] })
  }

  async getTasksByPriority(priority: TaskPriority): Promise<Task[]> {
    return this.getTasks({ priority: [priority] })
  }

  async getSubTasks(parentTaskId: string): Promise<Task[]> {
    if (!this.coreAPI?.database) {
      return []
    }

    const results = await this.coreAPI.database.query(
      'SELECT * FROM tasks WHERE parent_task_id = ? ORDER BY created_at ASC',
      [parentTaskId]
    )

    return results.map((row: any) => this.mapRowToTask(row))
  }

  async linkTaskToNote(taskId: string, noteId: string): Promise<void> {
    const task = await this.getTask(taskId)
    if (!task) {
      throw new Error(`Task with id ${taskId} not found`)
    }

    const linkedNotes = [...task.linkedNotes]
    if (!linkedNotes.includes(noteId)) {
      linkedNotes.push(noteId)
      await this.updateTask(taskId, { linkedNotes })

      // 发送事件通知
      if (this.coreAPI?.events) {
        this.coreAPI.events.emit('task:linked-to-note', { taskId, noteId })
      }
    }
  }

  async unlinkTaskFromNote(taskId: string, noteId: string): Promise<void> {
    const task = await this.getTask(taskId)
    if (!task) {
      throw new Error(`Task with id ${taskId} not found`)
    }

    const linkedNotes = task.linkedNotes.filter(id => id !== noteId)
    await this.updateTask(taskId, { linkedNotes })

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('task:unlinked-from-note', { taskId, noteId })
    }
  }

  async linkTaskToFile(taskId: string, fileId: string): Promise<void> {
    const task = await this.getTask(taskId)
    if (!task) {
      throw new Error(`Task with id ${taskId} not found`)
    }

    const linkedFiles = [...task.linkedFiles]
    if (!linkedFiles.includes(fileId)) {
      linkedFiles.push(fileId)
      await this.updateTask(taskId, { linkedFiles })

      // 发送事件通知
      if (this.coreAPI?.events) {
        this.coreAPI.events.emit('task:linked-to-file', { taskId, fileId })
      }
    }
  }

  async unlinkTaskFromFile(taskId: string, fileId: string): Promise<void> {
    const task = await this.getTask(taskId)
    if (!task) {
      throw new Error(`Task with id ${taskId} not found`)
    }

    const linkedFiles = task.linkedFiles.filter(id => id !== fileId)
    await this.updateTask(taskId, { linkedFiles })

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('task:unlinked-from-file', { taskId, fileId })
    }
  }

  async getTaskStats(filter?: TaskFilter): Promise<TaskStats> {
    if (!this.coreAPI?.database) {
      return {
        total: 0,
        byStatus: {} as Record<TaskStatus, number>,
        byPriority: {} as Record<TaskPriority, number>,
        overdue: 0,
        dueToday: 0,
        dueThisWeek: 0,
        completed: 0,
        completionRate: 0
      }
    }

    // 构建基础查询条件
    let whereClause = 'WHERE 1=1'
    const params: any[] = []

    if (filter) {
      if (filter.status && filter.status.length > 0) {
        whereClause += ` AND status IN (${filter.status.map(() => '?').join(',')})`
        params.push(...filter.status)
      }
      if (filter.projectId) {
        whereClause += ' AND project_id = ?'
        params.push(filter.projectId)
      }
    }

    // 获取总数和状态统计
    const statusStats = await this.coreAPI.database.query(
      `SELECT status, COUNT(*) as count FROM tasks ${whereClause} GROUP BY status`,
      params
    )

    // 获取优先级统计
    const priorityStats = await this.coreAPI.database.query(
      `SELECT priority, COUNT(*) as count FROM tasks ${whereClause} GROUP BY priority`,
      params
    )

    // 获取总数
    const totalResult = await this.coreAPI.database.query(
      `SELECT COUNT(*) as total FROM tasks ${whereClause}`,
      params
    )

    const total = totalResult[0]?.total || 0

    // 构建统计结果
    const byStatus: Record<TaskStatus, number> = {} as Record<TaskStatus, number>
    const byPriority: Record<TaskPriority, number> = {} as Record<TaskPriority, number>

    statusStats.forEach((row: any) => {
      byStatus[row.status as TaskStatus] = row.count
    })

    priorityStats.forEach((row: any) => {
      byPriority[row.priority as TaskPriority] = row.count
    })

    const completed = byStatus[TaskStatus.DONE] || 0
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    // 获取过期、今日、本周任务数量
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay())
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)

    const overdueResult = await this.coreAPI.database.query(
      `SELECT COUNT(*) as count FROM tasks ${whereClause} AND due_date < ? AND status NOT IN ('done', 'cancelled')`,
      [...params, now.toISOString()]
    )

    const todayResult = await this.coreAPI.database.query(
      `SELECT COUNT(*) as count FROM tasks ${whereClause} AND DATE(due_date) = DATE(?) AND status NOT IN ('done', 'cancelled')`,
      [...params, today.toISOString()]
    )

    const weekResult = await this.coreAPI.database.query(
      `SELECT COUNT(*) as count FROM tasks ${whereClause} AND due_date BETWEEN ? AND ? AND status NOT IN ('done', 'cancelled')`,
      [...params, weekStart.toISOString(), weekEnd.toISOString()]
    )

    return {
      total,
      byStatus,
      byPriority,
      overdue: overdueResult[0]?.count || 0,
      dueToday: todayResult[0]?.count || 0,
      dueThisWeek: weekResult[0]?.count || 0,
      completed,
      completionRate
    }
  }

  // 时间跟踪相关方法
  async createTimeEntry(request: CreateTimeEntryRequest): Promise<TimeEntry> {
    if (!this.coreAPI?.database) {
      throw new Error('Database not available')
    }

    const timeEntry: TimeEntry = {
      id: this.generateId().replace('task_', 'time_'),
      taskId: request.taskId,
      startTime: request.startTime,
      endTime: request.endTime,
      duration: request.endTime ?
        Math.floor((request.endTime.getTime() - request.startTime.getTime()) / 1000) :
        undefined,
      description: request.description,
      createdAt: new Date()
    }

    await this.coreAPI.database.execute(
      `INSERT INTO task_time_entries (
        id, task_id, start_time, end_time, duration, description, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        timeEntry.id,
        timeEntry.taskId,
        timeEntry.startTime.toISOString(),
        timeEntry.endTime?.toISOString(),
        timeEntry.duration,
        timeEntry.description,
        timeEntry.createdAt.toISOString()
      ]
    )

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('time-entry:created', { timeEntry })
    }

    return timeEntry
  }

  async updateTimeEntry(id: string, request: UpdateTimeEntryRequest): Promise<TimeEntry> {
    if (!this.coreAPI?.database) {
      throw new Error('Database not available')
    }

    const existing = await this.getTimeEntry(id)
    if (!existing) {
      throw new Error(`Time entry with id ${id} not found`)
    }

    const endTime = request.endTime || existing.endTime
    const duration = endTime ?
      Math.floor((endTime.getTime() - existing.startTime.getTime()) / 1000) :
      existing.duration

    await this.coreAPI.database.execute(
      'UPDATE task_time_entries SET end_time = ?, duration = ?, description = ? WHERE id = ?',
      [endTime?.toISOString(), duration, request.description || existing.description, id]
    )

    return this.getTimeEntry(id)
  }

  async deleteTimeEntry(id: string): Promise<boolean> {
    if (!this.coreAPI?.database) {
      return false
    }

    const result = await this.coreAPI.database.execute(
      'DELETE FROM task_time_entries WHERE id = ?',
      [id]
    )

    return result.rowsAffected > 0
  }

  async getTimeEntries(taskId: string): Promise<TimeEntry[]> {
    if (!this.coreAPI?.database) {
      return []
    }

    const results = await this.coreAPI.database.query(
      'SELECT * FROM task_time_entries WHERE task_id = ? ORDER BY start_time DESC',
      [taskId]
    )

    return results.map((row: any) => ({
      id: row.id,
      taskId: row.task_id,
      startTime: new Date(row.start_time),
      endTime: row.end_time ? new Date(row.end_time) : undefined,
      duration: row.duration,
      description: row.description,
      createdAt: new Date(row.created_at)
    }))
  }

  async startTimeTracking(taskId: string): Promise<TimeEntry> {
    const request: CreateTimeEntryRequest = {
      taskId,
      startTime: new Date(),
      description: 'Time tracking session'
    }

    const timeEntry = await this.createTimeEntry(request)

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('time-tracking:started', { taskId, timeEntryId: timeEntry.id })
    }

    return timeEntry
  }

  async stopTimeTracking(entryId: string): Promise<TimeEntry> {
    const request: UpdateTimeEntryRequest = {
      endTime: new Date()
    }

    const timeEntry = await this.updateTimeEntry(entryId, request)

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('time-tracking:stopped', { timeEntryId: entryId, timeEntry })
    }

    return timeEntry
  }

  private async getTimeEntry(id: string): Promise<TimeEntry> {
    if (!this.coreAPI?.database) {
      throw new Error('Database not available')
    }

    const result = await this.coreAPI.database.query(
      'SELECT * FROM task_time_entries WHERE id = ?',
      [id]
    )

    if (result.length === 0) {
      throw new Error(`Time entry with id ${id} not found`)
    }

    const row = result[0]
    return {
      id: row.id,
      taskId: row.task_id,
      startTime: new Date(row.start_time),
      endTime: row.end_time ? new Date(row.end_time) : undefined,
      duration: row.duration,
      description: row.description,
      createdAt: new Date(row.created_at)
    }
  }

  // GTD上下文管理
  async createContext(request: CreateGTDContextRequest): Promise<GTDContext> {
    const context: GTDContext = {
      id: this.generateId().replace('task_', 'context_'),
      name: request.name,
      description: request.description,
      icon: request.icon,
      color: request.color,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // 存储在内存中或数据库中（这里简化为内存存储）
    // 在实际实现中，可以创建一个contexts表
    if (!this.contexts) {
      this.contexts = []
    }
    this.contexts.push(context)

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('gtd-context:created', { context })
    }

    return context
  }

  async getContexts(): Promise<GTDContext[]> {
    // 返回默认的GTD上下文
    if (!this.contexts) {
      this.contexts = [
        {
          id: 'context_home',
          name: '@家里',
          description: '在家里可以完成的任务',
          icon: '🏠',
          color: '#4CAF50',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'context_office',
          name: '@办公室',
          description: '在办公室可以完成的任务',
          icon: '🏢',
          color: '#2196F3',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'context_computer',
          name: '@电脑',
          description: '需要使用电脑完成的任务',
          icon: '💻',
          color: '#FF9800',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'context_phone',
          name: '@电话',
          description: '需要打电话完成的任务',
          icon: '📞',
          color: '#9C27B0',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'context_errands',
          name: '@外出',
          description: '需要外出完成的任务',
          icon: '🚗',
          color: '#F44336',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]
    }
    return this.contexts
  }

  async updateContext(id: string, request: Partial<CreateGTDContextRequest>): Promise<GTDContext> {
    const contexts = await this.getContexts()
    const contextIndex = contexts.findIndex(c => c.id === id)

    if (contextIndex === -1) {
      throw new Error(`Context with id ${id} not found`)
    }

    const updatedContext = {
      ...contexts[contextIndex],
      ...request,
      updatedAt: new Date()
    }

    if (this.contexts) {
      this.contexts[contextIndex] = updatedContext
    }

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('gtd-context:updated', { context: updatedContext })
    }

    return updatedContext
  }

  async deleteContext(id: string): Promise<boolean> {
    if (!this.contexts) {
      return false
    }

    const initialLength = this.contexts.length
    this.contexts = this.contexts.filter(c => c.id !== id)

    const deleted = this.contexts.length < initialLength

    if (deleted && this.coreAPI?.events) {
      this.coreAPI.events.emit('gtd-context:deleted', { contextId: id })
    }

    return deleted
  }

  // 任务模板
  async createTaskTemplate(request: CreateTaskTemplateRequest): Promise<TaskTemplate> {
    const template: TaskTemplate = {
      id: this.generateId().replace('task_', 'template_'),
      name: request.name,
      description: request.description,
      defaultTitle: request.defaultTitle,
      defaultDescription: request.defaultDescription,
      defaultPriority: request.defaultPriority || TaskPriority.MEDIUM,
      defaultEstimatedTime: request.defaultEstimatedTime,
      defaultTags: request.defaultTags || [],
      defaultContexts: request.defaultContexts || [],
      checklist: request.checklist || [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // 存储在内存中（实际实现中应该存储在数据库）
    if (!this.templates) {
      this.templates = []
    }
    this.templates.push(template)

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('task-template:created', { template })
    }

    return template
  }

  async getTaskTemplates(): Promise<TaskTemplate[]> {
    if (!this.templates) {
      this.templates = []
    }
    return this.templates
  }

  async createTaskFromTemplate(templateId: string, overrides?: Partial<CreateTaskRequest>): Promise<Task> {
    const templates = await this.getTaskTemplates()
    const template = templates.find(t => t.id === templateId)

    if (!template) {
      throw new Error(`Template with id ${templateId} not found`)
    }

    const request: CreateTaskRequest = {
      title: overrides?.title || template.defaultTitle,
      description: overrides?.description || template.defaultDescription,
      priority: overrides?.priority || template.defaultPriority,
      estimatedTime: overrides?.estimatedTime || template.defaultEstimatedTime,
      tags: overrides?.tags || template.defaultTags,
      contexts: overrides?.contexts || template.defaultContexts,
      ...overrides
    }

    const task = await this.createTask(request)

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('task:created-from-template', { task, templateId })
    }

    return task
  }

  // 私有属性用于存储上下文和模板（实际实现中应该使用数据库）
  private contexts?: GTDContext[]
  private templates?: TaskTemplate[]

  async searchTasks(query: string, filter?: TaskFilter): Promise<Task[]> {
    return this.getTasks({ ...filter, search: query })
  }
}
