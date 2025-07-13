/**
 * 模板选择对话框组件
 * 提供思维导图模板的浏览、搜索和选择功能
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { MindMapTemplate, TemplateCategory, TemplateFilter, templateManager } from '../templates/TemplateManager'
import { MindMapData } from '../types'

interface TemplateDialogProps {
  /** 是否显示对话框 */
  visible: boolean
  /** 关闭对话框回调 */
  onClose: () => void
  /** 模板选择回调 */
  onSelectTemplate: (data: MindMapData, template: MindMapTemplate) => void
  /** 类名 */
  className?: string
}

interface DialogState {
  /** 当前选中的分类 */
  selectedCategory: TemplateCategory | 'all'
  /** 搜索关键词 */
  searchQuery: string
  /** 是否只显示收藏 */
  showFavoritesOnly: boolean
  /** 当前选中的模板 */
  selectedTemplate: MindMapTemplate | null
  /** 预览模式 */
  previewMode: boolean
}

/**
 * 模板选择对话框组件
 */
export const TemplateDialog: React.FC<TemplateDialogProps> = ({
  visible,
  onClose,
  onSelectTemplate,
  className = ''
}) => {
  // 状态管理
  const [dialogState, setDialogState] = useState<DialogState>({
    selectedCategory: 'all',
    searchQuery: '',
    showFavoritesOnly: false,
    selectedTemplate: null,
    previewMode: false
  })

  // 获取分类信息
  const categories = useMemo(() => templateManager.getCategoryInfo(), [])

  // 获取过滤后的模板
  const filteredTemplates = useMemo(() => {
    const filter: TemplateFilter = {
      search: dialogState.searchQuery || undefined,
      favoritesOnly: dialogState.showFavoritesOnly || undefined,
      category: dialogState.selectedCategory !== 'all' ? dialogState.selectedCategory : undefined
    }
    return templateManager.getTemplates(filter)
  }, [dialogState.selectedCategory, dialogState.searchQuery, dialogState.showFavoritesOnly])

  // 获取统计信息
  const stats = useMemo(() => templateManager.getStats(), [])

  /**
   * 处理分类切换
   */
  const handleCategoryChange = useCallback((category: TemplateCategory | 'all') => {
    setDialogState(prev => ({
      ...prev,
      selectedCategory: category,
      selectedTemplate: null
    }))
  }, [])

  /**
   * 处理搜索
   */
  const handleSearch = useCallback((query: string) => {
    setDialogState(prev => ({
      ...prev,
      searchQuery: query,
      selectedTemplate: null
    }))
  }, [])

  /**
   * 切换收藏过滤
   */
  const handleToggleFavorites = useCallback(() => {
    setDialogState(prev => ({
      ...prev,
      showFavoritesOnly: !prev.showFavoritesOnly,
      selectedTemplate: null
    }))
  }, [])

  /**
   * 选择模板
   */
  const handleSelectTemplate = useCallback((template: MindMapTemplate) => {
    setDialogState(prev => ({
      ...prev,
      selectedTemplate: template,
      previewMode: true
    }))
  }, [])

  /**
   * 应用模板
   */
  const handleApplyTemplate = useCallback(() => {
    if (!dialogState.selectedTemplate) return

    try {
      const data = templateManager.applyTemplate(dialogState.selectedTemplate.id)
      onSelectTemplate(data, dialogState.selectedTemplate)
      onClose()
    } catch (error) {
      console.error('应用模板失败:', error)
    }
  }, [dialogState.selectedTemplate, onSelectTemplate, onClose])

  /**
   * 切换收藏状态
   */
  const handleToggleTemplateFavorite = useCallback((templateId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    templateManager.toggleFavorite(templateId)
    // 强制重新渲染
    setDialogState(prev => ({ ...prev }))
  }, [])

  /**
   * 重置状态
   */
  const handleReset = useCallback(() => {
    setDialogState({
      selectedCategory: 'all',
      searchQuery: '',
      showFavoritesOnly: false,
      selectedTemplate: null,
      previewMode: false
    })
  }, [])

  // 对话框关闭时重置状态
  useEffect(() => {
    if (!visible) {
      handleReset()
    }
  }, [visible, handleReset])

  if (!visible) return null

  return (
    <div className={`template-dialog-overlay ${className}`}>
      <div className="template-dialog">
        {/* 标题栏 */}
        <div className="dialog-header">
          <h3 className="dialog-title">📋 选择思维导图模板</h3>
          <button onClick={onClose} className="close-button">✕</button>
        </div>

        {/* 搜索和过滤栏 */}
        <div className="search-filter-bar">
          <div className="search-box">
            <input
              type="text"
              placeholder="搜索模板..."
              value={dialogState.searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
          
          <button
            onClick={handleToggleFavorites}
            className={`filter-button ${dialogState.showFavoritesOnly ? 'active' : ''}`}
          >
            ⭐ 收藏
          </button>
          
          <div className="template-count">
            共 {filteredTemplates.length} 个模板
          </div>
        </div>

        <div className="dialog-content">
          {/* 分类侧边栏 */}
          <div className="category-sidebar">
            <div className="category-title">分类</div>
            
            <button
              onClick={() => handleCategoryChange('all')}
              className={`category-item ${dialogState.selectedCategory === 'all' ? 'active' : ''}`}
            >
              <span className="category-icon">📁</span>
              <span className="category-name">全部</span>
              <span className="category-count">{stats.total}</span>
            </button>

            {categories.map(category => (
              <button
                key={category.category}
                onClick={() => handleCategoryChange(category.category)}
                className={`category-item ${dialogState.selectedCategory === category.category ? 'active' : ''}`}
              >
                <span className="category-icon">{category.icon}</span>
                <span className="category-name">{category.name}</span>
                <span className="category-count">{category.count}</span>
              </button>
            ))}
          </div>

          {/* 模板网格 */}
          <div className="template-grid">
            {filteredTemplates.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📝</div>
                <div className="empty-title">没有找到模板</div>
                <div className="empty-description">
                  {dialogState.searchQuery 
                    ? '尝试使用其他关键词搜索' 
                    : '该分类下暂无模板'}
                </div>
              </div>
            ) : (
              filteredTemplates.map(template => (
                <div
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  className={`template-card ${dialogState.selectedTemplate?.id === template.id ? 'selected' : ''}`}
                >
                  {/* 模板预览图 */}
                  <div className="template-thumbnail">
                    {template.thumbnail ? (
                      <img src={template.thumbnail} alt={template.name} />
                    ) : (
                      <div className="thumbnail-placeholder">
                        <span className="placeholder-icon">🧠</span>
                      </div>
                    )}
                    
                    {/* 收藏按钮 */}
                    <button
                      onClick={(e) => handleToggleTemplateFavorite(template.id, e)}
                      className={`favorite-button ${template.isFavorite ? 'active' : ''}`}
                    >
                      ⭐
                    </button>
                  </div>

                  {/* 模板信息 */}
                  <div className="template-info">
                    <div className="template-name">{template.name}</div>
                    <div className="template-description">{template.description}</div>
                    
                    <div className="template-meta">
                      <div className="template-tags">
                        {template.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="tag">{tag}</span>
                        ))}
                      </div>
                      
                      <div className="template-stats">
                        <span className="usage-count">使用 {template.usageCount} 次</span>
                        {template.isBuiltIn && <span className="builtin-badge">内置</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 预览面板 */}
        {dialogState.selectedTemplate && (
          <div className="preview-panel">
            <div className="preview-header">
              <h4>{dialogState.selectedTemplate.name}</h4>
              <div className="preview-actions">
                <button
                  onClick={() => setDialogState(prev => ({ ...prev, previewMode: !prev.previewMode }))}
                  className="preview-toggle"
                >
                  {dialogState.previewMode ? '📋 详情' : '👁️ 预览'}
                </button>
              </div>
            </div>

            <div className="preview-content">
              {dialogState.previewMode ? (
                <div className="template-preview">
                  <div className="preview-placeholder">
                    <span>思维导图预览</span>
                    <div className="preview-nodes">
                      {dialogState.selectedTemplate.data.nodes.slice(0, 5).map(node => (
                        <div key={node.id} className="preview-node">
                          {node.text}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="template-details">
                  <div className="detail-item">
                    <span className="detail-label">描述:</span>
                    <span className="detail-value">{dialogState.selectedTemplate.description}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">分类:</span>
                    <span className="detail-value">
                      {categories.find(c => c.category === dialogState.selectedTemplate!.category)?.name}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">标签:</span>
                    <span className="detail-value">
                      {dialogState.selectedTemplate.tags.join(', ')}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">节点数:</span>
                    <span className="detail-value">{dialogState.selectedTemplate.data.nodes.length}</span>
                  </div>
                  {dialogState.selectedTemplate.author && (
                    <div className="detail-item">
                      <span className="detail-label">作者:</span>
                      <span className="detail-value">{dialogState.selectedTemplate.author.name}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="dialog-actions">
          <button onClick={onClose} className="action-button secondary">
            取消
          </button>
          <button
            onClick={handleApplyTemplate}
            disabled={!dialogState.selectedTemplate}
            className="action-button primary"
          >
            📋 使用模板
          </button>
        </div>
      </div>
    </div>
  )
}

export default TemplateDialog
