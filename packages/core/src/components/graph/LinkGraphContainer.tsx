/**
 * MingLog 链接图谱容器组件
 * 整合图谱可视化和控制面板
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { LinkGraphComponent } from './LinkGraphComponent';
import { GraphControlPanel } from './GraphControlPanel';
import { LinkGraphData, LinkGraphNode, LinkGraphEdge } from '../../types/links';

export interface LinkGraphContainerProps {
  /** 图谱数据 */
  data: LinkGraphData;
  /** 容器宽度 */
  width?: number;
  /** 容器高度 */
  height?: number;
  /** 节点点击回调 */
  onNodeClick?: (node: LinkGraphNode) => void;
  /** 边点击回调 */
  onEdgeClick?: (edge: LinkGraphEdge) => void;
  /** 节点悬停回调 */
  onNodeHover?: (node: LinkGraphNode | null) => void;
  /** 是否显示控制面板 */
  showControls?: boolean;
  /** 控制面板位置 */
  controlsPosition?: 'left' | 'right' | 'top' | 'bottom';
}

export const LinkGraphContainer: React.FC<LinkGraphContainerProps> = ({
  data,
  width = 800,
  height = 600,
  onNodeClick,
  onEdgeClick,
  onNodeHover,
  showControls = true,
  controlsPosition = 'right'
}) => {
  // 图谱状态
  const [layout, setLayout] = useState<'force' | 'hierarchy' | 'circular' | 'grid'>('force');
  const [enableDrag, setEnableDrag] = useState(true);
  const [enableZoom, setEnableZoom] = useState(true);
  
  // 过滤器状态
  const [filters, setFilters] = useState({
    nodeTypes: ['page', 'block', 'tag'],
    edgeTypes: ['page-reference', 'block-reference', 'tag-reference'],
    minConnections: 0
  });

  // 样式状态
  const [style, setStyle] = useState({
    nodeSize: 8,
    linkWidth: 2,
    colors: {
      page: '#0066cc',
      block: '#28a745',
      tag: '#ffc107',
      link: '#6c757d',
      selected: '#dc3545',
      hovered: '#17a2b8'
    }
  });

  // 图谱引用
  const graphRef = useRef<HTMLDivElement>(null);

  // 获取可用的节点和边类型
  const availableNodeTypes = Array.from(new Set(data.nodes.map(node => node.type)));
  const availableEdgeTypes = Array.from(new Set(data.edges.map(edge => edge.type)));

  // 重置图谱
  const handleReset = useCallback(() => {
    setLayout('force');
    setFilters({
      nodeTypes: availableNodeTypes,
      edgeTypes: availableEdgeTypes,
      minConnections: 0
    });
    setStyle({
      nodeSize: 8,
      linkWidth: 2,
      colors: {
        page: '#0066cc',
        block: '#28a745',
        tag: '#ffc107',
        link: '#6c757d',
        selected: '#dc3545',
        hovered: '#17a2b8'
      }
    });
    setEnableDrag(true);
    setEnableZoom(true);
  }, [availableNodeTypes, availableEdgeTypes]);

  // 导出图谱
  const handleExport = useCallback((format: 'png' | 'svg' | 'json') => {
    if (!graphRef.current) return;

    switch (format) {
      case 'png':
        exportAsPNG();
        break;
      case 'svg':
        exportAsSVG();
        break;
      case 'json':
        exportAsJSON();
        break;
    }
  }, []);

  // 导出为PNG
  const exportAsPNG = useCallback(() => {
    const svg = graphRef.current?.querySelector('svg');
    if (!svg) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      const link = document.createElement('a');
      link.download = `minglog-graph-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  }, [width, height]);

  // 导出为SVG
  const exportAsSVG = useCallback(() => {
    const svg = graphRef.current?.querySelector('svg');
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.download = `minglog-graph-${Date.now()}.svg`;
    link.href = url;
    link.click();
    
    URL.revokeObjectURL(url);
  }, []);

  // 导出为JSON
  const exportAsJSON = useCallback(() => {
    const exportData = {
      data,
      settings: {
        layout,
        filters,
        style,
        enableDrag,
        enableZoom
      },
      timestamp: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.download = `minglog-graph-${Date.now()}.json`;
    link.href = url;
    link.click();
    
    URL.revokeObjectURL(url);
  }, [data, layout, filters, style, enableDrag, enableZoom]);

  // 计算布局样式
  const getContainerStyle = () => {
    const isHorizontal = controlsPosition === 'left' || controlsPosition === 'right';
    
    return {
      display: 'flex',
      flexDirection: isHorizontal ? 'row' : 'column',
      width: '100%',
      height: '100%',
      gap: '16px'
    };
  };

  const getGraphStyle = () => {
    if (!showControls) {
      return { width, height };
    }

    const controlsSize = controlsPosition === 'left' || controlsPosition === 'right' ? 300 : 200;
    
    return {
      width: controlsPosition === 'left' || controlsPosition === 'right' 
        ? width - controlsSize - 16 
        : width,
      height: controlsPosition === 'top' || controlsPosition === 'bottom' 
        ? height - controlsSize - 16 
        : height
    };
  };

  return (
    <div className="link-graph-container" style={getContainerStyle()}>
      {/* 控制面板 - 顶部或左侧 */}
      {showControls && (controlsPosition === 'top' || controlsPosition === 'left') && (
        <div className="graph-controls">
          <GraphControlPanel
            layout={layout}
            onLayoutChange={setLayout}
            filters={filters}
            onFiltersChange={setFilters}
            style={style}
            onStyleChange={setStyle}
            enableDrag={enableDrag}
            onDragChange={setEnableDrag}
            enableZoom={enableZoom}
            onZoomChange={setEnableZoom}
            onReset={handleReset}
            onExport={handleExport}
            availableNodeTypes={availableNodeTypes}
            availableEdgeTypes={availableEdgeTypes}
          />
        </div>
      )}

      {/* 图谱主体 */}
      <div className="graph-main" ref={graphRef} style={getGraphStyle()}>
        <LinkGraphComponent
          data={data}
          width={getGraphStyle().width}
          height={getGraphStyle().height}
          layout={layout}
          enableDrag={enableDrag}
          enableZoom={enableZoom}
          filters={filters}
          style={style}
          onNodeClick={onNodeClick}
          onEdgeClick={onEdgeClick}
          onNodeHover={onNodeHover}
        />
      </div>

      {/* 控制面板 - 底部或右侧 */}
      {showControls && (controlsPosition === 'bottom' || controlsPosition === 'right') && (
        <div className="graph-controls">
          <GraphControlPanel
            layout={layout}
            onLayoutChange={setLayout}
            filters={filters}
            onFiltersChange={setFilters}
            style={style}
            onStyleChange={setStyle}
            enableDrag={enableDrag}
            onDragChange={setEnableDrag}
            enableZoom={enableZoom}
            onZoomChange={setEnableZoom}
            onReset={handleReset}
            onExport={handleExport}
            availableNodeTypes={availableNodeTypes}
            availableEdgeTypes={availableEdgeTypes}
          />
        </div>
      )}
    </div>
  );
};

export default LinkGraphContainer;
