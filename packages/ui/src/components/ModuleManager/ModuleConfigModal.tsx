/**
 * 模块配置模态框
 * 提供模块设置的编辑界面
 */

import React, { useState, useEffect } from 'react'
import { ModuleConfig, SettingItem } from '@minglog/core'
import { X, Save, RotateCcw, Download, Upload, AlertCircle, CheckCircle } from 'lucide-react'
import { clsx } from 'clsx'

interface ModuleConfigModalProps {
  moduleId: string
  module: ModuleConfig
  settings?: SettingItem[]
  currentValues?: Record<string, any>
  onSave: (settings: Record<string, any>) => Promise<void>
  onClose: () => void
}

export const ModuleConfigModal: React.FC<ModuleConfigModalProps> = ({
  moduleId,
  module,
  settings = [],
  currentValues = {},
  onSave,
  onClose
}) => {
  const [formValues, setFormValues] = useState<Record<string, any>>(currentValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  // 按分类组织设置
  const settingsByCategory = settings.reduce((acc, setting) => {
    const category = setting.category || '通用'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(setting)
    return acc
  }, {} as Record<string, SettingItem[]>)

  // 检查是否有变更
  useEffect(() => {
    const changed = Object.keys(formValues).some(key => 
      formValues[key] !== currentValues[key]
    )
    setHasChanges(changed)
  }, [formValues, currentValues])

  // 处理值变更
  const handleValueChange = (key: string, value: any) => {
    setFormValues(prev => ({ ...prev, [key]: value }))
    
    // 清除该字段的错误
    if (errors[key]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[key]
        return newErrors
      })
    }
  }

  // 验证设置
  const validateSettings = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    for (const setting of settings) {
      const value = formValues[setting.key]
      
      // 检查必填项
      if (setting.validation && value === undefined) {
        newErrors[setting.key] = '此项为必填项'
        continue
      }
      
      // 自定义验证
      if (setting.validation && value !== undefined) {
        const result = setting.validation(value)
        if (result !== true) {
          newErrors[setting.key] = typeof result === 'string' ? result : '验证失败'
        }
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // 保存设置
  const handleSave = async () => {
    if (!validateSettings()) {
      return
    }
    
    setSaving(true)
    try {
      await onSave(formValues)
      onClose()
    } catch (error) {
      console.error('Failed to save settings:', error)
      // TODO: 显示错误通知
    } finally {
      setSaving(false)
    }
  }

  // 重置设置
  const handleReset = () => {
    const defaultValues: Record<string, any> = {}
    settings.forEach(setting => {
      if (setting.defaultValue !== undefined) {
        defaultValues[setting.key] = setting.defaultValue
      }
    })
    setFormValues(defaultValues)
    setErrors({})
  }

  // 导出设置
  const handleExport = () => {
    const exportData = {
      moduleId,
      moduleName: module.name,
      version: module.version,
      timestamp: new Date().toISOString(),
      settings: formValues
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    })
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${moduleId}-settings.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // 导入设置
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        if (data.moduleId === moduleId && data.settings) {
          setFormValues(data.settings)
        } else {
          // TODO: 显示错误通知
          console.error('Invalid import file')
        }
      } catch (error) {
        console.error('Failed to parse import file:', error)
      }
    }
    reader.readAsText(file)
  }

  // 渲染设置项
  const renderSettingItem = (setting: SettingItem) => {
    const value = formValues[setting.key] ?? setting.defaultValue
    const error = errors[setting.key]
    
    return (
      <div key={setting.key} className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {setting.label}
          {setting.validation && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </label>
        
        {setting.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {setting.description}
          </p>
        )}
        
        <div className="space-y-1">
          {renderSettingInput(setting, value)}
          
          {error && (
            <div className="flex items-center space-x-1 text-red-600 text-xs">
              <AlertCircle className="w-3 h-3" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  // 渲染设置输入控件
  const renderSettingInput = (setting: SettingItem, value: any) => {
    const baseInputClass = clsx(
      'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm',
      'bg-white dark:bg-gray-700 text-gray-900 dark:text-white',
      'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
      errors[setting.key] && 'border-red-500 dark:border-red-500'
    )
    
    switch (setting.type) {
      case 'boolean':
        return (
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => handleValueChange(setting.key, e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              启用此选项
            </span>
          </label>
        )
        
      case 'string':
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleValueChange(setting.key, e.target.value)}
            className={baseInputClass}
            placeholder={`请输入${setting.label}`}
          />
        )
        
      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => handleValueChange(setting.key, Number(e.target.value))}
            className={baseInputClass}
            placeholder={`请输入${setting.label}`}
          />
        )
        
      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => handleValueChange(setting.key, e.target.value)}
            className={baseInputClass}
          >
            <option value="">请选择...</option>
            {setting.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )
        
      case 'multiselect':
        return (
          <div className="space-y-2">
            {setting.options?.map(option => (
              <label key={option.value} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={(value || []).includes(option.value)}
                  onChange={(e) => {
                    const currentValues = value || []
                    const newValues = e.target.checked
                      ? [...currentValues, option.value]
                      : currentValues.filter((v: any) => v !== option.value)
                    handleValueChange(setting.key, newValues)
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        )
        
      case 'color':
        return (
          <div className="flex items-center space-x-2">
            <input
              type="color"
              value={value || '#000000'}
              onChange={(e) => handleValueChange(setting.key, e.target.value)}
              className="w-12 h-8 border border-gray-300 dark:border-gray-600 rounded cursor-pointer"
            />
            <input
              type="text"
              value={value || ''}
              onChange={(e) => handleValueChange(setting.key, e.target.value)}
              className={clsx(baseInputClass, 'flex-1')}
              placeholder="#000000"
            />
          </div>
        )
        
      case 'file':
        return (
          <div className="space-y-2">
            <input
              type="text"
              value={value || ''}
              onChange={(e) => handleValueChange(setting.key, e.target.value)}
              className={baseInputClass}
              placeholder="文件路径"
            />
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  handleValueChange(setting.key, file.name)
                }
              }}
              className="text-sm text-gray-500 dark:text-gray-400"
            />
          </div>
        )
        
      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleValueChange(setting.key, e.target.value)}
            className={baseInputClass}
          />
        )
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* 模态框头部 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {module.name} - 模块配置
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              v{module.version}
            </p>
          </div>
          
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* 工具栏 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              重置
            </button>
            
            <button
              type="button"
              onClick={handleExport}
              className="inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-1" />
              导出
            </button>
            
            <label className="inline-flex items-center px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
              <Upload className="w-4 h-4 mr-1" />
              导入
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
            </label>
          </div>
          
          {hasChanges && (
            <div className="flex items-center space-x-1 text-amber-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>有未保存的更改</span>
            </div>
          )}
        </div>

        {/* 设置内容 */}
        <div className="flex-1 overflow-y-auto p-6">
          {settings.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                此模块暂无可配置的设置项
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(settingsByCategory).map(([category, categorySettings]) => (
                <div key={category}>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                    {category}
                  </h3>
                  <div className="space-y-6">
                    {categorySettings.map(renderSettingItem)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 模态框底部 */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            取消
          </button>
          
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || Object.keys(errors).length > 0}
            className={clsx(
              'inline-flex items-center px-4 py-2 text-sm rounded-md transition-colors',
              'bg-blue-600 hover:bg-blue-700 text-white',
              'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500',
              (saving || Object.keys(errors).length > 0) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                保存中...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                保存设置
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
