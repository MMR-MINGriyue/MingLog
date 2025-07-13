/**
 * 图谱查看器组件
 * 整合图谱画布、节点和连接线组件，提供完整的图谱可视化功能
 */

import React, { useState, useCallback, useMemo } from 'react'
import { GraphCanvas } from './GraphCanvas'
import { GraphData, GraphNode, GraphLink, GraphConfig, GraphFilter } from '../types'

interface GraphViewerProps {
  /** 图谱数据 */
  data: GraphData
  /** 画布宽度 */
  width?: number
  /** 画布高度 */
  height?: number
  /** 图谱配置 */
  config?: Partial<GraphConfig>
  /** 过滤器 */
  filter?: GraphFilter
  /** 是否加载中 */
  loading?: boolean
  /** 错误信息 */
  error?: string | null
  /** 节点点击回调 */
  onNodeClick?: (node: GraphNode) => void
  /** 节点双击回调 */
  onNodeDoubleClick?: (node: GraphNode) => void
  /** 连接线点击回调 */
  onLinkClick?: (link: GraphLink) => void
  /** 选择变更回调 */
  onSelectionChange?: (selectedNodes: GraphNode[], selectedLinks: GraphLink[]) => void
  /** 类名 */
  className?: string
}

interface ViewerState {
  /** 选中的节点 */
  selectedNodes: Set<string>
  /** 选中的连接线 */
  selectedLinks: Set<string>
  /** 悬停的节点 */
  hoveredNode: string | null
  /** 悬停的连接线 */
  hoveredLink: string | null
  /** 搜索查询 */
  searchQuery: string
}

/**
 * 应用过滤器
 */
const applyFilter = (data: GraphData, filter?: GraphFilter): GraphData => {
  if (!filter) return data

  let filteredNodes = [...data.nodes]
  let filteredLinks = [...data.links]

  // 按类型过滤
  if (filter.nodeTypes && filter.nodeTypes.length > 0) {
    filteredNodes = filteredNodes.filter(node => filter.nodeTypes!.includes(node.type))
  }

  if (filter.linkTypes && filter.linkTypes.length > 0) {
    filteredLinks = filteredLinks.filter(link => filter.linkTypes!.includes(link.type))
  }

  // 按标签过滤
  if (filter.tags && filter.tags.length > 0) {
    filteredNodes = filteredNodes.filter(node => 
      node.tags && node.tags.some(tag => filter.tags!.includes(tag))
    )
  }

  // 按搜索查询过滤
  if (filter.searchQuery) {
    const query = filter.searchQuery.toLowerCase()
    filteredNodes = filteredNodes.filter(node => 
      node.title.toLowerCase().includes(query) ||
      (node.content && node.content.toLowerCase().includes(query)) ||
      (node.tags && node.tags.some(tag => tag.toLowerCase().includes(query)))
    )
  }

  // 过滤连接线，只保留两端节点都存在的连接
  const nodeIds = new Set(filteredNodes.map(node => node.id))
  filteredLinks = filteredLinks.filter(link => {
    const sourceId = typeof link.source === 'string' ? link.source : link.source.id
    const targetId = typeof link.target === 'string' ? link.target : link.target.id
    return nodeIds.has(sourceId) && nodeIds.has(targetId)
  })

  return {
    nodes: filteredNodes,
    links: filteredLinks
  }
}

/**
 * 图谱查看器组件
 */
export const GraphViewer: React.FC<GraphViewerProps> = ({
  data,
  width = 800,
  height = 600,
  config = {},
  filter,
  loading = false,
  error = null,
  onNodeClick,
  onNodeDoubleClick,
  onLinkClick,
  onSelectionChange,
  className = ''
}) => {
  // 状态管理
  const [viewerState, setViewerState] = useState<ViewerState>({
    selectedNodes: new Set(),
    selectedLinks: new Set(),
    hoveredNode: null,
    hoveredLink: null,
    searchQuery: ''
  })

  // 应用过滤器
  const filteredData = useMemo(() => {
    const combinedFilter = {
      ...filter,
      searchQuery: filter?.searchQuery || viewerState.searchQuery || undefined
    }
    return applyFilter(data, combinedFilter)
  }, [data, filter, viewerState.searchQuery])

  /**
   * 处理节点点击
   */
  const handleNodeClick = useCallback((node: GraphNode) => {
    setViewerState(prev => {
      const newSelectedNodes = new Set([node.id])
      const selectedNodes = Array.from(newSelectedNodes).map(id => 
        filteredData.nodes.find(n => n.id === id)!
      )
      const selectedLinks = Array.from(prev.selectedLinks).map(id => 
        filteredData.links.find(l => l.id === id)!
      )
      
      onSelectionChange?.(selectedNodes, selectedLinks)
      
      return {
        ...prev,
        selectedNodes: newSelectedNodes
      }
    })
    
    onNodeClick?.(node)
  }, [filteredData, onNodeClick, onSelectionChange])

  /**
   * 处理节点双击
   */
  const handleNodeDoubleClick = useCallback((node: GraphNode) => {
    onNodeDoubleClick?.(node)
  }, [onNodeDoubleClick])

  /**
   * 处理节点悬停
   */
  const handleNodeHover = useCallback((node: GraphNode | null) => {
    setViewerState(prev => ({
      ...prev,
      hoveredNode: node?.id || null
    }))
  }, [])

  /**
   * 处理连接线点击
   */
  const handleLinkClick = useCallback((link: GraphLink) => {
    setViewerState(prev => {
      const newSelectedLinks = new Set([link.id])
      const selectedNodes = Array.from(prev.selectedNodes).map(id => 
        filteredData.nodes.find(n => n.id === id)!
      )
      const selectedLinks = Array.from(newSelectedLinks).map(id => 
        filteredData.links.find(l => l.id === id)!
      )
      
      onSelectionChange?.(selectedNodes, selectedLinks)
      
      return {
        ...prev,
        selectedLinks: newSelectedLinks
      }
    })
    
    onLinkClick?.(link)
  }, [filteredData, onLinkClick, onSelectionChange])

  /**
   * 处理背景点击
   */
  const handleBackgroundClick = useCallback(() => {
    setViewerState(prev => {
      onSelectionChange?.([], [])
      return {
        ...prev,
        selectedNodes: new Set(),
        selectedLinks: new Set()
      }
    })
  }, [onSelectionChange])

  /**
   * 处理搜索
   */
  const handleSearch = useCallback((query: string) => {
    setViewerState(prev => ({
      ...prev,
      searchQuery: query
    }))
  }, [])

  // 加载状态
  if (loading) {
    return (
      <div 
        className={`graph-viewer loading ${className}`}
        style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div className="loading-spinner">
          <div className="spinner"></div>
          <div className="loading-text">加载图谱中...</div>
        </div>
      </div>
    )
  }

  // 错误状态
  if (error) {
    return (
      <div 
        className={`graph-viewer error ${className}`}
        style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div className="error-message">
          <div className="error-icon">⚠️</div>
          <div className="error-text">{error}</div>
          <button className="retry-button" onClick={() => window.location.reload()}>
            重试
          </button>
        </div>
      </div>
    )
  }

  // 空数据状态
  if (!filteredData.nodes.length) {
    return (
      <div 
        className={`graph-viewer empty ${className}`}
        style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div className="empty-state">
          <div className="empty-icon">🕸️</div>
          <div className="empty-title">暂无图谱数据</div>
          <div className="empty-description">
            {viewerState.searchQuery 
              ? '没有找到匹配的节点，尝试调整搜索条件' 
              : '创建一些笔记和标签来生成知识图谱'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`graph-viewer ${className}`}>
      {/* 搜索栏 */}
      <div className="graph-search">
        <input
          type="text"
          placeholder="搜索节点..."
          value={viewerState.searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="search-input"
        />
        <div className="search-stats">
          显示 {filteredData.nodes.length} 个节点，{filteredData.links.length} 个连接
        </div>
      </div>

      {/* 图谱画布 */}
      <GraphCanvas
        data={filteredData}
        width={width}
        height={height - 60} // 减去搜索栏高度
        config={config}
        onNodeClick={handleNodeClick}
        onNodeDoubleClick={handleNodeDoubleClick}
        onNodeHover={handleNodeHover}
        onLinkClick={handleLinkClick}
        onBackgroundClick={handleBackgroundClick}
        className="graph-canvas"
      />

      {/* 图例 */}
      <div className="graph-legend">
        <div className="legend-title">图例</div>
        <div className="legend-items">
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#4A90E2' }}></div>
            <span>笔记</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#7ED321' }}></div>
            <span>标签</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#F5A623' }}></div>
            <span>文件夹</span>
          </div>
          <div className="legend-item">
            <div className="legend-color" style={{ backgroundColor: '#BD10E0' }}></div>
            <span>链接</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GraphViewer
