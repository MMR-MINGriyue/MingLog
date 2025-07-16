/**
 * 幕布-任务管理集成服务
 * 实现幕布编辑器与任务管理模块的深度集成
 */

import { EventEmitter } from 'events'
// import { CustomElement } from '@minglog/editor' // 模块不存在，暂时注释

// 临时类型定义
interface CustomElement {
  id: string
  type: string
  content?: string
  children?: CustomElement[]
  metadata?: Record<string, any>
  [key: string]: any
}
import { CrossModuleEventBus, EventType } from './CrossModuleEventBus'
import { EnhancedCrossModuleLinkService, LinkType } from './EnhancedCrossModuleLinkService'
import { EntityType } from './DataAssociationService'

// 任务状态枚举
export enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done',
  CANCELLED = 'cancelled',
  ON_HOLD = 'on_hold'
}

// 任务优先级
export enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

// 任务接口
export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  dueDate?: Date
  assignee?: string
  tags: string[]
  parentTaskId?: string
  subtasks: Task[]
  estimatedTime?: number        // 预估时间（分钟）
  actualTime?: number          // 实际时间（分钟）
  progress: number             // 进度百分比
  dependencies: string[]       // 依赖的任务ID
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

// 项目接口
export interface Project {
  id: string
  name: string
  description?: string
  status: 'active' | 'completed' | 'archived'
  tasks: Task[]
  startDate?: Date
  endDate?: Date
  progress: number
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

// 幕布块到任务的转换配置
export interface TaskConversionConfig {
  autoDetectTasks: boolean        // 自动检测任务
  taskIndicators: string[]        // 任务指示符（如 "TODO:", "[ ]"）
  preserveHierarchy: boolean      // 保持层级结构
  inheritPriority: boolean        // 继承父级优先级
  autoSetDueDate: boolean         // 自动设置截止日期
  defaultPriority: TaskPriority   // 默认优先级
  createSubtasks: boolean         // 创建子任务
  linkToSource: boolean           // 链接到源文档
}

// 任务提取结果
export interface TaskExtractionResult {
  tasks: Task[]
  projects: Project[]
  totalTasks: number
  completedTasks: number
  extractionTime: number
  warnings: string[]
}

// GTD工作流集成
export interface GTDWorkflow {
  inbox: Task[]                   // 收集箱
  nextActions: Task[]             // 下一步行动
  waitingFor: Task[]              // 等待
  someday: Task[]                 // 将来/也许
  projects: Project[]             // 项目
  contexts: { [key: string]: Task[] } // 情境
}

/**
 * 幕布-任务管理集成服务
 */
export class MubuTaskIntegration extends EventEmitter {
  private taskCache: Map<string, Task> = new Map()
  private projectCache: Map<string, Project> = new Map()
  private defaultConfig: TaskConversionConfig

  constructor(
    private eventBus: CrossModuleEventBus,
    private linkService: EnhancedCrossModuleLinkService
  ) {
    super()
    
    this.defaultConfig = {
      autoDetectTasks: true,
      taskIndicators: ['TODO:', '[ ]', '[x]', '- [ ]', '- [x]', '□', '☑'],
      preserveHierarchy: true,
      inheritPriority: true,
      autoSetDueDate: false,
      defaultPriority: TaskPriority.MEDIUM,
      createSubtasks: true,
      linkToSource: true
    }

    this.setupEventListeners()
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    // 监听幕布编辑器变更
    this.eventBus.on(EventType.NOTE_UPDATED, this.handleMubuChange.bind(this))
    
    // 监听任务变更
    this.eventBus.on(EventType.TASK_CREATED, this.handleTaskChange.bind(this))
    this.eventBus.on(EventType.TASK_UPDATED, this.handleTaskChange.bind(this))
    this.eventBus.on(EventType.TASK_DELETED, this.handleTaskChange.bind(this))
  }

  /**
   * 从幕布块中提取任务
   */
  async extractTasksFromMubu(
    mubuBlocks: CustomElement[],
    config: Partial<TaskConversionConfig> = {}
  ): Promise<TaskExtractionResult> {
    const startTime = Date.now()
    const finalConfig = { ...this.defaultConfig, ...config }
    const warnings: string[] = []

    try {
      // 1. 识别任务块
      const taskBlocks = this.identifyTaskBlocks(mubuBlocks, finalConfig, warnings)

      // 2. 转换为任务对象
      const tasks = await this.convertBlocksToTasks(taskBlocks, finalConfig, warnings)

      // 3. 构建层级关系
      this.buildTaskHierarchy(tasks, finalConfig)

      // 4. 提取项目
      const projects = this.extractProjects(tasks, mubuBlocks)

      // 5. 创建跨模块链接
      if (finalConfig.linkToSource) {
        await this.createTaskLinks(tasks, mubuBlocks)
      }

      const result: TaskExtractionResult = {
        tasks,
        projects,
        totalTasks: tasks.length,
        completedTasks: tasks.filter(t => t.status === TaskStatus.DONE).length,
        extractionTime: Date.now() - startTime,
        warnings
      }

      // 缓存任务
      tasks.forEach(task => this.taskCache.set(task.id, task))
      projects.forEach(project => this.projectCache.set(project.id, project))

      // 发送事件
      this.emit('tasks:extracted', result)

      return result

    } catch (error) {
      this.emit('extraction:error', { error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  }

  /**
   * 将任务转换为幕布块结构
   */
  async convertTasksToMubu(
    tasks: Task[],
    config: Partial<TaskConversionConfig> = {}
  ): Promise<CustomElement[]> {
    const finalConfig = { ...this.defaultConfig, ...config }

    try {
      // 1. 排序任务（按优先级和层级）
      const sortedTasks = this.sortTasks(tasks)

      // 2. 转换为幕布块
      const mubuBlocks = this.convertTasksToBlocks(sortedTasks, finalConfig)

      // 3. 应用幕布特定格式
      this.applyMubuTaskFormatting(mubuBlocks)

      // 发送事件
      this.emit('tasks:converted', { tasks, blocks: mubuBlocks })

      return mubuBlocks

    } catch (error) {
      this.emit('conversion:error', { error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  }

  /**
   * 创建GTD工作流视图
   */
  async createGTDWorkflow(tasks: Task[]): Promise<GTDWorkflow> {
    const workflow: GTDWorkflow = {
      inbox: [],
      nextActions: [],
      waitingFor: [],
      someday: [],
      projects: [],
      contexts: {}
    }

    // 分类任务
    for (const task of tasks) {
      // 收集箱：新创建且未分类的任务
      if (this.isInboxTask(task)) {
        workflow.inbox.push(task)
      }
      // 下一步行动：可立即执行的任务
      else if (this.isNextAction(task)) {
        workflow.nextActions.push(task)
      }
      // 等待：依赖他人的任务
      else if (this.isWaitingFor(task)) {
        workflow.waitingFor.push(task)
      }
      // 将来/也许：暂时不需要行动的任务
      else if (this.isSomedayTask(task)) {
        workflow.someday.push(task)
      }

      // 按情境分类
      const context = this.extractContext(task)
      if (context) {
        if (!workflow.contexts[context]) {
          workflow.contexts[context] = []
        }
        workflow.contexts[context].push(task)
      }
    }

    // 提取项目
    workflow.projects = Array.from(this.projectCache.values())

    return workflow
  }

  /**
   * 智能任务建议
   */
  async suggestTaskOptimizations(tasks: Task[]): Promise<{
    suggestions: Array<{
      type: 'priority' | 'deadline' | 'dependency' | 'breakdown'
      taskId: string
      suggestion: string
      confidence: number
    }>
    workloadAnalysis: {
      totalEstimatedTime: number
      overdueTasks: number
      highPriorityTasks: number
      bottlenecks: string[]
    }
  }> {
    const suggestions: any[] = []
    
    // 分析任务并生成建议
    for (const task of tasks) {
      // 优先级建议
      if (this.shouldAdjustPriority(task)) {
        suggestions.push({
          type: 'priority',
          taskId: task.id,
          suggestion: '建议提高优先级，因为截止日期临近',
          confidence: 0.8
        })
      }

      // 分解建议
      if (this.shouldBreakDown(task)) {
        suggestions.push({
          type: 'breakdown',
          taskId: task.id,
          suggestion: '任务较复杂，建议分解为子任务',
          confidence: 0.7
        })
      }

      // 依赖建议
      const dependencyIssues = this.analyzeDependencies(task, tasks)
      if (dependencyIssues.length > 0) {
        suggestions.push({
          type: 'dependency',
          taskId: task.id,
          suggestion: `发现依赖问题：${dependencyIssues.join(', ')}`,
          confidence: 0.9
        })
      }
    }

    // 工作负载分析
    const workloadAnalysis = {
      totalEstimatedTime: tasks.reduce((sum, task) => sum + (task.estimatedTime || 0), 0),
      overdueTasks: tasks.filter(task => 
        task.dueDate && task.dueDate < new Date() && task.status !== TaskStatus.DONE
      ).length,
      highPriorityTasks: tasks.filter(task => 
        task.priority === TaskPriority.HIGH || task.priority === TaskPriority.URGENT
      ).length,
      bottlenecks: this.identifyBottlenecks(tasks)
    }

    return { suggestions, workloadAnalysis }
  }

  /**
   * 自动任务调度
   */
  async scheduleTasksOptimally(tasks: Task[]): Promise<{
    schedule: Array<{
      taskId: string
      suggestedStartTime: Date
      suggestedDuration: number
      reasoning: string
    }>
    conflicts: Array<{
      taskIds: string[]
      conflictType: 'time' | 'resource' | 'dependency'
      resolution: string
    }>
  }> {
    const schedule: any[] = []
    const conflicts: any[] = []

    // 按优先级和依赖关系排序
    const sortedTasks = this.topologicalSort(tasks)

    let currentTime = new Date()

    for (const task of sortedTasks) {
      // 计算最早开始时间
      const earliestStart = this.calculateEarliestStart(task, schedule)
      
      // 检查冲突
      const taskConflicts = this.detectScheduleConflicts(task, schedule, earliestStart)
      
      if (taskConflicts.length > 0) {
        conflicts.push(...taskConflicts)
        // 调整时间以避免冲突
        currentTime = this.resolveTimeConflicts(earliestStart, taskConflicts)
      } else {
        currentTime = earliestStart
      }

      schedule.push({
        taskId: task.id,
        suggestedStartTime: currentTime,
        suggestedDuration: task.estimatedTime || 60,
        reasoning: this.generateScheduleReasoning(task, currentTime)
      })

      // 更新当前时间
      currentTime = new Date(currentTime.getTime() + (task.estimatedTime || 60) * 60000)
    }

    return { schedule, conflicts }
  }

  // 私有辅助方法
  private identifyTaskBlocks(
    blocks: CustomElement[],
    config: TaskConversionConfig,
    warnings: string[]
  ): CustomElement[] {
    if (!config.autoDetectTasks) {
      return blocks.filter(block => this.hasTaskIndicator(block, config.taskIndicators))
    }

    return blocks.filter(block => {
      // 检查任务指示符
      if (this.hasTaskIndicator(block, config.taskIndicators)) {
        return true
      }

      // 智能检测：基于内容模式
      const content = this.extractBlockText(block)
      if (this.looksLikeTask(content)) {
        warnings.push(`自动检测到任务：${content.substring(0, 50)}...`)
        return true
      }

      return false
    })
  }

  private hasTaskIndicator(block: CustomElement, indicators: string[]): boolean {
    const content = this.extractBlockText(block)
    return indicators.some(indicator => content.includes(indicator))
  }

  private looksLikeTask(content: string): boolean {
    // 智能任务检测逻辑
    const taskPatterns = [
      /^(完成|做|处理|解决|实现|开发|设计|测试|修复)/,
      /\b(需要|要|应该|必须)\b.*\b(完成|做|处理)/,
      /\b(截止|deadline|due)\b/i,
      /\b(优先级|priority)\b/i
    ]

    return taskPatterns.some(pattern => pattern.test(content))
  }

  private async convertBlocksToTasks(
    blocks: CustomElement[],
    config: TaskConversionConfig,
    warnings: string[]
  ): Promise<Task[]> {
    const tasks: Task[] = []

    for (const block of blocks) {
      try {
        const task = await this.blockToTask(block, config)
        tasks.push(task)
      } catch (error) {
        warnings.push(`转换块 ${block.id} 时出错：${error instanceof Error ? error.message : String(error)}`)
      }
    }

    return tasks
  }

  private async blockToTask(block: CustomElement, config: TaskConversionConfig): Promise<Task> {
    const content = this.extractBlockText(block)
    
    // 解析任务状态
    const status = this.parseTaskStatus(content)
    
    // 解析优先级
    const priority = this.parseTaskPriority(content) || config.defaultPriority
    
    // 解析截止日期
    const dueDate = config.autoSetDueDate ? this.parseTaskDueDate(content) : undefined
    
    // 提取标签
    const tags = this.extractTaskTags(content)
    
    // 清理标题
    const title = this.cleanTaskTitle(content)

    return {
      id: block.id,
      title,
      description: content !== title ? content : undefined,
      status,
      priority,
      dueDate,
      tags,
      parentTaskId: block.parentId,
      subtasks: [],
      progress: status === TaskStatus.DONE ? 100 : 0,
      dependencies: [],
      metadata: {
        sourceBlockId: block.id,
        level: block.level || 0
      },
      createdAt: new Date(block.createdAt || Date.now()),
      updatedAt: new Date(block.updatedAt || Date.now())
    }
  }

  private extractBlockText(block: CustomElement): string {
    return block.children
      .filter(child => 'text' in child)
      .map(child => (child as any).text)
      .join('')
  }

  private parseTaskStatus(content: string): TaskStatus {
    if (content.includes('[x]') || content.includes('☑')) {
      return TaskStatus.DONE
    }
    if (content.includes('[ ]') || content.includes('□')) {
      return TaskStatus.TODO
    }
    if (content.includes('进行中') || content.includes('in progress')) {
      return TaskStatus.IN_PROGRESS
    }
    return TaskStatus.TODO
  }

  private parseTaskPriority(content: string): TaskPriority | null {
    const lowerContent = content.toLowerCase()
    if (lowerContent.includes('urgent') || lowerContent.includes('紧急')) {
      return TaskPriority.URGENT
    }
    if (lowerContent.includes('high') || lowerContent.includes('高')) {
      return TaskPriority.HIGH
    }
    if (lowerContent.includes('low') || lowerContent.includes('低')) {
      return TaskPriority.LOW
    }
    return null
  }

  private parseTaskDueDate(content: string): Date | undefined {
    // 简单的日期解析
    const datePattern = /(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})/
    const match = content.match(datePattern)
    return match ? new Date(match[1]) : undefined
  }

  private extractTaskTags(content: string): string[] {
    const tagPattern = /#(\w+)/g
    const matches = content.match(tagPattern)
    return matches ? matches.map(tag => tag.substring(1)) : []
  }

  private cleanTaskTitle(content: string): string {
    // 移除任务指示符和标签，保留核心标题
    return content
      .replace(/^\s*[-*]\s*\[[ x]\]\s*/, '')
      .replace(/TODO:\s*/i, '')
      .replace(/#\w+/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  private buildTaskHierarchy(tasks: Task[], config: TaskConversionConfig): void {
    if (!config.preserveHierarchy) return

    const taskMap = new Map(tasks.map(task => [task.id, task]))

    for (const task of tasks) {
      if (task.parentTaskId) {
        const parent = taskMap.get(task.parentTaskId)
        if (parent) {
          parent.subtasks.push(task)
        }
      }
    }
  }

  private extractProjects(tasks: Task[], mubuBlocks: CustomElement[]): Project[] {
    // 基于任务层级和结构提取项目
    const projects: Project[] = []
    const rootTasks = tasks.filter(task => !task.parentTaskId)

    for (const rootTask of rootTasks) {
      if (rootTask.subtasks.length > 0) {
        const project: Project = {
          id: `project_${rootTask.id}`,
          name: rootTask.title,
          description: rootTask.description,
          status: 'active',
          tasks: [rootTask, ...this.getAllSubtasks(rootTask)],
          progress: this.calculateProjectProgress(rootTask),
          createdAt: rootTask.createdAt,
          updatedAt: rootTask.updatedAt
        }
        projects.push(project)
      }
    }

    return projects
  }

  private getAllSubtasks(task: Task): Task[] {
    const allSubtasks: Task[] = []
    for (const subtask of task.subtasks) {
      allSubtasks.push(subtask)
      allSubtasks.push(...this.getAllSubtasks(subtask))
    }
    return allSubtasks
  }

  private calculateProjectProgress(rootTask: Task): number {
    const allTasks = [rootTask, ...this.getAllSubtasks(rootTask)]
    const completedTasks = allTasks.filter(task => task.status === TaskStatus.DONE)
    return allTasks.length > 0 ? (completedTasks.length / allTasks.length) * 100 : 0
  }

  private async createTaskLinks(tasks: Task[], mubuBlocks: CustomElement[]): Promise<void> {
    for (const task of tasks) {
      const sourceBlock = mubuBlocks.find(block => block.id === task.id)
      if (sourceBlock) {
        await this.linkService.createEnhancedLink(
          sourceBlock.id,
          task.id,
          LinkType.BIDIRECTIONAL,
          {
            context: 'mubu-task-integration',
            tags: ['task', 'mubu']
          }
        )
      }
    }
  }

  // GTD 相关方法
  private isInboxTask(task: Task): boolean {
    return !task.parentTaskId && task.status === TaskStatus.TODO && !task.dueDate
  }

  private isNextAction(task: Task): boolean {
    return task.status === TaskStatus.TODO && task.dependencies.length === 0
  }

  private isWaitingFor(task: Task): boolean {
    return task.status === TaskStatus.ON_HOLD || task.dependencies.length > 0
  }

  private isSomedayTask(task: Task): boolean {
    return task.tags.includes('someday') || task.tags.includes('maybe')
  }

  private extractContext(task: Task): string | null {
    const contextTags = task.tags.filter(tag => tag.startsWith('@'))
    return contextTags.length > 0 ? contextTags[0] : null
  }

  // 优化建议相关方法
  private shouldAdjustPriority(task: Task): boolean {
    if (!task.dueDate) return false
    const daysUntilDue = (task.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    return daysUntilDue <= 3 && task.priority !== TaskPriority.HIGH
  }

  private shouldBreakDown(task: Task): boolean {
    return (task.estimatedTime || 0) > 240 && task.subtasks.length === 0 // 超过4小时且无子任务
  }

  private analyzeDependencies(task: Task, allTasks: Task[]): string[] {
    const issues: string[] = []
    
    for (const depId of task.dependencies) {
      const depTask = allTasks.find(t => t.id === depId)
      if (!depTask) {
        issues.push(`依赖任务 ${depId} 不存在`)
      } else if (depTask.status !== TaskStatus.DONE && task.status === TaskStatus.IN_PROGRESS) {
        issues.push(`依赖任务 "${depTask.title}" 尚未完成`)
      }
    }

    return issues
  }

  private identifyBottlenecks(tasks: Task[]): string[] {
    // 识别瓶颈任务（被多个任务依赖且未完成）
    const dependencyCounts = new Map<string, number>()
    
    for (const task of tasks) {
      for (const depId of task.dependencies) {
        dependencyCounts.set(depId, (dependencyCounts.get(depId) || 0) + 1)
      }
    }

    const bottlenecks: string[] = []
    for (const [taskId, count] of dependencyCounts) {
      if (count >= 3) { // 被3个或更多任务依赖
        const task = tasks.find(t => t.id === taskId)
        if (task && task.status !== TaskStatus.DONE) {
          bottlenecks.push(task.title)
        }
      }
    }

    return bottlenecks
  }

  // 调度相关方法
  private topologicalSort(tasks: Task[]): Task[] {
    // 拓扑排序，确保依赖任务在前
    const visited = new Set<string>()
    const result: Task[] = []
    const taskMap = new Map(tasks.map(task => [task.id, task]))

    const visit = (task: Task) => {
      if (visited.has(task.id)) return
      visited.add(task.id)

      // 先访问依赖任务
      for (const depId of task.dependencies) {
        const depTask = taskMap.get(depId)
        if (depTask) visit(depTask)
      }

      result.push(task)
    }

    for (const task of tasks) {
      visit(task)
    }

    return result
  }

  private calculateEarliestStart(task: Task, schedule: any[]): Date {
    // 计算任务的最早开始时间
    let earliestStart = new Date()

    // 考虑依赖任务的完成时间
    for (const depId of task.dependencies) {
      const depSchedule = schedule.find(s => s.taskId === depId)
      if (depSchedule) {
        const depEndTime = new Date(
          depSchedule.suggestedStartTime.getTime() + depSchedule.suggestedDuration * 60000
        )
        if (depEndTime > earliestStart) {
          earliestStart = depEndTime
        }
      }
    }

    return earliestStart
  }

  private detectScheduleConflicts(task: Task, schedule: any[], startTime: Date): any[] {
    // 检测调度冲突
    return []
  }

  private resolveTimeConflicts(originalTime: Date, conflicts: any[]): Date {
    // 解决时间冲突
    return originalTime
  }

  private generateScheduleReasoning(task: Task, startTime: Date): string {
    return `基于优先级 ${task.priority} 和依赖关系安排`
  }

  private sortTasks(tasks: Task[]): Task[] {
    return tasks.sort((a, b) => {
      // 按优先级排序
      const priorityOrder = {
        [TaskPriority.URGENT]: 4,
        [TaskPriority.HIGH]: 3,
        [TaskPriority.MEDIUM]: 2,
        [TaskPriority.LOW]: 1
      }
      
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
      if (priorityDiff !== 0) return priorityDiff

      // 按截止日期排序
      if (a.dueDate && b.dueDate) {
        return a.dueDate.getTime() - b.dueDate.getTime()
      }
      if (a.dueDate) return -1
      if (b.dueDate) return 1

      return 0
    })
  }

  private convertTasksToBlocks(tasks: Task[], config: TaskConversionConfig): CustomElement[] {
    return tasks.map(task => this.taskToBlock(task, config))
  }

  private taskToBlock(task: Task, config: TaskConversionConfig): CustomElement {
    // 构建任务文本
    let text = ''
    
    // 添加状态指示符
    if (task.status === TaskStatus.DONE) {
      text += '[x] '
    } else {
      text += '[ ] '
    }

    // 添加标题
    text += task.title

    // 添加优先级
    if (task.priority !== TaskPriority.MEDIUM) {
      text += ` [${task.priority}]`
    }

    // 添加截止日期
    if (task.dueDate) {
      text += ` (截止: ${task.dueDate.toLocaleDateString()})`
    }

    // 添加标签
    if (task.tags.length > 0) {
      text += ` ${task.tags.map(tag => `#${tag}`).join(' ')}`
    }

    return {
      id: task.id,
      type: 'paragraph',
      level: this.calculateTaskLevel(task),
      parentId: task.parentTaskId,
      children: [{
        id: `text-${task.id}`,
        type: 'text',
        text
      }],
      metadata: {
        isTask: true,
        taskStatus: task.status,
        taskPriority: task.priority,
        ...task.metadata
      },
      createdAt: task.createdAt.toISOString(),
      updatedAt: task.updatedAt.toISOString()
    }
  }

  private calculateTaskLevel(task: Task): number {
    return task.metadata?.level || 0
  }

  private applyMubuTaskFormatting(blocks: CustomElement[]): void {
    // 应用幕布任务特定格式
    blocks.forEach(block => {
      if (!block.metadata) block.metadata = {}
      
      block.metadata.isMubuTask = true
      block.metadata.hasSubtasks = blocks.some(b => b.parentId === block.id)
    })
  }

  private async handleMubuChange(event: any): Promise<void> {
    // 处理幕布变更，自动更新相关任务
  }

  private async handleTaskChange(event: any): Promise<void> {
    // 处理任务变更，自动更新相关幕布内容
  }
}

export default MubuTaskIntegration
