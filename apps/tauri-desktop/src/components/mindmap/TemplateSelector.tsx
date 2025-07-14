/**
 * 思维导图模板选择器
 * 提供模板浏览、预览、搜索和应用功能
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { MindMapTemplate, TemplateCategory, templateManager } from '@minglog/mindmap'
import { appCore } from '../../core/AppCore'

interface TemplateSelectorProps {
  /** 是否显示选择器 */
  visible: boolean
  /** 关闭回调 */
  onClose: () => void
  /** 模板选择回调 */
  onTemplateSelect: (template: MindMapTemplate) => void
  /** 自定义类名 */
  className?: string
}

interface SelectorState {
  templates: MindMapTemplate[]
  filteredTemplates: MindMapTemplate[]
  selectedCategory: TemplateCategory | 'all' | 'recent' | 'favorites'
  searchQuery: string
  selectedTemplate: MindMapTemplate | null
  isLoading: boolean
  error: string | null
}

// 分类配置
const categoryConfig = {
  all: { name: '全部', icon: '📋', color: '#6b7280' },
  recent: { name: '最近使用', icon: '🕒', color: '#3b82f6' },
  favorites: { name: '收藏', icon: '⭐', color: '#f59e0b' },
  business: { name: '商业', icon: '💼', color: '#10b981' },
  education: { name: '教育', icon: '📚', color: '#8b5cf6' },
  personal: { name: '个人', icon: '👤', color: '#ef4444' },
  project: { name: '项目', icon: '📊', color: '#06b6d4' },
  creative: { name: '创意', icon: '🎨', color: '#f97316' },
  analysis: { name: '分析', icon: '📈', color: '#84cc16' },
  planning: { name: '规划', icon: '📅', color: '#ec4899' },
  other: { name: '其他', icon: '📝', color: '#6b7280' }
}

/**
 * 思维导图模板选择器组件
 */
export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  visible,
  onClose,
  onTemplateSelect,
  className = ''
}) => {
  // 状态管理
  const [state, setState] = useState<SelectorState>({
    templates: [],
    filteredTemplates: [],
    selectedCategory: 'all',
    searchQuery: '',
    selectedTemplate: null,
    isLoading: true,
    error: null
  })

  // 加载模板数据
  useEffect(() => {
    if (visible) {
      loadTemplates()
    }
  }, [visible])

  // 加载模板
  const loadTemplates = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }))

      // 获取所有模板
      const allTemplates = templateManager.getAllTemplates()
      
      setState(prev => ({
        ...prev,
        templates: allTemplates,
        filteredTemplates: allTemplates,
        isLoading: false
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '加载模板失败'
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }))
    }
  }, [])

  // 过滤模板
  const filterTemplates = useCallback(() => {
    let filtered = state.templates

    // 按分类过滤
    if (state.selectedCategory === 'recent') {
      const recentIds = templateManager.getRecentlyUsed()
      filtered = state.templates.filter(t => recentIds.includes(t.id))
    } else if (state.selectedCategory === 'favorites') {
      filtered = state.templates.filter(t => t.isFavorite)
    } else if (state.selectedCategory !== 'all') {
      filtered = state.templates.filter(t => t.category === state.selectedCategory)
    }

    // 按搜索关键词过滤
    if (state.searchQuery.trim()) {
      const query = state.searchQuery.toLowerCase()
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    setState(prev => ({ ...prev, filteredTemplates: filtered }))
  }, [state.templates, state.selectedCategory, state.searchQuery])

  // 监听过滤条件变化
  useEffect(() => {
    filterTemplates()
  }, [filterTemplates])

  // 处理分类选择
  const handleCategorySelect = useCallback((category: typeof state.selectedCategory) => {
    setState(prev => ({ ...prev, selectedCategory: category }))
  }, [])

  // 处理搜索
  const handleSearch = useCallback((query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }))
  }, [])

  // 处理模板选择
  const handleTemplateSelect = useCallback((template: MindMapTemplate) => {
    setState(prev => ({ ...prev, selectedTemplate: template }))
  }, [])

  // 处理模板应用
  const handleTemplateApply = useCallback(() => {
    if (state.selectedTemplate) {
      onTemplateSelect(state.selectedTemplate)
      onClose()

      // 发送事件到事件总线
      if (appCore.isInitialized()) {
        const eventBus = appCore.getEventBus()
        eventBus?.emit('mindmap:template:applied', {
          templateId: state.selectedTemplate.id,
          templateName: state.selectedTemplate.name,
          category: state.selectedTemplate.category
        }, 'TemplateSelector')
      }
    }
  }, [state.selectedTemplate, onTemplateSelect, onClose])

  // 切换收藏状态
  const toggleFavorite = useCallback((template: MindMapTemplate, event: React.MouseEvent) => {
    event.stopPropagation()
    
    templateManager.toggleFavorite(template.id)
    
    // 更新本地状态
    setState(prev => ({
      ...prev,
      templates: prev.templates.map(t => 
        t.id === template.id ? { ...t, isFavorite: !t.isFavorite } : t
      )
    }))
  }, [])

  // 计算分类统计
  const categoryStats = useMemo(() => {
    const stats: Record<string, number> = {}
    
    state.templates.forEach(template => {
      stats[template.category] = (stats[template.category] || 0) + 1
    })
    
    stats.recent = templateManager.getRecentlyUsed().length
    stats.favorites = state.templates.filter(t => t.isFavorite).length
    
    return stats
  }, [state.templates])

  if (!visible) return null

  return (
    <div className={`template-selector ${className}`}>
      {/* 遮罩层 */}
      <div className="template-selector-overlay" onClick={onClose} />
      
      {/* 主面板 */}
      <div className="template-selector-panel">
        {/* 标题栏 */}
        <div className="selector-header">
          <h2 className="selector-title">📋 选择模板</h2>
          <button onClick={onClose} className="close-button" title="关闭">
            ✕
          </button>
        </div>

        {/* 搜索栏 */}
        <div className="search-section">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="搜索模板名称、描述或标签..."
              value={state.searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="search-input"
            />
            {state.searchQuery && (
              <button
                onClick={() => handleSearch('')}
                className="clear-search-button"
                title="清除搜索"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="selector-content">
          {/* 分类侧边栏 */}
          <div className="category-sidebar">
            <h3 className="sidebar-title">分类</h3>
            <div className="category-list">
              {Object.entries(categoryConfig).map(([key, config]) => (
                <button
                  key={key}
                  className={`category-item ${state.selectedCategory === key ? 'active' : ''}`}
                  onClick={() => handleCategorySelect(key as any)}
                >
                  <span className="category-icon">{config.icon}</span>
                  <span className="category-name">{config.name}</span>
                  <span className="category-count">
                    {categoryStats[key] || 0}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 模板网格 */}
          <div className="template-grid-container">
            {state.isLoading ? (
              <div className="loading-state">
                <div className="loading-spinner" />
                <span>正在加载模板...</span>
              </div>
            ) : state.error ? (
              <div className="error-state">
                <span className="error-icon">❌</span>
                <span className="error-message">{state.error}</span>
                <button onClick={loadTemplates} className="retry-button">
                  重试
                </button>
              </div>
            ) : state.filteredTemplates.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">📭</span>
                <span className="empty-message">
                  {state.searchQuery ? '未找到匹配的模板' : '暂无模板'}
                </span>
              </div>
            ) : (
              <div className="template-grid">
                {state.filteredTemplates.map(template => (
                  <div
                    key={template.id}
                    className={`template-card ${state.selectedTemplate?.id === template.id ? 'selected' : ''}`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    {/* 模板预览 */}
                    <div className="template-preview">
                      {template.thumbnail ? (
                        <img src={template.thumbnail} alt={template.name} />
                      ) : (
                        <div className="template-placeholder">
                          <span className="placeholder-icon">
                            {categoryConfig[template.category]?.icon || '📝'}
                          </span>
                        </div>
                      )}
                      
                      {/* 收藏按钮 */}
                      <button
                        className={`favorite-button ${template.isFavorite ? 'favorited' : ''}`}
                        onClick={(e) => toggleFavorite(template, e)}
                        title={template.isFavorite ? '取消收藏' : '添加收藏'}
                      >
                        {template.isFavorite ? '⭐' : '☆'}
                      </button>
                    </div>

                    {/* 模板信息 */}
                    <div className="template-info">
                      <h4 className="template-name">{template.name}</h4>
                      <p className="template-description">{template.description}</p>
                      
                      {/* 标签 */}
                      {template.tags.length > 0 && (
                        <div className="template-tags">
                          {template.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="template-tag">
                              {tag}
                            </span>
                          ))}
                          {template.tags.length > 3 && (
                            <span className="template-tag more">
                              +{template.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* 使用次数 */}
                      <div className="template-stats">
                        <span className="usage-count">
                          使用 {template.usageCount} 次
                        </span>
                        {template.isBuiltIn && (
                          <span className="builtin-badge">内置</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className="selector-footer">
          <div className="footer-info">
            {state.selectedTemplate && (
              <span className="selected-info">
                已选择: {state.selectedTemplate.name}
              </span>
            )}
          </div>
          
          <div className="footer-actions">
            <button onClick={onClose} className="cancel-button">
              取消
            </button>
            <button
              onClick={handleTemplateApply}
              disabled={!state.selectedTemplate}
              className="apply-button"
            >
              应用模板
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TemplateSelector
