/**
 * 高级布局配置器
 * 提供详细的布局算法参数配置界面
 */

import React, { useState, useCallback } from 'react'
import { LayoutConfig } from '@minglog/graph'

interface AdvancedLayoutConfiguratorProps {
  /** 当前布局配置 */
  config: LayoutConfig
  /** 配置变更回调 */
  onChange: (config: LayoutConfig) => void
  /** 是否显示 */
  visible: boolean
  /** 关闭回调 */
  onClose: () => void
  /** 应用配置回调 */
  onApply: (config: LayoutConfig) => void
  /** 自定义类名 */
  className?: string
}

interface ConfigState {
  tempConfig: LayoutConfig
  presets: Record<string, LayoutConfig>
  activePreset: string | null
}

// 布局预设配置
const layoutPresets = {
  force: {
    'default': {
      type: 'force' as const,
      linkDistance: 50,
      linkStrength: 0.1,
      forceStrength: -300,
      centerStrength: 0.1
    },
    'tight': {
      type: 'force' as const,
      linkDistance: 30,
      linkStrength: 0.3,
      forceStrength: -500,
      centerStrength: 0.2
    },
    'loose': {
      type: 'force' as const,
      linkDistance: 80,
      linkStrength: 0.05,
      forceStrength: -200,
      centerStrength: 0.05
    },
    'clustered': {
      type: 'force' as const,
      linkDistance: 40,
      linkStrength: 0.2,
      forceStrength: -400,
      centerStrength: 0.1
    }
  },
  hierarchical: {
    'top-down': {
      type: 'hierarchical' as const,
      direction: 'top-down' as const,
      layerSeparation: 100,
      nodeSeparation: 80
    },
    'left-right': {
      type: 'hierarchical' as const,
      direction: 'left-right' as const,
      layerSeparation: 120,
      nodeSeparation: 60
    },
    'compact': {
      type: 'hierarchical' as const,
      direction: 'top-down' as const,
      layerSeparation: 60,
      nodeSeparation: 40
    },
    'spacious': {
      type: 'hierarchical' as const,
      direction: 'top-down' as const,
      layerSeparation: 150,
      nodeSeparation: 120
    }
  },
  circular: {
    'default': {
      type: 'circular' as const,
      radius: 200
    },
    'small': {
      type: 'circular' as const,
      radius: 150
    },
    'large': {
      type: 'circular' as const,
      radius: 300
    }
  },
  grid: {
    'square': {
      type: 'grid' as const,
      columns: 5,
      cellSize: 80
    },
    'wide': {
      type: 'grid' as const,
      columns: 8,
      cellSize: 60
    },
    'compact': {
      type: 'grid' as const,
      columns: 4,
      cellSize: 50
    }
  },
  radial: {
    'default': {
      type: 'radial' as const,
      radiusStep: 60
    },
    'tight': {
      type: 'radial' as const,
      radiusStep: 40
    },
    'loose': {
      type: 'radial' as const,
      radiusStep: 80
    }
  }
}

/**
 * 高级布局配置器组件
 */
export const AdvancedLayoutConfigurator: React.FC<AdvancedLayoutConfiguratorProps> = ({
  config,
  onChange,
  visible,
  onClose,
  onApply,
  className = ''
}) => {
  // 状态管理
  const [state, setState] = useState<ConfigState>({
    tempConfig: { ...config },
    presets: layoutPresets[config.type] || {},
    activePreset: null
  })

  // 更新临时配置
  const updateTempConfig = useCallback((updates: Partial<LayoutConfig>) => {
    setState(prev => ({
      ...prev,
      tempConfig: { ...prev.tempConfig, ...updates },
      activePreset: null // 清除预设选择
    }))
  }, [])

  // 应用预设
  const applyPreset = useCallback((presetKey: string) => {
    const preset = state.presets[presetKey]
    if (preset) {
      setState(prev => ({
        ...prev,
        tempConfig: { ...preset },
        activePreset: presetKey
      }))
    }
  }, [state.presets])

  // 重置配置
  const resetConfig = useCallback(() => {
    setState(prev => ({
      ...prev,
      tempConfig: { ...config },
      activePreset: null
    }))
  }, [config])

  // 应用配置
  const handleApply = useCallback(() => {
    onChange(state.tempConfig)
    onApply(state.tempConfig)
  }, [state.tempConfig, onChange, onApply])

  // 渲染力导向布局配置
  const renderForceConfig = () => (
    <div className="config-section">
      <h4 className="config-title">力导向参数</h4>
      
      <div className="config-item">
        <label className="config-label">连接距离</label>
        <div className="range-control">
          <input
            type="range"
            min="20"
            max="150"
            value={state.tempConfig.linkDistance || 50}
            onChange={(e) => updateTempConfig({ linkDistance: parseInt(e.target.value) })}
            className="range-input"
          />
          <span className="range-value">{state.tempConfig.linkDistance || 50}px</span>
        </div>
      </div>

      <div className="config-item">
        <label className="config-label">连接强度</label>
        <div className="range-control">
          <input
            type="range"
            min="0.01"
            max="1"
            step="0.01"
            value={state.tempConfig.linkStrength || 0.1}
            onChange={(e) => updateTempConfig({ linkStrength: parseFloat(e.target.value) })}
            className="range-input"
          />
          <span className="range-value">{(state.tempConfig.linkStrength || 0.1).toFixed(2)}</span>
        </div>
      </div>

      <div className="config-item">
        <label className="config-label">排斥力强度</label>
        <div className="range-control">
          <input
            type="range"
            min="-1000"
            max="-50"
            value={state.tempConfig.forceStrength || -300}
            onChange={(e) => updateTempConfig({ forceStrength: parseInt(e.target.value) })}
            className="range-input"
          />
          <span className="range-value">{state.tempConfig.forceStrength || -300}</span>
        </div>
      </div>

      <div className="config-item">
        <label className="config-label">中心引力</label>
        <div className="range-control">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={state.tempConfig.centerStrength || 0.1}
            onChange={(e) => updateTempConfig({ centerStrength: parseFloat(e.target.value) })}
            className="range-input"
          />
          <span className="range-value">{(state.tempConfig.centerStrength || 0.1).toFixed(2)}</span>
        </div>
      </div>
    </div>
  )

  // 渲染层次布局配置
  const renderHierarchicalConfig = () => (
    <div className="config-section">
      <h4 className="config-title">层次布局参数</h4>
      
      <div className="config-item">
        <label className="config-label">布局方向</label>
        <select
          value={state.tempConfig.direction || 'top-down'}
          onChange={(e) => updateTempConfig({ direction: e.target.value as any })}
          className="select-input"
        >
          <option value="top-down">从上到下</option>
          <option value="bottom-up">从下到上</option>
          <option value="left-right">从左到右</option>
          <option value="right-left">从右到左</option>
        </select>
      </div>

      <div className="config-item">
        <label className="config-label">层间距离</label>
        <div className="range-control">
          <input
            type="range"
            min="50"
            max="200"
            value={state.tempConfig.layerSeparation || 100}
            onChange={(e) => updateTempConfig({ layerSeparation: parseInt(e.target.value) })}
            className="range-input"
          />
          <span className="range-value">{state.tempConfig.layerSeparation || 100}px</span>
        </div>
      </div>

      <div className="config-item">
        <label className="config-label">节点间距</label>
        <div className="range-control">
          <input
            type="range"
            min="30"
            max="150"
            value={state.tempConfig.nodeSeparation || 80}
            onChange={(e) => updateTempConfig({ nodeSeparation: parseInt(e.target.value) })}
            className="range-input"
          />
          <span className="range-value">{state.tempConfig.nodeSeparation || 80}px</span>
        </div>
      </div>
    </div>
  )

  // 渲染环形布局配置
  const renderCircularConfig = () => (
    <div className="config-section">
      <h4 className="config-title">环形布局参数</h4>
      
      <div className="config-item">
        <label className="config-label">圆形半径</label>
        <div className="range-control">
          <input
            type="range"
            min="100"
            max="400"
            value={state.tempConfig.radius || 200}
            onChange={(e) => updateTempConfig({ radius: parseInt(e.target.value) })}
            className="range-input"
          />
          <span className="range-value">{state.tempConfig.radius || 200}px</span>
        </div>
      </div>
    </div>
  )

  // 渲染网格布局配置
  const renderGridConfig = () => (
    <div className="config-section">
      <h4 className="config-title">网格布局参数</h4>
      
      <div className="config-item">
        <label className="config-label">列数</label>
        <div className="range-control">
          <input
            type="range"
            min="2"
            max="10"
            value={state.tempConfig.columns || 5}
            onChange={(e) => updateTempConfig({ columns: parseInt(e.target.value) })}
            className="range-input"
          />
          <span className="range-value">{state.tempConfig.columns || 5}</span>
        </div>
      </div>

      <div className="config-item">
        <label className="config-label">单元格大小</label>
        <div className="range-control">
          <input
            type="range"
            min="40"
            max="120"
            value={state.tempConfig.cellSize || 80}
            onChange={(e) => updateTempConfig({ cellSize: parseInt(e.target.value) })}
            className="range-input"
          />
          <span className="range-value">{state.tempConfig.cellSize || 80}px</span>
        </div>
      </div>
    </div>
  )

  // 渲染径向布局配置
  const renderRadialConfig = () => (
    <div className="config-section">
      <h4 className="config-title">径向布局参数</h4>
      
      <div className="config-item">
        <label className="config-label">半径步长</label>
        <div className="range-control">
          <input
            type="range"
            min="30"
            max="100"
            value={state.tempConfig.radiusStep || 60}
            onChange={(e) => updateTempConfig({ radiusStep: parseInt(e.target.value) })}
            className="range-input"
          />
          <span className="range-value">{state.tempConfig.radiusStep || 60}px</span>
        </div>
      </div>
    </div>
  )

  if (!visible) return null

  return (
    <div className={`advanced-layout-configurator ${className}`}>
      {/* 遮罩层 */}
      <div className="configurator-overlay" onClick={onClose} />
      
      {/* 主面板 */}
      <div className="configurator-panel">
        {/* 标题栏 */}
        <div className="configurator-header">
          <h3 className="configurator-title">⚙️ 高级布局配置</h3>
          <button onClick={onClose} className="close-button" title="关闭">
            ✕
          </button>
        </div>

        {/* 内容区域 */}
        <div className="configurator-content">
          {/* 预设选择 */}
          <div className="presets-section">
            <h4 className="section-title">布局预设</h4>
            <div className="presets-grid">
              {Object.entries(state.presets).map(([key, preset]) => (
                <button
                  key={key}
                  className={`preset-button ${state.activePreset === key ? 'active' : ''}`}
                  onClick={() => applyPreset(key)}
                >
                  <div className="preset-name">{key}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 参数配置 */}
          <div className="parameters-section">
            <h4 className="section-title">参数调节</h4>
            
            {state.tempConfig.type === 'force' && renderForceConfig()}
            {state.tempConfig.type === 'hierarchical' && renderHierarchicalConfig()}
            {state.tempConfig.type === 'circular' && renderCircularConfig()}
            {state.tempConfig.type === 'grid' && renderGridConfig()}
            {state.tempConfig.type === 'radial' && renderRadialConfig()}
          </div>

          {/* 配置预览 */}
          <div className="preview-section">
            <h4 className="section-title">配置预览</h4>
            <div className="config-preview">
              <pre className="config-json">
                {JSON.stringify(state.tempConfig, null, 2)}
              </pre>
            </div>
          </div>
        </div>

        {/* 底部操作栏 */}
        <div className="configurator-footer">
          <div className="footer-info">
            <span>调整参数以获得最佳布局效果</span>
          </div>
          
          <div className="footer-actions">
            <button onClick={resetConfig} className="reset-button">
              重置
            </button>
            <button onClick={onClose} className="cancel-button">
              取消
            </button>
            <button onClick={handleApply} className="apply-button">
              应用配置
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdvancedLayoutConfigurator
