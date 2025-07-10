/**
 * MingLog 链接关系图谱组件
 * 使用D3.js实现交互式链接关系可视化
 */

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import * as d3 from 'd3';
import { LinkGraphData, LinkGraphNode, LinkGraphEdge } from '../../types/links';

export interface LinkGraphComponentProps {
  /** 图谱数据 */
  data: LinkGraphData;
  /** 容器宽度 */
  width?: number;
  /** 容器高度 */
  height?: number;
  /** 是否启用拖拽 */
  enableDrag?: boolean;
  /** 是否启用缩放 */
  enableZoom?: boolean;
  /** 布局算法 */
  layout?: 'force' | 'hierarchy' | 'circular' | 'grid';
  /** 节点点击回调 */
  onNodeClick?: (node: LinkGraphNode) => void;
  /** 边点击回调 */
  onEdgeClick?: (edge: LinkGraphEdge) => void;
  /** 节点悬停回调 */
  onNodeHover?: (node: LinkGraphNode | null) => void;
  /** 过滤器 */
  filters?: {
    nodeTypes?: string[];
    edgeTypes?: string[];
    minConnections?: number;
  };
  /** 样式配置 */
  style?: {
    nodeSize?: number;
    linkWidth?: number;
    colors?: Record<string, string>;
  };
}

export const LinkGraphComponent: React.FC<LinkGraphComponentProps> = ({
  data,
  width = 800,
  height = 600,
  enableDrag = true,
  enableZoom = true,
  layout = 'force',
  onNodeClick,
  onEdgeClick,
  onNodeHover,
  filters,
  style = {}
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  // 默认样式配置
  const defaultStyle = {
    nodeSize: 8,
    linkWidth: 2,
    colors: {
      page: '#0066cc',
      block: '#28a745',
      tag: '#ffc107',
      link: '#6c757d',
      selected: '#dc3545',
      hovered: '#17a2b8'
    },
    ...style
  };

  // 过滤数据
  const filteredData = useMemo(() => {
    if (!filters) return data;

    let nodes = data.nodes;
    let edges = data.edges;

    // 按节点类型过滤
    if (filters.nodeTypes && filters.nodeTypes.length > 0) {
      nodes = nodes.filter(node => filters.nodeTypes!.includes(node.type));
    }

    // 按边类型过滤
    if (filters.edgeTypes && filters.edgeTypes.length > 0) {
      edges = edges.filter(edge => filters.edgeTypes!.includes(edge.type));
    }

    // 按最小连接数过滤
    if (filters.minConnections && filters.minConnections > 0) {
      const connectionCounts = new Map<string, number>();
      edges.forEach(edge => {
        connectionCounts.set(edge.source, (connectionCounts.get(edge.source) || 0) + 1);
        connectionCounts.set(edge.target, (connectionCounts.get(edge.target) || 0) + 1);
      });
      
      nodes = nodes.filter(node => 
        (connectionCounts.get(node.id) || 0) >= filters.minConnections!
      );
    }

    // 确保边的两端节点都存在
    const nodeIds = new Set(nodes.map(n => n.id));
    edges = edges.filter(edge => 
      nodeIds.has(edge.source) && nodeIds.has(edge.target)
    );

    return { ...data, nodes, edges };
  }, [data, filters]);

  // 创建力导向布局
  const createForceLayout = useCallback((nodes: any[], links: any[]) => {
    return d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id((d: any) => d.id).distance(100))
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(defaultStyle.nodeSize + 5));
  }, [width, height, defaultStyle.nodeSize]);

  // 创建层次布局
  const createHierarchyLayout = useCallback((nodes: any[], links: any[]) => {
    const root = d3.hierarchy({ id: 'root', children: nodes });
    const tree = d3.tree<any>().size([width - 100, height - 100]);
    tree(root);
    
    root.descendants().forEach((d, i) => {
      if (d.data.id !== 'root') {
        // 将D3计算的位置赋值给节点数据
        (d.data as any).x = d.x + 50;
        (d.data as any).y = d.y + 50;
      }
    });

    return null; // 静态布局，不需要simulation
  }, [width, height]);

  // 创建圆形布局
  const createCircularLayout = useCallback((nodes: any[], links: any[]) => {
    const radius = Math.min(width, height) / 2 - 50;
    const centerX = width / 2;
    const centerY = height / 2;
    
    nodes.forEach((node, i) => {
      const angle = (2 * Math.PI * i) / nodes.length;
      node.x = centerX + radius * Math.cos(angle);
      node.y = centerY + radius * Math.sin(angle);
    });

    return null; // 静态布局
  }, [width, height]);

  // 创建网格布局
  const createGridLayout = useCallback((nodes: any[], links: any[]) => {
    const cols = Math.ceil(Math.sqrt(nodes.length));
    const cellWidth = width / cols;
    const cellHeight = height / Math.ceil(nodes.length / cols);
    
    nodes.forEach((node, i) => {
      const row = Math.floor(i / cols);
      const col = i % cols;
      node.x = col * cellWidth + cellWidth / 2;
      node.y = row * cellHeight + cellHeight / 2;
    });

    return null; // 静态布局
  }, [width, height]);

  // 获取节点颜色
  const getNodeColor = useCallback((node: LinkGraphNode) => {
    if (selectedNode === node.id) return defaultStyle.colors.selected;
    if (hoveredNode === node.id) return defaultStyle.colors.hovered;
    return defaultStyle.colors[node.type] || defaultStyle.colors.page;
  }, [selectedNode, hoveredNode, defaultStyle.colors]);

  // 获取节点大小
  const getNodeSize = useCallback((node: LinkGraphNode) => {
    const baseSize = defaultStyle.nodeSize;
    const sizeMultiplier = Math.sqrt((node.connections || 1)) * 0.5 + 1;
    return Math.min(baseSize * sizeMultiplier, baseSize * 3);
  }, [defaultStyle.nodeSize]);

  // 处理节点点击
  const handleNodeClick = useCallback((event: MouseEvent, node: LinkGraphNode) => {
    event.stopPropagation();
    setSelectedNode(selectedNode === node.id ? null : node.id);
    if (onNodeClick) {
      onNodeClick(node);
    }
  }, [selectedNode, onNodeClick]);

  // 处理节点悬停
  const handleNodeHover = useCallback((node: LinkGraphNode | null) => {
    setHoveredNode(node?.id || null);
    if (onNodeHover) {
      onNodeHover(node);
    }
  }, [onNodeHover]);

  // 渲染图谱
  useEffect(() => {
    if (!svgRef.current || !filteredData.nodes.length) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // 创建容器组
    const container = svg.append('g').attr('class', 'graph-container');

    // 设置缩放
    if (enableZoom) {
      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 4])
        .on('zoom', (event) => {
          container.attr('transform', event.transform);
        });

      svg.call(zoom);
    }

    // 准备数据
    const nodes = filteredData.nodes.map(d => ({ ...d }));
    const links = filteredData.edges.map(d => ({ ...d }));

    // 创建布局
    let simulation: d3.Simulation<any, undefined> | null = null;
    
    switch (layout) {
      case 'force':
        simulation = createForceLayout(nodes, links);
        break;
      case 'hierarchy':
        createHierarchyLayout(nodes, links);
        break;
      case 'circular':
        createCircularLayout(nodes, links);
        break;
      case 'grid':
        createGridLayout(nodes, links);
        break;
    }

    // 绘制边
    const link = container.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter().append('line')
      .attr('stroke', defaultStyle.colors.link)
      .attr('stroke-width', defaultStyle.linkWidth)
      .attr('stroke-opacity', 0.6)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        if (onEdgeClick) {
          onEdgeClick(d as LinkGraphEdge);
        }
      });

    // 绘制节点
    const node = container.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(nodes)
      .enter().append('circle')
      .attr('r', d => getNodeSize(d))
      .attr('fill', d => getNodeColor(d))
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer')
      .on('click', (event, d) => handleNodeClick(event, d))
      .on('mouseenter', (event, d) => handleNodeHover(d))
      .on('mouseleave', () => handleNodeHover(null));

    // 添加拖拽
    if (enableDrag && simulation) {
      const drag = d3.drag<SVGCircleElement, LinkGraphNode>()
        .on('start', (event, d) => {
          if (!event.active) simulation!.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation!.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        });

      node.call(drag);
    }

    // 添加标签
    const label = container.append('g')
      .attr('class', 'labels')
      .selectAll('text')
      .data(nodes)
      .enter().append('text')
      .text(d => d.title)
      .attr('font-size', '12px')
      .attr('font-family', 'Arial, sans-serif')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('pointer-events', 'none')
      .style('fill', '#333')
      .style('font-weight', d => selectedNode === d.id ? 'bold' : 'normal');

    // 更新位置
    const updatePositions = () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node
        .attr('cx', (d: any) => d.x)
        .attr('cy', (d: any) => d.y)
        .attr('fill', d => getNodeColor(d))
        .attr('r', d => getNodeSize(d));

      label
        .attr('x', (d: any) => d.x)
        .attr('y', (d: any) => d.y + getNodeSize(d) + 15)
        .style('font-weight', d => selectedNode === d.id ? 'bold' : 'normal');
    };

    if (simulation) {
      simulation.on('tick', updatePositions);
    } else {
      updatePositions();
    }

    // 清理函数
    return () => {
      if (simulation) {
        simulation.stop();
      }
    };
  }, [
    filteredData,
    width,
    height,
    layout,
    enableDrag,
    enableZoom,
    selectedNode,
    hoveredNode,
    defaultStyle,
    createForceLayout,
    createHierarchyLayout,
    createCircularLayout,
    createGridLayout,
    getNodeColor,
    getNodeSize,
    handleNodeClick,
    handleNodeHover,
    onEdgeClick
  ]);

  return (
    <div className="link-graph-component" style={{ width, height }}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ border: '1px solid #e0e0e0', borderRadius: '4px' }}
      />
    </div>
  );
};

export default LinkGraphComponent;
