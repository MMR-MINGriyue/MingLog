/**
 * MingLog 图谱控制面板组件
 * 提供图谱布局、过滤、样式等控制功能
 */

import React, { useState, useCallback } from 'react';

export interface GraphControlPanelProps {
  /** 当前布局 */
  layout: 'force' | 'hierarchy' | 'circular' | 'grid';
  /** 布局变化回调 */
  onLayoutChange: (layout: 'force' | 'hierarchy' | 'circular' | 'grid') => void;
  /** 过滤器 */
  filters: {
    nodeTypes: string[];
    edgeTypes: string[];
    minConnections: number;
  };
  /** 过滤器变化回调 */
  onFiltersChange: (filters: any) => void;
  /** 样式配置 */
  style: {
    nodeSize: number;
    linkWidth: number;
  };
  /** 样式变化回调 */
  onStyleChange: (style: any) => void;
  /** 是否启用拖拽 */
  enableDrag: boolean;
  /** 拖拽设置变化回调 */
  onDragChange: (enabled: boolean) => void;
  /** 是否启用缩放 */
  enableZoom: boolean;
  /** 缩放设置变化回调 */
  onZoomChange: (enabled: boolean) => void;
  /** 重置图谱回调 */
  onReset: () => void;
  /** 导出图谱回调 */
  onExport: (format: 'png' | 'svg' | 'json') => void;
  /** 可用的节点类型 */
  availableNodeTypes?: string[];
  /** 可用的边类型 */
  availableEdgeTypes?: string[];
}

export const GraphControlPanel: React.FC<GraphControlPanelProps> = ({
  layout,
  onLayoutChange,
  filters,
  onFiltersChange,
  style,
  onStyleChange,
  enableDrag,
  onDragChange,
  enableZoom,
  onZoomChange,
  onReset,
  onExport,
  availableNodeTypes = ['page', 'block', 'tag'],
  availableEdgeTypes = ['page-reference', 'block-reference', 'tag-reference']
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // 处理节点类型过滤变化
  const handleNodeTypeChange = useCallback((nodeType: string, checked: boolean) => {
    const newNodeTypes = checked
      ? [...filters.nodeTypes, nodeType]
      : filters.nodeTypes.filter(type => type !== nodeType);
    
    onFiltersChange({
      ...filters,
      nodeTypes: newNodeTypes
    });
  }, [filters, onFiltersChange]);

  // 处理边类型过滤变化
  const handleEdgeTypeChange = useCallback((edgeType: string, checked: boolean) => {
    const newEdgeTypes = checked
      ? [...filters.edgeTypes, edgeType]
      : filters.edgeTypes.filter(type => type !== edgeType);
    
    onFiltersChange({
      ...filters,
      edgeTypes: newEdgeTypes
    });
  }, [filters, onFiltersChange]);

  // 处理最小连接数变化
  const handleMinConnectionsChange = useCallback((value: number) => {
    onFiltersChange({
      ...filters,
      minConnections: value
    });
  }, [filters, onFiltersChange]);

  // 处理节点大小变化
  const handleNodeSizeChange = useCallback((value: number) => {
    onStyleChange({
      ...style,
      nodeSize: value
    });
  }, [style, onStyleChange]);

  // 处理链接宽度变化
  const handleLinkWidthChange = useCallback((value: number) => {
    onStyleChange({
      ...style,
      linkWidth: value
    });
  }, [style, onStyleChange]);

  return (
    <div className="graph-control-panel">
      {/* 面板头部 */}
      <div className="graph-control-panel__header">
        <h3 className="graph-control-panel__title">
          🎛️ 图谱控制
        </h3>
        <button
          className="graph-control-panel__toggle"
          onClick={() => setIsExpanded(!isExpanded)}
          title={isExpanded ? '收起面板' : '展开面板'}
        >
          {isExpanded ? '▼' : '▶'}
        </button>
      </div>

      {/* 面板内容 */}
      {isExpanded && (
        <div className="graph-control-panel__content">
          {/* 布局控制 */}
          <div className="graph-control-section">
            <h4 className="graph-control-section__title">布局算法</h4>
            <div className="graph-control-section__content">
              <div className="layout-options">
                {[
                  { value: 'force', label: '🌀 力导向', description: '动态物理模拟' },
                  { value: 'hierarchy', label: '🌳 层次结构', description: '树状层级' },
                  { value: 'circular', label: '⭕ 圆形布局', description: '环形排列' },
                  { value: 'grid', label: '📊 网格布局', description: '规整网格' }
                ].map(option => (
                  <label key={option.value} className="layout-option">
                    <input
                      type="radio"
                      name="layout"
                      value={option.value}
                      checked={layout === option.value}
                      onChange={(e) => onLayoutChange(e.target.value as any)}
                    />
                    <span className="layout-option__label">{option.label}</span>
                    <span className="layout-option__description">{option.description}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* 过滤器 */}
          <div className="graph-control-section">
            <h4 className="graph-control-section__title">过滤器</h4>
            <div className="graph-control-section__content">
              {/* 节点类型过滤 */}
              <div className="filter-group">
                <label className="filter-group__label">节点类型</label>
                <div className="filter-checkboxes">
                  {availableNodeTypes.map(nodeType => (
                    <label key={nodeType} className="filter-checkbox">
                      <input
                        type="checkbox"
                        checked={filters.nodeTypes.includes(nodeType)}
                        onChange={(e) => handleNodeTypeChange(nodeType, e.target.checked)}
                      />
                      <span className="filter-checkbox__label">
                        {nodeType === 'page' && '📄'} 
                        {nodeType === 'block' && '🧩'} 
                        {nodeType === 'tag' && '🏷️'} 
                        {nodeType}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 边类型过滤 */}
              <div className="filter-group">
                <label className="filter-group__label">链接类型</label>
                <div className="filter-checkboxes">
                  {availableEdgeTypes.map(edgeType => (
                    <label key={edgeType} className="filter-checkbox">
                      <input
                        type="checkbox"
                        checked={filters.edgeTypes.includes(edgeType)}
                        onChange={(e) => handleEdgeTypeChange(edgeType, e.target.checked)}
                      />
                      <span className="filter-checkbox__label">
                        {edgeType.replace('-reference', '')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 最小连接数 */}
              <div className="filter-group">
                <label className="filter-group__label">
                  最小连接数: {filters.minConnections}
                </label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={filters.minConnections}
                  onChange={(e) => handleMinConnectionsChange(parseInt(e.target.value))}
                  className="filter-range"
                />
              </div>
            </div>
          </div>

          {/* 样式控制 */}
          <div className="graph-control-section">
            <h4 className="graph-control-section__title">样式设置</h4>
            <div className="graph-control-section__content">
              {/* 节点大小 */}
              <div className="style-group">
                <label className="style-group__label">
                  节点大小: {style.nodeSize}px
                </label>
                <input
                  type="range"
                  min="4"
                  max="20"
                  value={style.nodeSize}
                  onChange={(e) => handleNodeSizeChange(parseInt(e.target.value))}
                  className="style-range"
                />
              </div>

              {/* 链接宽度 */}
              <div className="style-group">
                <label className="style-group__label">
                  链接宽度: {style.linkWidth}px
                </label>
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={style.linkWidth}
                  onChange={(e) => handleLinkWidthChange(parseInt(e.target.value))}
                  className="style-range"
                />
              </div>
            </div>
          </div>

          {/* 交互控制 */}
          <div className="graph-control-section">
            <h4 className="graph-control-section__title">交互设置</h4>
            <div className="graph-control-section__content">
              <div className="interaction-options">
                <label className="interaction-option">
                  <input
                    type="checkbox"
                    checked={enableDrag}
                    onChange={(e) => onDragChange(e.target.checked)}
                  />
                  <span>🖱️ 启用拖拽</span>
                </label>
                
                <label className="interaction-option">
                  <input
                    type="checkbox"
                    checked={enableZoom}
                    onChange={(e) => onZoomChange(e.target.checked)}
                  />
                  <span>🔍 启用缩放</span>
                </label>
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="graph-control-section">
            <h4 className="graph-control-section__title">操作</h4>
            <div className="graph-control-section__content">
              <div className="action-buttons">
                <button
                  className="action-button action-button--reset"
                  onClick={onReset}
                  title="重置图谱到初始状态"
                >
                  🔄 重置
                </button>
                
                <div className="export-group">
                  <span className="export-label">导出:</span>
                  <button
                    className="action-button action-button--export"
                    onClick={() => onExport('png')}
                    title="导出为PNG图片"
                  >
                    🖼️ PNG
                  </button>
                  <button
                    className="action-button action-button--export"
                    onClick={() => onExport('svg')}
                    title="导出为SVG矢量图"
                  >
                    📐 SVG
                  </button>
                  <button
                    className="action-button action-button--export"
                    onClick={() => onExport('json')}
                    title="导出为JSON数据"
                  >
                    📄 JSON
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GraphControlPanel;
