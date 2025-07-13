/**
 * 增强版批量操作面板组件
 * 完善操作类型、错误处理、进度显示和撤销功能
 */

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { cn } from '../../utils'
import { BatchOperationService, BatchOperationResult, BatchOperationStatus } from '../../services/BatchOperationService'

// 增强的批量操作项目
export interface EnhancedBatchItem {
  id: string
  title: string
  type: 'page' | 'block' | 'file' | 'note' | 'task' | 'mindmap'
  entityType: string
  selected?: boolean
  path?: string
  size?: number
  lastModified?: Date | string
  metadata?: Record<string, any>
  permissions?: {
    canRead: boolean
    canWrite: boolean
    canDelete: boolean
  }
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'skipped'
  error?: string
}

// 增强的批量操作配置
export interface EnhancedBatchOperation {
  id: string
  name: string
  description: string
  icon: string
  category: 'basic' | 'advanced' | 'maintenance' | 'export'
  requiresConfirmation?: boolean
  supportedTypes?: string[]
  permissions?: string[]
  estimatedTime?: number // 预估执行时间（秒）
  riskLevel?: 'low' | 'medium' | 'high'
  canUndo?: boolean
  batchSize?: number
  maxConcurrency?: number
  params?: Array<{
    name: string
    label: string
    type: 'text' | 'number' | 'boolean' | 'select' | 'multiselect'
    required?: boolean
    default?: any
    options?: Array<{ value: any; label: string }>
    validation?: (value: any) => string | null
  }>
}

// 操作历史记录
export interface OperationHistory {
  id: string
  operationId: string
  operationName: string
  timestamp: Date
  itemCount: number
  result: BatchOperationResult
  canUndo: boolean
  undoData?: any
}

// 增强的批量操作面板属性
export interface EnhancedBatchOperationsPanelProps {
  /** 批量操作服务 */
  batchOperationService: BatchOperationService
  /** 可操作的项目列表 */
  items: EnhancedBatchItem[]
  /** 可用的操作列表 */
  operations: EnhancedBatchOperation[]
  /** 选中的项目ID列表 */
  selectedItems: string[]
  /** 是否显示高级选项 */
  showAdvancedOptions?: boolean
  /** 是否启用操作历史 */
  enableHistory?: boolean
  /** 是否启用撤销功能 */
  enableUndo?: boolean
  /** 是否启用实时进度 */
  enableRealTimeProgress?: boolean
  /** 是否启用权限检查 */
  enablePermissionCheck?: boolean
  /** 最大并发操作数 */
  maxConcurrentOperations?: number
  /** 操作超时时间（毫秒） */
  operationTimeout?: number
  /** 自定义样式类名 */
  className?: string
  /** 选择变更回调 */
  onSelectionChange?: (selectedItems: string[]) => void
  /** 操作执行回调 */
  onOperationExecute?: (operationId: string, items: EnhancedBatchItem[], params?: any) => Promise<void>
  /** 操作完成回调 */
  onOperationComplete?: (result: BatchOperationResult) => void
  /** 操作错误回调 */
  onOperationError?: (error: string, operationId?: string) => void
  /** 取消回调 */
  onCancel?: () => void
  /** 撤销操作回调 */
  onUndo?: (historyId: string) => Promise<void>
}

/**
 * 增强版批量操作面板组件
 */
export const EnhancedBatchOperationsPanel: React.FC<EnhancedBatchOperationsPanelProps> = ({
  batchOperationService,
  items,
  operations,
  selectedItems,
  showAdvancedOptions = false,
  enableHistory = true,
  enableUndo = true,
  enableRealTimeProgress = true,
  enablePermissionCheck = true,
  maxConcurrentOperations = 3,
  operationTimeout = 300000, // 5分钟
  className,
  onSelectionChange,
  onOperationExecute,
  onOperationComplete,
  onOperationError,
  onCancel,
  onUndo
}) => {
  // 状态管理
  const [selectedOperation, setSelectedOperation] = useState<string>('')
  const [operationParams, setOperationParams] = useState<Record<string, any>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(showAdvancedOptions)
  const [currentProgress, setCurrentProgress] = useState<{
    operationId: string
    percentage: number
    currentItem: number
    totalItems: number
    message: string
    status: BatchOperationStatus
  } | null>(null)
  const [operationHistory, setOperationHistory] = useState<OperationHistory[]>([])
  const [errors, setErrors] = useState<Array<{ id: string; message: string }>>([])
  const [warnings, setWarnings] = useState<Array<{ id: string; message: string }>>([])
  const [estimatedTime, setEstimatedTime] = useState<number>(0)
  const [showPreview, setShowPreview] = useState(false)
  const [previewResult, setPreviewResult] = useState<string>('')

  // 引用
  const progressIntervalRef = useRef<NodeJS.Timeout>()
  const operationTimeoutRef = useRef<NodeJS.Timeout>()

  // 获取选中的项目
  const selectedItemsData = useMemo(() => {
    return items.filter(item => selectedItems.includes(item.id))
  }, [items, selectedItems])

  // 获取当前选中的操作
  const currentOperation = useMemo(() => {
    return operations.find(op => op.id === selectedOperation)
  }, [operations, selectedOperation])

  // 过滤可用的操作（基于权限和支持的类型）
  const availableOperations = useMemo(() => {
    if (selectedItemsData.length === 0) return []

    return operations.filter(operation => {
      // 检查支持的类型
      if (operation.supportedTypes && operation.supportedTypes.length > 0) {
        const hasUnsupportedType = selectedItemsData.some(item =>
          !operation.supportedTypes!.includes(item.type)
        )
        if (hasUnsupportedType) return false
      }

      // 检查权限
      if (enablePermissionCheck && operation.permissions) {
        const hasInsufficientPermissions = selectedItemsData.some(item => {
          if (!item.permissions) return true
          return operation.permissions!.some(permission => {
            switch (permission) {
              case 'read': return !item.permissions!.canRead
              case 'write': return !item.permissions!.canWrite
              case 'delete': return !item.permissions!.canDelete
              default: return false
            }
          })
        })
        if (hasInsufficientPermissions) return false
      }

      return true
    })
  }, [operations, selectedItemsData, enablePermissionCheck])

  // 按类别分组操作
  const operationsByCategory = useMemo(() => {
    const grouped: Record<string, EnhancedBatchOperation[]> = {}
    availableOperations.forEach(operation => {
      const category = operation.category || 'basic'
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(operation)
    })
    return grouped
  }, [availableOperations])

  // 计算预估时间
  useEffect(() => {
    if (currentOperation && selectedItemsData.length > 0) {
      const baseTime = currentOperation.estimatedTime || 1
      const totalTime = Math.ceil(baseTime * selectedItemsData.length / (currentOperation.maxConcurrency || 1))
      setEstimatedTime(totalTime)
    } else {
      setEstimatedTime(0)
    }
  }, [currentOperation, selectedItemsData.length])

  // 处理操作选择
  const handleOperationSelect = useCallback((operationId: string) => {
    setSelectedOperation(operationId)
    setOperationParams({})
    setErrors([])
    setWarnings([])

    // 设置默认参数
    const operation = operations.find(op => op.id === operationId)
    if (operation?.params) {
      const defaultParams: Record<string, any> = {}
      operation.params.forEach(param => {
        if (param.default !== undefined) {
          defaultParams[param.name] = param.default
        }
      })
      setOperationParams(defaultParams)
    }
  }, [operations])

  // 处理参数变更
  const handleParamChange = useCallback((paramName: string, value: any) => {
    setOperationParams(prev => ({
      ...prev,
      [paramName]: value
    }))
  }, [])

  // 验证参数
  const validateParams = useCallback(() => {
    if (!currentOperation?.params) return []

    const errors: string[] = []
    currentOperation.params.forEach(param => {
      const value = operationParams[param.name]

      // 检查必填参数
      if (param.required && (value === undefined || value === null || value === '')) {
        errors.push(`${param.label} 是必填项`)
        return
      }

      // 自定义验证
      if (param.validation && value !== undefined) {
        const validationError = param.validation(value)
        if (validationError) {
          errors.push(`${param.label}: ${validationError}`)
        }
      }
    })

    return errors
  }, [currentOperation, operationParams])

  // 预览操作
  const handlePreview = useCallback(async () => {
    if (!currentOperation || selectedItemsData.length === 0) return

    try {
      const preview = await batchOperationService.previewOperation(
        selectedItemsData.map(item => ({
          id: item.id,
          entityType: item.entityType,
          title: item.title,
          metadata: item.metadata || {}
        })),
        {
          id: currentOperation.id,
          name: currentOperation.name,
          description: currentOperation.description,
          type: currentOperation.id as any,
          entityTypes: [selectedItemsData[0]?.entityType || ''],
          params: operationParams,
          options: {
            batchSize: currentOperation.batchSize,
            parallel: (currentOperation.maxConcurrency || 1) > 1,
            validateBeforeExecute: true
          }
        }
      )

      setPreviewResult(preview)
      setShowPreview(true)
    } catch (error) {
      onOperationError?.(
        error instanceof Error ? error.message : '预览失败',
        currentOperation.id
      )
    }
  }, [currentOperation, selectedItemsData, operationParams, batchOperationService, onOperationError])

  // 执行操作
  const handleExecute = useCallback(async () => {
    if (!currentOperation || selectedItemsData.length === 0) return

    // 验证参数
    const paramErrors = validateParams()
    if (paramErrors.length > 0) {
      setErrors(paramErrors.map((msg, index) => ({ id: `param-${index}`, message: msg })))
      return
    }

    // 显示确认对话框（如果需要）
    if (currentOperation.requiresConfirmation) {
      setShowConfirmDialog(true)
      return
    }

    await executeOperation()
  }, [currentOperation, selectedItemsData, validateParams])

  // 实际执行操作
  const executeOperation = useCallback(async () => {
    if (!currentOperation) return

    setIsProcessing(true)
    setShowConfirmDialog(false)
    setErrors([])
    setWarnings([])

    try {
      // 设置超时
      if (operationTimeout > 0) {
        operationTimeoutRef.current = setTimeout(() => {
          onOperationError?.('操作超时', currentOperation.id)
          setIsProcessing(false)
        }, operationTimeout)
      }

      // 执行操作
      const operationId = await batchOperationService.executeOperation(
        selectedItemsData.map(item => ({
          id: item.id,
          entityType: item.entityType,
          title: item.title,
          metadata: item.metadata || {}
        })),
        {
          id: currentOperation.id,
          name: currentOperation.name,
          description: currentOperation.description,
          type: currentOperation.id as any,
          entityTypes: [selectedItemsData[0]?.entityType || ''],
          params: operationParams,
          options: {
            batchSize: currentOperation.batchSize || 10,
            parallel: (currentOperation.maxConcurrency || 1) > 1,
            validateBeforeExecute: true,
            createBackup: currentOperation.canUndo
          }
        }
      )

      // 开始监控进度
      if (enableRealTimeProgress) {
        startProgressMonitoring(operationId)
      }

      // 调用外部回调
      if (onOperationExecute) {
        await onOperationExecute(currentOperation.id, selectedItemsData, operationParams)
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '操作执行失败'
      setErrors([{ id: 'execution', message: errorMessage }])
      onOperationError?.(errorMessage, currentOperation.id)
      setIsProcessing(false)
    } finally {
      if (operationTimeoutRef.current) {
        clearTimeout(operationTimeoutRef.current)
      }
    }
  }, [
    currentOperation,
    selectedItemsData,
    operationParams,
    operationTimeout,
    enableRealTimeProgress,
    batchOperationService,
    onOperationExecute,
    onOperationError
  ])

  // 开始进度监控
  const startProgressMonitoring = useCallback((operationId: string) => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
    }

    progressIntervalRef.current = setInterval(async () => {
      try {
        const result = await batchOperationService.getOperationResult(operationId)
        if (result) {
          const percentage = Math.round((result.processedItems / result.totalItems) * 100)

          setCurrentProgress({
            operationId,
            percentage,
            currentItem: result.processedItems,
            totalItems: result.totalItems,
            message: result.summary || '正在处理...',
            status: result.status
          })

          // 检查是否完成
          if (result.status === BatchOperationStatus.COMPLETED ||
              result.status === BatchOperationStatus.FAILED ||
              result.status === BatchOperationStatus.CANCELLED) {

            clearInterval(progressIntervalRef.current!)
            setCurrentProgress(null)
            setIsProcessing(false)

            // 添加到历史记录
            if (enableHistory) {
              const historyEntry: OperationHistory = {
                id: `history-${Date.now()}`,
                operationId,
                operationName: currentOperation?.name || '',
                timestamp: new Date(),
                itemCount: selectedItemsData.length,
                result,
                canUndo: currentOperation?.canUndo || false
              }
              setOperationHistory(prev => [historyEntry, ...prev.slice(0, 9)]) // 保留最近10条
            }

            // 调用完成回调
            onOperationComplete?.(result)

            // 显示错误和警告
            if (result.errors.length > 0) {
              setErrors(result.errors.map(err => ({ id: err.itemId, message: err.error })))
            }
            if (result.warnings.length > 0) {
              setWarnings(result.warnings.map(warn => ({ id: warn.itemId, message: warn.message })))
            }
          }
        }
      } catch (error) {
        console.error('获取操作进度失败:', error)
      }
    }, 1000)
  }, [
    batchOperationService,
    currentOperation,
    selectedItemsData.length,
    enableHistory,
    onOperationComplete
  ])

  // 取消操作
  const handleCancel = useCallback(async () => {
    if (currentProgress) {
      try {
        await batchOperationService.cancelOperation(currentProgress.operationId)
      } catch (error) {
        console.error('取消操作失败:', error)
      }
    }

    setIsProcessing(false)
    setCurrentProgress(null)
    setShowConfirmDialog(false)

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
    }

    onCancel?.()
  }, [currentProgress, batchOperationService, onCancel])

  // 撤销操作
  const handleUndo = useCallback(async (historyId: string) => {
    if (!enableUndo || !onUndo) return

    try {
      await onUndo(historyId)

      // 从历史记录中移除
      setOperationHistory(prev => prev.filter(h => h.id !== historyId))
    } catch (error) {
      onOperationError?.(
        error instanceof Error ? error.message : '撤销操作失败'
      )
    }
  }, [enableUndo, onUndo, onOperationError])

  // 清理定时器
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
      }
      if (operationTimeoutRef.current) {
        clearTimeout(operationTimeoutRef.current)
      }
    }
  }, [])

  // 渲染操作类别
  const renderOperationCategory = (category: string, ops: EnhancedBatchOperation[]) => {
    const categoryNames = {
      basic: '基础操作',
      advanced: '高级操作',
      maintenance: '维护操作',
      export: '导出操作'
    }

    return (
      <div key={category} className="operation-category">
        <h4 className="category-title">{categoryNames[category as keyof typeof categoryNames] || category}</h4>
        <div className="operation-grid">
          {ops.map(operation => (
            <button
              key={operation.id}
              onClick={() => handleOperationSelect(operation.id)}
              className={cn(
                'operation-card',
                selectedOperation === operation.id && 'selected',
                operation.riskLevel === 'high' && 'high-risk',
                operation.riskLevel === 'medium' && 'medium-risk'
              )}
              disabled={isProcessing}
            >
              <div className="operation-icon">{operation.icon}</div>
              <div className="operation-info">
                <div className="operation-name">{operation.name}</div>
                <div className="operation-description">{operation.description}</div>
                {operation.estimatedTime && (
                  <div className="operation-time">
                    预计: {Math.ceil(operation.estimatedTime * selectedItemsData.length / (operation.maxConcurrency || 1))}秒
                  </div>
                )}
                {operation.riskLevel && operation.riskLevel !== 'low' && (
                  <div className={`risk-badge ${operation.riskLevel}`}>
                    {operation.riskLevel === 'high' ? '高风险' : '中风险'}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // 渲染参数配置
  const renderParameterConfig = () => {
    if (!currentOperation?.params || currentOperation.params.length === 0) {
      return null
    }

    return (
      <div className="parameter-config">
        <h4 className="config-title">操作参数</h4>
        <div className="parameter-grid">
          {currentOperation.params.map(param => (
            <div key={param.name} className="parameter-field">
              <label className="parameter-label">
                {param.label}
                {param.required && <span className="required">*</span>}
              </label>

              {param.type === 'text' && (
                <input
                  type="text"
                  value={operationParams[param.name] || ''}
                  onChange={(e) => handleParamChange(param.name, e.target.value)}
                  className="parameter-input"
                  placeholder={`请输入${param.label}`}
                />
              )}

              {param.type === 'number' && (
                <input
                  type="number"
                  value={operationParams[param.name] || ''}
                  onChange={(e) => handleParamChange(param.name, Number(e.target.value))}
                  className="parameter-input"
                  placeholder={`请输入${param.label}`}
                />
              )}

              {param.type === 'boolean' && (
                <label className="parameter-checkbox">
                  <input
                    type="checkbox"
                    checked={operationParams[param.name] || false}
                    onChange={(e) => handleParamChange(param.name, e.target.checked)}
                  />
                  <span className="checkbox-label">{param.label}</span>
                </label>
              )}

              {param.type === 'select' && param.options && (
                <select
                  value={operationParams[param.name] || ''}
                  onChange={(e) => handleParamChange(param.name, e.target.value)}
                  className="parameter-select"
                >
                  <option value="">请选择{param.label}</option>
                  {param.options.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}

              {param.type === 'multiselect' && param.options && (
                <div className="parameter-multiselect">
                  {param.options.map(option => (
                    <label key={option.value} className="multiselect-option">
                      <input
                        type="checkbox"
                        checked={(operationParams[param.name] || []).includes(option.value)}
                        onChange={(e) => {
                          const currentValues = operationParams[param.name] || []
                          const newValues = e.target.checked
                            ? [...currentValues, option.value]
                            : currentValues.filter((v: any) => v !== option.value)
                          handleParamChange(param.name, newValues)
                        }}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('enhanced-batch-operations-panel', className)} role="dialog" aria-label="批量操作面板">
      {/* 标题栏 */}
      <div className="panel-header">
        <div className="header-content">
          <h2 className="panel-title">📋 批量操作</h2>
          <div className="header-stats">
            <span className="selected-count">已选择 {selectedItems.length} 个项目</span>
            {estimatedTime > 0 && (
              <span className="estimated-time">预计耗时: {estimatedTime}秒</span>
            )}
          </div>
        </div>
        <div className="header-actions">
          {showAdvancedOptions && (
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={cn('toggle-advanced', showAdvanced && 'active')}
            >
              高级选项
            </button>
          )}
          <button onClick={onCancel} className="close-button" aria-label="关闭">
            ✕
          </button>
        </div>
      </div>

      {/* 错误和警告 */}
      {errors.length > 0 && (
        <div className="error-section">
          <h4 className="error-title">⚠️ 错误</h4>
          <div className="error-list">
            {errors.map(error => (
              <div key={error.id} className="error-item">
                <span className="error-message">{error.message}</span>
                <button
                  onClick={() => setErrors(prev => prev.filter(e => e.id !== error.id))}
                  className="error-dismiss"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="warning-section">
          <h4 className="warning-title">⚠️ 警告</h4>
          <div className="warning-list">
            {warnings.map(warning => (
              <div key={warning.id} className="warning-item">
                <span className="warning-message">{warning.message}</span>
                <button
                  onClick={() => setWarnings(prev => prev.filter(w => w.id !== warning.id))}
                  className="warning-dismiss"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 进度显示 */}
      {currentProgress && (
        <div className="progress-section">
          <div className="progress-header">
            <h4 className="progress-title">正在执行: {currentOperation?.name}</h4>
            <button onClick={handleCancel} className="cancel-button">
              取消
            </button>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${currentProgress.percentage}%` }}
            />
          </div>
          <div className="progress-details">
            <span className="progress-text">
              {currentProgress.currentItem} / {currentProgress.totalItems} ({currentProgress.percentage}%)
            </span>
            <span className="progress-message">{currentProgress.message}</span>
          </div>
        </div>
      )}

      {/* 主要内容 */}
      <div className="panel-content">
        {selectedItems.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-title">请选择要操作的项目</div>
            <div className="empty-description">选择一个或多个项目后，可以执行批量操作</div>
          </div>
        ) : (
          <>
            {/* 操作选择 */}
            <div className="operations-section">
              <h3 className="section-title">选择操作</h3>
              {Object.entries(operationsByCategory).map(([category, ops]) =>
                renderOperationCategory(category, ops)
              )}
            </div>

            {/* 参数配置 */}
            {selectedOperation && renderParameterConfig()}

            {/* 高级选项 */}
            {showAdvanced && currentOperation && (
              <div className="advanced-options">
                <h4 className="advanced-title">高级选项</h4>
                <div className="advanced-grid">
                  <div className="advanced-field">
                    <label>批处理大小</label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={currentOperation.batchSize || 10}
                      onChange={(e) => {
                        // 这里可以更新操作配置
                      }}
                      className="advanced-input"
                    />
                  </div>
                  <div className="advanced-field">
                    <label>最大并发数</label>
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={currentOperation.maxConcurrency || 1}
                      onChange={(e) => {
                        // 这里可以更新操作配置
                      }}
                      className="advanced-input"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 操作按钮 */}
            <div className="action-buttons">
              {selectedOperation && (
                <>
                  <button
                    onClick={handlePreview}
                    className="preview-button"
                    disabled={isProcessing}
                  >
                    预览操作
                  </button>
                  <button
                    onClick={handleExecute}
                    className={cn(
                      'execute-button',
                      currentOperation?.riskLevel === 'high' && 'high-risk',
                      currentOperation?.riskLevel === 'medium' && 'medium-risk'
                    )}
                    disabled={isProcessing || selectedItems.length === 0}
                  >
                    {isProcessing ? '执行中...' : `执行操作 (${selectedItems.length}项)`}
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* 操作历史 */}
      {enableHistory && operationHistory.length > 0 && (
        <div className="history-section">
          <h4 className="history-title">操作历史</h4>
          <div className="history-list">
            {operationHistory.slice(0, 5).map(history => (
              <div key={history.id} className="history-item">
                <div className="history-info">
                  <span className="history-operation">{history.operationName}</span>
                  <span className="history-time">
                    {history.timestamp.toLocaleString()}
                  </span>
                  <span className="history-count">{history.itemCount} 项</span>
                  <span className={`history-status ${history.result.status}`}>
                    {history.result.status === BatchOperationStatus.COMPLETED ? '成功' : '失败'}
                  </span>
                </div>
                {enableUndo && history.canUndo && (
                  <button
                    onClick={() => handleUndo(history.id)}
                    className="undo-button"
                    title="撤销此操作"
                  >
                    撤销
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 确认对话框 */}
      {showConfirmDialog && currentOperation && (
        <div className="confirm-overlay">
          <div className="confirm-dialog">
            <h3 className="confirm-title">确认操作</h3>
            <div className="confirm-content">
              <p>您即将执行 <strong>{currentOperation.name}</strong> 操作</p>
              <p>这将影响 <strong>{selectedItems.length}</strong> 个项目</p>
              {currentOperation.riskLevel === 'high' && (
                <div className="risk-warning">
                  ⚠️ 这是一个高风险操作，可能无法撤销
                </div>
              )}
              {estimatedTime > 60 && (
                <div className="time-warning">
                  ⏱️ 预计执行时间: {Math.ceil(estimatedTime / 60)} 分钟
                </div>
              )}
            </div>
            <div className="confirm-actions">
              <button onClick={() => setShowConfirmDialog(false)} className="cancel-confirm">
                取消
              </button>
              <button onClick={executeOperation} className="confirm-execute">
                确认执行
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 预览对话框 */}
      {showPreview && (
        <div className="preview-overlay">
          <div className="preview-dialog">
            <h3 className="preview-title">操作预览</h3>
            <div className="preview-content">
              <pre className="preview-text">{previewResult}</pre>
            </div>
            <div className="preview-actions">
              <button onClick={() => setShowPreview(false)} className="close-preview">
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default EnhancedBatchOperationsPanel