/**
 * 节点样式编辑器组件
 * 提供可视化的节点样式编辑功能，支持实时预览
 */

import React, { useState, useCallback, useEffect } from 'react'
import { NodeStyle, MindMapNode } from '../types'

interface ColorPalette {
  name: string
  colors: string[]
}

interface StylePreset {
  name: string
  style: NodeStyle
}

interface NodeStyleEditorProps {
  /** 当前选中的节点 */
  selectedNode: MindMapNode | null
  /** 当前样式 */
  currentStyle: NodeStyle
  /** 样式变更回调 */
  onStyleChange: (style: NodeStyle) => void
  /** 应用到所有节点回调 */
  onApplyToAll?: (style: NodeStyle) => void
  /** 应用到同级节点回调 */
  onApplyToSiblings?: (style: NodeStyle) => void
  /** 是否显示 */
  visible: boolean
  /** 关闭回调 */
  onClose: () => void
  /** 类名 */
  className?: string
}

// 预定义颜色调色板
const colorPalettes: ColorPalette[] = [
  {
    name: '基础色',
    colors: ['#ffffff', '#f8f9fa', '#e9ecef', '#dee2e6', '#ced4da', '#adb5bd', '#6c757d', '#495057', '#343a40', '#212529']
  },
  {
    name: '蓝色系',
    colors: ['#e3f2fd', '#bbdefb', '#90caf9', '#64b5f6', '#42a5f5', '#2196f3', '#1e88e5', '#1976d2', '#1565c0', '#0d47a1']
  },
  {
    name: '绿色系',
    colors: ['#e8f5e8', '#c8e6c9', '#a5d6a7', '#81c784', '#66bb6a', '#4caf50', '#43a047', '#388e3c', '#2e7d32', '#1b5e20']
  },
  {
    name: '红色系',
    colors: ['#ffebee', '#ffcdd2', '#ef9a9a', '#e57373', '#ef5350', '#f44336', '#e53935', '#d32f2f', '#c62828', '#b71c1c']
  },
  {
    name: '紫色系',
    colors: ['#f3e5f5', '#e1bee7', '#ce93d8', '#ba68c8', '#ab47bc', '#9c27b0', '#8e24aa', '#7b1fa2', '#6a1b9a', '#4a148c']
  }
]

// 预定义样式预设
const stylePresets: StylePreset[] = [
  {
    name: '默认',
    style: {
      backgroundColor: '#ffffff',
      borderColor: '#d1d5db',
      borderWidth: 2,
      borderRadius: 6,
      fontSize: 14,
      fontColor: '#374151',
      fontWeight: 'normal',
      padding: 8
    }
  },
  {
    name: '强调',
    style: {
      backgroundColor: '#3b82f6',
      borderColor: '#1d4ed8',
      borderWidth: 2,
      borderRadius: 8,
      fontSize: 16,
      fontColor: '#ffffff',
      fontWeight: 'bold',
      padding: 12
    }
  },
  {
    name: '警告',
    style: {
      backgroundColor: '#fbbf24',
      borderColor: '#d97706',
      borderWidth: 2,
      borderRadius: 6,
      fontSize: 14,
      fontColor: '#92400e',
      fontWeight: 'normal',
      padding: 8
    }
  },
  {
    name: '成功',
    style: {
      backgroundColor: '#10b981',
      borderColor: '#047857',
      borderWidth: 2,
      borderRadius: 6,
      fontSize: 14,
      fontColor: '#ffffff',
      fontWeight: 'normal',
      padding: 8
    }
  },
  {
    name: '错误',
    style: {
      backgroundColor: '#ef4444',
      borderColor: '#dc2626',
      borderWidth: 2,
      borderRadius: 6,
      fontSize: 14,
      fontColor: '#ffffff',
      fontWeight: 'normal',
      padding: 8
    }
  }
]

/**
 * 节点样式编辑器组件
 */
export const NodeStyleEditor: React.FC<NodeStyleEditorProps> = ({
  selectedNode,
  currentStyle,
  onStyleChange,
  onApplyToAll,
  onApplyToSiblings,
  visible,
  onClose,
  className = ''
}) => {
  // 状态管理
  const [activeTab, setActiveTab] = useState<'colors' | 'typography' | 'layout' | 'presets'>('colors')
  const [tempStyle, setTempStyle] = useState<NodeStyle>(currentStyle)

  // 同步外部样式变更
  useEffect(() => {
    setTempStyle(currentStyle)
  }, [currentStyle])

  /**
   * 更新样式属性
   */
  const updateStyle = useCallback((updates: Partial<NodeStyle>) => {
    const newStyle = { ...tempStyle, ...updates }
    setTempStyle(newStyle)
    onStyleChange(newStyle)
  }, [tempStyle, onStyleChange])

  /**
   * 应用预设样式
   */
  const applyPreset = useCallback((preset: StylePreset) => {
    setTempStyle(preset.style)
    onStyleChange(preset.style)
  }, [onStyleChange])

  /**
   * 重置样式
   */
  const resetStyle = useCallback(() => {
    const defaultStyle = stylePresets[0].style
    setTempStyle(defaultStyle)
    onStyleChange(defaultStyle)
  }, [onStyleChange])

  if (!visible) return null

  return (
    <div className={`node-style-editor ${className}`}>
      {/* 标题栏 */}
      <div className="editor-header">
        <h3 className="editor-title">
          🎨 节点样式编辑器
          {selectedNode && (
            <span className="selected-node">- {selectedNode.text}</span>
          )}
        </h3>
        <button onClick={onClose} className="close-button" title="关闭">
          ✕
        </button>
      </div>

      {/* 标签页导航 */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'colors' ? 'active' : ''}`}
          onClick={() => setActiveTab('colors')}
        >
          🎨 颜色
        </button>
        <button
          className={`tab-button ${activeTab === 'typography' ? 'active' : ''}`}
          onClick={() => setActiveTab('typography')}
        >
          📝 字体
        </button>
        <button
          className={`tab-button ${activeTab === 'layout' ? 'active' : ''}`}
          onClick={() => setActiveTab('layout')}
        >
          📐 布局
        </button>
        <button
          className={`tab-button ${activeTab === 'presets' ? 'active' : ''}`}
          onClick={() => setActiveTab('presets')}
        >
          ⭐ 预设
        </button>
      </div>

      {/* 实时预览 */}
      <div className="style-preview">
        <div className="preview-label">实时预览</div>
        <div
          className="preview-node"
          style={{
            backgroundColor: tempStyle.backgroundColor,
            borderColor: tempStyle.borderColor,
            borderWidth: `${tempStyle.borderWidth || 2}px`,
            borderStyle: 'solid',
            borderRadius: `${tempStyle.borderRadius || 6}px`,
            fontSize: `${tempStyle.fontSize || 14}px`,
            color: tempStyle.fontColor,
            fontWeight: tempStyle.fontWeight,
            padding: `${tempStyle.padding || 8}px`,
            display: 'inline-block',
            minWidth: '80px',
            textAlign: 'center'
          }}
        >
          {selectedNode?.text || '示例节点'}
        </div>
      </div>

      {/* 编辑面板 */}
      <div className="editor-content">
        {/* 颜色标签页 */}
        {activeTab === 'colors' && (
          <div className="color-panel">
            <div className="color-section">
              <label className="section-label">背景颜色</label>
              <input
                type="color"
                value={tempStyle.backgroundColor || '#ffffff'}
                onChange={(e) => updateStyle({ backgroundColor: e.target.value })}
                className="color-input"
              />
              <div className="color-palettes">
                {colorPalettes.map(palette => (
                  <div key={palette.name} className="color-palette">
                    <div className="palette-name">{palette.name}</div>
                    <div className="palette-colors">
                      {palette.colors.map(color => (
                        <button
                          key={color}
                          className="color-swatch"
                          style={{ backgroundColor: color }}
                          onClick={() => updateStyle({ backgroundColor: color })}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="color-section">
              <label className="section-label">边框颜色</label>
              <input
                type="color"
                value={tempStyle.borderColor || '#d1d5db'}
                onChange={(e) => updateStyle({ borderColor: e.target.value })}
                className="color-input"
              />
            </div>

            <div className="color-section">
              <label className="section-label">文字颜色</label>
              <input
                type="color"
                value={tempStyle.fontColor || '#374151'}
                onChange={(e) => updateStyle({ fontColor: e.target.value })}
                className="color-input"
              />
            </div>
          </div>
        )}

        {/* 字体标签页 */}
        {activeTab === 'typography' && (
          <div className="typography-panel">
            <div className="control-group">
              <label className="control-label">字体大小</label>
              <input
                type="range"
                min="10"
                max="24"
                value={tempStyle.fontSize || 14}
                onChange={(e) => updateStyle({ fontSize: parseInt(e.target.value) })}
                className="range-input"
              />
              <span className="control-value">{tempStyle.fontSize || 14}px</span>
            </div>

            <div className="control-group">
              <label className="control-label">字体粗细</label>
              <select
                value={tempStyle.fontWeight || 'normal'}
                onChange={(e) => updateStyle({ fontWeight: e.target.value as 'normal' | 'bold' })}
                className="select-input"
              >
                <option value="normal">正常</option>
                <option value="bold">粗体</option>
              </select>
            </div>
          </div>
        )}

        {/* 布局标签页 */}
        {activeTab === 'layout' && (
          <div className="layout-panel">
            <div className="control-group">
              <label className="control-label">边框宽度</label>
              <input
                type="range"
                min="0"
                max="8"
                value={tempStyle.borderWidth || 2}
                onChange={(e) => updateStyle({ borderWidth: parseInt(e.target.value) })}
                className="range-input"
              />
              <span className="control-value">{tempStyle.borderWidth || 2}px</span>
            </div>

            <div className="control-group">
              <label className="control-label">圆角半径</label>
              <input
                type="range"
                min="0"
                max="20"
                value={tempStyle.borderRadius || 6}
                onChange={(e) => updateStyle({ borderRadius: parseInt(e.target.value) })}
                className="range-input"
              />
              <span className="control-value">{tempStyle.borderRadius || 6}px</span>
            </div>

            <div className="control-group">
              <label className="control-label">内边距</label>
              <input
                type="range"
                min="4"
                max="20"
                value={tempStyle.padding || 8}
                onChange={(e) => updateStyle({ padding: parseInt(e.target.value) })}
                className="range-input"
              />
              <span className="control-value">{tempStyle.padding || 8}px</span>
            </div>
          </div>
        )}

        {/* 预设标签页 */}
        {activeTab === 'presets' && (
          <div className="presets-panel">
            <div className="presets-grid">
              {stylePresets.map(preset => (
                <button
                  key={preset.name}
                  className="preset-button"
                  onClick={() => applyPreset(preset)}
                  title={`应用${preset.name}样式`}
                >
                  <div
                    className="preset-preview"
                    style={{
                      backgroundColor: preset.style.backgroundColor,
                      borderColor: preset.style.borderColor,
                      borderWidth: '2px',
                      borderStyle: 'solid',
                      borderRadius: `${preset.style.borderRadius || 6}px`,
                      color: preset.style.fontColor,
                      fontSize: '12px',
                      padding: '6px 12px'
                    }}
                  >
                    {preset.name}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="editor-actions">
        <button onClick={resetStyle} className="action-button secondary">
          🔄 重置
        </button>
        {onApplyToSiblings && (
          <button
            onClick={() => onApplyToSiblings(tempStyle)}
            className="action-button secondary"
            disabled={!selectedNode}
          >
            👥 应用到同级
          </button>
        )}
        {onApplyToAll && (
          <button
            onClick={() => onApplyToAll(tempStyle)}
            className="action-button secondary"
          >
            🌐 应用到全部
          </button>
        )}
        <button onClick={onClose} className="action-button primary">
          ✅ 完成
        </button>
      </div>
    </div>
  )
}

export default NodeStyleEditor
