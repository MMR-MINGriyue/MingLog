/**
 * 增强版导出对话框组件
 * 提供完整的导出配置界面，支持多格式、批量导出和模板
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { cn } from '../../utils'
import {
  EnhancedExportService,
  EnhancedExportConfig,
  ExportItem,
  ExportTemplate,
  ExportFormat,
  ExportScope,
  ExportQuality,
  ExportProgress,
  ExportResult
} from '../../services/EnhancedExportService'
import './EnhancedExportDialog.css'

// 导出对话框属性
export interface EnhancedExportDialogProps {
  /** 导出服务 */
  exportService: EnhancedExportService
  /** 要导出的项目 */
  items: ExportItem[]
  /** 是否显示对话框 */
  visible: boolean
  /** 默认配置 */
  defaultConfig?: Partial<EnhancedExportConfig>
  /** 是否启用批量导出 */
  enableBatchExport?: boolean
  /** 是否显示模板选择 */
  showTemplates?: boolean
  /** 是否显示预览 */
  showPreview?: boolean
  /** 自定义样式类名 */
  className?: string
  /** 关闭对话框回调 */
  onClose: () => void
  /** 导出开始回调 */
  onExportStart?: (operationId: string, config: EnhancedExportConfig) => void
  /** 导出完成回调 */
  onExportComplete?: (result: ExportResult) => void
  /** 导出失败回调 */
  onExportError?: (error: string) => void
}

/**
 * 增强版导出对话框组件
 */
export const EnhancedExportDialog: React.FC<EnhancedExportDialogProps> = ({
  exportService,
  items,
  visible,
  defaultConfig = {},
  enableBatchExport = true,
  showTemplates = true,
  showPreview = true,
  className,
  onClose,
  onExportStart,
  onExportComplete,
  onExportError
}) => {
  // 状态管理
  const [currentStep, setCurrentStep] = useState<'config' | 'preview' | 'progress' | 'complete'>('config')
  const [exportConfig, setExportConfig] = useState<EnhancedExportConfig>({
    format: 'pdf',
    scope: 'selected',
    quality: 'standard',
    includeMetadata: true,
    includeImages: true,
    includeLinks: true,
    includeAttachments: false,
    includeComments: false,
    includeVersionHistory: false,
    ...defaultConfig
  })

  // UI状态
  const [selectedTemplate, setSelectedTemplate] = useState<ExportTemplate | null>(null)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [batchConfigs, setBatchConfigs] = useState<EnhancedExportConfig[]>([])
  const [previewData, setPreviewData] = useState<any>(null)
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false)

  // 导出状态
  const [activeOperations, setActiveOperations] = useState<Map<string, ExportProgress>>(new Map())
  const [exportResults, setExportResults] = useState<ExportResult[]>([])
  const [exportError, setExportError] = useState<string>('')

  // 获取支持的格式
  const supportedFormats = useMemo(() => exportService.getSupportedFormats(), [exportService])

  // 获取导出模板
  const [exportTemplates, setExportTemplates] = useState<ExportTemplate[]>([])

  // 加载模板
  useEffect(() => {
    if (showTemplates) {
      const templates = exportService.getExportTemplates()
      setExportTemplates(templates)
    }
  }, [exportService, showTemplates])

  // 监听导出进度
  useEffect(() => {
    const handleProgress = (event: any) => {
      const { operationId, progress } = event
      setActiveOperations(prev => new Map(prev.set(operationId, progress)))
    }

    const handleComplete = (event: any) => {
      const { operationId, result } = event
      setExportResults(prev => [...prev, result])
      setActiveOperations(prev => {
        const newMap = new Map(prev)
        newMap.delete(operationId)
        return newMap
      })
      
      if (result.success) {
        setCurrentStep('complete')
        onExportComplete?.(result)
      } else {
        setExportError(result.errors[0]?.error || '导出失败')
        onExportError?.(result.errors[0]?.error || '导出失败')
      }
    }

    const handleFailed = (event: any) => {
      const { operationId, error } = event
      setActiveOperations(prev => {
        const newMap = new Map(prev)
        newMap.delete(operationId)
        return newMap
      })
      setExportError(error.message || '导出失败')
      onExportError?.(error.message || '导出失败')
    }

    exportService.eventBus.on('export:progress', handleProgress)
    exportService.eventBus.on('export:completed', handleComplete)
    exportService.eventBus.on('export:failed', handleFailed)

    return () => {
      exportService.eventBus.off('export:progress', handleProgress)
      exportService.eventBus.off('export:completed', handleComplete)
      exportService.eventBus.off('export:failed', handleFailed)
    }
  }, [exportService, onExportComplete, onExportError])

  // 处理配置变更
  const handleConfigChange = useCallback((updates: Partial<EnhancedExportConfig>) => {
    setExportConfig(prev => ({ ...prev, ...updates }))
  }, [])

  // 处理模板选择
  const handleTemplateSelect = useCallback((template: ExportTemplate | null) => {
    setSelectedTemplate(template)
    if (template) {
      setExportConfig(template.config)
    }
  }, [])

  // 添加批量导出配置
  const handleAddBatchConfig = useCallback(() => {
    setBatchConfigs(prev => [...prev, { ...exportConfig }])
  }, [exportConfig])

  // 移除批量导出配置
  const handleRemoveBatchConfig = useCallback((index: number) => {
    setBatchConfigs(prev => prev.filter((_, i) => i !== index))
  }, [])

  // 生成预览
  const handleGeneratePreview = useCallback(async () => {
    if (!showPreview) return

    setIsGeneratingPreview(true)
    try {
      // 这里应该调用预览生成逻辑
      // 简化实现
      await new Promise(resolve => setTimeout(resolve, 1000))
      setPreviewData({
        itemCount: items.length,
        estimatedSize: items.length * 1024,
        format: exportConfig.format
      })
      setCurrentStep('preview')
    } catch (error) {
      setExportError(error instanceof Error ? error.message : '预览生成失败')
    } finally {
      setIsGeneratingPreview(false)
    }
  }, [items, exportConfig, showPreview])

  // 执行导出
  const handleExport = useCallback(async () => {
    try {
      setExportError('')
      setCurrentStep('progress')

      if (enableBatchExport && batchConfigs.length > 0) {
        // 批量导出
        const results = await exportService.exportMultipleFormats(items, batchConfigs)
        setExportResults(results)
        
        if (results.every(r => r.success)) {
          setCurrentStep('complete')
        } else {
          const failedResults = results.filter(r => !r.success)
          setExportError(`${failedResults.length} 个导出失败`)
        }
      } else {
        // 单个导出
        const result = await exportService.exportData(items, exportConfig)
        onExportStart?.(result.operationId, exportConfig)
      }
    } catch (error) {
      setExportError(error instanceof Error ? error.message : '导出失败')
      onExportError?.(error instanceof Error ? error.message : '导出失败')
    }
  }, [items, exportConfig, batchConfigs, enableBatchExport, exportService, onExportStart, onExportError])

  // 重置对话框
  const handleReset = useCallback(() => {
    setCurrentStep('config')
    setSelectedTemplate(null)
    setBatchConfigs([])
    setPreviewData(null)
    setActiveOperations(new Map())
    setExportResults([])
    setExportError('')
  }, [])

  // 关闭对话框
  const handleClose = useCallback(() => {
    handleReset()
    onClose()
  }, [handleReset, onClose])

  if (!visible) return null

  return (
    <div className={cn('enhanced-export-dialog-overlay', className)}>
      <div className="enhanced-export-dialog">
        {/* 标题栏 */}
        <div className="dialog-header">
          <div className="header-content">
            <h2 className="dialog-title">📤 导出数据</h2>
            <div className="step-indicator">
              <div className={cn('step', currentStep === 'config' && 'active')}>配置</div>
              {showPreview && <div className={cn('step', currentStep === 'preview' && 'active')}>预览</div>}
              <div className={cn('step', currentStep === 'progress' && 'active')}>导出</div>
              <div className={cn('step', currentStep === 'complete' && 'active')}>完成</div>
            </div>
          </div>
          <button className="close-button" onClick={handleClose}>✕</button>
        </div>

        {/* 主要内容 */}
        <div className="dialog-content">
          {currentStep === 'config' && (
            <div className="config-step">
              {/* 基本配置 */}
              <div className="config-section">
                <h3 className="section-title">基本设置</h3>
                
                <div className="config-grid">
                  {/* 导出格式 */}
                  <div className="config-field">
                    <label className="config-label">导出格式</label>
                    <div className="format-selector">
                      {supportedFormats.map(format => (
                        <button
                          key={format.format}
                          className={cn(
                            'format-option',
                            exportConfig.format === format.format && 'selected'
                          )}
                          onClick={() => handleConfigChange({ format: format.format })}
                        >
                          <div className="format-icon">
                            {format.format === 'pdf' && '📄'}
                            {format.format === 'markdown' && '📝'}
                            {format.format === 'html' && '🌐'}
                            {format.format === 'json' && '📋'}
                            {format.format === 'xlsx' && '📊'}
                            {format.format === 'docx' && '📄'}
                            {format.format === 'zip' && '📦'}
                          </div>
                          <div className="format-info">
                            <div className="format-name">{format.name}</div>
                            <div className="format-description">{format.description}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 导出范围 */}
                  <div className="config-field">
                    <label className="config-label">导出范围</label>
                    <select
                      value={exportConfig.scope}
                      onChange={(e) => handleConfigChange({ scope: e.target.value as ExportScope })}
                      className="config-select"
                    >
                      <option value="selected">选中项目 ({items.length})</option>
                      <option value="all">全部项目</option>
                      <option value="current">当前项目</option>
                      <option value="module">按模块</option>
                      <option value="custom">自定义</option>
                    </select>
                  </div>

                  {/* 导出质量 */}
                  <div className="config-field">
                    <label className="config-label">导出质量</label>
                    <select
                      value={exportConfig.quality}
                      onChange={(e) => handleConfigChange({ quality: e.target.value as ExportQuality })}
                      className="config-select"
                    >
                      <option value="draft">草稿 (快速)</option>
                      <option value="standard">标准 (平衡)</option>
                      <option value="high">高质量 (慢速)</option>
                      <option value="print">打印质量 (最慢)</option>
                    </select>
                  </div>

                  {/* 文件名 */}
                  <div className="config-field">
                    <label className="config-label">文件名</label>
                    <input
                      type="text"
                      value={exportConfig.filename || ''}
                      onChange={(e) => handleConfigChange({ filename: e.target.value })}
                      placeholder="留空使用默认名称"
                      className="config-input"
                    />
                  </div>
                </div>
              </div>

              {/* 内容选项 */}
              <div className="config-section">
                <h3 className="section-title">包含内容</h3>
                
                <div className="checkbox-grid">
                  <label className="checkbox-field">
                    <input
                      type="checkbox"
                      checked={exportConfig.includeMetadata}
                      onChange={(e) => handleConfigChange({ includeMetadata: e.target.checked })}
                    />
                    <span>元数据</span>
                  </label>

                  <label className="checkbox-field">
                    <input
                      type="checkbox"
                      checked={exportConfig.includeImages}
                      onChange={(e) => handleConfigChange({ includeImages: e.target.checked })}
                    />
                    <span>图片</span>
                  </label>

                  <label className="checkbox-field">
                    <input
                      type="checkbox"
                      checked={exportConfig.includeLinks}
                      onChange={(e) => handleConfigChange({ includeLinks: e.target.checked })}
                    />
                    <span>链接</span>
                  </label>

                  <label className="checkbox-field">
                    <input
                      type="checkbox"
                      checked={exportConfig.includeAttachments}
                      onChange={(e) => handleConfigChange({ includeAttachments: e.target.checked })}
                    />
                    <span>附件</span>
                  </label>

                  <label className="checkbox-field">
                    <input
                      type="checkbox"
                      checked={exportConfig.includeComments}
                      onChange={(e) => handleConfigChange({ includeComments: e.target.checked })}
                    />
                    <span>评论</span>
                  </label>

                  <label className="checkbox-field">
                    <input
                      type="checkbox"
                      checked={exportConfig.includeVersionHistory}
                      onChange={(e) => handleConfigChange({ includeVersionHistory: e.target.checked })}
                    />
                    <span>版本历史</span>
                  </label>
                </div>
              </div>

              {/* 模板选择 */}
              {showTemplates && exportTemplates.length > 0 && (
                <div className="config-section">
                  <h3 className="section-title">导出模板</h3>
                  
                  <div className="template-selector">
                    <button
                      className={cn('template-option', !selectedTemplate && 'selected')}
                      onClick={() => handleTemplateSelect(null)}
                    >
                      <div className="template-info">
                        <div className="template-name">自定义配置</div>
                        <div className="template-description">手动配置导出选项</div>
                      </div>
                    </button>

                    {exportTemplates.map(template => (
                      <button
                        key={template.id}
                        className={cn(
                          'template-option',
                          selectedTemplate?.id === template.id && 'selected'
                        )}
                        onClick={() => handleTemplateSelect(template)}
                      >
                        <div className="template-info">
                          <div className="template-name">{template.name}</div>
                          <div className="template-description">{template.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 高级选项 */}
              <div className="config-section">
                <button
                  className="advanced-toggle"
                  onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                >
                  {showAdvancedOptions ? '▼' : '▶'} 高级选项
                </button>

                {showAdvancedOptions && (
                  <div className="advanced-options">
                    {/* 日期范围 */}
                    <div className="config-field">
                      <label className="config-label">日期范围</label>
                      <div className="date-range">
                        <input
                          type="date"
                          value={exportConfig.dateRange?.from?.toISOString().split('T')[0] || ''}
                          onChange={(e) => {
                            const from = e.target.value ? new Date(e.target.value) : undefined
                            handleConfigChange({
                              dateRange: { ...exportConfig.dateRange, from }
                            })
                          }}
                          className="config-input"
                        />
                        <span>至</span>
                        <input
                          type="date"
                          value={exportConfig.dateRange?.to?.toISOString().split('T')[0] || ''}
                          onChange={(e) => {
                            const to = e.target.value ? new Date(e.target.value) : undefined
                            handleConfigChange({
                              dateRange: { ...exportConfig.dateRange, to }
                            })
                          }}
                          className="config-input"
                        />
                      </div>
                    </div>

                    {/* 标签过滤 */}
                    <div className="config-field">
                      <label className="config-label">标签过滤</label>
                      <input
                        type="text"
                        value={exportConfig.tags?.join(', ') || ''}
                        onChange={(e) => {
                          const tags = e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                          handleConfigChange({ tags: tags.length > 0 ? tags : undefined })
                        }}
                        placeholder="输入标签，用逗号分隔"
                        className="config-input"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 批量导出 */}
              {enableBatchExport && (
                <div className="config-section">
                  <h3 className="section-title">批量导出</h3>
                  
                  <div className="batch-export">
                    <button
                      className="add-batch-btn"
                      onClick={handleAddBatchConfig}
                    >
                      ➕ 添加当前配置到批量导出
                    </button>

                    {batchConfigs.length > 0 && (
                      <div className="batch-list">
                        {batchConfigs.map((config, index) => (
                          <div key={index} className="batch-item">
                            <div className="batch-info">
                              <span className="batch-format">{config.format.toUpperCase()}</span>
                              <span className="batch-quality">{config.quality}</span>
                            </div>
                            <button
                              className="remove-batch-btn"
                              onClick={() => handleRemoveBatchConfig(index)}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 'preview' && showPreview && (
            <div className="preview-step">
              <h3 className="section-title">导出预览</h3>
              
              {previewData && (
                <div className="preview-content">
                  <div className="preview-stats">
                    <div className="stat-item">
                      <span className="stat-label">项目数量:</span>
                      <span className="stat-value">{previewData.itemCount}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">预估大小:</span>
                      <span className="stat-value">{(previewData.estimatedSize / 1024).toFixed(1)} KB</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">导出格式:</span>
                      <span className="stat-value">{previewData.format.toUpperCase()}</span>
                    </div>
                  </div>

                  <div className="preview-text">
                    <p>即将导出 {previewData.itemCount} 个项目为 {previewData.format.toUpperCase()} 格式。</p>
                    <p>预估文件大小约为 {(previewData.estimatedSize / 1024).toFixed(1)} KB。</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 'progress' && (
            <div className="progress-step">
              <h3 className="section-title">导出进度</h3>
              
              {Array.from(activeOperations.values()).map(progress => (
                <div key={progress.operationId} className="progress-item">
                  <div className="progress-header">
                    <span className="progress-stage">{progress.currentStep}</span>
                    <span className="progress-percentage">{progress.progress.toFixed(1)}%</span>
                  </div>
                  
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${progress.progress}%` }}
                    />
                  </div>
                  
                  <div className="progress-details">
                    <span>已处理: {progress.processedItems} / {progress.totalItems}</span>
                    {progress.estimatedTimeRemaining && (
                      <span>预计剩余: {Math.ceil(progress.estimatedTimeRemaining / 1000)}秒</span>
                    )}
                  </div>

                  {progress.errors.length > 0 && (
                    <div className="progress-errors">
                      <h4>错误:</h4>
                      {progress.errors.map((error, index) => (
                        <div key={index} className="error-item">
                          {error.item}: {error.error}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {activeOperations.size === 0 && exportResults.length === 0 && (
                <div className="progress-waiting">
                  <div className="spinner" />
                  <span>准备导出...</span>
                </div>
              )}
            </div>
          )}

          {currentStep === 'complete' && (
            <div className="complete-step">
              <h3 className="section-title">导出完成</h3>
              
              <div className="results-list">
                {exportResults.map((result, index) => (
                  <div key={index} className={cn('result-item', result.success ? 'success' : 'failed')}>
                    <div className="result-header">
                      <span className="result-status">
                        {result.success ? '✅' : '❌'}
                      </span>
                      <span className="result-filename">{result.filename}</span>
                      <span className="result-size">
                        {(result.fileSize / 1024).toFixed(1)} KB
                      </span>
                    </div>
                    
                    {result.success ? (
                      <div className="result-stats">
                        <span>导出 {result.exportedItems} 个项目</span>
                        <span>用时 {(result.duration / 1000).toFixed(1)} 秒</span>
                      </div>
                    ) : (
                      <div className="result-errors">
                        {result.errors.map((error, errorIndex) => (
                          <div key={errorIndex} className="error-message">
                            {error.error}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 错误显示 */}
          {exportError && (
            <div className="error-section">
              <div className="error-content">
                <span className="error-icon">⚠️</span>
                <span className="error-message">{exportError}</span>
                <button
                  className="error-dismiss"
                  onClick={() => setExportError('')}
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="dialog-actions">
          {currentStep === 'config' && (
            <>
              <button className="action-btn secondary" onClick={handleClose}>
                取消
              </button>
              {showPreview ? (
                <button 
                  className="action-btn primary" 
                  onClick={handleGeneratePreview}
                  disabled={isGeneratingPreview}
                >
                  {isGeneratingPreview ? '生成预览中...' : '预览'}
                </button>
              ) : (
                <button className="action-btn primary" onClick={handleExport}>
                  开始导出
                </button>
              )}
            </>
          )}

          {currentStep === 'preview' && (
            <>
              <button 
                className="action-btn secondary" 
                onClick={() => setCurrentStep('config')}
              >
                返回配置
              </button>
              <button className="action-btn primary" onClick={handleExport}>
                开始导出
              </button>
            </>
          )}

          {currentStep === 'progress' && (
            <button 
              className="action-btn secondary"
              onClick={() => {
                // 取消导出逻辑
                Array.from(activeOperations.keys()).forEach(operationId => {
                  exportService.cancelExport(operationId)
                })
              }}
            >
              取消导出
            </button>
          )}

          {currentStep === 'complete' && (
            <>
              <button className="action-btn secondary" onClick={handleReset}>
                重新导出
              </button>
              <button className="action-btn primary" onClick={handleClose}>
                完成
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default EnhancedExportDialog
