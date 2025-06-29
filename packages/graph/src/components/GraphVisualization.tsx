import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { D3GraphRenderer } from '../renderer/D3GraphRenderer';
import { GraphDataProcessor } from '../data/GraphDataProcessor';
import {
  GraphData,
  GraphConfig,
  GraphEvents,
  GraphTheme,
  GraphFilter,
  GraphLink 
} from '../types';

interface GraphVisualizationProps {
  data: any; // Raw data to be processed
  config?: Partial<GraphConfig>;
  filter?: GraphFilter;
  theme?: Partial<GraphTheme>;
  onNodeClick?: (node: GraphNode) => void;
  onNodeHover?: (node: GraphNode | null) => void;
  onLinkClick?: (link: GraphLink) => void;
  onBackgroundClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const defaultConfig: GraphConfig = {
  width: 800,
  height: 600,
  nodeRadius: 8,
  linkDistance: 100,
  linkStrength: 0.5,
  chargeStrength: -300,
  centerForce: 0.1,
  collisionRadius: 12,
  enableZoom: true,
  enableDrag: true,
  enablePan: true,
  showLabels: true,
  showTooltips: true,
  theme: 'light',
};

const defaultTheme: GraphTheme = {
  background: '#ffffff',
  nodeColors: {
    note: '#3b82f6',
    tag: '#10b981',
    folder: '#f59e0b',
    link: '#8b5cf6',
    page: '#3b82f6',
    block: '#6b7280',
    selected: '#ef4444',
    hovered: '#f97316',
  },
  linkColors: {
    reference: '#6b7280',
    tag: '#10b981',
    hierarchy: '#3b82f6',
    similarity: '#8b5cf6',
    selected: '#ef4444',
    hovered: '#f97316',
  },
  textColor: '#374151',
  labelBackground: '#ffffff',
  tooltipBackground: '#1f2937',
  tooltipBorder: '#374151',
};

const darkTheme: GraphTheme = {
  background: '#111827',
  nodeColors: {
    note: '#60a5fa',
    tag: '#34d399',
    folder: '#fbbf24',
    link: '#a78bfa',
    page: '#60a5fa',
    block: '#9ca3af',
    selected: '#f87171',
    hovered: '#fb923c',
  },
  linkColors: {
    reference: '#9ca3af',
    tag: '#34d399',
    hierarchy: '#60a5fa',
    similarity: '#a78bfa',
    selected: '#f87171',
    hovered: '#fb923c',
  },
  textColor: '#f3f4f6',
  labelBackground: '#1f2937',
  tooltipBackground: '#374151',
  tooltipBorder: '#6b7280',
};

export const GraphVisualization: React.FC<GraphVisualizationProps> = ({
  data,
  config = {},
  filter = {},
  theme = {},
  onNodeClick,
  onNodeHover,
  onLinkClick,
  onBackgroundClick,
  className = '',
  style = {},
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<D3GraphRenderer | null>(null);
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set());

  // Merge configurations with memoization
  const finalConfig = useMemo(() => ({ ...defaultConfig, ...config }), [config]);
  const finalTheme = useMemo(() => ({
    ...(finalConfig.theme === 'dark' ? darkTheme : defaultTheme),
    ...theme
  }), [finalConfig.theme, theme]);

  // Process data with memoization
  const processedData = useMemo(() => {
    if (data) {
      const processed = GraphDataProcessor.processData(data);
      return GraphDataProcessor.filterData(processed, filter);
    }
    return { nodes: [], links: [] };
  }, [data, filter]);

  // Optimize event handlers with useCallback
  const handleNodeClick = useCallback((node: GraphNode) => {
    setSelectedNodes((prev: Set<string>) => {
      const newSet = new Set(prev);
      if (newSet.has(node.id)) {
        newSet.delete(node.id);
      } else {
        newSet.add(node.id);
      }
      return newSet;
    });
    onNodeClick?.(node);
  }, [onNodeClick]);

  const handleNodeHover = useCallback((node: GraphNode | null) => {
    onNodeHover?.(node);
  }, [onNodeHover]);

  const handleLinkClick = useCallback((link: GraphLink) => {
    onLinkClick?.(link);
  }, [onLinkClick]);

  const handleBackgroundClick = useCallback(() => {
    setSelectedNodes(new Set());
    onBackgroundClick?.();
  }, [onBackgroundClick]);

  // Create events object with memoization
  const events = useMemo((): GraphEvents => ({
    onNodeClick: handleNodeClick,
    onNodeHover: handleNodeHover,
    onLinkClick: handleLinkClick,
    onBackgroundClick: handleBackgroundClick,
  }), [handleNodeClick, handleNodeHover, handleLinkClick, handleBackgroundClick]);

  // Initialize renderer
  useEffect(() => {
    if (containerRef.current && processedData.nodes.length > 0) {
      // Cleanup existing renderer
      if (rendererRef.current) {
        rendererRef.current.destroy();
      }

      // Create new renderer
      rendererRef.current = new D3GraphRenderer(
        containerRef.current,
        finalConfig,
        events,
        finalTheme
      );

      // Render data
      rendererRef.current.render(processedData);
    }

    return () => {
      if (rendererRef.current) {
        rendererRef.current.destroy();
        rendererRef.current = null;
      }
    };
  }, [processedData, finalConfig, finalTheme, events]);

  // Update highlights when selection changes
  useEffect(() => {
    if (rendererRef.current) {
      rendererRef.current.highlight(Array.from(selectedNodes));
    }
  }, [selectedNodes]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (rendererRef.current && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        rendererRef.current.updateConfig({
          width: rect.width,
          height: rect.height,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`graph-visualization ${className}`}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        ...style,
      }}
    />
  );
};

export default React.memo(GraphVisualization);
