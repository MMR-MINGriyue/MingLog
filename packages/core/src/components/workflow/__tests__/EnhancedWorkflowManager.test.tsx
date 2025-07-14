/**
 * 增强版工作流管理器测试
 * 测试工作流创建、编辑、执行和监控功能
 */

import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { EnhancedWorkflowManager } from '../EnhancedWorkflowManager'
import { 
  WorkflowAutomationService,
  WorkflowDefinition,
  WorkflowTemplate,
  WorkflowExecution,
  WorkflowStatus,
  ExecutionStatus,
  TriggerType,
  ActionType
} from '../../../services/WorkflowAutomationService'

// 模拟工作流自动化服务
const mockWorkflowService = {
  getWorkflows: vi.fn(),
  getWorkflowTemplates: vi.fn(),
  getExecutions: vi.fn(),
  createWorkflow: vi.fn(),
  updateWorkflow: vi.fn(),
  deleteWorkflow: vi.fn(),
  startWorkflow: vi.fn(),
  stopWorkflow: vi.fn(),
  executeWorkflow: vi.fn(),
  createWorkflowFromTemplate: vi.fn()
} as unknown as WorkflowAutomationService

// 测试数据
const mockWorkflows: WorkflowDefinition[] = [
  {
    id: 'workflow-1',
    name: '任务提醒工作流',
    description: '自动提醒即将到期的任务',
    version: '1.0.0',
    status: WorkflowStatus.ACTIVE,
    triggers: [{
      id: 'trigger-1',
      type: TriggerType.TIME_BASED,
      name: '每日检查',
      description: '每天检查任务状态',
      config: { schedule: { type: 'daily', value: '09:00' } },
      enabled: true
    }],
    actions: [{
      id: 'action-1',
      type: ActionType.SEND_NOTIFICATION,
      name: '发送提醒',
      description: '发送任务提醒通知',
      config: { message: '您有任务即将到期' },
      enabled: true
    }],
    conditions: [],
    settings: {
      maxExecutions: undefined,
      executionTimeout: 30000,
      errorHandling: 'stop',
      logging: true,
      notifications: true
    },
    metadata: {
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-02'),
      createdBy: 'user-1',
      tags: ['任务', '提醒'],
      category: '任务管理'
    }
  },
  {
    id: 'workflow-2',
    name: '笔记归档工作流',
    description: '自动归档旧笔记',
    version: '1.0.0',
    status: WorkflowStatus.INACTIVE,
    triggers: [{
      id: 'trigger-2',
      type: TriggerType.CONDITION_BASED,
      name: '笔记过期检查',
      description: '检查超过30天未修改的笔记',
      config: { condition: 'lastModified < 30 days' },
      enabled: true
    }],
    actions: [{
      id: 'action-2',
      type: ActionType.ARCHIVE_ENTITY,
      name: '归档笔记',
      description: '将笔记移动到归档文件夹',
      config: { targetFolder: 'archived' },
      enabled: true
    }],
    conditions: [],
    settings: {
      maxExecutions: undefined,
      executionTimeout: 60000,
      errorHandling: 'continue',
      logging: true,
      notifications: false
    },
    metadata: {
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-04'),
      createdBy: 'user-1',
      tags: ['笔记', '归档'],
      category: '内容管理'
    }
  }
]

const mockTemplates: WorkflowTemplate[] = [
  {
    id: 'template-1',
    name: '任务提醒模板',
    description: '用于创建任务提醒工作流的模板',
    category: '任务管理',
    tags: ['任务', '提醒', '自动化'],
    definition: {
      name: '{{taskName}}任务提醒',
      description: '自动提醒即将到期的{{taskName}}任务',
      version: '1.0.0',
      status: WorkflowStatus.ACTIVE,
      triggers: [{
        id: 'trigger-template',
        type: TriggerType.TIME_BASED,
        name: '定时检查',
        description: '定时检查任务状态',
        config: { schedule: { type: 'interval', value: '{{interval}}' } },
        enabled: true
      }],
      actions: [{
        id: 'action-template',
        type: ActionType.SEND_NOTIFICATION,
        name: '发送提醒',
        description: '发送任务提醒通知',
        config: { message: '{{message}}' },
        enabled: true
      }],
      conditions: [],
      settings: {
        maxExecutions: undefined,
        executionTimeout: 30000,
        errorHandling: 'stop',
        logging: true,
        notifications: true
      }
    },
    variables: [
      {
        name: 'taskName',
        type: 'string',
        description: '任务名称',
        defaultValue: '重要',
        required: true
      },
      {
        name: 'interval',
        type: 'string',
        description: '检查间隔',
        defaultValue: '3600',
        required: true
      },
      {
        name: 'message',
        type: 'string',
        description: '提醒消息',
        defaultValue: '您有任务即将到期',
        required: true
      }
    ],
    isBuiltIn: true
  }
]

const mockExecutions: WorkflowExecution[] = [
  {
    id: 'execution-1',
    workflowId: 'workflow-1',
    status: ExecutionStatus.COMPLETED,
    startTime: new Date('2024-01-05T09:00:00'),
    endTime: new Date('2024-01-05T09:00:05'),
    duration: 5000,
    steps: [
      {
        id: 'step-1',
        name: '检查任务',
        status: ExecutionStatus.COMPLETED,
        startTime: new Date('2024-01-05T09:00:00'),
        endTime: new Date('2024-01-05T09:00:02'),
        duration: 2000,
        output: { tasksFound: 3 }
      },
      {
        id: 'step-2',
        name: '发送通知',
        status: ExecutionStatus.COMPLETED,
        startTime: new Date('2024-01-05T09:00:02'),
        endTime: new Date('2024-01-05T09:00:05'),
        duration: 3000,
        output: { notificationsSent: 3 }
      }
    ],
    logs: [
      {
        level: 'info',
        message: '开始执行工作流',
        timestamp: new Date('2024-01-05T09:00:00'),
        stepId: 'step-1'
      },
      {
        level: 'info',
        message: '找到3个即将到期的任务',
        timestamp: new Date('2024-01-05T09:00:02'),
        stepId: 'step-1'
      },
      {
        level: 'info',
        message: '成功发送3个通知',
        timestamp: new Date('2024-01-05T09:00:05'),
        stepId: 'step-2'
      }
    ],
    context: {},
    result: {
      success: true,
      message: '工作流执行成功',
      data: { tasksProcessed: 3, notificationsSent: 3 }
    }
  }
]

describe('EnhancedWorkflowManager', () => {
  const user = userEvent.setup()
  const mockCallbacks = {
    onWorkflowCreate: vi.fn(),
    onWorkflowUpdate: vi.fn(),
    onWorkflowDelete: vi.fn(),
    onError: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // 设置默认的模拟返回值
    mockWorkflowService.getWorkflows = vi.fn().mockReturnValue(mockWorkflows)
    mockWorkflowService.getWorkflowTemplates = vi.fn().mockReturnValue(mockTemplates)
    mockWorkflowService.getExecutions = vi.fn().mockReturnValue(mockExecutions)
    mockWorkflowService.createWorkflow = vi.fn().mockResolvedValue('new-workflow-id')
    mockWorkflowService.updateWorkflow = vi.fn().mockResolvedValue(undefined)
    mockWorkflowService.deleteWorkflow = vi.fn().mockResolvedValue(undefined)
    mockWorkflowService.startWorkflow = vi.fn().mockResolvedValue(undefined)
    mockWorkflowService.stopWorkflow = vi.fn().mockResolvedValue(undefined)
    mockWorkflowService.executeWorkflow = vi.fn().mockResolvedValue('execution-id')
    mockWorkflowService.createWorkflowFromTemplate = vi.fn().mockResolvedValue('template-workflow-id')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('基础渲染', () => {
    it('应该正确渲染工作流管理器', () => {
      render(
        <EnhancedWorkflowManager
          workflowService={mockWorkflowService}
          {...mockCallbacks}
        />
      )

      expect(screen.getByText('🔄 工作流自动化')).toBeInTheDocument()
      expect(screen.getByText('工作流 (2)')).toBeInTheDocument()
      expect(screen.getByText('模板库 (1)')).toBeInTheDocument()
      expect(screen.getByText('执行记录 (1)')).toBeInTheDocument()
    })

    it('应该显示工作流统计信息', () => {
      render(
        <EnhancedWorkflowManager
          workflowService={mockWorkflowService}
          {...mockCallbacks}
        />
      )

      expect(screen.getByText('2')).toBeInTheDocument() // 总工作流数
      expect(screen.getByText('1')).toBeInTheDocument() // 运行中的工作流数
      expect(screen.getByText('1')).toBeInTheDocument() // 总执行次数
    })

    it('应该显示工作流卡片', () => {
      render(
        <EnhancedWorkflowManager
          workflowService={mockWorkflowService}
          {...mockCallbacks}
        />
      )

      expect(screen.getByText('任务提醒工作流')).toBeInTheDocument()
      expect(screen.getByText('笔记归档工作流')).toBeInTheDocument()
      expect(screen.getByText('自动提醒即将到期的任务')).toBeInTheDocument()
      expect(screen.getByText('自动归档旧笔记')).toBeInTheDocument()
    })
  })

  describe('标签页切换', () => {
    it('应该切换到模板库标签页', async () => {
      render(
        <EnhancedWorkflowManager
          workflowService={mockWorkflowService}
          showTemplateLibrary={true}
          {...mockCallbacks}
        />
      )

      await user.click(screen.getByText('模板库 (1)'))

      expect(screen.getByText('任务提醒模板')).toBeInTheDocument()
      expect(screen.getByText('用于创建任务提醒工作流的模板')).toBeInTheDocument()
    })

    it('应该切换到执行记录标签页', async () => {
      render(
        <EnhancedWorkflowManager
          workflowService={mockWorkflowService}
          {...mockCallbacks}
        />
      )

      await user.click(screen.getByText('执行记录 (1)'))

      expect(screen.getByText('任务提醒工作流')).toBeInTheDocument()
      expect(screen.getByText('#tion-1')).toBeInTheDocument() // 执行ID的后8位
      expect(screen.getByText('已完成')).toBeInTheDocument()
    })

    it('应该切换到实时监控标签页', async () => {
      render(
        <EnhancedWorkflowManager
          workflowService={mockWorkflowService}
          enableRealTimeMonitoring={true}
          {...mockCallbacks}
        />
      )

      await user.click(screen.getByText('实时监控'))

      expect(screen.getByText('活跃工作流')).toBeInTheDocument()
      expect(screen.getByText('总执行次数')).toBeInTheDocument()
      expect(screen.getByText('成功率')).toBeInTheDocument()
      expect(screen.getByText('平均执行时间')).toBeInTheDocument()
    })
  })

  describe('搜索和过滤功能', () => {
    it('应该支持搜索工作流', async () => {
      render(
        <EnhancedWorkflowManager
          workflowService={mockWorkflowService}
          {...mockCallbacks}
        />
      )

      const searchInput = screen.getByPlaceholderText('搜索工作流...')
      await user.type(searchInput, '任务')

      // 应该只显示包含"任务"的工作流
      expect(screen.getByText('任务提醒工作流')).toBeInTheDocument()
      expect(screen.queryByText('笔记归档工作流')).not.toBeInTheDocument()
    })

    it('应该支持按状态过滤工作流', async () => {
      render(
        <EnhancedWorkflowManager
          workflowService={mockWorkflowService}
          {...mockCallbacks}
        />
      )

      const statusFilter = screen.getByDisplayValue('全部状态')
      await user.selectOptions(statusFilter, 'active')

      // 应该只显示活跃的工作流
      expect(screen.getByText('任务提醒工作流')).toBeInTheDocument()
      expect(screen.queryByText('笔记归档工作流')).not.toBeInTheDocument()
    })

    it('应该支持排序工作流', async () => {
      render(
        <EnhancedWorkflowManager
          workflowService={mockWorkflowService}
          {...mockCallbacks}
        />
      )

      const sortSelect = screen.getByDisplayValue('最近更新')
      await user.selectOptions(sortSelect, 'name')

      // 验证排序功能被调用（通过检查DOM结构变化）
      expect(sortSelect).toHaveValue('name')
    })
  })

  describe('工作流操作', () => {
    it('应该启动工作流', async () => {
      render(
        <EnhancedWorkflowManager
          workflowService={mockWorkflowService}
          {...mockCallbacks}
        />
      )

      // 找到停止状态的工作流并启动
      const workflowCards = screen.getAllByText('启动')
      await user.click(workflowCards[0])

      await waitFor(() => {
        expect(mockWorkflowService.startWorkflow).toHaveBeenCalledWith('workflow-2')
      })
    })

    it('应该停止工作流', async () => {
      render(
        <EnhancedWorkflowManager
          workflowService={mockWorkflowService}
          {...mockCallbacks}
        />
      )

      // 找到运行中的工作流并停止
      const stopButton = screen.getByText('停止')
      await user.click(stopButton)

      await waitFor(() => {
        expect(mockWorkflowService.stopWorkflow).toHaveBeenCalledWith('workflow-1')
      })
    })

    it('应该执行工作流', async () => {
      render(
        <EnhancedWorkflowManager
          workflowService={mockWorkflowService}
          {...mockCallbacks}
        />
      )

      const executeButtons = screen.getAllByText('执行')
      await user.click(executeButtons[0])

      await waitFor(() => {
        expect(mockWorkflowService.executeWorkflow).toHaveBeenCalledWith('workflow-1')
      })
    })

    it('应该删除工作流', async () => {
      // 模拟确认对话框
      window.confirm = vi.fn().mockReturnValue(true)

      render(
        <EnhancedWorkflowManager
          workflowService={mockWorkflowService}
          {...mockCallbacks}
        />
      )

      const deleteButtons = screen.getAllByText('删除')
      await user.click(deleteButtons[0])

      await waitFor(() => {
        expect(mockWorkflowService.deleteWorkflow).toHaveBeenCalledWith('workflow-1')
        expect(mockCallbacks.onWorkflowDelete).toHaveBeenCalledWith('workflow-1')
      })
    })
  })

  describe('工作流选择', () => {
    it('应该选择工作流', async () => {
      render(
        <EnhancedWorkflowManager
          workflowService={mockWorkflowService}
          {...mockCallbacks}
        />
      )

      const workflowCard = screen.getByText('任务提醒工作流').closest('.workflow-card')
      expect(workflowCard).toBeInTheDocument()

      await user.click(workflowCard!)

      expect(workflowCard).toHaveClass('selected')
    })
  })

  describe('实时监控', () => {
    it('应该启动实时监控', async () => {
      render(
        <EnhancedWorkflowManager
          workflowService={mockWorkflowService}
          enableRealTimeMonitoring={true}
          {...mockCallbacks}
        />
      )

      const monitorButton = screen.getByText('开始监控')
      await user.click(monitorButton)

      expect(screen.getByText('停止监控')).toBeInTheDocument()
    })
  })

  describe('模板功能', () => {
    it('应该显示使用模板按钮', async () => {
      render(
        <EnhancedWorkflowManager
          workflowService={mockWorkflowService}
          showTemplateLibrary={true}
          {...mockCallbacks}
        />
      )

      await user.click(screen.getByText('模板库 (1)'))

      expect(screen.getByText('使用模板')).toBeInTheDocument()
      expect(screen.getByText('预览')).toBeInTheDocument()
    })
  })

  describe('错误处理', () => {
    it('应该显示工作流操作错误', async () => {
      mockWorkflowService.startWorkflow = vi.fn().mockRejectedValue(new Error('启动失败'))

      render(
        <EnhancedWorkflowManager
          workflowService={mockWorkflowService}
          {...mockCallbacks}
        />
      )

      const startButton = screen.getAllByText('启动')[0]
      await user.click(startButton)

      await waitFor(() => {
        expect(screen.getByText('启动失败')).toBeInTheDocument()
        expect(mockCallbacks.onError).toHaveBeenCalledWith('启动失败')
      })
    })

    it('应该关闭错误提示', async () => {
      mockWorkflowService.startWorkflow = vi.fn().mockRejectedValue(new Error('测试错误'))

      render(
        <EnhancedWorkflowManager
          workflowService={mockWorkflowService}
          {...mockCallbacks}
        />
      )

      const startButton = screen.getAllByText('启动')[0]
      await user.click(startButton)

      await waitFor(() => {
        expect(screen.getByText('测试错误')).toBeInTheDocument()
      })

      const dismissButton = screen.getByText('✕')
      await user.click(dismissButton)

      expect(screen.queryByText('测试错误')).not.toBeInTheDocument()
    })
  })

  describe('空状态', () => {
    it('应该显示空工作流状态', () => {
      mockWorkflowService.getWorkflows = vi.fn().mockReturnValue([])

      render(
        <EnhancedWorkflowManager
          workflowService={mockWorkflowService}
          {...mockCallbacks}
        />
      )

      expect(screen.getByText('暂无工作流')).toBeInTheDocument()
      expect(screen.getByText('创建您的第一个自动化工作流')).toBeInTheDocument()
    })

    it('应该显示空执行记录状态', async () => {
      mockWorkflowService.getExecutions = vi.fn().mockReturnValue([])

      render(
        <EnhancedWorkflowManager
          workflowService={mockWorkflowService}
          {...mockCallbacks}
        />
      )

      await user.click(screen.getByText('执行记录 (0)'))

      expect(screen.getByText('暂无执行记录')).toBeInTheDocument()
      expect(screen.getByText('工作流执行后会在这里显示记录')).toBeInTheDocument()
    })
  })

  describe('响应式设计', () => {
    it('应该在移动端正确显示', () => {
      // 模拟移动端视口
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(
        <EnhancedWorkflowManager
          workflowService={mockWorkflowService}
          {...mockCallbacks}
        />
      )

      // 验证基本元素仍然存在
      expect(screen.getByText('🔄 工作流自动化')).toBeInTheDocument()
      expect(screen.getByText('工作流 (2)')).toBeInTheDocument()
    })
  })
})
