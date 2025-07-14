/**
 * 项目管理器组件测试
 * 测试项目创建、任务分组、进度跟踪等功能
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ProjectManager } from '../ProjectManager'
import { Project, ProjectStatus, Task, TaskStatus } from '../../types'
import { IProjectsService, ITasksService } from '../../services'

// 模拟服务
const mockProjectsService: IProjectsService = {
  createProject: vi.fn(),
  getProject: vi.fn(),
  getProjects: vi.fn(),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
  getProjectStats: vi.fn(),
  searchProjects: vi.fn()
}

const mockTasksService: ITasksService = {
  createTask: vi.fn(),
  getTask: vi.fn(),
  getTasks: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  getTasksByProject: vi.fn(),
  getTasksByStatus: vi.fn(),
  getTasksByPriority: vi.fn(),
  getSubTasks: vi.fn(),
  markTaskCompleted: vi.fn(),
  markTaskInProgress: vi.fn(),
  markTaskCancelled: vi.fn(),
  getTaskStats: vi.fn(),
  searchTasks: vi.fn()
}

// 测试数据
const mockProjects: Project[] = [
  {
    id: 'project1',
    name: 'MingLog开发',
    description: '开发MingLog知识管理系统',
    status: ProjectStatus.ACTIVE,
    color: '#667eea',
    startDate: new Date('2024-01-01'),
    dueDate: new Date('2024-12-31'),
    tasks: [],
    linkedNotes: [],
    linkedFiles: [],
    progress: 65,
    totalTasks: 20,
    completedTasks: 13,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15')
  },
  {
    id: 'project2',
    name: '文档编写',
    description: '编写用户手册和技术文档',
    status: ProjectStatus.ON_HOLD,
    color: '#f59e0b',
    startDate: new Date('2024-02-01'),
    dueDate: new Date('2024-03-31'),
    tasks: [],
    linkedNotes: [],
    linkedFiles: [],
    progress: 30,
    totalTasks: 10,
    completedTasks: 3,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-10')
  }
]

const mockTasks: Task[] = [
  {
    id: 'task1',
    title: '设计数据库架构',
    description: '设计核心数据库表结构',
    status: TaskStatus.DONE,
    priority: 'high' as any,
    projectId: 'project1',
    linkedNotes: [],
    linkedFiles: [],
    tags: ['设计', '数据库'],
    contexts: ['@电脑'],
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-10')
  },
  {
    id: 'task2',
    title: '实现用户认证',
    description: '实现用户登录和权限管理',
    status: TaskStatus.IN_PROGRESS,
    priority: 'medium' as any,
    projectId: 'project1',
    linkedNotes: [],
    linkedFiles: [],
    tags: ['开发', '认证'],
    contexts: ['@电脑'],
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-15')
  }
]

describe('ProjectManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // 设置默认模拟返回值
    mockProjectsService.getProjects = vi.fn().mockResolvedValue(mockProjects)
    mockTasksService.getTasksByProject = vi.fn().mockResolvedValue(mockTasks)
  })

  describe('项目列表显示', () => {
    it('应该正确显示项目列表', async () => {
      render(
        <ProjectManager
          projectsService={mockProjectsService}
          tasksService={mockTasksService}
        />
      )

      // 等待项目加载
      await waitFor(() => {
        expect(screen.getByText('MingLog开发')).toBeInTheDocument()
        expect(screen.getByText('文档编写')).toBeInTheDocument()
      })

      // 验证项目信息显示
      expect(screen.getByText('开发MingLog知识管理系统')).toBeInTheDocument()
      expect(screen.getByText('65% 完成')).toBeInTheDocument()
      expect(screen.getByText('13/20 任务')).toBeInTheDocument()
    })

    it('应该显示项目统计信息', async () => {
      render(
        <ProjectManager
          projectsService={mockProjectsService}
          tasksService={mockTasksService}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('总计: 2')).toBeInTheDocument()
        expect(screen.getByText('进行中: 1')).toBeInTheDocument()
        expect(screen.getByText('已完成: 0')).toBeInTheDocument()
      })
    })

    it('应该支持项目状态过滤', async () => {
      render(
        <ProjectManager
          projectsService={mockProjectsService}
          tasksService={mockTasksService}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('MingLog开发')).toBeInTheDocument()
      })

      // 过滤进行中的项目
      const filterSelect = screen.getByDisplayValue('所有状态')
      fireEvent.change(filterSelect, { target: { value: ProjectStatus.ACTIVE } })

      expect(screen.getByText('MingLog开发')).toBeInTheDocument()
      expect(screen.queryByText('文档编写')).not.toBeInTheDocument()
    })
  })

  describe('项目创建', () => {
    it('应该能够打开创建项目对话框', async () => {
      render(
        <ProjectManager
          projectsService={mockProjectsService}
          tasksService={mockTasksService}
        />
      )

      const createButton = screen.getByText('➕ 创建项目')
      fireEvent.click(createButton)

      expect(screen.getByText('创建新项目')).toBeInTheDocument()
      expect(screen.getByLabelText('项目名称 *')).toBeInTheDocument()
    })

    it('应该能够创建新项目', async () => {
      const newProject: Project = {
        id: 'project3',
        name: '测试项目',
        description: '这是一个测试项目',
        status: ProjectStatus.ACTIVE,
        color: '#10b981',
        tasks: [],
        linkedNotes: [],
        linkedFiles: [],
        progress: 0,
        totalTasks: 0,
        completedTasks: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      mockProjectsService.createProject = vi.fn().mockResolvedValue(newProject)

      render(
        <ProjectManager
          projectsService={mockProjectsService}
          tasksService={mockTasksService}
        />
      )

      // 打开创建对话框
      const createButton = screen.getByText('➕ 创建项目')
      fireEvent.click(createButton)

      // 填写表单
      const nameInput = screen.getByLabelText('项目名称 *')
      const descriptionInput = screen.getByLabelText('项目描述')
      
      fireEvent.change(nameInput, { target: { value: '测试项目' } })
      fireEvent.change(descriptionInput, { target: { value: '这是一个测试项目' } })

      // 提交表单
      const submitButton = screen.getByText('创建项目')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(mockProjectsService.createProject).toHaveBeenCalledWith({
          name: '测试项目',
          description: '这是一个测试项目',
          color: '#667eea',
          startDate: expect.any(Date),
          dueDate: undefined
        })
      })
    })

    it('应该验证必填字段', async () => {
      render(
        <ProjectManager
          projectsService={mockProjectsService}
          tasksService={mockTasksService}
        />
      )

      // 打开创建对话框
      const createButton = screen.getByText('➕ 创建项目')
      fireEvent.click(createButton)

      // 尝试提交空表单
      const submitButton = screen.getByText('创建项目')
      fireEvent.click(submitButton)

      // 验证不会调用创建服务
      expect(mockProjectsService.createProject).not.toHaveBeenCalled()
    })
  })

  describe('项目选择和任务显示', () => {
    it('应该能够选择项目并显示任务', async () => {
      const onProjectSelect = vi.fn()

      render(
        <ProjectManager
          projectsService={mockProjectsService}
          tasksService={mockTasksService}
          onProjectSelect={onProjectSelect}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('MingLog开发')).toBeInTheDocument()
      })

      // 点击项目卡片
      const projectCard = screen.getByText('MingLog开发').closest('.project-card')
      fireEvent.click(projectCard!)

      await waitFor(() => {
        expect(mockTasksService.getTasksByProject).toHaveBeenCalledWith('project1')
        expect(onProjectSelect).toHaveBeenCalledWith(mockProjects[0])
      })
    })

    it('应该显示项目任务摘要', async () => {
      render(
        <ProjectManager
          projectsService={mockProjectsService}
          tasksService={mockTasksService}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('MingLog开发')).toBeInTheDocument()
      })

      // 选择项目
      const projectCard = screen.getByText('MingLog开发').closest('.project-card')
      fireEvent.click(projectCard!)

      await waitFor(() => {
        expect(screen.getByText('项目任务')).toBeInTheDocument()
        expect(screen.getByText('➕ 添加任务')).toBeInTheDocument()
      })
    })
  })

  describe('项目状态管理', () => {
    it('应该能够更新项目状态', async () => {
      const updatedProject = { ...mockProjects[0], status: ProjectStatus.COMPLETED }
      mockProjectsService.updateProject = vi.fn().mockResolvedValue(updatedProject)

      render(
        <ProjectManager
          projectsService={mockProjectsService}
          tasksService={mockTasksService}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('MingLog开发')).toBeInTheDocument()
      })

      // 找到状态选择器
      const statusSelects = screen.getAllByDisplayValue('进行中')
      const statusSelect = statusSelects[0]

      // 更改状态
      fireEvent.change(statusSelect, { target: { value: ProjectStatus.COMPLETED } })

      await waitFor(() => {
        expect(mockProjectsService.updateProject).toHaveBeenCalledWith('project1', {
          status: ProjectStatus.COMPLETED
        })
      })
    })

    it('应该显示正确的状态图标', async () => {
      render(
        <ProjectManager
          projectsService={mockProjectsService}
          tasksService={mockTasksService}
        />
      )

      await waitFor(() => {
        // 进行中项目应该显示火箭图标
        expect(screen.getByText('🚀')).toBeInTheDocument()
        // 暂停项目应该显示暂停图标
        expect(screen.getByText('⏸️')).toBeInTheDocument()
      })
    })
  })

  describe('项目删除', () => {
    it('应该能够删除项目', async () => {
      // 模拟确认对话框
      window.confirm = vi.fn().mockReturnValue(true)
      mockProjectsService.deleteProject = vi.fn().mockResolvedValue(true)

      render(
        <ProjectManager
          projectsService={mockProjectsService}
          tasksService={mockTasksService}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('MingLog开发')).toBeInTheDocument()
      })

      // 点击删除按钮
      const deleteButtons = screen.getAllByTitle('删除项目')
      fireEvent.click(deleteButtons[0])

      await waitFor(() => {
        expect(window.confirm).toHaveBeenCalledWith(
          '确定要删除这个项目吗？这将同时删除项目下的所有任务。'
        )
        expect(mockProjectsService.deleteProject).toHaveBeenCalledWith('project1')
      })
    })

    it('应该在用户取消时不删除项目', async () => {
      window.confirm = vi.fn().mockReturnValue(false)

      render(
        <ProjectManager
          projectsService={mockProjectsService}
          tasksService={mockTasksService}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('MingLog开发')).toBeInTheDocument()
      })

      // 点击删除按钮
      const deleteButtons = screen.getAllByTitle('删除项目')
      fireEvent.click(deleteButtons[0])

      expect(mockProjectsService.deleteProject).not.toHaveBeenCalled()
    })
  })

  describe('视图模式切换', () => {
    it('应该支持网格和列表视图切换', async () => {
      render(
        <ProjectManager
          projectsService={mockProjectsService}
          tasksService={mockTasksService}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('MingLog开发')).toBeInTheDocument()
      })

      // 切换到列表视图
      const listViewButton = screen.getByTitle('列表视图')
      fireEvent.click(listViewButton)

      const container = screen.getByText('MingLog开发').closest('.projects-container')
      expect(container).toHaveClass('list')

      // 切换回网格视图
      const gridViewButton = screen.getByTitle('网格视图')
      fireEvent.click(gridViewButton)

      expect(container).toHaveClass('grid')
    })
  })

  describe('空状态处理', () => {
    it('应该显示空状态当没有项目时', async () => {
      mockProjectsService.getProjects = vi.fn().mockResolvedValue([])

      render(
        <ProjectManager
          projectsService={mockProjectsService}
          tasksService={mockTasksService}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('暂无项目')).toBeInTheDocument()
        expect(screen.getByText('创建您的第一个项目来开始管理任务')).toBeInTheDocument()
      })
    })

    it('应该显示过滤后的空状态', async () => {
      render(
        <ProjectManager
          projectsService={mockProjectsService}
          tasksService={mockTasksService}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('MingLog开发')).toBeInTheDocument()
      })

      // 过滤已完成的项目（没有）
      const filterSelect = screen.getByDisplayValue('所有状态')
      fireEvent.change(filterSelect, { target: { value: ProjectStatus.COMPLETED } })

      expect(screen.getByText('没有找到completed状态的项目')).toBeInTheDocument()
    })
  })

  describe('加载状态', () => {
    it('应该显示加载状态', async () => {
      // 模拟延迟加载
      mockProjectsService.getProjects = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockProjects), 100))
      )

      render(
        <ProjectManager
          projectsService={mockProjectsService}
          tasksService={mockTasksService}
        />
      )

      expect(screen.getByText('加载项目中...')).toBeInTheDocument()

      await waitFor(() => {
        expect(screen.getByText('MingLog开发')).toBeInTheDocument()
      })
    })
  })

  describe('错误处理', () => {
    it('应该处理项目加载错误', async () => {
      mockProjectsService.getProjects = vi.fn().mockRejectedValue(new Error('网络错误'))

      render(
        <ProjectManager
          projectsService={mockProjectsService}
          tasksService={mockTasksService}
        />
      )

      await waitFor(() => {
        expect(screen.getByText(/加载项目失败: 网络错误/)).toBeInTheDocument()
      })
    })

    it('应该处理项目创建错误', async () => {
      mockProjectsService.createProject = vi.fn().mockRejectedValue(new Error('创建失败'))

      render(
        <ProjectManager
          projectsService={mockProjectsService}
          tasksService={mockTasksService}
        />
      )

      // 打开创建对话框
      const createButton = screen.getByText('➕ 创建项目')
      fireEvent.click(createButton)

      // 填写并提交表单
      const nameInput = screen.getByLabelText('项目名称 *')
      fireEvent.change(nameInput, { target: { value: '测试项目' } })

      const submitButton = screen.getByText('创建项目')
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/创建项目失败: 创建失败/)).toBeInTheDocument()
      })
    })
  })

  describe('外部控制', () => {
    it('应该响应外部项目选择', async () => {
      const { rerender } = render(
        <ProjectManager
          projectsService={mockProjectsService}
          tasksService={mockTasksService}
          selectedProjectId="project1"
        />
      )

      await waitFor(() => {
        expect(screen.getByText('MingLog开发')).toBeInTheDocument()
      })

      // 验证项目被选中
      const projectCard = screen.getByText('MingLog开发').closest('.project-card')
      expect(projectCard).toHaveClass('selected')

      // 更改外部选择
      rerender(
        <ProjectManager
          projectsService={mockProjectsService}
          tasksService={mockTasksService}
          selectedProjectId="project2"
        />
      )

      await waitFor(() => {
        const project2Card = screen.getByText('文档编写').closest('.project-card')
        expect(project2Card).toHaveClass('selected')
      })
    })

    it('应该调用任务创建回调', async () => {
      const onTaskCreate = vi.fn()

      render(
        <ProjectManager
          projectsService={mockProjectsService}
          tasksService={mockTasksService}
          onTaskCreate={onTaskCreate}
        />
      )

      await waitFor(() => {
        expect(screen.getByText('MingLog开发')).toBeInTheDocument()
      })

      // 选择项目
      const projectCard = screen.getByText('MingLog开发').closest('.project-card')
      fireEvent.click(projectCard!)

      await waitFor(() => {
        expect(screen.getByText('➕ 添加任务')).toBeInTheDocument()
      })

      // 点击添加任务
      const addTaskButton = screen.getByText('➕ 添加任务')
      fireEvent.click(addTaskButton)

      expect(onTaskCreate).toHaveBeenCalledWith('project1')
    })
  })
})
