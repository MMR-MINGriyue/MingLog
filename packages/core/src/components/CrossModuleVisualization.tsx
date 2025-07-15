/**
 * 跨模块数据关联可视化组件
 * 提供思维导图与图谱之间的数据关联可视化界面
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react'
// import { MindMapData } from '@minglog/mindmap' // 模块不存在，暂时注释
// import { GraphData } from '@minglog/graph' // 模块不存在，暂时注释

// 临时类型定义
interface MindMapData {
  nodes: Array<{ id: string; label: string; [key: string]: any }>
  links: Array<{ source: string; target: string; [key: string]: any }>
}

interface GraphData {
  nodes: Array<{ id: string; label: string; [key: string]: any }>
  edges: Array<{ source: string; target: string; [key: string]: any }>
}
import { DataAssociation, CrossModuleDataBridge } from '../services/CrossModuleDataBridge'
import { UnifiedSearchService, SearchQuery, SearchResponse } from '../services/UnifiedSearchService'

interface CrossModuleVisualizationProps {
  /** 思维导图数据 */
  mindMapData?: MindMapData
  /** 图谱数据 */
  graphData?: GraphData
  /** 数据桥梁服务 */
  dataBridge: CrossModuleDataBridge
  /** 搜索服务 */
  searchService: UnifiedSearchService
  /** 宽度 */
  width?: number
  /** 高度 */
  height?: number
  /** 是否显示同步控制 */
  showSyncControls?: boolean
  /** 是否显示搜索界面 */
  showSearchInterface?: boolean
  /** 数据同步回调 */
  onDataSync?: (mindMapData: MindMapData, graphData: GraphData) => void
  /** 关联创建回调 */
  onAssociationCreated?: (association: DataAssociation) => void
  /** 类名 */
  className?: string
}

interface VisualizationState {
  /** 当前视图模式 */
  viewMode: 'split' | 'mindmap' | 'graph' | 'associations'
  /** 选中的关联 */
  selectedAssociations: Set<string>
  /** 搜索查询 */
  searchQuery: string
  /** 搜索结果 */
  searchResults: SearchResponse | null
  /** 同步状态 */
  syncStatus: 'idle' | 'syncing' | 'success' | 'error'
  /** 同步进度 */
  syncProgress: number
  /** 错误信息 */
  error: string | null
}

/**
 * 跨模块数据关联可视化组件
 */
export const CrossModuleVisualization: React.FC<CrossModuleVisualizationProps> = ({
  mindMapData,
  graphData,
  dataBridge,
  searchService,
  width = 1200,
  height = 800,
  showSyncControls = true,
  showSearchInterface = true,
  onDataSync,
  onAssociationCreated,
  className = ''
}) => {
  // 状态管理
  const [visualizationState, setVisualizationState] = useState<VisualizationState>({
    viewMode: 'split',
    selectedAssociations: new Set(),
    searchQuery: '',
    searchResults: null,
    syncStatus: 'idle',
    syncProgress: 0,
    error: null
  })

  // 获取所有关联
  const associations = useMemo(() => {
    return dataBridge.getAllAssociations()
  }, [dataBridge])

  // 获取思维导图关联
  const mindMapAssociations = useMemo(() => {
    return dataBridge.getAssociationsByModule('mindmap')
  }, [dataBridge])

  // 获取图谱关联
  const graphAssociations = useMemo(() => {
    return dataBridge.getAssociationsByModule('graph')
  }, [dataBridge])

  /**
   * 处理视图模式切换
   */
  const handleViewModeChange = useCallback((mode: VisualizationState['viewMode']) => {
    setVisualizationState(prev => ({
      ...prev,
      viewMode: mode
    }))
  }, [])

  /**
   * 处理搜索
   */
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setVisualizationState(prev => ({
        ...prev,
        searchQuery: '',
        searchResults: null
      }))
      return
    }

    try {
      const searchQuery: SearchQuery = {
        query,
        scope: 'all',
        type: 'fuzzy',
        sortBy: 'relevance',
        limit: 20
      }

      const results = await searchService.search(searchQuery)
      
      setVisualizationState(prev => ({
        ...prev,
        searchQuery: query,
        searchResults: results,
        error: null
      }))
    } catch (error) {
      setVisualizationState(prev => ({
        ...prev,
        error: `搜索失败: ${error instanceof Error ? error.message : '未知错误'}`
      }))
    }
  }, [searchService])

  /**
   * 处理数据同步
   */
  const handleDataSync = useCallback(async () => {
    if (!mindMapData || !graphData) {
      setVisualizationState(prev => ({
        ...prev,
        error: '缺少思维导图或图谱数据'
      }))
      return
    }

    setVisualizationState(prev => ({
      ...prev,
      syncStatus: 'syncing',
      syncProgress: 0,
      error: null
    }))

    try {
      // 模拟同步进度
      const progressInterval = setInterval(() => {
        setVisualizationState(prev => ({
          ...prev,
          syncProgress: Math.min(prev.syncProgress + 10, 90)
        }))
      }, 100)

      const result = await dataBridge.performBidirectionalSync(mindMapData, graphData)
      
      clearInterval(progressInterval)
      
      setVisualizationState(prev => ({
        ...prev,
        syncStatus: 'success',
        syncProgress: 100
      }))

      onDataSync?.(result.mindMapData, result.graphData)

      // 3秒后重置状态
      setTimeout(() => {
        setVisualizationState(prev => ({
          ...prev,
          syncStatus: 'idle',
          syncProgress: 0
        }))
      }, 3000)

    } catch (error) {
      setVisualizationState(prev => ({
        ...prev,
        syncStatus: 'error',
        error: `同步失败: ${error instanceof Error ? error.message : '未知错误'}`
      }))
    }
  }, [mindMapData, graphData, dataBridge, onDataSync])

  /**
   * 处理关联创建
   */
  const handleCreateAssociation = useCallback(async (
    sourceModule: 'mindmap' | 'graph',
    sourceEntityId: string,
    targetModule: 'mindmap' | 'graph',
    targetEntityId: string
  ) => {
    try {
      const association = await dataBridge.createAssociation(
        sourceModule,
        sourceEntityId,
        targetModule,
        targetEntityId,
        {
          associationType: 'manual',
          strength: 0.8,
          bidirectional: true
        }
      )

      onAssociationCreated?.(association)

      setVisualizationState(prev => ({
        ...prev,
        error: null
      }))
    } catch (error) {
      setVisualizationState(prev => ({
        ...prev,
        error: `创建关联失败: ${error instanceof Error ? error.message : '未知错误'}`
      }))
    }
  }, [dataBridge, onAssociationCreated])

  /**
   * 处理关联删除
   */
  const handleDeleteAssociation = useCallback(async (associationId: string) => {
    try {
      await dataBridge.deleteAssociation(associationId)
      
      setVisualizationState(prev => ({
        ...prev,
        selectedAssociations: new Set(
          Array.from(prev.selectedAssociations).filter(id => id !== associationId)
        ),
        error: null
      }))
    } catch (error) {
      setVisualizationState(prev => ({
        ...prev,
        error: `删除关联失败: ${error instanceof Error ? error.message : '未知错误'}`
      }))
    }
  }, [dataBridge])

  /**
   * 渲染同步控制面板
   */
  const renderSyncControls = () => {
    if (!showSyncControls) return null

    return (
      <div className="sync-controls">
        <div className="sync-header">
          <h3>数据同步</h3>
          <div className="sync-stats">
            <span>思维导图节点: {mindMapData?.nodes.length || 0}</span>
            <span>图谱节点: {graphData?.nodes.length || 0}</span>
            <span>关联数: {associations.length}</span>
          </div>
        </div>

        <div className="sync-actions">
          <button
            onClick={handleDataSync}
            disabled={visualizationState.syncStatus === 'syncing'}
            className="sync-button primary"
          >
            {visualizationState.syncStatus === 'syncing' ? '同步中...' : '🔄 双向同步'}
          </button>

          <button
            onClick={() => handleSearch(visualizationState.searchQuery)}
            className="sync-button secondary"
          >
            🔍 重新索引
          </button>
        </div>

        {visualizationState.syncStatus === 'syncing' && (
          <div className="sync-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${visualizationState.syncProgress}%` }}
              ></div>
            </div>
            <span className="progress-text">{visualizationState.syncProgress}%</span>
          </div>
        )}

        {visualizationState.syncStatus === 'success' && (
          <div className="sync-message success">
            ✅ 同步完成
          </div>
        )}

        {visualizationState.error && (
          <div className="sync-message error">
            ❌ {visualizationState.error}
          </div>
        )}
      </div>
    )
  }

  /**
   * 渲染搜索界面
   */
  const renderSearchInterface = () => {
    if (!showSearchInterface) return null

    return (
      <div className="search-interface">
        <div className="search-header">
          <h3>统一搜索</h3>
        </div>

        <div className="search-input-container">
          <input
            type="text"
            placeholder="搜索思维导图、图谱节点、任务..."
            value={visualizationState.searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="search-input"
          />
          <button
            onClick={() => handleSearch(visualizationState.searchQuery)}
            className="search-button"
          >
            🔍
          </button>
        </div>

        {visualizationState.searchResults && (
          <div className="search-results">
            <div className="results-header">
              <span>找到 {visualizationState.searchResults.total} 个结果</span>
              <span>耗时 {Math.round(visualizationState.searchResults.duration)}ms</span>
            </div>

            <div className="results-list">
              {visualizationState.searchResults.results.map(result => (
                <div key={result.id} className="result-item">
                  <div className="result-header">
                    <span className="result-type">{result.type}</span>
                    <span className="result-module">{result.module}</span>
                    <span className="result-relevance">{Math.round(result.relevance * 100)}%</span>
                  </div>
                  <div className="result-title">{result.title}</div>
                  <div className="result-snippet">{result.snippet}</div>
                  {result.associations && (
                    <div className="result-associations">
                      <span>连接: {result.associations.connectionCount}</span>
                      <span>标签: {result.associations.tags.join(', ')}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {visualizationState.searchResults.suggestions.length > 0 && (
              <div className="search-suggestions">
                <h4>相关建议</h4>
                <div className="suggestions-list">
                  {visualizationState.searchResults.suggestions.map(suggestion => (
                    <button
                      key={suggestion}
                      onClick={() => handleSearch(suggestion)}
                      className="suggestion-item"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  /**
   * 渲染关联列表
   */
  const renderAssociationsList = () => {
    return (
      <div className="associations-list">
        <div className="associations-header">
          <h3>数据关联</h3>
          <span className="associations-count">{associations.length} 个关联</span>
        </div>

        <div className="associations-content">
          {associations.length === 0 ? (
            <div className="empty-associations">
              <div className="empty-icon">🔗</div>
              <div className="empty-text">暂无数据关联</div>
              <div className="empty-description">创建思维导图和图谱节点之间的关联</div>
            </div>
          ) : (
            associations.map(association => (
              <div key={association.id} className="association-item">
                <div className="association-info">
                  <div className="association-type">{association.associationType}</div>
                  <div className="association-modules">
                    <span className="source-module">{association.sourceModule}</span>
                    <span className="arrow">→</span>
                    <span className="target-module">{association.targetModule}</span>
                  </div>
                  <div className="association-strength">
                    强度: {Math.round(association.strength * 100)}%
                  </div>
                </div>
                
                <div className="association-actions">
                  <button
                    onClick={() => handleDeleteAssociation(association.id)}
                    className="delete-button"
                    title="删除关联"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  /**
   * 渲染视图模式切换器
   */
  const renderViewModeSelector = () => {
    const modes = [
      { key: 'split', label: '分屏视图', icon: '⚌' },
      { key: 'mindmap', label: '思维导图', icon: '🧠' },
      { key: 'graph', label: '知识图谱', icon: '🕸️' },
      { key: 'associations', label: '关联管理', icon: '🔗' }
    ]

    return (
      <div className="view-mode-selector">
        {modes.map(mode => (
          <button
            key={mode.key}
            onClick={() => handleViewModeChange(mode.key as any)}
            className={`mode-button ${visualizationState.viewMode === mode.key ? 'active' : ''}`}
          >
            <span className="mode-icon">{mode.icon}</span>
            <span className="mode-label">{mode.label}</span>
          </button>
        ))}
      </div>
    )
  }

  return (
    <div 
      className={`cross-module-visualization ${className}`}
      style={{ width, height }}
    >
      {/* 顶部工具栏 */}
      <div className="visualization-toolbar">
        {renderViewModeSelector()}
        
        <div className="toolbar-actions">
          <button
            onClick={() => handleCreateAssociation('mindmap', 'node1', 'graph', 'node1')}
            className="action-button"
            title="创建关联"
          >
            ➕ 创建关联
          </button>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="visualization-content">
        {visualizationState.viewMode === 'split' && (
          <div className="split-view">
            <div className="left-panel">
              {renderSyncControls()}
              {renderSearchInterface()}
            </div>
            <div className="right-panel">
              {renderAssociationsList()}
            </div>
          </div>
        )}

        {visualizationState.viewMode === 'associations' && (
          <div className="associations-view">
            {renderAssociationsList()}
          </div>
        )}

        {visualizationState.viewMode === 'mindmap' && (
          <div className="mindmap-view">
            <div className="view-placeholder">
              <h3>思维导图视图</h3>
              <p>这里将显示思维导图组件</p>
            </div>
          </div>
        )}

        {visualizationState.viewMode === 'graph' && (
          <div className="graph-view">
            <div className="view-placeholder">
              <h3>知识图谱视图</h3>
              <p>这里将显示图谱组件</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CrossModuleVisualization
