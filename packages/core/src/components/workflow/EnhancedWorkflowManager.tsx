/**
 * 增强版工作流管理器组件
 * 提供完整的工作流创建、编辑、监控和管理功能
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { cn } from '../../utils'
import { 
  WorkflowAutomationService,
  WorkflowDefinition,
  WorkflowTemplate,
  WorkflowExecution,
  WorkflowStatus,
  ExecutionStatus,
  TriggerType,
  ActionType
} from '../../services/WorkflowAutomationService'
import './EnhancedWorkflowManager.css'

// 工作流管理器属性
export interface EnhancedWorkflowManagerProps {
  /** 工作流自动化服务 */
  workflowService: WorkflowAutomationService
  /** 是否显示高级功能 */
  showAdvancedFeatures?: boolean
  /** 是否启用调试模式 */
  enableDebugMode?: boolean
  /** 是否显示模板库 */
  showTemplateLibrary?: boolean
  /** 是否启用实时监控 */
  enableRealTimeMonitoring?: boolean
  /** 自定义样式类名 */
  className?: string
  /** 工作流创建回调 */
  onWorkflowCreate?: (workflowId: string) => void
  /** 工作流更新回调 */
  onWorkflowUpdate?: (workflowId: string) => void
  /** 工作流删除回调 */
  onWorkflowDelete?: (workflowId: string) => void
  /** 错误回调 */
  onError?: (error: string) => void
}

/**
 * 增强版工作流管理器组件
 */
export const EnhancedWorkflowManager: React.FC<EnhancedWorkflowManagerProps> = ({
  workflowService,
  showAdvancedFeatures = true,
  enableDebugMode = false,
  showTemplateLibrary = true,
  enableRealTimeMonitoring = true,
  className,
  onWorkflowCreate,
  onWorkflowUpdate,
  onWorkflowDelete,
  onError
}) => {
  // 状态管理
  const [activeTab, setActiveTab] = useState<'workflows' | 'templates' | 'executions' | 'monitoring'>('workflows')
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([])
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([])
  const [executions, setExecutions] = useState<WorkflowExecution[]>([])
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowDefinition | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')

  // UI状态
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<WorkflowStatus | 'all'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'created' | 'updated' | 'executions'>('updated')

  // 实时监控状态
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [monitoringStats, setMonitoringStats] = useState({
    activeWorkflows: 0,
    totalExecutions: 0,
    successRate: 0,
    averageExecutionTime: 0
  })

  // 加载数据
  useEffect(() => {
    loadWorkflows()
    if (showTemplateLibrary) {
      loadTemplates()
    }
    loadExecutions()
  }, [workflowService, showTemplateLibrary])

  // 实时监控
  useEffect(() => {
    if (enableRealTimeMonitoring && isMonitoring) {
      const interval = setInterval(() => {
        updateMonitoringStats()
        loadExecutions()
      }, 5000) // 每5秒更新一次

      return () => clearInterval(interval)
    }
  }, [enableRealTimeMonitoring, isMonitoring])

  // 加载工作流
  const loadWorkflows = useCallback(async () => {
    try {
      setIsLoading(true)
      const workflowList = workflowService.getWorkflows()
      setWorkflows(workflowList)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '加载工作流失败'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [workflowService, onError])

  // 加载模板
  const loadTemplates = useCallback(async () => {
    try {
      const templateList = workflowService.getWorkflowTemplates()
      setTemplates(templateList)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '加载模板失败'
      setError(errorMessage)
      onError?.(errorMessage)
    }
  }, [workflowService, onError])

  // 加载执行记录
  const loadExecutions = useCallback(async () => {
    try {
      const executionList = workflowService.getExecutions(50)
      setExecutions(executionList)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '加载执行记录失败'
      setError(errorMessage)
      onError?.(errorMessage)
    }
  }, [workflowService, onError])

  // 更新监控统计
  const updateMonitoringStats = useCallback(() => {
    const activeWorkflows = workflows.filter(w => w.status === WorkflowStatus.ACTIVE).length
    const totalExecutions = executions.length
    const successfulExecutions = executions.filter(e => e.status === ExecutionStatus.COMPLETED).length
    const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0
    const averageExecutionTime = executions.length > 0 
      ? executions.reduce((sum, e) => sum + (e.duration || 0), 0) / executions.length 
      : 0

    setMonitoringStats({
      activeWorkflows,
      totalExecutions,
      successRate,
      averageExecutionTime
    })
  }, [workflows, executions])

  // 过滤和排序工作流
  const filteredAndSortedWorkflows = useMemo(() => {
    let filtered = workflows

    // 搜索过滤
    if (searchQuery) {
      filtered = filtered.filter(workflow =>
        workflow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        workflow.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        workflow.metadata.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }

    // 状态过滤
    if (filterStatus !== 'all') {
      filtered = filtered.filter(workflow => workflow.status === filterStatus)
    }

    // 排序
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name)
        case 'created':
          return new Date(b.metadata.createdAt).getTime() - new Date(a.metadata.createdAt).getTime()
        case 'updated':
          return new Date(b.metadata.updatedAt).getTime() - new Date(a.metadata.updatedAt).getTime()
        case 'executions':
          const aExecutions = executions.filter(e => e.workflowId === a.id).length
          const bExecutions = executions.filter(e => e.workflowId === b.id).length
          return bExecutions - aExecutions
        default:
          return 0
      }
    })

    return filtered
  }, [workflows, searchQuery, filterStatus, sortBy, executions])

  // 创建工作流
  const handleCreateWorkflow = useCallback(async (definition: Omit<WorkflowDefinition, 'id' | 'metadata'>) => {
    try {
      const workflowId = await workflowService.createWorkflow(definition)
      await loadWorkflows()
      setShowCreateDialog(false)
      onWorkflowCreate?.(workflowId)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建工作流失败'
      setError(errorMessage)
      onError?.(errorMessage)
    }
  }, [workflowService, loadWorkflows, onWorkflowCreate, onError])

  // 更新工作流
  const handleUpdateWorkflow = useCallback(async (workflowId: string, updates: Partial<WorkflowDefinition>) => {
    try {
      await workflowService.updateWorkflow(workflowId, updates)
      await loadWorkflows()
      setShowEditDialog(false)
      onWorkflowUpdate?.(workflowId)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '更新工作流失败'
      setError(errorMessage)
      onError?.(errorMessage)
    }
  }, [workflowService, loadWorkflows, onWorkflowUpdate, onError])

  // 删除工作流
  const handleDeleteWorkflow = useCallback(async (workflowId: string) => {
    if (!confirm('确定要删除这个工作流吗？此操作不可撤销。')) return

    try {
      await workflowService.deleteWorkflow(workflowId)
      await loadWorkflows()
      if (selectedWorkflow?.id === workflowId) {
        setSelectedWorkflow(null)
      }
      onWorkflowDelete?.(workflowId)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除工作流失败'
      setError(errorMessage)
      onError?.(errorMessage)
    }
  }, [workflowService, loadWorkflows, selectedWorkflow, onWorkflowDelete, onError])

  // 启动/停止工作流
  const handleToggleWorkflow = useCallback(async (workflowId: string, enabled: boolean) => {
    try {
      if (enabled) {
        await workflowService.startWorkflow(workflowId)
      } else {
        await workflowService.stopWorkflow(workflowId)
      }
      await loadWorkflows()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '切换工作流状态失败'
      setError(errorMessage)
      onError?.(errorMessage)
    }
  }, [workflowService, loadWorkflows, onError])

  // 手动执行工作流
  const handleExecuteWorkflow = useCallback(async (workflowId: string) => {
    try {
      const executionId = await workflowService.executeWorkflow(workflowId)
      await loadExecutions()
      
      // 切换到执行记录标签页
      setActiveTab('executions')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '执行工作流失败'
      setError(errorMessage)
      onError?.(errorMessage)
    }
  }, [workflowService, loadExecutions, onError])

  // 从模板创建工作流
  const handleCreateFromTemplate = useCallback(async (templateId: string, name: string, variables: Record<string, any>) => {
    try {
      const workflowId = await workflowService.createWorkflowFromTemplate(templateId, name, variables)
      await loadWorkflows()
      setShowTemplateDialog(false)
      onWorkflowCreate?.(workflowId)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '从模板创建工作流失败'
      setError(errorMessage)
      onError?.(errorMessage)
    }
  }, [workflowService, loadWorkflows, onWorkflowCreate, onError])

  // 渲染工作流卡片
  const renderWorkflowCard = (workflow: WorkflowDefinition) => {
    const workflowExecutions = executions.filter(e => e.workflowId === workflow.id)
    const lastExecution = workflowExecutions[0]
    const successRate = workflowExecutions.length > 0 
      ? (workflowExecutions.filter(e => e.status === ExecutionStatus.COMPLETED).length / workflowExecutions.length) * 100 
      : 0

    return (
      <div
        key={workflow.id}
        className={cn(
          'workflow-card',
          selectedWorkflow?.id === workflow.id && 'selected',
          workflow.status === WorkflowStatus.ACTIVE && 'active'
        )}
        onClick={() => setSelectedWorkflow(workflow)}
      >
        <div className="workflow-header">
          <div className="workflow-info">
            <h3 className="workflow-name">{workflow.name}</h3>
            <p className="workflow-description">{workflow.description}</p>
          </div>
          
          <div className="workflow-status">
            <span className={cn('status-badge', workflow.status.toLowerCase())}>
              {workflow.status === WorkflowStatus.ACTIVE ? '运行中' : 
               workflow.status === WorkflowStatus.INACTIVE ? '已停止' : '草稿'}
            </span>
          </div>
        </div>

        <div className="workflow-stats">
          <div className="stat-item">
            <span className="stat-label">触发器</span>
            <span className="stat-value">{workflow.triggers.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">动作</span>
            <span className="stat-value">{workflow.actions.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">执行次数</span>
            <span className="stat-value">{workflowExecutions.length}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">成功率</span>
            <span className="stat-value">{successRate.toFixed(1)}%</span>
          </div>
        </div>

        <div className="workflow-meta">
          <div className="workflow-tags">
            {workflow.metadata.tags.map(tag => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
          
          <div className="workflow-dates">
            <span className="date-info">
              更新于 {new Date(workflow.metadata.updatedAt).toLocaleDateString()}
            </span>
            {lastExecution && (
              <span className="last-execution">
                最后执行: {new Date(lastExecution.startTime).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        <div className="workflow-actions">
          <button
            className={cn('action-btn', 'toggle-btn', workflow.status === WorkflowStatus.ACTIVE && 'active')}
            onClick={(e) => {
              e.stopPropagation()
              handleToggleWorkflow(workflow.id, workflow.status !== WorkflowStatus.ACTIVE)
            }}
          >
            {workflow.status === WorkflowStatus.ACTIVE ? '停止' : '启动'}
          </button>
          
          <button
            className="action-btn execute-btn"
            onClick={(e) => {
              e.stopPropagation()
              handleExecuteWorkflow(workflow.id)
            }}
          >
            执行
          </button>
          
          <button
            className="action-btn edit-btn"
            onClick={(e) => {
              e.stopPropagation()
              setSelectedWorkflow(workflow)
              setShowEditDialog(true)
            }}
          >
            编辑
          </button>
          
          <button
            className="action-btn delete-btn"
            onClick={(e) => {
              e.stopPropagation()
              handleDeleteWorkflow(workflow.id)
            }}
          >
            删除
          </button>
        </div>
      </div>
    )
  }

  // 渲染模板卡片
  const renderTemplateCard = (template: WorkflowTemplate) => (
    <div key={template.id} className="template-card">
      <div className="template-header">
        <h3 className="template-name">{template.name}</h3>
        <span className="template-category">{template.category}</span>
      </div>
      
      <p className="template-description">{template.description}</p>
      
      <div className="template-tags">
        {template.tags.map(tag => (
          <span key={tag} className="tag">{tag}</span>
        ))}
      </div>
      
      <div className="template-actions">
        <button
          className="action-btn primary"
          onClick={() => {
            setSelectedWorkflow(null)
            setShowTemplateDialog(true)
          }}
        >
          使用模板
        </button>
        
        <button className="action-btn secondary">
          预览
        </button>
      </div>
    </div>
  )

  // 渲染执行记录
  const renderExecutionItem = (execution: WorkflowExecution) => {
    const workflow = workflows.find(w => w.id === execution.workflowId)
    
    return (
      <div key={execution.id} className="execution-item">
        <div className="execution-header">
          <div className="execution-info">
            <h4 className="execution-workflow">{workflow?.name || '未知工作流'}</h4>
            <span className="execution-id">#{execution.id.slice(-8)}</span>
          </div>
          
          <div className="execution-status">
            <span className={cn('status-badge', execution.status.toLowerCase())}>
              {execution.status === ExecutionStatus.COMPLETED ? '已完成' :
               execution.status === ExecutionStatus.RUNNING ? '运行中' :
               execution.status === ExecutionStatus.FAILED ? '失败' : '等待中'}
            </span>
          </div>
        </div>
        
        <div className="execution-details">
          <div className="detail-item">
            <span className="detail-label">开始时间:</span>
            <span className="detail-value">{new Date(execution.startTime).toLocaleString()}</span>
          </div>
          
          {execution.endTime && (
            <div className="detail-item">
              <span className="detail-label">结束时间:</span>
              <span className="detail-value">{new Date(execution.endTime).toLocaleString()}</span>
            </div>
          )}
          
          {execution.duration && (
            <div className="detail-item">
              <span className="detail-label">执行时长:</span>
              <span className="detail-value">{execution.duration.toFixed(2)}ms</span>
            </div>
          )}
          
          <div className="detail-item">
            <span className="detail-label">步骤:</span>
            <span className="detail-value">{execution.steps.length}</span>
          </div>
        </div>
        
        {execution.logs.length > 0 && (
          <div className="execution-logs">
            <h5>执行日志:</h5>
            <div className="log-list">
              {execution.logs.slice(0, 3).map((log, index) => (
                <div key={index} className={cn('log-item', log.level)}>
                  <span className="log-time">{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <span className="log-message">{log.message}</span>
                </div>
              ))}
              {execution.logs.length > 3 && (
                <div className="log-more">
                  还有 {execution.logs.length - 3} 条日志...
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className={cn('enhanced-workflow-manager', className)}>
      {/* 标题栏 */}
      <div className="manager-header">
        <div className="header-content">
          <h1 className="manager-title">🔄 工作流自动化</h1>
          <div className="header-stats">
            <div className="stat-item">
              <span className="stat-value">{workflows.length}</span>
              <span className="stat-label">工作流</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{workflows.filter(w => w.status === WorkflowStatus.ACTIVE).length}</span>
              <span className="stat-label">运行中</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{executions.length}</span>
              <span className="stat-label">总执行次数</span>
            </div>
          </div>
        </div>
        
        <div className="header-actions">
          {enableRealTimeMonitoring && (
            <button
              className={cn('action-btn', 'monitor-btn', isMonitoring && 'active')}
              onClick={() => setIsMonitoring(!isMonitoring)}
            >
              {isMonitoring ? '停止监控' : '开始监控'}
            </button>
          )}
          
          <button
            className="action-btn primary"
            onClick={() => setShowCreateDialog(true)}
          >
            创建工作流
          </button>
        </div>
      </div>

      {/* 标签页导航 */}
      <div className="tab-navigation">
        <button
          className={cn('tab-btn', activeTab === 'workflows' && 'active')}
          onClick={() => setActiveTab('workflows')}
        >
          工作流 ({workflows.length})
        </button>
        
        {showTemplateLibrary && (
          <button
            className={cn('tab-btn', activeTab === 'templates' && 'active')}
            onClick={() => setActiveTab('templates')}
          >
            模板库 ({templates.length})
          </button>
        )}
        
        <button
          className={cn('tab-btn', activeTab === 'executions' && 'active')}
          onClick={() => setActiveTab('executions')}
        >
          执行记录 ({executions.length})
        </button>
        
        {enableRealTimeMonitoring && (
          <button
            className={cn('tab-btn', activeTab === 'monitoring' && 'active')}
            onClick={() => setActiveTab('monitoring')}
          >
            实时监控
          </button>
        )}
      </div>

      {/* 主要内容区域 */}
      <div className="manager-content">
        {activeTab === 'workflows' && (
          <div className="workflows-tab">
            {/* 工具栏 */}
            <div className="toolbar">
              <div className="search-section">
                <input
                  type="text"
                  placeholder="搜索工作流..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
              
              <div className="filter-section">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as WorkflowStatus | 'all')}
                  className="filter-select"
                >
                  <option value="all">全部状态</option>
                  <option value={WorkflowStatus.ACTIVE}>运行中</option>
                  <option value={WorkflowStatus.INACTIVE}>已停止</option>
                  <option value={WorkflowStatus.DRAFT}>草稿</option>
                </select>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="sort-select"
                >
                  <option value="updated">最近更新</option>
                  <option value="created">创建时间</option>
                  <option value="name">名称</option>
                  <option value="executions">执行次数</option>
                </select>
              </div>
            </div>
            
            {/* 工作流列表 */}
            <div className="workflows-grid">
              {isLoading ? (
                <div className="loading-state">
                  <div className="spinner" />
                  <span>加载工作流中...</span>
                </div>
              ) : filteredAndSortedWorkflows.length > 0 ? (
                filteredAndSortedWorkflows.map(renderWorkflowCard)
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">🔄</div>
                  <h3>暂无工作流</h3>
                  <p>创建您的第一个自动化工作流</p>
                  <button
                    className="action-btn primary"
                    onClick={() => setShowCreateDialog(true)}
                  >
                    创建工作流
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'templates' && showTemplateLibrary && (
          <div className="templates-tab">
            <div className="templates-grid">
              {templates.map(renderTemplateCard)}
            </div>
          </div>
        )}

        {activeTab === 'executions' && (
          <div className="executions-tab">
            <div className="executions-list">
              {executions.length > 0 ? (
                executions.map(renderExecutionItem)
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <h3>暂无执行记录</h3>
                  <p>工作流执行后会在这里显示记录</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'monitoring' && enableRealTimeMonitoring && (
          <div className="monitoring-tab">
            <div className="monitoring-dashboard">
              <div className="dashboard-stats">
                <div className="dashboard-stat">
                  <h3>活跃工作流</h3>
                  <div className="stat-value">{monitoringStats.activeWorkflows}</div>
                </div>
                <div className="dashboard-stat">
                  <h3>总执行次数</h3>
                  <div className="stat-value">{monitoringStats.totalExecutions}</div>
                </div>
                <div className="dashboard-stat">
                  <h3>成功率</h3>
                  <div className="stat-value">{monitoringStats.successRate.toFixed(1)}%</div>
                </div>
                <div className="dashboard-stat">
                  <h3>平均执行时间</h3>
                  <div className="stat-value">{monitoringStats.averageExecutionTime.toFixed(2)}ms</div>
                </div>
              </div>
              
              <div className="monitoring-status">
                <div className={cn('monitoring-indicator', isMonitoring && 'active')}>
                  <div className="indicator-dot" />
                  <span>{isMonitoring ? '实时监控中' : '监控已停止'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 错误显示 */}
      {error && (
        <div className="error-banner">
          <div className="error-content">
            <span className="error-icon">⚠️</span>
            <span className="error-message">{error}</span>
            <button
              className="error-dismiss"
              onClick={() => setError('')}
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default EnhancedWorkflowManager
