/**
 * 项目管理相关类型定义
 */

import type { Task } from './task'

// 项目状态枚举
export enum ProjectStatus {
  ACTIVE = 'active',
  ON_HOLD = 'on-hold',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// 项目实体
export interface Project {
  id: string
  name: string
  description?: string
  status: ProjectStatus
  color?: string
  
  // 时间管理
  startDate?: Date
  dueDate?: Date
  completedAt?: Date
  
  // 关联关系
  tasks: Task[]
  linkedNotes: string[]
  linkedFiles: string[]
  
  // 统计信息
  progress: number // 0-100
  totalTasks: number
  completedTasks: number
  
  // 元数据
  createdAt: Date
  updatedAt: Date
  createdBy?: string
}

// 创建项目请求
export interface CreateProjectRequest {
  name: string
  description?: string
  color?: string
  startDate?: Date
  dueDate?: Date
  linkedNotes?: string[]
  linkedFiles?: string[]
}

// 更新项目请求
export interface UpdateProjectRequest {
  name?: string
  description?: string
  status?: ProjectStatus
  color?: string
  startDate?: Date
  dueDate?: Date
  linkedNotes?: string[]
  linkedFiles?: string[]
}

// 项目过滤器
export interface ProjectFilter {
  status?: ProjectStatus[]
  dueDateFrom?: Date
  dueDateTo?: Date
  hasLinkedNotes?: boolean
  hasLinkedFiles?: boolean
  search?: string
}

// 项目排序选项
export interface ProjectSortOptions {
  field: 'name' | 'status' | 'progress' | 'dueDate' | 'createdAt' | 'updatedAt'
  direction: 'asc' | 'desc'
}

// 项目统计信息
export interface ProjectStats {
  total: number
  byStatus: Record<ProjectStatus, number>
  overdue: number
  dueToday: number
  dueThisWeek: number
  completed: number
  completionRate: number
  averageProgress: number
}

// 项目里程碑
export interface ProjectMilestone {
  id: string
  projectId: string
  name: string
  description?: string
  dueDate?: Date
  completedAt?: Date
  isCompleted: boolean
  order: number
  createdAt: Date
  updatedAt: Date
}

// 创建项目里程碑请求
export interface CreateProjectMilestoneRequest {
  projectId: string
  name: string
  description?: string
  dueDate?: Date
  order?: number
}

// 更新项目里程碑请求
export interface UpdateProjectMilestoneRequest {
  name?: string
  description?: string
  dueDate?: Date
  isCompleted?: boolean
  order?: number
}

// 项目模板
export interface ProjectTemplate {
  id: string
  name: string
  description?: string
  defaultColor?: string
  taskTemplates: ProjectTaskTemplate[]
  milestoneTemplates: ProjectMilestoneTemplate[]
  createdAt: Date
  updatedAt: Date
}

// 项目任务模板
export interface ProjectTaskTemplate {
  id: string
  title: string
  description?: string
  estimatedTime?: number
  tags: string[]
  contexts: string[]
  order: number
  dependencies: string[] // 依赖的其他任务模板ID
}

// 项目里程碑模板
export interface ProjectMilestoneTemplate {
  id: string
  name: string
  description?: string
  daysFromStart: number // 从项目开始后的天数
  order: number
}

// 创建项目模板请求
export interface CreateProjectTemplateRequest {
  name: string
  description?: string
  defaultColor?: string
  taskTemplates?: Omit<ProjectTaskTemplate, 'id'>[]
  milestoneTemplates?: Omit<ProjectMilestoneTemplate, 'id'>[]
}

// 项目时间线事件
export interface ProjectTimelineEvent {
  id: string
  projectId: string
  type: 'task_created' | 'task_completed' | 'milestone_reached' | 'status_changed' | 'note_linked'
  title: string
  description?: string
  metadata?: Record<string, any>
  timestamp: Date
}

// 项目报告
export interface ProjectReport {
  project: Project
  timeRange: {
    startDate: Date
    endDate: Date
  }
  stats: {
    tasksCompleted: number
    tasksCreated: number
    timeSpent: number // 分钟
    milestonesReached: number
    progressChange: number // 进度变化百分比
  }
  timeline: ProjectTimelineEvent[]
  topContributors?: string[] // 主要贡献者
  insights: string[] // 洞察和建议
}
