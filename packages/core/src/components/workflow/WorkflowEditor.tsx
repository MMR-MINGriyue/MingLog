/**
 * 工作流编辑器组件
 * 提供可视化的工作流创建和编辑功能
 */

import React, { useState, useCallback, useEffect } from 'react'
import { cn } from '../../utils'
import { 
  WorkflowDefinition,
  TriggerConfig,
  ActionConfig,
  WorkflowCondition,
  TriggerType,
  ActionType,
  WorkflowStatus
} from '../../services/WorkflowAutomationService'

// 工作流编辑器属性
export interface WorkflowEditorProps {
  /** 编辑的工作流（为空时创建新工作流） */
  workflow?: WorkflowDefinition | null
  /** 是否显示对话框 */
  visible: boolean
  /** 是否启用高级功能 */
  enableAdvancedFeatures?: boolean
  /** 关闭对话框回调 */
  onClose: () => void
  /** 保存工作流回调 */
  onSave: (workflow: Omit<WorkflowDefinition, 'id' | 'metadata'>) => Promise<void>
  /** 错误回调 */
  onError?: (error: string) => void
}

/**
 * 工作流编辑器组件
 */
export const WorkflowEditor: React.FC<WorkflowEditorProps> = ({
  workflow,
  visible,
  enableAdvancedFeatures = true,
  onClose,
  onSave,
  onError
}) => {
  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    version: '1.0.0',
    status: WorkflowStatus.DRAFT,
    triggers: [] as TriggerConfig[],
    actions: [] as ActionConfig[],
    conditions: [] as WorkflowCondition[],
    settings: {
      maxExecutions: undefined,
      executionTimeout: 30000,
      errorHandling: 'stop' as 'stop' | 'continue' | 'retry',
      logging: true,
      notifications: false
    }
  })

  // UI状态
  const [currentStep, setCurrentStep] = useState<'basic' | 'triggers' | 'actions' | 'conditions' | 'settings'>('basic')
  const [isLoading, setIsLoading] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // 初始化表单数据
  useEffect(() => {
    if (workflow) {
      setFormData({
        name: workflow.name,
        description: workflow.description,
        version: workflow.version,
        status: workflow.status,
        triggers: workflow.triggers,
        actions: workflow.actions,
        conditions: workflow.conditions || [],
        settings: {
          maxExecutions: workflow.settings?.maxExecutions,
          executionTimeout: workflow.settings?.executionTimeout || 30000,
          errorHandling: (workflow.settings?.errorHandling || 'stop') as 'stop' | 'continue' | 'retry',
          logging: workflow.settings?.logging ?? true,
          notifications: workflow.settings?.notifications ?? false
        }
      })
    } else {
      // 重置为默认值
      setFormData({
        name: '',
        description: '',
        version: '1.0.0',
        status: WorkflowStatus.DRAFT,
        triggers: [],
        actions: [],
        conditions: [],
        settings: {
          maxExecutions: undefined,
          executionTimeout: 30000,
          errorHandling: 'stop',
          logging: true,
          notifications: false
        }
      })
    }
    setCurrentStep('basic')
    setValidationErrors({})
  }, [workflow, visible])

  // 验证表单
  const validateForm = useCallback(() => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) {
      errors.name = '工作流名称不能为空'
    }

    if (!formData.description.trim()) {
      errors.description = '工作流描述不能为空'
    }

    if (formData.triggers.length === 0) {
      errors.triggers = '至少需要一个触发器'
    }

    if (formData.actions.length === 0) {
      errors.actions = '至少需要一个动作'
    }

    // 验证触发器配置
    formData.triggers.forEach((trigger, index) => {
      if (!trigger.name.trim()) {
        errors[`trigger_${index}_name`] = '触发器名称不能为空'
      }
    })

    // 验证动作配置
    formData.actions.forEach((action, index) => {
      if (!action.name.trim()) {
        errors[`action_${index}_name`] = '动作名称不能为空'
      }
    })

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }, [formData])

  // 保存工作流
  const handleSave = useCallback(async () => {
    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '保存工作流失败'
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }, [formData, validateForm, onSave, onClose, onError])

  // 添加触发器
  const handleAddTrigger = useCallback(() => {
    const newTrigger: TriggerConfig = {
      id: `trigger_${Date.now()}`,
      type: TriggerType.EVENT_BASED,
      name: '新触发器',
      description: '',
      config: {},
      enabled: true
    }

    setFormData(prev => ({
      ...prev,
      triggers: [...prev.triggers, newTrigger]
    }))
  }, [])

  // 更新触发器
  const handleUpdateTrigger = useCallback((index: number, updates: Partial<TriggerConfig>) => {
    setFormData(prev => ({
      ...prev,
      triggers: prev.triggers.map((trigger, i) => 
        i === index ? { ...trigger, ...updates } : trigger
      )
    }))
  }, [])

  // 删除触发器
  const handleRemoveTrigger = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      triggers: prev.triggers.filter((_, i) => i !== index)
    }))
  }, [])

  // 添加动作
  const handleAddAction = useCallback(() => {
    const newAction: ActionConfig = {
      id: `action_${Date.now()}`,
      type: ActionType.CREATE_TASK,
      name: '新动作',
      description: '',
      config: {},
      enabled: true
    }

    setFormData(prev => ({
      ...prev,
      actions: [...prev.actions, newAction]
    }))
  }, [])

  // 更新动作
  const handleUpdateAction = useCallback((index: number, updates: Partial<ActionConfig>) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.map((action, i) => 
        i === index ? { ...action, ...updates } : action
      )
    }))
  }, [])

  // 删除动作
  const handleRemoveAction = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index)
    }))
  }, [])

  // 渲染基本信息步骤
  const renderBasicStep = () => (
    <div className="step-content">
      <h3 className="step-title">基本信息</h3>
      
      <div className="form-grid">
        <div className="form-field">
          <label className="form-label">
            工作流名称 <span className="required">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="输入工作流名称"
            className={cn('form-input', validationErrors.name && 'error')}
          />
          {validationErrors.name && (
            <span className="error-message">{validationErrors.name}</span>
          )}
        </div>

        <div className="form-field">
          <label className="form-label">
            工作流描述 <span className="required">*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="描述工作流的用途和功能"
            rows={3}
            className={cn('form-textarea', validationErrors.description && 'error')}
          />
          {validationErrors.description && (
            <span className="error-message">{validationErrors.description}</span>
          )}
        </div>

        <div className="form-field">
          <label className="form-label">版本号</label>
          <input
            type="text"
            value={formData.version}
            onChange={(e) => setFormData(prev => ({ ...prev, version: e.target.value }))}
            placeholder="1.0.0"
            className="form-input"
          />
        </div>

        <div className="form-field">
          <label className="form-label">初始状态</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as WorkflowStatus }))}
            className="form-select"
          >
            <option value={WorkflowStatus.DRAFT}>草稿</option>
            <option value={WorkflowStatus.ACTIVE}>激活</option>
            <option value={WorkflowStatus.INACTIVE}>停用</option>
          </select>
        </div>
      </div>
    </div>
  )

  // 渲染触发器步骤
  const renderTriggersStep = () => (
    <div className="step-content">
      <div className="step-header">
        <h3 className="step-title">触发器配置</h3>
        <button
          type="button"
          onClick={handleAddTrigger}
          className="add-btn"
        >
          ➕ 添加触发器
        </button>
      </div>

      {validationErrors.triggers && (
        <div className="error-banner">
          {validationErrors.triggers}
        </div>
      )}

      <div className="triggers-list">
        {formData.triggers.map((trigger, index) => (
          <div key={trigger.id} className="trigger-item">
            <div className="item-header">
              <h4 className="item-title">触发器 {index + 1}</h4>
              <button
                type="button"
                onClick={() => handleRemoveTrigger(index)}
                className="remove-btn"
              >
                ✕
              </button>
            </div>

            <div className="item-form">
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">名称</label>
                  <input
                    type="text"
                    value={trigger.name}
                    onChange={(e) => handleUpdateTrigger(index, { name: e.target.value })}
                    placeholder="触发器名称"
                    className={cn('form-input', validationErrors[`trigger_${index}_name`] && 'error')}
                  />
                  {validationErrors[`trigger_${index}_name`] && (
                    <span className="error-message">{validationErrors[`trigger_${index}_name`]}</span>
                  )}
                </div>

                <div className="form-field">
                  <label className="form-label">类型</label>
                  <select
                    value={trigger.type}
                    onChange={(e) => handleUpdateTrigger(index, { type: e.target.value as TriggerType })}
                    className="form-select"
                  >
                    <option value={TriggerType.EVENT_BASED}>事件触发</option>
                    <option value={TriggerType.TIME_BASED}>时间触发</option>
                    <option value={TriggerType.CONDITION_BASED}>条件触发</option>
                    <option value={TriggerType.MANUAL}>手动触发</option>
                  </select>
                </div>
              </div>

              <div className="form-field">
                <label className="form-label">描述</label>
                <textarea
                  value={trigger.description}
                  onChange={(e) => handleUpdateTrigger(index, { description: e.target.value })}
                  placeholder="描述触发条件"
                  rows={2}
                  className="form-textarea"
                />
              </div>

              <div className="form-field">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={trigger.enabled}
                    onChange={(e) => handleUpdateTrigger(index, { enabled: e.target.checked })}
                  />
                  <span>启用此触发器</span>
                </label>
              </div>
            </div>
          </div>
        ))}

        {formData.triggers.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">⚡</div>
            <p>还没有添加触发器</p>
            <p className="empty-hint">触发器定义了工作流何时执行</p>
          </div>
        )}
      </div>
    </div>
  )

  // 渲染动作步骤
  const renderActionsStep = () => (
    <div className="step-content">
      <div className="step-header">
        <h3 className="step-title">动作配置</h3>
        <button
          type="button"
          onClick={handleAddAction}
          className="add-btn"
        >
          ➕ 添加动作
        </button>
      </div>

      {validationErrors.actions && (
        <div className="error-banner">
          {validationErrors.actions}
        </div>
      )}

      <div className="actions-list">
        {formData.actions.map((action, index) => (
          <div key={action.id} className="action-item">
            <div className="item-header">
              <h4 className="item-title">动作 {index + 1}</h4>
              <button
                type="button"
                onClick={() => handleRemoveAction(index)}
                className="remove-btn"
              >
                ✕
              </button>
            </div>

            <div className="item-form">
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label">名称</label>
                  <input
                    type="text"
                    value={action.name}
                    onChange={(e) => handleUpdateAction(index, { name: e.target.value })}
                    placeholder="动作名称"
                    className={cn('form-input', validationErrors[`action_${index}_name`] && 'error')}
                  />
                  {validationErrors[`action_${index}_name`] && (
                    <span className="error-message">{validationErrors[`action_${index}_name`]}</span>
                  )}
                </div>

                <div className="form-field">
                  <label className="form-label">类型</label>
                  <select
                    value={action.type}
                    onChange={(e) => handleUpdateAction(index, { type: e.target.value as ActionType })}
                    className="form-select"
                  >
                    <option value={ActionType.CREATE_TASK}>创建任务</option>
                    <option value={ActionType.CREATE_NOTE}>创建笔记</option>
                    <option value={ActionType.UPDATE_ENTITY}>更新实体</option>
                    <option value={ActionType.SEND_NOTIFICATION}>发送通知</option>
                    <option value={ActionType.SEND_EMAIL}>发送邮件</option>
                    <option value={ActionType.TAG_ENTITY}>添加标签</option>
                    <option value={ActionType.MOVE_ENTITY}>移动实体</option>
                    <option value={ActionType.ARCHIVE_ENTITY}>归档实体</option>
                  </select>
                </div>
              </div>

              <div className="form-field">
                <label className="form-label">描述</label>
                <textarea
                  value={action.description}
                  onChange={(e) => handleUpdateAction(index, { description: e.target.value })}
                  placeholder="描述动作功能"
                  rows={2}
                  className="form-textarea"
                />
              </div>

              <div className="form-field">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={action.enabled}
                    onChange={(e) => handleUpdateAction(index, { enabled: e.target.checked })}
                  />
                  <span>启用此动作</span>
                </label>
              </div>
            </div>
          </div>
        ))}

        {formData.actions.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">⚙️</div>
            <p>还没有添加动作</p>
            <p className="empty-hint">动作定义了工作流要执行的操作</p>
          </div>
        )}
      </div>
    </div>
  )

  // 渲染设置步骤
  const renderSettingsStep = () => (
    <div className="step-content">
      <h3 className="step-title">高级设置</h3>
      
      <div className="form-grid">
        <div className="form-field">
          <label className="form-label">最大执行次数</label>
          <input
            type="number"
            value={formData.settings.maxExecutions || ''}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              settings: {
                ...prev.settings,
                maxExecutions: e.target.value ? parseInt(e.target.value) : undefined
              }
            }))}
            placeholder="不限制"
            min="1"
            className="form-input"
          />
          <span className="field-hint">留空表示不限制执行次数</span>
        </div>

        <div className="form-field">
          <label className="form-label">执行超时时间 (毫秒)</label>
          <input
            type="number"
            value={formData.settings.executionTimeout}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              settings: {
                ...prev.settings,
                executionTimeout: parseInt(e.target.value) || 30000
              }
            }))}
            min="1000"
            className="form-input"
          />
        </div>

        <div className="form-field">
          <label className="form-label">错误处理策略</label>
          <select
            value={formData.settings.errorHandling}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              settings: {
                ...prev.settings,
                errorHandling: e.target.value as 'stop' | 'continue' | 'retry'
              }
            }))}
            className="form-select"
          >
            <option value="stop">遇到错误时停止</option>
            <option value="continue">遇到错误时继续</option>
            <option value="retry">遇到错误时重试</option>
          </select>
        </div>

        <div className="form-field">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.settings.logging}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                settings: {
                  ...prev.settings,
                  logging: e.target.checked
                }
              }))}
            />
            <span>启用执行日志</span>
          </label>
        </div>

        <div className="form-field">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.settings.notifications}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                settings: {
                  ...prev.settings,
                  notifications: e.target.checked
                }
              }))}
            />
            <span>启用执行通知</span>
          </label>
        </div>
      </div>
    </div>
  )

  if (!visible) return null

  return (
    <div className="workflow-editor-overlay">
      <div className="workflow-editor">
        {/* 标题栏 */}
        <div className="editor-header">
          <h2 className="editor-title">
            {workflow ? '编辑工作流' : '创建工作流'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="close-btn"
          >
            ✕
          </button>
        </div>

        {/* 步骤导航 */}
        <div className="step-navigation">
          {[
            { key: 'basic', label: '基本信息' },
            { key: 'triggers', label: '触发器' },
            { key: 'actions', label: '动作' },
            { key: 'settings', label: '设置' }
          ].map(step => (
            <button
              key={step.key}
              type="button"
              className={cn('step-btn', currentStep === step.key && 'active')}
              onClick={() => setCurrentStep(step.key as any)}
            >
              {step.label}
            </button>
          ))}
        </div>

        {/* 步骤内容 */}
        <div className="editor-content">
          {currentStep === 'basic' && renderBasicStep()}
          {currentStep === 'triggers' && renderTriggersStep()}
          {currentStep === 'actions' && renderActionsStep()}
          {currentStep === 'settings' && renderSettingsStep()}
        </div>

        {/* 操作按钮 */}
        <div className="editor-actions">
          <button
            type="button"
            onClick={onClose}
            className="action-btn secondary"
          >
            取消
          </button>
          
          <button
            type="button"
            onClick={handleSave}
            disabled={isLoading}
            className="action-btn primary"
          >
            {isLoading ? '保存中...' : '保存工作流'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default WorkflowEditor
