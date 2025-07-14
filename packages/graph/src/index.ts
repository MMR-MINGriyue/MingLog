/**
 * @minglog/graph 主导出文件
 */

// 主要组件
export { default as GraphView } from './components/GraphView'
export { default as GraphControls } from './components/GraphControls'
export { default as GraphFilters } from './components/GraphFilters'
export { default as GraphAnalytics } from './components/GraphAnalytics'

// 新增的知识图谱核心组件
export { GraphViewer } from './components/GraphViewer'
export { GraphCanvas } from './components/GraphCanvas'
export { GraphNodeComponent } from './components/GraphNodeComponent'
export { GraphLinkComponent } from './components/GraphLinkComponent'

// 双向链接系统组件
export { LinkCreationDialog } from './components/LinkCreationDialog'
export { LinkManagementPanel } from './components/LinkManagementPanel'

// 双向链接服务
export { BidirectionalLinkManager } from './services/BidirectionalLinkManager'

// 类型定义
export type {
  GraphNode,
  GraphLink,
  GraphData,
  GraphConfig,
  GraphEvents,
  GraphViewProps,
  GraphControlsProps,
  GraphSearchProps,
  GraphLegendProps,
  GraphTooltipProps,
  GraphMinimapProps,
  GraphState,
  GraphStats,
  GraphFilter,
  LayoutType,
  LayoutConfig,
  SearchResult,
  Cluster,
  Path,
  ExportFormat,
  ExportOptions
} from './types'

// 工具函数
export {
  createForceSimulation,
  updateSimulation,
  renderNodes,
  renderLinks,
  renderLabels,
  setupZoom,
  setupDrag,
  filterGraphData,
  calculateGraphStats,
  findShortestPath
} from './utils'

// 布局算法
export {
  forceLayout,
  circularLayout,
  hierarchicalLayout,
  gridLayout,
  radialLayout,
  applyLayout
} from './layouts'

// 高级布局管理
export { AdvancedLayoutManager } from './layouts/AdvancedLayoutManager'
export { LayoutControlPanel } from './components/LayoutControlPanel'

// 图形聚类分析
export { GraphClusteringAnalyzer } from './algorithms/GraphClusteringAnalyzer'
export { ClusterVisualization } from './components/ClusterVisualization'

// 版本信息
export const version = '1.0.0'
