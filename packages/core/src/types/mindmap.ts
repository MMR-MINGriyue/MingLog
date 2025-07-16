/**
 * 思维导图类型定义
 * 统一的思维导图数据结构
 */

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
  style?: {
    color?: string
    backgroundColor?: string
    fontSize?: number
    fontWeight?: string
  }
  
  // 元数据
  tags?: string[]
  metadata?: {
    blockId?: string
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
  style?: {
    color?: string
    width?: number
    style?: 'solid' | 'dashed' | 'dotted'
  }
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

// 布局类型
export type LayoutType = 'tree' | 'radial' | 'force' | 'circular' | 'hierarchical'

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

// 思维导图主题
export interface MindMapTheme {
  id: string
  name: string
  colors: {
    background: string
    node: string
    text: string
    link: string
    accent: string
  }
  fonts: {
    family: string
    size: number
    weight: string
  }
}
