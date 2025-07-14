/**
 * 导出配置对话框组件
 * 提供完整的导出参数配置界面
 */

import React, { useState, useCallback } from 'react'
import { ExportConfig } from '../types'
import { exportManager } from '../exporters/ExportManager'

interface ExportDialogProps {
  /** 是否显示对话框 */
  visible: boolean
  /** 关闭对话框回调 */
  onClose: () => void
  /** 导出确认回调 */
  onExport: (config: ExportConfig) => void
  /** 类名 */
  className?: string
}

interface ExportState {
  /** 当前选中的格式 */
  selectedFormat: ExportConfig['format']
  /** 导出配置 */
  config: ExportConfig
  /** 是否显示高级选项 */
  showAdvanced: boolean
  /** 预览模式 */
  previewMode: boolean
}

/**
 * 导出配置对话框组件
 */
export const ExportDialog: React.FC<ExportDialogProps> = ({
  visible,
  onClose,
  onExport,
  className = ''
}) => {
  // 状态管理
  const [exportState, setExportState] = useState<ExportState>({
    selectedFormat: 'png',
    config: {
      format: 'png',
      width: 1200,
      height: 800,
      quality: 1,
      backgroundColor: '#ffffff',
      includeMetadata: true
    },
    showAdvanced: false,
    previewMode: false
  })

  /**
   * 更新导出配置
   */
  const updateConfig = useCallback((updates: Partial<ExportConfig>) => {
    setExportState(prev => ({
      ...prev,
      config: { ...prev.config, ...updates }
    }))
  }, [])

  /**
   * 切换导出格式
   */
  const handleFormatChange = useCallback((format: ExportConfig['format']) => {
    const defaultConfigs = {
      png: { width: 1200, height: 800, quality: 1 },
      svg: { width: 1200, height: 800 },
      pdf: { width: 1200, height: 800 },
      json: { includeMetadata: true }
    }

    setExportState(prev => ({
      ...prev,
      selectedFormat: format,
      config: {
        ...prev.config,
        format,
        ...defaultConfigs[format]
      }
    }))
  }, [])

  /**
   * 处理导出
   */
  const handleExport = useCallback(() => {
    onExport(exportState.config)
    onClose()
  }, [exportState.config, onExport, onClose])

  /**
   * 重置配置
   */
  const handleReset = useCallback(() => {
    handleFormatChange(exportState.selectedFormat)
  }, [exportState.selectedFormat, handleFormatChange])

  if (!visible) return null

  const supportedFormats = exportManager.getSupportedFormats()

  return (
    <div className={`export-dialog-overlay ${className}`}>
      <div className="export-dialog">
        {/* 标题栏 */}
        <div className="dialog-header">
          <h3 className="dialog-title">📤 导出思维导图</h3>
          <button onClick={onClose} className="close-button">✕</button>
        </div>

        {/* 格式选择 */}
        <div className="format-selection">
          <h4 className="section-title">选择导出格式</h4>
          <div className="format-grid">
            {supportedFormats.map(format => {
              const formatInfo = exportManager.getFormatInfo(format)
              return (
                <button
                  key={format}
                  className={`format-option ${exportState.selectedFormat === format ? 'selected' : ''}`}
                  onClick={() => handleFormatChange(format)}
                >
                  <div className="format-icon">
                    {format === 'png' && '🖼️'}
                    {format === 'svg' && '📐'}
                    {format === 'pdf' && '📄'}
                    {format === 'json' && '📋'}
                  </div>
                  <div className="format-info">
                    <div className="format-name">{formatInfo.name}</div>
                    <div className="format-description">{formatInfo.description}</div>
                    <div className="format-features">
                      {formatInfo.features.slice(0, 2).map(feature => (
                        <span key={feature} className="feature-tag">{feature}</span>
                      ))}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* 基础配置 */}
        <div className="basic-config">
          <h4 className="section-title">基础设置</h4>
          
          {/* 尺寸设置 */}
          {(exportState.selectedFormat === 'png' || exportState.selectedFormat === 'svg' || exportState.selectedFormat === 'pdf') && (
            <div className="config-group">
              <label className="config-label">输出尺寸</label>
              <div className="size-inputs">
                <div className="input-group">
                  <label>宽度</label>
                  <input
                    type="number"
                    value={exportState.config.width || 1200}
                    onChange={(e) => updateConfig({ width: parseInt(e.target.value) })}
                    min="100"
                    max="4000"
                    className="size-input"
                  />
                  <span className="unit">px</span>
                </div>
                <div className="input-group">
                  <label>高度</label>
                  <input
                    type="number"
                    value={exportState.config.height || 800}
                    onChange={(e) => updateConfig({ height: parseInt(e.target.value) })}
                    min="100"
                    max="4000"
                    className="size-input"
                  />
                  <span className="unit">px</span>
                </div>
              </div>
              
              {/* 预设尺寸 */}
              <div className="preset-sizes">
                <button onClick={() => updateConfig({ width: 1920, height: 1080 })} className="preset-button">
                  1920×1080 (Full HD)
                </button>
                <button onClick={() => updateConfig({ width: 1200, height: 800 })} className="preset-button">
                  1200×800 (默认)
                </button>
                <button onClick={() => updateConfig({ width: 800, height: 600 })} className="preset-button">
                  800×600 (小尺寸)
                </button>
              </div>
            </div>
          )}

          {/* 质量设置 */}
          {exportState.selectedFormat === 'png' && (
            <div className="config-group">
              <label className="config-label">图像质量</label>
              <div className="quality-slider">
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={exportState.config.quality || 1}
                  onChange={(e) => updateConfig({ quality: parseFloat(e.target.value) })}
                  className="slider"
                />
                <span className="quality-value">{Math.round((exportState.config.quality || 1) * 100)}%</span>
              </div>
            </div>
          )}

          {/* 背景颜色 */}
          {(exportState.selectedFormat === 'png' || exportState.selectedFormat === 'svg' || exportState.selectedFormat === 'pdf') && (
            <div className="config-group">
              <label className="config-label">背景颜色</label>
              <div className="color-picker">
                <input
                  type="color"
                  value={exportState.config.backgroundColor || '#ffffff'}
                  onChange={(e) => updateConfig({ backgroundColor: e.target.value })}
                  className="color-input"
                />
                <div className="color-presets">
                  <button onClick={() => updateConfig({ backgroundColor: '#ffffff' })} className="color-preset white" title="白色" />
                  <button onClick={() => updateConfig({ backgroundColor: '#f8f9fa' })} className="color-preset light-gray" title="浅灰" />
                  <button onClick={() => updateConfig({ backgroundColor: '#343a40' })} className="color-preset dark-gray" title="深灰" />
                  <button onClick={() => updateConfig({ backgroundColor: 'transparent' })} className="color-preset transparent" title="透明" />
                </div>
              </div>
            </div>
          )}

          {/* 元数据选项 */}
          <div className="config-group">
            <label className="config-label">
              <input
                type="checkbox"
                checked={exportState.config.includeMetadata || false}
                onChange={(e) => updateConfig({ includeMetadata: e.target.checked })}
                className="checkbox"
              />
              包含元数据信息
            </label>
            <div className="config-description">
              包含创建时间、标题、描述等元数据信息
            </div>
          </div>
        </div>

        {/* 高级选项 */}
        <div className="advanced-section">
          <button
            onClick={() => setExportState(prev => ({ ...prev, showAdvanced: !prev.showAdvanced }))}
            className="advanced-toggle"
          >
            {exportState.showAdvanced ? '▼' : '▶'} 高级选项
          </button>
          
          {exportState.showAdvanced && (
            <div className="advanced-config">
              {/* DPI设置 */}
              {exportState.selectedFormat === 'png' && (
                <div className="config-group">
                  <label className="config-label">DPI (分辨率)</label>
                  <select
                    value={exportState.config.dpi || 96}
                    onChange={(e) => updateConfig({ dpi: parseInt(e.target.value) })}
                    className="select-input"
                  >
                    <option value={72}>72 DPI (网页)</option>
                    <option value={96}>96 DPI (标准)</option>
                    <option value={150}>150 DPI (高质量)</option>
                    <option value={300}>300 DPI (打印)</option>
                  </select>
                </div>
              )}

              {/* 压缩选项 */}
              {exportState.selectedFormat === 'json' && (
                <div className="config-group">
                  <label className="config-label">
                    <input
                      type="checkbox"
                      checked={exportState.config.compress || false}
                      onChange={(e) => updateConfig({ compress: e.target.checked })}
                      className="checkbox"
                    />
                    压缩JSON输出
                  </label>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 预览信息 */}
        <div className="export-preview">
          <div className="preview-info">
            <div className="info-item">
              <span className="info-label">格式:</span>
              <span className="info-value">{exportManager.getFormatInfo(exportState.selectedFormat).name}</span>
            </div>
            {exportState.config.width && exportState.config.height && (
              <div className="info-item">
                <span className="info-label">尺寸:</span>
                <span className="info-value">{exportState.config.width} × {exportState.config.height}</span>
              </div>
            )}
            <div className="info-item">
              <span className="info-label">扩展名:</span>
              <span className="info-value">.{exportManager.getFormatInfo(exportState.selectedFormat).extension}</span>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="dialog-actions">
          <button onClick={handleReset} className="action-button secondary">
            🔄 重置
          </button>
          <button onClick={onClose} className="action-button secondary">
            取消
          </button>
          <button onClick={handleExport} className="action-button primary">
            📤 导出
          </button>
        </div>
      </div>
    </div>
  )
}

export default ExportDialog
