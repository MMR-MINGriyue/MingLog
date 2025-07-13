/**
 * 思维导图工具栏组件
 */

import React from 'react'
import { LayoutType } from '../types'

interface MindMapToolbarProps {
  currentLayout: LayoutType
  zoomLevel: number
  onLayoutChange: (layout: LayoutType) => void
  onZoomIn: () => void
  onZoomOut: () => void
  onFitToView: () => void
  onExport?: (config: any) => void
}

export const MindMapToolbar: React.FC<MindMapToolbarProps> = ({
  currentLayout,
  zoomLevel,
  onLayoutChange,
  onZoomIn,
  onZoomOut,
  onFitToView,
  onExport
}) => {
  const layouts: { type: LayoutType; name: string; icon: string }[] = [
    { type: 'tree', name: '树形布局', icon: '🌳' },
    { type: 'radial', name: '径向布局', icon: '🎯' },
    { type: 'force', name: '力导向布局', icon: '⚡' },
    { type: 'circular', name: '环形布局', icon: '⭕' }
  ]

  return (
    <div className="mindmap-toolbar" style={toolbarStyle}>
      {/* 布局选择器 */}
      <div className="toolbar-section" style={sectionStyle}>
        <label style={labelStyle}>布局:</label>
        <select
          value={currentLayout}
          onChange={(e) => onLayoutChange(e.target.value as LayoutType)}
          style={selectStyle}
        >
          {layouts.map(layout => (
            <option key={layout.type} value={layout.type}>
              {layout.icon} {layout.name}
            </option>
          ))}
        </select>
      </div>

      {/* 缩放控制 */}
      <div className="toolbar-section" style={sectionStyle}>
        <button
          onClick={onZoomOut}
          style={buttonStyle}
          title="缩小"
        >
          🔍-
        </button>
        <span style={zoomLevelStyle}>
          {Math.round(zoomLevel * 100)}%
        </span>
        <button
          onClick={onZoomIn}
          style={buttonStyle}
          title="放大"
        >
          🔍+
        </button>
        <button
          onClick={onFitToView}
          style={buttonStyle}
          title="适应窗口"
        >
          📐
        </button>
      </div>

      {/* 导出按钮 */}
      {onExport && (
        <div className="toolbar-section" style={sectionStyle}>
          <button
            onClick={onExport}
            style={buttonStyle}
            title="导出图片"
          >
            💾 导出
          </button>
        </div>
      )}
    </div>
  )
}

// 样式定义
const toolbarStyle: React.CSSProperties = {
  position: 'absolute',
  top: 10,
  left: 10,
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  padding: '8px 12px',
  backgroundColor: 'white',
  borderRadius: '8px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  border: '1px solid #e5e7eb',
  fontSize: '14px'
}

const sectionStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}

const labelStyle: React.CSSProperties = {
  fontWeight: '500',
  color: '#374151'
}

const selectStyle: React.CSSProperties = {
  padding: '4px 8px',
  border: '1px solid #d1d5db',
  borderRadius: '4px',
  fontSize: '14px',
  backgroundColor: 'white',
  cursor: 'pointer'
}

const buttonStyle: React.CSSProperties = {
  padding: '4px 8px',
  border: '1px solid #d1d5db',
  borderRadius: '4px',
  backgroundColor: 'white',
  cursor: 'pointer',
  fontSize: '12px',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  transition: 'all 0.2s ease'
}

const zoomLevelStyle: React.CSSProperties = {
  minWidth: '50px',
  textAlign: 'center',
  fontSize: '12px',
  color: '#6b7280'
}

export default MindMapToolbar
