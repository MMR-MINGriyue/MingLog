/**
 * GTD (Getting Things Done) 工作流服务
 * 实现GTD方法论的核心流程：收集、处理、组织、回顾、执行
 */

import {
  Task,
  TaskStatus,
  TaskPriority,
  CreateTaskRequest,
  GTDWorkflow,
  GTDProcessResult,
  GTDDecision,
  GTDReviewResult
} from '../types'
import { ITasksService } from './TasksService'
import { IProjectsService } from './ProjectsService'

export interface IGTDService extends GTDWorkflow {
  // GTD收集箱管理
  getInboxTasks(): Promise<Task[]>
  addToInbox(input: string, metadata?: Record<string, any>): Promise<Task>
  
  // GTD处理流程
  processInboxItem(taskId: string): Promise<GTDProcessResult>
  makeDecision(taskId: string, decision: GTDDecision): Promise<void>
  
  // GTD组织系统
  organizeTask(taskId: string, decision: GTDDecision): Promise<void>
  moveToSomeday(taskId: string): Promise<void>
  moveToWaiting(taskId: string, waitingFor: string): Promise<void>
  
  // GTD回顾系统
  weeklyReview(): Promise<GTDReviewResult>
  dailyReview(): Promise<GTDReviewResult>
  
  // GTD执行系统
  getNextActions(): Promise<Task[]>
  getNextActionsByContext(context: string): Promise<Task[]>
  
  // GTD上下文管理
  getAvailableContexts(): Promise<string[]>
  suggestContext(task: Task): Promise<string | null>
}

export class GTDService implements IGTDService {
  private tasksService: ITasksService
  private projectsService: IProjectsService
  private coreAPI: any

  constructor(tasksService: ITasksService, projectsService: IProjectsService, coreAPI?: any) {
    this.tasksService = tasksService
    this.projectsService = projectsService
    this.coreAPI = coreAPI
  }

  // GTD核心流程实现

  /**
   * 收集 - 将想法快速捕获到收集箱
   */
  async collect(input: string): Promise<void> {
    await this.addToInbox(input)
  }

  /**
   * 处理 - 分析收集箱中的项目
   */
  async process(taskId: string): Promise<GTDProcessResult> {
    const task = await this.tasksService.getTask(taskId)
    if (!task) {
      throw new Error(`Task ${taskId} not found`)
    }

    // 分析任务特征
    const result: GTDProcessResult = {
      isActionable: this.isActionable(task),
      isProject: this.isProject(task),
      estimatedTime: this.estimateTime(task),
      suggestedContext: (await this.suggestContext(task)) || undefined,
      suggestedPriority: this.suggestPriority(task)
    }

    return result
  }

  /**
   * 组织 - 根据决策组织任务
   */
  async organize(taskId: string, decision: GTDDecision): Promise<void> {
    await this.makeDecision(taskId, decision)
  }

  /**
   * 回顾 - 定期回顾系统状态
   */
  async review(): Promise<GTDReviewResult> {
    return this.weeklyReview()
  }

  /**
   * 执行 - 获取下一步行动
   */
  async engage(): Promise<Task[]> {
    return this.getNextActions()
  }

  // 收集箱管理

  async getInboxTasks(): Promise<Task[]> {
    return this.tasksService.getTasksByStatus(TaskStatus.INBOX)
  }

  async addToInbox(input: string, metadata?: Record<string, any>): Promise<Task> {
    const request: CreateTaskRequest = {
      title: input.length > 100 ? input.substring(0, 100) + '...' : input,
      description: input.length > 100 ? input : undefined,
      priority: TaskPriority.MEDIUM,
      tags: metadata?.tags || [],
      contexts: metadata?.contexts || []
    }

    const task = await this.tasksService.createTask(request)
    
    // 设置为收集箱状态
    await this.tasksService.updateTask(task.id, { status: TaskStatus.INBOX })

    return task
  }

  // 处理流程

  async processInboxItem(taskId: string): Promise<GTDProcessResult> {
    return this.process(taskId)
  }

  async makeDecision(taskId: string, decision: GTDDecision): Promise<void> {
    const task = await this.tasksService.getTask(taskId)
    if (!task) {
      throw new Error(`Task ${taskId} not found`)
    }

    switch (decision.action) {
      case 'do':
        // 立即执行 - 标记为进行中
        await this.tasksService.updateTask(taskId, {
          status: TaskStatus.IN_PROGRESS,
          contexts: decision.context ? [decision.context] : task.contexts,
          priority: decision.priority || task.priority
        })
        break

      case 'defer':
        // 推迟 - 设置截止日期并移到待办
        await this.tasksService.updateTask(taskId, {
          status: TaskStatus.TODO,
          dueDate: decision.dueDate,
          contexts: decision.context ? [decision.context] : task.contexts,
          priority: decision.priority || task.priority
        })
        break

      case 'delegate':
        // 委派 - 移到等待状态
        await this.tasksService.updateTask(taskId, {
          status: TaskStatus.WAITING,
          description: `${task.description || ''}\n\n委派给: ${decision.delegateTo || '未指定'}`,
          contexts: decision.context ? [decision.context] : task.contexts
        })
        break

      case 'delete':
        // 删除 - 不可执行的任务
        await this.tasksService.deleteTask(taskId)
        break

      case 'someday':
        // 将来/也许 - 移到将来也许列表
        await this.moveToSomeday(taskId)
        break

      case 'project':
        // 转为项目 - 创建项目并将任务作为第一个子任务
        if (this.projectsService) {
          const project = await this.projectsService.createProject({
            name: task.title,
            description: task.description
          })

          await this.tasksService.updateTask(taskId, {
            projectId: project.id,
            status: TaskStatus.TODO
          })
        }
        break

      case 'reference':
        // 参考资料 - 添加参考标签并归档
        await this.tasksService.updateTask(taskId, {
          status: TaskStatus.DONE,
          tags: [...task.tags, '参考资料'],
          completedAt: new Date()
        })
        break

      default:
        throw new Error(`Unknown GTD action: ${decision.action}`)
    }

    // 发送GTD决策事件
    if (this.coreAPI?.events) {
      this.coreAPI.events.emit('gtd:decision-made', {
        taskId,
        decision,
        task
      })
    }
  }

  // 组织系统

  async organizeTask(taskId: string, decision: GTDDecision): Promise<void> {
    await this.makeDecision(taskId, decision)
  }

  async moveToSomeday(taskId: string): Promise<void> {
    await this.tasksService.updateTask(taskId, {
      status: TaskStatus.SOMEDAY
    })
  }

  async moveToWaiting(taskId: string, waitingFor: string): Promise<void> {
    const task = await this.tasksService.getTask(taskId)
    if (task) {
      await this.tasksService.updateTask(taskId, {
        status: TaskStatus.WAITING,
        description: `${task.description || ''}\n\n等待: ${waitingFor}`
      })
    }
  }

  // 回顾系统

  async weeklyReview(): Promise<GTDReviewResult> {
    const [inboxTasks, overdueTasks, todayTasks, weekTasks, somedayTasks] = await Promise.all([
      this.getInboxTasks(),
      this.tasksService.getOverdueTasks(),
      this.tasksService.getTasksDueToday(),
      this.tasksService.getTasksDueThisWeek(),
      this.tasksService.getTasksByStatus(TaskStatus.SOMEDAY)
    ])

    const recommendations: string[] = []

    // 生成建议
    if (inboxTasks.length > 10) {
      recommendations.push(`收集箱有 ${inboxTasks.length} 个未处理项目，建议及时处理`)
    }
    if (overdueTasks.length > 0) {
      recommendations.push(`有 ${overdueTasks.length} 个过期任务需要关注`)
    }
    if (somedayTasks.length > 50) {
      recommendations.push(`"将来/也许" 列表过长，建议定期清理`)
    }

    return {
      inboxCount: inboxTasks.length,
      overdueCount: overdueTasks.length,
      todayCount: todayTasks.length,
      weekCount: weekTasks.length,
      somedayCount: somedayTasks.length,
      recommendations
    }
  }

  async dailyReview(): Promise<GTDReviewResult> {
    // 简化的日常回顾
    return this.weeklyReview()
  }

  // 执行系统

  async getNextActions(): Promise<Task[]> {
    // 获取可执行的下一步行动
    return this.tasksService.getTasks({
      status: [TaskStatus.TODO, TaskStatus.IN_PROGRESS]
    })
  }

  async getNextActionsByContext(context: string): Promise<Task[]> {
    return this.tasksService.getTasks({
      status: [TaskStatus.TODO, TaskStatus.IN_PROGRESS],
      contexts: [context]
    })
  }

  // 上下文管理

  async getAvailableContexts(): Promise<string[]> {
    const contexts = await this.tasksService.getContexts()
    return contexts.map(c => c.name)
  }

  async suggestContext(task: Task): Promise<string | null> {
    // 基于任务内容智能建议上下文
    const title = task.title.toLowerCase()
    const description = (task.description || '').toLowerCase()
    const content = `${title} ${description}`

    // 简单的关键词匹配
    if (content.includes('电话') || content.includes('打电话') || content.includes('联系')) {
      return '@电话'
    }
    if (content.includes('邮件') || content.includes('发送') || content.includes('回复')) {
      return '@电脑'
    }
    if (content.includes('购买') || content.includes('买') || content.includes('商店')) {
      return '@外出'
    }
    if (content.includes('会议') || content.includes('讨论') || content.includes('面谈')) {
      return '@会议'
    }
    if (content.includes('阅读') || content.includes('学习') || content.includes('研究')) {
      return '@阅读'
    }

    return null
  }

  // 辅助方法

  private isActionable(task: Task): boolean {
    // 更智能的可执行性判断
    const actionWords = [
      '做', '完成', '创建', '发送', '联系', '购买', '安装', '配置',
      '写', '读', '学', '买', '去', '打', '发', '看', '听', '说',
      '修复', '更新', '删除', '添加', '测试', '部署', '设计'
    ]
    const nonActionableWords = ['想法', '思考', '考虑', '也许', '可能', '研究一下', '了解']

    const content = `${task.title} ${task.description || ''}`.toLowerCase()

    // 检查非可执行关键词
    if (nonActionableWords.some(word => content.includes(word))) {
      return false
    }

    // 检查可执行关键词
    if (actionWords.some(word => content.includes(word))) {
      return true
    }

    // 检查是否是问句
    if (task.title.includes('?') || task.title.includes('？')) {
      return false
    }

    // 如果有明确的截止日期，通常是可执行的
    if (task.dueDate) {
      return true
    }

    // 默认认为是可执行的，除非明确标识为非可执行
    return task.title.length > 0
  }

  private isProject(task: Task): boolean {
    // 更智能的项目判断
    const projectIndicators = [
      '计划', '项目', '系统', '流程', '整理', '组织', '开发', '设计',
      '实现', '建立', '构建', '创建', '平台', '应用', '网站', '方案', '策略'
    ]

    const content = `${task.title} ${task.description || ''}`.toLowerCase()

    // 检查项目关键词
    const hasProjectKeyword = projectIndicators.some(indicator => content.includes(indicator))

    // 检查描述长度（复杂任务通常有详细描述）
    const hasDetailedDescription = task.description && task.description.length > 200

    // 检查预估时间（项目通常需要更长时间）
    const isLongTerm = task.estimatedTime && task.estimatedTime > 120 // 超过2小时

    // 检查是否包含多个步骤的描述
    const hasMultipleSteps = task.description && (
      task.description.includes('步骤') ||
      task.description.includes('阶段') ||
      task.description.includes('1.') ||
      task.description.includes('首先') ||
      task.description.includes('然后') ||
      task.description.includes('最后')
    )

    return hasProjectKeyword || hasDetailedDescription || isLongTerm || hasMultipleSteps || false
  }

  private estimateTime(task: Task): number {
    // 更智能的时间估算（分钟）
    let estimatedTime = 30 // 基础时间30分钟

    const content = `${task.title} ${task.description || ''}`

    // 基于内容长度调整
    if (content.length < 50) {
      estimatedTime = 15  // 简单任务
    } else if (content.length < 150) {
      estimatedTime = 30  // 中等任务
    } else if (content.length < 300) {
      estimatedTime = 60  // 复杂任务
    } else {
      estimatedTime = 120 // 大型任务
    }

    // 基于优先级调整
    switch (task.priority) {
      case TaskPriority.URGENT:
        estimatedTime *= 0.8 // 紧急任务通常更简单直接
        break
      case TaskPriority.HIGH:
        estimatedTime *= 1.0
        break
      case TaskPriority.MEDIUM:
        estimatedTime *= 1.2
        break
      case TaskPriority.LOW:
        estimatedTime *= 1.5
        break
    }

    // 基于上下文调整
    if (task.contexts.includes('@电脑')) {
      estimatedTime *= 1.3 // 电脑任务通常更复杂
    }
    if (task.contexts.includes('@电话')) {
      estimatedTime *= 0.7 // 电话任务通常较快
    }
    if (task.contexts.includes('@外出')) {
      estimatedTime *= 1.5 // 外出任务包含路程时间
    }

    // 基于任务类型关键词调整
    const quickTasks = ['打电话', '发邮件', '发短信', '查看', '确认']
    const slowTasks = ['写报告', '分析', '设计', '开发', '学习', '研究']

    if (quickTasks.some(keyword => content.includes(keyword))) {
      estimatedTime *= 0.5
    }
    if (slowTasks.some(keyword => content.includes(keyword))) {
      estimatedTime *= 2.0
    }

    return Math.round(Math.min(estimatedTime, 480)) // 最多8小时
  }

  private suggestPriority(task: Task): TaskPriority {
    // 基于任务内容建议优先级
    const content = `${task.title} ${task.description || ''}`.toLowerCase()
    
    if (content.includes('紧急') || content.includes('立即') || content.includes('马上')) {
      return TaskPriority.URGENT
    }
    if (content.includes('重要') || content.includes('关键') || content.includes('必须')) {
      return TaskPriority.HIGH
    }
    if (content.includes('可选') || content.includes('有空') || content.includes('闲时')) {
      return TaskPriority.LOW
    }
    
    return TaskPriority.MEDIUM
  }
}
