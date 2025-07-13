/**
 * 链接管理面板组件
 * 提供链接的查看、编辑和分析功能
 */

import React, { useState, useCallback, useMemo } from 'react'
import { GraphNode, GraphLink } from '../types'
import { LinkAnalysis } from '../services/BidirectionalLinkManager'

interface LinkManagementPanelProps {
  /** 当前选中的节点 */
  selectedNode: GraphNode | null
  /** 所有节点 */
  nodes: GraphNode[]
  /** 所有链接 */
  links: GraphLink[]
  /** 链接分析数据 */
  linkAnalysis?: LinkAnalysis
  /** 删除链接回调 */
  onDeleteLink: (linkId: string) => void
  /** 编辑链接回调 */
  onEditLink: (linkId: string) => void
  /** 创建链接回调 */
  onCreateLink: (sourceId: string) => void
  /** 节点点击回调 */
  onNodeClick: (nodeId: string) => void
  /** 类名 */
  className?: string
}

interface PanelState {
  /** 当前标签页 */
  activeTab: 'connections' | 'analysis' | 'suggestions'
  /** 链接过滤类型 */
  linkFilter: 'all' | 'reference' | 'tag' | 'folder' | 'similarity' | 'custom'
  /** 排序方式 */
  sortBy: 'strength' | 'type' | 'created'
  /** 排序方向 */
  sortDirection: 'asc' | 'desc'
}

/**
 * 链接管理面板组件
 */
export const LinkManagementPanel: React.FC<LinkManagementPanelProps> = ({
  selectedNode,
  nodes,
  links,
  linkAnalysis,
  onDeleteLink,
  onEditLink,
  onCreateLink,
  onNodeClick,
  className = ''
}) => {
  // 状态管理
  const [panelState, setPanelState] = useState<PanelState>({
    activeTab: 'connections',
    linkFilter: 'all',
    sortBy: 'strength',
    sortDirection: 'desc'
  })

  // 获取选中节点的链接
  const nodeLinks = useMemo(() => {
    if (!selectedNode) return []
    
    return links.filter(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id
      const targetId = typeof link.target === 'string' ? link.target : link.target.id
      return sourceId === selectedNode.id || targetId === selectedNode.id
    })
  }, [selectedNode, links])

  // 过滤和排序链接
  const filteredAndSortedLinks = useMemo(() => {
    let filtered = nodeLinks

    // 按类型过滤
    if (panelState.linkFilter !== 'all') {
      filtered = filtered.filter(link => link.type === panelState.linkFilter)
    }

    // 排序
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (panelState.sortBy) {
        case 'strength':
          comparison = (b.weight || 0) - (a.weight || 0)
          break
        case 'type':
          comparison = a.type.localeCompare(b.type)
          break
        case 'created':
          // 假设链接ID包含时间戳
          comparison = a.id.localeCompare(b.id)
          break
      }
      
      return panelState.sortDirection === 'desc' ? comparison : -comparison
    })

    return filtered
  }, [nodeLinks, panelState])

  // 获取连接的节点信息
  const getConnectedNode = useCallback((link: GraphLink): GraphNode | null => {
    if (!selectedNode) return null
    
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id
    const targetId = typeof link.target === 'string' ? link.target : link.target.id
    
    const connectedId = sourceId === selectedNode.id ? targetId : sourceId
    return nodes.find(node => node.id === connectedId) || null
  }, [selectedNode, nodes])

  // 获取链接类型图标
  const getLinkTypeIcon = useCallback((type: string): string => {
    const icons = {
      reference: '🔗',
      tag: '🏷️',
      folder: '📁',
      similarity: '🔄',
      custom: '⚙️'
    }
    return icons[type as keyof typeof icons] || '🔗'
  }, [])

  // 获取链接强度颜色
  const getStrengthColor = useCallback((strength: number): string => {
    if (strength >= 0.8) return '#10b981' // 绿色
    if (strength >= 0.6) return '#f59e0b' // 黄色
    if (strength >= 0.4) return '#f97316' // 橙色
    return '#ef4444' // 红色
  }, [])

  /**
   * 处理链接删除
   */
  const handleDeleteLink = useCallback((linkId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    if (confirm('确定要删除这个链接吗？')) {
      onDeleteLink(linkId)
    }
  }, [onDeleteLink])

  /**
   * 处理链接编辑
   */
  const handleEditLink = useCallback((linkId: string, event: React.MouseEvent) => {
    event.stopPropagation()
    onEditLink(linkId)
  }, [onEditLink])

  if (!selectedNode) {
    return (
      <div className={`link-management-panel empty ${className}`}>
        <div className="empty-state">
          <div className="empty-icon">🔗</div>
          <div className="empty-title">选择一个节点</div>
          <div className="empty-description">选择图谱中的节点来查看和管理其链接关系</div>
        </div>
      </div>
    )
  }

  return (
    <div className={`link-management-panel ${className}`}>
      {/* 面板标题 */}
      <div className="panel-header">
        <div className="selected-node-info">
          <div className="node-icon">
            {selectedNode.type === 'note' ? '📝' : selectedNode.type === 'tag' ? '🏷️' : selectedNode.type === 'folder' ? '📁' : '🔗'}
          </div>
          <div className="node-details">
            <div className="node-title">{selectedNode.title}</div>
            <div className="node-stats">{nodeLinks.length} 个链接</div>
          </div>
        </div>
        <button
          onClick={() => onCreateLink(selectedNode.id)}
          className="create-link-button"
        >
          ➕ 创建链接
        </button>
      </div>

      {/* 标签页 */}
      <div className="panel-tabs">
        <button
          onClick={() => setPanelState(prev => ({ ...prev, activeTab: 'connections' }))}
          className={`tab-button ${panelState.activeTab === 'connections' ? 'active' : ''}`}
        >
          连接 ({nodeLinks.length})
        </button>
        <button
          onClick={() => setPanelState(prev => ({ ...prev, activeTab: 'analysis' }))}
          className={`tab-button ${panelState.activeTab === 'analysis' ? 'active' : ''}`}
        >
          分析
        </button>
        <button
          onClick={() => setPanelState(prev => ({ ...prev, activeTab: 'suggestions' }))}
          className={`tab-button ${panelState.activeTab === 'suggestions' ? 'active' : ''}`}
        >
          建议
        </button>
      </div>

      {/* 标签页内容 */}
      <div className="panel-content">
        {panelState.activeTab === 'connections' && (
          <div className="connections-tab">
            {/* 过滤和排序控件 */}
            <div className="controls">
              <select
                value={panelState.linkFilter}
                onChange={(e) => setPanelState(prev => ({ ...prev, linkFilter: e.target.value as any }))}
                className="filter-select"
              >
                <option value="all">所有类型</option>
                <option value="reference">引用链接</option>
                <option value="tag">标签关联</option>
                <option value="folder">文件夹关联</option>
                <option value="similarity">相似性链接</option>
                <option value="custom">自定义链接</option>
              </select>
              
              <select
                value={`${panelState.sortBy}-${panelState.sortDirection}`}
                onChange={(e) => {
                  const [sortBy, sortDirection] = e.target.value.split('-')
                  setPanelState(prev => ({ ...prev, sortBy: sortBy as any, sortDirection: sortDirection as any }))
                }}
                className="sort-select"
              >
                <option value="strength-desc">强度 ↓</option>
                <option value="strength-asc">强度 ↑</option>
                <option value="type-asc">类型 A-Z</option>
                <option value="type-desc">类型 Z-A</option>
                <option value="created-desc">最新创建</option>
                <option value="created-asc">最早创建</option>
              </select>
            </div>

            {/* 链接列表 */}
            <div className="links-list">
              {filteredAndSortedLinks.length === 0 ? (
                <div className="empty-links">
                  <div className="empty-icon">🔗</div>
                  <div className="empty-text">
                    {panelState.linkFilter === 'all' ? '暂无链接' : '没有找到匹配的链接'}
                  </div>
                </div>
              ) : (
                filteredAndSortedLinks.map(link => {
                  const connectedNode = getConnectedNode(link)
                  if (!connectedNode) return null

                  return (
                    <div
                      key={link.id}
                      onClick={() => onNodeClick(connectedNode.id)}
                      className="link-item"
                    >
                      <div className="link-type-icon">
                        {getLinkTypeIcon(link.type)}
                      </div>
                      
                      <div className="link-info">
                        <div className="connected-node">
                          <span className="node-title">{connectedNode.title}</span>
                          <span className="node-type">{connectedNode.type}</span>
                        </div>
                        
                        <div className="link-meta">
                          <span className="link-type">{link.type}</span>
                          {link.label && <span className="link-label">· {link.label}</span>}
                        </div>
                      </div>

                      <div className="link-strength">
                        <div 
                          className="strength-bar"
                          style={{ backgroundColor: getStrengthColor(link.weight || 0) }}
                        >
                          <div 
                            className="strength-fill"
                            style={{ width: `${(link.weight || 0) * 100}%` }}
                          ></div>
                        </div>
                        <span className="strength-text">{Math.round((link.weight || 0) * 100)}%</span>
                      </div>

                      <div className="link-actions">
                        <button
                          onClick={(e) => handleEditLink(link.id, e)}
                          className="action-button edit"
                          title="编辑链接"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={(e) => handleDeleteLink(link.id, e)}
                          className="action-button delete"
                          title="删除链接"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {panelState.activeTab === 'analysis' && (
          <div className="analysis-tab">
            {linkAnalysis ? (
              <div className="analysis-content">
                <div className="stats-grid">
                  <div className="stat-item">
                    <div className="stat-value">{linkAnalysis.totalLinks}</div>
                    <div className="stat-label">总链接数</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{linkAnalysis.bidirectionalLinks}</div>
                    <div className="stat-label">双向链接</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{linkAnalysis.centralNodes.length}</div>
                    <div className="stat-label">中心节点</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{linkAnalysis.isolatedNodes.length}</div>
                    <div className="stat-label">孤立节点</div>
                  </div>
                </div>

                {linkAnalysis.strongestLinks.length > 0 && (
                  <div className="analysis-section">
                    <h4 className="section-title">最强链接</h4>
                    <div className="link-list">
                      {linkAnalysis.strongestLinks.slice(0, 3).map(link => (
                        <div key={link.id} className="analysis-link-item">
                          <span className="link-strength">{Math.round((link.weight || 0) * 100)}%</span>
                          <span className="link-type">{getLinkTypeIcon(link.type)} {link.type}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="analysis-loading">
                <div className="loading-spinner"></div>
                <div className="loading-text">分析链接网络中...</div>
              </div>
            )}
          </div>
        )}

        {panelState.activeTab === 'suggestions' && (
          <div className="suggestions-tab">
            <div className="suggestions-content">
              <div className="suggestion-item">
                <div className="suggestion-icon">💡</div>
                <div className="suggestion-text">
                  基于标签相似性，建议与具有相同标签的节点建立链接
                </div>
              </div>
              <div className="suggestion-item">
                <div className="suggestion-icon">🔍</div>
                <div className="suggestion-text">
                  基于内容相似性，建议与相关主题的节点建立链接
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default LinkManagementPanel
