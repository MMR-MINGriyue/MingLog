/**
 * 项目管理服务
 * 处理项目的CRUD操作和业务逻辑
 */

import {
  Project,
  ProjectStatus,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectFilter,
  ProjectSortOptions,
  ProjectStats,
  ProjectMilestone,
  CreateProjectMilestoneRequest,
  UpdateProjectMilestoneRequest,
  ProjectTemplate,
  CreateProjectTemplateRequest,
  ProjectReport,
  Task
} from '../types'

export interface IProjectsService {
  // 项目CRUD操作
  createProject(request: CreateProjectRequest): Promise<Project>
  getProject(id: string): Promise<Project | null>
  updateProject(id: string, request: UpdateProjectRequest): Promise<Project>
  deleteProject(id: string): Promise<boolean>
  
  // 项目查询
  getProjects(filter?: ProjectFilter, sort?: ProjectSortOptions, limit?: number, offset?: number): Promise<Project[]>
  getActiveProjects(): Promise<Project[]>
  getCompletedProjects(): Promise<Project[]>
  
  // 项目统计
  getProjectStats(filter?: ProjectFilter): Promise<ProjectStats>
  calculateProjectProgress(projectId: string): Promise<number>
  
  // 项目里程碑
  createMilestone(request: CreateProjectMilestoneRequest): Promise<ProjectMilestone>
  getMilestones(projectId: string): Promise<ProjectMilestone[]>
  updateMilestone(id: string, request: UpdateProjectMilestoneRequest): Promise<ProjectMilestone>
  deleteMilestone(id: string): Promise<boolean>
  markMilestoneCompleted(id: string): Promise<ProjectMilestone>
  
  // 项目模板
  createProjectTemplate(request: CreateProjectTemplateRequest): Promise<ProjectTemplate>
  getProjectTemplates(): Promise<ProjectTemplate[]>
  createProjectFromTemplate(templateId: string, overrides?: Partial<CreateProjectRequest>): Promise<Project>
  
  // 项目报告
  generateProjectReport(projectId: string, startDate: Date, endDate: Date): Promise<ProjectReport>
  
  // 搜索
  searchProjects(query: string, filter?: ProjectFilter): Promise<Project[]>
}

export class ProjectsService implements IProjectsService {
  private coreAPI: any // 将在模块初始化时注入

  constructor(coreAPI?: any) {
    this.coreAPI = coreAPI
  }

  // 项目CRUD操作
  async createProject(request: CreateProjectRequest): Promise<Project> {
    const now = new Date()
    const project: Project = {
      id: this.generateId(),
      name: request.name,
      description: request.description,
      status: ProjectStatus.ACTIVE,
      color: request.color,
      startDate: request.startDate,
      dueDate: request.dueDate,
      tasks: [],
      linkedNotes: request.linkedNotes || [],
      linkedFiles: request.linkedFiles || [],
      progress: 0,
      totalTasks: 0,
      completedTasks: 0,
      createdAt: now,
      updatedAt: now
    }

    // 通过Tauri API保存到数据库
    if (this.coreAPI?.database) {
      await this.coreAPI.database.execute(
        `INSERT INTO projects (
          id, name, description, status, color, start_date, due_date,
          linked_notes, linked_files, progress, total_tasks, completed_tasks,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          project.id, project.name, project.description, project.status,
          project.color, project.startDate?.toISOString(), project.dueDate?.toISOString(),
          JSON.stringify(project.linkedNotes), JSON.stringify(project.linkedFiles),
          project.progress, project.totalTasks, project.completedTasks,
          project.createdAt.toISOString(), project.updatedAt.toISOString()
        ]
      )
    }

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('project:created', { project })
    }

    return project
  }

  async getProject(id: string): Promise<Project | null> {
    if (!this.coreAPI?.database) {
      throw new Error('Database not available')
    }

    const result = await this.coreAPI.database.query(
      'SELECT * FROM projects WHERE id = ?',
      [id]
    )

    if (result.length === 0) {
      return null
    }

    const project = this.mapRowToProject(result[0])
    
    // 加载项目的任务
    const tasks = await this.coreAPI.database.query(
      'SELECT * FROM tasks WHERE project_id = ?',
      [id]
    )
    
    project.tasks = tasks.map((row: any) => this.mapRowToTask(row))
    
    return project
  }

  async updateProject(id: string, request: UpdateProjectRequest): Promise<Project> {
    const existingProject = await this.getProject(id)
    if (!existingProject) {
      throw new Error(`Project with id ${id} not found`)
    }

    const updatedProject: Project = {
      ...existingProject,
      ...request,
      updatedAt: new Date()
    }

    if (this.coreAPI?.database) {
      await this.coreAPI.database.execute(
        `UPDATE projects SET 
          name = ?, description = ?, status = ?, color = ?, start_date = ?,
          due_date = ?, linked_notes = ?, linked_files = ?, updated_at = ?
        WHERE id = ?`,
        [
          updatedProject.name, updatedProject.description, updatedProject.status,
          updatedProject.color, updatedProject.startDate?.toISOString(),
          updatedProject.dueDate?.toISOString(), JSON.stringify(updatedProject.linkedNotes),
          JSON.stringify(updatedProject.linkedFiles), updatedProject.updatedAt.toISOString(), id
        ]
      )
    }

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('project:updated', { project: updatedProject, previousProject: existingProject })
    }

    return updatedProject
  }

  async deleteProject(id: string): Promise<boolean> {
    const project = await this.getProject(id)
    if (!project) {
      return false
    }

    if (this.coreAPI?.database) {
      // 删除项目相关的任务
      await this.coreAPI.database.execute('DELETE FROM tasks WHERE project_id = ?', [id])
      // 删除项目
      await this.coreAPI.database.execute('DELETE FROM projects WHERE id = ?', [id])
    }

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('project:deleted', { project })
    }

    return true
  }

  async getProjects(filter?: ProjectFilter, sort?: ProjectSortOptions, limit?: number, offset?: number): Promise<Project[]> {
    if (!this.coreAPI?.database) {
      return []
    }

    let query = 'SELECT * FROM projects WHERE 1=1'
    const params: any[] = []

    // 应用过滤器
    if (filter) {
      if (filter.status && filter.status.length > 0) {
        query += ` AND status IN (${filter.status.map(() => '?').join(',')})`
        params.push(...filter.status)
      }
      if (filter.search) {
        query += ' AND (name LIKE ? OR description LIKE ?)'
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
    return results.map((row: any) => this.mapRowToProject(row))
  }

  async getActiveProjects(): Promise<Project[]> {
    return this.getProjects({ status: [ProjectStatus.ACTIVE] })
  }

  async getCompletedProjects(): Promise<Project[]> {
    return this.getProjects({ status: [ProjectStatus.COMPLETED] })
  }

  async calculateProjectProgress(projectId: string): Promise<number> {
    if (!this.coreAPI?.database) {
      return 0
    }

    const result = await this.coreAPI.database.query(
      `SELECT 
        COUNT(*) as total_tasks,
        COUNT(CASE WHEN status = 'done' THEN 1 END) as completed_tasks
      FROM tasks WHERE project_id = ?`,
      [projectId]
    )

    if (result.length === 0 || result[0].total_tasks === 0) {
      return 0
    }

    const progress = Math.round((result[0].completed_tasks / result[0].total_tasks) * 100)
    
    // 更新项目进度
    await this.coreAPI.database.execute(
      'UPDATE projects SET progress = ?, total_tasks = ?, completed_tasks = ? WHERE id = ?',
      [progress, result[0].total_tasks, result[0].completed_tasks, projectId]
    )

    return progress
  }

  // 工具方法
  private generateId(): string {
    return `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private mapRowToProject(row: any): Project {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      status: row.status as ProjectStatus,
      color: row.color,
      startDate: row.start_date ? new Date(row.start_date) : undefined,
      dueDate: row.due_date ? new Date(row.due_date) : undefined,
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      tasks: [], // 将在需要时单独加载
      linkedNotes: JSON.parse(row.linked_notes || '[]'),
      linkedFiles: JSON.parse(row.linked_files || '[]'),
      progress: row.progress || 0,
      totalTasks: row.total_tasks || 0,
      completedTasks: row.completed_tasks || 0,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      createdBy: row.created_by
    }
  }

  private mapRowToTask(row: any): Task {
    // 简化的任务映射，实际应该从TasksService复用
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      status: row.status,
      priority: row.priority,
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

  async getProjectStats(filter?: ProjectFilter): Promise<ProjectStats> {
    if (!this.coreAPI?.database) {
      return {
        total: 0,
        byStatus: {} as Record<ProjectStatus, number>,
        overdue: 0,
        dueToday: 0,
        dueThisWeek: 0,
        completed: 0,
        completionRate: 0,
        averageProgress: 0
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
      if (filter.search) {
        whereClause += ' AND (name LIKE ? OR description LIKE ?)'
        params.push(`%${filter.search}%`, `%${filter.search}%`)
      }
    }

    // 获取状态统计
    const statusStats = await this.coreAPI.database.query(
      `SELECT status, COUNT(*) as count FROM projects ${whereClause} GROUP BY status`,
      params
    )

    // 获取总数
    const totalResult = await this.coreAPI.database.query(
      `SELECT COUNT(*) as total FROM projects ${whereClause}`,
      params
    )

    // 获取平均进度
    const progressResult = await this.coreAPI.database.query(
      `SELECT AVG(progress) as avg_progress FROM projects ${whereClause}`,
      params
    )

    const total = totalResult[0]?.total || 0
    const averageProgress = Math.round(progressResult[0]?.avg_progress || 0)

    // 构建状态统计
    const byStatus: Record<ProjectStatus, number> = {} as Record<ProjectStatus, number>
    statusStats.forEach((row: any) => {
      byStatus[row.status as ProjectStatus] = row.count
    })

    const completed = byStatus[ProjectStatus.COMPLETED] || 0
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0

    // 获取过期、今日、本周项目数量
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay())
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)

    const overdueResult = await this.coreAPI.database.query(
      `SELECT COUNT(*) as count FROM projects ${whereClause} AND due_date < ? AND status NOT IN ('completed', 'cancelled')`,
      [...params, now.toISOString()]
    )

    const todayResult = await this.coreAPI.database.query(
      `SELECT COUNT(*) as count FROM projects ${whereClause} AND DATE(due_date) = DATE(?) AND status NOT IN ('completed', 'cancelled')`,
      [...params, today.toISOString()]
    )

    const weekResult = await this.coreAPI.database.query(
      `SELECT COUNT(*) as count FROM projects ${whereClause} AND due_date BETWEEN ? AND ? AND status NOT IN ('completed', 'cancelled')`,
      [...params, weekStart.toISOString(), weekEnd.toISOString()]
    )

    return {
      total,
      byStatus,
      overdue: overdueResult[0]?.count || 0,
      dueToday: todayResult[0]?.count || 0,
      dueThisWeek: weekResult[0]?.count || 0,
      completed,
      completionRate,
      averageProgress
    }
  }

  async createMilestone(request: CreateProjectMilestoneRequest): Promise<ProjectMilestone> {
    const milestone: ProjectMilestone = {
      id: this.generateId().replace('project_', 'milestone_'),
      projectId: request.projectId,
      name: request.name,
      description: request.description,
      dueDate: request.dueDate,
      completedAt: undefined,
      isCompleted: false,
      order: request.order || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // 存储在内存中（实际实现中应该创建milestones表）
    if (!this.milestones) {
      this.milestones = []
    }
    this.milestones.push(milestone)

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('project-milestone:created', { milestone })
    }

    return milestone
  }

  async getMilestones(projectId: string): Promise<ProjectMilestone[]> {
    if (!this.milestones) {
      this.milestones = []
    }
    return this.milestones
      .filter(m => m.projectId === projectId)
      .sort((a, b) => a.order - b.order)
  }

  async updateMilestone(id: string, request: UpdateProjectMilestoneRequest): Promise<ProjectMilestone> {
    if (!this.milestones) {
      this.milestones = []
    }

    const milestoneIndex = this.milestones.findIndex(m => m.id === id)
    if (milestoneIndex === -1) {
      throw new Error(`Milestone with id ${id} not found`)
    }

    const updatedMilestone = {
      ...this.milestones[milestoneIndex],
      ...request,
      updatedAt: new Date()
    }

    this.milestones[milestoneIndex] = updatedMilestone

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('project-milestone:updated', { milestone: updatedMilestone })
    }

    return updatedMilestone
  }

  async deleteMilestone(id: string): Promise<boolean> {
    if (!this.milestones) {
      return false
    }

    const initialLength = this.milestones.length
    this.milestones = this.milestones.filter(m => m.id !== id)

    const deleted = this.milestones.length < initialLength

    if (deleted && this.coreAPI?.events) {
      this.coreAPI.events.emit('project-milestone:deleted', { milestoneId: id })
    }

    return deleted
  }

  async markMilestoneCompleted(id: string): Promise<ProjectMilestone> {
    const request: UpdateProjectMilestoneRequest = {
      isCompleted: true
    }

    const milestone = await this.updateMilestone(id, request)

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('project-milestone:completed', { milestone })
    }

    return milestone
  }

  async createProjectTemplate(request: CreateProjectTemplateRequest): Promise<ProjectTemplate> {
    const template: ProjectTemplate = {
      id: this.generateId().replace('project_', 'template_'),
      name: request.name,
      description: request.description,
      defaultColor: request.defaultColor,
      taskTemplates: request.taskTemplates || [],
      milestoneTemplates: request.milestoneTemplates || [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // 存储在内存中（实际实现中应该创建project_templates表）
    if (!this.templates) {
      this.templates = []
    }
    this.templates.push(template)

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('project-template:created', { template })
    }

    return template
  }

  async getProjectTemplates(): Promise<ProjectTemplate[]> {
    if (!this.templates) {
      this.templates = []
    }
    return this.templates
  }

  async createProjectFromTemplate(templateId: string, overrides?: Partial<CreateProjectRequest>): Promise<Project> {
    const templates = await this.getProjectTemplates()
    const template = templates.find(t => t.id === templateId)

    if (!template) {
      throw new Error(`Project template with id ${templateId} not found`)
    }

    // 创建项目
    const projectRequest: CreateProjectRequest = {
      name: overrides?.name || template.name,
      description: overrides?.description || template.description,
      color: overrides?.color || template.defaultColor,
      startDate: overrides?.startDate,
      dueDate: overrides?.dueDate,
      linkedNotes: overrides?.linkedNotes,
      linkedFiles: overrides?.linkedFiles
    }

    const project = await this.createProject(projectRequest)

    // 创建里程碑
    for (const milestoneTemplate of template.milestoneTemplates) {
      const milestoneRequest: CreateProjectMilestoneRequest = {
        projectId: project.id,
        name: milestoneTemplate.name,
        description: milestoneTemplate.description,
        dueDate: project.startDate ?
          new Date(project.startDate.getTime() + milestoneTemplate.daysFromStart * 24 * 60 * 60 * 1000) :
          undefined,
        order: milestoneTemplate.order
      }
      await this.createMilestone(milestoneRequest)
    }

    // 发送事件通知
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('project:created-from-template', { project, templateId })
    }

    return project
  }

  async generateProjectReport(projectId: string, startDate: Date, endDate: Date): Promise<ProjectReport> {
    const project = await this.getProject(projectId)
    if (!project) {
      throw new Error(`Project with id ${projectId} not found`)
    }

    // 获取项目任务
    const tasks = await this.coreAPI?.database?.query(
      'SELECT * FROM tasks WHERE project_id = ? AND created_at BETWEEN ? AND ?',
      [projectId, startDate.toISOString(), endDate.toISOString()]
    ) || []

    // 计算统计信息
    const tasksCompleted = tasks.filter((t: any) => t.status === 'done').length
    const tasksCreated = tasks.length

    // 计算时间花费（简化实现）
    const timeSpent = tasks.reduce((total: number, task: any) => {
      return total + (task.actual_time || 0)
    }, 0)

    // 获取里程碑
    const milestones = await this.getMilestones(projectId)
    const milestonesReached = milestones.filter(m =>
      m.isCompleted &&
      m.completedAt &&
      m.completedAt >= startDate &&
      m.completedAt <= endDate
    ).length

    // 计算进度变化（简化实现）
    const progressChange = project.progress

    // 生成时间线事件
    const timeline: ProjectTimelineEvent[] = [
      ...tasks.map((task: any) => ({
        id: `event_${task.id}`,
        projectId,
        type: task.status === 'done' ? 'task_completed' : 'task_created' as const,
        title: task.status === 'done' ? `任务完成: ${task.title}` : `任务创建: ${task.title}`,
        description: task.description,
        metadata: { taskId: task.id },
        timestamp: new Date(task.status === 'done' ? task.completed_at || task.updated_at : task.created_at)
      }))
    ].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

    // 生成洞察
    const insights: string[] = []
    if (tasksCompleted > 0) {
      insights.push(`在报告期间完成了 ${tasksCompleted} 个任务`)
    }
    if (timeSpent > 0) {
      insights.push(`总计花费 ${Math.round(timeSpent / 60)} 小时`)
    }
    if (milestonesReached > 0) {
      insights.push(`达成了 ${milestonesReached} 个里程碑`)
    }

    return {
      project,
      timeRange: { startDate, endDate },
      stats: {
        tasksCompleted,
        tasksCreated,
        timeSpent,
        milestonesReached,
        progressChange
      },
      timeline,
      insights
    }
  }

  async searchProjects(query: string, filter?: ProjectFilter): Promise<Project[]> {
    return this.getProjects({ ...filter, search: query })
  }

  // 私有属性用于存储里程碑和模板（实际实现中应该使用数据库）
  private milestones?: ProjectMilestone[]
  private templates?: ProjectTemplate[]
}
