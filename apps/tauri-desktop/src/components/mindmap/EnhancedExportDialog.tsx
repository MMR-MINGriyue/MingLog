/**
 * 增强版思维导图导出对话框
 * 提供完整的导出配置、预览和进度管理功能
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { MindMapData, ExportConfig, exportManager } from '@minglog/mindmap'
import { appCore } from '../../core/AppCore'

interface EnhancedExportDialogProps {
  /** 是否显示对话框 */
  visible: boolean
  /** 关闭对话框回调 */
  onClose: () => void
  /** 思维导图数据 */
  mindMapData: MindMapData
  /** 导出完成回调 */
  onExportComplete?: (result: any) => void
  /** 自定义类名 */
  className?: string
}

interface ExportState {
  /** 当前步骤 */
  currentStep: 'config' | 'preview' | 'progress' | 'complete'
  /** 导出配置 */
  config: ExportConfig
  /** 是否显示高级选项 */
  showAdvanced: boolean
  /** 导出进度 */
  progress: {
    step: string
    progress: number
    completed: boolean
    error?: string
  }
  /** 导出结果 */
  result: any | null
  /** 预览数据 */
  previewUrl: string | null
}

// 导出格式配置
const formatConfig = {
  png: {
    name: 'PNG图片',
    icon: '🖼️',
    description: '高质量位图格式，适合分享和展示',
    defaultConfig: { width: 1920, height: 1080, quality: 1, dpi: 300 }
  },
  svg: {
    name: 'SVG矢量图',
    icon: '📐',
    description: '可缩放矢量格式，适合打印和编辑',
    defaultConfig: { width: 1200, height: 800 }
  },
  pdf: {
    name: 'PDF文档',
    icon: '📄',
    description: '便携文档格式，适合正式文档',
    defaultConfig: { width: 1200, height: 800 }
  },
  json: {
    name: 'JSON数据',
    icon: '📊',
    description: '结构化数据格式，适合备份和导入',
    defaultConfig: { includeMetadata: true }
  }
}

// 质量预设
const qualityPresets = {
  draft: { name: '草稿', width: 800, height: 600, quality: 0.7, dpi: 150 },
  standard: { name: '标准', width: 1200, height: 800, quality: 0.9, dpi: 200 },
  high: { name: '高质量', width: 1920, height: 1080, quality: 1, dpi: 300 },
  print: { name: '印刷级', width: 3840, height: 2160, quality: 1, dpi: 600 }
}

/**
 * 增强版导出对话框组件
 */
export const EnhancedExportDialog: React.FC<EnhancedExportDialogProps> = ({
  visible,
  onClose,
  mindMapData,
  onExportComplete,
  className = ''
}) => {
  // 状态管理
  const [state, setState] = useState<ExportState>({
    currentStep: 'config',
    config: {
      format: 'png',
      width: 1920,
      height: 1080,
      quality: 1,
      backgroundColor: '#ffffff',
      includeMetadata: true,
      dpi: 300
    },
    showAdvanced: false,
    progress: {
      step: '',
      progress: 0,
      completed: false
    },
    result: null,
    previewUrl: null
  })

  // 重置状态
  const resetState = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: 'config',
      progress: { step: '', progress: 0, completed: false },
      result: null,
      previewUrl: null
    }))
  }, [])

  // 处理关闭
  const handleClose = useCallback(() => {
    resetState()
    onClose()
  }, [resetState, onClose])

  // 更新配置
  const updateConfig = useCallback((updates: Partial<ExportConfig>) => {
    setState(prev => ({
      ...prev,
      config: { ...prev.config, ...updates }
    }))
  }, [])

  // 应用质量预设
  const applyQualityPreset = useCallback((presetKey: keyof typeof qualityPresets) => {
    const preset = qualityPresets[presetKey]
    updateConfig(preset)
  }, [updateConfig])

  // 应用格式默认配置
  const applyFormatDefaults = useCallback((format: ExportConfig['format']) => {
    const defaults = formatConfig[format]?.defaultConfig || {}
    updateConfig({ format, ...defaults })
  }, [updateConfig])

  // 生成预览
  const generatePreview = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, currentStep: 'preview', previewUrl: null }))

      // 创建预览配置（较小尺寸）
      const previewConfig: ExportConfig = {
        ...state.config,
        width: 400,
        height: 300,
        quality: 0.8
      }

      // 生成预览
      if (state.config.format === 'png') {
        const result = await exportManager.export(mindMapData, previewConfig)
        const url = URL.createObjectURL(result.data as Blob)
        setState(prev => ({ ...prev, previewUrl: url }))
      } else if (state.config.format === 'svg') {
        const result = await exportManager.export(mindMapData, previewConfig)
        const blob = new Blob([result.data as string], { type: 'image/svg+xml' })
        const url = URL.createObjectURL(blob)
        setState(prev => ({ ...prev, previewUrl: url }))
      }
    } catch (error) {
      console.error('预览生成失败:', error)
    }
  }, [state.config, mindMapData])

  // 执行导出
  const handleExport = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, currentStep: 'progress' }))

      // 监听进度
      const unsubscribe = exportManager.onProgress((progress) => {
        setState(prev => ({ ...prev, progress }))
      })

      try {
        // 执行导出
        const result = await exportManager.export(mindMapData, state.config)

        // 自动下载
        await exportManager.downloadResult(result)

        setState(prev => ({
          ...prev,
          currentStep: 'complete',
          result
        }))

        // 发送事件到事件总线
        if (appCore.isInitialized()) {
          const eventBus = appCore.getEventBus()
          eventBus?.emit('mindmap:export:completed', {
            format: state.config.format,
            size: result.size,
            exportTime: result.exportTime
          }, 'EnhancedExportDialog')
        }

        onExportComplete?.(result)

      } finally {
        unsubscribe()
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '导出失败'
      setState(prev => ({
        ...prev,
        progress: {
          step: '导出失败',
          progress: 0,
          completed: false,
          error: errorMessage
        }
      }))
    }
  }, [state.config, mindMapData, onExportComplete])

  // 计算文件大小估算
  const estimatedSize = useMemo(() => {
    const { width, height, format } = state.config
    const pixels = width * height

    switch (format) {
      case 'png':
        return Math.round(pixels * 4 / 1024 / 1024 * 100) / 100 // 约4字节/像素
      case 'svg':
        return Math.round(mindMapData.nodes.length * 0.5) // 约0.5KB/节点
      case 'pdf':
        return Math.round(pixels * 0.5 / 1024 / 1024 * 100) / 100 // 约0.5字节/像素
      case 'json':
        return Math.round(JSON.stringify(mindMapData).length / 1024 * 100) / 100
      default:
        return 0
    }
  }, [state.config, mindMapData])

  // 清理预览URL
  useEffect(() => {
    return () => {
      if (state.previewUrl) {
        URL.revokeObjectURL(state.previewUrl)
      }
    }
  }, [state.previewUrl])

  if (!visible) return null

  return (
    <div className={`enhanced-export-dialog ${className}`}>
      {/* 遮罩层 */}
      <div className="export-dialog-overlay" onClick={handleClose} />
      
      {/* 主面板 */}
      <div className="export-dialog-panel">
        {/* 标题栏 */}
        <div className="dialog-header">
          <h2 className="dialog-title">
            📤 导出思维导图
          </h2>
          <button onClick={handleClose} className="close-button" title="关闭">
            ✕
          </button>
        </div>

        {/* 步骤指示器 */}
        <div className="step-indicator">
          {[
            { key: 'config', label: '配置', icon: '⚙️' },
            { key: 'preview', label: '预览', icon: '👁️' },
            { key: 'progress', label: '导出', icon: '📤' },
            { key: 'complete', label: '完成', icon: '✅' }
          ].map((step, index) => (
            <div
              key={step.key}
              className={`step-item ${state.currentStep === step.key ? 'active' : ''} ${
                ['config', 'preview', 'progress', 'complete'].indexOf(state.currentStep) > index ? 'completed' : ''
              }`}
            >
              <span className="step-icon">{step.icon}</span>
              <span className="step-label">{step.label}</span>
            </div>
          ))}
        </div>

        {/* 内容区域 */}
        <div className="dialog-content">
          {/* 配置步骤 */}
          {state.currentStep === 'config' && (
            <div className="config-step">
              {/* 格式选择 */}
              <div className="config-section">
                <h3 className="section-title">导出格式</h3>
                <div className="format-grid">
                  {Object.entries(formatConfig).map(([format, config]) => (
                    <button
                      key={format}
                      className={`format-option ${state.config.format === format ? 'selected' : ''}`}
                      onClick={() => applyFormatDefaults(format as ExportConfig['format'])}
                    >
                      <span className="format-icon">{config.icon}</span>
                      <div className="format-info">
                        <div className="format-name">{config.name}</div>
                        <div className="format-description">{config.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* 质量预设 */}
              {(state.config.format === 'png' || state.config.format === 'svg' || state.config.format === 'pdf') && (
                <div className="config-section">
                  <h3 className="section-title">质量预设</h3>
                  <div className="quality-presets">
                    {Object.entries(qualityPresets).map(([key, preset]) => (
                      <button
                        key={key}
                        className="quality-preset"
                        onClick={() => applyQualityPreset(key as keyof typeof qualityPresets)}
                      >
                        <div className="preset-name">{preset.name}</div>
                        <div className="preset-specs">
                          {preset.width}×{preset.height} • {preset.dpi}DPI
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 基础配置 */}
              <div className="config-section">
                <h3 className="section-title">基础设置</h3>
                <div className="config-grid">
                  {(state.config.format === 'png' || state.config.format === 'svg' || state.config.format === 'pdf') && (
                    <>
                      <div className="config-item">
                        <label>宽度 (px)</label>
                        <input
                          type="number"
                          value={state.config.width || 1200}
                          onChange={(e) => updateConfig({ width: parseInt(e.target.value) })}
                          min="100"
                          max="10000"
                        />
                      </div>
                      <div className="config-item">
                        <label>高度 (px)</label>
                        <input
                          type="number"
                          value={state.config.height || 800}
                          onChange={(e) => updateConfig({ height: parseInt(e.target.value) })}
                          min="100"
                          max="10000"
                        />
                      </div>
                      <div className="config-item">
                        <label>背景颜色</label>
                        <input
                          type="color"
                          value={state.config.backgroundColor || '#ffffff'}
                          onChange={(e) => updateConfig({ backgroundColor: e.target.value })}
                        />
                      </div>
                    </>
                  )}
                  
                  <div className="config-item">
                    <label>
                      <input
                        type="checkbox"
                        checked={state.config.includeMetadata || false}
                        onChange={(e) => updateConfig({ includeMetadata: e.target.checked })}
                      />
                      包含元数据
                    </label>
                  </div>
                </div>
              </div>

              {/* 高级选项 */}
              <div className="config-section">
                <button
                  className="advanced-toggle"
                  onClick={() => setState(prev => ({ ...prev, showAdvanced: !prev.showAdvanced }))}
                >
                  高级选项 {state.showAdvanced ? '▼' : '▶'}
                </button>
                
                {state.showAdvanced && (
                  <div className="advanced-options">
                    {state.config.format === 'png' && (
                      <>
                        <div className="config-item">
                          <label>图片质量</label>
                          <input
                            type="range"
                            min="0.1"
                            max="1"
                            step="0.1"
                            value={state.config.quality || 1}
                            onChange={(e) => updateConfig({ quality: parseFloat(e.target.value) })}
                          />
                          <span>{Math.round((state.config.quality || 1) * 100)}%</span>
                        </div>
                        <div className="config-item">
                          <label>DPI</label>
                          <select
                            value={state.config.dpi || 300}
                            onChange={(e) => updateConfig({ dpi: parseInt(e.target.value) })}
                          >
                            <option value={72}>72 (网页)</option>
                            <option value={150}>150 (标准)</option>
                            <option value={300}>300 (高质量)</option>
                            <option value={600}>600 (印刷级)</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* 预估信息 */}
              <div className="config-section">
                <div className="export-info">
                  <div className="info-item">
                    <span className="info-label">预估文件大小:</span>
                    <span className="info-value">
                      {estimatedSize < 1 ? `${Math.round(estimatedSize * 1024)}KB` : `${estimatedSize}MB`}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">节点数量:</span>
                    <span className="info-value">{mindMapData.nodes.length}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">连接数量:</span>
                    <span className="info-value">{mindMapData.links.length}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 预览步骤 */}
          {state.currentStep === 'preview' && (
            <div className="preview-step">
              <div className="preview-container">
                <h3 className="section-title">导出预览</h3>
                {state.previewUrl ? (
                  <div className="preview-image-container">
                    <img
                      src={state.previewUrl}
                      alt="导出预览"
                      className="preview-image"
                    />
                    <div className="preview-info">
                      <div className="preview-specs">
                        实际尺寸: {state.config.width}×{state.config.height}px
                      </div>
                      <div className="preview-note">
                        预览图已缩放显示，实际导出将使用配置的尺寸
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="preview-loading">
                    <div className="loading-spinner" />
                    <span>正在生成预览...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 进度步骤 */}
          {state.currentStep === 'progress' && (
            <div className="progress-step">
              <div className="progress-container">
                <h3 className="section-title">正在导出</h3>
                <div className="progress-info">
                  <div className="progress-step-name">{state.progress.step}</div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${state.progress.progress}%` }}
                    />
                  </div>
                  <div className="progress-percentage">{Math.round(state.progress.progress)}%</div>
                </div>

                {state.progress.error && (
                  <div className="progress-error">
                    <span className="error-icon">❌</span>
                    <span className="error-message">{state.progress.error}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 完成步骤 */}
          {state.currentStep === 'complete' && (
            <div className="complete-step">
              <div className="complete-container">
                <div className="complete-icon">✅</div>
                <h3 className="complete-title">导出完成</h3>

                {state.result && (
                  <div className="result-info">
                    <div className="result-item">
                      <span className="result-label">文件名:</span>
                      <span className="result-value">{state.result.filename}</span>
                    </div>
                    <div className="result-item">
                      <span className="result-label">文件大小:</span>
                      <span className="result-value">
                        {state.result.size < 1024 * 1024
                          ? `${Math.round(state.result.size / 1024)}KB`
                          : `${Math.round(state.result.size / 1024 / 1024 * 100) / 100}MB`
                        }
                      </span>
                    </div>
                    <div className="result-item">
                      <span className="result-label">导出时间:</span>
                      <span className="result-value">{Math.round(state.result.exportTime)}ms</span>
                    </div>
                    <div className="result-item">
                      <span className="result-label">格式:</span>
                      <span className="result-value">{state.config.format.toUpperCase()}</span>
                    </div>
                  </div>
                )}

                <div className="complete-actions">
                  <button
                    onClick={() => setState(prev => ({ ...prev, currentStep: 'config' }))}
                    className="export-again-button"
                  >
                    再次导出
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 底部操作栏 */}
        <div className="dialog-footer">
          <div className="footer-info">
            {state.currentStep === 'config' && <span>选择导出格式和参数</span>}
            {state.currentStep === 'preview' && <span>确认导出预览</span>}
            {state.currentStep === 'progress' && <span>正在处理导出请求</span>}
            {state.currentStep === 'complete' && <span>文件已保存到下载文件夹</span>}
          </div>

          <div className="footer-actions">
            {state.currentStep !== 'progress' && (
              <button onClick={handleClose} className="cancel-button">
                {state.currentStep === 'complete' ? '关闭' : '取消'}
              </button>
            )}

            {state.currentStep === 'config' && (
              <>
                {(state.config.format === 'png' || state.config.format === 'svg') && (
                  <button onClick={generatePreview} className="preview-button">
                    预览
                  </button>
                )}
                <button onClick={handleExport} className="export-button">
                  导出
                </button>
              </>
            )}

            {state.currentStep === 'preview' && (
              <>
                <button
                  onClick={() => setState(prev => ({ ...prev, currentStep: 'config' }))}
                  className="back-button"
                >
                  返回配置
                </button>
                <button onClick={handleExport} className="export-button">
                  确认导出
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default EnhancedExportDialog
