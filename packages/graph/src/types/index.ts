/**
 * MingLog Graph 类型定义
 */

// 节点类型
export interface GraphNode {
  id: string
  title: string
  type: 'note' | 'tag' | 'folder' | 'link'
  content?: string
  tags?: string[]
  createdAt?: string
  updatedAt?: string
  size?: number
  color?: string
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
  vx?: number
  vy?: number
  index?: number
}

// 边类型
export interface GraphLink {
  id: string
  source: string | GraphNode
  target: string | GraphNode
  type: 'reference' | 'tag' | 'folder' | 'similarity' | 'custom'
  weight?: number
  label?: string
  color?: string
  strength?: number
}

// 图数据
export interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
}

// 图配置
export interface GraphConfig {
  width?: number
  height?: number
  nodeRadius?: number
  linkDistance?: number
  linkStrength?: number
  chargeStrength?: number
  centerForce?: number
  collisionRadius?: number
  enableZoom?: boolean
  enableDrag?: boolean
  enablePan?: boolean
  showLabels?: boolean
  showTooltips?: boolean
  highlightConnected?: boolean
  maxZoom?: number
  minZoom?: number
  backgroundColor?: string
  nodeColors?: Record<string, string>
  linkColors?: Record<string, string>
}

// 图事件
export interface GraphEvents {
  onNodeClick?: (node: GraphNode, event: MouseEvent) => void
  onNodeDoubleClick?: (node: GraphNode, event: MouseEvent) => void
  onNodeHover?: (node: GraphNode | null, event: MouseEvent) => void
  onLinkClick?: (link: GraphLink, event: MouseEvent) => void
  onLinkHover?: (link: GraphLink | null, event: MouseEvent) => void
  onBackgroundClick?: (event: MouseEvent) => void
  onZoom?: (transform: { x: number; y: number; k: number }) => void
  onDragStart?: (node: GraphNode, event: MouseEvent) => void
  onDragEnd?: (node: GraphNode, event: MouseEvent) => void
}

// 布局算法类型
export type LayoutType = 'force' | 'circular' | 'hierarchical' | 'grid' | 'radial'

// 布局配置
export interface LayoutConfig {
  type: LayoutType
  width?: number
  height?: number
  iterations?: number
  alpha?: number
  alphaDecay?: number
  velocityDecay?: number
  forceStrength?: number
  centerStrength?: number
  repelStrength?: number
  linkStrength?: number
  linkDistance?: number
  chargeStrength?: number
  centerForce?: number
  collisionRadius?: number
}

// 过滤器
export interface GraphFilter {
  nodeTypes?: string[]
  linkTypes?: string[]
  tags?: string[]
  dateRange?: {
    start: string
    end: string
  }
  searchQuery?: string
  minConnections?: number
  maxConnections?: number
}

// 图状态
export interface GraphState {
  selectedNodes: Set<string>
  hoveredNode: string | null
  hoveredLink: string | null
  transform: {
    x: number
    y: number
    k: number
  }
  isLoading: boolean
  error: string | null
}

// 图统计信息
export interface GraphStats {
  nodeCount: number
  linkCount: number
  avgConnections: number
  maxConnections: number
  clusters: number
  density: number
  components: number
}

// 搜索结果
export interface SearchResult {
  nodes: GraphNode[]
  links: GraphLink[]
  query: string
  totalResults: number
}

// 聚类信息
export interface Cluster {
  id: string
  nodes: string[]
  center: { x: number; y: number }
  radius: number
  color: string
  label?: string
}

// 路径信息
export interface Path {
  nodes: GraphNode[]
  links: GraphLink[]
  length: number
  weight: number
}

// 图组件Props
export interface GraphViewProps extends GraphConfig, GraphEvents {
  data: GraphData
  filter?: GraphFilter
  layout?: LayoutConfig
  className?: string
  style?: React.CSSProperties
  loading?: boolean
  error?: string | null
}

// 图控制器Props
export interface GraphControlsProps {
  onZoomIn?: () => void
  onZoomOut?: () => void
  onZoomFit?: () => void
  onZoomReset?: () => void
  onLayoutChange?: (layout: LayoutType) => void
  onFilterChange?: (filter: GraphFilter) => void
  onExport?: (format: 'png' | 'svg' | 'json') => void
  currentLayout?: LayoutType
  currentFilter?: GraphFilter
  stats?: GraphStats
  className?: string
}

// 图搜索Props
export interface GraphSearchProps {
  data: GraphData
  onSearch?: (results: SearchResult) => void
  onClear?: () => void
  placeholder?: string
  className?: string
}

// 图图例Props
export interface GraphLegendProps {
  nodeTypes: Array<{
    type: string
    label: string
    color: string
    count: number
  }>
  linkTypes: Array<{
    type: string
    label: string
    color: string
    count: number
  }>
  className?: string
}

// 图工具提示Props
export interface GraphTooltipProps {
  node?: GraphNode
  link?: GraphLink
  position: { x: number; y: number }
  visible: boolean
  className?: string
}

// 图迷你地图Props
export interface GraphMinimapProps {
  data: GraphData
  transform: { x: number; y: number; k: number }
  viewport: { width: number; height: number }
  onNavigate?: (transform: { x: number; y: number; k: number }) => void
  className?: string
}

// 导出格式
export type ExportFormat = 'png' | 'svg' | 'json' | 'csv'

// 导出选项
export interface ExportOptions {
  format: ExportFormat
  filename?: string
  quality?: number
  width?: number
  height?: number
  includeBackground?: boolean
}
