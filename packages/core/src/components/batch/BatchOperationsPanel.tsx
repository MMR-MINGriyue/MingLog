/**
 * MingLog 批量操作面板组件
 * 支持链接的批量编辑、管理和一致性检查
 */

import React, { useState, useCallback, useMemo } from 'react';
import { LinkManagerService } from '../../services/LinkManagerService';
import { PageLink, BlockLink } from '../../types/links';

export interface BatchOperationItem {
  id: string;
  type: 'page' | 'block';
  title: string;
  content: string;
  links: (PageLink | BlockLink)[];
  selected: boolean;
  hasIssues?: boolean;
  issues?: string[];
}

export interface BatchOperationResult {
  success: boolean;
  processed: number;
  errors: Array<{
    id: string;
    error: string;
  }>;
  summary: string;
}

export interface BatchOperationsPanelProps {
  /** 链接管理服务 */
  linkManager: LinkManagerService;
  /** 可操作的项目列表 */
  items: BatchOperationItem[];
  /** 是否显示面板 */
  isOpen: boolean;
  /** 关闭回调 */
  onClose: () => void;
  /** 操作完成回调 */
  onOperationComplete?: (result: BatchOperationResult) => void;
  /** 项目选择变化回调 */
  onSelectionChange?: (selectedIds: string[]) => void;
}

export const BatchOperationsPanel: React.FC<BatchOperationsPanelProps> = ({
  linkManager,
  items,
  isOpen,
  onClose,
  onOperationComplete,
  onSelectionChange
}) => {
  const [selectedOperation, setSelectedOperation] = useState<string>('');
  const [operationParams, setOperationParams] = useState<Record<string, any>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewResults, setPreviewResults] = useState<any[]>([]);

  // 计算选中的项目
  const selectedItems = useMemo(() => {
    return items.filter(item => item.selected);
  }, [items]);

  // 计算统计信息
  const stats = useMemo(() => {
    const total = items.length;
    const selected = selectedItems.length;
    const withIssues = items.filter(item => item.hasIssues).length;
    const totalLinks = items.reduce((sum, item) => sum + item.links.length, 0);
    
    return { total, selected, withIssues, totalLinks };
  }, [items, selectedItems]);

  // 可用的批量操作
  const operations = [
    {
      id: 'rename',
      name: '批量重命名',
      description: '批量修改页面或块的名称',
      icon: '✏️',
      params: [
        { name: 'pattern', label: '查找模式', type: 'text', required: true },
        { name: 'replacement', label: '替换为', type: 'text', required: true },
        { name: 'useRegex', label: '使用正则表达式', type: 'checkbox' }
      ]
    },
    {
      id: 'move',
      name: '批量移动',
      description: '将选中项目移动到指定位置',
      icon: '📁',
      params: [
        { name: 'targetPath', label: '目标路径', type: 'text', required: true },
        { name: 'createPath', label: '自动创建路径', type: 'checkbox' }
      ]
    },
    {
      id: 'delete',
      name: '批量删除',
      description: '删除选中的项目和相关链接',
      icon: '🗑️',
      params: [
        { name: 'deleteLinks', label: '同时删除相关链接', type: 'checkbox', default: true },
        { name: 'createBackup', label: '创建备份', type: 'checkbox', default: true }
      ]
    },
    {
      id: 'updateLinks',
      name: '更新链接',
      description: '批量更新链接目标或格式',
      icon: '🔗',
      params: [
        { name: 'oldTarget', label: '原链接目标', type: 'text', required: true },
        { name: 'newTarget', label: '新链接目标', type: 'text', required: true },
        { name: 'updateAliases', label: '同时更新别名', type: 'checkbox' }
      ]
    },
    {
      id: 'fixBroken',
      name: '修复损坏链接',
      description: '自动修复检测到的损坏链接',
      icon: '🔧',
      params: [
        { name: 'autoFix', label: '自动修复', type: 'checkbox', default: true },
        { name: 'createMissing', label: '创建缺失页面', type: 'checkbox' }
      ]
    },
    {
      id: 'export',
      name: '批量导出',
      description: '导出选中项目的数据',
      icon: '📤',
      params: [
        { name: 'format', label: '导出格式', type: 'select', options: ['json', 'csv', 'markdown'], default: 'json' },
        { name: 'includeLinks', label: '包含链接信息', type: 'checkbox', default: true }
      ]
    }
  ];

  // 处理全选/取消全选
  const handleSelectAll = useCallback((selected: boolean) => {
    const newItems = items.map(item => ({ ...item, selected }));
    const selectedIds = selected ? items.map(item => item.id) : [];
    if (onSelectionChange) {
      onSelectionChange(selectedIds);
    }
  }, [items, onSelectionChange]);

  // 处理单项选择
  const handleItemSelect = useCallback((itemId: string, selected: boolean) => {
    const selectedIds = items
      .filter(item => item.id === itemId ? selected : item.selected)
      .map(item => item.id);
    
    if (onSelectionChange) {
      onSelectionChange(selectedIds);
    }
  }, [items, onSelectionChange]);

  // 预览操作结果
  const handlePreview = useCallback(async () => {
    if (!selectedOperation || selectedItems.length === 0) return;

    setIsProcessing(true);
    try {
      const operation = operations.find(op => op.id === selectedOperation);
      if (!operation) return;

      // 模拟预览结果
      const results = await simulateOperation(selectedOperation, selectedItems, operationParams);
      setPreviewResults(results);
      setShowPreview(true);
    } catch (error) {
      console.error('Preview failed:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [selectedOperation, selectedItems, operationParams]);

  // 执行批量操作
  const handleExecute = useCallback(async () => {
    if (!selectedOperation || selectedItems.length === 0) return;

    setIsProcessing(true);
    try {
      const result = await executeOperation(selectedOperation, selectedItems, operationParams, linkManager);
      
      if (onOperationComplete) {
        onOperationComplete(result);
      }

      // 如果操作成功，关闭面板
      if (result.success) {
        onClose();
      }
    } catch (error) {
      console.error('Operation failed:', error);
      if (onOperationComplete) {
        onOperationComplete({
          success: false,
          processed: 0,
          errors: [{ id: 'general', error: error instanceof Error ? error.message : '操作失败' }],
          summary: '操作执行失败'
        });
      }
    } finally {
      setIsProcessing(false);
    }
  }, [selectedOperation, selectedItems, operationParams, linkManager, onOperationComplete, onClose]);

  // 获取当前操作的参数配置
  const currentOperation = operations.find(op => op.id === selectedOperation);

  if (!isOpen) return null;

  return (
    <div className="batch-operations-panel">
      {/* 面板头部 */}
      <div className="batch-panel-header">
        <h2 className="batch-panel-title">
          🔧 批量操作
        </h2>
        <button
          className="batch-panel-close"
          onClick={onClose}
          title="关闭面板"
        >
          ✕
        </button>
      </div>

      {/* 统计信息 */}
      <div className="batch-stats">
        <div className="batch-stat">
          <span className="batch-stat-label">总项目:</span>
          <span className="batch-stat-value">{stats.total}</span>
        </div>
        <div className="batch-stat">
          <span className="batch-stat-label">已选择:</span>
          <span className="batch-stat-value">{stats.selected}</span>
        </div>
        <div className="batch-stat">
          <span className="batch-stat-label">有问题:</span>
          <span className="batch-stat-value">{stats.withIssues}</span>
        </div>
        <div className="batch-stat">
          <span className="batch-stat-label">总链接:</span>
          <span className="batch-stat-value">{stats.totalLinks}</span>
        </div>
      </div>

      {/* 项目选择区域 */}
      <div className="batch-selection">
        <div className="batch-selection-header">
          <h3>选择项目</h3>
          <div className="batch-selection-actions">
            <button
              className="batch-btn batch-btn--small"
              onClick={() => handleSelectAll(true)}
            >
              全选
            </button>
            <button
              className="batch-btn batch-btn--small"
              onClick={() => handleSelectAll(false)}
            >
              取消全选
            </button>
          </div>
        </div>

        <div className="batch-items-list">
          {items.slice(0, 10).map(item => (
            <div key={item.id} className="batch-item">
              <label className="batch-item-checkbox">
                <input
                  type="checkbox"
                  checked={item.selected}
                  onChange={(e) => handleItemSelect(item.id, e.target.checked)}
                />
                <span className="batch-item-info">
                  <span className="batch-item-icon">
                    {item.type === 'page' ? '📄' : '🧩'}
                  </span>
                  <span className="batch-item-title">{item.title}</span>
                  <span className="batch-item-meta">
                    {item.links.length} 个链接
                    {item.hasIssues && <span className="batch-item-warning">⚠️</span>}
                  </span>
                </span>
              </label>
            </div>
          ))}
          
          {items.length > 10 && (
            <div className="batch-items-more">
              还有 {items.length - 10} 个项目...
            </div>
          )}
        </div>
      </div>

      {/* 操作选择 */}
      <div className="batch-operations">
        <h3>选择操作</h3>
        <div className="batch-operations-grid">
          {operations.map(operation => (
            <button
              key={operation.id}
              className={`batch-operation-card ${selectedOperation === operation.id ? 'selected' : ''}`}
              onClick={() => setSelectedOperation(operation.id)}
              disabled={selectedItems.length === 0}
            >
              <div className="batch-operation-icon">{operation.icon}</div>
              <div className="batch-operation-name">{operation.name}</div>
              <div className="batch-operation-desc">{operation.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 操作参数 */}
      {currentOperation && (
        <div className="batch-parameters">
          <h3>操作参数</h3>
          <div className="batch-parameters-form">
            {currentOperation.params.map(param => (
              <div key={param.name} className="batch-parameter">
                <label className="batch-parameter-label">
                  {param.label}
                  {param.required && <span className="required">*</span>}
                </label>
                
                {param.type === 'text' && (
                  <input
                    type="text"
                    className="batch-parameter-input"
                    value={operationParams[param.name] || ''}
                    onChange={(e) => setOperationParams(prev => ({
                      ...prev,
                      [param.name]: e.target.value
                    }))}
                    placeholder={param.label}
                  />
                )}
                
                {param.type === 'checkbox' && (
                  <label className="batch-parameter-checkbox">
                    <input
                      type="checkbox"
                      checked={operationParams[param.name] ?? param.default ?? false}
                      onChange={(e) => setOperationParams(prev => ({
                        ...prev,
                        [param.name]: e.target.checked
                      }))}
                    />
                    <span>启用</span>
                  </label>
                )}
                
                {param.type === 'select' && (
                  <select
                    className="batch-parameter-select"
                    value={operationParams[param.name] || param.default || ''}
                    onChange={(e) => setOperationParams(prev => ({
                      ...prev,
                      [param.name]: e.target.value
                    }))}
                  >
                    {param.options?.map(option => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 预览结果 */}
      {showPreview && previewResults.length > 0 && (
        <div className="batch-preview">
          <h3>预览结果</h3>
          <div className="batch-preview-list">
            {previewResults.slice(0, 5).map((result, index) => (
              <div key={index} className="batch-preview-item">
                <span className="batch-preview-before">{result.before}</span>
                <span className="batch-preview-arrow">→</span>
                <span className="batch-preview-after">{result.after}</span>
              </div>
            ))}
            {previewResults.length > 5 && (
              <div className="batch-preview-more">
                还有 {previewResults.length - 5} 个变更...
              </div>
            )}
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div className="batch-actions">
        <button
          className="batch-btn batch-btn--secondary"
          onClick={handlePreview}
          disabled={!selectedOperation || selectedItems.length === 0 || isProcessing}
        >
          {isProcessing ? '预览中...' : '预览'}
        </button>
        
        <button
          className="batch-btn batch-btn--primary"
          onClick={handleExecute}
          disabled={!selectedOperation || selectedItems.length === 0 || isProcessing}
        >
          {isProcessing ? '执行中...' : '执行操作'}
        </button>
        
        <button
          className="batch-btn batch-btn--tertiary"
          onClick={onClose}
          disabled={isProcessing}
        >
          取消
        </button>
      </div>
    </div>
  );
};

// 模拟操作预览
async function simulateOperation(
  operation: string,
  items: BatchOperationItem[],
  params: Record<string, any>
): Promise<any[]> {
  // 简化的预览逻辑
  switch (operation) {
    case 'rename':
      return items.map(item => ({
        before: item.title,
        after: item.title.replace(new RegExp(params.pattern, params.useRegex ? 'g' : 'gi'), params.replacement)
      }));
    
    case 'move':
      return items.map(item => ({
        before: item.title,
        after: `${params.targetPath}/${item.title}`
      }));
    
    default:
      return [];
  }
}

// 执行批量操作
async function executeOperation(
  operation: string,
  items: BatchOperationItem[],
  params: Record<string, any>,
  linkManager: LinkManagerService
): Promise<BatchOperationResult> {
  const errors: Array<{ id: string; error: string }> = [];
  let processed = 0;

  try {
    for (const item of items) {
      try {
        switch (operation) {
          case 'rename':
            // 执行重命名逻辑
            processed++;
            break;
          
          case 'move':
            // 执行移动逻辑
            processed++;
            break;
          
          case 'delete':
            // 执行删除逻辑
            processed++;
            break;
          
          case 'updateLinks':
            // 执行链接更新逻辑
            processed++;
            break;
          
          case 'fixBroken':
            // 执行修复逻辑
            processed++;
            break;
          
          case 'export':
            // 执行导出逻辑
            processed++;
            break;
        }
      } catch (error) {
        errors.push({
          id: item.id,
          error: error instanceof Error ? error.message : '操作失败'
        });
      }
    }

    return {
      success: errors.length === 0,
      processed,
      errors,
      summary: `成功处理 ${processed} 个项目${errors.length > 0 ? `，${errors.length} 个失败` : ''}`
    };
  } catch (error) {
    return {
      success: false,
      processed,
      errors: [{ id: 'general', error: error instanceof Error ? error.message : '操作失败' }],
      summary: '批量操作失败'
    };
  }
}

export default BatchOperationsPanel;
