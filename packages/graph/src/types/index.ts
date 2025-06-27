/**
 * Graph visualization types and interfaces
 */

export interface GraphNode {
  id: string;
  label: string;
  type: 'note' | 'tag' | 'folder' | 'link';
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  size?: number;
  color?: string;
  metadata?: Record<string, any>;
  connections?: number; // Number of connections
}

export interface GraphLink {
  id: string;
  source: string | GraphNode;
  target: string | GraphNode;
  type: 'reference' | 'tag' | 'hierarchy' | 'similarity';
  weight?: number;
  label?: string;
  color?: string;
  metadata?: Record<string, any>;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface GraphConfig {
  width: number;
  height: number;
  nodeRadius: number;
  linkDistance: number;
  linkStrength: number;
  chargeStrength: number;
  centerForce: number;
  collisionRadius: number;
  enableZoom: boolean;
  enableDrag: boolean;
  enablePan: boolean;
  showLabels: boolean;
  showTooltips: boolean;
  theme: 'light' | 'dark';
}

export interface GraphLayout {
  type: 'force' | 'hierarchical' | 'circular' | 'grid';
  options?: Record<string, any>;
}

export interface GraphFilter {
  nodeTypes?: string[];
  linkTypes?: string[];
  minConnections?: number;
  maxConnections?: number;
  searchQuery?: string;
}

export interface GraphEvents {
  onNodeClick?: (node: GraphNode, event: MouseEvent) => void;
  onNodeHover?: (node: GraphNode | null, event: MouseEvent) => void;
  onLinkClick?: (link: GraphLink, event: MouseEvent) => void;
  onLinkHover?: (link: GraphLink | null, event: MouseEvent) => void;
  onBackgroundClick?: (event: MouseEvent) => void;
  onZoom?: (transform: { x: number; y: number; k: number }) => void;
}

export interface GraphState {
  selectedNodes: Set<string>;
  hoveredNode: string | null;
  hoveredLink: string | null;
  transform: { x: number; y: number; k: number };
  filter: GraphFilter;
}

export interface GraphTheme {
  background: string;
  nodeColors: {
    note: string;
    tag: string;
    folder: string;
    link: string;
    selected: string;
    hovered: string;
  };
  linkColors: {
    reference: string;
    tag: string;
    hierarchy: string;
    similarity: string;
    selected: string;
    hovered: string;
  };
  textColor: string;
  labelBackground: string;
  tooltipBackground: string;
  tooltipBorder: string;
}

export interface GraphPerformanceOptions {
  maxNodes: number;
  maxLinks: number;
  enableVirtualization: boolean;
  renderThrottle: number;
  updateThrottle: number;
}
