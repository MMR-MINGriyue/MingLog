/**
 * 项目管理器组件
 * 提供项目创建、任务分组、进度跟踪和时间统计功能
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { Project, ProjectStatus, Task, TaskStatus, CreateProjectRequest } from '../types'
import { IProjectsService, ITasksService } from '../services'

interface ProjectManagerProps {
  /** 项目服务 */
  projectsService: IProjectsService
  /** 任务服务 */
  tasksService: ITasksService
  /** 当前选中的项目ID */
  selectedProjectId?: string
  /** 项目选择回调 */
  onProjectSelect?: (project: Project | null) => void
  /** 任务创建回调 */
  onTaskCreate?: (projectId: string) => void
  /** 类名 */
  className?: string
}

interface ManagerState {
  /** 项目列表 */
  projects: Project[]
  /** 选中的项目 */
  selectedProject: Project | null
  /** 项目任务 */
  projectTasks: Task[]
  /** 是否显示创建项目对话框 */
  showCreateDialog: boolean
  /** 是否正在加载 */
  loading: boolean
  /** 错误信息 */
  error: string | null
  /** 视图模式 */
  viewMode: 'grid' | 'list' | 'kanban'
  /** 过滤状态 */
  filterStatus: ProjectStatus | 'all'
}

/**
 * 项目管理器组件
 */
export const ProjectManager: React.FC<ProjectManagerProps> = ({
  projectsService,
  tasksService,
  selectedProjectId,
  onProjectSelect,
  onTaskCreate,
  className = ''
}) => {
  // 状态管理
  const [managerState, setManagerState] = useState<ManagerState>({
    projects: [],
    selectedProject: null,
    projectTasks: [],
    showCreateDialog: false,
    loading: false,
    error: null,
    viewMode: 'grid',
    filterStatus: 'all'
  })

  /**
   * 加载项目列表
   */
  const loadProjects = useCallback(async () => {
    setManagerState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const projects = await projectsService.getProjects()
      setManagerState(prev => ({
        ...prev,
        projects,
        loading: false
      }))
    } catch (error) {
      setManagerState(prev => ({
        ...prev,
        error: `加载项目失败: ${error instanceof Error ? error.message : '未知错误'}`,
        loading: false
      }))
    }
  }, [projectsService])

  /**
   * 加载项目任务
   */
  const loadProjectTasks = useCallback(async (projectId: string) => {
    try {
      const tasks = await tasksService.getTasksByProject(projectId)
      setManagerState(prev => ({
        ...prev,
        projectTasks: tasks
      }))
    } catch (error) {
      console.error('加载项目任务失败:', error)
    }
  }, [tasksService])

  /**
   * 创建项目
   */
  const handleCreateProject = useCallback(async (request: CreateProjectRequest) => {
    try {
      const project = await projectsService.createProject(request)
      setManagerState(prev => ({
        ...prev,
        projects: [...prev.projects, project],
        showCreateDialog: false
      }))
    } catch (error) {
      setManagerState(prev => ({
        ...prev,
        error: `创建项目失败: ${error instanceof Error ? error.message : '未知错误'}`
      }))
    }
  }, [projectsService])

  /**
   * 选择项目
   */
  const handleProjectSelect = useCallback((project: Project | null) => {
    setManagerState(prev => ({
      ...prev,
      selectedProject: project
    }))

    if (project) {
      loadProjectTasks(project.id)
    } else {
      setManagerState(prev => ({
        ...prev,
        projectTasks: []
      }))
    }

    onProjectSelect?.(project)
  }, [loadProjectTasks, onProjectSelect])

  /**
   * 删除项目
   */
  const handleDeleteProject = useCallback(async (projectId: string) => {
    if (!confirm('确定要删除这个项目吗？这将同时删除项目下的所有任务。')) {
      return
    }

    try {
      await projectsService.deleteProject(projectId)
      setManagerState(prev => ({
        ...prev,
        projects: prev.projects.filter(p => p.id !== projectId),
        selectedProject: prev.selectedProject?.id === projectId ? null : prev.selectedProject,
        projectTasks: prev.selectedProject?.id === projectId ? [] : prev.projectTasks
      }))
    } catch (error) {
      setManagerState(prev => ({
        ...prev,
        error: `删除项目失败: ${error instanceof Error ? error.message : '未知错误'}`
      }))
    }
  }, [projectsService])

  /**
   * 更新项目状态
   */
  const handleUpdateProjectStatus = useCallback(async (projectId: string, status: ProjectStatus) => {
    try {
      const updatedProject = await projectsService.updateProject(projectId, { status })
      setManagerState(prev => ({
        ...prev,
        projects: prev.projects.map(p => p.id === projectId ? updatedProject : p),
        selectedProject: prev.selectedProject?.id === projectId ? updatedProject : prev.selectedProject
      }))
    } catch (error) {
      setManagerState(prev => ({
        ...prev,
        error: `更新项目状态失败: ${error instanceof Error ? error.message : '未知错误'}`
      }))
    }
  }, [projectsService])

  // 过滤后的项目列表
  const filteredProjects = useMemo(() => {
    if (managerState.filterStatus === 'all') {
      return managerState.projects
    }
    return managerState.projects.filter(project => project.status === managerState.filterStatus)
  }, [managerState.projects, managerState.filterStatus])

  // 项目统计信息
  const projectStats = useMemo(() => {
    const total = managerState.projects.length
    const active = managerState.projects.filter(p => p.status === ProjectStatus.ACTIVE).length
    const completed = managerState.projects.filter(p => p.status === ProjectStatus.COMPLETED).length
    const onHold = managerState.projects.filter(p => p.status === ProjectStatus.ON_HOLD).length

    return { total, active, completed, onHold }
  }, [managerState.projects])

  // 计算项目进度
  const calculateProjectProgress = useCallback((project: Project): number => {
    if (project.totalTasks === 0) return 0
    return Math.round((project.completedTasks / project.totalTasks) * 100)
  }, [])

  // 获取项目状态颜色
  const getProjectStatusColor = useCallback((status: ProjectStatus): string => {
    const colors = {
      [ProjectStatus.ACTIVE]: '#10b981',
      [ProjectStatus.ON_HOLD]: '#f59e0b',
      [ProjectStatus.COMPLETED]: '#6b7280',
      [ProjectStatus.CANCELLED]: '#ef4444'
    }
    return colors[status]
  }, [])

  // 获取项目状态图标
  const getProjectStatusIcon = useCallback((status: ProjectStatus): string => {
    const icons = {
      [ProjectStatus.ACTIVE]: '🚀',
      [ProjectStatus.ON_HOLD]: '⏸️',
      [ProjectStatus.COMPLETED]: '✅',
      [ProjectStatus.CANCELLED]: '❌'
    }
    return icons[status]
  }, [])

  /**
   * 渲染项目创建对话框
   */
  const renderCreateDialog = () => {
    if (!managerState.showCreateDialog) return null

    return (
      <div className="create-dialog-overlay">
        <div className="create-dialog">
          <div className="dialog-header">
            <h3>创建新项目</h3>
            <button
              onClick={() => setManagerState(prev => ({ ...prev, showCreateDialog: false }))}
              className="close-button"
            >
              ✕
            </button>
          </div>

          <ProjectCreateForm
            onSubmit={handleCreateProject}
            onCancel={() => setManagerState(prev => ({ ...prev, showCreateDialog: false }))}
          />
        </div>
      </div>
    )
  }

  /**
   * 渲染项目卡片
   */
  const renderProjectCard = (project: Project) => {
    const progress = calculateProjectProgress(project)
    const isSelected = managerState.selectedProject?.id === project.id

    return (
      <div
        key={project.id}
        onClick={() => handleProjectSelect(project)}
        className={`project-card ${isSelected ? 'selected' : ''}`}
        style={{ borderLeftColor: project.color || getProjectStatusColor(project.status) }}
      >
        <div className="project-header">
          <div className="project-title">
            <span className="project-icon">{getProjectStatusIcon(project.status)}</span>
            <span className="project-name">{project.name}</span>
          </div>
          <div className="project-actions">
            <select
              value={project.status}
              onChange={(e) => handleUpdateProjectStatus(project.id, e.target.value as ProjectStatus)}
              className="status-select"
              onClick={(e) => e.stopPropagation()}
            >
              <option value={ProjectStatus.ACTIVE}>进行中</option>
              <option value={ProjectStatus.ON_HOLD}>暂停</option>
              <option value={ProjectStatus.COMPLETED}>已完成</option>
              <option value={ProjectStatus.CANCELLED}>已取消</option>
            </select>
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteProject(project.id)
              }}
              className="delete-button"
              title="删除项目"
            >
              🗑️
            </button>
          </div>
        </div>

        {project.description && (
          <div className="project-description">{project.description}</div>
        )}

        <div className="project-progress">
          <div className="progress-info">
            <span className="progress-text">{progress}% 完成</span>
            <span className="task-count">{project.completedTasks}/{project.totalTasks} 任务</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%`, backgroundColor: project.color || getProjectStatusColor(project.status) }}
            />
          </div>
        </div>

        <div className="project-meta">
          {project.dueDate && (
            <div className="due-date">
              📅 {new Date(project.dueDate).toLocaleDateString('zh-CN')}
            </div>
          )}
          <div className="created-date">
            创建于 {new Date(project.createdAt).toLocaleDateString('zh-CN')}
          </div>
        </div>

        {isSelected && (
          <div className="project-tasks-summary">
            <div className="tasks-header">
              <span>项目任务</span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onTaskCreate?.(project.id)
                }}
                className="add-task-button"
              >
                ➕ 添加任务
              </button>
            </div>
            <div className="task-status-summary">
              {Object.values(TaskStatus).map(status => {
                const count = managerState.projectTasks.filter(t => t.status === status).length
                if (count === 0) return null
                return (
                  <div key={status} className="status-count">
                    <span className="status-label">{getTaskStatusLabel(status)}</span>
                    <span className="status-number">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  /**
   * 获取任务状态标签
   */
  const getTaskStatusLabel = (status: TaskStatus): string => {
    const labels = {
      [TaskStatus.INBOX]: '收集箱',
      [TaskStatus.TODO]: '待办',
      [TaskStatus.IN_PROGRESS]: '进行中',
      [TaskStatus.WAITING]: '等待',
      [TaskStatus.SOMEDAY]: '将来/也许',
      [TaskStatus.DONE]: '已完成',
      [TaskStatus.CANCELLED]: '已取消'
    }
    return labels[status]
  }

  // 初始化加载
  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  // 处理外部选中项目
  useEffect(() => {
    if (selectedProjectId) {
      const project = managerState.projects.find(p => p.id === selectedProjectId)
      if (project) {
        handleProjectSelect(project)
      }
    }
  }, [selectedProjectId, managerState.projects, handleProjectSelect])

  return (
    <div className={`project-manager ${className}`}>
      {/* 工具栏 */}
      <div className="project-toolbar">
        <div className="toolbar-left">
          <h2>📁 项目管理</h2>
          <div className="project-stats">
            <span className="stat-item">总计: {projectStats.total}</span>
            <span className="stat-item">进行中: {projectStats.active}</span>
            <span className="stat-item">已完成: {projectStats.completed}</span>
          </div>
        </div>

        <div className="toolbar-right">
          <select
            value={managerState.filterStatus}
            onChange={(e) => setManagerState(prev => ({ ...prev, filterStatus: e.target.value as any }))}
            className="filter-select"
          >
            <option value="all">所有状态</option>
            <option value={ProjectStatus.ACTIVE}>进行中</option>
            <option value={ProjectStatus.ON_HOLD}>暂停</option>
            <option value={ProjectStatus.COMPLETED}>已完成</option>
            <option value={ProjectStatus.CANCELLED}>已取消</option>
          </select>

          <div className="view-mode-buttons">
            <button
              onClick={() => setManagerState(prev => ({ ...prev, viewMode: 'grid' }))}
              className={`view-button ${managerState.viewMode === 'grid' ? 'active' : ''}`}
              title="网格视图"
            >
              ⚏
            </button>
            <button
              onClick={() => setManagerState(prev => ({ ...prev, viewMode: 'list' }))}
              className={`view-button ${managerState.viewMode === 'list' ? 'active' : ''}`}
              title="列表视图"
            >
              ☰
            </button>
          </div>

          <button
            onClick={() => setManagerState(prev => ({ ...prev, showCreateDialog: true }))}
            className="create-project-button"
          >
            ➕ 创建项目
          </button>
        </div>
      </div>

      {/* 错误信息 */}
      {managerState.error && (
        <div className="error-message">
          ❌ {managerState.error}
          <button
            onClick={() => setManagerState(prev => ({ ...prev, error: null }))}
            className="dismiss-button"
          >
            ✕
          </button>
        </div>
      )}

      {/* 项目列表 */}
      <div className={`projects-container ${managerState.viewMode}`}>
        {managerState.loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <span>加载项目中...</span>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📁</div>
            <div className="empty-title">暂无项目</div>
            <div className="empty-description">
              {managerState.filterStatus === 'all' 
                ? '创建您的第一个项目来开始管理任务'
                : `没有找到${managerState.filterStatus}状态的项目`
              }
            </div>
            <button
              onClick={() => setManagerState(prev => ({ ...prev, showCreateDialog: true }))}
              className="create-first-project-button"
            >
              ➕ 创建项目
            </button>
          </div>
        ) : (
          <div className="projects-grid">
            {filteredProjects.map(renderProjectCard)}
          </div>
        )}
      </div>

      {/* 创建项目对话框 */}
      {renderCreateDialog()}
    </div>
  )
}

/**
 * 项目创建表单组件
 */
interface ProjectCreateFormProps {
  onSubmit: (request: CreateProjectRequest) => void
  onCancel: () => void
}

const ProjectCreateForm: React.FC<ProjectCreateFormProps> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<CreateProjectRequest>({
    name: '',
    description: '',
    color: '#667eea',
    startDate: new Date(),
    dueDate: undefined
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.name.trim()) {
      onSubmit(formData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="project-create-form">
      <div className="form-group">
        <label htmlFor="project-name">项目名称 *</label>
        <input
          id="project-name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="输入项目名称"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="project-description">项目描述</label>
        <textarea
          id="project-description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="描述项目目标和范围"
          rows={3}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="project-color">项目颜色</label>
          <input
            id="project-color"
            type="color"
            value={formData.color}
            onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
          />
        </div>

        <div className="form-group">
          <label htmlFor="project-due-date">截止日期</label>
          <input
            id="project-due-date"
            type="date"
            value={formData.dueDate ? formData.dueDate.toISOString().split('T')[0] : ''}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              dueDate: e.target.value ? new Date(e.target.value) : undefined 
            }))}
          />
        </div>
      </div>

      <div className="form-actions">
        <button type="button" onClick={onCancel} className="cancel-button">
          取消
        </button>
        <button type="submit" className="submit-button">
          创建项目
        </button>
      </div>
    </form>
  )
}

export default ProjectManager
