/**
 * BatchOperationsPanel 批量操作面板组件
 * 提供批量选择、操作执行、进度显示等功能
 */

import React, { useState, useCallback, useEffect } from 'react';

// 数据类型定义
export interface BatchItem {
  id: string;
  title: string;
  type: 'page' | 'block' | 'file';
  selected?: boolean;
  path?: string;
  size?: number;
  lastModified?: Date;
}

export interface BatchOperation {
  id: string;
  name: string;
  description: string;
  icon: string;
  requiresConfirmation?: boolean;
  supportedTypes?: string[];
}

export interface BatchOperationsPanelProps {
  items: BatchItem[];
  operations: BatchOperation[];
  selectedItems: string[];
  isLoading?: boolean;
  showProgress?: boolean;
  progress?: number;
  error?: string;
  readOnly?: boolean;
  showFilter?: boolean;
  showSearch?: boolean;
  showSort?: boolean;
  operationTimeout?: boolean;
  
  // 回调函数
  onSelectionChange: (selectedIds: string[]) => void;
  onOperationExecute: (operationId: string, selectedIds: string[]) => void;
  onOperationComplete?: (operationId: string, result: any) => void;
  onOperationError?: (operationId: string, error: string) => void;
  onCancel?: () => void;
  onRetry?: () => void;
  onErrorDismiss?: () => void;
  onSortChange?: (sortBy: string) => void;
}

export const BatchOperationsPanel: React.FC<BatchOperationsPanelProps> = ({
  items,
  operations,
  selectedItems,
  isLoading = false,
  showProgress = false,
  progress = 0,
  error,
  readOnly = false,
  showFilter = false,
  showSearch = false,
  showSort = false,
  operationTimeout = false,
  onSelectionChange,
  onOperationExecute,
  onOperationComplete,
  onOperationError,
  onCancel,
  onRetry,
  onErrorDismiss,
  onSortChange
}) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingOperation, setPendingOperation] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('name-asc');

  // 处理全选
  const handleSelectAll = useCallback(() => {
    const allIds = items.map(item => item.id);
    onSelectionChange(allIds);
  }, [items, onSelectionChange]);

  // 处理取消选择
  const handleClearSelection = useCallback(() => {
    onSelectionChange([]);
  }, [onSelectionChange]);

  // 处理单个项目选择
  const handleItemSelect = useCallback((itemId: string) => {
    const newSelection = selectedItems.includes(itemId)
      ? selectedItems.filter(id => id !== itemId)
      : [...selectedItems, itemId];
    onSelectionChange(newSelection);
  }, [selectedItems, onSelectionChange]);

  // 处理操作执行
  const handleOperationClick = useCallback((operationId: string) => {
    const operation = operations.find(op => op.id === operationId);
    if (!operation) return;

    if (operation.requiresConfirmation) {
      setPendingOperation(operationId);
      setShowConfirmDialog(true);
    } else {
      onOperationExecute(operationId, selectedItems);
    }
  }, [operations, selectedItems, onOperationExecute]);

  // 确认操作
  const handleConfirmOperation = useCallback(() => {
    if (pendingOperation) {
      onOperationExecute(pendingOperation, selectedItems);
      setShowConfirmDialog(false);
      setPendingOperation(null);
    }
  }, [pendingOperation, selectedItems, onOperationExecute]);

  // 取消操作
  const handleCancelOperation = useCallback(() => {
    setShowConfirmDialog(false);
    setPendingOperation(null);
  }, []);

  // 检查操作是否可用
  const isOperationAvailable = useCallback((operation: BatchOperation) => {
    if (selectedItems.length === 0) return false;
    if (isLoading) return false;
    if (readOnly) return false;

    if (operation.supportedTypes) {
      const selectedItemTypes = items
        .filter(item => selectedItems.includes(item.id))
        .map(item => item.type);
      
      return selectedItemTypes.some(type => operation.supportedTypes!.includes(type));
    }

    return true;
  }, [selectedItems, items, isLoading, readOnly]);

  // 获取项目类型图标
  const getItemIcon = (type: string) => {
    switch (type) {
      case 'page': return '📄';
      case 'block': return '🧩';
      case 'file': return '📄';
      default: return '📄';
    }
  };

  // 过滤和搜索项目
  const filteredItems = items.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || item.type === filterType;
    return matchesSearch && matchesFilter;
  });

  // 全选状态
  const isAllSelected = items.length > 0 && selectedItems.length === items.length;
  const isPartiallySelected = selectedItems.length > 0 && selectedItems.length < items.length;

  return (
    <div className="batch-operations-panel" role="region" aria-label="批量操作面板">
      {/* 标题和统计 */}
      <div className="panel-header">
        <h2 className="panel-title">📋 批量操作</h2>
        <p className="panel-description">选择项目进行批量操作</p>
        {selectedItems.length > 0 && (
          <div className="selection-stats" aria-live="polite">
            已选择 {selectedItems.length} 个项目
          </div>
        )}
      </div>

      {/* 错误消息 */}
      {error && (
        <div className="error-message">
          <span>⚠️ {error}</span>
          {onRetry && <button onClick={onRetry}>重试</button>}
          {onErrorDismiss && (
            <button onClick={onErrorDismiss} title="关闭错误消息">✕</button>
          )}
        </div>
      )}

      {/* 加载状态 */}
      {isLoading && (
        <div className="loading-state">
          正在处理...
        </div>
      )}

      {/* 操作超时 */}
      {operationTimeout && (
        <div className="timeout-message">
          <span>操作超时</span>
          <button onClick={onCancel}>取消操作</button>
        </div>
      )}

      {/* 进度条 */}
      {showProgress && (
        <div className="progress-container">
          <div className="progress-text">进度: {progress}%</div>
          <progress value={progress} max={100} role="progressbar" />
        </div>
      )}

      {/* 搜索和过滤 */}
      {(showSearch || showFilter || showSort) && (
        <div className="controls-bar">
          {showSearch && (
            <div className="search-control">
              <input
                type="text"
                placeholder="搜索项目..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} title="清除搜索">✕</button>
              )}
            </div>
          )}

          {showFilter && (
            <div className="filter-control">
              <label htmlFor="type-filter">类型过滤</label>
              <select
                id="type-filter"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">全部</option>
                <option value="page">页面</option>
                <option value="block">块</option>
                <option value="file">文件</option>
              </select>
            </div>
          )}

          {showSort && (
            <div className="sort-control">
              <label htmlFor="sort-select">排序方式</label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  onSortChange?.(e.target.value);
                }}
              >
                <option value="name-asc">名称升序</option>
                <option value="name-desc">名称降序</option>
                <option value="modified-asc">修改时间升序</option>
                <option value="modified-desc">修改时间降序</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* 选择控制 */}
      <div className="selection-controls">
        <label className="select-all-control">
          <input
            type="checkbox"
            checked={isAllSelected}
            ref={(input) => {
              if (input) input.indeterminate = isPartiallySelected;
            }}
            onChange={isAllSelected ? handleClearSelection : handleSelectAll}
            disabled={items.length === 0 || isLoading}
          />
          全选
        </label>
        <button onClick={handleSelectAll} disabled={items.length === 0 || isLoading}>
          全选
        </button>
        <button onClick={handleClearSelection} disabled={selectedItems.length === 0}>
          取消选择
        </button>
      </div>

      {/* 项目列表 */}
      <div className="items-container" role="group" aria-label="项目列表">
        {items.length === 0 ? (
          <div className="empty-state">没有可操作的项目</div>
        ) : readOnly ? (
          <div className="readonly-state">只读模式</div>
        ) : (
          <div className="items-list">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`item ${selectedItems.includes(item.id) ? 'selected' : ''} focusable`}
                tabIndex={0}
              >
                <label className="item-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => handleItemSelect(item.id)}
                  />
                </label>
                <span className="item-icon">{getItemIcon(item.type)}</span>
                <span className="item-title">{item.title}</span>
                <span className="item-type">{item.type}</span>
                {item.lastModified && (
                  <span className="item-date">
                    {item.lastModified.toLocaleDateString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="operations-container" role="group" aria-label="操作按钮">
        {operations.map((operation) => (
          <button
            key={operation.id}
            className="operation-btn"
            onClick={() => handleOperationClick(operation.id)}
            disabled={!isOperationAvailable(operation)}
            title={operation.description}
          >
            {operation.icon} {operation.name}
          </button>
        ))}
      </div>

      {/* 确认对话框 */}
      {showConfirmDialog && pendingOperation && (
        <div className="confirm-dialog">
          <div className="dialog-content">
            <h3>确认删除</h3>
            <p>确定要删除选中的 {selectedItems.length} 个项目吗？此操作不可撤销。</p>
            <div className="dialog-actions">
              <button onClick={handleConfirmOperation}>确认</button>
              <button onClick={handleCancelOperation}>取消</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
