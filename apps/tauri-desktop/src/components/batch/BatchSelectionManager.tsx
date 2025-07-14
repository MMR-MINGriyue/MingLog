/**
 * 批量选择管理器组件
 * 提供统一的批量选择和操作界面
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { 
  CheckSquare, 
  Square, 
  Minus, 
  MoreHorizontal, 
  Filter, 
  Search,
  X,
  Play,
  Eye,
  Download,
  Tag,
  Trash2,
  Move,
  Copy,
  Archive
} from 'lucide-react'
import { 
  BatchOperationItem,
  BatchOperationConfig,
  BatchOperationType,
  BatchOperationResult,
  BatchOperationProgress
} from '../../packages/core/src/services/BatchOperationService'
import { EntityType } from '../../packages/core/src/services/DataAssociationService'

interface BatchSelectionManagerProps {
  /** 可选择的项目列表 */
  items: BatchOperationItem[]
  /** 实体类型 */
  entityType: EntityType
  /** 可用的批量操作 */
  availableOperations: BatchOperationConfig[]
  /** 选择变更回调 */
  onSelectionChange: (selectedItems: BatchOperationItem[]) => void
  /** 执行操作回调 */
  onExecuteOperation: (operation: BatchOperationConfig, items: BatchOperationItem[]) => Promise<string>
  /** 预览操作回调 */
  onPreviewOperation: (operation: BatchOperationConfig, items: BatchOperationItem[]) => Promise<string>
  /** 获取操作进度回调 */
  onGetProgress: (operationId: string) => BatchOperationProgress | null
  /** 取消操作回调 */
  onCancelOperation: (operationId: string) => Promise<boolean>
  /** 是否显示选择工具栏 */
  showSelectionToolbar?: boolean
  /** 最大选择数量 */
  maxSelection?: number
  /** 类名 */
  className?: string
}

type SelectionMode = 'none' | 'some' | 'all'

export const BatchSelectionManager: React.FC<BatchSelectionManagerProps> = ({
  items,
  entityType,
  availableOperations,
  onSelectionChange,
  onExecuteOperation,
  onPreviewOperation,
  onGetProgress,
  onCancelOperation,
  showSelectionToolbar = true,
  maxSelection,
  className = ''
}) => {
  // 状态管理
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('none')
  const [searchText, setSearchText] = useState('')
  const [filterTags, setFilterTags] = useState<string[]>([])
  const [showOperationPanel, setShowOperationPanel] = useState(false)
  const [selectedOperation, setSelectedOperation] = useState<BatchOperationConfig | null>(null)
  const [operationParams, setOperationParams] = useState<Record<string, any>>({})
  const [previewText, setPreviewText] = useState('')
  const [currentOperationId, setCurrentOperationId] = useState<string | null>(null)
  const [operationProgress, setOperationProgress] = useState<BatchOperationProgress | null>(null)

  // 过滤后的项目列表
  const filteredItems = useMemo(() => {
    let filtered = items

    // 文本搜索过滤
    if (searchText) {
      const lowerSearchText = searchText.toLowerCase()
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(lowerSearchText) ||
        item.content?.toLowerCase().includes(lowerSearchText)
      )
    }

    // 标签过滤
    if (filterTags.length > 0) {
      filtered = filtered.filter(item =>
        filterTags.some(tag => 
          item.metadata?.tags?.includes(tag)
        )
      )
    }

    return filtered
  }, [items, searchText, filterTags])

  // 选中的项目列表
  const selectedItemsList = useMemo(() => {
    return filteredItems.filter(item => selectedItems.has(item.id))
  }, [filteredItems, selectedItems])

  // 更新选择模式
  useEffect(() => {
    const selectedCount = selectedItems.size
    const totalCount = filteredItems.length

    if (selectedCount === 0) {
      setSelectionMode('none')
    } else if (selectedCount === totalCount) {
      setSelectionMode('all')
    } else {
      setSelectionMode('some')
    }
  }, [selectedItems, filteredItems])

  // 通知选择变更
  useEffect(() => {
    onSelectionChange(selectedItemsList)
  }, [selectedItemsList, onSelectionChange])

  // 轮询操作进度
  useEffect(() => {
    if (!currentOperationId) return

    const interval = setInterval(() => {
      const progress = onGetProgress(currentOperationId)
      setOperationProgress(progress)

      if (progress && (
        progress.status === 'completed' || 
        progress.status === 'failed' || 
        progress.status === 'cancelled'
      )) {
        setCurrentOperationId(null)
        setOperationProgress(null)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [currentOperationId, onGetProgress])

  // 处理全选/取消全选
  const handleSelectAll = useCallback(() => {
    if (selectionMode === 'all') {
      setSelectedItems(new Set())
    } else {
      const newSelection = new Set(filteredItems.map(item => item.id))
      
      // 检查最大选择数量限制
      if (maxSelection && newSelection.size > maxSelection) {
        alert(`最多只能选择 ${maxSelection} 个项目`)
        return
      }
      
      setSelectedItems(newSelection)
    }
  }, [selectionMode, filteredItems, maxSelection])

  // 处理单项选择
  const handleItemSelect = useCallback((itemId: string, selected: boolean) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      
      if (selected) {
        // 检查最大选择数量限制
        if (maxSelection && newSet.size >= maxSelection) {
          alert(`最多只能选择 ${maxSelection} 个项目`)
          return prev
        }
        newSet.add(itemId)
      } else {
        newSet.delete(itemId)
      }
      
      return newSet
    })
  }, [maxSelection])

  // 处理范围选择
  const handleRangeSelect = useCallback((startIndex: number, endIndex: number) => {
    const start = Math.min(startIndex, endIndex)
    const end = Math.max(startIndex, endIndex)
    const rangeItems = filteredItems.slice(start, end + 1)
    
    // 检查最大选择数量限制
    if (maxSelection && selectedItems.size + rangeItems.length > maxSelection) {
      alert(`最多只能选择 ${maxSelection} 个项目`)
      return
    }
    
    setSelectedItems(prev => {
      const newSet = new Set(prev)
      rangeItems.forEach(item => newSet.add(item.id))
      return newSet
    })
  }, [filteredItems, selectedItems, maxSelection])

  // 清除选择
  const handleClearSelection = useCallback(() => {
    setSelectedItems(new Set())
  }, [])

  // 反选
  const handleInvertSelection = useCallback(() => {
    const newSelection = new Set<string>()
    filteredItems.forEach(item => {
      if (!selectedItems.has(item.id)) {
        newSelection.add(item.id)
      }
    })
    
    // 检查最大选择数量限制
    if (maxSelection && newSelection.size > maxSelection) {
      alert(`最多只能选择 ${maxSelection} 个项目`)
      return
    }
    
    setSelectedItems(newSelection)
  }, [filteredItems, selectedItems, maxSelection])

  // 处理操作选择
  const handleOperationSelect = useCallback((operation: BatchOperationConfig) => {
    setSelectedOperation(operation)
    setOperationParams(operation.params || {})
    setPreviewText('')
  }, [])

  // 预览操作
  const handlePreviewOperation = useCallback(async () => {
    if (!selectedOperation || selectedItemsList.length === 0) return

    try {
      const preview = await onPreviewOperation(selectedOperation, selectedItemsList)
      setPreviewText(preview)
    } catch (error) {
      console.error('预览操作失败:', error)
      setPreviewText('预览失败: ' + (error instanceof Error ? error.message : '未知错误'))
    }
  }, [selectedOperation, selectedItemsList, onPreviewOperation])

  // 执行操作
  const handleExecuteOperation = useCallback(async () => {
    if (!selectedOperation || selectedItemsList.length === 0) return

    try {
      const operationConfig = {
        ...selectedOperation,
        params: operationParams
      }
      
      const operationId = await onExecuteOperation(operationConfig, selectedItemsList)
      setCurrentOperationId(operationId)
      setShowOperationPanel(false)
      
      // 清除选择
      setSelectedItems(new Set())
    } catch (error) {
      console.error('执行操作失败:', error)
      alert('执行操作失败: ' + (error instanceof Error ? error.message : '未知错误'))
    }
  }, [selectedOperation, selectedItemsList, operationParams, onExecuteOperation])

  // 取消操作
  const handleCancelOperation = useCallback(async () => {
    if (!currentOperationId) return

    try {
      await onCancelOperation(currentOperationId)
      setCurrentOperationId(null)
      setOperationProgress(null)
    } catch (error) {
      console.error('取消操作失败:', error)
    }
  }, [currentOperationId, onCancelOperation])

  // 获取操作图标
  const getOperationIcon = (type: BatchOperationType) => {
    switch (type) {
      case BatchOperationType.DELETE:
        return <Trash2 size={16} />
      case BatchOperationType.TAG:
        return <Tag size={16} />
      case BatchOperationType.EXPORT:
        return <Download size={16} />
      case BatchOperationType.MOVE:
        return <Move size={16} />
      case BatchOperationType.COPY:
        return <Copy size={16} />
      case BatchOperationType.ARCHIVE:
        return <Archive size={16} />
      default:
        return <MoreHorizontal size={16} />
    }
  }

  return (
    <div className={`batch-selection-manager ${className}`}>
      {/* 选择工具栏 */}
      {showSelectionToolbar && (
        <div className="selection-toolbar">
          <div className="selection-controls">
            <button
              onClick={handleSelectAll}
              className="select-all-button"
              title={selectionMode === 'all' ? '取消全选' : '全选'}
            >
              {selectionMode === 'all' ? (
                <CheckSquare size={16} />
              ) : selectionMode === 'some' ? (
                <Minus size={16} />
              ) : (
                <Square size={16} />
              )}
              <span>
                {selectionMode === 'all' ? '取消全选' : '全选'}
                {filteredItems.length > 0 && ` (${filteredItems.length})`}
              </span>
            </button>

            {selectedItems.size > 0 && (
              <>
                <span className="selection-count">
                  已选择 {selectedItems.size} 个项目
                  {maxSelection && ` / ${maxSelection}`}
                </span>
                
                <button
                  onClick={handleInvertSelection}
                  className="invert-selection-button"
                  title="反选"
                >
                  反选
                </button>
                
                <button
                  onClick={handleClearSelection}
                  className="clear-selection-button"
                  title="清除选择"
                >
                  <X size={16} />
                  清除
                </button>
              </>
            )}
          </div>

          <div className="selection-actions">
            {/* 搜索框 */}
            <div className="search-box">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="搜索项目..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="search-input"
              />
            </div>

            {/* 批量操作按钮 */}
            {selectedItems.size > 0 && (
              <button
                onClick={() => setShowOperationPanel(true)}
                className="batch-operations-button"
              >
                <MoreHorizontal size={16} />
                批量操作
              </button>
            )}
          </div>
        </div>
      )}

      {/* 操作进度 */}
      {operationProgress && (
        <div className="operation-progress">
          <div className="progress-header">
            <span className="progress-title">正在执行批量操作...</span>
            <button
              onClick={handleCancelOperation}
              className="cancel-operation-button"
              title="取消操作"
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${operationProgress.percentage}%` }}
            />
          </div>
          
          <div className="progress-details">
            <span>{operationProgress.currentItem} / {operationProgress.totalItems}</span>
            <span>{operationProgress.percentage}%</span>
          </div>
          
          {operationProgress.message && (
            <div className="progress-message">{operationProgress.message}</div>
          )}
        </div>
      )}

      {/* 批量操作面板 */}
      {showOperationPanel && (
        <div className="operation-panel-overlay">
          <div className="operation-panel">
            <div className="panel-header">
              <h3>批量操作</h3>
              <button
                onClick={() => setShowOperationPanel(false)}
                className="close-panel-button"
              >
                <X size={16} />
              </button>
            </div>

            <div className="panel-content">
              <div className="selected-items-summary">
                <p>已选择 {selectedItemsList.length} 个项目</p>
              </div>

              <div className="operations-grid">
                {availableOperations.map(operation => (
                  <button
                    key={operation.id}
                    onClick={() => handleOperationSelect(operation)}
                    className={`operation-card ${selectedOperation?.id === operation.id ? 'selected' : ''}`}
                  >
                    <div className="operation-icon">
                      {getOperationIcon(operation.type)}
                    </div>
                    <div className="operation-info">
                      <div className="operation-name">{operation.name}</div>
                      <div className="operation-description">{operation.description}</div>
                    </div>
                  </button>
                ))}
              </div>

              {selectedOperation && (
                <div className="operation-config">
                  <h4>操作配置</h4>
                  
                  {/* 动态参数配置 */}
                  {Object.entries(selectedOperation.params || {}).map(([key, defaultValue]) => (
                    <div key={key} className="param-field">
                      <label>{key}</label>
                      <input
                        type="text"
                        value={operationParams[key] || defaultValue || ''}
                        onChange={(e) => setOperationParams(prev => ({
                          ...prev,
                          [key]: e.target.value
                        }))}
                        placeholder={`输入 ${key}`}
                      />
                    </div>
                  ))}

                  {/* 预览按钮 */}
                  <button
                    onClick={handlePreviewOperation}
                    className="preview-button"
                  >
                    <Eye size={16} />
                    预览操作
                  </button>

                  {/* 预览结果 */}
                  {previewText && (
                    <div className="preview-result">
                      <h5>操作预览</h5>
                      <pre>{previewText}</pre>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="panel-actions">
              <button
                onClick={() => setShowOperationPanel(false)}
                className="cancel-button"
              >
                取消
              </button>
              
              <button
                onClick={handleExecuteOperation}
                className="execute-button"
                disabled={!selectedOperation || selectedItemsList.length === 0}
              >
                <Play size={16} />
                执行操作
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BatchSelectionManager
