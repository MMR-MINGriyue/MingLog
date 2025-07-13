/**
 * 形状选择器组件
 * 提供多种节点形状选择功能
 */

import React from 'react'

export type NodeShape = 'rect' | 'circle' | 'ellipse' | 'rounded-rect' | 'diamond' | 'hexagon'

interface ShapeOption {
  value: NodeShape
  name: string
  icon: React.ReactNode
  description: string
}

interface ShapeSelectorProps {
  /** 当前选中的形状 */
  value: NodeShape
  /** 形状变更回调 */
  onChange: (shape: NodeShape) => void
  /** 标签 */
  label?: string
  /** 自定义类名 */
  className?: string
}

// 形状选项配置
const shapeOptions: ShapeOption[] = [
  {
    value: 'rect',
    name: '矩形',
    description: '标准矩形节点',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="6" width="16" height="12" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1" />
      </svg>
    )
  },
  {
    value: 'rounded-rect',
    name: '圆角矩形',
    description: '圆角矩形节点',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="6" width="16" height="12" rx="3" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1" />
      </svg>
    )
  },
  {
    value: 'circle',
    name: '圆形',
    description: '圆形节点',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1" />
      </svg>
    )
  },
  {
    value: 'ellipse',
    name: '椭圆形',
    description: '椭圆形节点',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <ellipse cx="12" cy="12" rx="10" ry="6" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1" />
      </svg>
    )
  },
  {
    value: 'diamond',
    name: '菱形',
    description: '菱形节点',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M12 4 L20 12 L12 20 L4 12 Z" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1" />
      </svg>
    )
  },
  {
    value: 'hexagon',
    name: '六边形',
    description: '六边形节点',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M8 4 L16 4 L20 12 L16 20 L8 20 L4 12 Z" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1" />
      </svg>
    )
  }
]

/**
 * 形状选择器组件
 */
export const ShapeSelector: React.FC<ShapeSelectorProps> = ({
  value,
  onChange,
  label,
  className = ''
}) => {
  return (
    <div className={`shape-selector ${className}`}>
      {label && <label className="shape-selector-label">{label}</label>}
      
      <div className="shape-options">
        {shapeOptions.map(option => (
          <button
            key={option.value}
            className={`shape-option ${value === option.value ? 'selected' : ''}`}
            onClick={() => onChange(option.value)}
            title={`${option.name} - ${option.description}`}
          >
            <div className="shape-icon">
              {option.icon}
            </div>
            <span className="shape-name">{option.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default ShapeSelector
