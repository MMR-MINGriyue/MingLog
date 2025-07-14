/**
 * 通知服务
 * 提供任务提醒、到期通知、过期警告功能
 */

import { Task, TaskNotification, NotificationType, NotificationSettings } from '../types'

export interface INotificationService {
  // 通知管理
  createNotification(taskId: string, type: NotificationType, scheduledTime: Date): Promise<TaskNotification>
  getNotifications(taskId?: string): Promise<TaskNotification[]>
  markNotificationRead(id: string): Promise<void>
  deleteNotification(id: string): Promise<void>
  
  // 自动通知
  scheduleTaskReminders(task: Task): Promise<void>
  checkOverdueTasks(): Promise<Task[]>
  sendDailyDigest(): Promise<void>
  
  // 设置
  updateNotificationSettings(settings: NotificationSettings): Promise<void>
  getNotificationSettings(): Promise<NotificationSettings>
}

export class NotificationService implements INotificationService {
  private coreAPI: any
  private settings: NotificationSettings

  constructor(coreAPI?: any) {
    this.coreAPI = coreAPI
    this.settings = {
      enableReminders: true,
      enableOverdueAlerts: true,
      enableDailyDigest: true,
      reminderMinutes: [60, 15], // 1小时前和15分钟前提醒
      dailyDigestTime: '09:00',
      weeklyReviewDay: 'sunday',
      soundEnabled: true,
      desktopNotifications: true
    }
  }

  async createNotification(taskId: string, type: NotificationType, scheduledTime: Date): Promise<TaskNotification> {
    const now = new Date()
    const notification: TaskNotification = {
      id: this.generateId(),
      taskId,
      type,
      title: this.getNotificationTitle(type),
      message: '',
      scheduledTime,
      isRead: false,
      isSent: false,
      createdAt: now,
      updatedAt: now
    }

    // 保存到数据库
    if (this.coreAPI?.database) {
      await this.coreAPI.database.execute(
        `INSERT INTO task_notifications (
          id, task_id, type, title, message, scheduled_time, is_read, is_sent, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          notification.id, notification.taskId, notification.type,
          notification.title, notification.message, notification.scheduledTime.toISOString(),
          notification.isRead ? 1 : 0, notification.isSent ? 1 : 0,
          notification.createdAt.toISOString(), notification.updatedAt.toISOString()
        ]
      )
    }

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('notification:created', { notification })
    }

    return notification
  }

  async getNotifications(taskId?: string): Promise<TaskNotification[]> {
    if (!this.coreAPI?.database) {
      throw new Error('Database not available')
    }

    let query = 'SELECT * FROM task_notifications WHERE 1=1'
    const params: any[] = []

    if (taskId) {
      query += ' AND task_id = ?'
      params.push(taskId)
    }

    query += ' ORDER BY scheduled_time DESC'

    const results = await this.coreAPI.database.query(query, params)
    return results.map((row: any) => this.mapRowToNotification(row))
  }

  async markNotificationRead(id: string): Promise<void> {
    if (!this.coreAPI?.database) {
      throw new Error('Database not available')
    }

    await this.coreAPI.database.execute(
      'UPDATE task_notifications SET is_read = ?, updated_at = ? WHERE id = ?',
      [1, new Date().toISOString(), id]
    )

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('notification:read', { notificationId: id })
    }
  }

  async deleteNotification(id: string): Promise<void> {
    if (!this.coreAPI?.database) {
      throw new Error('Database not available')
    }

    await this.coreAPI.database.execute(
      'DELETE FROM task_notifications WHERE id = ?',
      [id]
    )

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('notification:deleted', { notificationId: id })
    }
  }

  async scheduleTaskReminders(task: Task): Promise<void> {
    if (!task.dueDate || !this.settings.enableReminders) {
      return
    }

    // 删除现有的提醒
    if (this.coreAPI?.database) {
      await this.coreAPI.database.execute(
        'DELETE FROM task_notifications WHERE task_id = ? AND type IN (?, ?)',
        [task.id, NotificationType.REMINDER, NotificationType.DUE_SOON]
      )
    }

    // 创建新的提醒
    for (const minutes of this.settings.reminderMinutes) {
      const reminderTime = new Date(task.dueDate.getTime() - minutes * 60 * 1000)
      
      if (reminderTime > new Date()) {
        await this.createNotification(
          task.id,
          NotificationType.REMINDER,
          reminderTime
        )
      }
    }

    // 创建到期提醒
    if (task.dueDate > new Date()) {
      await this.createNotification(
        task.id,
        NotificationType.DUE_SOON,
        task.dueDate
      )
    }
  }

  async checkOverdueTasks(): Promise<Task[]> {
    if (!this.coreAPI?.database || !this.settings.enableOverdueAlerts) {
      return []
    }

    const now = new Date()
    const results = await this.coreAPI.database.query(
      `SELECT * FROM tasks 
       WHERE due_date < ? AND status != 'done' AND status != 'cancelled'`,
      [now.toISOString()]
    )

    const overdueTasks = results.map((row: any) => this.mapRowToTask(row))

    // 为过期任务创建通知
    for (const task of overdueTasks) {
      // 检查是否已经有过期通知
      const existingNotifications = await this.coreAPI.database.query(
        'SELECT * FROM task_notifications WHERE task_id = ? AND type = ? AND is_sent = 0',
        [task.id, NotificationType.OVERDUE]
      )

      if (existingNotifications.length === 0) {
        await this.createNotification(
          task.id,
          NotificationType.OVERDUE,
          now
        )
      }
    }

    return overdueTasks
  }

  async sendDailyDigest(): Promise<void> {
    if (!this.settings.enableDailyDigest) {
      return
    }

    const today = new Date()
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)

    // 获取今天到期的任务
    const dueTodayTasks = await this.getTasksDueInRange(today, today)
    
    // 获取明天到期的任务
    const dueTomorrowTasks = await this.getTasksDueInRange(tomorrow, tomorrow)
    
    // 获取过期任务
    const overdueTasks = await this.checkOverdueTasks()

    // 创建每日摘要通知
    const digestNotification: TaskNotification = {
      id: this.generateId(),
      taskId: '', // 系统通知，不关联特定任务
      type: NotificationType.DAILY_DIGEST,
      title: '每日任务摘要',
      message: this.generateDigestMessage(dueTodayTasks, dueTomorrowTasks, overdueTasks),
      scheduledTime: today,
      isRead: false,
      isSent: false,
      createdAt: today,
      updatedAt: today
    }

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('notification:daily-digest', { 
        notification: digestNotification,
        dueTodayTasks,
        dueTomorrowTasks,
        overdueTasks
      })
    }
  }

  async updateNotificationSettings(settings: NotificationSettings): Promise<void> {
    this.settings = { ...this.settings, ...settings }

    // 保存设置到数据库或配置文件
    if (this.coreAPI?.settings) {
      await this.coreAPI.settings.set('tasks.notifications', this.settings)
    }

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('notification:settings-updated', { settings: this.settings })
    }
  }

  async getNotificationSettings(): Promise<NotificationSettings> {
    // 从数据库或配置文件加载设置
    if (this.coreAPI?.settings) {
      const savedSettings = await this.coreAPI.settings.get('tasks.notifications')
      if (savedSettings) {
        this.settings = { ...this.settings, ...savedSettings }
      }
    }

    return this.settings
  }

  private async getTasksDueInRange(startDate: Date, endDate: Date): Promise<Task[]> {
    if (!this.coreAPI?.database) {
      return []
    }

    const results = await this.coreAPI.database.query(
      `SELECT * FROM tasks 
       WHERE due_date >= ? AND due_date <= ? AND status != 'done' AND status != 'cancelled'
       ORDER BY due_date ASC`,
      [startDate.toISOString(), endDate.toISOString()]
    )

    return results.map((row: any) => this.mapRowToTask(row))
  }

  private generateDigestMessage(dueTodayTasks: Task[], dueTomorrowTasks: Task[], overdueTasks: Task[]): string {
    const parts: string[] = []

    if (dueTodayTasks.length > 0) {
      parts.push(`今天有 ${dueTodayTasks.length} 个任务到期`)
    }

    if (dueTomorrowTasks.length > 0) {
      parts.push(`明天有 ${dueTomorrowTasks.length} 个任务到期`)
    }

    if (overdueTasks.length > 0) {
      parts.push(`有 ${overdueTasks.length} 个任务已过期`)
    }

    return parts.length > 0 ? parts.join('，') : '今天没有紧急任务'
  }

  private getNotificationTitle(type: NotificationType): string {
    switch (type) {
      case NotificationType.REMINDER:
        return '任务提醒'
      case NotificationType.DUE_SOON:
        return '任务即将到期'
      case NotificationType.OVERDUE:
        return '任务已过期'
      case NotificationType.DAILY_DIGEST:
        return '每日任务摘要'
      default:
        return '任务通知'
    }
  }

  private mapRowToNotification(row: any): TaskNotification {
    return {
      id: row.id,
      taskId: row.task_id,
      type: row.type as NotificationType,
      title: row.title,
      message: row.message,
      scheduledTime: new Date(row.scheduled_time),
      isRead: Boolean(row.is_read),
      isSent: Boolean(row.is_sent),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }
  }

  private mapRowToTask(row: any): Task {
    // 简化的任务映射，实际应该使用TasksService的方法
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
      dueDate: row.due_date ? new Date(row.due_date) : null,
      completedAt: row.completed_at ? new Date(row.completed_at) : null,
      estimatedTime: row.estimated_time,
      actualTime: row.actual_time,
      projectId: row.project_id,
      parentTaskId: row.parent_task_id,
      linkedNotes: JSON.parse(row.linked_notes || '[]'),
      linkedFiles: JSON.parse(row.linked_files || '[]'),
      tags: JSON.parse(row.tags || '[]'),
      contexts: JSON.parse(row.contexts || '[]'),
      recurrence: row.recurrence ? JSON.parse(row.recurrence) : null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    }
  }

  private generateId(): string {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
