/**
 * GTD工作流相关类型定义
 */

import { TaskPriority } from './task'

// GTD工作流接口
export interface GTDWorkflow {
  collect: (input: string) => Promise<void>
  process: (taskId: string) => Promise<GTDProcessResult>
  organize: (taskId: string, decision: GTDDecision) => Promise<void>
  review: () => Promise<GTDReviewResult>
  engage: () => Promise<any[]> // 临时使用any[]，直到Task类型可用
}

// GTD处理结果
export interface GTDProcessResult {
  isActionable: boolean
  isProject: boolean
  estimatedTime?: number
  suggestedContext?: string
  suggestedPriority?: TaskPriority
}

// GTD决策
export interface GTDDecision {
  action: 'do' | 'defer' | 'delegate' | 'delete' | 'project' | 'someday' | 'reference'
  context?: string
  dueDate?: Date
  delegateTo?: string
  projectName?: string
  priority?: TaskPriority
}

// GTD回顾结果
export interface GTDReviewResult {
  inboxCount: number
  overdueCount: number
  todayCount: number
  weekCount: number
  somedayCount: number
  recommendations: string[]
}

// GTD上下文
export interface GTDContext {
  id: string
  name: string
  description?: string
  icon?: string
  color?: string
  createdAt: Date
  updatedAt: Date
}

// 创建GTD上下文请求
export interface CreateGTDContextRequest {
  name: string
  description?: string
  icon?: string
  color?: string
}
