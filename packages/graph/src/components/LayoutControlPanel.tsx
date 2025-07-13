/**
 * 布局控制面板组件
 * 提供图谱布局算法的选择、配置和切换功能
 */

import React, { useState, useCallback, useMemo } from 'react'
import { GraphData, GraphNode, GraphLink, LayoutType } from '../types'
import { AdvancedLayoutManager, AdvancedLayoutConfig, LayoutMetrics, LayoutTransition } from '../layouts/AdvancedLayoutManager'

interface LayoutControlPanelProps {
  /** 图谱数据 */
  graphData: GraphData
  /** 当前布局类型 */
  currentLayout: LayoutType
  /** 布局配置 */
  layoutConfig: AdvancedLayoutConfig
  /** 布局管理器 */
  layoutManager: AdvancedLayoutManager
  /** 布局变更回调 */
  onLayoutChange: (layout: LayoutType, config: AdvancedLayoutConfig) => void
  /** 布局过渡回调 */
  onLayoutTransition?: (transition: LayoutTransition) => void
  /** 是否显示高级选项 */
  showAdvancedOptions?: boolean
  /** 类名 */
  className?: string
}

interface PanelState {
  /** 选中的布局类型 */
  selectedLayout: LayoutType
  /** 布局配置 */
  config: AdvancedLayoutConfig
  /** 是否正在过渡 */
  isTransitioning: boolean
  /** 布局指标 */
  metrics: LayoutMetrics | null
  /** 展开的配置面板 */
  expandedPanel: string | null
  /** 预览模式 */
  previewMode: boolean
}

/**
 * 布局控制面板组件
 */
export const LayoutControlPanel: React.FC<LayoutControlPanelProps> = ({
  graphData,
  currentLayout,
  layoutConfig,
  layoutManager,
  onLayoutChange,
  onLayoutTransition,
  showAdvancedOptions = false,
  className = ''
}) => {
  // 状态管理
  const [panelState, setPanelState] = useState<PanelState>({
    selectedLayout: currentLayout,
    config: layoutConfig,
    isTransitioning: false,
    metrics: null,
    expandedPanel: null,
    previewMode: false
  })

  // 布局选项配置
  const layoutOptions = useMemo(() => [
    {
      type: 'force' as LayoutType,
      name: '力导向布局',
      icon: '🌐',
      description: '自然的节点分布，适合探索复杂关系',
      bestFor: '复杂网络、关系探索',
      params: ['linkDistance', 'chargeStrength', 'centerForce']
    },
    {
      type: 'hierarchical' as LayoutType,
      name: '层次布局',
      icon: '🏗️',
      description: '清晰的层级结构，适合组织架构',
      bestFor: '层级关系、组织结构',
      params: ['direction', 'layerSeparation', 'nodeSeparation']
    },
    {
      type: 'circular' as LayoutType,
      name: '圆形布局',
      icon: '⭕',
      description: '环形排列节点，适合小型网络',
      bestFor: '小型网络、概览展示',
      params: ['radius', 'startAngle', 'clockwise']
    },
    {
      type: 'radial' as LayoutType,
      name: '径向布局',
      icon: '🎯',
      description: '以中心节点为核心的放射状布局',
      bestFor: '中心化网络、影响力分析',
      params: ['centerNodeId', 'radiusStep', 'angleSpread']
    },
    {
      type: 'grid' as LayoutType,
      name: '网格布局',
      icon: '⚏',
      description: '规整的网格排列，适合大量节点',
      bestFor: '大量节点、整齐展示',
      params: ['columns', 'cellPadding', 'alignToConnections']
    }
  ], [])

  // 智能布局建议
  const suggestedLayout = useMemo(() => {
    return layoutManager.suggestOptimalLayout(graphData.nodes, graphData.links)
  }, [graphData, layoutManager])

  /**
   * 处理布局选择
   */
  const handleLayoutSelect = useCallback((layoutType: LayoutType) => {
    setPanelState(prev => ({
      ...prev,
      selectedLayout: layoutType
    }))
  }, [])

  /**
   * 处理配置更新
   */
  const handleConfigUpdate = useCallback((key: string, value: any) => {
    setPanelState(prev => ({
      ...prev,
      config: {
        ...prev.config,
        [key]: value
      }
    }))
  }, [])

  /**
   * 应用布局
   */
  const handleApplyLayout = useCallback(async () => {
    if (panelState.isTransitioning) return

    setPanelState(prev => ({ ...prev, isTransitioning: true }))

    try {
      if (panelState.config.animationDuration && panelState.config.animationDuration > 0) {
        // 使用动画过渡
        await layoutManager.transitionToLayout(
          graphData.nodes,
          panelState.selectedLayout,
          panelState.config,
          onLayoutTransition
        )
      }

      // 计算布局指标
      const metrics = layoutManager.calculateLayoutMetrics(graphData.nodes, graphData.links)
      
      setPanelState(prev => ({
        ...prev,
        metrics,
        isTransitioning: false
      }))

      onLayoutChange(panelState.selectedLayout, panelState.config)
    } catch (error) {
      console.error('布局应用失败:', error)
      setPanelState(prev => ({ ...prev, isTransitioning: false }))
    }
  }, [panelState, graphData, layoutManager, onLayoutChange, onLayoutTransition])

  /**
   * 重置配置
   */
  const handleResetConfig = useCallback(() => {
    setPanelState(prev => ({
      ...prev,
      config: {
        ...layoutConfig,
        width: prev.config.width,
        height: prev.config.height
      }
    }))
  }, [layoutConfig])

  /**
   * 切换配置面板
   */
  const toggleConfigPanel = useCallback((panelId: string) => {
    setPanelState(prev => ({
      ...prev,
      expandedPanel: prev.expandedPanel === panelId ? null : panelId
    }))
  }, [])

  /**
   * 渲染布局选项
   */
  const renderLayoutOptions = () => {
    return (
      <div className="layout-options">
        <div className="options-header">
          <h3>布局算法</h3>
          {suggestedLayout && (
            <div className="suggestion">
              <span className="suggestion-icon">💡</span>
              <span className="suggestion-text">
                建议使用: {layoutOptions.find(opt => opt.type === suggestedLayout)?.name}
              </span>
            </div>
          )}
        </div>

        <div className="options-grid">
          {layoutOptions.map(option => (
            <div
              key={option.type}
              onClick={() => handleLayoutSelect(option.type)}
              className={`layout-option ${panelState.selectedLayout === option.type ? 'selected' : ''} ${option.type === suggestedLayout ? 'suggested' : ''}`}
            >
              <div className="option-icon">{option.icon}</div>
              <div className="option-content">
                <div className="option-name">{option.name}</div>
                <div className="option-description">{option.description}</div>
                <div className="option-best-for">适用于: {option.bestFor}</div>
              </div>
              {option.type === currentLayout && (
                <div className="current-indicator">当前</div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  /**
   * 渲染基础配置
   */
  const renderBasicConfig = () => {
    return (
      <div className="basic-config">
        <div className="config-header">
          <h4>基础配置</h4>
          <button
            onClick={() => toggleConfigPanel('basic')}
            className="toggle-button"
          >
            {panelState.expandedPanel === 'basic' ? '▼' : '▶'}
          </button>
        </div>

        {panelState.expandedPanel === 'basic' && (
          <div className="config-content">
            <div className="config-group">
              <label className="config-label">动画时长 (ms)</label>
              <input
                type="range"
                min="0"
                max="3000"
                step="100"
                value={panelState.config.animationDuration || 1000}
                onChange={(e) => handleConfigUpdate('animationDuration', parseInt(e.target.value))}
                className="config-slider"
              />
              <span className="config-value">{panelState.config.animationDuration || 1000}ms</span>
            </div>

            <div className="config-group">
              <label className="config-label">缓动函数</label>
              <select
                value={panelState.config.easing || 'ease-out'}
                onChange={(e) => handleConfigUpdate('easing', e.target.value)}
                className="config-select"
              >
                <option value="linear">线性</option>
                <option value="ease-in">缓入</option>
                <option value="ease-out">缓出</option>
                <option value="ease-in-out">缓入缓出</option>
                <option value="bounce">弹跳</option>
              </select>
            </div>

            <div className="config-group">
              <label className="config-checkbox">
                <input
                  type="checkbox"
                  checked={panelState.config.enableCollision || false}
                  onChange={(e) => handleConfigUpdate('enableCollision', e.target.checked)}
                />
                启用碰撞检测
              </label>
            </div>

            <div className="config-group">
              <label className="config-checkbox">
                <input
                  type="checkbox"
                  checked={panelState.config.adaptive || false}
                  onChange={(e) => handleConfigUpdate('adaptive', e.target.checked)}
                />
                自适应参数
              </label>
            </div>
          </div>
        )}
      </div>
    )
  }

  /**
   * 渲染高级配置
   */
  const renderAdvancedConfig = () => {
    if (!showAdvancedOptions) return null

    const selectedOption = layoutOptions.find(opt => opt.type === panelState.selectedLayout)
    if (!selectedOption) return null

    return (
      <div className="advanced-config">
        <div className="config-header">
          <h4>高级配置</h4>
          <button
            onClick={() => toggleConfigPanel('advanced')}
            className="toggle-button"
          >
            {panelState.expandedPanel === 'advanced' ? '▼' : '▶'}
          </button>
        </div>

        {panelState.expandedPanel === 'advanced' && (
          <div className="config-content">
            {panelState.selectedLayout === 'force' && (
              <>
                <div className="config-group">
                  <label className="config-label">链接距离</label>
                  <input
                    type="range"
                    min="20"
                    max="200"
                    value={panelState.config.linkDistance || 50}
                    onChange={(e) => handleConfigUpdate('linkDistance', parseInt(e.target.value))}
                    className="config-slider"
                  />
                  <span className="config-value">{panelState.config.linkDistance || 50}</span>
                </div>

                <div className="config-group">
                  <label className="config-label">排斥力强度</label>
                  <input
                    type="range"
                    min="-1000"
                    max="-50"
                    value={panelState.config.chargeStrength || -300}
                    onChange={(e) => handleConfigUpdate('chargeStrength', parseInt(e.target.value))}
                    className="config-slider"
                  />
                  <span className="config-value">{panelState.config.chargeStrength || -300}</span>
                </div>
              </>
            )}

            {panelState.selectedLayout === 'hierarchical' && (
              <>
                <div className="config-group">
                  <label className="config-label">方向</label>
                  <select
                    value={panelState.config.direction || 'top-down'}
                    onChange={(e) => handleConfigUpdate('direction', e.target.value)}
                    className="config-select"
                  >
                    <option value="top-down">从上到下</option>
                    <option value="bottom-up">从下到上</option>
                    <option value="left-right">从左到右</option>
                    <option value="right-left">从右到左</option>
                  </select>
                </div>

                <div className="config-group">
                  <label className="config-label">层级间距</label>
                  <input
                    type="range"
                    min="50"
                    max="200"
                    value={panelState.config.layerSeparation || 100}
                    onChange={(e) => handleConfigUpdate('layerSeparation', parseInt(e.target.value))}
                    className="config-slider"
                  />
                  <span className="config-value">{panelState.config.layerSeparation || 100}</span>
                </div>
              </>
            )}

            {panelState.selectedLayout === 'circular' && (
              <>
                <div className="config-group">
                  <label className="config-label">半径</label>
                  <input
                    type="range"
                    min="50"
                    max="300"
                    value={panelState.config.radius || 150}
                    onChange={(e) => handleConfigUpdate('radius', parseInt(e.target.value))}
                    className="config-slider"
                  />
                  <span className="config-value">{panelState.config.radius || 150}</span>
                </div>

                <div className="config-group">
                  <label className="config-checkbox">
                    <input
                      type="checkbox"
                      checked={panelState.config.clockwise !== false}
                      onChange={(e) => handleConfigUpdate('clockwise', e.target.checked)}
                    />
                    顺时针排列
                  </label>
                </div>
              </>
            )}

            {panelState.selectedLayout === 'grid' && (
              <>
                <div className="config-group">
                  <label className="config-label">列数</label>
                  <input
                    type="range"
                    min="2"
                    max="10"
                    value={panelState.config.columns || Math.ceil(Math.sqrt(graphData.nodes.length))}
                    onChange={(e) => handleConfigUpdate('columns', parseInt(e.target.value))}
                    className="config-slider"
                  />
                  <span className="config-value">{panelState.config.columns || Math.ceil(Math.sqrt(graphData.nodes.length))}</span>
                </div>

                <div className="config-group">
                  <label className="config-label">单元格间距</label>
                  <input
                    type="range"
                    min="10"
                    max="50"
                    value={panelState.config.cellPadding || 20}
                    onChange={(e) => handleConfigUpdate('cellPadding', parseInt(e.target.value))}
                    className="config-slider"
                  />
                  <span className="config-value">{panelState.config.cellPadding || 20}</span>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    )
  }

  /**
   * 渲染布局指标
   */
  const renderLayoutMetrics = () => {
    if (!panelState.metrics) return null

    return (
      <div className="layout-metrics">
        <div className="metrics-header">
          <h4>布局指标</h4>
        </div>

        <div className="metrics-grid">
          <div className="metric-item">
            <div className="metric-label">重叠节点</div>
            <div className="metric-value">{panelState.metrics.overlappingNodes}</div>
          </div>

          <div className="metric-item">
            <div className="metric-label">平均边长</div>
            <div className="metric-value">{Math.round(panelState.metrics.averageEdgeLength)}</div>
          </div>

          <div className="metric-item">
            <div className="metric-label">紧凑度</div>
            <div className="metric-value">{(panelState.metrics.compactness * 1000).toFixed(2)}</div>
          </div>

          <div className="metric-item">
            <div className="metric-label">视觉平衡</div>
            <div className="metric-value">{(panelState.metrics.visualBalance * 100).toFixed(1)}%</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`layout-control-panel ${className}`}>
      {/* 面板标题 */}
      <div className="panel-header">
        <h2>布局控制</h2>
        <div className="panel-stats">
          {graphData.nodes.length} 节点 · {graphData.links.length} 连接
        </div>
      </div>

      {/* 布局选项 */}
      {renderLayoutOptions()}

      {/* 基础配置 */}
      {renderBasicConfig()}

      {/* 高级配置 */}
      {renderAdvancedConfig()}

      {/* 布局指标 */}
      {renderLayoutMetrics()}

      {/* 操作按钮 */}
      <div className="panel-actions">
        <button
          onClick={handleResetConfig}
          className="action-button secondary"
        >
          🔄 重置配置
        </button>

        <button
          onClick={handleApplyLayout}
          disabled={panelState.isTransitioning || panelState.selectedLayout === currentLayout}
          className="action-button primary"
        >
          {panelState.isTransitioning ? '⏳ 应用中...' : '✨ 应用布局'}
        </button>
      </div>
    </div>
  )
}

export default LayoutControlPanel
