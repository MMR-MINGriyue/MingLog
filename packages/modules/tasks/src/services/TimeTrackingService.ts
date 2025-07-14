/**
 * 时间跟踪服务
 * 提供任务时间记录、统计分析功能
 */

import { TimeEntry, TimeTrackingStats, CreateTimeEntryRequest, TimeEntryStatus } from '../types'

export interface ITimeTrackingService {
  // 时间记录
  startTimer(taskId: string): Promise<TimeEntry>
  stopTimer(entryId: string): Promise<TimeEntry>
  pauseTimer(entryId: string): Promise<TimeEntry>
  resumeTimer(entryId: string): Promise<TimeEntry>
  
  // 手动记录
  createTimeEntry(request: CreateTimeEntryRequest): Promise<TimeEntry>
  updateTimeEntry(id: string, updates: Partial<TimeEntry>): Promise<TimeEntry>
  deleteTimeEntry(id: string): Promise<void>
  
  // 查询
  getTimeEntries(taskId?: string, startDate?: Date, endDate?: Date): Promise<TimeEntry[]>
  getActiveTimer(): Promise<TimeEntry | null>
  
  // 统计
  getTimeStats(taskId?: string, projectId?: string, period?: 'day' | 'week' | 'month'): Promise<TimeTrackingStats>
}

export class TimeTrackingService implements ITimeTrackingService {
  private coreAPI: any
  private activeTimer: TimeEntry | null = null

  constructor(coreAPI?: any) {
    this.coreAPI = coreAPI
  }

  async startTimer(taskId: string): Promise<TimeEntry> {
    // 停止当前活动的计时器
    if (this.activeTimer) {
      await this.stopTimer(this.activeTimer.id)
    }

    const now = new Date()
    const timeEntry: TimeEntry = {
      id: this.generateId(),
      taskId,
      startTime: now,
      endTime: null,
      duration: 0,
      status: TimeEntryStatus.ACTIVE,
      description: '',
      createdAt: now,
      updatedAt: now
    }

    // 保存到数据库
    if (this.coreAPI?.database) {
      await this.coreAPI.database.execute(
        `INSERT INTO task_time_entries (
          id, task_id, start_time, end_time, duration, status, description, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          timeEntry.id, timeEntry.taskId, timeEntry.startTime.toISOString(),
          null, timeEntry.duration, timeEntry.status, timeEntry.description,
          timeEntry.createdAt.toISOString(), timeEntry.updatedAt.toISOString()
        ]
      )
    }

    this.activeTimer = timeEntry

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('time-tracking:timer-started', { timeEntry })
    }

    return timeEntry
  }

  async stopTimer(entryId: string): Promise<TimeEntry> {
    const timeEntry = await this.getTimeEntry(entryId)
    if (!timeEntry) {
      throw new Error(`Time entry ${entryId} not found`)
    }

    if (timeEntry.status !== TimeEntryStatus.ACTIVE) {
      throw new Error('Timer is not active')
    }

    const now = new Date()
    const duration = Math.floor((now.getTime() - timeEntry.startTime.getTime()) / 1000)

    const updatedEntry: TimeEntry = {
      ...timeEntry,
      endTime: now,
      duration,
      status: TimeEntryStatus.COMPLETED,
      updatedAt: now
    }

    // 更新数据库
    if (this.coreAPI?.database) {
      await this.coreAPI.database.execute(
        `UPDATE task_time_entries SET 
          end_time = ?, duration = ?, status = ?, updated_at = ?
        WHERE id = ?`,
        [now.toISOString(), duration, TimeEntryStatus.COMPLETED, now.toISOString(), entryId]
      )
    }

    if (this.activeTimer?.id === entryId) {
      this.activeTimer = null
    }

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('time-tracking:timer-stopped', { timeEntry: updatedEntry })
    }

    return updatedEntry
  }

  async pauseTimer(entryId: string): Promise<TimeEntry> {
    const timeEntry = await this.getTimeEntry(entryId)
    if (!timeEntry) {
      throw new Error(`Time entry ${entryId} not found`)
    }

    if (timeEntry.status !== TimeEntryStatus.ACTIVE) {
      throw new Error('Timer is not active')
    }

    const now = new Date()
    const currentDuration = Math.floor((now.getTime() - timeEntry.startTime.getTime()) / 1000)

    const updatedEntry: TimeEntry = {
      ...timeEntry,
      duration: timeEntry.duration + currentDuration,
      status: TimeEntryStatus.PAUSED,
      updatedAt: now
    }

    // 更新数据库
    if (this.coreAPI?.database) {
      await this.coreAPI.database.execute(
        `UPDATE task_time_entries SET 
          duration = ?, status = ?, updated_at = ?
        WHERE id = ?`,
        [updatedEntry.duration, TimeEntryStatus.PAUSED, now.toISOString(), entryId]
      )
    }

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('time-tracking:timer-paused', { timeEntry: updatedEntry })
    }

    return updatedEntry
  }

  async resumeTimer(entryId: string): Promise<TimeEntry> {
    const timeEntry = await this.getTimeEntry(entryId)
    if (!timeEntry) {
      throw new Error(`Time entry ${entryId} not found`)
    }

    if (timeEntry.status !== TimeEntryStatus.PAUSED) {
      throw new Error('Timer is not paused')
    }

    // 停止其他活动的计时器
    if (this.activeTimer) {
      await this.stopTimer(this.activeTimer.id)
    }

    const now = new Date()
    const updatedEntry: TimeEntry = {
      ...timeEntry,
      startTime: now, // 重新设置开始时间
      status: TimeEntryStatus.ACTIVE,
      updatedAt: now
    }

    // 更新数据库
    if (this.coreAPI?.database) {
      await this.coreAPI.database.execute(
        `UPDATE task_time_entries SET 
          start_time = ?, status = ?, updated_at = ?
        WHERE id = ?`,
        [now.toISOString(), TimeEntryStatus.ACTIVE, now.toISOString(), entryId]
      )
    }

    this.activeTimer = updatedEntry

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('time-tracking:timer-resumed', { timeEntry: updatedEntry })
    }

    return updatedEntry
  }

  async createTimeEntry(request: CreateTimeEntryRequest): Promise<TimeEntry> {
    const now = new Date()
    const timeEntry: TimeEntry = {
      id: this.generateId(),
      taskId: request.taskId,
      startTime: request.startTime,
      endTime: request.endTime,
      duration: request.duration || 0,
      status: request.endTime ? TimeEntryStatus.COMPLETED : TimeEntryStatus.ACTIVE,
      description: request.description || '',
      createdAt: now,
      updatedAt: now
    }

    // 计算持续时间
    if (timeEntry.endTime && timeEntry.startTime) {
      timeEntry.duration = Math.floor((timeEntry.endTime.getTime() - timeEntry.startTime.getTime()) / 1000)
    }

    // 保存到数据库
    if (this.coreAPI?.database) {
      await this.coreAPI.database.execute(
        `INSERT INTO task_time_entries (
          id, task_id, start_time, end_time, duration, status, description, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          timeEntry.id, timeEntry.taskId, timeEntry.startTime.toISOString(),
          timeEntry.endTime?.toISOString() || null, timeEntry.duration, timeEntry.status,
          timeEntry.description, timeEntry.createdAt.toISOString(), timeEntry.updatedAt.toISOString()
        ]
      )
    }

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('time-tracking:entry-created', { timeEntry })
    }

    return timeEntry
  }

  async updateTimeEntry(id: string, updates: Partial<TimeEntry>): Promise<TimeEntry> {
    const timeEntry = await this.getTimeEntry(id)
    if (!timeEntry) {
      throw new Error(`Time entry ${id} not found`)
    }

    const updatedEntry: TimeEntry = {
      ...timeEntry,
      ...updates,
      updatedAt: new Date()
    }

    // 重新计算持续时间
    if (updatedEntry.endTime && updatedEntry.startTime) {
      updatedEntry.duration = Math.floor((updatedEntry.endTime.getTime() - updatedEntry.startTime.getTime()) / 1000)
    }

    // 更新数据库
    if (this.coreAPI?.database) {
      await this.coreAPI.database.execute(
        `UPDATE task_time_entries SET 
          task_id = ?, start_time = ?, end_time = ?, duration = ?, 
          status = ?, description = ?, updated_at = ?
        WHERE id = ?`,
        [
          updatedEntry.taskId, updatedEntry.startTime.toISOString(),
          updatedEntry.endTime?.toISOString() || null, updatedEntry.duration,
          updatedEntry.status, updatedEntry.description, updatedEntry.updatedAt.toISOString(),
          id
        ]
      )
    }

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('time-tracking:entry-updated', { timeEntry: updatedEntry })
    }

    return updatedEntry
  }

  async deleteTimeEntry(id: string): Promise<void> {
    const timeEntry = await this.getTimeEntry(id)
    if (!timeEntry) {
      throw new Error(`Time entry ${id} not found`)
    }

    // 如果是活动计时器，先停止
    if (this.activeTimer?.id === id) {
      this.activeTimer = null
    }

    // 从数据库删除
    if (this.coreAPI?.database) {
      await this.coreAPI.database.execute(
        'DELETE FROM task_time_entries WHERE id = ?',
        [id]
      )
    }

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('time-tracking:entry-deleted', { timeEntryId: id })
    }
  }

  async getTimeEntries(taskId?: string, startDate?: Date, endDate?: Date): Promise<TimeEntry[]> {
    if (!this.coreAPI?.database) {
      throw new Error('Database not available')
    }

    let query = 'SELECT * FROM task_time_entries WHERE 1=1'
    const params: any[] = []

    if (taskId) {
      query += ' AND task_id = ?'
      params.push(taskId)
    }

    if (startDate) {
      query += ' AND start_time >= ?'
      params.push(startDate.toISOString())
    }

    if (endDate) {
      query += ' AND start_time <= ?'
      params.push(endDate.toISOString())
    }

    query += ' ORDER BY start_time DESC'

    const results = await this.coreAPI.database.query(query, params)
    return results.map((row: any) => this.mapRowToTimeEntry(row))
  }

  async getActiveTimer(): Promise<TimeEntry | null> {
    if (!this.coreAPI?.database) {
      return this.activeTimer
    }

    const results = await this.coreAPI.database.query(
      'SELECT * FROM task_time_entries WHERE status = ? ORDER BY start_time DESC LIMIT 1',
      [TimeEntryStatus.ACTIVE]
    )

    if (results.length === 0) {
      this.activeTimer = null
      return null
    }

    const timeEntry = this.mapRowToTimeEntry(results[0])
    this.activeTimer = timeEntry
    return timeEntry
  }

  async getTimeStats(taskId?: string, projectId?: string, period?: 'day' | 'week' | 'month'): Promise<TimeTrackingStats> {
    if (!this.coreAPI?.database) {
      throw new Error('Database not available')
    }

    const now = new Date()
    let startDate: Date

    // 计算时间范围
    switch (period) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'week':
        const dayOfWeek = now.getDay()
        startDate = new Date(now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000)
        startDate.setHours(0, 0, 0, 0)
        break
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      default:
        startDate = new Date(0) // 所有时间
    }

    let query = `
      SELECT
        COUNT(*) as total_entries,
        SUM(duration) as total_duration,
        AVG(duration) as average_duration,
        MIN(duration) as min_duration,
        MAX(duration) as max_duration
      FROM task_time_entries
      WHERE status = ? AND start_time >= ?
    `
    const params: any[] = [TimeEntryStatus.COMPLETED, startDate.toISOString()]

    if (taskId) {
      query += ' AND task_id = ?'
      params.push(taskId)
    }

    if (projectId) {
      query += ' AND task_id IN (SELECT id FROM tasks WHERE project_id = ?)'
      params.push(projectId)
    }

    const results = await this.coreAPI.database.query(query, params)
    const stats = results[0] || {}

    return {
      totalEntries: stats.total_entries || 0,
      totalDuration: stats.total_duration || 0,
      averageDuration: stats.average_duration || 0,
      minDuration: stats.min_duration || 0,
      maxDuration: stats.max_duration || 0,
      period: period || 'all',
      startDate,
      endDate: now
    }
  }

  private async getTimeEntry(id: string): Promise<TimeEntry | null> {
    if (!this.coreAPI?.database) {
      throw new Error('Database not available')
    }

    const results = await this.coreAPI.database.query(
      'SELECT * FROM task_time_entries WHERE id = ?',
      [id]
    )

    if (results.length === 0) {
      return null
    }

    return this.mapRowToTimeEntry(results[0])
  }

  private mapRowToTimeEntry(row: any): TimeEntry {
    return {
      id: row.id,
      taskId: row.task_id,
      startTime: new Date(row.start_time),
      endTime: row.end_time ? new Date(row.end_time) : null,
      duration: row.duration || 0,
      status: row.status as TimeEntryStatus,
      description: row.description || '',
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }
  }

  private generateId(): string {
    return `time_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
