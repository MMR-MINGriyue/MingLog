/**
 * GTD收集箱组件测试
 * 测试GTD收集箱的核心功能和用户交互
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GTDInbox } from '../GTDInbox'
import { Task, TaskStatus, TaskPriority } from '../../types'
import { IGTDService } from '../../services'

// 模拟GTD服务
const mockGTDService: IGTDService = {
  // GTD核心流程
  collect: vi.fn(),
  process: vi.fn(),
  organize: vi.fn(),
  review: vi.fn(),
  engage: vi.fn(),

  // 收集箱管理
  getInboxTasks: vi.fn(),
  addToInbox: vi.fn(),

  // 处理流程
  processInboxItem: vi.fn(),
  makeDecision: vi.fn(),
  organizeTask: vi.fn(),
  moveToSomeday: vi.fn(),
  moveToWaiting: vi.fn(),

  // 回顾系统
  weeklyReview: vi.fn(),
  dailyReview: vi.fn(),

  // 执行系统
  getNextActions: vi.fn(),
  getNextActionsByContext: vi.fn(),

  // 上下文管理
  getAvailableContexts: vi.fn(),
  suggestContext: vi.fn()
}

// 模拟任务数据
const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: '学习React测试',
    description: '深入学习React组件测试的最佳实践',
    status: TaskStatus.INBOX,
    priority: TaskPriority.MEDIUM,
    linkedNotes: [],
    linkedFiles: [],
    tags: ['学习', '技术'],
    contexts: ['@电脑'],
    createdAt: new Date('2025-01-10T10:00:00Z'),
    updatedAt: new Date('2025-01-10T10:00:00Z')
  },
  {
    id: 'task-2',
    title: '准备会议材料',
    description: '为下周的项目评审会议准备演示材料',
    status: TaskStatus.INBOX,
    priority: TaskPriority.HIGH,
    linkedNotes: [],
    linkedFiles: [],
    tags: ['工作', '会议'],
    contexts: ['@办公室'],
    createdAt: new Date('2025-01-10T09:00:00Z'),
    updatedAt: new Date('2025-01-10T09:00:00Z')
  }
]

describe('GTDInbox组件', () => {
  beforeEach(() => {
    // 重置所有模拟函数
    vi.clearAllMocks()
    
    // 设置默认的模拟返回值
    mockGTDService.getInboxTasks.mockResolvedValue(mockTasks)
    mockGTDService.addToInbox.mockImplementation(async (input: string) => ({
      id: `task-${Date.now()}`,
      title: input.length > 100 ? input.substring(0, 100) + '...' : input,
      description: input.length > 100 ? input : undefined,
      status: TaskStatus.INBOX,
      priority: TaskPriority.MEDIUM,
      linkedNotes: [],
      linkedFiles: [],
      tags: [],
      contexts: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }))
  })

  describe('基础渲染', () => {
    it('应该正确渲染收集箱标题', async () => {
      render(<GTDInbox gtdService={mockGTDService} />)
      
      expect(screen.getByText('📥 收集箱')).toBeInTheDocument()
      
      // 等待任务加载完成
      await waitFor(() => {
        expect(screen.getByText('(2)')).toBeInTheDocument()
      })
    })

    it('应该显示快速捕获输入区域', () => {
      render(<GTDInbox gtdService={mockGTDService} />)
      
      const textarea = screen.getByPlaceholderText(/快速捕获想法/)
      const button = screen.getByText('捕获')
      
      expect(textarea).toBeInTheDocument()
      expect(button).toBeInTheDocument()
    })

    it('应该显示处理指南', async () => {
      render(<GTDInbox gtdService={mockGTDService} />)
      
      await waitFor(() => {
        expect(screen.getByText('📋 处理指南')).toBeInTheDocument()
        expect(screen.getByText(/2分钟规则/)).toBeInTheDocument()
      })
    })
  })

  describe('任务列表显示', () => {
    it('应该显示收集箱中的任务', async () => {
      render(<GTDInbox gtdService={mockGTDService} />)
      
      await waitFor(() => {
        expect(screen.getByText('学习React测试')).toBeInTheDocument()
        expect(screen.getByText('准备会议材料')).toBeInTheDocument()
      })
    })

    it('应该显示任务的描述信息', async () => {
      render(<GTDInbox gtdService={mockGTDService} />)
      
      await waitFor(() => {
        expect(screen.getByText('深入学习React组件测试的最佳实践')).toBeInTheDocument()
        expect(screen.getByText('为下周的项目评审会议准备演示材料')).toBeInTheDocument()
      })
    })

    it('收集箱为空时应该显示空状态', async () => {
      mockGTDService.getInboxTasks.mockResolvedValue([])
      
      render(<GTDInbox gtdService={mockGTDService} />)
      
      await waitFor(() => {
        expect(screen.getByText('收集箱为空')).toBeInTheDocument()
        expect(screen.getByText('太棒了！所有想法都已处理完毕')).toBeInTheDocument()
      })
    })
  })

  describe('快速捕获功能', () => {
    it('应该能够输入文本并提交', async () => {
      const user = userEvent.setup()
      render(<GTDInbox gtdService={mockGTDService} />)
      
      const textarea = screen.getByPlaceholderText(/快速捕获想法/)
      const button = screen.getByText('捕获')
      
      // 输入文本
      await user.type(textarea, '新的任务想法')
      expect(textarea).toHaveValue('新的任务想法')
      
      // 点击捕获按钮
      await user.click(button)
      
      // 验证服务被调用
      expect(mockGTDService.addToInbox).toHaveBeenCalledWith('新的任务想法')
    })

    it('应该支持Ctrl+Enter快捷键提交', async () => {
      const user = userEvent.setup()
      render(<GTDInbox gtdService={mockGTDService} />)
      
      const textarea = screen.getByPlaceholderText(/快速捕获想法/)
      
      // 输入文本
      await user.type(textarea, '快捷键测试')
      
      // 使用Ctrl+Enter提交
      await user.keyboard('{Control>}{Enter}{/Control}')
      
      // 验证服务被调用
      expect(mockGTDService.addToInbox).toHaveBeenCalledWith('快捷键测试')
    })

    it('空输入时捕获按钮应该被禁用', () => {
      render(<GTDInbox gtdService={mockGTDService} />)
      
      const button = screen.getByText('捕获')
      expect(button).toBeDisabled()
    })

    it('提交后应该清空输入框', async () => {
      const user = userEvent.setup()
      render(<GTDInbox gtdService={mockGTDService} />)
      
      const textarea = screen.getByPlaceholderText(/快速捕获想法/)
      const button = screen.getByText('捕获')
      
      // 输入并提交
      await user.type(textarea, '测试任务')
      await user.click(button)
      
      // 等待提交完成
      await waitFor(() => {
        expect(textarea).toHaveValue('')
      })
    })
  })

  describe('任务操作', () => {
    it('应该显示处理和删除按钮', async () => {
      render(<GTDInbox gtdService={mockGTDService} />)
      
      await waitFor(() => {
        const processButtons = screen.getAllByText('⚡ 处理')
        const deleteButtons = screen.getAllByText('🗑️')
        
        expect(processButtons).toHaveLength(2)
        expect(deleteButtons).toHaveLength(2)
      })
    })

    it('点击处理按钮应该调用处理服务', async () => {
      const user = userEvent.setup()
      mockGTDService.processInboxItem.mockResolvedValue({
        isActionable: true,
        isProject: false,
        estimatedTime: 30,
        suggestedContext: '@电脑',
        suggestedPriority: TaskPriority.MEDIUM
      })
      
      render(<GTDInbox gtdService={mockGTDService} />)
      
      await waitFor(() => {
        const processButton = screen.getAllByText('⚡ 处理')[0]
        user.click(processButton)
      })
      
      await waitFor(() => {
        expect(mockGTDService.processInboxItem).toHaveBeenCalledWith('task-1')
      })
    })
  })

  describe('错误处理', () => {
    it('加载失败时应该显示错误信息', async () => {
      mockGTDService.getInboxTasks.mockRejectedValue(new Error('网络错误'))
      
      render(<GTDInbox gtdService={mockGTDService} />)
      
      await waitFor(() => {
        expect(screen.getByText(/网络错误/)).toBeInTheDocument()
      })
    })

    it('快速捕获失败时应该显示错误信息', async () => {
      const user = userEvent.setup()
      mockGTDService.addToInbox.mockRejectedValue(new Error('添加失败'))
      
      render(<GTDInbox gtdService={mockGTDService} />)
      
      const textarea = screen.getByPlaceholderText(/快速捕获想法/)
      const button = screen.getByText('捕获')
      
      await user.type(textarea, '测试任务')
      await user.click(button)
      
      await waitFor(() => {
        expect(screen.getByText(/添加失败/)).toBeInTheDocument()
      })
    })
  })

  describe('回调函数', () => {
    it('收集箱变更时应该调用回调函数', async () => {
      const onInboxChange = vi.fn()
      render(<GTDInbox gtdService={mockGTDService} onInboxChange={onInboxChange} />)
      
      await waitFor(() => {
        expect(onInboxChange).toHaveBeenCalledWith(mockTasks)
      })
    })

    it('任务处理后应该调用回调函数', async () => {
      const user = userEvent.setup()
      const onTaskProcessed = vi.fn()
      
      mockGTDService.processInboxItem.mockResolvedValue({
        isActionable: true,
        isProject: false,
        estimatedTime: 30
      })
      
      render(<GTDInbox gtdService={mockGTDService} onTaskProcessed={onTaskProcessed} />)
      
      await waitFor(async () => {
        const processButton = screen.getAllByText('⚡ 处理')[0]
        await user.click(processButton)
      })
      
      await waitFor(() => {
        expect(onTaskProcessed).toHaveBeenCalledWith(mockTasks[0])
      })
    })
  })
})
