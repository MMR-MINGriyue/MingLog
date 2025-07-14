/**
 * 链接创建对话框组件
 * 提供直观的节点间链接创建界面
 */

import React, { useState, useCallback, useMemo } from 'react'
import { GraphNode } from '../types'
import { LinkCreationRequest, LinkSuggestion } from '../services/BidirectionalLinkManager'

interface LinkCreationDialogProps {
  /** 是否显示对话框 */
  visible: boolean
  /** 源节点 */
  sourceNode: GraphNode | null
  /** 目标节点（可选，用于编辑现有链接） */
  targetNode?: GraphNode | null
  /** 可选择的节点列表 */
  availableNodes: GraphNode[]
  /** 链接建议 */
  suggestions?: LinkSuggestion[]
  /** 关闭对话框回调 */
  onClose: () => void
  /** 创建链接回调 */
  onCreateLink: (request: LinkCreationRequest) => void
  /** 类名 */
  className?: string
}

interface DialogState {
  /** 选中的目标节点 */
  selectedTargetId: string
  /** 链接类型 */
  linkType: 'reference' | 'tag' | 'folder' | 'similarity' | 'custom'
  /** 链接强度 */
  strength: number
  /** 链接标签 */
  label: string
  /** 是否双向 */
  bidirectional: boolean
  /** 搜索查询 */
  searchQuery: string
  /** 当前标签页 */
  activeTab: 'manual' | 'suggestions'
}

/**
 * 链接创建对话框组件
 */
export const LinkCreationDialog: React.FC<LinkCreationDialogProps> = ({
  visible,
  sourceNode,
  targetNode,
  availableNodes,
  suggestions = [],
  onClose,
  onCreateLink,
  className = ''
}) => {
  // 状态管理
  const [dialogState, setDialogState] = useState<DialogState>({
    selectedTargetId: targetNode?.id || '',
    linkType: 'reference',
    strength: 0.8,
    label: '',
    bidirectional: true,
    searchQuery: '',
    activeTab: suggestions.length > 0 ? 'suggestions' : 'manual'
  })

  // 过滤可用节点
  const filteredNodes = useMemo(() => {
    if (!dialogState.searchQuery) return availableNodes
    
    const query = dialogState.searchQuery.toLowerCase()
    return availableNodes.filter(node =>
      node.title.toLowerCase().includes(query) ||
      (node.content && node.content.toLowerCase().includes(query)) ||
      (node.tags && node.tags.some(tag => tag.toLowerCase().includes(query)))
    )
  }, [availableNodes, dialogState.searchQuery])

  // 链接类型选项
  const linkTypeOptions = [
    { value: 'reference', label: '引用链接', icon: '🔗', description: '直接引用关系' },
    { value: 'tag', label: '标签关联', icon: '🏷️', description: '基于标签的关联' },
    { value: 'folder', label: '文件夹关联', icon: '📁', description: '基于文件夹的关联' },
    { value: 'similarity', label: '相似性链接', icon: '🔄', description: '内容相似性关联' },
    { value: 'custom', label: '自定义链接', icon: '⚙️', description: '用户自定义关系' }
  ]

  /**
   * 处理目标节点选择
   */
  const handleTargetSelect = useCallback((nodeId: string) => {
    setDialogState(prev => ({
      ...prev,
      selectedTargetId: nodeId
    }))
  }, [])

  /**
   * 处理链接类型变更
   */
  const handleLinkTypeChange = useCallback((linkType: DialogState['linkType']) => {
    setDialogState(prev => ({
      ...prev,
      linkType,
      // 根据链接类型设置默认强度
      strength: linkType === 'reference' ? 0.8 : 
                linkType === 'tag' ? 0.6 :
                linkType === 'folder' ? 0.7 :
                linkType === 'similarity' ? 0.4 : 0.5
    }))
  }, [])

  /**
   * 处理建议选择
   */
  const handleSuggestionSelect = useCallback((suggestion: LinkSuggestion) => {
    setDialogState(prev => ({
      ...prev,
      selectedTargetId: suggestion.targetNode.id,
      linkType: suggestion.suggestedType,
      strength: suggestion.confidence,
      activeTab: 'manual'
    }))
  }, [])

  /**
   * 处理创建链接
   */
  const handleCreateLink = useCallback(() => {
    if (!sourceNode || !dialogState.selectedTargetId) return

    const request: LinkCreationRequest = {
      sourceId: sourceNode.id,
      targetId: dialogState.selectedTargetId,
      linkType: dialogState.linkType,
      strength: dialogState.strength,
      label: dialogState.label || undefined,
      bidirectional: dialogState.bidirectional,
      metadata: {
        createdBy: 'user',
        createdAt: new Date().toISOString()
      }
    }

    onCreateLink(request)
    onClose()
  }, [sourceNode, dialogState, onCreateLink, onClose])

  /**
   * 重置对话框状态
   */
  const handleReset = useCallback(() => {
    setDialogState({
      selectedTargetId: targetNode?.id || '',
      linkType: 'reference',
      strength: 0.8,
      label: '',
      bidirectional: true,
      searchQuery: '',
      activeTab: suggestions.length > 0 ? 'suggestions' : 'manual'
    })
  }, [targetNode, suggestions])

  if (!visible || !sourceNode) return null

  const selectedTarget = availableNodes.find(n => n.id === dialogState.selectedTargetId)
  const canCreate = sourceNode && selectedTarget && dialogState.selectedTargetId !== sourceNode.id

  return (
    <div className={`link-creation-dialog-overlay ${className}`}>
      <div className="link-creation-dialog">
        {/* 标题栏 */}
        <div className="dialog-header">
          <h3 className="dialog-title">🔗 创建节点链接</h3>
          <button onClick={onClose} className="close-button">✕</button>
        </div>

        {/* 源节点信息 */}
        <div className="source-node-info">
          <div className="node-preview">
            <div className="node-icon">{sourceNode.type === 'note' ? '📝' : sourceNode.type === 'tag' ? '🏷️' : sourceNode.type === 'folder' ? '📁' : '🔗'}</div>
            <div className="node-details">
              <div className="node-title">{sourceNode.title}</div>
              <div className="node-type">源节点 · {sourceNode.type}</div>
            </div>
          </div>
        </div>

        {/* 标签页 */}
        <div className="dialog-tabs">
          <button
            onClick={() => setDialogState(prev => ({ ...prev, activeTab: 'manual' }))}
            className={`tab-button ${dialogState.activeTab === 'manual' ? 'active' : ''}`}
          >
            手动选择
          </button>
          {suggestions.length > 0 && (
            <button
              onClick={() => setDialogState(prev => ({ ...prev, activeTab: 'suggestions' }))}
              className={`tab-button ${dialogState.activeTab === 'suggestions' ? 'active' : ''}`}
            >
              智能建议 ({suggestions.length})
            </button>
          )}
        </div>

        {/* 标签页内容 */}
        <div className="dialog-content">
          {dialogState.activeTab === 'manual' ? (
            <div className="manual-selection">
              {/* 搜索框 */}
              <div className="search-section">
                <input
                  type="text"
                  placeholder="搜索目标节点..."
                  value={dialogState.searchQuery}
                  onChange={(e) => setDialogState(prev => ({ ...prev, searchQuery: e.target.value }))}
                  className="search-input"
                />
              </div>

              {/* 节点列表 */}
              <div className="node-list">
                {filteredNodes.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">🔍</div>
                    <div className="empty-text">没有找到匹配的节点</div>
                  </div>
                ) : (
                  filteredNodes
                    .filter(node => node.id !== sourceNode.id)
                    .map(node => (
                      <div
                        key={node.id}
                        onClick={() => handleTargetSelect(node.id)}
                        className={`node-item ${dialogState.selectedTargetId === node.id ? 'selected' : ''}`}
                      >
                        <div className="node-icon">
                          {node.type === 'note' ? '📝' : node.type === 'tag' ? '🏷️' : node.type === 'folder' ? '📁' : '🔗'}
                        </div>
                        <div className="node-info">
                          <div className="node-title">{node.title}</div>
                          <div className="node-meta">
                            {node.type} {node.tags && node.tags.length > 0 && `· ${node.tags.slice(0, 2).join(', ')}`}
                          </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          ) : (
            <div className="suggestions-section">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className="suggestion-item"
                >
                  <div className="suggestion-node">
                    <div className="node-icon">
                      {suggestion.targetNode.type === 'note' ? '📝' : suggestion.targetNode.type === 'tag' ? '🏷️' : suggestion.targetNode.type === 'folder' ? '📁' : '🔗'}
                    </div>
                    <div className="node-info">
                      <div className="node-title">{suggestion.targetNode.title}</div>
                      <div className="suggestion-reason">{suggestion.reason}</div>
                    </div>
                  </div>
                  <div className="suggestion-meta">
                    <div className="confidence-bar">
                      <div 
                        className="confidence-fill" 
                        style={{ width: `${suggestion.confidence * 100}%` }}
                      ></div>
                    </div>
                    <div className="confidence-text">{Math.round(suggestion.confidence * 100)}%</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 链接配置 */}
        {selectedTarget && (
          <div className="link-configuration">
            <h4 className="config-title">链接配置</h4>
            
            {/* 链接类型 */}
            <div className="config-group">
              <label className="config-label">链接类型</label>
              <div className="link-type-grid">
                {linkTypeOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => handleLinkTypeChange(option.value as DialogState['linkType'])}
                    className={`link-type-option ${dialogState.linkType === option.value ? 'selected' : ''}`}
                  >
                    <div className="option-icon">{option.icon}</div>
                    <div className="option-label">{option.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 链接强度 */}
            <div className="config-group">
              <label className="config-label">链接强度</label>
              <div className="strength-slider">
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={dialogState.strength}
                  onChange={(e) => setDialogState(prev => ({ ...prev, strength: parseFloat(e.target.value) }))}
                  className="slider"
                />
                <span className="strength-value">{Math.round(dialogState.strength * 100)}%</span>
              </div>
            </div>

            {/* 链接标签 */}
            <div className="config-group">
              <label className="config-label">链接标签（可选）</label>
              <input
                type="text"
                placeholder="为链接添加描述性标签..."
                value={dialogState.label}
                onChange={(e) => setDialogState(prev => ({ ...prev, label: e.target.value }))}
                className="label-input"
              />
            </div>

            {/* 双向选项 */}
            <div className="config-group">
              <label className="config-label checkbox-label">
                <input
                  type="checkbox"
                  checked={dialogState.bidirectional}
                  onChange={(e) => setDialogState(prev => ({ ...prev, bidirectional: e.target.checked }))}
                  className="checkbox"
                />
                创建双向链接
              </label>
              <div className="config-description">
                双向链接将在两个节点间创建相互的关联关系
              </div>
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="dialog-actions">
          <button onClick={handleReset} className="action-button secondary">
            🔄 重置
          </button>
          <button onClick={onClose} className="action-button secondary">
            取消
          </button>
          <button
            onClick={handleCreateLink}
            disabled={!canCreate}
            className="action-button primary"
          >
            🔗 创建链接
          </button>
        </div>
      </div>
    </div>
  )
}

export default LinkCreationDialog
