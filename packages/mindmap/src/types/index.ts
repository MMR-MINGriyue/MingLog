/**
 * MingLog 思维导图类型定义
 */

import { ReactNode } from 'react'

// 思维导图节点
export interface MindMapNode {
  id: string
  text: string
  level: number
  parentId?: string
  children: MindMapNode[]
  
  // 位置信息
  x?: number
  y?: number
  
  // 样式信息
  style?: NodeStyle
  
  // 元数据
  metadata?: {
    blockId?: string
    tags?: string[]
    properties?: Record<string, any>
    createdAt?: Date
    updatedAt?: Date
  }
}

// 思维导图链接
export interface MindMapLink {
  id: string
  source: string
  target: string
  type: 'parent-child' | 'reference' | 'custom'
  style?: LinkStyle
}

// 节点样式
export interface NodeStyle {
  width?: number
  height?: number
  minWidth?: number
  minHeight?: number
  backgroundColor?: string
  borderColor?: string
  borderWidth?: number
  borderRadius?: number
  fontSize?: number
  fontColor?: string
  textColor?: string
  fontWeight?: 'normal' | 'bold'
  padding?: number
  margin?: number
  radius?: number
  shape?: 'rect' | 'circle' | 'ellipse'
}

// 链接样式
export interface LinkStyle {
  strokeWidth?: number
  strokeColor?: string
  strokeDasharray?: string
  opacity?: number
  color?: string
  width?: number
}

// 布局算法类型
export type LayoutType = 'tree' | 'radial' | 'force' | 'circular' | 'layered'

// 布局算法接口
export interface LayoutAlgorithm {
  name: string
  calculate(data: MindMapData, config: LayoutConfig): MindMapData | Promise<MindMapData>
}

// 布局配置
export interface LayoutConfig {
  type: LayoutType
  direction?: string
  nodeSpacing?: number
  levelSpacing?: number
  centerForce?: number
  linkDistance?: number
  collisionRadius?: number
  iterations?: number
}

// 思维导图数据
export interface MindMapData {
  nodes: MindMapNode[]
  links: MindMapLink[]
  rootId: string
  metadata?: {
    title?: string
    description?: string
    createdAt?: Date
    updatedAt?: Date
    version?: string
  }
}

// 导出配置
export interface ExportConfig {
  format: 'png' | 'svg' | 'pdf' | 'json'
  width?: number
  height?: number
  quality?: number
  backgroundColor?: string
  includeMetadata?: boolean
  dpi?: number
  compress?: boolean
}

// 思维导图组件属性
export interface MindMapProps {
  data: MindMapData
  width?: number
  height?: number
  layout?: LayoutConfig
  
  // 交互配置
  enableZoom?: boolean
  enableDrag?: boolean
  enableEdit?: boolean
  enableSelection?: boolean
  
  // 显示配置
  showMinimap?: boolean
  showToolbar?: boolean
  showGrid?: boolean
  
  // 事件回调
  onNodeClick?: (node: MindMapNode, event: MouseEvent) => void
  onNodeDoubleClick?: (node: MindMapNode, event: MouseEvent) => void
  onNodeEdit?: (node: MindMapNode, newText: string) => void
  onNodeAdd?: (parentNode: MindMapNode) => void
  onNodeDelete?: (node: MindMapNode) => void
  onNodeMove?: (node: MindMapNode, newPosition: { x: number; y: number }) => void
  onNodeSelect?: (node: MindMapNode) => void

  onLinkClick?: (link: MindMapLink, event: MouseEvent) => void
  onBackgroundClick?: (event: MouseEvent) => void
  onZoom?: (zoomLevel: number) => void
  onExport?: (config: ExportConfig) => void
  onStyleEdit?: (node: MindMapNode) => void
  
  // 样式
  className?: string
  style?: React.CSSProperties
}

// 转换器接口
export interface OutlineToMindMapConverter {
  convert(blocks: any[]): MindMapData
  convertNode(block: any, level: number, parentId?: string): MindMapNode
}

// 布局算法接口
export interface LayoutAlgorithm {
  name: string
  calculate(data: MindMapData, config: LayoutConfig): MindMapData | Promise<MindMapData>
}

// 导出器接口
export interface Exporter {
  format: ExportConfig['format']
  export(data: MindMapData, config: ExportConfig): Promise<Blob | string>
}

// 主题配置
export interface MindMapTheme {
  name: string
  nodeStyle: NodeStyle
  linkStyle: LinkStyle
  backgroundColor: string
  gridColor?: string
  selectionColor?: string
}

// 工具栏配置
export interface ToolbarConfig {
  showLayoutSelector?: boolean
  showExportButton?: boolean
  showZoomControls?: boolean
  showThemeSelector?: boolean
  customButtons?: ToolbarButton[]
}

export interface ToolbarButton {
  id: string
  icon: ReactNode
  tooltip: string
  onClick: () => void
  disabled?: boolean
}

// 错误类型
export class MindMapError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'MindMapError'
  }
}
