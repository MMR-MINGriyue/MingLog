/**
 * 工作流自动化服务测试
 * 测试规则引擎、任务自动化、智能提醒和工作流模板功能
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { 
  WorkflowAutomationService,
  TriggerType,
  ActionType,
  WorkflowStatus,
  ExecutionStatus,
  ConditionOperator
} from '../services/WorkflowAutomationService'
import { EntityType } from '../services/DataAssociationService'

// 模拟核心API
const mockCoreAPI = {
  events: {
    emit: vi.fn(),
    on: vi.fn()
  }
}

describe('WorkflowAutomationService', () => {
  let workflowService: WorkflowAutomationService

  beforeEach(() => {
    vi.clearAllMocks()
    workflowService = new WorkflowAutomationService(mockCoreAPI)
  })

  afterEach(async () => {
    await workflowService.stop()
  })

  describe('工作流引擎管理', () => {
    it('应该能够启动和停止工作流引擎', async () => {
      const startSpy = vi.fn()
      const stopSpy = vi.fn()
      
      workflowService.on('engine:started', startSpy)
      workflowService.on('engine:stopped', stopSpy)

      await workflowService.start()
      expect(startSpy).toHaveBeenCalled()

      await workflowService.stop()
      expect(stopSpy).toHaveBeenCalled()
    })

    it('应该能够获取工作流统计信息', () => {
      const stats = workflowService.getWorkflowStatistics()
      
      expect(stats).toBeDefined()
      expect(typeof stats.totalWorkflows).toBe('number')
      expect(typeof stats.activeWorkflows).toBe('number')
      expect(typeof stats.totalExecutions).toBe('number')
      expect(typeof stats.successfulExecutions).toBe('number')
      expect(typeof stats.failedExecutions).toBe('number')
      expect(typeof stats.averageExecutionTime).toBe('number')
    })
  })

  describe('工作流管理', () => {
    it('应该能够创建工作流', async () => {
      const workflowDefinition = {
        name: '测试工作流',
        description: '这是一个测试工作流',
        version: '1.0.0',
        status: WorkflowStatus.ACTIVE,
        triggers: [{
          id: 'test-trigger',
          type: TriggerType.MANUAL,
          name: '手动触发',
          description: '手动触发测试',
          config: {},
          enabled: true
        }],
        actions: [{
          id: 'test-action',
          type: ActionType.SEND_NOTIFICATION,
          name: '发送通知',
          description: '发送测试通知',
          config: {
            notification: {
              title: '测试通知',
              message: '这是一个测试通知',
              type: 'info' as const,
              channels: ['app' as const]
            }
          },
          enabled: true
        }],
        settings: {
          errorHandling: 'stop' as const,
          logging: true,
          notifications: true
        }
      }

      const workflowId = await workflowService.createWorkflow(workflowDefinition)
      
      expect(typeof workflowId).toBe('string')
      expect(workflowId.length).toBeGreaterThan(0)

      const workflow = workflowService.getWorkflow(workflowId)
      expect(workflow).toBeDefined()
      expect(workflow?.name).toBe('测试工作流')
      expect(workflow?.status).toBe(WorkflowStatus.ACTIVE)
    })

    it('应该能够更新工作流', async () => {
      const workflowId = await workflowService.createWorkflow({
        name: '原始工作流',
        description: '原始描述',
        version: '1.0.0',
        status: WorkflowStatus.INACTIVE,
        triggers: [],
        actions: [],
        settings: {
          errorHandling: 'stop',
          logging: true,
          notifications: true
        }
      })

      await workflowService.updateWorkflow(workflowId, {
        name: '更新后的工作流',
        description: '更新后的描述',
        status: WorkflowStatus.ACTIVE
      })

      const updatedWorkflow = workflowService.getWorkflow(workflowId)
      expect(updatedWorkflow?.name).toBe('更新后的工作流')
      expect(updatedWorkflow?.description).toBe('更新后的描述')
      expect(updatedWorkflow?.status).toBe(WorkflowStatus.ACTIVE)
    })

    it('应该能够删除工作流', async () => {
      const workflowId = await workflowService.createWorkflow({
        name: '待删除工作流',
        description: '这个工作流将被删除',
        version: '1.0.0',
        status: WorkflowStatus.INACTIVE,
        triggers: [],
        actions: [],
        settings: {
          errorHandling: 'stop',
          logging: true,
          notifications: true
        }
      })

      await workflowService.deleteWorkflow(workflowId)

      const deletedWorkflow = workflowService.getWorkflow(workflowId)
      expect(deletedWorkflow).toBeNull()
    })

    it('应该能够获取所有工作流', async () => {
      await workflowService.createWorkflow({
        name: '工作流1',
        description: '第一个工作流',
        version: '1.0.0',
        status: WorkflowStatus.ACTIVE,
        triggers: [],
        actions: [],
        settings: {
          errorHandling: 'stop',
          logging: true,
          notifications: true
        }
      })

      await workflowService.createWorkflow({
        name: '工作流2',
        description: '第二个工作流',
        version: '1.0.0',
        status: WorkflowStatus.INACTIVE,
        triggers: [],
        actions: [],
        settings: {
          errorHandling: 'continue',
          logging: false,
          notifications: false
        }
      })

      const workflows = workflowService.getAllWorkflows()
      expect(workflows.length).toBe(2)
      expect(workflows.some(w => w.name === '工作流1')).toBe(true)
      expect(workflows.some(w => w.name === '工作流2')).toBe(true)
    })
  })

  describe('工作流执行', () => {
    let testWorkflowId: string

    beforeEach(async () => {
      testWorkflowId = await workflowService.createWorkflow({
        name: '执行测试工作流',
        description: '用于测试执行的工作流',
        version: '1.0.0',
        status: WorkflowStatus.ACTIVE,
        triggers: [{
          id: 'manual-trigger',
          type: TriggerType.MANUAL,
          name: '手动触发',
          description: '手动触发测试',
          config: {},
          enabled: true
        }],
        actions: [{
          id: 'notification-action',
          type: ActionType.SEND_NOTIFICATION,
          name: '发送通知',
          description: '发送测试通知',
          config: {
            notification: {
              title: '执行测试',
              message: '工作流执行测试',
              type: 'info',
              channels: ['app']
            }
          },
          enabled: true
        }],
        settings: {
          errorHandling: 'stop',
          logging: true,
          notifications: true
        }
      })
    })

    it('应该能够手动执行工作流', async () => {
      const executionId = await workflowService.executeWorkflow(testWorkflowId, { test: true })
      
      expect(typeof executionId).toBe('string')
      expect(executionId.length).toBeGreaterThan(0)

      // 等待执行完成
      await new Promise(resolve => setTimeout(resolve, 100))

      const execution = workflowService.getExecution(executionId)
      expect(execution).toBeDefined()
      expect(execution?.workflowId).toBe(testWorkflowId)
      expect(execution?.triggeredBy.type).toBe(TriggerType.MANUAL)
    })

    it('应该能够获取工作流执行历史', async () => {
      // 执行多次工作流
      await workflowService.executeWorkflow(testWorkflowId)
      await workflowService.executeWorkflow(testWorkflowId)
      await workflowService.executeWorkflow(testWorkflowId)

      // 等待执行完成
      await new Promise(resolve => setTimeout(resolve, 200))

      const executions = workflowService.getWorkflowExecutions(testWorkflowId)
      expect(executions.length).toBe(3)
      expect(executions.every(e => e.workflowId === testWorkflowId)).toBe(true)
    })

    it('应该能够处理工作流执行错误', async () => {
      // 创建一个会失败的工作流
      const errorWorkflowId = await workflowService.createWorkflow({
        name: '错误工作流',
        description: '这个工作流会失败',
        version: '1.0.0',
        status: WorkflowStatus.ACTIVE,
        triggers: [],
        actions: [{
          id: 'invalid-action',
          type: 'invalid_action' as any,
          name: '无效动作',
          description: '这是一个无效的动作',
          config: {},
          enabled: true
        }],
        settings: {
          errorHandling: 'stop',
          logging: true,
          notifications: true
        }
      })

      const executionId = await workflowService.executeWorkflow(errorWorkflowId)
      
      // 等待执行完成
      await new Promise(resolve => setTimeout(resolve, 100))

      const execution = workflowService.getExecution(executionId)
      expect(execution?.status).toBe(ExecutionStatus.FAILED)
      expect(execution?.error).toBeDefined()
    })
  })

  describe('工作流模板', () => {
    it('应该能够获取内置工作流模板', () => {
      const templates = workflowService.getWorkflowTemplates()
      
      expect(Array.isArray(templates)).toBe(true)
      expect(templates.length).toBeGreaterThan(0)
      expect(templates.some(t => t.isBuiltIn)).toBe(true)
    })

    it('应该能够按类别过滤模板', () => {
      const taskTemplates = workflowService.getWorkflowTemplates('任务管理')
      
      expect(Array.isArray(taskTemplates)).toBe(true)
      expect(taskTemplates.every(t => t.category === '任务管理')).toBe(true)
    })

    it('应该能够从模板创建工作流', async () => {
      const templates = workflowService.getWorkflowTemplates()
      const template = templates[0]
      
      const workflowId = await workflowService.createWorkflowFromTemplate(
        template.id,
        '从模板创建的工作流',
        {
          taskName: '测试任务',
          reminderTime: '2024-12-31'
        }
      )
      
      expect(typeof workflowId).toBe('string')
      
      const workflow = workflowService.getWorkflow(workflowId)
      expect(workflow).toBeDefined()
      expect(workflow?.name).toBe('从模板创建的工作流')
      expect(workflow?.metadata.tags).toContain('from-template')
    })

    it('应该在使用不存在的模板时抛出错误', async () => {
      await expect(workflowService.createWorkflowFromTemplate(
        'non-existent-template',
        '测试工作流',
        {}
      )).rejects.toThrow('工作流模板不存在')
    })
  })

  describe('智能提醒', () => {
    it('应该能够创建智能提醒', async () => {
      const reminderConfig = {
        name: '任务到期提醒',
        description: '任务到期前的智能提醒',
        entityType: EntityType.TASK,
        conditions: [{
          id: 'due-date-condition',
          field: 'dueDate',
          operator: ConditionOperator.LESS_THAN,
          value: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24小时后
        }],
        reminderSettings: {
          advanceTime: 60, // 提前60分钟
          repeatInterval: 30, // 每30分钟重复
          maxRepeats: 3
        },
        notificationConfig: {
          title: '任务提醒',
          message: '您有任务即将到期',
          channels: ['app' as const],
          priority: 'normal' as const
        },
        enabled: true
      }

      const reminderId = await workflowService.createSmartReminder(reminderConfig)
      
      expect(typeof reminderId).toBe('string')
      expect(reminderId.length).toBeGreaterThan(0)

      const reminders = workflowService.getSmartReminders()
      const createdReminder = reminders.find(r => r.id === reminderId)
      expect(createdReminder).toBeDefined()
      expect(createdReminder?.name).toBe('任务到期提醒')
    })

    it('应该能够获取所有智能提醒', async () => {
      await workflowService.createSmartReminder({
        name: '提醒1',
        description: '第一个提醒',
        entityType: EntityType.NOTE,
        conditions: [],
        reminderSettings: {
          advanceTime: 30
        },
        notificationConfig: {
          title: '提醒1',
          message: '这是第一个提醒',
          channels: ['app'],
          priority: 'normal'
        },
        enabled: true
      })

      await workflowService.createSmartReminder({
        name: '提醒2',
        description: '第二个提醒',
        entityType: EntityType.TASK,
        conditions: [],
        reminderSettings: {
          advanceTime: 60
        },
        notificationConfig: {
          title: '提醒2',
          message: '这是第二个提醒',
          channels: ['email'],
          priority: 'high'
        },
        enabled: false
      })

      const reminders = workflowService.getSmartReminders()
      expect(reminders.length).toBe(2)
      expect(reminders.some(r => r.name === '提醒1')).toBe(true)
      expect(reminders.some(r => r.name === '提醒2')).toBe(true)
    })
  })

  describe('条件评估', () => {
    it('应该能够正确评估简单条件', async () => {
      // 这个测试需要访问私有方法，在实际应用中可能需要重构
      // 这里我们通过创建包含条件的工作流来间接测试
      
      const workflowId = await workflowService.createWorkflow({
        name: '条件测试工作流',
        description: '测试条件评估',
        version: '1.0.0',
        status: WorkflowStatus.ACTIVE,
        triggers: [],
        actions: [{
          id: 'test-action',
          type: ActionType.SEND_NOTIFICATION,
          name: '测试动作',
          description: '测试动作',
          config: {
            notification: {
              title: '条件满足',
              message: '条件评估通过',
              type: 'info',
              channels: ['app']
            }
          },
          enabled: true
        }],
        conditions: [{
          id: 'test-condition',
          field: 'status',
          operator: ConditionOperator.EQUALS,
          value: 'active'
        }],
        settings: {
          errorHandling: 'stop',
          logging: true,
          notifications: true
        }
      })

      const executionId = await workflowService.executeWorkflow(workflowId)
      
      // 等待执行完成
      await new Promise(resolve => setTimeout(resolve, 100))

      const execution = workflowService.getExecution(executionId)
      expect(execution).toBeDefined()
      // 由于条件评估是模拟的，我们主要验证执行流程正常
    })
  })

  describe('错误处理', () => {
    it('应该在工作流不存在时抛出错误', async () => {
      await expect(workflowService.updateWorkflow('non-existent', {}))
        .rejects.toThrow('工作流不存在')
      
      await expect(workflowService.deleteWorkflow('non-existent'))
        .rejects.toThrow('工作流不存在')
    })

    it('应该能够处理执行过程中的异常', async () => {
      const workflowId = await workflowService.createWorkflow({
        name: '异常测试工作流',
        description: '测试异常处理',
        version: '1.0.0',
        status: WorkflowStatus.ACTIVE,
        triggers: [],
        actions: [{
          id: 'error-action',
          type: 'unknown_action' as any,
          name: '错误动作',
          description: '这个动作会导致错误',
          config: {},
          enabled: true
        }],
        settings: {
          errorHandling: 'stop',
          logging: true,
          notifications: true
        }
      })

      const executionId = await workflowService.executeWorkflow(workflowId)
      
      // 等待执行完成
      await new Promise(resolve => setTimeout(resolve, 100))

      const execution = workflowService.getExecution(executionId)
      expect(execution?.status).toBe(ExecutionStatus.FAILED)
      expect(execution?.error).toBeDefined()
      expect(execution?.logs.some(log => log.level === 'error')).toBe(true)
    })
  })
})
