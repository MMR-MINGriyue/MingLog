/**
 * 增强版颜色选择器组件
 * 提供丰富的颜色选择功能，包括预设调色板、自定义颜色和最近使用的颜色
 */

import React, { useState, useCallback, useEffect } from 'react'

interface ColorPalette {
  name: string
  colors: string[]
}

interface ColorPickerProps {
  /** 当前颜色值 */
  value: string
  /** 颜色变更回调 */
  onChange: (color: string) => void
  /** 标签 */
  label?: string
  /** 是否显示透明度选项 */
  showAlpha?: boolean
  /** 自定义类名 */
  className?: string
}

// 预设调色板
const colorPalettes: ColorPalette[] = [
  {
    name: '基础色彩',
    colors: [
      '#ffffff', '#f8f9fa', '#e9ecef', '#dee2e6', '#ced4da', '#adb5bd', '#6c757d', '#495057', '#343a40', '#212529'
    ]
  },
  {
    name: '蓝色系',
    colors: [
      '#e3f2fd', '#bbdefb', '#90caf9', '#64b5f6', '#42a5f5', '#2196f3', '#1e88e5', '#1976d2', '#1565c0', '#0d47a1'
    ]
  },
  {
    name: '绿色系',
    colors: [
      '#e8f5e8', '#c8e6c9', '#a5d6a7', '#81c784', '#66bb6a', '#4caf50', '#43a047', '#388e3c', '#2e7d32', '#1b5e20'
    ]
  },
  {
    name: '红色系',
    colors: [
      '#ffebee', '#ffcdd2', '#ef9a9a', '#e57373', '#ef5350', '#f44336', '#e53935', '#d32f2f', '#c62828', '#b71c1c'
    ]
  },
  {
    name: '橙色系',
    colors: [
      '#fff3e0', '#ffe0b2', '#ffcc02', '#ffb74d', '#ffa726', '#ff9800', '#fb8c00', '#f57c00', '#ef6c00', '#e65100'
    ]
  },
  {
    name: '紫色系',
    colors: [
      '#f3e5f5', '#e1bee7', '#ce93d8', '#ba68c8', '#ab47bc', '#9c27b0', '#8e24aa', '#7b1fa2', '#6a1b9a', '#4a148c'
    ]
  }
]

// 最近使用的颜色存储键
const RECENT_COLORS_KEY = 'minglog-recent-colors'

/**
 * 增强版颜色选择器组件
 */
export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  label,
  showAlpha = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [recentColors, setRecentColors] = useState<string[]>([])
  const [customColor, setCustomColor] = useState(value)

  // 加载最近使用的颜色
  useEffect(() => {
    const saved = localStorage.getItem(RECENT_COLORS_KEY)
    if (saved) {
      try {
        setRecentColors(JSON.parse(saved))
      } catch (error) {
        console.warn('Failed to load recent colors:', error)
      }
    }
  }, [])

  // 保存最近使用的颜色
  const saveRecentColor = useCallback((color: string) => {
    setRecentColors(prev => {
      const newRecent = [color, ...prev.filter(c => c !== color)].slice(0, 10)
      localStorage.setItem(RECENT_COLORS_KEY, JSON.stringify(newRecent))
      return newRecent
    })
  }, [])

  // 处理颜色选择
  const handleColorSelect = useCallback((color: string) => {
    onChange(color)
    saveRecentColor(color)
    setCustomColor(color)
    setIsOpen(false)
  }, [onChange, saveRecentColor])

  // 处理自定义颜色输入
  const handleCustomColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value
    setCustomColor(color)
    onChange(color)
    saveRecentColor(color)
  }, [onChange, saveRecentColor])

  return (
    <div className={`color-picker ${className}`}>
      {label && <label className="color-picker-label">{label}</label>}
      
      {/* 颜色预览按钮 */}
      <button
        className="color-preview-button"
        onClick={() => setIsOpen(!isOpen)}
        style={{ backgroundColor: value }}
        title={`当前颜色: ${value}`}
      >
        <span className="color-value">{value}</span>
      </button>

      {/* 颜色选择面板 */}
      {isOpen && (
        <div className="color-picker-panel">
          {/* 自定义颜色输入 */}
          <div className="custom-color-section">
            <label className="section-label">自定义颜色</label>
            <div className="custom-color-input">
              <input
                type="color"
                value={customColor}
                onChange={handleCustomColorChange}
                className="color-input"
              />
              <input
                type="text"
                value={customColor}
                onChange={(e) => {
                  setCustomColor(e.target.value)
                  if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                    onChange(e.target.value)
                    saveRecentColor(e.target.value)
                  }
                }}
                className="color-text-input"
                placeholder="#ffffff"
                pattern="^#[0-9A-Fa-f]{6}$"
              />
            </div>
          </div>

          {/* 最近使用的颜色 */}
          {recentColors.length > 0 && (
            <div className="recent-colors-section">
              <label className="section-label">最近使用</label>
              <div className="color-grid">
                {recentColors.map((color, index) => (
                  <button
                    key={`recent-${index}`}
                    className={`color-swatch ${color === value ? 'selected' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorSelect(color)}
                    title={color}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 预设调色板 */}
          {colorPalettes.map(palette => (
            <div key={palette.name} className="palette-section">
              <label className="section-label">{palette.name}</label>
              <div className="color-grid">
                {palette.colors.map(color => (
                  <button
                    key={color}
                    className={`color-swatch ${color === value ? 'selected' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleColorSelect(color)}
                    title={color}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* 关闭按钮 */}
          <div className="panel-footer">
            <button
              className="close-panel-button"
              onClick={() => setIsOpen(false)}
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ColorPicker
