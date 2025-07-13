/**
 * 增强版节点样式编辑器
 * 集成颜色选择器、形状选择器和高级样式选项
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { NodeStyle, MindMapNode } from '@minglog/mindmap'
import { ColorPicker } from './ColorPicker'
import { ShapeSelector, NodeShape } from './ShapeSelector'
import { appCore } from '../../core/AppCore'
import './ColorPicker.css'
import './ShapeSelector.css'
import './EnhancedNodeStyleEditor.css'

interface StylePreset {
  name: string
  description: string
  style: NodeStyle
  category: 'basic' | 'professional' | 'creative' | 'minimal'
}

interface EnhancedNodeStyleEditorProps {
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
  /** 自定义类名 */
  className?: string
}

// 样式预设
const stylePresets: StylePreset[] = [
  {
    name: '默认样式',
    description: '简洁的默认样式',
    category: 'basic',
    style: {
      backgroundColor: '#ffffff',
      borderColor: '#d1d5db',
      borderWidth: 2,
      borderRadius: 6,
      fontSize: 14,
      fontColor: '#374151',
      fontWeight: 'normal',
      padding: 8,
      shape: 'rounded-rect'
    }
  },
  {
    name: '蓝色主题',
    description: '专业的蓝色主题',
    category: 'professional',
    style: {
      backgroundColor: '#eff6ff',
      borderColor: '#3b82f6',
      borderWidth: 2,
      borderRadius: 8,
      fontSize: 14,
      fontColor: '#1e40af',
      fontWeight: 'normal',
      padding: 12,
      shape: 'rounded-rect'
    }
  },
  {
    name: '绿色清新',
    description: '清新的绿色风格',
    category: 'creative',
    style: {
      backgroundColor: '#f0fdf4',
      borderColor: '#22c55e',
      borderWidth: 2,
      borderRadius: 12,
      fontSize: 14,
      fontColor: '#15803d',
      fontWeight: 'normal',
      padding: 10,
      shape: 'rounded-rect'
    }
  },
  {
    name: '橙色活力',
    description: '充满活力的橙色',
    category: 'creative',
    style: {
      backgroundColor: '#fff7ed',
      borderColor: '#f97316',
      borderWidth: 3,
      borderRadius: 10,
      fontSize: 15,
      fontColor: '#c2410c',
      fontWeight: 'bold',
      padding: 12,
      shape: 'rounded-rect'
    }
  },
  {
    name: '极简圆形',
    description: '极简主义圆形设计',
    category: 'minimal',
    style: {
      backgroundColor: '#f8fafc',
      borderColor: '#64748b',
      borderWidth: 1,
      borderRadius: 50,
      fontSize: 13,
      fontColor: '#334155',
      fontWeight: 'normal',
      padding: 16,
      shape: 'circle'
    }
  },
  {
    name: '深色模式',
    description: '深色主题样式',
    category: 'professional',
    style: {
      backgroundColor: '#1f2937',
      borderColor: '#4b5563',
      borderWidth: 2,
      borderRadius: 8,
      fontSize: 14,
      fontColor: '#f9fafb',
      fontWeight: 'normal',
      padding: 10,
      shape: 'rounded-rect'
    }
  }
]

/**
 * 增强版节点样式编辑器
 */
export const EnhancedNodeStyleEditor: React.FC<EnhancedNodeStyleEditorProps> = ({
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
  const [activeTab, setActiveTab] = useState<'presets' | 'colors' | 'typography' | 'layout' | 'shape'>('presets')
  const [tempStyle, setTempStyle] = useState<NodeStyle>(currentStyle)
  const [eventBus, setEventBus] = useState<any>(null)

  // 初始化事件总线
  useEffect(() => {
    if (appCore.isInitialized()) {
      setEventBus(appCore.getEventBus())
    }
  }, [])

  // 同步外部样式变更
  useEffect(() => {
    setTempStyle(currentStyle)
  }, [currentStyle])

  // 计算当前形状
  const currentShape = useMemo((): NodeShape => {
    return (tempStyle.shape as NodeShape) || 'rounded-rect'
  }, [tempStyle.shape])

  /**
   * 更新样式属性
   */
  const updateStyle = useCallback((updates: Partial<NodeStyle>) => {
    const newStyle = { ...tempStyle, ...updates }
    setTempStyle(newStyle)
    onStyleChange(newStyle)

    // 发送样式变更事件
    if (eventBus && selectedNode) {
      eventBus.emit('mindmap:node:style-changed', {
        nodeId: selectedNode.id,
        oldStyle: tempStyle,
        newStyle: newStyle
      }, 'EnhancedNodeStyleEditor')
    }
  }, [tempStyle, onStyleChange, eventBus, selectedNode])

  /**
   * 应用预设样式
   */
  const applyPreset = useCallback((preset: StylePreset) => {
    setTempStyle(preset.style)
    onStyleChange(preset.style)

    // 发送预设应用事件
    if (eventBus && selectedNode) {
      eventBus.emit('mindmap:preset:applied', {
        nodeId: selectedNode.id,
        presetName: preset.name,
        style: preset.style
      }, 'EnhancedNodeStyleEditor')
    }
  }, [onStyleChange, eventBus, selectedNode])

  /**
   * 重置样式
   */
  const resetStyle = useCallback(() => {
    const defaultStyle = stylePresets[0].style
    setTempStyle(defaultStyle)
    onStyleChange(defaultStyle)
  }, [onStyleChange])

  /**
   * 处理形状变更
   */
  const handleShapeChange = useCallback((shape: NodeShape) => {
    updateStyle({ shape })
  }, [updateStyle])

  // 按类别分组的预设
  const presetsByCategory = useMemo(() => {
    return stylePresets.reduce((acc, preset) => {
      if (!acc[preset.category]) {
        acc[preset.category] = []
      }
      acc[preset.category].push(preset)
      return acc
    }, {} as Record<string, StylePreset[]>)
  }, [])

  if (!visible) return null

  return (
    <div className={`enhanced-node-style-editor ${className}`}>
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
      <div className="editor-tabs">
        {[
          { key: 'presets', label: '预设', icon: '🎯' },
          { key: 'colors', label: '颜色', icon: '🎨' },
          { key: 'shape', label: '形状', icon: '⬜' },
          { key: 'typography', label: '字体', icon: '📝' },
          { key: 'layout', label: '布局', icon: '📐' }
        ].map(tab => (
          <button
            key={tab.key}
            className={`tab-button ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key as any)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
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
            borderRadius: currentShape === 'circle' ? '50%' : `${tempStyle.borderRadius || 6}px`,
            fontSize: `${tempStyle.fontSize || 14}px`,
            color: tempStyle.fontColor,
            fontWeight: tempStyle.fontWeight,
            padding: `${tempStyle.padding || 8}px`,
            display: 'inline-block',
            minWidth: '80px',
            textAlign: 'center',
            transform: currentShape === 'diamond' ? 'rotate(45deg)' : 'none'
          }}
        >
          {selectedNode?.text || '示例节点'}
        </div>
      </div>

      {/* 编辑面板 */}
      <div className="editor-content">
        {/* 预设标签页 */}
        {activeTab === 'presets' && (
          <div className="presets-panel">
            {Object.entries(presetsByCategory).map(([category, presets]) => (
              <div key={category} className="preset-category">
                <h4 className="category-title">
                  {category === 'basic' && '基础样式'}
                  {category === 'professional' && '专业样式'}
                  {category === 'creative' && '创意样式'}
                  {category === 'minimal' && '极简样式'}
                </h4>
                <div className="preset-grid">
                  {presets.map(preset => (
                    <button
                      key={preset.name}
                      className="preset-button"
                      onClick={() => applyPreset(preset)}
                      title={preset.description}
                    >
                      <div
                        className="preset-preview"
                        style={{
                          backgroundColor: preset.style.backgroundColor,
                          borderColor: preset.style.borderColor,
                          borderWidth: `${preset.style.borderWidth || 2}px`,
                          borderStyle: 'solid',
                          borderRadius: `${preset.style.borderRadius || 6}px`,
                          color: preset.style.fontColor
                        }}
                      >
                        样例
                      </div>
                      <span className="preset-name">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 颜色标签页 */}
        {activeTab === 'colors' && (
          <div className="colors-panel">
            <div className="color-section">
              <ColorPicker
                label="背景颜色"
                value={tempStyle.backgroundColor || '#ffffff'}
                onChange={(color) => updateStyle({ backgroundColor: color })}
              />
            </div>
            
            <div className="color-section">
              <ColorPicker
                label="边框颜色"
                value={tempStyle.borderColor || '#d1d5db'}
                onChange={(color) => updateStyle({ borderColor: color })}
              />
            </div>
            
            <div className="color-section">
              <ColorPicker
                label="文字颜色"
                value={tempStyle.fontColor || '#374151'}
                onChange={(color) => updateStyle({ fontColor: color })}
              />
            </div>
          </div>
        )}

        {/* 形状标签页 */}
        {activeTab === 'shape' && (
          <div className="shape-panel">
            <ShapeSelector
              label="节点形状"
              value={currentShape}
              onChange={handleShapeChange}
            />
          </div>
        )}

        {/* 字体标签页 */}
        {activeTab === 'typography' && (
          <div className="typography-panel">
            <div className="control-group">
              <label className="control-label">字体大小</label>
              <div className="range-control">
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

            <div className="control-group">
              <label className="control-label">文字对齐</label>
              <div className="button-group">
                {[
                  { value: 'left', label: '左对齐', icon: '⬅️' },
                  { value: 'center', label: '居中', icon: '↔️' },
                  { value: 'right', label: '右对齐', icon: '➡️' }
                ].map(option => (
                  <button
                    key={option.value}
                    className={`button-option ${(tempStyle as any).textAlign === option.value ? 'selected' : ''}`}
                    onClick={() => updateStyle({ textAlign: option.value } as any)}
                    title={option.label}
                  >
                    {option.icon}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 布局标签页 */}
        {activeTab === 'layout' && (
          <div className="layout-panel">
            <div className="control-group">
              <label className="control-label">边框宽度</label>
              <div className="range-control">
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
            </div>

            <div className="control-group">
              <label className="control-label">圆角半径</label>
              <div className="range-control">
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
            </div>

            <div className="control-group">
              <label className="control-label">内边距</label>
              <div className="range-control">
                <input
                  type="range"
                  min="4"
                  max="24"
                  value={tempStyle.padding || 8}
                  onChange={(e) => updateStyle({ padding: parseInt(e.target.value) })}
                  className="range-input"
                />
                <span className="control-value">{tempStyle.padding || 8}px</span>
              </div>
            </div>

            <div className="control-group">
              <label className="control-label">最小宽度</label>
              <div className="range-control">
                <input
                  type="range"
                  min="60"
                  max="200"
                  value={tempStyle.minWidth || 80}
                  onChange={(e) => updateStyle({ minWidth: parseInt(e.target.value) })}
                  className="range-input"
                />
                <span className="control-value">{tempStyle.minWidth || 80}px</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="editor-actions">
        <button
          className="action-button secondary"
          onClick={resetStyle}
          title="重置为默认样式"
        >
          重置
        </button>

        {onApplyToSiblings && (
          <button
            className="action-button secondary"
            onClick={() => onApplyToSiblings(tempStyle)}
            title="应用到同级节点"
          >
            应用到同级
          </button>
        )}

        {onApplyToAll && (
          <button
            className="action-button primary"
            onClick={() => onApplyToAll(tempStyle)}
            title="应用到所有节点"
          >
            应用到全部
          </button>
        )}
      </div>
    </div>
  )
}

export default EnhancedNodeStyleEditor
