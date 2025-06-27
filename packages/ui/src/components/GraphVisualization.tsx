/**
 * 图谱可视化组件
 * Graph Visualization Component
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { clsx } from 'clsx';
import { useLocale } from '../hooks/useLocale';

export interface GraphNode {
  id: string;
  label: string;
  type: 'page' | 'block' | 'tag';
  size?: number;
  color?: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphLink {
  id: string;
  source: string;
  target: string;
  type: 'reference' | 'parent' | 'tag';
  strength?: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface GraphVisualizationProps {
  data: GraphData;
  width?: number;
  height?: number;
  onNodeClick?: (node: GraphNode) => void;
  onNodeHover?: (node: GraphNode | null) => void;
  onLinkClick?: (link: GraphLink) => void;
  showLabels?: boolean;
  showOrphans?: boolean;
  nodeSize?: number;
  linkDistance?: number;
  repulsion?: number;
  attraction?: number;
  layout?: 'force' | 'circular' | 'hierarchical' | 'grid';
  className?: string;
}

export const GraphVisualization: React.FC<GraphVisualizationProps> = ({
  data,
  width = 800,
  height = 600,
  onNodeClick,
  onNodeHover,
  onLinkClick,
  showLabels = true,
  showOrphans = true,
  nodeSize = 8,
  linkDistance = 50,
  repulsion = 100,
  attraction = 0.1,
  layout = 'force',
  className,
}) => {
  const { t } = useLocale();
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // 过滤数据
  const filteredData = React.useMemo(() => {
    let nodes = data.nodes;
    let links = data.links;

    if (!showOrphans) {
      const connectedNodeIds = new Set();
      links.forEach(link => {
        connectedNodeIds.add(link.source);
        connectedNodeIds.add(link.target);
      });
      nodes = nodes.filter(node => connectedNodeIds.has(node.id));
    }

    return { nodes, links };
  }, [data, showOrphans]);

  // 简单的力导向布局算法
  const calculateLayout = useCallback((nodes: GraphNode[], links: GraphLink[]) => {
    const nodeMap = new Map(nodes.map(node => [node.id, { ...node }]));
    
    // 初始化位置
    nodes.forEach((node, i) => {
      if (!node.x || !node.y) {
        const angle = (i / nodes.length) * 2 * Math.PI;
        const radius = Math.min(width, height) / 4;
        nodeMap.get(node.id)!.x = width / 2 + Math.cos(angle) * radius;
        nodeMap.get(node.id)!.y = height / 2 + Math.sin(angle) * radius;
      }
    });

    // 简单的力导向算法
    for (let iteration = 0; iteration < 100; iteration++) {
      // 排斥力
      nodes.forEach(nodeA => {
        const a = nodeMap.get(nodeA.id)!;
        nodes.forEach(nodeB => {
          if (nodeA.id === nodeB.id) return;
          const b = nodeMap.get(nodeB.id)!;
          
          const dx = a.x! - b.x!;
          const dy = a.y! - b.y!;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          
          const force = repulsion / (distance * distance);
          const fx = (dx / distance) * force;
          const fy = (dy / distance) * force;
          
          a.x! += fx;
          a.y! += fy;
        });
      });

      // 吸引力（链接）
      links.forEach(link => {
        const source = nodeMap.get(link.source)!;
        const target = nodeMap.get(link.target)!;
        
        if (!source || !target) return;
        
        const dx = target.x! - source.x!;
        const dy = target.y! - source.y!;
        const distance = Math.sqrt(dx * dx + dy * dy) || 1;
        
        const force = (distance - linkDistance) * attraction;
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;
        
        source.x! += fx;
        source.y! += fy;
        target.x! -= fx;
        target.y! -= fy;
      });

      // 边界约束
      nodes.forEach(node => {
        const n = nodeMap.get(node.id)!;
        n.x! = Math.max(nodeSize, Math.min(width - nodeSize, n.x!));
        n.y! = Math.max(nodeSize, Math.min(height - nodeSize, n.y!));
      });
    }

    return Array.from(nodeMap.values());
  }, [width, height, linkDistance, repulsion, attraction, nodeSize]);

  // 计算布局
  const layoutNodes = React.useMemo(() => {
    if (layout === 'force') {
      return calculateLayout(filteredData.nodes, filteredData.links);
    }
    
    // 其他布局算法可以在这里实现
    return filteredData.nodes.map((node, i) => {
      const angle = (i / filteredData.nodes.length) * 2 * Math.PI;
      const radius = Math.min(width, height) / 4;
      return {
        ...node,
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius,
      };
    });
  }, [filteredData, layout, calculateLayout, width, height]);

  // 节点颜色
  const getNodeColor = (node: GraphNode) => {
    if (node.color) return node.color;
    
    switch (node.type) {
      case 'page':
        return '#3B82F6'; // blue
      case 'block':
        return '#10B981'; // green
      case 'tag':
        return '#F59E0B'; // amber
      default:
        return '#6B7280'; // gray
    }
  };

  // 处理鼠标事件
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.1, Math.min(3, prev * delta)));
  };

  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node);
    onNodeClick?.(node);
  };

  const handleNodeHover = (node: GraphNode | null) => {
    setHoveredNode(node);
    onNodeHover?.(node);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setSelectedNode(null);
    setHoveredNode(null);
  };

  const fitToScreen = () => {
    if (layoutNodes.length === 0) return;
    
    const padding = 50;
    const minX = Math.min(...layoutNodes.map(n => n.x!)) - padding;
    const maxX = Math.max(...layoutNodes.map(n => n.x!)) + padding;
    const minY = Math.min(...layoutNodes.map(n => n.y!)) - padding;
    const maxY = Math.max(...layoutNodes.map(n => n.y!)) + padding;
    
    const contentWidth = maxX - minX;
    const contentHeight = maxY - minY;
    
    const scaleX = width / contentWidth;
    const scaleY = height / contentHeight;
    const scale = Math.min(scaleX, scaleY, 1);
    
    setZoom(scale);
    setPan({
      x: (width - contentWidth * scale) / 2 - minX * scale,
      y: (height - contentHeight * scale) / 2 - minY * scale,
    });
  };

  return (
    <div className={clsx('relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden', className)}>
      {/* 工具栏 */}
      <div className="absolute top-4 left-4 z-10 flex space-x-2">
        <button
          onClick={resetView}
          className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title={t('graph.resetZoom')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
        
        <button
          onClick={fitToScreen}
          className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          title={t('graph.fitToScreen')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
      </div>

      {/* 信息面板 */}
      {(hoveredNode || selectedNode) && (
        <div className="absolute top-4 right-4 z-10 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-3 shadow-lg max-w-xs">
          <div className="text-sm">
            <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">
              {(hoveredNode || selectedNode)?.label}
            </div>
            <div className="text-gray-500 dark:text-gray-400 capitalize">
              {t(`graph.nodeType.${(hoveredNode || selectedNode)?.type}`)}
            </div>
          </div>
        </div>
      )}

      {/* SVG 画布 */}
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* 链接 */}
          {filteredData.links.map(link => {
            const source = layoutNodes.find(n => n.id === link.source);
            const target = layoutNodes.find(n => n.id === link.target);
            
            if (!source || !target) return null;
            
            return (
              <line
                key={link.id}
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke="#E5E7EB"
                strokeWidth={1}
                className="cursor-pointer hover:stroke-blue-500 transition-colors"
                onClick={() => onLinkClick?.(link)}
              />
            );
          })}

          {/* 节点 */}
          {layoutNodes.map(node => (
            <g key={node.id}>
              <circle
                cx={node.x}
                cy={node.y}
                r={node.size || nodeSize}
                fill={getNodeColor(node)}
                stroke={selectedNode?.id === node.id ? '#1F2937' : 'white'}
                strokeWidth={selectedNode?.id === node.id ? 3 : 2}
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => handleNodeClick(node)}
                onMouseEnter={() => handleNodeHover(node)}
                onMouseLeave={() => handleNodeHover(null)}
              />
              
              {showLabels && (
                <text
                  x={node.x}
                  y={node.y! + (node.size || nodeSize) + 12}
                  textAnchor="middle"
                  className="text-xs fill-gray-700 dark:fill-gray-300 pointer-events-none"
                  style={{ fontSize: `${12 / zoom}px` }}
                >
                  {node.label}
                </text>
              )}
            </g>
          ))}
        </g>
      </svg>

      {/* 统计信息 */}
      <div className="absolute bottom-4 left-4 text-xs text-gray-500 dark:text-gray-400">
        {t('graph.stats', {
          nodes: filteredData.nodes.length,
          links: filteredData.links.length,
        })}
      </div>
    </div>
  );
};

// 图谱设置面板组件
export const GraphSettings: React.FC<{
  showLabels: boolean;
  showOrphans: boolean;
  nodeSize: number;
  linkDistance: number;
  repulsion: number;
  attraction: number;
  layout: 'force' | 'circular' | 'hierarchical' | 'grid';
  onSettingsChange: (settings: Partial<{
    showLabels: boolean;
    showOrphans: boolean;
    nodeSize: number;
    linkDistance: number;
    repulsion: number;
    attraction: number;
    layout: 'force' | 'circular' | 'hierarchical' | 'grid';
  }>) => void;
  className?: string;
}> = ({
  showLabels,
  showOrphans,
  nodeSize,
  linkDistance,
  repulsion,
  attraction,
  layout,
  onSettingsChange,
  className,
}) => {
  const { t } = useLocale();

  return (
    <div className={clsx('space-y-4', className)}>
      <div>
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
          {t('graph.displaySettings')}
        </h3>

        <div className="space-y-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showLabels}
              onChange={(e) => onSettingsChange({ showLabels: e.target.checked })}
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {t('graph.showLabels')}
            </span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showOrphans}
              onChange={(e) => onSettingsChange({ showOrphans: e.target.checked })}
              className="mr-2"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {t('graph.showOrphans')}
            </span>
          </label>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
          {t('graph.layoutSettings')}
        </h3>

        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              {t('graph.layout')}
            </label>
            <select
              value={layout}
              onChange={(e) => onSettingsChange({ layout: e.target.value as any })}
              className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="force">{t('graph.forceLayout')}</option>
              <option value="circular">{t('graph.circularLayout')}</option>
              <option value="hierarchical">{t('graph.hierarchicalLayout')}</option>
              <option value="grid">{t('graph.gridLayout')}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              {t('graph.nodeSize')}: {nodeSize}
            </label>
            <input
              type="range"
              min="4"
              max="20"
              value={nodeSize}
              onChange={(e) => onSettingsChange({ nodeSize: Number(e.target.value) })}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              {t('graph.linkDistance')}: {linkDistance}
            </label>
            <input
              type="range"
              min="20"
              max="100"
              value={linkDistance}
              onChange={(e) => onSettingsChange({ linkDistance: Number(e.target.value) })}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              {t('graph.repulsion')}: {repulsion}
            </label>
            <input
              type="range"
              min="50"
              max="200"
              value={repulsion}
              onChange={(e) => onSettingsChange({ repulsion: Number(e.target.value) })}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
              {t('graph.attraction')}: {(attraction * 100).toFixed(1)}%
            </label>
            <input
              type="range"
              min="0.05"
              max="0.3"
              step="0.01"
              value={attraction}
              onChange={(e) => onSettingsChange({ attraction: Number(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraphVisualization;
