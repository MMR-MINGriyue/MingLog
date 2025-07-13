/**
 * 思维导图模板创建器
 * 提供从当前思维导图创建自定义模板的功能
 */

import React, { useState, useCallback } from 'react'
import { MindMapData, MindMapTemplate, TemplateCategory, templateManager } from '@minglog/mindmap'
import { appCore } from '../../core/AppCore'

interface TemplateCreatorProps {
  /** 是否显示创建器 */
  visible: boolean
  /** 关闭回调 */
  onClose: () => void
  /** 当前思维导图数据 */
  mindMapData: MindMapData
  /** 模板创建成功回调 */
  onTemplateCreated?: (template: MindMapTemplate) => void
  /** 自定义类名 */
  className?: string
}

interface CreatorState {
  name: string
  description: string
  category: TemplateCategory
  tags: string[]
  tagInput: string
  isCreating: boolean
  error: string | null
}

// 分类选项
const categoryOptions: { value: TemplateCategory; label: string; icon: string }[] = [
  { value: 'business', label: '商业', icon: '💼' },
  { value: 'education', label: '教育', icon: '📚' },
  { value: 'personal', label: '个人', icon: '👤' },
  { value: 'project', label: '项目', icon: '📊' },
  { value: 'creative', label: '创意', icon: '🎨' },
  { value: 'analysis', label: '分析', icon: '📈' },
  { value: 'planning', label: '规划', icon: '📅' },
  { value: 'other', label: '其他', icon: '📝' }
]

/**
 * 思维导图模板创建器组件
 */
export const TemplateCreator: React.FC<TemplateCreatorProps> = ({
  visible,
  onClose,
  mindMapData,
  onTemplateCreated,
  className = ''
}) => {
  // 状态管理
  const [state, setState] = useState<CreatorState>({
    name: mindMapData.metadata?.title || '新模板',
    description: mindMapData.metadata?.description || '',
    category: 'other',
    tags: [],
    tagInput: '',
    isCreating: false,
    error: null
  })

  // 处理输入变更
  const handleInputChange = useCallback((field: keyof CreatorState, value: any) => {
    setState(prev => ({ ...prev, [field]: value, error: null }))
  }, [])

  // 添加标签
  const addTag = useCallback(() => {
    const tag = state.tagInput.trim()
    if (tag && !state.tags.includes(tag)) {
      setState(prev => ({
        ...prev,
        tags: [...prev.tags, tag],
        tagInput: ''
      }))
    }
  }, [state.tagInput, state.tags])

  // 删除标签
  const removeTag = useCallback((tagToRemove: string) => {
    setState(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }, [])

  // 处理标签输入键盘事件
  const handleTagInputKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    } else if (e.key === 'Backspace' && !state.tagInput && state.tags.length > 0) {
      removeTag(state.tags[state.tags.length - 1])
    }
  }, [addTag, removeTag, state.tagInput, state.tags])

  // 验证表单
  const validateForm = useCallback((): string | null => {
    if (!state.name.trim()) {
      return '请输入模板名称'
    }
    if (state.name.length > 50) {
      return '模板名称不能超过50个字符'
    }
    if (state.description.length > 200) {
      return '模板描述不能超过200个字符'
    }
    if (state.tags.length > 10) {
      return '标签数量不能超过10个'
    }
    return null
  }, [state])

  // 创建模板
  const handleCreateTemplate = useCallback(async () => {
    const validationError = validateForm()
    if (validationError) {
      setState(prev => ({ ...prev, error: validationError }))
      return
    }

    try {
      setState(prev => ({ ...prev, isCreating: true, error: null }))

      // 创建模板
      const template = templateManager.createTemplate(
        state.name.trim(),
        state.description.trim(),
        state.category,
        mindMapData,
        state.tags
      )

      // 发送事件到事件总线
      if (appCore.isInitialized()) {
        const eventBus = appCore.getEventBus()
        eventBus?.emit('mindmap:template:created', {
          templateId: template.id,
          templateName: template.name,
          category: template.category,
          tags: template.tags
        }, 'TemplateCreator')
      }

      // 调用成功回调
      onTemplateCreated?.(template)
      
      // 关闭创建器
      onClose()

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建模板失败'
      setState(prev => ({ ...prev, error: errorMessage }))
    } finally {
      setState(prev => ({ ...prev, isCreating: false }))
    }
  }, [validateForm, state, mindMapData, onTemplateCreated, onClose])

  // 重置表单
  const resetForm = useCallback(() => {
    setState({
      name: mindMapData.metadata?.title || '新模板',
      description: mindMapData.metadata?.description || '',
      category: 'other',
      tags: [],
      tagInput: '',
      isCreating: false,
      error: null
    })
  }, [mindMapData])

  // 处理关闭
  const handleClose = useCallback(() => {
    resetForm()
    onClose()
  }, [resetForm, onClose])

  if (!visible) return null

  return (
    <div className={`template-creator ${className}`}>
      {/* 遮罩层 */}
      <div className="template-creator-overlay" onClick={handleClose} />
      
      {/* 主面板 */}
      <div className="template-creator-panel">
        {/* 标题栏 */}
        <div className="creator-header">
          <h2 className="creator-title">🎨 创建模板</h2>
          <button onClick={handleClose} className="close-button" title="关闭">
            ✕
          </button>
        </div>

        {/* 表单内容 */}
        <div className="creator-content">
          {/* 模板名称 */}
          <div className="form-group">
            <label className="form-label">模板名称 *</label>
            <input
              type="text"
              value={state.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="请输入模板名称"
              className="form-input"
              maxLength={50}
            />
            <div className="form-hint">
              {state.name.length}/50 字符
            </div>
          </div>

          {/* 模板描述 */}
          <div className="form-group">
            <label className="form-label">模板描述</label>
            <textarea
              value={state.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="请输入模板描述，帮助其他人了解这个模板的用途"
              className="form-textarea"
              rows={3}
              maxLength={200}
            />
            <div className="form-hint">
              {state.description.length}/200 字符
            </div>
          </div>

          {/* 模板分类 */}
          <div className="form-group">
            <label className="form-label">模板分类 *</label>
            <div className="category-grid">
              {categoryOptions.map(option => (
                <button
                  key={option.value}
                  className={`category-option ${state.category === option.value ? 'selected' : ''}`}
                  onClick={() => handleInputChange('category', option.value)}
                >
                  <span className="category-icon">{option.icon}</span>
                  <span className="category-label">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 标签 */}
          <div className="form-group">
            <label className="form-label">标签</label>
            <div className="tags-input-container">
              <div className="tags-display">
                {state.tags.map(tag => (
                  <span key={tag} className="tag-item">
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="tag-remove"
                      title="删除标签"
                    >
                      ✕
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={state.tagInput}
                  onChange={(e) => handleInputChange('tagInput', e.target.value)}
                  onKeyDown={handleTagInputKeyDown}
                  placeholder={state.tags.length === 0 ? "输入标签，按回车添加" : ""}
                  className="tag-input"
                  disabled={state.tags.length >= 10}
                />
              </div>
              {state.tagInput.trim() && (
                <button onClick={addTag} className="add-tag-button">
                  添加
                </button>
              )}
            </div>
            <div className="form-hint">
              {state.tags.length}/10 个标签，按回车键添加
            </div>
          </div>

          {/* 预览信息 */}
          <div className="form-group">
            <label className="form-label">模板预览</label>
            <div className="template-preview-info">
              <div className="preview-item">
                <span className="preview-label">节点数量:</span>
                <span className="preview-value">{mindMapData.nodes.length}</span>
              </div>
              <div className="preview-item">
                <span className="preview-label">连接数量:</span>
                <span className="preview-value">{mindMapData.links.length}</span>
              </div>
              <div className="preview-item">
                <span className="preview-label">根节点:</span>
                <span className="preview-value">
                  {mindMapData.nodes.find(n => n.id === mindMapData.rootId)?.text || '未知'}
                </span>
              </div>
            </div>
          </div>

          {/* 错误信息 */}
          {state.error && (
            <div className="error-message">
              <span className="error-icon">❌</span>
              <span>{state.error}</span>
            </div>
          )}
        </div>

        {/* 底部操作栏 */}
        <div className="creator-footer">
          <div className="footer-info">
            <span className="info-text">
              创建后的模板可以在模板库中找到并重复使用
            </span>
          </div>
          
          <div className="footer-actions">
            <button onClick={handleClose} className="cancel-button">
              取消
            </button>
            <button
              onClick={handleCreateTemplate}
              disabled={state.isCreating || !state.name.trim()}
              className="create-button"
            >
              {state.isCreating ? (
                <>
                  <span className="loading-spinner" />
                  创建中...
                </>
              ) : (
                '创建模板'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TemplateCreator
