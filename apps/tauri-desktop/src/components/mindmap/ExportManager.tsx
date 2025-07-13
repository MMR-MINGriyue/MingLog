/**
 * 导出管理器组件
 * 提供批量导出、导出历史和快速导出功能
 */

import React, { useState, useCallback, useEffect } from 'react'
import { MindMapData, ExportConfig, exportManager } from '@minglog/mindmap'
import { appCore } from '../../core/AppCore'

interface ExportManagerProps {
  /** 是否显示管理器 */
  visible: boolean
  /** 关闭回调 */
  onClose: () => void
  /** 思维导图数据 */
  mindMapData: MindMapData
  /** 自定义类名 */
  className?: string
}

interface ExportHistory {
  id: string
  filename: string
  format: ExportConfig['format']
  size: number
  exportTime: number
  timestamp: Date
  config: ExportConfig
}

interface BatchExportState {
  selectedFormats: ExportConfig['format'][]
  isExporting: boolean
  progress: number
  currentFormat: string
  results: any[]
  errors: string[]
}

// 快速导出预设
const quickExportPresets = [
  {
    name: '高质量PNG',
    icon: '🖼️',
    config: { format: 'png' as const, width: 1920, height: 1080, quality: 1, dpi: 300 }
  },
  {
    name: '标准PDF',
    icon: '📄',
    config: { format: 'pdf' as const, width: 1200, height: 800 }
  },
  {
    name: 'SVG矢量图',
    icon: '📐',
    config: { format: 'svg' as const, width: 1200, height: 800 }
  },
  {
    name: 'JSON备份',
    icon: '📊',
    config: { format: 'json' as const, includeMetadata: true }
  }
]

/**
 * 导出管理器组件
 */
export const ExportManager: React.FC<ExportManagerProps> = ({
  visible,
  onClose,
  mindMapData,
  className = ''
}) => {
  // 状态管理
  const [activeTab, setActiveTab] = useState<'quick' | 'batch' | 'history'>('quick')
  const [exportHistory, setExportHistory] = useState<ExportHistory[]>([])
  const [batchState, setBatchState] = useState<BatchExportState>({
    selectedFormats: [],
    isExporting: false,
    progress: 0,
    currentFormat: '',
    results: [],
    errors: []
  })

  // 加载导出历史
  useEffect(() => {
    if (visible) {
      loadExportHistory()
    }
  }, [visible])

  // 加载导出历史
  const loadExportHistory = useCallback(() => {
    try {
      const saved = localStorage.getItem('minglog-export-history')
      if (saved) {
        const history = JSON.parse(saved).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }))
        setExportHistory(history)
      }
    } catch (error) {
      console.warn('Failed to load export history:', error)
    }
  }, [])

  // 保存导出历史
  const saveExportHistory = useCallback((newEntry: ExportHistory) => {
    const updatedHistory = [newEntry, ...exportHistory].slice(0, 50) // 保留最近50条
    setExportHistory(updatedHistory)
    
    try {
      localStorage.setItem('minglog-export-history', JSON.stringify(updatedHistory))
    } catch (error) {
      console.warn('Failed to save export history:', error)
    }
  }, [exportHistory])

  // 快速导出
  const handleQuickExport = useCallback(async (preset: typeof quickExportPresets[0]) => {
    try {
      const config: ExportConfig = {
        backgroundColor: '#ffffff',
        includeMetadata: true,
        ...preset.config
      }

      const result = await exportManager.export(mindMapData, config)
      await exportManager.downloadResult(result)

      // 保存到历史记录
      const historyEntry: ExportHistory = {
        id: Date.now().toString(),
        filename: result.filename,
        format: config.format,
        size: result.size,
        exportTime: result.exportTime,
        timestamp: new Date(),
        config
      }
      saveExportHistory(historyEntry)

      // 发送事件
      if (appCore.isInitialized()) {
        const eventBus = appCore.getEventBus()
        eventBus?.emit('mindmap:export:quick-export', {
          preset: preset.name,
          format: config.format,
          size: result.size
        }, 'ExportManager')
      }

    } catch (error) {
      console.error('快速导出失败:', error)
    }
  }, [mindMapData, saveExportHistory])

  // 批量导出
  const handleBatchExport = useCallback(async () => {
    if (batchState.selectedFormats.length === 0) return

    try {
      setBatchState(prev => ({
        ...prev,
        isExporting: true,
        progress: 0,
        results: [],
        errors: []
      }))

      const configs: ExportConfig[] = batchState.selectedFormats.map(format => ({
        format,
        width: 1200,
        height: 800,
        backgroundColor: '#ffffff',
        includeMetadata: true,
        quality: format === 'png' ? 1 : undefined,
        dpi: format === 'png' ? 300 : undefined
      }))

      const results = []
      const errors = []

      for (let i = 0; i < configs.length; i++) {
        const config = configs[i]
        
        setBatchState(prev => ({
          ...prev,
          currentFormat: config.format.toUpperCase(),
          progress: (i / configs.length) * 100
        }))

        try {
          const result = await exportManager.export(mindMapData, config)
          await exportManager.downloadResult(result)
          results.push(result)

          // 保存到历史记录
          const historyEntry: ExportHistory = {
            id: `${Date.now()}-${i}`,
            filename: result.filename,
            format: config.format,
            size: result.size,
            exportTime: result.exportTime,
            timestamp: new Date(),
            config
          }
          saveExportHistory(historyEntry)

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : '导出失败'
          errors.push(`${config.format.toUpperCase()}: ${errorMessage}`)
        }
      }

      setBatchState(prev => ({
        ...prev,
        isExporting: false,
        progress: 100,
        results,
        errors
      }))

      // 发送事件
      if (appCore.isInitialized()) {
        const eventBus = appCore.getEventBus()
        eventBus?.emit('mindmap:export:batch-export', {
          formats: batchState.selectedFormats,
          successCount: results.length,
          errorCount: errors.length
        }, 'ExportManager')
      }

    } catch (error) {
      setBatchState(prev => ({
        ...prev,
        isExporting: false,
        errors: ['批量导出失败: ' + (error instanceof Error ? error.message : '未知错误')]
      }))
    }
  }, [batchState.selectedFormats, mindMapData, saveExportHistory])

  // 切换格式选择
  const toggleFormatSelection = useCallback((format: ExportConfig['format']) => {
    setBatchState(prev => ({
      ...prev,
      selectedFormats: prev.selectedFormats.includes(format)
        ? prev.selectedFormats.filter(f => f !== format)
        : [...prev.selectedFormats, format]
    }))
  }, [])

  // 清除历史记录
  const clearHistory = useCallback(() => {
    setExportHistory([])
    localStorage.removeItem('minglog-export-history')
  }, [])

  // 重新导出历史项目
  const reExport = useCallback(async (historyItem: ExportHistory) => {
    try {
      const result = await exportManager.export(mindMapData, historyItem.config)
      await exportManager.downloadResult(result)

      // 更新历史记录
      const newEntry: ExportHistory = {
        ...historyItem,
        id: Date.now().toString(),
        timestamp: new Date(),
        size: result.size,
        exportTime: result.exportTime,
        filename: result.filename
      }
      saveExportHistory(newEntry)

    } catch (error) {
      console.error('重新导出失败:', error)
    }
  }, [mindMapData, saveExportHistory])

  if (!visible) return null

  return (
    <div className={`export-manager ${className}`}>
      {/* 遮罩层 */}
      <div className="export-manager-overlay" onClick={onClose} />
      
      {/* 主面板 */}
      <div className="export-manager-panel">
        {/* 标题栏 */}
        <div className="manager-header">
          <h2 className="manager-title">📤 导出管理器</h2>
          <button onClick={onClose} className="close-button" title="关闭">
            ✕
          </button>
        </div>

        {/* 标签页导航 */}
        <div className="manager-tabs">
          {[
            { key: 'quick', label: '快速导出', icon: '⚡' },
            { key: 'batch', label: '批量导出', icon: '📦' },
            { key: 'history', label: '导出历史', icon: '📋' }
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

        {/* 内容区域 */}
        <div className="manager-content">
          {/* 快速导出 */}
          {activeTab === 'quick' && (
            <div className="quick-export-tab">
              <div className="tab-description">
                选择预设配置，一键快速导出思维导图
              </div>
              
              <div className="quick-presets">
                {quickExportPresets.map(preset => (
                  <button
                    key={preset.name}
                    className="quick-preset"
                    onClick={() => handleQuickExport(preset)}
                  >
                    <span className="preset-icon">{preset.icon}</span>
                    <div className="preset-info">
                      <div className="preset-name">{preset.name}</div>
                      <div className="preset-details">
                        {preset.config.format.toUpperCase()}
                        {preset.config.width && ` • ${preset.config.width}×${preset.config.height}`}
                        {preset.config.dpi && ` • ${preset.config.dpi}DPI`}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 批量导出 */}
          {activeTab === 'batch' && (
            <div className="batch-export-tab">
              <div className="tab-description">
                选择多种格式，一次性批量导出
              </div>

              {!batchState.isExporting ? (
                <>
                  <div className="format-selection">
                    <h3 className="selection-title">选择导出格式</h3>
                    <div className="format-checkboxes">
                      {(['png', 'svg', 'pdf', 'json'] as const).map(format => (
                        <label key={format} className="format-checkbox">
                          <input
                            type="checkbox"
                            checked={batchState.selectedFormats.includes(format)}
                            onChange={() => toggleFormatSelection(format)}
                          />
                          <span className="checkbox-label">
                            {format.toUpperCase()}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="batch-actions">
                    <button
                      onClick={handleBatchExport}
                      disabled={batchState.selectedFormats.length === 0}
                      className="batch-export-button"
                    >
                      导出 {batchState.selectedFormats.length} 种格式
                    </button>
                  </div>
                </>
              ) : (
                <div className="batch-progress">
                  <div className="progress-info">
                    <div className="progress-text">
                      正在导出 {batchState.currentFormat}...
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${batchState.progress}%` }}
                      />
                    </div>
                    <div className="progress-percentage">
                      {Math.round(batchState.progress)}%
                    </div>
                  </div>
                </div>
              )}

              {/* 批量导出结果 */}
              {(batchState.results.length > 0 || batchState.errors.length > 0) && (
                <div className="batch-results">
                  {batchState.results.length > 0 && (
                    <div className="success-results">
                      <h4>✅ 导出成功 ({batchState.results.length})</h4>
                      {batchState.results.map((result, index) => (
                        <div key={index} className="result-item">
                          {result.filename}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {batchState.errors.length > 0 && (
                    <div className="error-results">
                      <h4>❌ 导出失败 ({batchState.errors.length})</h4>
                      {batchState.errors.map((error, index) => (
                        <div key={index} className="error-item">
                          {error}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* 导出历史 */}
          {activeTab === 'history' && (
            <div className="history-tab">
              <div className="history-header">
                <div className="tab-description">
                  查看和管理导出历史记录
                </div>
                {exportHistory.length > 0 && (
                  <button onClick={clearHistory} className="clear-history-button">
                    清除历史
                  </button>
                )}
              </div>

              {exportHistory.length === 0 ? (
                <div className="empty-history">
                  <span className="empty-icon">📭</span>
                  <span className="empty-message">暂无导出历史</span>
                </div>
              ) : (
                <div className="history-list">
                  {exportHistory.map(item => (
                    <div key={item.id} className="history-item">
                      <div className="history-info">
                        <div className="history-filename">{item.filename}</div>
                        <div className="history-details">
                          {item.format.toUpperCase()} • 
                          {item.size < 1024 * 1024 
                            ? ` ${Math.round(item.size / 1024)}KB`
                            : ` ${Math.round(item.size / 1024 / 1024 * 100) / 100}MB`
                          } • 
                          {item.timestamp.toLocaleString()}
                        </div>
                      </div>
                      <button
                        onClick={() => reExport(item)}
                        className="re-export-button"
                        title="重新导出"
                      >
                        🔄
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ExportManager
