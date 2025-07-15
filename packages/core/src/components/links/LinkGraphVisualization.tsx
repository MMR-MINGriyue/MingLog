/**
 * 链接图谱可视化组件
 * 提供交互式的跨模块链接关系可视化
 */

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { cn } from '../../utils'
import { 
  LinkGraph, 
  LinkGraphNode, 
  EnhancedLinkRecord, 
  LinkType,
  EnhancedCrossModuleLinkService 
} from '../../services/EnhancedCrossModuleLinkService'
import { EntityType } from '../../services/DataAssociationService'

export interface LinkGraphVisualizationProps {
  centerEntityId: string
  depth?: number
  width?: number
  height?: number
  className?: string
  onNodeClick?: (node: LinkGraphNode) => void
  onLinkClick?: (link: EnhancedLinkRecord) => void
  onNodeHover?: (node: LinkGraphNode | null) => void
  showLabels?: boolean
  showLinkTypes?: boolean
  enableZoom?: boolean
  enableDrag?: boolean
}

interface GraphPosition {
  x: number
  y: number
}

interface VisualNode extends LinkGraphNode {
  position: GraphPosition
  radius: number
  color: string
  isHovered: boolean
  isSelected: boolean
}

interface VisualLink extends EnhancedLinkRecord {
  sourcePosition: GraphPosition
  targetPosition: GraphPosition
  color: string
  width: number
}

/**
 * 链接图谱可视化组件
 */
export const LinkGraphVisualization: React.FC<LinkGraphVisualizationProps> = ({
  centerEntityId,
  depth = 2,
  width = 800,
  height = 600,
  className = '',
  onNodeClick,
  onLinkClick,
  onNodeHover,
  showLabels = true,
  showLinkTypes = true,
  enableZoom = true,
  enableDrag = true
}) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const [graph, setGraph] = useState<LinkGraph | null>(null)
  const [visualNodes, setVisualNodes] = useState<VisualNode[]>([])
  const [visualLinks, setVisualLinks] = useState<VisualLink[]>([])
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragNode, setDragNode] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })

  // 链接服务实例（应该从依赖注入获取）
  const linkService = new EnhancedCrossModuleLinkService(null as any, null as any, null as any)

  // 加载图谱数据
  useEffect(() => {
    const loadGraph = async () => {
      try {
        const graphData = await linkService.buildLinkGraph(centerEntityId, depth, {
          maxNodes: 50
        })
        setGraph(graphData)
      } catch (error) {
        console.error('Failed to load link graph:', error)
      }
    }

    loadGraph()
  }, [centerEntityId, depth])

  // 处理图谱数据变化
  useEffect(() => {
    if (!graph) return

    // 计算节点位置（使用力导向布局）
    const nodes = calculateNodePositions(graph.nodes, graph.edges, width, height)
    const links = calculateLinkPositions(graph.edges, nodes)

    setVisualNodes(nodes)
    setVisualLinks(links)
  }, [graph, width, height])

  // 获取实体类型颜色
  const getEntityColor = (type: EntityType): string => {
    const colorMap = {
      [EntityType.NOTE]: '#3b82f6',      // 蓝色
      [EntityType.TASK]: '#10b981',      // 绿色
      [EntityType.MINDMAP_NODE]: '#8b5cf6', // 紫色
      [EntityType.GRAPH_NODE]: '#f59e0b',   // 橙色
      [EntityType.FILE]: '#6b7280',      // 灰色
      [EntityType.TAG]: '#ef4444',       // 红色
      [EntityType.PROJECT]: '#06b6d4'    // 青色
    }
    return colorMap[type] || '#6b7280'
  }

  // 获取链接类型颜色
  const getLinkColor = (linkType: LinkType): string => {
    const colorMap = {
      [LinkType.REFERENCE]: '#94a3b8',
      [LinkType.EMBED]: '#3b82f6',
      [LinkType.BIDIRECTIONAL]: '#8b5cf6',
      [LinkType.HIERARCHY]: '#10b981',
      [LinkType.DEPENDENCY]: '#f59e0b',
      [LinkType.SIMILARITY]: '#ef4444',
      [LinkType.TEMPORAL]: '#06b6d4',
      [LinkType.SEMANTIC]: '#8b5cf6'
    }
    return colorMap[linkType] || '#94a3b8'
  }

  // 计算节点位置（简化的力导向布局）
  const calculateNodePositions = (
    nodes: LinkGraphNode[],
    edges: EnhancedLinkRecord[],
    width: number,
    height: number
  ): VisualNode[] => {
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(width, height) / 3

    return nodes.map((node, index) => {
      // 简单的圆形布局
      const angle = (index / nodes.length) * 2 * Math.PI
      const x = centerX + Math.cos(angle) * radius
      const y = centerY + Math.sin(angle) * radius

      return {
        ...node,
        position: { x, y },
        radius: Math.max(20, Math.min(40, node.importance * 30)),
        color: getEntityColor(node.entity.type),
        isHovered: hoveredNode === node.id,
        isSelected: selectedNode === node.id
      }
    })
  }

  // 计算链接位置
  const calculateLinkPositions = (
    edges: EnhancedLinkRecord[],
    nodes: VisualNode[]
  ): VisualLink[] => {
    const nodeMap = new Map(nodes.map(node => [node.id, node]))

    return edges.map(edge => {
      const sourceNode = nodeMap.get(edge.sourceId)
      const targetNode = nodeMap.get(edge.targetId)

      if (!sourceNode || !targetNode) {
        return {
          ...edge,
          sourcePosition: { x: 0, y: 0 },
          targetPosition: { x: 0, y: 0 },
          color: '#94a3b8',
          width: 1
        }
      }

      return {
        ...edge,
        sourcePosition: sourceNode.position,
        targetPosition: targetNode.position,
        color: getLinkColor(edge.linkType),
        width: Math.max(1, edge.strength * 3)
      }
    })
  }

  // 处理节点点击
  const handleNodeClick = useCallback((node: VisualNode, event: React.MouseEvent) => {
    event.stopPropagation()
    setSelectedNode(node.id)
    onNodeClick?.(node)
  }, [onNodeClick])

  // 处理节点悬停
  const handleNodeHover = useCallback((node: VisualNode | null) => {
    setHoveredNode(node?.id || null)
    onNodeHover?.(node)
  }, [onNodeHover])

  // 处理链接点击
  const handleLinkClick = useCallback((link: VisualLink, event: React.MouseEvent) => {
    event.stopPropagation()
    onLinkClick?.(link)
  }, [onLinkClick])

  // 处理拖拽
  const handleMouseDown = useCallback((node: VisualNode, event: React.MouseEvent) => {
    if (!enableDrag) return
    
    event.preventDefault()
    setIsDragging(true)
    setDragNode(node.id)
  }, [enableDrag])

  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!isDragging || !dragNode) return

    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    setVisualNodes(prev => prev.map(node => 
      node.id === dragNode 
        ? { ...node, position: { x, y } }
        : node
    ))
  }, [isDragging, dragNode])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDragNode(null)
  }, [])

  // 渲染节点
  const renderNode = (node: VisualNode) => (
    <g key={node.id}>
      {/* 节点圆圈 */}
      <circle
        cx={node.position.x}
        cy={node.position.y}
        r={node.radius}
        fill={node.color}
        stroke={node.isSelected ? '#1f2937' : node.isHovered ? '#374151' : 'transparent'}
        strokeWidth={node.isSelected ? 3 : node.isHovered ? 2 : 0}
        className="cursor-pointer transition-all duration-200"
        onClick={(e) => handleNodeClick(node, e)}
        onMouseEnter={() => handleNodeHover(node)}
        onMouseLeave={() => handleNodeHover(null)}
        onMouseDown={(e) => handleMouseDown(node, e)}
      />
      
      {/* 节点标签 */}
      {showLabels && (
        <text
          x={node.position.x}
          y={node.position.y + node.radius + 15}
          textAnchor="middle"
          className="text-xs fill-gray-700 pointer-events-none"
          style={{ fontSize: '12px' }}
        >
          {node.entity.title.length > 15 
            ? `${node.entity.title.substring(0, 15)}...` 
            : node.entity.title}
        </text>
      )}
      
      {/* 实体类型图标 */}
      <text
        x={node.position.x}
        y={node.position.y + 4}
        textAnchor="middle"
        className="text-sm fill-white pointer-events-none"
        style={{ fontSize: '14px' }}
      >
        {getEntityIcon(node.entity.type)}
      </text>
    </g>
  )

  // 渲染链接
  const renderLink = (link: VisualLink) => (
    <g key={link.id}>
      <line
        x1={link.sourcePosition.x}
        y1={link.sourcePosition.y}
        x2={link.targetPosition.x}
        y2={link.targetPosition.y}
        stroke={link.color}
        strokeWidth={link.width}
        className="cursor-pointer"
        onClick={(e) => handleLinkClick(link, e)}
      />
      
      {/* 链接类型标签 */}
      {showLinkTypes && (
        <text
          x={(link.sourcePosition.x + link.targetPosition.x) / 2}
          y={(link.sourcePosition.y + link.targetPosition.y) / 2}
          textAnchor="middle"
          className="text-xs fill-gray-600 pointer-events-none"
          style={{ fontSize: '10px' }}
        >
          {link.linkType}
        </text>
      )}
    </g>
  )

  // 获取实体图标
  const getEntityIcon = (type: EntityType): string => {
    const iconMap = {
      [EntityType.NOTE]: '📝',
      [EntityType.TASK]: '✅',
      [EntityType.MINDMAP_NODE]: '🧠',
      [EntityType.GRAPH_NODE]: '🔗',
      [EntityType.FILE]: '📁',
      [EntityType.TAG]: '🏷️',
      [EntityType.PROJECT]: '📋'
    }
    return iconMap[type] || '📄'
  }

  if (!graph) {
    return (
      <div className={cn('flex items-center justify-center', className)} style={{ width, height }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">加载链接图谱...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('relative border border-gray-200 rounded-lg overflow-hidden', className)}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="bg-white"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* 渲染链接 */}
        <g className="links">
          {visualLinks.map(renderLink)}
        </g>
        
        {/* 渲染节点 */}
        <g className="nodes">
          {visualNodes.map(renderNode)}
        </g>
      </svg>
      
      {/* 图谱信息面板 */}
      <div className="absolute top-4 left-4 bg-white bg-opacity-90 rounded-lg p-3 shadow-lg">
        <div className="text-sm text-gray-700">
          <div>节点: {graph.metadata.totalNodes}</div>
          <div>链接: {graph.metadata.totalEdges}</div>
          <div>密度: {(graph.metadata.density * 100).toFixed(1)}%</div>
        </div>
      </div>
      
      {/* 控制面板 */}
      {enableZoom && (
        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
          <button
            onClick={() => setZoom(prev => Math.min(prev * 1.2, 3))}
            className="px-3 py-1 bg-white bg-opacity-90 rounded shadow text-sm hover:bg-gray-50"
          >
            放大
          </button>
          <button
            onClick={() => setZoom(prev => Math.max(prev / 1.2, 0.3))}
            className="px-3 py-1 bg-white bg-opacity-90 rounded shadow text-sm hover:bg-gray-50"
          >
            缩小
          </button>
          <button
            onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }}
            className="px-3 py-1 bg-white bg-opacity-90 rounded shadow text-sm hover:bg-gray-50"
          >
            重置
          </button>
        </div>
      )}
    </div>
  )
}

export default LinkGraphVisualization
