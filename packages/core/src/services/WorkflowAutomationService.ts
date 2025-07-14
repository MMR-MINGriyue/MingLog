/**
 * 工作流自动化服务
 * 提供规则引擎、任务自动化、智能提醒和工作流模板功能
 */

import { EventEmitter } from 'events'
import { EntityType } from './DataAssociationService'

// 触发器类型
export enum TriggerType {
  TIME_BASED = 'time_based',           // 基于时间
  EVENT_BASED = 'event_based',         // 基于事件
  CONDITION_BASED = 'condition_based', // 基于条件
  MANUAL = 'manual'                    // 手动触发
}

// 动作类型
export enum ActionType {
  CREATE_TASK = 'create_task',
  UPDATE_ENTITY = 'update_entity',
  SEND_NOTIFICATION = 'send_notification',
  EXECUTE_SCRIPT = 'execute_script',
  SEND_EMAIL = 'send_email',
  CREATE_NOTE = 'create_note',
  TAG_ENTITY = 'tag_entity',
  MOVE_ENTITY = 'move_entity',
  ARCHIVE_ENTITY = 'archive_entity'
}

// 条件操作符
export enum ConditionOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  IS_EMPTY = 'is_empty',
  IS_NOT_EMPTY = 'is_not_empty',
  IN_LIST = 'in_list',
  NOT_IN_LIST = 'not_in_list'
}

// 工作流状态
export enum WorkflowStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PAUSED = 'paused',
  ERROR = 'error'
}

// 执行状态
export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// 触发器配置
export interface TriggerConfig {
  id: string
  type: TriggerType
  name: string
  description: string
  config: {
    // 时间触发器
    schedule?: {
      type: 'interval' | 'cron' | 'once'
      value: string // 间隔时间或cron表达式
      timezone?: string
    }
    // 事件触发器
    event?: {
      type: string
      source?: string
      filters?: Record<string, any>
    }
    // 条件触发器
    conditions?: WorkflowCondition[]
  }
  enabled: boolean
}

// 工作流条件
export interface WorkflowCondition {
  id: string
  field: string
  operator: ConditionOperator
  value: any
  entityType?: EntityType
  logicalOperator?: 'AND' | 'OR'
}

// 动作配置
export interface ActionConfig {
  id: string
  type: ActionType
  name: string
  description: string
  config: {
    // 创建任务
    task?: {
      title: string
      description?: string
      priority?: string
      dueDate?: string
      assignee?: string
      project?: string
    }
    // 更新实体
    update?: {
      entityType: EntityType
      entityId?: string
      fields: Record<string, any>
    }
    // 发送通知
    notification?: {
      title: string
      message: string
      type: 'info' | 'success' | 'warning' | 'error'
      recipients?: string[]
      channels?: ('app' | 'email' | 'sms')[]
    }
    // 执行脚本
    script?: {
      language: 'javascript' | 'python'
      code: string
      timeout?: number
    }
    // 发送邮件
    email?: {
      to: string[]
      cc?: string[]
      bcc?: string[]
      subject: string
      body: string
      attachments?: string[]
    }
    // 标签操作
    tag?: {
      entityType: EntityType
      entityId?: string
      tags: string[]
      action: 'add' | 'remove' | 'replace'
    }
  }
  enabled: boolean
  retryConfig?: {
    maxRetries: number
    retryDelay: number
    backoffMultiplier: number
  }
}

// 工作流定义
export interface WorkflowDefinition {
  id: string
  name: string
  description: string
  version: string
  status: WorkflowStatus
  triggers: TriggerConfig[]
  actions: ActionConfig[]
  conditions?: WorkflowCondition[]
  settings: {
    maxExecutions?: number
    executionTimeout?: number
    errorHandling: 'stop' | 'continue' | 'retry'
    logging: boolean
    notifications: boolean
  }
  metadata: {
    createdAt: Date
    updatedAt: Date
    createdBy: string
    tags: string[]
    category: string
  }
}

// 工作流执行记录
export interface WorkflowExecution {
  id: string
  workflowId: string
  status: ExecutionStatus
  triggeredBy: {
    type: TriggerType
    triggerId: string
    data?: any
  }
  startTime: Date
  endTime?: Date
  duration?: number
  steps: ExecutionStep[]
  result?: any
  error?: string
  logs: ExecutionLog[]
}

// 执行步骤
export interface ExecutionStep {
  id: string
  actionId: string
  status: ExecutionStatus
  startTime: Date
  endTime?: Date
  duration?: number
  input?: any
  output?: any
  error?: string
}

// 执行日志
export interface ExecutionLog {
  timestamp: Date
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  data?: any
}

// 工作流模板
export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: string
  tags: string[]
  definition: Omit<WorkflowDefinition, 'id' | 'metadata'>
  variables: Array<{
    name: string
    type: 'string' | 'number' | 'boolean' | 'date'
    description: string
    defaultValue?: any
    required: boolean
  }>
  isBuiltIn: boolean
}

// 智能提醒配置
export interface SmartReminderConfig {
  id: string
  name: string
  description: string
  entityType: EntityType
  conditions: WorkflowCondition[]
  reminderSettings: {
    advanceTime: number // 提前时间（分钟）
    repeatInterval?: number // 重复间隔（分钟）
    maxRepeats?: number // 最大重复次数
    escalation?: {
      enabled: boolean
      escalateAfter: number // 升级时间（分钟）
      escalateTo: string[] // 升级接收者
    }
  }
  notificationConfig: {
    title: string
    message: string
    channels: ('app' | 'email' | 'sms')[]
    priority: 'low' | 'normal' | 'high' | 'urgent'
  }
  enabled: boolean
}

/**
 * 工作流自动化服务实现
 */
export class WorkflowAutomationService extends EventEmitter {
  private workflows: Map<string, WorkflowDefinition> = new Map()
  private executions: Map<string, WorkflowExecution> = new Map()
  private templates: Map<string, WorkflowTemplate> = new Map()
  private reminders: Map<string, SmartReminderConfig> = new Map()
  private activeTimers: Map<string, NodeJS.Timeout> = new Map()
  private isRunning = false

  constructor(private coreAPI?: any) {
    super()
    this.initializeBuiltInTemplates()
  }

  /**
   * 启动工作流引擎
   */
  async start(): Promise<void> {
    if (this.isRunning) return

    this.isRunning = true
    
    // 启动所有活跃的工作流
    for (const workflow of this.workflows.values()) {
      if (workflow.status === WorkflowStatus.ACTIVE) {
        await this.startWorkflow(workflow.id)
      }
    }

    this.emit('engine:started')
    console.log('工作流自动化引擎已启动')
  }

  /**
   * 停止工作流引擎
   */
  async stop(): Promise<void> {
    if (!this.isRunning) return

    this.isRunning = false

    // 清理所有定时器
    for (const timer of this.activeTimers.values()) {
      clearTimeout(timer)
    }
    this.activeTimers.clear()

    this.emit('engine:stopped')
    console.log('工作流自动化引擎已停止')
  }

  /**
   * 创建工作流
   */
  async createWorkflow(definition: Omit<WorkflowDefinition, 'id' | 'metadata'>): Promise<string> {
    const workflowId = this.generateId()
    
    const workflow: WorkflowDefinition = {
      ...definition,
      id: workflowId,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'system', // 实际中应该是当前用户
        tags: definition.metadata?.tags || [],
        category: definition.metadata?.category || 'general'
      }
    }

    this.workflows.set(workflowId, workflow)

    // 如果工作流是活跃状态且引擎正在运行，启动工作流
    if (workflow.status === WorkflowStatus.ACTIVE && this.isRunning) {
      await this.startWorkflow(workflowId)
    }

    this.emit('workflow:created', { workflowId, workflow })
    return workflowId
  }

  /**
   * 更新工作流
   */
  async updateWorkflow(workflowId: string, updates: Partial<WorkflowDefinition>): Promise<void> {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) {
      throw new Error(`工作流不存在: ${workflowId}`)
    }

    // 停止现有工作流
    await this.stopWorkflow(workflowId)

    // 更新工作流
    const updatedWorkflow = {
      ...workflow,
      ...updates,
      metadata: {
        ...workflow.metadata,
        updatedAt: new Date()
      }
    }

    this.workflows.set(workflowId, updatedWorkflow)

    // 如果更新后的工作流是活跃状态，重新启动
    if (updatedWorkflow.status === WorkflowStatus.ACTIVE && this.isRunning) {
      await this.startWorkflow(workflowId)
    }

    this.emit('workflow:updated', { workflowId, workflow: updatedWorkflow })
  }

  /**
   * 删除工作流
   */
  async deleteWorkflow(workflowId: string): Promise<void> {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) {
      throw new Error(`工作流不存在: ${workflowId}`)
    }

    // 停止工作流
    await this.stopWorkflow(workflowId)

    // 删除工作流
    this.workflows.delete(workflowId)

    this.emit('workflow:deleted', { workflowId })
  }

  /**
   * 获取工作流
   */
  getWorkflow(workflowId: string): WorkflowDefinition | null {
    return this.workflows.get(workflowId) || null
  }

  /**
   * 获取所有工作流
   */
  getAllWorkflows(): WorkflowDefinition[] {
    return Array.from(this.workflows.values())
  }

  /**
   * 手动执行工作流
   */
  async executeWorkflow(workflowId: string, triggerData?: any): Promise<string> {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) {
      throw new Error(`工作流不存在: ${workflowId}`)
    }

    const executionId = this.generateId()
    const execution: WorkflowExecution = {
      id: executionId,
      workflowId,
      status: ExecutionStatus.PENDING,
      triggeredBy: {
        type: TriggerType.MANUAL,
        triggerId: 'manual',
        data: triggerData
      },
      startTime: new Date(),
      steps: [],
      logs: []
    }

    this.executions.set(executionId, execution)

    // 异步执行工作流
    this.executeWorkflowAsync(execution).catch(error => {
      console.error(`工作流执行失败 (${executionId}):`, error)
    })

    return executionId
  }

  /**
   * 获取执行记录
   */
  getExecution(executionId: string): WorkflowExecution | null {
    return this.executions.get(executionId) || null
  }

  /**
   * 获取工作流的执行历史
   */
  getWorkflowExecutions(workflowId: string, limit: number = 50): WorkflowExecution[] {
    return Array.from(this.executions.values())
      .filter(execution => execution.workflowId === workflowId)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, limit)
  }

  /**
   * 从模板创建工作流
   */
  async createWorkflowFromTemplate(
    templateId: string,
    name: string,
    variables: Record<string, any>
  ): Promise<string> {
    const template = this.templates.get(templateId)
    if (!template) {
      throw new Error(`工作流模板不存在: ${templateId}`)
    }

    // 替换模板变量
    const definition = this.replaceTemplateVariables(template.definition, variables)

    return this.createWorkflow({
      ...definition,
      name,
      metadata: {
        ...definition.metadata,
        tags: [...(definition.metadata?.tags || []), 'from-template', templateId]
      }
    })
  }

  /**
   * 获取工作流模板
   */
  getWorkflowTemplates(category?: string): WorkflowTemplate[] {
    const templates = Array.from(this.templates.values())
    
    if (category) {
      return templates.filter(template => template.category === category)
    }
    
    return templates
  }

  /**
   * 创建智能提醒
   */
  async createSmartReminder(config: Omit<SmartReminderConfig, 'id'>): Promise<string> {
    const reminderId = this.generateId()
    const reminder: SmartReminderConfig = {
      ...config,
      id: reminderId
    }

    this.reminders.set(reminderId, reminder)

    // 如果提醒已启用，开始监控
    if (reminder.enabled) {
      await this.startReminderMonitoring(reminderId)
    }

    this.emit('reminder:created', { reminderId, reminder })
    return reminderId
  }

  /**
   * 获取智能提醒
   */
  getSmartReminders(): SmartReminderConfig[] {
    return Array.from(this.reminders.values())
  }

  /**
   * 获取工作流统计
   */
  getWorkflowStatistics(): {
    totalWorkflows: number
    activeWorkflows: number
    totalExecutions: number
    successfulExecutions: number
    failedExecutions: number
    averageExecutionTime: number
  } {
    const workflows = Array.from(this.workflows.values())
    const executions = Array.from(this.executions.values())

    const activeWorkflows = workflows.filter(w => w.status === WorkflowStatus.ACTIVE).length
    const successfulExecutions = executions.filter(e => e.status === ExecutionStatus.COMPLETED).length
    const failedExecutions = executions.filter(e => e.status === ExecutionStatus.FAILED).length

    const completedExecutions = executions.filter(e => e.duration !== undefined)
    const averageExecutionTime = completedExecutions.length > 0
      ? completedExecutions.reduce((sum, e) => sum + (e.duration || 0), 0) / completedExecutions.length
      : 0

    return {
      totalWorkflows: workflows.length,
      activeWorkflows,
      totalExecutions: executions.length,
      successfulExecutions,
      failedExecutions,
      averageExecutionTime
    }
  }

  // 私有方法

  /**
   * 启动工作流
   */
  private async startWorkflow(workflowId: string): Promise<void> {
    const workflow = this.workflows.get(workflowId)
    if (!workflow) return

    // 为每个触发器设置监听
    for (const trigger of workflow.triggers) {
      if (!trigger.enabled) continue

      switch (trigger.type) {
        case TriggerType.TIME_BASED:
          this.setupTimeTrigger(workflowId, trigger)
          break
        case TriggerType.EVENT_BASED:
          this.setupEventTrigger(workflowId, trigger)
          break
        case TriggerType.CONDITION_BASED:
          this.setupConditionTrigger(workflowId, trigger)
          break
      }
    }

    console.log(`工作流已启动: ${workflow.name} (${workflowId})`)
  }

  /**
   * 停止工作流
   */
  private async stopWorkflow(workflowId: string): Promise<void> {
    // 清理相关的定时器
    const timersToRemove: string[] = []
    for (const [key, timer] of this.activeTimers) {
      if (key.startsWith(workflowId)) {
        clearTimeout(timer)
        timersToRemove.push(key)
      }
    }

    timersToRemove.forEach(key => this.activeTimers.delete(key))

    console.log(`工作流已停止: ${workflowId}`)
  }

  /**
   * 设置时间触发器
   */
  private setupTimeTrigger(workflowId: string, trigger: TriggerConfig): void {
    if (!trigger.config.schedule) return

    const { schedule } = trigger.config
    const timerKey = `${workflowId}_${trigger.id}`

    switch (schedule.type) {
      case 'interval':
        const interval = parseInt(schedule.value) * 1000 // 转换为毫秒
        const timer = setInterval(() => {
          this.triggerWorkflow(workflowId, trigger.id, { timestamp: new Date() })
        }, interval)
        this.activeTimers.set(timerKey, timer as any)
        break

      case 'once':
        const delay = new Date(schedule.value).getTime() - Date.now()
        if (delay > 0) {
          const timeout = setTimeout(() => {
            this.triggerWorkflow(workflowId, trigger.id, { timestamp: new Date() })
            this.activeTimers.delete(timerKey)
          }, delay)
          this.activeTimers.set(timerKey, timeout)
        }
        break

      case 'cron':
        // 简化的cron实现，实际中需要使用cron库
        console.log(`Cron触发器暂未实现: ${schedule.value}`)
        break
    }
  }

  /**
   * 设置事件触发器
   */
  private setupEventTrigger(workflowId: string, trigger: TriggerConfig): void {
    if (!trigger.config.event) return

    const { event } = trigger.config

    // 监听指定事件
    const eventHandler = (data: any) => {
      // 检查事件过滤器
      if (event.filters && !this.matchesEventFilters(data, event.filters)) {
        return
      }

      this.triggerWorkflow(workflowId, trigger.id, data)
    }

    // 在实际应用中，这里会注册到事件总线
    if (this.coreAPI?.events) {
      this.coreAPI.events.on(event.type, eventHandler)
    }
  }

  /**
   * 设置条件触发器
   */
  private setupConditionTrigger(workflowId: string, trigger: TriggerConfig): void {
    if (!trigger.config.conditions) return

    // 定期检查条件（简化实现）
    const checkInterval = 60000 // 1分钟检查一次
    const timerKey = `${workflowId}_${trigger.id}_condition`

    const timer = setInterval(async () => {
      const conditionsMet = await this.evaluateConditions(trigger.config.conditions!)
      if (conditionsMet) {
        this.triggerWorkflow(workflowId, trigger.id, { conditionsEvaluated: true })
      }
    }, checkInterval)

    this.activeTimers.set(timerKey, timer as any)
  }

  /**
   * 触发工作流执行
   */
  private async triggerWorkflow(workflowId: string, triggerId: string, data?: any): Promise<void> {
    const workflow = this.workflows.get(workflowId)
    if (!workflow || workflow.status !== WorkflowStatus.ACTIVE) return

    const executionId = this.generateId()
    const execution: WorkflowExecution = {
      id: executionId,
      workflowId,
      status: ExecutionStatus.PENDING,
      triggeredBy: {
        type: TriggerType.TIME_BASED, // 实际中应该根据触发器类型设置
        triggerId,
        data
      },
      startTime: new Date(),
      steps: [],
      logs: []
    }

    this.executions.set(executionId, execution)

    // 异步执行工作流
    this.executeWorkflowAsync(execution).catch(error => {
      console.error(`工作流执行失败 (${executionId}):`, error)
    })
  }

  /**
   * 异步执行工作流
   */
  private async executeWorkflowAsync(execution: WorkflowExecution): Promise<void> {
    const workflow = this.workflows.get(execution.workflowId)
    if (!workflow) {
      execution.status = ExecutionStatus.FAILED
      execution.error = '工作流不存在'
      return
    }

    try {
      execution.status = ExecutionStatus.RUNNING
      this.executions.set(execution.id, execution)

      this.emit('execution:started', { execution })

      // 检查工作流条件
      if (workflow.conditions && workflow.conditions.length > 0) {
        const conditionsMet = await this.evaluateConditions(workflow.conditions)
        if (!conditionsMet) {
          execution.status = ExecutionStatus.COMPLETED
          execution.endTime = new Date()
          execution.duration = execution.endTime.getTime() - execution.startTime.getTime()
          this.addExecutionLog(execution, 'info', '工作流条件不满足，跳过执行')
          this.emit('execution:completed', { execution })
          return
        }
      }

      // 执行所有动作
      for (const action of workflow.actions) {
        if (!action.enabled) continue

        const step = await this.executeAction(execution, action)
        execution.steps.push(step)

        if (step.status === ExecutionStatus.FAILED && workflow.settings.errorHandling === 'stop') {
          throw new Error(`动作执行失败: ${step.error}`)
        }
      }

      execution.status = ExecutionStatus.COMPLETED
      execution.endTime = new Date()
      execution.duration = execution.endTime.getTime() - execution.startTime.getTime()

      this.emit('execution:completed', { execution })

    } catch (error) {
      execution.status = ExecutionStatus.FAILED
      execution.endTime = new Date()
      execution.duration = execution.endTime ? execution.endTime.getTime() - execution.startTime.getTime() : 0
      execution.error = error instanceof Error ? error.message : '未知错误'

      this.addExecutionLog(execution, 'error', `工作流执行失败: ${execution.error}`)
      this.emit('execution:failed', { execution, error })
    } finally {
      this.executions.set(execution.id, execution)
    }
  }

  /**
   * 执行动作
   */
  private async executeAction(execution: WorkflowExecution, action: ActionConfig): Promise<ExecutionStep> {
    const step: ExecutionStep = {
      id: this.generateId(),
      actionId: action.id,
      status: ExecutionStatus.RUNNING,
      startTime: new Date()
    }

    try {
      this.addExecutionLog(execution, 'info', `开始执行动作: ${action.name}`)

      let result: any

      switch (action.type) {
        case ActionType.CREATE_TASK:
          result = await this.executeCreateTaskAction(action.config.task!)
          break
        case ActionType.SEND_NOTIFICATION:
          result = await this.executeSendNotificationAction(action.config.notification!)
          break
        case ActionType.UPDATE_ENTITY:
          result = await this.executeUpdateEntityAction(action.config.update!)
          break
        case ActionType.CREATE_NOTE:
          result = await this.executeCreateNoteAction(action.config)
          break
        case ActionType.TAG_ENTITY:
          result = await this.executeTagEntityAction(action.config.tag!)
          break
        default:
          throw new Error(`不支持的动作类型: ${action.type}`)
      }

      step.status = ExecutionStatus.COMPLETED
      step.output = result
      this.addExecutionLog(execution, 'info', `动作执行成功: ${action.name}`)

    } catch (error) {
      step.status = ExecutionStatus.FAILED
      step.error = error instanceof Error ? error.message : '未知错误'
      this.addExecutionLog(execution, 'error', `动作执行失败: ${action.name} - ${step.error}`)

      // 重试逻辑
      if (action.retryConfig && action.retryConfig.maxRetries > 0) {
        // 简化的重试实现
        console.log(`动作将重试: ${action.name}`)
      }
    } finally {
      step.endTime = new Date()
      step.duration = step.endTime.getTime() - step.startTime.getTime()
    }

    return step
  }

  /**
   * 执行创建任务动作
   */
  private async executeCreateTaskAction(config: any): Promise<any> {
    // 在实际应用中，这里会调用任务管理API
    console.log('创建任务:', config)
    return { taskId: this.generateId(), created: true }
  }

  /**
   * 执行发送通知动作
   */
  private async executeSendNotificationAction(config: any): Promise<any> {
    // 在实际应用中，这里会调用通知服务
    console.log('发送通知:', config)
    return { notificationId: this.generateId(), sent: true }
  }

  /**
   * 执行更新实体动作
   */
  private async executeUpdateEntityAction(config: any): Promise<any> {
    // 在实际应用中，这里会调用相应的实体更新API
    console.log('更新实体:', config)
    return { updated: true }
  }

  /**
   * 执行创建笔记动作
   */
  private async executeCreateNoteAction(config: any): Promise<any> {
    // 在实际应用中，这里会调用笔记创建API
    console.log('创建笔记:', config)
    return { noteId: this.generateId(), created: true }
  }

  /**
   * 执行标签实体动作
   */
  private async executeTagEntityAction(config: any): Promise<any> {
    // 在实际应用中，这里会调用标签管理API
    console.log('标签实体:', config)
    return { tagged: true }
  }

  /**
   * 评估条件
   */
  private async evaluateConditions(conditions: WorkflowCondition[]): Promise<boolean> {
    if (conditions.length === 0) return true

    let result = true
    let currentOperator: 'AND' | 'OR' = 'AND'

    for (const condition of conditions) {
      const conditionResult = await this.evaluateCondition(condition)

      if (currentOperator === 'AND') {
        result = result && conditionResult
      } else {
        result = result || conditionResult
      }

      // 设置下一个条件的逻辑操作符
      if (condition.logicalOperator) {
        currentOperator = condition.logicalOperator
      }
    }

    return result
  }

  /**
   * 评估单个条件
   */
  private async evaluateCondition(condition: WorkflowCondition): Promise<boolean> {
    // 在实际应用中，这里会根据条件类型获取实际数据进行比较
    // 简化实现，返回随机结果
    const mockValue = 'test_value'

    switch (condition.operator) {
      case ConditionOperator.EQUALS:
        return mockValue === condition.value
      case ConditionOperator.NOT_EQUALS:
        return mockValue !== condition.value
      case ConditionOperator.CONTAINS:
        return mockValue.includes(condition.value)
      case ConditionOperator.NOT_CONTAINS:
        return !mockValue.includes(condition.value)
      case ConditionOperator.IS_EMPTY:
        return !mockValue || mockValue.length === 0
      case ConditionOperator.IS_NOT_EMPTY:
        return mockValue && mockValue.length > 0
      default:
        return false
    }
  }

  /**
   * 检查事件过滤器
   */
  private matchesEventFilters(data: any, filters: Record<string, any>): boolean {
    for (const [key, value] of Object.entries(filters)) {
      if (data[key] !== value) {
        return false
      }
    }
    return true
  }

  /**
   * 添加执行日志
   */
  private addExecutionLog(
    execution: WorkflowExecution,
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    data?: any
  ): void {
    execution.logs.push({
      timestamp: new Date(),
      level,
      message,
      data
    })
  }

  /**
   * 替换模板变量
   */
  private replaceTemplateVariables(
    definition: any,
    variables: Record<string, any>
  ): any {
    const jsonString = JSON.stringify(definition)
    let replacedString = jsonString

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`
      replacedString = replacedString.replace(new RegExp(placeholder, 'g'), String(value))
    }

    return JSON.parse(replacedString)
  }

  /**
   * 启动提醒监控
   */
  private async startReminderMonitoring(reminderId: string): Promise<void> {
    const reminder = this.reminders.get(reminderId)
    if (!reminder) return

    // 简化的提醒监控实现
    console.log(`启动智能提醒监控: ${reminder.name}`)

    // 在实际应用中，这里会设置定期检查提醒条件的逻辑
  }

  /**
   * 初始化内置模板
   */
  private initializeBuiltInTemplates(): void {
    // 任务提醒模板
    const taskReminderTemplate: WorkflowTemplate = {
      id: 'task-reminder',
      name: '任务提醒',
      description: '在任务到期前自动发送提醒',
      category: '任务管理',
      tags: ['任务', '提醒', '自动化'],
      definition: {
        name: '{{taskName}}任务提醒',
        description: '自动提醒即将到期的任务',
        version: '1.0.0',
        status: WorkflowStatus.ACTIVE,
        triggers: [{
          id: 'time-trigger',
          type: TriggerType.TIME_BASED,
          name: '定时检查',
          description: '每小时检查一次任务状态',
          config: {
            schedule: {
              type: 'interval',
              value: '3600' // 1小时
            }
          },
          enabled: true
        }],
        actions: [{
          id: 'send-reminder',
          type: ActionType.SEND_NOTIFICATION,
          name: '发送提醒',
          description: '发送任务提醒通知',
          config: {
            notification: {
              title: '任务提醒',
              message: '您有任务即将到期：{{taskName}}',
              type: 'warning',
              channels: ['app']
            }
          },
          enabled: true
        }],
        conditions: [{
          id: 'due-date-condition',
          field: 'dueDate',
          operator: ConditionOperator.LESS_THAN,
          value: '{{reminderTime}}',
          entityType: EntityType.TASK
        }],
        settings: {
          errorHandling: 'continue',
          logging: true,
          notifications: true
        }
      },
      variables: [
        {
          name: 'taskName',
          type: 'string',
          description: '任务名称',
          required: true
        },
        {
          name: 'reminderTime',
          type: 'date',
          description: '提醒时间',
          defaultValue: '1天前',
          required: true
        }
      ],
      isBuiltIn: true
    }

    // 自动标签模板
    const autoTagTemplate: WorkflowTemplate = {
      id: 'auto-tag',
      name: '自动标签',
      description: '根据内容自动为笔记添加标签',
      category: '内容管理',
      tags: ['标签', '自动化', '笔记'],
      definition: {
        name: '自动标签工作流',
        description: '根据笔记内容自动添加相关标签',
        version: '1.0.0',
        status: WorkflowStatus.ACTIVE,
        triggers: [{
          id: 'note-created',
          type: TriggerType.EVENT_BASED,
          name: '笔记创建事件',
          description: '当创建新笔记时触发',
          config: {
            event: {
              type: 'note:created',
              source: 'notes-module'
            }
          },
          enabled: true
        }],
        actions: [{
          id: 'add-tags',
          type: ActionType.TAG_ENTITY,
          name: '添加标签',
          description: '为笔记添加自动标签',
          config: {
            tag: {
              entityType: EntityType.NOTE,
              tags: ['{{autoTags}}'],
              action: 'add'
            }
          },
          enabled: true
        }],
        settings: {
          errorHandling: 'continue',
          logging: true,
          notifications: false
        }
      },
      variables: [
        {
          name: 'autoTags',
          type: 'string',
          description: '自动添加的标签（逗号分隔）',
          defaultValue: '自动',
          required: true
        }
      ],
      isBuiltIn: true
    }

    this.templates.set(taskReminderTemplate.id, taskReminderTemplate)
    this.templates.set(autoTagTemplate.id, autoTagTemplate)
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `wf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

export default WorkflowAutomationService
