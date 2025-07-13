/**
 * 聚类可视化组件
 * 提供图形聚类结果的可视化展示和交互功能
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { GraphData, GraphNode, GraphLink, Cluster } from '../types'
import { GraphClusteringAnalyzer, ClusteringConfig, ClusteringResult } from '../algorithms/GraphClusteringAnalyzer'

interface ClusterVisualizationProps {
  /** 图谱数据 */
  graphData: GraphData
  /** 聚类分析器 */
  clusteringAnalyzer: GraphClusteringAnalyzer
  /** 画布宽度 */
  width?: number
  /** 画布高度 */
  height?: number
  /** 是否显示聚类边界 */
  showClusterBounds?: boolean
  /** 是否显示聚类标签 */
  showClusterLabels?: boolean
  /** 是否启用聚类交互 */
  enableClusterInteraction?: boolean
  /** 聚类结果变更回调 */
  onClusteringChange?: (result: ClusteringResult) => void
  /** 聚类选择回调 */
  onClusterSelect?: (cluster: Cluster | null) => void
  /** 类名 */
  className?: string
}

interface VisualizationState {
  /** 当前聚类结果 */
  clusteringResult: ClusteringResult | null
  /** 选中的聚类 */
  selectedCluster: Cluster | null
  /** 聚类配置 */
  config: ClusteringConfig
  /** 是否正在计算 */
  isComputing: boolean
  /** 错误信息 */
  error: string | null
  /** 显示设置 */
  displaySettings: {
    showBounds: boolean
    showLabels: boolean
    showStats: boolean
    highlightSelected: boolean
  }
}

/**
 * 聚类可视化组件
 */
export const ClusterVisualization: React.FC<ClusterVisualizationProps> = ({
  graphData,
  clusteringAnalyzer,
  width = 800,
  height = 600,
  showClusterBounds = true,
  showClusterLabels = true,
  enableClusterInteraction = true,
  onClusteringChange,
  onClusterSelect,
  className = ''
}) => {
  // 状态管理
  const [visualizationState, setVisualizationState] = useState<VisualizationState>({
    clusteringResult: null,
    selectedCluster: null,
    config: {
      algorithm: 'louvain',
      minClusterSize: 2,
      maxClusters: 10,
      resolution: 1.0,
      maxIterations: 100,
      convergenceThreshold: 1e-6,
      hierarchical: false
    },
    isComputing: false,
    error: null,
    displaySettings: {
      showBounds: showClusterBounds,
      showLabels: showClusterLabels,
      showStats: true,
      highlightSelected: true
    }
  })

  // 聚类算法选项
  const algorithmOptions = useMemo(() => [
    {
      value: 'louvain' as const,
      label: 'Louvain算法',
      description: '基于模块度优化的社区检测',
      icon: '🔬'
    },
    {
      value: 'modularity' as const,
      label: '模块度优化',
      description: '贪心模块度优化算法',
      icon: '📊'
    },
    {
      value: 'connectivity' as const,
      label: '连通性聚类',
      description: '基于图连通分量的聚类',
      icon: '🔗'
    },
    {
      value: 'tags' as const,
      label: '标签聚类',
      description: '基于节点标签的聚类',
      icon: '🏷️'
    },
    {
      value: 'type' as const,
      label: '类型聚类',
      description: '基于节点类型的聚类',
      icon: '📂'
    },
    {
      value: 'kmeans' as const,
      label: 'K-means聚类',
      description: '基于位置的K-means聚类',
      icon: '📍'
    }
  ], [])

  /**
   * 执行聚类分析
   */
  const performClustering = useCallback(async () => {
    if (visualizationState.isComputing) return

    setVisualizationState(prev => ({
      ...prev,
      isComputing: true,
      error: null
    }))

    try {
      const result = await clusteringAnalyzer.performClustering(
        graphData.nodes,
        graphData.links,
        visualizationState.config
      )

      setVisualizationState(prev => ({
        ...prev,
        clusteringResult: result,
        isComputing: false
      }))

      onClusteringChange?.(result)
    } catch (error) {
      setVisualizationState(prev => ({
        ...prev,
        error: `聚类分析失败: ${error instanceof Error ? error.message : '未知错误'}`,
        isComputing: false
      }))
    }
  }, [graphData, clusteringAnalyzer, visualizationState.config, onClusteringChange])

  /**
   * 处理配置更新
   */
  const handleConfigUpdate = useCallback((key: keyof ClusteringConfig, value: any) => {
    setVisualizationState(prev => ({
      ...prev,
      config: {
        ...prev.config,
        [key]: value
      }
    }))
  }, [])

  /**
   * 处理聚类选择
   */
  const handleClusterSelect = useCallback((cluster: Cluster | null) => {
    setVisualizationState(prev => ({
      ...prev,
      selectedCluster: cluster
    }))
    onClusterSelect?.(cluster)
  }, [onClusterSelect])

  /**
   * 处理显示设置更新
   */
  const handleDisplaySettingUpdate = useCallback((key: string, value: boolean) => {
    setVisualizationState(prev => ({
      ...prev,
      displaySettings: {
        ...prev.displaySettings,
        [key]: value
      }
    }))
  }, [])

  /**
   * 获取节点的聚类颜色
   */
  const getNodeClusterColor = useCallback((nodeId: string): string => {
    if (!visualizationState.clusteringResult) return '#999999'

    const cluster = visualizationState.clusteringResult.clusters.find(c => 
      c.nodes.includes(nodeId)
    )

    return cluster?.color || '#999999'
  }, [visualizationState.clusteringResult])

  /**
   * 渲染聚类边界
   */
  const renderClusterBounds = () => {
    if (!visualizationState.displaySettings.showBounds || !visualizationState.clusteringResult) {
      return null
    }

    return visualizationState.clusteringResult.clusters.map(cluster => (
      <circle
        key={`bound-${cluster.id}`}
        cx={cluster.center.x}
        cy={cluster.center.y}
        r={cluster.radius + 10}
        fill={cluster.color}
        fillOpacity={0.1}
        stroke={cluster.color}
        strokeWidth={2}
        strokeDasharray="5,5"
        className={`cluster-bound ${visualizationState.selectedCluster?.id === cluster.id ? 'selected' : ''}`}
        onClick={() => enableClusterInteraction && handleClusterSelect(cluster)}
        style={{ cursor: enableClusterInteraction ? 'pointer' : 'default' }}
      />
    ))
  }

  /**
   * 渲染聚类标签
   */
  const renderClusterLabels = () => {
    if (!visualizationState.displaySettings.showLabels || !visualizationState.clusteringResult) {
      return null
    }

    return visualizationState.clusteringResult.clusters.map(cluster => (
      <g key={`label-${cluster.id}`}>
        <rect
          x={cluster.center.x - 30}
          y={cluster.center.y - cluster.radius - 25}
          width={60}
          height={20}
          fill={cluster.color}
          fillOpacity={0.8}
          rx={10}
        />
        <text
          x={cluster.center.x}
          y={cluster.center.y - cluster.radius - 12}
          textAnchor="middle"
          fill="white"
          fontSize="12"
          fontWeight="bold"
        >
          {cluster.label || `C${cluster.id.split('_')[1] || '0'}`}
        </text>
        <text
          x={cluster.center.x}
          y={cluster.center.y - cluster.radius - 35}
          textAnchor="middle"
          fill={cluster.color}
          fontSize="10"
        >
          {cluster.nodes.length} 节点
        </text>
      </g>
    ))
  }

  /**
   * 渲染节点
   */
  const renderNodes = () => {
    return graphData.nodes.map(node => (
      <circle
        key={`node-${node.id}`}
        cx={node.x || 0}
        cy={node.y || 0}
        r={node.size || 8}
        fill={getNodeClusterColor(node.id)}
        stroke="#ffffff"
        strokeWidth={2}
        className="graph-node"
        onClick={() => {
          // 选择包含此节点的聚类
          if (visualizationState.clusteringResult) {
            const cluster = visualizationState.clusteringResult.clusters.find(c => 
              c.nodes.includes(node.id)
            )
            handleClusterSelect(cluster || null)
          }
        }}
      >
        <title>{node.title}</title>
      </circle>
    ))
  }

  /**
   * 渲染连接
   */
  const renderLinks = () => {
    return graphData.links.map(link => {
      const sourceNode = graphData.nodes.find(n => n.id === (typeof link.source === 'string' ? link.source : link.source.id))
      const targetNode = graphData.nodes.find(n => n.id === (typeof link.target === 'string' ? link.target : link.target.id))
      
      if (!sourceNode || !targetNode) return null

      return (
        <line
          key={`link-${link.id}`}
          x1={sourceNode.x || 0}
          y1={sourceNode.y || 0}
          x2={targetNode.x || 0}
          y2={targetNode.y || 0}
          stroke={link.color || '#999999'}
          strokeWidth={link.weight ? link.weight * 2 : 1}
          strokeOpacity={0.6}
          className="graph-link"
        />
      )
    })
  }

  /**
   * 渲染控制面板
   */
  const renderControlPanel = () => {
    return (
      <div className="cluster-control-panel">
        <div className="panel-header">
          <h3>聚类分析</h3>
          <button
            onClick={performClustering}
            disabled={visualizationState.isComputing}
            className="analyze-button"
          >
            {visualizationState.isComputing ? '⏳ 分析中...' : '🔬 开始分析'}
          </button>
        </div>

        <div className="algorithm-selection">
          <label className="control-label">算法选择</label>
          <select
            value={visualizationState.config.algorithm}
            onChange={(e) => handleConfigUpdate('algorithm', e.target.value)}
            className="algorithm-select"
          >
            {algorithmOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.icon} {option.label}
              </option>
            ))}
          </select>
          <div className="algorithm-description">
            {algorithmOptions.find(opt => opt.value === visualizationState.config.algorithm)?.description}
          </div>
        </div>

        <div className="parameter-controls">
          <div className="control-group">
            <label className="control-label">最小聚类大小</label>
            <input
              type="range"
              min="1"
              max="10"
              value={visualizationState.config.minClusterSize || 2}
              onChange={(e) => handleConfigUpdate('minClusterSize', parseInt(e.target.value))}
              className="control-slider"
            />
            <span className="control-value">{visualizationState.config.minClusterSize || 2}</span>
          </div>

          <div className="control-group">
            <label className="control-label">最大聚类数</label>
            <input
              type="range"
              min="2"
              max="20"
              value={visualizationState.config.maxClusters || 10}
              onChange={(e) => handleConfigUpdate('maxClusters', parseInt(e.target.value))}
              className="control-slider"
            />
            <span className="control-value">{visualizationState.config.maxClusters || 10}</span>
          </div>

          {visualizationState.config.algorithm === 'louvain' && (
            <div className="control-group">
              <label className="control-label">分辨率参数</label>
              <input
                type="range"
                min="0.1"
                max="2.0"
                step="0.1"
                value={visualizationState.config.resolution || 1.0}
                onChange={(e) => handleConfigUpdate('resolution', parseFloat(e.target.value))}
                className="control-slider"
              />
              <span className="control-value">{visualizationState.config.resolution || 1.0}</span>
            </div>
          )}
        </div>

        <div className="display-controls">
          <label className="control-label">显示选项</label>
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={visualizationState.displaySettings.showBounds}
                onChange={(e) => handleDisplaySettingUpdate('showBounds', e.target.checked)}
              />
              显示聚类边界
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={visualizationState.displaySettings.showLabels}
                onChange={(e) => handleDisplaySettingUpdate('showLabels', e.target.checked)}
              />
              显示聚类标签
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={visualizationState.displaySettings.showStats}
                onChange={(e) => handleDisplaySettingUpdate('showStats', e.target.checked)}
              />
              显示统计信息
            </label>
          </div>
        </div>

        {visualizationState.error && (
          <div className="error-message">
            ❌ {visualizationState.error}
          </div>
        )}
      </div>
    )
  }

  /**
   * 渲染统计信息
   */
  const renderStatistics = () => {
    if (!visualizationState.displaySettings.showStats || !visualizationState.clusteringResult) {
      return null
    }

    const { clusteringResult } = visualizationState

    return (
      <div className="cluster-statistics">
        <h4>聚类统计</h4>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-label">聚类数量</div>
            <div className="stat-value">{clusteringResult.clusters.length}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">模块度</div>
            <div className="stat-value">{clusteringResult.modularity.toFixed(3)}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">内部密度</div>
            <div className="stat-value">{(clusteringResult.quality.internalDensity * 100).toFixed(1)}%</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">轮廓系数</div>
            <div className="stat-value">{clusteringResult.quality.silhouetteScore.toFixed(3)}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">计算时间</div>
            <div className="stat-value">{clusteringResult.executionTime.toFixed(1)}ms</div>
          </div>
        </div>

        {visualizationState.selectedCluster && (
          <div className="selected-cluster-info">
            <h5>选中聚类信息</h5>
            <div className="cluster-details">
              <div className="detail-item">
                <span className="detail-label">聚类ID:</span>
                <span className="detail-value">{visualizationState.selectedCluster.id}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">节点数量:</span>
                <span className="detail-value">{visualizationState.selectedCluster.nodes.length}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">中心位置:</span>
                <span className="detail-value">
                  ({Math.round(visualizationState.selectedCluster.center.x)}, {Math.round(visualizationState.selectedCluster.center.y)})
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">半径:</span>
                <span className="detail-value">{Math.round(visualizationState.selectedCluster.radius)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // 自动执行初始聚类分析
  useEffect(() => {
    if (graphData.nodes.length > 0 && !visualizationState.clusteringResult) {
      performClustering()
    }
  }, [graphData.nodes.length, performClustering, visualizationState.clusteringResult])

  return (
    <div className={`cluster-visualization ${className}`}>
      <div className="visualization-container">
        <svg
          width={width}
          height={height}
          className="cluster-svg"
          onClick={() => handleClusterSelect(null)}
        >
          {renderLinks()}
          {renderClusterBounds()}
          {renderNodes()}
          {renderClusterLabels()}
        </svg>

        {renderControlPanel()}
      </div>

      {renderStatistics()}
    </div>
  )
}

export default ClusterVisualization
