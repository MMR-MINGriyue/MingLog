/**
 * MingLog 思维导图包主入口
 */

// 类型导出
export type {
  MindMapNode as MindMapNodeType,
  MindMapLink as MindMapLinkType,
  MindMapData,
  MindMapProps,
  LayoutType,
  LayoutConfig,
  NodeStyle,
  LinkStyle,
  ExportConfig,
  MindMapTheme,
  ToolbarConfig,
  OutlineToMindMapConverter as IOutlineToMindMapConverter,
  LayoutAlgorithm,
  Exporter
} from './types'

// 组件导出
export { MindMapView } from './components/MindMapView'
export { MindMapNode } from './components/MindMapNode'
export { MindMapLink } from './components/MindMapLink'
export { MindMapToolbar } from './components/MindMapToolbar'
export { MindMapCanvas } from './components/MindMapCanvas'
export { MindMapEditor } from './components/MindMapEditor'
export { NodeStyleEditor } from './components/NodeStyleEditor'
export { ExportDialog } from './components/ExportDialog'
export { TemplateDialog } from './components/TemplateDialog'

// 转换器导出
export { OutlineToMindMapConverter, outlineToMindMapConverter } from './converters/OutlineToMindMap'

// 导入转换器实例用于内部使用
import { outlineToMindMapConverter } from './converters/OutlineToMindMap'

// 布局算法导出
export { TreeLayout, treeLayout } from './algorithms/TreeLayout'
export { RadialLayout, radialLayout } from './algorithms/RadialLayout'
export { ForceLayout, forceLayout } from './algorithms/ForceLayout'
export { LayoutManager, layoutManager } from './algorithms/LayoutManager'

// 导出器导出
export { ExportManager, exportManager } from './exporters/ExportManager'
export { PngExporter, pngExporter } from './exporters/PngExporter'
export { SvgExporter, svgExporter } from './exporters/SvgExporter'
export { PdfExporter, pdfExporter } from './exporters/PdfExporter'
export { JsonExporter, jsonExporter } from './exporters/JsonExporter'

// 模板系统导出
export { TemplateManager, templateManager } from './templates/TemplateManager'
export type { MindMapTemplate, TemplateCategory, TemplateFilter } from './templates/TemplateManager'

// 工具函数
export { MindMapError } from './types'

// 默认导出主组件
export { MindMapView as default } from './components/MindMapView'

/**
 * 创建思维导图实例的便捷函数
 */
export function createMindMap(blocks: any[]) {
  return outlineToMindMapConverter.convert(blocks)
}

/**
 * 预设主题
 */
export const themes = {
  default: {
    name: '默认主题',
    nodeStyle: {
      backgroundColor: '#ffffff',
      borderColor: '#d1d5db',
      borderWidth: 2,
      borderRadius: 6,
      fontSize: 14,
      fontColor: '#374151',
      padding: 8
    },
    linkStyle: {
      strokeWidth: 2,
      strokeColor: '#6b7280',
      opacity: 0.8
    },
    backgroundColor: '#fafafa'
  },
  
  dark: {
    name: '深色主题',
    nodeStyle: {
      backgroundColor: '#1f2937',
      borderColor: '#4b5563',
      borderWidth: 2,
      borderRadius: 6,
      fontSize: 14,
      fontColor: '#f9fafb',
      padding: 8
    },
    linkStyle: {
      strokeWidth: 2,
      strokeColor: '#9ca3af',
      opacity: 0.8
    },
    backgroundColor: '#111827'
  },
  
  colorful: {
    name: '彩色主题',
    nodeStyle: {
      backgroundColor: '#fef3c7',
      borderColor: '#f59e0b',
      borderWidth: 2,
      borderRadius: 8,
      fontSize: 14,
      fontColor: '#92400e',
      padding: 10
    },
    linkStyle: {
      strokeWidth: 3,
      strokeColor: '#f59e0b',
      opacity: 0.9
    },
    backgroundColor: '#fffbeb'
  }
}

/**
 * 预设布局配置
 */
export const layoutConfigs = {
  tree: {
    type: 'tree' as const,
    nodeSpacing: 120,
    levelSpacing: 200
  },
  
  radial: {
    type: 'radial' as const,
    nodeSpacing: 100,
    levelSpacing: 120
  },
  
  compact: {
    type: 'tree' as const,
    nodeSpacing: 80,
    levelSpacing: 150
  },
  
  spacious: {
    type: 'tree' as const,
    nodeSpacing: 160,
    levelSpacing: 250
  }
}
