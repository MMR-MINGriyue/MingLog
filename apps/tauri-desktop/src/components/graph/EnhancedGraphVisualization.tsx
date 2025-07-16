/**
 * 增强版图形可视化组件
 * 提供完整的图形分析、布局和聚类功能
 */

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { GraphData, GraphNode, GraphLink, LayoutConfig, ClusteringResult } from '@minglog/graph'
import { AdvancedClusteringConfigurator } from './AdvancedClusteringConfigurator'
import { GraphAnalysisPanel } from './GraphAnalysisPanel'
import { EnhancedGraphInteractions } from './EnhancedGraphInteractions'
import { InteractiveGraphRenderer } from './InteractiveGraphRenderer'
import { appCore } from '../../core/AppCore'
import './EnhancedGraphInteractions.css'

interface EnhancedGraphVisualizationProps {
  /** 图形数据 */
  data: GraphData
  /** 画布宽度 */
  width?: number
  /** 画布高度 */
  height?: number
  /** 是否显示 */
  visible: boolean
  /** 关闭回调 */
  onClose: () => void
  /** 节点点击回调 */
  onNodeClick?: (node: GraphNode) => void
  /** 自定义类名 */
  className?: string
}

interface VisualizationState {
  /** 当前布局类型 */
  layoutType: LayoutConfig['type']
  /** 布局配置 */
  layoutConfig: LayoutConfig
  /** 聚类结果 */
  clusteringResult: ClusteringResult | null
  /** 是否显示聚类 */
  showClustering: boolean
  /** 是否显示聚类配置器 */
  showClusteringConfigurator: boolean
  /** 是否显示分析面板 */
  showAnalysisPanel: boolean
  /** 选中的节点 */
  selectedNodes: Set<string>
  /** 选中的连接 */
  selectedLinks: Set<string>
  /** 悬停的节点 */
  hoveredNode: string | null
  /** 悬停的连接 */
  hoveredLink: string | null
  /** 高亮的路径 */
  highlightedPath: string[]
  /** 搜索查询 */
  searchQuery: string
  /** 过滤配置 */
  filterConfig: {
    nodeTypes: Set<string>
    minConnections: number
    maxConnections: number
  }
  /** 统计信息 */
  statistics: {
    nodeCount: number
    linkCount: number
    density: number
    avgDegree: number
    maxDegree: number
    components: number
  }
}

// 布局类型配置
const layoutTypes = [
  { 
    type: 'force' as const, 
    name: '力导向布局', 
    icon: '🌐',
    description: '基于物理模拟的自然布局'
  },
  { 
    type: 'hierarchical' as const, 
    name: '层次布局', 
    icon: '🌳',
    description: '树状层次结构布局'
  },
  { 
    type: 'circular' as const, 
    name: '环形布局', 
    icon: '⭕',
    description: '节点排列成圆形'
  },
  { 
    type: 'grid' as const, 
    name: '网格布局', 
    icon: '⬜',
    description: '规整的网格排列'
  },
  { 
    type: 'radial' as const, 
    name: '径向布局', 
    icon: '☀️',
    description: '以中心节点为核心的径向布局'
  }
]

// 聚类算法配置
const clusteringAlgorithms = [
  { 
    type: 'connectivity' as const, 
    name: '连接度聚类', 
    description: '基于节点连接密度'
  },
  { 
    type: 'community' as const, 
    name: '社区检测', 
    description: '检测紧密连接的社区'
  },
  { 
    type: 'tag' as const, 
    name: '标签聚类', 
    description: '基于节点标签分组'
  },
  { 
    type: 'type' as const, 
    name: '类型聚类', 
    description: '基于节点类型分组'
  }
]

/**
 * 增强版图形可视化组件
 */
export const EnhancedGraphVisualization: React.FC<EnhancedGraphVisualizationProps> = ({
  data,
  width = 1200,
  height = 800,
  visible,
  onClose,
  onNodeClick,
  className = ''
}) => {
  // 状态管理
  const [state, setState] = useState<VisualizationState>({
    layoutType: 'force',
    layoutConfig: {
      type: 'force',
      linkDistance: 50,
      linkStrength: 0.1,
      forceStrength: -300,
      centerStrength: 0.1
    },
    clusteringResult: null,
    showClustering: false,
    showClusteringConfigurator: false,
    showAnalysisPanel: false,
    selectedNodes: new Set(),
    selectedLinks: new Set(),
    hoveredNode: null,
    hoveredLink: null,
    highlightedPath: [],
    searchQuery: '',
    filterConfig: {
      nodeTypes: new Set(),
      minConnections: 0,
      maxConnections: Infinity
    },
    statistics: {
      nodeCount: 0,
      linkCount: 0,
      density: 0,
      avgDegree: 0,
      maxDegree: 0,
      components: 0
    }
  })

  // 计算统计信息
  const calculateStatistics = useCallback((graphData: GraphData) => {
    const nodeCount = graphData.nodes.length
    const linkCount = graphData.links.length
    
    // 计算度数
    const degrees = new Map<string, number>()
    graphData.nodes.forEach(node => degrees.set(node.id, 0))
    
    graphData.links.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id
      const targetId = typeof link.target === 'string' ? link.target : link.target.id
      
      degrees.set(sourceId, (degrees.get(sourceId) || 0) + 1)
      degrees.set(targetId, (degrees.get(targetId) || 0) + 1)
    })
    
    const degreeValues = Array.from(degrees.values())
    const avgDegree = degreeValues.reduce((sum, d) => sum + d, 0) / nodeCount
    const maxDegree = Math.max(...degreeValues)
    
    // 计算密度
    const maxPossibleLinks = nodeCount * (nodeCount - 1) / 2
    const density = maxPossibleLinks > 0 ? linkCount / maxPossibleLinks : 0
    
    // 计算连通分量（简化版）
    const components = calculateConnectedComponents(graphData)
    
    return {
      nodeCount,
      linkCount,
      density,
      avgDegree,
      maxDegree,
      components
    }
  }, [])

  // 计算连通分量
  const calculateConnectedComponents = useCallback((graphData: GraphData): number => {
    const visited = new Set<string>()
    let components = 0
    
    // 构建邻接表
    const adjacency = new Map<string, Set<string>>()
    graphData.nodes.forEach(node => adjacency.set(node.id, new Set()))
    
    graphData.links.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id
      const targetId = typeof link.target === 'string' ? link.target : link.target.id
      
      adjacency.get(sourceId)?.add(targetId)
      adjacency.get(targetId)?.add(sourceId)
    })
    
    // DFS遍历
    const dfs = (nodeId: string) => {
      visited.add(nodeId)
      const neighbors = adjacency.get(nodeId) || new Set()
      
      neighbors.forEach(neighborId => {
        if (!visited.has(neighborId)) {
          dfs(neighborId)
        }
      })
    }
    
    // 计算连通分量
    graphData.nodes.forEach(node => {
      if (!visited.has(node.id)) {
        dfs(node.id)
        components++
      }
    })
    
    return components
  }, [])

  // 更新统计信息
  useEffect(() => {
    const statistics = calculateStatistics(data)
    setState(prev => ({ ...prev, statistics }))
  }, [data, calculateStatistics])

  // 更新布局配置
  const updateLayoutConfig = useCallback((updates: Partial<LayoutConfig>) => {
    setState(prev => ({
      ...prev,
      layoutConfig: { ...prev.layoutConfig, ...updates }
    }))
  }, [])

  // 切换布局类型
  const changeLayoutType = useCallback((layoutType: LayoutConfig['type']) => {
    const defaultConfigs = {
      force: {
        type: 'force' as const,
        linkDistance: 50,
        linkStrength: 0.1,
        forceStrength: -300,
        centerStrength: 0.1
      },
      hierarchical: {
        type: 'hierarchical' as const,
        direction: 'top-down' as const,
        layerSeparation: 100,
        nodeSeparation: 80
      },
      circular: {
        type: 'circular' as const,
        radius: Math.min(width, height) / 3
      },
      grid: {
        type: 'grid' as const,
        columns: Math.ceil(Math.sqrt(data.nodes.length)),
        cellSize: 80
      },
      radial: {
        type: 'radial' as const,
        centerNode: data.nodes[0]?.id,
        radiusStep: 60
      }
    }

    setState(prev => ({
      ...prev,
      layoutType,
      layoutConfig: defaultConfigs[layoutType]
    }))
  }, [width, height, data.nodes])

  // 打开聚类配置器
  const openClusteringConfigurator = useCallback(() => {
    setState(prev => ({ ...prev, showClusteringConfigurator: true }))
  }, [])

  // 关闭聚类配置器
  const closeClusteringConfigurator = useCallback(() => {
    setState(prev => ({ ...prev, showClusteringConfigurator: false }))
  }, [])

  // 打开分析面板
  const openAnalysisPanel = useCallback(() => {
    setState(prev => ({ ...prev, showAnalysisPanel: true }))
  }, [])

  // 关闭分析面板
  const closeAnalysisPanel = useCallback(() => {
    setState(prev => ({ ...prev, showAnalysisPanel: false }))
  }, [])

  // 处理聚类完成
  const handleClusteringComplete = useCallback((result: ClusteringResult) => {
    setState(prev => ({
      ...prev,
      clusteringResult: result,
      showClustering: true,
      showClusteringConfigurator: false
    }))

    // 发送事件到事件总线
    if (appCore.isInitialized()) {
      const eventBus = appCore.getEventBus()
      eventBus?.emit('graph:clustering:completed', {
        clusterCount: result.clusters.length,
        modularity: result.modularity,
        quality: result.quality,
        executionTime: result.executionTime
      }, 'EnhancedGraphVisualization')
    }
  }, [])

  // 处理节点选择
  const handleNodeSelection = useCallback((nodeIds: string[], addToSelection?: boolean) => {
    setState(prev => ({
      ...prev,
      selectedNodes: addToSelection ?
        new Set([...prev.selectedNodes, ...nodeIds]) :
        new Set(nodeIds)
    }))
  }, [])

  // 处理连接选择
  const handleLinkSelection = useCallback((linkIds: string[], addToSelection?: boolean) => {
    setState(prev => ({
      ...prev,
      selectedLinks: addToSelection ?
        new Set([...prev.selectedLinks, ...linkIds]) :
        new Set(linkIds)
    }))
  }, [])

  // 处理节点悬停
  const handleNodeHoverChange = useCallback((nodeId: string | null) => {
    setState(prev => ({ ...prev, hoveredNode: nodeId }))
  }, [])

  // 处理连接悬停
  const handleLinkHoverChange = useCallback((linkId: string | null) => {
    setState(prev => ({ ...prev, hoveredLink: linkId }))
  }, [])

  // 处理节点拖拽
  const handleNodeDragChange = useCallback((nodeId: string, x: number, y: number) => {
    // 发送事件到事件总线
    if (appCore.isInitialized()) {
      const eventBus = appCore.getEventBus()
      eventBus?.emit('graph:node:dragged', {
        nodeId,
        x,
        y
      }, 'EnhancedGraphVisualization')
    }
  }, [])

  // 处理视口变换
  const handleViewportChange = useCallback((transform: { x: number; y: number; k: number }) => {
    // 发送事件到事件总线
    if (appCore.isInitialized()) {
      const eventBus = appCore.getEventBus()
      eventBus?.emit('graph:viewport:changed', transform, 'EnhancedGraphVisualization')
    }
  }, [])

  // 处理右键菜单
  const handleContextMenuChange = useCallback((type: 'node' | 'link' | 'background', id?: string, x?: number, y?: number) => {
    // 发送事件到事件总线
    if (appCore.isInitialized()) {
      const eventBus = appCore.getEventBus()
      eventBus?.emit('graph:context-menu:opened', {
        type,
        id,
        x,
        y
      }, 'EnhancedGraphVisualization')
    }
  }, [])

  // 处理节点选择（从分析面板）
  const handleNodeSelectFromAnalysis = useCallback((nodeId: string) => {
    setState(prev => ({
      ...prev,
      selectedNodes: new Set([nodeId])
    }))

    // 调用外部节点点击回调
    const node = data.nodes.find(n => n.id === nodeId)
    if (node && onNodeClick) {
      onNodeClick(node)
    }
  }, [data.nodes, onNodeClick])

  // 处理路径高亮（从分析面板）
  const handlePathHighlight = useCallback((path: string[]) => {
    setState(prev => ({ ...prev, highlightedPath: path }))

    // 发送事件到事件总线
    if (appCore.isInitialized()) {
      const eventBus = appCore.getEventBus()
      eventBus?.emit('graph:path:highlighted', {
        path,
        pathLength: path.length
      }, 'EnhancedGraphVisualization')
    }
  }, [])

  // 处理节点搜索
  const handleSearch = useCallback((query: string) => {
    setState(prev => ({ ...prev, searchQuery: query }))
  }, [])

  // 过滤后的数据
  const filteredData = useMemo(() => {
    let filteredNodes = data.nodes

    // 搜索过滤
    if (state.searchQuery.trim()) {
      const query = state.searchQuery.toLowerCase()
      filteredNodes = filteredNodes.filter(node => 
        node.label?.toLowerCase().includes(query) ||
        node.id.toLowerCase().includes(query)
      )
    }

    // 类型过滤
    if (state.filterConfig.nodeTypes.size > 0) {
      filteredNodes = filteredNodes.filter(node => 
        state.filterConfig.nodeTypes.has(node.type || 'default')
      )
    }

    // 连接数过滤
    const nodeDegrees = new Map<string, number>()
    data.nodes.forEach(node => nodeDegrees.set(node.id, 0))
    
    data.links.forEach(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id
      const targetId = typeof link.target === 'string' ? link.target : link.target.id
      
      nodeDegrees.set(sourceId, (nodeDegrees.get(sourceId) || 0) + 1)
      nodeDegrees.set(targetId, (nodeDegrees.get(targetId) || 0) + 1)
    })

    filteredNodes = filteredNodes.filter(node => {
      const degree = nodeDegrees.get(node.id) || 0
      return degree >= state.filterConfig.minConnections && 
             degree <= state.filterConfig.maxConnections
    })

    // 过滤相关的连接
    const filteredNodeIds = new Set(filteredNodes.map(n => n.id))
    const filteredLinks = data.links.filter(link => {
      const sourceId = typeof link.source === 'string' ? link.source : link.source.id
      const targetId = typeof link.target === 'string' ? link.target : link.target.id
      
      return filteredNodeIds.has(sourceId) && filteredNodeIds.has(targetId)
    })

    return {
      nodes: filteredNodes,
      links: filteredLinks
    }
  }, [data, state.searchQuery, state.filterConfig])

  if (!visible) return null

  return (
    <div className={`enhanced-graph-visualization ${className}`}>
      {/* 遮罩层 */}
      <div className="graph-visualization-overlay" onClick={onClose} />
      
      {/* 主面板 */}
      <div className="graph-visualization-panel">
        {/* 标题栏 */}
        <div className="visualization-header">
          <h2 className="visualization-title">
            🌐 图形可视化分析
          </h2>
          <button onClick={onClose} className="close-button" title="关闭">
            ✕
          </button>
        </div>

        {/* 工具栏 */}
        <div className="visualization-toolbar">
          {/* 搜索 */}
          <div className="search-section">
            <input
              type="text"
              placeholder="搜索节点..."
              value={state.searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="search-input"
            />
          </div>

          {/* 布局选择 */}
          <div className="layout-section">
            <label className="section-label">布局算法</label>
            <select
              value={state.layoutType}
              onChange={(e) => changeLayoutType(e.target.value as LayoutConfig['type'])}
              className="layout-select"
            >
              {layoutTypes.map(layout => (
                <option key={layout.type} value={layout.type}>
                  {layout.icon} {layout.name}
                </option>
              ))}
            </select>
          </div>

          {/* 聚类分析 */}
          <div className="clustering-section">
            <label className="section-label">聚类分析</label>
            <button
              onClick={openClusteringConfigurator}
              className="clustering-button"
            >
              🎯 高级聚类分析
            </button>
          </div>

          {/* 图形分析 */}
          <div className="analysis-section">
            <label className="section-label">图形分析</label>
            <button
              onClick={openAnalysisPanel}
              className="analysis-button"
            >
              📊 分析面板
            </button>
          </div>

          {/* 显示选项 */}
          <div className="display-section">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={state.showClustering}
                onChange={(e) => setState(prev => ({ ...prev, showClustering: e.target.checked }))}
              />
              显示聚类
            </label>
          </div>
        </div>

        {/* 主要内容区域 */}
        <div className="visualization-content">
          {/* 图形画布 */}
          <div className="graph-canvas-container">
            <EnhancedGraphInteractions
              data={filteredData}
              width={width - 300}
              height={height - 120}
              selectedNodes={state.selectedNodes}
              selectedLinks={state.selectedLinks}
              hoveredNode={state.hoveredNode}
              hoveredLink={state.hoveredLink}
              onNodeSelect={handleNodeSelection}
              onLinkSelect={handleLinkSelection}
              onNodeHover={handleNodeHoverChange}
              onLinkHover={handleLinkHoverChange}
              onNodeDrag={handleNodeDragChange}
              onViewportChange={handleViewportChange}
              onContextMenu={handleContextMenuChange}
            >
              <InteractiveGraphRenderer
                data={filteredData}
                layout={state.layoutConfig}
                selectedNodes={state.selectedNodes}
                selectedLinks={state.selectedLinks}
                hoveredNode={state.hoveredNode}
                hoveredLink={state.hoveredLink}
                highlightedPath={state.highlightedPath}
                onNodeClick={(event, node) => {
                  if (onNodeClick) {
                    onNodeClick(node)
                  }
                }}
                onLinkClick={(event, link) => {
                  // 处理连接点击
                }}
                onNodeHover={handleNodeHoverChange}
                onLinkHover={handleLinkHoverChange}
                onNodeDrag={handleNodeDragChange}
                onContextMenu={(event, target) => {
                  handleContextMenuChange(target.type, target.id)
                }}
              />
            </EnhancedGraphInteractions>
          </div>

          {/* 侧边栏 */}
          <div className="visualization-sidebar">
            {/* 统计信息 */}
            <div className="stats-panel">
              <h3 className="panel-title">📊 图形统计</h3>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">节点数量</span>
                  <span className="stat-value">{state.statistics.nodeCount}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">连接数量</span>
                  <span className="stat-value">{state.statistics.linkCount}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">图密度</span>
                  <span className="stat-value">{(state.statistics.density * 100).toFixed(1)}%</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">平均度数</span>
                  <span className="stat-value">{state.statistics.avgDegree.toFixed(1)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">最大度数</span>
                  <span className="stat-value">{state.statistics.maxDegree}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">连通分量</span>
                  <span className="stat-value">{state.statistics.components}</span>
                </div>
              </div>
            </div>

            {/* 聚类结果 */}
            {state.clusteringResult && (
              <div className="clustering-panel">
                <h3 className="panel-title">🎯 聚类结果</h3>
                <div className="clustering-stats">
                  <div className="clustering-metric">
                    <span className="metric-label">模块度:</span>
                    <span className="metric-value">{state.clusteringResult.modularity.toFixed(3)}</span>
                  </div>
                  <div className="clustering-metric">
                    <span className="metric-label">质量:</span>
                    <span className="metric-value">{(state.clusteringResult.quality * 100).toFixed(1)}%</span>
                  </div>
                  <div className="clustering-metric">
                    <span className="metric-label">执行时间:</span>
                    <span className="metric-value">{state.clusteringResult.executionTime}ms</span>
                  </div>
                </div>
                
                <div className="cluster-list">
                  {state.clusteringResult.clusters.map(cluster => (
                    <div key={cluster.id} className="cluster-item">
                      <div 
                        className="cluster-color"
                        style={{ backgroundColor: cluster.color }}
                      />
                      <div className="cluster-info">
                        <div className="cluster-label">{cluster.label}</div>
                        <div className="cluster-size">{cluster.nodes.length} 个节点</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 聚类配置器 */}
        <AdvancedClusteringConfigurator
          data={filteredData}
          visible={state.showClusteringConfigurator}
          onClose={closeClusteringConfigurator}
          onClusteringComplete={handleClusteringComplete}
        />

        {/* 图形分析面板 */}
        <GraphAnalysisPanel
          data={filteredData}
          visible={state.showAnalysisPanel}
          onClose={closeAnalysisPanel}
          onNodeSelect={handleNodeSelectFromAnalysis}
          onPathHighlight={handlePathHighlight}
        />
      </div>
    </div>
  )
}

export default EnhancedGraphVisualization
