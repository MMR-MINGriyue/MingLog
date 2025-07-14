/**
 * 过滤器预设管理组件
 * 
 * 功能：
 * - 过滤器预设的保存和加载
 * - 预设的编辑和删除
 * - 系统预设和用户预设
 * - 预设的导入导出
 */

import React, { useState, useCallback } from 'react'
import { cn } from '../../../utils/classNames'
import { useTheme } from '../../../contexts/ThemeContext'
import { FilterPreset, AdvancedSearchFilters } from './types'

export interface FilterPresetsProps {
  /** 预设列表 */
  presets: FilterPreset[]
  /** 当前过滤器 */
  currentFilters: AdvancedSearchFilters
  /** 保存预设回调 */
  onSavePreset: (name: string, description?: string) => void
  /** 加载预设回调 */
  onLoadPreset: (presetId: string) => void
  /** 删除预设回调 */
  onDeletePreset: (presetId: string) => void
  /** 是否显示 */
  visible: boolean
  /** 关闭回调 */
  onClose: () => void
  /** 自定义样式类名 */
  className?: string
}

export const FilterPresets: React.FC<FilterPresetsProps> = ({
  presets,
  currentFilters,
  onSavePreset,
  onLoadPreset,
  onDeletePreset,
  visible,
  onClose,
  className
}) => {
  const { theme } = useTheme()
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [presetDescription, setPresetDescription] = useState('')
  const [editingPreset, setEditingPreset] = useState<FilterPreset | null>(null)

  // 保存新预设
  const handleSavePreset = useCallback(() => {
    if (!presetName.trim()) return
    
    onSavePreset(presetName.trim(), presetDescription.trim() || undefined)
    setPresetName('')
    setPresetDescription('')
    setShowSaveDialog(false)
  }, [presetName, presetDescription, onSavePreset])

  // 加载预设
  const handleLoadPreset = useCallback((preset: FilterPreset) => {
    onLoadPreset(preset.id)
    onClose()
  }, [onLoadPreset, onClose])

  // 删除预设
  const handleDeletePreset = useCallback((preset: FilterPreset) => {
    if (window.confirm(`确定要删除预设 "${preset.name}" 吗？`)) {
      onDeletePreset(preset.id)
    }
  }, [onDeletePreset])

  // 导出预设
  const handleExportPresets = useCallback(() => {
    const userPresets = presets.filter(p => !p.isSystem)
    const exportData = {
      version: '1.0',
      presets: userPresets,
      exportedAt: new Date().toISOString()
    }
    
    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = `search-presets-${Date.now()}.json`
    link.click()
    
    URL.revokeObjectURL(url)
  }, [presets])

  // 导入预设
  const handleImportPresets = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string)
        if (importData.presets && Array.isArray(importData.presets)) {
          importData.presets.forEach((preset: FilterPreset) => {
            onSavePreset(preset.name, preset.description)
          })
          alert(`成功导入 ${importData.presets.length} 个预设`)
        }
      } catch (error) {
        alert('导入失败：文件格式不正确')
      }
    }
    reader.readAsText(file)
    
    // 清除文件选择
    event.target.value = ''
  }, [onSavePreset])

  // 获取预设摘要
  const getPresetSummary = useCallback((preset: FilterPreset) => {
    const filters = preset.filters
    const parts: string[] = []
    
    if (filters.query) {
      parts.push(`关键词: "${filters.query}"`)
    }
    
    if (filters.contentTypes) {
      const selectedTypes = filters.contentTypes.filter(t => t.selected).map(t => t.label)
      if (selectedTypes.length > 0 && selectedTypes.length < filters.contentTypes.length) {
        parts.push(`类型: ${selectedTypes.join(', ')}`)
      }
    }
    
    if (filters.tags && filters.tags.length > 0) {
      parts.push(`标签: ${filters.tags.length}个`)
    }
    
    if (filters.dateRange?.created || filters.dateRange?.modified) {
      parts.push('日期过滤')
    }
    
    if (filters.favoritesOnly) {
      parts.push('仅收藏')
    }
    
    return parts.length > 0 ? parts.join(' | ') : '无特定过滤条件'
  }, [])

  if (!visible) return null

  return (
    <div className={cn(
      'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50',
      className
    )}>
      <div className={cn(
        'w-full max-w-2xl max-h-[80vh] bg-white rounded-lg shadow-xl overflow-hidden',
        theme === 'dark' && 'bg-gray-800'
      )}>
        {/* 头部 */}
        <div className={cn(
          'flex items-center justify-between p-6 border-b border-gray-200',
          theme === 'dark' && 'border-gray-700'
        )}>
          <h2 className={cn(
            'text-xl font-semibold text-gray-900',
            theme === 'dark' && 'text-gray-100'
          )}>
            搜索预设管理
          </h2>
          <div className="flex items-center gap-2">
            {/* 导入导出按钮 */}
            <label className={cn(
              'px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md cursor-pointer',
              'hover:bg-gray-200 transition-colors',
              theme === 'dark' && 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            )}>
              导入
              <input
                type="file"
                accept=".json"
                onChange={handleImportPresets}
                className="hidden"
              />
            </label>
            <button
              onClick={handleExportPresets}
              className={cn(
                'px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md',
                'hover:bg-gray-200 transition-colors',
                theme === 'dark' && 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              )}
            >
              导出
            </button>
            <button
              onClick={onClose}
              className={cn(
                'p-2 text-gray-400 hover:text-gray-600 rounded-md',
                'hover:bg-gray-100 transition-colors',
                theme === 'dark' && 'hover:text-gray-300 hover:bg-gray-700'
              )}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* 保存当前过滤器 */}
          <div className={cn(
            'mb-6 p-4 border border-gray-200 rounded-lg',
            theme === 'dark' && 'border-gray-700'
          )}>
            <h3 className={cn(
              'text-lg font-medium text-gray-900 mb-3',
              theme === 'dark' && 'text-gray-100'
            )}>
              保存当前过滤器
            </h3>
            <div className={cn(
              'text-sm text-gray-600 mb-3',
              theme === 'dark' && 'text-gray-400'
            )}>
              {getPresetSummary({ filters: currentFilters } as FilterPreset)}
            </div>
            <button
              onClick={() => setShowSaveDialog(true)}
              className={cn(
                'px-4 py-2 bg-blue-600 text-white rounded-md',
                'hover:bg-blue-700 transition-colors'
              )}
            >
              保存为预设
            </button>
          </div>

          {/* 预设列表 */}
          <div>
            <h3 className={cn(
              'text-lg font-medium text-gray-900 mb-4',
              theme === 'dark' && 'text-gray-100'
            )}>
              已保存的预设
            </h3>
            
            {presets.length === 0 ? (
              <div className={cn(
                'text-center py-8 text-gray-500',
                theme === 'dark' && 'text-gray-400'
              )}>
                <svg className="w-12 h-12 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p>暂无保存的预设</p>
              </div>
            ) : (
              <div className="space-y-3">
                {presets.map((preset) => (
                  <div
                    key={preset.id}
                    className={cn(
                      'p-4 border border-gray-200 rounded-lg',
                      theme === 'dark' && 'border-gray-700'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className={cn(
                            'text-base font-medium text-gray-900',
                            theme === 'dark' && 'text-gray-100'
                          )}>
                            {preset.name}
                          </h4>
                          {preset.isSystem && (
                            <span className={cn(
                              'px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full',
                              theme === 'dark' && 'bg-blue-900/50 text-blue-300'
                            )}>
                              系统
                            </span>
                          )}
                        </div>
                        {preset.description && (
                          <p className={cn(
                            'text-sm text-gray-600 mb-2',
                            theme === 'dark' && 'text-gray-400'
                          )}>
                            {preset.description}
                          </p>
                        )}
                        <div className={cn(
                          'text-xs text-gray-500 mb-2',
                          theme === 'dark' && 'text-gray-500'
                        )}>
                          {getPresetSummary(preset)}
                        </div>
                        <div className={cn(
                          'text-xs text-gray-400',
                          theme === 'dark' && 'text-gray-500'
                        )}>
                          创建于 {new Date(preset.createdAt).toLocaleDateString()} | 使用 {preset.usageCount} 次
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleLoadPreset(preset)}
                          className={cn(
                            'px-3 py-1.5 text-sm bg-blue-100 text-blue-800 rounded-md',
                            'hover:bg-blue-200 transition-colors',
                            theme === 'dark' && 'bg-blue-900/50 text-blue-300 hover:bg-blue-900/70'
                          )}
                        >
                          应用
                        </button>
                        {!preset.isSystem && (
                          <button
                            onClick={() => handleDeletePreset(preset)}
                            className={cn(
                              'px-3 py-1.5 text-sm bg-red-100 text-red-800 rounded-md',
                              'hover:bg-red-200 transition-colors',
                              theme === 'dark' && 'bg-red-900/50 text-red-300 hover:bg-red-900/70'
                            )}
                          >
                            删除
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 保存对话框 */}
        {showSaveDialog && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <div className={cn(
              'w-full max-w-md bg-white rounded-lg p-6',
              theme === 'dark' && 'bg-gray-800'
            )}>
              <h3 className={cn(
                'text-lg font-medium text-gray-900 mb-4',
                theme === 'dark' && 'text-gray-100'
              )}>
                保存搜索预设
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className={cn(
                    'block text-sm font-medium text-gray-700 mb-2',
                    theme === 'dark' && 'text-gray-300'
                  )}>
                    预设名称 *
                  </label>
                  <input
                    type="text"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                    placeholder="输入预设名称"
                    className={cn(
                      'block w-full px-3 py-2 border border-gray-300 rounded-md',
                      'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                      theme === 'dark' && 'bg-gray-700 border-gray-600 text-white'
                    )}
                  />
                </div>
                
                <div>
                  <label className={cn(
                    'block text-sm font-medium text-gray-700 mb-2',
                    theme === 'dark' && 'text-gray-300'
                  )}>
                    描述（可选）
                  </label>
                  <textarea
                    value={presetDescription}
                    onChange={(e) => setPresetDescription(e.target.value)}
                    placeholder="输入预设描述"
                    rows={3}
                    className={cn(
                      'block w-full px-3 py-2 border border-gray-300 rounded-md',
                      'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                      theme === 'dark' && 'bg-gray-700 border-gray-600 text-white'
                    )}
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowSaveDialog(false)}
                  className={cn(
                    'px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md',
                    'hover:bg-gray-50 transition-colors',
                    theme === 'dark' && 'text-gray-300 border-gray-600 hover:bg-gray-700'
                  )}
                >
                  取消
                </button>
                <button
                  onClick={handleSavePreset}
                  disabled={!presetName.trim()}
                  className={cn(
                    'px-4 py-2 text-sm bg-blue-600 text-white rounded-md',
                    'hover:bg-blue-700 transition-colors',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FilterPresets
