/**
 * 任务创建模态框组件
 * 提供完整的任务创建表单
 */

import React, { useState, useCallback } from 'react'
import { 
  CreateTaskRequest, 
  TaskPriority, 
  TaskStatus 
} from '../../../packages/modules/tasks/src/types'

interface TaskCreateModalProps {
  /** 关闭回调 */
  onClose: () => void
  /** 提交回调 */
  onSubmit: (taskData: CreateTaskRequest) => void
  /** 初始数据 */
  initialData?: Partial<CreateTaskRequest>
  /** 类名 */
  className?: string
}

export const TaskCreateModal: React.FC<TaskCreateModalProps> = ({
  onClose,
  onSubmit,
  initialData,
  className = ''
}) => {
  // 表单状态
  const [formData, setFormData] = useState<CreateTaskRequest>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    priority: initialData?.priority || TaskPriority.MEDIUM,
    dueDate: initialData?.dueDate,
    estimatedTime: initialData?.estimatedTime,
    projectId: initialData?.projectId,
    parentTaskId: initialData?.parentTaskId,
    linkedNotes: initialData?.linkedNotes || [],
    linkedFiles: initialData?.linkedFiles || [],
    tags: initialData?.tags || [],
    contexts: initialData?.contexts || [],
    recurrence: initialData?.recurrence
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 表单验证
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = '任务标题不能为空'
    }

    if (formData.title.length > 200) {
      newErrors.title = '任务标题不能超过200个字符'
    }

    if (formData.description && formData.description.length > 2000) {
      newErrors.description = '任务描述不能超过2000个字符'
    }

    if (formData.estimatedTime && formData.estimatedTime <= 0) {
      newErrors.estimatedTime = '预估时间必须大于0'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  // 处理表单提交
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Failed to create task:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, validateForm, onSubmit])

  // 处理输入变更
  const handleInputChange = useCallback((field: keyof CreateTaskRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // 清除相关错误
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }, [errors])

  // 处理标签输入
  const handleTagsChange = useCallback((value: string) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
    handleInputChange('tags', tags)
  }, [handleInputChange])

  // 处理上下文输入
  const handleContextsChange = useCallback((value: string) => {
    const contexts = value.split(',').map(context => context.trim()).filter(context => context.length > 0)
    handleInputChange('contexts', contexts)
  }, [handleInputChange])

  // 处理模态框点击
  const handleModalClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }, [onClose])

  return (
    <div className={`task-create-modal-overlay ${className}`} onClick={handleModalClick}>
      <div className="task-create-modal">
        {/* 模态框头部 */}
        <div className="modal-header">
          <h2>创建新任务</h2>
          <button onClick={onClose} className="close-button">
            ✕
          </button>
        </div>

        {/* 表单内容 */}
        <form onSubmit={handleSubmit} className="modal-form">
          {/* 基本信息 */}
          <div className="form-section">
            <h3>基本信息</h3>
            
            {/* 任务标题 */}
            <div className="form-field">
              <label htmlFor="title" className="field-label">
                任务标题 <span className="required">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="输入任务标题..."
                className={`field-input ${errors.title ? 'error' : ''}`}
                maxLength={200}
              />
              {errors.title && <span className="field-error">{errors.title}</span>}
            </div>

            {/* 任务描述 */}
            <div className="form-field">
              <label htmlFor="description" className="field-label">任务描述</label>
              <textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="输入任务描述..."
                className={`field-textarea ${errors.description ? 'error' : ''}`}
                rows={3}
                maxLength={2000}
              />
              {errors.description && <span className="field-error">{errors.description}</span>}
            </div>
          </div>

          {/* 任务属性 */}
          <div className="form-section">
            <h3>任务属性</h3>
            
            <div className="form-row">
              {/* 优先级 */}
              <div className="form-field">
                <label htmlFor="priority" className="field-label">优先级</label>
                <select
                  id="priority"
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value as TaskPriority)}
                  className="field-select"
                >
                  <option value={TaskPriority.LOW}>低</option>
                  <option value={TaskPriority.MEDIUM}>中</option>
                  <option value={TaskPriority.HIGH}>高</option>
                  <option value={TaskPriority.URGENT}>紧急</option>
                </select>
              </div>

              {/* 到期时间 */}
              <div className="form-field">
                <label htmlFor="dueDate" className="field-label">到期时间</label>
                <input
                  id="dueDate"
                  type="datetime-local"
                  value={formData.dueDate?.toISOString().slice(0, 16) || ''}
                  onChange={(e) => handleInputChange('dueDate', e.target.value ? new Date(e.target.value) : undefined)}
                  className="field-input"
                />
              </div>
            </div>

            {/* 预估时间 */}
            <div className="form-field">
              <label htmlFor="estimatedTime" className="field-label">预估时间（分钟）</label>
              <input
                id="estimatedTime"
                type="number"
                value={formData.estimatedTime || ''}
                onChange={(e) => handleInputChange('estimatedTime', e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="输入预估时间..."
                className={`field-input ${errors.estimatedTime ? 'error' : ''}`}
                min="1"
              />
              {errors.estimatedTime && <span className="field-error">{errors.estimatedTime}</span>}
            </div>
          </div>

          {/* 分类和标签 */}
          <div className="form-section">
            <h3>分类和标签</h3>
            
            {/* 标签 */}
            <div className="form-field">
              <label htmlFor="tags" className="field-label">标签</label>
              <input
                id="tags"
                type="text"
                value={formData.tags.join(', ')}
                onChange={(e) => handleTagsChange(e.target.value)}
                placeholder="输入标签，用逗号分隔..."
                className="field-input"
              />
              <span className="field-hint">例如：工作, 重要, 项目</span>
            </div>

            {/* GTD上下文 */}
            <div className="form-field">
              <label htmlFor="contexts" className="field-label">GTD上下文</label>
              <input
                id="contexts"
                type="text"
                value={formData.contexts.join(', ')}
                onChange={(e) => handleContextsChange(e.target.value)}
                placeholder="输入上下文，用逗号分隔..."
                className="field-input"
              />
              <span className="field-hint">例如：@电脑, @电话, @家里</span>
            </div>
          </div>

          {/* 表单按钮 */}
          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="cancel-button"
              disabled={isSubmitting}
            >
              取消
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={isSubmitting || !formData.title.trim()}
            >
              {isSubmitting ? '创建中...' : '创建任务'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TaskCreateModal
