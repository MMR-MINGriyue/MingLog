/**
 * 图谱类型定义
 * 统一的图谱数据结构
 */

// 图谱节点
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

// 图谱链接
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

// 图谱数据
export interface GraphData {
  nodes: GraphNode[]
  links: GraphLink[]
  metadata?: {
    title?: string
    description?: string
    createdAt?: Date
    updatedAt?: Date
    version?: string
  }
}

// 图谱布局配置
export interface GraphLayoutConfig {
  type: 'force' | 'circular' | 'grid' | 'hierarchical'
  width: number
  height: number
  nodeRadius?: number
  linkDistance?: number
  charge?: number
  gravity?: number
  friction?: number
  alpha?: number
  alphaDecay?: number
  velocityDecay?: number
}

// 图谱过滤器
export interface GraphFilter {
  nodeTypes?: string[]
  linkTypes?: string[]
  tags?: string[]
  dateRange?: {
    start?: Date
    end?: Date
  }
  minConnections?: number
  maxConnections?: number
}

// 图谱视图配置
export interface GraphViewConfig {
  showLabels: boolean
  showTooltips: boolean
  enableDrag: boolean
  enableZoom: boolean
  enablePan: boolean
  highlightConnected: boolean
  fadeUnconnected: boolean
  colorScheme: 'default' | 'dark' | 'light' | 'custom'
  nodeSize: 'fixed' | 'degree' | 'betweenness'
  linkWidth: 'fixed' | 'weight' | 'frequency'
}
