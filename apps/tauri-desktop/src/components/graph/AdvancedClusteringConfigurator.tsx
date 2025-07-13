/**
 * 高级聚类配置器
 * 提供完整的聚类算法配置和执行界面
 */

import React, { useState, useCallback, useEffect } from 'react'
import { GraphData } from '@minglog/graph'
import { GraphClusteringAnalyzer, ClusteringConfig, ClusteringResult } from '@minglog/graph'
import { appCore } from '../../core/AppCore'

interface AdvancedClusteringConfiguratorProps {
  /** 图形数据 */
  data: GraphData
  /** 是否显示 */
  visible: boolean
  /** 关闭回调 */
  onClose: () => void
  /** 聚类完成回调 */
  onClusteringComplete: (result: ClusteringResult) => void
  /** 自定义类名 */
  className?: string
}

interface ConfiguratorState {
  /** 当前配置 */
  config: ClusteringConfig
  /** 是否正在执行聚类 */
  isAnalyzing: boolean
  /** 分析进度 */
  progress: number
  /** 当前步骤 */
  currentStep: string
  /** 聚类结果 */
  result: ClusteringResult | null
  /** 错误信息 */
  error: string | null
  /** 预设配置 */
  presets: Record<string, ClusteringConfig>
  /** 当前选中的预设 */
  activePreset: string | null
}

// 聚类算法配置
const algorithmConfigs = {
  louvain: {
    name: 'Louvain算法',
    icon: '🌐',
    description: '基于模块度优化的社区检测算法，适合大规模网络',
    defaultConfig: {
      algorithm: 'louvain' as const,
      resolution: 1.0,
      maxIterations: 100,
      convergenceThreshold: 1e-6
    }
  },
  modularity: {
    name: '模块度优化',
    icon: '📊',
    description: '直接优化模块度的贪心算法，快速且稳定',
    defaultConfig: {
      algorithm: 'modularity' as const,
      maxIterations: 50,
      maxClusters: 10
    }
  },
  connectivity: {
    name: '连通性聚类',
    icon: '🔗',
    description: '基于图连通性的聚类，识别连通分量',
    defaultConfig: {
      algorithm: 'connectivity' as const,
      minClusterSize: 3
    }
  },
  kmeans: {
    name: 'K-means聚类',
    icon: '🎯',
    description: '基于节点位置的K-means聚类算法',
    defaultConfig: {
      algorithm: 'kmeans' as const,
      maxClusters: 5,
      maxIterations: 100
    }
  },
  tags: {
    name: '标签聚类',
    icon: '🏷️',
    description: '基于节点标签的聚类分组',
    defaultConfig: {
      algorithm: 'tags' as const,
      minClusterSize: 2
    }
  },
  type: {
    name: '类型聚类',
    icon: '📂',
    description: '基于节点类型的聚类分组',
    defaultConfig: {
      algorithm: 'type' as const,
      minClusterSize: 2
    }
  }
}

// 预设配置
const clusteringPresets = {
  'quick-analysis': {
    algorithm: 'connectivity' as const,
    minClusterSize: 2,
    maxClusters: 8
  },
  'detailed-community': {
    algorithm: 'louvain' as const,
    resolution: 1.0,
    maxIterations: 100,
    convergenceThreshold: 1e-6,
    hierarchical: true
  },
  'position-based': {
    algorithm: 'kmeans' as const,
    maxClusters: 6,
    maxIterations: 50
  },
  'high-quality': {
    algorithm: 'modularity' as const,
    maxIterations: 100,
    maxClusters: 12,
    minClusterSize: 3
  }
}

/**
 * 高级聚类配置器组件
 */
export const AdvancedClusteringConfigurator: React.FC<AdvancedClusteringConfiguratorProps> = ({
  data,
  visible,
  onClose,
  onClusteringComplete,
  className = ''
}) => {
  // 状态管理
  const [state, setState] = useState<ConfiguratorState>({
    config: {
      algorithm: 'louvain',
      resolution: 1.0,
      maxIterations: 100,
      convergenceThreshold: 1e-6,
      minClusterSize: 2,
      maxClusters: 10,
      hierarchical: false
    },
    isAnalyzing: false,
    progress: 0,
    currentStep: '',
    result: null,
    error: null,
    presets: clusteringPresets,
    activePreset: null
  })

  // 聚类分析器实例
  const [analyzer] = useState(() => new GraphClusteringAnalyzer())

  // 更新配置
  const updateConfig = useCallback((updates: Partial<ClusteringConfig>) => {
    setState(prev => ({
      ...prev,
      config: { ...prev.config, ...updates },
      activePreset: null // 清除预设选择
    }))
  }, [])

  // 应用预设
  const applyPreset = useCallback((presetKey: string) => {
    const preset = state.presets[presetKey]
    if (preset) {
      setState(prev => ({
        ...prev,
        config: { ...preset },
        activePreset: presetKey
      }))
    }
  }, [state.presets])

  // 应用算法默认配置
  const applyAlgorithmDefaults = useCallback((algorithm: ClusteringConfig['algorithm']) => {
    const algorithmConfig = algorithmConfigs[algorithm]
    if (algorithmConfig) {
      updateConfig(algorithmConfig.defaultConfig)
    }
  }, [updateConfig])

  // 执行聚类分析
  const performClustering = useCallback(async () => {
    if (data.nodes.length === 0) {
      setState(prev => ({ ...prev, error: '没有可分析的节点数据' }))
      return
    }

    try {
      setState(prev => ({
        ...prev,
        isAnalyzing: true,
        progress: 0,
        currentStep: '初始化聚类分析...',
        error: null,
        result: null
      }))

      // 模拟进度更新
      const progressSteps = [
        { step: '构建图结构...', progress: 20 },
        { step: '执行聚类算法...', progress: 60 },
        { step: '计算质量指标...', progress: 80 },
        { step: '生成聚类结果...', progress: 100 }
      ]

      for (const { step, progress } of progressSteps) {
        setState(prev => ({ ...prev, currentStep: step, progress }))
        await new Promise(resolve => setTimeout(resolve, 300))
      }

      // 执行实际的聚类分析
      const result = await analyzer.performClustering(
        data.nodes,
        data.links,
        state.config
      )

      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        result,
        currentStep: '聚类分析完成',
        progress: 100
      }))

      // 发送事件到事件总线
      if (appCore.isInitialized()) {
        const eventBus = appCore.getEventBus()
        eventBus?.emit('graph:clustering:completed', {
          algorithm: state.config.algorithm,
          clusterCount: result.clusters.length,
          modularity: result.modularity,
          quality: result.quality,
          executionTime: result.executionTime
        }, 'AdvancedClusteringConfigurator')
      }

      // 调用完成回调
      onClusteringComplete(result)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '聚类分析失败'
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: errorMessage,
        currentStep: '分析失败',
        progress: 0
      }))
    }
  }, [data, state.config, analyzer, onClusteringComplete])

  // 重置配置
  const resetConfig = useCallback(() => {
    setState(prev => ({
      ...prev,
      config: {
        algorithm: 'louvain',
        resolution: 1.0,
        maxIterations: 100,
        convergenceThreshold: 1e-6,
        minClusterSize: 2,
        maxClusters: 10,
        hierarchical: false
      },
      activePreset: null,
      result: null,
      error: null
    }))
  }, [])

  // 渲染算法特定配置
  const renderAlgorithmConfig = () => {
    const { algorithm } = state.config

    switch (algorithm) {
      case 'louvain':
        return (
          <div className="algorithm-config">
            <div className="config-item">
              <label className="config-label">分辨率参数</label>
              <div className="range-control">
                <input
                  type="range"
                  min="0.1"
                  max="3.0"
                  step="0.1"
                  value={state.config.resolution || 1.0}
                  onChange={(e) => updateConfig({ resolution: parseFloat(e.target.value) })}
                  className="range-input"
                />
                <span className="range-value">{(state.config.resolution || 1.0).toFixed(1)}</span>
              </div>
              <div className="config-hint">较高值产生更多小聚类，较低值产生更少大聚类</div>
            </div>

            <div className="config-item">
              <label className="config-label">最大迭代次数</label>
              <input
                type="number"
                min="10"
                max="500"
                value={state.config.maxIterations || 100}
                onChange={(e) => updateConfig({ maxIterations: parseInt(e.target.value) })}
                className="number-input"
              />
            </div>

            <div className="config-item">
              <label className="config-label">收敛阈值</label>
              <select
                value={state.config.convergenceThreshold || 1e-6}
                onChange={(e) => updateConfig({ convergenceThreshold: parseFloat(e.target.value) })}
                className="select-input"
              >
                <option value={1e-3}>0.001 (快速)</option>
                <option value={1e-4}>0.0001 (标准)</option>
                <option value={1e-6}>0.000001 (精确)</option>
              </select>
            </div>
          </div>
        )

      case 'kmeans':
        return (
          <div className="algorithm-config">
            <div className="config-item">
              <label className="config-label">聚类数量 (K)</label>
              <div className="range-control">
                <input
                  type="range"
                  min="2"
                  max="20"
                  value={state.config.maxClusters || 5}
                  onChange={(e) => updateConfig({ maxClusters: parseInt(e.target.value) })}
                  className="range-input"
                />
                <span className="range-value">{state.config.maxClusters || 5}</span>
              </div>
            </div>

            <div className="config-item">
              <label className="config-label">最大迭代次数</label>
              <input
                type="number"
                min="10"
                max="200"
                value={state.config.maxIterations || 100}
                onChange={(e) => updateConfig({ maxIterations: parseInt(e.target.value) })}
                className="number-input"
              />
            </div>
          </div>
        )

      case 'modularity':
        return (
          <div className="algorithm-config">
            <div className="config-item">
              <label className="config-label">最大聚类数</label>
              <div className="range-control">
                <input
                  type="range"
                  min="2"
                  max="20"
                  value={state.config.maxClusters || 10}
                  onChange={(e) => updateConfig({ maxClusters: parseInt(e.target.value) })}
                  className="range-input"
                />
                <span className="range-value">{state.config.maxClusters || 10}</span>
              </div>
            </div>

            <div className="config-item">
              <label className="config-label">优化迭代次数</label>
              <input
                type="number"
                min="10"
                max="100"
                value={state.config.maxIterations || 50}
                onChange={(e) => updateConfig({ maxIterations: parseInt(e.target.value) })}
                className="number-input"
              />
            </div>
          </div>
        )

      default:
        return (
          <div className="algorithm-config">
            <div className="config-item">
              <label className="config-label">最小聚类大小</label>
              <input
                type="number"
                min="1"
                max="10"
                value={state.config.minClusterSize || 2}
                onChange={(e) => updateConfig({ minClusterSize: parseInt(e.target.value) })}
                className="number-input"
              />
            </div>
          </div>
        )
    }
  }

  if (!visible) return null

  return (
    <div className={`advanced-clustering-configurator ${className}`}>
      {/* 遮罩层 */}
      <div className="configurator-overlay" onClick={onClose} />
      
      {/* 主面板 */}
      <div className="configurator-panel">
        {/* 标题栏 */}
        <div className="configurator-header">
          <h3 className="configurator-title">🎯 高级聚类分析</h3>
          <button onClick={onClose} className="close-button" title="关闭">
            ✕
          </button>
        </div>

        {/* 内容区域 */}
        <div className="configurator-content">
          {!state.isAnalyzing && !state.result ? (
            <>
              {/* 预设选择 */}
              <div className="presets-section">
                <h4 className="section-title">分析预设</h4>
                <div className="presets-grid">
                  {Object.entries(state.presets).map(([key, preset]) => (
                    <button
                      key={key}
                      className={`preset-button ${state.activePreset === key ? 'active' : ''}`}
                      onClick={() => applyPreset(key)}
                    >
                      <div className="preset-name">
                        {key === 'quick-analysis' && '快速分析'}
                        {key === 'detailed-community' && '详细社区'}
                        {key === 'position-based' && '位置聚类'}
                        {key === 'high-quality' && '高质量分析'}
                      </div>
                      <div className="preset-algorithm">
                        {algorithmConfigs[preset.algorithm]?.name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 算法选择 */}
              <div className="algorithm-section">
                <h4 className="section-title">聚类算法</h4>
                <div className="algorithm-grid">
                  {Object.entries(algorithmConfigs).map(([key, config]) => (
                    <button
                      key={key}
                      className={`algorithm-button ${state.config.algorithm === key ? 'active' : ''}`}
                      onClick={() => applyAlgorithmDefaults(key as ClusteringConfig['algorithm'])}
                    >
                      <span className="algorithm-icon">{config.icon}</span>
                      <div className="algorithm-info">
                        <div className="algorithm-name">{config.name}</div>
                        <div className="algorithm-description">{config.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 参数配置 */}
              <div className="parameters-section">
                <h4 className="section-title">算法参数</h4>
                {renderAlgorithmConfig()}
                
                {/* 通用配置 */}
                <div className="common-config">
                  <div className="config-item">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={state.config.hierarchical || false}
                        onChange={(e) => updateConfig({ hierarchical: e.target.checked })}
                      />
                      启用层次聚类
                    </label>
                    <div className="config-hint">生成多层级的聚类结构</div>
                  </div>
                </div>
              </div>
            </>
          ) : state.isAnalyzing ? (
            /* 分析进度 */
            <div className="analysis-progress">
              <div className="progress-container">
                <h4 className="progress-title">正在执行聚类分析</h4>
                <div className="progress-info">
                  <div className="progress-step">{state.currentStep}</div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${state.progress}%` }}
                    />
                  </div>
                  <div className="progress-percentage">{Math.round(state.progress)}%</div>
                </div>
                
                <div className="analysis-details">
                  <div className="detail-item">
                    <span className="detail-label">算法:</span>
                    <span className="detail-value">{algorithmConfigs[state.config.algorithm]?.name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">节点数:</span>
                    <span className="detail-value">{data.nodes.length}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">连接数:</span>
                    <span className="detail-value">{data.links.length}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : state.result ? (
            /* 分析结果 */
            <div className="analysis-results">
              <h4 className="results-title">✅ 聚类分析完成</h4>
              
              <div className="results-summary">
                <div className="summary-grid">
                  <div className="summary-item">
                    <span className="summary-label">聚类数量</span>
                    <span className="summary-value">{state.result.clusters.length}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">模块度</span>
                    <span className="summary-value">{state.result.modularity.toFixed(3)}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">执行时间</span>
                    <span className="summary-value">{Math.round(state.result.executionTime)}ms</span>
                  </div>
                </div>
              </div>

              <div className="quality-metrics">
                <h5 className="metrics-title">质量指标</h5>
                <div className="metrics-grid">
                  <div className="metric-item">
                    <span className="metric-label">内部密度</span>
                    <span className="metric-value">{(state.result.quality.internalDensity * 100).toFixed(1)}%</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">轮廓系数</span>
                    <span className="metric-value">{state.result.quality.silhouetteScore.toFixed(3)}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">分离度</span>
                    <span className="metric-value">{(state.result.quality.separation * 100).toFixed(1)}%</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">紧密度</span>
                    <span className="metric-value">{(state.result.quality.cohesion * 100).toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              <div className="cluster-list">
                <h5 className="list-title">聚类详情</h5>
                {state.result.clusters.map((cluster, index) => (
                  <div key={cluster.id} className="cluster-item">
                    <div 
                      className="cluster-color"
                      style={{ backgroundColor: cluster.color }}
                    />
                    <div className="cluster-info">
                      <div className="cluster-name">{cluster.label || `聚类 ${index + 1}`}</div>
                      <div className="cluster-stats">
                        {cluster.nodes.length} 个节点 • 半径 {Math.round(cluster.radius)}px
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* 错误显示 */}
          {state.error && (
            <div className="error-message">
              <span className="error-icon">❌</span>
              <span className="error-text">{state.error}</span>
            </div>
          )}
        </div>

        {/* 底部操作栏 */}
        <div className="configurator-footer">
          <div className="footer-info">
            {!state.isAnalyzing && !state.result && (
              <span>配置聚类参数并开始分析</span>
            )}
            {state.result && (
              <span>聚类分析已完成，结果已应用到图形中</span>
            )}
          </div>
          
          <div className="footer-actions">
            {!state.isAnalyzing && (
              <>
                {state.result ? (
                  <>
                    <button onClick={resetConfig} className="reset-button">
                      重新分析
                    </button>
                    <button onClick={onClose} className="close-button-footer">
                      关闭
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={resetConfig} className="reset-button">
                      重置
                    </button>
                    <button onClick={onClose} className="cancel-button">
                      取消
                    </button>
                    <button 
                      onClick={performClustering} 
                      className="analyze-button"
                      disabled={data.nodes.length === 0}
                    >
                      开始分析
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdvancedClusteringConfigurator
